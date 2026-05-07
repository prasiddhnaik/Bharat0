import { dataGovDebates } from '../src/lib/data/generated/data-gov-questions';
import { manualDebates } from '../src/lib/data/manual-debates';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { assertEnv, safeDbUrl } from './lib/envCheck';
import { parseFlags } from './lib/flags';
import { makeLogger } from './lib/logger';
import { buildTranscriptMetadataUpdate, type ExistingDebateTranscript } from './lib/debateUpsert';
import { formatCountMap, guardNonEmpty } from './lib/upsertHelpers';

const log = makeLogger('DEBATES');
const flags = parseFlags(['dry-run', 'allow-empty']);
assertEnv(['DATABASE_URL'], log);

const prisma = createPrismaClient();
const date = (value: string) => new Date(`${value}T00:00:00+05:30`);
const toPrismaHouse = (value: string) => value.replaceAll('-', '_').toUpperCase();

const debates = [...manualDebates, ...dataGovDebates];
const debateRows = debates.map((debate) => ({
	id: debate.id,
	house: toPrismaHouse(debate.house),
	date: date(debate.date),
	title: debate.title,
	summary: debate.summary,
	source_url: debate.source_url,
	transcript_url: debate.transcript_url ?? null,
	transcript_pages: debate.transcript_pages ?? null,
	transcript_byte_length: debate.transcript_byte_length ?? null,
	transcript_language: debate.transcript_language ?? null,
	members: debate.members,
	lok_sabha_number: debate.lok_sabha_number ?? null,
	session_number: debate.session_number ?? null,
	debate_type: debate.debate_type ?? null,
	related_bill_id: debate.related_bill_id ?? null,
	is_demo_seed: debate.isDemoSeed
}));

const transcriptRows = debates
	.filter((debate) => debate.transcript_url)
	.map((debate) => ({
		debate_id: debate.id,
		source_url: debate.transcript_url!,
		resolved_url: debate.transcript_url!,
		content_type: 'application/pdf',
		byte_length: debate.transcript_byte_length ?? null
	}));

async function main() {
	guardNonEmpty('debate rows', debateRows.length, flags['allow-empty'], log);

	const sourceCounts = {
		debates: debateRows.length,
		transcripts: transcriptRows.length
	};
	const existingCounts = {
		debates: await prisma.debate.count(),
		transcripts: await prisma.debateTranscript.count()
	};

	log.info(`source records:   ${formatCountMap(sourceCounts)}`);
	log.info(`existing rows:    ${formatCountMap(existingCounts)}`);

	if (flags['dry-run']) {
		log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (tables: Debate, DebateTranscript)`);
		log.info('dry-run; no changes made.');
		return;
	}

	await prisma.$transaction(
		async (tx) => {
			for (const row of debateRows) {
				await tx.debate.upsert({
					where: { id: row.id },
					create: row,
					update: {
						house: row.house,
						date: row.date,
						title: row.title,
						summary: row.summary,
						source_url: row.source_url,
						transcript_url: row.transcript_url,
						transcript_pages: row.transcript_pages,
						transcript_byte_length: row.transcript_byte_length,
						transcript_language: row.transcript_language,
						members: row.members,
						lok_sabha_number: row.lok_sabha_number,
						session_number: row.session_number,
						debate_type: row.debate_type,
						related_bill_id: row.related_bill_id,
						is_demo_seed: row.is_demo_seed
					}
				});
			}

			for (const row of transcriptRows) {
				const existing = await tx.debateTranscript.findUnique({
					where: { debate_id: row.debate_id },
					select: {
						status: true,
						extracted_from_url: true
					}
				});
				const update = buildTranscriptMetadataUpdate(existing as ExistingDebateTranscript | null, row);

				await tx.debateTranscript.upsert({
					where: { debate_id: row.debate_id },
					create: {
						debate_id: row.debate_id,
						source_url: row.source_url,
						resolved_url: row.resolved_url,
						content_type: row.content_type,
						byte_length: row.byte_length,
						status: 'METADATA_ONLY'
					},
					// Extraction-owned fields below are intentionally omitted. Do not add
					// text, text_hash, char_count, error, extracted_at, or extracted_from_url here.
					update
				});
			}
		},
		{ timeout: 60_000 }
	);

	log.info(`inserted rows:    upserted ${formatCountMap(sourceCounts)}`);
	log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (tables: Debate, DebateTranscript)`);
	log.info('Debate transcript upsert complete.');
}

main()
	.catch((error) => {
		log.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
