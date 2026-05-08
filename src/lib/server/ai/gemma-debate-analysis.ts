import { createHash } from 'node:crypto';
import type {
	Debate,
	DebateAiSummary,
	DebateAiSummaryPayload,
	DebateAiSummaryQuote,
	DebateAiSummarySpeaker,
	DebateTranscriptCoverage,
	DebateTranscriptStatus
} from '$lib/domain/types';
import type { createPrismaClient } from '$lib/server/db/prisma';
import {
	type AiAnalysisProvider,
	getAiAnalysisProvider,
	getConfiguredAiAnalysisProviders,
	getGemmaModel,
	getProviderApiKey,
	requestOpenAiCompatibleCompletion,
	type OpenAiCompatibleChatMessage
} from './gemma-client';
import { persistDebateSummary, readPersistedDebateSummary } from './persistent-debate-analysis-cache';

const DEBATE_ANALYSIS_PROMPT_VERSION = 'debate-summary-v1-head-tail';
const HEAD_BUDGET_CHARS = 80_000;
const TAIL_BUDGET_CHARS = 40_000;

export type DebateTranscriptInput = {
	status: DebateTranscriptStatus;
	text: string;
	textHash: string | null;
	charCount: number;
} | null;

export type DebateLanguage = 'en' | 'hi';

type PrismaDebateAiClient = Pick<ReturnType<typeof createPrismaClient>, 'aiDebateAnalysis'>;

export function getDebateAnalysisModel(_provider: AiAnalysisProvider = getAiAnalysisProvider()) {
	return getGemmaModel();
}

export function buildDebateTranscriptCoverage(transcript: DebateTranscriptInput): {
	coverage: DebateTranscriptCoverage;
	excerpt: string;
} {
	if (!transcript || transcript.status === 'metadata_only') {
		return {
			excerpt: '',
			coverage: {
				strategy: 'metadata-only',
				transcriptStatus: transcript?.status ?? 'metadata_only',
				totalChars: transcript?.charCount ?? 0,
				includedChars: 0,
				headChars: 0,
				tailChars: 0,
				omittedChars: transcript?.charCount ?? 0,
				...(transcript?.textHash ? { textHash: transcript.textHash } : {})
			}
		};
	}

	if (transcript.status === 'failed') {
		return {
			excerpt: '',
			coverage: {
				strategy: 'transcript-failed',
				transcriptStatus: transcript.status,
				totalChars: transcript.charCount,
				includedChars: 0,
				headChars: 0,
				tailChars: 0,
				omittedChars: transcript.charCount,
				...(transcript.textHash ? { textHash: transcript.textHash } : {})
			}
		};
	}

	const text = transcript.text ?? '';
	const totalChars = text.length;
	const budget = HEAD_BUDGET_CHARS + TAIL_BUDGET_CHARS;

	if (totalChars <= budget) {
		return {
			excerpt: text,
			coverage: {
				strategy: 'full',
				transcriptStatus: transcript.status,
				totalChars,
				includedChars: totalChars,
				headChars: totalChars,
				tailChars: 0,
				omittedChars: 0,
				...(transcript.textHash ? { textHash: transcript.textHash } : {})
			}
		};
	}

	const head = text.slice(0, HEAD_BUDGET_CHARS);
	const tail = text.slice(totalChars - TAIL_BUDGET_CHARS);
	const omittedChars = totalChars - HEAD_BUDGET_CHARS - TAIL_BUDGET_CHARS;
	const excerpt = `${head}\n\n[--- TRANSCRIPT TRUNCATED: ${omittedChars.toLocaleString('en-IN')} characters omitted from middle ---]\n\n${tail}`;

	return {
		excerpt,
		coverage: {
			strategy: 'head-tail-truncated',
			transcriptStatus: transcript.status,
			totalChars,
			includedChars: HEAD_BUDGET_CHARS + TAIL_BUDGET_CHARS,
			headChars: HEAD_BUDGET_CHARS,
			tailChars: TAIL_BUDGET_CHARS,
			omittedChars,
			...(transcript.textHash ? { textHash: transcript.textHash } : {})
		}
	};
}

