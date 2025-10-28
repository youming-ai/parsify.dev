export interface Logger {
	debug(message: string, ...args: unknown[]): void;
	info(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string, ...args: unknown[]): void;
}

export const logger: Logger = {
	debug: (message: string, ...args: unknown[]) => {
		if (
			process.env.NODE_ENV === 'development' ||
			process.env.LOG_LEVEL === 'debug'
		) {
			console.debug(`[DEBUG] ${message}`, ...args);
		}
	},
	info: (message: string, ...args: unknown[]) => {
		console.info(`[INFO] ${message}`, ...args);
	},
	warn: (message: string, ...args: unknown[]) => {
		console.warn(`[WARN] ${message}`, ...args);
	},
	error: (message: string, ...args: unknown[]) => {
		console.error(`[ERROR] ${message}`, ...args);
	},
};
