<script lang="ts">
	import { t, type Language } from '$lib/domain/localization';

	let { date, sessionName, language }: { date: string; sessionName: string; language: Language } = $props();
</script>

<div class="grid min-w-0 gap-1 text-xs font-medium text-slate-400">
	{t('field.sessionDay', language)}
	<div class="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/15">
		<input class="min-w-0 flex-1 bg-transparent outline-none" type="date" name="date" value={date} />
		<span class="hidden min-w-0 truncate border-l border-slate-800 pl-2 text-xs text-slate-500 lg:block">{sessionName}</span>
	</div>
</div>
