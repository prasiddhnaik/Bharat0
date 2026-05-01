import type {
	Act,
	Bill,
	BillAction,
	Committee,
	Debate,
	Question,
	SittingDay,
	SourceEntry,
	TimelineEvent
} from '$lib/domain/types';
import {
	sansadActs,
	sansadBillActions,
	sansadBills,
	sansadMeta,
	sansadSittingDays,
	sansadTimelineEvents
} from './generated/sansad-legislation';
import {
	prsBillActions,
	prsBills,
	prsMeta,
	prsSittingDays,
	prsTimelineEvents
} from './generated/prs-legislation';
import {
	pdlPre2004BillActions,
	pdlPre2004Bills,
	pdlPre2004Meta,
	pdlPre2004SittingDays,
	pdlPre2004TimelineEvents
} from './generated/pdl-pre2004-legislation';

export const seedMeta = {
	label: 'Sansad, PRS, and Parliament Digital Library legislation records',
	description:
		'Generated from the Sansad legislation API path with a public mirror fallback, PRS India historical bill pages, Parliament Digital Library pre-2004 bill proceedings, plus a small manually curated set from PIB, Gazette/Act PDFs, and India Code.',
	updatedAt: [sansadMeta.asOf, prsMeta.asOf, pdlPre2004Meta.asOf].sort().at(-1) ?? sansadMeta.asOf
} as const;

const curatedBills: Bill[] = [
	{
		id: 'income-tax-bill-2025',
		title_en: 'Income-Tax Bill, 2025',
		title_hi: 'आयकर विधेयक, 2025',
		bill_number: 'Bill No. 24 of 2025',
		bill_year: 2025,
		bill_type: 'ordinary',
		origin_house: 'lok-sabha',
		current_stage: 'committee_reported',
		ministry: 'Ministry of Finance',
		introduced_on: '2025-02-13',
		latest_action_date: '2025-07-21',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/Asintroduced/Income%20tax213202522837PM.pdf?source=legislation',
		summary:
			'Introduced in Lok Sabha on 13 February 2025 to repeal and replace the Income-tax Act, 1961 with a concise and easier-to-read income-tax law. It was referred to a Select Committee chaired by Baijayant Panda.',
		isDemoSeed: false
	},
	{
		id: 'finance-bill-2025',
		title_en: 'Finance Bill, 2025',
		title_hi: 'वित्त विधेयक, 2025',
		bill_number: 'Act No. 7 of 2025',
		bill_year: 2025,
		bill_type: 'financial',
		origin_house: 'lok-sabha',
		current_stage: 'act_published',
		ministry: 'Ministry of Finance',
		introduced_on: '2025-02-01',
		latest_action_date: '2025-03-29',
		source_url: 'https://incometaxindia.gov.in/Documents/Act/Finance-Act-2025.pdf',
		summary:
			'Financial legislation giving effect to the Central Government financial proposals for 2025-2026. PIB recorded Lok Sabha passage on 25 March 2025, and the Gazette Act PDF records Presidential assent and publication on 29 March 2025.',
		isDemoSeed: false
	},
	{
		id: 'digital-personal-data-protection-bill-2023',
		title_en: 'Digital Personal Data Protection Bill, 2023',
		title_hi: 'डिजिटल व्यक्तिगत डेटा संरक्षण विधेयक, 2023',
		bill_number: 'Bill No. 113-F of 2023',
		bill_year: 2023,
		bill_type: 'ordinary',
		origin_house: 'lok-sabha',
		current_stage: 'act_published',
		ministry: 'Ministry of Electronics and Information Technology',
		introduced_on: '2023-08-03',
		latest_action_date: '2023-08-11',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/PassedBothHouses/data%20protection818202332045PM.pdf?source=legislation',
		summary:
			'Personal data protection legislation passed by Lok Sabha on 7 August 2023 and Rajya Sabha on 9 August 2023, with Presidential assent recorded on 11 August 2023.',
		isDemoSeed: false
	},
	{
		id: 'tribhuvan-sahkari-university-bill-2025',
		title_en: '"Tribhuvan" Sahkari University Bill, 2025',
		title_hi: '"त्रिभुवन" सहकारी विश्वविद्यालय विधेयक, 2025',
		bill_number: 'Act No. 11 of 2025',
		bill_year: 2025,
		bill_type: 'ordinary',
		origin_house: 'lok-sabha',
		current_stage: 'act_published',
		ministry: 'Ministry of Cooperation',
		introduced_on: '2025-02-03',
		latest_action_date: '2025-04-03',
		source_url: 'https://www.indiacode.nic.in/bitstream/123456789/21049/1/a2025-11.pdf',
		summary:
			'Creates "Tribhuvan" Sahkari University for education, training, and research in the cooperative sector. PRS session tracking records Lok Sabha introduction on 3 February 2025, Lok Sabha passage on 26 March 2025, and Rajya Sabha passage on 1 April 2025.',
		isDemoSeed: false
	},
	{
		id: 'immigration-and-foreigners-bill-2025',
		title_en: 'Immigration and Foreigners Bill, 2025',
		title_hi: 'आव्रजन और विदेशी विषयक विधेयक, 2025',
		bill_number: 'Act No. 13 of 2025',
		bill_year: 2025,
		bill_type: 'ordinary',
		origin_house: 'lok-sabha',
		current_stage: 'act_published',
		ministry: 'Ministry of Home Affairs',
		introduced_on: '2025-03-11',
		latest_action_date: '2025-04-04',
		source_url: 'https://www.indiacode.nic.in/bitstream/123456789/21918/1/A2025-13.pdf',
		summary:
			'Consolidates the legal framework for immigration, entry, stay, and exit of foreigners in India, replacing four earlier laws. PRS records passage by Lok Sabha on 27 March 2025 and Rajya Sabha on 2 April 2025.',
		isDemoSeed: false
	},
	{
		id: 'waqf-amendment-bill-2025',
		title_en: 'Waqf (Amendment) Bill, 2025',
		title_hi: 'वक्फ (संशोधन) विधेयक, 2025',
		bill_number: 'Act No. 14 of 2025',
		bill_year: 2025,
		bill_type: 'ordinary',
		origin_house: 'lok-sabha',
		current_stage: 'act_published',
		ministry: 'Ministry of Minority Affairs',
		introduced_on: '2024-08-08',
		latest_action_date: '2025-04-05',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/PassedBothHouses/THE%20WAQF%20%28AMENDMENT%29%20BILL%2C%202025411202521212PM.pdf?source=legislation',
		summary:
			'Amends the Waqf Act, 1995. PIB describes the 2025 enactment as focused on improving management of waqf properties, stakeholder empowerment, survey and registration efficiency, and property development.',
		isDemoSeed: false
	},
	{
		id: 'protection-of-interests-in-aircraft-objects-bill-2025',
		title_en: 'Protection of Interests in Aircraft Objects Bill, 2025',
		title_hi: 'विमान वस्तुओं में हित संरक्षण विधेयक, 2025',
		bill_number: 'Act No. 17 of 2025',
		bill_year: 2025,
		bill_type: 'ordinary',
		origin_house: 'rajya-sabha',
		current_stage: 'act_published',
		ministry: 'Ministry of Civil Aviation',
		introduced_on: '2025-02-10',
		latest_action_date: '2025-04-16',
		source_url: 'https://www.indiacode.nic.in/bitstream/123456789/21133/1/A2025-17.pdf',
		summary:
			'Gives legal effect in India to the Cape Town Convention and Aircraft Protocol for aircraft leasing and financing. PRS records introduction in Rajya Sabha on 10 February 2025, Rajya Sabha passage on 1 April 2025, and Lok Sabha passage on 3 April 2025.',
		isDemoSeed: false
	},
	{
		id: 'jan-vishwas-amendment-provisions-bill-2026',
		title_en: 'Jan Vishwas (Amendment of Provisions) Bill, 2026',
		title_hi: 'जन विश्वास (उपबंधों का संशोधन) विधेयक, 2026',
		bill_number: 'Passed by both Houses in 2026',
		bill_year: 2026,
		bill_type: 'ordinary',
		origin_house: 'lok-sabha',
		current_stage: 'president_assent_pending',
		ministry: 'Ministry of Commerce and Industry',
		introduced_on: '2026-03-27',
		latest_action_date: '2026-04-02',
		source_url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2248596',
		summary:
			'Passed by both Houses in April 2026 to decriminalise and rationalise provisions across central laws. PIB states that the Bill amends 784 provisions across 79 Central Acts administered by 23 Ministries.',
		isDemoSeed: false
	}
];

