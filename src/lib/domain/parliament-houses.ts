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

export type LokSabhaPowerSnapshot = {
	primeMinisterTermIds: string[];
	lokSabha: string;
	period: string;
	electionYear: number;
	largestParty: string;
	largestPartySeats: number;
	runnerUpParty: string;
	runnerUpSeats: number;
	governingSide: string;
	governingSeats?: number;
	majorityMark: number;
	powerSummary: string;
	composition: HouseCompositionEntry[];
	sourceLabel: string;
	sourceUrl: string;
	asOf: string;
};

export const lokSabhaPowerSnapshots: LokSabhaPowerSnapshot[] = [
	{
		primeMinisterTermIds: ['modi-3'],
		lokSabha: '18th Lok Sabha',
		period: '2024-present',
		electionYear: 2024,
		largestParty: 'BJP',
		largestPartySeats: 240,
		runnerUpParty: 'INC',
		runnerUpSeats: 99,
		governingSide: 'NDA',
		governingSeats: 293,
		majorityMark: 272,
		powerSummary: 'BJP was the largest party, and the NDA formed government with allies above the majority mark.',
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
		primeMinisterTermIds: ['modi-2'],
		lokSabha: '17th Lok Sabha',
		period: '2019-2024',
		electionYear: 2019,
		largestParty: 'BJP',
		largestPartySeats: 303,
		runnerUpParty: 'INC',
		runnerUpSeats: 52,
		governingSide: 'BJP-led NDA',
		governingSeats: 353,
		majorityMark: 272,
		powerSummary: 'BJP held a single-party majority and led the NDA government in the 17th Lok Sabha.',
		composition: [
			{ label: 'BJP', bloc: 'NDA', seats: 303, tone: 'bg-orange-500', color: '#f59e0b', description: 'Largest party with a single-party majority.' },
			{ label: 'NDA allies', bloc: 'NDA', seats: 50, tone: 'bg-amber-400', color: '#facc15', description: 'Allied parties supporting the government side.' },
			{ label: 'Congress', bloc: 'Opposition', seats: 52, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Largest opposition party.' },
			{ label: 'Other opposition / independents', bloc: 'Opposition / other', seats: 138, tone: 'bg-blue-600', color: '#2563eb', description: 'Other non-NDA parties and independents.' }
		],
		sourceLabel: 'PRS 17th Lok Sabha profile',
		sourceUrl: 'https://prsindia.org/parliamenttrack/vital-stats/profile-of-the-newly-elected-17th-lok-sabha',
		asOf: '2019 election result snapshot'
	},
	{
		primeMinisterTermIds: ['modi-1'],
		lokSabha: '16th Lok Sabha',
		period: '2014-2019',
		electionYear: 2014,
		largestParty: 'BJP',
		largestPartySeats: 282,
		runnerUpParty: 'INC',
		runnerUpSeats: 44,
		governingSide: 'BJP-led NDA',
		governingSeats: 336,
		majorityMark: 272,
		powerSummary: 'BJP crossed the majority mark on its own and led the NDA government.',
		composition: [
			{ label: 'BJP', bloc: 'NDA', seats: 282, tone: 'bg-orange-500', color: '#f59e0b', description: 'Largest party with a single-party majority.' },
			{ label: 'NDA allies', bloc: 'NDA', seats: 54, tone: 'bg-amber-400', color: '#facc15', description: 'Allied parties supporting the government side.' },
			{ label: 'Congress', bloc: 'Opposition', seats: 44, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Largest opposition party by seats.' },
			{ label: 'Others', bloc: 'Opposition / other', seats: 163, tone: 'bg-blue-600', color: '#2563eb', description: 'Other non-NDA parties and independents.' }
		],
		sourceLabel: 'ECI Electoral Statistics 2014',
		sourceUrl: 'https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgIqrm67anC%2BR4pQ17IsPBqcN8HUDorExe9rYl3FchHJmfoE%2F%2BGPsxsIi5c9beR2G6o11B96m0gD2C%2FLSkmZe26pRW6r6HXZmrh0r3Gyxg1jYfoExPUm7D1dAdV4SXCkdo6Q%3D%3D',
		asOf: '2014 election result snapshot'
	},
	{
		primeMinisterTermIds: ['manmohan-singh-2'],
		lokSabha: '15th Lok Sabha',
		period: '2009-2014',
		electionYear: 2009,
		largestParty: 'INC',
		largestPartySeats: 206,
		runnerUpParty: 'BJP',
		runnerUpSeats: 116,
		governingSide: 'Congress-led UPA',
		governingSeats: 262,
		majorityMark: 272,
		powerSummary: 'Congress was the largest party and led the UPA government with outside/supporting parties around the majority line.',
		composition: [
			{ label: 'Congress', bloc: 'UPA', seats: 206, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Largest party and core governing party.' },
			{ label: 'UPA allies / support', bloc: 'UPA', seats: 56, tone: 'bg-blue-500', color: '#3b82f6', description: 'Allied and supporting parties on the government side.' },
			{ label: 'BJP', bloc: 'NDA', seats: 116, tone: 'bg-orange-500', color: '#f59e0b', description: 'Largest opposition party.' },
			{ label: 'Others', bloc: 'Other', seats: 165, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI Electoral Statistics 2009',
		sourceUrl: 'https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgIqrm67anC%2BR4pQ17IsPBqcN8HUDorExe9rYl3FchHJmfoE%2F%2BGPsxsIi5c9beR2G6o11B96m0gD2C%2FLSkmZe26pRW6r6HXZmrh0r3Gyxg1jYfoExPUm7D1dAdV4SXCkdo6Q%3D%3D',
		asOf: '2009 election result snapshot'
	},
	{
		primeMinisterTermIds: ['manmohan-singh-1'],
		lokSabha: '14th Lok Sabha',
		period: '2004-2009',
		electionYear: 2004,
		largestParty: 'INC',
		largestPartySeats: 145,
		runnerUpParty: 'BJP',
		runnerUpSeats: 138,
		governingSide: 'Congress-led UPA',
		governingSeats: 218,
		majorityMark: 272,
		powerSummary: 'Congress was the largest party and formed the UPA government with coalition partners and outside support.',
		composition: [
			{ label: 'Congress', bloc: 'UPA', seats: 145, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Largest party and core governing party.' },
			{ label: 'UPA allies / support', bloc: 'UPA', seats: 73, tone: 'bg-blue-500', color: '#3b82f6', description: 'Coalition partners and outside supporters enabling the government.' },
			{ label: 'BJP', bloc: 'NDA', seats: 138, tone: 'bg-orange-500', color: '#f59e0b', description: 'Largest opposition party.' },
			{ label: 'Others', bloc: 'Other', seats: 187, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI Electoral Statistics 2004',
		sourceUrl: 'https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgIqrm67anC%2BR4pQ17IsPBqcN8HUDorExe9rYl3FchHJmfoE%2F%2BGPsxsIi5c9beR2G6o11B96m0gD2C%2FLSkmZe26pRW6r6HXZmrh0r3Gyxg1jYfoExPUm7D1dAdV4SXCkdo6Q%3D%3D',
		asOf: '2004 election result snapshot'
	},
	{
		primeMinisterTermIds: ['vajpayee-3'],
		lokSabha: '13th Lok Sabha',
		period: '1999-2004',
		electionYear: 1999,
		largestParty: 'BJP',
		largestPartySeats: 182,
		runnerUpParty: 'INC',
		runnerUpSeats: 114,
		governingSide: 'BJP-led NDA',
		governingSeats: 296,
		majorityMark: 272,
		powerSummary: 'BJP remained the largest party, and the NDA held a Lok Sabha majority.',
		composition: [
			{ label: 'BJP', bloc: 'NDA', seats: 182, tone: 'bg-orange-500', color: '#f59e0b', description: 'Largest party and core governing party.' },
			{ label: 'NDA allies', bloc: 'NDA', seats: 114, tone: 'bg-amber-400', color: '#facc15', description: 'Allied parties making the NDA majority.' },
			{ label: 'Congress and allies', bloc: 'Opposition', seats: 137, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Main opposition grouping.' },
			{ label: 'Left Front', bloc: 'Opposition', seats: 43, tone: 'bg-red-500', color: '#ef4444', description: 'Left Front opposition bloc.' },
			{ label: 'Others', bloc: 'Other', seats: 67, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'IPU 1999 Lok Sabha election summary',
		sourceUrl: 'https://data.ipu.org/election-summary/HTML/2145_99.htm',
		asOf: '1999 election result snapshot'
	},
	{
		primeMinisterTermIds: ['vajpayee-2'],
		lokSabha: '12th Lok Sabha',
		period: '1998-1999',
		electionYear: 1998,
		largestParty: 'BJP',
		largestPartySeats: 182,
		runnerUpParty: 'INC',
		runnerUpSeats: 141,
		governingSide: 'BJP-led support bloc',
		governingSeats: 265,
		majorityMark: 272,
		powerSummary: 'BJP was the largest party; post-election allies and support let Vajpayee form government even though the shown bloc was below the 272-seat majority mark.',
		composition: [
			{ label: 'BJP', bloc: 'BJP-led support', seats: 182, tone: 'bg-orange-500', color: '#f59e0b', description: 'Largest party and core governing party.' },
			{ label: 'BJP allies / support', bloc: 'BJP-led support', seats: 83, tone: 'bg-amber-400', color: '#facc15', description: 'Allied and supporting members making the Vajpayee government viable, while still short of a full-seat majority mark.' },
			{ label: 'Congress', bloc: 'Opposition', seats: 141, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Largest opposition party.' },
			{ label: 'Left / regional opposition', bloc: 'Opposition', seats: 41, tone: 'bg-red-500', color: '#ef4444', description: 'Left and regional opposition parties.' },
			{ label: 'Others', bloc: 'Other', seats: 96, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI/IPU 1998 Lok Sabha summary',
		sourceUrl: 'https://data.ipu.org/election-summary/HTML/2145_98.htm',
		asOf: '1998 election result snapshot'
	},
	{
		primeMinisterTermIds: ['vajpayee-1', 'deve-gowda', 'gujral'],
		lokSabha: '11th Lok Sabha',
		period: '1996-1998',
		electionYear: 1996,
		largestParty: 'BJP',
		largestPartySeats: 161,
		runnerUpParty: 'INC',
		runnerUpSeats: 140,
		governingSide: 'Fragmented House',
		majorityMark: 272,
		powerSummary: 'BJP was the largest single party, but the House was fragmented; United Front governments later governed with Congress support.',
		composition: [
			{ label: 'BJP', bloc: 'Largest party', seats: 161, tone: 'bg-orange-500', color: '#f59e0b', description: 'Largest single party after the 1996 election.' },
			{ label: 'Congress', bloc: 'Support / opposition', seats: 140, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Second largest party; later supported United Front governments from outside.' },
			{ label: 'United Front / regional', bloc: 'United Front', seats: 233, tone: 'bg-blue-600', color: '#2563eb', description: 'Regional and Left parties central to the non-BJP governments.' },
			{ label: 'Others', bloc: 'Other', seats: 9, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI Electoral Statistics 1996',
		sourceUrl: 'https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgIqrm67anC%2BR4pQ17IsPBqcN8HUDorExe9rYl3FchHJmfoE%2F%2BGPsxsIi5c9beR2G6o11B96m0gD2C%2FLSkmZe26pRW6r6HXZmrh0r3Gyxg1jYfoExPUm7D1dAdV4SXCkdo6Q%3D%3D',
		asOf: '1996 election result snapshot'
	},
	{
		primeMinisterTermIds: ['narasimha-rao'],
		lokSabha: '10th Lok Sabha',
		period: '1991-1996',
		electionYear: 1991,
		largestParty: 'INC',
		largestPartySeats: 244,
		runnerUpParty: 'BJP',
		runnerUpSeats: 120,
		governingSide: 'INC minority government',
		majorityMark: 268,
		powerSummary: 'Congress was the largest party and formed a minority government under P. V. Narasimha Rao.',
		composition: [
			{ label: 'Congress', bloc: 'Government', seats: 244, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Largest party and minority government.' },
			{ label: 'BJP', bloc: 'Opposition', seats: 120, tone: 'bg-orange-500', color: '#f59e0b', description: 'Second largest party.' },
			{ label: 'Janata Dal / Left', bloc: 'Opposition', seats: 111, tone: 'bg-blue-600', color: '#2563eb', description: 'Major non-Congress opposition parties.' },
			{ label: 'Others', bloc: 'Other', seats: 59, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI Electoral Statistics 1991',
		sourceUrl: 'https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgIqrm67anC%2BR4pQ17IsPBqcN8HUDorExe9rYl3FchHJmfoE%2F%2BGPsxsIi5c9beR2G6o11B96m0gD2C%2FLSkmZe26pRW6r6HXZmrh0r3Gyxg1jYfoExPUm7D1dAdV4SXCkdo6Q%3D%3D',
		asOf: '1991-92 election result snapshot'
	},
	{
		primeMinisterTermIds: ['vp-singh', 'chandra-shekhar'],
		lokSabha: '9th Lok Sabha',
		period: '1989-1991',
		electionYear: 1989,
		largestParty: 'INC',
		largestPartySeats: 197,
		runnerUpParty: 'JD',
		runnerUpSeats: 143,
		governingSide: 'National Front / later SJP with outside support',
		majorityMark: 265,
		powerSummary: 'Congress was the largest party, but non-Congress governments formed from Janata Dal and later Chandra Shekhar’s breakaway group with outside support.',
		composition: [
			{ label: 'Congress', bloc: 'Largest party', seats: 197, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Largest single party in the 9th Lok Sabha.' },
			{ label: 'Janata Dal', bloc: 'National Front', seats: 143, tone: 'bg-blue-600', color: '#2563eb', description: 'Core party of the V. P. Singh government.' },
			{ label: 'BJP', bloc: 'Outside support / opposition', seats: 85, tone: 'bg-orange-500', color: '#f59e0b', description: 'Major outside supporter of the National Front government before withdrawing support.' },
			{ label: 'Left / regional parties', bloc: 'Support / opposition', seats: 52, tone: 'bg-red-500', color: '#ef4444', description: 'Left and regional parties influential in the fragmented House.' },
			{ label: 'Others', bloc: 'Other', seats: 52, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI/IPU 1989 Lok Sabha summary',
		sourceUrl: 'https://data.ipu.org/election-summary/HTML/2145_89.htm',
		asOf: '1989 election result snapshot'
	},
	{
		primeMinisterTermIds: ['rajiv-gandhi'],
		lokSabha: '8th Lok Sabha',
		period: '1984-1989',
		electionYear: 1984,
		largestParty: 'INC',
		largestPartySeats: 424,
		runnerUpParty: 'CPM',
		runnerUpSeats: 22,
		governingSide: 'Congress majority government',
		governingSeats: 424,
		majorityMark: 271,
		powerSummary: 'Congress held an overwhelming single-party majority under Rajiv Gandhi in the 8th Lok Sabha.',
		composition: [
			{ label: 'Congress', bloc: 'Government', seats: 424, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Dominant governing party with a large majority.' },
			{ label: 'CPM', bloc: 'Opposition', seats: 22, tone: 'bg-red-500', color: '#ef4444', description: 'Second largest party by seats.' },
			{ label: 'Other opposition', bloc: 'Opposition / other', seats: 95, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI Electoral Statistics 1984-85',
		sourceUrl: 'https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgIqrm67anC%2BR4pQ17IsPBqcN8HUDorExe9rYl3FchHJmfoE%2F%2BGPsxsIi5c9beR2G6o11B96m0gD2C%2FLSkmZe26pRW6r6HXZmrh0r3Gyxg1jYfoExPUm7D1dAdV4SXCkdo6Q%3D%3D',
		asOf: '1984-85 election result snapshot'
	},
	{
		primeMinisterTermIds: ['indira-gandhi-2'],
		lokSabha: '7th Lok Sabha',
		period: '1980-1984',
		electionYear: 1980,
		largestParty: 'INC(I)',
		largestPartySeats: 353,
		runnerUpParty: 'JNP(S)',
		runnerUpSeats: 41,
		governingSide: 'Congress (I) majority government',
		governingSeats: 353,
		majorityMark: 265,
		powerSummary: 'Congress (I) returned with a clear single-party majority under Indira Gandhi in the 7th Lok Sabha.',
		composition: [
			{ label: 'Congress (I)', bloc: 'Government', seats: 353, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Largest party and governing majority.' },
			{ label: 'JNP(S)', bloc: 'Opposition', seats: 41, tone: 'bg-blue-600', color: '#2563eb', description: 'Second largest party by seats.' },
			{ label: 'Others', bloc: 'Opposition / other', seats: 135, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI Electoral Statistics 1980',
		sourceUrl: 'https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgIqrm67anC%2BR4pQ17IsPBqcN8HUDorExe9rYl3FchHJmfoE%2F%2BGPsxsIi5c9beR2G6o11B96m0gD2C%2FLSkmZe26pRW6r6HXZmrh0r3Gyxg1jYfoExPUm7D1dAdV4SXCkdo6Q%3D%3D',
		asOf: '1980 election result snapshot'
	},
	{
		primeMinisterTermIds: ['morarji-desai', 'charan-singh'],
		lokSabha: '6th Lok Sabha',
		period: '1977-1980',
		electionYear: 1977,
		largestParty: 'BLD / Janata',
		largestPartySeats: 295,
		runnerUpParty: 'INC',
		runnerUpSeats: 154,
		governingSide: 'Janata majority, later split government',
		governingSeats: 295,
		majorityMark: 272,
		powerSummary: 'The Janata bloc won the post-Emergency majority; later splits produced the Charan Singh government with outside support.',
		composition: [
			{ label: 'BLD / Janata', bloc: 'Government', seats: 295, tone: 'bg-blue-600', color: '#2563eb', description: 'Largest governing bloc after the 1977 election.' },
			{ label: 'Congress', bloc: 'Opposition', seats: 154, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Main opposition party after the Emergency election.' },
			{ label: 'Others', bloc: 'Other', seats: 93, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI Electoral Statistics 1977',
		sourceUrl: 'https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgIqrm67anC%2BR4pQ17IsPBqcN8HUDorExe9rYl3FchHJmfoE%2F%2BGPsxsIi5c9beR2G6o11B96m0gD2C%2FLSkmZe26pRW6r6HXZmrh0r3Gyxg1jYfoExPUm7D1dAdV4SXCkdo6Q%3D%3D',
		asOf: '1977 election result snapshot'
	},
	{
		primeMinisterTermIds: ['indira-gandhi-1'],
		lokSabha: '3rd-5th Lok Sabha',
		period: '1966-1977',
		electionYear: 1971,
		largestParty: 'INC',
		largestPartySeats: 352,
		runnerUpParty: 'CPM',
		runnerUpSeats: 25,
		governingSide: 'Congress majority government',
		governingSeats: 352,
		majorityMark: 260,
		powerSummary: 'Indira Gandhi’s first premiership spans the 3rd, 4th, and 5th Lok Sabhas; this chart uses the 1971 5th Lok Sabha mandate, where Congress held a large majority.',
		composition: [
			{ label: 'Congress', bloc: 'Government', seats: 352, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Dominant governing party after the 1971 election.' },
			{ label: 'CPM', bloc: 'Opposition', seats: 25, tone: 'bg-red-500', color: '#ef4444', description: 'Second largest party by seats in the 1971 result.' },
			{ label: 'Others', bloc: 'Opposition / other', seats: 141, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI Electoral Statistics 1971',
		sourceUrl: 'https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgIqrm67anC%2BR4pQ17IsPBqcN8HUDorExe9rYl3FchHJmfoE%2F%2BGPsxsIi5c9beR2G6o11B96m0gD2C%2FLSkmZe26pRW6r6HXZmrh0r3Gyxg1jYfoExPUm7D1dAdV4SXCkdo6Q%3D%3D',
		asOf: '1971 election result snapshot for a multi-House term'
	},
	{
		primeMinisterTermIds: ['nanda-1', 'lal-bahadur-shastri', 'nanda-2'],
		lokSabha: '3rd Lok Sabha',
		period: '1962-1967',
		electionYear: 1962,
		largestParty: 'INC',
		largestPartySeats: 361,
		runnerUpParty: 'CPI',
		runnerUpSeats: 29,
		governingSide: 'Congress majority government',
		governingSeats: 361,
		majorityMark: 248,
		powerSummary: 'Congress held a dominant majority in the 3rd Lok Sabha during the Shastri and Gulzarilal Nanda acting terms.',
		composition: [
			{ label: 'Congress', bloc: 'Government', seats: 361, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Largest party and governing majority.' },
			{ label: 'CPI', bloc: 'Opposition', seats: 29, tone: 'bg-red-500', color: '#ef4444', description: 'Second largest party by seats.' },
			{ label: 'Others', bloc: 'Opposition / other', seats: 104, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI Electoral Statistics 1962',
		sourceUrl: 'https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgIqrm67anC%2BR4pQ17IsPBqcN8HUDorExe9rYl3FchHJmfoE%2F%2BGPsxsIi5c9beR2G6o11B96m0gD2C%2FLSkmZe26pRW6r6HXZmrh0r3Gyxg1jYfoExPUm7D1dAdV4SXCkdo6Q%3D%3D',
		asOf: '1962 election result snapshot'
	},
	{
		primeMinisterTermIds: ['nehru'],
		lokSabha: 'Constituent Assembly, Provisional Parliament, 1st-3rd Lok Sabha',
		period: '1947-1964',
		electionYear: 1951,
		largestParty: 'INC',
		largestPartySeats: 364,
		runnerUpParty: 'CPI',
		runnerUpSeats: 16,
		governingSide: 'Congress-dominant founding period',
		governingSeats: 364,
		majorityMark: 245,
		powerSummary: 'Nehru’s premiership spans the founding Parliament and the first three Lok Sabhas; this chart uses the 1951 first Lok Sabha baseline, where Congress held a dominant majority.',
		composition: [
			{ label: 'Congress', bloc: 'Government', seats: 364, tone: 'bg-sky-500', color: '#0ea5e9', description: 'Dominant governing party in the first Lok Sabha baseline.' },
			{ label: 'CPI', bloc: 'Opposition', seats: 16, tone: 'bg-red-500', color: '#ef4444', description: 'Second largest party by seats in the first Lok Sabha baseline.' },
			{ label: 'Others', bloc: 'Opposition / other', seats: 109, tone: 'bg-stone-400', color: '#9ca3af', description: 'Other parties and independents.' }
		],
		sourceLabel: 'ECI Electoral Statistics 1951',
		sourceUrl: 'https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgIqrm67anC%2BR4pQ17IsPBqcN8HUDorExe9rYl3FchHJmfoE%2F%2BGPsxsIi5c9beR2G6o11B96m0gD2C%2FLSkmZe26pRW6r6HXZmrh0r3Gyxg1jYfoExPUm7D1dAdV4SXCkdo6Q%3D%3D',
		asOf: '1951 election result snapshot for a founding-period term'
	}
];

export function getLokSabhaPowerSnapshotForPrimeMinister(termId: string | null | undefined) {
	if (!termId || termId === 'all') return lokSabhaPowerSnapshots[0];
	return lokSabhaPowerSnapshots.find((snapshot) => snapshot.primeMinisterTermIds.includes(termId)) ?? null;
}

export function toParliamentHouseSnapshot(snapshot: LokSabhaPowerSnapshot): ParliamentHouseSnapshot {
	return {
		id: 'lok-sabha',
		name: snapshot.lokSabha,
		role: `${snapshot.period} Lok Sabha power`,
		seatSummary: `${snapshot.largestParty} ${snapshot.largestPartySeats} seats`,
		holderSummary: snapshot.powerSummary,
		termSummary: `${snapshot.governingSide}${snapshot.governingSeats ? ` · ${snapshot.governingSeats} seats` : ''} · majority mark ${snapshot.majorityMark}.`,
		primaryWork: [
			'Shows the lower-House power balance for the selected Prime Minister term.',
			'Uses party-seat results and governing-side context, not just the Prime Minister party label.',
			'Use the left Prime Minister history panel to switch this House snapshot.'
		],
		composition: snapshot.composition,
		sourceLabel: snapshot.sourceLabel,
		sourceUrl: snapshot.sourceUrl,
		asOf: snapshot.asOf
	};
}

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
