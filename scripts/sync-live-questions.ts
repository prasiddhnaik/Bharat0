import { mkdir, writeFile } from 'node:fs/promises';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { latestQuestionSessions, uniqueQuestions, type RajyaSabhaQuestion } from '../src/lib/ingestion/rajya-sabha-questions';
import { AnswerStatus, House } from '../src/generated/prisma/enums';
import { fetchJson, sameFields, runCli } from './lib/refresh';

export async function syncLiveQuestions(dryRun = false) {
	const sessions = latestQuestionSessions(await fetchJson<Array<{ ssn_no: number }>>('https://rsdoc.nic.in/question/Get_sessionforQuestionSearch'));
	const snapshots = [];
	for (const session of sessions) {
		const rows = await fetchJson<RajyaSabhaQuestion[]>(`https://rsdoc.nic.in/Question/Search_Questions?whereclause=ses_no=${session}`);
		if (!Array.isArray(rows) || rows.some((row) => row.ses_no !== session)) throw new Error(`Wrong question session returned for ${session}`);
		snapshots.push({ session, rows, questions: uniqueQuestions(rows) });
	}
	const questions = snapshots.flatMap((snapshot) => snapshot.questions);
	const checkedAt = new Date().toISOString();
	const dir = `artifacts/data-refresh-${checkedAt.slice(0, 10)}`;
	await mkdir(dir, { recursive: true });
	await writeFile(`${dir}/questions-snapshot.json`, JSON.stringify({ checkedAt, snapshots }, null, 2));
	const db = createPrismaClient();
	try {
		const existing = await db.question.findMany({ where: { id: { in: questions.map((row) => row.id) } } });
		const byId = new Map(existing.map((row) => [row.id, row]));
		const plans = questions.map((row) => {
			const fields = { id: row.id, number: row.number, house: House.RAJYA_SABHA, date: new Date(`${row.date}T00:00:00+05:30`), ministry: row.ministry, subject: row.subject, answer_status: AnswerStatus[row.answer_status.toUpperCase() as keyof typeof AnswerStatus], source_url: row.source_url, is_demo_seed: false };
			const prior = byId.get(row.id);
			return { fields, prior, changed: !prior || !sameFields(prior, fields) };
		});
		const summary = { checkedAt, coverage: `Rajya Sabha individual questions, sessions ${sessions.join(' and ')}`, sessions, sourceUrl: 'https://sansad.in/rs/questions/questions-and-answers', sourceRows: questions.length, inserted: plans.filter((row) => !row.prior).length, updated: plans.filter((row) => row.prior && row.changed).length, latestActivityDate: questions.map((row) => row.date).sort().at(-1)! };
		if (dryRun) return summary;
		await writeFile(`${dir}/questions-backup-${Date.now()}.json`, JSON.stringify(existing, null, 2));
		await db.$transaction(async (tx) => {
			for (let offset = 0; offset < plans.length; offset += 500) await tx.question.createMany({ data: plans.slice(offset, offset + 500).filter((row) => !row.prior).map((row) => row.fields), skipDuplicates: true });
			for (const row of plans) if (row.prior && row.changed) await tx.question.update({ where: { id: row.fields.id }, data: row.fields });
		}, { timeout: 180_000 });
		return summary;
	} finally { await db.$disconnect(); }
}
runCli(import.meta.url, async () => console.log(JSON.stringify(await syncLiveQuestions(process.argv.includes('--dry-run')), null, 2)));
