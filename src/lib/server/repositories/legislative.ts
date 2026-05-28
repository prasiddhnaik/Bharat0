import type { BillDetailData, DashboardData } from '$lib/data/view-model';
import { dataGovMeta } from '$lib/data/generated/data-gov-questions';
import type { DashboardFilters } from '$lib/domain/dashboard-filters';
import type { Bill, SourceEntry, TimelineEvent } from '$lib/domain/types';
import {
	fromDomainBillStage,
	fromDomainHouse,
	toDomainAct,
	toDomainBill,
	toDomainBillAction,
	toDomainBillStage,
	toDomainCommittee,
	toDomainDebate,
	toDomainQuestion,
	toDomainSittingDay,
	toDomainTimelineEvent
} from './prisma-mappers';
import {
	getAdapterOutputSummary,
	getPreparedSourceAdapters,
	ingestionPipelineSteps
} from '$lib/ingestion/source-adapters';
import { buildTimelineDateRail, groupTimelineEventsByDate } from '$lib/domain/timeline-view';
import { getPrimeMinisterTermDateRange, PRIME_MINISTER_TERMS, type PrimeMinisterFilter } from '$lib/domain/prime-ministers';
import { getSourceUrlPatternsForFilter } from '$lib/domain/source-filters';

export type RepositoryMode = 'seed' | 'prisma';

export type DataSourceMeta = {
	mode: RepositoryMode;
	label: string;
	isLiveOfficialData: boolean;
};

export type LegislativeRepositoryOptions = {
	mode?: RepositoryMode;
	prisma?: PrismaReadClient;
};

const seedDataSource: DataSourceMeta = {
	mode: 'seed',
	label: 'Generated Sansad repository',
	isLiveOfficialData: false
};

const prismaDataSource: DataSourceMeta = {
	mode: 'prisma',
	label: 'Prisma/PostgreSQL repository',
	isLiveOfficialData: false
};

const repositorySeedMeta: DashboardData['seedMeta'] = {
	label: 'Sansad, PRS, and Parliament Digital Library legislation records',
	description:
		'Generated from the Sansad legislation API path with a public mirror fallback, PRS India historical bill pages, Parliament Digital Library pre-2004 bill proceedings, plus a small manually curated set from PIB, Gazette/Act PDFs, and India Code.',
	updatedAt: '2026-05-01'
};

const repositorySources: SourceEntry[] = [
	{
		id: 'source-sansad',
		name: 'Sansad portal',
		kind: 'sansad',
		url: 'https://sansad.in/',
		preparedFor: 'Using Sansad legislation records for current Bill rows, actions, stages, and Act linkage.',
		status: 'using-now'
	},
	{
		id: 'source-lok-sabha',
		name: 'Lok Sabha official pages',
		kind: 'lok-sabha',
		url: 'https://sansad.in/ls',
		preparedFor: 'Using Lok Sabha-family records through Sansad links, Lok Sabha document URLs, and Parliament Digital Library proceedings.',
		status: 'using-now'
	},
	{
		id: 'source-rajya-sabha',
		name: 'Rajya Sabha official pages',
		kind: 'rajya-sabha',
		url: 'https://sansad.in/rs',
		preparedFor: 'Planned for direct Rajya Sabha Bills, questions, debates, and Money Bill recommendation-window updates.',
		status: 'planned'
	},
	{
		id: 'source-prs',
		name: 'PRS Legislative Research',
		kind: 'prs',
		url: 'https://prsindia.org/sessiontrack/budget-session-2026/session-wrap',
		preparedFor: 'Using PRS historical bill tracking records plus current-session terminal outcomes where PRS Session Wrap has newer status evidence than the Sansad mirror.',
		status: 'using-now'
	},
	{
		id: 'source-pdl',
		name: 'Parliament Digital Library',
		kind: 'lok-sabha',
		url: 'https://eparlib.sansad.in/',
		preparedFor: 'Using pre-2004 Lok Sabha bill proceedings and debate-title records for historical Prime Minister term coverage.',
		status: 'using-now'
	},
	{
		id: 'source-india-code',
		name: 'India Code',
		kind: 'india-code',
		url: 'https://www.indiacode.nic.in/',
		preparedFor: 'Using India Code and Act PDF links where loaded for enacted-law records and source badges.',
		status: 'using-now'
	},
	{
		id: 'source-data-gov',
		name: 'Open Government Data Platform India',
		kind: 'data-gov',
		url: 'https://data.gov.in/',
		preparedFor: `Using ${dataGovMeta.questionCatalogs.toLocaleString('en-IN')} Rajya Sabha question-answer catalogs and ${dataGovMeta.debateCatalogs.toLocaleString('en-IN')} verbatim debate catalogs discovered from OGD India.`,
		status: 'using-now'
	},
	{
		id: 'source-egazette',
		name: 'eGazette',
		kind: 'egazette',
		url: 'https://egazette.nic.in/',
		preparedFor: 'Planned for post-assent publication notices and Gazette notification trail.',
		status: 'planned'
	},
	{
		id: 'source-neva',
		name: 'NeVA',
		kind: 'neva',
		url: 'https://neva.gov.in/',
		preparedFor: 'Planned for state legislature expansion through Vidhan Sabha and Vidhan Parishad sources.',
		status: 'planned'
	}
];

