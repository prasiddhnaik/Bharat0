import type { PrimeMinisterTermId } from './prime-ministers';

export type PrimeMinisterProfile = {
	termIds: PrimeMinisterTermId[];
	summary: string;
	highlights: string[];
	sourceLabel: string;
	sourceUrl: string;
};

export const primeMinisterProfiles: PrimeMinisterProfile[] = [
	{
		termIds: ['modi-3', 'modi-2', 'modi-1'],
		summary: 'Narendra Modi is tracked as the current Prime Minister context for recent bill, source, and House-control views.',
		highlights: [
			'Led BJP/NDA governments across the 16th, 17th, and 18th Lok Sabhas.',
			'Recent terms connect most directly to Sansad, PRS, and current official-source ingestion.',
			'Current profile data should be treated separately from historical former-PM archives.'
		],
		sourceLabel: 'Prime Minister of India profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/pms-profile/'
	},
	{
		termIds: ['manmohan-singh-2', 'manmohan-singh-1'],
		summary: 'Manmohan Singh led Congress-led UPA governments and is especially relevant to economic, finance, nuclear agreement, and welfare-legislation context.',
		highlights: [
			'Served as Prime Minister across the 14th and 15th Lok Sabhas.',
			'Previously served as Finance Minister during the 1991 economic reform period.',
			'His terms are useful for tracking UPA-era social, financial, education, and rights-based legislation.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/dr-manmohan-singh/'
	},
	{
		termIds: ['vajpayee-3', 'vajpayee-2', 'vajpayee-1'],
		summary: 'Atal Bihari Vajpayee led BJP and NDA governments through the late-1990s coalition era and the 13th Lok Sabha majority coalition.',
		highlights: [
			'Served three PM terms: briefly in 1996, then in 1998-1999 and 1999-2004.',
			'Led National Democratic Alliance governments after the 1998 and 1999 elections.',
			'Key context includes coalition management, national security, infrastructure, and foreign-policy initiatives.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/shri-atal-bihari-vajpayee/'
	},
	{
		termIds: ['gujral'],
		summary: 'I. K. Gujral led a United Front government in the fragmented 11th Lok Sabha period.',
		highlights: [
			'Served as Prime Minister from 1997 to 1998.',
			'Associated with coalition politics and a foreign-policy approach often called the Gujral Doctrine.',
			'His term should be read with the 11th Lok Sabha fragmented-House power snapshot.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/shri-inder-kumar-gujral/'
	},
	{
		termIds: ['deve-gowda'],
		summary: 'H. D. Deve Gowda led a United Front coalition government after the 1996 election produced a fragmented House.',
		highlights: [
			'Served as Prime Minister from 1996 to 1997.',
			'Previously served as Chief Minister of Karnataka.',
			'His term is best understood as part of the 11th Lok Sabha coalition period.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/shri-h-d-deve-gowda/'
	},
	{
		termIds: ['narasimha-rao'],
		summary: 'P. V. Narasimha Rao led a Congress minority government and is central to India’s 1991 economic liberalisation context.',
		highlights: [
			'Served as Prime Minister during the 10th Lok Sabha.',
			'Previously held major Union portfolios including External Affairs, Home Affairs, and Defence.',
			'His term is strongly linked with economic liberalisation and minority-government legislative management.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/shri-p-v-narasimha-rao-2/'
	},
	{
		termIds: ['chandra-shekhar'],
		summary: 'Chandra Shekhar led a short-lived SJP government during the unstable 9th Lok Sabha period.',
		highlights: [
			'Served as Prime Minister from 1990 to 1991.',
			'Governed with outside support after the collapse of the V. P. Singh government.',
			'His term should be read against the 9th Lok Sabha fragmented-power snapshot.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/shri-chandra-shekhar/'
	},
	{
		termIds: ['vp-singh'],
		summary: 'V. P. Singh led the National Front government after the 1989 election shifted power away from Congress.',
		highlights: [
			'Served as Prime Minister from 1989 to 1990.',
			'His government depended on outside support in a fragmented 9th Lok Sabha.',
			'The term is important for coalition-era transition and social-justice policy context.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/shri-vishwanath-pratap-singh/'
	},
	{
		termIds: ['rajiv-gandhi'],
		summary: 'Rajiv Gandhi led a large Congress majority government in the 8th Lok Sabha after the 1984 election.',
		highlights: [
			'Served as Prime Minister from 1984 to 1989.',
			'His term is tied to technology, telecom, education, and administrative-modernisation context.',
			'The 8th Lok Sabha snapshot shows Congress with an overwhelming majority.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/%E0%A4%B6%E0%A5%8D%E0%A4%B0%E0%A5%80-%E0%A4%B0%E0%A4%BE%E0%A4%9C%E0%A5%80%E0%A4%B5-%E0%A4%97%E0%A4%BE%E0%A4%82%E0%A4%A7%E0%A5%80/'
	},
	{
		termIds: ['indira-gandhi-2', 'indira-gandhi-1'],
		summary: 'Indira Gandhi’s two premiership periods cover major shifts in Congress dominance, centralisation, the Emergency era, and the 1980 return to power.',
		highlights: [
			'First premiership spans the 3rd, 4th, and 5th Lok Sabhas; second premiership aligns with the 7th Lok Sabha.',
			'Her terms are useful for tracking centralisation, nationalisation, Emergency-era context, and post-1980 Congress recovery.',
			'Because the first premiership spans multiple Lok Sabhas, the House chart uses a representative mandate snapshot.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/smt-indira-gandhi/'
	},
	{
		termIds: ['charan-singh'],
		summary: 'Charan Singh led a short Janata Party (Secular) government after the Janata coalition split.',
		highlights: [
			'Served as Prime Minister from 1979 to 1980.',
			'His term followed the breakdown of the post-Emergency Janata majority.',
			'The 6th Lok Sabha chart shows the original 1977 Janata mandate and the later split context.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/shri-charan-singh/'
	},
	{
		termIds: ['morarji-desai'],
		summary: 'Morarji Desai led India’s first non-Congress national government after the 1977 post-Emergency election.',
		highlights: [
			'Served as Prime Minister from 1977 to 1979.',
			'Led the Janata government after a major electoral defeat for Congress.',
			'His term is central to post-Emergency parliamentary realignment.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/shri-morarji-desai/'
	},
	{
		termIds: ['nanda-2', 'nanda-1'],
		summary: 'Gulzarilal Nanda served as acting Prime Minister twice during transitions after the deaths of Nehru and Shastri.',
		highlights: [
			'Served as acting Prime Minister in 1964 and again in 1966.',
			'His acting terms sit inside the Congress-dominated 3rd Lok Sabha.',
			'The app groups these brief terms with the 1962 House power snapshot.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/shri-gulzari-lal-nanda-2/'
	},
	{
		termIds: ['lal-bahadur-shastri'],
		summary: 'Lal Bahadur Shastri led India during the mid-1960s and is associated with food security, defence, and the slogan Jai Jawan Jai Kisan.',
		highlights: [
			'Served as Prime Minister from 1964 to 1966.',
			'Before becoming Prime Minister, held Union Cabinet portfolios including Railways, Transport and Communications, Commerce and Industry, and Home Minister.',
			'His term belongs to the Congress-majority 3rd Lok Sabha period.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/shri-lal-bahadur-shastri/'
	},
	{
		termIds: ['nehru'],
		summary: 'Jawaharlal Nehru was independent India’s first Prime Minister and led the founding parliamentary period into the first three Lok Sabhas.',
		highlights: [
			'Served from 1947 to 1964, the longest tenure in the PM list.',
			'Established parliamentary-government conventions in the early Republic.',
			'The app uses a 1951 first-Lok-Sabha baseline for the founding-period House chart.'
		],
		sourceLabel: 'PM India former PM profile',
		sourceUrl: 'https://www.pmindia.gov.in/en/former_pm/shri-jawaharlal-nehru/'
	}
];

export function getPrimeMinisterProfile(termId: PrimeMinisterTermId | string | null | undefined) {
	if (!termId) return null;
	return primeMinisterProfiles.find((profile) => profile.termIds.includes(termId as PrimeMinisterTermId)) ?? null;
}
