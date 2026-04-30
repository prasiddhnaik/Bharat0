import type { Act, Bill } from './types';

export type PartyPositionSide = 'supported' | 'opposed' | 'qualified';

export type PartyPosition = {
	side: PartyPositionSide;
	party: string;
	reason: string;
	evidence: string;
	sourceUrl: string;
};

export type ActPartyPositionSummary = {
	status: 'captured' | 'not-captured';
	voteNote: string;
	positions: PartyPosition[];
};

const actPartyPositionsByActId: Record<string, ActPartyPositionSummary> = {
	'tribhuvan-sahkari-university-act-2025': {
		status: 'captured',
		voteNote: 'Passed by voice vote; this is a debate-position read, not a recorded party-wise division.',
		positions: [
			{
				side: 'supported',
				party: 'BJP / NDA government',
				reason: 'Wanted the Act to create a national cooperative university, strengthen cooperative education and training, and address fragmented capacity-building infrastructure in the cooperative sector.',
				evidence: 'Amit Shah and the Ministry of Cooperation argued the university would build qualified cooperative manpower and strengthen the rural/cooperative economy.',
				sourceUrl: 'https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2115556'
			},
			{
				side: 'opposed',
				party: 'Congress',
				reason: 'Questioned the intent of converting IRMA into the new university, raised concern about corporatisation of cooperatives, and argued that Verghese Kurien had been sidelined in the naming debate.',
				evidence: 'Congress MPs raised objections in Lok Sabha/Rajya Sabha debate coverage; Indian Express reported the IRMA autonomy and Verghese Kurien objections.',
				sourceUrl: 'https://indianexpress.com/article/india/tribhuvandas-laid-foundation-of-amul-says-ait-shah-kurien-shaped-it-says-opposition-9908188/'
			},
			{
				side: 'opposed',
				party: 'BJD',
				reason: 'Objected that the Bill could centralise control over cooperative institutions under the Union government in the name of education.',
				evidence: 'Newsonair debate coverage reported BJD member Subhasish Khuntia alleging centralisation concerns.',
				sourceUrl: 'https://www.newsonair.gov.in/parliament-passes-tribhuvan-sahkari-university-bill-2025-to-establish-institute-of-rural-management/'
			},
			{
				side: 'qualified',
				party: 'AAP / YSRCP',
				reason: "Spoke positively or descriptively about the university's national-importance and cooperative education purpose, without the same objections captured for Congress/BJD in available coverage.",
				evidence: "Newsonair reported AAP welcoming national-importance status and YSRCP describing the university's education, training, and R&D role.",
				sourceUrl: 'https://www.newsonair.gov.in/parliament-passes-tribhuvan-sahkari-university-bill-2025-to-establish-institute-of-rural-management/'
			}
		]
	}
};

export function getActPartyPositions(act: Pick<Act, 'id'>, linkedBill?: Pick<Bill, 'ministry' | 'current_stage'> | null): ActPartyPositionSummary {
	const captured = actPartyPositionsByActId[act.id];
	if (captured) return captured;

	const ministry = linkedBill?.ministry.replace(/^Ministry of\s+/i, '') || 'the sponsoring ministry';
	return {
		status: 'not-captured',
		voteNote: 'No party-wise vote or debate-position record is captured for this Act yet.',
		positions: [
			{
				side: 'supported',
				party: 'Government / treasury benches',
				reason: `Likely supported passage because the Bill was sponsored through ${ministry}, but BharatZero has not captured party speeches or division data for this Act yet.`,
				evidence: 'Derived only from sponsorship metadata; needs debate transcript or division record before naming supporting and opposing parties.',
				sourceUrl: ''
			}
		]
	};
}
