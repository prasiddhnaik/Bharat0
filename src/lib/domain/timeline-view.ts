import type { House, SectionId, SittingDay, TimelineEvent } from './types';
import type { Language } from './localization';

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
	language
}: BuildTimelineDateRailInput): TimelineDateRailItem[] {
	const dates = new Set<string>();

	for (const sittingDay of sittingDays) {
		if (matchesHouse(house, sittingDay.house)) {
			dates.add(sittingDay.date);
		}
	}

	for (const event of events) {
		if (matchesHouse(house, event.house)) {
			dates.add(event.date);
		}
	}

	return [...dates].sort().map((date) => {
		const eventCount = events.filter((event) => event.date === date && matchesHouse(house, event.house)).length;
		const sittingCount = sittingDays.filter((sittingDay) => sittingDay.date === date && matchesHouse(house, sittingDay.house)).length;

		return {
			date,
			selected: date === selectedDate,
			eventCount,
			sittingCount,
			href: buildDateHref({ section, date, house, language })
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
		.sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
		.map(([date, groupedEvents]) => ({
			date,
			events: groupedEvents
		}));
}
