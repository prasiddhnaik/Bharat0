import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import * as cheerio from 'cheerio';
import type { Bill, BillAction, BillStage, BillType, House, SittingDay, TimelineEvent } from '../src/lib/domain/types';

type PrsCurrentSessionRow = {
	title: string;
	introducedOn: string;
	house: House;
	status: string;
};

const SOURCE_URL = 'https://prsindia.org/sessiontrack/budget-session-2026/session-wrap';
const CORROBORATING_SOURCE_URLS = [
	'https://mpa.gov.in/sites/default/files/Press%20release%202026_Final_0.pdf',
	'https://prsindia.org/sessiontrack/budget-session-2026/vital-stats'
];
const OUTPUT_FILE = 'src/lib/data/generated/prs-current-session-legislation.ts';
const STATUS_DATE = '2026-04-17';
const SESSION_NAME = 'Budget Session 2026';
const MINISTRY = 'Ministry of Law and Justice';

const TARGET_TITLES = [
	'The Constitution (One Hundred and Thirty-First Amendment) Bill, 2026 [Delimitation Bills of 2026]',
	'The Union Territories Laws (Amendment) Bill, 2026',
	'The Delimitation Bill, 2026'
];

const FALLBACK_STATUSES: Record<string, string> = {
	'The Delimitation Bill, 2026': 'Rendered infructuous as the related Constitution 131st Amendment Bill was voted down'
};

const REQUEST_HEADERS = {
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'accept-language': 'en-US,en;q=0.9',
	'user-agent': 'BharatZero local PRS current-session sync'
};

function cleanText(value: string) {
	return value.replace(/\s+/g, ' ').trim();
}

function slugify(value: string) {
	return value
		.replace(/\[[^\]]+\]/g, '')
		.trim()
		.replace(/^the\s+/i, '')
		.replace(/,?\s*(19|20)\d{2}\.?$/i, '')
		.replace(/[“”"'.]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 120);
}

function normalizeTitle(value: string) {
	return cleanText(value)
		.replace(/\[[^\]]+\]/g, '')
		.replace(/\.$/, '')
		.trim()
		.toUpperCase();
}

function displayTitle(value: string) {
	return cleanText(value)
		.replace(/\[[^\]]+\]/g, '')
		.replace(/\.$/, '')
		.trim();
}

function parseDateAndHouse(value: string): { date: string; house: House } {
	const match = cleanText(value).match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+(Lok Sabha|Rajya Sabha)$/i);
	if (!match) throw new Error(`Could not parse PRS introduced date/house: ${value}`);
	const [, day, monthName, year, houseName] = match;
	const month = {
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
	}[monthName.toLowerCase()];
	if (!month) throw new Error(`Could not parse PRS month: ${monthName}`);
	return {
		date: `${year}-${month}-${day.padStart(2, '0')}`,
		house: houseName.toLowerCase().includes('rajya') ? 'rajya-sabha' : 'lok-sabha'
	};
}

function billTypeFor(title: string): BillType {
	return title.toLowerCase().includes('constitution') ? 'constitutional-amendment' : 'ordinary';
}

function stageForStatus(_status: string): BillStage {
	return 'withdrawn';
}

function actionSlugFor(status: string) {
	const normalized = status.toLowerCase();
	if (normalized.includes('infructuous')) return 'infructuous';
	if (normalized.includes('voted down')) return 'voted-down';
	return slugify(status).slice(0, 40);
}

function actionTitleFor(title: string, status: string) {
	const shortTitle = displayTitle(title).replace(/^The\s+/i, '').replace(/\s+Bill, 2026$/i, ' Bill');
	if (status.toLowerCase().includes('infructuous')) return `${shortTitle} rendered infructuous`;
	if (status.toLowerCase().includes('voted down')) return `${shortTitle} voted down`;
	return `${shortTitle}: ${status}`;
}

function descriptionFor(title: string, status: string) {
	const normalized = displayTitle(title);
	if (status.toLowerCase().includes('infructuous')) {
		return `PRS records that ${normalized} was rendered infructuous after the related Constitution 131st Amendment Bill was voted down.`;
	}
	if (status.toLowerCase().includes('voted down')) {
		return `PRS records that ${normalized} failed to receive special majority and was voted down in Lok Sabha.`;
	}
	return `PRS records this current-session status for ${normalized}: ${status}.`;
}

async function fetchHtml(url: string) {
	const response = await fetch(url, { headers: REQUEST_HEADERS });
	if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
	return response.text();
}

