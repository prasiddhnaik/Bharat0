import assert from 'node:assert/strict';
import { createLegislativeRepository } from '../src/lib/server/repositories/legislative';

const repository = createLegislativeRepository({ mode: 'seed' });

const dashboard = await repository.getDashboardData({
	section: 'overview',
	house: 'all',
	date: '2026-07-20',
	status: 'all',
	query: '',
	language: 'en'
});

assert.equal(dashboard.dataSource.mode, 'seed');
assert.equal(dashboard.dataSource.isLiveOfficialData, false);
assert.ok(dashboard.bills.length >= 1000, 'expected generated Sansad Bill records');
assert.ok(dashboard.timelineEvents.length >= 1, 'expected seed-backed repository to return timeline events');

const detail = await repository.getBillDetail('finance-bill-2025');
assert.ok(detail, 'expected known official Bill detail');
assert.equal(detail.dataSource.mode, 'seed');
assert.equal(detail.bill.isDemoSeed, false);
assert.ok(detail.actions.length >= 1, 'expected Bill actions for known official Bill');

const missing = await repository.getBillDetail('missing-bill');
assert.equal(missing, null);

console.log('Repository contract checks passed using seed-backed data access.');
