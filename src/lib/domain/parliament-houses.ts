export type HouseCompositionEntry = {
	label: string;
	bloc: string;
	seats: number;
	tone: string;
	color: string;
	description: string;
};

export type ParliamentHouseSnapshot = {
	id: 'lok-sabha' | 'rajya-sabha';
	name: string;
	role: string;
	seatSummary: string;
	holderSummary: string;
	termSummary: string;
	primaryWork: string[];
	composition: HouseCompositionEntry[];
	sourceLabel: string;
	sourceUrl: string;
	asOf: string;
};

export const parliamentHouseSnapshots: ParliamentHouseSnapshot[] = [
	{
		id: 'lok-sabha',
		name: 'Lok Sabha',
		role: 'House of the People',
		seatSummary: '543 elected seats',
		holderSummary: 'NDA formed the government after the 2024 election. BJP is the largest single party, with NDA allies providing the governing majority.',
		termSummary: 'Directly elected. Normal term is five years unless dissolved earlier.',
		primaryWork: [
			'Controls government confidence and no-confidence votes.',
			'Origin House for Money Bills and the annual Budget.',
			'Debates, amends, and passes ordinary Bills with Rajya Sabha participation.'
		],
		composition: [
			{ label: 'BJP', bloc: 'NDA', seats: 240, tone: 'bg-orange-500', color: '#f59e0b', description: 'Largest party and core governing party in the 18th Lok Sabha.' },
			{ label: 'NDA allies', bloc: 'NDA', seats: 53, tone: 'bg-amber-400', color: '#facc15', description: 'Alliance partners supporting the NDA government.' },
			{ label: 'Congress', bloc: 'INDIA', seats: 99, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Largest opposition party and principal INDIA bloc party.' },
			{ label: 'INDIA allies', bloc: 'INDIA', seats: 135, tone: 'bg-blue-600', color: '#2563eb', description: 'Other parties in the INDIA opposition bloc.' },
			{ label: 'Others', bloc: 'Other', seats: 16, tone: 'bg-stone-400', color: '#9ca3af', description: 'Parties and independents outside the two main blocs.' }
		],
		sourceLabel: 'PRS 18th Lok Sabha profile',
		sourceUrl: 'https://prsindia.org/parliamenttrack/vital-stats/profile-of-the-18th-lok-sabha',
		asOf: '2024 election result snapshot'
	},
	{
		id: 'rajya-sabha',
		name: 'Rajya Sabha',
		role: 'Council of States',
		seatSummary: '245 current seats: 233 elected + 12 nominated',
		holderSummary: 'BJP is the largest party. The NDA-led side has a working majority, while Congress and other opposition parties hold the main counterweight.',
		termSummary: 'Permanent House. Members serve six-year terms, with about one-third retiring every two years.',
		primaryWork: [
			'Represents states and Union territories in national lawmaking.',
			'Reviews and amends ordinary Bills passed by Lok Sabha.',
			'Can recommend changes to Money Bills, but cannot block them beyond the constitutional window.'
		],
		composition: [
			{ label: 'BJP', bloc: 'NDA', seats: 113, tone: 'bg-orange-500', color: '#f97316', description: 'Largest party in the current Rajya Sabha snapshot.' },
			{ label: 'NDA allies / support', bloc: 'NDA', seats: 35, tone: 'bg-amber-400', color: '#facc15', description: 'Allied and supporting members counted with the NDA side.' },
			{ label: 'Congress', bloc: 'Opposition', seats: 27, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Largest national opposition party in the House.' },
			{ label: 'Other opposition / independents', bloc: 'Opposition / other', seats: 70, tone: 'bg-blue-600', color: '#2563eb', description: 'Other non-NDA parties and independent members in this working snapshot.' }
		],
		sourceLabel: 'Rajya Sabha party-position report',
		sourceUrl: 'https://indianexpress.com/article/india/rajya-sabha-tally-bjp-113-aap-mps-merge-10657868/',
		asOf: '28 Apr 2026 working snapshot'
	}
];
