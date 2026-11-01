import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const gate = read('../components/inventory-session-gate.tsx');
const layout = read('../app/backoffice/inventory/layout.tsx');
const css = read('../app/backoffice/inventory/inventory.css');

// Exact standalone selectors: descendant .inventory rules cannot reach these links.
function rule(selector) {
  const body = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .find(match => match[1].trim() === selector)?.[2];
  assert.ok(body, `Missing standalone ${selector} rule`);
  return body;
}

test('both session navigation anchors use the scoped target class', () => {
  const anchors = [...gate.matchAll(/<a\s+([^>]+)>([^<]+)<\/a>/g)];
  assert.deepEqual(anchors.map(match => match[2]), ['Skip to inventory', 'Operations overview']);
  for (const [, attributes, label] of anchors) {
    assert.match(attributes, /className="inventory-session-link"/, label);
    assert.doesNotMatch(attributes, /tabIndex|aria-hidden/);
  }
});

test('session links declare padded minimum targets with wrapping', () => {
  const body = rule('.inventory-session-link');
  assert.match(body, /display:\s*inline-flex\s*;/);
  assert.match(body, /box-sizing:\s*border-box\s*;/);
  assert.match(body, /min-height:\s*44px\s*;/);
  assert.match(body, /min-width:\s*24px\s*;/);
  assert.match(body, /padding:\s*\.5rem\s+\.75rem\s*;/);
  assert.match(body, /max-width:\s*100%\s*;/);
  assert.match(body, /overflow-wrap:\s*anywhere\s*;/);
});

test('session links declare visible keyboard focus outside inventory', () => {
  const body = rule('.inventory-session-link:focus-visible');
  assert.match(body, /outline:\s*3px solid #215bbb\s*;/);
  assert.match(body, /outline-offset:\s*3px\s*;/);
});

test('skip destination and query-preserving operations navigation stay intact', () => {
  assert.match(gate, /href="#main-content"/);
  assert.match(layout, /<main id="main-content">\{children\}<\/main>/);
  assert.ok(gate.includes('const search = useSearchParams().toString();'));
  assert.ok(gate.includes('href={`/uis/backoffice/index.html${search ? `?${search}` : \'\'}`}'));
  assert.match(gate, /Operations overview<\/a>\{' '\}\s*<button onClick=\{logout\}>Sign out<\/button>/);
});
