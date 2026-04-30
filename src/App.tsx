import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BillDetailData, DashboardData } from '$lib/data/view-model';
import {
	formatDate,
	getStageTone,
	sourceKindLabels
} from '$lib/domain/bill-stage-machine';
import {
	billTypeLabelsLocalized,
	getBillSubtitle,
	getBillTitle,
	getSectionLabel,
	houseLabelsLocalized,
	stageLabelsLocalized,
	t,
	type Language
} from '$lib/domain/localization';
import {
	MONEY_BILL_STAGES,
	ORDINARY_BILL_STAGES,
	SECTION_IDS,
	type Act,
	type Bill,
	type BillAction,
	type BillStage,
	type House,
	type SectionId,
	type SourceKind,
	type TimelineEvent
} from '$lib/domain/types';
import { DEFAULT_BILLS_PAGE_SIZE, parseDashboardFilters, type DashboardFilters } from '$lib/domain/dashboard-filters';
import { getActPartyPositionSourceRefs, getActPartyPositions, getBillPartyPositions, type PartyPositionSide } from '$lib/domain/party-positions';
import { parliamentHouseSnapshots, type ParliamentHouseSnapshot } from '$lib/domain/parliament-houses';
import { getPrimeMinisterTerm, getPrimeMinisterTermLabel, PRIME_MINISTER_TERMS } from '$lib/domain/prime-ministers';
import type { TimelineDateGroup, TimelineDateRailItem } from '$lib/domain/timeline-view';

type DataSourceMeta = {
	mode: 'seed' | 'prisma';
	label: string;
	isLiveOfficialData: boolean;
};

type AppDashboardData = DashboardData & {
	dataSource?: DataSourceMeta;
};

type DashboardPagination = {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
};

type StageCount = {
	stage: BillStage;
	count: number;
};

type AreaCount = {
	area: string;
	count: number;
};

type AppBillDetailData = NonNullable<BillDetailData> & {
	dataSource?: DataSourceMeta;
};

type NavigateHandler = (href: string) => void;
type AnalysisStatus = 'loading' | 'ai' | 'local';

const stageOptions = Array.from(
	new Set<BillStage>([...ORDINARY_BILL_STAGES, ...MONEY_BILL_STAGES] as BillStage[])
);

function cx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(' ');
}

function hrefFor(section: SectionId, language: Language, params: Record<string, string> = {}) {
	const search = new URLSearchParams({ section, lang: language, ...params });
	return `/?${search.toString()}`;
}

function hrefForBillPage(filters: DashboardFilters, page: number) {
	return hrefForPagedSection(filters, 'bills', page);
}

function hrefForActPage(filters: DashboardFilters, page: number) {
	return hrefForPagedSection(filters, 'acts', page);
}

