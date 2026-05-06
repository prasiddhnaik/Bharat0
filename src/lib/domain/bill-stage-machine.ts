import type { BillStage, BillType, House, SectionId, SourceKind } from './types';

export const sectionLabels: Record<SectionId, string> = {
	overview: 'Overview',
	houses: 'Houses',
	states: 'States',
	timeline: 'Timeline',
	bills: 'Bills',
	committees: 'Committees',
	questions: 'Questions',
	debates: 'Debates',
	acts: 'Acts',
	sources: 'Sources'
};

export const houseLabels: Record<House, string> = {
	'lok-sabha': 'Lok Sabha',
	'rajya-sabha': 'Rajya Sabha',
	'joint-sitting': 'Joint Sitting',
	'state-assembly': 'State Assembly',
	'state-council': 'State Council'
};

export const billTypeLabels: Record<BillType, string> = {
	ordinary: 'Ordinary Bill',
	money: 'Money Bill',
	financial: 'Financial Bill',
	'constitutional-amendment': 'Constitution Amendment Bill'
};

export const stageLabels: Record<BillStage, string> = {
	draft: 'Draft',
	introduced: 'Introduced',
	listed: 'Listed',
	taken_up: 'Taken up',
	referred_committee: 'Referred to committee',
	committee_reported: 'Committee reported',
	passed_origin_house: 'Passed origin House',
	transmitted_to_other_house: 'Transmitted to other House',
	passed_second_house: 'Passed second House',
	returned_with_amendments: 'Returned with amendments',
	joint_sitting_possible: 'Joint sitting possible',
	joint_sitting_passed: 'Joint sitting passed',
	president_assent_pending: 'President assent pending',
	assented: 'Assented',
	act_published: 'Act published',
	withdrawn: 'Withdrawn',
	lapsed: 'Lapsed',
	introduced_lok_sabha: 'Introduced in Lok Sabha',
	passed_lok_sabha: 'Passed by Lok Sabha',
	sent_to_rajya_sabha: 'Sent to Rajya Sabha',
	rajya_sabha_recommendation_period: 'RS recommendation window',
	returned_with_recommendations: 'Returned with recommendations',
	deemed_passed_after_14_days: 'Deemed passed after 14 days'
};

export const sourceKindLabels: Record<SourceKind, string> = {
	sansad: 'Sansad',
	'lok-sabha': 'Lok Sabha',
	'rajya-sabha': 'Rajya Sabha',
	'india-code': 'India Code',
	'data-gov': 'data.gov.in',
	prs: 'PRS India',
	egazette: 'eGazette',
	neva: 'NeVA',
	'demo-seed': 'Sandbox source'
};

export function getStageTone(stage: BillStage): 'neutral' | 'active' | 'warning' | 'success' | 'danger' {
	if (stage === 'assented' || stage === 'act_published') return 'success';
	if (stage === 'lapsed' || stage === 'withdrawn') return 'danger';
	if (stage.includes('committee') || stage.includes('recommendation') || stage.includes('joint')) {
		return 'warning';
	}
	if (stage.includes('passed') || stage.includes('introduced') || stage.includes('listed')) return 'active';
	return 'neutral';
}

export function formatDate(value: string): string {
	return new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	}).format(new Date(`${value}T00:00:00+05:30`));
}

export function isSectionId(value: string | null): value is SectionId {
	return Boolean(value && value in sectionLabels);
}

export function isHouse(value: string | null): value is House {
	return Boolean(value && value in houseLabels);
}
