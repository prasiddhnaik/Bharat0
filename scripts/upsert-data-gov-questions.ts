import {
	dataGovQuestions,
	dataGovTimelineEvents
} from '../src/lib/data/generated/data-gov-questions';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { assertEnv, safeDbUrl } from './lib/envCheck';
import { parseFlags } from './lib/flags';
import { makeLogger } from './lib/logger';
import { formatCountMap, guardNonEmpty, sumCounts } from './lib/upsertHelpers';
import { mkdir, writeFile } from 'node:fs/promises';

const log = makeLogger('DATA-GOV');
const flags = parseFlags(['dry-run', 'allow-empty']);
assertEnv(['DATABASE_URL'], log);

const prisma = createPrismaClient();
const date = (value: string) => new Date(`${value}T00:00:00+05:30`);

function toPrismaEnum(value: string): string {
	return value.replaceAll('-', '_').toUpperCase();
}

const questionRows = dataGovQuestions.map((question) => ({
	id: question.id,
	number: question.number,
	house: toPrismaEnum(question.house),
	date: date(question.date),
	ministry: question.ministry,
	subject: question.subject,
	answer_status: toPrismaEnum(question.answer_status),
	source_url: question.source_url,
	is_demo_seed: question.isDemoSeed
}));

const timelineRows = dataGovTimelineEvents.map((event) => ({
	id: event.id,
	date: date(event.date),
	house: toPrismaEnum(event.house),
	type: toPrismaEnum(event.type),
	title: event.title,
	description: event.description,
	related_bill_id: event.related_bill_id,
	source_url: event.source_url,
	is_demo_seed: event.isDemoSeed
}));

async function main() {
	guardNonEmpty('data.gov question catalog rows', questionRows.length, flags['allow-empty'], log);

	const sourceCounts = {
		questions: questionRows.length,
		timelineEvents: timelineRows.length
	};
	const existingCounts = {
		questions: await prisma.question.count({ where: { id: { startsWith: 'data-gov-' } } }),
		timelineEvents: await prisma.timelineEvent.count({ where: { id: { startsWith: 'data-gov-' } } })
	};

	log.info(`source records:   ${formatCountMap(sourceCounts)}`);
	log.info(`existing rows:    ${formatCountMap(existingCounts)}`);

	if (flags['dry-run']) {
		log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (tables: Question, TimelineEvent)`);
		log.info('dry-run; no changes made.');
		return;
	}

	const backupDir = `artifacts/data-refresh-${new Date().toISOString().slice(0, 10)}`;
	await mkdir(backupDir, { recursive: true });
	const [questions, timelineEvents] = await Promise.all([
		prisma.question.findMany({ where: { id: { startsWith: 'data-gov-' } } }),
		prisma.timelineEvent.findMany({ where: { id: { startsWith: 'data-gov-' } } })
	]);
	await writeFile(`${backupDir}/ogd-backup-${Date.now()}.json`, JSON.stringify({ questions, timelineEvents }, null, 2));
	const insertedCounts = await prisma.$transaction(
		async (tx) => {
			for (const row of questionRows) await tx.question.upsert({ where: { id: row.id }, create: row, update: row });
			for (const row of timelineRows) await tx.timelineEvent.upsert({ where: { id: row.id }, create: row, update: row });
			return sourceCounts;
		},
		{ timeout: 60_000 }
	);

	log.info(`inserted rows:    ${formatCountMap(insertedCounts)} (total=${sumCounts(insertedCounts).toLocaleString('en-IN')})`);
	log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (tables: Question, TimelineEvent)`);
	log.info('OGD question catalog upsert complete.');
}

main()
	.catch((error) => {
		log.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
