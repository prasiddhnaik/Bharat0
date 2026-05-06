export const GOVERNANCE_STATUSES = [
	'active_majority',
	'active_coalition',
	'presidents_rule',
	'caretaker',
	'centrally_administered'
] as const;

export type GovernanceStatus = (typeof GOVERNANCE_STATUSES)[number];

export const GOVERNANCE_ALLIANCES = ['NDA', 'INDIA', 'regional', 'left', 'none'] as const;
export type GovernanceAlliance = (typeof GOVERNANCE_ALLIANCES)[number];

export const GOVERNANCE_CONFIDENCE = ['verified', 'pending', 'disputed'] as const;
export type GovernanceConfidence = (typeof GOVERNANCE_CONFIDENCE)[number];

export type StateGovernanceRecord = {
	id: string;
	name_en: string;
	name_local: string;
	type: 'state' | 'ut_with_assembly' | 'ut_without_assembly';
	status: GovernanceStatus;
	alliance: GovernanceAlliance;
	lead_party: string | null;
	member_parties: string[];
	chief_minister: string | null;
	event_date: string;
	source_url: string;
	source_org: string;
	last_verified: string;
	confidence: GovernanceConfidence;
};

export type StateGovernanceDisplayField =
	| 'state'
	| 'local_name'
	| 'status'
	| 'alliance'
	| 'lead_party'
	| 'member_parties'
	| 'chief_minister'
	| 'event_date'
	| 'source'
	| 'last_verified';

export const EXPECTED_STATE_GOVERNANCE_FIELD_ORDER: StateGovernanceDisplayField[] = [
	'state',
	'local_name',
	'status',
	'alliance',
	'lead_party',
	'member_parties',
	'chief_minister',
	'event_date',
	'source',
	'last_verified'
];

export const STATE_GOVERNANCE_DATA_AS_OF = '2026-05-06';
export const STATE_GOVERNANCE_NEXT_REVIEW = 'Review after certified results, oath notices, or President/Governor notification.';

const britannicaChiefMinistersUrl = 'https://www.britannica.com/topic/List-of-current-Indian-chief-ministers';

export const STATE_GOVERNANCE_VISUAL_PALETTE = {
	NDA: {
		fill: '#f97316',
		softFill: '#ffedd5',
		stroke: '#c2410c',
		label: 'NDA-led'
	},
	INDIA: {
		fill: '#2563eb',
		softFill: '#dbeafe',
		stroke: '#1d4ed8',
		label: 'INDIA-led'
	},
	regional: {
		fill: '#0f766e',
		softFill: '#ccfbf1',
		stroke: '#0f766e',
		label: 'Regional'
	},
	left: {
		fill: '#dc2626',
		softFill: '#fee2e2',
		stroke: '#b91c1c',
		label: 'Left'
	},
	none: {
		fill: '#9ca3af',
		softFill: '#f3f4f6',
		stroke: '#6b7280',
		label: 'No elected ministry'
	},
	presidents_rule: {
		fill: '#8b8f98',
		softFill: '#e5e7eb',
		stroke: '#4b5563',
		label: "President's rule"
	},
	centrally_administered: {
		fill: '#d1d5db',
		softFill: '#f9fafb',
		stroke: '#9ca3af',
		label: 'Centrally administered'
	}
} as const;

export const STATE_GOVERNANCE_STATUS_VISUALS: Record<
	GovernanceStatus,
	{ pattern: 'solid' | 'coalition-stripe' | 'presidents-rule-hatch' | 'caretaker-dash' | 'muted-solid'; strokeStyle: 'solid' | 'dashed' | 'muted'; statusCue: string }
> = {
	active_majority: {
		pattern: 'solid',
		strokeStyle: 'solid',
		statusCue: 'Single-party majority government'
	},
	active_coalition: {
		pattern: 'coalition-stripe',
		strokeStyle: 'solid',
		statusCue: 'Coalition ministry'
	},
	presidents_rule: {
		pattern: 'presidents-rule-hatch',
		strokeStyle: 'muted',
		statusCue: 'President/Governor administration'
	},
	caretaker: {
		pattern: 'caretaker-dash',
		strokeStyle: 'dashed',
		statusCue: 'Caretaker government'
	},
	centrally_administered: {
		pattern: 'muted-solid',
		strokeStyle: 'muted',
		statusCue: 'Union territory without elected Assembly'
	}
};

export const governanceStatusLabels: Record<GovernanceStatus, string> = {
	active_majority: 'Active majority',
	active_coalition: 'Active coalition',
	presidents_rule: "President's rule",
	caretaker: 'Caretaker',
	centrally_administered: 'Centrally administered'
};

export const governanceAllianceLabels: Record<GovernanceAlliance, string> = {
	NDA: 'NDA',
	INDIA: 'INDIA',
	regional: 'Regional / non-aligned',
	left: 'Left',
	none: 'None'
};

