import type {
	Bill,
	BillAction,
	BillStage,
	BillType,
	House,
	TimelineEvent,
	TimelineEventType
} from '../src/lib/domain/types';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { assertEnv, safeDbUrl } from './lib/envCheck';
import { parseFlags } from './lib/flags';
import { makeLogger } from './lib/logger';

const log = makeLogger('LIVE-BILLS');
const flags = parseFlags(['dry-run', 'force-mirror']);
assertEnv(['DATABASE_URL'], log);

const CUTOFF_DATE = '2026-04-16';
const SANSAD_BILLS_API =
	'https://sansad.in/api_rs/legislation/getBills?loksabha=&sessionNo=&billName=&house=&ministryName=&billType=&billCategory=&billStatus=&introductionDateFrom=&introductionDateTo=&passedInLsDateFrom=&passedInLsDateTo=&passedInRsDateFrom=&passedInRsDateTo=&page=0&size=2000&locale=en&sortOn=billIntroducedDate&sortBy=desc';
const FALLBACK_BILLS_DATASET = 'https://righttoinformation.wiki/static/data/bills.json';

type SansadBillRecord = {
	billNumber: string | null;
	billName: string;
	billType: string | null;
	billCategory: string | null;
	ministryName: string | null;
	billYear: number | null;
	billIntroducedInHouse: string | null;
	billIntroducedDate: string | null;
	billIntroducedFile: string | null;
	billPassedInLSDate: string | null;
	billPassedInLSFile: string | null;
	billPassedInRSDate: string | null;
	billPassedInRSFile: string | null;
	billPassedInBothHousesFile: string | null;
	reportPresentedDate: string | null;
	reportFile: string | null;
	referredToCommitteeDate: string | null;
	actNo: string | null;
	actYear: number | null;
	billAssentedDate: string | null;
	billGazettedFile: string | null;
	status: string | null;
	stages?: Array<[string, string, string | null]>;
};

type SansadPayload = {
	meta?: { as_of?: string };
	bills?: SansadBillRecord[];
	records?: SansadBillRecord[];
};

