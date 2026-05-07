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

<form class="bz-panel grid max-w-full gap-3 overflow-hidden rounded-lg p-3 md:grid-cols-2 2xl:grid-cols-[minmax(16rem,1fr)_minmax(12rem,13rem)_minmax(10rem,12rem)_minmax(14rem,16rem)]" action="/" method="GET">
	<input type="hidden" name="section" value={section} />
	<input type="hidden" name="lang" value={language} />
	<label class="grid min-w-0 gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--bz-text-3)]">
		{t('field.search', language)}
		<input
			name="q"
			value={query}
			placeholder={t('label.searchPlaceholder', language)}
			class="min-h-9 min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-xs normal-case tracking-normal text-[var(--bz-text-1)] outline-none placeholder:text-[var(--bz-text-3)] focus:border-[var(--bz-accent)] focus:ring-2 focus:ring-amber-500/10"
		/>
	</label>
	<HouseSwitcher selected={house} {language} />
	<SessionPicker {date} {sessionName} {language} />
	<label class="grid min-w-0 gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--bz-text-3)]">
		{t('field.billStage', language)}
		<select name="status" class="min-h-9 min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-xs normal-case tracking-normal text-[var(--bz-text-1)] outline-none focus:border-[var(--bz-accent)] focus:ring-2 focus:ring-amber-500/10">
			<option value="all" selected={status === 'all'}>{t('field.allStages', language)}</option>
			{#each stageOptions as stage}
				<option value={stage} selected={status === stage}>{stageLabelsLocalized[language][stage]}</option>
			{/each}
		</select>
	</label>
	<div class="flex min-w-0 justify-end md:col-span-2 2xl:col-span-4">
		<button class="min-h-9 w-full rounded-md border border-[var(--bz-accent)] bg-[var(--bz-accent-2)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--bz-accent)] transition hover:bg-[var(--bz-accent)] hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 sm:w-auto" type="submit">
			{t('action.applyFilters', language)}
		</button>
	</div>
</form>
