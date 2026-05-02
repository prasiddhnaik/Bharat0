import {
	acts,
	billActions,
	bills,
	committees,
	questions,
	sittingDays,
	timelineEvents
} from '../src/lib/data/seed';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { assertEnv } from '../scripts/lib/envCheck';
import { makeLogger } from '../scripts/lib/logger';

const log = makeLogger('DB-SEED');
assertEnv(['DATABASE_URL'], log);
const prisma = createPrismaClient();
const date = (value: string) => new Date(`${value}T00:00:00+05:30`);

function toPrismaEnum(value: string): string {
	return value.replaceAll('-', '_').toUpperCase();
}

async function createManyInChunks<T>(
	label: string,
	items: T[],
	createMany: (data: T[]) => Promise<unknown>,
	chunkSize = 500
) {
	for (let index = 0; index < items.length; index += chunkSize) {
		await createMany(items.slice(index, index + chunkSize));
	}
	console.log(`Seeded ${items.length} ${label}.`);
}

function uniqueBy<T>(items: T[], keyFor: (item: T) => string): T[] {
	const seen = new Set<string>();
	return items.filter((item) => {
		const key = keyFor(item);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

async function main() {
	await prisma.timelineEvent.deleteMany();
	await prisma.billAction.deleteMany();
	await prisma.act.deleteMany();
	await prisma.question.deleteMany();
	await prisma.committee.deleteMany();
	await prisma.sittingDay.deleteMany();
	await prisma.bill.deleteMany();

	const billIds = new Set(bills.map((bill) => bill.id));

	await createManyInChunks(
		'bills',
		bills.map((bill) => ({
			id: bill.id,
			title_en: bill.title_en,
			title_hi: bill.title_hi,
			bill_number: bill.bill_number,
			bill_year: bill.bill_year,
			bill_type: toPrismaEnum(bill.bill_type),
			origin_house: toPrismaEnum(bill.origin_house),
			current_stage: toPrismaEnum(bill.current_stage),
			ministry: bill.ministry,
			introduced_on: date(bill.introduced_on),
			latest_action_date: date(bill.latest_action_date),
			source_url: bill.source_url,
			summary: bill.summary,
			is_demo_seed: bill.isDemoSeed
		})),
		(data) => prisma.bill.createMany({ data })
	);

	await createManyInChunks(
		'bill actions',
		billActions
			.filter((action) => billIds.has(action.bill_id))
			.map((action) => ({
				id: action.id,
				bill_id: action.bill_id,
				date: date(action.date),
				house: toPrismaEnum(action.house),
				action_type: action.action_type,
				description: action.description,
				source_url: action.source_url,
				is_demo_seed: action.isDemoSeed
			})),
		(data) => prisma.billAction.createMany({ data })
	);

	await createManyInChunks(
		'sitting days',
		uniqueBy(sittingDays, (sittingDay) => `${sittingDay.date}:${sittingDay.house}`).map(
			(sittingDay) => ({
				id: sittingDay.id,
				date: date(sittingDay.date),
				house: toPrismaEnum(sittingDay.house),
				session_name: sittingDay.session_name,
				status: toPrismaEnum(sittingDay.status),
				is_demo_seed: sittingDay.isDemoSeed
			})
		),
		(data) => prisma.sittingDay.createMany({ data })
	);

	await createManyInChunks(
		'timeline events',
		timelineEvents.map((event) => ({
			id: event.id,
			date: date(event.date),
			house: toPrismaEnum(event.house),
			type: toPrismaEnum(event.type),
			title: event.title,
			description: event.description,
			related_bill_id: event.related_bill_id && billIds.has(event.related_bill_id) ? event.related_bill_id : null,
			source_url: event.source_url,
			is_demo_seed: event.isDemoSeed
		})),
		(data) => prisma.timelineEvent.createMany({ data })
	);

	await createManyInChunks(
		'committees',
		committees.map((committee) => ({
			id: committee.id,
			name: committee.name,
			house: toPrismaEnum(committee.house),
			type: toPrismaEnum(committee.type),
			source_url: committee.source_url,
			is_demo_seed: committee.isDemoSeed
		})),
		(data) => prisma.committee.createMany({ data })
	);

	await createManyInChunks(
		'questions',
		questions.map((question) => ({
			id: question.id,
			number: question.number,
			house: toPrismaEnum(question.house),
			date: date(question.date),
			ministry: question.ministry,
			subject: question.subject,
			answer_status: toPrismaEnum(question.answer_status),
			source_url: question.source_url,
			is_demo_seed: question.isDemoSeed
		})),
		(data) => prisma.question.createMany({ data })
	);

	await createManyInChunks(
		'acts',
		acts
			.filter((act) => billIds.has(act.linked_bill_id))
			.map((act) => ({
				id: act.id,
				title: act.title,
				act_number: act.act_number,
				year: act.year,
				linked_bill_id: act.linked_bill_id,
				india_code_url: act.india_code_url,
				is_demo_seed: act.isDemoSeed
			})),
		(data) => prisma.act.createMany({ data })
	);

	console.log('BharatZero database seed complete.');
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