function extractRows(html: string): PrsCurrentSessionRow[] {
	const $ = cheerio.load(html);
	const targets = new Map(TARGET_TITLES.map((title) => [normalizeTitle(title), title]));
	const rows = new Map<string, PrsCurrentSessionRow>();

	$('table').each((_, table) => {
		$(table).find('tr').each((__, tr) => {
			const cells = $(tr).find('td').map((___, cell) => cleanText($(cell).text())).get();
			if (cells.length < 2) return;
			const canonicalTitle = targets.get(normalizeTitle(cells[0]));
			if (!canonicalTitle) return;
			const parsed = parseDateAndHouse(cells[1]);
			const status = cells[2] || FALLBACK_STATUSES[canonicalTitle] || '';
			if (!status) throw new Error(`PRS row for ${canonicalTitle} did not include a status.`);
			rows.set(normalizeTitle(canonicalTitle), {
				title: canonicalTitle,
				introducedOn: parsed.date,
				house: parsed.house,
				status
			});
		});
	});

	if (rows.size !== TARGET_TITLES.length) {
		const missing = TARGET_TITLES.filter((title) => !rows.has(normalizeTitle(title)));
		throw new Error(`Missing PRS current-session rows: ${missing.join('; ')}`);
	}

	return TARGET_TITLES.map((title) => rows.get(normalizeTitle(title))!);
}

function toBill(row: PrsCurrentSessionRow): Bill {
	const title = normalizeTitle(row.title);
	const titleForSummary = displayTitle(row.title);
	return {
		id: `${slugify(row.title)}-2026`,
		title_en: title,
		title_hi: title,
		bill_number: 'PRS current-session record of 2026',
		bill_year: 2026,
		bill_type: billTypeFor(row.title),
		origin_house: row.house,
		current_stage: stageForStatus(row.status),
		ministry: MINISTRY,
		introduced_on: row.introducedOn,
		latest_action_date: STATUS_DATE,
		source_url: SOURCE_URL,
		summary: `${SESSION_NAME} PRS Session Wrap records that ${titleForSummary} ${row.status.toLowerCase()}.`,
		isDemoSeed: false
	};
}

function toAction(row: PrsCurrentSessionRow, bill: Bill): BillAction {
	const actionSlug = actionSlugFor(row.status);
	return {
		id: `${bill.id}-prs-current-action-${actionSlug}`,
		bill_id: bill.id,
		date: STATUS_DATE,
		house: row.house,
		action_type: 'bill_withdrawn',
		description: descriptionFor(row.title, row.status),
		source_url: SOURCE_URL,
		isDemoSeed: false
	};
}

function toTimelineEvent(row: PrsCurrentSessionRow, bill: Bill, action: BillAction): TimelineEvent {
	const actionSlug = actionSlugFor(row.status);
	return {
		id: `${bill.id}-prs-current-event-${actionSlug}`,
		date: STATUS_DATE,
		house: row.house,
		type: 'bill_withdrawn',
		title: actionTitleFor(row.title, row.status),
		description: action.description,
		related_bill_id: bill.id,
		source_url: SOURCE_URL,
		isDemoSeed: false
	};
}

async function main() {
	const rows = extractRows(await fetchHtml(SOURCE_URL));
	const bills = rows.map(toBill);
	const actions = rows.map((row, index) => toAction(row, bills[index]));
	const timelineEvents = rows.map((row, index) => toTimelineEvent(row, bills[index], actions[index]));
	const sittingDays: SittingDay[] = [
		{
			id: `prs-current-sit-lok-sabha-${STATUS_DATE}`,
			date: STATUS_DATE,
			house: 'lok-sabha',
			session_name: SESSION_NAME,
			status: 'sat',
			isDemoSeed: false
		}
	];

	const file = `/* Generated by scripts/sync-prs-current-session.ts. Do not edit manually. */
import type { Bill, BillAction, SittingDay, TimelineEvent } from '$lib/domain/types';

export const prsCurrentSessionMeta = ${JSON.stringify(
		{
			asOf: new Date().toISOString().slice(0, 10),
			sourceUrl: SOURCE_URL,
			corroboratingSourceUrls: CORROBORATING_SOURCE_URLS,
			statusDate: STATUS_DATE,
			totalSourceRecords: rows.length,
			generatedAt: new Date().toISOString(),
			note: 'Current-session terminal outcomes from PRS Session Wrap. MPA Budget Session 2026 press release and PRS Vital Stats corroborate that the Constitution 131st Amendment Bill lacked the required majority and the two dependent bills were not proceeded with / became infructuous.'
		},
		null,
		2
	)} as const;

export const prsCurrentSessionBills = ${JSON.stringify(bills, null, 2)} satisfies Bill[];

export const prsCurrentSessionBillActions = ${JSON.stringify(actions, null, 2)} satisfies BillAction[];

export const prsCurrentSessionSittingDays = ${JSON.stringify(sittingDays, null, 2)} satisfies SittingDay[];

export const prsCurrentSessionTimelineEvents = ${JSON.stringify(timelineEvents, null, 2)} satisfies TimelineEvent[];
`;

	await mkdir(dirname(OUTPUT_FILE), { recursive: true });
	await writeFile(OUTPUT_FILE, file);
	console.log(`Wrote ${OUTPUT_FILE}`);
	console.log(`PRS current-session deltas: bills=${bills.length}; actions=${actions.length}; timelineEvents=${timelineEvents.length}; sittingDays=${sittingDays.length}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
