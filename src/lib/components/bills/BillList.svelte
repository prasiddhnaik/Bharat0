<script lang="ts">
	import BillCard from './BillCard.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import type { Language } from '$lib/domain/localization';
	import type { Bill } from '$lib/domain/types';

	let { bills, selectedBillId, language }: { bills: Bill[]; selectedBillId?: string; language: Language } = $props();
</script>

<section class="space-y-3">
	{#if bills.length}
		{#each bills as bill}
			<BillCard {bill} selected={bill.id === selectedBillId} {language} />
		{/each}
	{:else}
		<EmptyState title="No bills match these filters" message="The prototype only includes a small demo seed set. Real source ingestion comes later." />
	{/if}
</section>
