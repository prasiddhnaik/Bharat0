<script lang="ts">
	import { t, type Language } from '$lib/domain/localization';

	let { date, sessionName, language }: { date: string; sessionName: string; language: Language } = $props();
</script>

<div class="grid min-w-0 gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--bz-text-3)]">
	{t('field.sessionDay', language)}
	<div class="flex min-h-9 min-w-0 items-center gap-2 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-xs normal-case tracking-normal text-[var(--bz-text-1)] focus-within:border-[var(--bz-accent)] focus-within:ring-2 focus-within:ring-amber-500/10" title={sessionName}>
		<input class="min-w-0 flex-1 bg-transparent outline-none" type="date" name="date" value={date} />
	</div>
</div>
