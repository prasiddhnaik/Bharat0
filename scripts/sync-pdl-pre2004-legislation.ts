import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import * as cheerio from 'cheerio';
import type { Bill, BillAction, BillStage, BillType, House, SittingDay, TimelineEvent } from '../src/lib/domain/types';

type PdlSearchRecord = {
	date: string;
	rawTitle: string;
	title: string;
	year: number;
	type: string;
	url: string;
};

const BASE_URL = 'https://eparlib.sansad.in';
const OUTPUT_FILE = 'src/lib/data/generated/pdl-pre2004-legislation.ts';
const MIN_YEAR = 1947;
const MAX_YEAR = 2003;
const RPP = 100;
const MAX_PAGES_PER_YEAR = 12;
const YEAR_FETCH_CONCURRENCY = 4;

const REQUEST_HEADERS = {
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'accept-language': 'en-US,en;q=0.9',
	'user-agent': 'BharatZero local PDL historical bill sync'
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

function cleanText(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function absoluteUrl(href: string): string {
	return href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
}

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

function toIsoDate(value: string, fallbackYear: number): string {
	const trimmed = cleanText(value);
	const match = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
	if (match) {
		const [, day, monthName, year] = match;
		const month = MONTHS[monthName.toLowerCase()];
		if (month) return `${year}-${month}-${day.padStart(2, '0')}`;
	}
	const monthOnly = trimmed.match(/^([A-Za-z]{3})-(\d{4})$/);
	if (monthOnly) {
		const [, monthName, year] = monthOnly;
		const month = MONTHS[monthName.toLowerCase()];
		if (month) return `${year}-${month}-01`;
	}
	const yearOnly = trimmed.match(/^(\d{4})$/);
	if (yearOnly) return `${yearOnly[1]}-01-01`;
	return `${fallbackYear}-01-01`;
}

function searchUrl(year: number, start = 0) {
	const params = new URLSearchParams({
		query: '',
		filtername: 'title',
		filtertype: 'contains',
		filterquery: `Bill, ${year}`,
		rpp: String(RPP),
		sort_by: 'dc.date_dt',
		order: 'ASC'
	});
	if (start > 0) params.set('start', String(start));
	return `${BASE_URL}/simple-search?${params.toString()}`;
}

async function fetchHtml(url: string): Promise<string> {
	const response = await fetch(url, { headers: REQUEST_HEADERS });
	if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
	return response.text();
}

function canonicalBillTitle(rawTitle: string, year: number) {
	let title = cleanText(rawTitle)
		.replace(/\s*\.\s*$/, '')
		.replace(/^Introduction\s*,\s*consideration\s+and\s+(?:passing|passage)\s+of\s+(?:the\s+)?/i, '')
		.replace(/^Introduction\s+of\s+(?:the\s+)?/i, '')
		.replace(/^Introduced\s+(?:the\s+)?/i, '')
		.replace(/^Consideration\s+and\s+(?:passing|passage)\s+of\s+(?:the\s+)?/i, '')
		.replace(/^Further\s+discussion\s+on\s+(?:the\s+)?/i, '')
		.replace(/^Discussion\s+on\s+(?:the\s+)?/i, '')
		.replace(/\s*[-–:]\s*(?:introduced|contd\.?|continued|concluded|passed|bill passed|motion adopted).*$/i, '')
		.replace(/\s*\((?:bill\s+)?(?:passed|motion adopted|concluded)\)$/i, '')
		.replace(/,\s*(\d{4})\s+(?:passed|introduced|as amended by rajya sabha).*$/i, ', $1')
		.replace(/\bBill,\s*-\s*(\d{4})\b/i, 'Bill, $1')
		.replace(/\s+contd\.?$/i, '')
		.replace(/\s+Bill\s+(\d{4})$/i, ' Bill, $1')
		.replace(/\s*,\s*/g, ', ')
		.replace(/\s{2,}/g, ' ')
		.trim();

	const splitOnAndBill = title.match(/\band\s+([A-Z][^.;]*\bBill(?:,?\s*\d{4})?)/);
	if (/^Statutory Resolution|^Disapproval/i.test(title) && splitOnAndBill) {
		title = splitOnAndBill[1].trim();
	}

	if (!new RegExp(`\\b${year}\\b`).test(title)) {
		title = title.replace(/\s*\.$/, '');
		if (/Bill$/i.test(title)) title = `${title}, ${year}`;
	}

	return title;
}

function shouldKeepRecord(record: PdlSearchRecord) {
	if (!/\bBill\b/i.test(record.title)) return false;
	if (!new RegExp(`\\b${record.year}\\b`).test(record.title)) return false;
	if (!/Part 2/i.test(record.type)) return false;
	if (/\b(report|committee|index|journal|debates|question)\b/i.test(record.title)) return false;
	if (/^re\s*:/i.test(record.title)) return false;
	return true;
}

function parseSearchPage(html: string, year: number): PdlSearchRecord[] {
	const $ = cheerio.load(html);
	const records: PdlSearchRecord[] = [];

	$('table tr').slice(1).each((_, row) => {
		const cells = $(row).find('td');
		const date = toIsoDate(cleanText(cells.eq(0).text()), year);
		const rawTitle = cleanText(cells.eq(1).text());
		const type = cleanText(cells.eq(2).text());
		const href = cells.eq(3).find('a[href*="/handle/"]').first().attr('href');
		if (!date || !rawTitle || !href) return;

		const record = {
			date,
			rawTitle,
			title: canonicalBillTitle(rawTitle, year),
			year,
			type,
			url: absoluteUrl(href)
		};
		if (shouldKeepRecord(record)) records.push(record);
	});

	return records;
}

function findNextPage(html: string): string | null {
	const $ = cheerio.load(html);
	let next: string | null = null;
	$('a[href*="simple-search"]').each((_, anchor) => {
		if (cleanText($(anchor).text()).toLowerCase() === 'next') {
			next = absoluteUrl($(anchor).attr('href') ?? '');
		}
	});
	return next;
}

async function loadYearRecords(year: number): Promise<PdlSearchRecord[]> {
	let url: string | null = searchUrl(year);
	const records = new Map<string, PdlSearchRecord>();

	for (let page = 0; url && page < MAX_PAGES_PER_YEAR; page += 1) {
		const html = await fetchHtml(url);
		for (const record of parseSearchPage(html, year)) {
			const existing = records.get(record.title.toLowerCase());
			if (!existing || record.date < existing.date) records.set(record.title.toLowerCase(), record);
		}
		url = findNextPage(html);
	}

	return [...records.values()].sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title));
}

