import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('website is a genuine isolated Next App Router app', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  assert.deepEqual(pkg.dependencies, { next: '16.4.3', react: '19.2.8', 'react-dom': '19.2.8' });
  const config = (await import(new URL('next.config.mjs', root))).default;
  assert.equal(config.basePath, '/uis/website');
  assert.equal(config.trailingSlash, true);
  assert.equal(config.agentRules, false);
  const page = await readFile(new URL('app/page.jsx', root), 'utf8');
  assert.doesNotMatch(page, /dangerouslySetInnerHTML|<iframe/);
});

const websiteURL = process.env.TRACKFLOW_WEBSITE_URL;
test('Next HTTP response preserves public content, anchors and stylesheet', { skip: !websiteURL }, async () => {
  const url = new URL(websiteURL);
  assert.equal(url.pathname, '/uis/website/');
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /\/uis\/website\/_next\//);
  assert.match(html, /<title>TrackFlow \| Logistics that keeps commerce moving<\/title>/);
  assert.match(html, /content="TrackFlow provides warehouse, delivery, and returns operations for e-commerce brands in the United States and Spain\."/);
  for (const tag of ['header', 'main', 'section', 'footer']) assert.match(html, new RegExp(`<${tag}[ >]`));
  assert.equal([...html.matchAll(/<article class="service-card"/g)].length, 3);
  for (const text of ['Warehouse operations', 'Last-mile delivery', 'Reverse logistics', 'Los Angeles', 'Zaragoza']) assert.ok(html.includes(text));
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${match[1]}"`), `Missing anchor ${match[1]}`);
  for (const id of ['main-content', 'hero-title', 'capabilities', 'capabilities-title', 'footprint', 'footprint-title', 'contact', 'contact-title']) assert.ok(html.includes(`id="${id}"`));
  assert.equal([...html.matchAll(/href="\/uis\/website\/"/g)].length, 2);
  assert.match(html, /href="mailto:hello@trackflow.example"/);
  assert.doesNotMatch(html, /<trackflow-|<service-card/);
  const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css(?:\?[^"]*)?)"[^>]*>/g)];
  assert.ok(styles.length > 0, 'Next must serve CSS');
  let css = '';
  for (const [, href] of styles) {
    const asset = await fetch(new URL(href.replaceAll('&amp;', '&'), url), { signal: AbortSignal.timeout(10000) });
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /text\/css/);
    css += await asset.text();
  }
  assert.match(css, /\.hero/);
  assert.match(css, /760px/);
  assert.match(css, /prefers-reduced-motion/);
  const missing = await fetch(new URL('/uis/website/not-a-page/', url), { signal: AbortSignal.timeout(10000) });
  assert.equal(missing.status, 404);
});
