import { useCallback, useEffect, useState } from 'react';
import type { DashboardData } from '$lib/data/view-model';
import type { DashboardFilters } from '$lib/domain/dashboard-filters';
import { hrefForSection } from '$lib/domain/navigation-links';

export function dashboardApiUrl(filters: DashboardFilters) {
	return `/api/dashboard${hrefForSection(filters, filters.section, { page: String(filters.page) }).slice(1)}`;
}

export function emptyDashboard(filters: DashboardFilters): DashboardData {
	return {
		filters,
		seedMeta: { label: 'Parliament records', description: '', updatedAt: '' },
		stats: { billsTracked: 0, filteredBillsTracked: 0, eventsOnDate: 0, committeesTracked: 0, preparedSources: 0 },
		pagination: { page: filters.page, pageSize: filters.pageSize, totalItems: 0, totalPages: 1 },
		stageCounts: [], areaCounts: [], primeMinisterCounts: [], bills: [], allBills: [], billActions: [],
		timelineEvents: [], timelineGroups: [], timelineDateRail: [], allTimelineEvents: [], sittingDays: [],
		committees: [], questions: [], debates: [], acts: [], actBills: [], sources: [],
		ingestion: { adapters: [], outputSummary: {} as DashboardData['ingestion']['outputSummary'], pipelineSteps: [] }
	};
}

export function useApi<T>(url: string | null) {
	const [attempt, setAttempt] = useState(0);
	const [result, setResult] = useState<{ url: string; data?: T; error?: string } | null>(null);
	const retry = useCallback(() => setAttempt((value) => value + 1), []);
	useEffect(() => {
		if (!url) return;
		const controller = new AbortController();
		setResult(null);
		void fetch(url, { signal: controller.signal })
			.then(async (response) => {
				if (!response.ok) throw new Error(`Records could not be loaded (HTTP ${response.status}).`);
				return response.json() as Promise<T>;
			})
			.then((data) => { if (!controller.signal.aborted) setResult({ url, data }); })
			.catch((error: unknown) => {
				if (!controller.signal.aborted) setResult({ url, error: error instanceof Error ? error.message : 'Records could not be loaded.' });
			});
		return () => controller.abort();
	}, [url, attempt]);
	const current = result?.url === url ? result : null;
	return { data: current?.data, error: current?.error, loading: Boolean(url && !current), retry };
}
