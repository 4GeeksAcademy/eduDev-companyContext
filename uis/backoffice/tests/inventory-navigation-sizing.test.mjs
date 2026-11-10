import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const navigation = read('../components/inventory-navigation.tsx');
const layout = read('../app/backoffice/inventory/layout.tsx');
const css = read('../app/backoffice/inventory/inventory.css');

// Exact standalone selectors, so a descendant rule cannot satisfy them by accident.
function rule(selector) {
  const body = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .find(match => match[1].trim() === selector)?.[2];
  assert.ok(body, `Missing standalone ${selector} rule`);
  return body;
}

test('inventory tabs keep their labelled navigation and query-preserving links', () => {
  assert.match(navigation, /<nav aria-label="Inventory" className="inventory-tabs">/);
  assert.ok(navigation.includes('href={inventoryLink(path, search)}'));
  assert.ok(navigation.includes("aria-current={pathname === path ? 'page' : undefined}"));
});

test('inventory tabs declare padded minimum targets with wrapping', () => {
  const body = rule('.inventory-tabs a');
  assert.match(body, /display:\s*inline-flex\s*;/);
  assert.match(body, /box-sizing:\s*border-box\s*;/);
  assert.match(body, /min-height:\s*44px\s*;/);
  assert.match(body, /padding:\s*\.5rem\s+\.9rem\s*;/);
  assert.match(body, /max-width:\s*100%\s*;/);
  assert.match(body, /overflow-wrap:\s*anywhere\s*;/);
});

test('inventory content keeps a visible keyboard focus', () => {
  const body = rule('.inventory :focus-visible');
  assert.match(body, /outline:\s*3px solid #215bbb\s*;/);
  assert.match(body, /outline-offset:\s*3px\s*;/);
});

test('skip destination stays the inventory main region', () => {
  assert.match(layout, /href="#main-content">Skip to inventory<\/a>/);
  assert.match(layout, /<main id="main-content" className="inventory"><InventoryNavigation \/>\{children\}<\/main>/);
});
