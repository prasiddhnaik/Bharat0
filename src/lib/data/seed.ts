import type {
	Act,
	Bill,
	BillAction,
	Committee,
	Debate,
	Question,
	SittingDay,
	SourceEntry,
	TimelineEvent
} from '$lib/domain/types';

export const seedMeta = {
	label: 'Demo seed data',
	description:
		'All records below are realistic demo fixtures for BharatZero. They are not official live Parliament records.',
	updatedAt: '2026-07-20'
} as const;

export const bills: Bill[] = [
	{
		id: 'bz-bill-public-health-2026',
		title_en: 'Demo Public Health Preparedness Bill, 2026',
		title_hi: 'डेमो लोक स्वास्थ्य तैयारी विधेयक, 2026',
		bill_number: 'Demo Bill No. 18 of 2026',
		bill_year: 2026,
		bill_type: 'ordinary',
		origin_house: 'lok-sabha',
		current_stage: 'referred_committee',
		ministry: 'Ministry of Health and Family Welfare',
		introduced_on: '2026-07-18',
		latest_action_date: '2026-07-20',
		source_url: 'https://sansad.in/ls/legislation/bills',
		summary:
			'Demo ordinary Bill showing introduction in Lok Sabha, listing for consideration, and referral to a department-related committee.',
		isDemoSeed: true
	},
	{
		id: 'bz-bill-digital-services-2026',
		title_en: 'Demo Digital Public Services Accountability Bill, 2026',
		title_hi: 'डेमो डिजिटल लोक सेवा जवाबदेही विधेयक, 2026',
		bill_number: 'Demo Bill No. 22 of 2026',
		bill_year: 2026,
		bill_type: 'ordinary',
		origin_house: 'rajya-sabha',
		current_stage: 'transmitted_to_other_house',
		ministry: 'Ministry of Electronics and Information Technology',
		introduced_on: '2026-07-15',
		latest_action_date: '2026-07-20',
		source_url: 'https://sansad.in/rs/legislation/bills',
		summary:
			'Demo Rajya Sabha-originating ordinary Bill used to show second-House transmission and source visibility.',
		isDemoSeed: true
	},
	{
		id: 'bz-bill-appropriation-demo-2026',
		title_en: 'Demo Appropriation Bill, 2026',
		title_hi: 'डेमो विनियोग विधेयक, 2026',
		bill_number: 'Demo Money Bill No. 4 of 2026',
		bill_year: 2026,
		bill_type: 'money',
		origin_house: 'lok-sabha',
		current_stage: 'rajya_sabha_recommendation_period',
		ministry: 'Ministry of Finance',
		introduced_on: '2026-07-19',
		latest_action_date: '2026-07-20',
		source_url: 'https://sansad.in/ls/legislation/bills',
		summary:
			'Demo Money Bill path showing Lok Sabha origin and the Rajya Sabha recommendation period rather than a normal second-House passage path.',
		isDemoSeed: true
	}
];

export const billActions: BillAction[] = [
	{
		id: 'act-public-health-introduced',
		bill_id: 'bz-bill-public-health-2026',
		date: '2026-07-18',
		house: 'lok-sabha',
		action_type: 'bill_introduced',
		description: 'Demo record: Bill introduced in Lok Sabha and marked for subsequent listing.',
		source_url: 'https://sansad.in/ls/legislation/bills',
		isDemoSeed: true
	},
	{
		id: 'act-public-health-committee',
		bill_id: 'bz-bill-public-health-2026',
		date: '2026-07-20',
		house: 'lok-sabha',
		action_type: 'bill_referred_committee',
		description: 'Demo record: Referred to the Department-related Standing Committee on Health.',
		source_url: 'https://sansad.in/ls/committees',
		isDemoSeed: true
	},
	{
		id: 'act-digital-services-transmitted',
		bill_id: 'bz-bill-digital-services-2026',
		date: '2026-07-20',
		house: 'rajya-sabha',
		action_type: 'bill_transmitted',
		description: 'Demo record: Passed by Rajya Sabha and transmitted to Lok Sabha.',
		source_url: 'https://sansad.in/rs/legislation/bills',
		isDemoSeed: true
	},
	{
		id: 'act-appropriation-rs-window',
		bill_id: 'bz-bill-appropriation-demo-2026',
		date: '2026-07-20',
		house: 'rajya-sabha',
		action_type: 'money_bill_window',
		description: 'Demo record: Money Bill sent to Rajya Sabha for recommendations within the constitutional window.',
		source_url: 'https://sansad.in/rs/legislation/bills',
		isDemoSeed: true
	}
];

export const sittingDays: SittingDay[] = [
	{
		id: 'sit-ls-2026-07-20',
		date: '2026-07-20',
		house: 'lok-sabha',
		session_name: 'Demo Monsoon Session 2026',
		status: 'demo',
		isDemoSeed: true
	},
	{
		id: 'sit-rs-2026-07-20',
		date: '2026-07-20',
		house: 'rajya-sabha',
		session_name: 'Demo Monsoon Session 2026',
		status: 'demo',
		isDemoSeed: true
	}
];

