import assert from 'node:assert/strict';
import {
	EXPECTED_STATE_GOVERNANCE_FIELD_ORDER,
	STATE_GOVERNANCE_DATA_AS_OF,
	STATE_GOVERNANCE_RECORDS,
	STATE_GOVERNANCE_STATUS_VISUALS,
	STATE_GOVERNANCE_VISUAL_PALETTE,
	getStateGovernanceVisual,
	stateGovernanceById,
	type GovernanceAlliance,
	type GovernanceConfidence,
	type GovernanceStatus
} from '../src/lib/domain/state-governance';
import { INDIA_STATE_MAP_FEATURES } from '../src/lib/assets/india-state-boundaries';

const expectedIds = [
	'IN-AN',
	'IN-AP',
	'IN-AR',
	'IN-AS',
	'IN-BR',
	'IN-CH',
	'IN-CT',
	'IN-DH',
	'IN-DL',
	'IN-GA',
	'IN-GJ',
	'IN-HR',
	'IN-HP',
	'IN-JK',
	'IN-JH',
	'IN-KA',
	'IN-KL',
	'IN-LA',
	'IN-LD',
	'IN-MP',
	'IN-MH',
	'IN-MN',
	'IN-ML',
	'IN-MZ',
	'IN-NL',
	'IN-OR',
	'IN-PY',
	'IN-PB',
	'IN-RJ',
	'IN-SK',
	'IN-TN',
	'IN-TG',
	'IN-TR',
	'IN-UT',
	'IN-UP',
	'IN-WB'
];

const statuses = new Set<GovernanceStatus>([
	'active_majority',
	'active_coalition',
	'presidents_rule',
	'caretaker',
	'centrally_administered'
]);
const alliances = new Set<GovernanceAlliance>(['NDA', 'INDIA', 'regional', 'left', 'none']);
const confidences = new Set<GovernanceConfidence>(['verified', 'pending', 'disputed']);
const expectedTooltipFields = [
	'state',
	'local_name',
	'status',
	'alliance',
	'lead_party',
	'member_parties',
	'chief_minister',
	'event_date',
	'source',
	'last_verified'
];

function daysSince(value: string) {
	const date = new Date(`${value}T00:00:00.000Z`);
	const now = new Date();
	return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

async function assertSourceUrls() {
	const failures: string[] = [];
	for (const record of STATE_GOVERNANCE_RECORDS) {
		try {
			const response = await fetch(record.source_url, { method: 'HEAD' });
			if (!response.ok) {
				failures.push(`${record.id}: ${record.source_url} returned ${response.status}`);
			}
		} catch (error) {
			failures.push(`${record.id}: ${record.source_url} failed (${String(error)})`);
		}
	}
	assert.deepEqual(failures, [], 'expected all state governance source URLs to respond successfully');
}

assert.deepEqual([...stateGovernanceById.keys()].sort(), [...expectedIds].sort(), 'expected exactly one governance record for every official ISO state/UT id');
assert.deepEqual(
	[...new Set(INDIA_STATE_MAP_FEATURES.map((feature) => feature.id))].sort(),
	[...expectedIds].sort(),
	'expected map features to match official ISO state/UT ids'
);
assert.deepEqual(EXPECTED_STATE_GOVERNANCE_FIELD_ORDER, expectedTooltipFields, 'expected tooltip and table field order to stay locked');
assert.equal(daysSince(STATE_GOVERNANCE_DATA_AS_OF) <= 90, true, 'expected state governance data_as_of to be within 90 days');

for (const record of STATE_GOVERNANCE_RECORDS) {
	assert.ok(expectedIds.includes(record.id), `${record.id} must be an official ISO 3166-2:IN id`);
	assert.ok(statuses.has(record.status), `${record.id} has invalid status ${record.status}`);
	assert.ok(alliances.has(record.alliance), `${record.id} has invalid alliance ${record.alliance}`);
	assert.ok(confidences.has(record.confidence), `${record.id} has invalid confidence ${record.confidence}`);
	assert.equal(daysSince(record.last_verified) <= 90, true, `${record.id} last_verified is older than 90 days`);
	assert.equal(Boolean(record.name_en), true, `${record.id} needs an English name`);
	assert.equal(Boolean(record.name_local), true, `${record.id} needs a local/Hindi label`);
	assert.equal(Boolean(record.event_date), true, `${record.id} needs an event date`);
	assert.equal(Boolean(record.source_url), true, `${record.id} needs a source URL`);
	assert.equal(Boolean(record.source_org), true, `${record.id} needs a source org`);

	if (record.status === 'active_majority' || record.status === 'active_coalition') {
		assert.equal(Boolean(record.lead_party), true, `${record.id} active records need lead_party`);
		assert.equal(Boolean(record.chief_minister), true, `${record.id} active records need chief_minister`);
		assert.equal(record.member_parties.length >= 1, true, `${record.id} active records need member parties`);
	}

	if (record.status === 'centrally_administered') {
		assert.equal(record.lead_party, null, `${record.id} centrally administered records need null lead_party`);
		assert.equal(record.chief_minister, null, `${record.id} centrally administered records need null chief_minister`);
		assert.deepEqual(record.member_parties, [], `${record.id} centrally administered records need empty member parties`);
	}

	const visual = getStateGovernanceVisual(record);
	assert.ok(STATE_GOVERNANCE_VISUAL_PALETTE[visual.paletteKey], `${record.id} visual must resolve through the shared palette`);
	assert.ok(visual.statusCue, `${record.id} visual needs a status cue`);
}

assert.notEqual(
	STATE_GOVERNANCE_STATUS_VISUALS.presidents_rule.pattern,
	STATE_GOVERNANCE_STATUS_VISUALS.caretaker.pattern,
	'President rule and caretaker states need distinct visual patterns'
);
assert.notEqual(
	STATE_GOVERNANCE_STATUS_VISUALS.presidents_rule.strokeStyle,
	STATE_GOVERNANCE_STATUS_VISUALS.caretaker.strokeStyle,
	'President rule and caretaker states need distinct stroke treatments'
);

if (process.argv.includes('--check-source-urls')) {
	await assertSourceUrls();
}

console.log(`State governance checks passed for ${STATE_GOVERNANCE_RECORDS.length} records and ${INDIA_STATE_MAP_FEATURES.length} map features.`);
