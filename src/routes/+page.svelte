<script lang="ts">
	import AppShell from '$lib/components/shell/AppShell.svelte';
	import BillDetailPanel from '$lib/components/bills/BillDetailPanel.svelte';
	import BillList from '$lib/components/bills/BillList.svelte';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';
	import SourceBadge from '$lib/components/shared/SourceBadge.svelte';
	import StatusBadge from '$lib/components/shared/StatusBadge.svelte';
	import TimelineRail from '$lib/components/timeline/TimelineRail.svelte';
	import { formatDate, sourceKindLabels } from '$lib/domain/bill-stage-machine';
	import { getBillTitle, houseLabelsLocalized } from '$lib/domain/localization';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const section = $derived(data.dashboard.filters.section);
	const sessionName = $derived(data.dashboard.sittingDays[0]?.session_name ?? 'Sandbox Session');
	const language = $derived(data.dashboard.filters.language);
	const actBillsById = $derived(new Map((data.dashboard.actBills ?? data.dashboard.allBills).map((bill) => [bill.id, bill])));
	const sourceStatusLabels = {
		'using-now': 'Using now',
		'discovery-ready': 'Discovery wired',
		planned: 'Planned source'
	};
	const sourceStatusHelp = {
		'using-now': 'Current BharatZero records are loaded from this source family.',
		'discovery-ready': 'Discovery/parsing is wired, but production records are not loaded from this source yet.',
		planned: 'This official source is identified, but the connector is scheduled for later.'
	};
	const sourcePipelineLabels = ['Find official record', 'Clean and match fields', 'Place on bill timeline', 'Show in BharatZero'];

	function hrefForActPage(page: number) {
		const filters = data.dashboard.filters;
		const search = new URLSearchParams({
			section: 'acts',
			lang: filters.language,
			page: String(page),
			pageSize: String(filters.pageSize)
		});
		if (filters.query) search.set('q', filters.query);
		if (filters.house !== 'all') search.set('house', filters.house);
		if (filters.status !== 'all') search.set('status', filters.status);
		if (filters.area !== 'all') search.set('area', filters.area);
		if (filters.source !== 'all') search.set('source', filters.source);
		if (filters.primeMinister !== 'all') search.set('pm', filters.primeMinister);
		if (filters.date) search.set('date', filters.date);
		return `/?${search.toString()}`;
	}

	function hrefForSourceRecords(sourceId: string) {
		const section = sourceId === 'source-india-code' ? 'acts' : 'bills';
		const search = new URLSearchParams({
			section,
			lang: language,
			page: '1',
			pageSize: String(data.dashboard.filters.pageSize),
			source: sourceId
		});
		return `/?${search.toString()}`;
	}
</script>

<svelte:head>
	<title>BharatZero — Indian Legislative Explorer</title>
</svelte:head>

