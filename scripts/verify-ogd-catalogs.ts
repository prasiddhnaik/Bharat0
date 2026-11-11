import assert from 'node:assert/strict';
import { test } from 'node:test';
import { discoverOgdCatalogs, fetchOgdCatalog, fetchOgdSnapshot, validateOgdSnapshot } from '../src/lib/ingestion/ogd-catalogs';
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

const groups = ['Rajya Sabha - Annexures to Parliamentary Questions', 'Rajya Sabha Annexures', 'Lok Sabha English RSS Feeds', 'Rajya Sabha English RSS Feeds'];
const now = new Date('2026-11-11T13:00:00Z');
function discoveredSnapshot() {
	const extra = { ...target, id: 'data-gov-rs-questions-session-273', name: 'Rajya Sabha questions - Session 273', url: 'https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-273' };
	const results = [...dataGovDiscoveryTargets, extra].map((item, index) => {
		const alias = new URL(item.url).pathname;
		const nid = String(index + 1);
		const uuid = `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
		return { ...item, ok: true, status: 200, finalUrl: `https://www.data.gov.in${alias}`, title: item.name, signals: ['Official OGD metadata API'], metadata: { dataGovCatalog: { nid, uuid, nodeAlias: alias, groupName: null, updatedDate: '17/02/2025', keywords: [], apiPath: `/apis/${uuid}`, apiUrl: `https://www.data.gov.in/apis/${uuid}`, catalogApiAvailable: false, zipDownloadAvailable: false } } };
	});
	const entries = results.map((result) => ({ nid: result.metadata.dataGovCatalog.nid, uuid: result.metadata.dataGovCatalog.uuid, alias: result.metadata.dataGovCatalog.nodeAlias, title: result.title }));
	const rows = [entries.filter((row) => row.alias.includes('questions-session-')), [entries[0]], entries.filter((row) => row.alias.includes('debates-lok-')), entries.filter((row) => row.alias.includes('debates-rajya-'))];
	return { checkedAt: now.toISOString(), discovery: groups.map((group, index) => ({ group, total: rows[index].length, pages: 1, records: rows[index] })), results };
}

test('regional OGD snapshots accept newly discovered sessions beyond the configured seed list', () => {
	const snapshot = discoveredSnapshot();
	assert.equal(validateOgdSnapshot(snapshot, undefined, now).results.length, dataGovDiscoveryTargets.length + 1);
	assert.ok(validateOgdSnapshot(snapshot, undefined, now).results.some((row) => row.id === 'data-gov-rs-questions-session-273'));
});

type Snapshot = ReturnType<typeof discoveredSnapshot>;
function indexPage(snapshot: Snapshot, url: string) {
	const request = new URL(url);
	assert.equal(request.origin + request.pathname, 'https://www.data.gov.in/backend/dmspublic/v1/catalogs');
	assert.equal(request.searchParams.get('sort[nid]'), 'asc');
	const group = request.searchParams.get('filters[field_group_name:name][]');
	const index = snapshot.discovery.find((row) => row.group === group)!;
	assert.ok(index, 'only supported official groups may be requested');
	const offset = Number(request.searchParams.get('offset'));
	const limit = Number(request.searchParams.get('limit'));
	return { statusCode: 200, total: index.total, data: { rows: index.records.slice(offset, offset + limit).map((entry) => ({ nid: [Number(entry.nid)], uuid: [entry.uuid], node_alias: [entry.alias], title: [entry.title], 'field_group_name:name': [group] })) } };
}

test('discovery follows all index pages and excludes unrelated RSS catalogs', async () => {
	const snapshot = discoveredSnapshot();
	const index = snapshot.discovery[2];
	for (let i = 100; i < 201; i++) index.records.push({ nid: String(i), uuid: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, alias: `/catalog/unrelated-feed-${i}`, title: 'Unrelated parliamentary RSS feed' });
	index.total = index.records.length;
	index.pages = 2;
	const offsets: string[] = [];
	const { targets } = await discoverOgdCatalogs(async (url) => {
		if (new URL(url).searchParams.get('filters[field_group_name:name][]') === groups[2]) offsets.push(new URL(url).searchParams.get('offset')!);
		return indexPage(snapshot, url);
	});
	assert.deepEqual(offsets, ['0', '100']);
	assert.equal(targets.length, snapshot.results.length);
	assert.ok(targets.some(({ target }) => target.id.endsWith('session-273')));
	assert.ok(targets.every(({ target }) => !target.url.includes('unrelated-feed')));
});

