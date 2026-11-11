import { INGESTION_SOURCES, sourceRefreshStatus, type IngestionRunRow, type IngestionSource } from '../domain/ingestion-status';

export async function readIngestionStatus(prisma: { ingestionRun?: { findMany(args: unknown): Promise<IngestionRunRow[]> } }) {
	if (!prisma.ingestionRun) return [];
	return Promise.all((Object.keys(INGESTION_SOURCES) as IngestionSource[]).map(async (source) => {
		const [latest, success] = await Promise.all([
			prisma.ingestionRun!.findMany({ where: { source }, orderBy: { started_at: 'desc' }, take: 1 }),
			prisma.ingestionRun!.findMany({ where: { source, status: 'succeeded' }, orderBy: { started_at: 'desc' }, take: 1 })
		]);
		return sourceRefreshStatus(source, latest[0], success[0]);
	}));
}
