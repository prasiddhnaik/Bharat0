import { lokSabhaPowerSnapshots } from '../src/lib/domain/parliament-houses';
import { primeMinisterProfiles } from '../src/lib/domain/prime-minister-profiles';
import { createPrismaClient } from '../src/lib/server/db/prisma';

const prisma = createPrismaClient();

async function main() {
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

	console.log(`Upserted ${primeMinisterProfiles.length} Prime Minister profiles.`);
	console.log(`Upserted ${lokSabhaPowerSnapshots.length} Lok Sabha power snapshots.`);
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
