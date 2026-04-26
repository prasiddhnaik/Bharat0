<script lang="ts">
	import TimelineDayCard from './TimelineDayCard.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import { formatDate } from '$lib/domain/bill-stage-machine';
	import type { TimelineDateGroup, TimelineDateRailItem } from '$lib/domain/timeline-view';
	import type { TimelineEvent } from '$lib/domain/types';

	let {
		events,
		dateRail = [],
		groups
	}: { events: TimelineEvent[]; dateRail?: TimelineDateRailItem[]; groups?: TimelineDateGroup[] } = $props();

	const eventGroups = $derived(groups ?? [{ date: events[0]?.date ?? '', events }].filter((group) => group.date));
</script>

<section class="overflow-hidden rounded-[1.75rem] border border-slate-800/90 bg-slate-950/55 shadow-xl shadow-black/20 backdrop-blur">
	<div class="border-b border-slate-800/80 bg-slate-900/30 p-4">
	<div class="mb-4 flex items-center justify-between gap-3">
		<div>
			<p class="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Timeline rail</p>
			<h2 class="mt-1 text-xl font-semibold text-slate-100">Sitting-day event stream</h2>
		</div>
		<span class="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400">{events.length} events</span>
	</div>
	{#if dateRail.length}
		<nav aria-label="Timeline dates" class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
			{#each dateRail as day}
				<a
					href={day.href}
					class={`min-w-[8.25rem] rounded-2xl border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${
						day.selected ? 'border-cyan-400/70 bg-cyan-400/10 text-cyan-50 shadow-lg shadow-cyan-950/30' : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-600'
					}`}
					aria-current={day.selected ? 'date' : undefined}
				>
					<span class="block text-xs font-semibold">{formatDate(day.date)}</span>
					<span class="mt-1 block text-[11px] text-slate-500">{day.eventCount} events · {day.sittingCount} sittings</span>
				</a>
			{/each}
		</nav>
	{/if}
	</div>
	{#if events.length}
		<div class="relative m-4 ml-7 space-y-6 border-l border-slate-800 pl-6">
			{#each eventGroups as group}
				<div>
					<p class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{formatDate(group.date)}</p>
					<div class="space-y-4">
						{#each group.events as event}
							<TimelineDayCard {event} />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<EmptyState title="No demo events for this filter" message="Change the date or House filter. Real official ingestion is intentionally not built yet." />
	{/if}
</section>