function sourceUrlWhereForFilter(sourceFilter: string, fieldName = 'source_url') {
	if (sourceFilter === 'all') return {};
	const patterns = getSourceUrlPatternsForFilter(sourceFilter);
	if (patterns.length === 0) {
		return { id: '__no_source_match__' };
	}

	if (patterns.length === 1) {
		return { [fieldName]: { contains: patterns[0], mode: 'insensitive' } };
	}

	return {
		OR: patterns.map((pattern) => ({ [fieldName]: { contains: pattern, mode: 'insensitive' } }))
	};
}

function actWhereForSourceFilter(sourceFilter: string) {
	if (sourceFilter === 'all') return {};
	return {
		OR: [
			sourceUrlWhereForFilter(sourceFilter, 'india_code_url'),
			{ linked_bill: sourceUrlWhereForFilter(sourceFilter, 'source_url') }
		]
	};
}

function mergeWhereClauses(...clauses: Array<Record<string, unknown>>) {
	const activeClauses = clauses.filter((clause) => Object.keys(clause).length > 0);
	if (activeClauses.length === 0) return {};
	if (activeClauses.length === 1) return activeClauses[0];
	return { AND: activeClauses };
}

export type DashboardRepositoryResult = DashboardData & {
	dataSource: DataSourceMeta;
};

export type BillDetailRepositoryResult = NonNullable<BillDetailData> & {
	dataSource: DataSourceMeta;
};

export type LegislativeRepository = {
	getDashboardData(filters: DashboardFilters): Promise<DashboardRepositoryResult>;
	getBillDetail(billId: string): Promise<BillDetailRepositoryResult | null>;
	getTimelineEventsForBill(billId: string): Promise<TimelineEvent[]>;
};

type FindManyModel<Row> = {
	findMany(args?: unknown): Promise<Row[]>;
};

type CountModel = {
	count(args?: unknown): Promise<number>;
};

