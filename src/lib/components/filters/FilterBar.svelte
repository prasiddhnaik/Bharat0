<script lang="ts">
	import HouseSwitcher from './HouseSwitcher.svelte';
	import SessionPicker from './SessionPicker.svelte';
	import { ORDINARY_BILL_STAGES, MONEY_BILL_STAGES, type BillStage, type House, type SectionId } from '$lib/domain/types';
	import { stageLabelsLocalized, t, type Language } from '$lib/domain/localization';

	let {
		section,
		house,
		date,
		status,
		query,
		sessionName,
		language
	}: {
		section: SectionId;
		house: House | 'all';
		date: string;
		status: BillStage | 'all';
		query: string;
		sessionName: string;
		language: Language;
	} = $props();

	const stageOptions = [...ORDINARY_BILL_STAGES, ...MONEY_BILL_STAGES];
</script>

<form class="grid max-w-full gap-3 overflow-hidden rounded-[1.35rem] border border-slate-800/90 bg-slate-950/70 p-3 shadow-xl shadow-black/20 backdrop-blur md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(11rem,13rem)_minmax(12rem,15rem)_minmax(12rem,16rem)]" action="/" method="GET">
	<input type="hidden" name="section" value={section} />
	<input type="hidden" name="lang" value={language} />
	<label class="grid min-w-0 gap-1 text-xs font-medium text-slate-400">
		{t('field.search', language)}
		<input
			name="q"
			value={query}
			placeholder={t('label.searchPlaceholder', language)}
			class="min-h-11 min-w-0 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
		/>
	</label>
	<HouseSwitcher selected={house} {language} />
	<SessionPicker {date} {sessionName} {language} />
	<label class="grid min-w-0 gap-1 text-xs font-medium text-slate-400">
		{t('field.billStage', language)}
		<select name="status" class="min-h-11 min-w-0 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15">
			<option value="all" selected={status === 'all'}>{t('field.allStages', language)}</option>
			{#each stageOptions as stage}
				<option value={stage} selected={status === stage}>{stageLabelsLocalized[language][stage]}</option>
			{/each}
		</select>
	</label>
	<div class="flex min-w-0 justify-end md:col-span-2 xl:col-span-4">
		<button class="min-h-11 w-full rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 sm:w-auto" type="submit">
			{t('action.applyFilters', language)}
		</button>
	</div>
</form>