const curatedBillActions: BillAction[] = [
	{
		id: 'income-tax-introduced',
		bill_id: 'income-tax-bill-2025',
		date: '2025-02-13',
		house: 'lok-sabha',
		action_type: 'bill_introduced',
		description: 'Introduced in Lok Sabha as Bill No. 24 of 2025.',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/Asintroduced/Income%20tax213202522837PM.pdf?source=legislation',
		isDemoSeed: false
	},
	{
		id: 'income-tax-select-committee-reference',
		bill_id: 'income-tax-bill-2025',
		date: '2025-02-13',
		house: 'lok-sabha',
		action_type: 'bill_referred_committee',
		description: 'Minister-in-charge proposed referring the Bill to a Select Committee of Lok Sabha.',
		source_url: 'https://sansad.in/getFile/LSSCOMMITTEE/Select%20Committee%20of%20Lok%20Sabha%20to%20Examine%20the%20Income-Tax%20Bill%202025/Introduction/Introduction_for_Webpage.pdf?source=loksabhadocs',
		isDemoSeed: false
	},
	{
		id: 'income-tax-select-committee-report',
		bill_id: 'income-tax-bill-2025',
		date: '2025-07-21',
		house: 'lok-sabha',
		action_type: 'committee_report_tabled',
		description: 'Report of the Select Committee of Lok Sabha to Examine the Income-Tax Bill, 2025 appears in Parliament Digital Library with date 21 July 2025.',
		source_url: 'https://eparlib.sansad.in/handle/123456789/2992139?view_type=browse',
		isDemoSeed: false
	},
	{
		id: 'finance-bill-introduced',
		bill_id: 'finance-bill-2025',
		date: '2025-02-01',
		house: 'lok-sabha',
		action_type: 'bill_introduced',
		description: 'Finance Bill, 2025 introduced in Lok Sabha during the Budget sitting.',
		source_url: 'https://eparlib.sansad.in/handle/123456789/10/simple-search?etal=0&filter_field_1=type&filter_field_2=debate&filter_type_1=equals&filter_type_2=equals&filter_value_1=Part+2%28Other+than+Questions+And+Answers%29&filter_value_2=GOVERNMENT+BILLS&order=desc&query=&rpp=20&sort_by=dc.date_dt&start=40',
		isDemoSeed: false
	},
	{
		id: 'finance-bill-lok-sabha-passed',
		bill_id: 'finance-bill-2025',
		date: '2025-03-25',
		house: 'lok-sabha',
		action_type: 'bill_passed_origin_house',
		description: 'PIB release from Lok Sabha Secretariat records that the Finance Bill was passed on 25 March 2025.',
		source_url: 'https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2118945',
		isDemoSeed: false
	},
	{
		id: 'finance-act-assent',
		bill_id: 'finance-bill-2025',
		date: '2025-03-29',
		house: 'lok-sabha',
		action_type: 'bill_assented',
		description: 'Finance Act, 2025 received Presidential assent and was published for general information.',
		source_url: 'https://incometaxindia.gov.in/Documents/Act/Finance-Act-2025.pdf',
		isDemoSeed: false
	},
	{
		id: 'dpdp-introduced',
		bill_id: 'digital-personal-data-protection-bill-2023',
		date: '2023-08-03',
		house: 'lok-sabha',
		action_type: 'bill_introduced',
		description: 'Parliament Digital Library records introduction of the Digital Personal Data Protection Bill, 2023 on 3 August 2023.',
		source_url: 'https://eparlib.sansad.in/handle/123456789/2505325?view_type=search',
		isDemoSeed: false
	},
	{
		id: 'dpdp-lok-sabha-passed',
		bill_id: 'digital-personal-data-protection-bill-2023',
		date: '2023-08-07',
		house: 'lok-sabha',
		action_type: 'bill_passed_origin_house',
		description: 'Bill text records Lok Sabha passage on 7 August 2023.',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/PassedBothHouses/data%20protection818202332045PM.pdf?source=legislation',
		isDemoSeed: false
	},
	{
		id: 'dpdp-rajya-sabha-passed',
		bill_id: 'digital-personal-data-protection-bill-2023',
		date: '2023-08-09',
		house: 'rajya-sabha',
		action_type: 'bill_passed_second_house',
		description: 'Bill text records Rajya Sabha passage on 9 August 2023.',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/PassedBothHouses/data%20protection818202332045PM.pdf?source=legislation',
		isDemoSeed: false
	},
	{
		id: 'dpdp-assented',
		bill_id: 'digital-personal-data-protection-bill-2023',
		date: '2023-08-11',
		house: 'lok-sabha',
		action_type: 'bill_assented',
		description: 'Bill text records Presidential assent on 11 August 2023 and Act No. 22 of 2023.',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/PassedBothHouses/data%20protection818202332045PM.pdf?source=legislation',
		isDemoSeed: false
	},
	{
		id: 'tribhuvan-introduced',
		bill_id: 'tribhuvan-sahkari-university-bill-2025',
		date: '2025-02-03',
		house: 'lok-sabha',
		action_type: 'bill_introduced',
		description: 'Introduced in Lok Sabha; PRS Budget Session tracker lists introduction on 3 February 2025.',
		source_url: 'https://prsindia.org/sessiontrack/budget-session-2025/bill-legislation',
		isDemoSeed: false
	},
	{
		id: 'tribhuvan-lok-sabha-passed',
		bill_id: 'tribhuvan-sahkari-university-bill-2025',
		date: '2025-03-26',
		house: 'lok-sabha',
		action_type: 'bill_passed_origin_house',
		description: 'Parliament Digital Library records Lok Sabha passage on 26 March 2025.',
		source_url: 'https://eparlib.sansad.in/handle/123456789/2991119?view_type=search',
		isDemoSeed: false
	},
	{
		id: 'tribhuvan-rajya-sabha-passed',
		bill_id: 'tribhuvan-sahkari-university-bill-2025',
		date: '2025-04-01',
		house: 'rajya-sabha',
		action_type: 'bill_passed_second_house',
		description: 'PRS Budget Session tracker records Rajya Sabha passage on 1 April 2025.',
		source_url: 'https://prsindia.org/sessiontrack/budget-session-2025/bill-legislation',
		isDemoSeed: false
	},
	{
		id: 'tribhuvan-assented',
		bill_id: 'tribhuvan-sahkari-university-bill-2025',
		date: '2025-04-03',
		house: 'lok-sabha',
		action_type: 'bill_assented',
		description: 'India Code publishes the Act as Act No. 11 of 2025 with enactment in April 2025.',
		source_url: 'https://www.indiacode.nic.in/bitstream/123456789/21049/1/a2025-11.pdf',
		isDemoSeed: false
	},
	{
		id: 'immigration-introduced',
		bill_id: 'immigration-and-foreigners-bill-2025',
		date: '2025-03-11',
		house: 'lok-sabha',
		action_type: 'bill_introduced',
		description: 'Introduced in Lok Sabha on 11 March 2025.',
		source_url: 'https://prsindia.org/billtrack/the-immigration-and-foreigners-bill-2025',
		isDemoSeed: false
	},
	{
		id: 'immigration-lok-sabha-passed',
		bill_id: 'immigration-and-foreigners-bill-2025',
		date: '2025-03-27',
		house: 'lok-sabha',
		action_type: 'bill_passed_origin_house',
		description: 'PRS records Lok Sabha passage on 27 March 2025.',
		source_url: 'https://prsindia.org/billtrack/the-immigration-and-foreigners-bill-2025',
		isDemoSeed: false
	},
	{
		id: 'immigration-rajya-sabha-passed',
		bill_id: 'immigration-and-foreigners-bill-2025',
		date: '2025-04-02',
		house: 'rajya-sabha',
		action_type: 'bill_passed_second_house',
		description: 'PRS records Rajya Sabha passage on 2 April 2025.',
		source_url: 'https://prsindia.org/billtrack/the-immigration-and-foreigners-bill-2025',
		isDemoSeed: false
	},
	{
		id: 'immigration-assented',
		bill_id: 'immigration-and-foreigners-bill-2025',
		date: '2025-04-04',
		house: 'lok-sabha',
		action_type: 'bill_assented',
		description: 'India Code publishes the Immigration and Foreigners Act, 2025 as Act No. 13 of 2025.',
		source_url: 'https://www.indiacode.nic.in/bitstream/123456789/21918/1/A2025-13.pdf',
		isDemoSeed: false
	},
	{
		id: 'waqf-introduced',
		bill_id: 'waqf-amendment-bill-2025',
		date: '2024-08-08',
		house: 'lok-sabha',
		action_type: 'bill_introduced',
		description: 'Introduced in Lok Sabha on 8 August 2024 and later examined through committee process.',
		source_url: 'https://sansad.in/getFile/Synop/18/II/SYN_08082024_ENG.pdf?source=loksabhadocs',
		isDemoSeed: false
	},
	{
		id: 'waqf-lok-sabha-passed',
		bill_id: 'waqf-amendment-bill-2025',
		date: '2025-04-03',
		house: 'lok-sabha',
		action_type: 'bill_passed_origin_house',
		description: 'Sansad passed-both-Houses text records Lok Sabha passage on 3 April 2025.',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/PassedBothHouses/THE%20WAQF%20%28AMENDMENT%29%20BILL%2C%202025411202521212PM.pdf?source=legislation',
		isDemoSeed: false
	},
	{
		id: 'waqf-rajya-sabha-passed',
		bill_id: 'waqf-amendment-bill-2025',
		date: '2025-04-04',
		house: 'rajya-sabha',
		action_type: 'bill_passed_second_house',
		description: 'Sansad passed-both-Houses text records Rajya Sabha passage after Lok Sabha passage.',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/PassedBothHouses/THE%20WAQF%20%28AMENDMENT%29%20BILL%2C%202025411202521212PM.pdf?source=legislation',
		isDemoSeed: false
	},
	{
		id: 'waqf-assented',
		bill_id: 'waqf-amendment-bill-2025',
		date: '2025-04-05',
		house: 'lok-sabha',
		action_type: 'bill_assented',
		description: 'Central Waqf Council publishes the Waqf (Amendment) Act, 2025 as Act No. 14 of 2025.',
		source_url: 'https://centralwaqfcouncil.gov.in/content/waqf-amendment-act-2025',
		isDemoSeed: false
	},
	{
		id: 'aircraft-objects-introduced',
		bill_id: 'protection-of-interests-in-aircraft-objects-bill-2025',
		date: '2025-02-10',
		house: 'rajya-sabha',
		action_type: 'bill_introduced',
		description: 'Introduced in Rajya Sabha on 10 February 2025.',
		source_url: 'https://prsindia.org/billtrack/the-protection-of-interests-in-aircraft-objects-bill-2025',
		isDemoSeed: false
	},
	{
		id: 'aircraft-objects-rajya-sabha-passed',
		bill_id: 'protection-of-interests-in-aircraft-objects-bill-2025',
		date: '2025-04-01',
		house: 'rajya-sabha',
		action_type: 'bill_passed_origin_house',
		description: 'PRS records Rajya Sabha passage on 1 April 2025.',
		source_url: 'https://prsindia.org/billtrack/the-protection-of-interests-in-aircraft-objects-bill-2025',
		isDemoSeed: false
	},
	{
		id: 'aircraft-objects-lok-sabha-passed',
		bill_id: 'protection-of-interests-in-aircraft-objects-bill-2025',
		date: '2025-04-03',
		house: 'lok-sabha',
		action_type: 'bill_passed_second_house',
		description: 'PRS records Lok Sabha passage on 3 April 2025.',
		source_url: 'https://prsindia.org/billtrack/the-protection-of-interests-in-aircraft-objects-bill-2025',
		isDemoSeed: false
	},
	{
		id: 'aircraft-objects-assented',
		bill_id: 'protection-of-interests-in-aircraft-objects-bill-2025',
		date: '2025-04-16',
		house: 'rajya-sabha',
		action_type: 'bill_assented',
		description: 'India Code publishes the Act as Act No. 17 of 2025 with enactment date 16 April 2025.',
		source_url: 'https://www.indiacode.nic.in/handle/123456789/21133?locale=en',
		isDemoSeed: false
	},
	{
		id: 'jan-vishwas-2026-introduced',
		bill_id: 'jan-vishwas-amendment-provisions-bill-2026',
		date: '2026-03-27',
		house: 'lok-sabha',
		action_type: 'bill_introduced',
		description: 'Introduced in Lok Sabha on 27 March 2026 after the 2025 version and Select Committee process.',
		source_url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2248596',
		isDemoSeed: false
	},
	{
		id: 'jan-vishwas-2026-lok-sabha-passed',
		bill_id: 'jan-vishwas-amendment-provisions-bill-2026',
		date: '2026-04-01',
		house: 'lok-sabha',
		action_type: 'bill_passed_origin_house',
		description: 'PIB records Lok Sabha passage before Rajya Sabha passage.',
		source_url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2248596',
		isDemoSeed: false
	},
	{
		id: 'jan-vishwas-2026-rajya-sabha-passed',
		bill_id: 'jan-vishwas-amendment-provisions-bill-2026',
		date: '2026-04-02',
		house: 'rajya-sabha',
		action_type: 'bill_passed_second_house',
		description: 'PIB release records passage by both Lok Sabha and Rajya Sabha on the 2026 Bill.',
		source_url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2248596',
		isDemoSeed: false
	}
];

