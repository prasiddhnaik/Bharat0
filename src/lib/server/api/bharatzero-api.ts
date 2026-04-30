import type { IncomingMessage, ServerResponse } from 'node:http';
import { parseDashboardFilters } from '$lib/domain/dashboard-filters';
import { groupTimelineEventsByDate } from '$lib/domain/timeline-view';
import { analyzeBillWithConfiguredProvider, getAiAnalysisProvider, getBillAnalysisInputHash, getBillAnalysisModel } from '$lib/server/ai/groq-bill-analysis';
import { persistBillAnalysis, readPersistedBillAnalysis } from '$lib/server/ai/persistent-analysis-cache';
import { getBillSourceTextForAnalysis, getBillSourceTextMetadata } from '$lib/server/ai/source-text';
import { createPrismaClient } from '$lib/server/db/prisma';
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
};
const dashboardCache = (globalCacheScope.__bharatZeroDashboardCache ??= new Map<string, DashboardCacheEntry>());
const dashboardRequests = (globalCacheScope.__bharatZeroDashboardRequests ??= new Map<string, Promise<ReturnType<typeof shapeDashboardForClient>>>());
const billDetailCache = (globalCacheScope.__bharatZeroBillDetailCache ??= new Map<string, BillDetailCacheEntry>());

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
		allTimelineEvents: []
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
			dashboardCache.set(cacheKey, { expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS, payload });
			return payload;
		})
		.finally(() => {
			dashboardRequests.delete(cacheKey);
		});
	dashboardRequests.set(cacheKey, requestPromise);
	return requestPromise;
}

async function getBillDetailResponse(billId: string) {
	const cached = billDetailCache.get(billId);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.payload;
	}

	const detail = await getRepository().getBillDetail(billId);
	billDetailCache.set(billId, { expiresAt: Date.now() + BILL_DETAIL_CACHE_TTL_MS, payload: detail });
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

		const aiAnalysisMatch = url.pathname.match(/^\/api\/bills\/([^/]+)\/ai-analysis$/);
		if (aiAnalysisMatch) {
			const detail = await getBillDetailResponse(decodeURIComponent(aiAnalysisMatch[1]));
			if (!detail) {
				sendError(response, 404, 'Bill not found.');
				return;
			}

			try {
				const language = url.searchParams.get('lang') ?? 'en';
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
