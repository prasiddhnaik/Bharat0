import { createHash } from 'node:crypto';
import type { Bill, BillAction } from '$lib/domain/types';
import { formatEconomicImpactForPanel, getEconomicImpactProfile } from '$lib/domain/economic-impact';
import { getServerEnv } from '$lib/server/env';
import { getBillSourceTextMetadata, type BillSourceTextForAnalysis, type BillSourceTextMetadata } from './source-text';

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct';
const CACHE_TTL_MS = 1000 * 60 * 30;
const ANALYSIS_PROMPT_VERSION = 'bill-analysis-v6-gdp-impact-rubric';

export type AiAnalysisProvider = 'groq' | 'nvidia';

export type GroqBillAnalysis = {
	subject: string;
	plainLanguageSummary: string;
	whyItMatters: string;
	gdpImpact: string;
	stageExplanation: string;
	movementSummary: string;
	recordCoverage: string;
	dataQuality: string;
	nextWatchItems: string[];
	source: AiAnalysisProvider;
	model: string;
	generatedAt: string;
};

type CachedAnalysis = {
	expiresAt: number;
	payload: GroqBillAnalysisPayload;
};

export type GroqBillAnalysisPayload = {
	source: AiAnalysisProvider;
	cache: 'generated' | 'memory' | 'postgres';
	provider: AiAnalysisProvider;
	model: string;
	generatedAt: string;
	sourceText?: BillSourceTextMetadata;
	analysis: GroqBillAnalysis;
};

type GroqChatResponse = {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
	error?: {
		message?: string;
	};
};

const analysisCache = new Map<string, CachedAnalysis>();

export function getAiAnalysisProvider(requestedProvider?: string | null): AiAnalysisProvider {
	return normalizeProvider(requestedProvider ?? undefined) ?? normalizeProvider(getServerEnv('AI_ANALYSIS_PROVIDER')) ?? 'groq';
}

export function getConfiguredAiAnalysisProviders(requestedProvider?: string | null): AiAnalysisProvider[] {
	const primary = getAiAnalysisProvider(requestedProvider);
	const fallback = primary === 'groq' ? 'nvidia' : 'groq';
	const providers: AiAnalysisProvider[] = [primary, fallback];
	return providers.filter(isProviderConfigured);
}

export function getGroqBillAnalysisModel() {
	return getServerEnv('GROQ_MODEL') ?? DEFAULT_GROQ_MODEL;
}

export function getNvidiaBillAnalysisModel() {
	return getServerEnv('NVIDIA_MODEL') ?? DEFAULT_NVIDIA_MODEL;
}

export function getBillAnalysisModel(provider = getAiAnalysisProvider()) {
	return provider === 'nvidia' ? getNvidiaBillAnalysisModel() : getGroqBillAnalysisModel();
}

export function getBillAnalysisInputHash(bill: Bill, actions: BillAction[], sourceText?: BillSourceTextForAnalysis) {
	return createHash('sha256')
		.update(JSON.stringify({
			promptVersion: ANALYSIS_PROMPT_VERSION,
			sourceText: sourceText
				? {
						version: sourceText.version,
						status: sourceText.status,
						sourceUrl: sourceText.sourceUrl,
						resolvedUrl: sourceText.resolvedUrl,
						textHash: sourceText.textHash,
						characterCount: sourceText.characterCount
					}
				: null,
			bill: {
				id: bill.id,
				title_en: bill.title_en,
				title_hi: bill.title_hi,
				bill_number: bill.bill_number,
				bill_year: bill.bill_year,
				bill_type: bill.bill_type,
				origin_house: bill.origin_house,
				current_stage: bill.current_stage,
				ministry: bill.ministry,
				introduced_on: bill.introduced_on,
				latest_action_date: bill.latest_action_date,
				summary: bill.summary,
				source_url: bill.source_url,
				isDemoSeed: bill.isDemoSeed
			},
			actions: actions.map((action) => ({
				id: action.id,
				date: action.date,
				house: action.house,
				action_type: action.action_type,
				description: action.description,
				source_url: action.source_url
			}))
		}))
		.digest('hex');
}

