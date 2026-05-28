import assert from 'node:assert/strict';
import {
	dataGovDebates,
	dataGovQuestions,
	dataGovTimelineEvents
} from '../src/lib/data/generated/data-gov-questions';
import {
	pdlPre2004BillActions,
	pdlPre2004Bills,
	pdlPre2004SittingDays,
	pdlPre2004TimelineEvents
} from '../src/lib/data/generated/pdl-pre2004-legislation';
import {
	prsBillActions,
	prsBills,
	prsSittingDays,
	prsTimelineEvents
} from '../src/lib/data/generated/prs-legislation';
import {
	prsCurrentSessionBillActions,
	prsCurrentSessionBills,
	prsCurrentSessionSittingDays,
	prsCurrentSessionTimelineEvents
} from '../src/lib/data/generated/prs-current-session-legislation';
import {
	sansadActs,
	sansadBillActions,
	sansadBills,
	sansadTimelineEvents
} from '../src/lib/data/generated/sansad-legislation';
import { makeLogger } from './lib/logger';

const log = makeLogger('VERIFY-GENERATED');

const generatedSources = [
	{
		name: 'Sansad',
		counts: {
			bills: sansadBills.length,
			actions: sansadBillActions.length,
			timelineEvents: sansadTimelineEvents.length,
			acts: sansadActs.length
		}
	},
	{
		name: 'PRS',
		counts: {
			bills: prsBills.length,
			actions: prsBillActions.length,
			sittingDays: prsSittingDays.length,
			timelineEvents: prsTimelineEvents.length
		}
	},
	{
		name: 'PRS current session',
		counts: {
			bills: prsCurrentSessionBills.length,
			actions: prsCurrentSessionBillActions.length,
			sittingDays: prsCurrentSessionSittingDays.length,
			timelineEvents: prsCurrentSessionTimelineEvents.length
		}
	},
	{
		name: 'PDL',
		counts: {
			bills: pdlPre2004Bills.length,
			actions: pdlPre2004BillActions.length,
			sittingDays: pdlPre2004SittingDays.length,
			timelineEvents: pdlPre2004TimelineEvents.length
		}
	},
	{
		name: 'data.gov',
		counts: {
			questions: dataGovQuestions.length,
			debates: dataGovDebates.length,
			timelineEvents: dataGovTimelineEvents.length
		}
	}
];

for (const source of generatedSources) {
	for (const [label, count] of Object.entries(source.counts)) {
		assert.ok(count > 0, `${source.name} generated ${label} should not be empty`);
	}
	log.info(`${source.name}: ${Object.entries(source.counts).map(([label, count]) => `${label}=${count.toLocaleString('en-IN')}`).join(', ')}`);
}

assert.equal(dataGovTimelineEvents.length, dataGovQuestions.length + dataGovDebates.length, 'data.gov timeline events should cover question and debate catalog rows');

log.info('Generated data checks passed.');
