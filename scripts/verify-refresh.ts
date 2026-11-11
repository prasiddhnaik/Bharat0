import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeActions, normalizeAct, normalizeBill, type SansadBillRecord } from '../src/lib/ingestion/sansad-bills';
import * as sansad from '../src/lib/ingestion/sansad-bills';
import { normalizeParliamentDebate } from '../src/lib/ingestion/sansad-debates';

const record: SansadBillRecord = {
	billNumber: '155', billName: 'THE KERALA (ALTERATION OF NAME) BILL, 2026',
	billType: 'Government', billCategory: 'Ordinary Bill', ministryName: 'HOME AFFAIRS', billYear: 2026,
	billIntroducedInHouse: 'Lok Sabha', billIntroducedBy: null, billIntroducedDate: '2026-08-10 00:00:00.0',
	billIntroducedFile: 'https://sansad.in/introduction.pdf', billPassedInLSDate: '2026-08-11 00:00:00.0',
	billPassedInLSFile: 'https://sansad.in/ls-passed.pdf', billPassedInRSDate: '2026-08-12 00:00:00.0',
	billPassedInRSFile: null, billPassedInBothHousesFile: 'https://sansad.in/both-passed.pdf',
	errataFile: null, referredToCommitteeDate: null, reportPresentedDate: null, reportFile: null,
	actNo: '18 ', actYear: 2026, billAssentedDate: '14/08/2026', billGazettedFile: null,
	billSynopsisFile: null, status: 'Passed'
};

test('an Act number and assent date do not imply a captured Gazette publication', () => {
	const bill = normalizeBill(record);
	assert.equal(bill.current_stage, 'assented');
	assert.equal(bill.latest_action_date, '2026-08-14');
});

test('official date fields produce introduction, both passages and assent with their own source links', () => {
	const actions = normalizeActions(record, normalizeBill(record));
	assert.deepEqual(actions.map(({ date, action_type, house }) => [date, action_type, house]), [
		['2026-08-10', 'bill_introduced', 'lok-sabha'],
		['2026-08-11', 'bill_passed_origin_house', 'lok-sabha'],
		['2026-08-12', 'bill_passed_second_house', 'rajya-sabha'],
		['2026-08-14', 'bill_assented', 'lok-sabha']
	]);
	assert.equal(actions[0].source_url, 'https://sansad.in/introduction.pdf');
	assert.equal(actions[1].source_url, 'https://sansad.in/ls-passed.pdf');
});

test('an Act record preserves its official number without source whitespace', () => {
	assert.equal(normalizeAct(record, normalizeBill(record))?.act_number, 'Act No. 18 of 2026');
});

test('same-title bills introduced together are matched by official bill number on rerun', () => {
	const candidates = [{ id: 'base', bill_number: 'Bill No. 146 of 2024' }, { id: 'base-148', bill_number: 'Bill No. 148 of 2024' }];
	assert.equal(sansad.matchBillNumber(candidates, 'Bill No. 148 of 2024')?.id, 'base-148');
	assert.equal(sansad.matchBillNumber(candidates, 'Bill No. 149 of 2024'), undefined);
	assert.equal(sansad.matchBillNumber(candidates.slice(0, 1), 'Bill No. 148 of 2024'), undefined);
	assert.equal(sansad.matchBillNumber([{ id: 'old-copy', bill_number: 'Act No. 30 of 2025' }, { id: 'canonical', bill_number: 'Act No. 30 of 2025' }], 'Bill No. 104 of 2025', 'canonical')?.id, 'canonical');
});

test('source pagination advances its page parameter and rejects repeated pages', async () => {
	assert.equal(typeof sansad.loadRecentSansadBills, 'function', 'a checked paginator must replace the insert-only sync loop');
	const requested: number[] = [];
	const result = await sansad.loadRecentSansadBills(async (url: string) => {
		const page = Number(new URL(url).searchParams.get('page'));
		requested.push(page);
		return { _metadata: { currentPageNumber: page, totalPages: 2 }, records: [{ ...record, billNumber: String(page), billName: `Example ${page} Bill, 2026` }] };
	});
	assert.deepEqual(requested, [1, 2]);
	assert.equal(result.records.length, 2);
	await assert.rejects(() => sansad.loadRecentSansadBills(async (url) => ({ _metadata: { currentPageNumber: Number(new URL(url).searchParams.get('page')), totalPages: 2 }, records: [record] })), /repeated page/i);
});

test('missing pagination metadata and impossible source dates fail closed', async () => {
	await assert.rejects(() => sansad.loadRecentSansadBills(async () => ({ records: [record] })), /pagination/i);
	assert.equal(sansad.toIsoDate('2026-02-30'), null);
	await assert.rejects(() => sansad.loadRecentSansadBills(async () => ({ _metadata: { currentPageNumber: 1, totalPages: 1 }, records: [{ ...record, billAssentedDate: '30/02/2026' }] })), /date/i);
});

test('debate index imports preserve the proceeding date and do not invent transcript content', () => {
	const debate = normalizeParliamentDebate({ id: 'official-id', name: 'Example Bill - passed', handle: '123/456', metadata: {
		'dc.date.issued': [{ value: '2026-08-12' }], 'dc.date.accessioned': [{ value: '2026-09-18' }],
		'dc.contributor.members': [{ value: 'Member One' }], 'dc.identifier.sessionnumber': [{ value: 'VIII' }]
	} });
	assert.equal(debate.date, '2026-08-12');
	assert.deepEqual(debate.members, ['Member One']);
	assert.equal(debate.source_url, 'https://elibrary.sansad.in/handle/123/456');
	assert.equal(debate.transcript_url, undefined);
	assert.match(debate.summary, /index entry/i);
	assert.throws(() => normalizeParliamentDebate({ id: 'bad', name: 'Missing date', handle: '123/456', metadata: {} }), /date/i);
});