async function mapWithConcurrency<T, U>(
	items: T[],
	concurrency: number,
	mapper: (item: T) => Promise<U>
): Promise<U[]> {
	const results = new Array<U>(items.length);
	let nextIndex = 0;

	await Promise.all(
		Array.from({ length: Math.min(concurrency, items.length) }, async () => {
			while (nextIndex < items.length) {
				const index = nextIndex;
				nextIndex += 1;
				results[index] = await mapper(items[index]);
			}
		})
	);

	return results;
}

function inferMinistry(title: string) {
	const normalized = title.toLowerCase();
	if (/finance|appropriation|tax|bank|insurance|securities|customs|excise|income-tax|tariff/.test(normalized)) return 'Ministry of Finance';
	if (/railway/.test(normalized)) return 'Ministry of Railways';
	if (/constitution|scheduled caste|scheduled tribe|reservation|minorit|waqf|wakf|social justice|disabilit/.test(normalized)) return 'Ministry of Social Justice and Empowerment';
	if (/education|university|teacher|school|institute/.test(normalized)) return 'Ministry of Education';
	if (/health|medical|drug|food|infant milk|organ/.test(normalized)) return 'Ministry of Health and Family Welfare';
	if (/company|companies|trade|industry|patent|copyright|competition|small enterprise|coal|mine|mineral/.test(normalized)) return 'Ministry of Commerce and Industry';
	if (/labour|worker|wage|employment|provident|industrial disputes/.test(normalized)) return 'Ministry of Labour and Employment';
	if (/agricultur|seed|farm|rural|panchayat|municipal/.test(normalized)) return 'Ministry of Rural Development';
	if (/home|citizen|foreign|delhi|police|terror|arms|criminal|penal|cantonment/.test(normalized)) return 'Ministry of Home Affairs';
	if (/environment|forest|wildlife|water|pollution/.test(normalized)) return 'Ministry of Environment and Forests';
	if (/shipping|aircraft|motor vehicle|road|transport|port/.test(normalized)) return 'Ministry of Transport';
	if (/telecom|cable|broadcast|information technology|press/.test(normalized)) return 'Ministry of Information and Broadcasting';
	return 'Unspecified ministry';
}

function toBillType(title: string): BillType {
	const normalized = title.toLowerCase();
	if (normalized.includes('constitution') && normalized.includes('amendment')) return 'constitutional-amendment';
	if (normalized.includes('money bill')) return 'money';
	if (normalized.includes('appropriation') || normalized.includes('finance bill')) return 'financial';
	return 'ordinary';
}

function stageForRecord(rawTitle: string): BillStage {
	const normalized = rawTitle.toLowerCase();
	if (normalized.includes('passed')) return 'passed_origin_house';
	if (normalized.includes('withdraw')) return 'withdrawn';
	if (normalized.includes('returned by rajya sabha')) return 'returned_with_amendments';
	if (normalized.includes('introduced') || normalized.includes('introduction')) return 'introduced';
	return 'listed';
}

