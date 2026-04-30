import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type {
	Act,
	Bill,
	BillAction,
	BillStage,
	BillType,
	House,
	SittingDay,
	TimelineEvent,
	TimelineEventType
} from '../src/lib/domain/types';

type SansadBillRecord = {
	billNumber: string | null;
	billName: string;
	billType: string | null;
	billCategory: string | null;
	ministryName: string | null;
	billYear: number | null;
	billIntroducedInHouse: string | null;
	billIntroducedBy: string | null;
	billIntroducedDate: string | null;
	billIntroducedFile: string | null;
	billPassedInLSDate: string | null;
	billPassedInLSFile: string | null;
	billPassedInRSDate: string | null;
	billPassedInRSFile: string | null;
	billPassedInBothHousesFile: string | null;
	errataFile: string | null;
	referredToCommitteeDate: string | null;
	reportPresentedDate: string | null;
	reportFile: string | null;
	actNo: string | null;
	actYear: number | null;
	billAssentedDate: string | null;
	billGazettedFile: string | null;
	billSynopsisFile: string | null;
	status: string | null;
	stages?: Array<[string, string, string | null]>;
	status_label?: string;
	name_short?: string;
	slug?: string;
};

type SansadBillsPayload = {
	meta?: {
		total?: number;
		as_of?: string;
		source?: string;
	};
	bills?: SansadBillRecord[];
	records?: SansadBillRecord[];
	_metadata?: {
		totalElements?: number;
		totalPages?: number;
	};
};

const SANSAD_BILLS_API =
	'https://sansad.in/api_rs/legislation/getBills?loksabha=&sessionNo=&billName=&house=&ministryName=&billType=&billCategory=&billStatus=&introductionDateFrom=&introductionDateTo=&passedInLsDateFrom=&passedInLsDateTo=&passedInRsDateFrom=&passedInRsDateTo=&page=0&size=2000&locale=en&sortOn=billIntroducedDate&sortBy=desc';
const FALLBACK_BILLS_DATASET = 'https://righttoinformation.wiki/static/data/bills.json';
const OUTPUT_FILE = 'src/lib/data/generated/sansad-legislation.ts';

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
	if (status.includes('withdrawn') || status.includes('removed') || status.includes('negatived')) {
		return 'withdrawn';
	}
	if (record.actNo || record.actYear || record.billGazettedFile) return 'act_published';
	if (record.billAssentedDate || status.includes('assented')) return 'assented';
	if (record.billPassedInLSDate && record.billPassedInRSDate) return 'passed_second_house';
	if (record.billPassedInLSDate || record.billPassedInRSDate || status.includes('passed')) {
		return record.billIntroducedInHouse?.toLowerCase().includes('rajya')
			? 'passed_origin_house'
			: 'passed_origin_house';
	}
	if (record.reportPresentedDate) return 'committee_reported';
	if (record.referredToCommitteeDate) return 'referred_committee';
	if (status.includes('part-discussed')) return 'taken_up';
	return 'introduced';
}

function actionTypeFor(stageName: string): TimelineEventType {
	const normalized = stageName.toLowerCase();
	if (normalized.includes('assented')) return 'bill_assented';
	if (normalized.includes('rajya sabha')) return 'bill_passed_second_house';
	if (normalized.includes('lok sabha')) return 'bill_passed_origin_house';
	if (normalized.includes('committee')) return 'bill_referred_committee';
	if (normalized.includes('introduced')) return 'bill_introduced';
	if (normalized.includes('lapsed')) return 'bill_lapsed';
	if (normalized.includes('withdrawn')) return 'bill_withdrawn';
	return 'bill_taken_up';
}

function eventTitleFor(stageName: string, billName: string): string {
	const shortName = billName.replace(/^the\s+/i, '').replace(/\s+/g, ' ').trim();
	const normalized = stageName.toLowerCase();
	if (normalized.includes('assented')) return `${shortName} received President's assent`;
	if (normalized.includes('rajya sabha')) return `${shortName} passed by Rajya Sabha`;
	if (normalized.includes('lok sabha')) return `${shortName} passed by Lok Sabha`;
	if (normalized.includes('introduced')) return `${shortName} introduced`;
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
	const stageDates = (record.stages ?? [])
		.map((stage) => toIsoDate(stage[1]))
		.filter((date): date is string => Boolean(date));
	const candidates = [
		toIsoDate(record.billAssentedDate),
		toIsoDate(record.reportPresentedDate),
		toIsoDate(record.billPassedInRSDate),
		toIsoDate(record.billPassedInLSDate),
		toIsoDate(record.billIntroducedDate),
		...stageDates
	].filter((date): date is string => Boolean(date));
	return candidates.sort().at(-1) ?? `${record.billYear ?? new Date().getFullYear()}-01-01`;
}

