import {
	acts,
	billActions,
	bills,
	committees,
	debates,
	questions,
	seedMeta,
	sittingDays,
	sources,
	timelineEvents
} from './seed';
import type { Bill } from '$lib/domain/types';
import {
	getAdapterOutputSummary,
	getPreparedSourceAdapters,
	ingestionPipelineSteps
} from '$lib/ingestion/source-adapters';
import { buildTimelineDateRail, groupTimelineEventsByDate } from '$lib/domain/timeline-view';
import { billDateMatchesPrimeMinisterTerm, PRIME_MINISTER_TERMS, type PrimeMinisterFilter } from '$lib/domain/prime-ministers';
import type { DashboardFilters } from '$lib/domain/dashboard-filters';
export { parseDashboardFilters, type DashboardFilters } from '$lib/domain/dashboard-filters';

export function getDashboardData(filters: DashboardFilters) {
	const query = filters.query.trim().toLowerCase();
	const filteredBills = bills.filter((bill) => {
		const matchesHouse = filters.house === 'all' || bill.origin_house === filters.house;
		const matchesStatus = filters.status === 'all' || bill.current_stage === filters.status;
		const matchesArea = filters.area === 'all' || bill.ministry === filters.area;
		const matchesPrimeMinister = billDateMatchesPrimeMinisterTerm(bill.introduced_on, filters.primeMinister);
		const matchesQuery =
			!query ||
			bill.title_en.toLowerCase().includes(query) ||
			bill.title_hi.includes(filters.query) ||
			bill.ministry.toLowerCase().includes(query);

		return matchesHouse && matchesStatus && matchesArea && matchesPrimeMinister && matchesQuery;
	});
	const areaBaseBills = bills.filter((bill) => {
		const matchesHouse = filters.house === 'all' || bill.origin_house === filters.house;
		const matchesStatus = filters.status === 'all' || bill.current_stage === filters.status;
		const matchesPrimeMinister = billDateMatchesPrimeMinisterTerm(bill.introduced_on, filters.primeMinister);
		const matchesQuery =
			!query ||
			bill.title_en.toLowerCase().includes(query) ||
			bill.title_hi.includes(filters.query) ||
			bill.ministry.toLowerCase().includes(query);

		return matchesHouse && matchesStatus && matchesPrimeMinister && matchesQuery;
	});
	const filteredBillIds = new Set(filteredBills.map((bill) => bill.id));
	const pageStart = (filters.page - 1) * filters.pageSize;
	const pageBills = filters.section === 'bills' ? filteredBills.slice(pageStart, pageStart + filters.pageSize) : filteredBills;
	const stageCounts = Object.entries(
		filteredBills.reduce<Record<string, number>>((counts, bill) => {
			counts[bill.current_stage] = (counts[bill.current_stage] ?? 0) + 1;
			return counts;
		}, {})
	).map(([stage, count]) => ({ stage: stage as Bill['current_stage'], count }));
	const areaCounts = Object.entries(
		areaBaseBills.reduce<Record<string, number>>((counts, bill) => {
			counts[bill.ministry] = (counts[bill.ministry] ?? 0) + 1;
			return counts;
		}, {})
	).map(([area, count]) => ({ area, count }));
	const primeMinisterCountBaseBills = bills.filter((bill) => {
		const matchesHouse = filters.house === 'all' || bill.origin_house === filters.house;
		const matchesStatus = filters.status === 'all' || bill.current_stage === filters.status;
		const matchesArea = filters.area === 'all' || bill.ministry === filters.area;
		const matchesQuery =
			!query ||
			bill.title_en.toLowerCase().includes(query) ||
			bill.title_hi.includes(filters.query) ||
			bill.ministry.toLowerCase().includes(query);

		return matchesHouse && matchesStatus && matchesArea && matchesQuery;
	});
	const primeMinisterCounts = PRIME_MINISTER_TERMS.map((term) => ({
		id: term.id,
		count: primeMinisterCountBaseBills.filter((bill) => billDateMatchesPrimeMinisterTerm(bill.introduced_on, term.id as PrimeMinisterFilter)).length
	}));

	const filteredEvents = timelineEvents.filter((event) => {
		const matchesHouse = filters.house === 'all' || event.house === filters.house;
		const relatedBill = event.related_bill_id ? bills.find((bill) => bill.id === event.related_bill_id) : null;
		const matchesStatus = filters.status === 'all' || (relatedBill ? relatedBill.current_stage === filters.status : true);
		const matchesPrimeMinister = !relatedBill || billDateMatchesPrimeMinisterTerm(relatedBill.introduced_on, filters.primeMinister);
		const matchesQuery =
			!query ||
			event.title.toLowerCase().includes(query) ||
			event.description.toLowerCase().includes(query) ||
			(relatedBill ? filteredBillIds.has(relatedBill.id) : false);

		return matchesHouse && matchesStatus && matchesPrimeMinister && matchesQuery;
	});
	const timelineDateRail = buildTimelineDateRail({
		events: timelineEvents,
		sittingDays,
		selectedDate: filters.date,
		house: filters.house,
		section: filters.section,
		language: filters.language
	});

	return {
		seedMeta,
		filters,
		stats: {
			billsTracked: filteredBills.length,
			eventsOnDate: filteredEvents.length,
			committeesTracked: committees.length,
			preparedSources: sources.length
		},
		pagination: {
			page: filters.page,
			pageSize: filters.pageSize,
			totalItems: filteredBills.length,
			totalPages: Math.max(1, Math.ceil(filteredBills.length / filters.pageSize))
		},
		stageCounts,
		areaCounts,
		primeMinisterCounts,
		bills: pageBills,
		allBills: bills,
		billActions,
		timelineEvents: filteredEvents,
		timelineGroups: groupTimelineEventsByDate(filteredEvents),
		timelineDateRail,
		allTimelineEvents: timelineEvents,
		sittingDays,
		committees,
		questions,
		debates,
		acts,
		sources,
		ingestion: {
			adapters: getPreparedSourceAdapters(),
			outputSummary: getAdapterOutputSummary(),
			pipelineSteps: ingestionPipelineSteps
		}
	};
}

export function getBillDetail(billId: string): { bill: Bill; actions: typeof billActions } | null {
	const bill = bills.find((item) => item.id === billId);
	if (!bill) return null;
	return {
		bill,
		actions: billActions.filter((action) => action.bill_id === bill.id)
	};
}

export type DashboardData = ReturnType<typeof getDashboardData>;
export type BillDetailData = ReturnType<typeof getBillDetail>;
