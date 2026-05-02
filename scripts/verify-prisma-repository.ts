import assert from 'node:assert/strict';
import { createLegislativeRepository } from '../src/lib/server/repositories/legislative';

const billCountWhereClauses: unknown[] = [];

const fakePrisma = {
	bill: {
		async count(args?: { where?: unknown }) {
			billCountWhereClauses.push(args?.where ?? {});
			return 1;
		},
		async groupBy({ by }: { by: string[] }) {
			if (by.includes('current_stage')) {
				return [{ current_stage: 'REFERRED_COMMITTEE', _count: { _all: 1 } }];
			}
			if (by.includes('ministry')) {
				return [{ ministry: 'Ministry of Law and Justice', _count: { _all: 1 } }];
			}
			return [];
		},
		async findMany() {
			return [
				{
					id: 'official-bill-1',
					title_en: 'Official Test Bill, 2026',
					title_hi: 'आधिकारिक परीक्षण विधेयक, 2026',
					bill_number: 'Bill No. 1 of 2026',
					bill_year: 2026,
					bill_type: 'ORDINARY',
					origin_house: 'LOK_SABHA',
					current_stage: 'REFERRED_COMMITTEE',
					ministry: 'Ministry of Law and Justice',
					introduced_on: new Date('2026-07-18T00:00:00+05:30'),
					latest_action_date: new Date('2026-07-20T00:00:00+05:30'),
					source_url: 'https://sansad.in/ls/legislation/bills',
					summary: 'Database-backed test Bill row.',
					is_demo_seed: false
				}
			];
		},
		async findUnique({ where }: { where: { id: string } }) {
			if (where.id !== 'official-bill-1') return null;
			return {
				id: 'official-bill-1',
				title_en: 'Official Test Bill, 2026',
				title_hi: 'आधिकारिक परीक्षण विधेयक, 2026',
				bill_number: 'Bill No. 1 of 2026',
				bill_year: 2026,
				bill_type: 'ORDINARY',
				origin_house: 'LOK_SABHA',
				current_stage: 'REFERRED_COMMITTEE',
				ministry: 'Ministry of Law and Justice',
				introduced_on: new Date('2026-07-18T00:00:00+05:30'),
				latest_action_date: new Date('2026-07-20T00:00:00+05:30'),
				source_url: 'https://sansad.in/ls/legislation/bills',
				summary: 'Database-backed test Bill row.',
				is_demo_seed: false
			};
		}
	},
	billAction: {
		async findMany() {
			return [
				{
					id: 'official-action-1',
					bill_id: 'official-bill-1',
					date: new Date('2026-07-20T00:00:00+05:30'),
					house: 'LOK_SABHA',
					action_type: 'bill_referred_committee',
					description: 'Official test action row.',
					source_url: 'https://sansad.in/ls/committees',
					is_demo_seed: false
				}
			];
		}
	},
	timelineEvent: {
		async findMany() {
			return [
				{
					id: 'official-event-1',
					date: new Date('2026-07-20T00:00:00+05:30'),
					house: 'LOK_SABHA',
					type: 'BILL_REFERRED_COMMITTEE',
					title: 'Official Bill referred',
					description: 'Database-backed test event row.',
					related_bill_id: 'official-bill-1',
					source_url: 'https://sansad.in/ls/committees',
					is_demo_seed: false
				}
			];
		}
	},
	sittingDay: { async findMany() { return []; } },
	committee: { async findMany() { return []; } },
	question: { async findMany() { return []; } },
	act: {
		async count({ where }: { where: unknown }) {
			const serializedWhere = JSON.stringify(where);
			return serializedWhere.includes('aircraft') && serializedWhere.includes('india_code_url') ? 1 : 0;
		},
		async findMany({ where, take }: { where: unknown; take?: number }) {
			const serializedWhere = JSON.stringify(where);
			if (!serializedWhere.includes('aircraft') || !serializedWhere.includes('india_code_url') || take !== 1) return [];
			return [
				{
					id: 'official-act-1',
					title: 'Official Aircraft Act, 2026',
					act_number: 'Act No. 2 of 2026',
					year: 2026,
					linked_bill_id: 'official-bill-1',
					india_code_url: 'https://www.indiacode.nic.in/bitstream/official-aircraft-act.pdf',
					is_demo_seed: false
				}
			];
		}
	}
};

const repository = createLegislativeRepository({ mode: 'prisma', prisma: fakePrisma });
const dashboard = await repository.getDashboardData({
	section: 'bills',
	house: 'lok-sabha',
	date: '2026-07-20',
	status: 'referred_committee',
	area: 'all',
	source: 'all',
	primeMinister: 'all',
	query: 'official',
	language: 'en',
	page: 1,
	pageSize: 60
});

assert.equal(dashboard.dataSource.mode, 'prisma');
assert.equal(dashboard.bills[0]?.id, 'official-bill-1');
assert.equal(dashboard.bills[0]?.isDemoSeed, false);
assert.equal(dashboard.stats.billsTracked, 1);
const primeMinisterCountWhereClauses = billCountWhereClauses.filter(
	(where): where is Record<string, unknown> => Boolean(where) && typeof where === 'object' && Object.hasOwn(where, 'introduced_on')
);
assert.ok(primeMinisterCountWhereClauses.length > 0, 'expected Prisma repository to count Prime Minister term ranges');
assert.ok(
	primeMinisterCountWhereClauses.every((where) => {
		const keys = Object.keys(where);
		return keys.length === 1 && keys[0] === 'introduced_on';
	}),
	'expected Prime Minister history counts to ignore active House, stage, source, and search filters'
);

const detail = await repository.getBillDetail('official-bill-1');
assert.ok(detail);
assert.equal(detail.bill.current_stage, 'referred_committee');
assert.equal(detail.actions[0]?.description, 'Official test action row.');

const relatedEvents = await repository.getTimelineEventsForBill('official-bill-1');
assert.equal(relatedEvents[0]?.related_bill_id, 'official-bill-1');

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
	pageSize: 1
});

assert.equal(actsDashboard.acts[0]?.id, 'official-act-1');
assert.equal(actsDashboard.pagination.totalItems, 1);
assert.equal(actsDashboard.pagination.totalPages, 1);

assert.equal(
	Object.hasOwn(fakePrisma, 'debate'),
	false,
	'debate records are curated fallback data until a Debate model is added to schema.prisma'
);

const curatedDebatesDashboard = await repository.getDashboardData({
	section: 'debates',
	house: 'all',
	date: '2026-07-20',
	status: 'all',
	area: 'all',
	source: 'all',
	primeMinister: 'all',
	query: 'tribhuvan',
	language: 'en',
	page: 1,
	pageSize: 10
});

assert.equal(curatedDebatesDashboard.dataSource.mode, 'prisma');
assert.ok(curatedDebatesDashboard.debates.length >= 1, 'expected Prisma-mode repository to expose curated debate fallback records');
assert.ok(
	curatedDebatesDashboard.debates.some((debate) => debate.title.includes('Tribhuvan Sahkari University Bill')),
	'expected curated debate fallback query to match Tribhuvan debate'
);

const allDebatesDashboard = await repository.getDashboardData({
	section: 'debates',
	house: 'all',
	date: '2026-07-20',
	status: 'all',
	area: 'all',
	source: 'all',
	primeMinister: 'all',
	query: '',
	language: 'en',
	page: 1,
	pageSize: 10
});

assert.equal(allDebatesDashboard.pagination.totalItems, allDebatesDashboard.debates.length, 'expected Debates pagination total to describe debate records');

console.log('Prisma repository contract checks passed using a fake Prisma client.');