const curatedSittingDays: SittingDay[] = [
	{
		id: 'sit-ls-2025-07-21',
		date: '2025-07-21',
		house: 'lok-sabha',
		session_name: 'Monsoon Session 2025',
		status: 'sat',
		isDemoSeed: false
	},
	{
		id: 'sit-ls-2025-03-25',
		date: '2025-03-25',
		house: 'lok-sabha',
		session_name: 'Budget Session 2025',
		status: 'sat',
		isDemoSeed: false
	},
	{
		id: 'sit-ls-2023-08-07',
		date: '2023-08-07',
		house: 'lok-sabha',
		session_name: 'Monsoon Session 2023',
		status: 'sat',
		isDemoSeed: false
	},
	{
		id: 'sit-rs-2023-08-09',
		date: '2023-08-09',
		house: 'rajya-sabha',
		session_name: 'Monsoon Session 2023',
		status: 'sat',
		isDemoSeed: false
	},
	{
		id: 'sit-ls-2026-03-27',
		date: '2026-03-27',
		house: 'lok-sabha',
		session_name: 'Budget Session 2026',
		status: 'sat',
		isDemoSeed: false
	},
	{
		id: 'sit-ls-2026-04-01',
		date: '2026-04-01',
		house: 'lok-sabha',
		session_name: 'Budget Session 2026',
		status: 'sat',
		isDemoSeed: false
	},
	{
		id: 'sit-rs-2026-04-02',
		date: '2026-04-02',
		house: 'rajya-sabha',
		session_name: 'Budget Session 2026',
		status: 'sat',
		isDemoSeed: false
	},
	{
		id: 'sit-rs-2025-04-01',
		date: '2025-04-01',
		house: 'rajya-sabha',
		session_name: 'Budget Session 2025',
		status: 'sat',
		isDemoSeed: false
	},
	{
		id: 'sit-rs-2025-04-02',
		date: '2025-04-02',
		house: 'rajya-sabha',
		session_name: 'Budget Session 2025',
		status: 'sat',
		isDemoSeed: false
	},
	{
		id: 'sit-ls-2025-04-03',
		date: '2025-04-03',
		house: 'lok-sabha',
		session_name: 'Budget Session 2025',
		status: 'sat',
		isDemoSeed: false
	},
	{
		id: 'sit-rs-2025-04-04',
		date: '2025-04-04',
		house: 'rajya-sabha',
		session_name: 'Budget Session 2025',
		status: 'sat',
		isDemoSeed: false
	}
];

