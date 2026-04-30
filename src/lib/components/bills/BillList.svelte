<script lang="ts">
	import BillCard from './BillCard.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import type { Language } from '$lib/domain/localization';
	import type { Bill } from '$lib/domain/types';
	import { formatDate } from '$lib/domain/bill-stage-machine';

	let { bills, selectedBillId, language }: { bills: Bill[]; selectedBillId?: string; language: Language } = $props();

	const groups = $derived(
		Object.entries(
			bills.reduce(
				(grouped, bill) => {
					(grouped[bill.latest_action_date] ??= []).push(bill);
					return grouped;
				},
				{} as Record<string, Bill[]>
			)
		).sort(([left], [right]) => right.localeCompare(left))
	);
</script>

<section class="space-y-3">
	{#if bills.length}
		{#each groups as [date, items]}
			<div>
				<div class="mb-1.5 flex items-center gap-2 px-1">
					<span class="text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--bz-text-2)]">{formatDate(date)}</span>
					<span class="rounded bg-[var(--bz-accent-2)] px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--bz-accent)]">{items.length} action{items.length === 1 ? '' : 's'}</span>
				</div>
				<div class="bz-panel overflow-hidden rounded-lg">
					{#each items as bill}
						<BillCard {bill} selected={bill.id === selectedBillId} {language} />
					{/each}
				</div>
			</div>
		{/each}
	{:else}
		<EmptyState title="No bills match these filters" message="The prototype only includes a small demo seed set. Real source ingestion comes later." />
	{/if}
</section>
