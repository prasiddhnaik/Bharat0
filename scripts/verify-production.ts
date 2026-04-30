import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
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
	assert.ok(existsSync('dist/index.html'), 'missing dist/index.html; run npm run build first');
	assert.ok(existsSync('dist-server/server.js'), 'missing dist-server/server.js; run npm run build first');
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
