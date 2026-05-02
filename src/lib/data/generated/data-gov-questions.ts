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
		"number": "RS-249-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha - Annexures to Parliamentary Questions",
		"subject": "Answers Data of Rajya Sabha Questions for Session 249. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-249",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-250-catalog",
		"number": "RS-250-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha - Annexures to Parliamentary Questions",
		"subject": "Answers Data of Rajya Sabha Questions for Session 250. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-250",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-251-catalog",
		"number": "RS-251-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha - Annexures to Parliamentary Questions",
		"subject": "Answers Data of Rajya Sabha Questions for Session 251. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-251",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-253-catalog",
		"number": "RS-253-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2021-12-31",
		"ministry": "Rajya Sabha - Annexures to Parliamentary Questions",
		"subject": "Answers Data of Rajya Sabha Questions for Session 253. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-253",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-254-catalog",
		"number": "RS-254-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2024-12-26",
		"ministry": "Rajya Sabha - Annexures to Parliamentary Questions",
		"subject": "Answers Data of Rajya Sabha Questions for Session 254. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-254",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-255-catalog",
		"number": "RS-255-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2024-03-11",
		"ministry": "Rajya Sabha - Annexures to Parliamentary Questions",
		"subject": "Answers Data of Rajya Sabha Questions for Session 255. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-255",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-256-catalog",
		"number": "RS-256-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha - Annexures to Parliamentary Questions",
		"subject": "Answers Data of Rajya Sabha Questions for Session 256. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-256",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-257-catalog",
		"number": "RS-257-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha - Annexures to Parliamentary Questions",
		"subject": "Answers Data of Rajya Sabha Questions for Session 257. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-257",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-258-catalog",
		"number": "RS-258-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2023-05-19",
		"ministry": "Rajya Sabha Annexures",
		"subject": "Answers Data of Rajya Sabha Questions for Session 258. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-258",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-259-catalog",
		"number": "RS-259-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2024-01-23",
		"ministry": "Rajya Sabha Annexures",
		"subject": "Answers Data of Rajya Sabha Questions for Session 259. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-259",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-260-catalog",
		"number": "RS-260-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2024-03-11",
		"ministry": "Rajya Sabha Annexures",
		"subject": "Answers Data of Rajya Sabha Questions for Session 260. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-260",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-262-catalog",
		"number": "RS-262-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2025-02-12",
		"ministry": "Rajya Sabha Annexures",
		"subject": "Answers Data of Rajya Sabha Questions for Session 262. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-262",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-263-catalog",
		"number": "RS-263-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2025-02-12",
		"ministry": "Rajya Sabha Annexures",
		"subject": "Answers Data of Rajya Sabha Questions for Session 263. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-263",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-265-catalog",
		"number": "RS-265-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2025-02-17",
		"ministry": "Rajya Sabha - Annexures to Parliamentary Questions",
		"subject": "Answers Data of Rajya Sabha Questions for Session 265. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-265",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-266-catalog",
		"number": "RS-266-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2025-07-31",
		"ministry": "Rajya Sabha - Annexures to Parliamentary Questions",
		"subject": "Answers Data of Rajya Sabha Questions for Session 266. OGD metadata: catalog API unavailable; zip download advertised.",
		"answer_status": "answered",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-266",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-267-catalog",
		"number": "RS-267-OGD-CATALOG",
		"house": "rajya-sabha",
		"date": "2025-07-31",
		"ministry": "Rajya Sabha - Annexures to Parliamentary Questions",
		"subject": "Answers Data of Rajya Sabha Questions for Session 267. OGD metadata: catalog API unavailable; zip download advertised.",
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
		"summary": "Open Government Data Platform India catalog for Rajya Sabha verbatim debate feeds. OGD metadata: catalog API unavailable; zip download advertised.",
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
		"summary": "Open Government Data Platform India catalog for Lok Sabha verbatim debate feeds. OGD metadata: catalog API unavailable; zip download advertised.",
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
		"title": "Answers Data of Rajya Sabha Questions for Session 249",
		"description": "Answers Data of Rajya Sabha Questions for Session 249. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-249",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-250-catalog-timeline",
		"date": "2025-02-17",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 250",
		"description": "Answers Data of Rajya Sabha Questions for Session 250. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-250",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-251-catalog-timeline",
		"date": "2025-02-17",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 251",
		"description": "Answers Data of Rajya Sabha Questions for Session 251. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-251",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-253-catalog-timeline",
		"date": "2021-12-31",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 253",
		"description": "Answers Data of Rajya Sabha Questions for Session 253. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-253",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-254-catalog-timeline",
		"date": "2024-12-26",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 254",
		"description": "Answers Data of Rajya Sabha Questions for Session 254. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-254",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-255-catalog-timeline",
		"date": "2024-03-11",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 255",
		"description": "Answers Data of Rajya Sabha Questions for Session 255. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-255",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-256-catalog-timeline",
		"date": "2025-02-17",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 256",
		"description": "Answers Data of Rajya Sabha Questions for Session 256. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-256",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-257-catalog-timeline",
		"date": "2025-02-17",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 257",
		"description": "Answers Data of Rajya Sabha Questions for Session 257. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-257",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-258-catalog-timeline",
		"date": "2023-05-19",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 258",
		"description": "Answers Data of Rajya Sabha Questions for Session 258. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-258",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-259-catalog-timeline",
		"date": "2024-01-23",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 259",
		"description": "Answers Data of Rajya Sabha Questions for Session 259. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-259",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-260-catalog-timeline",
		"date": "2024-03-11",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 260",
		"description": "Answers Data of Rajya Sabha Questions for Session 260. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-260",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-262-catalog-timeline",
		"date": "2025-02-12",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 262",
		"description": "Answers Data of Rajya Sabha Questions for Session 262. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-262",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-263-catalog-timeline",
		"date": "2025-02-12",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 263",
		"description": "Answers Data of Rajya Sabha Questions for Session 263. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-263",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-265-catalog-timeline",
		"date": "2025-02-17",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 265",
		"description": "Answers Data of Rajya Sabha Questions for Session 265. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-265",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-266-catalog-timeline",
		"date": "2025-07-31",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 266",
		"description": "Answers Data of Rajya Sabha Questions for Session 266. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-266",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-questions-session-267-catalog-timeline",
		"date": "2025-07-31",
		"house": "rajya-sabha",
		"type": "question_answered",
		"title": "Answers Data of Rajya Sabha Questions for Session 267",
		"description": "Answers Data of Rajya Sabha Questions for Session 267. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-267",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-rs-debates-english-catalog-timeline",
		"date": "2014-02-14",
		"house": "rajya-sabha",
		"type": "debate_published",
		"title": "Verbatim Debates of Rajya Sabha (English)",
		"description": "Open Government Data Platform India catalog for Rajya Sabha verbatim debate feeds. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://delhi.data.gov.in/catalog/verbatim-debates-rajya-sabha-english",
		"isDemoSeed": false
	},
	{
		"id": "data-gov-ls-debates-english-catalog-timeline",
		"date": "2017-02-17",
		"house": "lok-sabha",
		"type": "debate_published",
		"title": "Verbatim Debates of Lok Sabha (English)",
		"description": "Open Government Data Platform India catalog for Lok Sabha verbatim debate feeds. OGD metadata: catalog API unavailable; zip download advertised.",
		"source_url": "https://delhi.data.gov.in/catalog/verbatim-debates-lok-sabha-english",
		"isDemoSeed": false
	}
];
