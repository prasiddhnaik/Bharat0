import type { Act, Bill, BillAction, BillStage, BillType, House, TimelineEvent, TimelineEventType } from '../domain/types';

export type SansadBillRecord = {
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
	committeeReferralUrl?: string;
	committeeReportUrl?: string;
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

export type SansadBillsPayload = {
	meta?: {
		total?: number;
		as_of?: string;
		source?: string;
	};
	bills?: SansadBillRecord[];
	records?: SansadBillRecord[];
	_metadata?: {
		currentPageNumber?: number;
		totalElements?: number;
		totalPages?: number;
	};
};

export function matchBillNumber<T extends { id: string; bill_number: string }>(candidates: T[], billNumber: string, preferredId?: string): T | undefined {
	const key = (value: string) => value.toLowerCase().replace(/\s+/g, '');
	const matches = candidates.filter((row) => key(row.bill_number) === key(billNumber));
	if (matches.length > 1) {
		const preferred = matches.find((row) => row.id === preferredId);
		return preferred ?? matches.slice().sort((left, right) => left.id.localeCompare(right.id))[0];
	}
	if (matches.length === 1) return matches[0];
	const legacy = candidates.filter((row) => !/^bill\s+no\./i.test(row.bill_number));
	return legacy.find((row) => row.id === preferredId) ?? legacy.slice().sort((left, right) => left.id.localeCompare(right.id))[0];
}

export async function loadRecentSansadBills(loadPage: (url: string) => Promise<SansadBillsPayload>, since = '2024-06-09') {
	const records: SansadBillRecord[] = [];
	const seenPages = new Set<string>();
	for (let page = 1; page <= 250; page += 1) {
		const url = new URL('https://sansad.in/api_rs/legislation/getBills');
		url.search = new URLSearchParams({ page: String(page), size: '100', locale: 'en', sortOn: 'billIntroducedDate', sortBy: 'desc' }).toString();
		const payload = await loadPage(url.href);
		if (!Number.isInteger(payload._metadata?.totalPages) || payload._metadata!.totalPages! < 1 || payload._metadata?.currentPageNumber !== page) throw new Error(`Invalid official pagination metadata for page ${page}`);
		const rows = payload.records ?? payload.bills ?? [];
		if (!rows.length) throw new Error(`Official source returned an empty page ${page}; refresh is incomplete.`);
		if (payload._metadata?.currentPageNumber && payload._metadata.currentPageNumber !== page) throw new Error(`Official source returned the wrong page for ${page}.`);
		const fingerprint = JSON.stringify(rows);
		if (seenPages.has(fingerprint)) throw new Error(`Official source returned a repeated page ${page}; refresh is incomplete.`);
		seenPages.add(fingerprint);
		for (const row of rows) {
			if (!row.billName?.trim() || !toIsoDate(row.billIntroducedDate)) throw new Error('Official bill has no valid identity or introduction date');
			for (const value of [row.billPassedInLSDate, row.billPassedInRSDate, row.billAssentedDate, row.referredToCommitteeDate, row.reportPresentedDate]) if (value?.trim() && !toIsoDate(value)) throw new Error('Official bill has an invalid action date');
		}
		records.push(...rows.filter((row) => (toIsoDate(row.billIntroducedDate) ?? '') >= since));
		const oldest = rows.map((row) => toIsoDate(row.billIntroducedDate)).filter((date): date is string => Boolean(date)).sort()[0];
		if ((oldest && oldest < since) || page >= (payload._metadata?.totalPages ?? 1)) {
			return { records, pages: page, since, sourceUrl: 'https://sansad.in/ls/legislation/bills' };
		}
	}
	throw new Error('Official source exceeded the page limit; refresh is incomplete.');
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

export function toIsoDate(value: string | null | undefined): string | null {
	if (!value) return null;
	const trimmed = value.trim();
	const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
	const valid = (date: string) => { const parsed = new Date(`${date}T12:00:00Z`); return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null; };
	if (isoMatch) return valid(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`);
	const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
	if (slashMatch) {
		const [, day, month, year] = slashMatch;
		return valid(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
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
	if (record.billGazettedFile) return 'act_published';
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

export function latestDateFor(record: SansadBillRecord): string {
	const stageDates = (record.stages ?? [])
		.map((stage) => toIsoDate(stage[1]))
		.filter((date): date is string => Boolean(date));
	const candidates = [
		toIsoDate(record.billAssentedDate),
		toIsoDate(record.reportPresentedDate),
		toIsoDate(record.referredToCommitteeDate),
		toIsoDate(record.billPassedInRSDate),
		toIsoDate(record.billPassedInLSDate),
		toIsoDate(record.billIntroducedDate),
		...stageDates
	].filter((date): date is string => Boolean(date));
	return candidates.sort().at(-1) ?? `${record.billYear ?? new Date().getFullYear()}-01-01`;
}

export function normalizeBill(record: SansadBillRecord, id = billIdFor(record)): Bill {
	const year = billYearFor(record);
	const title = record.billName.replace(/\s+/g, ' ').trim();
	const category = toBillType(record.billCategory);
	const billNumber = record.billNumber ? `Bill No. ${record.billNumber.trim()} of ${year}` : `Bill of ${year}`;

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

export function billIdFor(record: SansadBillRecord): string {
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

export function normalizeActions(record: SansadBillRecord, bill: Bill): BillAction[] {
	if (!record.stages?.length) {
		const rows: Array<{ date: string | null; type: TimelineEventType; label: string; house: House; url: string | null }> = [
			{ date: record.billIntroducedDate, type: 'bill_introduced', label: 'Introduced', house: bill.origin_house, url: record.billIntroducedFile },
			{ date: record.referredToCommitteeDate, type: 'bill_referred_committee', label: 'Referred to committee', house: bill.origin_house, url: record.committeeReferralUrl ?? record.reportFile },
			{ date: record.reportPresentedDate, type: 'committee_report_tabled', label: 'Committee report presented', house: bill.origin_house, url: record.committeeReportUrl ?? record.reportFile },
			{ date: record.billPassedInLSDate, type: bill.origin_house === 'lok-sabha' ? 'bill_passed_origin_house' : 'bill_passed_second_house', label: 'Passed by Lok Sabha', house: 'lok-sabha', url: record.billPassedInLSFile },
			{ date: record.billPassedInRSDate, type: bill.origin_house === 'rajya-sabha' ? 'bill_passed_origin_house' : 'bill_passed_second_house', label: 'Passed by Rajya Sabha', house: 'rajya-sabha', url: record.billPassedInRSFile },
			{ date: record.billAssentedDate, type: 'bill_assented', label: "Received President's assent", house: bill.origin_house, url: record.billGazettedFile }
		];
		return rows.flatMap((row) => {
			const date = toIsoDate(row.date);
			return date ? [{
				id: `${bill.id}-official-${row.type}-${row.house}-${date}`, bill_id: bill.id,
				date, house: row.house, action_type: row.type, description: `${row.label} for ${bill.title_en}.`,
				source_url: row.url ?? record.billPassedInBothHousesFile ?? bill.source_url, isDemoSeed: false
			}] : [];
		}).sort((left, right) => left.date.localeCompare(right.date));
	}
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

export function normalizeTimelineEvents(record: SansadBillRecord, bill: Bill, actions: BillAction[]): TimelineEvent[] {
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

export function normalizeAct(record: SansadBillRecord, bill: Bill): Act | null {
	if (!record.actNo && !record.actYear && !record.billAssentedDate) return null;
	const year = record.actYear ?? Number(toIsoDate(record.billAssentedDate)?.slice(0, 4)) ?? bill.bill_year;
	return {
		id: `${slugify(bill.title_en.replace(/bill/i, 'act'))}-${year}`,
		title: bill.title_en.replace(/\bBill\b/i, 'Act'),
		act_number: record.actNo ? `Act No. ${record.actNo.trim()} of ${year}` : `Act of ${year}`,
		year,
		linked_bill_id: bill.id,
		india_code_url: record.billGazettedFile ?? record.billPassedInBothHousesFile ?? bill.source_url,
		isDemoSeed: false
	};
}
