import { defineCloudflareConfig, r2IncrementalCache } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
	// Enable R2 for incremental cache
	incrementalCache: r2IncrementalCache,
});
