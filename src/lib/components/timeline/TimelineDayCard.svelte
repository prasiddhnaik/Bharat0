<script lang="ts">
	import EventChip from './EventChip.svelte';
	import SourceBadge from '$lib/components/shared/SourceBadge.svelte';
	import { formatDate } from '$lib/domain/bill-stage-machine';
	import type { TimelineEvent } from '$lib/domain/types';

	let { event }: { event: TimelineEvent } = $props();
</script>

<article class="relative rounded-[1.25rem] border border-slate-800/90 bg-slate-950/80 p-4 shadow-xl shadow-black/20 transition hover:border-slate-700">
	<div class="absolute -left-[1.05rem] top-5 h-3 w-3 rounded-full border border-cyan-300 bg-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)]"></div>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<EventChip {event} />
		<span class="text-xs text-slate-500">{formatDate(event.date)}</span>
	</div>
	<h3 class="mt-3 text-base font-semibold text-slate-100">{event.title}</h3>
	<p class="mt-2 text-sm leading-6 text-slate-400">{event.description}</p>
	<div class="mt-4 flex flex-wrap items-center gap-2">
		<SourceBadge url={event.source_url} isDemoSeed={event.isDemoSeed} />
		<span class="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100">demo seed data</span>
	</div>
</article>
