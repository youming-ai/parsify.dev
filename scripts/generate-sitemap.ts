/**
 * Generate dist/sitemap.xml after `astro build`.
 *
 * Single-file sitemap (no sitemap-index split) so the URL stays at the
 * conventional /sitemap.xml location. Routes come from the tool registry plus
 * the two hub pages so we never drift from the actual rendered pages.
 */

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AI_TOOLS_CATEGORY, toolsData } from '../src/data/tools-data';

const BASE_URL = 'https://parsify.dev';
const lastmod = new Date().toISOString();

interface Entry {
  loc: string;
  priority: string;
  changefreq: 'weekly' | 'monthly';
}

const entries: Entry[] = [
  { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'weekly' },
  { loc: `${BASE_URL}/ai`, priority: '0.9', changefreq: 'weekly' },
  ...toolsData
    .filter((t) => t.category === AI_TOOLS_CATEGORY)
    .map(
      (t): Entry => ({
        loc: `${BASE_URL}${t.href}`,
        priority: '0.8',
        changefreq: 'monthly',
      })
    ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const out = resolve(process.cwd(), 'dist/sitemap.xml');
await writeFile(out, xml);
console.log(`Generated ${out} (${entries.length} URLs)`);
