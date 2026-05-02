export const SECTION_IDS = [
	'overview',
	'houses',
	'timeline',
	'bills',
	'committees',
	'questions',
	'debates',
	'acts',
	'sources'
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const HOUSES = [
	'lok-sabha',
	'rajya-sabha',
	'joint-sitting',
	'state-assembly',
	'state-council'
] as const;

export type House = (typeof HOUSES)[number];

export type BillType = 'ordinary' | 'money' | 'financial' | 'constitutional-amendment';

export const ORDINARY_BILL_STAGES = [
	'draft',
	'introduced',
	'listed',
	'taken_up',
	'referred_committee',
	'committee_reported',
	'passed_origin_house',
	'transmitted_to_other_house',
	'passed_second_house',
	'returned_with_amendments',
	'joint_sitting_possible',
	'joint_sitting_passed',
	'president_assent_pending',
	'assented',
	'act_published',
	'withdrawn',
	'lapsed'
] as const;

export const MONEY_BILL_STAGES = [
	'introduced_lok_sabha',
	'passed_lok_sabha',
	'sent_to_rajya_sabha',
	'rajya_sabha_recommendation_period',
	'returned_with_recommendations',
	'deemed_passed_after_14_days',
	'president_assent_pending',
	'assented',
	'act_published'
] as const;

export type OrdinaryBillStage = (typeof ORDINARY_BILL_STAGES)[number];
export type MoneyBillStage = (typeof MONEY_BILL_STAGES)[number];
export type BillStage = OrdinaryBillStage | MoneyBillStage;

export type TimelineEventType =
	| 'sitting_scheduled'
	| 'agenda_published'
	| 'bill_introduced'
	| 'bill_listed'
	| 'bill_taken_up'
	| 'bill_referred_committee'
	| 'committee_report_tabled'
	| 'question_listed'
	| 'question_answered'
	| 'debate_published'
	| 'bill_passed_origin_house'
	| 'bill_transmitted'
	| 'bill_passed_second_house'
	| 'bill_assented'
	| 'act_published'
	| 'bill_withdrawn'
	| 'bill_lapsed';

export type SourceKind =
	| 'sansad'
	| 'lok-sabha'
	| 'rajya-sabha'
	| 'india-code'
	| 'data-gov'
	| 'prs'
	| 'egazette'
	| 'neva'
	| 'demo-seed';

export type SourceRef = {
	label: string;
	url: string;
	kind: SourceKind;
	isDemoSeed: boolean;
};

export type Bill = {
	id: string;
	title_en: string;
	title_hi: string;
	bill_number: string;
	bill_year: number;
	bill_type: BillType;
	origin_house: House;
	current_stage: BillStage;
	ministry: string;
	introduced_on: string;
	latest_action_date: string;
	source_url: string;
	summary: string;
	isDemoSeed: boolean;
};

export type BillAction = {
	id: string;
	bill_id: string;
	date: string;
	house: House;
	action_type: TimelineEventType | 'money_bill_window' | 'president_assent';
	description: string;
	source_url: string;
	isDemoSeed: boolean;
};

export type SittingDay = {
	id: string;
	date: string;
	house: House;
	session_name: string;
	status: 'scheduled' | 'sat' | 'adjourned' | 'holiday' | 'demo';
	isDemoSeed: boolean;
};

export type TimelineEvent = {
	id: string;
	date: string;
	house: House;
	type: TimelineEventType;
	title: string;
	description: string;
	related_bill_id?: string;
	source_url: string;
	isDemoSeed: boolean;
};

export type Committee = {
	id: string;
	name: string;
	house: House;
	type: 'standing' | 'select' | 'joint' | 'department-related';
	source_url: string;
	isDemoSeed: boolean;
};

export type Question = {
	id: string;
	number: string;
	house: House;
	date: string;
	ministry: string;
	subject: string;
	answer_status: 'listed' | 'answered' | 'deferred';
	source_url: string;
	isDemoSeed: boolean;
};

export type Debate = {
	id: string;
	house: House;
	date: string;
	title: string;
	summary: string;
	source_url: string;
	transcript_url?: string;
	transcript_pages?: number;
	transcript_size?: string;
	transcript_language?: string;
	members?: string[];
	lok_sabha_number?: string;
	session_number?: string;
	debate_type?: string;
	isDemoSeed: boolean;
};

export type Act = {
	id: string;
	title: string;
	act_number: string;
	year: number;
	linked_bill_id: string;
	india_code_url: string;
	isDemoSeed: boolean;
};

export type SourceEntry = {
	id: string;
	name: string;
	kind: SourceKind;
	url: string;
	preparedFor: string;
	status: 'using-now' | 'discovery-ready' | 'planned';
};
