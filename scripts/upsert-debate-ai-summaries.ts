import type { Debate } from '../src/lib/domain/types';
import { getOrGenerateDebateSummary, type DebateTranscriptInput } from '../src/lib/server/ai/gemma-debate-analysis';
import { isProviderConfigured, getAiAnalysisProvider } from '../src/lib/server/ai/gemma-client';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { toDomainDebate } from '../src/lib/server/repositories/prisma-mappers';
import { assertEnv, safeDbUrl } from './lib/envCheck';
import { parseFlags } from './lib/flags';
import { makeLogger } from './lib/logger';

const log = makeLogger('DEBATE-AI');
const flags = parseFlags(['dry-run', 'allow-empty']);
assertEnv(['DATABASE_URL'], log);

const prisma = createPrismaClient();
const LANGUAGES: Array<'en' | 'hi'> = ['en'];

type DebateWithTranscript = Awaited<ReturnType<typeof prisma.debate.findMany>>[number];

async function main() {
	const provider = getAiAnalysisProvider(null);
	const providerConfigured = isProviderConfigured(provider);

	const debateRows = (await prisma.debate.findMany({
		include: { transcript: true },
		orderBy: { date: 'desc' }
	})) as DebateWithTranscript[];

	const counts = {
		total: debateRows.length,
		extractedFull: 0,
		extractedPartial: 0,
		metadataOnly: 0,
		failed: 0,
		stale: 0,
		noTranscript: 0
	};
	const eligible: Array<{ debate: Debate; transcriptInput: DebateTranscriptInput }> = [];

	for (const row of debateRows) {
		const transcript = row.transcript;
		if (!transcript) {
			counts.noTranscript += 1;
			continue;
		}
		switch (transcript.status) {
			case 'EXTRACTED':
				if (transcript.char_count > 80_000 + 40_000) counts.extractedPartial += 1;
				else counts.extractedFull += 1;
				eligible.push({
					debate: toDomainDebate({
						...row,
						transcript: { status: transcript.status, char_count: transcript.char_count, text_hash: transcript.text_hash }
					}),
					transcriptInput: {
						status: 'extracted',
						text: transcript.text ?? '',
						textHash: transcript.text_hash ?? null,
						charCount: transcript.char_count
					}
				});
				break;
			case 'METADATA_ONLY':
				counts.metadataOnly += 1;
				break;
			case 'FAILED':
				counts.failed += 1;
				break;
			case 'STALE':
				counts.stale += 1;
				break;
		}
	}

	log.info(`provider:         ${provider}${providerConfigured ? '' : ' (api key NOT configured — only cached rows can be served)'}`);
	log.info(`total debates:    ${counts.total.toLocaleString('en-IN')}`);
	log.info(`EXTRACTED full:   ${counts.extractedFull.toLocaleString('en-IN')}`);
	log.info(`EXTRACTED partial:${counts.extractedPartial.toLocaleString('en-IN')} (will be head-tail truncated)`);
	log.info(`METADATA_ONLY:    ${counts.metadataOnly.toLocaleString('en-IN')} (skipped — no transcript text)`);
	log.info(`FAILED:           ${counts.failed.toLocaleString('en-IN')} (skipped — extraction failed)`);
	log.info(`STALE:            ${counts.stale.toLocaleString('en-IN')} (skipped — transcript stale)`);
	log.info(`no transcript:    ${counts.noTranscript.toLocaleString('en-IN')} (skipped — no DebateTranscript row)`);
	log.info(`eligible debates: ${eligible.length.toLocaleString('en-IN')} × ${LANGUAGES.length.toString()} language(s)`);

	if (flags['dry-run']) {
		log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (table: AiDebateAnalysis)`);
		log.info('dry-run; no changes made.');
		return;
	}

	if (eligible.length === 0) {
		if (!flags['allow-empty']) {
			log.error('No EXTRACTED transcripts available. Run upsert-debates and the transcript extraction pipeline first, or pass --allow-empty.');
			process.exit(1);
		}
		log.info('Nothing to backfill. Exiting.');
		return;
	}

	if (!providerConfigured) {
		log.error(`Cannot generate new summaries: ${provider} API key is not set. Set GEMMA_API_KEY (or GEMINI_API_KEY) and retry.`);
		process.exit(1);
	}

	const generationCounts = { cached: 0, generated: 0, failed: 0 };
	for (let index = 0; index < eligible.length; index += 1) {
		const { debate, transcriptInput } = eligible[index];
		for (const language of LANGUAGES) {
			try {
				const before = generationCounts.generated + generationCounts.cached;
				const payload = await getOrGenerateDebateSummary(prisma, debate, transcriptInput, { language });
				if (payload.cache === 'postgres') generationCounts.cached += 1;
				else generationCounts.generated += 1;
				const after = generationCounts.generated + generationCounts.cached;
				if (after - before === 1 && (after % 10 === 0 || after === eligible.length * LANGUAGES.length)) {
					log.info(`progress:         ${after.toLocaleString('en-IN')} / ${(eligible.length * LANGUAGES.length).toLocaleString('en-IN')}`);
				}
			} catch (error) {
				generationCounts.failed += 1;
				log.warn(`failed for debate ${debate.id} (${language}): ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	}

	log.info(`cached:           ${generationCounts.cached.toLocaleString('en-IN')}`);
	log.info(`newly generated:  ${generationCounts.generated.toLocaleString('en-IN')}`);
	log.info(`failed:           ${generationCounts.failed.toLocaleString('en-IN')}`);
	log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (table: AiDebateAnalysis)`);
	log.info('Debate AI summary backfill complete.');
}

main()
	.catch((error) => {
		log.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
