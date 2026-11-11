import { pathToFileURL } from 'node:url';

export type SourceResult = { sourceRows: number; inserted: number; updated: number; sourceUrl: string; coverage: string; latestActivityDate?: string | null; checkedAt?: string; since?: string; sessions?: number[] };
export type SourceJob = { id: string; run: () => Promise<SourceResult> };
export type RunStatus = 'running' | 'succeeded' | 'failed';
type FetchOptions = { fetcher?: typeof fetch; delay?: (ms: number) => Promise<void> };
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function fetchResponse(url: string, init: RequestInit = {}, options: FetchOptions = {}) {
	const fetcher = options.fetcher ?? fetch;
	for (let attempt = 0; attempt < 3; attempt++) {
		let response: Response;
		try { response = await fetcher(url, { ...init, signal: init.signal ?? AbortSignal.timeout(90_000) }); }
		catch (error) {
			if (attempt === 2) throw error;
			await (options.delay ?? pause)(1000 * 2 ** attempt);
			continue;
		}
		if (response.ok) return response;
		if (attempt === 2 || (response.status !== 429 && response.status < 500)) throw new Error(`Official source returned HTTP ${response.status}`);
		await (options.delay ?? pause)(1000 * 2 ** attempt);
	}
	throw new Error('Official source did not respond');
}

export async function fetchJson<T = unknown>(url: string, init: RequestInit = {}, options: FetchOptions = {}): Promise<T> {
	for (let attempt = 0; attempt < 3; attempt++) {
		const response = await fetchResponse(url, init, options);
		let body: string;
		try { body = await response.text(); }
		catch (error) {
			if (attempt === 2) throw error;
			await (options.delay ?? pause)(1000 * 2 ** attempt);
			continue;
		}
		try { return JSON.parse(body.replace(/^\uFEFF/, '')) as T; }
		catch { throw new Error(`Official source returned invalid JSON (${response.headers.get('content-type') ?? 'unknown content type'})`); }
	}
	throw new Error('Official source response could not be read');
}

export function sameFields(existing: Record<string, unknown>, fields: Record<string, unknown>) {
	return Object.entries(fields).every(([key, value]) => JSON.stringify(existing[key] ?? null) === JSON.stringify(value ?? null));
}

export async function runSources(jobs: SourceJob[], record: (source: string, status: RunStatus, result?: SourceResult, error?: string) => Promise<void>) {
	const results: Array<{ source: string; status: RunStatus; result?: SourceResult; error?: string }> = [];
	for (const job of jobs) {
		await record(job.id, 'running');
		try {
			const result = await job.run();
			await record(job.id, 'succeeded', result);
			results.push({ source: job.id, status: 'succeeded', result });
		} catch (error) {
			const message = (error instanceof Error ? error.message : String(error)).replace(/postgres(?:ql)?:\/\/\S+/gi, '[database connection]').slice(0, 500);
			await record(job.id, 'failed', undefined, message);
			results.push({ source: job.id, status: 'failed', error: message });
		}
	}
	return results;
}

export async function withRefreshLock<T>(client: { connect(): Promise<unknown>; query(sql: string): Promise<{ rows: Array<{ acquired?: boolean }> }>; end(): Promise<unknown> }, run: () => Promise<T>) {
	await client.connect();
	let acquired = false;
	try {
		acquired = Boolean((await client.query("SELECT pg_try_advisory_lock(806764, 1) AS acquired")).rows[0]?.acquired);
		if (!acquired) return { skipped: true as const };
		return { skipped: false as const, result: await run() };
	} finally {
		if (acquired) await client.query('SELECT pg_advisory_unlock(806764, 1)');
		await client.end();
	}
}

export function runCli(moduleUrl: string, run: () => Promise<unknown>) {
	if (process.argv[1] && moduleUrl === pathToFileURL(process.argv[1]).href) void run().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
