import type { IncomingMessage, ServerResponse } from 'node:http';
import { parseDashboardFilters } from '$lib/domain/dashboard-filters';
import { getLokSabhaPowerSnapshotForPrimeMinister, lokSabhaPowerSnapshots } from '$lib/domain/parliament-houses';
import { getPrimeMinisterProfile, primeMinisterProfiles } from '$lib/domain/prime-minister-profiles';
import { getPrimeMinisterTerm, PRIME_MINISTER_TERMS } from '$lib/domain/prime-ministers';
import { groupTimelineEventsByDate } from '$lib/domain/timeline-view';
import type { Debate, DebateAiSummaryPayload, DebateTranscriptStatus } from '$lib/domain/types';
import { analyzeBillWithConfiguredProvider, getBillAnalysisInputHash, getBillAnalysisModel } from '$lib/server/ai/gemma-bill-analysis';
import { getAiAnalysisProvider } from '$lib/server/ai/gemma-client';
import { getOrGenerateDebateSummary, type DebateTranscriptInput } from '$lib/server/ai/gemma-debate-analysis';
import { persistBillAnalysis, readPersistedBillAnalysis } from '$lib/server/ai/persistent-analysis-cache';
import { getBillSourceTextForAnalysis, getBillSourceTextMetadata } from '$lib/server/ai/source-text';
import { createPrismaClient } from '$lib/server/db/prisma';
import { toDomainDebate } from '$lib/server/repositories/prisma-mappers';
import { createLegislativeRepository, type LegislativeRepository } from '$lib/server/repositories/legislative';

let repository: LegislativeRepository | null = null;
let prismaClient: ReturnType<typeof createPrismaClient> | null = null;
const DASHBOARD_CACHE_TTL_MS = 1000 * 20;
const BILL_DETAIL_CACHE_TTL_MS = 1000 * 60;
type DashboardCacheEntry = { expiresAt: number; payload: ReturnType<typeof shapeDashboardForClient> };
type BillDetailCacheEntry = { expiresAt: number; payload: Awaited<ReturnType<LegislativeRepository['getBillDetail']>> };
const globalCacheScope = globalThis as typeof globalThis & {
	__bharatZeroDashboardCache?: Map<string, DashboardCacheEntry>;
	__bharatZeroDashboardRequests?: Map<string, Promise<ReturnType<typeof shapeDashboardForClient>>>;
	__bharatZeroBillDetailCache?: Map<string, BillDetailCacheEntry>;
	__bharatZeroDebateSummaryRequests?: Map<string, Promise<DebateAiSummaryPayload>>;
};
const dashboardCache = (globalCacheScope.__bharatZeroDashboardCache ??= new Map<string, DashboardCacheEntry>());
const dashboardRequests = (globalCacheScope.__bharatZeroDashboardRequests ??= new Map<string, Promise<ReturnType<typeof shapeDashboardForClient>>>());
const billDetailCache = (globalCacheScope.__bharatZeroBillDetailCache ??= new Map<string, BillDetailCacheEntry>());
const debateSummaryRequests = (globalCacheScope.__bharatZeroDebateSummaryRequests ??= new Map<string, Promise<DebateAiSummaryPayload>>());

const debateTranscriptStatusFromPrisma: Record<string, DebateTranscriptStatus> = {
	METADATA_ONLY: 'metadata_only',
	EXTRACTED: 'extracted',
	FAILED: 'failed',
	STALE: 'stale'
};

function evictExpired<V extends { expiresAt: number }>(map: Map<string, V>) {
	const now = Date.now();
	for (const [key, entry] of map) {
		if (entry.expiresAt < now) map.delete(key);
	}
}

function getPrismaClient() {
	prismaClient ??= createPrismaClient();
	return prismaClient;
}

function getRepository() {
	repository ??= createLegislativeRepository({ mode: 'prisma', prisma: getPrismaClient() });
	return repository;
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
	response.statusCode = statusCode;
	response.setHeader('content-type', 'application/json; charset=utf-8');
	response.end(JSON.stringify(body));
}

