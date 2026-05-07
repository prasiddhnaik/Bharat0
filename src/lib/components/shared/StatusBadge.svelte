<script lang="ts">
	import { getStageTone } from '$lib/domain/bill-stage-machine';
	import { stageLabelsLocalized, type Language } from '$lib/domain/localization';
	import type { BillStage } from '$lib/domain/types';

	let { stage, language = 'en' }: { stage: BillStage; language?: Language } = $props();

	const toneClass = $derived(
		{
			neutral: 'border-[var(--bz-border)] bg-[var(--bz-surface-2)] text-[var(--bz-text-2)] [--dot:#94a3b8]',
			active: 'border-blue-200 bg-blue-50 text-blue-800 [--dot:#3b82f6]',
			warning: 'border-amber-200 bg-amber-50 text-amber-800 [--dot:#d97706]',
			success: 'border-emerald-200 bg-emerald-50 text-emerald-800 [--dot:#10b981]',
			danger: 'border-rose-200 bg-rose-50 text-rose-800 [--dot:#ef4444]'
		}[getStageTone(stage)]
	);
</script>

<span class={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10.5px] font-semibold ${toneClass}`}>
	<span class="h-1.5 w-1.5 rounded-full bg-[var(--dot)]"></span>
	{stageLabelsLocalized[language][stage]}
</span>
