// Synthetic-only production browser baseline/after. Run from the repository root.
// node uis/backoffice/tests/profile-inventory.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { chromium } from '/home/lab/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs';

const origin = 'http://127.0.0.1:3397';
const port = 3397;
const viewportWidth = Number(process.env.TRACKFLOW_BROWSER_WIDTH ?? 1440);
assert.ok([390, 1440].includes(viewportWidth), 'TRACKFLOW_BROWSER_WIDTH must be 390 or 1440');
const products = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1, sku: `TF-${String(i + 1).padStart(5, '0')}`,
  name: `${['Jacket', 'Headphones', 'Moisturizer'][i % 3]} ${['Blue', 'Travel', 'Premium', 'Compact'][i % 4]} ${i + 1}`,
  category: ['fashion', 'electronics', 'cosmetics'][i % 3],
  client_name: `Brand ${i % 37}`, warehouse: i % 2 ? 'LA' : 'ZGZ', current_stock: 10 + i % 190,
}));
const order = { ...products[0], id: 'fixture-order', sku_id: 1, quantity: 2,
  order_type: 'inbound', reference: 'fixture receipt', created_at: '2026-01-02T12:00:00Z',
  user_uuid: '00000000-0000-4000-8000-000000000001' };
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const probe = net.createServer();
probe.listen(port, '127.0.0.1');
await once(probe, 'listening'); // EADDRINUSE fails without touching another process.
await new Promise(resolve => probe.close(resolve));
const server = spawn(process.execPath, ['uis/backoffice/node_modules/next/dist/bin/next',
  'start', 'uis/backoffice', '--hostname', '127.0.0.1', '--port', String(port)], {
  env: { PATH: process.env.PATH, HOME: process.env.HOME, NEXT_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', data => { logs += data; });
server.stderr.on('data', data => { logs += data; });
let browser;
const results = [];
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Server readiness timeout: ${logs}`)), 10000);
    server.stdout.on('data', () => { if (logs.includes('Ready')) { clearTimeout(timer); resolve(); } });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${logs}`)); });
  });
  browser = await chromium.launch({
    executablePath: '/home/lab/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    chromiumSandbox: false, headless: true,
  });
  for (const [route, count] of [['orders', 6], ['orders/inbound', 6], ['orders/inbound', 1000], ['orders/outbound', 1000]]) {
    const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: viewportWidth, height: 900 } });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(7000);
      const errors = [], blocked = [], chunks = [], posts = [], bodies = [];
      let releaseAuth, authSeen;
      const authStarted = new Promise(resolve => { authSeen = resolve; });
      const authGate = new Promise(resolve => { releaseAuth = resolve; });
      let validated = false;
      let inventoryRequests = 0;
      await context.addInitScript(() => {
        localStorage.setItem('trackflow.auth.token', 'synthetic-fixture-only');
        window.TRACKFLOW_API_BASE_URL = `${location.origin}/fixture-api`;
      });
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        if (!response.url().includes('/_next/') || !response.url().includes('.js')) return;
        const phase = validated ? 'after-validation' : 'before-validation';
        bodies.push(response.text().then(text => chunks.push({
          url: new URL(response.url()).pathname, phase, bytes: Buffer.byteLength(text),
          form: text.includes('Goods receipt reference'), history: text.includes('All inventory movements'),
        })));
      });
      await context.route('**/*', async request => {
        const url = new URL(request.request().url());
        if (url.origin !== origin) { blocked.push(url.origin); return request.abort(); }
        if (url.pathname === '/fixture-api/auth/me') {
          authSeen(); await authGate;
          return request.fulfill({ json: { id: 1, role: 'operator' } });
        }
        if (url.pathname.startsWith('/fixture-api/inventory/')) {
          inventoryRequests++;
          if (request.request().method() === 'POST') {
            posts.push(request.request().postDataJSON());
            return request.fulfill({ status: 201, json: order });
          }
          if (url.pathname.endsWith('/products')) return request.fulfill({ json: products.slice(0, count) });
          if (url.pathname.endsWith('/products/1')) return request.fulfill({ json: products[0] });
          if (url.pathname.endsWith('/orders')) return request.fulfill({ json: [order] });
          blocked.push(url.pathname); return request.abort();
        }
        if (request.request().method() === 'GET' &&
            (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/backoffice/inventory/') ||
             url.pathname === '/uis/backoffice/api-config.js')) return request.continue();
        if (url.pathname === '/favicon.ico') return request.fulfill({ status: 204 });
        blocked.push(url.pathname); return request.abort();
      });
      const response = await page.goto(`${origin}/backoffice/inventory/${route}?apiPort=8001&sku_id=1`, { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200);
      await authStarted;
      await page.getByText('Validating your session…').waitFor();
      await page.waitForTimeout(300); // Deliberately held validation window, identical before/after.
      assert.equal(await page.locator('#inventory-sku, table').count(), 0);
      assert.equal(inventoryRequests, 0);
      validated = true; releaseAuth();
      const measurement = { route, count, status: response.status() };
      if (route === 'orders') {
        await page.getByRole('table').waitFor();
        measurement.text = await page.getByRole('table').innerText();
      } else {
        await page.locator('#inventory-quantity:enabled').waitFor();
        assert.equal(await page.locator('#inventory-sku').inputValue(), '1');
        assert.equal(await page.locator('#inventory-sku option').count(), count + 1);
        const field = page.locator(route.endsWith('inbound') ? '#inventory-reference' : '#inventory-tracking');
        const cdp = await context.newCDPSession(page);
        await cdp.send('Performance.enable');
        const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
        const before = await metrics();
        const frames = [];
        for (let i = 0; i < 30; i++) {
          const start = performance.now();
          await field.fill(`fixture-${i}`);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve())));
          frames.push(performance.now() - start);
        }
        const after = await metrics();
        measurement.typing = { edits: 30, medianFillAndFrameMs: median(frames),
          scriptDurationMs: (after.ScriptDuration - before.ScriptDuration) * 1000,
          taskDurationMs: (after.TaskDuration - before.TaskDuration) * 1000 };
        await page.locator('#inventory-quantity').fill('2');
        await page.getByRole('button', { name: /Record stock/ }).click();
        await page.getByText(/recorded successfully/).waitFor();
        assert.equal(await page.locator('#inventory-sku').inputValue(), '');
        assert.equal(await field.inputValue(), '');
        assert.equal(posts.length, 1);
        measurement.posts = posts;
        measurement.options = await page.locator('#inventory-sku').textContent();
      }
      await Promise.all(bodies);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page must not overflow viewport');
      assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
      measurement.chunks = chunks;
      results.push(measurement);
    } finally { await context.close(); }
  }
  console.log(JSON.stringify({ viewportWidth, fixture: 'synthetic, no real auth/API; unthrottled local Chromium; 30 sequential fills + rAF, not production INP', results }, null, 2));
} finally {
  await browser?.close();
  if (server.exitCode === null) {
    const stopped = once(server, 'exit');
    server.kill('SIGTERM');
    const timer = setTimeout(() => server.kill('SIGKILL'), 3000);
    await stopped; clearTimeout(timer);
  }
}
