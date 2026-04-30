import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';

function readDatabaseUrl() {
	const connectionString = process.env.DATABASE_URL?.trim();
	if (!connectionString) {
		throw new Error('DATABASE_URL is required for Prisma database access.');
	}

	return connectionString.replace(/^(['"])(.*)\1$/, '$2');
}

export function createPrismaClient() {
	const adapter = new PrismaPg({ connectionString: readDatabaseUrl() });
	return new PrismaClient({ adapter });
}
