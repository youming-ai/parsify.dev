import type { Hono } from 'hono';

export interface ApiContext {
	db: D1Database;
	dbClient: any; // Simplified type
	transactionMonitor: any; // Simplified type
	transactionManager: any; // Simplified type
}

export type Variables = {
	[K in keyof ApiContext]: ApiContext[K];
};
