import assert from 'node:assert/strict';
import { buildTimelineDateRail, groupTimelineEventsByDate } from '../src/lib/domain/timeline-view';
import type { SittingDay, TimelineEvent } from '../src/lib/domain/types';

const sittingDays: SittingDay[] = [
	{
		id: 'sit-ls-2026-07-19',
		date: '2026-07-19',
		house: 'lok-sabha',
		session_name: 'Demo Session',
		status: 'demo',
		isDemoSeed: true
	},
	{
		id: 'sit-rs-2026-07-20',
		date: '2026-07-20',
		house: 'rajya-sabha',
		session_name: 'Demo Session',
		status: 'demo',
		isDemoSeed: true
	}
];

const events: TimelineEvent[] = [
	{
		id: 'evt-ls-2026-07-20',
		date: '2026-07-20',
		house: 'lok-sabha',
		type: 'bill_introduced',
		title: 'Bill introduced',
		description: 'Demo event',
		source_url: 'https://sansad.in/ls',
		isDemoSeed: true
	},
	{
		id: 'evt-rs-2026-07-20',
		date: '2026-07-20',
		house: 'rajya-sabha',
		type: 'question_answered',
		title: 'Question answered',
		description: 'Demo event',
		source_url: 'https://sansad.in/rs',
		isDemoSeed: true
	},
	{
		id: 'evt-ls-2026-07-21',
		date: '2026-07-21',
		house: 'lok-sabha',
		type: 'debate_published',
		title: 'Debate published',
		description: 'Demo event',
		source_url: 'https://sansad.in/ls',
		isDemoSeed: true
	}
];

const allHouseRail = buildTimelineDateRail({
	events,
	sittingDays,
	selectedDate: '2026-07-20',
	house: 'all',
	section: 'timeline',
	language: 'hi'
});

assert.deepEqual(
	allHouseRail.map((day) => day.date),
	['2026-07-21', '2026-07-20', '2026-07-19']
);
assert.equal(allHouseRail[1]?.selected, true);
assert.equal(allHouseRail[1]?.eventCount, 2);
assert.equal(allHouseRail[1]?.sittingCount, 1);
assert.equal(allHouseRail[1]?.href, '/?section=timeline&date=2026-07-20&lang=hi');

const lokSabhaRail = buildTimelineDateRail({
	events,
	sittingDays,
	selectedDate: '2026-07-20',
	house: 'lok-sabha',
	section: 'timeline',
	language: 'en'
});
assert.deepEqual(
	lokSabhaRail.map((day) => `${day.date}:${day.eventCount}:${day.sittingCount}`),
	['2026-07-21:1:0', '2026-07-20:1:0', '2026-07-19:0:1']
);
assert.equal(lokSabhaRail[1]?.href, '/?section=timeline&house=lok-sabha&date=2026-07-20&lang=en');

const groups = groupTimelineEventsByDate(events);
assert.deepEqual(
	groups.map((group) => `${group.date}:${group.events.length}`),
	['2026-07-21:1', '2026-07-20:2']
);
assert.equal(groups[0]?.events[0]?.id, 'evt-ls-2026-07-21');

console.log('Timeline view contract checks passed.');
