import type { House, SectionId, SittingDay, TimelineEvent } from './types';
import type { Language } from './localization';
import type { DashboardFilters } from './dashboard-filters';
import { hrefForSection } from './navigation-links';

export type TimelineDateRailItem = {
	date: string;
	selected: boolean;
	eventCount: number;
	sittingCount: number;
	href: string;
};

export type TimelineDateGroup = {
	date: string;
	events: TimelineEvent[];
};

type BuildTimelineDateRailInput = {
	events: TimelineEvent[];
	sittingDays: SittingDay[];
	selectedDate: string;
	house: House | 'all';
	section: SectionId;
	language: Language;
	filters?: DashboardFilters;
};

function matchesHouse(house: House | 'all', itemHouse: House): boolean {
	return house === 'all' || itemHouse === house;
}

function buildDateHref({ section, date, house, language }: Pick<BuildTimelineDateRailInput, 'section' | 'house' | 'language'> & { date: string }): string {
	const params = new URLSearchParams({ section });
	if (house !== 'all') {
		params.set('house', house);
	}
	params.set('date', date);
	params.set('lang', language);
	return `/?${params.toString()}`;
}

export function buildTimelineDateRail({
	events,
	sittingDays,
	selectedDate,
	house,
	section,
	language,
	filters
}: BuildTimelineDateRailInput): TimelineDateRailItem[] {
	const dates = new Set<string>();
	const eventCountsByDate = new Map<string, number>();
	const sittingCountsByDate = new Map<string, number>();

	for (const sittingDay of sittingDays) {
		if (matchesHouse(house, sittingDay.house)) {
			dates.add(sittingDay.date);
			sittingCountsByDate.set(sittingDay.date, (sittingCountsByDate.get(sittingDay.date) ?? 0) + 1);
		}
	}

	for (const event of events) {
		if (matchesHouse(house, event.house)) {
			dates.add(event.date);
			eventCountsByDate.set(event.date, (eventCountsByDate.get(event.date) ?? 0) + 1);
		}
	}

	const sortedDates = [...dates].sort((left, right) => right.localeCompare(left));
	const selectedIndex = Math.max(0, sortedDates.findIndex((date) => date <= selectedDate));
	const start = Math.max(0, selectedIndex - 5);
	return sortedDates.slice(start, start + 15).map((date) => {
		return {
			date,
			selected: date === selectedDate,
			eventCount: eventCountsByDate.get(date) ?? 0,
			sittingCount: sittingCountsByDate.get(date) ?? 0,
			href: filters ? hrefForSection(filters, section, { date, page: '1' }) : buildDateHref({ section, date, house, language })
		};
	});
}

export function groupTimelineEventsByDate(events: TimelineEvent[]): TimelineDateGroup[] {
	const groups = new Map<string, TimelineEvent[]>();

	for (const event of events) {
		const existing = groups.get(event.date) ?? [];
		existing.push(event);
		groups.set(event.date, existing);
	}

	return [...groups.entries()]
		.sort(([leftDate], [rightDate]) => rightDate.localeCompare(leftDate))
		.map(([date, groupedEvents]) => ({
			date,
			events: groupedEvents.sort((left, right) => right.date.localeCompare(left.date))
		}));
}
