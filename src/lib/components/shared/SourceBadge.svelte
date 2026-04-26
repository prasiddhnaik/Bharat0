<script lang="ts">
	import { sourceKindLabels } from '$lib/domain/bill-stage-machine';
	import type { SourceKind } from '$lib/domain/types';

	let {
		url,
		kind = 'demo-seed',
		label,
		isDemoSeed = true
	}: { url: string; kind?: SourceKind; label?: string; isDemoSeed?: boolean } = $props();
</script>

<a
	href={url}
	target="_blank"
	rel="noreferrer"
	class="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950/70 px-2 py-0.5 text-[11px] font-medium text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-100"
	aria-label={`Open source target: ${label ?? sourceKindLabels[kind]}`}
>
	<span class="h-1.5 w-1.5 rounded-full bg-cyan-300"></span>
	{label ?? sourceKindLabels[kind]}
	{#if isDemoSeed}
		<span class="text-amber-200/90">demo</span>
	{/if}
</a>
