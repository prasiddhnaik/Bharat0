import type { Bill, BillStage, BillType, House, SectionId } from './types';

export const LANGUAGES = ['en', 'hi'] as const;
export type Language = (typeof LANGUAGES)[number];

type TranslationKey =
	| 'app.demoSeedOnly'
	| 'app.title'
	| 'app.systemModel'
	| 'app.noScraping'
	| 'app.parliamentModel'
	| 'app.stageMachineModel'
	| 'app.firstClassSurfaces'
	| 'action.applyFilters'
	| 'action.openBillRoute'
	| 'action.selectBill'
	| 'field.search'
	| 'field.house'
	| 'field.sessionDay'
	| 'field.billStage'
	| 'field.allHouses'
	| 'field.allStages'
	| 'field.originHouse'
	| 'field.billNumber'
	| 'field.introduced'
	| 'field.latestAction'
	| 'field.actionHistory'
	| 'label.demoSeedData'
	| 'label.demoSeedRecords'
	| 'label.filteredTimeline'
	| 'label.preparedEntities'
	| 'label.futureAdapters'
	| 'label.searchPlaceholder'
	| 'section.overview'
	| 'section.houses'
	| 'section.states'
	| 'section.timeline'
	| 'section.bills'
	| 'section.committees'
	| 'section.questions'
	| 'section.debates'
	| 'section.acts'
	| 'section.sources';

const translations: Record<Language, Record<TranslationKey, string>> = {
	en: {
		'app.demoSeedOnly': 'Official public records',
		'app.title': 'Indian legislative intelligence, mapped as a timeline.',
		'app.systemModel': 'System model',
		'app.noScraping': 'Public source links are shown for transparency. This local prototype does not collect sign-in, payment, or private browsing data.',
		'app.parliamentModel': 'Parliament = President + Lok Sabha + Rajya Sabha.',
		'app.stageMachineModel': 'Ordinary Bills and Money Bills use different stage machines.',
		'app.firstClassSurfaces': 'Committees, questions, debates, Acts, and source links are first-class surfaces.',
		'action.applyFilters': 'Apply filters',
		'action.openBillRoute': 'Open bill route',
		'action.selectBill': 'Select a Bill',
		'field.search': 'Search',
		'field.house': 'House',
		'field.sessionDay': 'Session day',
		'field.billStage': 'Bill stage',
		'field.allHouses': 'All Houses',
		'field.allStages': 'All stages',
		'field.originHouse': 'Origin House',
		'field.billNumber': 'Bill number',
		'field.introduced': 'Introduced',
		'field.latestAction': 'Latest action',
		'field.actionHistory': 'Action history',
		'label.demoSeedData': 'official source',
		'label.demoSeedRecords': 'official records',
		'label.filteredTimeline': 'filtered timeline',
		'label.preparedEntities': 'prepared entities',
		'label.futureAdapters': 'planned sources',
		'label.searchPlaceholder': 'Search bills, Hindi titles, ministries',
		'section.overview': 'Overview',
		'section.houses': 'Houses',
		'section.states': 'States',
		'section.timeline': 'Timeline',
		'section.bills': 'Bills',
		'section.committees': 'Committees',
		'section.questions': 'Questions',
		'section.debates': 'Debates',
		'section.acts': 'Acts',
		'section.sources': 'Sources'
	},
	hi: {
		'app.demoSeedOnly': 'आधिकारिक सार्वजनिक रिकॉर्ड',
		'app.title': 'भारतीय विधायी इंटेलिजेंस, टाइमलाइन के रूप में।',
		'app.systemModel': 'प्रणाली मॉडल',
		'app.noScraping': 'पारदर्शिता के लिए सार्वजनिक स्रोत लिंक दिखाए गए हैं। यह स्थानीय प्रोटोटाइप साइन-इन, भुगतान या निजी ब्राउज़िंग डेटा एकत्र नहीं करता।',
		'app.parliamentModel': 'संसद = राष्ट्रपति + लोक सभा + राज्य सभा।',
		'app.stageMachineModel': 'साधारण विधेयक और धन विधेयक अलग चरण मशीनों का उपयोग करते हैं।',
		'app.firstClassSurfaces': 'समितियां, प्रश्न, बहस, अधिनियम और स्रोत लिंक प्रथम-श्रेणी सतहें हैं।',
		'action.applyFilters': 'फ़िल्टर लागू करें',
		'action.openBillRoute': 'विधेयक पृष्ठ खोलें',
		'action.selectBill': 'विधेयक चुनें',
		'field.search': 'खोज',
		'field.house': 'सदन',
		'field.sessionDay': 'बैठक दिवस',
		'field.billStage': 'विधेयक चरण',
		'field.allHouses': 'सभी सदन',
		'field.allStages': 'सभी चरण',
		'field.originHouse': 'उत्पत्ति सदन',
		'field.billNumber': 'विधेयक संख्या',
		'field.introduced': 'प्रस्तुत',
		'field.latestAction': 'नवीनतम कार्रवाई',
		'field.actionHistory': 'कार्रवाई इतिहास',
		'label.demoSeedData': 'आधिकारिक स्रोत',
		'label.demoSeedRecords': 'आधिकारिक रिकॉर्ड',
		'label.filteredTimeline': 'फ़िल्टर की गई टाइमलाइन',
		'label.preparedEntities': 'तैयार इकाइयां',
		'label.futureAdapters': 'योजित स्रोत',
		'label.searchPlaceholder': 'विधेयक, हिंदी शीर्षक, मंत्रालय खोजें',
		'section.overview': 'अवलोकन',
		'section.houses': 'सदन',
		'section.states': 'राज्य',
		'section.timeline': 'टाइमलाइन',
		'section.bills': 'विधेयक',
		'section.committees': 'समितियां',
		'section.questions': 'प्रश्न',
		'section.debates': 'बहस',
		'section.acts': 'अधिनियम',
		'section.sources': 'स्रोत'
	}
};

