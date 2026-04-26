<script lang="ts">
	import { getStageTone } from '$lib/domain/bill-stage-machine';
	import { stageLabelsLocalized, type Language } from '$lib/domain/localization';
	import type { BillStage } from '$lib/domain/types';

	let { stage, language = 'en' }: { stage: BillStage; language?: Language } = $props();

	const toneClass = $derived(
		{
			neutral: 'border-slate-700 bg-slate-900/80 text-slate-300',
			active: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
			warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
			success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
			danger: 'border-rose-500/30 bg-rose-500/10 text-rose-200'
		}[getStageTone(stage)]
	);
</script>

<span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClass}`}>
	{stageLabelsLocalized[language][stage]}
</span>
