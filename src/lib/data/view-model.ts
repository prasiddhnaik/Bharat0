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
import { isHouse, isSectionId } from '$lib/domain/bill-stage-machine';
import type { Bill, BillStage, House, SectionId } from '$lib/domain/types';
import {
	getAdapterOutputSummary,
	getPreparedSourceAdapters,
	ingestionPipelineSteps
} from '$lib/ingestion/source-adapters';
import { parseLanguage, type Language } from '$lib/domain/localization';
import { buildTimelineDateRail, groupTimelineEventsByDate } from '$lib/domain/timeline-view';

export type DashboardFilters = {
	section: SectionId;
	house: House | 'all';
	date: string;
	status: BillStage | 'all';
	query: string;
	language: Language;
};

export function parseDashboardFilters(searchParams: URLSearchParams): DashboardFilters {
	const sectionParam = searchParams.get('section');
	const houseParam = searchParams.get('house');
	const statusParam = searchParams.get('status');

	return {
		section: isSectionId(sectionParam) ? sectionParam : 'overview',
		house: isHouse(houseParam) ? houseParam : 'all',
		date: searchParams.get('date') ?? seedMeta.updatedAt,
		status: statusParam ? (statusParam as BillStage) : 'all',
		query: searchParams.get('q') ?? '',
		language: parseLanguage(searchParams.get('lang'))
	};
}

export function getDashboardData(filters: DashboardFilters) {
	const query = filters.query.trim().toLowerCase();
	const filteredBills = bills.filter((bill) => {
		const matchesHouse = filters.house === 'all' || bill.origin_house === filters.house;
		const matchesStatus = filters.status === 'all' || bill.current_stage === filters.status;
		const matchesQuery =
			!query ||
			bill.title_en.toLowerCase().includes(query) ||
			bill.title_hi.includes(filters.query) ||
			bill.ministry.toLowerCase().includes(query);

		return matchesHouse && matchesStatus && matchesQuery;
	});

	const filteredEvents = timelineEvents.filter((event) => {
		const matchesHouse = filters.house === 'all' || event.house === filters.house;
		const matchesDate = event.date === filters.date;
		return matchesHouse && matchesDate;
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
			billsTracked: bills.length,
			eventsOnDate: filteredEvents.length,
			committeesTracked: committees.length,
			preparedSources: sources.length
		},
		bills: filteredBills,
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
