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

<section class="bz-panel overflow-hidden rounded-lg">
	<div class="border-b border-[var(--bz-border)] bg-[var(--bz-surface)] p-4">
	<div class="mb-5 flex items-center justify-between gap-3">
		<div>
			<p class="bz-eyebrow text-[var(--bz-accent)]">Timeline rail</p>
			<h2 class="mt-1 text-lg font-semibold text-[var(--bz-text-1)]">Sitting-day event stream</h2>
		</div>
		<span class="rounded-md border border-[var(--bz-border)] px-3 py-1.5 text-sm text-[var(--bz-text-2)]">{events.length} events</span>
	</div>
	{#if dateRail.length}
		<nav aria-label="Timeline dates" class="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
			{#each dateRail as day}
				<a
					href={day.href}
					class={`min-w-[10rem] rounded-md border px-4 py-3 text-left transition bz-focus ${
						day.selected ? 'border-[var(--bz-accent)] bg-[var(--bz-accent-2)] text-[var(--bz-accent)]' : 'border-[var(--bz-border)] bg-[var(--bz-surface-2)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)]'
					}`}
					aria-current={day.selected ? 'date' : undefined}
				>
					<span class="block text-sm font-semibold">{formatDate(day.date)}</span>
					<span class="mt-1.5 block text-xs text-[var(--bz-text-3)]">{day.eventCount} events · {day.sittingCount} sittings</span>
				</a>
			{/each}
		</nav>
	{/if}
	</div>
	{#if events.length}
		<div class="relative m-5 ml-8 space-y-8 border-l border-[var(--bz-border)] pl-7">
			{#each eventGroups as group}
				<div>
					<p class="mb-3 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--bz-text-2)]">{formatDate(group.date)}</p>
					<div class="space-y-5">
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
