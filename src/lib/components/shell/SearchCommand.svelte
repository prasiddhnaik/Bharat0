<script lang="ts">
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { t, type Language } from '$lib/domain/localization';
	import type { SectionId } from '$lib/domain/types';

	let { query, language, section }: { query: string; language: Language; section: SectionId } = $props();
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	function searchUrl(value: string) {
		const params = new URLSearchParams({ section, lang: language });
		const trimmed = value.trim();
		if (trimmed) params.set('q', trimmed);
		return `/?${params.toString()}`;
	}

	function applySearch(form: HTMLFormElement) {
		if (searchTimer) clearTimeout(searchTimer);
		const formData = new FormData(form);
		void goto(searchUrl(String(formData.get('q') ?? '')));
	}

	function queueSearch(value: string) {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			void goto(searchUrl(value));
		}, 250);
	}

	function clearSearch() {
		if (searchTimer) clearTimeout(searchTimer);
		void goto(searchUrl(''));
	}

	onDestroy(() => {
		if (searchTimer) clearTimeout(searchTimer);
	});
</script>

<form
	class="flex min-h-8 items-center gap-2 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 text-xs text-[var(--bz-text-2)] focus-within:border-[var(--bz-accent)] focus-within:ring-2 focus-within:ring-amber-500/10"
	action="/"
	method="GET"
	onsubmit={(event) => {
		event.preventDefault();
		applySearch(event.currentTarget);
	}}
>
	<input type="hidden" name="section" value={section} />
	<input type="hidden" name="lang" value={language} />
	<span class="text-[var(--bz-accent)]">⌕</span>
	<input
		class="min-w-0 flex-1 bg-transparent py-1.5 text-xs text-[var(--bz-text-1)] outline-none placeholder:text-[var(--bz-text-3)]"
		name="q"
		value={query}
		placeholder={t('label.searchPlaceholder', language)}
		oninput={(event) => queueSearch(event.currentTarget.value)}
		onkeydown={(event) => {
			if (event.key === 'Escape') clearSearch();
		}}
	/>
	{#if query}
		<button class="rounded px-1 text-[10px] text-[var(--bz-text-3)] transition hover:text-[var(--bz-accent)] bz-focus" type="button" aria-label="Clear search" onclick={clearSearch}>Esc</button>
	{/if}
</form>
