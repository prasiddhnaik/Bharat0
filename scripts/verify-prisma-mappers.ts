import assert from 'node:assert/strict';
import {
	fromDomainBillStage,
	fromDomainHouse,
	toDomainBill,
	toDomainBillAction,
	toDomainBillStage,
	toDomainHouse,
	toDomainTimelineEvent
} from '../src/lib/server/repositories/prisma-mappers';

const bill = toDomainBill({
	id: 'official-bill-1',
	title_en: 'Official Test Bill, 2026',
	title_hi: 'आधिकारिक परीक्षण विधेयक, 2026',
	bill_number: 'Bill No. 1 of 2026',
	bill_year: 2026,
	bill_type: 'MONEY',
	origin_house: 'LOK_SABHA',
	current_stage: 'RAJYA_SABHA_RECOMMENDATION_PERIOD',
	ministry: 'Ministry of Finance',
	introduced_on: new Date('2026-07-19T00:00:00+05:30'),
	latest_action_date: new Date('2026-07-20T00:00:00+05:30'),
	source_url: 'https://sansad.in/ls/legislation/bills',
	summary: 'Official source-backed test row.',
	is_demo_seed: false
});

assert.equal(bill.bill_type, 'money');
assert.equal(bill.origin_house, 'lok-sabha');
assert.equal(bill.current_stage, 'rajya_sabha_recommendation_period');
assert.equal(bill.introduced_on, '2026-07-19');
assert.equal(bill.latest_action_date, '2026-07-20');
assert.equal(bill.isDemoSeed, false);

assert.equal(toDomainHouse('RAJYA_SABHA'), 'rajya-sabha');
assert.equal(fromDomainHouse('joint-sitting'), 'JOINT_SITTING');
assert.equal(toDomainBillStage('DEEMED_PASSED_AFTER_14_DAYS'), 'deemed_passed_after_14_days');
assert.equal(fromDomainBillStage('president_assent_pending'), 'PRESIDENT_ASSENT_PENDING');

const action = toDomainBillAction({
	id: 'action-1',
	bill_id: 'official-bill-1',
	date: new Date('2026-07-20T00:00:00+05:30'),
	house: 'RAJYA_SABHA',
	action_type: 'money_bill_window',
	description: 'Money Bill sent to Rajya Sabha.',
	source_url: 'https://sansad.in/rs/legislation/bills',
	is_demo_seed: false
});
assert.equal(action.date, '2026-07-20');
assert.equal(action.house, 'rajya-sabha');
assert.equal(action.action_type, 'money_bill_window');
assert.equal(action.isDemoSeed, false);

const event = toDomainTimelineEvent({
	id: 'event-1',
	date: new Date('2026-07-20T00:00:00+05:30'),
	house: 'LOK_SABHA',
	type: 'BILL_REFERRED_COMMITTEE',
	title: 'Bill referred',
	description: 'Official source-backed test event.',
	related_bill_id: null,
	source_url: 'https://sansad.in/ls/committees',
	is_demo_seed: false
});
assert.equal(event.type, 'bill_referred_committee');
assert.equal(event.related_bill_id, undefined);
assert.equal(event.isDemoSeed, false);

assert.throws(() => toDomainHouse('UNKNOWN_HOUSE'), /Unsupported Prisma House/);
assert.throws(() => toDomainBillStage('UNKNOWN_STAGE'), /Unsupported Prisma BillStage/);

console.log('Prisma mapper contract checks passed.');
