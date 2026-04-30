<script lang="ts">
	import { SECTION_IDS, type SectionId } from '$lib/domain/types';
	import { getSectionLabel, type Language } from '$lib/domain/localization';

	let {
		active,
		language
	}: { active: SectionId; language: Language } = $props();

	const fixedSections: SectionId[] = ['timeline'];
	const primarySections: SectionId[] = ['bills', 'committees'];
	const secondarySections = SECTION_IDS.filter((section) => section !== 'overview' && !fixedSections.includes(section) && !primarySections.includes(section));

	function linkClass(section: SectionId) {
		return `relative z-20 grid h-10 min-w-[5.75rem] shrink-0 select-none place-items-center whitespace-nowrap rounded-md border border-transparent px-3 text-xs font-medium leading-none transition bz-focus ${
			active === section ? 'bg-[var(--bz-accent-2)] text-[var(--bz-accent)]' : 'text-[var(--bz-text-2)] hover:bg-[var(--bz-surface-2)] hover:text-[var(--bz-text-1)]'
		}`;
	}

	function hrefFor(section: SectionId) {
		return `/?section=${section}&lang=${language}`;
	}
</script>

<nav class="relative z-20 flex shrink-0 items-center gap-1 overflow-visible" aria-label="Sections">
	<a
		class={`group relative z-20 flex shrink-0 select-none items-center justify-center whitespace-nowrap text-xs font-medium leading-none transition bz-focus ${
			active === 'overview' ? 'text-[var(--bz-accent)]' : 'text-[var(--bz-text-2)] hover:text-[var(--bz-text-1)]'
		}`}
		data-testid="section-overview-button"
		data-sveltekit-reload
		href={hrefFor('overview')}
		aria-current={active === 'overview' ? 'page' : undefined}
		style="position: relative; z-index: 9999; min-height: 3rem; align-self: stretch; pointer-events: auto;"
	>
		<span
			class={`grid h-10 min-w-[5.75rem] place-items-center rounded-md border border-transparent px-3 transition ${
				active === 'overview' ? 'bg-[var(--bz-accent-2)]' : 'group-hover:bg-[var(--bz-surface-2)]'
			}`}
		>
			{getSectionLabel('overview', language)}
		</span>
	</a>
	{#each fixedSections as section}
		<a
			class={linkClass(section)}
			data-testid={`section-${section}-button`}
			data-sveltekit-reload
			href={hrefFor(section)}
			aria-current={active === section ? 'page' : undefined}
		>
			{getSectionLabel(section, language)}
		</a>
	{/each}
	{#each primarySections as section}
		<a
			class={linkClass(section)}
			data-testid={`section-${section}-button`}
			data-sveltekit-reload
			href={hrefFor(section)}
			aria-current={active === section ? 'page' : undefined}
		>
			{getSectionLabel(section, language)}
		</a>
	{/each}
	<details class="relative">
		<summary
			class={`list-none rounded-md px-2.5 py-1.5 text-xs font-medium transition marker:hidden bz-focus ${
				secondarySections.includes(active) ? 'bg-[var(--bz-accent-2)] text-[var(--bz-accent)]' : 'text-[var(--bz-text-2)] hover:bg-[var(--bz-surface-2)] hover:text-[var(--bz-text-1)]'
			}`}
		>
			More
		</summary>
		<div class="absolute left-0 top-full z-50 mt-1 grid min-w-32 gap-1 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] p-1 shadow-lg">
			{#each secondarySections as section}
				<a
					class={linkClass(section)}
					data-sveltekit-reload
					href={hrefFor(section)}
					aria-current={active === section ? 'page' : undefined}
				>
					{getSectionLabel(section, language)}
				</a>
			{/each}
		</div>
	</details>
</nav>
