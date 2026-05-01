import type { House, SourceKind } from '$lib/domain/types';

export type AdapterStatus = 'prepared-contract' | 'future-adapter';
export type IngestionPipelineStep =
	| 'source_capture'
	| 'normalization'
	| 'stage_resolution'
	| 'read_model_publish';

export type AdapterOutput =
	| 'bills'
	| 'bill_actions'
	| 'sitting_days'
	| 'timeline_events'
	| 'committees'
	| 'questions'
	| 'debates'
	| 'committee_reports'
	| 'bill_committee_refs'
	| 'acts'
	| 'gazette_notifications'
	| 'state_legislature_events';

export type OfficialSourceAdapter = {
	id: SourceKind;
	name: string;
	baseUrl: string;
	status: AdapterStatus;
	authority: 'union-parliament' | 'union-law' | 'open-data' | 'gazette' | 'state-legislature';
	supportedHouses: House[];
	outputs: AdapterOutput[];
	notes: string;
};

export const ingestionPipelineSteps: IngestionPipelineStep[] = [
	'source_capture',
	'normalization',
	'stage_resolution',
	'read_model_publish'
];

export const officialSourceAdapters: OfficialSourceAdapter[] = [
	{
		id: 'sansad',
		name: 'Sansad portal',
		baseUrl: 'https://sansad.in/',
		status: 'prepared-contract',
		authority: 'union-parliament',
		supportedHouses: ['lok-sabha', 'rajya-sabha'],
		outputs: [
			'bills',
			'bill_actions',
			'sitting_days',
			'timeline_events',
			'questions',
			'debates',
			'committees',
			'committee_reports',
			'bill_committee_refs',
			'acts'
		],
		notes:
			'Primary Bill-status source. scripts/sync-sansad-legislation.ts targets the Sansad legislation API path and falls back to a public mirrored JSON export when the live endpoint rejects direct server fetches. scripts/discover-source-catalogs.ts audits committee-report and Bill-with-committee surfaces before a write adapter is added.'
	},
	{
		id: 'lok-sabha',
		name: 'Lok Sabha official pages',
		baseUrl: 'https://sansad.in/ls',
		status: 'future-adapter',
		authority: 'union-parliament',
		supportedHouses: ['lok-sabha'],
		outputs: ['bills', 'bill_actions', 'sitting_days', 'timeline_events', 'questions', 'debates', 'committees'],
		notes: 'Future adapter target for Lok Sabha Bills, agenda, questions, debates, and committee references.'
	},
	{
		id: 'rajya-sabha',
		name: 'Rajya Sabha official pages',
		baseUrl: 'https://sansad.in/rs',
		status: 'future-adapter',
		authority: 'union-parliament',
		supportedHouses: ['rajya-sabha'],
		outputs: ['bills', 'bill_actions', 'sitting_days', 'timeline_events', 'questions', 'debates', 'committees'],
		notes: 'Future adapter target for Rajya Sabha business, including Money Bill recommendation-window events.'
	},
	{
		id: 'india-code',
		name: 'India Code',
		baseUrl: 'https://www.indiacode.nic.in/',
		status: 'future-adapter',
		authority: 'union-law',
		supportedHouses: ['lok-sabha', 'rajya-sabha', 'state-assembly', 'state-council'],
		outputs: ['acts'],
		notes: 'Future canonical linkage for enacted law text, Act numbers, central Acts, state Acts, and bilingual access.'
	},
	{
		id: 'data-gov',
		name: 'Open Government Data Platform India',
		baseUrl: 'https://data.gov.in/',
		status: 'prepared-contract',
		authority: 'open-data',
		supportedHouses: ['lok-sabha', 'rajya-sabha'],
		outputs: ['questions', 'debates', 'timeline_events'],
		notes:
			'Supplemental structured catalog source for Rajya Sabha question-answer annexures and Lok Sabha/Rajya Sabha debate datasets. scripts/discover-source-catalogs.ts audits catalog/API availability without writing production rows.'
	},
	{
		id: 'egazette',
		name: 'eGazette',
		baseUrl: 'https://egazette.nic.in/',
		status: 'future-adapter',
		authority: 'gazette',
		supportedHouses: ['lok-sabha', 'rajya-sabha'],
		outputs: ['gazette_notifications', 'timeline_events'],
		notes: 'Future post-assent publication and notification trail adapter.'
	},
	{
		id: 'neva',
		name: 'NeVA',
		baseUrl: 'https://neva.gov.in/',
		status: 'future-adapter',
		authority: 'state-legislature',
		supportedHouses: ['state-assembly', 'state-council'],
		outputs: ['state_legislature_events', 'bills', 'questions', 'debates', 'committees'],
		notes: 'Future expansion path for Vidhan Sabha and Vidhan Parishad activity through state legislature sources.'
	}
];

export function getPreparedSourceAdapters(): OfficialSourceAdapter[] {
	return officialSourceAdapters.filter(
		(adapter) => adapter.status === 'prepared-contract' || adapter.status === 'future-adapter'
	);
}

export function getAdapterOutputSummary(): Record<AdapterOutput, number> {
	return officialSourceAdapters.reduce(
		(summary, adapter) => {
			for (const output of adapter.outputs) {
				summary[output] = (summary[output] ?? 0) + 1;
			}
			return summary;
		},
		{} as Record<AdapterOutput, number>
	);
}
