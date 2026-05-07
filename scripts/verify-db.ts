import assert from 'node:assert/strict';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { assertEnv } from './lib/envCheck';
import { makeLogger } from './lib/logger';

const log = makeLogger('VERIFY-DB');
assertEnv(['DATABASE_URL'], log);
const prisma = createPrismaClient();

try {
	const [billCount, actionCount, timelineCount, actCount, debateCount, debateTranscriptCount, latestBill] = await Promise.all([
		prisma.bill.count(),
		prisma.billAction.count(),
		prisma.timelineEvent.count(),
		prisma.act.count(),
		prisma.debate.count(),
		prisma.debateTranscript.count(),
		prisma.bill.findFirst({ orderBy: { latest_action_date: 'desc' } })
	]);

	assert.ok(billCount >= 1400, `expected at least 1400 bill records, found ${billCount}`);
	assert.ok(actionCount >= 2400, `expected at least 2400 bill actions, found ${actionCount}`);
	assert.ok(timelineCount >= 2400, `expected at least 2400 timeline events, found ${timelineCount}`);
	assert.ok(actCount >= 200, `expected at least 200 acts, found ${actCount}`);
	assert.ok(debateCount >= 6, `expected at least 6 debate records, found ${debateCount}`);
	assert.ok(debateTranscriptCount >= 3, `expected at least 3 debate transcript metadata records, found ${debateTranscriptCount}`);
	assert.ok(latestBill, 'expected latest bill record');

	console.log(
		JSON.stringify(
			{
				bills: billCount,
				billActions: actionCount,
				timelineEvents: timelineCount,
				acts: actCount,
				debates: debateCount,
				debateTranscripts: debateTranscriptCount,
				latestBill: latestBill.title_en
			},
			null,
			2
		)
	);
} finally {
	await prisma.$disconnect();
}
