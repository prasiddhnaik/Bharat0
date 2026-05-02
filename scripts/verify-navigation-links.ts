import assert from 'node:assert/strict';
import { hrefForSection } from '../src/lib/domain/navigation-links';
import type { DashboardFilters } from '../src/lib/domain/dashboard-filters';

const baseFilters: DashboardFilters = {
	section: 'houses',
	house: 'all',
	date: '2026-04-25',
	status: 'all',
	area: 'all',
	source: 'all',
	primeMinister: 'manmohan-singh-1',
	query: '',
	language: 'en',
	page: 1,
	pageSize: 60
};

assert.equal(
	hrefForSection(baseFilters, 'bills'),
	'/?section=bills&lang=en&page=1&pageSize=60&pm=manmohan-singh-1&date=2026-04-25',
	'section links should preserve the selected prime minister filter'
);

assert.equal(
	hrefForSection({ ...baseFilters, primeMinister: 'all' }, 'timeline'),
	'/?section=timeline&lang=en&page=1&pageSize=60&date=2026-04-25',
	'the all-prime-ministers default should not add pm=all'
);

console.log('Navigation link checks passed.');