export async function analyzeBillWithGroq(bill: Bill, actions: BillAction[], language: string, sourceText?: BillSourceTextForAnalysis) {
	return analyzeBillWithProvider('groq', bill, actions, language, sourceText);
}

export async function analyzeBillWithConfiguredProvider(bill: Bill, actions: BillAction[], language: string, sourceText?: BillSourceTextForAnalysis, requestedProvider?: string | null) {
	const providers = getConfiguredAiAnalysisProviders(requestedProvider);
	if (providers.length === 0) {
		throw new Error('No AI analysis provider is configured.');
	}

	let lastError: unknown;
	for (const provider of providers) {
		try {
			return await analyzeBillWithProvider(provider, bill, actions, language, sourceText);
		} catch (error) {
			lastError = error;
			console.warn(`AI analysis provider ${provider} failed:`, error);
		}
	}

	throw lastError instanceof Error ? lastError : new Error('AI bill analysis failed for every configured provider.');
}

export async function analyzeBillWithProvider(provider: AiAnalysisProvider, bill: Bill, actions: BillAction[], language: string, sourceText?: BillSourceTextForAnalysis) {
	const apiKey = getProviderApiKey(provider);
	if (!apiKey) {
		throw new Error(`${provider} API key is not configured.`);
	}

	const model = getBillAnalysisModel(provider);
	const cacheKey = [provider, bill.id, language, getBillAnalysisInputHash(bill, actions, sourceText), model].join(':');
	const cached = analysisCache.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) {
		return { ...cached.payload, cache: 'memory' as const };
	}

	const completion = await requestOpenAiCompatibleCompletion(provider, apiKey, model, buildMessages(bill, actions, language, sourceText));
	const content = completion.choices?.[0]?.message?.content;
	if (!content) {
		throw new Error(completion.error?.message ?? `${provider} returned no analysis content.`);
	}

	const generatedAt = new Date().toISOString();
	const analysis: GroqBillAnalysis = {
		...coerceAnalysis(parseJsonObject(content), bill),
		source: provider,
		model,
		generatedAt
	};
	const payload = { source: provider, cache: 'generated' as const, provider, model, generatedAt, sourceText: getBillSourceTextMetadata(sourceText), analysis };
	analysisCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
	return payload;
}

