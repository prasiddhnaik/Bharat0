import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const HOST = '127.0.0.1';
const START_TIMEOUT_MS = 20_000;

function getOpenPort() {
	return new Promise<number>((resolve, reject) => {
		const server = createServer();
		server.once('error', reject);
		server.listen(0, HOST, () => {
			const address = server.address();
			if (!address || typeof address === 'string') {
				server.close(() => reject(new Error('Failed to allocate a local port.')));
				return;
			}

			const port = address.port;
			server.close(() => resolve(port));
		});
	});
}

async function fetchJson(url: string) {
	const response = await fetch(url);
	const body = await response.json().catch(() => null);
	return { response, body };
}

async function waitForHealthyServer(baseUrl: string, getLogs: () => string) {
	const startedAt = Date.now();

	while (Date.now() - startedAt < START_TIMEOUT_MS) {
		try {
			const { response, body } = await fetchJson(`${baseUrl}/api/health`);
			if (response.ok && body?.ok === true && body?.database === 'connected') {
				return body;
			}
		} catch {
			// The server is still booting or the socket is not accepting requests yet.
		}

		await delay(500);
	}

	throw new Error(`Production server did not become healthy in ${START_TIMEOUT_MS}ms.\n${getLogs()}`);
}

function assertBuildArtifactsExist() {
	assert.ok(existsSync('dist/index.html'), 'missing dist/index.html; run pnpm run build first');
	assert.ok(existsSync('dist-server/server.js'), 'missing dist-server/server.js; run pnpm run build first');
	const clientJsBytes = readdirSync('dist/assets').filter((file) => file.endsWith('.js')).reduce((total, file) => total + statSync(`dist/assets/${file}`).size, 0);
	assert.ok(clientJsBytes < 1_000_000, `client JavaScript exceeds 1 MB (${clientJsBytes} bytes); keep historical records on the server`);
}