function trimSeedDashboardData(dashboard: DashboardData): DashboardData {
	const needsBills = dashboard.filters.section === 'overview' || dashboard.filters.section === 'bills';
	const needsTimeline = dashboard.filters.section === 'overview' || dashboard.filters.section === 'timeline';
	const needsCommittees = dashboard.filters.section === 'committees';
	const needsQuestions = dashboard.filters.section === 'questions';
	const needsDebates = dashboard.filters.section === 'debates';
	const needsActs = dashboard.filters.section === 'acts';
	const needsSources = dashboard.filters.section === 'sources';

	return {
		...dashboard,
		bills: needsBills ? dashboard.bills : dashboard.bills.slice(0, 1),
		allBills: [],
		billActions: [],
		timelineEvents: needsTimeline ? dashboard.timelineEvents : [],
		timelineGroups: needsTimeline ? dashboard.timelineGroups : [],
		timelineDateRail: needsTimeline ? dashboard.timelineDateRail : [],
		allTimelineEvents: [],
		sittingDays: needsTimeline ? dashboard.sittingDays : dashboard.sittingDays.slice(0, 1),
		committees: needsCommittees ? dashboard.committees : [],
		questions: needsQuestions ? dashboard.questions : [],
		debates: needsDebates ? dashboard.debates : [],
		acts: needsActs ? dashboard.acts : [],
		actBills: needsActs ? dashboard.actBills : [],
		sources: needsSources ? dashboard.sources : [],
		ingestion: needsSources
			? dashboard.ingestion
			: {
					adapters: [] as DashboardData['ingestion']['adapters'],
					outputSummary: {} as DashboardData['ingestion']['outputSummary'],
					pipelineSteps: [] as DashboardData['ingestion']['pipelineSteps']
				}
	};
}

type PrismaReadClient = {
	bill: FindManyModel<Parameters<typeof toDomainBill>[0]> & {
		count(args?: unknown): Promise<number>;
		findUnique(args: unknown): Promise<Parameters<typeof toDomainBill>[0] | null>;
		groupBy(args: unknown): Promise<Array<{ current_stage?: string; ministry?: string; _count: { _all: number } }>>;
	};
	billAction: FindManyModel<Parameters<typeof toDomainBillAction>[0]>;
	timelineEvent: FindManyModel<Parameters<typeof toDomainTimelineEvent>[0]>;
	sittingDay: FindManyModel<Parameters<typeof toDomainSittingDay>[0]>;
	committee: FindManyModel<Parameters<typeof toDomainCommittee>[0]>;
	question: FindManyModel<Parameters<typeof toDomainQuestion>[0]>;
	debate: FindManyModel<Parameters<typeof toDomainDebate>[0]> & CountModel;
	act: FindManyModel<Parameters<typeof toDomainAct>[0]> & CountModel;
};

function createSeedRepository(): LegislativeRepository {
	return {
		async getDashboardData(filters) {
			const { getDashboardData } = await import('$lib/data/view-model');
			return {
				...trimSeedDashboardData(getDashboardData(filters)),
				dataSource: seedDataSource
			};
		},
		async getBillDetail(billId) {
			const { getBillDetail } = await import('$lib/data/view-model');
			const detail = getBillDetail(billId);
			if (!detail) return null;
			return {
				...detail,
				dataSource: seedDataSource
			};
		},
		async getTimelineEventsForBill(billId) {
			const { timelineEvents } = await import('$lib/data/seed');
			return timelineEvents.filter((event) => event.related_bill_id === billId);
		}
	};
}