export const timelineEvents: TimelineEvent[] = [
	{
		id: 'evt-ls-agenda-2026-07-20',
		date: '2026-07-20',
		house: 'lok-sabha',
		type: 'agenda_published',
		title: 'Demo Lok Sabha business list published',
		description: 'Agenda surface prepared for Bills, questions, and committee references.',
		source_url: 'https://sansad.in/ls',
		isDemoSeed: true
	},
	{
		id: 'evt-health-committee-2026-07-20',
		date: '2026-07-20',
		house: 'lok-sabha',
		type: 'bill_referred_committee',
		title: 'Health preparedness Bill referred',
		description: 'Demo referral event linking an ordinary Bill to a standing committee workflow.',
		related_bill_id: 'bz-bill-public-health-2026',
		source_url: 'https://sansad.in/ls/committees',
		isDemoSeed: true
	},
	{
		id: 'evt-money-bill-rs-2026-07-20',
		date: '2026-07-20',
		house: 'rajya-sabha',
		type: 'bill_transmitted',
		title: 'Money Bill recommendation window opened',
		description: 'Demo event showing Rajya Sabha handling for a Money Bill, not ordinary bicameral passage.',
		related_bill_id: 'bz-bill-appropriation-demo-2026',
		source_url: 'https://sansad.in/rs',
		isDemoSeed: true
	},
	{
		id: 'evt-question-health-2026-07-20',
		date: '2026-07-20',
		house: 'lok-sabha',
		type: 'question_answered',
		title: 'Question answered on district disease surveillance',
		description: 'Demo question event prepared for official questions-and-answers ingestion later.',
		source_url: 'https://sansad.in/ls/questions/questions-and-answers',
		isDemoSeed: true
	}
];

export const committees: Committee[] = [
	{
		id: 'committee-health-demo',
		name: 'Demo Standing Committee on Health and Family Welfare',
		house: 'lok-sabha',
		type: 'department-related',
		source_url: 'https://sansad.in/ls/committees',
		isDemoSeed: true
	},
	{
		id: 'committee-it-demo',
		name: 'Demo Standing Committee on Communications and Information Technology',
		house: 'lok-sabha',
		type: 'department-related',
		source_url: 'https://sansad.in/ls/committees',
		isDemoSeed: true
	}
];

export const questions: Question[] = [
	{
		id: 'q-health-surveillance-demo',
		number: 'Demo Q. 142',
		house: 'lok-sabha',
		date: '2026-07-20',
		ministry: 'Ministry of Health and Family Welfare',
		subject: 'District disease surveillance capacity',
		answer_status: 'answered',
		source_url: 'https://sansad.in/ls/questions/questions-and-answers',
		isDemoSeed: true
	},
	{
		id: 'q-digital-access-demo',
		number: 'Demo UQ. 219',
		house: 'rajya-sabha',
		date: '2026-07-20',
		ministry: 'Ministry of Electronics and Information Technology',
		subject: 'Digital public service accessibility standards',
		answer_status: 'listed',
		source_url: 'https://sansad.in/rs/questions',
		isDemoSeed: true
	}
];

export const debates: Debate[] = [
	{
		id: 'debate-health-demo',
		house: 'lok-sabha',
		date: '2026-07-20',
		title: 'Demo short duration discussion on public health readiness',
		summary: 'Prepared debate fixture for future corrected and uncorrected debate transcript ingestion.',
		source_url: 'https://sansad.in/ls/debates',
		isDemoSeed: true
	},
	{
		id: 'debate-digital-demo',
		house: 'rajya-sabha',
		date: '2026-07-20',
		title: 'Demo discussion on digital service delivery safeguards',
		summary: 'Prepared debate fixture for Rajya Sabha debate source adapters.',
		source_url: 'https://sansad.in/rs/debates',
		isDemoSeed: true
	}
];

export const acts: Act[] = [
	{
		id: 'act-demo-services-2025',
		title: 'Demo Public Services Continuity Act, 2025',
		act_number: 'Demo Act No. 31 of 2025',
		year: 2025,
		linked_bill_id: 'bz-bill-digital-services-2026',
		india_code_url: 'https://www.indiacode.nic.in/',
		isDemoSeed: true
	}
];

export const sources: SourceEntry[] = [
	{
		id: 'source-sansad',
		name: 'Sansad portal',
		kind: 'sansad',
		url: 'https://sansad.in/',
		preparedFor: 'Unified Parliament landing, sessions, members, questions, debates, committees, and legislation surfaces.',
		status: 'prepared'
	},
	{
		id: 'source-lok-sabha',
		name: 'Lok Sabha official pages',
		kind: 'lok-sabha',
		url: 'https://sansad.in/ls',
		preparedFor: 'Lok Sabha Bills, agenda, questions, debates, committee referrals, and sitting-day activity.',
		status: 'future-adapter'
	},
	{
		id: 'source-rajya-sabha',
		name: 'Rajya Sabha official pages',
		kind: 'rajya-sabha',
		url: 'https://sansad.in/rs',
		preparedFor: 'Rajya Sabha Bills, questions, debates, and Money Bill recommendation-window events.',
		status: 'future-adapter'
	},
	{
		id: 'source-india-code',
		name: 'India Code',
		kind: 'india-code',
		url: 'https://www.indiacode.nic.in/',
		preparedFor: 'Act text, act numbers, central legislation, state legislation, and bilingual legal access.',
		status: 'future-adapter'
	},
	{
		id: 'source-data-gov',
		name: 'Open Government Data Platform India',
		kind: 'data-gov',
		url: 'https://data.gov.in/',
		preparedFor: 'Supplemental catalog and metadata datasets where available.',
		status: 'future-adapter'
	},
	{
		id: 'source-egazette',
		name: 'eGazette',
		kind: 'egazette',
		url: 'https://egazette.nic.in/',
		preparedFor: 'Post-assent publication and notification trail.',
		status: 'future-adapter'
	},
	{
		id: 'source-neva',
		name: 'NeVA',
		kind: 'neva',
		url: 'https://neva.gov.in/',
		preparedFor: 'Future state legislature expansion through Vidhan Sabha and Vidhan Parishad sources.',
		status: 'future-adapter'
	}
];
