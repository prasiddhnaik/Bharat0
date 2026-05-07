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

<aside class="min-h-full overflow-hidden bg-[var(--bz-surface)] text-[var(--bz-text-1)]">
	{#if bill}
		<div class="border-b border-[var(--bz-border)] bg-[var(--bz-surface)] px-4 py-3">
			<div class="flex flex-wrap items-center gap-2">
				<StatusBadge stage={bill.current_stage} {language} />
				<span class="rounded border border-[var(--bz-border)] px-1.5 py-0.5 text-[10.5px] text-[var(--bz-text-2)]">{billTypeLabelsLocalized[language][bill.bill_type]}</span>
				{#if bill.isDemoSeed}
					<span class="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10.5px] text-[var(--bz-text-2)]">Sandbox record</span>
				{/if}
			</div>
			<h2 class="mt-3 text-lg font-bold leading-6 text-[var(--bz-text-1)]">{getBillTitle(bill, language)}</h2>
			<p class="mt-1 text-xs italic text-[var(--bz-text-2)]">{getBillSubtitle(bill, language)}</p>
		</div>
		<div class="p-4">
		<p class="text-[13px] leading-6 text-[var(--bz-text-2)]">{bill.summary}</p>

		<dl class="mt-5 grid grid-cols-2 gap-2 text-xs">
			<div class="bz-panel-muted rounded-lg p-3">
				<dt class="bz-eyebrow text-[0.55rem]">{t('field.originHouse', language)}</dt>
				<dd class="mt-1 font-semibold text-[var(--bz-text-1)]">{houseLabelsLocalized[language][bill.origin_house]}</dd>
			</div>
			<div class="bz-panel-muted rounded-lg p-3">
				<dt class="bz-eyebrow text-[0.55rem]">{t('field.billNumber', language)}</dt>
				<dd class="bz-mono mt-1 font-semibold text-[var(--bz-text-1)]">{bill.bill_number}</dd>
			</div>
			<div class="bz-panel-muted rounded-lg p-3">
				<dt class="bz-eyebrow text-[0.55rem]">{t('field.introduced', language)}</dt>
				<dd class="mt-1 font-semibold text-[var(--bz-text-1)]">{formatDate(bill.introduced_on)}</dd>
			</div>
			<div class="bz-panel-muted rounded-lg p-3">
				<dt class="bz-eyebrow text-[0.55rem]">{t('field.latestAction', language)}</dt>
				<dd class="mt-1 font-semibold text-[var(--bz-text-1)]">{formatDate(bill.latest_action_date)}</dd>
			</div>
		</dl>

		<div class="mt-5">
			<p class="bz-eyebrow">{t('field.actionHistory', language)}</p>
			<div class="relative mt-3 space-y-4 border-l border-[var(--bz-border)] pl-4">
				{#each actions as action}
					<div class="relative">
						<span class="absolute -left-[1.28rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--bz-surface)] bg-[var(--bz-accent)]"></span>
						<div class="flex items-center justify-between gap-3 text-[11px] text-[var(--bz-text-3)]">
							<span class="bz-mono">{formatDate(action.date)}</span>
							<span>{houseLabelsLocalized[language][action.house]}</span>
						</div>
						<p class="mt-1 text-[12.5px] leading-5 text-[var(--bz-text-1)]">{action.description}</p>
						<div class="mt-3"><SourceBadge url={action.source_url} isDemoSeed={action.isDemoSeed} /></div>
					</div>
				{/each}
			</div>
		</div>
		<div class="mt-5 flex flex-wrap gap-2">
			<SourceBadge url={bill.source_url} isDemoSeed={bill.isDemoSeed} />
			<a class="rounded border border-[var(--bz-border)] px-2 py-1 text-[10.5px] font-medium text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus" href={`/bills/${bill.id}?lang=${language}`}>{t('action.openBillRoute', language)}</a>
		</div>
		</div>
	{:else}
		<div class="p-4">
			<p class="bz-eyebrow text-[var(--bz-accent)]">Bill detail</p>
			<h2 class="mt-3 text-lg font-semibold text-[var(--bz-text-1)]">{t('action.selectBill', language)}</h2>
			<p class="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">Choose a compact Bill row to inspect stages, source links, and action history.</p>
		</div>
	{/if}
</aside>
