import type { Question } from '../domain/types';

export type RajyaSabhaQuestion = { qslno: number; ses_no: number; qno: number; qtitle: string; min_name: string; adate: string; status: string; files: string | null };

export function latestQuestionSessions(rows: Array<{ ssn_no: number }>) {
	if (!Array.isArray(rows) || !rows.length || rows.some((row) => !Number.isInteger(row.ssn_no) || row.ssn_no < 1 || row.ssn_no > 999)) throw new Error('Invalid official question session list');
	return [...new Set(rows.map((row) => row.ssn_no))].sort((a, b) => b - a).slice(0, 2);
}

export function normalizeRajyaSabhaQuestion(row: RajyaSabhaQuestion): Question {
	const date = row.adate?.slice(0, 10);
	const parsed = new Date(`${date}T12:00:00Z`);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error('Invalid question answer date');
	if (!Number.isInteger(row.qslno) || !Number.isInteger(row.ses_no) || !Number.isInteger(row.qno) || !row.qtitle?.trim() || !row.min_name?.trim()) throw new Error('Invalid official question identity');
	const source = row.files ? new URL(row.files) : new URL('https://sansad.in/rs/questions/questions-and-answers');
	if (source.protocol !== 'https:' || !['sansad.in', 'rsdoc.nic.in'].includes(source.hostname)) throw new Error('Invalid official question source');
	const status = row.status?.trim().toLowerCase();
	if (!['answered', 'listed', 'deferred'].includes(status)) throw new Error(`Unrecognized question answer status: ${status}`);
	return { id: `rs-question-${row.ses_no}-${row.qslno}`, number: String(row.qno), house: 'rajya-sabha', date, ministry: row.min_name.trim(), subject: row.qtitle.trim(), answer_status: status as Question['answer_status'], source_url: source.href, isDemoSeed: false };
}

export function uniqueQuestions(rows: RajyaSabhaQuestion[]) {
	if (!Array.isArray(rows) || !rows.length) throw new Error('Empty official question response');
	const unique = new Map<string, Question>();
	for (const row of rows) {
		const question = normalizeRajyaSabhaQuestion(row);
		const previous = unique.get(question.id);
		if (previous && JSON.stringify(previous) !== JSON.stringify(question)) throw new Error(`Conflicting question identity: ${question.id}`);
		unique.set(question.id, question);
	}
	return [...unique.values()];
}
