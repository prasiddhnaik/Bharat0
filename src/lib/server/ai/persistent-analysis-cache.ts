import type { createPrismaClient } from '$lib/server/db/prisma';
import type { AiAnalysisProvider, BillAiAnalysis, BillAiAnalysisPayload } from './gemma-bill-analysis';
import { Prisma } from '../../../generated/prisma/client';

type PrismaAiClient = Pick<ReturnType<typeof createPrismaClient>, 'aiBillAnalysis'>;

type AnalysisCacheKey = {
	billId: string;
	language: string;
	provider: AiAnalysisProvider;
	model: string;
	inputHash: string;
};

export async function readPersistedBillAnalysis(prisma: PrismaAiClient, key: AnalysisCacheKey): Promise<BillAiAnalysisPayload | null> {
	const row = await prisma.aiBillAnalysis.findUnique({
		where: {
			bill_id_language_provider_model_input_hash: {
				bill_id: key.billId,
				language: key.language,
				provider: key.provider,
				model: key.model,
				input_hash: key.inputHash
			}
		}
	});

	if (!row || !isBillAiAnalysis(row.analysis)) {
		return null;
	}

	const generatedAt = row.generated_at.toISOString();
	const analysis: BillAiAnalysis = {
		...row.analysis,
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
		analysis
	};
}

export async function persistBillAnalysis(prisma: PrismaAiClient, key: AnalysisCacheKey, payload: BillAiAnalysisPayload) {
	await prisma.aiBillAnalysis.upsert({
		where: {
			bill_id_language_provider_model_input_hash: {
				bill_id: key.billId,
				language: key.language,
				provider: key.provider,
				model: key.model,
				input_hash: key.inputHash
			}
		},
		create: {
			bill_id: key.billId,
			language: key.language,
			provider: key.provider,
			model: key.model,
			input_hash: key.inputHash,
			analysis: payload.analysis as unknown as Prisma.InputJsonValue,
			generated_at: new Date(payload.generatedAt)
		},
		update: {
			analysis: payload.analysis as unknown as Prisma.InputJsonValue,
			generated_at: new Date(payload.generatedAt)
		}
	});
}

function isBillAiAnalysis(value: Prisma.JsonValue): value is BillAiAnalysis {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.subject === 'string' &&
		typeof record.plainLanguageSummary === 'string' &&
		typeof record.whyItMatters === 'string' &&
		typeof record.gdpImpact === 'string' &&
		typeof record.stageExplanation === 'string' &&
		typeof record.movementSummary === 'string' &&
		typeof record.recordCoverage === 'string' &&
		typeof record.dataQuality === 'string' &&
		Array.isArray(record.nextWatchItems)
	);
}