export const STATE_GOVERNANCE_RECORDS: StateGovernanceRecord[] = [
	{
		id: 'IN-AN',
		name_en: 'Andaman and Nicobar Islands',
		name_local: 'अंडमान और निकोबार द्वीपसमूह',
		type: 'ut_without_assembly',
		status: 'centrally_administered',
		alliance: 'none',
		lead_party: null,
		member_parties: [],
		chief_minister: null,
		event_date: '1956-11-01',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-AP',
		name_en: 'Andhra Pradesh',
		name_local: 'आंध्र प्रदेश',
		type: 'state',
		status: 'active_coalition',
		alliance: 'NDA',
		lead_party: 'Telugu Desam Party',
		member_parties: ['Telugu Desam Party', 'Jana Sena Party', 'Bharatiya Janata Party'],
		chief_minister: 'N. Chandrababu Naidu',
		event_date: '2024-06-12',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-AR',
		name_en: 'Arunachal Pradesh',
		name_local: 'अरुणाचल प्रदेश',
		type: 'state',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Pema Khandu',
		event_date: '2024-06-13',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-AS',
		name_en: 'Assam',
		name_local: 'असम',
		type: 'state',
		status: 'active_coalition',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party', 'Asom Gana Parishad', 'United People’s Party Liberal'],
		chief_minister: 'Himanta Biswa Sarma',
		event_date: '2021-05-10',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'pending'
	},
	{
		id: 'IN-BR',
		name_en: 'Bihar',
		name_local: 'बिहार',
		type: 'state',
		status: 'active_coalition',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party', 'Janata Dal (United)', 'Hindustani Awam Morcha', 'Lok Janshakti Party (Ram Vilas)'],
		chief_minister: 'Samrat Choudhary',
		event_date: '2026-04-15',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-CH',
		name_en: 'Chandigarh',
		name_local: 'चंडीगढ़',
		type: 'ut_without_assembly',
		status: 'centrally_administered',
		alliance: 'none',
		lead_party: null,
		member_parties: [],
		chief_minister: null,
		event_date: '1966-11-01',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-CT',
		name_en: 'Chhattisgarh',
		name_local: 'छत्तीसगढ़',
		type: 'state',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Vishnu Deo Sai',
		event_date: '2023-12-13',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-DH',
		name_en: 'Dadra and Nagar Haveli and Daman and Diu',
		name_local: 'दादरा और नगर हवेली और दमन और दीव',
		type: 'ut_without_assembly',
		status: 'centrally_administered',
		alliance: 'none',
		lead_party: null,
		member_parties: [],
		chief_minister: null,
		event_date: '2020-01-26',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-DL',
		name_en: 'Delhi',
		name_local: 'दिल्ली',
		type: 'ut_with_assembly',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Rekha Gupta',
		event_date: '2025-02-20',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-GA',
		name_en: 'Goa',
		name_local: 'गोवा',
		type: 'state',
		status: 'active_coalition',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party', 'Maharashtrawadi Gomantak Party'],
		chief_minister: 'Pramod Sawant',
		event_date: '2022-03-28',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-GJ',
		name_en: 'Gujarat',
		name_local: 'गुजरात',
		type: 'state',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Bhupendra Patel',
		event_date: '2022-12-12',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-HR',
		name_en: 'Haryana',
		name_local: 'हरियाणा',
		type: 'state',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Nayab Singh Saini',
		event_date: '2024-10-17',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-HP',
		name_en: 'Himachal Pradesh',
		name_local: 'हिमाचल प्रदेश',
		type: 'state',
		status: 'active_majority',
		alliance: 'INDIA',
		lead_party: 'Indian National Congress',
		member_parties: ['Indian National Congress'],
		chief_minister: 'Sukhvinder Singh Sukhu',
		event_date: '2022-12-11',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-JK',
		name_en: 'Jammu and Kashmir',
		name_local: 'जम्मू और कश्मीर',
		type: 'ut_with_assembly',
		status: 'active_coalition',
		alliance: 'INDIA',
		lead_party: 'Jammu and Kashmir National Conference',
		member_parties: ['Jammu and Kashmir National Conference', 'Indian National Congress'],
		chief_minister: 'Omar Abdullah',
		event_date: '2024-10-16',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-JH',
		name_en: 'Jharkhand',
		name_local: 'झारखंड',
		type: 'state',
		status: 'active_coalition',
		alliance: 'INDIA',
		lead_party: 'Jharkhand Mukti Morcha',
		member_parties: ['Jharkhand Mukti Morcha', 'Indian National Congress', 'Rashtriya Janata Dal'],
		chief_minister: 'Hemant Soren',
		event_date: '2024-07-04',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-KA',
		name_en: 'Karnataka',
		name_local: 'कर्नाटक',
		type: 'state',
		status: 'active_majority',
		alliance: 'INDIA',
		lead_party: 'Indian National Congress',
		member_parties: ['Indian National Congress'],
		chief_minister: 'Siddaramaiah',
		event_date: '2023-05-20',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-KL',
		name_en: 'Kerala',
		name_local: 'केरल',
		type: 'state',
		status: 'active_coalition',
		alliance: 'left',
		lead_party: 'Communist Party of India (Marxist)',
		member_parties: ['Communist Party of India (Marxist)', 'Communist Party of India', 'Kerala Congress (M)'],
		chief_minister: 'Pinarayi Vijayan',
		event_date: '2021-05-20',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'pending'
	},
	{
		id: 'IN-LA',
		name_en: 'Ladakh',
		name_local: 'लद्दाख',
		type: 'ut_without_assembly',
		status: 'centrally_administered',
		alliance: 'none',
		lead_party: null,
		member_parties: [],
		chief_minister: null,
		event_date: '2019-10-31',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-LD',
		name_en: 'Lakshadweep',
		name_local: 'लक्षद्वीप',
		type: 'ut_without_assembly',
		status: 'centrally_administered',
		alliance: 'none',
		lead_party: null,
		member_parties: [],
		chief_minister: null,
		event_date: '1956-11-01',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-MP',
		name_en: 'Madhya Pradesh',
		name_local: 'मध्य प्रदेश',
		type: 'state',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Mohan Yadav',
		event_date: '2023-12-13',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-MH',
		name_en: 'Maharashtra',
		name_local: 'महाराष्ट्र',
		type: 'state',
		status: 'active_coalition',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party', 'Shiv Sena', 'Nationalist Congress Party'],
		chief_minister: 'Devendra Fadnavis',
		event_date: '2024-12-05',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-MN',
		name_en: 'Manipur',
		name_local: 'मणिपुर',
		type: 'state',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Yumnam Khemchand Singh',
		event_date: '2026-02-04',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-ML',
		name_en: 'Meghalaya',
		name_local: 'मेघालय',
		type: 'state',
		status: 'active_coalition',
		alliance: 'regional',
		lead_party: 'National People’s Party',
		member_parties: ['National People’s Party', 'United Democratic Party', 'Bharatiya Janata Party'],
		chief_minister: 'Conrad Kongkal Sangma',
		event_date: '2023-03-07',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-MZ',
		name_en: 'Mizoram',
		name_local: 'मिजोरम',
		type: 'state',
		status: 'active_majority',
		alliance: 'regional',
		lead_party: 'Zoram People’s Movement',
		member_parties: ['Zoram People’s Movement'],
		chief_minister: 'Lalduhoma',
		event_date: '2023-12-08',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-NL',
		name_en: 'Nagaland',
		name_local: 'नगालैंड',
		type: 'state',
		status: 'active_coalition',
		alliance: 'NDA',
		lead_party: 'Nationalist Democratic Progressive Party',
		member_parties: ['Nationalist Democratic Progressive Party', 'Bharatiya Janata Party'],
		chief_minister: 'Neiphiu Rio',
		event_date: '2023-03-07',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-OR',
		name_en: 'Odisha',
		name_local: 'ओडिशा',
		type: 'state',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Mohan Charan Majhi',
		event_date: '2024-06-12',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-PY',
		name_en: 'Puducherry',
		name_local: 'पुदुच्चेरी',
		type: 'ut_with_assembly',
		status: 'active_coalition',
		alliance: 'NDA',
		lead_party: 'All India N.R. Congress',
		member_parties: ['All India N.R. Congress', 'Bharatiya Janata Party'],
		chief_minister: 'N. Rangaswamy',
		event_date: '2021-05-07',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'pending'
	},
	{
		id: 'IN-PB',
		name_en: 'Punjab',
		name_local: 'पंजाब',
		type: 'state',
		status: 'active_majority',
		alliance: 'regional',
		lead_party: 'Aam Aadmi Party',
		member_parties: ['Aam Aadmi Party'],
		chief_minister: 'Bhagwant Singh Mann',
		event_date: '2022-03-16',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-RJ',
		name_en: 'Rajasthan',
		name_local: 'राजस्थान',
		type: 'state',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Bhajanlal Sharma',
		event_date: '2023-12-15',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-SK',
		name_en: 'Sikkim',
		name_local: 'सिक्किम',
		type: 'state',
		status: 'active_majority',
		alliance: 'regional',
		lead_party: 'Sikkim Krantikari Morcha',
		member_parties: ['Sikkim Krantikari Morcha'],
		chief_minister: 'Prem Singh Tamang',
		event_date: '2024-06-10',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-TN',
		name_en: 'Tamil Nadu',
		name_local: 'तमिलनाडु',
		type: 'state',
		status: 'active_coalition',
		alliance: 'INDIA',
		lead_party: 'Dravida Munnetra Kazhagam',
		member_parties: ['Dravida Munnetra Kazhagam', 'Indian National Congress', 'Communist Party of India (Marxist)', 'Communist Party of India'],
		chief_minister: 'M. K. Stalin',
		event_date: '2021-05-07',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'pending'
	},
	{
		id: 'IN-TG',
		name_en: 'Telangana',
		name_local: 'तेलंगाना',
		type: 'state',
		status: 'active_majority',
		alliance: 'INDIA',
		lead_party: 'Indian National Congress',
		member_parties: ['Indian National Congress'],
		chief_minister: 'A. Revanth Reddy',
		event_date: '2023-12-07',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-TR',
		name_en: 'Tripura',
		name_local: 'त्रिपुरा',
		type: 'state',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Manik Saha',
		event_date: '2023-03-08',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-UT',
		name_en: 'Uttarakhand',
		name_local: 'उत्तराखंड',
		type: 'state',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Pushkar Singh Dhami',
		event_date: '2022-03-23',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-UP',
		name_en: 'Uttar Pradesh',
		name_local: 'उत्तर प्रदेश',
		type: 'state',
		status: 'active_majority',
		alliance: 'NDA',
		lead_party: 'Bharatiya Janata Party',
		member_parties: ['Bharatiya Janata Party'],
		chief_minister: 'Yogi Adityanath',
		event_date: '2022-03-25',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'verified'
	},
	{
		id: 'IN-WB',
		name_en: 'West Bengal',
		name_local: 'पश्चिम बंगाल',
		type: 'state',
		status: 'active_majority',
		alliance: 'regional',
		lead_party: 'All India Trinamool Congress',
		member_parties: ['All India Trinamool Congress'],
		chief_minister: 'Mamata Banerjee',
		event_date: '2021-05-05',
		source_url: britannicaChiefMinistersUrl,
		source_org: 'Encyclopaedia Britannica',
		last_verified: STATE_GOVERNANCE_DATA_AS_OF,
		confidence: 'pending'
	}
];

