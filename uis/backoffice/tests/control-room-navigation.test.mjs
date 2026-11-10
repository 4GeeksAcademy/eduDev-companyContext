import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = {
  'index.html': './',
  'incident-analysis.html': 'incident-analysis.html',
  'incidents.html': 'incidents.html',
  'suppliers.html': 'suppliers.html',
};

const sidebarLinks = html => {
  const nav = /<nav class="sidebar-nav">([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? '';
  return [...nav.matchAll(/<a([^>]*)href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
    .map(([, attrs, href, label]) => ({ href, label, current: attrs.includes('aria-current="page"') }));
};

for (const [file, self] of Object.entries(pages)) {
  test(`${file} sidebar links to inventory and keeps the existing sections`, async () => {
    const links = sidebarLinks(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'));
    assert.deepEqual(links.map(({ href, label }) => [label, href]), [
      ['Operations overview', './'],
      ['Inventory', '/backoffice/inventory/products'],
      ['Incident analysis', 'incident-analysis.html'],
      ['Incident manager', 'incidents.html'],
      ['Supplier directory', 'suppliers.html'],
    ]);
    assert.deepEqual(links.filter(link => link.current).map(link => link.href), [self]);
  });
}