function normalizeBill(record: PdlSearchRecord, id: string): Bill {
	const ministry = inferMinistry(record.title);
	return {
		id,
		title_en: record.title,
		title_hi: record.title,
		bill_number: `PDL record of ${record.year}`,
		bill_year: record.year,
		bill_type: toBillType(record.title),
		origin_house: 'lok-sabha',
		current_stage: stageForRecord(record.rawTitle),
		ministry,
		introduced_on: record.date,
		latest_action_date: record.date,
		source_url: record.url,
		summary: `${record.title} appears in the Parliament Digital Library Lok Sabha proceedings for ${record.date}. BharatZero imported this pre-2004 record to improve historical coverage; detailed ministry, clause text, and final passage status still need confirmation from the source PDF.`,
		isDemoSeed: false
	};
}

function eventTypeForStage(stage: BillStage) {
	if (stage === 'passed_origin_house') return 'bill_passed_origin_house';
	if (stage === 'withdrawn') return 'bill_withdrawn';
	if (stage === 'returned_with_amendments') return 'bill_transmitted';
	if (stage === 'introduced') return 'bill_introduced';
	return 'bill_listed';
}

function normalizeAction(record: PdlSearchRecord, bill: Bill): BillAction {
	const stage = stageForRecord(record.rawTitle);
	return {
		id: `${bill.id}-pdl-action-1`,
		bill_id: bill.id,
		date: record.date,
		house: 'lok-sabha',
		action_type: eventTypeForStage(stage),
		description: `Parliament Digital Library proceeding: ${record.rawTitle}.`,
		source_url: record.url,
		isDemoSeed: false
	};
}

function normalizeTimelineEvent(bill: Bill, action: BillAction): TimelineEvent {
	return {
		id: `${bill.id}-pdl-event-1`,
		date: action.date,
		house: action.house,
		type: action.action_type as TimelineEvent['type'],
		title: action.description.replace(/\.$/, ''),
		description: action.description,
		related_bill_id: bill.id,
		source_url: action.source_url,
		isDemoSeed: false
	};
}

function normalizeSittingDays(actions: BillAction[]): SittingDay[] {
	const seen = new Set<string>();
	const days: SittingDay[] = [];
	for (const action of actions) {
		const key = `${action.house}:${action.date}`;
		if (seen.has(key)) continue;
		seen.add(key);
		days.push({
			id: `pdl-sit-${action.house}-${action.date}`,
			date: action.date,
			house: action.house as House,
			session_name: `PDL historical sitting ${action.date.slice(0, 4)}`,
			status: 'sat',
			isDemoSeed: false
		});
	}
	return days;
}

function uniqueById<T extends { id: string }>(items: T[]) {
	const seen = new Set<string>();
	return items.filter((item) => {
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});
}

async function main() {
	const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, index) => MIN_YEAR + index);
	const recordsByYear = await mapWithConcurrency(
		years,
		YEAR_FETCH_CONCURRENCY,
		async (year) => loadYearRecords(year)
	);
	const records = recordsByYear.flat();
	const assigned = new Map<string, number>();
	const bills = records.map((record) => {
		const baseId = `pdl-${slugify(record.title)}-${record.year}`;
		const count = assigned.get(baseId) ?? 0;
		assigned.set(baseId, count + 1);
		return normalizeBill(record, count === 0 ? baseId : `${baseId}-${count + 1}`);
	});
	const actions = bills.map((bill, index) => normalizeAction(records[index], bill));
	const timelineEvents = actions.map((action, index) => normalizeTimelineEvent(bills[index], action));
	const sittingDays = normalizeSittingDays(actions);

	const file = `/* Generated by scripts/sync-pdl-pre2004-legislation.ts. Do not edit manually. */
import type { Bill, BillAction, SittingDay, TimelineEvent } from '$lib/domain/types';

export const pdlPre2004Meta = ${JSON.stringify(
		{
			asOf: new Date().toISOString().slice(0, 10),
			sourceUrl: `${BASE_URL}/simple-search`,
			minYear: MIN_YEAR,
			maxYear: MAX_YEAR,
			totalSourceRecords: records.length,
			generatedAt: new Date().toISOString()
		},
		null,
		2
	)} as const;

export const pdlPre2004Bills = ${JSON.stringify(uniqueById(bills), null, 2)} satisfies Bill[];

export const pdlPre2004BillActions = ${JSON.stringify(uniqueById(actions), null, 2)} satisfies BillAction[];

export const pdlPre2004SittingDays = ${JSON.stringify(uniqueById(sittingDays), null, 2)} satisfies SittingDay[];

export const pdlPre2004TimelineEvents = ${JSON.stringify(uniqueById(timelineEvents), null, 2)} satisfies TimelineEvent[];
`;

	await mkdir(dirname(OUTPUT_FILE), { recursive: true });
	await writeFile(OUTPUT_FILE, file);
	console.log(`Wrote ${OUTPUT_FILE}`);
	console.log(`Bills: ${bills.length}; actions: ${actions.length}; timeline events: ${timelineEvents.length}; sitting days: ${sittingDays.length}`);
}

await main();
