import assert from 'node:assert/strict';
import { getLokSabhaPowerSnapshotForPrimeMinister } from '../src/lib/domain/parliament-houses';
import { PRIME_MINISTER_TERMS } from '../src/lib/domain/prime-ministers';

for (const term of PRIME_MINISTER_TERMS) {
	const snapshot = getLokSabhaPowerSnapshotForPrimeMinister(term.id);
	assert.ok(snapshot, `${term.id} should resolve to a Lok Sabha power snapshot`);
	assert.ok(snapshot.composition.length >= 3, `${term.id} should have a meaningful seat composition`);
	assert.ok(snapshot.composition.reduce((sum, entry) => sum + entry.seats, 0) > 0, `${term.id} should show non-zero seats`);
}

const vajpayee1998 = getLokSabhaPowerSnapshotForPrimeMinister('vajpayee-2');
assert.ok(vajpayee1998, 'Vajpayee second term should resolve to a 12th Lok Sabha power snapshot');
assert.equal(vajpayee1998.lokSabha, '12th Lok Sabha');
assert.equal(vajpayee1998.largestParty, 'BJP');
assert.equal(vajpayee1998.largestPartySeats, 182);
assert.match(vajpayee1998.powerSummary, /form government/i);
assert.ok(
	!vajpayee1998.powerSummary.toLowerCase().includes('working majority') || (vajpayee1998.governingSeats ?? 0) >= vajpayee1998.majorityMark,
	'Vajpayee 1998 copy must not claim a working majority when the shown governing seats are below the majority mark'
);

const narasimhaRao = getLokSabhaPowerSnapshotForPrimeMinister('narasimha-rao');
assert.ok(narasimhaRao, 'Narasimha Rao term should resolve to a 10th Lok Sabha power snapshot');
assert.equal(narasimhaRao.lokSabha, '10th Lok Sabha');
assert.equal(narasimhaRao.largestParty, 'INC');
assert.equal(narasimhaRao.largestPartySeats, 244);
assert.match(narasimhaRao.powerSummary, /minority government/i);

console.log('House power checks passed.');