function sendError(response: ServerResponse, statusCode: number, message: string) {
	sendJson(response, statusCode, { error: message });
}

function shapeDashboardForClient(dashboard: Awaited<ReturnType<LegislativeRepository['getDashboardData']>>) {
	const base = {
		...dashboard,
		allBills: [],
		billActions: [],
		allTimelineEvents: [],
		sources: dashboard.sources
	};

	if (dashboard.filters.section === 'overview') {
		const previewEvents = dashboard.timelineEvents.slice(0, 12);
		return {
			...base,
			bills: dashboard.bills.slice(0, 5),
			timelineEvents: previewEvents,
			timelineGroups: groupTimelineEventsByDate(previewEvents),
			questions: [],
			debates: [],
			acts: [],
			actBills: []
		};
	}

	if (dashboard.filters.section === 'bills') {
		return {
			...base,
			timelineEvents: [],
			timelineGroups: [],
			timelineDateRail: [],
			questions: [],
			debates: [],
			acts: [],
			actBills: []
		};
	}

	if (dashboard.filters.section === 'timeline') {
		return {
			...base,
			bills: [],
			committees: [],
			questions: [],
			debates: [],
			acts: [],
			actBills: [],
			sources: []
		};
	}

	if (dashboard.filters.section === 'committees') {
		return {
			...base,
			bills: [],
			timelineEvents: [],
			timelineGroups: [],
			timelineDateRail: [],
			questions: [],
			debates: [],
			acts: [],
			actBills: [],
			sources: []
		};
	}

	if (dashboard.filters.section === 'questions') {
		return {
			...base,
			bills: [],
			timelineEvents: [],
			timelineGroups: [],
			timelineDateRail: [],
			committees: [],
			debates: [],
			acts: [],
			actBills: [],
			sources: []
		};
	}

	if (dashboard.filters.section === 'debates') {
		return {
			...base,
			bills: [],
			timelineEvents: [],
			timelineGroups: [],
			timelineDateRail: [],
			committees: [],
			questions: [],
			acts: [],
			actBills: [],
			sources: []
		};
	}

	if (dashboard.filters.section === 'acts') {
		return {
			...base,
			bills: [],
			timelineEvents: [],
			timelineGroups: [],
			timelineDateRail: [],
			committees: [],
			questions: [],
			debates: [],
			sources: []
		};
	}

	return {
		...base,
		bills: [],
		timelineEvents: [],
		timelineGroups: [],
		timelineDateRail: [],
		committees: [],
		questions: [],
		debates: [],
		acts: [],
		actBills: []
	};
}

async function getDashboardResponse(searchParams: URLSearchParams) {
	const filters = parseDashboardFilters(searchParams);
	const cacheKey = JSON.stringify(filters);
	const cached = dashboardCache.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.payload;
	}

	const pending = dashboardRequests.get(cacheKey);
	if (pending) {
		return pending;
	}

	const requestPromise = getRepository()
		.getDashboardData(filters)
		.then((dashboard) => {
			const payload = shapeDashboardForClient(dashboard);
			evictExpired(dashboardCache);
			dashboardCache.set(cacheKey, { expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS, payload });
			return payload;
		})
		.finally(() => {
			dashboardRequests.delete(cacheKey);
		});
	dashboardRequests.set(cacheKey, requestPromise);
	return requestPromise;
}

async function loadDebateForSummary(debateId: string): Promise<{ debate: Debate; transcript: DebateTranscriptInput } | null> {
	const row = await getPrismaClient().debate.findUnique({
		where: { id: debateId },
		include: { transcript: true }
	});
	if (!row) return null;

	const debate = toDomainDebate({
		...row,
		transcript: row.transcript
			? { status: row.transcript.status, char_count: row.transcript.char_count, text_hash: row.transcript.text_hash }
			: null
	});

	const transcript: DebateTranscriptInput = row.transcript
		? {
				status: debateTranscriptStatusFromPrisma[row.transcript.status] ?? 'metadata_only',
				text: row.transcript.text ?? '',
				textHash: row.transcript.text_hash ?? null,
				charCount: row.transcript.char_count
			}
		: null;

	return { debate, transcript };
}

