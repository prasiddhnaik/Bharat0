import assert from 'node:assert/strict';
import { handleBharatZeroApi } from '../src/lib/server/api/bharatzero-api';

type MockResponse = {
	statusCode: number;
	headers: Record<string, string>;
	body: string;
	setHeader(name: string, value: string): void;
	end(chunk: string): void;
};

async function callApi(url: string) {
	const response: MockResponse = {
		statusCode: 200,
		headers: {},
		body: '',
		setHeader(name, value) {
			this.headers[name.toLowerCase()] = value;
		},
		end(chunk) {
			this.body = chunk;
		}
	};

	await handleBharatZeroApi({ method: 'GET', url } as never, response as never);
	return {
		statusCode: response.statusCode,
		body: JSON.parse(response.body)
	};
}

const list = await callApi('/api/prime-ministers');
assert.equal(list.statusCode, 200);
assert.ok(list.body.items.length >= 20, 'prime minister list should include historical terms');
assert.ok(list.body.items.some((item: { id: string }) => item.id === 'nehru'), 'list should include Nehru');

const nehru = await callApi('/api/prime-ministers/nehru');
assert.equal(nehru.statusCode, 200);
assert.match(nehru.body.profile.summary, /founding parliamentary period/i);
assert.match(nehru.body.power.powerSummary, /1951 first Lok Sabha/i);

const power = await callApi('/api/houses/power?pm=vajpayee-2');
assert.equal(power.statusCode, 200);
assert.equal(power.body.power.lokSabha, '12th Lok Sabha');
assert.match(power.body.power.powerSummary, /below the 272-seat majority mark/i);

const sources = await callApi('/api/sources');
assert.equal(sources.statusCode, 200);
assert.ok(sources.body.primeMinisterProfiles >= 15, 'source API should expose profile source count');
assert.ok(sources.body.housePowerSnapshots >= 10, 'source API should expose House power source count');

console.log('Prime Minister data API checks passed.');
