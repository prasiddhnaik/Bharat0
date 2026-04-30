import assert from 'node:assert/strict';
import { createLegislativeRepository } from '../src/lib/server/repositories/legislative';
import { getActPartyPositions } from '../src/lib/domain/party-positions';

const repository = createLegislativeRepository({ mode: 'seed' });

const dashboard = await repository.getDashboardData({
	section: 'overview',
	house: 'all',
	date: '2026-07-20',
	status: 'all',
	area: 'all',
	source: 'all',
	primeMinister: 'all',
	query: '',
	language: 'en',
	page: 1,
	pageSize: 60
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

const actsDashboard = await repository.getDashboardData({
	section: 'acts',
	house: 'all',
	date: '2026-07-20',
	status: 'all',
	area: 'all',
	source: 'source-india-code',
	primeMinister: 'all',
	query: 'aircraft',
	language: 'en',
	page: 1,
	pageSize: 2
});

assert.ok(actsDashboard.acts.length >= 1, 'expected Acts section to return matching Act records');
assert.ok(actsDashboard.acts.every((act) => act.title.toLowerCase().includes('aircraft') || act.act_number.toLowerCase().includes('aircraft')));
assert.ok(actsDashboard.acts.every((act) => act.india_code_url.toLowerCase().includes('indiacode.nic.in')), 'expected India Code source filter to apply to Acts');
assert.equal(actsDashboard.pagination.pageSize, 2);
assert.ok(actsDashboard.pagination.totalItems >= actsDashboard.acts.length, 'expected Acts pagination total to describe matching Act records');

const tribhuvanDashboard = await repository.getDashboardData({
	section: 'acts',
	house: 'all',
	date: '2026-07-20',
	status: 'all',
	area: 'all',
	source: 'source-india-code',
	primeMinister: 'all',
	query: 'tribhuvan',
	language: 'en',
	page: 1,
	pageSize: 5
});
const tribhuvanAct = tribhuvanDashboard.acts.find((act) => act.id === 'tribhuvan-sahkari-university-act-2025');
assert.ok(tribhuvanAct, 'expected Tribhuvan Act in filtered India Code Act records');
const tribhuvanPositions = getActPartyPositions(tribhuvanAct);
assert.equal(tribhuvanPositions.status, 'captured');
assert.ok(tribhuvanPositions.voteNote.includes('voice vote'), 'expected vote evidence note for party position read');
assert.ok(tribhuvanPositions.positions.some((position) => position.side === 'supported' && position.party.includes('BJP')), 'expected BJP/NDA support position');
assert.ok(tribhuvanPositions.positions.some((position) => position.side === 'opposed' && position.party.includes('Congress')), 'expected Congress objection position');
assert.ok(tribhuvanPositions.positions.some((position) => position.side === 'opposed' && position.party.includes('BJD')), 'expected BJD objection position');

console.log('Repository contract checks passed using seed-backed data access.');
