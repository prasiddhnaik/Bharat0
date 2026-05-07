<script lang="ts">
	import { HOUSES, type House } from '$lib/domain/types';
	import { houseLabelsLocalized, t, type Language } from '$lib/domain/localization';

	let { selected, language }: { selected: House | 'all'; language: Language } = $props();
</script>

<label class="grid min-w-0 gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--bz-text-3)]">
	{t('field.house', language)}
	<select
		name="house"
		class="min-h-9 min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-xs normal-case tracking-normal text-[var(--bz-text-1)] outline-none focus:border-[var(--bz-accent)] focus:ring-2 focus:ring-amber-500/10"
	>
		<option value="all" selected={selected === 'all'}>{t('field.allHouses', language)}</option>
		{#each HOUSES as house}
			<option value={house} selected={selected === house}>{houseLabelsLocalized[language][house]}</option>
		{/each}
	</select>
</label>
