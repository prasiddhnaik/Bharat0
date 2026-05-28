import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBillDetail, getDashboardData, type BillDetailData, type DashboardData } from '$lib/data/view-model';
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
	type Debate,
	type DebateAiSummaryPayload,
	type House,
	type Question,
	type SectionId,
	type SourceKind,
	type TimelineEvent
} from '$lib/domain/types';
import { DEFAULT_BILLS_PAGE_SIZE, parseDashboardFilters, type DashboardFilters } from '$lib/domain/dashboard-filters';
import { getActPartyPositionSourceRefs, getActPartyPositions, getBillPartyPositions, type PartyPositionSide } from '$lib/domain/party-positions';
import { formatEconomicImpactForPanel } from '$lib/domain/economic-impact';
import { StateGovernanceMethodology, StatesSection } from '$lib/components/states/StatesSection';
import {
	getLokSabhaPowerSnapshotForPrimeMinister,
	parliamentHouseSnapshots,
	toParliamentHouseSnapshot,
	type ParliamentHouseSnapshot
} from '$lib/domain/parliament-houses';
import { getPrimeMinisterProfile } from '$lib/domain/prime-minister-profiles';
import { getPrimeMinisterTerm, getPrimeMinisterTermLabel, PRIME_MINISTER_TERMS } from '$lib/domain/prime-ministers';
import { hrefForSection } from '$lib/domain/navigation-links';
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

function hrefForBillPage(filters: DashboardFilters, page: number) {
	return hrefForPagedSection(filters, 'bills', page);
}

function hrefForActPage(filters: DashboardFilters, page: number) {
	return hrefForPagedSection(filters, 'acts', page);
}

function hrefForPagedSection(filters: DashboardFilters, section: SectionId, page: number) {
	return hrefForSection(filters, section, {
		page: String(page),
		pageSize: String(filters.pageSize || DEFAULT_BILLS_PAGE_SIZE)
	});
}

