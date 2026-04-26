<script lang="ts">
	import AppShell from '$lib/components/shell/AppShell.svelte';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';
	import TimelineRail from '$lib/components/timeline/TimelineRail.svelte';
	import BillList from '$lib/components/bills/BillList.svelte';
	import BillDetailPanel from '$lib/components/bills/BillDetailPanel.svelte';
	import SourceBadge from '$lib/components/shared/SourceBadge.svelte';
	import { formatDate, sourceKindLabels } from '$lib/domain/bill-stage-machine';
	import { indiaModelNotes } from '$lib/domain/indian-legislature';
	import { houseLabelsLocalized, t } from '$lib/domain/localization';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const sessionName = $derived(data.dashboard.sittingDays[0]?.session_name ?? 'Demo Session');
</script>

<AppShell section={data.dashboard.filters.section} query={data.dashboard.filters.query} language={data.dashboard.filters.language}>
	{#snippet aside()}
		<BillDetailPanel bill={data.selectedBill?.bill ?? null} actions={data.selectedBill?.actions ?? []} language={data.dashboard.filters.language} />
	{/snippet}

	<FilterBar
		section={data.dashboard.filters.section}
		house={data.dashboard.filters.house}
		date={data.dashboard.filters.date}
		status={data.dashboard.filters.status}
		query={data.dashboard.filters.query}
		{sessionName}
		language={data.dashboard.filters.language}
	/>

	{#if data.dashboard.filters.section === 'overview'}
		<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<div class="rounded-[1.5rem] border border-slate-800/90 bg-slate-950/75 p-4 shadow-xl shadow-black/15">
				<p class="text-xs uppercase tracking-[0.22em] text-slate-500">Bills tracked</p>
				<p class="mt-3 text-3xl font-semibold text-slate-50">{data.dashboard.stats.billsTracked}</p>
				<p class="mt-2 text-xs text-amber-100">{t('label.demoSeedRecords', data.dashboard.filters.language)}</p>
			</div>
			<div class="rounded-[1.5rem] border border-slate-800/90 bg-slate-950/75 p-4 shadow-xl shadow-black/15">
				<p class="text-xs uppercase tracking-[0.22em] text-slate-500">Events on date</p>
				<p class="mt-3 text-3xl font-semibold text-slate-50">{data.dashboard.stats.eventsOnDate}</p>
				<p class="mt-2 text-xs text-slate-500">{t('label.filteredTimeline', data.dashboard.filters.language)}</p>
			</div>
			<div class="rounded-[1.5rem] border border-slate-800/90 bg-slate-950/75 p-4 shadow-xl shadow-black/15">
				<p class="text-xs uppercase tracking-[0.22em] text-slate-500">Committees</p>
				<p class="mt-3 text-3xl font-semibold text-slate-50">{data.dashboard.stats.committeesTracked}</p>
				<p class="mt-2 text-xs text-slate-500">{t('label.preparedEntities', data.dashboard.filters.language)}</p>
			</div>
			<div class="rounded-[1.5rem] border border-slate-800/90 bg-slate-950/75 p-4 shadow-xl shadow-black/15">
				<p class="text-xs uppercase tracking-[0.22em] text-slate-500">Sources</p>
				<p class="mt-3 text-3xl font-semibold text-slate-50">{data.dashboard.stats.preparedSources}</p>
				<p class="mt-2 text-xs text-slate-500">{t('label.futureAdapters', data.dashboard.filters.language)}</p>
			</div>
		</section>

		<section class="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs font-bold uppercase tracking-[0.22em] text-amber-100">Data access</p>
					<p class="mt-1 text-sm text-slate-300">{data.dashboard.dataSource.label}</p>
				</div>
				<span class="w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
					{data.dashboard.dataSource.isLiveOfficialData ? 'Live official data' : 'Demo seed only'}
				</span>
			</div>
		</section>

		<section class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
				<p class="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">India-specific model</p>
				<h2 class="mt-2 text-xl font-semibold text-slate-100">Not a U.S. Congress clone</h2>
				<div class="mt-4 space-y-3">
					{#each indiaModelNotes as note}
						<p class="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 text-sm leading-6 text-slate-300">{note}</p>
					{/each}
				</div>
			</div>
			<TimelineRail events={data.dashboard.timelineEvents} dateRail={data.dashboard.timelineDateRail} groups={data.dashboard.timelineGroups} />
		</section>
	{:else if data.dashboard.filters.section === 'timeline'}
		<TimelineRail events={data.dashboard.timelineEvents} dateRail={data.dashboard.timelineDateRail} groups={data.dashboard.timelineGroups} />
	{:else if data.dashboard.filters.section === 'bills'}
		<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-1">
			<BillList bills={data.dashboard.bills} selectedBillId={data.selectedBillId ?? undefined} language={data.dashboard.filters.language} />
		</div>
	{:else if data.dashboard.filters.section === 'committees'}
		<section class="grid gap-3 md:grid-cols-2">
			{#each data.dashboard.committees as committee}
				<article class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
					<p class="text-xs uppercase tracking-[0.22em] text-cyan-300">{committee.type}</p>
					<h2 class="mt-2 text-base font-semibold text-slate-100">{committee.name}</h2>
					<p class="mt-2 text-sm text-slate-500">{houseLabelsLocalized[data.dashboard.filters.language][committee.house]}</p>
					<div class="mt-4"><SourceBadge url={committee.source_url} isDemoSeed={committee.isDemoSeed} /></div>
				</article>
			{/each}
		</section>
	{:else if data.dashboard.filters.section === 'questions'}
		<section class="space-y-3">
			{#each data.dashboard.questions as question}
				<article class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<h2 class="text-base font-semibold text-slate-100">{question.subject}</h2>
						<span class="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">{question.answer_status}</span>
					</div>
					<p class="mt-2 text-sm text-slate-500">{question.number} · {houseLabelsLocalized[data.dashboard.filters.language][question.house]} · {question.ministry} · {formatDate(question.date)}</p>
					<div class="mt-4"><SourceBadge url={question.source_url} isDemoSeed={question.isDemoSeed} /></div>
				</article>
			{/each}
		</section>
	{:else if data.dashboard.filters.section === 'debates'}
		<section class="space-y-3">
			{#each data.dashboard.debates as debate}
				<article class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
					<p class="text-xs uppercase tracking-[0.22em] text-cyan-300">{houseLabelsLocalized[data.dashboard.filters.language][debate.house]} · {formatDate(debate.date)}</p>
					<h2 class="mt-2 text-base font-semibold text-slate-100">{debate.title}</h2>
					<p class="mt-2 text-sm leading-6 text-slate-400">{debate.summary}</p>
					<div class="mt-4"><SourceBadge url={debate.source_url} isDemoSeed={debate.isDemoSeed} /></div>
				</article>
			{/each}
		</section>
	{:else if data.dashboard.filters.section === 'acts'}
		<section class="space-y-3">
			{#each data.dashboard.acts as act}
				<article class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
					<p class="text-xs uppercase tracking-[0.22em] text-cyan-300">Act · {act.year}</p>
					<h2 class="mt-2 text-base font-semibold text-slate-100">{act.title}</h2>
					<p class="mt-2 text-sm text-slate-500">{act.act_number}</p>
					<div class="mt-4"><SourceBadge url={act.india_code_url} kind="india-code" label="India Code target" isDemoSeed={act.isDemoSeed} /></div>
				</article>
			{/each}
		</section>
	{:else if data.dashboard.filters.section === 'sources'}
		<section class="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
			<p class="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Ingestion readiness</p>
			<h2 class="mt-2 text-xl font-semibold text-slate-100">Prepared source contracts, no live scraping</h2>
			<p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
				BharatZero now has explicit adapter contracts for official source families. These describe authority, output types,
				and supported Houses, but they do not fetch or scrape data in this MVP.
			</p>
			<div class="mt-4 grid gap-3 md:grid-cols-4">
				{#each data.dashboard.ingestion.pipelineSteps as step, index}
					<div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
						<p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Step {index + 1}</p>
						<p class="mt-2 text-sm font-semibold text-slate-100">{step.replaceAll('_', ' ')}</p>
					</div>
				{/each}
			</div>
		</section>

		<section class="grid gap-3 md:grid-cols-2">
			{#each data.dashboard.sources as source}
				<article class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<h2 class="text-base font-semibold text-slate-100">{source.name}</h2>
						<span class="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">{source.status}</span>
					</div>
					<p class="mt-2 text-sm leading-6 text-slate-400">{source.preparedFor}</p>
					<div class="mt-4"><SourceBadge url={source.url} kind={source.kind} label={sourceKindLabels[source.kind]} isDemoSeed={source.kind === 'demo-seed'} /></div>
				</article>
			{/each}
		</section>

		<section class="grid gap-3 md:grid-cols-2">
			{#each data.dashboard.ingestion.adapters as adapter}
				<article class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<h2 class="text-base font-semibold text-slate-100">{adapter.name}</h2>
						<span class="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100">{adapter.status}</span>
					</div>
					<p class="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{adapter.authority}</p>
					<p class="mt-3 text-sm leading-6 text-slate-400">{adapter.notes}</p>
					<div class="mt-4 flex flex-wrap gap-2">
						{#each adapter.outputs as output}
							<span class="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">{output.replaceAll('_', ' ')}</span>
						{/each}
					</div>
				</article>
			{/each}
		</section>
	{/if}
</AppShell>
