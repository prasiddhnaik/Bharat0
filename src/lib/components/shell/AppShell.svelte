<script lang="ts">
	import type { Snippet } from 'svelte';
	import SectionTabs from './SectionTabs.svelte';
	import SearchCommand from './SearchCommand.svelte';
	import { demoSeedWarning } from '$lib/domain/indian-legislature';
	import type { SectionId } from '$lib/domain/types';
	import { t, type Language } from '$lib/domain/localization';

	let {
		section,
		query,
		language,
		children,
		aside
	}: { section: SectionId; query: string; language: Language; children: Snippet; aside?: Snippet } = $props();
</script>

<div class="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30rem),radial-gradient(circle_at_85%_10%,rgba(245,158,11,0.08),transparent_24rem),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] text-slate-100">
	<div class="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
	<div class="relative mx-auto flex max-w-[1500px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
		<header class="overflow-hidden rounded-[1.75rem] border border-slate-800/90 bg-slate-950/75 shadow-2xl shadow-black/35 backdrop-blur-xl">
			<div class="border-b border-slate-800/80 bg-slate-900/35 px-4 py-2">
				<div class="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
					<span>Union Parliament prototype</span>
					<span class="text-cyan-200">Source-linked demo workspace</span>
				</div>
			</div>
			<div class="p-4 sm:p-5">
			<div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
				<div>
					<div class="flex flex-wrap items-center gap-2">
						<span class="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">BharatZero</span>
						<span class="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100">{t('app.demoSeedOnly', language)}</span>
					</div>
					<h1 class="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-slate-50 md:text-4xl">
						{t('app.title', language)}
					</h1>
					<p class="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{demoSeedWarning}</p>
					<div class="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
						<span class="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1">Lok Sabha</span>
						<span class="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1">Rajya Sabha</span>
						<span class="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1">Bills</span>
						<span class="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1">Questions</span>
						<span class="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1">Acts</span>
					</div>
				</div>
				<div class="min-w-0 space-y-3 xl:w-[30rem]">
					<div class="flex justify-start gap-2 xl:justify-end">
						<a
							class={`rounded-full border px-3 py-1 text-xs font-semibold ${language === 'en' ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-700 text-slate-300 hover:border-cyan-400'}`}
							href={`/?section=${section}&lang=en`}
						>
							EN
						</a>
						<a
							class={`rounded-full border px-3 py-1 text-xs font-semibold ${language === 'hi' ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-700 text-slate-300 hover:border-cyan-400'}`}
							href={`/?section=${section}&lang=hi`}
						>
							हिंदी
						</a>
					</div>
					<SearchCommand {query} {language} />
				</div>
			</div>
			<div class="mt-4"><SectionTabs active={section} {language} /></div>
			</div>
		</header>

		<div class="grid gap-4 xl:grid-cols-[17rem_minmax(0,1fr)_24rem]">
			<aside class="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/65 p-4 shadow-xl shadow-black/20 backdrop-blur xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
				<p class="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{t('app.systemModel', language)}</p>
				<div class="mt-4 space-y-3 text-sm text-slate-400">
					<p>{t('app.parliamentModel', language)}</p>
					<p>{t('app.stageMachineModel', language)}</p>
					<p>{t('app.firstClassSurfaces', language)}</p>
				</div>
				<div class="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-3 text-xs leading-5 text-slate-500">
					{t('app.noScraping', language)}
				</div>
				<div class="mt-4 grid grid-cols-2 gap-2 text-xs">
					<div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
						<p class="text-slate-500">Model</p>
						<p class="mt-1 font-semibold text-slate-200">India-first</p>
					</div>
					<div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
						<p class="text-slate-500">Mode</p>
						<p class="mt-1 font-semibold text-amber-100">Demo</p>
					</div>
				</div>
			</aside>

			<main class="min-w-0 space-y-4">{@render children()}</main>

			<div class="min-w-0">
				{#if aside}
					{@render aside()}
				{/if}
			</div>
		</div>
	</div>
</div>
