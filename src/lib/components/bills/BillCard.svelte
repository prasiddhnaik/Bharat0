<script lang="ts">
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import SourceBadge from '$lib/components/shared/SourceBadge.svelte';
	import { formatDate } from '$lib/domain/bill-stage-machine';
	import {
		getBillSubtitle,
		getBillTitle,
		houseLabelsLocalized,
		type Language
	} from '$lib/domain/localization';
	import type { Bill } from '$lib/domain/types';

	let { bill, selected = false, language }: { bill: Bill; selected?: boolean; language: Language } = $props();

	const typeCode = $derived(
		bill.bill_type === 'money'
			? 'MB'
			: bill.bill_type === 'constitutional-amendment'
				? 'CAB'
				: bill.origin_house === 'rajya-sabha'
					? 'RS'
					: 'LS'
	);
	const typeClass = $derived(
		{
			LS: 'border-blue-200 bg-blue-50 text-blue-800',
			RS: 'border-emerald-200 bg-emerald-50 text-emerald-800',
			MB: 'border-amber-200 bg-amber-50 text-amber-800',
			CAB: 'border-purple-200 bg-purple-50 text-purple-800'
		}[typeCode]
	);
	const policy = $derived(
		bill.ministry.includes('Finance')
			? 'Finance'
			: bill.ministry.includes('Electronics')
				? 'Technology'
				: bill.ministry.includes('Health')
					? 'Health'
					: 'Law and Justice'
	);
	const policyClass = $derived(
		{
			Finance: 'bg-yellow-100 text-yellow-900',
			Technology: 'bg-violet-100 text-violet-900',
			Health: 'bg-emerald-100 text-emerald-900',
			'Law and Justice': 'bg-rose-100 text-rose-900'
		}[policy]
	);
</script>

<article class={`group border-b border-[var(--bz-border-2)] transition last:border-b-0 ${selected ? 'bg-[var(--bz-accent-3)]' : 'hover:bg-[var(--bz-surface-2)]'}`}>
	<a class="grid min-h-[4.75rem] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-3 py-3 text-left bz-focus md:grid-cols-[auto_minmax(0,1fr)_auto]" href={`/?section=bills&bill=${bill.id}&lang=${language}`}>
		<span class={`rounded border px-2 py-1 text-[11px] font-bold ${typeClass}`}>{typeCode}</span>
		<span class="min-w-0">
			<span class="bz-mono block text-[10.5px] text-[var(--bz-text-3)]">{bill.bill_number.replace('Sandbox ', '').replace('Bill No. ', '#').replace('Money Bill No. ', 'M#')}</span>
			<span class="mt-0.5 block text-sm font-semibold leading-5 text-[var(--bz-text-1)]">{getBillTitle(bill, language)}</span>
			<span class="mt-0.5 block text-[11.5px] leading-4 text-[var(--bz-text-3)]">{getBillSubtitle(bill, language)}</span>
		</span>
		<span class="hidden items-center gap-3 md:flex">
			<span class={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${policyClass}`}>{policy}</span>
			<span class="hidden text-[11px] text-[var(--bz-text-3)] lg:inline">{houseLabelsLocalized[language][bill.origin_house]}</span>
			<span class="hidden text-[11px] text-[var(--bz-text-3)] xl:inline">{formatDate(bill.latest_action_date)}</span>
			<span class="text-[12px] text-[var(--bz-accent)] opacity-45 transition group-hover:opacity-100">↗</span>
		</span>
	</a>
	<div class="flex flex-wrap items-center gap-1 px-3 pb-2 pl-[5.65rem] md:hidden">
		<StatusBadge stage={bill.current_stage} {language} />
		<SourceBadge url={bill.source_url} isDemoSeed={bill.isDemoSeed} />
	</div>
</article>
