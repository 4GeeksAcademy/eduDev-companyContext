import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Keep this fixed allowlist identical to next.config.ts rewrites.
export const files = [
  'index.html', 'login.html', 'incidents.html', 'suppliers.html', 'incident-analysis.html',
  'styles.css', 'incidents.css', 'auth.js', 'login.js', 'session-guard.js',
  'dashboard.js', 'incidents.js', 'suppliers.js', 'incident-analysis.js',
];
const assets = new Map(files.map(file => [`/uis/backoffice/${file}`, new URL(file, import.meta.url)]));

export function createLegacyServer() {
  return http.createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end('Method not allowed\n');
      return;
    }
    // No decoding or normalization: aliases and traversal never become allowed paths.
    const asset = assets.get(request.url.split('?')[0]);
    try {
      if (!asset) throw new Error('Not allowlisted');
      const body = await readFile(asset);
      const type = asset.pathname.endsWith('.html') ? 'text/html' :
        asset.pathname.endsWith('.css') ? 'text/css' : 'text/javascript';
      response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Content-Length': body.length });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : 'Not found\n');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = process.env.BACKOFFICE_LEGACY_PORT ?? '3002';
  if (!/^[0-9]+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error('BACKOFFICE_LEGACY_PORT must be an integer from 1 to 65535');
  }
  const server = createLegacyServer();
  server.listen(Number(port), '127.0.0.1');
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => server.close());
  }
}
