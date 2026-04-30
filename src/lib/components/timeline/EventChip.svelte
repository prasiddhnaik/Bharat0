<script lang="ts">
	import { houseLabels } from '$lib/domain/bill-stage-machine';
	import type { TimelineEvent } from '$lib/domain/types';

	let { event }: { event: TimelineEvent } = $props();
</script>

<div class="inline-flex items-center gap-2 rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1 text-[10.5px] text-[var(--bz-text-2)]">
	<span class="h-1.5 w-1.5 rounded-full bg-[var(--bz-accent)]"></span>
	<span>{houseLabels[event.house]}</span>
	<span class="text-[var(--bz-text-3)]">/</span>
	<span class="uppercase tracking-[0.07em] text-[var(--bz-text-3)]">{event.type.replaceAll('_', ' ')}</span>
</div>