const curatedTimelineEvents: TimelineEvent[] = [
	{
		id: 'evt-income-tax-select-report-2025-07-21',
		date: '2025-07-21',
		house: 'lok-sabha',
		type: 'committee_report_tabled',
		title: 'Income-Tax Bill Select Committee report recorded',
		description: 'Parliament Digital Library lists the Select Committee report on the Income-Tax Bill, 2025 with date 21 July 2025.',
		related_bill_id: 'income-tax-bill-2025',
		source_url: 'https://eparlib.sansad.in/handle/123456789/2992139?view_type=browse',
		isDemoSeed: false
	},
	{
		id: 'evt-finance-bill-passed-2025-03-25',
		date: '2025-03-25',
		house: 'lok-sabha',
		type: 'bill_passed_origin_house',
		title: 'Finance Bill, 2025 passed in Lok Sabha',
		description: 'PIB release records Lok Sabha passage of the Finance Bill on 25 March 2025 during the Budget Session.',
		related_bill_id: 'finance-bill-2025',
		source_url: 'https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2118945',
		isDemoSeed: false
	},
	{
		id: 'evt-finance-act-assent-2025-03-29',
		date: '2025-03-29',
		house: 'lok-sabha',
		type: 'bill_assented',
		title: 'Finance Act, 2025 received assent',
		description: 'Gazette PDF records Presidential assent and publication on 29 March 2025.',
		related_bill_id: 'finance-bill-2025',
		source_url: 'https://incometaxindia.gov.in/Documents/Act/Finance-Act-2025.pdf',
		isDemoSeed: false
	},
	{
		id: 'evt-dpdp-ls-passed-2023-08-07',
		date: '2023-08-07',
		house: 'lok-sabha',
		type: 'bill_passed_origin_house',
		title: 'Digital Personal Data Protection Bill passed by Lok Sabha',
		description: 'Bill text records passage by Lok Sabha on 7 August 2023.',
		related_bill_id: 'digital-personal-data-protection-bill-2023',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/PassedBothHouses/data%20protection818202332045PM.pdf?source=legislation',
		isDemoSeed: false
	},
	{
		id: 'evt-dpdp-rs-passed-2023-08-09',
		date: '2023-08-09',
		house: 'rajya-sabha',
		type: 'bill_passed_second_house',
		title: 'Digital Personal Data Protection Bill passed by Rajya Sabha',
		description: 'Bill text records passage by Rajya Sabha on 9 August 2023.',
		related_bill_id: 'digital-personal-data-protection-bill-2023',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/PassedBothHouses/data%20protection818202332045PM.pdf?source=legislation',
		isDemoSeed: false
	},
	{
		id: 'evt-jan-vishwas-2026-rs-passed-2026-04-02',
		date: '2026-04-02',
		house: 'rajya-sabha',
		type: 'bill_passed_second_house',
		title: 'Jan Vishwas Bill, 2026 passed by both Houses',
		description: 'PIB records that Lok Sabha and Rajya Sabha passed the Jan Vishwas (Amendment of Provisions) Bill, 2026.',
		related_bill_id: 'jan-vishwas-amendment-provisions-bill-2026',
		source_url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2248596',
		isDemoSeed: false
	},
	{
		id: 'evt-jan-vishwas-2026-ls-passed-2026-04-01',
		date: '2026-04-01',
		house: 'lok-sabha',
		type: 'bill_passed_origin_house',
		title: 'Jan Vishwas Bill, 2026 passed by Lok Sabha',
		description: 'The 2026 Bill advanced from Lok Sabha before Rajya Sabha passage on 2 April 2026.',
		related_bill_id: 'jan-vishwas-amendment-provisions-bill-2026',
		source_url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2248596',
		isDemoSeed: false
	},
	{
		id: 'evt-jan-vishwas-2026-introduced-2026-03-27',
		date: '2026-03-27',
		house: 'lok-sabha',
		type: 'bill_introduced',
		title: 'Jan Vishwas Bill, 2026 introduced',
		description: 'PIB notes the 2026 Bill followed the 2025 Bill and Select Committee process.',
		related_bill_id: 'jan-vishwas-amendment-provisions-bill-2026',
		source_url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2248596',
		isDemoSeed: false
	},
	{
		id: 'evt-waqf-act-assent-2025-04-05',
		date: '2025-04-05',
		house: 'lok-sabha',
		type: 'bill_assented',
		title: 'Waqf (Amendment) Act, 2025 recorded',
		description: 'Central Waqf Council publishes the Waqf (Amendment) Act, 2025 as Act No. 14 of 2025.',
		related_bill_id: 'waqf-amendment-bill-2025',
		source_url: 'https://centralwaqfcouncil.gov.in/content/waqf-amendment-act-2025',
		isDemoSeed: false
	},
	{
		id: 'evt-waqf-ls-passed-2025-04-03',
		date: '2025-04-03',
		house: 'lok-sabha',
		type: 'bill_passed_origin_house',
		title: 'Waqf (Amendment) Bill passed by Lok Sabha',
		description: 'Sansad passed-both-Houses text records Lok Sabha passage on 3 April 2025.',
		related_bill_id: 'waqf-amendment-bill-2025',
		source_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/PassedBothHouses/THE%20WAQF%20%28AMENDMENT%29%20BILL%2C%202025411202521212PM.pdf?source=legislation',
		isDemoSeed: false
	},
	{
		id: 'evt-aircraft-objects-act-2025-04-16',
		date: '2025-04-16',
		house: 'rajya-sabha',
		type: 'bill_assented',
		title: 'Aircraft Objects Act published on India Code',
		description: 'India Code lists the Protection of Interests in Aircraft Objects Act, 2025 as Act No. 17 of 2025.',
		related_bill_id: 'protection-of-interests-in-aircraft-objects-bill-2025',
		source_url: 'https://www.indiacode.nic.in/handle/123456789/21133?locale=en',
		isDemoSeed: false
	},
	{
		id: 'evt-aircraft-objects-ls-passed-2025-04-03',
		date: '2025-04-03',
		house: 'lok-sabha',
		type: 'bill_passed_second_house',
		title: 'Aircraft Objects Bill passed by Lok Sabha',
		description: 'PRS records Lok Sabha passage on 3 April 2025 after Rajya Sabha passage.',
		related_bill_id: 'protection-of-interests-in-aircraft-objects-bill-2025',
		source_url: 'https://prsindia.org/billtrack/the-protection-of-interests-in-aircraft-objects-bill-2025',
		isDemoSeed: false
	},
	{
		id: 'evt-immigration-rs-passed-2025-04-02',
		date: '2025-04-02',
		house: 'rajya-sabha',
		type: 'bill_passed_second_house',
		title: 'Immigration and Foreigners Bill passed by Rajya Sabha',
		description: 'PRS records Rajya Sabha passage on 2 April 2025.',
		related_bill_id: 'immigration-and-foreigners-bill-2025',
		source_url: 'https://prsindia.org/billtrack/the-immigration-and-foreigners-bill-2025',
		isDemoSeed: false
	},
	{
		id: 'evt-tribhuvan-rs-passed-2025-04-01',
		date: '2025-04-01',
		house: 'rajya-sabha',
		type: 'bill_passed_second_house',
		title: '"Tribhuvan" Sahkari University Bill passed by Rajya Sabha',
		description: 'PRS records Rajya Sabha passage on 1 April 2025.',
		related_bill_id: 'tribhuvan-sahkari-university-bill-2025',
		source_url: 'https://prsindia.org/sessiontrack/budget-session-2025/bill-legislation',
		isDemoSeed: false
	}
];

