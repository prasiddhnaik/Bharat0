import {
	pdlPre2004BillActions,
	pdlPre2004Bills,
	pdlPre2004SittingDays,
	pdlPre2004TimelineEvents
} from '../src/lib/data/generated/pdl-pre2004-legislation';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { assertEnv, safeDbUrl } from './lib/envCheck';
import { parseFlags } from './lib/flags';
import { makeLogger } from './lib/logger';
import { chunkInsert, formatCountMap, guardNonEmpty, sumCounts } from './lib/upsertHelpers';

const log = makeLogger('PDL');
const flags = parseFlags(['dry-run', 'allow-empty']);
assertEnv(['DATABASE_URL'], log);

const prisma = createPrismaClient();
const date = (value: string) => new Date(`${value}T00:00:00+05:30`);

function toPrismaEnum(value: string): string {
	return value.replaceAll('-', '_').toUpperCase();
}

const billRows = pdlPre2004Bills.map((bill) => ({
	id: bill.id,
	title_en: bill.title_en,
	title_hi: bill.title_hi,
	bill_number: bill.bill_number,
	bill_year: bill.bill_year,
	bill_type: toPrismaEnum(bill.bill_type),
	origin_house: toPrismaEnum(bill.origin_house),
	current_stage: toPrismaEnum(bill.current_stage),
	ministry: bill.ministry,
	introduced_on: date(bill.introduced_on),
	latest_action_date: date(bill.latest_action_date),
	source_url: bill.source_url,
	summary: bill.summary,
	is_demo_seed: bill.isDemoSeed
}));

const actionRows = pdlPre2004BillActions.map((action) => ({
	id: action.id,
	bill_id: action.bill_id,
	date: date(action.date),
	house: toPrismaEnum(action.house),
	action_type: action.action_type,
	description: action.description,
	source_url: action.source_url,
	is_demo_seed: action.isDemoSeed
}));

const sittingDayRows = pdlPre2004SittingDays.map((sittingDay) => ({
	id: sittingDay.id,
	date: date(sittingDay.date),
	house: toPrismaEnum(sittingDay.house),
	session_name: sittingDay.session_name,
	status: toPrismaEnum(sittingDay.status),
	is_demo_seed: sittingDay.isDemoSeed
}));

const timelineRows = pdlPre2004TimelineEvents.map((event) => ({
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
	guardNonEmpty('PDL pre-2004 bills', billRows.length, flags['allow-empty'], log);

	const sourceCounts = {
		bills: billRows.length,
		actions: actionRows.length,
		sittingDays: sittingDayRows.length,
		timelineEvents: timelineRows.length
	};
	const existingCounts = {
		bills: await prisma.bill.count({ where: { id: { startsWith: 'pdl-' } } }),
		actions: await prisma.billAction.count({ where: { id: { startsWith: 'pdl-' } } }),
		sittingDays: await prisma.sittingDay.count({ where: { id: { startsWith: 'pdl-' } } }),
		timelineEvents: await prisma.timelineEvent.count({ where: { id: { startsWith: 'pdl-' } } })
	};

	log.info(`source records:   ${formatCountMap(sourceCounts)}`);
	log.info(`existing rows:    ${formatCountMap(existingCounts)}`);

	if (flags['dry-run']) {
		log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (tables: Bill, BillAction, SittingDay, TimelineEvent)`);
		log.info('dry-run; no changes made.');
		return;
	}

	const insertedCounts = await prisma.$transaction(
		async (tx) => {
			await tx.timelineEvent.deleteMany({ where: { id: { startsWith: 'pdl-' } } });
			await tx.billAction.deleteMany({ where: { id: { startsWith: 'pdl-' } } });
			await tx.bill.deleteMany({ where: { id: { startsWith: 'pdl-' } } });
			await tx.sittingDay.deleteMany({ where: { id: { startsWith: 'pdl-' } } });

			return {
				bills: await chunkInsert(billRows, 500, (chunk) => tx.bill.createMany({ data: chunk, skipDuplicates: true })),
				actions: await chunkInsert(actionRows, 500, (chunk) => tx.billAction.createMany({ data: chunk, skipDuplicates: true })),
				sittingDays: await chunkInsert(sittingDayRows, 500, (chunk) => tx.sittingDay.createMany({ data: chunk, skipDuplicates: true })),
				timelineEvents: await chunkInsert(timelineRows, 500, (chunk) => tx.timelineEvent.createMany({ data: chunk, skipDuplicates: true }))
			};
		},
		{ timeout: 60_000 }
	);

	log.info(`inserted rows:    ${formatCountMap(insertedCounts)} (total=${sumCounts(insertedCounts).toLocaleString('en-IN')})`);
	log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (tables: Bill, BillAction, SittingDay, TimelineEvent)`);
	log.info('PDL pre-2004 historical legislation upsert complete.');
}

main()
	.catch((error) => {
		log.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
