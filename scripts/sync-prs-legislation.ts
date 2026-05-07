import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import * as cheerio from 'cheerio';
import type {
	Bill,
	BillAction,
	BillStage,
	BillType,
	House,
	SittingDay,
	TimelineEvent,
	TimelineEventType
} from '../src/lib/domain/types';

type PrsListRecord = {
	title: string;
	url: string;
	year: number;
};

type PrsStatus = {
	status: string;
	house: House;
	date: string;
};

type PrsDetail = {
	title: string;
	category: string | null;
	ministry: string | null;
	summary: string | null;
	statuses: PrsStatus[];
};

const BASE_URL = 'https://prsindia.org';
const LIST_URL = `${BASE_URL}/billtrack/category/all`;
const OUTPUT_FILE = 'src/lib/data/generated/prs-legislation.ts';
const MAX_YEAR = 2019;
const MIN_YEAR = 1992;
const CONCURRENCY = 5;

const REQUEST_HEADERS = {
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'accept-language': 'en-US,en;q=0.9',
	referer: 'https://prsindia.org/billtrack',
	'user-agent': 'BharatZero local data sync'
};

const MONTHS: Record<string, string> = {
	jan: '01',
	feb: '02',
	mar: '03',
	apr: '04',
	may: '05',
	jun: '06',
	jul: '07',
	aug: '08',
	sep: '09',
	oct: '10',
	nov: '11',
	dec: '12'
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

function cleanText(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function absoluteUrl(href: string): string {
	return href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
}

function titleYear(title: string): number | null {
	const match = title.match(/(19|20)\d{2}(?=\D*$)/);
	return match ? Number(match[0]) : null;
}

function toIsoDate(value: string | null | undefined): string | null {
	if (!value) return null;
	const trimmed = cleanText(value).replace(/,$/, '');
	const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
	const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
	if (slashMatch) {
		const [, day, month, year] = slashMatch;
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	}
	const monthMatch = trimmed.match(/^([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})$/);
	if (monthMatch) {
		const [, monthName, day, year] = monthMatch;
		const month = MONTHS[monthName.slice(0, 3).toLowerCase()];
		if (month) return `${year}-${month}-${day.padStart(2, '0')}`;
	}
	return null;
}

function toHouse(value: string | null | undefined): House {
	return value?.toLowerCase().includes('rajya') ? 'rajya-sabha' : 'lok-sabha';
}

function toBillType(title: string): BillType {
	const normalized = title.toLowerCase();
	if (normalized.includes('constitution') && normalized.includes('amendment')) return 'constitutional-amendment';
	if (normalized.includes('money bill')) return 'money';
	if (normalized.includes('appropriation') || normalized.includes('finance bill')) return 'financial';
	return 'ordinary';
}

function statusPriority(stage: BillStage): number {
	const priorities: Partial<Record<BillStage, number>> = {
		introduced: 1,
		listed: 2,
		taken_up: 3,
		referred_committee: 4,
		committee_reported: 5,
		passed_origin_house: 6,
		transmitted_to_other_house: 7,
		passed_second_house: 8,
		president_assent_pending: 9,
		assented: 10,
		act_published: 11,
		withdrawn: 12,
		lapsed: 12
	};
	return priorities[stage] ?? 0;
}

function stageForStatus(status: string, house: House): BillStage {
	const normalized = status.toLowerCase();
	if (normalized.includes('lapse')) return 'lapsed';
	if (normalized.includes('withdraw') || normalized.includes('infructuous') || normalized.includes('negatived')) return 'withdrawn';
	if (normalized.includes('act') || normalized.includes('enacted')) return 'act_published';
	if (normalized.includes('assent')) return 'assented';
	if (normalized.includes('report')) return 'committee_reported';
	if (normalized.includes('refer')) return 'referred_committee';
	if (normalized.includes('pass')) return house === 'rajya-sabha' ? 'passed_second_house' : 'passed_origin_house';
	if (normalized.includes('consider') || normalized.includes('discuss')) return 'taken_up';
	return 'introduced';
}

function eventTypeForStage(stage: BillStage): TimelineEventType {
	if (stage === 'lapsed') return 'bill_lapsed';
	if (stage === 'withdrawn') return 'bill_withdrawn';
	if (stage === 'act_published') return 'act_published';
	if (stage === 'assented') return 'bill_assented';
	if (stage === 'committee_reported') return 'committee_report_tabled';
	if (stage === 'referred_committee') return 'bill_referred_committee';
	if (stage === 'passed_second_house') return 'bill_passed_second_house';
	if (stage === 'passed_origin_house') return 'bill_passed_origin_house';
	if (stage === 'listed') return 'bill_listed';
	if (stage === 'taken_up') return 'bill_taken_up';
	return 'bill_introduced';
}

async function fetchHtml(url: string): Promise<string> {
	const response = await fetch(url, { headers: REQUEST_HEADERS });
	if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
	return response.text();
}

async function loadListRecords(): Promise<PrsListRecord[]> {
	const $ = cheerio.load(await fetchHtml(LIST_URL));
	const records = new Map<string, PrsListRecord>();

	$('h3 a[href*="/billtrack/"]').each((_, element) => {
		const title = cleanText($(element).text());
		const href = $(element).attr('href');
		const year = titleYear(title);
		if (!title || !href || !year) return;
		if (year < MIN_YEAR || year > MAX_YEAR) return;
		if (!/\bbill\b/i.test(title)) return;

		const url = absoluteUrl(href);
		records.set(url, { title, url, year });
	});

	return [...records.values()].sort((left, right) => right.year - left.year || left.title.localeCompare(right.title));
}

function parseDetail(html: string, fallbackTitle: string): PrsDetail {
	const $ = cheerio.load(html);
	const title = cleanText($('.field-name-title-field h2, .field-name-title-field').first().text()) || fallbackTitle;
	const breadcrumb = $('ul.breadcrumb li')
		.map((_, item) => cleanText($(item).text()))
		.get()
		.filter(Boolean);
	const category = breadcrumb.length >= 2 ? breadcrumb.at(-2) ?? null : null;
	const ministry = cleanText($('.field-name-field-ministry .field-item').first().text()) || null;
	const summary =
		cleanText($('.field-name-body').first().text()) ||
		cleanText($('.field-name-field-bill-summary').first().text()) ||
		null;
	const statuses: PrsStatus[] = [];

	$('.field-collection-item-field-own-status-details').each((_, element) => {
		const status = cleanText($(element).find('.field-name-field-own-status .field-item').first().text());
		const houseText = cleanText($(element).find('.field-name-field-own-status-title .field-item').first().text());
		const date = toIsoDate(
			cleanText($(element).find('.field-name-field-own-status-date .field-item').first().text()) ||
				cleanText($(element).find('.date-display-single').first().text())
		);
		if (!status || !date) return;
		statuses.push({ status, house: toHouse(houseText), date });
	});

	return { title, category, ministry, summary, statuses };
}

async function mapConcurrent<T, U>(items: T[], concurrency: number, mapper: (item: T, index: number) => Promise<U>): Promise<U[]> {
	const results = new Array<U>(items.length);
	let cursor = 0;
	await Promise.all(
		Array.from({ length: concurrency }, async () => {
			while (cursor < items.length) {
				const index = cursor++;
				results[index] = await mapper(items[index], index);
			}
		})
	);
	return results;
}

function currentStageFor(title: string, statuses: PrsStatus[]): BillStage {
	if (!statuses.length && /^draft\b/i.test(title)) return 'draft';
	return statuses
		.map((status) => stageForStatus(status.status, status.house))
		.sort((left, right) => statusPriority(right) - statusPriority(left))[0] ?? 'introduced';
}

function normalizeBill(record: PrsListRecord, detail: PrsDetail, id: string): Bill {
	const sortedStatuses = detail.statuses.slice().sort((left, right) => left.date.localeCompare(right.date));
	const introduced = sortedStatuses[0]?.date ?? `${record.year}-01-01`;
	const latest = sortedStatuses.at(-1)?.date ?? introduced;
	const ministry = detail.ministry ?? detail.category ?? 'Unspecified ministry';
	const summary = detail.summary
		? detail.summary.slice(0, 900)
		: `${detail.title} is a Parliament bill tracked by PRS Legislative Research. BharatZero imported this record to extend historical coverage before the Sansad API dataset.`;

	return {
		id,
		title_en: detail.title,
		title_hi: detail.title,
		bill_number: `PRS record of ${record.year}`,
		bill_year: record.year,
		bill_type: toBillType(detail.title),
		origin_house: sortedStatuses[0]?.house ?? 'lok-sabha',
		current_stage: currentStageFor(detail.title, sortedStatuses),
		ministry,
		introduced_on: introduced,
		latest_action_date: latest,
		source_url: record.url,
		summary,
		isDemoSeed: false
	};
}

function normalizeActions(record: PrsListRecord, detail: PrsDetail, bill: Bill): BillAction[] {
	const statuses = detail.statuses.length
		? detail.statuses
		: [{ status: 'Introduced', house: bill.origin_house, date: bill.introduced_on }];

	return statuses.map((status, index) => {
		const stage = stageForStatus(status.status, status.house);
		return {
			id: `${bill.id}-prs-action-${index + 1}`,
			bill_id: bill.id,
			date: status.date,
			house: status.house,
			action_type: eventTypeForStage(stage),
			description: `${status.status} in ${status.house === 'rajya-sabha' ? 'Rajya Sabha' : 'Lok Sabha'} for ${bill.title_en}.`,
			source_url: record.url,
			isDemoSeed: false
		};
	});
}

function normalizeTimelineEvents(bill: Bill, actions: BillAction[]): TimelineEvent[] {
	return actions.map((action, index) => ({
		id: `${bill.id}-prs-event-${index + 1}`,
		date: action.date,
		house: action.house,
		type: action.action_type as TimelineEventType,
		title: action.description.replace(` for ${bill.title_en}.`, ''),
		description: action.description,
		related_bill_id: bill.id,
		source_url: action.source_url,
		isDemoSeed: false
	}));
}

function normalizeSittingDays(actions: BillAction[]): SittingDay[] {
	const seen = new Set<string>();
	const sittingDays: SittingDay[] = [];
	for (const action of actions) {
		const key = `${action.house}:${action.date}`;
		if (seen.has(key)) continue;
		seen.add(key);
		sittingDays.push({
			id: `prs-sit-${action.house}-${action.date}`,
			date: action.date,
			house: action.house,
			session_name: `PRS historical sitting ${action.date.slice(0, 4)}`,
			status: 'sat',
			isDemoSeed: false
		});
	}
	return sittingDays.sort((left, right) => right.date.localeCompare(left.date));
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
	const records = await loadListRecords();
	if (!records.length) throw new Error('No PRS bill records found.');
	console.log(`Found ${records.length} PRS bill records from ${MIN_YEAR}-${MAX_YEAR}.`);

	const details = await mapConcurrent(records, CONCURRENCY, async (record, index) => {
		if (index > 0 && index % 50 === 0) console.log(`Fetched ${index}/${records.length} PRS detail pages...`);
		try {
			return parseDetail(await fetchHtml(record.url), record.title);
		} catch (error) {
			console.warn(`PRS detail fetch failed for ${record.url}: ${String(error)}`);
			return { title: record.title, category: null, ministry: null, summary: null, statuses: [] };
		}
	});

	const assigned = new Map<string, number>();
	const billPairs = records.map((record, index) => {
		const baseId = `prs-${slugify(details[index].title)}-${record.year}`;
		const count = assigned.get(baseId) ?? 0;
		assigned.set(baseId, count + 1);
		const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
		const bill = normalizeBill(record, details[index], id);
		return { record, detail: details[index], bill };
	});
	const bills = uniqueById(billPairs.map(({ bill }) => bill));
	const actions = uniqueById(billPairs.flatMap(({ record, detail, bill }) => normalizeActions(record, detail, bill)));
	const timelineEvents = uniqueById(billPairs.flatMap(({ bill }) => normalizeTimelineEvents(bill, actions.filter((action) => action.bill_id === bill.id))));
	const sittingDays = normalizeSittingDays(actions);

	const file = `/* Generated by scripts/sync-prs-legislation.ts. Do not edit manually. */
import type { Bill, BillAction, SittingDay, TimelineEvent } from '$lib/domain/types';

export const prsMeta = ${JSON.stringify(
		{
			asOf: new Date().toISOString().slice(0, 10),
			sourceUrl: LIST_URL,
			minYear: MIN_YEAR,
			maxYear: MAX_YEAR,
			totalSourceRecords: records.length,
			generatedAt: new Date().toISOString()
		},
		null,
		2
	)} as const;

export const prsBills = ${JSON.stringify(bills, null, 2)} satisfies Bill[];

export const prsBillActions = ${JSON.stringify(actions, null, 2)} satisfies BillAction[];

export const prsSittingDays = ${JSON.stringify(sittingDays, null, 2)} satisfies SittingDay[];

export const prsTimelineEvents = ${JSON.stringify(timelineEvents, null, 2)} satisfies TimelineEvent[];
`;

	await mkdir(dirname(OUTPUT_FILE), { recursive: true });
	await writeFile(OUTPUT_FILE, file);
	console.log(`Wrote ${OUTPUT_FILE}`);
	console.log(`Bills: ${bills.length}; actions: ${actions.length}; timeline events: ${timelineEvents.length}; sitting days: ${sittingDays.length}`);
}

await main();