function hrefForPagedSection(filters: DashboardFilters, section: SectionId, page: number) {
	const search = new URLSearchParams({
		section,
		lang: filters.language,
		page: String(page),
		pageSize: String(filters.pageSize || DEFAULT_BILLS_PAGE_SIZE)
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

function hrefForPrimeMinisterFilter(filters: DashboardFilters, primeMinister: string) {
	const search = new URLSearchParams({
		section: filters.section,
		lang: filters.language,
		page: '1',
		pageSize: String(filters.pageSize || DEFAULT_BILLS_PAGE_SIZE)
	});
	if (filters.query) search.set('q', filters.query);
	if (filters.house !== 'all') search.set('house', filters.house);
	if (filters.status !== 'all') search.set('status', filters.status);
	if (filters.area !== 'all') search.set('area', filters.area);
	if (filters.source !== 'all') search.set('source', filters.source);
	if (primeMinister !== 'all') search.set('pm', primeMinister);
	if (filters.date) search.set('date', filters.date);
	return `/?${search.toString()}`;
}

function hrefForBill(filters: DashboardFilters, billId: string) {
	const search = new URLSearchParams({
		section: 'bills',
		lang: filters.language,
		page: String(filters.page || 1),
		pageSize: String(filters.pageSize || DEFAULT_BILLS_PAGE_SIZE),
		bill: billId
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

function hrefForAct(filters: DashboardFilters, actId: string) {
	const search = new URLSearchParams({
		section: 'acts',
		lang: filters.language,
		page: String(filters.page || 1),
		pageSize: String(filters.pageSize || DEFAULT_BILLS_PAGE_SIZE),
		act: actId
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

function hrefForSourceRecords(sourceId: string, language: Language) {
	const section = sourceId === 'source-india-code' ? 'acts' : 'bills';
	const search = new URLSearchParams({
		section,
		lang: language,
		page: '1',
		pageSize: String(DEFAULT_BILLS_PAGE_SIZE),
		source: sourceId
	});
	return `/?${search.toString()}`;
}

function hrefWithoutSourceFilter(filters: DashboardFilters) {
	const search = new URLSearchParams({
		section: filters.section,
		lang: filters.language,
		page: '1',
		pageSize: String(filters.pageSize || DEFAULT_BILLS_PAGE_SIZE)
	});
	if (filters.query) search.set('q', filters.query);
	if (filters.house !== 'all') search.set('house', filters.house);
	if (filters.status !== 'all') search.set('status', filters.status);
	if (filters.area !== 'all') search.set('area', filters.area);
	if (filters.primeMinister !== 'all') search.set('pm', filters.primeMinister);
	if (filters.date) search.set('date', filters.date);
	return `/?${search.toString()}`;
}

const sourceFilterLabels: Record<string, string> = {
	'source-sansad': 'Sansad portal',
	'source-lok-sabha': 'Lok Sabha official pages',
	'source-rajya-sabha': 'Rajya Sabha official pages',
	'source-prs': 'PRS Legislative Research',
	'source-pdl': 'Parliament Digital Library',
	'source-india-code': 'India Code',
	'source-data-gov': 'data.gov.in',
	'source-egazette': 'eGazette',
	'source-neva': 'NeVA'
};

function initialsForName(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();
}

function yearFromDate(date: string) {
	return date.slice(0, 4);
}

function createEmptyDashboard(filters: DashboardFilters): AppDashboardData {
	return {
		seedMeta: {
			label: 'Loading legislative records',
			description: 'Fetching records from the local BharatZero database.',
			updatedAt: filters.date
		} as unknown as DashboardData['seedMeta'],
		filters,
		stats: {
			billsTracked: 0,
			filteredBillsTracked: 0,
			eventsOnDate: 0,
			committeesTracked: 0,
			preparedSources: 0
		},
		pagination: {
			page: filters.page,
			pageSize: filters.pageSize,
			totalItems: 0,
			totalPages: 1
		},
		stageCounts: [],
		areaCounts: [],
		primeMinisterCounts: [],
		bills: [],
		allBills: [],
		billActions: [],
		timelineEvents: [],
		timelineGroups: [],
		timelineDateRail: [],
		allTimelineEvents: [],
		sittingDays: [],
		committees: [],
		questions: [],
		debates: [],
		acts: [],
		actBills: [],
		sources: [],
		ingestion: {
			adapters: [],
			outputSummary: {} as DashboardData['ingestion']['outputSummary'],
			pipelineSteps: []
		}
	};
}

function App() {
	const [locationSearch, setLocationSearch] = useState(() => window.location.search);
	const filters = useMemo(() => parseDashboardFilters(new URLSearchParams(locationSearch)), [locationSearch]);
	const [dashboard, setDashboard] = useState<AppDashboardData>(() => createEmptyDashboard(filters));
	const locationParams = new URLSearchParams(locationSearch);
	const selectedBillId = dashboard.filters.section === 'bills' ? (locationParams.get('bill') ?? dashboard.bills[0]?.id ?? null) : locationParams.get('bill');
	const selectedActId = dashboard.filters.section === 'acts' ? (locationParams.get('act') ?? dashboard.acts[0]?.id ?? null) : null;
	const [selectedBill, setSelectedBill] = useState<AppBillDetailData | null>(null);
	const [aiAnalysisByKey, setAiAnalysisByKey] = useState<Record<string, BillAnalysis>>({});
	const [aiAnalysisLoadingKey, setAiAnalysisLoadingKey] = useState<string | null>(null);
	const [aiAnalysisFailedKeys, setAiAnalysisFailedKeys] = useState<Record<string, true>>({});
	const dashboardSearch = useMemo(() => {
		const searchParams = new URLSearchParams(locationSearch);
		searchParams.delete('bill');
		const serialized = searchParams.toString();
		return serialized ? `?${serialized}` : '';
	}, [locationSearch]);
	const selectedBillForRender = selectedBill?.bill.id === selectedBillId ? selectedBill : null;
	const actBillsById = useMemo(() => new Map((dashboard.actBills ?? dashboard.allBills ?? []).map((bill) => [bill.id, bill])), [dashboard.actBills, dashboard.allBills]);
	const selectedAct = selectedActId ? dashboard.acts.find((act) => act.id === selectedActId) ?? null : null;
	const selectedActLinkedBill = selectedAct ? actBillsById.get(selectedAct.linked_bill_id) ?? null : null;
	const selectedAnalysisKey = selectedBillForRender ? `${selectedBillForRender.bill.id}:${dashboard.filters.language}` : null;
	const localSelectedAnalysis = useMemo(
		() => (selectedBillForRender ? buildBillAnalysis(selectedBillForRender.bill, selectedBillForRender.actions, dashboard.filters.language) : null),
		[selectedBillForRender, dashboard.filters.language]
	);
	const selectedBillAnalysis = selectedAnalysisKey ? (aiAnalysisByKey[selectedAnalysisKey] ?? localSelectedAnalysis) : null;
	const selectedAnalysisStatus: AnalysisStatus = selectedAnalysisKey && aiAnalysisByKey[selectedAnalysisKey]?.source === 'groq'
		? 'ai'
		: aiAnalysisLoadingKey === selectedAnalysisKey
			? 'loading'
			: 'local';

	const navigateInApp = useCallback((href: string) => {
		const url = new URL(href, window.location.href);
		if (url.origin !== window.location.origin) {
			window.location.href = href;
			return;
		}

		window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`);
		setLocationSearch(url.search);
	}, []);

	useEffect(() => {
		const handlePopState = () => setLocationSearch(window.location.search);
		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		async function loadFromDatabase() {
			try {
				const dashboardResponse = await fetch(`/api/dashboard${dashboardSearch}`, { signal: controller.signal });
				if (!dashboardResponse.ok) return;
				const databaseDashboard = (await dashboardResponse.json()) as AppDashboardData;
				setDashboard(databaseDashboard);
			} catch (error) {
				if (!controller.signal.aborted) {
					console.warn('BharatZero database API unavailable; using bundled fallback data.', error);
				}
			}
		}

		void loadFromDatabase();
		return () => controller.abort();
	}, [dashboardSearch]);

	useEffect(() => {
		const controller = new AbortController();

		async function loadSelectedBill() {
			if (!selectedBillId) {
				setSelectedBill(null);
				return;
			}

			try {
				const detailResponse = await fetch(`/api/bills/${encodeURIComponent(selectedBillId)}`, {
					signal: controller.signal
				});
				if (detailResponse.ok) {
					setSelectedBill((await detailResponse.json()) as AppBillDetailData);
					return;
				}
				setSelectedBill(null);
			} catch (error) {
				if (!controller.signal.aborted) {
					console.warn('BharatZero bill detail API unavailable.', error);
				}
			}
		}

		void loadSelectedBill();
		return () => controller.abort();
	}, [selectedBillId]);

	useEffect(() => {
		if (!selectedBillForRender || !selectedAnalysisKey || aiAnalysisByKey[selectedAnalysisKey] || aiAnalysisFailedKeys[selectedAnalysisKey]) {
			return;
		}

		const controller = new AbortController();
		const billId = selectedBillForRender.bill.id;
		const analysisKey = selectedAnalysisKey;
		async function loadAiAnalysis() {
			setAiAnalysisLoadingKey(analysisKey);
			try {
				const response = await fetch(`/api/bills/${encodeURIComponent(billId)}/ai-analysis?lang=${dashboard.filters.language}`, {
					signal: controller.signal
				});
				if (!response.ok) {
					setAiAnalysisFailedKeys((current) => ({ ...current, [analysisKey]: true }));
					return;
				}
				const payload = (await response.json()) as AiBillAnalysisResponse;
				setAiAnalysisByKey((current) => ({ ...current, [analysisKey]: payload.analysis }));
			} catch (error) {
				if (!controller.signal.aborted) {
					console.warn('Groq bill analysis unavailable; using local analysis.', error);
					setAiAnalysisFailedKeys((current) => ({ ...current, [analysisKey]: true }));
				}
			} finally {
				if (!controller.signal.aborted) {
					setAiAnalysisLoadingKey((current) => (current === analysisKey ? null : current));
				}
			}
		}

		void loadAiAnalysis();
		return () => controller.abort();
	}, [selectedBillForRender, selectedAnalysisKey, dashboard.filters.language, aiAnalysisByKey, aiAnalysisFailedKeys]);

	return (
		<AppShell
			section={dashboard.filters.section}
			query={dashboard.filters.query}
			language={dashboard.filters.language}
			dashboard={dashboard}
			aside={
				dashboard.filters.section === 'acts' ? (
					<ActDetailPanel act={selectedAct} linkedBill={selectedActLinkedBill} filters={dashboard.filters} onNavigate={navigateInApp} />
				) : dashboard.filters.section === 'bills' ? (
					<BillDetailPanel bill={selectedBillForRender?.bill ?? null} actions={selectedBillForRender?.actions ?? []} language={dashboard.filters.language} analysis={selectedBillAnalysis} analysisStatus={selectedAnalysisStatus} />
				) : null
			}
		>
			<MainContent dashboard={dashboard} selectedBillId={selectedBillId} selectedActId={selectedActId} selectedBill={selectedBillForRender} selectedBillAnalysis={selectedBillAnalysis} selectedAnalysisStatus={selectedAnalysisStatus} onNavigate={navigateInApp} />
		</AppShell>
	);
}

function MainContent({
	dashboard,
	selectedBillId,
	selectedActId,
	selectedBill,
	selectedBillAnalysis,
	selectedAnalysisStatus,
	onNavigate
}: {
	dashboard: AppDashboardData;
	selectedBillId: string | null;
	selectedActId: string | null;
	selectedBill: AppBillDetailData | null;
	selectedBillAnalysis: BillAnalysis | null;
	selectedAnalysisStatus: AnalysisStatus;
	onNavigate: NavigateHandler;
}) {
	const { filters } = dashboard;
	const sessionName = dashboard.sittingDays[0]?.session_name ?? 'Parliament sitting';
	const sourceStatusLabels = {
		prepared: 'Ready to connect',
		'future-adapter': 'Planned source'
	};
	const sourceStatusHelp = {
		prepared: 'The app already has a defined record shape for this source.',
		'future-adapter': 'This official source is identified, but the connector is scheduled for later.'
	};
	const sourcePipelineLabels = ['Find official record', 'Clean and match fields', 'Place on bill timeline', 'Show in BharatZero'];
	const actPositionSources = getActPartyPositionSourceRefs();
	const actBillsById = useMemo(() => new Map((dashboard.actBills ?? dashboard.allBills ?? []).map((bill) => [bill.id, bill])), [dashboard.actBills, dashboard.allBills]);

	return (
		<>
			<FilterBar filters={filters} sessionName={sessionName} stageCounts={dashboard.stageCounts ?? []} areaCounts={dashboard.areaCounts ?? []} />
			<LoadTimeNotice />

			{filters.section === 'overview' && (
				<>
					<section>
						<div className="mb-2 flex items-center justify-between gap-3">
							<div>
								<p className="bz-eyebrow">Latest legislation</p>
								<h2 className="mt-1 text-base font-semibold text-[var(--bz-text-1)]">Bills moving through Parliament</h2>
							</div>
							<a
								className="rounded-md border border-[var(--bz-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus"
								href={hrefFor('bills', filters.language)}
							>
								View all
							</a>
						</div>
						<BillList bills={dashboard.bills} selectedBillId={selectedBillId ?? undefined} filters={filters} onNavigate={onNavigate} />
					</section>
					<TimelineRail events={dashboard.timelineEvents} dateRail={dashboard.timelineDateRail} groups={dashboard.timelineGroups} />
				</>
			)}

			{filters.section === 'timeline' && <TimelineRail events={dashboard.timelineEvents} dateRail={dashboard.timelineDateRail} groups={dashboard.timelineGroups} />}

			{filters.section === 'houses' && <HousesSection />}

			{filters.section === 'bills' && (
				<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] 2xl:grid-cols-1">
					<div className="space-y-3">
						<BillPagination filters={filters} pagination={dashboard.pagination} />
						<BillList bills={dashboard.bills} selectedBillId={selectedBillId ?? undefined} filters={filters} onNavigate={onNavigate} />
						<BillPagination filters={filters} pagination={dashboard.pagination} />
					</div>
					<div className="2xl:hidden">
						<BillAnalysisPanel bill={selectedBill?.bill ?? null} actions={selectedBill?.actions ?? []} language={filters.language} analysis={selectedBillAnalysis} analysisStatus={selectedAnalysisStatus} />
					</div>
				</div>
			)}

			{filters.section === 'committees' && (
				<section className="grid gap-3 md:grid-cols-2">
					{dashboard.committees.map((committee) => (
						<article className="bz-panel rounded-lg p-4" key={committee.id}>
							<p className="bz-eyebrow">{committee.type}</p>
							<h2 className="mt-2 text-base font-semibold text-[var(--bz-text-1)]">{committee.name}</h2>
							<p className="mt-2 text-sm text-[var(--bz-text-2)]">{houseLabelsLocalized[filters.language][committee.house]}</p>
							<div className="mt-4">
								<SourceBadge url={committee.source_url} isDemoSeed={committee.isDemoSeed} />
							</div>
						</article>
					))}
				</section>
			)}

			{filters.section === 'questions' && (
				<section className="space-y-3">
					{dashboard.questions.map((question) => (
						<article className="bz-panel rounded-lg p-4" key={question.id}>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<h2 className="text-base font-semibold text-[var(--bz-text-1)]">{question.subject}</h2>
								<span className="rounded-md border border-[var(--bz-border)] px-2 py-1 text-[11px] text-[var(--bz-text-2)]">{question.answer_status}</span>
							</div>
							<p className="mt-2 text-sm text-[var(--bz-text-2)]">
								{question.number} · {houseLabelsLocalized[filters.language][question.house]} · {question.ministry} · {formatDate(question.date)}
							</p>
							<div className="mt-4">
								<SourceBadge url={question.source_url} isDemoSeed={question.isDemoSeed} />
							</div>
						</article>
					))}
				</section>
			)}

			{filters.section === 'debates' && (
				dashboard.debates.length ? (
					<section className="space-y-3">
						{dashboard.debates.map((debate) => (
							<article className="bz-panel rounded-lg p-4" key={debate.id}>
								<p className="bz-eyebrow">
									{houseLabelsLocalized[filters.language][debate.house]} · {formatDate(debate.date)}
								</p>
								<h2 className="mt-2 text-base font-semibold text-[var(--bz-text-1)]">{debate.title}</h2>
								<p className="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">{debate.summary}</p>
								<div className="mt-4">
									<SourceBadge url={debate.source_url} isDemoSeed={debate.isDemoSeed} />
								</div>
							</article>
						))}
					</section>
				) : (
					<EmptyState title="No debates match these filters" message="Change the search, House, or source filter to broaden the debate proceedings." />
				)
			)}

			{filters.section === 'acts' && (
				<div className="space-y-3">
					<BillPagination filters={filters} pagination={dashboard.pagination} recordLabel="Act record" recordLabelPlural="Act records" hrefForPage={hrefForActPage} ariaLabel="Act pages" />
					<ActsList acts={dashboard.acts} linkedBillsById={actBillsById} selectedActId={selectedActId ?? undefined} filters={filters} onNavigate={onNavigate} />
					<BillPagination filters={filters} pagination={dashboard.pagination} recordLabel="Act record" recordLabelPlural="Act records" hrefForPage={hrefForActPage} ariaLabel="Act pages" />
				</div>
			)}

			{filters.section === 'sources' && (
				<div className="space-y-3">
					<section className="bz-panel rounded-lg p-5">
						<p className="bz-eyebrow text-[var(--bz-accent)]">Official sources</p>
						<h2 className="mt-2 text-xl font-semibold text-[var(--bz-text-1)]">Where BharatZero will link each record</h2>
						<p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--bz-text-2)]">
							Every bill, action, question, debate, and Act should trace back to an official public source. This screen shows which source families are ready to connect and which are planned next.
						</p>
						<div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--bz-text-2)]">
							<span className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1">
								<b className="text-[var(--bz-text-1)]">Ready to connect</b> means the source shape is defined.
							</span>
							<span className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1">
								<b className="text-[var(--bz-text-1)]">Planned source</b> means the official source is identified for a future connector.
							</span>
						</div>
						<div className="mt-4 grid gap-3 md:grid-cols-4">
							{dashboard.ingestion.pipelineSteps.map((step, index) => (
								<div className="rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3" key={step}>
									<p className="bz-eyebrow text-[0.55rem]">Step {index + 1}</p>
									<p className="mt-2 text-sm font-semibold text-[var(--bz-text-1)]">{sourcePipelineLabels[index] ?? step.replaceAll('_', ' ')}</p>
								</div>
							))}
						</div>
					</section>
					<section className="grid gap-3 md:grid-cols-2">
						{dashboard.sources.map((source) => (
							<article className="bz-panel rounded-lg p-4" key={source.id}>
								<div className="flex flex-wrap items-center justify-between gap-3">
									<h2 className="text-base font-semibold text-[var(--bz-text-1)]">{source.name}</h2>
									<span className="rounded-md border border-[var(--bz-border)] px-2 py-1 text-[11px] text-[var(--bz-text-2)]" title={sourceStatusHelp[source.status]}>
										{sourceStatusLabels[source.status]}
									</span>
								</div>
								<p className="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">{source.preparedFor}</p>
								<div className="mt-4 flex flex-wrap items-center gap-2">
									<a
										className="rounded-md border border-[var(--bz-accent)] bg-[var(--bz-accent-2)] px-2 py-1 text-[10.5px] font-semibold text-[var(--bz-accent)] transition hover:bg-[var(--bz-accent)] hover:text-white bz-focus"
										href={hrefForSourceRecords(source.id, filters.language)}
									>
										Show records
									</a>
									<SourceBadge url={source.url} kind={source.kind} label={sourceKindLabels[source.kind]} isDemoSeed={source.kind === 'demo-seed'} />
								</div>
							</article>
						))}
					</section>
					<section className="bz-panel rounded-lg p-5">
						<p className="bz-eyebrow text-[var(--bz-accent)]">Act position evidence</p>
						<h2 className="mt-2 text-xl font-semibold text-[var(--bz-text-1)]">Sources for party-position notes</h2>
						<p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--bz-text-2)]">
							These references support the sourced party-position read shown on selected Act detail panels. Press coverage is separated from official source families so the evidence type stays clear.
						</p>
						<div className="mt-4 grid gap-3 md:grid-cols-3">
							{actPositionSources.map((source) => (
								<article className="rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3" key={source.url}>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<h3 className="text-sm font-semibold text-[var(--bz-text-1)]">{source.label}</h3>
										<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface)] px-1.5 py-0.5 text-[10px] font-semibold capitalize text-[var(--bz-text-2)]">{source.type.replace('-', ' ')}</span>
									</div>
									<p className="mt-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">{source.usedFor}</p>
									<a className="mt-3 inline-flex rounded-md border border-[var(--bz-accent)] bg-[var(--bz-accent-2)] px-2 py-1 text-[10.5px] font-semibold text-[var(--bz-accent)] transition hover:bg-[var(--bz-accent)] hover:text-white bz-focus" href={source.url} target="_blank" rel="noreferrer">
										Open source
									</a>
								</article>
							))}
						</div>
					</section>
				</div>
			)}
		</>
	);
}

function HousesSection() {
	const parliamentSummary = [
		['Lok Sabha', 'Directly elected chamber', 'Government confidence, Money Bills, and the Budget start here.'],
		['Rajya Sabha', 'Council of States', 'Reviews ordinary Bills and represents states and Union territories.'],
		['Control', 'Seat strength matters', 'The side with Lok Sabha confidence forms and sustains government.']
	];

	return (
		<section className="space-y-3">
			<div className="bz-panel rounded-lg p-5">
				<p className="bz-eyebrow text-[var(--bz-accent)]">Union Parliament</p>
				<div className="mt-2 grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
					<div className="min-w-0">
						<h2 className="text-xl font-semibold text-[var(--bz-text-1)]">Seats, control, and House roles</h2>
						<p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--bz-text-2)]">
							India’s Parliament has two Houses. Lok Sabha is the directly elected House that decides who governs. Rajya Sabha is the continuing Council of States that reviews legislation and gives states a voice in Parliament.
						</p>
						<div className="mt-4 grid gap-2 md:grid-cols-3">
							{parliamentSummary.map(([title, label, body]) => (
								<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3" key={title}>
									<p className="text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--bz-text-3)]">{title}</p>
									<p className="mt-2 text-sm font-semibold text-[var(--bz-text-1)]">{label}</p>
									<p className="mt-1 text-xs leading-5 text-[var(--bz-text-2)]">{body}</p>
								</div>
							))}
						</div>
					</div>
					<div className="grid content-end gap-2 text-center sm:grid-cols-2 xl:grid-cols-1">
						<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2">
							<p className="bz-eyebrow text-[0.55rem]">Lok Sabha</p>
							<p className="bz-mono mt-1 text-xl font-semibold text-[var(--bz-text-1)]">543</p>
							<p className="mt-1 text-[10px] text-[var(--bz-text-3)]">elected seats</p>
						</div>
						<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2">
							<p className="bz-eyebrow text-[0.55rem]">Rajya Sabha</p>
							<p className="bz-mono mt-1 text-xl font-semibold text-[var(--bz-text-1)]">245</p>
							<p className="mt-1 text-[10px] text-[var(--bz-text-3)]">current seats</p>
						</div>
					</div>
				</div>
			</div>

			<div className="grid gap-3">
				{parliamentHouseSnapshots.map((house) => (
					<HouseSnapshotCard house={house} key={house.id} />
				))}
			</div>
		</section>
	);
}

function HouseSnapshotCard({ house }: { house: ParliamentHouseSnapshot }) {
	const totalSeats = house.composition.reduce((sum, entry) => sum + entry.seats, 0);
	const seatDots = useMemo(() => buildHemicycleSeats(house), [house]);
	const [selectedLabel, setSelectedLabel] = useState(house.composition[0]?.label ?? '');
	const selectedEntry = house.composition.find((entry) => entry.label === selectedLabel) ?? house.composition[0];
	const selectedShare = selectedEntry ? (selectedEntry.seats / totalSeats) * 100 : 0;
	const seatClipId = `${house.id}-seat-clip`;

	return (
		<article className="bz-panel rounded-lg p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="bz-eyebrow">{house.role}</p>
					<h2 className="mt-1 text-lg font-semibold text-[var(--bz-text-1)]">{house.name}</h2>
				</div>
				<span className="rounded-md bg-[var(--bz-accent-2)] px-2 py-1 text-[11px] font-bold text-[var(--bz-accent)]">{house.seatSummary}</span>
			</div>

			<p className="mt-3 text-sm leading-6 text-[var(--bz-text-2)]">{house.holderSummary}</p>
			<p className="mt-2 text-xs leading-5 text-[var(--bz-text-3)]">{house.termSummary}</p>

			<div className="mt-4 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
				<div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
					<div className="min-w-0">
						<svg className="block h-auto w-full overflow-hidden" viewBox="0 0 560 302" role="img" aria-label={`${house.name} clickable seating arrangement`}>
							<defs>
								<clipPath id={seatClipId}>
									<rect x="34" y="30" width="492" height="232" rx="15" />
								</clipPath>
							</defs>
							<rect x="34" y="30" width="492" height="232" rx="15" fill="var(--bz-surface)" opacity="0.78" />
							<path d="M91 238 A189 189 0 0 1 469 238" fill="none" stroke="var(--bz-border)" strokeWidth="10" opacity="0.2" />
							<path d="M197 238 A83 83 0 0 1 363 238" fill="none" stroke="var(--bz-border)" strokeWidth="2" opacity="0.38" />
							<path d="M244 239 A36 36 0 0 1 316 239" fill="none" stroke="var(--bz-border)" strokeWidth="6" opacity="0.32" />
							<g clipPath={`url(#${seatClipId})`}>
								{seatDots.map((seat) => (
									<circle
										aria-label={`${house.name} seat ${seat.seatNumber}: ${seat.entry.label}, ${seat.entry.bloc}`}
										className="cursor-pointer outline-none transition hover:stroke-[var(--bz-text-1)] focus:stroke-[var(--bz-text-1)]"
										cx={seat.x}
										cy={seat.y}
										fill={seat.entry.color}
										key={seat.seatNumber}
										onClick={() => setSelectedLabel(seat.entry.label)}
										onKeyDown={(event) => {
											if (event.key === 'Enter' || event.key === ' ') {
												event.preventDefault();
												setSelectedLabel(seat.entry.label);
											}
										}}
										opacity={selectedEntry && selectedEntry.label !== seat.entry.label ? 0.68 : 1}
										r={house.id === 'lok-sabha' ? 2.85 : 3.9}
										role="button"
										stroke={selectedEntry?.label === seat.entry.label ? 'var(--bz-text-1)' : 'var(--bz-surface)'}
										strokeWidth={selectedEntry?.label === seat.entry.label ? 1 : 0.55}
										tabIndex={0}
									>
										<title>{`${seat.entry.label} · ${seat.entry.bloc} · seat ${seat.seatNumber}`}</title>
									</circle>
								))}
							</g>
						</svg>
					</div>
					<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] p-3">
						<p className="bz-eyebrow">Selected group</p>
						<div className="mt-2 flex items-center gap-2">
							<span className="h-3 w-3 rounded-full" style={{ background: selectedEntry?.color }} />
							<h3 className="text-sm font-semibold text-[var(--bz-text-1)]">{selectedEntry?.label}</h3>
						</div>
						<p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bz-text-3)]">{selectedEntry?.bloc}</p>
						<p className="bz-mono mt-3 text-2xl font-bold text-[var(--bz-text-1)]">{selectedEntry?.seats.toLocaleString('en-IN')}</p>
						<p className="mt-1 text-xs text-[var(--bz-text-3)]">{selectedShare.toFixed(1)}% of shown seats</p>
						<div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bz-border)]">
							<span className="block h-full rounded-full" style={{ width: `${selectedShare}%`, background: selectedEntry?.color }} />
						</div>
						<p className="mt-3 text-xs leading-5 text-[var(--bz-text-2)]">{selectedEntry?.description}</p>
					</div>
				</div>

				<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-2 2xl:grid-cols-5">
					{house.composition.map((entry) => (
						<button
							className={cx(
								'flex min-w-0 items-center justify-between gap-3 rounded-md border px-2.5 py-2 text-left text-xs transition bz-focus',
								selectedEntry?.label === entry.label
									? 'border-[var(--bz-accent)] bg-[var(--bz-accent-2)]'
									: 'border-[var(--bz-border)] bg-[var(--bz-surface)] hover:border-[var(--bz-accent)]'
							)}
							key={entry.label}
							onClick={() => setSelectedLabel(entry.label)}
							type="button"
						>
							<span className="flex min-w-0 items-center gap-2 text-[var(--bz-text-2)]">
								<span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color }} />
								<span className="min-w-0">
									<span className="block truncate font-semibold text-[var(--bz-text-1)]">{entry.label}</span>
									<span className="block truncate text-[10px] uppercase tracking-[0.08em] text-[var(--bz-text-3)]">{entry.bloc}</span>
								</span>
							</span>
							<span className="bz-mono shrink-0 font-semibold text-[var(--bz-text-1)]">{entry.seats.toLocaleString('en-IN')}</span>
						</button>
					))}
				</div>
			</div>

			<div className="mt-4">
				<p className="bz-eyebrow">What it does</p>
				<ul className="mt-2 space-y-2 text-sm leading-5 text-[var(--bz-text-2)]">
					{house.primaryWork.map((item) => (
						<li className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2" key={item}>
							{item}
						</li>
					))}
				</ul>
			</div>

			<div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--bz-border)] pt-3">
				<span className="text-[10.5px] text-[var(--bz-text-3)]">{house.asOf}</span>
				<SourceBadge url={house.sourceUrl} label={house.sourceLabel} />
			</div>
		</article>
	);
}

type SeatDot = {
	seatNumber: number;
	x: number;
	y: number;
	entry: ParliamentHouseSnapshot['composition'][number];
};

function buildHemicycleSeats(house: ParliamentHouseSnapshot): SeatDot[] {
	const totalSeats = house.composition.reduce((sum, entry) => sum + entry.seats, 0);
	const rowCount = totalSeats > 400 ? 15 : 10;
	const centerX = 280;
	const centerY = 244;
	const innerRadius = totalSeats > 400 ? 72 : 82;
	const outerRadius = 186;
	const anglePadding = totalSeats > 400 ? 0.055 : 0.075;
	const angleSpan = Math.PI - anglePadding * 2;
	const radiusStep = (outerRadius - innerRadius) / Math.max(1, rowCount - 1);
	const rowRadii = Array.from({ length: rowCount }, (_, rowIndex) => innerRadius + rowIndex * radiusStep);
	const rowWeights = rowRadii.map((radius) => radius * angleSpan);
	const weightTotal = rowWeights.reduce((sum, weight) => sum + weight, 0);
	const rowCounts = rowWeights.map((weight) => Math.max(1, Math.round((totalSeats * weight) / weightTotal)));
	let delta = totalSeats - rowCounts.reduce((sum, count) => sum + count, 0);
	for (let index = rowCounts.length - 1; delta !== 0; index = index <= 0 ? rowCounts.length - 1 : index - 1) {
		if (delta > 0) {
			rowCounts[index] += 1;
			delta -= 1;
		} else if (rowCounts[index] > 1) {
			rowCounts[index] -= 1;
			delta += 1;
		}
	}

	type SeatPosition = Omit<SeatDot, 'entry'> & {
		rowIndex: number;
		theta: number;
	};

	const positions: SeatPosition[] = [];
	let seatIndex = 0;

	rowCounts.forEach((count, rowIndex) => {
		const radius = rowRadii[rowIndex];
		const rowOffset = rowIndex % 2 === 0 ? 0 : 0.5 / count;
		for (let index = 0; index < count; index += 1) {
			const ratio = count === 1 ? 0.5 : (index + rowOffset) / (count - 1);
			const theta = Math.PI - anglePadding - ratio * angleSpan;
			const x = centerX + Math.cos(theta) * radius;
			const y = centerY - Math.sin(theta) * radius;
			positions.push({
				seatNumber: seatIndex + 1,
				x: Number(x.toFixed(2)),
				y: Number(y.toFixed(2)),
				rowIndex,
				theta
			});
			seatIndex += 1;
		}
	});

	const seatsToEntry = house.composition.flatMap((entry) => Array.from({ length: entry.seats }, () => entry));
	const assignment = new Map<number, ParliamentHouseSnapshot['composition'][number]>();
	const sortedBySide = [...positions].sort((a, b) => b.theta - a.theta || a.rowIndex - b.rowIndex || a.seatNumber - b.seatNumber);
	sortedBySide.forEach((seat, index) => {
		assignment.set(seat.seatNumber, seatsToEntry[index] ?? house.composition.at(-1)!);
	});

	return positions.map((seat) => ({
		seatNumber: seat.seatNumber,
		x: seat.x,
		y: seat.y,
		entry: assignment.get(seat.seatNumber) ?? house.composition.at(-1)!
	}));
}

function AppShell({
	section,
	query,
	language,
	dashboard,
	children,
	aside
}: {
	section: SectionId;
	query: string;
	language: Language;
	dashboard: AppDashboardData;
	children: React.ReactNode;
	aside?: React.ReactNode;
}) {
	const [darkMode, setDarkMode] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [signedInDemo, setSignedInDemo] = useState(false);
	const [cabinetOpen, setCabinetOpen] = useState(false);
	const hasAside = Boolean(aside);
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

	return (
		<div className={cx(darkMode && 'dark', 'min-h-dvh overflow-hidden bg-[var(--bz-bg)] text-[var(--bz-text-1)]')}>
			<header className="sticky top-0 z-50 flex min-h-12 items-center gap-2 border-b border-[var(--bz-border)] bg-[var(--bz-surface)] px-3">
				<a className="shrink-0 text-sm font-bold tracking-tight text-[var(--bz-accent)] bz-focus" href={hrefFor('overview', language)}>
					BharatZero
				</a>
				<div className="hidden h-5 w-px bg-[var(--bz-border)] sm:block" />
				<SectionTabs active={section} language={language} />
				<div className="mx-auto hidden min-w-[14rem] max-w-[24rem] flex-1 md:block">
					<SearchCommand query={query} language={language} section={section} source={dashboard.filters.source} />
				</div>
				<div className="ml-auto flex shrink-0 items-center gap-1">
					<div className="hidden items-center gap-2 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1 lg:flex">
						<span className="relative h-2 w-2">
							<span className="absolute inset-0 rounded-full bg-emerald-500 [animation:bz-pulse_2s_ease-in-out_infinite]" />
						</span>
						<div className="leading-none">
							<p className="bz-eyebrow text-[0.5rem]">Updated</p>
							<p className="bz-mono mt-0.5 text-[10px] text-[var(--bz-text-2)]">
								{updatedDate} · {updatedTime}
							</p>
						</div>
					</div>
					<div className="hidden h-5 w-px bg-[var(--bz-border)] sm:block" />
					<button
						className={cx(
							'rounded-md border px-2.5 py-1 text-[11px] font-medium transition bz-focus',
							signedInDemo
								? 'border-[var(--bz-accent)] bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
								: 'border-[var(--bz-border)] bg-transparent text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
						)}
						type="button"
						onClick={() => setSignedInDemo((value) => !value)}
					>
						{signedInDemo ? 'Signed In' : 'Sign In'}
					</button>
					<button
						className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus"
						type="button"
						onClick={() => setDarkMode((value) => !value)}
					>
						{darkMode ? 'Light' : 'Dark'}
					</button>
					<button
						className={cx(
							'rounded-md border px-2.5 py-1 text-[13px] font-medium leading-none transition bz-focus',
							sidebarCollapsed
								? 'border-[var(--bz-accent)] bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
								: 'border-[var(--bz-border)] bg-transparent text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
						)}
						type="button"
						aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
						title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
						onClick={() => setSidebarCollapsed((value) => !value)}
					>
						≡
					</button>
				</div>
			</header>

			{signedInDemo && <div className="border-b border-[var(--bz-border)] bg-[var(--bz-accent-3)] px-3 py-2 text-xs text-[var(--bz-text-2)]">Profile mode is active. Saved bill tracking and alerts will connect to real auth later.</div>}

			<div
				className={cx(
					'grid h-[calc(100dvh-2.75rem)] min-h-0 grid-cols-1 overflow-hidden',
					sidebarCollapsed
						? hasAside
							? 'lg:grid-cols-[minmax(0,1fr)_340px]'
							: 'lg:grid-cols-[minmax(0,1fr)]'
						: hasAside
							? 'lg:grid-cols-[260px_minmax(0,1fr)_340px]'
							: 'lg:grid-cols-[260px_minmax(0,1fr)]'
				)}
			>
				{!sidebarCollapsed && <LeftSidebar cabinetOpen={cabinetOpen} setCabinetOpen={setCabinetOpen} dashboard={dashboard} language={language} />}
				<main className="min-h-0 min-w-0 overflow-y-auto">
					<div className="mx-auto max-w-[1120px] space-y-3 p-3 lg:p-4">
						<div className="md:hidden">
							<SearchCommand query={query} language={language} section={section} source={dashboard.filters.source} />
						</div>
						{children}
					</div>
				</main>
				{hasAside && <div className="hidden min-h-0 min-w-0 overflow-y-auto border-l border-[var(--bz-border)] bg-[var(--bz-surface)] lg:block">{aside}</div>}
			</div>
		</div>
	);
}

function SectionTabs({ active, language }: { active: SectionId; language: Language }) {
	const fixedSections: SectionId[] = ['houses', 'timeline'];
	const primarySections: SectionId[] = ['bills', 'committees'];
	const secondarySections = SECTION_IDS.filter((section) => section !== 'overview' && !fixedSections.includes(section) && !primarySections.includes(section));
	const linkClass = (section: SectionId) =>
		cx(
			'relative z-20 grid h-10 min-w-[5.75rem] shrink-0 select-none place-items-center whitespace-nowrap rounded-md border border-transparent px-3 text-xs font-medium leading-none transition bz-focus',
			active === section
				? 'bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
				: 'text-[var(--bz-text-2)] hover:bg-[var(--bz-surface-2)] hover:text-[var(--bz-text-1)]'
		);

	return (
		<nav className="relative z-20 flex shrink-0 items-center gap-1 overflow-visible" aria-label="Sections">
			<a
				className={cx(
					'group relative z-20 flex shrink-0 select-none items-center justify-center whitespace-nowrap text-xs font-medium leading-none transition bz-focus',
					active === 'overview' ? 'text-[var(--bz-accent)]' : 'text-[var(--bz-text-2)] hover:text-[var(--bz-text-1)]'
				)}
				data-testid="section-overview-button"
				href={hrefFor('overview', language)}
				aria-current={active === 'overview' ? 'page' : undefined}
				style={{ minHeight: '3rem', alignSelf: 'stretch', pointerEvents: 'auto' }}
			>
				<span
					className={cx(
						'grid h-10 min-w-[5.75rem] place-items-center rounded-md border border-transparent px-3 transition',
						active === 'overview' ? 'bg-[var(--bz-accent-2)]' : 'group-hover:bg-[var(--bz-surface-2)]'
					)}
				>
					{getSectionLabel('overview', language)}
				</span>
			</a>
			{fixedSections.map((section) => (
				<a className={linkClass(section)} data-testid={`section-${section}-button`} href={hrefFor(section, language)} aria-current={active === section ? 'page' : undefined} key={section}>
					{getSectionLabel(section, language)}
				</a>
			))}
			{primarySections.map((section) => (
				<a className={linkClass(section)} data-testid={`section-${section}-button`} href={hrefFor(section, language)} aria-current={active === section ? 'page' : undefined} key={section}>
					{getSectionLabel(section, language)}
				</a>
			))}
			<details className="relative">
				<summary
					className={cx(
						'list-none rounded-md px-2.5 py-1.5 text-xs font-medium transition marker:hidden bz-focus',
						secondarySections.includes(active)
							? 'bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
							: 'text-[var(--bz-text-2)] hover:bg-[var(--bz-surface-2)] hover:text-[var(--bz-text-1)]'
					)}
				>
					More
				</summary>
				<div className="absolute left-0 top-full z-50 mt-1 grid min-w-32 gap-1 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] p-1 shadow-lg">
					{secondarySections.map((section) => (
						<a className={linkClass(section)} href={hrefFor(section, language)} aria-current={active === section ? 'page' : undefined} key={section}>
							{getSectionLabel(section, language)}
						</a>
					))}
				</div>
			</details>
		</nav>
	);
}

function LoadTimeNotice() {
	return (
		<div className="mb-4 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] px-3 py-2 text-xs leading-5 text-[var(--bz-text-2)]">
			<span className="font-semibold text-[var(--bz-text-1)]">Loading note:</span> Some sections pull thousands of records from the database, so it may take a second to load everything.
		</div>
	);
}

function SearchCommand({ query, language, section, source = 'all' }: { query: string; language: Language; section: SectionId; source?: string }) {
	return (
		<form action="/" method="GET" className="relative">
			<input type="hidden" name="section" value={section} />
			<input type="hidden" name="lang" value={language} />
			{source !== 'all' && <input type="hidden" name="source" value={source} />}
			<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--bz-accent)]">⌕</span>
			<input
				name="q"
				defaultValue={query}
				placeholder={t('label.searchPlaceholder', language)}
				className="h-9 w-full rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] pl-8 pr-3 text-xs text-[var(--bz-text-1)] outline-none placeholder:text-[var(--bz-text-3)] focus:border-[var(--bz-accent)] focus:ring-2 focus:ring-amber-500/10"
			/>
		</form>
	);
}

