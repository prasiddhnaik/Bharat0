import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let localEnv: Record<string, string> | null = null;

function parseEnvFile(contents: string) {
	const values: Record<string, string> = {};

	for (const rawLine of contents.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;

		const separator = line.indexOf('=');
		if (separator === -1) continue;

		const key = line.slice(0, separator).trim();
		let value = line.slice(separator + 1).trim();
		if (!key) continue;

		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}

		values[key] = value.replace(/\\n/g, '\n');
	}

	return values;
}

function loadLocalEnv() {
	if (localEnv) return localEnv;

	localEnv = {};
	for (const filename of ['.env.local', '.env']) {
		const path = resolve(process.cwd(), filename);
		if (existsSync(path)) {
			localEnv = { ...parseEnvFile(readFileSync(path, 'utf8')), ...localEnv };
		}
	}

	return localEnv;
}

export function getServerEnv(name: string) {
	return process.env[name] ?? loadLocalEnv()[name];
}
