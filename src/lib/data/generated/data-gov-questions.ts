import type { Debate, Question, TimelineEvent } from '$lib/domain/types';

export const dataGovMeta = {
	asOf: "2026-05-02",
	questionCatalogs: 16,
	debateCatalogs: 2,
	note: 'Generated from artifacts/source-discovery/latest.json using scripts/sync-data-gov-questions.ts.'
} as const;

export const dataGovQuestions: Question[] = [
	{
		"id": "data-gov-rs-questions-session-249-catalog",
		"number": "Session 249",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 249",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-249",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-250-catalog",
		"number": "Session 250",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 250",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-250",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-251-catalog",
		"number": "Session 251",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 251",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-251",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-253-catalog",
		"number": "Session 253",
		"house": "rajya-sabha",
		"date": "2021-12-31",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 253",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-253",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-254-catalog",
		"number": "Session 254",
		"house": "rajya-sabha",
		"date": "2024-12-26",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 254",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-254",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-255-catalog",
		"number": "Session 255",
		"house": "rajya-sabha",
		"date": "2024-03-11",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 255",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-255",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-256-catalog",
		"number": "Session 256",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 256",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-256",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-257-catalog",
		"number": "Session 257",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 257",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-257",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-258-catalog",
		"number": "Session 258",
		"house": "rajya-sabha",
		"date": "2023-05-19",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 258",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-258",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-259-catalog",
		"number": "Session 259",
		"house": "rajya-sabha",
		"date": "2024-01-23",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 259",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-259",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-260-catalog",
		"number": "Session 260",
		"house": "rajya-sabha",
		"date": "2024-03-11",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 260",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-260",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-262-catalog",
		"number": "Session 262",
		"house": "rajya-sabha",
		"date": "2025-02-12",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 262",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-262",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-263-catalog",
		"number": "Session 263",
		"house": "rajya-sabha",
		"date": "2025-02-12",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 263",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-263",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-265-catalog",
		"number": "Session 265",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 265",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-265",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-266-catalog",
		"number": "Session 266",
		"house": "rajya-sabha",
		"date": "2025-07-31",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 266",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-266",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-267-catalog",
		"number": "Session 267",
		"house": "rajya-sabha",
		"date": "2025-07-31",
		"ministry": "Rajya Sabha Secretariat",
		"subject": "Rajya Sabha question-answer annexures, Session 267",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-267",
		"isDemoSeed": false
	}
];

export const dataGovDebates: Debate[] = [
	{
		"id": "data-gov-rs-debates-english-catalog",
		"house": "rajya-sabha",
		"date": "2014-02-14",
		"title": "Verbatim Debates of Rajya Sabha (English)",
		"summary": "Open Government Data Platform India catalog for Rajya Sabha verbatim debate feeds. Metadata status: API unavailable; ZIP metadata advertised.",
		"source_url": "https://delhi.data.gov.in/catalog/verbatim-debates-rajya-sabha-english",
		"transcript_language": "English",
		"debate_type": "Verbatim debates catalog",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-ls-debates-english-catalog",
		"house": "lok-sabha",
		"date": "2017-02-17",
		"title": "Verbatim Debates of Lok Sabha (English)",
		"summary": "Open Government Data Platform India catalog for Lok Sabha verbatim debate feeds. Metadata status: API unavailable; ZIP metadata advertised.",
		"source_url": "https://delhi.data.gov.in/catalog/verbatim-debates-lok-sabha-english",
		"transcript_language": "English",
		"debate_type": "Verbatim debates catalog",
		"isDemoSeed": false
	}
];

export const dataGovTimelineEvents: TimelineEvent[] = [
	{
		"id": "data-gov-rs-questions-session-249-catalog-timeline",
		"date": "2025-02-17",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 249",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 249. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-249",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-250-catalog-timeline",
		"date": "2025-02-17",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 250",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 250. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-250",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-251-catalog-timeline",
		"date": "2025-02-17",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 251",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 251. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-251",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-253-catalog-timeline",
		"date": "2021-12-31",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 253",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 253. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-253",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-254-catalog-timeline",
		"date": "2024-12-26",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 254",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 254. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-254",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-255-catalog-timeline",
		"date": "2024-03-11",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 255",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 255. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-255",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-256-catalog-timeline",
		"date": "2025-02-17",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 256",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 256. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-256",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-257-catalog-timeline",
		"date": "2025-02-17",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 257",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 257. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-257",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-258-catalog-timeline",
		"date": "2023-05-19",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 258",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 258. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-258",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-259-catalog-timeline",
		"date": "2024-01-23",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 259",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 259. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-259",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-260-catalog-timeline",
		"date": "2024-03-11",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 260",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 260. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-260",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-262-catalog-timeline",
		"date": "2025-02-12",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 262",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 262. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-262",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-263-catalog-timeline",
		"date": "2025-02-12",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 263",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 263. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-263",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-265-catalog-timeline",
		"date": "2025-02-17",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 265",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 265. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-265",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-266-catalog-timeline",
		"date": "2025-07-31",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 266",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 266. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-266",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-267-catalog-timeline",
		"date": "2025-07-31",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Rajya Sabha question-answer annexures, Session 267",
		"description": "Official Open Government Data Platform India catalog for Rajya Sabha question-answer annexures, Session 267. API unavailable; ZIP metadata advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-267",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-debates-english-catalog-timeline",
		"date": "2014-02-14",
		"house": "rajya-sabha",
		"type": "debate_published",
		"title": "Verbatim Debates of Rajya Sabha (English)",
		"description": "Open Government Data Platform India catalog for Rajya Sabha verbatim debate feeds. Metadata status: API unavailable; ZIP metadata advertised.",
		"source_url": "https://delhi.data.gov.in/catalog/verbatim-debates-rajya-sabha-english",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-ls-debates-english-catalog-timeline",
		"date": "2017-02-17",
		"house": "lok-sabha",
		"type": "debate_published",
		"title": "Verbatim Debates of Lok Sabha (English)",
		"description": "Open Government Data Platform India catalog for Lok Sabha verbatim debate feeds. Metadata status: API unavailable; ZIP metadata advertised.",
		"source_url": "https://delhi.data.gov.in/catalog/verbatim-debates-lok-sabha-english",
		"isDemoSeed": false
	}
];