export const committees: Committee[] = [
	{
		id: 'select-committee-income-tax-bill-2025',
		name: 'Select Committee of Lok Sabha to Examine the Income-Tax Bill, 2025',
		house: 'lok-sabha',
		type: 'select',
		source_url: 'https://sansad.in/ls/committee/other-committees/81%20Select%20Committee%20of%20Lok%20Sabha%20to%20Examine%20the%20Income-Tax%20Bill%202025-nameH%3Dundefined',
		isDemoSeed: false
	},
	{
		id: 'committee-communications-it',
		name: 'Standing Committee on Communications and Information Technology',
		house: 'lok-sabha',
		type: 'department-related',
		source_url: 'https://sansad.in/ls/committees',
		isDemoSeed: false
	},
	{
		id: 'select-committee-jan-vishwas-2025',
		name: 'Select Committee of Lok Sabha on the Jan Vishwas (Amendment of Provisions) Bill, 2025',
		house: 'lok-sabha',
		type: 'select',
		source_url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2248596',
		isDemoSeed: false
	},
	{
		id: 'joint-committee-waqf-amendment-bill-2024',
		name: 'Joint Committee on the Waqf (Amendment) Bill, 2024',
		house: 'joint-sitting',
		type: 'joint',
		source_url: 'https://sansad.in/getFile/bull2mk/2024/12-08-24n.pdf?source=loksabhadocs',
		isDemoSeed: false
	}
];

