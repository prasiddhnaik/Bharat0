import { parseDashboardFilters } from '$lib/data/view-model';
import { createLegislativeRepository } from '$lib/server/repositories/legislative';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const filters = parseDashboardFilters(url.searchParams);
	const repository = createLegislativeRepository();
	const dashboard = await repository.getDashboardData(filters);
	const selectedBillId = url.searchParams.get('bill') ?? dashboard.bills[0]?.id ?? null;
	const selectedBill = selectedBillId ? await repository.getBillDetail(selectedBillId) : null;

	return {
		dashboard,
		selectedBillId,
		selectedBill
	};
};
