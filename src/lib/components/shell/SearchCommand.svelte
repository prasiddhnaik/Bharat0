<script lang="ts">
	import { t, type Language } from '$lib/domain/localization';

	let { query, language }: { query: string; language: Language } = $props();
</script>

<div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
	<div class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-400">
		<span class="text-cyan-300">⌘</span>
		<span>{query ? `Filtered by \"${query}\"` : t('label.searchPlaceholder', language)}</span>
	</div>
</div>
