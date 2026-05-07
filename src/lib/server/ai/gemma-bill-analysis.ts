import { createHash } from 'node:crypto';
import type { Bill, BillAction } from '$lib/domain/types';
import { formatEconomicImpactForPanel, getEconomicImpactProfile } from '$lib/domain/economic-impact';
import { getServerEnv } from '$lib/server/env';
import { getBillSourceTextMetadata, type BillSourceTextForAnalysis, type BillSourceTextMetadata } from './source-text';

const GEMMA_OPENAI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const DEFAULT_GEMMA_MODEL = 'gemma-4-31b-it';
const CACHE_TTL_MS = 1000 * 60 * 30;
const ANALYSIS_PROMPT_VERSION = 'bill-analysis-v7-few-shot-cot';

export type AiAnalysisProvider = 'gemma';

export type BillAiAnalysis = {
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
	payload: BillAiAnalysisPayload;
};

export type BillAiAnalysisPayload = {
	source: AiAnalysisProvider;
	cache: 'generated' | 'memory' | 'postgres';
	provider: AiAnalysisProvider;
	model: string;
	generatedAt: string;
	sourceText?: BillSourceTextMetadata;
	analysis: BillAiAnalysis;
};

type OpenAiCompatibleChatResponse = {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
	error?: {
		message?: string;
	};
};

const analysisCacheScope = globalThis as typeof globalThis & { __bharatZeroAnalysisCache?: Map<string, CachedAnalysis> };
const analysisCache = (analysisCacheScope.__bharatZeroAnalysisCache ??= new Map<string, CachedAnalysis>());

export function getAiAnalysisProvider(requestedProvider?: string | null): AiAnalysisProvider {
	return normalizeProvider(requestedProvider ?? undefined) ?? normalizeProvider(getServerEnv('AI_ANALYSIS_PROVIDER')) ?? 'gemma';
}

export function getConfiguredAiAnalysisProviders(requestedProvider?: string | null): AiAnalysisProvider[] {
	const provider = getAiAnalysisProvider(requestedProvider);
	return isProviderConfigured(provider) ? [provider] : [];
}

export function getGemmaBillAnalysisModel() {
	return getServerEnv('GEMMA_MODEL') ?? DEFAULT_GEMMA_MODEL;
}

export function getBillAnalysisModel(_provider = getAiAnalysisProvider()) {
	return getGemmaBillAnalysisModel();
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

export async function analyzeBillWithGemma(bill: Bill, actions: BillAction[], language: string, sourceText?: BillSourceTextForAnalysis) {
	return analyzeBillWithProvider('gemma', bill, actions, language, sourceText);
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
	const analysis: BillAiAnalysis = {
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
	const timeout = setTimeout(() => controller.abort(), 45_000);

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
				temperature: 0.3,
				max_completion_tokens: 1500
			}),
			signal: controller.signal
		});

		const body = (await response.json().catch(() => ({}))) as OpenAiCompatibleChatResponse;
		if (!response.ok) {
			throw new Error(body.error?.message ?? `${provider} request failed with HTTP ${response.status}.`);
		}

		return body;
	} finally {
		clearTimeout(timeout);
	}
}

function getProviderApiKey(provider: AiAnalysisProvider) {
	return provider === 'gemma' ? (getServerEnv('GEMMA_API_KEY') ?? getServerEnv('GEMINI_API_KEY')) : undefined;
}

function getProviderChatCompletionsUrl(_provider: AiAnalysisProvider) {
	const configuredBaseUrl = getServerEnv('GEMMA_BASE_URL') ?? getServerEnv('GEMINI_OPENAI_BASE_URL');
	const baseUrl = (configuredBaseUrl ?? GEMMA_OPENAI_BASE_URL).replace(/\/+$/, '');
	return baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
}

function isProviderConfigured(provider: AiAnalysisProvider) {
	return Boolean(getProviderApiKey(provider));
}

function normalizeProvider(value: string | undefined): AiAnalysisProvider | null {
	if (value === 'gemma') return value;
	return null;
}

function formatEconomicContextForPrompt(profile: ReturnType<typeof getEconomicImpactProfile>): string {
	return [
		`Economic category: ${profile.category}.`,
		`Timing window: ${profile.timingWindow}`,
		`Stage readiness: ${profile.stageReadiness}`,
		`Primary transmission channels: ${profile.primaryChannels.join(', ')}.`,
		`Likely direction: ${profile.direction}.`,
		`Confidence: ${profile.confidence} — ${profile.confidenceReason}`,
		`Data needed to verify: ${profile.dataNeeded.join(', ')}.`
	].join(' ');
}