function LeftSidebar({
	cabinetOpen,
	setCabinetOpen,
	dashboard,
	language
}: {
	cabinetOpen: boolean;
	setCabinetOpen: React.Dispatch<React.SetStateAction<boolean>>;
	dashboard: AppDashboardData;
	language: Language;
}) {
	const sidebarRef = useRef<HTMLElement | null>(null);
	const totalBills = dashboard.stats.billsTracked || dashboard.allBills.length || dashboard.bills.length;
	const totalSources = dashboard.sources.length || dashboard.stats.preparedSources;
	const totalCommittees = dashboard.stats.committeesTracked || dashboard.committees.length;
	const selectedPrimeMinister = getPrimeMinisterTerm(dashboard.filters.primeMinister) ?? PRIME_MINISTER_TERMS[0];
	const selectedTermRange = `${yearFromDate(selectedPrimeMinister.startDate)}-${selectedPrimeMinister.endDate ? yearFromDate(selectedPrimeMinister.endDate) : 'present'}`;
	const selectedTermBillCount = dashboard.pagination?.totalItems ?? dashboard.bills.length;
	const selectedTermStatusLabel = selectedPrimeMinister.endDate ? 'End' : 'Status';
	const selectedTermStatusValue = selectedPrimeMinister.endDate ? yearFromDate(selectedPrimeMinister.endDate) : 'Serving';
	const primeMinisterCountById = new Map((dashboard.primeMinisterCounts ?? []).map((item) => [item.id, item.count]));
	const selectedPrimeMinisterIndex = PRIME_MINISTER_TERMS.findIndex((term) => term.id === selectedPrimeMinister.id);
	const newerPrimeMinisterTerm = selectedPrimeMinisterIndex > 0 ? PRIME_MINISTER_TERMS[selectedPrimeMinisterIndex - 1] : null;
	const olderPrimeMinisterTerm = selectedPrimeMinisterIndex >= 0 && selectedPrimeMinisterIndex < PRIME_MINISTER_TERMS.length - 1 ? PRIME_MINISTER_TERMS[selectedPrimeMinisterIndex + 1] : null;
	const cabinetPeople =
		selectedPrimeMinister.id === 'modi-3'
			? [
					['Nirmala Sitharaman', 'Finance'],
					['Arjun Ram Meghwal', 'Law and Justice'],
					['Amit Shah', 'Home Affairs']
				]
			: [];

	useEffect(() => {
		sidebarRef.current?.scrollTo({ top: 0 });
	}, [dashboard.filters.section, dashboard.filters.primeMinister]);

	return (
		<aside ref={sidebarRef} className="hidden h-full min-h-0 overflow-y-auto border-r border-[var(--bz-border)] bg-[var(--bz-surface)] lg:block">
			<div className="p-3">
				<div className="relative mb-3 flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-lg bg-[#ede9e0] dark:bg-[#282520]">
					<div className="absolute inset-x-0 top-0 flex h-1">
						<span className="flex-1 bg-[var(--bz-saffron)]" />
						<span className="flex-1 bg-white" />
						<span className="flex-1 bg-[var(--bz-green)]" />
					</div>
					<div className="absolute right-3 top-3 rounded bg-white/80 px-1.5 py-0.5 text-[11px] shadow-sm" aria-hidden="true">
						🇮🇳
					</div>
					<div className="mx-auto mb-[-0.25rem] flex h-16 w-16 items-center justify-center rounded-full border-4 border-[var(--bz-surface)] bg-[#c9c1b5] text-xl font-bold text-[var(--bz-text-2)] shadow-sm dark:bg-[#4a4540]" aria-label={`${selectedPrimeMinister.name} profile image placeholder`}>
						{initialsForName(selectedPrimeMinister.name)}
					</div>
					<div className="flex h-[42%] items-end justify-center bg-[#aaa59c] pb-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/70 dark:bg-[#3a3530]">Prime Minister</div>
				</div>
				<p className="text-[10px] text-[var(--bz-text-3)]">
					{selectedPrimeMinister.lokSabha ?? 'Union Parliament'} · <span className="font-semibold text-[var(--bz-accent)]">{selectedPrimeMinister.termLabel}</span>
				</p>
				<h1 className="mt-1 text-base font-bold leading-tight text-[var(--bz-text-1)]">{selectedPrimeMinister.name}</h1>
				<p className="mt-1 text-[11px] text-[var(--bz-text-3)]">Bills introduced during this PM term</p>
				<div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.04em] text-[var(--bz-text-3)]">
					<span>
						Party <b className="text-[var(--bz-accent)]">{selectedPrimeMinister.party}</b>
					</span>
					<span aria-hidden="true">·</span>
					<span>
						Start <b className="text-[var(--bz-text-1)]">{yearFromDate(selectedPrimeMinister.startDate)}</b>
					</span>
					<span aria-hidden="true">·</span>
					<span>
						{selectedTermStatusLabel} <b className="text-[var(--bz-text-1)]">{selectedTermStatusValue}</b>
					</span>
				</div>
				<div className="mt-3 grid grid-cols-[1fr_1fr_1fr] gap-y-1 text-xs">
					<p className="bz-eyebrow text-[0.55rem]">Window</p>
					<p className="bz-eyebrow text-center text-[0.55rem]">Party</p>
					<p className="bz-eyebrow text-right text-[0.55rem]">Bills</p>
					<div className="contents">
						<p className="text-[var(--bz-text-2)]">{selectedTermRange}</p>
						<p className="bz-mono text-center text-[var(--bz-text-3)]">{selectedPrimeMinister.party}</p>
						<p className="bz-mono text-right font-semibold text-[var(--bz-text-1)]">{selectedTermBillCount.toLocaleString('en-IN')}</p>
					</div>
				</div>
				<div className="mt-3 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2">
					<div className="flex items-center justify-between gap-2">
						<p className="bz-eyebrow text-[0.55rem]">PM history</p>
						<a className="text-[10px] font-semibold text-[var(--bz-accent)] hover:underline bz-focus" href={hrefForPrimeMinisterFilter(dashboard.filters, 'all')}>
							All terms
						</a>
					</div>
					<div className="mt-2 grid grid-cols-2 gap-1">
						<a
							className={cx(
								'rounded border px-2 py-1.5 text-[10px] font-semibold transition bz-focus',
								newerPrimeMinisterTerm
									? 'border-[var(--bz-border)] bg-[var(--bz-surface)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
									: 'pointer-events-none border-[var(--bz-border)] text-[var(--bz-text-3)] opacity-50'
							)}
							href={newerPrimeMinisterTerm ? hrefForPrimeMinisterFilter(dashboard.filters, newerPrimeMinisterTerm.id) : '#'}
							aria-disabled={!newerPrimeMinisterTerm}
						>
							Newer term
						</a>
						<a
							className={cx(
								'rounded border px-2 py-1.5 text-right text-[10px] font-semibold transition bz-focus',
								olderPrimeMinisterTerm
									? 'border-[var(--bz-border)] bg-[var(--bz-surface)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
									: 'pointer-events-none border-[var(--bz-border)] text-[var(--bz-text-3)] opacity-50'
							)}
							href={olderPrimeMinisterTerm ? hrefForPrimeMinisterFilter(dashboard.filters, olderPrimeMinisterTerm.id) : '#'}
							aria-disabled={!olderPrimeMinisterTerm}
						>
							Older term
						</a>
					</div>
					<div className="mt-2 max-h-44 space-y-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable] [scrollbar-width:thin]" aria-label="Prime minister terms">
						{PRIME_MINISTER_TERMS.map((term) => {
							const count = primeMinisterCountById.get(term.id) ?? 0;
							return (
								<a
									className={cx(
										'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded px-2 py-1.5 text-[10.5px] transition bz-focus',
										selectedPrimeMinister.id === term.id
											? 'bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
											: 'bg-[var(--bz-surface)] text-[var(--bz-text-2)] hover:text-[var(--bz-accent)]'
									)}
									href={hrefForPrimeMinisterFilter(dashboard.filters, term.id)}
									key={term.id}
									aria-current={selectedPrimeMinister.id === term.id ? 'page' : undefined}
								>
									<span className="min-w-0 truncate">
										{term.name} · {yearFromDate(term.startDate)}
									</span>
									<span className="bz-mono font-semibold">{count.toLocaleString('en-IN')}</span>
								</a>
							);
						})}
					</div>
				</div>
				<button
					className="mt-3 w-full rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus"
					type="button"
					aria-expanded={cabinetOpen}
					onClick={() => setCabinetOpen((value) => !value)}
				>
					{cabinetOpen ? 'Hide Cabinet' : 'View Cabinet'}
				</button>
				{cabinetOpen && (
					<div className="mt-2 space-y-1 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2">
						{cabinetPeople.length ? (
							cabinetPeople.map(([name, portfolio]) => (
								<div className="flex items-center justify-between gap-2 text-[11px]" key={name}>
									<span className="font-semibold text-[var(--bz-text-1)]">{name}</span>
									<span className="text-right text-[var(--bz-text-3)]">{portfolio}</span>
								</div>
							))
						) : (
							<p className="text-[10.5px] leading-4 text-[var(--bz-text-2)]">Cabinet roster is not loaded for this historical term yet.</p>
						)}
					</div>
				)}
				<div className="mt-3 grid grid-cols-3 gap-2 text-center">
					{[
						['Bills', totalBills.toLocaleString('en-IN')],
						['Houses', '2'],
						['Sources', totalSources.toLocaleString('en-IN')]
					].map(([label, value]) => (
						<div className="bz-panel-muted rounded-md p-2.5" key={label}>
							<p className="text-[0.55rem] font-bold uppercase tracking-[0.03em] text-[var(--bz-text-3)]">{label}</p>
							<p className="bz-mono mt-1 text-sm font-semibold">{value}</p>
						</div>
					))}
				</div>
			</div>
			<div className="border-t border-[var(--bz-border)] p-3">
				<div className="flex items-start justify-between gap-2">
					<div>
						<p className="bz-eyebrow">Current Parliament</p>
						<h2 className="mt-1 text-sm font-semibold text-[var(--bz-text-1)]">18th Lok Sabha</h2>
					</div>
					<span className="rounded-md bg-[var(--bz-accent-2)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--bz-accent)]">2024-29</span>
				</div>
				<p className="mt-2 text-[11px] leading-5 text-[var(--bz-text-2)]">Union Parliament is tracked by House, session day, bill stage, and official source family.</p>
				<nav className="mt-3 grid grid-cols-3 gap-1 rounded-md bg-[var(--bz-surface-2)] p-1" aria-label="Parliament shortcuts">
					{[
						['Overview', hrefFor('overview', language)],
						['Bills', hrefFor('bills', language)],
						['Houses', hrefFor('houses', language)]
					].map(([label, href]) => (
						<a className="rounded px-2 py-1.5 text-center text-[10.5px] font-semibold text-[var(--bz-text-2)] transition hover:bg-[var(--bz-surface)] hover:text-[var(--bz-accent)] bz-focus" href={href} key={label}>
							{label}
						</a>
					))}
				</nav>
				<div className="mt-3 grid grid-cols-2 gap-2">
					<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2">
						<p className="text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--bz-text-3)]">Lok Sabha</p>
						<p className="mt-1 text-xs font-semibold text-[var(--bz-text-1)]">543 seats</p>
					</div>
					<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2">
						<p className="text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--bz-text-3)]">Rajya Sabha</p>
						<p className="mt-1 text-xs font-semibold text-[var(--bz-text-1)]">245 seats</p>
					</div>
				</div>
				<div className="mt-3 rounded-md border border-[var(--bz-border)] bg-[var(--bz-bg)] p-2">
					<div className="flex items-center justify-between text-[11px]">
						<span className="text-[var(--bz-text-2)]">Bills in this set</span>
						<span className="bz-mono font-semibold text-[var(--bz-text-1)]">{dashboard.bills.length.toLocaleString('en-IN')}</span>
					</div>
					<div className="mt-1 flex items-center justify-between text-[11px]">
						<span className="text-[var(--bz-text-2)]">Committee surfaces</span>
						<span className="bz-mono font-semibold text-[var(--bz-text-1)]">{totalCommittees.toLocaleString('en-IN')}</span>
					</div>
				</div>
			</div>
			<div className="border-t border-[var(--bz-border)] p-3">
				<p className="bz-eyebrow">Record trust</p>
				<h2 className="mt-1 text-sm font-semibold text-[var(--bz-text-1)]">How to read the data</h2>
				<div className="mt-3 space-y-2">
					{[
						['Official records', 'Bills and events now point back to public Parliament or Government source pages.'],
						['Official source path', 'Source chips show which public source family each record should trace back to.'],
						['Privacy boundary', 'No sign-in, payment, or private browsing data is collected by this local prototype.']
					].map(([title, body]) => (
						<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2" key={title}>
							<p className="text-[11px] font-semibold text-[var(--bz-text-1)]">{title}</p>
							<p className="mt-1 text-[10.5px] leading-4 text-[var(--bz-text-2)]">{body}</p>
						</div>
					))}
				</div>
			</div>
		</aside>
	);
}