async function getDebateAiSummaryResponse(debateId: string, language: 'en' | 'hi', requestedProvider: string | null): Promise<DebateAiSummaryPayload | { notFound: true }> {
	const cacheKey = `${debateId}:${language}:${requestedProvider ?? 'default'}`;
	const pending = debateSummaryRequests.get(cacheKey);
	if (pending) return pending;

	const requestPromise = (async (): Promise<DebateAiSummaryPayload | { notFound: true }> => {
		const loaded = await loadDebateForSummary(debateId);
		if (!loaded) return { notFound: true };
		return getOrGenerateDebateSummary(getPrismaClient(), loaded.debate, loaded.transcript, {
			language,
			requestedProvider
		});
	})().finally(() => {
		debateSummaryRequests.delete(cacheKey);
	});

	debateSummaryRequests.set(cacheKey, requestPromise as Promise<DebateAiSummaryPayload>);
	return requestPromise;
}

async function getBillDetailResponse(billId: string) {
	const cached = billDetailCache.get(billId);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.payload;
	}

	const detail = await getRepository().getBillDetail(billId);
	if (detail) {
		evictExpired(billDetailCache);
		billDetailCache.set(billId, { expiresAt: Date.now() + BILL_DETAIL_CACHE_TTL_MS, payload: detail });
	}
	return detail;
}

async function handleHealth(response: ServerResponse) {
	try {
		const [billCount, analysisCount] = await Promise.all([getPrismaClient().bill.count(), getPrismaClient().aiBillAnalysis.count()]);
		sendJson(response, 200, {
			ok: true,
			database: 'connected',
			bills: billCount,
			aiAnalyses: analysisCount
		});
	} catch (error) {
		console.error(error);
		sendJson(response, 503, { ok: false, database: 'unavailable' });
	}
}

function getPrimeMinisterData(termId: string) {
	const term = getPrimeMinisterTerm(termId as never);
	if (!term) return null;
	return {
		term,
		profile: getPrimeMinisterProfile(term.id),
		power: getLokSabhaPowerSnapshotForPrimeMinister(term.id)
	};
}

function getPrimeMinisterListResponse() {
	return {
		items: PRIME_MINISTER_TERMS.map((term) => ({
			...term,
			profile: getPrimeMinisterProfile(term.id),
			power: getLokSabhaPowerSnapshotForPrimeMinister(term.id)
		}))
	};
}

function getSourceCatalogResponse() {
	const profileSourceUrls = new Set(primeMinisterProfiles.map((profile) => profile.sourceUrl));
	const powerSourceUrls = new Set(lokSabhaPowerSnapshots.map((snapshot) => snapshot.sourceUrl));
	return {
		primeMinisterProfiles: primeMinisterProfiles.length,
		primeMinisterProfileSources: Array.from(profileSourceUrls).map((url) => ({ url, kind: 'pm-profile' })),
		housePowerSnapshots: lokSabhaPowerSnapshots.length,
		housePowerSources: Array.from(powerSourceUrls).map((url) => ({ url, kind: 'house-power' }))
	};
}

