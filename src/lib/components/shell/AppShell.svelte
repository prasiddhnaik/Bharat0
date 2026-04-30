<script lang="ts">
	import type { Snippet } from 'svelte';
	import SectionTabs from './SectionTabs.svelte';
	import SearchCommand from './SearchCommand.svelte';
	import type { SectionId } from '$lib/domain/types';
	import type { Language } from '$lib/domain/localization';

	let {
		section,
		query,
		language,
		children,
		aside
	}: {
		section: SectionId;
		query: string;
		language: Language;
		children: Snippet;
		aside?: Snippet;
	} = $props();

	let darkMode = $state(false);
	let sidebarCollapsed = $state(false);
	let signedInDemo = $state(false);
	let cabinetOpen = $state(false);

	const now = new Date();
	const updatedDate = new Intl.DateTimeFormat('en-IN', {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	}).format(now);
	const updatedTime = new Intl.DateTimeFormat('en-IN', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	}).format(now);
</script>

<div class:dark={darkMode} class="min-h-dvh overflow-hidden bg-[var(--bz-bg)] text-[var(--bz-text-1)]">
	<header class="sticky top-0 z-50 flex min-h-12 items-center gap-2 border-b border-[var(--bz-border)] bg-[var(--bz-surface)] px-3">
		<a class="shrink-0 text-sm font-bold tracking-tight text-[var(--bz-accent)] bz-focus" href={`/?section=overview&lang=${language}`}>BharatZero</a>
		<div class="hidden h-5 w-px bg-[var(--bz-border)] sm:block"></div>
		<SectionTabs active={section} {language} />
		<div class="mx-auto hidden min-w-[14rem] max-w-[24rem] flex-1 md:block">
			<SearchCommand {query} {language} {section} />
		</div>
		<div class="ml-auto flex shrink-0 items-center gap-1">
			<div class="hidden items-center gap-2 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1 lg:flex">
				<span class="relative h-2 w-2">
					<span class="absolute inset-0 rounded-full bg-emerald-500 [animation:bz-pulse_2s_ease-in-out_infinite]"></span>
				</span>
				<div class="leading-none">
					<p class="bz-eyebrow text-[0.5rem]">Updated</p>
					<p class="bz-mono mt-0.5 text-[10px] text-[var(--bz-text-2)]">{updatedDate} · {updatedTime}</p>
				</div>
			</div>
			<div class="hidden h-5 w-px bg-[var(--bz-border)] sm:block"></div>
			<button
				class={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition bz-focus ${
					signedInDemo
						? 'border-[var(--bz-accent)] bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
						: 'border-[var(--bz-border)] bg-transparent text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
				}`}
				type="button"
				onclick={() => (signedInDemo = !signedInDemo)}
			>
				{signedInDemo ? 'Signed In' : 'Sign In'}
			</button>
			<div class="flex gap-1">
						<a
							class={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition bz-focus ${language === 'en' ? 'border-[var(--bz-accent)] bg-[var(--bz-accent-2)] text-[var(--bz-accent)]' : 'border-[var(--bz-border)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'}`}
							href={`/?section=${section}&lang=en`}
						>
							EN
						</a>
						<a
							class={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition bz-focus ${language === 'hi' ? 'border-[var(--bz-accent)] bg-[var(--bz-accent-2)] text-[var(--bz-accent)]' : 'border-[var(--bz-border)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'}`}
							href={`/?section=${section}&lang=hi`}
						>
							हिंदी
						</a>
					</div>
			<button
				class="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus"
				type="button"
				onclick={() => (darkMode = !darkMode)}
			>
				{darkMode ? 'Light' : 'Dark'}
			</button>
			<button
				class={`rounded-md border px-2.5 py-1 text-[13px] font-medium leading-none transition bz-focus ${
					sidebarCollapsed
						? 'border-[var(--bz-accent)] bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
						: 'border-[var(--bz-border)] bg-transparent text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
				}`}
				type="button"
				title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
				onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
			>
				≡
			</button>
		</div>
	</header>

	{#if signedInDemo}
		<div class="border-b border-[var(--bz-border)] bg-[var(--bz-accent-3)] px-3 py-2 text-xs text-[var(--bz-text-2)]">
			Demo profile mode is active. Saved bill tracking and alerts will connect to real auth later.
		</div>
	{/if}

	<div class={`grid h-[calc(100dvh-2.75rem)] min-h-0 grid-cols-1 overflow-hidden ${
		sidebarCollapsed ? 'lg:grid-cols-[minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1fr)_340px]' : 'lg:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)_340px]'
	}`}>
		{#if !sidebarCollapsed}
		<aside class="hidden min-h-0 overflow-y-auto border-r border-[var(--bz-border)] bg-[var(--bz-surface)] lg:block">
			<div class="p-3">
				<div class="relative mb-3 flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-lg bg-[#ede9e0] dark:bg-[#282520]">
					<div class="absolute inset-x-0 top-0 flex h-1">
						<span class="flex-1 bg-[var(--bz-saffron)]"></span>
						<span class="flex-1 bg-white"></span>
						<span class="flex-1 bg-[var(--bz-green)]"></span>
					</div>
					<div class="absolute right-3 top-3 rounded bg-white/80 px-1.5 py-0.5 text-[11px] shadow-sm" aria-hidden="true">🇮🇳</div>
					<div class="mx-auto mb-[-0.25rem] flex h-16 w-16 items-center justify-center rounded-full border-4 border-[var(--bz-surface)] bg-[#c9c1b5] text-xl font-bold text-[var(--bz-text-2)] shadow-sm dark:bg-[#4a4540]" aria-label="Narendra Modi profile image placeholder">
						NM
					</div>
					<div class="flex h-[42%] items-end justify-center bg-[#aaa59c] pb-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/70 dark:bg-[#3a3530]">
						Prime Minister
					</div>
				</div>
				<p class="text-[10px] text-[var(--bz-text-3)]">14th Prime Minister · <span class="font-semibold text-[var(--bz-accent)]">3rd Term</span></p>
				<h1 class="mt-1 text-base font-bold leading-tight text-[var(--bz-text-1)]">Narendra Modi</h1>
				<p class="mt-1 text-[11px] text-[var(--bz-text-3)]">नरेन्द्र मोदी</p>
				<div class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.04em] text-[var(--bz-text-3)]">
					<span>Age <b class="text-[var(--bz-text-1)]">74</b></span>
					<span aria-hidden="true">·</span>
					<span>Party <b class="text-[var(--bz-accent)]">BJP</b></span>
					<span aria-hidden="true">·</span>
					<span>EOS <b class="text-[var(--bz-text-1)]">2029</b></span>
				</div>
				<div class="mt-3 grid grid-cols-[1fr_1fr_1fr] gap-y-1 text-xs">
					<p class="bz-eyebrow text-[0.55rem]">Term</p>
					<p class="bz-eyebrow text-center text-[0.55rem]">EOS</p>
					<p class="bz-eyebrow text-right text-[0.55rem]">Bills</p>
					<p class="text-[var(--bz-text-2)]">All</p>
					<p class="bz-mono text-center text-[var(--bz-text-3)]">—</p>
					<p class="bz-mono text-right font-semibold text-[var(--bz-text-1)]">447</p>
					<p class="text-[var(--bz-text-2)]">1st</p>
					<p class="bz-mono text-center text-[var(--bz-text-3)]">2019</p>
					<p class="bz-mono text-right font-semibold text-[var(--bz-text-1)]">184</p>
					<p class="text-[var(--bz-text-2)]">2nd</p>
					<p class="bz-mono text-center text-[var(--bz-text-3)]">2024</p>
					<p class="bz-mono text-right font-semibold text-[var(--bz-text-1)]">183</p>
					<p class="text-[var(--bz-text-2)]">3rd</p>
					<p class="bz-mono text-center text-[var(--bz-text-3)]">2029</p>
					<p class="bz-mono text-right font-semibold text-[var(--bz-text-1)]">80</p>
				</div>
				<button
					class="mt-3 w-full rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus"
					type="button"
					aria-expanded={cabinetOpen}
					onclick={() => (cabinetOpen = !cabinetOpen)}
				>
					{cabinetOpen ? 'Hide Cabinet' : 'View Cabinet'}
				</button>
				{#if cabinetOpen}
					<div class="mt-2 space-y-1 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2">
						{#each [
							['Nirmala Sitharaman', 'Finance'],
							['Arjun Ram Meghwal', 'Law and Justice'],
							['Amit Shah', 'Home Affairs']
						] as member}
							<div class="flex items-center justify-between gap-2 text-[11px]">
								<span class="font-semibold text-[var(--bz-text-1)]">{member[0]}</span>
								<span class="text-right text-[var(--bz-text-3)]">{member[1]}</span>
							</div>
						{/each}
					</div>
				{/if}
				<div class="mt-3 grid grid-cols-3 gap-2 text-center">
					<div class="bz-panel-muted rounded-md p-2.5">
						<p class="text-[0.55rem] font-bold uppercase tracking-[0.03em] text-[var(--bz-text-3)]">Bills</p>
						<p class="bz-mono mt-1 text-sm font-semibold">3</p>
					</div>
					<div class="bz-panel-muted rounded-md p-2.5">
						<p class="text-[0.55rem] font-bold uppercase tracking-[0.03em] text-[var(--bz-text-3)]">Houses</p>
						<p class="bz-mono mt-1 text-sm font-semibold">2</p>
					</div>
					<div class="bz-panel-muted rounded-md p-2.5">
						<p class="text-[0.55rem] font-bold uppercase tracking-[0.03em] text-[var(--bz-text-3)]">Sources</p>
						<p class="bz-mono mt-1 text-sm font-semibold">7</p>
					</div>
				</div>
			</div>

			<div class="border-t border-[var(--bz-border)] p-3">
				<div class="flex items-start justify-between gap-2">
					<div>
						<p class="bz-eyebrow">Current Parliament</p>
						<h2 class="mt-1 text-sm font-semibold text-[var(--bz-text-1)]">18th Lok Sabha</h2>
					</div>
					<span class="rounded-md bg-[var(--bz-accent-2)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--bz-accent)]">2024-29</span>
				</div>
				<p class="mt-2 text-[11px] leading-5 text-[var(--bz-text-2)]">Union Parliament is tracked by House, session day, bill stage, and official source family.</p>
				<div class="mt-3 grid grid-cols-2 gap-2">
					<div class="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2">
						<p class="text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--bz-text-3)]">Lok Sabha</p>
						<p class="mt-1 text-xs font-semibold text-[var(--bz-text-1)]">543 seats</p>
					</div>
					<div class="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2">
						<p class="text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--bz-text-3)]">Rajya Sabha</p>
						<p class="mt-1 text-xs font-semibold text-[var(--bz-text-1)]">245 seats</p>
					</div>
				</div>
				<div class="mt-3 rounded-md border border-[var(--bz-border)] bg-[var(--bz-bg)] p-2">
					<div class="flex items-center justify-between text-[11px]">
						<span class="text-[var(--bz-text-2)]">Bills in this sandbox</span>
						<span class="bz-mono font-semibold text-[var(--bz-text-1)]">3</span>
					</div>
					<div class="mt-1 flex items-center justify-between text-[11px]">
						<span class="text-[var(--bz-text-2)]">Committee surfaces</span>
						<span class="bz-mono font-semibold text-[var(--bz-text-1)]">2</span>
					</div>
				</div>
			</div>

			<div class="border-t border-[var(--bz-border)] p-3">
				<p class="bz-eyebrow">Record trust</p>
				<h2 class="mt-1 text-sm font-semibold text-[var(--bz-text-1)]">How to read the data</h2>
				<div class="mt-3 space-y-2">
					<div class="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2">
						<p class="text-[11px] font-semibold text-[var(--bz-text-1)]">Sandbox records</p>
						<p class="mt-1 text-[10.5px] leading-4 text-[var(--bz-text-2)]">Sample bills and events are labeled before they are confused with official records.</p>
					</div>
					<div class="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2">
						<p class="text-[11px] font-semibold text-[var(--bz-text-1)]">Official source path</p>
						<p class="mt-1 text-[10.5px] leading-4 text-[var(--bz-text-2)]">Source chips show which public source family each record should trace back to.</p>
					</div>
					<div class="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2">
						<p class="text-[11px] font-semibold text-[var(--bz-text-1)]">Privacy boundary</p>
						<p class="mt-1 text-[10.5px] leading-4 text-[var(--bz-text-2)]">No sign-in, payment, or private browsing data is collected in this sandbox.</p>
					</div>
				</div>
			</div>
		</aside>
		{/if}

		<main class="min-h-0 min-w-0 overflow-y-auto">
			<div class="mx-auto max-w-[1120px] space-y-3 p-3 lg:p-4">
				<div class="md:hidden">
					<SearchCommand {query} {language} {section} />
				</div>
				{@render children()}
			</div>
		</main>

		<div class="hidden min-h-0 min-w-0 overflow-y-auto border-l border-[var(--bz-border)] bg-[var(--bz-surface)] 2xl:block">
				{#if aside}
					{@render aside()}
				{/if}
		</div>
	</div>
</div>
