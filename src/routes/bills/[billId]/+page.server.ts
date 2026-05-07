import { error } from '@sveltejs/kit';
import { parseLanguage } from '$lib/domain/localization';
import { createLegislativeRepository } from '$lib/server/repositories/legislative';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const repository = createLegislativeRepository();
	const detail = await repository.getBillDetail(params.billId);
	if (!detail) {
		error(404, 'Bill not found in demo seed data');
	}

	return {
		detail,
		language: parseLanguage(url.searchParams.get('lang')),
		relatedEvents: await repository.getTimelineEventsForBill(params.billId)
	};
};
