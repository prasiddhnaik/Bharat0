<script lang="ts">
	import SourceBadge from '$lib/components/shared/SourceBadge.svelte';
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import { formatDate } from '$lib/domain/bill-stage-machine';
	import {
		billTypeLabelsLocalized,
		getBillSubtitle,
		getBillTitle,
		houseLabelsLocalized,
		t,
		type Language
	} from '$lib/domain/localization';
	import type { Bill, BillAction } from '$lib/domain/types';

	let { bill, actions = [], language }: { bill: Bill | null; actions?: BillAction[]; language: Language } = $props();
</script>

<aside class="overflow-hidden rounded-[1.75rem] border border-slate-800/90 bg-slate-950/85 shadow-2xl shadow-black/25 backdrop-blur lg:sticky lg:top-4">
	{#if bill}
		<div class="border-b border-slate-800/90 bg-slate-900/35 p-5">
			<div class="flex flex-wrap items-center gap-2">
				<StatusBadge stage={bill.current_stage} {language} />
				<span class="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">{billTypeLabelsLocalized[language][bill.bill_type]}</span>
			</div>
			<h2 class="mt-4 text-xl font-semibold leading-7 text-slate-100">{getBillTitle(bill, language)}</h2>
			<p class="mt-2 text-sm text-slate-500">{getBillSubtitle(bill, language)}</p>
		</div>
		<div class="p-5">
		<p class="text-sm leading-6 text-slate-300">{bill.summary}</p>

		<dl class="mt-5 grid grid-cols-2 gap-3 text-xs">
			<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
				<dt class="text-slate-500">{t('field.originHouse', language)}</dt>
				<dd class="mt-1 font-semibold text-slate-100">{houseLabelsLocalized[language][bill.origin_house]}</dd>
			</div>
			<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
				<dt class="text-slate-500">{t('field.billNumber', language)}</dt>
				<dd class="mt-1 font-semibold text-slate-100">{bill.bill_number}</dd>
			</div>
			<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
				<dt class="text-slate-500">{t('field.introduced', language)}</dt>
				<dd class="mt-1 font-semibold text-slate-100">{formatDate(bill.introduced_on)}</dd>
			</div>
			<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
				<dt class="text-slate-500">{t('field.latestAction', language)}</dt>
				<dd class="mt-1 font-semibold text-slate-100">{formatDate(bill.latest_action_date)}</dd>
			</div>
		</dl>

		<div class="mt-5">
			<p class="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">{t('field.actionHistory', language)}</p>
			<div class="relative mt-3 space-y-3 border-l border-slate-800 pl-4">
				{#each actions as action}
					<div class="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
						<span class="absolute -left-[1.35rem] top-4 h-2.5 w-2.5 rounded-full border border-cyan-300 bg-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.45)]"></span>
						<div class="flex items-center justify-between gap-3 text-xs text-slate-500">
							<span>{formatDate(action.date)}</span>
							<span>{houseLabelsLocalized[language][action.house]}</span>
						</div>
						<p class="mt-2 text-sm leading-6 text-slate-300">{action.description}</p>
						<div class="mt-3"><SourceBadge url={action.source_url} isDemoSeed={action.isDemoSeed} /></div>
					</div>
				{/each}
			</div>
		</div>
		<div class="mt-5 flex flex-wrap gap-2">
			<SourceBadge url={bill.source_url} isDemoSeed={bill.isDemoSeed} />
			<a class="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60" href={`/bills/${bill.id}?lang=${language}`}>{t('action.openBillRoute', language)}</a>
		</div>
		</div>
	{:else}
		<div class="p-5">
			<p class="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Bill detail</p>
			<h2 class="mt-3 text-lg font-semibold text-slate-100">{t('action.selectBill', language)}</h2>
			<p class="mt-2 text-sm leading-6 text-slate-500">Choose a compact Bill card to inspect stages, source links, and demo action history.</p>
		</div>
	{/if}
</aside>
