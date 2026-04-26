import assert from 'node:assert/strict';
import { createLegislativeRepository } from '../src/lib/server/repositories/legislative';

const fakePrisma = {
	bill: {
		async count() {
			return 1;
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
	act: { async findMany() { return []; } }
};

const repository = createLegislativeRepository({ mode: 'prisma', prisma: fakePrisma });
const dashboard = await repository.getDashboardData({
	section: 'bills',
	house: 'lok-sabha',
	date: '2026-07-20',
	status: 'referred_committee',
	query: 'official',
	language: 'en'
});

assert.equal(dashboard.dataSource.mode, 'prisma');
assert.equal(dashboard.bills[0]?.id, 'official-bill-1');
assert.equal(dashboard.bills[0]?.isDemoSeed, false);
assert.equal(dashboard.timelineEvents[0]?.date, '2026-07-20');
assert.equal(dashboard.stats.billsTracked, 1);

const detail = await repository.getBillDetail('official-bill-1');
assert.ok(detail);
assert.equal(detail.bill.current_stage, 'referred_committee');
assert.equal(detail.actions[0]?.description, 'Official test action row.');

const relatedEvents = await repository.getTimelineEventsForBill('official-bill-1');
assert.equal(relatedEvents[0]?.related_bill_id, 'official-bill-1');

console.log('Prisma repository contract checks passed using a fake Prisma client.');