function normalizeBill(record: SansadBillRecord, id = billIdFor(record)): Bill {
	const year = billYearFor(record);
	const title = record.billName.replace(/\s+/g, ' ').trim();
	const category = toBillType(record.billCategory);
	const billNumber =
		record.actNo && record.actYear
			? `Act No. ${record.actNo} of ${record.actYear}`
			: record.billNumber
				? `Bill No. ${record.billNumber} of ${year}`
				: `Bill of ${year}`;

	return {
		id,
		title_en: title,
		title_hi: title,
		bill_number: billNumber,
		bill_year: year,
		bill_type: category,
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

function billYearFor(record: SansadBillRecord): number {
	return (record.billYear ?? Number(toIsoDate(record.billIntroducedDate)?.slice(0, 4))) || new Date().getFullYear();
}

function billIdFor(record: SansadBillRecord): string {
	return `${slugify(record.billName.replace(/\s+/g, ' ').trim())}-${billYearFor(record)}`;
}

function collisionSafeBillIdFor(record: SansadBillRecord, baseIdCounts: Map<string, number>): string {
	const baseId = billIdFor(record);
	if ((baseIdCounts.get(baseId) ?? 0) <= 1) return baseId;
	const discriminator = slugify(record.billNumber ?? record.slug ?? latestDateFor(record));
	return `${baseId}-${discriminator || 'record'}`;
}

function assignUniqueBillId(record: SansadBillRecord, baseIdCounts: Map<string, number>, assignedIdCounts: Map<string, number>): string {
	const candidate = collisionSafeBillIdFor(record, baseIdCounts);
	const priorAssignments = assignedIdCounts.get(candidate) ?? 0;
	assignedIdCounts.set(candidate, priorAssignments + 1);
	return priorAssignments === 0 ? candidate : `${candidate}-${priorAssignments + 1}`;
}

function normalizeActions(record: SansadBillRecord, bill: Bill): BillAction[] {
	const stageRows = record.stages?.length
		? record.stages
		: [['Introduced', record.billIntroducedDate, record.billIntroducedInHouse]] as Array<[string, string | null, string | null]>;

	return stageRows.flatMap((stage, index) => {
		const date = toIsoDate(stage[1]);
		if (!date) return [];
		const type = actionTypeFor(stage[0]);
		const house = stage[2] ? toHouse(stage[2]) : bill.origin_house;
		return {
			id: `${bill.id}-action-${index + 1}-${slugify(stage[0])}`,
			bill_id: bill.id,
			date,
			house,
			action_type: type,
			description: `${stage[0]} for ${bill.title_en}.`,
			source_url: sourceUrlFor(record),
			isDemoSeed: false
		};
	});
}

function normalizeTimelineEvents(record: SansadBillRecord, bill: Bill, actions: BillAction[]): TimelineEvent[] {
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

function normalizeAct(record: SansadBillRecord, bill: Bill): Act | null {
	if (!record.actNo && !record.actYear && !record.billAssentedDate) return null;
	const year = record.actYear ?? Number(toIsoDate(record.billAssentedDate)?.slice(0, 4)) ?? bill.bill_year;
	return {
		id: `${slugify(bill.title_en.replace(/bill/i, 'act'))}-${year}`,
		title: bill.title_en.replace(/\bBill\b/i, 'Act'),
		act_number: record.actNo ? `Act No. ${record.actNo} of ${year}` : `Act of ${year}`,
		year,
		linked_bill_id: bill.id,
		india_code_url: record.billGazettedFile ?? record.billPassedInBothHousesFile ?? bill.source_url,
		isDemoSeed: false
	};
}

function normalizeSittingDays(actions: BillAction[]): SittingDay[] {
	const seen = new Set<string>();
	const sittingDays: SittingDay[] = [];
	for (const action of actions) {
		const key = `${action.date}:${action.house}`;
		if (seen.has(key)) continue;
		seen.add(key);
		sittingDays.push({
			id: `sit-${action.house}-${action.date}`,
			date: action.date,
			house: action.house,
			session_name: `Parliament sitting ${action.date.slice(0, 4)}`,
			status: 'sat',
			isDemoSeed: false
		});
	}
	return sittingDays.sort((left, right) => right.date.localeCompare(left.date));
}

async function fetchJson(url: string): Promise<SansadBillsPayload> {
	const response = await fetch(url, {
		headers: {
			accept: 'application/json, text/plain, */*',
			referer: 'https://sansad.in/ls/legislation/bills',
			'user-agent': 'BharatZero local data sync'
		}
	});
	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText}`);
	}
	return response.json() as Promise<SansadBillsPayload>;
}

async function loadPayload(): Promise<{ payload: SansadBillsPayload; sourceUrl: string }> {
	try {
		const payload = await fetchJson(SANSAD_BILLS_API);
		if (payload.records?.length) return { payload, sourceUrl: SANSAD_BILLS_API };
		throw new Error('Sansad API returned no records');
	} catch (error) {
		console.warn(`Sansad API fetch failed; using mirror dataset. ${String(error)}`);
		const payload = await fetchJson(FALLBACK_BILLS_DATASET);
		return { payload, sourceUrl: FALLBACK_BILLS_DATASET };
	}
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
	const seen = new Set<string>();
	return items.filter((item) => {
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});
}

async function main() {
	const { payload, sourceUrl } = await loadPayload();
	const records = payload.records ?? payload.bills ?? [];
	if (!records.length) {
		throw new Error('No bill records found in source payload.');
	}

	const baseIdCounts = records.reduce((counts, record) => {
		const baseId = billIdFor(record);
		counts.set(baseId, (counts.get(baseId) ?? 0) + 1);
		return counts;
	}, new Map<string, number>());
	const assignedIdCounts = new Map<string, number>();
	const billRecords = records.map((record) => ({
		record,
		bill: normalizeBill(record, assignUniqueBillId(record, baseIdCounts, assignedIdCounts))
	}));
	const bills = uniqueById(billRecords.map(({ bill }) => bill));
	const actions = uniqueById(
		billRecords.flatMap(({ record, bill }) => normalizeActions(record, bill))
	);
	const timelineEvents = uniqueById(
		billRecords.flatMap(({ record, bill }) => {
			return normalizeTimelineEvents(record, bill, normalizeActions(record, bill));
		})
	);
	const acts = uniqueById(
		billRecords.flatMap(({ record, bill }) => {
			const act = normalizeAct(record, bill);
			return act ? [act] : [];
		})
	);
	const sittingDays = normalizeSittingDays(actions);
	const asOf = payload.meta?.as_of ?? new Date().toISOString().slice(0, 10);

	const file = `/* Generated by scripts/sync-sansad-legislation.ts. Do not edit manually. */
import type { Act, Bill, BillAction, SittingDay, TimelineEvent } from '$lib/domain/types';

export const sansadMeta = ${JSON.stringify(
		{
			asOf,
			sourceUrl,
			totalSourceRecords: records.length,
			generatedAt: new Date().toISOString()
		},
		null,
		2
	)} as const;

export const sansadBills = ${JSON.stringify(bills, null, 2)} satisfies Bill[];

export const sansadBillActions = ${JSON.stringify(actions, null, 2)} satisfies BillAction[];

export const sansadSittingDays = ${JSON.stringify(sittingDays, null, 2)} satisfies SittingDay[];

export const sansadTimelineEvents = ${JSON.stringify(timelineEvents, null, 2)} satisfies TimelineEvent[];

export const sansadActs = ${JSON.stringify(acts, null, 2)} satisfies Act[];
`;

	await mkdir(dirname(OUTPUT_FILE), { recursive: true });
	await writeFile(OUTPUT_FILE, file);
	console.log(`Wrote ${OUTPUT_FILE}`);
	console.log(`Bills: ${bills.length}; actions: ${actions.length}; timeline events: ${timelineEvents.length}; acts: ${acts.length}`);
}

await main();
