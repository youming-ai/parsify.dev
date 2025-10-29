import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  // You can add custom Cloudflare configuration here
  // For example, R2 for incremental cache:
  // incrementalCache: r2IncrementalCache,
});
