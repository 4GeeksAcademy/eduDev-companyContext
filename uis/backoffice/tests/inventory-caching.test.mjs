import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Execute the actual TSX with deterministic hook/module boundaries, no DOM emulator.
function load(path, modules) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  const exports = {};
  new Function('require', 'exports', js)(name => name in modules ? modules[name] : require(name), exports);
  return exports;
}

test('both lazy modules stay unexecuted until their boundary renders', async () => {
  const imports = [];
  const modules = {
    react: React,
  };
  for (const name of ['inventory-history', 'inventory-order-form']) {
    Object.defineProperty(modules, `./${name}`, { get() {
      imports.push(name);
      return { default: () => React.createElement('p', null, name), __esModule: true };
    } });
  }
  const wrappers = load('../components/inventory-lazy.tsx', modules);
  assert.deepEqual(imports, []);
  const history = React.createElement(wrappers.LazyInventoryHistory);
  const form = React.createElement(wrappers.LazyInventoryOrderForm, { direction: 'inbound' });
  assert.deepEqual(imports, []);
  assert.match(renderToStaticMarkup(history), /Loading movements…/);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(imports, ['inventory-history']);
  assert.match(renderToStaticMarkup(history), /inventory-history/);
  assert.match(renderToStaticMarkup(form), /Loading SKUs…/);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(imports, ['inventory-history', 'inventory-order-form']);
  assert.match(renderToStaticMarkup(form), /inventory-order-form/);
});

test('option elements reuse unchanged products and refresh changed products without altering form output', () => {
  let states = [], cursor = 0, memoCursor = 0;
  const memos = [];
  const hooks = {
    ...React, useEffect() {}, useRef: () => ({ current: null }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useMemo(fn, deps) {
      const index = memoCursor++;
      if (!memos[index] || !deps.every((dep, i) => Object.is(dep, memos[index].deps[i]))) {
        memos[index] = { deps, value: fn() };
      }
      return memos[index].value;
    },
  };
  const { default: Form } = load('../components/inventory-order-form.tsx', {
    react: hooks, 'next/navigation': { useSearchParams: () => new URLSearchParams('sku_id=1') },
    '../lib/inventory': {}, '../lib/inventory-form': { stockWarning: () => '' },
  });
  function render(direction = 'inbound') { cursor = 0; memoCursor = 0; return Form({ direction }); }
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const match = find(child, predicate); if (match) return match;
    }
    return null;
  }
  assert.match(renderToStaticMarkup(render()), /Loading SKUs…/);
  const product = { id: 1, name: 'Travel headphones', sku: 'TF-1', warehouse: 'ZGZ', current_stock: 15 };
  states[0] = [product];
  const first = render();
  const select = node => find(node, child => child.props?.id === 'inventory-sku');
  const options = node => select(node).props.children[1];
  const initial = options(first);
  assert.equal(select(first).props.value, '1');
  const markup = renderToStaticMarkup(first);
  assert.match(markup, /Travel headphones — TF-1 — ZGZ/);
  assert.match(markup, /Goods receipt reference/);
  find(first, child => child.props?.id === 'inventory-reference').props.onChange({ target: { value: 'receipt' } });
  const typed = render();
  assert.strictEqual(options(typed), initial);
  assert.equal(find(typed, child => child.props?.id === 'inventory-reference').props.value, 'receipt');
  find(typed, child => child.props?.id === 'inventory-quantity').props.onChange({ target: { value: '2' } });
  assert.strictEqual(options(render()), initial);
  states[0] = [{ ...product, name: 'Updated headphones' }];
  const updated = render();
  assert.notStrictEqual(options(updated), initial);
  assert.match(renderToStaticMarkup(updated), /Updated headphones — TF-1 — ZGZ/);
  assert.doesNotMatch(renderToStaticMarkup(updated), /Travel headphones/);
  assert.match(renderToStaticMarkup(render('outbound')), /Tracking number/);
  states[0] = [];
  assert.match(renderToStaticMarkup(render()), /No SKUs available/);
  states[0] = null;
  assert.match(renderToStaticMarkup(render()), /Loading SKUs…/);
});
