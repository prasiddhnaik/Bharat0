import type { AdapterOutput, OfficialSourceAdapter } from './source-adapters';

export type DiscoveryTargetKind = 'catalog' | 'api-catalog' | 'committee-surface' | 'document-library';

export type SourceDiscoveryTarget = {
	id: string;
	adapterId: OfficialSourceAdapter['id'];
	name: string;
	url: string;
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
	error?: string;
};

export const dataGovDiscoveryTargets: SourceDiscoveryTarget[] = [
	{
		id: 'data-gov-rs-questions-session-267',
		adapterId: 'data-gov',
		name: 'Rajya Sabha question-answer annexures, Session 267',
		url: 'https://punjab.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-267',
		kind: 'catalog',
		outputs: ['questions', 'timeline_events'],
		authority: 'open-data',
		notes: 'Session-level catalog for Rajya Sabha question-answer annexure datasets; use as structured supplemental data linked back to Sansad question records.'
	},
	{
		id: 'data-gov-rs-questions-session-265',
		adapterId: 'data-gov',
		name: 'Rajya Sabha question-answer annexures, Session 265',
		url: 'https://ap.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-265',
		kind: 'catalog',
		outputs: ['questions', 'timeline_events'],
		authority: 'open-data',
		notes: 'Recent stable question-answer annexure catalog with Catalog API and Zip Download surfaces.'
	},
	{
		id: 'data-gov-rs-debates-english',
		adapterId: 'data-gov',
		name: 'Rajya Sabha verbatim debates, English',
		url: 'https://ap.data.gov.in/catalog/verbatim-debates-rajya-sabha-english',
		kind: 'catalog',
		outputs: ['debates', 'timeline_events'],
		authority: 'open-data',
		notes: 'Debate catalog for discovering structured debate files and dates before mapping them to timeline events.'
	},
	{
		id: 'data-gov-ls-debates-english',
		adapterId: 'data-gov',
		name: 'Lok Sabha verbatim debates, English',
		url: 'https://ap.data.gov.in/catalog/verbatim-debates-lok-sabha-english',
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
