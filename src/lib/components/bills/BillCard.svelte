<script lang="ts">
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import SourceBadge from '$lib/components/shared/SourceBadge.svelte';
	import { formatDate } from '$lib/domain/bill-stage-machine';
	import {
		billTypeLabelsLocalized,
		getBillSubtitle,
		getBillTitle,
		houseLabelsLocalized,
		t,
		type Language
	} from '$lib/domain/localization';
	import type { Bill } from '$lib/domain/types';

	let { bill, selected = false, language }: { bill: Bill; selected?: boolean; language: Language } = $props();
</script>

<article
	class={`group relative overflow-hidden rounded-[1.35rem] border p-4 shadow-xl shadow-black/15 transition ${
		selected ? 'border-cyan-400/70 bg-cyan-400/10' : 'border-slate-800/90 bg-slate-950/75 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/75'
	}`}
>
	<div class={`absolute inset-y-0 left-0 w-1 ${selected ? 'bg-cyan-300' : 'bg-slate-800 group-hover:bg-cyan-400/60'}`}></div>
	<div class="flex flex-wrap items-center gap-2 pl-1">
		<StatusBadge stage={bill.current_stage} {language} />
		<span class="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">{billTypeLabelsLocalized[language][bill.bill_type]}</span>
	</div>
	<h3 class="mt-3 text-base font-semibold leading-6 text-slate-100">
		<a class="rounded-sm hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60" href={`/?section=bills&bill=${bill.id}&lang=${language}`}>
			{getBillTitle(bill, language)}
		</a>
	</h3>
	<p class="mt-1 text-xs leading-5 text-slate-500">{getBillSubtitle(bill, language)}</p>
	<div class="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
		<span class="rounded-xl border border-slate-800 bg-slate-950/70 px-2.5 py-2">{houseLabelsLocalized[language][bill.origin_house]}</span>
		<span class="min-w-0 truncate rounded-xl border border-slate-800 bg-slate-950/70 px-2.5 py-2">{bill.ministry}</span>
		<span class="rounded-xl border border-slate-800 bg-slate-950/70 px-2.5 py-2">{t('field.introduced', language)} {formatDate(bill.introduced_on)}</span>
		<span class="rounded-xl border border-slate-800 bg-slate-950/70 px-2.5 py-2">{t('field.latestAction', language)} {formatDate(bill.latest_action_date)}</span>
	</div>
	<div class="mt-4 flex flex-wrap gap-2">
		<SourceBadge url={bill.source_url} isDemoSeed={bill.isDemoSeed} />
		<span class="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100">{t('label.demoSeedData', language)}</span>
	</div>
</article>
