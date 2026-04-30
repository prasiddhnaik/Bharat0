<script lang="ts">
	import EventChip from './EventChip.svelte';
	import SourceBadge from '$lib/components/shared/SourceBadge.svelte';
	import { formatDate } from '$lib/domain/bill-stage-machine';
	import type { TimelineEvent } from '$lib/domain/types';

	let { event }: { event: TimelineEvent } = $props();
</script>

<article class="relative rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] p-3 transition hover:bg-[var(--bz-surface-2)]">
	<div class="absolute -left-[1.05rem] top-5 h-3 w-3 rounded-full border-2 border-[var(--bz-surface)] bg-[var(--bz-accent)]"></div>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<EventChip {event} />
		<span class="bz-mono text-[10.5px] text-[var(--bz-text-3)]">{formatDate(event.date)}</span>
	</div>
	<h3 class="mt-3 text-sm font-semibold text-[var(--bz-text-1)]">{event.title}</h3>
	<p class="mt-1 text-[12.5px] leading-5 text-[var(--bz-text-2)]">{event.description}</p>
	<div class="mt-3 flex flex-wrap items-center gap-2">
		<SourceBadge url={event.source_url} isDemoSeed={event.isDemoSeed} />
		<span class="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10.5px] text-amber-800">sandbox data</span>
	</div>
</article>
