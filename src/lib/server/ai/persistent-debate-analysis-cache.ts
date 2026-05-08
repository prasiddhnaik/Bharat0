import type { DebateAiSummary, DebateAiSummaryPayload, DebateTranscriptCoverage } from '$lib/domain/types';
import type { createPrismaClient } from '$lib/server/db/prisma';
import type { AiAnalysisProvider } from './gemma-client';
import { Prisma } from '../../../generated/prisma/client';

type PrismaAiClient = Pick<ReturnType<typeof createPrismaClient>, 'aiDebateAnalysis'>;

export type DebateAnalysisCacheKey = {
	debateId: string;
	language: string;
	provider: AiAnalysisProvider;
	model: string;
	inputHash: string;
};

type StoredAnalysis = {
	summary: Omit<DebateAiSummary, 'source' | 'model' | 'generatedAt'>;
	coverage: DebateTranscriptCoverage;
};

export async function readPersistedDebateSummary(prisma: PrismaAiClient, key: DebateAnalysisCacheKey): Promise<DebateAiSummaryPayload | null> {
	const row = await prisma.aiDebateAnalysis.findUnique({
		where: {
			debate_id_language_provider_model_input_hash: {
				debate_id: key.debateId,
				language: key.language,
				provider: key.provider,
				model: key.model,
				input_hash: key.inputHash
			}
		}
	});

	if (!row) return null;
	const stored = row.analysis as Prisma.JsonValue;
	if (!isStoredAnalysis(stored)) return null;

	const generatedAt = row.generated_at.toISOString();
	const summary: DebateAiSummary = {
		...stored.summary,
		source: key.provider,
		model: row.model,
		generatedAt
	};

	return {
		source: key.provider,
		cache: 'postgres',
		provider: key.provider,
		model: row.model,
		generatedAt,
		coverage: stored.coverage,
		summary
	};
}

export async function persistDebateSummary(prisma: PrismaAiClient, key: DebateAnalysisCacheKey, payload: DebateAiSummaryPayload) {
	const stored: StoredAnalysis = {
		summary: stripRehydratedFields(payload.summary),
		coverage: payload.coverage
	};
	await prisma.aiDebateAnalysis.upsert({
		where: {
			debate_id_language_provider_model_input_hash: {
				debate_id: key.debateId,
				language: key.language,
				provider: key.provider,
				model: key.model,
				input_hash: key.inputHash
			}
		},
		create: {
			debate_id: key.debateId,
			language: key.language,
			provider: key.provider,
			model: key.model,
			input_hash: key.inputHash,
			analysis: stored as unknown as Prisma.InputJsonValue,
			generated_at: new Date(payload.generatedAt)
		},
		update: {
			analysis: stored as unknown as Prisma.InputJsonValue,
			generated_at: new Date(payload.generatedAt)
		}
	});
}

function stripRehydratedFields(summary: DebateAiSummary): StoredAnalysis['summary'] {
	const { source: _source, model: _model, generatedAt: _generatedAt, ...rest } = summary;
	return rest;
}

function isStoredAnalysis(value: Prisma.JsonValue): value is StoredAnalysis {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const record = value as Record<string, unknown>;
	const summary = record.summary as Record<string, unknown> | undefined;
	const coverage = record.coverage as Record<string, unknown> | undefined;
	if (!summary || !coverage) return false;
	return (
		typeof summary.gist === 'string' &&
		Array.isArray(summary.keyPoints) &&
		Array.isArray(summary.keySpeakers) &&
		typeof summary.decisions === 'string' &&
		Array.isArray(summary.notableQuotes) &&
		typeof summary.dataQuality === 'string' &&
		(typeof summary.relatedBillContext === 'string' || summary.relatedBillContext === null) &&
		typeof coverage.strategy === 'string' &&
		typeof coverage.transcriptStatus === 'string' &&
		typeof coverage.totalChars === 'number' &&
		typeof coverage.includedChars === 'number'
	);
}
