import assert from 'node:assert/strict';
import {
	getPreparedSourceAdapters,
	ingestionPipelineSteps,
	officialSourceAdapters
} from '../src/lib/ingestion/source-adapters';

assert.ok(officialSourceAdapters.length >= 7, 'expected official source families to be registered');
assert.ok(
	officialSourceAdapters.every((adapter) => adapter.status !== 'live-scraping'),
	'MVP must not register live scraping adapters'
);
assert.ok(
	officialSourceAdapters.some((adapter) => adapter.id === 'india-code' && adapter.outputs.includes('acts')),
	'India Code adapter should be prepared for Acts linkage'
);
assert.ok(
	officialSourceAdapters.some((adapter) => adapter.id === 'neva' && adapter.outputs.includes('state_legislature_events')),
	'NeVA adapter should preserve future state-legislature expansion'
);
assert.deepEqual(ingestionPipelineSteps, ['source_capture', 'normalization', 'stage_resolution', 'read_model_publish']);
assert.equal(getPreparedSourceAdapters().length, officialSourceAdapters.length);

console.log('Ingestion contract checks passed. No live scraping is registered.');
