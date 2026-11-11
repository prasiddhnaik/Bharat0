import { House, AnswerStatus } from '../src/generated/prisma/enums';
import { mkdir, writeFile } from 'node:fs/promises';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { toIsoDate } from '../src/lib/ingestion/sansad-bills';
import { fetchOgdSnapshot, validateOgdSnapshot } from '../src/lib/ingestion/ogd-catalogs';
import { fetchJson, sameFields, runCli } from './lib/refresh';

export async function syncLiveCatalogs(dryRun = false) {
	const endpoint = process.env.OGD_CATALOG_ENDPOINT;
	const { results, checkedAt, discovery } = endpoint
		? validateOgdSnapshot(await fetchJson(endpoint))
		: await fetchOgdSnapshot();
	const dir = `artifacts/data-refresh-${checkedAt.slice(0, 10)}`;
	await mkdir(dir, { recursive: true });
	await writeFile(`${dir}/catalogs-snapshot.json`, JSON.stringify({ checkedAt, discovery, results }, null, 2));
	const catalogs = results.map((result) => {
		const metadata = result.metadata?.dataGovCatalog;
		const date = toIsoDate(metadata?.updatedDate);
		if (!result.ok || !metadata || !date || !result.finalUrl) throw new Error(`OGD catalog validation failed for ${result.id}; previous catalogs retained`);
		return { result, date: new Date(`${date}T00:00:00+05:30`), sourceNote: `${metadata.catalogApiAvailable ? 'API available' : 'API unavailable'}; ${metadata.zipDownloadAvailable ? 'ZIP metadata advertised' : 'ZIP unavailable'}` };
	});
	const questions = catalogs.filter(({ result }) => result.outputs.includes('questions')).map(({ result, date }) => ({ id: `${result.id}-catalog`, number: `Session ${/session-(\d+)/.exec(result.id)![1]}`, house: House.RAJYA_SABHA, date, ministry: 'Rajya Sabha Secretariat', subject: result.name, answer_status: AnswerStatus.ANSWERED, source_url: result.finalUrl!, is_demo_seed: false }));
	const debates = catalogs.filter(({ result }) => result.outputs.includes('debates')).map(({ result, date, sourceNote }) => ({ id: `${result.id}-catalog`, house: result.id.includes('ls-') ? House.LOK_SABHA : House.RAJYA_SABHA, date, title: result.title?.replace(' | Open Government Data (OGD) Platform India', '') ?? result.name, summary: `Open Government Data Platform India catalog for ${result.id.includes('ls-') ? 'Lok Sabha' : 'Rajya Sabha'} verbatim debate feeds. Metadata status: ${sourceNote}.`, source_url: result.finalUrl!, transcript_language: 'English', members: [], debate_type: 'Verbatim debates catalog', is_demo_seed: false }));
	const db = createPrismaClient();
	try {
		const [oldQuestions, oldDebates] = await Promise.all([db.question.findMany({ where: { id: { in: questions.map((row) => row.id) } } }), db.debate.findMany({ where: { id: { in: debates.map((row) => row.id) } } })]);
		const questionPlans = questions.map((row) => ({ row, old: oldQuestions.find((old) => old.id === row.id) }));
		const debatePlans = debates.map((row) => ({ row, old: oldDebates.find((old) => old.id === row.id) }));
		const plans = [...questionPlans, ...debatePlans];
		const summary = { checkedAt, coverage: `${questions.length} OGD question catalogs and ${debates.length} debate catalogs; discovered weekly; metadata only`, sourceUrl: 'https://data.gov.in/', sourceRows: catalogs.length, discoveryGroups: discovery.length, indexedCatalogs: discovery.reduce((total, index) => total + index.total, 0), inserted: plans.filter(({ old }) => !old).length, updated: plans.filter(({ row, old }) => old && !sameFields(old, row)).length, latestActivityDate: catalogs.map(({ date }) => new Date(date.getTime() + 19_800_000).toISOString().slice(0, 10)).sort().at(-1)! };
		if (dryRun) return summary;
		await writeFile(`${dir}/catalogs-backup-${Date.now()}.json`, JSON.stringify({ questions: oldQuestions, debates: oldDebates }, null, 2));
		await db.$transaction(async (tx) => {
			for (const { row, old } of questionPlans) if (!old || !sameFields(old, row)) await tx.question.upsert({ where: { id: row.id }, create: row, update: row });
			for (const { row, old } of debatePlans) if (!old || !sameFields(old, row)) await tx.debate.upsert({ where: { id: row.id }, create: row, update: row });
		}, { timeout: 60_000 });
		return summary;
	} finally { await db.$disconnect(); }
}
runCli(import.meta.url, () => syncLiveCatalogs(process.argv.includes('--dry-run')));
