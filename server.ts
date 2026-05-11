const PORT = Number(process.env['PORT'] ?? 3000);

const DIST = './dist';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function getMime(path: string): string {
  const ext = path.substring(path.lastIndexOf('.'));
  return MIME[ext] ?? 'application/octet-stream';
}

function isAstroAsset(urlPath: string): boolean {
  return urlPath.startsWith('/_astro/');
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // Strip trailing slash except root
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Resolve file: exact path → .html extension → 404
    let file = Bun.file(`${DIST}${pathname}`);
    let resolvedPath = pathname;

    if (!(await file.exists())) {
      resolvedPath = `${pathname}.html`;
      file = Bun.file(`${DIST}${resolvedPath}`);
      if (!(await file.exists())) {
        resolvedPath = '/404.html';
        file = Bun.file(`${DIST}/404.html`);
      }
    }

    const headers = new Headers();
    headers.set('Content-Type', getMime(resolvedPath));
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Cache: hashed assets immutable, HTML must-revalidate
    if (isAstroAsset(resolvedPath)) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      headers.set('Cache-Control', 'public, must-revalidate');
    }

    return new Response(file, { headers });
  },
});

// biome-ignore lint/suspicious/noConsole: server startup log
console.log(`Server running at http://localhost:${server.port}`);
