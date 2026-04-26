<script lang="ts">
	import { SECTION_IDS, type SectionId } from '$lib/domain/types';
	import { getSectionLabel, type Language } from '$lib/domain/localization';

	let { active, language }: { active: SectionId; language: Language } = $props();

	function hrefFor(section: SectionId) {
		return `/?section=${section}&lang=${language}`;
	}
</script>

<nav class="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 p-1 shadow-inner shadow-black/30 [scrollbar-width:thin]" aria-label="Sections">
	{#each SECTION_IDS as section}
		<a
			href={hrefFor(section)}
			class={`min-h-11 shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${
				active === section ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/40' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
			}`}
		>
			{getSectionLabel(section, language)}
		</a>
	{/each}
</nav>
