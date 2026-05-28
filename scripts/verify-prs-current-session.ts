import assert from 'node:assert/strict';
import {
	prsCurrentSessionBillActions,
	prsCurrentSessionBills,
	prsCurrentSessionMeta,
	prsCurrentSessionTimelineEvents
} from '../src/lib/data/generated/prs-current-session-legislation';
import { makeLogger } from './lib/logger';

const log = makeLogger('VERIFY-PRS-CURRENT');

const expectedIds = new Set([
	'constitution-one-hundred-and-thirty-first-amendment-bill-2026',
	'union-territories-laws-amendment-bill-2026',
	'delimitation-bill-2026'
]);

assert.equal(prsCurrentSessionMeta.statusDate, '2026-04-17', 'PRS current-session status date should cover the April 17, 2026 Lok Sabha outcomes');
assert.equal(prsCurrentSessionBills.length, 3, 'expected three PRS current-session delta bills');
assert.equal(prsCurrentSessionBillActions.length, 3, 'expected three PRS current-session delta actions');
assert.equal(prsCurrentSessionTimelineEvents.length, 3, 'expected three PRS current-session delta timeline events');

for (const bill of prsCurrentSessionBills) {
	assert.ok(expectedIds.has(bill.id), `unexpected PRS current-session bill id: ${bill.id}`);
	assert.equal(bill.introduced_on, '2026-04-16', `${bill.id} should retain its introduction date`);
	assert.equal(bill.latest_action_date, '2026-04-17', `${bill.id} should use the PRS terminal status date`);
	assert.equal(bill.current_stage, 'withdrawn', `${bill.id} should map terminal non-passage/infructuous status to withdrawn`);
	assert.equal(bill.source_url, prsCurrentSessionMeta.sourceUrl, `${bill.id} should point to the PRS Session Wrap source`);
}

for (const action of prsCurrentSessionBillActions) {
	assert.ok(expectedIds.has(action.bill_id), `unexpected PRS current-session action bill id: ${action.bill_id}`);
	assert.equal(action.date, '2026-04-17', `${action.id} should use the PRS terminal status date`);
	assert.equal(action.action_type, 'bill_withdrawn', `${action.id} should use terminal action type`);
	assert.match(action.description, /PRS records|PRS lists/, `${action.id} should preserve PRS evidence wording`);
}

for (const event of prsCurrentSessionTimelineEvents) {
	assert.ok(event.related_bill_id && expectedIds.has(event.related_bill_id), `unexpected PRS current-session event bill id: ${event.related_bill_id}`);
	assert.equal(event.date, '2026-04-17', `${event.id} should use the PRS terminal status date`);
	assert.equal(event.type, 'bill_withdrawn', `${event.id} should use terminal event type`);
}

log.info(`PRS current-session checks passed: bills=${prsCurrentSessionBills.length}, actions=${prsCurrentSessionBillActions.length}, timelineEvents=${prsCurrentSessionTimelineEvents.length}.`);
