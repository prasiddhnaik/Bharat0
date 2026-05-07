export type ParsedFlags<FlagName extends string> = Record<FlagName, boolean>;

export function parseFlags<const FlagName extends string>(allowedFlags: readonly FlagName[]): ParsedFlags<FlagName> {
	const parsed = Object.fromEntries(allowedFlags.map((flag) => [flag, false])) as ParsedFlags<FlagName>;
	const allowed = new Set(allowedFlags);

	for (const arg of process.argv.slice(2)) {
		if (!arg.startsWith('--')) continue;
		const flag = arg.slice(2);
		if (!allowed.has(flag as FlagName)) {
			throw new Error(`Unknown flag: --${flag}. Allowed flags: ${allowedFlags.map((name) => `--${name}`).join(', ')}`);
		}
		parsed[flag as FlagName] = true;
	}

	return parsed;
}