function FilterBar({
	filters,
	sessionName,
	stageCounts,
	areaCounts
}: {
	filters: DashboardFilters;
	sessionName: string;
	stageCounts: StageCount[];
	areaCounts: AreaCount[];
}) {
	const visibleStageOptions = stageCounts.length
		? stageCounts
				.slice()
				.sort((left: StageCount, right: StageCount) => right.count - left.count)
				.map(({ stage, count }) => ({ stage, count }))
		: stageOptions.map((stage) => ({ stage, count: 0 }));
	const visibleAreaOptions = areaCounts
		.slice()
		.sort((left, right) => right.count - left.count)
		.map(({ area, count }) => ({ area, count, label: ministryLabel(area) }));
	const formKey = [
		filters.section,
		filters.language,
		filters.query,
		filters.house,
		filters.area,
		filters.source,
		filters.primeMinister,
		filters.date,
		filters.status,
		stageCounts.length,
		areaCounts.length
	].join(':');

	return (
		<form key={formKey} className="bz-panel grid max-w-full gap-3 overflow-hidden rounded-lg p-3 md:grid-cols-2 xl:grid-cols-6" action="/" method="GET">
			<input type="hidden" name="section" value={filters.section} />
			<input type="hidden" name="lang" value={filters.language} />
			{filters.source !== 'all' && <input type="hidden" name="source" value={filters.source} />}
			<label className="grid min-w-0 gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--bz-text-3)]">
				{t('field.search', filters.language)}
				<input
					name="q"
					defaultValue={filters.query}
					placeholder={t('label.searchPlaceholder', filters.language)}
					className="min-h-9 min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-xs normal-case tracking-normal text-[var(--bz-text-1)] outline-none placeholder:text-[var(--bz-text-3)] focus:border-[var(--bz-accent)] focus:ring-2 focus:ring-amber-500/10"
				/>
			</label>
			<label className="grid min-w-0 gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--bz-text-3)]">
				{t('field.house', filters.language)}
				<select name="house" defaultValue={filters.house} className="min-h-9 min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-xs normal-case tracking-normal text-[var(--bz-text-1)] outline-none focus:border-[var(--bz-accent)] focus:ring-2 focus:ring-amber-500/10">
					<option value="all">{t('field.allHouses', filters.language)}</option>
					<option value="lok-sabha">{houseLabelsLocalized[filters.language]['lok-sabha']}</option>
					<option value="rajya-sabha">{houseLabelsLocalized[filters.language]['rajya-sabha']}</option>
				</select>
			</label>
			<label className="grid min-w-0 gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--bz-text-3)]">
				Policy area
				<select name="area" defaultValue={filters.area} className="min-h-9 min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-xs normal-case tracking-normal text-[var(--bz-text-1)] outline-none focus:border-[var(--bz-accent)] focus:ring-2 focus:ring-amber-500/10">
					<option value="all">All areas</option>
					{visibleAreaOptions.map(({ area, label, count }) => (
						<option value={area} key={area}>
							{label} ({count.toLocaleString('en-IN')})
						</option>
					))}
				</select>
			</label>
			<label className="grid min-w-0 gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--bz-text-3)]">
				Prime Minister
				<select name="pm" defaultValue={filters.primeMinister} className="min-h-9 min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-xs normal-case tracking-normal text-[var(--bz-text-1)] outline-none focus:border-[var(--bz-accent)] focus:ring-2 focus:ring-amber-500/10">
					<option value="all">All PM terms</option>
					{PRIME_MINISTER_TERMS.map((term) => (
						<option value={term.id} key={term.id}>
							{getPrimeMinisterTermLabel(term)}
						</option>
					))}
				</select>
			</label>
			<label className="grid min-w-0 gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--bz-text-3)]">
				{t('field.sessionDay', filters.language)}
				<span className="sr-only">{sessionName}</span>
				<input
					type="date"
					name="date"
					defaultValue={filters.date}
					className="min-h-9 min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-xs normal-case tracking-normal text-[var(--bz-text-1)] outline-none focus:border-[var(--bz-accent)] focus:ring-2 focus:ring-amber-500/10"
				/>
			</label>
			<label className="grid min-w-0 gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--bz-text-3)]">
				{t('field.billStage', filters.language)}
				<select name="status" defaultValue={filters.status} className="min-h-9 min-w-0 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-xs normal-case tracking-normal text-[var(--bz-text-1)] outline-none focus:border-[var(--bz-accent)] focus:ring-2 focus:ring-amber-500/10">
					<option value="all">{t('field.allStages', filters.language)}</option>
					{visibleStageOptions.map(({ stage, count }) => (
						<option value={stage} key={stage}>
							{stageLabelsLocalized[filters.language][stage]}{count ? ` (${count.toLocaleString('en-IN')})` : ''}
						</option>
					))}
				</select>
			</label>
			<div className="flex min-w-0 flex-wrap items-center justify-between gap-2 md:col-span-2 xl:col-span-6">
				{filters.source !== 'all' ? (
					<div className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2.5 py-1 text-[11px] text-[var(--bz-text-2)]">
						<span>
							Source: <b className="text-[var(--bz-text-1)]">{sourceFilterLabels[filters.source] ?? filters.source}</b>
						</span>
						<a className="font-semibold text-[var(--bz-accent)] bz-focus" href={hrefWithoutSourceFilter(filters)}>
							Clear
						</a>
					</div>
				) : (
					<span />
				)}
				<button className="min-h-9 w-full rounded-md border border-[var(--bz-accent)] bg-[var(--bz-accent-2)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--bz-accent)] transition hover:bg-[var(--bz-accent)] hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 sm:w-auto" type="submit">
					{t('action.applyFilters', filters.language)}
				</button>
			</div>
		</form>
	);
}

