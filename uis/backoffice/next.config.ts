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
    return files.map(file => ({
      source: `/uis/backoffice/${file}`,
      destination: `http://127.0.0.1:3001/uis/backoffice/${file}`,
    }));
  },
};
