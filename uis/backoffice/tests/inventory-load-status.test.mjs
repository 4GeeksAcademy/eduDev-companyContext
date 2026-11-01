import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = name => readFileSync(new URL(`../components/${name}.tsx`, import.meta.url), 'utf8');

// Structural regression only; rendered states and Retry are checked in the browser.
test('status markup keeps error precedence, Retry callback, loading label and null success', () => {
  const status = source('inventory-load-status');
  assert.match(status, /if \(error\) return <p role="alert">\{error\} <button onClick=\{onRetry\}>Retry<\/button><\/p>;/);
  assert.match(status, /if \(loading\) return <p role="status">\{loadingLabel\}<\/p>;/);
  assert.ok(status.indexOf('if (error)') < status.indexOf('if (loading)'));
  assert.match(status, /return null;/);
  assert.doesNotMatch(status, /useEffect|useState|<div/);
});

test('both consumers share status markup but keep local guarded content and abortable retry effects', () => {
  for (const [name, data, label] of [['products', 'products', 'Loading SKUs…'], ['history', 'orders', 'Loading movements…']]) {
    const component = source(`inventory-${name}`);
    assert.ok(component.includes(`loading={${data} === null} loadingLabel="${label}"`));
    assert.ok(component.includes(`!error && ${data} !== null && (`));
    assert.match(component, /onRetry=\{\(\) => setAttempt\(x => x \+ 1\)\}/);
    assert.match(component, /return \(\) => controller\.abort\(\);\n  }, \[attempt\]\);/);
    assert.equal(component.match(/if \(!controller.signal.aborted\)/g)?.length, 2);
    assert.doesNotMatch(component, /role="alert"|role="status"/);
  }
});
