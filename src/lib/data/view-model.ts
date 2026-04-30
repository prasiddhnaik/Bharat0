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
import type { Act, Bill } from '$lib/domain/types';
import {
	getAdapterOutputSummary,
	getPreparedSourceAdapters,
	ingestionPipelineSteps
} from '$lib/ingestion/source-adapters';
import { buildTimelineDateRail, groupTimelineEventsByDate } from '$lib/domain/timeline-view';
import { billDateMatchesPrimeMinisterTerm, PRIME_MINISTER_TERMS, type PrimeMinisterFilter } from '$lib/domain/prime-ministers';
import type { DashboardFilters } from '$lib/domain/dashboard-filters';
import { matchesSourceUrl } from '$lib/domain/source-filters';
export { parseDashboardFilters, type DashboardFilters } from '$lib/domain/dashboard-filters';

function getLinkedBillForAct(act: Act) {
	return bills.find((bill) => bill.id === act.linked_bill_id) ?? null;
}

function actMatchesQuery(act: Act, linkedBill: Bill | null, query: string, rawQuery: string) {
	if (!query) return true;
	return (
		act.title.toLowerCase().includes(query) ||
		act.act_number.toLowerCase().includes(query) ||
		String(act.year).includes(query) ||
		(linkedBill?.title_en.toLowerCase().includes(query) ?? false) ||
		(linkedBill?.title_hi.includes(rawQuery) ?? false) ||
		(linkedBill?.ministry.toLowerCase().includes(query) ?? false)
	);
}

export function getDashboardData(filters: DashboardFilters) {
	const query = filters.query.trim().toLowerCase();
	const filteredBills = bills.filter((bill) => {
		const matchesHouse = filters.house === 'all' || bill.origin_house === filters.house;
		const matchesStatus = filters.status === 'all' || bill.current_stage === filters.status;
		const matchesArea = filters.area === 'all' || bill.ministry === filters.area;
		const matchesSource = matchesSourceUrl(bill.source_url, filters.source);
		const matchesPrimeMinister = billDateMatchesPrimeMinisterTerm(bill.introduced_on, filters.primeMinister);
		const matchesQuery =
			!query ||
			bill.title_en.toLowerCase().includes(query) ||
			bill.title_hi.includes(filters.query) ||
			bill.ministry.toLowerCase().includes(query);

		return matchesHouse && matchesStatus && matchesArea && matchesSource && matchesPrimeMinister && matchesQuery;
	});
	const areaBaseBills = bills.filter((bill) => {
		const matchesHouse = filters.house === 'all' || bill.origin_house === filters.house;
		const matchesStatus = filters.status === 'all' || bill.current_stage === filters.status;
		const matchesSource = matchesSourceUrl(bill.source_url, filters.source);
		const matchesPrimeMinister = billDateMatchesPrimeMinisterTerm(bill.introduced_on, filters.primeMinister);
		const matchesQuery =
			!query ||
			bill.title_en.toLowerCase().includes(query) ||
			bill.title_hi.includes(filters.query) ||
			bill.ministry.toLowerCase().includes(query);

		return matchesHouse && matchesStatus && matchesSource && matchesPrimeMinister && matchesQuery;
	});
	const filteredBillIds = new Set(filteredBills.map((bill) => bill.id));
	const filteredActs = acts
		.filter((act) => {
			const linkedBill = getLinkedBillForAct(act);
			const matchesHouse = filters.house === 'all' || linkedBill?.origin_house === filters.house;
			const matchesStatus = filters.status === 'all' || linkedBill?.current_stage === filters.status;
			const matchesArea = filters.area === 'all' || linkedBill?.ministry === filters.area;
			const matchesPrimeMinister = !linkedBill || billDateMatchesPrimeMinisterTerm(linkedBill.introduced_on, filters.primeMinister);
			const matchesSource = matchesSourceUrl(act.india_code_url, filters.source) || (linkedBill ? matchesSourceUrl(linkedBill.source_url, filters.source) : false);

			return matchesHouse && matchesStatus && matchesArea && matchesPrimeMinister && matchesSource && actMatchesQuery(act, linkedBill, query, filters.query);
		})
		.sort((left, right) => right.year - left.year || left.title.localeCompare(right.title));
	const pageStart = (filters.page - 1) * filters.pageSize;
	const pageBills = filters.section === 'bills' ? filteredBills.slice(pageStart, pageStart + filters.pageSize) : filteredBills;
	const pageActs = filters.section === 'acts' ? filteredActs.slice(pageStart, pageStart + filters.pageSize) : filteredActs;
	const actBills = pageActs
		.map(getLinkedBillForAct)
		.filter((bill): bill is Bill => Boolean(bill));
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
		const matchesSource = matchesSourceUrl(bill.source_url, filters.source);
		const matchesQuery =
			!query ||
			bill.title_en.toLowerCase().includes(query) ||
			bill.title_hi.includes(filters.query) ||
			bill.ministry.toLowerCase().includes(query);

		return matchesHouse && matchesStatus && matchesArea && matchesSource && matchesQuery;
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
			totalItems: filters.section === 'acts' ? filteredActs.length : filteredBills.length,
			totalPages: Math.max(1, Math.ceil((filters.section === 'acts' ? filteredActs.length : filteredBills.length) / filters.pageSize))
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
		acts: pageActs,
		actBills,
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
