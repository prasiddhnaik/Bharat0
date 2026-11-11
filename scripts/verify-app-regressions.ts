import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDashboardData } from '../src/lib/data/view-model';
import { parseDashboardFilters } from '../src/lib/domain/dashboard-filters';
import { isGovernanceReviewStale } from '../src/lib/domain/state-governance';
import { matchesSourceUrl } from '../src/lib/domain/source-filters';

test('Rajya Sabha source filters include the official question document host', () => {
	assert.equal(matchesSourceUrl('https://rsdoc.nic.in/Questions/271/answer.pdf', 'source-rajya-sabha'), true);
	assert.equal(matchesSourceUrl('https://rsdoc.nic.in/Questions/271/answer.pdf', 'rajya-sabha'), true);
	assert.equal(matchesSourceUrl('https://sansad.in/getFile/annex/271/AU2900_3GFNMs.pdf?source=pqars', 'source-rajya-sabha'), true);
});

const filters = parseDashboardFilters(new URLSearchParams());

test('an out-of-range page recovers to the last available page', () => {
	const dashboard = getDashboardData({ ...filters, section: 'bills', page: 99999 });
	assert.equal(dashboard.pagination.page, dashboard.pagination.totalPages);
	assert.ok(dashboard.bills.length > 0);
});

test('invalid calendar dates cannot reach database date filters', () => {
	for (const date of ['bad-date', '2026-02-30', '2026-13-01']) {
		assert.equal(parseDashboardFilters(new URLSearchParams({ date })).date, '');
	}
	assert.equal(parseDashboardFilters(new URLSearchParams({ date: '2026-02-28' })).date, '2026-02-28');
});

test('governance freshness catches overdue, invalid and future reviews', () => {
	const now = new Date('2026-11-11T00:00:00Z');
	assert.equal(isGovernanceReviewStale('2026-11-11', now), false);
	assert.equal(isGovernanceReviewStale('2026-08-01', now), true);
	assert.equal(isGovernanceReviewStale('2027-01-01', now), true);
	assert.equal(isGovernanceReviewStale('invalid', now), true);
});

test('selecting one stage retains other available stage choices', () => {
	const dashboard = getDashboardData({ ...filters, section: 'bills', status: 'introduced' });
	assert.ok(dashboard.stageCounts.some(({ stage }) => stage === 'act_published'));
	assert.ok(dashboard.bills.every((bill) => bill.current_stage === 'introduced'));
});

test('Nehru term excludes modern debates', () => {
	const dashboard = getDashboardData({ ...filters, section: 'debates', primeMinister: 'nehru' });
	assert.equal(dashboard.debates.length, 0);
});

test('overview renders a bounded timeline preview', () => {
	const dashboard = getDashboardData(filters);
	assert.ok(dashboard.timelineEvents.length <= 12);
	assert.ok(dashboard.stats.eventsOnDate > dashboard.timelineEvents.length);
});

test('timeline pagination retains the total while bounding each response', () => {
	const first = getDashboardData({ ...filters, section: 'timeline', pageSize: 3 });
	const second = getDashboardData({ ...filters, section: 'timeline', pageSize: 3, page: 2 });
	assert.equal(first.timelineEvents.length, 3);
	assert.equal(second.timelineEvents.length, 3);
	assert.ok(first.pagination.totalItems > 3);
	assert.notEqual(first.timelineEvents[0]?.id, second.timelineEvents[0]?.id);
});

test('timeline date links retain search, PM, policy, stage and source filters', () => {
	const dashboard = getDashboardData({ ...filters, section: 'timeline', query: 'finance', primeMinister: 'modi-2', area: 'Ministry of Finance', status: 'introduced', source: 'source-sansad' });
	const dateLink = dashboard.timelineDateRail[0];
	assert.ok(dateLink);
	const params = new URL(dateLink.href, 'http://localhost').searchParams;
	assert.equal(params.get('q'), 'finance');
	assert.equal(params.get('pm'), 'modi-2');
	assert.equal(params.get('area'), 'Ministry of Finance');
	assert.equal(params.get('status'), 'introduced');
	assert.equal(params.get('source'), 'source-sansad');
});