export const questions: Question[] = [];

export const debates: Debate[] = [
	{
		id: 'debate-income-tax-bill-introduced',
		house: 'lok-sabha',
		date: '2025-02-13',
		title: 'The Income-Tax Bill, 2025 - introduced',
		summary: 'Parliament Digital Library records Government Bills proceedings for introduction of the Income-Tax Bill, 2025.',
		source_url: 'https://eparlib.sansad.in/handle/123456789/2991966?view_type=search',
		transcript_url: 'https://eparlib.sansad.in/bitstream/123456789/2991966/1/1962.pdf',
		transcript_pages: 3,
		transcript_size: '148.77 kB',
		transcript_language: 'Original',
		members: ['Nirmala Sitharaman', 'Om Birla', 'Sougata Ray'],
		lok_sabha_number: '18',
		session_number: 'IV',
		debate_type: 'GOVERNMENT BILLS',
		isDemoSeed: false
	},
	{
		id: 'debate-dpdp-bill-introduced',
		house: 'lok-sabha',
		date: '2023-08-03',
		title: 'The Digital Personal Data Protection Bill, 2023 - introduced',
		summary: 'Parliament Digital Library records introduction proceedings for the Digital Personal Data Protection Bill, 2023.',
		source_url: 'https://eparlib.sansad.in/handle/123456789/2505325?view_type=search',
		transcript_url: 'https://eparlib.sansad.in/bitstream/123456789/2505325/1/11960.pdf',
		transcript_pages: 5,
		transcript_size: '2.29 MB',
		transcript_language: 'Original',
		members: ['Adhir Ranjan Chowdhury', 'Asaduddin Owaisi', 'Ashwini Vaishnaw', 'Gaurav Gogoi', 'Manish Tewari', 'N. K. Premachandran', 'Rajendra Agrawal', 'Sougata Ray', 'Shashi Tharoor', 'Supriya Sule'],
		lok_sabha_number: '17',
		session_number: 'XII',
		debate_type: 'GOVERNMENT BILLS',
		isDemoSeed: false
	},
	{
		id: 'debate-tribhuvan-bill-passed',
		house: 'lok-sabha',
		date: '2025-03-26',
		title: 'Tribhuvan Sahkari University Bill, 2025 - passed',
		summary: 'Parliament Digital Library records Lok Sabha proceedings for passage of the Tribhuvan Sahkari University Bill, 2025.',
		source_url: 'https://eparlib.sansad.in/handle/123456789/2991119?view_type=search',
		transcript_url: 'https://eparlib.sansad.in/bitstream/123456789/2991119/1/2667.pdf',
		transcript_pages: 80,
		transcript_size: '1.2 MB',
		transcript_language: 'Original',
		members: [
			'Amit Shah',
			'Sandhya Ray',
			'Geniben Nagaji Thakor',
			'Mitesh Patel Bakabhai',
			'Virendra Singh',
			'Sougata Ray',
			'Nishikant Dubey',
			'K E Prakash',
			'Sribharat Mathukumilli',
			'Dileshwar Kamait',
			'Bhaskar Murlidhar Bhagare',
			'Arvind Ganpat Sawant',
			'Naresh Ganpat Mhaske',
			'M K Raghavan',
			'Arun Govil',
			'Abhay Kumar Sinha',
			'Aditya Yadav',
			'Kadiyam Kavya',
			'Ganesh Singh',
			'Sachithanantham R',
			'Gumma Thanuja Rani',
			'Rajesh Ranjan',
			'Bharti Pardhi',
			'Pralhad Joshi',
			'M P Abdussamad Samadani',
			'K. Francis George',
			'N K Premachandran',
			'Prashant Yadaorao Padole',
			'Janardan Mishra',
			'Balashowry Vallabhaneni',
			'Gurmeet Singh Meet Hayer',
			'Eatala Rajender',
			'Vishaldada Prakashbapu Patil',
			'Chhotelal',
			'Jayanta Kumar Roy',
			'Om Birla',
			'K Radhakrishnan'
		],
		lok_sabha_number: '18',
		session_number: 'IV',
		debate_type: 'GOVERNMENT BILLS',
		isDemoSeed: false
	},
	{
		id: 'debate-aircraft-objects-bill-introduced',
		house: 'rajya-sabha',
		date: '2025-02-10',
		title: 'Protection of Interests in Aircraft Objects Bill, 2025 - introduced',
		summary: 'PRS bill text and bill tracker record introduction in Rajya Sabha on 10 February 2025.',
		source_url: 'https://prsindia.org/billtrack/the-protection-of-interests-in-aircraft-objects-bill-2025',
		isDemoSeed: false
	}
];