export const stateGovernanceById = new Map(STATE_GOVERNANCE_RECORDS.map((record) => [record.id, record]));

export function getStateGovernanceVisual(record: StateGovernanceRecord) {
	const statusVisual = STATE_GOVERNANCE_STATUS_VISUALS[record.status];
	const paletteKey =
		record.status === 'presidents_rule'
			? 'presidents_rule'
			: record.status === 'centrally_administered'
				? 'centrally_administered'
				: record.alliance;
	return {
		...STATE_GOVERNANCE_VISUAL_PALETTE[paletteKey],
		paletteKey,
		pattern: statusVisual.pattern,
		strokeStyle: statusVisual.strokeStyle,
		statusCue: statusVisual.statusCue
	};
}

export function getStateGovernanceRows(record: StateGovernanceRecord) {
	return [
		{ field: 'state', label: 'State / UT', value: record.name_en },
		{ field: 'local_name', label: 'Local label', value: record.name_local },
		{ field: 'status', label: 'Status', value: governanceStatusLabels[record.status] },
		{ field: 'alliance', label: 'Alliance', value: governanceAllianceLabels[record.alliance] },
		{ field: 'lead_party', label: 'Lead party', value: record.lead_party ?? 'No elected ministry' },
		{ field: 'member_parties', label: 'Member parties', value: record.member_parties.length ? record.member_parties.join(', ') : 'None' },
		{ field: 'chief_minister', label: 'Chief Minister', value: record.chief_minister ?? 'No Chief Minister' },
		{ field: 'event_date', label: 'Event date', value: record.event_date },
		{ field: 'source', label: 'Source', value: record.source_org },
		{ field: 'last_verified', label: 'Last verified', value: record.last_verified }
	] satisfies Array<{ field: StateGovernanceDisplayField; label: string; value: string }>;
}

export function summarizeStateGovernance(record: StateGovernanceRecord) {
	if (record.status === 'centrally_administered') {
		return `${record.name_en} is a Union territory administered by the Centre, with no elected Assembly ministry.`;
	}
	if (record.status === 'presidents_rule') {
		return `${record.name_en} is under President's rule; elected-state governance is paused until a ministry is formed.`;
	}
	if (record.status === 'caretaker') {
		return `${record.name_en} is in caretaker mode; the outgoing ministry remains in office until the next government is sworn in.`;
	}
	const party = record.lead_party ?? governanceAllianceLabels[record.alliance];
	return `${record.name_en} is governed by ${party}${record.status === 'active_coalition' ? ' through a coalition' : ''}.`;
}