function BillPagination({
	filters,
	pagination,
	recordLabel = 'bill record',
	recordLabelPlural = 'bill records',
	hrefForPage = hrefForBillPage,
	ariaLabel = 'Bill pages'
}: {
	filters: DashboardFilters;
	pagination: DashboardPagination;
	recordLabel?: string;
	recordLabelPlural?: string;
	hrefForPage?: (filters: DashboardFilters, page: number) => string;
	ariaLabel?: string;
}) {
	const recordText = pagination.totalItems === 1 ? recordLabel : recordLabelPlural;

	if (pagination.totalPages <= 1) {
		return (
			<div className="flex items-center justify-between rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] px-3 py-2 text-xs text-[var(--bz-text-2)]">
				<span>{pagination.totalItems.toLocaleString('en-IN')} {recordText}</span>
			</div>
		);
	}

	const firstItem = (pagination.page - 1) * pagination.pageSize + 1;
	const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);
	const previousPage = Math.max(1, pagination.page - 1);
	const nextPage = Math.min(pagination.totalPages, pagination.page + 1);

	return (
		<nav className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] px-3 py-2 text-xs" aria-label={ariaLabel}>
			<span className="text-[var(--bz-text-2)]">
				Showing <b className="text-[var(--bz-text-1)]">{firstItem.toLocaleString('en-IN')}-{lastItem.toLocaleString('en-IN')}</b> of <b className="text-[var(--bz-text-1)]">{pagination.totalItems.toLocaleString('en-IN')}</b>
			</span>
			<div className="flex items-center gap-2">
				<a
					className={cx(
						'rounded-md border px-2.5 py-1 text-[11px] font-semibold transition bz-focus',
						pagination.page <= 1
							? 'pointer-events-none border-[var(--bz-border)] text-[var(--bz-text-3)] opacity-50'
							: 'border-[var(--bz-border)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
					)}
					href={hrefForPage(filters, previousPage)}
					aria-disabled={pagination.page <= 1}
				>
					Previous
				</a>
				<span className="bz-mono text-[11px] text-[var(--bz-text-3)]">
					Page {pagination.page} / {pagination.totalPages}
				</span>
				<a
					className={cx(
						'rounded-md border px-2.5 py-1 text-[11px] font-semibold transition bz-focus',
						pagination.page >= pagination.totalPages
							? 'pointer-events-none border-[var(--bz-border)] text-[var(--bz-text-3)] opacity-50'
							: 'border-[var(--bz-border)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
					)}
					href={hrefForPage(filters, nextPage)}
					aria-disabled={pagination.page >= pagination.totalPages}
				>
					Next
				</a>
			</div>
		</nav>
	);
}