export async function handleBharatZeroApi(request: IncomingMessage, response: ServerResponse) {
	if (!request.url) {
		sendError(response, 400, 'Missing request URL.');
		return;
	}

	try {
		const url = new URL(request.url, 'http://127.0.0.1');

		if (request.method !== 'GET') {
			sendError(response, 405, 'Method not allowed.');
			return;
		}

		if (url.pathname === '/api/health') {
			await handleHealth(response);
			return;
		}

		if (url.pathname === '/api/dashboard') {
			sendJson(response, 200, await getDashboardResponse(url.searchParams));
			return;
		}

		if (url.pathname === '/api/prime-ministers') {
			sendJson(response, 200, getPrimeMinisterListResponse());
			return;
		}

		const primeMinisterMatch = url.pathname.match(/^\/api\/prime-ministers\/([^/]+)$/);
		if (primeMinisterMatch) {
			const data = getPrimeMinisterData(decodeURIComponent(primeMinisterMatch[1]));
			if (!data) {
				sendError(response, 404, 'Prime Minister term not found.');
				return;
			}
			sendJson(response, 200, data);
			return;
		}

		if (url.pathname === '/api/houses/power') {
			const primeMinister = url.searchParams.get('pm');
			const power = getLokSabhaPowerSnapshotForPrimeMinister(primeMinister);
			if (!power) {
				sendError(response, 404, 'House power snapshot not found.');
				return;
			}
			sendJson(response, 200, { power });
			return;
		}

		if (url.pathname === '/api/sources') {
			sendJson(response, 200, getSourceCatalogResponse());
			return;
		}

		const debateAiSummaryMatch = url.pathname.match(/^\/api\/debates\/([^/]+)\/ai-summary$/);
		if (debateAiSummaryMatch) {
			try {
				const debateId = decodeURIComponent(debateAiSummaryMatch[1]);
				const rawLang = url.searchParams.get('lang') ?? 'en';
				const language = rawLang === 'hi' ? 'hi' : 'en';
				const requestedProvider = url.searchParams.get('provider');
				const result = await getDebateAiSummaryResponse(debateId, language, requestedProvider);
				if ('notFound' in result) {
					sendError(response, 404, 'Debate not found.');
					return;
				}
				sendJson(response, 200, result);
			} catch (error) {
				console.error(error);
				sendError(response, 502, 'AI debate summary is unavailable.');
			}
			return;
		}

		const aiAnalysisMatch = url.pathname.match(/^\/api\/bills\/([^/]+)\/ai-analysis$/);
		if (aiAnalysisMatch) {
			const detail = await getBillDetailResponse(decodeURIComponent(aiAnalysisMatch[1]));
			if (!detail) {
				sendError(response, 404, 'Bill not found.');
				return;
			}

			try {
				const rawLang = url.searchParams.get('lang') ?? 'en';
				const language = rawLang === 'hi' ? 'hi' : 'en';
				const requestedProvider = url.searchParams.get('provider');
				const provider = getAiAnalysisProvider(requestedProvider);
				const model = getBillAnalysisModel(provider);
				const sourceText = await getBillSourceTextForAnalysis(getPrismaClient(), detail.bill);
				const inputHash = getBillAnalysisInputHash(detail.bill, detail.actions, sourceText);
				const cacheKey = { billId: detail.bill.id, language, provider, model, inputHash };
				const cachedAnalysis = await readPersistedBillAnalysis(getPrismaClient(), cacheKey);
				if (cachedAnalysis) {
					sendJson(response, 200, { ...cachedAnalysis, sourceText: getBillSourceTextMetadata(sourceText) });
					return;
				}

				const analysis = await analyzeBillWithConfiguredProvider(detail.bill, detail.actions, language, sourceText, requestedProvider);
				await persistBillAnalysis(getPrismaClient(), { ...cacheKey, provider: analysis.provider, model: analysis.model }, analysis);
				sendJson(response, 200, analysis);
			} catch (error) {
				console.error(error);
				sendError(response, 502, 'AI bill analysis is unavailable.');
			}
			return;
		}

		const billMatch = url.pathname.match(/^\/api\/bills\/([^/]+)$/);
		if (billMatch) {
			const detail = await getBillDetailResponse(decodeURIComponent(billMatch[1]));
			if (!detail) {
				sendError(response, 404, 'Bill not found.');
				return;
			}
			sendJson(response, 200, detail);
			return;
		}

		sendError(response, 404, 'API route not found.');
	} catch (error) {
		console.error(error);
		sendError(response, 500, 'BharatZero API error.');
	}
}
