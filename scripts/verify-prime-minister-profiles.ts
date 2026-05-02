import assert from 'node:assert/strict';
import { getPrimeMinisterProfile } from '../src/lib/domain/prime-minister-profiles';
import { PRIME_MINISTER_TERMS } from '../src/lib/domain/prime-ministers';

for (const term of PRIME_MINISTER_TERMS) {
	const profile = getPrimeMinisterProfile(term.id);
	assert.ok(profile, `${term.id} should resolve to a Prime Minister profile`);
	assert.ok(profile?.summary, `${term.id} should have a profile summary`);
	assert.ok((profile?.highlights.length ?? 0) >= 2, `${term.id} should have at least two highlights`);
	assert.ok(profile?.sourceUrl.startsWith('https://'), `${term.id} should have a source URL`);
}

const narasimhaRao = getPrimeMinisterProfile('narasimha-rao');
assert.match(narasimhaRao?.summary ?? '', /economic liberalisation|liberalisation/i);

const shastri = getPrimeMinisterProfile('lal-bahadur-shastri');
assert.match(shastri?.highlights.join(' '), /Railways|Home Minister/i);

console.log('Prime Minister profile checks passed.');