function ActsList({
	acts,
	linkedBillsById,
	selectedActId,
	filters,
	onNavigate
}: {
	acts: Act[];
	linkedBillsById: Map<string, Bill>;
	selectedActId?: string;
	filters: DashboardFilters;
	onNavigate: NavigateHandler;
}) {
	if (!acts.length) {
		return <EmptyState title="No Acts match these filters" message="Change the search, source, House, stage, or ministry filters to broaden the enacted-law records." />;
	}

	return (
		<section className="grid gap-3 lg:grid-cols-2">
			{acts.map((act) => {
				const linkedBill = linkedBillsById.get(act.linked_bill_id);
				const linkedBillHref = linkedBill ? hrefForBill(filters, linkedBill.id) : null;
				const actHref = hrefForAct(filters, act.id);
				const selected = act.id === selectedActId;

				return (
					<article className={cx('bz-panel rounded-lg p-4 transition', selected ? 'border-[var(--bz-accent)] bg-[var(--bz-accent-3)]' : 'hover:border-[var(--bz-accent)]')} key={act.id}>
						<div className="flex flex-wrap items-start justify-between gap-3">
							<a
								className="min-w-0 flex-1 rounded-sm bz-focus"
								href={actHref}
								aria-current={selected ? 'true' : undefined}
								onClick={(event) => {
									if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
									event.preventDefault();
									onNavigate(actHref);
								}}
							>
								<p className="bz-eyebrow">Act · {act.year}</p>
								<h2 className="mt-2 text-base font-semibold leading-6 text-[var(--bz-text-1)]">{act.title}</h2>
								<p className="mt-1 text-sm text-[var(--bz-text-2)]">{act.act_number}</p>
							</a>
							<SourceBadge url={act.india_code_url} kind="india-code" label="Act text" isDemoSeed={act.isDemoSeed} />
						</div>

						{linkedBill && (
							<div className="mt-4 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
								<p className="bz-eyebrow text-[0.55rem]">Enacted from Bill</p>
								<a
									className="mt-1 block text-sm font-semibold leading-5 text-[var(--bz-text-1)] transition hover:text-[var(--bz-accent)] bz-focus"
									href={linkedBillHref ?? undefined}
									onClick={(event) => {
										if (!linkedBillHref || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
										event.preventDefault();
										onNavigate(linkedBillHref);
									}}
								>
									{getBillTitle(linkedBill, filters.language)}
								</a>
								<div className="mt-2 flex flex-wrap items-center gap-2">
									<StatusBadge stage={linkedBill.current_stage} language={filters.language} />
									<span className={cx('rounded px-1.5 py-0.5 text-[10px] font-semibold', ministryTone(linkedBill.ministry))}>{ministryLabel(linkedBill.ministry)}</span>
									<span className="text-[11px] text-[var(--bz-text-3)]">{houseLabelsLocalized[filters.language][linkedBill.origin_house]}</span>
								</div>
							</div>
						)}
					</article>
				);
			})}
		</section>
	);
}

function BillList({ bills, selectedBillId, filters, onNavigate }: { bills: Bill[]; selectedBillId?: string; filters: DashboardFilters; onNavigate: NavigateHandler }) {
	const groups = useMemo(
		() =>
			Object.entries(
				bills.reduce<Record<string, Bill[]>>((grouped, bill) => {
					(grouped[bill.latest_action_date] ??= []).push(bill);
					return grouped;
				}, {})
			).sort(([left], [right]) => right.localeCompare(left)),
		[bills]
	);

	if (!bills.length) {
		const primeMinister = getPrimeMinisterTerm(filters.primeMinister);
		const message = primeMinister
			? `No bills are loaded yet for ${getPrimeMinisterTermLabel(primeMinister)}. The database can filter this term now, but we still need to ingest older Parliament archives for this period.`
			: 'This first real-data slice is small. Change the filters or search the current official records loaded in the app.';
		return <EmptyState title="No bills match these filters" message={message} />;
	}

	return (
		<section className="space-y-3">
			{groups.map(([date, items]) => (
				<div key={date}>
					<div className="mb-1.5 flex items-center gap-2 px-1">
						<span className="text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--bz-text-2)]">{formatDate(date)}</span>
						<span className="rounded bg-[var(--bz-accent-2)] px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--bz-accent)]">
							{items.length} action{items.length === 1 ? '' : 's'}
						</span>
					</div>
					<div className="bz-panel overflow-hidden rounded-lg">
						{items.map((bill, index) => (
							<BillCard bill={bill} selected={bill.id === selectedBillId} filters={filters} onNavigate={onNavigate} key={`${date}-${bill.id}-${index}`} />
						))}
					</div>
				</div>
			))}
		</section>
	);
}

const BillCard = memo(function BillCard({ bill, selected = false, filters, onNavigate }: { bill: Bill; selected?: boolean; filters: DashboardFilters; onNavigate: NavigateHandler }) {
	const language = filters.language;
	const typeCode = bill.bill_type === 'money' ? 'MB' : bill.bill_type === 'constitutional-amendment' ? 'CAB' : bill.origin_house === 'rajya-sabha' ? 'RS' : 'LS';
	const typeClass = {
		LS: 'border-blue-200 bg-blue-50 text-blue-800',
		RS: 'border-emerald-200 bg-emerald-50 text-emerald-800',
		MB: 'border-amber-200 bg-amber-50 text-amber-800',
		CAB: 'border-purple-200 bg-purple-50 text-purple-800'
	}[typeCode];
	const ministry = ministryLabel(bill.ministry);
	const ministryClass = ministryTone(bill.ministry);
	const href = hrefForBill(filters, bill.id);
	const title = getBillTitle(bill, language);
	const subtitle = getBillSubtitle(bill, language);

	return (
		<article className={cx('group border-b border-[var(--bz-border-2)] transition last:border-b-0 [contain-intrinsic-size:76px] [content-visibility:auto]', selected ? 'bg-[var(--bz-accent-3)]' : 'hover:bg-[var(--bz-surface-2)]')}>
			<a
				className="grid min-h-[4.75rem] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-3 py-3 text-left bz-focus md:grid-cols-[auto_minmax(0,1fr)_auto]"
				href={href}
				onClick={(event) => {
					if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
					event.preventDefault();
					onNavigate(href);
				}}
			>
				<span className={cx('rounded border px-2 py-1 text-[11px] font-bold', typeClass)}>{typeCode}</span>
				<span className="min-w-0">
					<span className="bz-mono block text-[10.5px] text-[var(--bz-text-3)]">{bill.bill_number.replace('Sandbox ', '').replace('Bill No. ', '#').replace('Money Bill No. ', 'M#')}</span>
					<span className="mt-0.5 block text-sm font-semibold leading-5 text-[var(--bz-text-1)]">{title}</span>
					{subtitle !== title && <span className="mt-0.5 block text-[11.5px] leading-4 text-[var(--bz-text-3)]">{subtitle}</span>}
				</span>
				<span className="hidden items-center gap-3 md:flex">
					<StatusBadge stage={bill.current_stage} language={language} />
					<span className={cx('max-w-36 truncate rounded px-1.5 py-0.5 text-[10px] font-semibold', ministryClass)} title={bill.ministry}>
						{ministry}
					</span>
					<span className="hidden text-[11px] text-[var(--bz-text-3)] lg:inline">{houseLabelsLocalized[language][bill.origin_house]}</span>
					<span className="hidden text-[11px] text-[var(--bz-text-3)] xl:inline">{formatDate(bill.latest_action_date)}</span>
					<span className="text-[12px] text-[var(--bz-accent)] opacity-45 transition group-hover:opacity-100">↗</span>
				</span>
			</a>
			<div className="flex flex-wrap items-center gap-1 px-3 pb-2 pl-[5.65rem] md:hidden">
				<StatusBadge stage={bill.current_stage} language={language} />
				<SourceBadge url={bill.source_url} isDemoSeed={bill.isDemoSeed} />
			</div>
		</article>
	);
});

function ministryLabel(ministry: string) {
	const normalized = ministry.replace(/^Ministry of\s+/i, '').replace(/\s+/g, ' ').trim();
	const label = normalized
		.toLowerCase()
		.replace(/\b\w/g, (letter) => letter.toUpperCase())
		.replace(/\bAnd\b/g, 'and')
		.replace(/\bIt\b/g, 'IT');

	if (label === 'Electronics and Information Technology') return 'Electronics and IT';
	if (label === 'Health and Family Welfare') return 'Health';
	if (label === 'Agriculture & Farmers Welfare') return 'Agriculture';
	if (label === 'Personnel, Public Grievances and Pensions') return 'Personnel';
	if (label === 'Consumer Affairs, Food and Public Distribution') return 'Consumer Affairs';
	if (label === 'Environment, Forest and Climate Change') return 'Environment';
	if (label === 'Road Transport and Highways') return 'Transport';
	if (label === 'Social Justice and Empowerment') return 'Social Justice';
	if (label === 'Women and Child Development') return 'Women and Child';
	return label;
}

function ministryTone(ministry: string) {
	const normalized = ministry.toLowerCase();
	if (normalized.includes('finance')) return 'bg-yellow-100 text-yellow-900';
	if (normalized.includes('electronics') || normalized.includes('communications')) return 'bg-violet-100 text-violet-900';
	if (normalized.includes('health')) return 'bg-emerald-100 text-emerald-900';
	if (normalized.includes('home affairs')) return 'bg-orange-100 text-orange-900';
	if (normalized.includes('law') || normalized.includes('justice')) return 'bg-rose-100 text-rose-900';
	if (normalized.includes('education')) return 'bg-sky-100 text-sky-900';
	return 'bg-stone-100 text-stone-800';
}

type BillAnalysis = {
	subject: string;
	plainLanguageSummary: string;
	whyItMatters: string;
	gdpImpact: string;
	stageExplanation: string;
	movementSummary: string;
	recordCoverage: string;
	dataQuality: string;
	nextWatchItems: string[];
	source?: 'local' | 'groq';
	model?: string;
	generatedAt?: string;
};

type AiBillAnalysisResponse = {
	source: 'groq';
	model: string;
	generatedAt: string;
	analysis: BillAnalysis;
};

function BillAnalysisPanel({
	bill,
	actions = [],
	language,
	analysis,
	analysisStatus = 'local'
}: {
	bill: Bill | null;
	actions?: BillAction[];
	language: Language;
	analysis?: BillAnalysis | null;
	analysisStatus?: AnalysisStatus;
}) {
	if (!bill) {
		return (
			<aside className="bz-panel rounded-lg p-4">
				<p className="bz-eyebrow text-[var(--bz-accent)]">Bill analysis</p>
				<h2 className="mt-2 text-base font-semibold text-[var(--bz-text-1)]">Select a bill</h2>
				<p className="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">Click a bill row to see a plain-language explanation, stage read, and what to watch next.</p>
			</aside>
		);
	}

	const billAnalysis = analysis ?? buildBillAnalysis(bill, actions, language);

	return (
		<aside className="bz-panel rounded-lg p-4 xl:sticky xl:top-16 xl:self-start">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<p className="bz-eyebrow text-[var(--bz-accent)]">Bill analysis</p>
					<StatusBadge stage={bill.current_stage} language={language} />
				</div>
				<AnalysisStatusBadge status={analysisStatus} />
			</div>
			<h2 className="mt-2 text-base font-semibold leading-6 text-[var(--bz-text-1)]">{billAnalysis.subject}</h2>
			<p className="mt-3 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3 text-[13px] leading-6 text-[var(--bz-text-2)]">{billAnalysis.plainLanguageSummary}</p>

			<div className="mt-4 grid gap-2">
				<AnalysisNote label="Why it matters" value={billAnalysis.whyItMatters} />
				<EconomicImpactNote value={billAnalysis.gdpImpact} />
				<AnalysisNote label="Current read" value={billAnalysis.stageExplanation} />
				<AnalysisNote label="Movement so far" value={billAnalysis.movementSummary} />
				<AnalysisNote label="Record coverage" value={billAnalysis.recordCoverage} />
				<AnalysisNote label="Data quality" value={billAnalysis.dataQuality} />
			</div>

			<div className="mt-4">
				<p className="bz-eyebrow">What to watch next</p>
				<ul className="mt-2 space-y-2">
					{billAnalysis.nextWatchItems.map((item) => (
						<li className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-[12px] leading-5 text-[var(--bz-text-2)]" key={item}>
							{item}
						</li>
					))}
				</ul>
			</div>
		</aside>
	);
}

function AnalysisStatusBadge({ status }: { status: AnalysisStatus }) {
	const label = status === 'ai' ? 'AI analysis' : status === 'loading' ? 'Analyzing...' : 'Local analysis';
	return (
		<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--bz-text-2)]">
			{label}
		</span>
	);
}

function AnalysisNote({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-bg)] p-3">
			<p className="bz-eyebrow text-[0.55rem]">{label}</p>
			<p className="mt-1 text-[12px] leading-5 text-[var(--bz-text-2)]">{value}</p>
		</div>
	);
}

function EconomicImpactNote({ value }: { value: string }) {
	return (
		<div className="rounded-md border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="bz-eyebrow text-[0.55rem] text-emerald-800 dark:text-emerald-300">GDP / economic impact</p>
				<span className="rounded border border-emerald-200 bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
					qualitative
				</span>
			</div>
			<p className="mt-1 text-[12px] leading-5 text-[var(--bz-text-2)]">{value}</p>
		</div>
	);
}

function buildBillAnalysis(bill: Bill, actions: BillAction[], language: Language): BillAnalysis {
	const title = getBillTitle(bill, language);
	const ministry = ministryLabel(bill.ministry);
	const latestAction = actions.at(-1);
	const firstAction = actions[0];
	const actionCount = actions.length;
	const inferred = inferBillBrief(bill, language);
	const hasGeneratedSummary = isGeneratedSansadSummary(bill.summary);
	const latestDescription = latestAction ? summarizeAction(latestAction, language) : null;

	return {
		subject: title,
		plainLanguageSummary: hasGeneratedSummary || !bill.summary?.trim() ? inferred.summary : bill.summary,
		whyItMatters: inferred.whyItMatters,
		gdpImpact: getGdpImpactFallback(bill),
		stageExplanation: getStageExplanation(bill, language),
		movementSummary: actionCount
			? `The captured history has ${actionCount} action${actionCount === 1 ? '' : 's'} from ${firstAction ? formatDate(firstAction.date) : formatDate(bill.introduced_on)} through ${latestAction ? formatDate(latestAction.date) : formatDate(bill.latest_action_date)}. The latest captured action is: ${latestDescription ?? 'no action description available.'}`
			: `No separate action rows have been captured yet. The bill record itself says the latest known update was ${formatDate(bill.latest_action_date)}.`,
		recordCoverage: bill.isDemoSeed
			? 'This is still marked as a sandbox record, so the explanation should be treated as prototype content.'
			: `This record is backed by a public source link and classified under ${ministry}. ${hasGeneratedSummary ? 'The official PDF/text has not been parsed into clauses yet, so this brief is based on the title, ministry, stage, and action history.' : 'The record has a usable summary, but clause-level extraction is still the next improvement.'}`,
		dataQuality: hasGeneratedSummary
			? 'Metadata-level record. Needs PDF extraction for statement of objects, clause notes, affected laws, and commencement details.'
			: 'Summary-level record. Needs source parsing for clause-by-clause detail and affected-law mapping.',
		nextWatchItems: getNextWatchItems(bill, actions, language),
		source: 'local'
	};
}

function isGeneratedSansadSummary(summary: string) {
	return / is a .* from .* with status .* in the Sansad legislation dataset\.?$/i.test(summary.trim());
}

function getBillAgeYears(bill: Bill) {
	const introducedYear = Number(bill.introduced_on.slice(0, 4));
	const currentYear = new Date().getFullYear();
	return Number.isFinite(introducedYear) ? currentYear - introducedYear : null;
}

function getGdpImpactFallback(bill: Bill) {
	const ministry = ministryLabel(bill.ministry);
	const normalizedTitle = getBillTitle(bill, 'en').toLowerCase();
	const normalizedSummary = bill.summary?.toLowerCase() ?? '';
	const combinedText = `${normalizedTitle} ${normalizedSummary} ${ministry.toLowerCase()}`;
	const ageYears = getBillAgeYears(bill);
	const isOlderThanTenYears = ageYears !== null && ageYears >= 10;
	const timing = isOlderThanTenYears ? 'Long-run read' : 'Near-term read';
	const evidenceLimit = bill.summary && !isGeneratedSansadSummary(bill.summary)
		? 'Confidence is medium because the record has a usable summary, but no linked GDP, budget, or sector-output series yet.'
		: 'Confidence is low until the bill text, budget notes, and sector data are connected.';
	const channelRules: Array<{ match: RegExp; channel: string; direction: string; followUp: string }> = [
		{
			match: /appropriation|finance bill|tax|gst|customs|excise|budget|cess|finance/,
			channel: 'fiscal policy, tax administration, public spending, borrowing needs, and disposable income',
			direction: 'impact can be direct if rates, exemptions, or authorised expenditure change',
			followUp: 'compare the bill clauses with Budget documents, tax receipts, and expenditure heads'
		},
		{
			match: /company|corporate|insolvency|competition|commerce|industry|sez|special economic zone|investment/,
			channel: 'business compliance costs, market entry, credit recovery, investment confidence, and formal-sector productivity',
			direction: 'impact is usually indirect through firm behaviour and transaction costs',
			followUp: 'check affected company, insolvency, competition, or sector-regulation provisions'
		},
		{
			match: /health|medical|education|skill|university|school|labour|employment|workers|wage/,
			channel: 'human capital, workforce participation, productivity, household costs, and public-service capacity',
			direction: 'impact is generally medium-to-long run unless the bill changes large public spending or employer costs',
			followUp: 'link provisions to enrolment, health access, labour-market, or scheme-spending indicators'
		},
		{
			match: /transport|highway|rail|shipping|port|aviation|airport|power|electricity|energy|infrastructure|telecom/,
			channel: 'infrastructure capacity, logistics costs, energy reliability, private investment, and sector productivity',
			direction: 'impact can be material where the bill changes pricing, approvals, safety, or regulator powers',
			followUp: 'connect the bill to project pipelines, tariffs, regulator orders, and sector output'
		},
		{
			match: /agriculture|farm|fisher|animal husbandry|dairy|food|rural|land|water|environment|forest|climate/,
			channel: 'rural incomes, land or resource use, food supply, environmental compliance, and climate-risk exposure',
			direction: 'impact depends on whether the bill changes producer incentives, permits, compensation, or compliance costs',
			followUp: 'check commodity prices, rural scheme spending, environmental clearance, and affected producer groups'
		},
		{
			match: /home affairs|criminal|police|security|migration|citizenship|border|justice|court|tribunal|contract/,
			channel: 'administrative certainty, dispute resolution, enforcement costs, migration rules, and investor or citizen compliance burden',
			direction: 'GDP impact is mostly indirect unless enforcement costs or business/legal certainty change at scale',
			followUp: 'map affected procedures, penalties, court capacity, and compliance obligations'
		}
	];
	const selected = channelRules.find((rule) => rule.match.test(combinedText)) ?? {
		channel: `public spending, compliance costs, investment incentives, productivity, and demand in ${ministry}`,
		direction: `impact depends on whether this ${billTypeLabelsLocalized.en[bill.bill_type].toLowerCase()} changes obligations, funding, or implementation rules`,
		followUp: 'extract the bill PDF into clauses and connect it to budget or sector indicators'
	};

	return `${timing}: the main GDP channels are ${selected.channel}. Expected direction: ${selected.direction}. Evidence: ${evidenceLimit} Next data to add: ${selected.followUp}.`;
}

