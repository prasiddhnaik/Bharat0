import type { Bill, BillStage } from './types';

type EconomicImpactConfidence = 'low' | 'medium';

export type EconomicImpactProfile = {
	category: string;
	timingWindow: string;
	stageReadiness: string;
	primaryChannels: string[];
	direction: string;
	confidence: EconomicImpactConfidence;
	confidenceReason: string;
	dataNeeded: string[];
};

type EconomicImpactRule = {
	category: string;
	match: RegExp;
	channels: string[];
	direction: string;
	dataNeeded: string[];
};

const generatedSummaryPattern = / is a .* from .* with status .* in the Sansad legislation dataset\.?$/i;

const impactRules: EconomicImpactRule[] = [
	{
		category: 'Fiscal, tax, and budget',
		match: /appropriation|finance bill|tax|gst|customs|excise|budget|cess|duty|public debt|consolidated fund/,
		channels: ['tax liability', 'public spending authority', 'borrowing needs', 'household disposable income'],
		direction: 'direct if clauses change rates, exemptions, duties, or authorised expenditure; otherwise mostly administrative',
		dataNeeded: ['Budget documents', 'tax receipt series', 'expenditure heads', 'implementation notifications']
	},
	{
		category: 'Financial sector and credit',
		match: /bank|banking|insurance|securities|rbi|reserve bank|pension|credit|deposit|financial|payment|insolvency/,
		channels: ['credit availability', 'financial stability', 'compliance costs', 'capital allocation'],
		direction: 'usually indirect through lending conditions, investor confidence, risk pricing, or resolution speed',
		dataNeeded: ['RBI/SEBI/IRDAI rules', 'credit growth', 'non-performing asset data', 'market activity indicators']
	},
	{
		category: 'Business regulation and investment',
		match: /company|corporate|competition|commerce|industry|sez|special economic zone|investment|contract|trade marks?|patent/,
		channels: ['business entry and exit costs', 'competition', 'private investment', 'formal-sector productivity'],
		direction: 'positive if it lowers friction or improves certainty; negative if compliance costs rise without offsetting gains',
		dataNeeded: ['affected Act clauses', 'regulator rules', 'firm compliance indicators', 'sector investment data']
	},
	{
		category: 'Infrastructure, energy, and logistics',
		match: /transport|highway|rail|railway|shipping|port|aviation|airport|power|electricity|energy|infrastructure|telecom|mines?|coal|petroleum/,
		channels: ['logistics costs', 'capacity creation', 'energy reliability', 'private investment', 'sector productivity'],
		direction: 'can be material where approvals, tariffs, safety rules, regulator powers, or project delivery change',
		dataNeeded: ['project pipelines', 'tariffs', 'regulator orders', 'traffic/output indicators']
	},
	{
		category: 'Human capital and labour',
		match: /health|medical|education|skill|university|school|labour|labor|employment|workers?|wage|social security/,
		channels: ['human capital', 'labour-force participation', 'worker protection costs', 'household welfare'],
		direction: 'mostly medium-to-long run unless the bill changes spending, payroll costs, or service capacity immediately',
		dataNeeded: ['scheme spending', 'enrolment/access data', 'employment indicators', 'wage and productivity series']
	},
	{
		category: 'Agriculture, food, land, and environment',
		match: /agriculture|farm|fisher|animal husbandry|dairy|food|rural|land|water|environment|forest|climate|pollution|biodiversity/,
		channels: ['rural incomes', 'producer incentives', 'food supply', 'resource use', 'environmental compliance'],
		direction: 'depends on whether obligations, compensation, permits, procurement, or market incentives change',
		dataNeeded: ['commodity prices', 'rural spending', 'clearance data', 'affected producer groups']
	},
	{
		category: 'Digital, data, and communications',
		match: /digital|data|telecommunication|internet|cyber|information technology|broadcast|postal|aadhaar/,
		channels: ['digital compliance costs', 'platform investment', 'consumer trust', 'service delivery productivity'],
		direction: 'usually indirect through compliance burden, market structure, data access, and digital adoption',
		dataNeeded: ['regulator rules', 'platform compliance costs', 'sector revenue', 'adoption and service-quality indicators']
	},
	{
		category: 'Justice, security, and administration',
		match: /criminal|police|security|migration|citizenship|border|justice|court|tribunal|arbitration|home affairs|election|delimitation/,
		channels: ['administrative certainty', 'dispute resolution speed', 'enforcement costs', 'citizen or business compliance burden'],
		direction: 'mostly indirect unless it materially changes enforcement capacity, legal certainty, or compliance costs at scale',
		dataNeeded: ['affected procedures', 'court or tribunal capacity', 'enforcement spending', 'compliance obligations']
	}
];

