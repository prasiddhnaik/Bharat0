import { mkdir, writeFile } from 'node:fs/promises';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { BillStage, BillType, House, TimelineEventType } from '../src/generated/prisma/enums';
import { loadRecentSansadBills, matchBillNumber, normalizeActions, normalizeAct, normalizeBill, normalizeTimelineEvents, type SansadBillsPayload, type SansadBillRecord } from '../src/lib/ingestion/sansad-bills';
import { fetchJson, runCli } from './lib/refresh';
import { applyCommitteeReferrals, loadCommitteeReferrals } from '../src/lib/ingestion/sansad-committee-referrals';

const since = '2024-06-09';
const artifactDir = `artifacts/data-refresh-${new Date().toISOString().slice(0, 10)}`;
const date = (value: string) => new Date(`${value}T00:00:00+05:30`);
const iso = (value: Date) => new Date(value.getTime() + 19_800_000).toISOString().slice(0, 10);
const normalizedTitle = (value: string) => value.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '');
function enumValue<T extends string>(values: Record<string, T>, value: string): T {
	const result = values[value.replaceAll('-', '_').toUpperCase()];
	if (!result) throw new Error(`Invalid imported enum: ${value}`);
	return result;
}

export async function syncLiveBills(dryRun = false) {
	await mkdir(artifactDir, { recursive: true });
	const snapshot = await loadRecentSansadBills(async (url) => {
		const payload = await fetchJson<SansadBillsPayload>(url, { headers: { accept: 'application/json', referer: 'https://sansad.in/ls/legislation/bills', 'user-agent': 'BharatZero data refresh' } });
		console.log(`Read official page ${payload._metadata?.currentPageNumber ?? '?'}: ${payload.records?.length ?? 0} rows`);
		return payload;
	}, since);
	if (!snapshot.records.length) throw new Error('No current-term records returned; refusing an empty refresh.');
	const referrals = await loadCommitteeReferrals((url) => fetchJson(url));
	const checkedAt = new Date().toISOString();
	await writeFile(`${artifactDir}/sansad-snapshot.json`, JSON.stringify({ checkedAt, ...snapshot }, null, 2));
	await writeFile(`${artifactDir}/committee-referrals-snapshot.json`, JSON.stringify({ checkedAt, ...referrals }, null, 2));

	const unique = new Map<string, SansadBillRecord>();
	for (const record of applyCommitteeReferrals(snapshot.records, referrals.records)) {
		const bill = normalizeBill(record);
		const key = `${bill.id}:${record.billNumber}:${bill.origin_house}`;
		const previous = unique.get(key);
		const completeness = (row: SansadBillRecord) => Object.values(row).filter(Boolean).length;
		const priorDate = previous ? normalizeBill(previous).latest_action_date : '';
		if (!previous || bill.latest_action_date > priorDate || (bill.latest_action_date === priorDate && completeness(record) > completeness(previous))) unique.set(key, record);
	}
	const db = createPrismaClient();
	try {
		const existing = await db.bill.findMany();
		const reserved = new Set<string>();
		const plans = [...unique.values()].map((record) => {
			const bill = normalizeBill(record);
			const matches = existing.filter((row) => row.origin_house === enumValue(House, bill.origin_house) && iso(row.introduced_on) === bill.introduced_on && normalizedTitle(row.title_en) === normalizedTitle(bill.title_en));
			const match = matchBillNumber(matches, bill.bill_number, bill.id);
			if (match) bill.id = match.id;
			else if (existing.some((row) => row.id === bill.id) || reserved.has(bill.id)) bill.id += `-${record.billNumber?.trim() ?? bill.origin_house}`;
			if (reserved.has(bill.id)) throw new Error(`Ambiguous source identity: ${bill.id}`);
			reserved.add(bill.id);
			if (match && match.title_hi !== match.title_en) bill.title_hi = match.title_hi;
			const fields = {
				title_en: bill.title_en, title_hi: bill.title_hi, bill_number: bill.bill_number, bill_year: bill.bill_year,
				bill_type: enumValue(BillType, bill.bill_type), origin_house: enumValue(House, bill.origin_house),
				current_stage: enumValue(BillStage, bill.current_stage), ministry: bill.ministry,
				introduced_on: date(bill.introduced_on), latest_action_date: date(bill.latest_action_date),
				source_url: bill.source_url, summary: bill.summary, is_demo_seed: false
			};
			const older = match && iso(match.latest_action_date) > bill.latest_action_date;
			if (older) for (const key of Object.keys(fields) as Array<keyof typeof fields>) if (key !== 'bill_number') Object.assign(fields, { [key]: match[key] });
			const changed = !match || Object.entries(fields).some(([key, value]) => {
				const old = match[key as keyof typeof match];
				return value instanceof Date ? !(old instanceof Date) || value.getTime() !== old.getTime() : old !== value;
			});
			return { record, bill, fields, match, changed, older };
		});
		const ids = plans.map(({ bill }) => bill.id);
		const [actions, events, acts] = await Promise.all([
			db.billAction.findMany({ where: { bill_id: { in: ids } } }),
			db.timelineEvent.findMany({ where: { related_bill_id: { in: ids } } }),
			db.act.findMany({ where: { linked_bill_id: { in: ids } } })
		]);
		const summary = { checkedAt, sourceUrl: snapshot.sourceUrl, coverage: `Bills introduced since ${since}; actions, linked Acts and official committee referrals`, since, pages: snapshot.pages, sourceRows: snapshot.records.length, committeeReferralRows: referrals.records.length, uniqueBills: plans.length, inserted: plans.filter((p) => !p.match).length, updated: plans.filter((p) => p.match && p.changed).length, retainedNewer: plans.filter((p) => p.older).length, latestActivityDate: plans.map(({ bill }) => bill.latest_action_date).sort().at(-1) ?? null };
		console.log(JSON.stringify({ dryRun, ...summary }, null, 2));
		await writeFile(`${artifactDir}/bills-change-plan.json`, JSON.stringify(plans.filter((plan) => plan.changed).map(({ bill, fields, match }) => ({ id: bill.id, title: fields.title_en, previous: match ? { stage: match.current_stage, latestActionDate: iso(match.latest_action_date) } : null, next: { stage: fields.current_stage, latestActionDate: iso(fields.latest_action_date) } })), null, 2));
		if (dryRun) return summary;
		await writeFile(`${artifactDir}/backup-${checkedAt.replaceAll(':', '-')}.json`, JSON.stringify({ bills: existing.filter((row) => ids.includes(row.id)), actions, events, acts }, null, 2));
		const actionRows = plans.flatMap(({ bill, record }) => normalizeActions(record, bill).map((action) => {
			const prior = actions.find((row) => row.bill_id === bill.id && iso(row.date) === action.date && row.house === enumValue(House, action.house) && row.action_type === action.action_type);
			return { prior, fields: { id: prior?.id ?? action.id, bill_id: bill.id, date: date(action.date), house: enumValue(House, action.house), action_type: action.action_type, description: action.description, source_url: action.source_url, is_demo_seed: false } };
		}));
		const eventRows = plans.flatMap(({ bill, record }) => normalizeTimelineEvents(record, bill, normalizeActions(record, bill)).map((event) => {
			const prior = events.find((row) => row.related_bill_id === bill.id && iso(row.date) === event.date && row.house === enumValue(House, event.house) && row.type === enumValue(TimelineEventType, event.type));
			return { prior, fields: { id: prior?.id ?? event.id, related_bill_id: bill.id, date: date(event.date), house: enumValue(House, event.house), type: enumValue(TimelineEventType, event.type), title: event.title, description: event.description, source_url: event.source_url, is_demo_seed: false } };
		}));
		const actRows = plans.flatMap(({ bill, record }) => {
			const act = normalizeAct(record, bill);
			if (!act) return [];
			const prior = acts.find((row) => row.linked_bill_id === bill.id && row.year === act.year);
			return [{ prior, fields: { id: prior?.id ?? act.id, title: act.title, act_number: act.act_number, year: act.year, linked_bill_id: bill.id, india_code_url: act.india_code_url, is_demo_seed: false } }];
		});
		await db.$transaction(async (tx) => {
			await tx.bill.createMany({ data: plans.filter((plan) => !plan.match).map(({ bill, fields }) => ({ id: bill.id, ...fields })), skipDuplicates: true });
			for (const plan of plans.filter((plan) => plan.match && plan.changed)) await tx.bill.update({ where: { id: plan.bill.id }, data: plan.fields });
			await tx.billAction.createMany({ data: actionRows.map(({ fields }) => fields), skipDuplicates: true });
			await tx.timelineEvent.createMany({ data: eventRows.map(({ fields }) => fields), skipDuplicates: true });
			await tx.act.createMany({ data: actRows.map(({ fields }) => fields), skipDuplicates: true });
			for (const { prior, fields } of actionRows) if (prior && prior.source_url !== fields.source_url) await tx.billAction.update({ where: { id: prior.id }, data: { source_url: fields.source_url } });
			for (const { prior, fields } of eventRows) if (prior && prior.source_url !== fields.source_url) await tx.timelineEvent.update({ where: { id: prior.id }, data: { source_url: fields.source_url } });
			for (const { prior, fields } of actRows) if (prior && (prior.act_number !== fields.act_number || prior.india_code_url !== fields.india_code_url)) await tx.act.update({ where: { id: prior.id }, data: fields });
		}, { timeout: 180_000 });
		await writeFile('src/lib/data/generated/data-refresh.json', JSON.stringify(summary, null, 2) + '\n');
		console.log('Official current-term refresh completed. Existing records and newer curated outcomes were retained.');
		return summary;
	} finally { await db.$disconnect(); }
}
runCli(import.meta.url, () => syncLiveBills(process.argv.includes('--dry-run')));
