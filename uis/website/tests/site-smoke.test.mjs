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

// Deliberately limited to this stylesheet's flat rules and solid color values.
const css = await readFile(new URL('styles.css', root), 'utf8');
function declaration(selector, property) {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const rule = rules.find(([, selectors, body]) => selectors.split(',').some((value) => value.trim() === selector)
    && body.split(';').some((item) => item.trim().startsWith(`${property}:`)));
  assert.ok(rule, `Missing CSS rule: ${selector}`);
  const value = rule[2].split(';').map((item) => item.trim())
    .find((item) => item.startsWith(`${property}:`))?.slice(property.length + 1).trim();
  assert.ok(value, `Missing ${selector} ${property}`);
  return value;
}

function color(value) {
  const variable = /^var\((--[\w-]+)\)$/.exec(value);
  if (variable) return color(declaration(':root', variable[1]));
  if (value === 'white') return [255, 255, 255];
  assert.match(value, /^#(?:[\da-f]{3}|[\da-f]{6})$/i);
  const hex = value.length === 4 ? [...value.slice(1)].map((digit) => digit.repeat(2)).join('') : value.slice(1);
  return hex.match(/../g).map((channel) => parseInt(channel, 16));
}

function luminance(rgb) {
  const linear = rgb.map((channel) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const paper = color(declaration('body', 'background'));
const header = declaration('.site-header', 'background').match(/^rgba\(([^)]+)\)$/);
assert.ok(header, 'Header uses a translucent solid color over paper');
const [r, g, b, alpha] = header[1].split(',').map(Number);
const headerBackground = [r, g, b].map((channel, i) => channel * alpha + paper[i] * (1 - alpha));
const contrastCases = [
  ['hero eyebrow', '.eyebrow', paper],
  ['capabilities eyebrow', '.eyebrow', color(declaration('.capabilities', 'background'))],
  ['contact eyebrow', '.eyebrow', color(declaration('.cta', 'background'))],
  ['service number', '.service-number', color(declaration('.capabilities', 'background'))],
  ['footprint eyebrow override', '.eyebrow-light', color(declaration('.footprint', 'background'))],
  ...[':hover', ':focus-visible'].flatMap((state) => [
    [`navigation ${state}`, `nav a${state}`, headerBackground],
    [`text link ${state}`, `.text-link${state}`, paper],
  ]),
  ...['', ':hover', ':focus-visible'].map((state) => [
    `white CTA ${state || 'default'}`, '.button-primary', color(declaration(`.button-primary${state}`, 'background')),
  ]),
];
for (const [name, selector, background] of contrastCases) {
  test(`contrast: ${name} meets 4.5:1`, (t) => {
    const ratio = contrast(color(declaration(selector, 'color')), background);
    t.diagnostic(`${name}: ${ratio.toFixed(3)}:1`);
    assert.ok(ratio >= 4.5, `${name}: ${ratio.toFixed(3)}:1 is below 4.5:1`);
  });
}

test('contrast calculation handles equal colors and black/white extremes', () => {
  assert.equal(contrast([0, 0, 0], [0, 0, 0]), 1);
  assert.equal(contrast([255, 255, 255], [0, 0, 0]), 21);
  assert.equal(contrast([0, 0, 0], [255, 255, 255]), 21);
});

test('static and Next explicitly share a small SVG favicon', async () => {
  const svg = await readFile(new URL('public/favicon.svg', root), 'utf8');
  assert.match(svg, /<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /viewBox="0 0 32 32"/);
  assert.ok(Buffer.byteLength(svg) < 1024);
  assert.doesNotMatch(svg, /<script|<foreignObject|href=/i);
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="public\/favicon\.svg"\s*\/>/);
  const layout = await readFile(new URL('app/layout.jsx', root), 'utf8');
  assert.match(layout, /icons:\s*\{\s*icon:\s*\{\s*url: '\/uis\/website\/favicon\.svg',\s*type: 'image\/svg\+xml'/);
});

const websiteURL = process.env.TRACKFLOW_WEBSITE_URL;
test('Next HTTP response preserves public content, anchors and stylesheet', { skip: !websiteURL }, async () => {
  const url = new URL(websiteURL);
  assert.equal(url.pathname, '/uis/website/');
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, 200);
  const html = await response.text();
  const icon = html.match(/<link\b[^>]*rel="icon"[^>]*>/);
  assert.ok(icon, 'Rendered head declares favicon');
  assert.match(icon[0], /type="image\/svg\+xml"/);
  const iconHref = icon[0].match(/href="([^"]+)"/)[1];
  assert.equal(iconHref, '/uis/website/favicon.svg');
  const favicon = await fetch(new URL(iconHref, url), { signal: AbortSignal.timeout(10000) });
  assert.equal(favicon.status, 200);
  assert.match(favicon.headers.get('content-type'), /image\/svg\+xml/);
  assert.equal(await favicon.text(), await readFile(new URL('public/favicon.svg', root), 'utf8'));
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
