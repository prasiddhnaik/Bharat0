import type { ScriptLogger } from './logger';

export type CountMap = Record<string, number>;

export async function chunkInsert<T>(
	rows: T[],
	chunkSize: number,
	insertFn: (chunk: T[]) => Promise<{ count: number } | number>
) {
	let total = 0;
	for (let index = 0; index < rows.length; index += chunkSize) {
		const result = await insertFn(rows.slice(index, index + chunkSize));
		total += typeof result === 'number' ? result : result.count;
	}
	return total;
}

export function guardNonEmpty(label: string, count: number, allowEmpty: boolean, log: ScriptLogger) {
	if (count > 0 || allowEmpty) return;
	log.error(`${label} generated input is empty; refusing to delete existing rows.`);
	log.error('Re-run the generator first, or pass --allow-empty if this wipe is intentional.');
	process.exit(1);
}

export function formatCountMap(counts: CountMap) {
	return Object.entries(counts)
		.map(([label, count]) => `${label}=${count.toLocaleString('en-IN')}`)
		.join(', ');
}

export function sumCounts(counts: CountMap) {
	return Object.values(counts).reduce((total, count) => total + count, 0);
}
