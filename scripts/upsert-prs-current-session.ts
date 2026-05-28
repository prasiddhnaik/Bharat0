import {
	prsCurrentSessionBillActions,
	prsCurrentSessionBills,
	prsCurrentSessionSittingDays,
	prsCurrentSessionTimelineEvents
} from '../src/lib/data/generated/prs-current-session-legislation';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { assertEnv, safeDbUrl } from './lib/envCheck';
import { parseFlags } from './lib/flags';
import { makeLogger } from './lib/logger';
import { formatCountMap, guardNonEmpty, sumCounts } from './lib/upsertHelpers';

const log = makeLogger('PRS-CURRENT');
const flags = parseFlags(['dry-run', 'allow-empty']);
assertEnv(['DATABASE_URL'], log);

const prisma = createPrismaClient();
const date = (value: string) => new Date(`${value}T00:00:00+05:30`);

function toPrismaEnum(value: string): string {
	return value.replaceAll('-', '_').toUpperCase();
}

const billRows = prsCurrentSessionBills.map((bill) => ({
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
const domainBillById = new Map(prsCurrentSessionBills.map((bill) => [bill.id, bill]));

const actionRows = prsCurrentSessionBillActions.map((action) => ({
	id: action.id,
	bill_id: action.bill_id,
	date: date(action.date),
	house: toPrismaEnum(action.house),
	action_type: action.action_type,
	description: action.description,
	source_url: action.source_url,
	is_demo_seed: action.isDemoSeed
}));

const sittingDayRows = prsCurrentSessionSittingDays.map((sittingDay) => ({
	id: sittingDay.id,
	date: date(sittingDay.date),
	house: toPrismaEnum(sittingDay.house),
	session_name: sittingDay.session_name,
	status: toPrismaEnum(sittingDay.status),
	is_demo_seed: sittingDay.isDemoSeed
}));

const timelineRows = prsCurrentSessionTimelineEvents.map((event) => ({
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
	guardNonEmpty('PRS current-session bills', billRows.length, flags['allow-empty'], log);

	const ids = billRows.map((bill) => bill.id);
	const existingBills = await prisma.bill.findMany({
		where: { id: { in: ids } },
		select: { id: true, current_stage: true, latest_action_date: true, source_url: true }
	});
	const existingActions = await prisma.billAction.count({ where: { id: { in: actionRows.map((action) => action.id) } } });
	const existingTimelineEvents = await prisma.timelineEvent.count({ where: { id: { in: timelineRows.map((event) => event.id) } } });
	const obsoleteActionWhere = {
		bill_id: { in: ids },
		source_url: prsCurrentSessionBills[0]?.source_url,
		id: { notIn: actionRows.map((action) => action.id) }
	};
	const obsoleteTimelineWhere = {
		related_bill_id: { in: ids },
		source_url: prsCurrentSessionBills[0]?.source_url,
		id: { notIn: timelineRows.map((event) => event.id) }
	};

	const sourceCounts = {
		bills: billRows.length,
		actions: actionRows.length,
		sittingDays: sittingDayRows.length,
		timelineEvents: timelineRows.length
	};
	const existingCounts = {
		bills: existingBills.length,
		actions: existingActions,
		sittingDays: await prisma.sittingDay.count({ where: { id: { in: sittingDayRows.map((sittingDay) => sittingDay.id) } } }),
		timelineEvents: existingTimelineEvents
	};
	const obsoleteCounts = {
		actions: await prisma.billAction.count({ where: obsoleteActionWhere }),
		timelineEvents: await prisma.timelineEvent.count({ where: obsoleteTimelineWhere })
	};

	log.info(`source records:   ${formatCountMap(sourceCounts)}`);
	log.info(`existing rows:    ${formatCountMap(existingCounts)}`);
	if (obsoleteCounts.actions || obsoleteCounts.timelineEvents) {
		log.info(`obsolete rows:    ${formatCountMap(obsoleteCounts)}`);
	}

	for (const row of billRows) {
		const existing = existingBills.find((bill) => bill.id === row.id);
		const domainBill = domainBillById.get(row.id);
		log.info(
			`${flags['dry-run'] ? 'would update' : 'updating'} bill: ${row.id} | ${existing?.current_stage ?? 'new'} -> ${row.current_stage} | ${existing ? existing.latest_action_date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : 'new'} -> ${domainBill?.latest_action_date ?? row.latest_action_date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}`
		);
	}

	if (flags['dry-run']) {
		log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (tables: Bill, BillAction, SittingDay, TimelineEvent)`);
		log.info('dry-run; no changes made.');
		return;
	}

	const upsertedCounts = await prisma.$transaction(
		async (tx) => {
			await tx.billAction.deleteMany({ where: obsoleteActionWhere });
			await tx.timelineEvent.deleteMany({ where: obsoleteTimelineWhere });

			for (const row of billRows) {
				await tx.bill.upsert({
					where: { id: row.id },
					create: row,
					update: {
						title_en: row.title_en,
						title_hi: row.title_hi,
						bill_number: row.bill_number,
						bill_year: row.bill_year,
						bill_type: row.bill_type,
						origin_house: row.origin_house,
						current_stage: row.current_stage,
						ministry: row.ministry,
						introduced_on: row.introduced_on,
						latest_action_date: row.latest_action_date,
						source_url: row.source_url,
						summary: row.summary,
						is_demo_seed: row.is_demo_seed
					}
				});
			}

			for (const row of sittingDayRows) {
				await tx.sittingDay.upsert({
					where: { date_house: { date: row.date, house: row.house } },
					create: row,
					update: {
						session_name: row.session_name,
						status: row.status,
						is_demo_seed: row.is_demo_seed
					}
				});
			}

			for (const row of actionRows) {
				await tx.billAction.upsert({
					where: { id: row.id },
					create: row,
					update: {
						bill_id: row.bill_id,
						date: row.date,
						house: row.house,
						action_type: row.action_type,
						description: row.description,
						source_url: row.source_url,
						is_demo_seed: row.is_demo_seed
					}
				});
			}

			for (const row of timelineRows) {
				await tx.timelineEvent.upsert({
					where: { id: row.id },
					create: row,
					update: {
						date: row.date,
						house: row.house,
						type: row.type,
						title: row.title,
						description: row.description,
						related_bill_id: row.related_bill_id,
						source_url: row.source_url,
						is_demo_seed: row.is_demo_seed
					}
				});
			}

			return sourceCounts;
		},
		{ timeout: 30_000 }
	);

	log.info(`upserted rows:    ${formatCountMap(upsertedCounts)} (total=${sumCounts(upsertedCounts).toLocaleString('en-IN')})`);
	log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (tables: Bill, BillAction, SittingDay, TimelineEvent)`);
	log.info('PRS current-session upsert complete.');
}

main()
	.catch((error) => {
		log.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
