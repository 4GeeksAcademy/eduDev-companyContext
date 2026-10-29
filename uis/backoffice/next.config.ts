// Explicit files only: never expose repository config or private server paths.
const files = [
  'index.html', 'login.html', 'incidents.html', 'suppliers.html', 'incident-analysis.html',
  'styles.css', 'incidents.css', 'auth.js', 'login.js', 'session-guard.js',
  'dashboard.js', 'incidents.js', 'suppliers.js', 'incident-analysis.js',
];
export default {
  // Preserve repository-owned instructions; Next must not generate agent files.
  agentRules: false,
  async redirects() {
    return [{ source: '/uis/backoffice', destination: '/uis/backoffice/index.html', permanent: false }];
  },
  async rewrites() {
    const port = process.env.BACKOFFICE_LEGACY_PORT ?? '3001';
    if (!/^[0-9]+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
      throw new Error('BACKOFFICE_LEGACY_PORT must be an integer from 1 to 65535');
    }
    const apiRules = [];
    if (process.env.TRACKFLOW_API_PROXY === '1') {
      const value = process.env.TRACKFLOW_API_ORIGIN;
      let origin: URL;
      try {
        origin = new URL(value ?? '');
      } catch {
        throw new Error('TRACKFLOW_API_ORIGIN must be an HTTP(S) origin when TRACKFLOW_API_PROXY=1');
      }
      if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password ||
          origin.pathname !== '/' || origin.search || origin.hash ||
          !/^https?:\/\/[^/\\\s?#]+\/?$/i.test(value ?? '')) {
        throw new Error('TRACKFLOW_API_ORIGIN must be an HTTP(S) origin without credentials, path, query or fragment');
      }
      for (const family of ['auth', 'suppliers', 'inventory', 'api/incidents']) {
        apiRules.push({ source: `/api/${family}/:path*`, destination: `${origin.origin}/${family}/:path*` });
      }
    }
    return [...files.map(file => ({
      source: `/uis/backoffice/${file}`,
      destination: `http://127.0.0.1:${Number(port)}/uis/backoffice/${file}`,
    })), ...apiRules];
  },
};
