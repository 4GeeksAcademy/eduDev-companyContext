import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createLegacyServer, files } from '../legacy-server.mjs';
import config from '../next.config.ts';

test('legacy server matches rewrites and serves only fixed assets on loopback', async () => {
  assert.deepEqual(files.map(file => `/uis/backoffice/${file}`).sort(),
    (await config.rewrites()).map(rule => rule.source).sort());
  const server = createLegacyServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const request = (path, method = 'GET') => new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body }));
    });
    req.on('error', reject);
    req.end();
  });
  try {
    for (const file of files) {
      const response = await request(`/uis/backoffice/${file}`);
      assert.equal(response.status, 200, file);
      assert.match(response.type, file.endsWith('.html') ? /text\/html/ : file.endsWith('.css') ? /text\/css/ : /text\/javascript/);
    }
    assert.equal((await request('/uis/backoffice/login.html', 'HEAD')).body, '');
    for (const path of ['/uis/backoffice/', '/uis/backoffice/missing.html', '/uis/backoffice/.env',
      '/uis/backoffice/next.config.ts', '/uis/backoffice/../website/index.html',
      '/uis/backoffice/%2e%2e/package.json', '/uis/backoffice/%6cogin.html']) {
      const response = await request(path);
      assert.equal(response.status, 404, path);
      assert.equal(response.body, 'Not found\n');
    }
    assert.equal((await request('/uis/backoffice/login.html', 'POST')).status, 405);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  await new Promise((resolve, reject) => {
    const probe = http.createServer();
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
});
