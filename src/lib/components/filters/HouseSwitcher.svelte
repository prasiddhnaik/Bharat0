<script lang="ts">
	import { HOUSES, type House } from '$lib/domain/types';
	import { houseLabelsLocalized, t, type Language } from '$lib/domain/localization';

	let { selected, language }: { selected: House | 'all'; language: Language } = $props();
</script>

<label class="grid min-w-0 gap-1 text-xs font-medium text-slate-400">
	{t('field.house', language)}
	<select
		name="house"
		class="min-h-11 min-w-0 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
	>
		<option value="all" selected={selected === 'all'}>{t('field.allHouses', language)}</option>
		{#each HOUSES as house}
			<option value={house} selected={selected === house}>{houseLabelsLocalized[language][house]}</option>
		{/each}
	</select>
</label>
