import type {
	Act,
	Bill,
	BillAction,
	BillStage,
	BillType,
	Committee,
	House,
	Question,
	SittingDay,
	TimelineEvent,
	TimelineEventType
} from '$lib/domain/types';

const houseFromPrisma = {
	LOK_SABHA: 'lok-sabha',
	RAJYA_SABHA: 'rajya-sabha',
	JOINT_SITTING: 'joint-sitting',
	STATE_ASSEMBLY: 'state-assembly',
	STATE_COUNCIL: 'state-council'
} as const satisfies Record<string, House>;

const houseToPrisma = {
	'lok-sabha': 'LOK_SABHA',
	'rajya-sabha': 'RAJYA_SABHA',
	'joint-sitting': 'JOINT_SITTING',
	'state-assembly': 'STATE_ASSEMBLY',
	'state-council': 'STATE_COUNCIL'
} as const satisfies Record<House, string>;

const billTypeFromPrisma = {
	ORDINARY: 'ordinary',
	MONEY: 'money',
	FINANCIAL: 'financial',
	CONSTITUTIONAL_AMENDMENT: 'constitutional-amendment'
} as const satisfies Record<string, BillType>;

const billTypeToPrisma = {
	ordinary: 'ORDINARY',
	money: 'MONEY',
	financial: 'FINANCIAL',
	'constitutional-amendment': 'CONSTITUTIONAL_AMENDMENT'
} as const satisfies Record<BillType, string>;

const billStageFromPrisma = {
	DRAFT: 'draft',
	INTRODUCED: 'introduced',
	LISTED: 'listed',
	TAKEN_UP: 'taken_up',
	REFERRED_COMMITTEE: 'referred_committee',
	COMMITTEE_REPORTED: 'committee_reported',
	PASSED_ORIGIN_HOUSE: 'passed_origin_house',
	TRANSMITTED_TO_OTHER_HOUSE: 'transmitted_to_other_house',
	PASSED_SECOND_HOUSE: 'passed_second_house',
	RETURNED_WITH_AMENDMENTS: 'returned_with_amendments',
	JOINT_SITTING_POSSIBLE: 'joint_sitting_possible',
	JOINT_SITTING_PASSED: 'joint_sitting_passed',
	PRESIDENT_ASSENT_PENDING: 'president_assent_pending',
	ASSENTED: 'assented',
	ACT_PUBLISHED: 'act_published',
	WITHDRAWN: 'withdrawn',
	LAPSED: 'lapsed',
	INTRODUCED_LOK_SABHA: 'introduced_lok_sabha',
	PASSED_LOK_SABHA: 'passed_lok_sabha',
	SENT_TO_RAJYA_SABHA: 'sent_to_rajya_sabha',
	RAJYA_SABHA_RECOMMENDATION_PERIOD: 'rajya_sabha_recommendation_period',
	RETURNED_WITH_RECOMMENDATIONS: 'returned_with_recommendations',
	DEEMED_PASSED_AFTER_14_DAYS: 'deemed_passed_after_14_days'
} as const satisfies Record<string, BillStage>;

const billStageToPrisma = Object.fromEntries(
	Object.entries(billStageFromPrisma).map(([prismaValue, domainValue]) => [domainValue, prismaValue])
) as Record<BillStage, string>;

const timelineEventTypeFromPrisma = {
	SITTING_SCHEDULED: 'sitting_scheduled',
	AGENDA_PUBLISHED: 'agenda_published',
	BILL_INTRODUCED: 'bill_introduced',
	BILL_LISTED: 'bill_listed',
	BILL_TAKEN_UP: 'bill_taken_up',
	BILL_REFERRED_COMMITTEE: 'bill_referred_committee',
	COMMITTEE_REPORT_TABLED: 'committee_report_tabled',
	QUESTION_LISTED: 'question_listed',
	QUESTION_ANSWERED: 'question_answered',
	DEBATE_PUBLISHED: 'debate_published',
	BILL_PASSED_ORIGIN_HOUSE: 'bill_passed_origin_house',
	BILL_TRANSMITTED: 'bill_transmitted',
	BILL_PASSED_SECOND_HOUSE: 'bill_passed_second_house',
	BILL_ASSENTED: 'bill_assented',
	ACT_PUBLISHED: 'act_published',
	BILL_WITHDRAWN: 'bill_withdrawn',
	BILL_LAPSED: 'bill_lapsed'
} as const satisfies Record<string, TimelineEventType>;

const committeeTypeFromPrisma = {
	STANDING: 'standing',
	SELECT: 'select',
	JOINT: 'joint',
	DEPARTMENT_RELATED: 'department-related'
} as const satisfies Record<string, Committee['type']>;

const sittingStatusFromPrisma = {
	SCHEDULED: 'scheduled',
	SAT: 'sat',
	ADJOURNED: 'adjourned',
	HOLIDAY: 'holiday',
	DEMO: 'demo'
} as const satisfies Record<string, SittingDay['status']>;

const answerStatusFromPrisma = {
	LISTED: 'listed',
	ANSWERED: 'answered',
	DEFERRED: 'deferred'
} as const satisfies Record<string, Question['answer_status']>;

type PrismaDate = Date | string;

type PrismaBill = {
	id: string;
	title_en: string;
	title_hi: string;
	bill_number: string;
	bill_year: number;
	bill_type: string;
	origin_house: string;
	current_stage: string;
	ministry: string;
	introduced_on: PrismaDate;
	latest_action_date: PrismaDate;
	source_url: string;
	summary: string;
	is_demo_seed: boolean;
};

