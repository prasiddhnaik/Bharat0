const sourceUrlPatternsByFilter: Record<string, string[]> = {
	'source-sansad': ['sansad.in/getFile', 'sansad.in/ls', 'sansad.in/rs'],
	'source-lok-sabha': ['sansad.in/ls', 'source=loksabhadocs', 'LSSCOMMITTEE', 'eparlib.sansad.in'],
	'source-rajya-sabha': ['sansad.in/rs', 'rajya sabha'],
	'source-prs': ['prsindia.org'],
	'source-pdl': ['eparlib.sansad.in'],
	'source-india-code': ['indiacode.nic.in', 'incometaxindia.gov.in/Documents/Act'],
	'source-data-gov': ['data.gov.in'],
	'source-egazette': ['egazette.nic.in'],
	'source-neva': ['neva.gov.in'],
	sansad: ['sansad.in/getFile', 'sansad.in/ls', 'sansad.in/rs'],
	'lok-sabha': ['sansad.in/ls', 'source=loksabhadocs', 'LSSCOMMITTEE', 'eparlib.sansad.in'],
	'rajya-sabha': ['sansad.in/rs', 'rajya sabha'],
	prs: ['prsindia.org'],
	'india-code': ['indiacode.nic.in', 'incometaxindia.gov.in/Documents/Act'],
	'data-gov': ['data.gov.in'],
	egazette: ['egazette.nic.in'],
	neva: ['neva.gov.in']
};

export function getSourceUrlPatternsForFilter(sourceFilter: string) {
	if (sourceFilter === 'all') return [];
	return sourceUrlPatternsByFilter[sourceFilter] ?? [];
}

export function matchesSourceUrl(url: string | null | undefined, sourceFilter: string) {
	if (sourceFilter === 'all') return true;
	if (!url) return false;
	const normalizedUrl = url.toLowerCase();
	return getSourceUrlPatternsForFilter(sourceFilter).some((pattern) => normalizedUrl.includes(pattern.toLowerCase()));
}