<AppShell {section} query={data.dashboard.filters.query} {language}>
	{#snippet aside()}
		<BillDetailPanel bill={data.selectedBill?.bill ?? null} actions={data.selectedBill?.actions ?? []} {language} />
	{/snippet}

	<FilterBar
		{section}
		house={data.dashboard.filters.house}
		date={data.dashboard.filters.date}
		status={data.dashboard.filters.status}
		query={data.dashboard.filters.query}
		{sessionName}
		{language}
	/>

	{#if section === 'overview'}
		<section>
			<div>
				<div class="mb-2 flex items-center justify-between gap-3">
					<div>
						<p class="bz-eyebrow">Latest legislation</p>
						<h2 class="mt-1 text-base font-semibold text-[var(--bz-text-1)]">Bills moving through Parliament</h2>
					</div>
					<a class="rounded-md border border-[var(--bz-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus" href={`/?section=bills&lang=${language}`}>
						View all
					</a>
				</div>
				<BillList bills={data.dashboard.bills} selectedBillId={data.selectedBillId ?? undefined} {language} />
			</div>
		</section>

		<section>
			<TimelineRail events={data.dashboard.timelineEvents} dateRail={data.dashboard.timelineDateRail} groups={data.dashboard.timelineGroups} />
		</section>
	{:else if section === 'timeline'}
		<TimelineRail events={data.dashboard.timelineEvents} dateRail={data.dashboard.timelineDateRail} groups={data.dashboard.timelineGroups} />
	{:else if section === 'houses'}
		<section class="space-y-4">
			<div class="bz-panel rounded-lg p-5">
				<p class="bz-eyebrow text-[var(--bz-accent)]">Union Parliament</p>
				<h2 class="mt-2 text-xl font-semibold text-[var(--bz-text-1)]">Seats, control, and House roles</h2>
				<p class="mt-2 max-w-3xl text-sm leading-6 text-[var(--bz-text-2)]">
					Use the Prime Minister history control in the left panel to switch government terms while keeping this Houses view focused on parliamentary structure.
				</p>
				<div class="mt-4 grid gap-3 md:grid-cols-3">
					<div class="rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
						<p class="bz-eyebrow text-[0.55rem]">Lok Sabha</p>
						<p class="mt-2 text-sm font-semibold text-[var(--bz-text-1)]">Directly elected chamber</p>
					</div>
					<div class="rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
						<p class="bz-eyebrow text-[0.55rem]">Rajya Sabha</p>
						<p class="mt-2 text-sm font-semibold text-[var(--bz-text-1)]">Council of States</p>
					</div>
					<div class="rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
						<p class="bz-eyebrow text-[0.55rem]">PM context</p>
						<p class="mt-2 text-sm font-semibold text-[var(--bz-text-1)]">Left panel selector</p>
					</div>
				</div>
			</div>
		</section>
	{:else if section === 'bills'}
		<BillList bills={data.dashboard.bills} selectedBillId={data.selectedBillId ?? undefined} {language} />
	{:else if section === 'committees'}
		<section class="grid gap-3 md:grid-cols-2">
			{#each data.dashboard.committees as committee}
				<article class="bz-panel rounded-lg p-4">
					<p class="bz-eyebrow">{committee.type}</p>
					<h2 class="mt-2 text-base font-semibold text-[var(--bz-text-1)]">{committee.name}</h2>
					<p class="mt-2 text-sm text-[var(--bz-text-2)]">{houseLabelsLocalized[language][committee.house]}</p>
					<div class="mt-4"><SourceBadge url={committee.source_url} isDemoSeed={committee.isDemoSeed} /></div>
				</article>
			{/each}
		</section>
	{:else if section === 'questions'}
		<section class="space-y-3">
			{#each data.dashboard.questions as question}
				<article class="bz-panel rounded-lg p-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<h2 class="text-base font-semibold text-[var(--bz-text-1)]">{question.subject}</h2>
						<span class="rounded-md border border-[var(--bz-border)] px-2 py-1 text-[11px] text-[var(--bz-text-2)]">{question.answer_status}</span>
					</div>
					<p class="mt-2 text-sm text-[var(--bz-text-2)]">{question.number} · {houseLabelsLocalized[language][question.house]} · {question.ministry} · {formatDate(question.date)}</p>
					<div class="mt-4"><SourceBadge url={question.source_url} isDemoSeed={question.isDemoSeed} /></div>
				</article>
			{/each}
		</section>
	{:else if section === 'debates'}
		<section class="space-y-3">
			{#each data.dashboard.debates as debate}
				<article class="bz-panel rounded-lg p-4">
					<p class="bz-eyebrow">{houseLabelsLocalized[language][debate.house]} · {formatDate(debate.date)}</p>
					<h2 class="mt-2 text-base font-semibold text-[var(--bz-text-1)]">{debate.title}</h2>
					<p class="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">{debate.summary}</p>
					<div class="mt-4"><SourceBadge url={debate.source_url} isDemoSeed={debate.isDemoSeed} /></div>
				</article>
			{/each}
		</section>
	{:else if section === 'acts'}
		<section class="space-y-3">
			<div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] px-3 py-2 text-xs text-[var(--bz-text-2)]">
				<span>{data.dashboard.pagination.totalItems.toLocaleString('en-IN')} Act records</span>
				{#if data.dashboard.pagination.totalPages > 1}
					<div class="flex items-center gap-2">
						<a class="rounded-md border border-[var(--bz-border)] px-2.5 py-1 text-[11px] font-semibold transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus" class:pointer-events-none={data.dashboard.pagination.page <= 1} class:opacity-50={data.dashboard.pagination.page <= 1} href={hrefForActPage(Math.max(1, data.dashboard.pagination.page - 1))}>Previous</a>
						<span class="bz-mono text-[11px] text-[var(--bz-text-3)]">Page {data.dashboard.pagination.page} / {data.dashboard.pagination.totalPages}</span>
						<a class="rounded-md border border-[var(--bz-border)] px-2.5 py-1 text-[11px] font-semibold transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus" class:pointer-events-none={data.dashboard.pagination.page >= data.dashboard.pagination.totalPages} class:opacity-50={data.dashboard.pagination.page >= data.dashboard.pagination.totalPages} href={hrefForActPage(Math.min(data.dashboard.pagination.totalPages, data.dashboard.pagination.page + 1))}>Next</a>
					</div>
				{/if}
			</div>
			{#each data.dashboard.acts as act}
				{@const linkedBill = actBillsById.get(act.linked_bill_id)}
				<article class="bz-panel rounded-lg p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="bz-eyebrow">Act · {act.year}</p>
							<h2 class="mt-2 text-base font-semibold leading-6 text-[var(--bz-text-1)]">{act.title}</h2>
							<p class="mt-1 text-sm text-[var(--bz-text-2)]">{act.act_number}</p>
						</div>
						<SourceBadge url={act.india_code_url} kind="india-code" label="Act text" isDemoSeed={act.isDemoSeed} />
					</div>
					{#if linkedBill}
						<div class="mt-4 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
							<p class="bz-eyebrow text-[0.55rem]">Enacted from Bill</p>
							<a class="mt-1 block text-sm font-semibold leading-5 text-[var(--bz-text-1)] transition hover:text-[var(--bz-accent)] bz-focus" href={`/?section=bills&bill=${linkedBill.id}&lang=${language}`}>
								{getBillTitle(linkedBill, language)}
							</a>
							<div class="mt-2 flex flex-wrap items-center gap-2">
								<StatusBadge stage={linkedBill.current_stage} {language} />
								<span class="text-[11px] text-[var(--bz-text-3)]">{houseLabelsLocalized[language][linkedBill.origin_house]}</span>
								<span class="text-[11px] text-[var(--bz-text-3)]">{linkedBill.ministry}</span>
							</div>
						</div>
					{/if}
				</article>
			{/each}
		</section>
	{:else if section === 'sources'}
		<section class="bz-panel rounded-lg p-5">
			<p class="bz-eyebrow text-[var(--bz-accent)]">Official sources</p>
			<h2 class="mt-2 text-xl font-semibold text-[var(--bz-text-1)]">Where BharatZero will link each record</h2>
			<p class="mt-2 max-w-3xl text-sm leading-6 text-[var(--bz-text-2)]">
				Every bill, action, question, debate, and Act should trace back to an official public source.
				This screen shows which source families feed current records, which are discovery-only, and which are planned next.
			</p>
			<div class="mt-4 flex flex-wrap gap-2 text-xs text-[var(--bz-text-2)]">
				<span class="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1">
					<b class="text-[var(--bz-text-1)]">Using now</b> means current records are loaded from that source family.
				</span>
				<span class="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1">
					<b class="text-[var(--bz-text-1)]">Discovery wired</b> means metadata checks exist but rows are not loaded yet.
				</span>
				<span class="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1">
					<b class="text-[var(--bz-text-1)]">Planned source</b> means the official source is identified for a future connector.
				</span>
			</div>
			<div class="mt-4 grid gap-3 md:grid-cols-4">
				{#each data.dashboard.ingestion.pipelineSteps as step, index}
					<div class="rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
						<p class="bz-eyebrow text-[0.55rem]">Step {index + 1}</p>
						<p class="mt-2 text-sm font-semibold text-[var(--bz-text-1)]">{sourcePipelineLabels[index] ?? step.replaceAll('_', ' ')}</p>
					</div>
				{/each}
			</div>
		</section>

		<section class="grid gap-3 md:grid-cols-2">
			{#each data.dashboard.sources as source}
				<article class="bz-panel rounded-lg p-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<h2 class="text-base font-semibold text-[var(--bz-text-1)]">{source.name}</h2>
						<span class="rounded-md border border-[var(--bz-border)] px-2 py-1 text-[11px] text-[var(--bz-text-2)]" title={sourceStatusHelp[source.status]}>{sourceStatusLabels[source.status]}</span>
					</div>
					<p class="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">{source.preparedFor}</p>
					<div class="mt-4 flex flex-wrap items-center gap-2">
						<a class="rounded-md border border-[var(--bz-accent)] bg-[var(--bz-accent-2)] px-2 py-1 text-[10.5px] font-semibold text-[var(--bz-accent)] transition hover:bg-[var(--bz-accent)] hover:text-white bz-focus" href={hrefForSourceRecords(source.id)}>
							Show records
						</a>
						<SourceBadge url={source.url} kind={source.kind} label={sourceKindLabels[source.kind]} isDemoSeed={source.kind === 'demo-seed'} />
					</div>
				</article>
			{/each}
		</section>
	{/if}
</AppShell>
