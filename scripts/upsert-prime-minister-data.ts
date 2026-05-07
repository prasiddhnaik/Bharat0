import { lokSabhaPowerSnapshots } from '../src/lib/domain/parliament-houses';
import { primeMinisterProfiles } from '../src/lib/domain/prime-minister-profiles';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { assertEnv, safeDbUrl } from './lib/envCheck';
import { parseFlags } from './lib/flags';
import { makeLogger } from './lib/logger';

const log = makeLogger('PM-DATA');
const flags = parseFlags(['dry-run']);
assertEnv(['DATABASE_URL'], log);
const prisma = createPrismaClient();

async function main() {
	const existingCounts = {
		profiles: await prisma.primeMinisterProfile.count(),
		powerSnapshots: await prisma.lokSabhaPowerSnapshot.count()
	};
	log.info(`source records:   profiles=${primeMinisterProfiles.length.toLocaleString('en-IN')}, powerSnapshots=${lokSabhaPowerSnapshots.length.toLocaleString('en-IN')}`);
	log.info(`existing rows:    profiles=${existingCounts.profiles.toLocaleString('en-IN')}, powerSnapshots=${existingCounts.powerSnapshots.toLocaleString('en-IN')}`);

	if (flags['dry-run']) {
		log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (tables: PrimeMinisterProfile, LokSabhaPowerSnapshot)`);
		log.info('dry-run; no changes made.');
		return;
	}

	for (const profile of primeMinisterProfiles) {
		await prisma.primeMinisterProfile.upsert({
			where: { source_url: profile.sourceUrl },
			create: {
				term_ids: profile.termIds,
				summary: profile.summary,
				highlights: profile.highlights,
				source_label: profile.sourceLabel,
				source_url: profile.sourceUrl
			},
			update: {
				term_ids: profile.termIds,
				summary: profile.summary,
				highlights: profile.highlights,
				source_label: profile.sourceLabel
			}
		});
	}

	for (const snapshot of lokSabhaPowerSnapshots) {
		await prisma.lokSabhaPowerSnapshot.upsert({
			where: {
				lok_sabha_election_year_period: {
					lok_sabha: snapshot.lokSabha,
					election_year: snapshot.electionYear,
					period: snapshot.period
				}
			},
			create: {
				prime_minister_term_ids: snapshot.primeMinisterTermIds,
				lok_sabha: snapshot.lokSabha,
				period: snapshot.period,
				election_year: snapshot.electionYear,
				largest_party: snapshot.largestParty,
				largest_party_seats: snapshot.largestPartySeats,
				runner_up_party: snapshot.runnerUpParty,
				runner_up_seats: snapshot.runnerUpSeats,
				governing_side: snapshot.governingSide,
				governing_seats: snapshot.governingSeats ?? null,
				majority_mark: snapshot.majorityMark,
				power_summary: snapshot.powerSummary,
				composition: snapshot.composition,
				source_label: snapshot.sourceLabel,
				source_url: snapshot.sourceUrl,
				as_of: snapshot.asOf
			},
			update: {
				prime_minister_term_ids: snapshot.primeMinisterTermIds,
				largest_party: snapshot.largestParty,
				largest_party_seats: snapshot.largestPartySeats,
				runner_up_party: snapshot.runnerUpParty,
				runner_up_seats: snapshot.runnerUpSeats,
				governing_side: snapshot.governingSide,
				governing_seats: snapshot.governingSeats ?? null,
				majority_mark: snapshot.majorityMark,
				power_summary: snapshot.powerSummary,
				composition: snapshot.composition,
				source_label: snapshot.sourceLabel,
				source_url: snapshot.sourceUrl,
				as_of: snapshot.asOf
			}
		});
	}

	log.info(`inserted rows:    upserted profiles=${primeMinisterProfiles.length.toLocaleString('en-IN')}, powerSnapshots=${lokSabhaPowerSnapshots.length.toLocaleString('en-IN')}`);
	log.info(`target:           ${safeDbUrl(process.env.DATABASE_URL ?? '')} (tables: PrimeMinisterProfile, LokSabhaPowerSnapshot)`);
}

main()
	.catch((error) => {
		log.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