const curatedActs: Act[] = [
	{
		id: 'finance-act-2025',
		title: 'Finance Act, 2025',
		act_number: 'Act No. 7 of 2025',
		year: 2025,
		linked_bill_id: 'finance-bill-2025',
		india_code_url: 'https://incometaxindia.gov.in/Documents/Act/Finance-Act-2025.pdf',
		isDemoSeed: false
	},
	{
		id: 'digital-personal-data-protection-act-2023',
		title: 'Digital Personal Data Protection Act, 2023',
		act_number: 'Act No. 22 of 2023',
		year: 2023,
		linked_bill_id: 'digital-personal-data-protection-bill-2023',
		india_code_url: 'https://sansad.in/getFile/BillsTexts/LSBillTexts/PassedBothHouses/data%20protection818202332045PM.pdf?source=legislation',
		isDemoSeed: false
	},
	{
		id: 'tribhuvan-sahkari-university-act-2025',
		title: '"Tribhuvan" Sahkari University Act, 2025',
		act_number: 'Act No. 11 of 2025',
		year: 2025,
		linked_bill_id: 'tribhuvan-sahkari-university-bill-2025',
		india_code_url: 'https://www.indiacode.nic.in/bitstream/123456789/21049/1/a2025-11.pdf',
		isDemoSeed: false
	},
	{
		id: 'immigration-and-foreigners-act-2025',
		title: 'Immigration and Foreigners Act, 2025',
		act_number: 'Act No. 13 of 2025',
		year: 2025,
		linked_bill_id: 'immigration-and-foreigners-bill-2025',
		india_code_url: 'https://www.indiacode.nic.in/bitstream/123456789/21918/1/A2025-13.pdf',
		isDemoSeed: false
	},
	{
		id: 'waqf-amendment-act-2025',
		title: 'Waqf (Amendment) Act, 2025',
		act_number: 'Act No. 14 of 2025',
		year: 2025,
		linked_bill_id: 'waqf-amendment-bill-2025',
		india_code_url: 'https://centralwaqfcouncil.gov.in/content/waqf-amendment-act-2025',
		isDemoSeed: false
	},
	{
		id: 'protection-of-interests-in-aircraft-objects-act-2025',
		title: 'Protection of Interests in Aircraft Objects Act, 2025',
		act_number: 'Act No. 17 of 2025',
		year: 2025,
		linked_bill_id: 'protection-of-interests-in-aircraft-objects-bill-2025',
		india_code_url: 'https://www.indiacode.nic.in/bitstream/123456789/21133/1/A2025-17.pdf',
		isDemoSeed: false
	}
];

