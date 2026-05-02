import assert from 'node:assert/strict';
import { lokSabhaPowerSnapshots } from '../src/lib/domain/parliament-houses';
import { primeMinisterProfiles } from '../src/lib/domain/prime-minister-profiles';
import { createPrismaClient } from '../src/lib/server/db/prisma';

const prisma = createPrismaClient();

try {
	const [profileCount, powerCount, nehruProfile, vajpayeePower] = await Promise.all([
		prisma.primeMinisterProfile.count(),
		prisma.lokSabhaPowerSnapshot.count(),
		prisma.primeMinisterProfile.findFirst({ where: { term_ids: { has: 'nehru' } } }),
		prisma.lokSabhaPowerSnapshot.findFirst({ where: { prime_minister_term_ids: { has: 'vajpayee-2' } } })
	]);

	assert.equal(profileCount, primeMinisterProfiles.length, 'Neon profile count should match the local PM profile catalog');
	assert.equal(powerCount, lokSabhaPowerSnapshots.length, 'Neon power snapshot count should match the local House power catalog');
	assert.match(nehruProfile?.summary ?? '', /founding parliamentary period/i);
	assert.equal(vajpayeePower?.lok_sabha, '12th Lok Sabha');
	assert.match(vajpayeePower?.power_summary ?? '', /below the 272-seat majority mark/i);

	console.log('Prime Minister Neon data checks passed.');
} finally {
	await prisma.$disconnect();
}
