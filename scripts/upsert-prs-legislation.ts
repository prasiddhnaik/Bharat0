import {
	prsBillActions,
	prsBills,
	prsSittingDays,
	prsTimelineEvents
} from '../src/lib/data/generated/prs-legislation';
import { createPrismaClient } from '../src/lib/server/db/prisma';

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
	console.log(`Loaded ${items.length} ${label}.`);
}

async function main() {
	await createManyInChunks(
		'PRS bills',
		prsBills.map((bill) => ({
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
		(data) => prisma.bill.createMany({ data, skipDuplicates: true })
	);

	await createManyInChunks(
		'PRS bill actions',
		prsBillActions.map((action) => ({
			id: action.id,
			bill_id: action.bill_id,
			date: date(action.date),
			house: toPrismaEnum(action.house),
			action_type: action.action_type,
			description: action.description,
			source_url: action.source_url,
			is_demo_seed: action.isDemoSeed
		})),
		(data) => prisma.billAction.createMany({ data, skipDuplicates: true })
	);

	await createManyInChunks(
		'PRS sitting days',
		prsSittingDays.map((sittingDay) => ({
			id: sittingDay.id,
			date: date(sittingDay.date),
			house: toPrismaEnum(sittingDay.house),
			session_name: sittingDay.session_name,
			status: toPrismaEnum(sittingDay.status),
			is_demo_seed: sittingDay.isDemoSeed
		})),
		(data) => prisma.sittingDay.createMany({ data, skipDuplicates: true })
	);

	await createManyInChunks(
		'PRS timeline events',
		prsTimelineEvents.map((event) => ({
			id: event.id,
			date: date(event.date),
			house: toPrismaEnum(event.house),
			type: toPrismaEnum(event.type),
			title: event.title,
			description: event.description,
			related_bill_id: event.related_bill_id,
			source_url: event.source_url,
			is_demo_seed: event.isDemoSeed
		})),
		(data) => prisma.timelineEvent.createMany({ data, skipDuplicates: true })
	);

	console.log('PRS historical legislation upsert complete.');
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