const FEW_SHOT_EXAMPLE = `Example of a well-formed analysis (for the Digital Personal Data Protection Act, 2023):
{
  "_thinking": "Bill received assent Aug 2023. Category: Digital/data. Stage: act_published so use implementation read. Channels: compliance costs for platforms, consumer trust, data governance investment. Direction: short-term cost drag, long-run trust/productivity gain. Confidence: medium — rules not yet notified. No PDF excerpt supplied.",
  "subject": "Legal framework for how businesses and government must collect, store, and use personal data of Indian citizens",
  "plainLanguageSummary": "This Act sets out rights for citizens over their personal data and obligations for any organisation that processes it, whether inside or outside India. It establishes a Data Protection Board to handle complaints and penalties.",
  "whyItMatters": "Every digital platform operating in India — banks, e-commerce sites, health apps — must redesign consent flows and data handling. Citizens gain enforceable rights to access, correct, and erase data held about them.",
  "gdpImpact": "Implementation read: the Act has received assent but rules and commencement notifications are pending, so actual compliance burden has not yet landed. Transmission channels: compliance costs for technology and financial sector firms will rise as consent frameworks, data protection officers, and breach-notification systems are built; the Data Protection Board adds a new regulatory layer. Direction: likely a modest short-term drag on tech-sector margins, offset by longer-run gains from higher consumer trust and reduced data fraud. Confidence: medium — the Act is law but enforcement scope depends on rules still being drafted by MeitY. Verify with: MeitY rulemaking, sector compliance cost surveys, and EBITDA data from listed tech firms post-implementation.",
  "stageExplanation": "The bill received Presidential assent in August 2023 and is now an Act. Rules under the Act have not yet been notified, meaning enforcement has not begun.",
  "movementSummary": "Passed Lok Sabha on 7 August 2023, Rajya Sabha on 9 August 2023, and received Presidential assent on 11 August 2023. Commencement notification is awaited.",
  "recordCoverage": "BharatZero has the complete action history through assent. No official PDF excerpt was provided for this analysis, limiting clause-level detail.",
  "dataQuality": "Record is complete through assent. Rules and commencement notification are pending, which are the key missing items for impact assessment.",
  "nextWatchItems": ["Watch MeitY rulemaking for data protection standards and penalty thresholds", "Track Data Protection Board appointments and first enforcement actions", "Monitor commencement notification in the Official Gazette"]
}`;

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
	const economicImpactSummary = formatEconomicContextForPrompt(economicImpactContext);

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
				'Include a GDP/economic-impact read that is useful rather than generic. Use the supplied economicImpactSummary as the primary rubric; override it only when the official source excerpt gives stronger direct evidence.',
				'Structure gdpImpact as exactly 4-5 sentences in this order: (1) Stage/timing read based on the timingWindow. (2) Transmission channels — name the specific channels and how they connect to this bill. (3) Direction — positive, negative, or uncertain, with the reason. (4) Confidence level and what limits it. (5) Specific data items needed to verify.',
				'Do not invent numerical GDP estimates, percentage points, rupee values, or causal outcomes unless supplied in the source excerpt.',
				'For bills less than 10 years old, focus on near-term channels: public spending, compliance cost, investment, productivity, inflation, formalisation, or sector demand. For bills 10 years old or older, focus on retrospective or long-run channels and name the historical indicators needed.',
				'Keep every field concise: 1-3 sentences per string.',
				'First populate the _thinking field with 2-3 sentences noting the bill stage, economic category, available evidence, and any key limitations. Use this to guide the other fields.',
				'Return valid JSON with these keys: _thinking, subject, plainLanguageSummary, whyItMatters, gdpImpact, stageExplanation, movementSummary, recordCoverage, dataQuality, nextWatchItems.',
				'nextWatchItems must be exactly 3 concrete short strings.',
				'',
				FEW_SHOT_EXAMPLE
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
				economicImpactSummary,
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

function parseJsonObject(content: string): unknown {
	try {
		const parsed = JSON.parse(content) as unknown;
		if (parsed && typeof parsed === 'object' && 'analysis' in parsed) {
			return (parsed as { analysis: unknown }).analysis;
		}
		return parsed;
	} catch {
		console.warn('[parseJsonObject] AI returned non-JSON content, applying full fallback.');
		return {};
	}
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
	const mentionsTransmission = /channel|transmission|through|via|spending|cost|investment|productivity|income|credit|demand|compliance|revenue|fiscal|monetary/i.test(trimmed);
	const mentionsEvidence = /confidence|verify|data|indicator|evidence|source|budget|series|estimate|historical/i.test(trimmed);
	if (mentionsTransmission || mentionsEvidence) {
		return trimmed.slice(0, 1000);
	}
	console.warn(`[gdpImpact] AI response failed quality check for bill ${bill.id} — falling back to static profile. Response: ${trimmed.slice(0, 120)}`);
	return fallback;
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
