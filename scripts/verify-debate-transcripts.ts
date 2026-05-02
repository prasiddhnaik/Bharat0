import assert from 'node:assert/strict';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { createLegislativeRepository } from '../src/lib/server/repositories/legislative';
import { assertEnv } from './lib/envCheck';
import { makeLogger } from './lib/logger';

const log = makeLogger('VERIFY-DEBATES');
assertEnv(['DATABASE_URL'], log);
const prisma = createPrismaClient();

async function main() {
	const repository = createLegislativeRepository({ mode: 'prisma', prisma });
	const dashboard = await repository.getDashboardData({
		section: 'debates',
		house: 'all',
		date: '2099-12-31',
		status: 'all',
		area: 'all',
		source: 'all',
		primeMinister: 'all',
		query: 'tribhuvan',
		language: 'en',
		page: 1,
		pageSize: 10
	});

	assert.equal(dashboard.dataSource.mode, 'prisma');
	assert.equal(dashboard.pagination.totalItems, 1);
	assert.equal(dashboard.debates[0]?.id, 'debate-tribhuvan-bill-passed');
	assert.equal(dashboard.debates[0]?.members.length > 0, true);
	assert.equal(dashboard.debates[0]?.isDemoSeed, false);

	const transcript = await prisma.debateTranscript.findUnique({
		where: { debate_id: 'debate-tribhuvan-bill-passed' }
	});

	assert.ok(transcript, 'expected transcript metadata row for Tribhuvan debate');
	assert.equal(transcript.status, 'METADATA_ONLY');
	assert.equal(transcript.text, '');
	assert.equal(transcript.char_count, 0);

	console.log('Debate transcript checks passed.');
}

main()
	.catch((error) => {
		log.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