function mergeById<T extends { id: string }>(primary: T[], fallback: T[]): T[] {
	const seen = new Set(primary.map((item) => item.id));
	return [...primary, ...fallback.filter((item) => !seen.has(item.id))];
}

const curatedBillIds = new Set(curatedBills.map((bill) => bill.id));

export const bills: Bill[] = mergeById(mergeById(mergeById(curatedBills, sansadBills), prsBills), pdlPre2004Bills);
export const billActions: BillAction[] = mergeById(
	curatedBillActions,
	[
		...sansadBillActions.filter((action) => !curatedBillIds.has(action.bill_id)),
		...prsBillActions,
		...pdlPre2004BillActions
	]
);
export const sittingDays: SittingDay[] = mergeById(mergeById(mergeById(sansadSittingDays, curatedSittingDays), prsSittingDays), pdlPre2004SittingDays);
export const timelineEvents: TimelineEvent[] = mergeById(
	curatedTimelineEvents,
	[
		...sansadTimelineEvents.filter((event) => !event.related_bill_id || !curatedBillIds.has(event.related_bill_id)),
		...prsTimelineEvents,
		...pdlPre2004TimelineEvents
	]
);
export const acts: Act[] = mergeById(
	curatedActs,
	sansadActs.filter((act) => !curatedBillIds.has(act.linked_bill_id))
);

export const sources: SourceEntry[] = [
	{
		id: 'source-sansad',
		name: 'Sansad portal',
		kind: 'sansad',
		url: 'https://sansad.in/',
		preparedFor: 'Parliament home pages, sessions, members, questions, debates, committees, and legislation records.',
		status: 'prepared'
	},
	{
		id: 'source-lok-sabha',
		name: 'Lok Sabha official pages',
		kind: 'lok-sabha',
		url: 'https://sansad.in/ls',
		preparedFor: 'Lok Sabha Bills, agenda items, questions, debates, committee referrals, and sitting-day activity.',
		status: 'future-adapter'
	},
	{
		id: 'source-rajya-sabha',
		name: 'Rajya Sabha official pages',
		kind: 'rajya-sabha',
		url: 'https://sansad.in/rs',
		preparedFor: 'Rajya Sabha Bills, questions, debates, and Money Bill recommendation-window updates.',
		status: 'future-adapter'
	},
	{
		id: 'source-prs',
		name: 'PRS Legislative Research',
		kind: 'prs',
		url: 'https://prsindia.org/billtrack/category/all',
		preparedFor: 'Historical Parliament bill tracking records, summaries, ministries, stage dates, and source links before the Sansad API coverage window.',
		status: 'prepared'
	},
	{
		id: 'source-pdl',
		name: 'Parliament Digital Library',
		kind: 'lok-sabha',
		url: 'https://eparlib.sansad.in/',
		preparedFor: 'Pre-2004 Lok Sabha bill proceedings and debate-title records for historical Prime Minister term coverage.',
		status: 'prepared'
	},
	{
		id: 'source-india-code',
		name: 'India Code',
		kind: 'india-code',
		url: 'https://www.indiacode.nic.in/',
		preparedFor: 'Act text, Act numbers, central legislation, state legislation, and bilingual legal access.',
		status: 'future-adapter'
	},
	{
		id: 'source-data-gov',
		name: 'Open Government Data Platform India',
		kind: 'data-gov',
		url: 'https://data.gov.in/',
		preparedFor: 'Supplemental catalog and metadata datasets when official datasets are available.',
		status: 'future-adapter'
	},
	{
		id: 'source-egazette',
		name: 'eGazette',
		kind: 'egazette',
		url: 'https://egazette.nic.in/',
		preparedFor: 'Post-assent publication notices and Gazette notification trail.',
		status: 'future-adapter'
	},
	{
		id: 'source-neva',
		name: 'NeVA',
		kind: 'neva',
		url: 'https://neva.gov.in/',
		preparedFor: 'State legislature expansion through Vidhan Sabha and Vidhan Parishad sources.',
		status: 'future-adapter'
	}
];
