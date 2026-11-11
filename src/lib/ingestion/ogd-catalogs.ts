import { dataGovDiscoveryTargets, rajyaSabhaQuestionSessionTarget, type SourceDiscoveryResult, type SourceDiscoveryTarget } from './source-discovery.js';
import { toIsoDate } from './sansad-bills.js';

type JsonReader = (url: string) => Promise<unknown>;
type IndexEntry = { nid: string; uuid: string; alias: string; title: string };
type CatalogIndex = { group: string; total: number; pages: number; records: IndexEntry[] };
type OgdSnapshot = { checkedAt: string; discovery: CatalogIndex[]; results: SourceDiscoveryResult[] };
const origin = 'https://www.data.gov.in';
const api = `${origin}/backend/dms/v2`;
const indexApi = `${origin}/backend/dmspublic/v1/catalogs`;
const groups = ['Rajya Sabha - Annexures to Parliamentary Questions', 'Rajya Sabha Annexures', 'Lok Sabha English RSS Feeds', 'Rajya Sabha English RSS Feeds'];
const pageSize = 100;
const maxCatalogs = 500;
const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const object = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid OGD metadata object');
	return value as Record<string, unknown>;
};
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const field = (value: unknown) => Array.isArray(value) && value.length ? object(value[0]).value : undefined;
const aliasFor = (target: SourceDiscoveryTarget) => new URL(target.url).pathname;
const first = (value: unknown) => Array.isArray(value) ? value[0] : undefined;

function indexEntry(value: unknown): IndexEntry {
	const row = object(value);
	const nid = text(row.nid), uuid = text(row.uuid), alias = text(row.alias), title = text(row.title);
	if (!/^[1-9]\d*$/.test(nid) || !Number.isSafeInteger(Number(nid)) || !uuidPattern.test(uuid) || !/^\/catalog\/[a-z0-9-]+$/.test(alias) || !title) throw new Error('Invalid OGD index identity');
	return { nid, uuid, alias, title };
}

function indexedTarget(entry: IndexEntry, group: string): SourceDiscoveryTarget | null {
	if (groups.slice(0, 2).includes(group)) {
		const match = /^\/catalog\/answers-data-rajya-sabha-questions-session-([1-9]\d{0,3})$/.exec(entry.alias);
		return match ? rajyaSabhaQuestionSessionTarget(Number(match[1])) : null;
	}
	const house = group === groups[2] ? 'lok' : 'rajya';
	const match = new RegExp(`^/catalog/verbatim-debates-${house}-sabha-english(-[a-z0-9-]+)?$`).exec(entry.alias);
	if (!match) return null;
	const base = dataGovDiscoveryTargets.find((target) => aliasFor(target) === `/catalog/verbatim-debates-${house}-sabha-english`)!;
	return { ...base, id: base.id + (match[1] ?? ''), name: match[1] ? entry.title : base.name, url: `${origin}${entry.alias}` };
}

function validateDiscovery(value: unknown) {
	if (!Array.isArray(value) || value.length !== groups.length) throw new Error('Incomplete OGD catalog discovery');
	const indexes: CatalogIndex[] = [];
	const targets = new Map<string, { target: SourceDiscoveryTarget; entry: IndexEntry }>();
	const identities = new Map<string, string>();
	for (const group of groups) {
		const matching = value.filter((entry) => object(entry).group === group);
		if (matching.length !== 1) throw new Error('Missing or duplicate OGD discovery group');
		const index = object(matching[0]);
		if (!Number.isInteger(index.total) || Number(index.total) < 1 || Number(index.total) > maxCatalogs || !Array.isArray(index.records) || index.records.length !== index.total || index.pages !== Math.ceil(Number(index.total) / pageSize)) throw new Error('Incomplete OGD index coverage');
		const records = index.records.map(indexEntry);
		if (new Set(records.map((row) => row.nid)).size !== records.length) throw new Error('Repeated OGD index record');
		let supported = 0;
		for (const entry of records) {
			const target = indexedTarget(entry, group);
			if (!target) continue;
			supported++;
			const existing = targets.get(target.id)?.entry;
			if ((existing && (existing.nid !== entry.nid || existing.uuid !== entry.uuid || existing.alias !== entry.alias)) || (identities.has(entry.nid) && identities.get(entry.nid) !== target.id) || (identities.has(entry.uuid) && identities.get(entry.uuid) !== target.id)) throw new Error('Conflicting OGD discovery identities');
			identities.set(entry.nid, target.id);
			identities.set(entry.uuid, target.id);
			targets.set(target.id, { target, entry });
		}
		if (!supported) throw new Error(`No supported catalogs in OGD group: ${group}`);
		indexes.push({ group, total: Number(index.total), pages: Number(index.pages), records });
	}
	if (targets.size > maxCatalogs) throw new Error('OGD catalog discovery exceeds import limit');
	return { indexes, targets: [...targets.values()].sort((a, b) => a.target.id.localeCompare(b.target.id)) };
}

