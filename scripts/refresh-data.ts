import { mkdir, writeFile } from 'node:fs/promises';
import { Client } from 'pg';
import { createPrismaClient } from '../src/lib/server/db/prisma';
import { runCli, runSources, withRefreshLock, type SourceJob } from './lib/refresh';
import { syncLiveBills } from './sync-live-bills';
import { syncLiveDebates } from './sync-live-debates';
import { syncLiveQuestions } from './sync-live-questions';
import { syncLiveCatalogs } from './sync-live-catalogs';

async function refreshData() {
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
	const dryRun = process.argv.includes('--dry-run');
	const selected = process.argv.find((arg) => arg.startsWith('--source='))?.slice(9);
	const jobs: SourceJob[] = [
		{ id: 'bills', run: () => syncLiveBills(dryRun) },
		{ id: 'debates', run: () => syncLiveDebates(dryRun) },
		{ id: 'questions', run: () => syncLiveQuestions(dryRun) },
		{ id: 'catalogs', run: () => syncLiveCatalogs(dryRun) }
	].filter((job) => !selected || job.id === selected);
	if (!jobs.length) throw new Error(`Unknown source: ${selected}`);
	const db = createPrismaClient();
	try {
		const outcome = await withRefreshLock(new Client({ connectionString: process.env.DATABASE_URL }), async () => {
			const runIds = new Map<string, string>();
			return runSources(jobs, async (source, status, summary, error) => {
				console.log(`${source}: ${status}${summary ? ` (${summary.sourceRows} records, ${summary.inserted} added, ${summary.updated} updated)` : ''}`);
				if (error) console.error(`${source}: ${error}`);
				if (dryRun) return;
				if (status === 'running') {
					const run = await db.ingestionRun.create({ data: { source, status } });
					runIds.set(source, run.id);
				} else await db.ingestionRun.update({ where: { id: runIds.get(source)! }, data: { status, completed_at: new Date(), ...(summary ? { summary } : {}), error: error ?? null } });
			});
		});
		const dir = `artifacts/data-refresh-${new Date().toISOString().slice(0, 10)}`;
		await mkdir(dir, { recursive: true });
		await writeFile(`${dir}/run-summary.json`, JSON.stringify({ completedAt: new Date().toISOString(), dryRun, ...outcome }, null, 2));
		if (outcome.skipped) console.log('Another refresh holds the database lock; this run was skipped.');
		else if (outcome.result.some((row) => row.status === 'failed')) throw new Error('One or more sources failed. Successful sources were applied; previous data for failed sources was retained.');
	} finally { await db.$disconnect(); }
}
runCli(import.meta.url, refreshData);
