import type { ScriptLogger } from './logger';

export function assertEnv(required: string[], log: ScriptLogger = console) {
	const missing = required.filter((name) => !process.env[name]?.trim());
	if (missing.length > 0) {
		log.error(`missing required env: ${missing.join(', ')}`);
		process.exit(1);
	}
}

export function reportOptionalEnv(optional: string[], log: ScriptLogger = console) {
	for (const name of optional) {
		log.info(`${name}: ${process.env[name]?.trim() ? 'configured' : 'not set (will use local fallback)'}`);
	}
}

export function safeDbUrl(url: string) {
	return url
		.replace(/^(['"])(.*)\1$/, '$2')
		.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
}
