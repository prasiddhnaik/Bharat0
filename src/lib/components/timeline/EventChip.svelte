<script lang="ts">
	import { houseLabels } from '$lib/domain/bill-stage-machine';
	import type { TimelineEvent } from '$lib/domain/types';

	let { event }: { event: TimelineEvent } = $props();
</script>

<div class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 shadow-inner shadow-black/20">
	<span class="h-1.5 w-1.5 rounded-full bg-cyan-300"></span>
	<span>{houseLabels[event.house]}</span>
	<span class="text-slate-600">/</span>
	<span class="uppercase tracking-[0.16em] text-slate-500">{event.type.replaceAll('_', ' ')}</span>
</div>
