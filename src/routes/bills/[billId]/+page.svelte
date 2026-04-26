<script lang="ts">
	import AppShell from '$lib/components/shell/AppShell.svelte';
	import BillDetailPanel from '$lib/components/bills/BillDetailPanel.svelte';
	import TimelineRail from '$lib/components/timeline/TimelineRail.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<AppShell section="bills" query={data.detail.bill.title_en} language={data.language}>
	{#snippet aside()}
		<div class="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 text-sm leading-6 text-slate-400">
			<p class="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Deep link</p>
			<p class="mt-3">This route is backed by demo seed data. It is ready for database-backed Bill reads after official ingestion adapters are implemented.</p>
			<a class="mt-4 inline-flex rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-cyan-400" href={`/?section=bills&lang=${data.language}`}>Back to Bills</a>
		</div>
	{/snippet}

	<BillDetailPanel bill={data.detail.bill} actions={data.detail.actions} language={data.language} />
	<TimelineRail events={data.relatedEvents} />
</AppShell>
