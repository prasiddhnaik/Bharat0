import { readFile } from 'node:fs/promises';
import { Client } from 'pg';
import 'dotenv/config';
import { runCli } from './lib/refresh';

export async function setupIngestion() {
	const client = new Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();
	try { await client.query(await readFile(new URL('../prisma/migrations/20261111000000_ingestion_runs/migration.sql', import.meta.url), 'utf8')); }
	finally { await client.end(); }
}
runCli(import.meta.url, setupIngestion);