test('discovery rejects incomplete pages and ignored group filters', async () => {
	for (const failure of ['truncated', 'wrong-group', 'empty', 'invalid-identity']) {
		await assert.rejects(discoverOgdCatalogs(async (url) => {
			const page = indexPage(discoveredSnapshot(), url);
			if (failure === 'truncated') page.data.rows.pop();
			if (failure === 'wrong-group') page.data.rows[0]['field_group_name:name'] = ['Unrelated group'];
			if (failure === 'empty') { page.total = 0; page.data.rows = []; }
			if (failure === 'invalid-identity') page.data.rows[0].uuid = ['invalid'];
			return page;
		}), Error, failure);
	}
});

test('regional discovery rejects missing coverage, duplicates and conflicting identities', () => {
	const cases: Array<(snapshot: Snapshot) => void> = [
		(snapshot) => { snapshot.discovery.pop(); },
		(snapshot) => { snapshot.results.pop(); },
		(snapshot) => { snapshot.results[0] = snapshot.results[1]; },
		(snapshot) => { snapshot.discovery[1].records[0].nid = '9000'; },
		(snapshot) => { snapshot.results[0].metadata.dataGovCatalog.uuid = '00000000-0000-4000-8000-999999999999'; },
		(snapshot) => { snapshot.discovery[0].records[1].nid = snapshot.discovery[0].records[0].nid; },
		(snapshot) => { snapshot.discovery[0].records[0].alias = 'https://example.com/catalog'; },
		(snapshot) => { snapshot.checkedAt = '2026-11-10T13:00:00Z'; }
	];
	for (const mutate of cases) {
		const snapshot = discoveredSnapshot();
		mutate(snapshot);
		assert.throws(() => validateOgdSnapshot(snapshot, undefined, now));
	}
	assert.throws(() => validateOgdSnapshot({ checkedAt: now.toISOString(), results: discoveredSnapshot().results }, undefined, now));
});

test('a complete fetch discovers future sessions and cross-checks index and metadata identities', async () => {
	const snapshot = discoveredSnapshot();
	const reader = async (url: string) => {
		if (url.includes('/dmspublic/')) return indexPage(snapshot, url);
		const result = snapshot.results.find((row) => url.includes('/api-export/') ? url.endsWith(`/${row.metadata.dataGovCatalog.nid}?_format=json`) : url.includes(`${row.metadata.dataGovCatalog.nodeAlias}?`))!;
		assert.ok(result);
		const entry = result.metadata.dataGovCatalog;
		return url.includes('/api-export/')
			? [{ nid: entry.nid, uuid: entry.uuid, node_alias: entry.nodeAlias, title: result.title, updated_date: entry.updatedDate }]
			: { nid: [{ value: entry.nid }], uuid: [{ value: entry.uuid }], status: [{ value: true }], path: [{ alias: entry.nodeAlias }] };
	};
	const fetched = validateOgdSnapshot(await fetchOgdSnapshot(reader));
	assert.equal(fetched.results.length, snapshot.results.length);
	assert.ok(fetched.results.some((row) => row.id.endsWith('session-273')));
	assert.equal(fetched.discovery.length, 4);
	await assert.rejects(fetchOgdSnapshot(async (url) => {
		const value = await reader(url);
		if (!url.includes('/dmspublic/')) {
			const changedUuid = '00000000-0000-4000-8000-999999999999';
			if (Array.isArray(value)) value[0].uuid = changedUuid;
			else if ('uuid' in value) value.uuid = [{ value: changedUuid }];
		}
		return value;
	}), /differs from the discovery index/);
});