type PrismaBillAction = {
	id: string;
	bill_id: string;
	date: PrismaDate;
	house: string;
	action_type: string;
	description: string;
	source_url: string;
	is_demo_seed: boolean;
};

type PrismaTimelineEvent = {
	id: string;
	date: PrismaDate;
	house: string;
	type: string;
	title: string;
	description: string;
	related_bill_id: string | null;
	source_url: string;
	is_demo_seed: boolean;
};

type PrismaSittingDay = {
	id: string;
	date: PrismaDate;
	house: string;
	session_name: string;
	status: string;
	is_demo_seed: boolean;
};

type PrismaCommittee = {
	id: string;
	name: string;
	house: string;
	type: string;
	source_url: string;
	is_demo_seed: boolean;
};

type PrismaQuestion = {
	id: string;
	number: string;
	house: string;
	date: PrismaDate;
	ministry: string;
	subject: string;
	answer_status: string;
	source_url: string;
	is_demo_seed: boolean;
};

type PrismaAct = {
	id: string;
	title: string;
	act_number: string;
	year: number;
	linked_bill_id: string;
	india_code_url: string;
	is_demo_seed: boolean;
};

function mapEnum<T extends string>(map: Record<string, T>, value: string, label: string): T {
	const mapped = map[value];
	if (!mapped) {
		throw new Error(`Unsupported Prisma ${label}: ${value}`);
	}
	return mapped;
}

function formatPrismaDate(value: PrismaDate): string {
	if (value instanceof Date) {
		return new Intl.DateTimeFormat('en-CA', {
			timeZone: 'Asia/Kolkata',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(value);
	}
	return value.slice(0, 10);
}

export function toDomainHouse(value: string): House {
	return mapEnum(houseFromPrisma, value, 'House');
}

export function fromDomainHouse(value: House): string {
	return houseToPrisma[value];
}

export function toDomainBillStage(value: string): BillStage {
	return mapEnum(billStageFromPrisma, value, 'BillStage');
}

export function fromDomainBillStage(value: BillStage): string {
	return billStageToPrisma[value];
}

export function fromDomainBillType(value: BillType): string {
	return billTypeToPrisma[value];
}

export function toDomainBill(row: PrismaBill): Bill {
	return {
		id: row.id,
		title_en: row.title_en,
		title_hi: row.title_hi,
		bill_number: row.bill_number,
		bill_year: row.bill_year,
		bill_type: mapEnum(billTypeFromPrisma, row.bill_type, 'BillType'),
		origin_house: toDomainHouse(row.origin_house),
		current_stage: toDomainBillStage(row.current_stage),
		ministry: row.ministry,
		introduced_on: formatPrismaDate(row.introduced_on),
		latest_action_date: formatPrismaDate(row.latest_action_date),
		source_url: row.source_url,
		summary: row.summary,
		isDemoSeed: row.is_demo_seed
	};
}

export function toDomainBillAction(row: PrismaBillAction): BillAction {
	return {
		id: row.id,
		bill_id: row.bill_id,
		date: formatPrismaDate(row.date),
		house: toDomainHouse(row.house),
		action_type: row.action_type as BillAction['action_type'],
		description: row.description,
		source_url: row.source_url,
		isDemoSeed: row.is_demo_seed
	};
}

export function toDomainTimelineEvent(row: PrismaTimelineEvent): TimelineEvent {
	return {
		id: row.id,
		date: formatPrismaDate(row.date),
		house: toDomainHouse(row.house),
		type: mapEnum(timelineEventTypeFromPrisma, row.type, 'TimelineEventType'),
		title: row.title,
		description: row.description,
		...(row.related_bill_id ? { related_bill_id: row.related_bill_id } : {}),
		source_url: row.source_url,
		isDemoSeed: row.is_demo_seed
	};
}

export function toDomainSittingDay(row: PrismaSittingDay): SittingDay {
	return {
		id: row.id,
		date: formatPrismaDate(row.date),
		house: toDomainHouse(row.house),
		session_name: row.session_name,
		status: mapEnum(sittingStatusFromPrisma, row.status, 'SittingStatus'),
		isDemoSeed: row.is_demo_seed
	};
}

export function toDomainCommittee(row: PrismaCommittee): Committee {
	return {
		id: row.id,
		name: row.name,
		house: toDomainHouse(row.house),
		type: mapEnum(committeeTypeFromPrisma, row.type, 'CommitteeType'),
		source_url: row.source_url,
		isDemoSeed: row.is_demo_seed
	};
}

export function toDomainQuestion(row: PrismaQuestion): Question {
	return {
		id: row.id,
		number: row.number,
		house: toDomainHouse(row.house),
		date: formatPrismaDate(row.date),
		ministry: row.ministry,
		subject: row.subject,
		answer_status: mapEnum(answerStatusFromPrisma, row.answer_status, 'AnswerStatus'),
		source_url: row.source_url,
		isDemoSeed: row.is_demo_seed
	};
}

export function toDomainAct(row: PrismaAct): Act {
	return {
		id: row.id,
		title: row.title,
		act_number: row.act_number,
		year: row.year,
		linked_bill_id: row.linked_bill_id,
		india_code_url: row.india_code_url,
		isDemoSeed: row.is_demo_seed
	};
}