export async function discoverOgdCatalogs(read: JsonReader = readJson) {
	const indexes: CatalogIndex[] = [];
	for (const group of groups) {
		const records: IndexEntry[] = [];
		let expected: number | undefined;
		let pages = 0;
		do {
			const url = new URL(indexApi);
			url.search = new URLSearchParams({ offset: String(pages * pageSize), limit: String(pageSize), 'filters[field_group_name:name][]': group, 'sort[nid]': 'asc' }).toString();
			const payload = object(await read(url.href));
			const total = Number(payload.total);
			const rows = object(payload.data).rows;
			if (payload.statusCode !== 200 || !Number.isInteger(payload.total) || total < 1 || total > maxCatalogs || (expected !== undefined && expected !== total) || !Array.isArray(rows) || rows.length !== Math.min(pageSize, total - records.length)) throw new Error('Incomplete or changing OGD index page');
			expected = total;
			for (const value of rows) {
				const row = object(value);
				if (!Array.isArray(row['field_group_name:name']) || !row['field_group_name:name'].includes(group)) throw new Error('OGD index ignored its group filter');
				records.push(indexEntry({ nid: String(first(row.nid) ?? ''), uuid: first(row.uuid), alias: first(row.node_alias), title: first(row.title) }));
			}
			pages++;
		} while (records.length < expected);
		indexes.push({ group, total: expected!, pages, records });
	}
	return validateDiscovery(indexes);
}

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
	if (!/^\d+$/.test(nid) || !uuidPattern.test(uuid) || path.alias !== alias || field(node.status) !== true) throw new Error(`OGD catalog identity validation failed: ${target.id}`);
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

export async function fetchOgdSnapshot(read: JsonReader = readJson): Promise<OgdSnapshot> {
	const { indexes, targets } = await discoverOgdCatalogs(read);
	const results: SourceDiscoveryResult[] = [];
	let next = 0;
	await Promise.all(Array.from({ length: 4 }, async () => {
		while (next < targets.length) {
			const index = next++;
			const { target, entry } = targets[index];
			const result = await fetchOgdCatalog(target, read);
			if (result.metadata?.dataGovCatalog?.nid !== entry.nid || result.metadata.dataGovCatalog.uuid !== entry.uuid) throw new Error('OGD metadata differs from the discovery index');
			results[index] = result;
		}
	}));
	return { checkedAt: new Date().toISOString(), discovery: indexes, results };
}

export function validateOgdSnapshot(value: unknown, expectedTargets?: SourceDiscoveryTarget[], now = new Date()): OgdSnapshot {
	const payload = object(value);
	const discovered = expectedTargets ? null : validateDiscovery(payload.discovery);
	const targets = expectedTargets ?? discovered!.targets.map(({ target }) => target);
	const checkedAt = text(payload.checkedAt);
	const age = now.getTime() - Date.parse(checkedAt);
	if (!Number.isFinite(age) || age < -60_000 || age > 15 * 60_000 || !Array.isArray(payload.results) || payload.results.length !== targets.length) throw new Error('Incomplete or stale OGD regional response');
	const results = payload.results.map((entry: unknown) => {
		const result = object(entry);
		const target = targets.find((target) => target.id === result.id);
		if (!target || result.ok !== true || result.finalUrl !== `${origin}${aliasFor(target)}`) throw new Error('Unexpected OGD catalog source');
		const metadata = object(object(result.metadata).dataGovCatalog);
		const indexed = discovered?.targets.find((row) => row.target.id === target.id)?.entry;
		if (!/^\d+$/.test(text(metadata.nid)) || !uuidPattern.test(text(metadata.uuid)) || metadata.nodeAlias !== aliasFor(target) || !toIsoDate(text(metadata.updatedDate)) || !text(result.title) || (indexed && (metadata.nid !== indexed.nid || metadata.uuid !== indexed.uuid))) throw new Error('Invalid OGD regional metadata');
		return { ...result, ...target } as SourceDiscoveryResult;
	});
	if (new Set(results.map((row) => row.id)).size !== targets.length) throw new Error('Duplicate OGD catalog identities');
	return { checkedAt, discovery: discovered?.indexes ?? [], results };
}