async function main() {
	assertBuildArtifactsExist();

	const port = await getOpenPort();
	const baseUrl = `http://${HOST}:${port}`;
	const logs: string[] = [];
	const server = spawn(process.execPath, ['dist-server/server.js'], {
		env: {
			...process.env,
			HOST,
			PORT: String(port),
			NODE_ENV: 'production'
		},
		stdio: ['ignore', 'pipe', 'pipe']
	});

	const recordLog = (chunk: Buffer) => {
		logs.push(chunk.toString());
		if (logs.join('').length > 8000) logs.splice(0, logs.length - 4);
	};

	server.stdout.on('data', recordLog);
	server.stderr.on('data', recordLog);

	const getLogs = () => logs.join('').trim();

	try {
		const health = await waitForHealthyServer(baseUrl, getLogs);
		const dashboard = await fetchJson(`${baseUrl}/api/dashboard?section=overview`);
		assert.equal(dashboard.response.status, 200, `dashboard smoke check failed: ${dashboard.response.status}`);
		assert.ok(Array.isArray(dashboard.body?.bills), 'dashboard response is missing bills array');
		assert.ok(dashboard.body.bills.length <= 5, 'overview must bound the bill preview');
		assert.ok(dashboard.body.timelineEvents.length <= 12, 'overview must bound the event preview');
		assert.equal(dashboard.body.stats.billsTracked, health.bills, 'dashboard must use the same database as health');
		assert.ok(Number.isFinite(Date.parse(dashboard.body.dataSource.updatedAt)), 'database update time must come from persisted metadata');
		const [firstPage, secondPage, stages, debates, questions, databaseOnlyBill] = await Promise.all([
			fetchJson(`${baseUrl}/api/dashboard?section=timeline&pageSize=3`),
			fetchJson(`${baseUrl}/api/dashboard?section=timeline&pageSize=3&page=2`),
			fetchJson(`${baseUrl}/api/dashboard?section=bills&status=introduced`),
			fetchJson(`${baseUrl}/api/dashboard?section=debates&pm=nehru`),
			fetchJson(`${baseUrl}/api/dashboard?section=questions&pm=nehru`),
			fetchJson(`${baseUrl}/api/dashboard?section=bills&q=KERALA%20%28ALTERATION%20OF%20NAME%29`)
		]);
		for (const result of [firstPage, secondPage, stages, debates, questions, databaseOnlyBill]) assert.equal(result.response.status, 200);
		assert.equal(firstPage.body.timelineEvents.length, 3);
		assert.equal(secondPage.body.timelineEvents.length, 3);
		assert.notEqual(firstPage.body.timelineEvents[0].id, secondPage.body.timelineEvents[0].id);
		assert.ok(firstPage.body.pagination.totalItems > 3);
		assert.ok(stages.body.stageCounts.some((row: { stage: string }) => row.stage === 'act_published'));
		assert.ok(stages.body.bills.every((bill: { current_stage: string }) => bill.current_stage === 'introduced'));
		assert.equal(debates.body.debates.length, 0);
		assert.equal(questions.body.questions.length, 0);
		assert.ok(databaseOnlyBill.body.bills.some((bill: { id: string }) => bill.id === 'kerala-alteration-of-name-bill-2026'));
		const kerala = databaseOnlyBill.body.bills.find((bill: { id: string }) => bill.id === 'kerala-alteration-of-name-bill-2026');
		assert.equal(kerala.current_stage, 'assented');
		assert.equal(kerala.latest_action_date, '2026-08-14');
		assert.equal(kerala.bill_number, 'Bill No. 155 of 2026');
		const [committees, sources, lastPage, currentDebates] = await Promise.all([
			fetchJson(`${baseUrl}/api/dashboard?section=committees&q=xxxxxxxx`),
			fetchJson(`${baseUrl}/api/dashboard?section=sources&q=xxxxxxxx`),
			fetchJson(`${baseUrl}/api/dashboard?section=bills&page=99999`),
			fetchJson(`${baseUrl}/api/dashboard?section=debates&q=Kerala&pm=modi-3`)
		]);
		for (const result of [committees, sources, lastPage, currentDebates]) assert.equal(result.response.status, 200);
		assert.equal(committees.body.committees.length, 0);
		assert.equal(sources.body.sources.length, 0);
		assert.equal(lastPage.body.pagination.page, lastPage.body.pagination.totalPages);
		assert.ok(lastPage.body.bills.length > 0);
		assert.ok(currentDebates.body.debates.some((row: { date: string }) => row.date.startsWith('2026-08')));
		assert.ok(dashboard.body.dataSource.officialBillCheck.checkedAt);
		const [sourceStatus, questionPage, nextQuestionPage] = await Promise.all([
			fetchJson(`${baseUrl}/api/sources/status`),
			fetchJson(`${baseUrl}/api/dashboard?section=questions&q=tourism&area=TOURISM&pageSize=3`),
			fetchJson(`${baseUrl}/api/dashboard?section=questions&q=tourism&area=TOURISM&pageSize=3&page=2`)
		]);
		assert.equal(sourceStatus.body.schedule.frequency, 'weekly');
		assert.equal(sourceStatus.body.sources.length, 4);
		assert.ok(sourceStatus.body.sources.every((row: { succeededAt: string }) => Number.isFinite(Date.parse(row.succeededAt))));
		assert.equal(questionPage.body.questions.length, 3);
		assert.ok(questionPage.body.pagination.totalItems > 3);
		assert.notEqual(questionPage.body.questions[0].id, nextQuestionPage.body.questions[0].id);
		assert.ok(questionPage.body.questions.every((row: { ministry: string }) => row.ministry === 'TOURISM'));
		assert.ok(questionPage.body.areaCounts.some((row: { area: string }) => row.area === 'TOURISM'));

		console.log(
			JSON.stringify(
				{
					ok: true,
					baseUrl,
					health,
					dashboardBills: dashboard.body.bills.length
				},
				null,
				2
			)
		);
	} finally {
		if (!server.killed) server.kill('SIGTERM');
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