function slugify(value: string): string {
	return value
		.replace(/^the\s+/i, '')
		.replace(/,?\s*(19|20)\d{2}\.?$/i, '')
		.replace(/[“”"'.]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 120);
}

function toIsoDate(value: string | null | undefined): string | null {
	if (!value) return null;
	const trimmed = value.trim();
	const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
	const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
	if (slashMatch) {
		const [, day, month, year] = slashMatch;
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	}
	return null;
}

function toHouse(value: string | null | undefined): House {
	return value?.toLowerCase().includes('rajya') ? 'rajya-sabha' : 'lok-sabha';
}

function toBillType(category: string | null | undefined): BillType {
	const normalized = category?.toLowerCase() ?? '';
	if (normalized.includes('money')) return 'money';
	if (normalized.includes('financial')) return 'financial';
	if (normalized.includes('constitutional')) return 'constitutional-amendment';
	return 'ordinary';
}

function toStage(record: SansadBillRecord): BillStage {
	const status = record.status?.toLowerCase() ?? '';
	if (status.includes('lapsed')) return 'lapsed';
	if (status.includes('withdrawn') || status.includes('removed') || status.includes('negatived')) return 'withdrawn';
	if (record.actNo || record.actYear || record.billGazettedFile) return 'act_published';
	if (record.billAssentedDate || status.includes('assented')) return 'assented';
	if (record.billPassedInLSDate && record.billPassedInRSDate) return 'passed_second_house';
	if (record.billPassedInLSDate || record.billPassedInRSDate || status.includes('passed')) return 'passed_origin_house';
	if (record.reportPresentedDate) return 'committee_reported';
	if (record.referredToCommitteeDate) return 'referred_committee';
	if (status.includes('part-discussed')) return 'taken_up';
	return 'introduced';
}

function actionTypeFor(stageName: string): TimelineEventType {
	const n = stageName.toLowerCase();
	if (n.includes('assented')) return 'bill_assented';
	if (n.includes('rajya sabha')) return 'bill_passed_second_house';
	if (n.includes('lok sabha')) return 'bill_passed_origin_house';
	if (n.includes('committee')) return 'bill_referred_committee';
	if (n.includes('introduced')) return 'bill_introduced';
	if (n.includes('lapsed')) return 'bill_lapsed';
	if (n.includes('withdrawn')) return 'bill_withdrawn';
	return 'bill_taken_up';
}

function eventTitleFor(stageName: string, billName: string): string {
	const shortName = billName.replace(/^the\s+/i, '').replace(/\s+/g, ' ').trim();
	const n = stageName.toLowerCase();
	if (n.includes('assented')) return `${shortName} received President's assent`;
	if (n.includes('rajya sabha')) return `${shortName} passed by Rajya Sabha`;
	if (n.includes('lok sabha')) return `${shortName} passed by Lok Sabha`;
	if (n.includes('introduced')) return `${shortName} introduced`;
	return `${shortName}: ${stageName}`;
}

function sourceUrlFor(record: SansadBillRecord): string {
	return (
		record.billPassedInBothHousesFile ??
		record.billGazettedFile ??
		record.billIntroducedFile ??
		record.billPassedInLSFile ??
		record.billPassedInRSFile ??
		record.reportFile ??
		'https://sansad.in/ls/legislation/bills'
	);
}

function latestDateFor(record: SansadBillRecord): string {
	const stageDates = (record.stages ?? []).map((s) => toIsoDate(s[1])).filter((d): d is string => Boolean(d));
	const candidates = [
		toIsoDate(record.billAssentedDate),
		toIsoDate(record.reportPresentedDate),
		toIsoDate(record.billPassedInRSDate),
		toIsoDate(record.billPassedInLSDate),
		toIsoDate(record.billIntroducedDate),
		...stageDates
	].filter((d): d is string => Boolean(d));
	return candidates.sort().at(-1) ?? `${record.billYear ?? new Date().getFullYear()}-01-01`;
}

function billYearFor(record: SansadBillRecord): number {
	return (record.billYear ?? Number(toIsoDate(record.billIntroducedDate)?.slice(0, 4))) || new Date().getFullYear();
}

function billIdFor(record: SansadBillRecord): string {
	return `${slugify(record.billName.replace(/\s+/g, ' ').trim())}-${billYearFor(record)}`;
}

function normalizeBill(record: SansadBillRecord): Bill {
	const year = billYearFor(record);
	const title = record.billName.replace(/\s+/g, ' ').trim();
	const billNumber =
		record.actNo && record.actYear
			? `Act No. ${record.actNo} of ${record.actYear}`
			: record.billNumber
				? `Bill No. ${record.billNumber} of ${year}`
				: `Bill of ${year}`;
	return {
		id: billIdFor(record),
		title_en: title,
		title_hi: title,
		bill_number: billNumber,
		bill_year: year,
		bill_type: toBillType(record.billCategory),
		origin_house: toHouse(record.billIntroducedInHouse),
		current_stage: toStage(record),
		ministry: record.ministryName ?? 'Unspecified ministry',
		introduced_on: toIsoDate(record.billIntroducedDate) ?? latestDateFor(record),
		latest_action_date: latestDateFor(record),
		source_url: sourceUrlFor(record),
		summary: `${title} is a ${record.billType ?? 'Parliament'} ${record.billCategory ?? 'Bill'} from ${record.ministryName ?? 'the recorded ministry'} with status ${record.status ?? 'recorded'} in the Sansad legislation dataset.`,
		isDemoSeed: false
	};
}

function normalizeActions(record: SansadBillRecord, bill: Bill): BillAction[] {
	const stageRows = record.stages?.length
		? record.stages
		: ([['Introduced', record.billIntroducedDate, record.billIntroducedInHouse]] as Array<[string, string | null, string | null]>);
	return stageRows.flatMap((stage, index) => {
		const date = toIsoDate(stage[1]);
		if (!date) return [];
		return [
			{
				id: `${bill.id}-action-${index + 1}-${slugify(stage[0])}`,
				bill_id: bill.id,
				date,
				house: stage[2] ? toHouse(stage[2]) : bill.origin_house,
				action_type: actionTypeFor(stage[0]),
				description: `${stage[0]} for ${bill.title_en}.`,
				source_url: sourceUrlFor(record),
				isDemoSeed: false
			}
		];
	});
}

function normalizeTimelineEvents(bill: Bill, actions: BillAction[]): TimelineEvent[] {
	return actions.map((action) => ({
		id: `${bill.id}-event-${action.id.replace(`${bill.id}-action-`, '')}`,
		date: action.date,
		house: action.house,
		type: action.action_type as TimelineEventType,
		title: eventTitleFor(action.description.replace(` for ${bill.title_en}.`, ''), bill.title_en),
		description: action.description,
		related_bill_id: bill.id,
		source_url: action.source_url,
		isDemoSeed: false
	}));
}

async function fetchJson(url: string): Promise<SansadPayload> {
	const response = await fetch(url, {
		headers: {
			accept: 'application/json, text/plain, */*',
			referer: 'https://sansad.in/ls/legislation/bills',
			'user-agent': 'BharatZero live bill sync'
		}
	});
	if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
	return response.json() as Promise<SansadPayload>;
}

async function loadPayload(): Promise<{ payload: SansadPayload; sourceUrl: string }> {
	if (flags['force-mirror']) {
		const payload = await fetchJson(FALLBACK_BILLS_DATASET);
		return { payload, sourceUrl: FALLBACK_BILLS_DATASET };
	}
	try {
		const payload = await fetchJson(SANSAD_BILLS_API);
		const records = payload.records ?? payload.bills ?? [];
		if (records.length) return { payload, sourceUrl: SANSAD_BILLS_API };
		throw new Error('Sansad API returned no records');
	} catch (error) {
		log.warn(`Sansad API unavailable (${String(error)}); falling back to mirror.`);
		const payload = await fetchJson(FALLBACK_BILLS_DATASET);
		return { payload, sourceUrl: FALLBACK_BILLS_DATASET };
	}
}

const toPrismaEnum = (value: string) => value.replaceAll('-', '_').toUpperCase();
const toDate = (value: string) => new Date(`${value}T00:00:00+05:30`);

async function main() {
	const { payload, sourceUrl } = await loadPayload();
	const allRecords = payload.records ?? payload.bills ?? [];
	const filtered = allRecords.filter((r) => {
		const introduced = toIsoDate(r.billIntroducedDate);
		return introduced !== null && introduced >= CUTOFF_DATE;
	});

	log.info(`source:           ${sourceUrl}`);
	log.info(`fetched records:  ${allRecords.length}`);
	log.info(`post-${CUTOFF_DATE}:    ${filtered.length}`);

	if (filtered.length === 0) {
		log.info('No bills to process. Exiting cleanly.');
		return;
	}

	const prisma = createPrismaClient();
	try {
		const candidateBills = filtered.map(normalizeBill);
		const candidateIds = candidateBills.map((b) => b.id);
		const existing = await prisma.bill.findMany({
			where: { id: { in: candidateIds } },
			select: { id: true }
		});
		const existingIdSet = new Set(existing.map((row) => row.id));
		const newRecords = filtered.filter((r) => !existingIdSet.has(billIdFor(r)));

		log.info(`already in DB:    ${existingIdSet.size}`);
		log.info(`new to insert:    ${newRecords.length}`);

		if (newRecords.length === 0) {
			log.info('Nothing new — DB already current.');
			return;
		}

		const newBills = newRecords.map(normalizeBill);
		const newActions = newRecords.flatMap((r) => normalizeActions(r, normalizeBill(r)));
		const newEvents = newBills.flatMap((bill) => {
			const record = newRecords.find((r) => billIdFor(r) === bill.id);
			if (!record) return [];
			return normalizeTimelineEvents(bill, normalizeActions(record, bill));
		});

		log.info(`prepared:         ${newBills.length} bills, ${newActions.length} actions, ${newEvents.length} events`);

		if (flags['dry-run']) {
			log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')}`);
			log.info('dry-run; no changes made.');
			for (const bill of newBills) {
				log.info(`  would insert: ${bill.id} | ${bill.introduced_on} | ${bill.title_en.slice(0, 70)}`);
			}
			return;
		}

		const billRows = newBills.map((bill) => ({
			id: bill.id,
			title_en: bill.title_en,
			title_hi: bill.title_hi,
			bill_number: bill.bill_number,
			bill_year: bill.bill_year,
			bill_type: toPrismaEnum(bill.bill_type),
			origin_house: toPrismaEnum(bill.origin_house),
			current_stage: toPrismaEnum(bill.current_stage),
			ministry: bill.ministry,
			introduced_on: toDate(bill.introduced_on),
			latest_action_date: toDate(bill.latest_action_date),
			source_url: bill.source_url,
			summary: bill.summary,
			is_demo_seed: bill.isDemoSeed
		}));

		const actionRows = newActions.map((a) => ({
			id: a.id,
			bill_id: a.bill_id,
			date: toDate(a.date),
			house: toPrismaEnum(a.house),
			action_type: a.action_type,
			description: a.description,
			source_url: a.source_url,
			is_demo_seed: a.isDemoSeed
		}));

		const eventRows = newEvents.map((e) => ({
			id: e.id,
			date: toDate(e.date),
			house: toPrismaEnum(e.house),
			type: toPrismaEnum(e.type),
			title: e.title,
			description: e.description,
			related_bill_id: e.related_bill_id,
			source_url: e.source_url,
			is_demo_seed: e.isDemoSeed
		}));

		const inserted = await prisma.$transaction(
			async (tx) => ({
				bills: (await tx.bill.createMany({ data: billRows, skipDuplicates: true })).count,
				actions: (await tx.billAction.createMany({ data: actionRows, skipDuplicates: true })).count,
				events: (await tx.timelineEvent.createMany({ data: eventRows, skipDuplicates: true })).count
			}),
			{ timeout: 30_000 }
		);

		log.info(`inserted:         ${inserted.bills} bills, ${inserted.actions} actions, ${inserted.events} events`);
		log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')}`);
		log.info('Live bill sync complete.');
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	log.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
