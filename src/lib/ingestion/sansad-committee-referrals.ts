import { toIsoDate, type SansadBillRecord } from './sansad-bills';

export const committeeReferralSource = 'https://sansad.in/ls/committee/subjects-reports';
export type CommitteeReferral = { billName: string; billNumber: number; billYear: number; committeeName: string; dateRef: string; remarks?: string | null };
type ReferralPayload = { metaDataDto?: { currentPageNumber: number; totalElements: number; totalPages: number }; billsReferredDtoList?: CommitteeReferral[] };
const titleKey = (value: string) => value.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '');

function reportDateFor(row: CommitteeReferral) {
	if (!row.remarks || !/report.*presented/i.test(row.remarks)) return null;
	const match = /^The Report of the Committee was presented to Lok Sabha and laid in Rajya Sabha on (\d{1,2}) ([a-z]+), (\d{4})\.$/i.exec(row.remarks.trim());
	const month = match ? 'january february march april may june july august september october november december'.split(' ').indexOf(match[2].toLowerCase()) + 1 : 0;
	const date = match && month ? toIsoDate(`${match[3]}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}`) : null;
	if (!date || date < toIsoDate(row.dateRef)!) throw new Error('Unrecognized committee report date; retain prior data');
	return date;
}

export async function loadCommitteeReferrals(loadPage: (url: string) => Promise<ReferralPayload>) {
	const records: CommitteeReferral[] = [];
	const seen = new Set<string>();
	let expected: number | undefined;
	for (let page = 1; page <= 100; page++) {
		const url = new URL('https://sansad.in/api_ls/committee/billsReferred');
		url.search = new URLSearchParams({ loksabha: '18', committeeCode: '', page: String(page), size: '100', sortOn: 'dateRef', sortBy: 'desc', locale: 'en' }).toString();
		const payload = await loadPage(url.href);
		const meta = payload.metaDataDto;
		if (!meta || meta.currentPageNumber !== page || !Number.isInteger(meta.totalElements) || meta.totalElements < 1 || !Number.isInteger(meta.totalPages) || meta.totalPages < page || (expected !== undefined && expected !== meta.totalElements)) throw new Error('Invalid committee referral pagination');
		expected = meta.totalElements;
		if (!Array.isArray(payload.billsReferredDtoList) || !payload.billsReferredDtoList.length) throw new Error('Empty committee referral page');
		for (const row of payload.billsReferredDtoList) {
			if (!row?.billName?.trim() || !row.committeeName?.trim() || !Number.isInteger(row.billNumber) || row.billNumber < 1 || !Number.isInteger(row.billYear) || row.billYear < 1900 || !toIsoDate(row.dateRef)) throw new Error('Invalid committee referral identity or date');
			reportDateFor(row);
			const key = `${row.billYear}:${row.billNumber}:${titleKey(row.billName)}:${row.dateRef}:${row.committeeName}`;
			if (seen.has(key)) throw new Error('Repeated committee referral record');
			seen.add(key);
			records.push(row);
		}
		if (page === meta.totalPages) {
			if (records.length !== expected) throw new Error('Incomplete committee referral snapshot');
			return { records, pages: page, sourceUrl: committeeReferralSource };
		}
	}
	throw new Error('Committee referrals exceeded page limit');
}

export function applyCommitteeReferrals(records: SansadBillRecord[], referrals: CommitteeReferral[]): SansadBillRecord[] {
	return records.map((bill) => {
		if (bill.billIntroducedInHouse?.toLowerCase() !== 'lok sabha') return bill;
		const matches = referrals.filter((row) => row.billNumber === Number(bill.billNumber) && row.billYear === bill.billYear && titleKey(row.billName) === titleKey(bill.billName));
		const date = matches.map((row) => toIsoDate(row.dateRef)).filter((value): value is string => Boolean(value)).sort().at(-1);
		if (!date) return bill;
		if (date < (toIsoDate(bill.billIntroducedDate) ?? '')) throw new Error('Committee referral predates bill introduction');
		const reportDate = matches.map(reportDateFor).filter((value): value is string => Boolean(value)).sort().at(-1);
		const changes = {
			...(date > (toIsoDate(bill.referredToCommitteeDate) ?? '') ? { referredToCommitteeDate: date, committeeReferralUrl: committeeReferralSource } : {}),
			...(reportDate && reportDate > (toIsoDate(bill.reportPresentedDate) ?? '') ? { reportPresentedDate: reportDate, committeeReportUrl: committeeReferralSource } : {})
		};
		return Object.keys(changes).length ? { ...bill, ...changes } : bill;
	});
}
