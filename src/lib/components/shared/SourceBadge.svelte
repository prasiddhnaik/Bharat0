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
	class="inline-flex items-center gap-1 rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus"
	aria-label={`Open source target: ${label ?? sourceKindLabels[kind]}`}
	title={isDemoSeed ? 'Sandbox source link for this demo record' : 'Open official source'}
>
	<span class="h-1.5 w-1.5 rounded-full bg-[var(--bz-accent)]"></span>
	{label ?? sourceKindLabels[kind]}
	{#if isDemoSeed}
		<span class="text-[var(--bz-accent)]">sandbox</span>
	{/if}
</a>