function inferBillBrief(bill: Bill, language: Language) {
	const title = getBillTitle(bill, language);
	const normalized = title.toLowerCase();
	const ministry = ministryLabel(bill.ministry);
	const billType = billTypeLabelsLocalized[language][bill.bill_type].toLowerCase();

	if (normalized.includes('delimitation')) {
		return {
			summary: `This bill appears to concern delimitation: the legal process for redrawing electoral constituency boundaries and representation arrangements. BharatZero has the official Sansad record, but it has not yet extracted the bill PDF into clauses, so this is a title-and-stage brief rather than a full legal summary.`,
			whyItMatters: 'Delimitation can affect how voters are grouped into constituencies, how seats are allocated, and how future elections are administered. It is a high-impact election-law subject, so the next useful view should show the exact mechanism proposed in the bill text.'
		};
	}

	if (normalized.includes('appropriation')) {
		return {
			summary: `This is an appropriation bill, which usually authorises withdrawal of money from the Consolidated Fund for approved government expenditure. BharatZero should connect it to the relevant demand for grants and budget stage.`,
			whyItMatters: 'Appropriation bills are central to public spending control. Users need to see the amount, department, financial year, and passage status.'
		};
	}

	if (normalized.includes('finance bill')) {
		return {
			summary: `This is a finance bill, generally used to give legal effect to taxation or budget proposals. The useful explanation should identify the tax or fiscal provisions once the source text is parsed.`,
			whyItMatters: 'Finance bills can change tax liability, fiscal administration, and budget implementation, so users need affected provisions and commencement details.'
		};
	}

	if (normalized.includes('constitution') || normalized.includes('amendment')) {
		return {
			summary: `This ${billType} appears to amend an existing constitutional or statutory framework. BharatZero should next extract the affected sections/articles and proposed replacement text from the official source.`,
			whyItMatters: 'Amendment bills are hard to understand without showing the before/after legal text. The key user need is an affected-provision map.'
		};
	}

	if (normalized.includes('repealing') || normalized.includes('repeal')) {
		return {
			summary: `This bill appears to remove obsolete or superseded legal provisions. BharatZero should identify every Act or section proposed for repeal once the source text is parsed.`,
			whyItMatters: 'Repeal bills matter because they clean up the statute book and can remove dormant obligations or references.'
		};
	}

	return {
		summary: `This is a ${billType} handled by ${ministry}. BharatZero has the official Sansad record, but detailed PDF extraction is still needed before it can provide a clause-level explanation.`,
		whyItMatters: 'The bill may affect a specific policy area, department, or legal framework. Users need a source-derived summary, affected provisions, and stage history to understand the real impact.'
	};
}

function cleanActionDescription(description: string) {
	return description.replace(/\.{2,}/g, '.').replace(/\s+/g, ' ').trim();
}

function summarizeAction(action: BillAction, language: Language) {
	if (action.action_type === 'bill_introduced') {
		return `Introduced in ${houseLabelsLocalized[language][action.house]}.`;
	}

	return cleanActionDescription(action.description);
}

function cleanIntroducer(value: string) {
	return value
		.replace(/\s+/g, ' ')
		.replace(/^the\s+/i, '')
		.replace(/,\s*$/, '')
		.trim();
}

function extractIntroducedBy(bill: Bill) {
	const text = bill.summary?.replace(/\s+/g, ' ').trim();
	if (!text) return null;
	const introIndex = text.search(/\bintroduced\b/i);
	const introContext = introIndex >= 0 ? text.slice(Math.max(0, introIndex - 200), introIndex + 700) : text.slice(0, 700);
	const introducerTerminator = '(?:(?:,)?\\s+on\\s+[A-Z][a-z]+|\\s+on\\s+\\d|(?:,)?\\s+(?:in|to)\\s+(?:the\\s+)?(?:Lok Sabha|Rajya Sabha)|\\.\\s+(?:The|This|It|Key|Highlights|Disclaimer)\\b|$)';
	const patterns = [
		new RegExp(`\\bintroduced\\s+(?:in|into)\\s+(?:the\\s+)?(?:Lok Sabha|Rajya Sabha)\\s+on\\s+.+?\\s+by\\s+(.+?)${introducerTerminator}`, 'i'),
		new RegExp(`\\bintroduced\\s+(?:in|into)\\s+(?:the\\s+)?(?:Lok Sabha|Rajya Sabha)\\s+by\\s+(.+?)${introducerTerminator}`, 'i'),
		new RegExp(`\\bintroduced\\s+by\\s+(.+?)${introducerTerminator}`, 'i')
	];

	for (const pattern of patterns) {
		const match = introContext.match(pattern);
		const introducer = match?.[1] ? cleanIntroducer(match[1]) : '';
		if (introducer && !/^(the )?bill$/i.test(introducer)) return introducer;
	}

	return null;
}

function getIntroducedByDisplay(bill: Bill) {
	const sourceIntroducer = extractIntroducedBy(bill);
	if (sourceIntroducer) return sourceIntroducer;
	const ministry = ministryLabel(bill.ministry);
	return ministry.toLowerCase().startsWith('ministry of') ? ministry : `Ministry of ${ministry}`;
}

function getStageExplanation(bill: Bill, language: Language) {
	const stage = stageLabelsLocalized[language][bill.current_stage];
	const house = houseLabelsLocalized[language][bill.origin_house];
	const ministry = ministryLabel(bill.ministry);

	if (['introduced', 'introduced_lok_sabha', 'listed', 'taken_up'].includes(bill.current_stage)) {
		return `${stage} means the bill is early in the parliamentary path. The main read is that ${ministry} has a bill on record in ${house}, but passage is not yet shown in the captured data.`;
	}

	if (['referred_committee', 'committee_reported'].includes(bill.current_stage)) {
		return `${stage} means committee scrutiny is central to the bill's current story. The useful next context is the committee name, report date, and any recommendations once those are captured.`;
	}

	if (['passed_origin_house', 'passed_lok_sabha', 'sent_to_rajya_sabha', 'transmitted_to_other_house', 'rajya_sabha_recommendation_period'].includes(bill.current_stage)) {
		return `${stage} means the bill has moved beyond introduction and is now in a passage or second-House phase. The next important signal is whether the other House acts, returns recommendations, or the constitutional time window closes.`;
	}

	if (['president_assent_pending', 'assented', 'act_published'].includes(bill.current_stage)) {
		return `${stage} means the bill is at or beyond the final assent/publication stage. The most important follow-up is connecting it to the Act text and India Code record.`;
	}

	if (['withdrawn', 'lapsed'].includes(bill.current_stage)) {
		return `${stage} means the bill is no longer moving in the normal passage path. The explanation should focus on why it stopped and whether a replacement bill appears later.`;
	}

	return `${stage} is the current captured stage for this bill. BharatZero should keep adding actions and source text so this read becomes more specific.`;
}

function getNextWatchItems(bill: Bill, actions: BillAction[], language: Language) {
	const sourceItem = bill.source_url ? 'Open the source link and extract the long title, statement of objects, and clause notes into structured fields.' : 'Find the official source link for this bill.';
	const latestAction = actions.at(-1);

	if (['introduced', 'introduced_lok_sabha', 'listed', 'taken_up'].includes(bill.current_stage)) {
		return [
			'Watch for referral to a standing/select committee or listing for consideration.',
			latestAction ? `Reconcile the latest action from ${formatDate(latestAction.date)} with the next sitting-day agenda.` : 'Add the first action event from the official source.',
			sourceItem
		];
	}

	if (['referred_committee', 'committee_reported'].includes(bill.current_stage)) {
		return [
			'Add the committee page/report link when available.',
			'Track whether the House takes up the bill after the report.',
			sourceItem
		];
	}

	if (['assented', 'act_published'].includes(bill.current_stage)) {
		return [
			'Connect the bill to the Gazette notification and India Code entry.',
			'Show the Act number and commencement details when available.',
			sourceItem
		];
	}

	return [
		`Keep tracking ${houseLabelsLocalized[language][bill.origin_house]} agenda and bulletin records for the next movement.`,
		latestAction ? `Use the latest captured action from ${formatDate(latestAction.date)} as the baseline for updates.` : 'Add action history from the official bill page.',
		sourceItem
	];
}

function ActDetailPanel({ act, linkedBill, filters, onNavigate }: { act: Act | null; linkedBill: Bill | null; filters: DashboardFilters; onNavigate: NavigateHandler }) {
	if (!act) {
		return (
			<aside className="min-h-full overflow-hidden bg-[var(--bz-surface)] text-[var(--bz-text-1)]">
				<div className="p-4">
					<p className="bz-eyebrow text-[var(--bz-accent)]">Act detail</p>
					<h2 className="mt-3 text-lg font-semibold text-[var(--bz-text-1)]">Select an Act</h2>
					<p className="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">Choose an Act record to inspect its Act number, text source, and originating Bill.</p>
				</div>
			</aside>
		);
	}

	const linkedBillHref = linkedBill ? hrefForBill(filters, linkedBill.id) : null;
	const partyPositions = getActPartyPositions(act, linkedBill);

	return (
		<aside className="min-h-full overflow-hidden bg-[var(--bz-surface)] text-[var(--bz-text-1)]">
			<div className="border-b border-[var(--bz-border)] bg-[var(--bz-surface)] px-4 py-3">
				<div className="flex flex-wrap items-center gap-2">
					<span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-800">Act published</span>
					<span className="rounded border border-[var(--bz-border)] px-1.5 py-0.5 text-[10.5px] text-[var(--bz-text-2)]">{act.year}</span>
					{act.isDemoSeed && <span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10.5px] text-[var(--bz-text-2)]">Sandbox record</span>}
				</div>
				<h2 className="mt-3 text-lg font-bold leading-6 text-[var(--bz-text-1)]">{act.title}</h2>
				<p className="mt-1 text-xs text-[var(--bz-text-2)]">{act.act_number}</p>
			</div>

			<div className="p-4">
				<div className="rounded-lg border border-[var(--bz-border)] bg-[var(--bz-accent-3)] p-3">
					<p className="bz-eyebrow text-[0.55rem] text-[var(--bz-accent)]">Act record</p>
					<p className="mt-2 text-[13px] leading-6 text-[var(--bz-text-1)]">
						This record tracks the enacted law and its official text source. Use the linked Bill below to inspect the parliamentary movement that produced it.
					</p>
				</div>

				<dl className="mt-5 grid grid-cols-2 gap-2 text-xs">
					<DetailTerm label="Act number" value={act.act_number} mono />
					<DetailTerm label="Year" value={String(act.year)} />
					<DetailTerm label="Linked Bill ID" value={act.linked_bill_id} mono />
					<DetailTerm label="Record type" value="Enacted law" />
				</dl>

				{linkedBill && (
					<div className="mt-5 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
						<p className="bz-eyebrow text-[0.55rem]">Originating Bill</p>
						<a
							className="mt-2 block text-sm font-semibold leading-5 text-[var(--bz-text-1)] transition hover:text-[var(--bz-accent)] bz-focus"
							href={linkedBillHref ?? undefined}
							onClick={(event) => {
								if (!linkedBillHref || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
								event.preventDefault();
								onNavigate(linkedBillHref);
							}}
						>
							{getBillTitle(linkedBill, filters.language)}
						</a>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<StatusBadge stage={linkedBill.current_stage} language={filters.language} />
							<span className={cx('rounded px-1.5 py-0.5 text-[10px] font-semibold', ministryTone(linkedBill.ministry))}>{ministryLabel(linkedBill.ministry)}</span>
							<span className="text-[11px] text-[var(--bz-text-3)]">{houseLabelsLocalized[filters.language][linkedBill.origin_house]}</span>
						</div>
						<p className="mt-3 text-[12.5px] leading-5 text-[var(--bz-text-2)]">{linkedBill.summary}</p>
					</div>
				)}

				<div className="mt-5 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
					<div className="flex flex-wrap items-start justify-between gap-2">
						<div>
							<p className="bz-eyebrow text-[0.55rem]">Party positions</p>
							<p className="mt-2 text-[12px] leading-5 text-[var(--bz-text-2)]">{partyPositions.voteNote}</p>
						</div>
						<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--bz-text-2)]">
							{partyPositions.status === 'captured' ? 'Sourced' : 'Needs transcript'}
						</span>
					</div>
					<div className="mt-3 grid gap-2">
						{partyPositions.positions.map((position) => (
							<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] p-2.5" key={`${position.party}-${position.side}`}>
								<div className="flex flex-wrap items-center gap-2">
									<PartyPositionBadge side={position.side} />
									<p className="text-[12px] font-semibold leading-5 text-[var(--bz-text-1)]">{position.party}</p>
								</div>
								<p className="mt-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">{position.reason}</p>
								{position.sourceUrl ? (
									<a className="mt-2 inline-flex text-[11px] font-semibold text-[var(--bz-accent)] transition hover:text-[var(--bz-accent-2)] bz-focus" href={position.sourceUrl} target="_blank" rel="noreferrer">
										{position.evidence}
									</a>
								) : (
									<p className="mt-2 text-[11px] leading-5 text-[var(--bz-text-3)]">{position.evidence}</p>
								)}
							</div>
						))}
					</div>
				</div>

				<div className="mt-5 flex flex-wrap gap-2">
					<SourceBadge url={act.india_code_url} kind="india-code" label="Act text" isDemoSeed={act.isDemoSeed} />
					{linkedBill && <SourceBadge url={linkedBill.source_url} isDemoSeed={linkedBill.isDemoSeed} />}
				</div>
			</div>
		</aside>
	);
}

