export const INGESTION_SOURCES = { bills: 'Bills and Acts', debates: 'Lok Sabha debates', questions: 'Rajya Sabha questions', catalogs: 'OGD catalogs' } as const;
export type IngestionSource = keyof typeof INGESTION_SOURCES;
export type IngestionRunRow = { source: string; status: string; started_at: Date | string; completed_at: Date | string | null; summary: unknown };
export type SourceRefreshStatus = { source: IngestionSource; label: string; status: string; attemptedAt: string | null; succeededAt: string | null; coverage: string | null; latestRecordDate: string | null; sourceRows: number | null; inserted: number | null; updated: number | null; since: string | null };

export function sourceRefreshStatus(source: IngestionSource, latest?: IngestionRunRow, success?: IngestionRunRow): SourceRefreshStatus {
	const summary = success?.summary && typeof success.summary === 'object' ? success.summary as Record<string, unknown> : {};
	const date = (value: Date | string | null | undefined) => value ? new Date(value).toISOString() : null;
	const text = (key: string) => typeof summary[key] === 'string' ? summary[key] as string : null;
	const count = (key: string) => typeof summary[key] === 'number' ? summary[key] as number : null;
	return { source, label: INGESTION_SOURCES[source], status: latest?.status ?? 'never', attemptedAt: date(latest?.started_at), succeededAt: date(success?.completed_at), coverage: text('coverage'), latestRecordDate: text('latestActivityDate'), sourceRows: count('sourceRows'), inserted: count('inserted'), updated: count('updated'), since: text('since') };
}
