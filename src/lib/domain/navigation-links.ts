import type { DashboardFilters } from './dashboard-filters';
import type { SectionId } from './types';

export function hrefForSection(
	filters: DashboardFilters,
	section: SectionId,
	params: Record<string, string> = {}
) {
	const search = new URLSearchParams({
		section,
		lang: filters.language,
		page: params.page ?? '1',
		pageSize: params.pageSize ?? String(filters.pageSize),
		...params
	});

	if (filters.query) search.set('q', filters.query);
	if (filters.house !== 'all') search.set('house', filters.house);
	if (filters.status !== 'all') search.set('status', filters.status);
	if (filters.area !== 'all') search.set('area', filters.area);
	if (filters.source !== 'all' && !(section === 'bills' && filters.source === 'source-data-gov')) search.set('source', filters.source);
	if (filters.primeMinister !== 'all') search.set('pm', filters.primeMinister);
	if (filters.date) search.set('date', filters.date);

	return `/?${search.toString()}`;
}
