import type { Debate } from '../domain/types';

export type ParliamentDebateItem = {
	id: string;
	name: string;
	handle: string;
	metadata: Record<string, Array<{ value: string }>>;
};

export function normalizeParliamentDebate(item: ParliamentDebateItem): Debate {
	const values = (key: string) => item.metadata[key]?.map(({ value }) => value) ?? [];
	const date = values('dc.date.issued')[0];
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) throw new Error(`Missing proceeding date for ${item.id}`);
	return {
		id: `sansad-debate-${item.id}`, house: 'lok-sabha', date, title: item.name,
		summary: `Official Parliament Digital Library index entry for ${item.name}. Full transcript text has not been imported for this entry.`,
		source_url: `https://elibrary.sansad.in/handle/${item.handle}`,
		members: values('dc.contributor.members'), transcript_language: values('dc.language.iso')[0],
		lok_sabha_number: values('dc.identifier.loksabhanumber')[0],
		session_number: values('dc.identifier.sessionnumber')[0], debate_type: 'GOVERNMENT BILLS', isDemoSeed: false
	};
}
