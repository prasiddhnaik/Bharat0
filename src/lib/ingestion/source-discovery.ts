import type { AdapterOutput, OfficialSourceAdapter } from './source-adapters';
import type { DataGovCatalogMetadata, PdlDiscoveryMetadata } from './source-metadata';

export type DiscoveryTargetKind = 'catalog' | 'api-catalog' | 'committee-surface' | 'document-library';

export type SourceDiscoveryTarget = {
	id: string;
	adapterId: OfficialSourceAdapter['id'];
	name: string;
	url: string;
	fallbackUrls?: string[];
	kind: DiscoveryTargetKind;
	outputs: AdapterOutput[];
	authority: OfficialSourceAdapter['authority'];
	notes: string;
};

export type SourceDiscoveryResult = SourceDiscoveryTarget & {
	ok: boolean;
	status: number | null;
	finalUrl: string | null;
	title: string | null;
	signals: string[];
	metadata?: {
		dataGovCatalog?: DataGovCatalogMetadata;
		pdl?: PdlDiscoveryMetadata;
	};
	error?: string;
};

function rajyaSabhaQuestionSessionTarget(session: number): SourceDiscoveryTarget {
	const slug = `answers-data-rajya-sabha-questions-session-${session}`;

	return {
		id: `data-gov-rs-questions-session-${session}`,
		adapterId: 'data-gov',
		name: `Rajya Sabha question-answer annexures, Session ${session}`,
		url: `https://www.data.gov.in/catalog/${slug}`,
		fallbackUrls: [
			`https://punjab.data.gov.in/catalog/${slug}`,
			`https://delhi.data.gov.in/catalog/${slug}`,
			`https://ap.data.gov.in/catalog/${slug}`
		],
		kind: 'catalog',
		outputs: ['questions', 'timeline_events'],
		authority: 'open-data',
		notes: 'Session-level catalog for Rajya Sabha question-answer annexure datasets; use as structured supplemental data linked back to Sansad question records.'
	};
}

export const dataGovDiscoveryTargets: SourceDiscoveryTarget[] = [
	...[
		249,
		250,
		251,
		253,
		254,
		255,
		256,
		257,
		258,
		259,
		260,
		262,
		263,
		265,
		266,
		267
	].map(rajyaSabhaQuestionSessionTarget),
	{
		id: 'data-gov-rs-debates-english',
		adapterId: 'data-gov',
		name: 'Rajya Sabha verbatim debates, English',
		url: 'https://delhi.data.gov.in/catalog/verbatim-debates-rajya-sabha-english',
		fallbackUrls: [
			'https://www.data.gov.in/catalog/verbatim-debates-rajya-sabha-english',
			'https://punjab.data.gov.in/catalog/verbatim-debates-rajya-sabha-english',
			'https://ap.data.gov.in/catalog/verbatim-debates-rajya-sabha-english'
		],
		kind: 'catalog',
		outputs: ['debates', 'timeline_events'],
		authority: 'open-data',
		notes: 'Debate catalog for discovering structured debate files and dates before mapping them to timeline events.'
	},
	{
		id: 'data-gov-ls-debates-english',
		adapterId: 'data-gov',
		name: 'Lok Sabha verbatim debates, English',
		url: 'https://delhi.data.gov.in/catalog/verbatim-debates-lok-sabha-english',
		fallbackUrls: [
			'https://www.data.gov.in/catalog/verbatim-debates-lok-sabha-english',
			'https://punjab.data.gov.in/catalog/verbatim-debates-lok-sabha-english',
			'https://ap.data.gov.in/catalog/verbatim-debates-lok-sabha-english'
		],
		kind: 'catalog',
		outputs: ['debates', 'timeline_events'],
		authority: 'open-data',
		notes: 'Debate catalog for Lok Sabha proceedings; use as a supplemental discovery source, not a Bill-status authority.'
	}
];

export const sansadCommitteeDiscoveryTargets: SourceDiscoveryTarget[] = [
	{
		id: 'sansad-ls-bills',
		adapterId: 'sansad',
		name: 'Lok Sabha Bills surface',
		url: 'https://sansad.in/ls/legislation/bills',
		kind: 'committee-surface',
		outputs: ['bills', 'bill_actions', 'acts', 'bill_committee_refs'],
		authority: 'union-parliament',
		notes: 'Primary Lok Sabha Bill table with Act, assent, gazette, and committee-referral fields available in page/API payloads.'
	},
	{
		id: 'sansad-rs-bills-with-committees',
		adapterId: 'sansad',
		name: 'Rajya Sabha Bills with Committees',
		url: 'https://sansad.in/rs/legislation/bills-with-committees',
		kind: 'committee-surface',
		outputs: ['bills', 'committees', 'committee_reports', 'bill_committee_refs'],
		authority: 'union-parliament',
		notes: 'Rajya Sabha committee-linked Bill surface for report/referral events.'
	},
	{
		id: 'pdl-committee-report-example',
		adapterId: 'lok-sabha',
		name: 'Parliament Digital Library committee-report documents',
		url: 'https://eparlib.sansad.in/handle/123456789/835465?view_type=search',
		kind: 'document-library',
		outputs: ['committee_reports', 'timeline_events'],
		authority: 'union-parliament',
		notes: 'Known PDL committee-report document pattern; use for PDF/report capture after metadata discovery.'
	},
	{
		id: 'pdl-ls-transcript-search',
		adapterId: 'lok-sabha',
		name: 'Parliament Digital Library transcript search',
		url: 'https://eparlib.sansad.in/simple-search?query=transcript&filter_field_1=type&filter_type_1=equals&filter_value_1=Part+2%28Other+than+Questions+And+Answers%29&rpp=20&sort_by=dc.date_dt&order=desc',
		kind: 'document-library',
		outputs: ['debates', 'timeline_events'],
		authority: 'union-parliament',
		notes: 'PDL search for transcript-backed debate entries; exposes handles, titles, dates, debate facets, Lok Sabha numbers, and PDF bitstreams on item pages.'
	},
	{
		id: 'pdl-ls-government-bill-debates',
		adapterId: 'lok-sabha',
		name: 'Parliament Digital Library government Bill debates',
		url: 'https://eparlib.sansad.in/simple-search?query=transcript&filter_field_1=type&filter_type_1=equals&filter_value_1=Part+2%28Other+than+Questions+And+Answers%29&filter_field_2=debate&filter_type_2=equals&filter_value_2=GOVERNMENT+BILLS&rpp=20&sort_by=dc.date_dt&order=desc',
		kind: 'document-library',
		outputs: ['bills', 'debates', 'timeline_events'],
		authority: 'union-parliament',
		notes: 'Focused PDL search for government Bill debate transcripts that can enrich bill-stage evidence with source handles and PDF transcript links.'
	}
];

export const sourceDiscoveryTargets: SourceDiscoveryTarget[] = [
	...dataGovDiscoveryTargets,
	...sansadCommitteeDiscoveryTargets
];

export function summarizeDiscoveryTargets(targets: SourceDiscoveryTarget[] = sourceDiscoveryTargets) {
	return targets.reduce(
		(summary, target) => {
			summary.byAdapter[target.adapterId] = (summary.byAdapter[target.adapterId] ?? 0) + 1;
			for (const output of target.outputs) {
				summary.byOutput[output] = (summary.byOutput[output] ?? 0) + 1;
			}
			return summary;
		},
		{ byAdapter: {}, byOutput: {} } as {
			byAdapter: Record<string, number>;
			byOutput: Partial<Record<AdapterOutput, number>>;
		}
	);
}
