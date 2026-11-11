import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchJson, runSources, sameFields, withRefreshLock } from './lib/refresh';
import { sourceRefreshStatus } from '../src/lib/domain/ingestion-status';

test('transient HTTP failures retry but malformed successful responses fail', async () => {
	let calls = 0;
	const payload = await fetchJson('https://example.test', {}, { fetcher: async () => ++calls < 3 ? new Response('', { status: 503 }) : Response.json({ ok: true }), delay: async () => {} });
	assert.deepEqual(payload, { ok: true });
	assert.equal(calls, 3);
	calls = 0;
	await assert.rejects(() => fetchJson('https://example.test', {}, { fetcher: async () => { calls++; return new Response('bad JSON'); }, delay: async () => {} }), /JSON/i);
	assert.equal(calls, 1);
});

test('one failed source does not prevent the next source from applying', async () => {
	const statuses: string[] = [];
	const results = await runSources([
		{ id: 'broken', run: async () => { throw new Error('source unavailable'); } },
		{ id: 'good', run: async () => ({ sourceRows: 1, inserted: 1, updated: 0, coverage: 'test', sourceUrl: 'https://example.test' }) }
	], async (source, status) => { statuses.push(`${source}:${status}`); });
	assert.deepEqual(results.map((row) => row.status), ['failed', 'succeeded']);
	assert.deepEqual(statuses, ['broken:running', 'broken:failed', 'good:running', 'good:succeeded']);
});

test('unchanged records compare dates, arrays and absent nullable fields without rewriting', () => {
	assert.ok(sameFields({ date: new Date('2026-08-13'), members: ['A'], optional: null }, { date: new Date('2026-08-13'), members: ['A'], optional: undefined }));
	assert.ok(!sameFields({ title: 'Old' }, { title: 'New' }));
});

test('a competing run skips work, and a failing run always releases its lock', async () => {
	const sql: string[] = [];
	let acquired = false;
	const client = { connect: async () => {}, end: async () => { sql.push('end'); }, query: async (query: string) => { sql.push(query); return { rows: [{ acquired }] }; } };
	assert.deepEqual(await withRefreshLock(client, async () => { assert.fail('competing run must not apply'); }), { skipped: true });
	acquired = true;
	await assert.rejects(() => withRefreshLock(client, async () => { throw new Error('failed'); }), /failed/);
	assert.ok(sql.includes('SELECT pg_advisory_unlock(806764, 1)'));
	assert.equal(sql.at(-1), 'end');
});

test('a failed check preserves the last successful date and coverage', () => {
	const success = { source: 'bills', status: 'succeeded', started_at: '2026-11-02T03:30:00Z', completed_at: '2026-11-02T03:32:00Z', summary: { coverage: 'current term', sourceRows: 458 } };
	const latest = { ...success, status: 'failed', started_at: '2026-11-09T03:30:00Z', completed_at: '2026-11-09T03:31:00Z', summary: null };
	const status = sourceRefreshStatus('bills', latest, success);
	assert.equal(status.status, 'failed');
	assert.equal(status.succeededAt, '2026-11-02T03:32:00.000Z');
	assert.equal(status.sourceRows, 458);
	assert.equal(status.coverage, 'current term');
});