export function getDebateAnalysisInputHash(debate: Debate, coverage: DebateTranscriptCoverage, language: DebateLanguage) {
	return createHash('sha256')
		.update(
			JSON.stringify({
				promptVersion: DEBATE_ANALYSIS_PROMPT_VERSION,
				language,
				debate: {
					id: debate.id,
					house: debate.house,
					date: debate.date,
					title: debate.title,
					summary: debate.summary,
					source_url: debate.source_url,
					transcript_url: debate.transcript_url ?? null,
					transcript_language: debate.transcript_language ?? null,
					members: debate.members,
					lok_sabha_number: debate.lok_sabha_number ?? null,
					session_number: debate.session_number ?? null,
					debate_type: debate.debate_type ?? null,
					related_bill_id: debate.related_bill_id ?? null
				},
				coverage: {
					strategy: coverage.strategy,
					transcriptStatus: coverage.transcriptStatus,
					includedChars: coverage.includedChars,
					textHash: coverage.textHash ?? null
				}
			})
		)
		.digest('hex');
}

export async function getOrGenerateDebateSummary(
	prisma: PrismaDebateAiClient,
	debate: Debate,
	transcript: DebateTranscriptInput,
	options: { language?: DebateLanguage; requestedProvider?: string | null } = {}
): Promise<DebateAiSummaryPayload> {
	const language: DebateLanguage = options.language === 'hi' ? 'hi' : 'en';
	const { coverage, excerpt } = buildDebateTranscriptCoverage(transcript);
	const provider = getAiAnalysisProvider(options.requestedProvider);
	const model = getDebateAnalysisModel(provider);
	const inputHash = getDebateAnalysisInputHash(debate, coverage, language);

	const cacheKey = { debateId: debate.id, language, provider, model, inputHash };
	const cached = await readPersistedDebateSummary(prisma, cacheKey);
	if (cached) return cached;

	const summary = await analyzeDebateWithProvider(debate, coverage, excerpt, language, options.requestedProvider);
	const payload: DebateAiSummaryPayload = {
		source: provider,
		cache: 'generated',
		provider,
		model: summary.model,
		generatedAt: summary.generatedAt,
		coverage,
		summary
	};

	await persistDebateSummary(prisma, { ...cacheKey, model: summary.model }, payload);
	return payload;
}

async function analyzeDebateWithProvider(
	debate: Debate,
	coverage: DebateTranscriptCoverage,
	excerpt: string,
	language: DebateLanguage,
	requestedProvider?: string | null
): Promise<DebateAiSummary> {
	const providers = getConfiguredAiAnalysisProviders(requestedProvider);
	if (providers.length === 0) {
		throw new Error('No AI analysis provider is configured.');
	}

	let lastError: unknown;
	for (const provider of providers) {
		const apiKey = getProviderApiKey(provider);
		if (!apiKey) {
			lastError = new Error(`${provider} API key is not configured.`);
			continue;
		}

		const model = getDebateAnalysisModel(provider);
		try {
			const completion = await requestOpenAiCompatibleCompletion(
				provider,
				apiKey,
				model,
				buildDebateMessages(debate, coverage, excerpt, language),
				{ responseFormat: 'json_object', temperature: 0.3, maxCompletionTokens: 1500 }
			);
			const content = completion.choices?.[0]?.message?.content;
			if (!content) {
				throw new Error(completion.error?.message ?? `${provider} returned no debate summary content.`);
			}
			const generatedAt = new Date().toISOString();
			return {
				...coerceDebateSummary(parseJsonObject(content), debate, coverage),
				source: provider,
				model,
				generatedAt
			};
		} catch (error) {
			lastError = error;
			console.warn(`AI debate-analysis provider ${provider} failed:`, error);
		}
	}

	throw lastError instanceof Error ? lastError : new Error('AI debate analysis failed for every configured provider.');
}

const DEBATE_FEW_SHOT_EXAMPLE = `Example of a well-formed analysis (for a Lok Sabha bill-passing debate):
{
  "_thinking": "Discussion under Rule 193 on a finance bill amendment. Transcript: extracted, head-tail truncated. Speakers identified from chair calls and member interjections. Division called near the end. Vote count visible in tail.",
  "gist": "Lok Sabha cleared the amendment after a 90-minute discussion, with the Opposition pressing for clearer compliance timelines.",
  "keyPoints": [
    "Minister introduced the amendment as a clarification, not a substantive change.",
    "Opposition members raised concerns about implementation deadlines and small-business compliance burden.",
    "Two amendments tabled by the Opposition were withdrawn after the Minister's reply.",
    "House adopted the bill by voice vote; Opposition demanded a division which was held."
  ],
  "keySpeakers": [
    { "name": "Minister", "role": "Mover", "contribution": "Framed the amendment as procedural and explained the implementation calendar." },
    { "name": "Leader of Opposition", "role": "Lead respondent", "contribution": "Argued for a 6-month compliance window for MSMEs and tabled an amendment." }
  ],
  "decisions": "Opposition amendments withdrawn. Bill adopted on division: 245 ayes, 78 noes. Speaker declared the bill passed.",
  "notableQuotes": [
    { "quote": "We are not asking for a delay; we are asking for the small trader to be heard.", "speaker": "Leader of Opposition" }
  ],
  "relatedBillContext": "This debate moves the bill from the introduction stage to passed-by-Lok-Sabha; transmission to Rajya Sabha follows.",
  "dataQuality": "Transcript was head-tail truncated (middle ~250K characters omitted); intervening speeches by backbench members may not be reflected. Division numbers are taken from the tail of the transcript."
}`;