function normalizeFiltersForSection(filters: DashboardFilters): DashboardFilters {
	if (filters.section === 'bills' && filters.source === 'source-data-gov') {
		return { ...filters, source: 'all' };
	}
	return filters;
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

function hrefForDebate(filters: DashboardFilters, debateId: string) {
	const search = new URLSearchParams({
		section: 'debates',
		lang: filters.language,
		page: String(filters.page || 1),
		pageSize: String(filters.pageSize || DEFAULT_BILLS_PAGE_SIZE),
		debate: debateId
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
	const section = sourceId === 'source-india-code' ? 'acts' : sourceId === 'source-data-gov' ? 'questions' : 'bills';
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

function isDataGovQuestionCatalog(question: Question) {
	return question.id.startsWith('data-gov-') || question.source_url.includes('data.gov.in');
}

function questionCatalogNote(question: Question) {
	if (!isDataGovQuestionCatalog(question)) return null;
	return 'Official data.gov.in catalog coverage for Rajya Sabha question-answer annexures. This confirms a source feed is available; individual question records depend on OGD API or ZIP access for that session.';
}

function termDurationLabel(startDate: string, endDate?: string) {
	const start = new Date(`${startDate}T00:00:00.000Z`);
	const end = endDate ? new Date(`${endDate}T00:00:00.000Z`) : new Date();
	const months = Math.max(0, (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth());
	if (months < 1) {
		const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
		return `${days} day${days === 1 ? '' : 's'}`;
	}
	const years = Math.floor(months / 12);
	const remainingMonths = months % 12;
	if (years === 0) return `${months} mo`;
	return `${years} yr${years === 1 ? '' : 's'}${remainingMonths ? ` ${remainingMonths} mo` : ''}`;
}

function App() {
	const [locationSearch, setLocationSearch] = useState(() => window.location.search);
	const [locationPath, setLocationPath] = useState(() => window.location.pathname);
	const filters = useMemo(() => normalizeFiltersForSection(parseDashboardFilters(new URLSearchParams(locationSearch))), [locationSearch]);
	const dashboard = useMemo<AppDashboardData>(() => getDashboardData(filters), [filters]);
	const locationParams = new URLSearchParams(locationSearch);
	const showingMethodology = locationPath === '/methodology';
	const shellSection = showingMethodology ? 'states' : dashboard.filters.section;
	const selectedBillId = dashboard.filters.section === 'bills' ? (locationParams.get('bill') ?? dashboard.bills[0]?.id ?? null) : locationParams.get('bill');
	const selectedActId = dashboard.filters.section === 'acts' ? (locationParams.get('act') ?? dashboard.acts[0]?.id ?? null) : null;
	const selectedDebateId = dashboard.filters.section === 'debates' ? (locationParams.get('debate') ?? dashboard.debates[0]?.id ?? null) : null;
	const selectedBillForRender = useMemo<AppBillDetailData | null>(() => (selectedBillId ? getBillDetail(selectedBillId) : null), [selectedBillId]);
	const actBillsById = useMemo(() => new Map((dashboard.actBills ?? dashboard.allBills ?? []).map((bill) => [bill.id, bill])), [dashboard.actBills, dashboard.allBills]);
	const selectedAct = selectedActId ? dashboard.acts.find((act) => act.id === selectedActId) ?? null : null;
	const selectedActLinkedBill = selectedAct ? actBillsById.get(selectedAct.linked_bill_id) ?? null : null;
	const selectedDebate = selectedDebateId ? dashboard.debates.find((debate) => debate.id === selectedDebateId) ?? null : null;
	const [aiAnalysisByKey, setAiAnalysisByKey] = useState<Record<string, BillAnalysis>>({});
	const [aiAnalysisLoadingKey, setAiAnalysisLoadingKey] = useState<string | null>(null);
	const [aiAnalysisFailedKeys, setAiAnalysisFailedKeys] = useState<Record<string, true>>({});
	const [aiDebateSummaryByKey, setAiDebateSummaryByKey] = useState<Record<string, DebateAiSummaryPayload>>({});
	const [aiDebateSummaryLoadingKey, setAiDebateSummaryLoadingKey] = useState<string | null>(null);
	const [aiDebateSummaryFailedKeys, setAiDebateSummaryFailedKeys] = useState<Record<string, true>>({});
	const localSelectedAnalysis = useMemo(
		() => (selectedBillForRender ? buildBillAnalysis(selectedBillForRender.bill, selectedBillForRender.actions, dashboard.filters.language) : null),
		[selectedBillForRender, dashboard.filters.language]
	);
	const selectedAnalysisKey = selectedBillForRender ? `${selectedBillForRender.bill.id}:${dashboard.filters.language}` : null;
	const hasAiAnalysis = selectedAnalysisKey ? Boolean(aiAnalysisByKey[selectedAnalysisKey]) : false;
	const hasAiAnalysisFailed = selectedAnalysisKey ? Boolean(aiAnalysisFailedKeys[selectedAnalysisKey]) : false;
	const selectedBillAnalysis = selectedAnalysisKey ? (aiAnalysisByKey[selectedAnalysisKey] ?? localSelectedAnalysis) : null;
	const selectedAnalysisStatus: AnalysisStatus = selectedAnalysisKey && aiAnalysisByKey[selectedAnalysisKey]?.source !== 'local'
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
		setLocationPath(url.pathname);
		setLocationSearch(url.search);
	}, []);

	useEffect(() => {
		const handlePopState = () => {
			setLocationPath(window.location.pathname);
			setLocationSearch(window.location.search);
		};
		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	useEffect(() => {
		if (!selectedBillForRender || !selectedAnalysisKey || hasAiAnalysis || hasAiAnalysisFailed) {
			return;
		}

		const billId = selectedBillForRender.bill.id;
		const analysisKey = selectedAnalysisKey;
		let cancelled = false;

		async function loadAiAnalysis() {
			setAiAnalysisLoadingKey(analysisKey);
			try {
				const analysis = await requestAiBillAnalysis(billId, dashboard.filters.language, analysisKey);
				if (!cancelled) {
					setAiAnalysisByKey((current) => ({ ...current, [analysisKey]: analysis }));
				}
			} catch (error) {
				if (!cancelled) {
					console.warn('AI bill analysis unavailable; using local analysis.', error);
					setAiAnalysisFailedKeys((current) => ({ ...current, [analysisKey]: true }));
				}
			} finally {
				if (!cancelled) {
					setAiAnalysisLoadingKey((current) => (current === analysisKey ? null : current));
				}
			}
		}

		void loadAiAnalysis();
		return () => {
			cancelled = true;
		};
	}, [selectedBillForRender, selectedAnalysisKey, dashboard.filters.language, hasAiAnalysis, hasAiAnalysisFailed]);

	const debateLanguage = dashboard.filters.language;
	const selectedDebateSummaryKey = selectedDebate ? `${selectedDebate.id}:${debateLanguage}` : null;
	const debateAiSummaryPayload = selectedDebateSummaryKey ? aiDebateSummaryByKey[selectedDebateSummaryKey] ?? null : null;
	const debateAiSummaryStatus: DebateAiSummaryStatus = !selectedDebate || selectedDebate.transcript_status !== 'extracted'
		? 'idle'
		: debateAiSummaryPayload
			? 'ready'
			: aiDebateSummaryLoadingKey === selectedDebateSummaryKey
				? 'loading'
				: selectedDebateSummaryKey && aiDebateSummaryFailedKeys[selectedDebateSummaryKey]
					? 'failed'
					: 'idle';

	useEffect(() => {
		if (!selectedDebate || selectedDebate.transcript_status !== 'extracted' || !selectedDebateSummaryKey) return;
		if (aiDebateSummaryByKey[selectedDebateSummaryKey] || aiDebateSummaryFailedKeys[selectedDebateSummaryKey]) return;

		const debateId = selectedDebate.id;
		const summaryKey = selectedDebateSummaryKey;
		const controller = new AbortController();

		async function loadAiDebateSummary() {
			setAiDebateSummaryLoadingKey(summaryKey);
			try {
				const payload = await requestAiDebateSummary(debateId, debateLanguage, summaryKey, controller.signal);
				if (!controller.signal.aborted) {
					setAiDebateSummaryByKey((current) => ({ ...current, [summaryKey]: payload }));
				}
			} catch (error) {
				if (!controller.signal.aborted) {
					console.warn('AI debate summary unavailable.', error);
					setAiDebateSummaryFailedKeys((current) => ({ ...current, [summaryKey]: true }));
				}
			} finally {
				if (!controller.signal.aborted) {
					setAiDebateSummaryLoadingKey((current) => (current === summaryKey ? null : current));
				}
			}
		}

		void loadAiDebateSummary();
		return () => {
			controller.abort();
		};
	}, [selectedDebate, selectedDebateSummaryKey, debateLanguage, aiDebateSummaryByKey, aiDebateSummaryFailedKeys]);

	return (
		<AppShell
			section={shellSection}
			query={dashboard.filters.query}
			language={dashboard.filters.language}
			dashboard={dashboard}
			aside={
				dashboard.filters.section === 'acts' ? (
					<ActDetailPanel act={selectedAct} linkedBill={selectedActLinkedBill} filters={dashboard.filters} onNavigate={navigateInApp} />
				) : dashboard.filters.section === 'bills' ? (
					<BillDetailPanel bill={selectedBillForRender?.bill ?? null} actions={selectedBillForRender?.actions ?? []} filters={dashboard.filters} analysis={selectedBillAnalysis} analysisStatus={selectedAnalysisStatus} />
				) : dashboard.filters.section === 'debates' ? (
					<DebateDetailPanel debate={selectedDebate} filters={dashboard.filters} onNavigate={navigateInApp} aiSummary={debateAiSummaryPayload} aiSummaryStatus={debateAiSummaryStatus} />
				) : null
			}
		>
			{showingMethodology ? (
				<StateGovernanceMethodology language={dashboard.filters.language} onNavigate={navigateInApp} />
			) : (
				<MainContent dashboard={dashboard} selectedBillId={selectedBillId} selectedActId={selectedActId} selectedDebateId={selectedDebateId} selectedBill={selectedBillForRender} selectedBillAnalysis={selectedBillAnalysis} selectedAnalysisStatus={selectedAnalysisStatus} onNavigate={navigateInApp} />
			)}
		</AppShell>
	);
}

function MainContent({
	dashboard,
	selectedBillId,
	selectedActId,
	selectedDebateId,
	selectedBill,
	selectedBillAnalysis,
	selectedAnalysisStatus,
	onNavigate
}: {
	dashboard: AppDashboardData;
	selectedBillId: string | null;
	selectedActId: string | null;
	selectedDebateId: string | null;
	selectedBill: AppBillDetailData | null;
	selectedBillAnalysis: BillAnalysis | null;
	selectedAnalysisStatus: AnalysisStatus;
	onNavigate: NavigateHandler;
}) {
	const { filters } = dashboard;
	const sessionName = dashboard.sittingDays[0]?.session_name ?? 'Parliament sitting';
	const latestActivityDate = useMemo(() => {
		const dates = (dashboard.bills ?? [])
			.flatMap((bill) => [bill.latest_action_date, bill.introduced_on])
			.filter((d): d is string => Boolean(d));
		return dates.length ? dates.sort().at(-1) ?? null : null;
	}, [dashboard.bills]);
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
	const actPositionSources = getActPartyPositionSourceRefs();
	const actBillsById = useMemo(() => new Map((dashboard.actBills ?? dashboard.allBills ?? []).map((bill) => [bill.id, bill])), [dashboard.actBills, dashboard.allBills]);

	return (
		<>
			{filters.section !== 'states' && <FilterBar filters={filters} sessionName={sessionName} stageCounts={dashboard.stageCounts ?? []} areaCounts={dashboard.areaCounts ?? []} />}
			{filters.section === 'bills' && <ParliamentSessionBanner latestActivityDate={latestActivityDate} />}
			{filters.section !== 'states' && <LoadTimeNotice />}

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
								href={hrefForSection(filters, 'bills')}
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

			{filters.section === 'houses' && <HousesSection filters={filters} />}

			{filters.section === 'states' && <StatesSection language={filters.language} onNavigate={onNavigate} />}

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
					{dashboard.questions.map((question) => {
						const isDataGovCatalog = isDataGovQuestionCatalog(question);
						const catalogNote = questionCatalogNote(question);
						return (
							<article className={cx('bz-panel rounded-lg p-4', isDataGovCatalog && 'border-[var(--bz-accent)]')} key={question.id}>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="bz-eyebrow text-[0.55rem]">{isDataGovCatalog ? 'Open Government Data' : question.ministry}</p>
										<h2 className="mt-1 text-base font-semibold leading-tight text-[var(--bz-text-1)]">{question.subject}</h2>
									</div>
									{!isDataGovCatalog && <span className="rounded-md border border-[var(--bz-border)] px-2 py-1 text-[11px] font-semibold text-[var(--bz-text-2)]">{question.answer_status}</span>}
								</div>
								<div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-[var(--bz-text-2)]">
									<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1">{houseLabelsLocalized[filters.language][question.house]}</span>
									<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1">{question.number}</span>
									<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1">Updated {formatDate(question.date)}</span>
								</div>
								{catalogNote && <p className="mt-3 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-3 py-2 text-xs leading-5 text-[var(--bz-text-2)]">{catalogNote}</p>}
								{!isDataGovCatalog && <p className="mt-2 text-sm text-[var(--bz-text-2)]">{question.ministry}</p>}
								<div className="mt-4">
									<SourceBadge url={question.source_url} isDemoSeed={question.isDemoSeed} />
								</div>
							</article>
						);
					})}
				</section>
			)}

			{filters.section === 'debates' && (
				dashboard.debates.length ? (
					<section className="space-y-3">
						{dashboard.debates.map((debate) => (
							<article className={cx('bz-panel rounded-lg p-4 transition', debate.id === selectedDebateId ? 'border-[var(--bz-accent)] bg-[var(--bz-accent-3)]' : 'hover:border-[var(--bz-accent)]')} key={debate.id}>
								<a
									className="block rounded-sm bz-focus"
									href={hrefForDebate(filters, debate.id)}
									aria-current={debate.id === selectedDebateId ? 'true' : undefined}
									onClick={(event) => {
										if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
										event.preventDefault();
										onNavigate(hrefForDebate(filters, debate.id));
									}}
								>
									<div className="flex flex-wrap items-center gap-2">
										<p className="bz-eyebrow">
											{houseLabelsLocalized[filters.language][debate.house]} · {formatDate(debate.date)}
										</p>
										<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--bz-text-2)]">{debateStageLabel(debate)}</span>
									</div>
									<h2 className="mt-2 text-base font-semibold text-[var(--bz-text-1)]">{debate.title}</h2>
									<p className="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">{debate.summary}</p>
								</a>
								<div className="mt-4">
									<SourceBadge url={debate.source_url} label={debateSourceLabel(debate)} isDemoSeed={debate.isDemoSeed} />
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
								Every bill, action, question, debate, and Act should trace back to an official public source. This screen shows which source families feed current records, which are discovery-only, and which are planned next.
							</p>
							<div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--bz-text-2)]">
								<span className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1">
									<b className="text-[var(--bz-text-1)]">Using now</b> means current records are loaded from that source family.
								</span>
								<span className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1">
									<b className="text-[var(--bz-text-1)]">Discovery wired</b> means metadata checks exist but rows are not loaded yet.
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

function HousesSection({ filters }: { filters: DashboardFilters }) {
	const parliamentSummary = [
		['Lok Sabha', 'Directly elected chamber', 'Government confidence, Money Bills, and the Budget start here.'],
		['Rajya Sabha', 'Council of States', 'Reviews ordinary Bills and represents states and Union territories.'],
		['Control', 'Seat strength matters', 'The side with Lok Sabha confidence forms and sustains government.']
	];
	const selectedPrimeMinister = getPrimeMinisterTerm(filters.primeMinister) ?? PRIME_MINISTER_TERMS[0];
	const powerSnapshot = getLokSabhaPowerSnapshotForPrimeMinister(selectedPrimeMinister.id);
	const lokSabhaSnapshot = powerSnapshot ? toParliamentHouseSnapshot(powerSnapshot) : parliamentHouseSnapshots[0];
	const rajyaSabhaSnapshot =
		selectedPrimeMinister.id === 'modi-3' ? parliamentHouseSnapshots.find((house) => house.id === 'rajya-sabha') : null;
	const selectedTermRange = `${yearFromDate(selectedPrimeMinister.startDate)}-${selectedPrimeMinister.endDate ? yearFromDate(selectedPrimeMinister.endDate) : 'present'}`;
	const selectedTermEndLabel = selectedPrimeMinister.endDate ? formatDate(selectedPrimeMinister.endDate) : 'Serving';
	const selectedTermDuration = termDurationLabel(selectedPrimeMinister.startDate, selectedPrimeMinister.endDate);

	return (
		<section className="space-y-3">
			<div className="bz-panel rounded-lg p-4 sm:p-5">
				<p className="bz-eyebrow text-[var(--bz-accent)]">Selected term power</p>
				<div className="mt-2 grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
					<div className="min-w-0">
						<h2 className="text-lg font-semibold leading-tight text-[var(--bz-text-1)] sm:text-xl">{selectedPrimeMinister.name} · {selectedPrimeMinister.lokSabha ?? 'Union Parliament'}</h2>
						<p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--bz-text-2)]">
							{powerSnapshot?.powerSummary ?? 'The selected Prime Minister term does not have a mapped Lok Sabha power snapshot yet.'}
						</p>
						<div className="mt-4 grid gap-2 md:grid-cols-3">
							{(powerSnapshot
								? [
										['Largest party', `${powerSnapshot.largestParty} · ${powerSnapshot.largestPartySeats}`, `${powerSnapshot.runnerUpParty} was next with ${powerSnapshot.runnerUpSeats} seats.`],
										['Government side', powerSnapshot.governingSide, powerSnapshot.governingSeats ? `${powerSnapshot.governingSeats} seats against a ${powerSnapshot.majorityMark} majority mark.` : `Majority mark ${powerSnapshot.majorityMark}.`],
										['Term window', powerSnapshot.period, `${powerSnapshot.lokSabha} from the ${powerSnapshot.electionYear} election.`]
									]
								: parliamentSummary
							).map(([title, label, body]) => (
								<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3" key={title}>
									<p className="text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--bz-text-3)]">{title}</p>
									<p className="mt-2 text-sm font-semibold text-[var(--bz-text-1)]">{label}</p>
									<p className="mt-1 text-xs leading-5 text-[var(--bz-text-2)]">{body}</p>
								</div>
							))}
						</div>
					</div>
					<div className="grid content-stretch gap-2">
						<div className="relative overflow-hidden rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-4 text-left">
							<div className="absolute inset-x-0 top-0 flex h-1">
								<span className="flex-1 bg-[var(--bz-saffron)]" />
								<span className="flex-1 bg-white dark:bg-[var(--bz-surface)]" />
								<span className="flex-1 bg-[var(--bz-green)]" />
							</div>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="bz-eyebrow text-[0.55rem]">Term snapshot</p>
									<h3 className="mt-1 text-lg font-semibold leading-tight text-[var(--bz-text-1)]">{selectedPrimeMinister.termLabel}</h3>
									<p className="mt-1 text-xs text-[var(--bz-text-3)]">{selectedTermRange}</p>
								</div>
								<span className="shrink-0 rounded-md bg-[var(--bz-accent-2)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--bz-accent)]">{selectedPrimeMinister.party}</span>
							</div>
							<div className="mt-4 grid grid-cols-3 gap-2">
								<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] px-2 py-2">
									<p className="bz-eyebrow text-[0.48rem]">House</p>
									<p className="mt-1 truncate text-[11px] font-semibold text-[var(--bz-text-1)]">{powerSnapshot?.lokSabha ?? 'Lok Sabha'}</p>
								</div>
								<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] px-2 py-2">
									<p className="bz-eyebrow text-[0.48rem]">Tenure</p>
									<p className="mt-1 truncate text-[11px] font-semibold text-[var(--bz-text-1)]">{selectedTermDuration}</p>
								</div>
								<div className="rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] px-2 py-2">
									<p className="bz-eyebrow text-[0.48rem]">Majority</p>
									<p className="bz-mono mt-1 text-[11px] font-semibold text-[var(--bz-text-1)]">{powerSnapshot?.majorityMark ?? 272}</p>
								</div>
							</div>
							<div className="mt-4 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface)] p-3">
								<div className="flex items-center gap-2">
									<span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--bz-accent)]" />
									<span className="h-px flex-1 bg-[var(--bz-border)]" />
									<span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', selectedPrimeMinister.endDate ? 'bg-[var(--bz-text-3)]' : 'bg-emerald-500')} />
								</div>
								<div className="mt-2 grid grid-cols-2 gap-3 text-[10.5px]">
									<div>
										<p className="font-semibold text-[var(--bz-text-1)]">Started</p>
										<p className="mt-0.5 text-[var(--bz-text-3)]">{formatDate(selectedPrimeMinister.startDate)}</p>
									</div>
									<div className="text-right">
										<p className="font-semibold text-[var(--bz-text-1)]">{selectedPrimeMinister.endDate ? 'Ended' : 'Status'}</p>
										<p className="mt-0.5 text-[var(--bz-text-3)]">{selectedTermEndLabel}</p>
									</div>
								</div>
							</div>
							<p className="mt-3 text-[10.5px] leading-4 text-[var(--bz-text-3)]">{powerSnapshot?.asOf ?? 'Current snapshot'}.</p>
						</div>
					</div>
				</div>
			</div>

			<div className="grid gap-3">
				<HouseSnapshotCard house={lokSabhaSnapshot} />
				{rajyaSabhaSnapshot && <HouseSnapshotCard house={rajyaSabhaSnapshot} />}
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
		<article className="bz-panel rounded-lg p-3 sm:p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="bz-eyebrow">{house.role}</p>
					<h2 className="mt-1 text-lg font-semibold text-[var(--bz-text-1)]">{house.name}</h2>
				</div>
				<span className="rounded-md bg-[var(--bz-accent-2)] px-2 py-1 text-[11px] font-bold text-[var(--bz-accent)]">{house.seatSummary}</span>
			</div>

			<p className="mt-3 text-sm leading-6 text-[var(--bz-text-2)]">{house.holderSummary}</p>
			<p className="mt-2 text-xs leading-5 text-[var(--bz-text-3)]">{house.termSummary}</p>

			<div className="mt-4 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2 sm:p-3">
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
	const showLeftSidebar = section !== 'states' && !sidebarCollapsed;
	const showSearch = section !== 'states';
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
		<div className={cx(darkMode && 'dark', 'flex h-dvh flex-col overflow-hidden bg-[var(--bz-bg)] text-[var(--bz-text-1)]')}>
			<header className="sticky top-0 z-50 flex min-h-12 items-center gap-1 border-b border-[var(--bz-border)] bg-[var(--bz-surface)] px-2 sm:gap-2 sm:px-3">
				<a className="shrink-0 text-[13px] font-bold tracking-tight text-[var(--bz-accent)] bz-focus sm:text-sm" href={hrefForSection(dashboard.filters, 'overview')}>
					BharatZero
				</a>
				<div className="hidden h-5 w-px bg-[var(--bz-border)] sm:block" />
				<SectionTabs active={section} filters={dashboard.filters} language={language} />
				{showSearch && <div className="mx-auto hidden min-w-[14rem] max-w-[24rem] flex-1 md:block">
					<SearchCommand query={query} language={language} section={section} source={dashboard.filters.source} primeMinister={dashboard.filters.primeMinister} />
				</div>}
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
							'hidden rounded-md border px-2.5 py-1 text-[11px] font-medium transition bz-focus sm:inline-flex',
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
						className="hidden rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus sm:inline-flex"
						type="button"
						onClick={() => setDarkMode((value) => !value)}
					>
						{darkMode ? 'Light' : 'Dark'}
					</button>
					<button
						className={cx(
							'hidden rounded-md border px-2.5 py-1 text-[13px] font-medium leading-none transition bz-focus lg:inline-flex',
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
					'grid min-h-0 flex-1 grid-cols-1 overflow-hidden',
					showLeftSidebar
						? hasAside
							? 'lg:grid-cols-[260px_minmax(0,1fr)_340px]'
							: 'lg:grid-cols-[260px_minmax(0,1fr)]'
						: sidebarCollapsed
						? hasAside
							? 'lg:grid-cols-[minmax(0,1fr)_340px]'
							: 'lg:grid-cols-[minmax(0,1fr)]'
						: hasAside
							? 'lg:grid-cols-[minmax(0,1fr)_340px]'
							: 'lg:grid-cols-[minmax(0,1fr)]'
				)}
			>
				{showLeftSidebar && <LeftSidebar cabinetOpen={cabinetOpen} setCabinetOpen={setCabinetOpen} dashboard={dashboard} language={language} />}
				<main className="min-h-0 min-w-0 overflow-y-auto">
					<div className={cx('space-y-3 p-2 sm:p-3 lg:p-4', section === 'states' ? 'w-full max-w-none' : 'mx-auto max-w-[1120px]')}>
						{showSearch && <div className="md:hidden">
							<SearchCommand query={query} language={language} section={section} source={dashboard.filters.source} primeMinister={dashboard.filters.primeMinister} />
						</div>}
						{section !== 'states' && <MobilePrimeMinisterPanel dashboard={dashboard} />}
						{children}
						<PrsAttributionNotice />
					</div>
				</main>
				{hasAside && <div className="hidden min-h-0 min-w-0 overflow-y-auto border-l border-[var(--bz-border)] bg-[var(--bz-surface)] lg:block">{aside}</div>}
			</div>
		</div>
	);
}

function SectionTabs({ active, filters, language }: { active: SectionId; filters: DashboardFilters; language: Language }) {
	const fixedSections: SectionId[] = ['houses', 'states', 'timeline'];
	const primarySections: SectionId[] = ['bills'];
	const hiddenSections: SectionId[] = ['committees'];
	const secondarySections = SECTION_IDS.filter(
		(section) =>
			section !== 'overview' &&
			!fixedSections.includes(section) &&
			!primarySections.includes(section) &&
			!hiddenSections.includes(section)
	);
	const linkClass = (section: SectionId) =>
		cx(
			'relative z-20 grid h-9 min-w-[4.7rem] shrink-0 select-none place-items-center whitespace-nowrap rounded-md border border-transparent px-2 text-[11px] font-medium leading-none transition bz-focus sm:h-10 sm:min-w-[5.75rem] sm:px-3 sm:text-xs',
			active === section
				? 'bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
				: 'text-[var(--bz-text-2)] hover:bg-[var(--bz-surface-2)] hover:text-[var(--bz-text-1)]'
		);

	return (
		<nav className="relative z-20 -mx-1 flex min-w-0 flex-1 shrink items-center gap-1 overflow-x-auto overflow-y-hidden px-1 [scrollbar-width:none] md:mx-0 md:flex-none md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden" aria-label="Sections">
			<a
				className={cx(
					'group relative z-20 flex shrink-0 select-none items-center justify-center whitespace-nowrap text-[11px] font-medium leading-none transition bz-focus sm:text-xs',
					active === 'overview' ? 'text-[var(--bz-accent)]' : 'text-[var(--bz-text-2)] hover:text-[var(--bz-text-1)]'
				)}
				data-testid="section-overview-button"
				href={hrefForSection(filters, 'overview')}
				aria-current={active === 'overview' ? 'page' : undefined}
				style={{ minHeight: '3rem', alignSelf: 'stretch', pointerEvents: 'auto' }}
			>
				<span
					className={cx(
						'grid h-9 min-w-[4.7rem] place-items-center rounded-md border border-transparent px-2 transition sm:h-10 sm:min-w-[5.75rem] sm:px-3',
						active === 'overview' ? 'bg-[var(--bz-accent-2)]' : 'group-hover:bg-[var(--bz-surface-2)]'
					)}
				>
					{getSectionLabel('overview', language)}
				</span>
			</a>
			{fixedSections.map((section) => (
				<a className={linkClass(section)} data-testid={`section-${section}-button`} href={hrefForSection(filters, section)} aria-current={active === section ? 'page' : undefined} key={section}>
					{getSectionLabel(section, language)}
				</a>
			))}
			{primarySections.map((section) => (
				<a className={linkClass(section)} data-testid={`section-${section}-button`} href={hrefForSection(filters, section)} aria-current={active === section ? 'page' : undefined} key={section}>
					{getSectionLabel(section, language)}
				</a>
			))}
			{secondarySections.map((section) => (
				<a className={cx(linkClass(section), 'md:hidden')} href={hrefForSection(filters, section)} aria-current={active === section ? 'page' : undefined} key={section}>
					{getSectionLabel(section, language)}
				</a>
			))}
			<details className="relative hidden md:block">
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
						<a className={linkClass(section)} href={hrefForSection(filters, section)} aria-current={active === section ? 'page' : undefined} key={section}>
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

function ParliamentSessionBanner({ latestActivityDate }: { latestActivityDate: string | null }) {
	if (!latestActivityDate) return null;
	const today = new Date();
	const latest = new Date(`${latestActivityDate}T00:00:00`);
	const daysSince = Math.floor((today.getTime() - latest.getTime()) / 86_400_000);
	if (daysSince < 14) return null;
	return (
		<div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
			<span className="font-semibold">Parliament is currently in recess.</span> No bills have been introduced or moved since {formatDate(latestActivityDate)} ({daysSince} days ago). New activity will appear here when sittings resume.
		</div>
	);
}

function PrsAttributionNotice() {
	return (
		<footer className="rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] px-4 py-3 text-[11px] leading-5 text-[var(--bz-text-2)] sm:px-5">
			<p>
				<span className="font-semibold text-[var(--bz-text-1)]">PRS Legislative Research attribution:</span>{' '}
				PRS material used in BharatZero is available under the{' '}
				<a className="font-semibold text-[var(--bz-accent)] underline-offset-2 hover:underline bz-focus" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
					Creative Commons Attribution 4.0 International License
				</a>
				.
			</p>
			<p className="mt-1">
				PRS provides its data for informational use and does not warrant that it is accurate or complete. PRS is an independent, not-for-profit group. See the{' '}
				<a className="font-semibold text-[var(--bz-accent)] underline-offset-2 hover:underline bz-focus" href="https://prsindia.org/aboutus/disclaimer" target="_blank" rel="noreferrer">
					PRS disclaimer
				</a>
				.
			</p>
		</footer>
	);
}

function SearchCommand({
	query,
	language,
	section,
	source = 'all',
	primeMinister = 'all'
}: {
	query: string;
	language: Language;
	section: SectionId;
	source?: string;
	primeMinister?: string;
}) {
	return (
		<form action="/" method="GET" className="relative">
			<input type="hidden" name="section" value={section} />
			<input type="hidden" name="lang" value={language} />
			{source !== 'all' && <input type="hidden" name="source" value={source} />}
			{primeMinister !== 'all' && <input type="hidden" name="pm" value={primeMinister} />}
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

function MobilePrimeMinisterPanel({ dashboard }: { dashboard: AppDashboardData }) {
	const selectedPrimeMinister = getPrimeMinisterTerm(dashboard.filters.primeMinister) ?? PRIME_MINISTER_TERMS[0];
	const selectedPrimeMinisterIndex = PRIME_MINISTER_TERMS.findIndex((term) => term.id === selectedPrimeMinister.id);
	const newerPrimeMinisterTerm = selectedPrimeMinisterIndex > 0 ? PRIME_MINISTER_TERMS[selectedPrimeMinisterIndex - 1] : null;
	const olderPrimeMinisterTerm = selectedPrimeMinisterIndex >= 0 && selectedPrimeMinisterIndex < PRIME_MINISTER_TERMS.length - 1 ? PRIME_MINISTER_TERMS[selectedPrimeMinisterIndex + 1] : null;
	const primeMinisterCountById = new Map((dashboard.primeMinisterCounts ?? []).map((item) => [item.id, item.count]));
	const selectedTermBillCount = primeMinisterCountById.get(selectedPrimeMinister.id) ?? dashboard.bills.length;
	const selectedTermRange = `${yearFromDate(selectedPrimeMinister.startDate)}-${selectedPrimeMinister.endDate ? yearFromDate(selectedPrimeMinister.endDate) : 'present'}`;

	return (
		<section className="bz-panel rounded-lg p-3 lg:hidden" aria-label="Prime Minister term context">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="bz-eyebrow text-[0.55rem]">{selectedPrimeMinister.lokSabha ?? 'Union Parliament'}</p>
					<h1 className="mt-1 truncate text-sm font-bold leading-tight text-[var(--bz-text-1)]">{selectedPrimeMinister.name}</h1>
					<p className="mt-1 truncate text-[11px] text-[var(--bz-text-3)]">
						{selectedPrimeMinister.party} · {selectedPrimeMinister.termLabel} · {selectedTermRange}
					</p>
				</div>
				<div className="shrink-0 rounded-md bg-[var(--bz-accent-2)] px-2 py-1 text-right">
					<p className="bz-eyebrow text-[0.5rem]">Bills</p>
					<p className="bz-mono text-sm font-bold text-[var(--bz-accent)]">{selectedTermBillCount.toLocaleString('en-IN')}</p>
				</div>
			</div>
			<div className="mt-3 grid grid-cols-2 gap-2">
				<a
					className={cx(
						'rounded-md border px-2 py-2 text-center text-[11px] font-semibold transition bz-focus',
						newerPrimeMinisterTerm
							? 'border-[var(--bz-border)] bg-[var(--bz-surface-2)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
							: 'pointer-events-none border-[var(--bz-border)] text-[var(--bz-text-3)] opacity-50'
					)}
					href={newerPrimeMinisterTerm ? hrefForPrimeMinisterFilter(dashboard.filters, newerPrimeMinisterTerm.id) : '#'}
					aria-disabled={!newerPrimeMinisterTerm}
				>
					Newer term
				</a>
				<a
					className={cx(
						'rounded-md border px-2 py-2 text-center text-[11px] font-semibold transition bz-focus',
						olderPrimeMinisterTerm
							? 'border-[var(--bz-border)] bg-[var(--bz-surface-2)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
							: 'pointer-events-none border-[var(--bz-border)] text-[var(--bz-text-3)] opacity-50'
					)}
					href={olderPrimeMinisterTerm ? hrefForPrimeMinisterFilter(dashboard.filters, olderPrimeMinisterTerm.id) : '#'}
					aria-disabled={!olderPrimeMinisterTerm}
				>
					Older term
				</a>
			</div>
			<div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Prime minister terms">
				<a
					className={cx(
						'grid min-w-[6.5rem] content-center rounded-md border px-2 py-2 text-[10.5px] font-semibold transition bz-focus',
						dashboard.filters.primeMinister === 'all'
							? 'border-[var(--bz-accent)] bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
							: 'border-[var(--bz-border)] bg-[var(--bz-surface-2)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
					)}
					href={hrefForPrimeMinisterFilter(dashboard.filters, 'all')}
					aria-current={dashboard.filters.primeMinister === 'all' ? 'page' : undefined}
				>
					All terms
				</a>
				{PRIME_MINISTER_TERMS.map((term) => {
					const count = primeMinisterCountById.get(term.id) ?? 0;
					const isSelected = selectedPrimeMinister.id === term.id;
					return (
						<a
							className={cx(
								'grid min-w-[8.5rem] grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-md border px-2 py-2 text-[10.5px] transition bz-focus',
								isSelected
									? 'border-[var(--bz-accent)] bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
									: 'border-[var(--bz-border)] bg-[var(--bz-surface-2)] text-[var(--bz-text-2)] hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)]'
							)}
							href={hrefForPrimeMinisterFilter(dashboard.filters, term.id)}
							key={term.id}
							aria-current={isSelected ? 'page' : undefined}
						>
							<span className="min-w-0">
								<span className="block truncate font-semibold">{term.name}</span>
								<span className="mt-0.5 block truncate text-[9.5px] text-[var(--bz-text-3)]">{yearFromDate(term.startDate)} · {term.lokSabha ?? 'Union Parliament'}</span>
							</span>
							<span className="bz-mono pt-0.5 font-semibold">{count.toLocaleString('en-IN')}</span>
						</a>
					);
				})}
			</div>
		</section>
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
	const selectedPrimeMinister = getPrimeMinisterTerm(dashboard.filters.primeMinister) ?? PRIME_MINISTER_TERMS[0];
	const selectedTermRange = `${yearFromDate(selectedPrimeMinister.startDate)}-${selectedPrimeMinister.endDate ? yearFromDate(selectedPrimeMinister.endDate) : 'present'}`;
	const primeMinisterCountById = new Map((dashboard.primeMinisterCounts ?? []).map((item) => [item.id, item.count]));
	const selectedTermBillCount = primeMinisterCountById.get(selectedPrimeMinister.id) ?? dashboard.pagination?.totalItems ?? dashboard.bills.length;
	const selectedTermStatusLabel = selectedPrimeMinister.endDate ? 'End' : 'Status';
	const selectedTermStatusValue = selectedPrimeMinister.endDate ? yearFromDate(selectedPrimeMinister.endDate) : 'Serving';
	const selectedPrimeMinisterIndex = PRIME_MINISTER_TERMS.findIndex((term) => term.id === selectedPrimeMinister.id);
	const newerPrimeMinisterTerm = selectedPrimeMinisterIndex > 0 ? PRIME_MINISTER_TERMS[selectedPrimeMinisterIndex - 1] : null;
	const olderPrimeMinisterTerm = selectedPrimeMinisterIndex >= 0 && selectedPrimeMinisterIndex < PRIME_MINISTER_TERMS.length - 1 ? PRIME_MINISTER_TERMS[selectedPrimeMinisterIndex + 1] : null;
	const selectedPrimeMinisterProfile = getPrimeMinisterProfile(selectedPrimeMinister.id);

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
					<div className="mt-2 max-h-52 space-y-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable] [scrollbar-width:thin]" aria-label="Prime minister terms">
						{PRIME_MINISTER_TERMS.map((term) => {
							const count = primeMinisterCountById.get(term.id) ?? 0;
							return (
								<a
									className={cx(
										'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded px-2 py-1.5 text-[10.5px] transition bz-focus',
										selectedPrimeMinister.id === term.id
											? 'bg-[var(--bz-accent-2)] text-[var(--bz-accent)]'
											: 'bg-[var(--bz-surface)] text-[var(--bz-text-2)] hover:text-[var(--bz-accent)]'
									)}
									href={hrefForPrimeMinisterFilter(dashboard.filters, term.id)}
									key={term.id}
									aria-current={selectedPrimeMinister.id === term.id ? 'page' : undefined}
								>
									<span className="min-w-0 truncate">
										<span className="block truncate">{term.name} · {yearFromDate(term.startDate)}</span>
										<span className="mt-0.5 block truncate text-[9.5px] text-[var(--bz-text-3)]">{term.lokSabha ?? 'Union Parliament'}</span>
									</span>
									<span className="bz-mono pt-0.5 font-semibold">{count.toLocaleString('en-IN')}</span>
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
					{cabinetOpen ? 'Hide Profile' : 'View Profile'}
				</button>
				{cabinetOpen && (
					<div className="mt-2 space-y-1 rounded-md border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-2">
						{selectedPrimeMinisterProfile ? (
							<>
								<p className="text-[11px] leading-5 text-[var(--bz-text-2)]">{selectedPrimeMinisterProfile.summary}</p>
								<div className="mt-2 space-y-1.5">
									{selectedPrimeMinisterProfile.highlights.map((highlight) => (
										<p className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface)] px-2 py-1.5 text-[10.5px] leading-4 text-[var(--bz-text-2)]" key={highlight}>
											{highlight}
										</p>
									))}
								</div>
								<div className="mt-2">
									<SourceBadge url={selectedPrimeMinisterProfile.sourceUrl} label={selectedPrimeMinisterProfile.sourceLabel} />
								</div>
							</>
						) : (
							<p className="text-[10.5px] leading-4 text-[var(--bz-text-2)]">Profile data is not loaded for this term yet.</p>
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
							<p className="bz-eyebrow">Selected House</p>
							<h2 className="mt-1 text-sm font-semibold text-[var(--bz-text-1)]">{selectedPrimeMinister.lokSabha ?? 'Union Parliament'}</h2>
						</div>
					<span className="rounded-md bg-[var(--bz-accent-2)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--bz-accent)]">{selectedTermRange}</span>
				</div>
				<p className="mt-2 text-[11px] leading-5 text-[var(--bz-text-2)]">House context follows the Prime Minister term selected above, while source families and bill-stage records stay filterable across sections.</p>
				<nav className="mt-3 grid grid-cols-3 gap-1 rounded-md bg-[var(--bz-surface-2)] p-1" aria-label="Parliament shortcuts">
					{[
						['Overview', hrefForSection(dashboard.filters, 'overview')],
						['Bills', hrefForSection(dashboard.filters, 'bills')],
						['Houses', hrefForSection(dashboard.filters, 'houses')]
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
	const isHousesSection = filters.section === 'houses';
	const filterGridClass = isHousesSection
		? 'bz-panel grid max-w-full gap-3 overflow-visible rounded-lg p-3 md:grid-cols-2 xl:grid-cols-4'
		: 'bz-panel grid max-w-full gap-3 overflow-visible rounded-lg p-3 md:grid-cols-2 xl:grid-cols-6';
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
		<form key={formKey} className={filterGridClass} action="/" method="GET">
			<input type="hidden" name="section" value={filters.section} />
			<input type="hidden" name="lang" value={filters.language} />
			{filters.source !== 'all' && <input type="hidden" name="source" value={filters.source} />}
			{isHousesSection && filters.area !== 'all' && <input type="hidden" name="area" value={filters.area} />}
			{isHousesSection && filters.status !== 'all' && <input type="hidden" name="status" value={filters.status} />}
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
			{!isHousesSection && (
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
			)}
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
			{!isHousesSection && (
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
			)}
			<div className={cx('flex min-w-0 flex-wrap items-center justify-between gap-2 md:col-span-2', isHousesSection ? 'xl:col-span-4' : 'xl:col-span-6')}>
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
	source?: 'local' | 'gemma';
	model?: string;
	generatedAt?: string;
};

type AiBillAnalysisResponse = {
	source: 'gemma';
	provider: 'gemma';
	model: string;
	generatedAt: string;
	analysis: BillAnalysis;
};

const aiAnalysisClientRequests = new Map<string, Promise<BillAnalysis>>();

function requestAiBillAnalysis(billId: string, language: Language, analysisKey: string) {
	const existing = aiAnalysisClientRequests.get(analysisKey);
	if (existing) return existing;

	const request = fetch(`/api/bills/${encodeURIComponent(billId)}/ai-analysis?lang=${language}`)
		.then(async (response) => {
			if (!response.ok) {
				throw new Error(`AI analysis request failed with HTTP ${response.status}.`);
			}
			const payload = (await response.json()) as AiBillAnalysisResponse;
			return payload.analysis;
		})
		.catch((error) => {
			aiAnalysisClientRequests.delete(analysisKey);
			throw error;
		});

	aiAnalysisClientRequests.set(analysisKey, request);
	return request;
}

type DebateAiSummaryStatus = 'idle' | 'loading' | 'ready' | 'failed';

const aiDebateSummaryClientRequests = new Map<string, Promise<DebateAiSummaryPayload>>();

function requestAiDebateSummary(debateId: string, language: Language, summaryKey: string, signal?: AbortSignal) {
	const existing = aiDebateSummaryClientRequests.get(summaryKey);
	if (existing) return existing;

	const request = fetch(`/api/debates/${encodeURIComponent(debateId)}/ai-summary?lang=${language}`, { signal })
		.then(async (response) => {
			if (!response.ok) {
				throw new Error(`AI debate summary request failed with HTTP ${response.status}.`);
			}
			return (await response.json()) as DebateAiSummaryPayload;
		})
		.catch((error) => {
			aiDebateSummaryClientRequests.delete(summaryKey);
			throw error;
		});

	aiDebateSummaryClientRequests.set(summaryKey, request);
	return request;
}

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

			{analysisStatus === 'ai' && (
				<div className="mt-4 flex items-center justify-end gap-1.5 border-t border-[var(--bz-border)] pt-3">
					<svg className="h-3 w-3 text-[var(--bz-text-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
						<path d="M12 8v4l3 3" />
					</svg>
					<span className="text-[10.5px] text-[var(--bz-text-3)]">Made possible with Gemma 4</span>
				</div>
			)}
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

function getGdpImpactFallback(bill: Bill) {
	return formatEconomicImpactForPanel(bill);
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

const debateBillLinks: Record<string, string> = {
	'debate-income-tax-bill-introduced': 'income-tax-bill-2025',
	'debate-dpdp-bill-introduced': 'digital-personal-data-protection-bill-2023',
	'debate-tribhuvan-bill-passed': 'tribhuvan-sahkari-university-bill-2025',
	'debate-aircraft-objects-bill-introduced': 'protection-of-interests-in-aircraft-objects-bill-2025'
};

type DebateDetailProfile = {
	linkedBillTitle: string;
	sourceRecord: string;
	proceduralRead: string;
	whyItMatters: string[];
	sourceChecks: string[];
	nextChecks: string[];
};

const debateDetailProfiles: Record<string, DebateDetailProfile> = {
	'debate-income-tax-bill-introduced': {
		linkedBillTitle: 'The Income-Tax Bill, 2025',
		sourceRecord: 'Parliament Digital Library proceeding for Government Bills on 13 Feb 2025.',
		proceduralRead: 'This proceeding marks the Bill entering Lok Sabha business. Introduction is the first formal chamber step; it does not mean the Bill was considered clause by clause or passed on that date.',
		whyItMatters: [
			'Creates the first official parliamentary timestamp for the Bill.',
			'Lets the Bill panel connect introduction, committee, and later movement in one trail.',
			'Helps separate formal introduction from later select committee scrutiny and passage work.'
		],
		sourceChecks: [
			'Exact motion or item text used for introduction.',
			'Minister or member associated with moving the Bill.',
			'Whether the source page links to a transcript PDF or only the indexed proceeding entry.'
		],
		nextChecks: [
			'Open the linked Bill to compare introduction against committee and later stage records.',
			'Add transcript extraction when the source PDF is available.',
			'Cross-check PRS and Sansad records before using this as a complete debate summary.'
		]
	},
	'debate-dpdp-bill-introduced': {
		linkedBillTitle: 'The Digital Personal Data Protection Bill, 2023',
		sourceRecord: 'Parliament Digital Library proceeding for introduction on 3 Aug 2023.',
		proceduralRead: 'This proceeding records the Bill being introduced in Lok Sabha. It is a stage marker for the start of parliamentary handling, not a full policy debate summary by itself.',
		whyItMatters: [
			'Anchors the Bill to a specific Lok Sabha sitting date.',
			'Gives the debates tab a source-backed entry point for later privacy and data-governance discussion.',
			'Keeps the introduction source separate from later passage and Act publication sources.'
		],
		sourceChecks: [
			'Whether the indexed proceeding has a transcript PDF with speaker-level text.',
			'The exact introduction wording and Bill title as printed in the proceeding.',
			'Any immediate objections, leave motions, or procedural notes on the same page.'
		],
		nextChecks: [
			'Open the linked Bill to inspect party position reasoning and source links.',
			'Connect later debate, passage, and assent records when source pages are available.',
			'Add clause-level privacy issues only after text extraction from the Bill or Act source.'
		]
	},
	'debate-tribhuvan-bill-passed': {
		linkedBillTitle: 'Tribhuvan Sahkari University Bill, 2025',
		sourceRecord: 'Parliament Digital Library Lok Sabha proceeding for 26 Mar 2025.',
		proceduralRead: 'This proceeding is a chamber-level passage signal for the Bill in Lok Sabha. It should be read as evidence of Lok Sabha passage, not by itself as final enactment or President assent.',
		whyItMatters: [
			'It is the strongest debate-tab signal that the Bill moved beyond introduction in the originating House.',
			'It gives the Acts and Bills panels a dated parliamentary proceeding to connect with the later law record.',
			'It helps users separate the passage proceeding from policy support, opposition reasoning, and final Act publication.'
		],
		sourceChecks: [
			'Exact motion text and whether the sitting record says the Bill was passed, passed with amendments, or passed after discussion.',
			'Speaker names, minister response, opposition interventions, and any recorded division if the transcript includes them.',
			'Whether the source page exposes a downloadable transcript/PDF beyond the indexed PDL entry.'
		],
		nextChecks: [
			'Open the linked Bill for party support/opposition reasoning and bill-stage context.',
			'Compare with the Acts tab to confirm the enacted-law record and official text source.',
			'Add transcript parsing so the panel can show speaker-level debate and amendment details.'
		]
	},
	'debate-aircraft-objects-bill-introduced': {
		linkedBillTitle: 'Protection of Interests in Aircraft Objects Bill, 2025',
		sourceRecord: 'PRS bill tracker record for Rajya Sabha introduction on 10 Feb 2025.',
		proceduralRead: 'This record is a tracker-backed introduction signal for Rajya Sabha. Because it is not a full transcript source, treat it as a stage reference until the chamber proceeding is linked.',
		whyItMatters: [
			'Shows the Bill entered Rajya Sabha business on a specific date.',
			'Connects debate discovery to an aviation-finance Bill that may need official proceeding enrichment.',
			'Flags a useful gap: the tracker source should be paired with a chamber record when available.'
		],
		sourceChecks: [
			'PRS stage/date entry and linked Bill text or tracker notes.',
			'Official Rajya Sabha proceeding page for the same introduction date.',
			'Whether later stages changed the Bill after introduction.'
		],
		nextChecks: [
			'Open the linked Bill to inspect policy area, status, and source trail.',
			'Add Rajya Sabha transcript/source URL once available.',
			'Use the current entry as metadata-level evidence until official proceeding text is attached.'
		]
	}
};

function debateStageLabel(debate: Pick<Debate, 'title'>) {
	const normalizedTitle = debate.title.toLowerCase();
	if (normalizedTitle.includes('passed')) return 'Passed debate';
	if (normalizedTitle.includes('introduced')) return 'Introduction';
	return 'Proceeding';
}

function debateSourceLabel(debate: Pick<Debate, 'source_url'>) {
	const normalizedUrl = debate.source_url.toLowerCase();
	if (normalizedUrl.includes('eparlib.sansad.in')) return 'Parliament Digital Library';
	return sourceKindLabels[sourceKindFromUrl(debate.source_url)];
}

function getDebateDetailProfile(debate: Debate): DebateDetailProfile {
	return debateDetailProfiles[debate.id] ?? {
		linkedBillTitle: 'Mapped Bill not identified',
		sourceRecord: `${debateSourceLabel(debate)} record for ${formatDate(debate.date)}.`,
		proceduralRead: 'This is a source-backed proceeding entry. The panel can identify the House, date, stage read, and source family, but transcript-level detail still needs extraction from the source page.',
		whyItMatters: [
			'Adds a dated proceeding record to the legislative trail.',
			'Helps users move from a debate hit into the related Bill or source page.',
			'Keeps source-backed metadata separate from unsourced political interpretation.'
		],
		sourceChecks: [
			'Exact proceeding text, transcript PDF, and speaker names if the source exposes them.',
			'Whether the proceeding records introduction, consideration, passage, amendment, or another motion.',
			'Whether a second official source confirms the same stage and date.'
		],
		nextChecks: [
			'Map the proceeding to a Bill record.',
			'Extract transcript text for speaker-level detail.',
			'Cross-check later Bill, Act, or Gazette records before treating the proceeding as final status.'
		]
	};
}

function getDebateTranscriptLabel(debate: Debate) {
	if (!debate.transcript_url) return 'Not linked';
	const pageLabel = debate.transcript_pages ? `${debate.transcript_pages} page${debate.transcript_pages === 1 ? '' : 's'}` : 'PDF';
	return debate.transcript_byte_length ? `${pageLabel} · ${formatByteSize(debate.transcript_byte_length)}` : pageLabel;
}

function formatByteSize(bytes: number) {
	if (bytes >= 1_000_000) {
		return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(bytes / 1_000_000)} MB`;
	}
	if (bytes >= 1_000) {
		return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(bytes / 1_000)} kB`;
	}
	return `${bytes.toLocaleString('en-IN')} B`;
}

function uniqueDebateMembers(debate: Debate) {
	return Array.from(new Set(debate.members));
}

function DebateAiSummaryBlock({
	debate,
	payload,
	status
}: {
	debate: Debate;
	payload: DebateAiSummaryPayload | null;
	status: DebateAiSummaryStatus;
}) {
	const transcriptStatus = debate.transcript_status;
	const cardClass = 'mt-4 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] p-3';

	if (transcriptStatus === 'metadata_only' || !transcriptStatus) {
		return (
			<div className={cardClass}>
				<header className="flex items-center justify-between gap-2">
					<p className="bz-eyebrow text-[0.55rem] text-[var(--bz-accent)]">AI summary</p>
					<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--bz-text-3)]">Transcript pending</span>
				</header>
				<p className="mt-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">
					Transcript text has not been extracted for this proceeding yet, so the AI summary is unavailable. Open the official transcript to read the full record.
				</p>
			</div>
		);
	}

	if (transcriptStatus === 'failed' || transcriptStatus === 'stale') {
		return (
			<div className={cardClass}>
				<header className="flex items-center justify-between gap-2">
					<p className="bz-eyebrow text-[0.55rem] text-[var(--bz-accent)]">AI summary</p>
					<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--bz-text-3)]">{transcriptStatus === 'stale' ? 'Transcript stale' : 'Extraction failed'}</span>
				</header>
				<p className="mt-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">
					{transcriptStatus === 'stale'
						? 'Stored transcript text is older than the current source; the AI summary has been suppressed until the transcript is re-extracted.'
						: 'Transcript extraction failed for this proceeding; the AI summary cannot be produced from text. The curated summary above is the best available record.'}
				</p>
			</div>
		);
	}

	if (status === 'loading' || status === 'idle') {
		return (
			<div className={cardClass}>
				<header className="flex items-center justify-between gap-2">
					<p className="bz-eyebrow text-[0.55rem] text-[var(--bz-accent)]">AI summary</p>
					<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--bz-text-3)]">Generating</span>
				</header>
				<div className="mt-3 space-y-2">
					<div className="h-3 w-3/4 rounded bg-[var(--bz-surface-2)]" />
					<div className="h-3 w-full rounded bg-[var(--bz-surface-2)]" />
					<div className="h-3 w-5/6 rounded bg-[var(--bz-surface-2)]" />
				</div>
			</div>
		);
	}

	if (status === 'failed' || !payload) {
		return (
			<div className={cardClass}>
				<header className="flex items-center justify-between gap-2">
					<p className="bz-eyebrow text-[0.55rem] text-[var(--bz-accent)]">AI summary</p>
					<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--bz-text-3)]">Unavailable</span>
				</header>
				<p className="mt-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">
					AI summary could not be generated for this proceeding. Use the curated summary and the official transcript link above.
				</p>
			</div>
		);
	}

	const { summary, coverage } = payload;
	const isPartial = coverage.strategy === 'head-tail-truncated';
	return (
		<div className={cardClass}>
			<header className="flex items-center justify-between gap-2">
				<p className="bz-eyebrow text-[0.55rem] text-[var(--bz-accent)]">AI summary</p>
				<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--bz-text-3)]">
					{isPartial ? 'Partial coverage' : 'Full transcript'}
				</span>
			</header>
			<p className="mt-3 text-[13px] leading-6 text-[var(--bz-text-1)]">{summary.gist}</p>
			{isPartial && (
				<p className="mt-2 rounded border border-dashed border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-2 py-1 text-[11px] leading-4 text-[var(--bz-text-3)]">
					Transcript was head-tail truncated; {coverage.omittedChars.toLocaleString('en-IN')} characters from the middle were not analyzed.
				</p>
			)}
			{summary.keyPoints.length > 0 && (
				<div className="mt-3">
					<p className="bz-eyebrow text-[0.55rem]">Key points</p>
					<ul className="mt-2 space-y-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">
						{summary.keyPoints.map((point) => (
							<li className="flex gap-2" key={point}>
								<span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--bz-accent)]" />
								<span>{point}</span>
							</li>
						))}
					</ul>
				</div>
			)}
			{summary.keySpeakers.length > 0 && (
				<div className="mt-3">
					<p className="bz-eyebrow text-[0.55rem]">Key speakers</p>
					<ul className="mt-2 space-y-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">
						{summary.keySpeakers.map((speaker) => (
							<li key={`${speaker.name}-${speaker.contribution.slice(0, 24)}`}>
								<span className="font-semibold text-[var(--bz-text-1)]">{speaker.name}</span>
								{speaker.role && <span className="text-[var(--bz-text-3)]"> · {speaker.role}</span>}
								<span className="block text-[var(--bz-text-2)]">{speaker.contribution}</span>
							</li>
						))}
					</ul>
				</div>
			)}
			{summary.decisions && (
				<div className="mt-3">
					<p className="bz-eyebrow text-[0.55rem]">Decisions</p>
					<p className="mt-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">{summary.decisions}</p>
				</div>
			)}
			{summary.notableQuotes.length > 0 && (
				<div className="mt-3">
					<p className="bz-eyebrow text-[0.55rem]">Notable quotes</p>
					<ul className="mt-2 space-y-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">
						{summary.notableQuotes.map((quote) => (
							<li key={`${quote.speaker}-${quote.quote.slice(0, 24)}`}>
								<span className="block italic">“{quote.quote}”</span>
								<span className="block text-[11px] text-[var(--bz-text-3)]">— {quote.speaker}</span>
							</li>
						))}
					</ul>
				</div>
			)}
			{summary.relatedBillContext && (
				<div className="mt-3">
					<p className="bz-eyebrow text-[0.55rem]">Related Bill context</p>
					<p className="mt-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">{summary.relatedBillContext}</p>
				</div>
			)}
			<p className="mt-3 border-t border-[var(--bz-border)] pt-2 text-[11px] leading-4 text-[var(--bz-text-3)]">
				{summary.dataQuality}
			</p>
		</div>
	);
}

function DebateDetailPanel({
	debate,
	filters,
	onNavigate,
	aiSummary,
	aiSummaryStatus
}: {
	debate: Debate | null;
	filters: DashboardFilters;
	onNavigate: NavigateHandler;
	aiSummary: DebateAiSummaryPayload | null;
	aiSummaryStatus: DebateAiSummaryStatus;
}) {
	if (!debate) {
		return (
			<aside className="min-h-full overflow-hidden bg-[var(--bz-surface)] text-[var(--bz-text-1)]">
				<div className="p-4">
					<p className="bz-eyebrow text-[var(--bz-accent)]">Debate detail</p>
					<h2 className="mt-3 text-lg font-semibold text-[var(--bz-text-1)]">Select a debate</h2>
					<p className="mt-2 text-sm leading-6 text-[var(--bz-text-2)]">Choose a debate proceeding to inspect the source, chamber, date, and related Bill context.</p>
				</div>
			</aside>
		);
	}

	const linkedBillId = debateBillLinks[debate.id];
	const linkedBillHref = linkedBillId ? hrefForBill(filters, linkedBillId) : null;
	const stageLabel = debateStageLabel(debate);
	const detailProfile = getDebateDetailProfile(debate);
	const debateMembers = uniqueDebateMembers(debate);
	const visibleMembers = debateMembers.slice(0, 12);
	const hiddenMemberCount = Math.max(0, debateMembers.length - visibleMembers.length);

	return (
		<aside className="min-h-full overflow-hidden bg-[var(--bz-surface)] text-[var(--bz-text-1)]">
			<div className="border-b border-[var(--bz-border)] bg-[var(--bz-surface)] px-4 py-3">
				<div className="flex flex-wrap items-center gap-2">
					<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--bz-text-2)]">{stageLabel}</span>
					<span className="rounded border border-[var(--bz-border)] px-1.5 py-0.5 text-[10.5px] text-[var(--bz-text-2)]">{houseLabelsLocalized[filters.language][debate.house]}</span>
					{debate.isDemoSeed && <span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10.5px] text-[var(--bz-text-2)]">Sandbox record</span>}
				</div>
				<h2 className="mt-3 text-lg font-bold leading-6 text-[var(--bz-text-1)]">{debate.title}</h2>
				<p className="mt-1 text-xs text-[var(--bz-text-2)]">{formatDate(debate.date)}</p>
			</div>

			<div className="p-4">
				<div className="rounded-lg border border-[var(--bz-border)] bg-[var(--bz-accent-3)] p-3">
					<p className="bz-eyebrow text-[0.55rem] text-[var(--bz-accent)]">Proceeding read</p>
					<p className="mt-2 text-[13px] leading-6 text-[var(--bz-text-1)]">{debate.summary}</p>
					<p className="mt-3 text-[12.5px] leading-5 text-[var(--bz-text-2)]">{detailProfile.proceduralRead}</p>
				</div>

				<DebateAiSummaryBlock debate={debate} payload={aiSummary} status={aiSummaryStatus} />

				<dl className="mt-5 grid grid-cols-2 gap-2 text-xs">
					<DetailTerm label="House" value={houseLabelsLocalized[filters.language][debate.house]} />
					<DetailTerm label="Date" value={formatDate(debate.date)} />
					<DetailTerm label="Source family" value={debateSourceLabel(debate)} />
					<DetailTerm label="Stage read" value={stageLabel} />
					<DetailTerm label="Transcript" value={getDebateTranscriptLabel(debate)} />
					<DetailTerm label="Debate type" value={debate.debate_type ?? 'Not classified'} />
				</dl>

				<div className="mt-5 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] p-3">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p className="bz-eyebrow text-[0.55rem]">Official transcript</p>
							<p className="mt-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">
								{debate.transcript_url
									? `PDF transcript linked from the source record${debate.transcript_language ? ` · language: ${debate.transcript_language}` : ''}.`
									: 'No official transcript PDF has been linked for this debate yet.'}
							</p>
						</div>
						{debate.transcript_url && (
							<a
								className="inline-flex rounded-md border border-[var(--bz-accent)] bg-[var(--bz-accent-2)] px-2 py-1 text-[10.5px] font-semibold text-[var(--bz-accent)] transition hover:bg-[var(--bz-accent)] hover:text-white bz-focus"
								href={debate.transcript_url}
								target="_blank"
								rel="noreferrer"
							>
								Open PDF
							</a>
						)}
					</div>

					<div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--bz-border)] pt-3 text-xs">
						<div>
							<p className="bz-eyebrow text-[0.55rem]">Lok Sabha</p>
							<p className="mt-1 font-semibold text-[var(--bz-text-1)]">{debate.lok_sabha_number ?? 'Not listed'}</p>
						</div>
						<div>
							<p className="bz-eyebrow text-[0.55rem]">Session</p>
							<p className="mt-1 font-semibold text-[var(--bz-text-1)]">{debate.session_number ?? 'Not listed'}</p>
						</div>
					</div>

					{debateMembers.length ? (
						<div className="mt-4">
							<p className="bz-eyebrow text-[0.55rem]">Members listed in source</p>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{visibleMembers.map((member) => (
									<span className="rounded border border-[var(--bz-border)] bg-[var(--bz-surface-2)] px-1.5 py-0.5 text-[10.5px] text-[var(--bz-text-2)]" key={member}>
										{member}
									</span>
								))}
								{hiddenMemberCount > 0 && <span className="rounded border border-[var(--bz-border)] px-1.5 py-0.5 text-[10.5px] text-[var(--bz-text-2)]">+{hiddenMemberCount} more</span>}
							</div>
						</div>
					) : (
						<p className="mt-4 text-[12.5px] leading-5 text-[var(--bz-text-2)]">No speaker/member list has been extracted for this record yet.</p>
					)}
				</div>

				<div className="mt-5 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
					<p className="bz-eyebrow text-[0.55rem]">Why this proceeding matters</p>
					<ul className="mt-2 space-y-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">
						{detailProfile.whyItMatters.map((item) => (
							<li className="flex gap-2" key={item}>
								<span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--bz-accent)]" />
								<span>{item}</span>
							</li>
						))}
					</ul>
				</div>

				<div className="mt-5 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] p-3">
					<p className="bz-eyebrow text-[0.55rem]">Source can confirm</p>
					<p className="mt-2 text-[12.5px] font-semibold leading-5 text-[var(--bz-text-1)]">{detailProfile.sourceRecord}</p>
					<ul className="mt-2 space-y-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">
						{detailProfile.sourceChecks.map((item) => (
							<li className="flex gap-2" key={item}>
								<span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--bz-text-3)]" />
								<span>{item}</span>
							</li>
						))}
					</ul>
				</div>

				<div className="mt-5 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)] p-3">
					<p className="bz-eyebrow text-[0.55rem]">Related Bill</p>
					<p className="mt-2 text-sm font-semibold leading-5 text-[var(--bz-text-1)]">{detailProfile.linkedBillTitle}</p>
					{linkedBillHref ? (
						<a
							className="mt-2 inline-flex rounded-md border border-[var(--bz-accent)] bg-[var(--bz-accent-2)] px-2 py-1 text-[10.5px] font-semibold text-[var(--bz-accent)] transition hover:bg-[var(--bz-accent)] hover:text-white bz-focus"
							href={linkedBillHref}
							onClick={(event) => {
								if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
								event.preventDefault();
								onNavigate(linkedBillHref);
							}}
						>
							Open linked Bill
						</a>
					) : (
						<p className="mt-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">No linked Bill has been mapped for this debate yet.</p>
					)}
				</div>

				<div className="mt-5 rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface)] p-3">
					<p className="bz-eyebrow text-[0.55rem]">Next checks</p>
					<ul className="mt-2 space-y-2 text-[12.5px] leading-5 text-[var(--bz-text-2)]">
						{detailProfile.nextChecks.map((item) => (
							<li className="flex gap-2" key={item}>
								<span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--bz-accent)]" />
								<span>{item}</span>
							</li>
						))}
					</ul>
				</div>

				<div className="mt-5">
					<SourceBadge url={debate.source_url} label={debateSourceLabel(debate)} isDemoSeed={debate.isDemoSeed} />
				</div>
			</div>
		</aside>
	);
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
	filters,
	analysis,
	analysisStatus = 'local'
}: {
	bill: Bill | null;
	actions?: BillAction[];
	filters: DashboardFilters;
	analysis?: BillAnalysis | null;
	analysisStatus?: AnalysisStatus;
}) {
	const language = filters.language;
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
					<a className="rounded border border-[var(--bz-border)] px-2 py-1 text-[10.5px] font-medium text-[var(--bz-text-2)] transition hover:border-[var(--bz-accent)] hover:text-[var(--bz-accent)] bz-focus" href={hrefForSection(filters, 'bills', { bill: bill.id })}>
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
