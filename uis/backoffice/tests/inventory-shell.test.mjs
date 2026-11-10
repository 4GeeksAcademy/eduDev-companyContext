import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const layout = read('../app/backoffice/inventory/layout.tsx');
const sidebar = read('../components/control-room-sidebar.tsx');
const gate = read('../components/inventory-session-gate.tsx');

test('inventory reuses the Control Room stylesheet and page frame', () => {
  assert.match(layout, /import '\.\.\/\.\.\/\.\.\/styles\.css';/);
  assert.match(layout, /<header className="topbar">/);
  assert.match(layout, /<span className="logo" aria-hidden="true">TF<\/span>/);
  assert.match(layout, /<strong>TrackFlow<\/strong><span>Control Room<\/span>/);
  assert.match(layout, /<div className="app-shell"><ControlRoomSidebar \/>/);
  assert.match(layout, /<main id="main-content" className="inventory">/);
  assert.match(layout, /<footer>TrackFlow · Internal inventory · LA \/ ZGZ<\/footer>/);
  assert.match(layout, /<a className="skip-link" href="#main-content">Skip to inventory<\/a>/);
});

test('inventory sidebar lists the Control Room sections with Inventory current', () => {
  const links = [...sidebar.matchAll(/\['([^']+)', '([^']+)'\]/g)].map(([, label, path]) => [label, path]);
  assert.deepEqual(links, [
    ['Operations overview', '/uis/backoffice/index.html'],
    ['Inventory', '/backoffice/inventory/products'],
    ['Incident analysis', '/uis/backoffice/incident-analysis.html'],
    ['Incident manager', '/uis/backoffice/incidents.html'],
    ['Supplier directory', '/uis/backoffice/suppliers.html'],
  ]);
  assert.match(sidebar, /<aside className="sidebar" aria-label="Application menu">/);
  assert.match(sidebar, /className=\{current \? 'active-item' : undefined\}/);
  assert.match(sidebar, /aria-current=\{current \? 'page' : undefined\}/);
  assert.match(sidebar, /<button type="button" onClick=\{logout\}>Sign out<\/button>/);
});

test('sidebar keeps the query string on every Control Room link', () => {
  assert.ok(sidebar.includes('const search = useSearchParams().toString();'));
  assert.ok(sidebar.includes('href={`${path}${search ? `?${search}` : \'\'}`}'));
});

test('session gate only validates and no longer draws its own navigation', () => {
  assert.doesNotMatch(gate, /Skip to inventory|Operations overview/);
  assert.match(gate, /Validating your session…/);
  assert.match(gate, /return <>\{children\}<\/>;/);
});