function buildDebateMessages(
	debate: Debate,
	coverage: DebateTranscriptCoverage,
	excerpt: string,
	language: DebateLanguage
): OpenAiCompatibleChatMessage[] {
	const requestedLanguage = language === 'hi' ? 'Hindi' : 'English';
	return [
		{
			role: 'system',
			content: [
				'You are BharatZero, a careful Indian Parliament debate-proceedings analyst for citizens and policy researchers.',
				`Write in ${requestedLanguage}. Use plain language, not legalese.`,
				'Use ONLY the supplied debate metadata and transcript excerpt as evidence. Do not invent speakers, quotes, motions, divisions, or vote counts that are not in the supplied material.',
				'When the transcript is head-tail truncated, prefer evidence from the head (introduction, opening speeches) and tail (winding-up, divisions, voting). State explicitly in dataQuality that middle content may be missing.',
				'When the transcript is metadata-only or extraction failed, you have no proceedings text — produce a metadata-only read using only the curated summary, members, and other Debate metadata. Be explicit about what is missing.',
				'Quotes in notableQuotes MUST be verbatim substrings of the transcript excerpt. If you cannot find suitable verbatim quotes, return an empty array.',
				'Speaker names should match the transcript exactly. Use roles ("Mover", "Lead respondent", "Chair", "Member") only when clear from the text.',
				'First populate _thinking with 2-3 sentences noting the proceeding type, evidence available, and any limitations. Use this to guide other fields.',
				'Return valid JSON with these keys: _thinking, gist, keyPoints, keySpeakers, decisions, notableQuotes, relatedBillContext, dataQuality.',
				'gist must be exactly one sentence.',
				'keyPoints must be an array of 3-5 short strings.',
				'keySpeakers must be an array of at most 6 objects with shape { name, role?, contribution }.',
				'notableQuotes must be an array of at most 3 objects with shape { quote, speaker }; quote strings should be 30-200 characters and verbatim.',
				'relatedBillContext is a short string describing how this proceeding moved the related bill, or null when no related_bill_id is set.',
				'dataQuality must explicitly note coverage strategy, omitted chars (if any), and any field you could not populate confidently.',
				'',
				DEBATE_FEW_SHOT_EXAMPLE
			].join(' ')
		},
		{
			role: 'user',
			content: JSON.stringify({
				task: {
					promptVersion: DEBATE_ANALYSIS_PROMPT_VERSION,
					outputPurpose: 'Show a structured debate-summary panel in the BharatZero debate detail view.',
					analysisDate: new Date().toISOString().slice(0, 10)
				},
				debate: {
					id: debate.id,
					house: debate.house,
					date: debate.date,
					title: debate.title,
					curatedSummary: debate.summary,
					source_url: debate.source_url,
					transcript_url: debate.transcript_url ?? null,
					transcript_language: debate.transcript_language ?? null,
					lok_sabha_number: debate.lok_sabha_number ?? null,
					session_number: debate.session_number ?? null,
					debate_type: debate.debate_type ?? null,
					related_bill_id: debate.related_bill_id ?? null,
					members: debate.members
				},
				coverage,
				transcriptExcerpt: excerpt || null
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
		console.warn('[gemma-debate-analysis] AI returned non-JSON content; applying full fallback.');
		return {};
	}
}

function coerceDebateSummary(value: unknown, debate: Debate, coverage: DebateTranscriptCoverage): Omit<DebateAiSummary, 'source' | 'model' | 'generatedAt'> {
	const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
	return {
		gist: readString(record.gist, getFallbackGist(debate)),
		keyPoints: readStringArray(record.keyPoints, getFallbackKeyPoints(debate, coverage), { max: 5, maxLength: 240 }),
		keySpeakers: readSpeakers(record.keySpeakers, debate),
		decisions: readString(record.decisions, getFallbackDecisions(coverage)),
		notableQuotes: readQuotes(record.notableQuotes),
		relatedBillContext: readRelatedBillContext(record.relatedBillContext, debate),
		dataQuality: readString(record.dataQuality, getFallbackDataQuality(coverage))
	};
}

function readString(value: unknown, fallback: string, maxLength = 800) {
	if (typeof value !== 'string') return fallback;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed.slice(0, maxLength) : fallback;
}

function readStringArray(value: unknown, fallback: string[], options: { max: number; maxLength: number }) {
	if (!Array.isArray(value)) return fallback;
	const items = value
		.filter((item): item is string => typeof item === 'string')
		.map((item) => item.trim())
		.filter(Boolean);
	if (items.length === 0) return fallback;
	return items.slice(0, options.max).map((item) => item.slice(0, options.maxLength));
}

function readSpeakers(value: unknown, debate: Debate): DebateAiSummarySpeaker[] {
	if (!Array.isArray(value)) return getFallbackSpeakers(debate);
	const speakers: DebateAiSummarySpeaker[] = [];
	for (const entry of value) {
		if (!entry || typeof entry !== 'object') continue;
		const record = entry as Record<string, unknown>;
		const name = typeof record.name === 'string' ? record.name.trim() : '';
		const contribution = typeof record.contribution === 'string' ? record.contribution.trim() : '';
		if (!name || !contribution) continue;
		const role = typeof record.role === 'string' && record.role.trim().length > 0 ? record.role.trim().slice(0, 80) : undefined;
		speakers.push({
			name: name.slice(0, 120),
			contribution: contribution.slice(0, 320),
			...(role ? { role } : {})
		});
		if (speakers.length === 6) break;
	}
	return speakers.length > 0 ? speakers : getFallbackSpeakers(debate);
}

function readQuotes(value: unknown): DebateAiSummaryQuote[] {
	if (!Array.isArray(value)) return [];
	const quotes: DebateAiSummaryQuote[] = [];
	for (const entry of value) {
		if (!entry || typeof entry !== 'object') continue;
		const record = entry as Record<string, unknown>;
		const quote = typeof record.quote === 'string' ? record.quote.trim() : '';
		const speaker = typeof record.speaker === 'string' ? record.speaker.trim() : '';
		if (!quote || !speaker) continue;
		quotes.push({ quote: quote.slice(0, 320), speaker: speaker.slice(0, 120) });
		if (quotes.length === 3) break;
	}
	return quotes;
}

function readRelatedBillContext(value: unknown, debate: Debate): string | null {
	if (!debate.related_bill_id) return null;
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed.slice(0, 400) : null;
}

function getFallbackGist(debate: Debate) {
	return `${debate.title} (${debate.house}, ${debate.date}).`;
}

function getFallbackKeyPoints(debate: Debate, coverage: DebateTranscriptCoverage) {
	if (coverage.strategy === 'metadata-only' || coverage.strategy === 'transcript-failed') {
		return [
			'Transcript text is not available for this proceeding.',
			'Use the curated summary and member list as the available record.',
			`Open the official source link to read the full proceeding: ${debate.source_url}`
		];
	}
	return [
		'Transcript was processed but the AI summary could not be parsed.',
		'Open the official transcript for the full record.',
		'Use the curated summary as a fallback overview.'
	];
}

function getFallbackSpeakers(debate: Debate): DebateAiSummarySpeaker[] {
	return debate.members.slice(0, 4).map((name) => ({ name, contribution: 'Listed as a participant in the proceeding.' }));
}

function getFallbackDecisions(coverage: DebateTranscriptCoverage) {
	if (coverage.strategy === 'metadata-only') {
		return 'No transcript text was available; decisions are not extractable from the curated metadata alone.';
	}
	if (coverage.strategy === 'transcript-failed') {
		return 'Transcript extraction failed; decisions cannot be confirmed from text.';
	}
	return 'Decisions could not be confirmed from the supplied transcript excerpt.';
}

function getFallbackDataQuality(coverage: DebateTranscriptCoverage) {
	if (coverage.strategy === 'metadata-only') {
		return 'Metadata-only read: no transcript text was available, so the AI summary is limited to curated metadata.';
	}
	if (coverage.strategy === 'transcript-failed') {
		return 'Transcript extraction failed; the AI summary is limited to curated metadata.';
	}
	if (coverage.strategy === 'head-tail-truncated') {
		return `Transcript was head-tail truncated; ${coverage.omittedChars.toLocaleString('en-IN')} characters from the middle of the proceeding were omitted.`;
	}
	return 'Full transcript was supplied to the model.';
}