export const houseLabelsLocalized: Record<Language, Record<House, string>> = {
	en: {
		'lok-sabha': 'Lok Sabha',
		'rajya-sabha': 'Rajya Sabha',
		'joint-sitting': 'Joint Sitting',
		'state-assembly': 'State Assembly',
		'state-council': 'State Council'
	},
	hi: {
		'lok-sabha': 'लोक सभा',
		'rajya-sabha': 'राज्य सभा',
		'joint-sitting': 'संयुक्त बैठक',
		'state-assembly': 'राज्य विधानसभा',
		'state-council': 'राज्य विधान परिषद'
	}
};

export const billTypeLabelsLocalized: Record<Language, Record<BillType, string>> = {
	en: {
		ordinary: 'Ordinary Bill',
		money: 'Money Bill',
		financial: 'Financial Bill',
		'constitutional-amendment': 'Constitution Amendment Bill'
	},
	hi: {
		ordinary: 'साधारण विधेयक',
		money: 'धन विधेयक',
		financial: 'वित्तीय विधेयक',
		'constitutional-amendment': 'संविधान संशोधन विधेयक'
	}
};

export const stageLabelsLocalized: Record<Language, Record<BillStage, string>> = {
	en: {
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
	},
	hi: {
		draft: 'मसौदा',
		introduced: 'प्रस्तुत',
		listed: 'सूचीबद्ध',
		taken_up: 'विचार के लिए लिया गया',
		referred_committee: 'समिति को भेजा गया',
		committee_reported: 'समिति रिपोर्ट प्रस्तुत',
		passed_origin_house: 'उत्पत्ति सदन से पारित',
		transmitted_to_other_house: 'दूसरे सदन को भेजा गया',
		passed_second_house: 'दूसरे सदन से पारित',
		returned_with_amendments: 'संशोधनों सहित लौटाया गया',
		joint_sitting_possible: 'संयुक्त बैठक संभव',
		joint_sitting_passed: 'संयुक्त बैठक से पारित',
		president_assent_pending: 'राष्ट्रपति की स्वीकृति लंबित',
		assented: 'स्वीकृत',
		act_published: 'अधिनियम प्रकाशित',
		withdrawn: 'वापस लिया गया',
		lapsed: 'लुप्त',
		introduced_lok_sabha: 'लोक सभा में प्रस्तुत',
		passed_lok_sabha: 'लोक सभा से पारित',
		sent_to_rajya_sabha: 'राज्य सभा को भेजा गया',
		rajya_sabha_recommendation_period: 'राज्य सभा सिफारिश अवधि',
		returned_with_recommendations: 'सिफारिशों सहित लौटाया गया',
		deemed_passed_after_14_days: '14 दिनों बाद पारित माना गया'
	}
};

export function parseLanguage(value: string | null): Language {
	return value === 'hi' ? 'hi' : 'en';
}

export function t(key: string, language: Language): string {
	return translations[language][key as TranslationKey] ?? translations.en[key as TranslationKey] ?? key;
}

export function getSectionLabel(section: SectionId, language: Language): string {
	return t(`section.${section}`, language);
}

export function getBillTitle(bill: Pick<Bill, 'title_en' | 'title_hi'>, language: Language): string {
	return language === 'hi' ? bill.title_hi : bill.title_en;
}

export function getBillSubtitle(bill: Pick<Bill, 'title_en' | 'title_hi'>, language: Language): string {
	return language === 'hi' ? bill.title_en : bill.title_hi;
}
