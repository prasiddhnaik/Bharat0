import {
	dataGovQuestions,
	dataGovTimelineEvents
} from '../src/lib/data/generated/data-gov-questions';
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
	await prisma.timelineEvent.deleteMany({ where: { id: { startsWith: 'data-gov-' } } });
	await prisma.question.deleteMany({ where: { id: { startsWith: 'data-gov-' } } });
	console.log('Cleared previous OGD question/timeline rows.');

	await createManyInChunks(
		'OGD question catalog rows',
		dataGovQuestions.map((question) => ({
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
		(data) => prisma.question.createMany({ data, skipDuplicates: true })
	);

	await createManyInChunks(
		'OGD timeline events',
		dataGovTimelineEvents.map((event) => ({
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

	console.log('OGD question catalog upsert complete.');
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
