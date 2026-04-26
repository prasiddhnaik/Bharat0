import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

const date = (value: string) => new Date(`${value}T00:00:00+05:30`);

async function main() {
	await prisma.timelineEvent.deleteMany();
	await prisma.billAction.deleteMany();
	await prisma.act.deleteMany();
	await prisma.question.deleteMany();
	await prisma.committee.deleteMany();
	await prisma.sittingDay.deleteMany();
	await prisma.bill.deleteMany();

	await prisma.bill.createMany({
		data: [
			{
				id: 'bz-bill-public-health-2026',
				title_en: 'Demo Public Health Preparedness Bill, 2026',
				title_hi: 'डेमो लोक स्वास्थ्य तैयारी विधेयक, 2026',
				bill_number: 'Demo Bill No. 18 of 2026',
				bill_year: 2026,
				bill_type: 'ORDINARY',
				origin_house: 'LOK_SABHA',
				current_stage: 'REFERRED_COMMITTEE',
				ministry: 'Ministry of Health and Family Welfare',
				introduced_on: date('2026-07-18'),
				latest_action_date: date('2026-07-20'),
				source_url: 'https://sansad.in/ls/legislation/bills',
				summary: 'Demo ordinary Bill for the first BharatZero prototype.',
				is_demo_seed: true
			},
			{
				id: 'bz-bill-digital-services-2026',
				title_en: 'Demo Digital Public Services Accountability Bill, 2026',
				title_hi: 'डेमो डिजिटल लोक सेवा जवाबदेही विधेयक, 2026',
				bill_number: 'Demo Bill No. 22 of 2026',
				bill_year: 2026,
				bill_type: 'ORDINARY',
				origin_house: 'RAJYA_SABHA',
				current_stage: 'TRANSMITTED_TO_OTHER_HOUSE',
				ministry: 'Ministry of Electronics and Information Technology',
				introduced_on: date('2026-07-15'),
				latest_action_date: date('2026-07-20'),
				source_url: 'https://sansad.in/rs/legislation/bills',
				summary: 'Demo Rajya Sabha-originating ordinary Bill fixture.',
				is_demo_seed: true
			},
			{
				id: 'bz-bill-appropriation-demo-2026',
				title_en: 'Demo Appropriation Bill, 2026',
				title_hi: 'डेमो विनियोग विधेयक, 2026',
				bill_number: 'Demo Money Bill No. 4 of 2026',
				bill_year: 2026,
				bill_type: 'MONEY',
				origin_house: 'LOK_SABHA',
				current_stage: 'RAJYA_SABHA_RECOMMENDATION_PERIOD',
				ministry: 'Ministry of Finance',
				introduced_on: date('2026-07-19'),
				latest_action_date: date('2026-07-20'),
				source_url: 'https://sansad.in/ls/legislation/bills',
				summary: 'Demo Money Bill fixture for Lok Sabha-origin path.',
				is_demo_seed: true
			}
		]
	});

	await prisma.billAction.createMany({
		data: [
			{
				id: 'act-public-health-committee',
				bill_id: 'bz-bill-public-health-2026',
				date: date('2026-07-20'),
				house: 'LOK_SABHA',
				action_type: 'bill_referred_committee',
				description: 'Demo seed: referred to a department-related committee.',
				source_url: 'https://sansad.in/ls/committees',
				is_demo_seed: true
			},
			{
				id: 'act-appropriation-rs-window',
				bill_id: 'bz-bill-appropriation-demo-2026',
				date: date('2026-07-20'),
				house: 'RAJYA_SABHA',
				action_type: 'money_bill_window',
				description: 'Demo seed: Rajya Sabha recommendation period opened.',
				source_url: 'https://sansad.in/rs/legislation/bills',
				is_demo_seed: true
			}
		]
	});

	await prisma.sittingDay.createMany({
		data: [
			{
				id: 'sit-ls-2026-07-20',
				date: date('2026-07-20'),
				house: 'LOK_SABHA',
				session_name: 'Demo Monsoon Session 2026',
				status: 'DEMO',
				is_demo_seed: true
			},
			{
				id: 'sit-rs-2026-07-20',
				date: date('2026-07-20'),
				house: 'RAJYA_SABHA',
				session_name: 'Demo Monsoon Session 2026',
				status: 'DEMO',
				is_demo_seed: true
			}
		]
	});

	await prisma.timelineEvent.createMany({
		data: [
			{
				id: 'evt-health-committee-2026-07-20',
				date: date('2026-07-20'),
				house: 'LOK_SABHA',
				type: 'BILL_REFERRED_COMMITTEE',
				title: 'Health preparedness Bill referred',
				description: 'Demo seed event linking an ordinary Bill to committee workflow.',
				related_bill_id: 'bz-bill-public-health-2026',
				source_url: 'https://sansad.in/ls/committees',
				is_demo_seed: true
			},
			{
				id: 'evt-money-bill-rs-2026-07-20',
				date: date('2026-07-20'),
				house: 'RAJYA_SABHA',
				type: 'BILL_TRANSMITTED',
				title: 'Money Bill recommendation window opened',
				description: 'Demo seed event for Money Bill handling in Rajya Sabha.',
				related_bill_id: 'bz-bill-appropriation-demo-2026',
				source_url: 'https://sansad.in/rs',
				is_demo_seed: true
			}
		]
	});

	console.log('Seeded BharatZero demo data. This is not official live Parliament data.');
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