export function getEconomicImpactProfile(bill: Bill, analysisDate = new Date().toISOString().slice(0, 10)): EconomicImpactProfile {
	const ministry = normalizeMinistry(bill.ministry);
	const combinedText = `${bill.title_en} ${bill.summary ?? ''} ${ministry}`.toLowerCase();
	const selected = impactRules.find((rule) => rule.match.test(combinedText)) ?? {
		category: `General ${ministry} policy`,
		channels: ['public spending', 'compliance costs', 'investment incentives', 'productivity', `demand in ${ministry}`],
		direction: 'depends on the actual obligations, funding changes, enforcement design, and implementation rules',
		dataNeeded: ['bill clauses', 'budget links', 'implementation rules', 'sector-output indicators']
	};
	const ageYears = getBillAgeYears(bill.introduced_on, analysisDate);
	const isImplementationStage = bill.current_stage === 'act_published' || bill.current_stage === 'assented';
	const hasUsableSummary = Boolean(bill.summary?.trim()) && !generatedSummaryPattern.test(bill.summary.trim());
	const confidence = hasUsableSummary ? 'medium' : 'low';
	const timingWindow = isImplementationStage
		? 'Implementation read; use actual notifications, spending, compliance, and sector data rather than predicted effects.'
		: ageYears !== null && ageYears >= 10
			? 'Long-run or retrospective read; use historical indicators rather than near-term forecasts.'
			: 'Near-term qualitative read; focus on the first implementation and compliance channels.';

	return {
		category: selected.category,
		timingWindow,
		stageReadiness: getStageReadiness(bill.current_stage),
		primaryChannels: selected.channels,
		direction: selected.direction,
		confidence,
		confidenceReason: hasUsableSummary
			? 'The record has a usable summary, but no linked GDP, budget, fiscal, or sector-output series yet.'
			: 'Only title, ministry, stage, and source metadata are available until source text and economic datasets are connected.',
		dataNeeded: selected.dataNeeded
	};
}

export function formatEconomicImpactForPanel(bill: Bill, analysisDate?: string) {
	const profile = getEconomicImpactProfile(bill, analysisDate);
	return [
		`${profile.timingWindow} Stage read: ${profile.stageReadiness}`,
		`Transmission: ${formatList(profile.primaryChannels)}.`,
		`Direction: ${profile.direction}.`,
		`Confidence: ${profile.confidence}; ${profile.confidenceReason}`,
		`Verify with: ${formatList(profile.dataNeeded)}.`
	].join(' ');
}

function normalizeMinistry(ministry: string) {
	return ministry.replace(/^Ministry of\s+/i, '').trim() || 'the listed policy area';
}

function getBillAgeYears(introducedOn: string, analysisDate: string) {
	const introducedYear = Number(introducedOn.slice(0, 4));
	const analysisYear = Number(analysisDate.slice(0, 4));
	return Number.isFinite(introducedYear) && Number.isFinite(analysisYear) ? analysisYear - introducedYear : null;
}

function getStageReadiness(stage: BillStage) {
	if (stage === 'act_published' || stage === 'assented') {
		return 'implementation data may exist, so observed evidence should lead the read.';
	}
	if (stage === 'president_assent_pending' || stage === 'passed_second_house' || stage === 'deemed_passed_after_14_days') {
		return 'legislative risk is low, but rules, commencement, and budget execution still determine impact.';
	}
	if (stage === 'withdrawn' || stage === 'lapsed') {
		return 'economic impact should be treated as unrealised unless later legislation revived the same provisions.';
	}
	if (stage === 'referred_committee' || stage === 'committee_reported') {
		return 'committee evidence can materially change the impact read, so watch report findings and amendments.';
	}
	return 'impact is still potential because the bill is early in the legislative path.';
}

function formatList(items: string[]) {
	if (items.length <= 1) return items[0] ?? '';
	if (items.length === 2) return `${items[0]} and ${items[1]}`;
	return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}
