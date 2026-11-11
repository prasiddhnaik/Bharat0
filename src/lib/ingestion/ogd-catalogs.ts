import { dataGovDiscoveryTargets, type SourceDiscoveryResult, type SourceDiscoveryTarget } from './source-discovery.js';
import { toIsoDate } from './sansad-bills.js';

type JsonReader = (url: string) => Promise<unknown>;
type OgdSnapshot = { checkedAt: string; results: SourceDiscoveryResult[] };
const origin = 'https://www.data.gov.in';
const api = `${origin}/backend/dms/v2`;
const object = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid OGD metadata object');
	return value as Record<string, unknown>;
};
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const field = (value: unknown) => Array.isArray(value) && value.length ? object(value[0]).value : undefined;
const aliasFor = (target: SourceDiscoveryTarget) => new URL(target.url).pathname;

async function readJson(url: string) {
	const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'BharatZero official catalog refresh' }, signal: AbortSignal.timeout(12_000) });
	if (!response.ok) throw new Error(`OGD metadata returned HTTP ${response.status}`);
	return response.json() as Promise<unknown>;
}

export async function fetchOgdCatalog(target: SourceDiscoveryTarget, read: JsonReader = readJson): Promise<SourceDiscoveryResult> {
	const alias = aliasFor(target);
	if (!/^\/catalog\/[a-z0-9-]+$/.test(alias)) throw new Error('Invalid OGD catalog alias');
	const node = object(await read(`${api}${alias}?_format=json`));
	const nid = String(field(node.nid) ?? '');
	const uuid = text(field(node.uuid));
	const path = Array.isArray(node.path) ? object(node.path[0]) : {};
	if (!/^\d+$/.test(nid) || !/^[\da-f-]{36}$/i.test(uuid) || path.alias !== alias || field(node.status) !== true) throw new Error(`OGD catalog identity validation failed: ${target.id}`);
	const exported = await read(`${api}/api-export/catalog/${nid}?_format=json`);
	if (!Array.isArray(exported) || exported.length !== 1) throw new Error(`Incomplete OGD catalog metadata: ${target.id}`);
	const row = object(exported[0]);
	const updatedDate = text(row.updated_date);
	if (String(row.nid) !== nid || row.uuid !== uuid || row.node_alias !== alias || !text(row.title) || !toIsoDate(updatedDate)) throw new Error(`OGD catalog metadata validation failed: ${target.id}`);
	return {
		...target, ok: true, status: 200, finalUrl: `${origin}${alias}`, title: text(row.title), signals: ['Official OGD metadata API'],
		metadata: { dataGovCatalog: {
			nid, uuid, nodeAlias: alias, groupName: text(row.field_group_name) || null, updatedDate,
			keywords: text(row.field_keywords).split(/\|\||,/).filter(Boolean), apiPath: `/apis/${uuid}`, apiUrl: `${origin}/apis/${uuid}`,
			catalogApiAvailable: field(node.field_is_api_available) === true, zipDownloadAvailable: field(node.field_download_merge) === true
		} }
	};
}

export async function fetchOgdSnapshot(): Promise<OgdSnapshot> {
	const results: SourceDiscoveryResult[] = [];
	let next = 0;
	await Promise.all(Array.from({ length: 4 }, async () => {
		while (next < dataGovDiscoveryTargets.length) {
			const index = next++;
			results[index] = await fetchOgdCatalog(dataGovDiscoveryTargets[index]);
		}
	}));
	return { checkedAt: new Date().toISOString(), results };
}

export function validateOgdSnapshot(value: unknown, targets = dataGovDiscoveryTargets, now = new Date()): OgdSnapshot {
	const payload = object(value);
	const checkedAt = text(payload.checkedAt);
	const age = now.getTime() - Date.parse(checkedAt);
	if (!Number.isFinite(age) || age < -60_000 || age > 15 * 60_000 || !Array.isArray(payload.results) || payload.results.length !== targets.length) throw new Error('Incomplete or stale OGD regional response');
	const results = payload.results.map((entry: unknown) => {
		const result = object(entry);
		const target = targets.find((target) => target.id === result.id);
		if (!target || result.ok !== true || result.finalUrl !== `${origin}${aliasFor(target)}`) throw new Error('Unexpected OGD catalog source');
		const metadata = object(object(result.metadata).dataGovCatalog);
		if (!/^\d+$/.test(text(metadata.nid)) || !/^[\da-f-]{36}$/i.test(text(metadata.uuid)) || metadata.nodeAlias !== aliasFor(target) || !toIsoDate(text(metadata.updatedDate)) || !text(result.title)) throw new Error('Invalid OGD regional metadata');
		return { ...result, ...target } as SourceDiscoveryResult;
	});
	if (new Set(results.map((row) => row.id)).size !== targets.length) throw new Error('Duplicate OGD catalog identities');
	return { checkedAt, results };
}
