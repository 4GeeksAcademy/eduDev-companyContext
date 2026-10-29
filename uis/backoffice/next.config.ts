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
    return files.map(file => ({
      source: `/uis/backoffice/${file}`,
      destination: `http://127.0.0.1:${Number(port)}/uis/backoffice/${file}`,
    }));
  },
};