function PartyPositionBadge({ side }: { side: PartyPositionSide }) {
	const labels: Record<PartyPositionSide, string> = {
		supported: 'Wanted passage',
		opposed: 'Objected',
		qualified: 'Qualified support'
	};
	const tones: Record<PartyPositionSide, string> = {
		supported: 'border-emerald-200 bg-emerald-50 text-emerald-800',
		opposed: 'border-rose-200 bg-rose-50 text-rose-800',
		qualified: 'border-amber-200 bg-amber-50 text-amber-800'
	};
	return <span className={cx('rounded border px-1.5 py-0.5 text-[10px] font-semibold', tones[side])}>{labels[side]}</span>;
}

function BillDetailPanel({
	bill,
	actions = [],
	language,
	analysis,
	analysisStatus = 'local'
}: {
	bill: Bill | null;
	actions?: BillAction[];
	language: Language;
	analysis?: BillAnalysis | null;
	analysisStatus?: AnalysisStatus;
}) {
	if (!bill) {
		return (
			<aside className="min-h-full overflow-hidden bg-[var(--bz-surface)] text-[var(--bz-text-1)]">
				<div className="p-4">
					<p className="bz-eyebrow text-[var(--bz-accent)]">Bill detail</p>
					<h2 className="mt-3 text-lg font-semibold text-[var(--bz-text-1)]">{t('action.selectBill', language)}</h2>
					<p className="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">Choose a compact Bill row to inspect stages, source links, and action history.</p>
				</div>
			</aside>
		);
	}

	const billAnalysis = analysis ?? buildBillAnalysis(bill, actions, language);
	const introducedBy = getIntroducedByDisplay(bill);
	const partyPositions = getBillPartyPositions(bill);

	return (
		<aside className="min-h-full overflow-hidden bg-[var(--bz-surface)] text-[var(--bz-text-1)]">
			<div className="border-b border-[var(--bz-border)] bg-[var(--bz-surface)] px-4 py-3">
				<div className="flex flex-wrap items-center gap-2">
					<StatusBadge stage={bill.current_stage} language={language} />
					<span className="rounded border border-[var(--bz-border)] px-1.5 py-0.5 text-[10.5px] text-[var(--bz-text-2)]">{billTypeLabelsLocalized[language][bill.bill_type]}</span>
					{bill.isDemoSeed && <span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10.5px] text-[var(--bz-text-2)]">Sandbox record</span>}
				</div>
				<h2 className="mt-3 text-lg font-bold leading-6 text-[var(--bz-text-1)]">{getBillTitle(bill, language)}</h2>
				{getBillSubtitle(bill, language) !== getBillTitle(bill, language) && <p className="mt-1 text-xs italic text-[var(--bz-text-2)]">{getBillSubtitle(bill, language)}</p>}
			</div>
			<div className="p-4">
				<div className="rounded-lg border border-[var(--bz-border)] bg-[var(--bz-accent-3)] p-3">
					<div className="flex items-center justify-between gap-2">
						<p className="bz-eyebrow text-[0.55rem] text-[var(--bz-accent)]">Bill analysis</p>
						<AnalysisStatusBadge status={analysisStatus} />
					</div>
					<p className="mt-2 text-[13px] leading-6 text-[var(--bz-text-1)]">{billAnalysis.plainLanguageSummary}</p>
					<p className="mt-3 text-[12.5px] leading-5 text-[var(--bz-text-2)]">{billAnalysis.whyItMatters}</p>
				</div>
				<div className="mt-3 grid gap-2">
					<EconomicImpactNote value={billAnalysis.gdpImpact} />
					<AnalysisNote label="Current read" value={billAnalysis.stageExplanation} />
					<AnalysisNote label="Movement so far" value={billAnalysis.movementSummary} />
					<AnalysisNote label="Data quality" value={billAnalysis.dataQuality} />
				</div>
				<div className="mt-5 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
					<div className="flex flex-wrap items-start justify-between gap-2">
						<div>
							<p className="bz-eyebrow text-[0.55rem]">Party positions</p>
							<p className="mt-2 text-[12px] leading-5 text-[var(--bz-text-2)]">{partyPositions.voteNote}</p>
						</div>
						<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--bz-text-2)]">
							{partyPositions.status === 'captured' ? 'Sourced' : 'Needs transcript'}
						</span>
					</div>
					<div className="mt-3 grid gap-2">
						{partyPositions.positions.map((position) => (
							<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] p-2.5" key={`${position.party}-${position.side}`}>
								<div className="flex flex-wrap items-center gap-2">
									<PartyPositionBadge side={position.side} />
									<p className="text-[12px] font-semibold leading-5 text-[var(--bz-text-1)]">{position.party}</p>
								</div>
								<p className="mt-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">{position.reason}</p>
								{position.sourceUrl ? (
									<a className="mt-2 inline-flex text-[11px] font-semibold text-[var(--bz-accent)] transition hover:text-[var(--bz-accent-2)] bz-focus" href={position.sourceUrl} target="_blank" rel="noreferrer">
										{position.evidence}
									</a>
								) : (
									<p className="mt-2 text-[11px] leading-5 text-[var(--bz-text-3)]">{position.evidence}</p>
								)}
							</div>
						))}
					</div>
				</div>
				<dl className="mt-5 grid grid-cols-2 gap-2 text-xs">
					<DetailTerm label={t('field.originHouse', language)} value={houseLabelsLocalized[language][bill.origin_house]} />
					<DetailTerm label="Introduced by" value={introducedBy} />
					<DetailTerm label={t('field.billNumber', language)} value={bill.bill_number} mono />
					<DetailTerm label={t('field.introduced', language)} value={formatDate(bill.introduced_on)} />
					<DetailTerm label={t('field.latestAction', language)} value={formatDate(bill.latest_action_date)} />
				</dl>
				<div className="mt-5">
					<p className="bz-eyebrow">{t('field.actionHistory', language)}</p>
					<div className="relative mt-3 space-y-4 border-l border-[var(--bz-border)] pl-4">
						{actions.map((action) => (
							<div className="relative" key={action.id}>
								<span className="absolute -left-[1.28rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--bz-surface)] bg-[var(--bz-accent)]" />
								<div className="flex items-center justify-between gap-3 text-[11px] text-[var(--bz-text-3)]">
									<span className="bz-mono">{formatDate(action.date)}</span>
									<span>{houseLabelsLocalized[language][action.house]}</span>
								</div>
								<p className="mt-1 text-[12.5px] leading-5 text-[var(--bz-text-1)]">{summarizeAction(action, language)}</p>
								<div className="mt-3">
									<SourceBadge url={action.source_url} isDemoSeed={action.isDemoSeed} />
								</div>
							</div>
						))}
					</div>
				</div>
				<div className="mt-5 flex flex-wrap gap-2">
					<SourceBadge url={bill.source_url} isDemoSeed={bill.isDemoSeed} />
					<a className="rounded border border-[var(--bz-border)] px-2 py-1 text-[10.5px] font-medium text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus" href={hrefFor('bills', language, { bill: bill.id })}>
						{t('action.openBillRoute', language)}
					</a>
				</div>
			</div>
		</aside>
	);
}

function DetailTerm({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
	return (
		<div className="bz-panel-muted rounded-lg p-3">
			<dt className="bz-eyebrow text-[0.55rem]">{label}</dt>
			<dd className={cx('mt-1 font-semibold text-[var(--bz-text-1)]', mono && 'bz-mono')}>{value}</dd>
		</div>
	);
}

function TimelineRail({ events, dateRail = [], groups }: { events: TimelineEvent[]; dateRail?: TimelineDateRailItem[]; groups?: TimelineDateGroup[] }) {
	const eventGroups = groups ?? [{ date: events[0]?.date ?? '', events }].filter((group) => group.date);

	return (
		<section className="bz-panel overflow-hidden rounded-lg">
			<div className="border-b border-[var(--bz-border)] bg-[var(--bz-surface)] p-4">
				<div className="mb-5 flex items-center justify-between gap-3">
					<div>
						<p className="bz-eyebrow text-[var(--bz-accent)]">Timeline rail</p>
						<h2 className="mt-1 text-lg font-semibold text-[var(--bz-text-1)]">Legislative history stream</h2>
					</div>
					<span className="rounded-md border border-[var(--bz-border)] px-3 py-1.5 text-sm text-[var(--bz-text-2)]">{events.length} events</span>
				</div>
				<p className="mb-3 max-w-3xl text-xs leading-5 text-[var(--bz-text-2)]">
					Showing all matching events, newest first. Choose a date below to focus the rail without hiding older records.
				</p>
				{dateRail.length > 0 && (
					<nav aria-label="Timeline dates" className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
						{dateRail.map((day) => (
							<a
								href={day.href}
								className={cx(
									'min-w-[10rem] rounded-md border px-4 py-3 text-left transition bz-focus',
									day.selected
										? 'border-[var(--bz-accent)] bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
										: 'border-[var(--bz-border)] bg-[var(--bz-surface-2)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)]'
								)}
								aria-current={day.selected ? 'date' : undefined}
								key={day.date}
							>
								<span className="block text-sm font-semibold">{formatDate(day.date)}</span>
								<span className="mt-1.5 block text-xs text-[var(--bz-text-3)]">
									{day.eventCount} events · {day.sittingCount} sittings
								</span>
							</a>
						))}
					</nav>
				)}
			</div>
			{events.length > 0 ? (
				<div className="relative m-5 ml-8 space-y-8 border-l border-[var(--bz-border)] pl-7">
					{eventGroups.map((group) => (
						<div key={group.date}>
							<p className="mb-3 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--bz-text-2)]">{formatDate(group.date)}</p>
							<div className="space-y-5">
								{group.events.map((event) => (
									<TimelineDayCard event={event} key={event.id} />
								))}
							</div>
						</div>
					))}
				</div>
			) : (
				<EmptyState title="No events match these filters" message="Change the search, House, or Bill stage filter to see the official records currently loaded in the app." />
			)}
		</section>
	);
}

function TimelineDayCard({ event }: { event: TimelineEvent }) {
	return (
		<article className="relative rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] p-3 transition hover:bg-[var(--bz-surface-2)]">
			<div className="absolute -left-[1.05rem] top-5 h-3 w-3 rounded-full border-2 border-[var(--bz-surface)] bg-[var(--bz-accent)]" />
			<div className="flex flex-wrap items-center justify-between gap-3">
				<EventChip event={event} />
				<span className="bz-mono text-[10.5px] text-[var(--bz-text-3)]">{formatDate(event.date)}</span>
			</div>
			<h3 className="mt-3 text-sm font-semibold text-[var(--bz-text-1)]">{event.title}</h3>
			<p className="mt-1 text-[12.5px] leading-5 text-[var(--bz-text-2)]">{event.description}</p>
			<div className="mt-3 flex flex-wrap items-center gap-2">
				<SourceBadge url={event.source_url} isDemoSeed={event.isDemoSeed} />
				<span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10.5px] text-amber-800">official source</span>
			</div>
		</article>
	);
}

function EventChip({ event }: { event: TimelineEvent }) {
	const houseTone = event.house === 'lok-sabha' ? 'bg-orange-500' : 'bg-emerald-500';
	return (
		<span className="inline-flex items-center gap-2 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1 text-[10.5px] font-semibold text-[var(--bz-text-2)]">
			<span className={cx('h-1.5 w-1.5 rounded-full', houseTone)} />
			{houseLabelsLocalized.en[event.house]} <span className="text-[var(--bz-text-3)]">/</span> <span className="uppercase tracking-[0.08em] text-[var(--bz-text-3)]">{event.type.replaceAll('_', ' ')}</span>
		</span>
	);
}

function StatusBadge({ stage, language }: { stage: BillStage; language: Language }) {
	const tone = getStageTone(stage);
	const toneClass = {
		neutral: 'border-slate-200 bg-slate-50 text-slate-700',
		active: 'border-blue-200 bg-blue-50 text-blue-700',
		warning: 'border-amber-200 bg-amber-50 text-amber-800',
		success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
		danger: 'border-red-200 bg-red-50 text-red-700'
	}[tone];
	return <span className={cx('rounded border px-1.5 py-0.5 text-[10.5px] font-medium', toneClass)}>{stageLabelsLocalized[language][stage]}</span>;
}

function SourceBadge({
	url,
	kind,
	label,
	isDemoSeed = false
}: {
	url: string;
	kind?: SourceKind;
	label?: string;
	isDemoSeed?: boolean;
}) {
	const sourceKind = kind ?? sourceKindFromUrl(url);
	const sourceLabel = label ?? sourceKindLabels[sourceKind];

	return (
		<a className="inline-flex items-center gap-1 rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1 text-[10.5px] font-medium text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus" href={url} target="_blank" rel="noreferrer">
			<span className="h-1.5 w-1.5 rounded-full bg-[var(--bz-accent)]" />
			{sourceLabel}
			{isDemoSeed && <span className="font-semibold text-[var(--bz-accent)]">sandbox</span>}
		</a>
	);
}

function sourceKindFromUrl(url: string): SourceKind {
	const normalized = url.toLowerCase();
	if (normalized.includes('sansad.in/ls')) return 'lok-sabha';
	if (normalized.includes('sansad.in/rs')) return 'rajya-sabha';
	if (normalized.includes('sansad.in')) return 'sansad';
	if (normalized.includes('indiacode.nic.in')) return 'india-code';
	if (normalized.includes('data.gov.in')) return 'data-gov';
	if (normalized.includes('prsindia.org')) return 'prs';
	if (normalized.includes('egazette.nic.in')) return 'egazette';
	if (normalized.includes('neva.gov.in')) return 'neva';
	return 'sansad';
}

function EmptyState({ title, message }: { title: string; message: string }) {
	return (
		<div className="bz-panel rounded-lg p-6 text-center">
			<p className="text-sm font-semibold text-[var(--bz-text-1)]">{title}</p>
			<p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[var(--bz-text-2)]">{message}</p>
		</div>
	);
}

export default App;
