import assert from 'node:assert/strict';
import { getDashboardData } from '../src/lib/data/view-model';
import type { DashboardFilters } from '../src/lib/domain/dashboard-filters';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { assertEnv } from './lib/envCheck';
import { makeLogger } from './lib/logger';

const baseFilters: DashboardFilters = {
	section: 'houses',
	house: 'all',
	date: '2026-04-25',
	status: 'all',
	area: 'all',
	source: 'all',
	primeMinister: 'nehru',
	query: '',
	language: 'en',
	page: 1,
	pageSize: 60
};

const log = makeLogger('VERIFY-OLDER-PM');

function seedCountFor(termId: string) {
	const dashboard = getDashboardData({ ...baseFilters, primeMinister: termId as DashboardFilters['primeMinister'] });
	return dashboard.primeMinisterCounts.find((term) => term.id === termId)?.count ?? 0;
}

const expectedSeedCoverage = [
	['nehru', 'Nehru founding-period coverage'],
	['nanda-1', 'Nanda 1964 acting-term coverage'],
	['lal-bahadur-shastri', 'Shastri term coverage'],
	['indira-gandhi-1', 'Indira Gandhi first-premiership coverage']
] as const;

for (const [termId, label] of expectedSeedCoverage) {
	assert.ok(seedCountFor(termId) > 0, `${label} should have at least one PDL bill/proceeding record`);
}

assertEnv(['DATABASE_URL'], log);
const prisma = createPrismaClient();

try {
	const [nehruCount, shastriCount, nanda1964Count] = await Promise.all([
		prisma.bill.count({
			where: {
				introduced_on: {
					gte: new Date('1947-08-15T00:00:00.000Z'),
					lt: new Date('1964-05-27T00:00:00.000Z')
				}
			}
		}),
		prisma.bill.count({
			where: {
				introduced_on: {
					gte: new Date('1964-06-09T00:00:00.000Z'),
					lt: new Date('1966-01-11T00:00:00.000Z')
				}
			}
		}),
		prisma.bill.count({
			where: {
				introduced_on: {
					gte: new Date('1964-05-27T00:00:00.000Z'),
					lt: new Date('1964-06-09T00:00:00.000Z')
				}
			}
		})
	]);

	assert.ok(nehruCount > 0, 'Neon should contain Nehru-period PDL bill/proceeding records');
	assert.ok(shastriCount > 0, 'Neon should contain Shastri-period PDL bill/proceeding records');
	assert.ok(nanda1964Count > 0, 'Neon should contain Nanda 1964 acting-term PDL bill/proceeding records');
} finally {
	await prisma.$disconnect();
}

console.log('Older Prime Minister historical coverage checks passed.');
