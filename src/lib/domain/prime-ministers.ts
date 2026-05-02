export type PrimeMinisterTerm = {
	id: string;
	name: string;
	party: string;
	termLabel: string;
	startDate: string;
	endDate?: string;
	lokSabha?: string;
};

const primeMinisterTerms = [
	{ id: 'modi-3', name: 'Narendra Modi', party: 'BJP', termLabel: '3rd term', startDate: '2024-06-09', lokSabha: '18th Lok Sabha' },
	{ id: 'modi-2', name: 'Narendra Modi', party: 'BJP', termLabel: '2nd term', startDate: '2019-05-30', endDate: '2024-06-09', lokSabha: '17th Lok Sabha' },
	{ id: 'modi-1', name: 'Narendra Modi', party: 'BJP', termLabel: '1st term', startDate: '2014-05-26', endDate: '2019-05-30', lokSabha: '16th Lok Sabha' },
	{ id: 'manmohan-singh-2', name: 'Manmohan Singh', party: 'INC', termLabel: '2nd term', startDate: '2009-05-22', endDate: '2014-05-26', lokSabha: '15th Lok Sabha' },
	{ id: 'manmohan-singh-1', name: 'Manmohan Singh', party: 'INC', termLabel: '1st term', startDate: '2004-05-22', endDate: '2009-05-22', lokSabha: '14th Lok Sabha' },
	{ id: 'vajpayee-3', name: 'Atal Bihari Vajpayee', party: 'BJP', termLabel: '3rd term', startDate: '1999-10-13', endDate: '2004-05-22', lokSabha: '13th Lok Sabha' },
	{ id: 'vajpayee-2', name: 'Atal Bihari Vajpayee', party: 'BJP', termLabel: '2nd term', startDate: '1998-03-19', endDate: '1999-10-13', lokSabha: '12th Lok Sabha' },
	{ id: 'gujral', name: 'I. K. Gujral', party: 'JD', termLabel: 'term', startDate: '1997-04-21', endDate: '1998-03-19', lokSabha: '11th Lok Sabha' },
	{ id: 'deve-gowda', name: 'H. D. Deve Gowda', party: 'JD', termLabel: 'term', startDate: '1996-06-01', endDate: '1997-04-21', lokSabha: '11th Lok Sabha' },
	{ id: 'vajpayee-1', name: 'Atal Bihari Vajpayee', party: 'BJP', termLabel: '1st term', startDate: '1996-05-16', endDate: '1996-06-01', lokSabha: '11th Lok Sabha' },
	{ id: 'narasimha-rao', name: 'P. V. Narasimha Rao', party: 'INC', termLabel: 'term', startDate: '1991-06-21', endDate: '1996-05-16', lokSabha: '10th Lok Sabha' },
	{ id: 'chandra-shekhar', name: 'Chandra Shekhar', party: 'SJP', termLabel: 'term', startDate: '1990-11-10', endDate: '1991-06-21', lokSabha: '9th Lok Sabha' },
	{ id: 'vp-singh', name: 'V. P. Singh', party: 'JD', termLabel: 'term', startDate: '1989-12-02', endDate: '1990-11-10', lokSabha: '9th Lok Sabha' },
	{ id: 'rajiv-gandhi', name: 'Rajiv Gandhi', party: 'INC', termLabel: 'term', startDate: '1984-10-31', endDate: '1989-12-02', lokSabha: '8th Lok Sabha' },
	{ id: 'indira-gandhi-2', name: 'Indira Gandhi', party: 'INC', termLabel: '2nd premiership', startDate: '1980-01-14', endDate: '1984-10-31', lokSabha: '7th Lok Sabha' },
	{ id: 'charan-singh', name: 'Charan Singh', party: 'Janata Party (Secular)', termLabel: 'term', startDate: '1979-07-28', endDate: '1980-01-14', lokSabha: '6th Lok Sabha' },
	{ id: 'morarji-desai', name: 'Morarji Desai', party: 'Janata Party', termLabel: 'term', startDate: '1977-03-24', endDate: '1979-07-28', lokSabha: '6th Lok Sabha' },
	{ id: 'indira-gandhi-1', name: 'Indira Gandhi', party: 'INC', termLabel: '1st premiership', startDate: '1966-01-24', endDate: '1977-03-24', lokSabha: '3rd-5th Lok Sabha' },
	{ id: 'nanda-2', name: 'Gulzarilal Nanda', party: 'INC', termLabel: 'acting term', startDate: '1966-01-11', endDate: '1966-01-24', lokSabha: '3rd Lok Sabha' },
	{ id: 'lal-bahadur-shastri', name: 'Lal Bahadur Shastri', party: 'INC', termLabel: 'term', startDate: '1964-06-09', endDate: '1966-01-11', lokSabha: '3rd Lok Sabha' },
	{ id: 'nanda-1', name: 'Gulzarilal Nanda', party: 'INC', termLabel: 'acting term', startDate: '1964-05-27', endDate: '1964-06-09', lokSabha: '3rd Lok Sabha' },
	{ id: 'nehru', name: 'Jawaharlal Nehru', party: 'INC', termLabel: 'term', startDate: '1947-08-15', endDate: '1964-05-27', lokSabha: 'Constituent Assembly, Provisional Parliament, 1st-3rd Lok Sabha' }
] as const;

export const PRIME_MINISTER_TERMS: readonly PrimeMinisterTerm[] = primeMinisterTerms;
export type PrimeMinisterTermId = (typeof primeMinisterTerms)[number]['id'];
export type PrimeMinisterFilter = PrimeMinisterTermId | 'all';

export function isPrimeMinisterFilter(value: string | null): value is PrimeMinisterFilter {
	return value === 'all' || PRIME_MINISTER_TERMS.some((term) => term.id === value);
}

export function getPrimeMinisterTerm(id: PrimeMinisterFilter) {
	if (id === 'all') return null;
	return PRIME_MINISTER_TERMS.find((term) => term.id === id) ?? null;
}

export function billDateMatchesPrimeMinisterTerm(date: string, termId: PrimeMinisterFilter) {
	const term = getPrimeMinisterTerm(termId);
	if (!term) return true;
	return date >= term.startDate && (!term.endDate || date < term.endDate);
}

export function getPrimeMinisterTermDateRange(termId: PrimeMinisterFilter) {
	const term = getPrimeMinisterTerm(termId);
	if (!term) return {};
	return {
		startDate: term.startDate,
		endDate: term.endDate
	};
}

export function getPrimeMinisterTermLabel(term: PrimeMinisterTerm) {
	const end = term.endDate ? term.endDate.slice(0, 4) : 'present';
	return `${term.name} · ${term.termLabel} (${term.startDate.slice(0, 4)}-${end})`;
}
