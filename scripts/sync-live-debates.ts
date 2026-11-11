import { House, TimelineEventType } from '../src/generated/prisma/enums';
import { mkdir, writeFile } from 'node:fs/promises';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { normalizeParliamentDebate, type ParliamentDebateItem } from '../src/lib/ingestion/sansad-debates';

import { fetchJson, sameFields, runCli } from './lib/refresh';
const artifactDir = `artifacts/data-refresh-${new Date().toISOString().slice(0, 10)}`;
type SearchResult = { page: { number: number; totalPages: number; totalElements: number }; _embedded?: { objects: Array<{ _embedded: { indexableObject: ParliamentDebateItem } }> } };
const titleKey = (title: string) => title.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '');

export async function syncLiveDebates(dryRun = false) {
	const items: ParliamentDebateItem[] = [];
	let total = 0;
	for (let page = 0; page < 100; page++) {
		const url = new URL('https://elibrary.sansad.in/server/api/discover/search/objects');
		url.search = new URLSearchParams({ 'f.debateType': 'GOVERNMENT BILLS,equals', 'f.loksabhanumber': '18,equals', sort: 'dc.date.issued,DESC', page: String(page), size: '100', locale: 'en' }).toString();
		const payload = await fetchJson<{ _embedded?: { searchResult: SearchResult } }>(url.href);
		const result = payload._embedded?.searchResult;
		if (!result || result.page.number !== page) throw new Error('Invalid Parliament debate page');
		const rows = result._embedded?.objects.map((row) => row._embedded.indexableObject) ?? [];
		if (!rows.length || rows.some((row) => items.some((item) => item.id === row.id))) throw new Error('Empty or repeated Parliament debate page');
		items.push(...rows);
		total = result.page.totalElements;
		if (page + 1 >= result.page.totalPages) break;
	}
	if (items.length !== total) throw new Error(`Incomplete Parliament debate index: ${items.length}/${total}`);
	const debates = items.map(normalizeParliamentDebate);
	const checkedAt = new Date().toISOString();
	await mkdir(artifactDir, { recursive: true });
	await writeFile(`${artifactDir}/debates-snapshot.json`, JSON.stringify({ checkedAt, items }, null, 2));
	const db = createPrismaClient();
	try {
		const [existing, bills] = await Promise.all([db.debate.findMany(), db.bill.findMany({ select: { id: true, title_en: true, introduced_on: true } })]);
		const plans = debates.map((debate) => {
			const handle = new URL(debate.source_url).pathname;
			const sameProceeding = existing.filter((row) => row.house === 'LOK_SABHA' && new Date(row.date.getTime() + 19_800_000).toISOString().slice(0, 10) === debate.date && titleKey(row.title) === titleKey(debate.title));
			const prior = sameProceeding.find((row) => row.transcript_url) ?? existing.find((row) => new URL(row.source_url).pathname === handle) ?? sameProceeding[0];
			const matches = bills.filter((bill) => titleKey(debate.title).startsWith(titleKey(bill.title_en)) && bill.introduced_on <= new Date(`${debate.date}T23:59:59+05:30`));
			const relatedBillId = matches.length === 1 ? matches[0].id : prior?.related_bill_id ?? null;
			const fields = { id: prior?.id ?? debate.id, title: debate.title, date: new Date(`${debate.date}T00:00:00+05:30`), house: House.LOK_SABHA, source_url: debate.source_url, members: debate.members, lok_sabha_number: debate.lok_sabha_number, session_number: debate.session_number, debate_type: debate.debate_type, related_bill_id: relatedBillId, is_demo_seed: false };
			return { debate, prior, fields, changed: !prior || !sameFields(prior, fields) };
		});
		const summary = { checkedAt, sourceUrl: 'https://sansad.in/ls/knowledge-centre/government-bills', coverage: '18th Lok Sabha government bill proceedings index', sourceRows: plans.length, inserted: plans.filter((plan) => !plan.prior).length, updated: plans.filter((plan) => plan.prior && plan.changed).length, latestActivityDate: debates.map((row) => row.date).sort().at(-1) };
		console.log(JSON.stringify({ dryRun, ...summary }, null, 2));
		if (dryRun) return summary;
		await writeFile(`${artifactDir}/debates-backup-${Date.now()}.json`, JSON.stringify(existing, null, 2));
		const eventRows = plans.map(({ debate, fields }) => ({ id: `${fields.id}-indexed`, date: fields.date, house: House.LOK_SABHA, type: TimelineEventType.DEBATE_PUBLISHED, title: debate.title, description: debate.summary, source_url: debate.source_url, related_bill_id: fields.related_bill_id, is_demo_seed: false }));
		const events = await db.timelineEvent.findMany({ where: { id: { in: eventRows.map((row) => row.id) } } });
		await db.$transaction(async (tx) => {
			await tx.debate.createMany({ data: plans.filter((plan) => !plan.prior).map(({ debate, fields }) => ({ ...fields, summary: debate.summary, transcript_language: debate.transcript_language })), skipDuplicates: true });
			for (const { prior, fields, changed } of plans) if (prior && changed) await tx.debate.update({ where: { id: fields.id }, data: fields });
			await tx.timelineEvent.createMany({ data: eventRows, skipDuplicates: true });
			for (const row of eventRows) {
				const prior = events.find((event) => event.id === row.id);
				if (prior && !sameFields(prior, row)) await tx.timelineEvent.update({ where: { id: row.id }, data: row });
			}
		}, { timeout: 180_000 });
		await writeFile('src/lib/data/generated/debate-refresh.json', JSON.stringify(summary, null, 2) + '\n');
		console.log('Parliament debate index refreshed; existing transcripts and analysis retained.');
		return summary;
	} finally { await db.$disconnect(); }
}
runCli(import.meta.url, () => syncLiveDebates(process.argv.includes('--dry-run')));