function createPrismaRepository(prisma: PrismaReadClient): LegislativeRepository {
	return {
		async getDashboardData(filters) {
			const needsBills = filters.section === 'overview' || filters.section === 'bills';
			const needsTimeline = filters.section === 'overview' || filters.section === 'timeline';
			const needsCommittees = filters.section === 'committees';
			const needsQuestions = filters.section === 'questions';
			const needsDebates = filters.section === 'debates';
			const needsActs = filters.section === 'acts';
			const timelineNeedsBillLookup = needsTimeline && (filters.query.trim().length > 0 || filters.status !== 'all');
			const shouldFetchBills = needsBills || timelineNeedsBillLookup;
			const pmDateRange = getPrimeMinisterTermDateRange(filters.primeMinister);
			const primeMinisterDateWhere = {
				...(pmDateRange.startDate ? { gte: new Date(`${pmDateRange.startDate}T00:00:00.000Z`) } : {}),
				...(pmDateRange.endDate ? { lt: new Date(`${pmDateRange.endDate}T00:00:00.000Z`) } : {})
			};
			const primeMinisterWhere = Object.keys(primeMinisterDateWhere).length > 0 ? { introduced_on: primeMinisterDateWhere } : {};
			const sourceBillWhere = sourceUrlWhereForFilter(filters.source);
			const sourceActWhere = actWhereForSourceFilter(filters.source);
			const billSearchWhere = filters.query.trim()
				? {
						OR: [
							{ title_en: { contains: filters.query, mode: 'insensitive' } },
							{ title_hi: { contains: filters.query } },
							{ ministry: { contains: filters.query, mode: 'insensitive' } }
						]
					}
				: {};
			const billStageCountWhere = mergeWhereClauses(
				sourceBillWhere,
				primeMinisterWhere,
				filters.house === 'all' ? {} : { origin_house: fromDomainHouse(filters.house) },
				filters.area === 'all' ? {} : { ministry: filters.area },
				billSearchWhere
			);
			const billAreaCountWhere = mergeWhereClauses(
				sourceBillWhere,
				primeMinisterWhere,
				filters.house === 'all' ? {} : { origin_house: fromDomainHouse(filters.house) },
				filters.status === 'all' ? {} : { current_stage: fromDomainBillStage(filters.status) },
				billSearchWhere
			);
			const billWhere = mergeWhereClauses(
				billStageCountWhere,
				filters.status === 'all' ? {} : { current_stage: fromDomainBillStage(filters.status) }
			);
			const actLinkedBillWhere = mergeWhereClauses(
				primeMinisterWhere,
				filters.house === 'all' ? {} : { origin_house: fromDomainHouse(filters.house) },
				filters.area === 'all' ? {} : { ministry: filters.area },
				filters.status === 'all' ? {} : { current_stage: fromDomainBillStage(filters.status) }
			);
			const actQueryWhere = filters.query.trim()
				? {
						OR: [
							{ title: { contains: filters.query, mode: 'insensitive' } },
							{ act_number: { contains: filters.query, mode: 'insensitive' } },
							...(Number.isFinite(Number.parseInt(filters.query, 10)) ? [{ year: Number.parseInt(filters.query, 10) }] : []),
							{
								linked_bill: {
									OR: [
										{ title_en: { contains: filters.query, mode: 'insensitive' } },
										{ title_hi: { contains: filters.query } },
										{ ministry: { contains: filters.query, mode: 'insensitive' } }
									]
								}
							}
						]
					}
				: {};
			const actWhere = mergeWhereClauses(
				sourceActWhere,
				Object.keys(actLinkedBillWhere).length > 0 ? { linked_bill: actLinkedBillWhere } : {},
				actQueryWhere
			);
			const debateWhere = mergeWhereClauses(
				sourceUrlWhereForFilter(filters.source),
				filters.house === 'all' ? {} : { house: fromDomainHouse(filters.house) },
				filters.query.trim()
					? {
							OR: [
								{ title: { contains: filters.query, mode: 'insensitive' } },
								{ summary: { contains: filters.query, mode: 'insensitive' } },
								{ debate_type: { contains: filters.query, mode: 'insensitive' } }
							]
						}
					: {}
			);
			const billFindArgs = {
				where: billWhere,
				orderBy: { latest_action_date: 'desc' },
				...(filters.section === 'overview' && !timelineNeedsBillLookup ? { take: 5 } : {}),
				...(filters.section === 'bills' ? { skip: (filters.page - 1) * filters.pageSize, take: filters.pageSize } : {})
			};
			const timelineFindArgs = {
				where: mergeWhereClauses(
					sourceUrlWhereForFilter(filters.source),
					filters.house === 'all' ? {} : { house: fromDomainHouse(filters.house) },
					Object.keys(primeMinisterDateWhere).length > 0 ? { date: primeMinisterDateWhere } : {}
				),
				orderBy: { date: 'desc' },
				...(filters.section === 'overview' ? { take: 24 } : {})
			};
			const debateFindArgs = {
				where: debateWhere,
				orderBy: { date: 'desc' },
				include: {
					transcript: { select: { status: true, char_count: true, text_hash: true } }
				},
				...(filters.section === 'debates' ? { skip: (filters.page - 1) * filters.pageSize, take: filters.pageSize } : {})
			};
			const actFindArgs = {
				where: actWhere,
				orderBy: [{ year: 'desc' }, { title: 'asc' }],
				...(filters.section === 'acts' ? { skip: (filters.page - 1) * filters.pageSize, take: filters.pageSize } : {})
			};

			const [
				billRows,
				timelineEventRows,
				sittingDayRows,
				committeeRows,
				questionRows,
				debateRows,
				actRows,
				filteredBillsTracked,
				stageCountRows,
				areaCountRows,
				primeMinisterCounts,
				filteredDebatesTracked,
				filteredActsTracked,
				totalBillsTracked
			] = await Promise.all([
				shouldFetchBills ? prisma.bill.findMany(billFindArgs) : Promise.resolve([]),
				needsTimeline ? prisma.timelineEvent.findMany(timelineFindArgs) : Promise.resolve([]),
				needsTimeline ? prisma.sittingDay.findMany({ orderBy: { date: 'desc' }, ...(filters.section === 'overview' ? { take: 120 } : {}) }) : Promise.resolve([]),
				needsCommittees ? prisma.committee.findMany({ where: sourceUrlWhereForFilter(filters.source), orderBy: { name: 'asc' } }) : Promise.resolve([]),
				needsQuestions ? prisma.question.findMany({ where: sourceUrlWhereForFilter(filters.source), orderBy: { date: 'desc' } }) : Promise.resolve([]),
				needsDebates ? prisma.debate.findMany(debateFindArgs) : Promise.resolve([]),
				needsActs ? prisma.act.findMany(actFindArgs) : Promise.resolve([]),
				prisma.bill.count({ where: billWhere }),
				prisma.bill.groupBy({ by: ['current_stage'], where: billStageCountWhere, _count: { _all: true } }),
				prisma.bill.groupBy({ by: ['ministry'], where: billAreaCountWhere, _count: { _all: true } }),
				Promise.all(
					PRIME_MINISTER_TERMS.map(async (term) => {
						const termRange = getPrimeMinisterTermDateRange(term.id as PrimeMinisterFilter);
						const introduced_on = {
							...(termRange.startDate ? { gte: new Date(`${termRange.startDate}T00:00:00.000Z`) } : {}),
							...(termRange.endDate ? { lt: new Date(`${termRange.endDate}T00:00:00.000Z`) } : {})
						};
						const count = await prisma.bill.count({
							where: {
								introduced_on
							}
						});
						return { id: term.id, count };
					})
				),
				needsDebates ? prisma.debate.count({ where: debateWhere }) : Promise.resolve(0),
				needsActs ? prisma.act.count({ where: actWhere }) : Promise.resolve(0),
				prisma.bill.count()
			]);

			const query = filters.query.trim().toLowerCase();
			const filteredBillIds = new Set(billRows.map((bill) => bill.id));
			const filteredBillsById = new Map<string, Bill>(billRows.map(toDomainBill).map((bill) => [bill.id, bill]));
			const timelineEvents = timelineEventRows.map(toDomainTimelineEvent).filter((event) => {
				const relatedBill = event.related_bill_id ? filteredBillsById.get(event.related_bill_id) : null;
				const matchesStatus = filters.status === 'all' || (relatedBill ? relatedBill.current_stage === filters.status : true);
				const matchesQuery =
					!query ||
					event.title.toLowerCase().includes(query) ||
					event.description.toLowerCase().includes(query) ||
					(relatedBill ? filteredBillIds.has(relatedBill.id) : false);

				return matchesStatus && matchesQuery;
			});
			const sittingDays = sittingDayRows.map(toDomainSittingDay);
			const committees = committeeRows.map(toDomainCommittee);
			const debates = debateRows.map(toDomainDebate);
			const acts = actRows.map(toDomainAct);
			const actLinkedBillIds = [...new Set(acts.map((act) => act.linked_bill_id))];
			const actBillRows = actLinkedBillIds.length > 0
				? await prisma.bill.findMany({ where: { id: { in: actLinkedBillIds } } })
				: [];
			const paginationTotalItems =
				filters.section === 'acts'
					? filteredActsTracked
					: filters.section === 'debates'
						? filteredDebatesTracked
						: filters.section === 'questions'
							? questionRows.length
							: filters.section === 'committees'
								? committees.length
								: filters.section === 'timeline'
									? timelineEvents.length
									: filters.section === 'sources'
										? repositorySources.length
										: filteredBillsTracked;

			return {
				seedMeta: repositorySeedMeta,
				filters,
				stats: {
					billsTracked: totalBillsTracked,
					filteredBillsTracked,
					eventsOnDate: timelineEvents.length,
					committeesTracked: committees.length,
					preparedSources: repositorySources.length
				},
				pagination: {
					page: filters.page,
					pageSize: filters.pageSize,
					totalItems: paginationTotalItems,
					totalPages: Math.max(1, Math.ceil(paginationTotalItems / filters.pageSize))
				},
				stageCounts: stageCountRows.map((row) => ({ stage: toDomainBillStage(row.current_stage ?? 'INTRODUCED'), count: row._count._all })),
				areaCounts: areaCountRows.map((row) => ({ area: row.ministry ?? '', count: row._count._all })).filter((row) => row.area),
				primeMinisterCounts,
				bills: billRows.map(toDomainBill),
				allBills: [],
				billActions: [],
				timelineEvents,
				timelineGroups: groupTimelineEventsByDate(timelineEvents),
				timelineDateRail: buildTimelineDateRail({
					events: timelineEventRows.map(toDomainTimelineEvent),
					sittingDays,
					selectedDate: filters.date,
					house: filters.house,
					section: filters.section,
					language: filters.language
				}),
				allTimelineEvents: [],
				sittingDays,
				committees,
				questions: questionRows.map(toDomainQuestion),
				debates,
				acts,
				actBills: actBillRows.map(toDomainBill),
				sources: repositorySources,
				ingestion: {
					adapters: getPreparedSourceAdapters(),
					outputSummary: getAdapterOutputSummary(),
					pipelineSteps: ingestionPipelineSteps
				},
				dataSource: prismaDataSource
			};
		},
		async getBillDetail(billId) {
			const [billRow, actionRows] = await Promise.all([
				prisma.bill.findUnique({ where: { id: billId } }),
				prisma.billAction.findMany({ where: { bill_id: billId }, orderBy: { date: 'asc' } })
			]);

			if (!billRow) return null;

			return {
				bill: toDomainBill(billRow),
				actions: actionRows.map(toDomainBillAction),
				dataSource: prismaDataSource
			};
		},
		async getTimelineEventsForBill(billId) {
			const rows = await prisma.timelineEvent.findMany({
				where: { related_bill_id: billId },
				orderBy: { date: 'asc' }
			});
			return rows.map(toDomainTimelineEvent);
		}
	};
}

export function createLegislativeRepository(options: LegislativeRepositoryOptions = {}): LegislativeRepository {
	const mode = options.mode ?? 'seed';

	if (mode === 'seed') {
		return createSeedRepository();
	}

	if (mode === 'prisma' && options.prisma) {
		return createPrismaRepository(options.prisma);
	}

	return createSeedRepository();
}
