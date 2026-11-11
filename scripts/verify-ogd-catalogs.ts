import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchOgdCatalog, validateOgdSnapshot } from '../src/lib/ingestion/ogd-catalogs';
import { dataGovDiscoveryTargets } from '../src/lib/ingestion/source-discovery';

const target = dataGovDiscoveryTargets[0];
const uuid = 'd3d3d8bf-e170-4fdc-abc5-1fba050acf44';
const alias = '/catalog/answers-data-rajya-sabha-questions-session-249';
const lookup = { nid: [{ value: 6715802 }], uuid: [{ value: uuid }], status: [{ value: true }], path: [{ alias }], field_is_api_available: [{ value: false }] };
const metadata = [{ nid: '6715802', uuid, node_alias: alias, title: 'Answers Data of Rajya Sabha Questions for Session 249', updated_date: '17/02/2025', field_keywords: 'Agriculture||Health', field_group_name: 'Rajya Sabha - Annexures to Parliamentary Questions' }];

test('official OGD JSON metadata preserves the source date and catalog identity', async () => {
	const result = await fetchOgdCatalog(target, async (url) => {
		if (url === 'https://www.data.gov.in/backend/dms/v2/catalog/answers-data-rajya-sabha-questions-session-249?_format=json') return lookup;
		if (url === 'https://www.data.gov.in/backend/dms/v2/api-export/catalog/6715802?_format=json') return metadata;
		throw new Error('Unexpected source request');
	});
	assert.equal(result.metadata?.dataGovCatalog?.updatedDate, '17/02/2025');
	assert.equal(result.metadata?.dataGovCatalog?.uuid, uuid);
	assert.equal(result.finalUrl, 'https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-249');
});

test('OGD rejects mismatched identities, invalid dates and unpublished catalogs', async () => {
	for (const row of [{ ...metadata[0], uuid: 'wrong' }, { ...metadata[0], updated_date: '31/02/2025' }, { ...metadata[0], node_alias: '/catalog/another-catalog' }]) {
		await assert.rejects(fetchOgdCatalog(target, async (url) => url.includes('/api-export/') ? [row] : lookup));
	}
	await assert.rejects(fetchOgdCatalog(target, async () => ({ ...lookup, status: [{ value: false }] })));
});

test('a regional response must be recent and contain every expected official catalog', async () => {
	const result = await fetchOgdCatalog(target, async (url) => url.includes('/api-export/') ? metadata : lookup);
	const now = new Date('2026-11-11T13:00:00Z');
	const snapshot = { checkedAt: now.toISOString(), results: [result] };
	assert.equal(validateOgdSnapshot(snapshot, [target], now).results.length, 1);
	assert.throws(() => validateOgdSnapshot({ ...snapshot, checkedAt: '2026-11-10T13:00:00Z' }, [target], now));
	assert.throws(() => validateOgdSnapshot(snapshot, dataGovDiscoveryTargets, now));
	assert.throws(() => validateOgdSnapshot({ ...snapshot, results: [{ ...result, finalUrl: 'https://example.com/catalog' }] }, [target], now));
});
