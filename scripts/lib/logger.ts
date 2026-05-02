export type ScriptLogger = {
	info(message: string): void;
	warn(message: string): void;
	error(message: string): void;
};

export function makeLogger(tag: string): ScriptLogger {
	const prefix = () => `${new Date().toISOString()} [${tag}]`;
	return {
		info(message) {
			console.log(`${prefix()} ${message}`);
		},
		warn(message) {
			console.warn(`${prefix()} ${message}`);
		},
		error(message) {
			console.error(`${prefix()} ${message}`);
		}
	};
}