async function requestOpenAiCompatibleCompletion(provider: AiAnalysisProvider, apiKey: string, model: string, messages: Array<{ role: 'system' | 'user'; content: string }>) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), provider === 'nvidia' ? 30_000 : 20_000);

	try {
		const response = await fetch(getProviderChatCompletionsUrl(provider), {
			method: 'POST',
			headers: {
				authorization: `Bearer ${apiKey}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				model,
				messages,
				response_format: { type: 'json_object' },
				temperature: 0.2,
				...(provider === 'nvidia' ? { max_tokens: 950 } : { max_completion_tokens: 950 })
			}),
			signal: controller.signal
		});

		const body = (await response.json().catch(() => ({}))) as GroqChatResponse;
		if (!response.ok) {
			throw new Error(body.error?.message ?? `${provider} request failed with HTTP ${response.status}.`);
		}

		return body;
	} finally {
		clearTimeout(timeout);
	}
}

function getProviderApiKey(provider: AiAnalysisProvider) {
	return provider === 'nvidia' ? getServerEnv('NVIDIA_API_KEY') : getServerEnv('GROQ_API_KEY');
}

function getProviderChatCompletionsUrl(provider: AiAnalysisProvider) {
	if (provider === 'nvidia') {
		return `${(getServerEnv('NVIDIA_BASE_URL') ?? NVIDIA_BASE_URL).replace(/\/+$/, '')}/chat/completions`;
	}
	return GROQ_CHAT_COMPLETIONS_URL;
}

function isProviderConfigured(provider: AiAnalysisProvider) {
	return Boolean(getProviderApiKey(provider));
}

function normalizeProvider(value: string | undefined): AiAnalysisProvider | null {
	if (value === 'groq' || value === 'nvidia') return value;
	return null;
}

function buildMessages(bill: Bill, actions: BillAction[], language: string, sourceText?: BillSourceTextForAnalysis) {
	const requestedLanguage = language === 'hi' ? 'Hindi' : 'English';
	const actionHistory = actions.slice(-16).map((action) => ({
		date: action.date,
		house: action.house,
		type: action.action_type,
		description: action.description
	}));
	const latestAction = actions.at(-1);
	const compactTitle = bill.title_en.replace(/\s+/g, ' ').trim();
	const analysisDate = new Date().toISOString().slice(0, 10);
	const ageContext = getBillAgeContext(bill.introduced_on, analysisDate);
	const economicImpactContext = getEconomicImpactProfile(bill, analysisDate);

	return [
		{
			role: 'system' as const,
			content: [
				'You are BharatZero, a careful Indian Parliament bill analyst for citizens and policy researchers.',
				`Write in ${requestedLanguage}. Use plain language, not legalese.`,
				'Use only the supplied bill metadata, action history, and official source PDF excerpt when present. Treat the PDF excerpt as the strongest evidence.',
				'You may cautiously infer the broad policy topic from the title, ministry, and source excerpt, but do not invent exact clauses, amounts, affected Acts, deadlines, rights, offences, penalties, or political motives.',
				'If the official PDF excerpt is unavailable, say that clearly and explain what this limits. If it is available, explain that the source PDF was checked and still avoid unsupported claims outside the excerpt.',
				'Do not copy the title as the summary. Explain what the bill appears to be about, who would care, and what still needs verification from the source text.',
				'Include a GDP/economic-impact read that is useful rather than generic. Use the supplied economicImpactContext as the starting rubric, but let the official source excerpt override it when the excerpt gives stronger evidence.',
				'Structure gdpImpact as 3-5 compact sentences with these parts: timing/stage read, transmission channels, likely direction or uncertainty, confidence level, and exact data needed to verify the claim. Do not invent numerical GDP estimates, percentage points, rupee values, or causal outcomes unless supplied in the source excerpt.',
				'For bills less than 10 years old, emphasize near-term channels such as public spending, compliance cost, investment, productivity, inflation, formalisation, or sector demand. For bills 10 years old or older, emphasize retrospective or long-run channels and say what historical indicators would be needed.',
				'Keep every field concise: 1-3 sentences per string. Avoid internal product phrases like "metadata-level record" unless explaining data quality.',
				'Return valid JSON only with these keys: subject, plainLanguageSummary, whyItMatters, gdpImpact, stageExplanation, movementSummary, recordCoverage, dataQuality, nextWatchItems.',
				'nextWatchItems must be exactly 3 concrete short strings.'
			].join(' ')
		},
		{
			role: 'user' as const,
			content: JSON.stringify({
				task: {
					promptVersion: ANALYSIS_PROMPT_VERSION,
					outputPurpose: 'Show a useful bill explanation in the BharatZero right-side analysis panel.',
					analysisDate,
					billAge: ageContext,
					preferredStyle: [
						'Citizen-facing',
						'Specific to the title/ministry/stage when possible',
						'Clear about uncertainty',
						'No unsupported legal claims'
					]
				},
				bill: {
					id: bill.id,
					title_en: compactTitle,
					title_hi: bill.title_hi,
					bill_number: bill.bill_number,
					bill_year: bill.bill_year,
					bill_type: bill.bill_type,
					origin_house: bill.origin_house,
					current_stage: bill.current_stage,
					ministry: bill.ministry,
					introduced_on: bill.introduced_on,
					latest_action_date: bill.latest_action_date,
					summary: bill.summary,
					source_url: bill.source_url,
					isDemoSeed: bill.isDemoSeed
				},
				currentPosition: {
					stage: bill.current_stage,
					origin_house: bill.origin_house,
					introduced_on: bill.introduced_on,
					latest_action_date: bill.latest_action_date,
					latest_action: latestAction
						? {
								date: latestAction.date,
								house: latestAction.house,
								type: latestAction.action_type,
								description: latestAction.description
							}
						: null
				},
				economicImpactContext,
				actionHistory,
				officialSourceText: sourceText
					? {
							status: sourceText.status,
							sourceUrl: sourceText.sourceUrl,
							resolvedUrl: sourceText.resolvedUrl,
							contentType: sourceText.contentType,
							byteLength: sourceText.byteLength,
							characterCount: sourceText.characterCount,
							textHash: sourceText.textHash,
							excerpt: sourceText.excerpt ?? null,
							instructions: sourceText.status === 'extracted'
								? 'Use this extracted PDF text excerpt as primary evidence. It may be truncated, so do not claim full clause coverage unless the excerpt proves it.'
								: 'No readable PDF excerpt is available. Explain that limitation.'
						}
					: {
							status: 'unavailable',
							sourceUrl: bill.source_url,
							instructions: 'No PDF extraction context was provided. Explain that limitation.'
						}
			})
		}
	];
}

function parseJsonObject(content: string) {
	const parsed = JSON.parse(content) as unknown;
	if (parsed && typeof parsed === 'object' && 'analysis' in parsed) {
		return (parsed as { analysis: unknown }).analysis;
	}
	return parsed;
}

function coerceAnalysis(value: unknown, bill: Bill) {
	const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
	return {
		subject: readString(record.subject, bill.title_en),
		plainLanguageSummary: readString(record.plainLanguageSummary, bill.summary || `${bill.title_en} is currently recorded as ${bill.current_stage}.`),
		whyItMatters: readString(record.whyItMatters, 'This bill may affect the legal or policy area handled by the listed ministry.'),
		gdpImpact: readGdpImpact(record.gdpImpact, bill),
		stageExplanation: readString(record.stageExplanation, `The current captured stage is ${bill.current_stage}.`),
		movementSummary: readString(record.movementSummary, `The latest captured action date is ${bill.latest_action_date}.`),
		recordCoverage: readString(record.recordCoverage, 'BharatZero has the bill metadata and public source link; the official bill text still needs parsing for clause-level detail.'),
		dataQuality: readString(record.dataQuality, 'Treat this as a title, stage, ministry, and action-history explanation until the source PDF/text is extracted.'),
		nextWatchItems: readStringArray(record.nextWatchItems, [
			'Open the official source and extract the long title.',
			'Add clause-level notes when the bill text is parsed.',
			'Track the next listed parliamentary action.'
		])
	};
}

function getBillAgeContext(introducedOn: string, analysisDate: string) {
	const introducedYear = Number(introducedOn.slice(0, 4));
	const analysisYear = Number(analysisDate.slice(0, 4));
	const ageYears = Number.isFinite(introducedYear) && Number.isFinite(analysisYear) ? analysisYear - introducedYear : null;
	return {
		ageYears,
		category: ageYears === null ? 'unknown' : ageYears >= 10 ? '10-plus-years-old' : 'less-than-10-years-old'
	};
}

export function getFallbackGdpImpact(bill: Bill) {
	return formatEconomicImpactForPanel(bill);
}

function readGdpImpact(value: unknown, bill: Bill) {
	const fallback = getFallbackGdpImpact(bill);
	if (typeof value !== 'string') return fallback;
	const trimmed = value.trim();
	if (!trimmed) return fallback;
	const mentionsTransmission = /channel|transmission|through|via|spending|cost|investment|productivity|income|credit|demand/i.test(trimmed);
	const mentionsEvidence = /confidence|verify|data|indicator|evidence|source|budget|series/i.test(trimmed);
	return mentionsTransmission && mentionsEvidence ? trimmed.slice(0, 1000) : fallback;
}

function readString(value: unknown, fallback: string) {
	if (typeof value !== 'string') return fallback;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed.slice(0, 800) : fallback;
}

function readStringArray(value: unknown, fallback: string[]) {
	if (!Array.isArray(value)) return fallback;
	const items = value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
	return items.length > 0 ? items.slice(0, 5).map((item) => item.slice(0, 240)) : fallback;
}
