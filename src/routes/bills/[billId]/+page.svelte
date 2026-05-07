<script lang="ts">
	import AppShell from '$lib/components/shell/AppShell.svelte';
	import BillDetailPanel from '$lib/components/bills/BillDetailPanel.svelte';
	import TimelineRail from '$lib/components/timeline/TimelineRail.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<AppShell section="bills" query={data.detail.bill.title_en} language={data.language}>
	{#snippet aside()}
		<div class="p-4 text-sm leading-6 text-[var(--bz-text-2)]">
			<p class="bz-eyebrow text-[var(--bz-accent)]">Deep link</p>
			<p class="mt-3">This route uses sandbox records and is structured for official Bill reads once source connections are added.</p>
			<a class="mt-4 inline-flex rounded border border-[var(--bz-border)] px-3 py-1 text-xs text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus" href={`/?section=bills&lang=${data.language}`}>Back to Bills</a>
		</div>
	{/snippet}

	<BillDetailPanel bill={data.detail.bill} actions={data.detail.actions} language={data.language} />
	<TimelineRail events={data.relatedEvents} />
</AppShell>
