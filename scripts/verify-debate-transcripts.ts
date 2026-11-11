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
	assert.ok(dashboard.pagination.totalItems >= 1, 'refreshed index may include introduction and passage proceedings');
	const curated = dashboard.debates.find((debate) => debate.id === 'debate-tribhuvan-bill-passed');
	assert.ok(curated, 'curated passage record and its transcript link must survive refresh');
	assert.ok(curated.members.length > 0);
	assert.equal(curated.isDemoSeed, false);
	const identities = dashboard.debates.map((debate) => `${debate.date}:${debate.title.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '')}`);
	assert.equal(new Set(identities).size, identities.length, 'new index entries must not duplicate curated proceedings');

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
