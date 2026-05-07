import { isBillStage, isHouse, isSectionId } from './bill-stage-machine';
import { parseLanguage, type Language } from './localization';
import { isPrimeMinisterFilter, type PrimeMinisterFilter } from './prime-ministers';
import type { BillStage, House, SectionId } from './types';

export const DEFAULT_DASHBOARD_DATE = '2026-04-25';
export const DEFAULT_BILLS_PAGE_SIZE = 60;

export type DashboardFilters = {
	section: SectionId;
	house: House | 'all';
	date: string;
	status: BillStage | 'all';
	area: string;
	source: string;
	primeMinister: PrimeMinisterFilter;
	query: string;
	language: Language;
	page: number;
	pageSize: number;
};

function parsePositiveInteger(value: string | null, fallback: number) {
	const parsed = Number.parseInt(value ?? '', 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseDashboardFilters(searchParams: URLSearchParams): DashboardFilters {
	const sectionParam = searchParams.get('section');
	const houseParam = searchParams.get('house');
	const statusParam = searchParams.get('status');
	const primeMinisterParam = searchParams.get('pm');
	const pageSize = Math.min(parsePositiveInteger(searchParams.get('pageSize'), DEFAULT_BILLS_PAGE_SIZE), 100);

	return {
		section: isSectionId(sectionParam) ? sectionParam : 'overview',
		house: isHouse(houseParam) ? houseParam : 'all',
		date: searchParams.get('date') ?? DEFAULT_DASHBOARD_DATE,
		status: isBillStage(statusParam) ? statusParam : 'all',
		area: searchParams.get('area') ?? 'all',
		source: searchParams.get('source') ?? 'all',
		primeMinister: isPrimeMinisterFilter(primeMinisterParam) ? primeMinisterParam : 'all',
		query: searchParams.get('q') ?? '',
		language: parseLanguage(searchParams.get('lang')),
		page: parsePositiveInteger(searchParams.get('page'), 1),
		pageSize
	};
}
