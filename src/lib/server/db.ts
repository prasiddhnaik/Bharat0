export const databaseReadiness = {
	status: 'schema-prepared-seed-repository-active',
	note: 'Prisma schema is present for PostgreSQL. Server routes now read through a repository boundary that is seed-backed until official ingestion adapters and database read models are built.'
} as const;
