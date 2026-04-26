import { getBillDetail, getDashboardData, type DashboardFilters } from '$lib/data/view-model';
import {
	debates,
	seedMeta,
	sources,
	timelineEvents
} from '$lib/data/seed';
import type { TimelineEvent } from '$lib/domain/types';
import {
	fromDomainBillStage,
	fromDomainHouse,
	toDomainAct,
	toDomainBill,
	toDomainBillAction,
	toDomainCommittee,
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
	label: 'Demo seed repository',
	isLiveOfficialData: false
};

const prismaDataSource: DataSourceMeta = {
	mode: 'prisma',
	label: 'Prisma/PostgreSQL repository',
	isLiveOfficialData: false
};

export type DashboardRepositoryResult = ReturnType<typeof getDashboardData> & {
	dataSource: DataSourceMeta;
};

export type BillDetailRepositoryResult = NonNullable<ReturnType<typeof getBillDetail>> & {
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

type PrismaReadClient = {
	bill: FindManyModel<Parameters<typeof toDomainBill>[0]> & {
		count(args?: unknown): Promise<number>;
		findUnique(args: unknown): Promise<Parameters<typeof toDomainBill>[0] | null>;
	};
	billAction: FindManyModel<Parameters<typeof toDomainBillAction>[0]>;
	timelineEvent: FindManyModel<Parameters<typeof toDomainTimelineEvent>[0]>;
	sittingDay: FindManyModel<Parameters<typeof toDomainSittingDay>[0]>;
	committee: FindManyModel<Parameters<typeof toDomainCommittee>[0]>;
	question: FindManyModel<Parameters<typeof toDomainQuestion>[0]>;
	act: FindManyModel<Parameters<typeof toDomainAct>[0]>;
};

function createSeedRepository(): LegislativeRepository {
	return {
		async getDashboardData(filters) {
			return {
				...getDashboardData(filters),
				dataSource: seedDataSource
			};
		},
		async getBillDetail(billId) {
			const detail = getBillDetail(billId);
			if (!detail) return null;
			return {
				...detail,
				dataSource: seedDataSource
			};
		},
		async getTimelineEventsForBill(billId) {
			return timelineEvents.filter((event) => event.related_bill_id === billId);
		}
	};
}

function createPrismaRepository(prisma: PrismaReadClient): LegislativeRepository {
	return {
		async getDashboardData(filters) {
			const billWhere = {
				...(filters.house === 'all' ? {} : { origin_house: fromDomainHouse(filters.house) }),
				...(filters.status === 'all' ? {} : { current_stage: fromDomainBillStage(filters.status) }),
				...(filters.query.trim()
					? {
							OR: [
								{ title_en: { contains: filters.query, mode: 'insensitive' } },
								{ title_hi: { contains: filters.query } },
								{ ministry: { contains: filters.query, mode: 'insensitive' } }
							]
						}
					: {})
			};

			const eventWhere = {
				date: new Date(`${filters.date}T00:00:00+05:30`),
				...(filters.house === 'all' ? {} : { house: fromDomainHouse(filters.house) })
			};

			const [
				billRows,
				allBillRows,
				billActionRows,
				timelineEventRows,
				allTimelineEventRows,
				sittingDayRows,
				committeeRows,
				questionRows,
				actRows,
				billsTracked
			] = await Promise.all([
				prisma.bill.findMany({ where: billWhere, orderBy: { latest_action_date: 'desc' } }),
				prisma.bill.findMany({ orderBy: { latest_action_date: 'desc' } }),
				prisma.billAction.findMany({ orderBy: { date: 'desc' } }),
				prisma.timelineEvent.findMany({ where: eventWhere, orderBy: { date: 'asc' } }),
				prisma.timelineEvent.findMany({ orderBy: { date: 'asc' } }),
				prisma.sittingDay.findMany({ orderBy: { date: 'desc' } }),
				prisma.committee.findMany({ orderBy: { name: 'asc' } }),
				prisma.question.findMany({ orderBy: { date: 'desc' } }),
				prisma.act.findMany({ orderBy: { year: 'desc' } }),
				prisma.bill.count()
			]);

			const timelineEvents = timelineEventRows.map(toDomainTimelineEvent);
			const allTimelineEvents = allTimelineEventRows.map(toDomainTimelineEvent);
			const sittingDays = sittingDayRows.map(toDomainSittingDay);
			const committees = committeeRows.map(toDomainCommittee);

			return {
				seedMeta,
				filters,
				stats: {
					billsTracked,
					eventsOnDate: timelineEvents.length,
					committeesTracked: committees.length,
					preparedSources: sources.length
				},
				bills: billRows.map(toDomainBill),
				allBills: allBillRows.map(toDomainBill),
				billActions: billActionRows.map(toDomainBillAction),
				timelineEvents,
				timelineGroups: groupTimelineEventsByDate(timelineEvents),
				timelineDateRail: buildTimelineDateRail({
					events: allTimelineEvents,
					sittingDays,
					selectedDate: filters.date,
					house: filters.house,
					section: filters.section,
					language: filters.language
				}),
				allTimelineEvents,
				sittingDays,
				committees,
				questions: questionRows.map(toDomainQuestion),
				debates,
				acts: actRows.map(toDomainAct),
				sources,
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
