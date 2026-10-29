import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const settings = {
  TRACKFLOW_UI_IMAGE: 'trackflow-ui:synthetic', TRACKFLOW_API_IMAGE: 'trackflow-api:synthetic',
  COMPOSE_PROJECT_NAME: 'trackflow-contract', TRACKFLOW_BIND_ADDRESS: '127.0.0.1',
  WEBSITE_HOST_PORT: '3000', BACKOFFICE_HOST_PORT: '3001', API_HOST_PORT: '8000',
  TRACKFLOW_API_PROXY: '1', TRACKFLOW_API_ORIGIN: 'http://api:8000',
  BACKOFFICE_LEGACY_PORT: '3002', JWT_SECRET_KEY: 'synthetic-test-only-secret',
  DATABASE_URL: '', ACCESS_TOKEN_EXPIRE_MINUTES: '30', PASSWORD_RESET_EXPIRE_MINUTES: '30',
  RESEND_API_KEY: '', RESEND_FROM_EMAIL: '', FRONTEND_PUBLIC_URL: 'http://localhost:3001',
  TRACKFLOW_CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001',
  TRACKFLOW_USERS_DB_PATH: '/app/data/users.json',
  TRACKFLOW_SUPPLIERS_DB_PATH: '/app/data/suppliers.json',
  TRACKFLOW_INCIDENTS_DB_PATH: '/app/data/incidents.json',
};
function config(overrides = {}, file = 'docker-compose.yml') {
  // No ambient application secrets, Compose overrides or automatic dotenv reads.
  const env = Object.fromEntries(['PATH', 'HOME'].filter(key => process.env[key])
    .map(key => [key, process.env[key]]));
  Object.assign(env, settings, overrides, { COMPOSE_DISABLE_ENV_FILE: '1' });
  return spawnSync('docker', ['compose', '--env-file', '/dev/null', '--project-name',
    `trackflow-contract-${process.pid}`, '-f', resolve(file),
    'config', '--format', 'json'], { env, encoding: 'utf8' });
}
function rendered() {
  const result = config();
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
test('Compose defines isolated two-service development topology', () => {
  const c = rendered();
  assert.deepEqual(Object.keys(c.services).sort(), ['api', 'ui']);
  const { api, ui } = c.services;
  assert.equal(ui.build.context, resolve('uis'));
  assert.equal(api.build.context, resolve('services'));
  assert.deepEqual(api.build.additional_contexts, {
    shared: resolve('shared'), packages_shared: resolve('packages/shared'),
  });
  assert.deepEqual(Object.keys(c.networks), ['trackflow']);
  assert.equal(c.networks.trackflow.name, `trackflow-contract-${process.pid}_network`);
  for (const service of [ui, api]) {
    assert.deepEqual(Object.keys(service.networks), ['trackflow']);
    assert.equal(service.container_name, undefined);
    assert.equal(service.env_file, undefined);
  }
  assert.deepEqual(ui.ports.map(p => [p.host_ip, p.published, p.target]),
    [['127.0.0.1', '3000', 3000], ['127.0.0.1', '3001', 3001]]);
  assert.deepEqual(api.ports.map(p => [p.host_ip, p.published, p.target]),
    [['127.0.0.1', '8000', 8000]]);
  for (const [service, source, target] of [
    [api, 'services', '/app/services'],
    [api, 'shared', '/app/shared'], [api, 'packages/shared', '/app/packages/shared'],
  ]) assert.ok(service.volumes.some(v => v.type === 'bind' && v.source === resolve(source) && v.target === target));
  // Exact bind allowlist excludes the repository, whole uis tree and tracker.
  assert.deepEqual(ui.volumes.filter(v => v.type === 'bind')
    .map(v => [v.source, v.target, Boolean(v.read_only)])
    .sort((a, b) => a[1].localeCompare(b[1])), [
      [resolve('uis/backoffice'), '/app/uis/backoffice', false],
      [resolve('uis/start.sh'), '/app/uis/start.sh', true],
      [resolve('uis/website'), '/app/uis/website', false],
    ]);
  const caches = ['website/node_modules', 'website/.next', 'backoffice/node_modules', 'backoffice/.next'];
  const uiVolumes = ui.volumes.filter(v => v.type === 'volume');
  assert.deepEqual(uiVolumes.map(v => v.target).sort(), caches.map(p => `/app/uis/${p}`).sort());
  assert.equal(new Set(uiVolumes.map(v => v.source)).size, 4);
  assert.ok(api.volumes.some(v => v.type === 'volume' && v.target === '/app/data'));
  assert.ok(api.volumes.some(v => v.type === 'tmpfs' && v.target === '/app/services/api/data'));
  assert.equal(Object.keys(c.volumes).length, 5);
  for (const volume of Object.values(c.volumes)) {
    assert.ok(volume.name.startsWith(`trackflow-contract-${process.pid}_`));
    assert.ok(!volume.external);
  }
});
test('environment is allowlisted and TinyDB paths target isolated storage', () => {
  const { services: { api, ui } } = rendered();
  assert.deepEqual(ui.environment, { BACKOFFICE_LEGACY_PORT: '3002',
    TRACKFLOW_API_PROXY: '1', TRACKFLOW_API_ORIGIN: 'http://api:8000' });
  const apiKeys = Object.keys(settings).filter(k => !['COMPOSE_PROJECT_NAME', 'TRACKFLOW_BIND_ADDRESS',
    'TRACKFLOW_UI_IMAGE', 'TRACKFLOW_API_IMAGE', 'WEBSITE_HOST_PORT', 'BACKOFFICE_HOST_PORT', 'API_HOST_PORT', 'BACKOFFICE_LEGACY_PORT', 'TRACKFLOW_API_PROXY', 'TRACKFLOW_API_ORIGIN'].includes(k));
  assert.deepEqual(Object.keys(api.environment).sort(), apiKeys.sort());
  for (const key of apiKeys) assert.equal(api.environment[key], settings[key]);
  assert.equal(ui.environment.NEXT_PUBLIC_INVENTORY_API_URL, undefined);
});
test('host publishing and API settings honor synthetic overrides', () => {
  const result = config({ TRACKFLOW_BIND_ADDRESS: '0.0.0.0', API_HOST_PORT: '18000',
    WEBSITE_HOST_PORT: '13000', BACKOFFICE_HOST_PORT: '13001',
    ACCESS_TOKEN_EXPIRE_MINUTES: '45', FRONTEND_PUBLIC_URL: '' });
  assert.equal(result.status, 0, result.stderr);
  const { services: { api, ui } } = JSON.parse(result.stdout);
  assert.equal(api.ports[0].published, '18000');
  assert.equal(api.ports[0].target, 8000);
  assert.equal(api.ports[0].host_ip, '0.0.0.0');
  assert.deepEqual(ui.ports.map(p => p.published), ['13000', '13001']);
  assert.equal(api.environment.ACCESS_TOKEN_EXPIRE_MINUTES, '45');
  assert.equal(api.environment.FRONTEND_PUBLIC_URL, '');
});
test('missing proxy settings fail with actionable setup guidance', () => {
  for (const key of ['TRACKFLOW_API_PROXY', 'TRACKFLOW_API_ORIGIN']) {
    const result = config({ [key]: '' });
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(key));
  }
});
test('empty signing secret fails with actionable setup guidance', () => {
  const result = config({ JWT_SECRET_KEY: '' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET_KEY/);
});
test('production is image-only, internal, persistent and single-worker', () => {
  const result = config({}, 'docker-compose.production.yml');
  assert.equal(result.status, 0, result.stderr);
  const c = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(c.services).sort(), ['api', 'ui']);
  const { ui, api } = c.services;
  assert.equal(ui.image, settings.TRACKFLOW_UI_IMAGE);
  assert.equal(api.image, settings.TRACKFLOW_API_IMAGE);
  const development = rendered();
  assert.deepEqual(Object.keys(api.environment).sort(), Object.keys(development.services.api.environment).sort());
  assert.equal(api.environment.JWT_SECRET_KEY, settings.JWT_SECRET_KEY);
  assert.deepEqual(Object.keys(c.volumes), ['production_api_data']);
  assert.equal(c.networks.trackflow.name, `trackflow-contract-${process.pid}_network`);
  assert.equal(ui.volumes, undefined);
  assert.equal(api.ports, undefined);
  assert.deepEqual(api.command, ['uvicorn', 'services.api.main:app', '--host', '0.0.0.0', '--port', '8000', '--workers', '1']);
  assert.deepEqual(api.volumes.map(v => [v.type, v.source, v.target]), [['volume', 'production_api_data', '/app/data']]);
  assert.deepEqual(ui.environment, { TRACKFLOW_UI_MODE: 'production', BACKOFFICE_LEGACY_PORT: '3002', TRACKFLOW_API_PROXY: '1', TRACKFLOW_API_ORIGIN: 'http://api:8000' });
  for (const service of [ui, api]) {
    assert.equal(service.build, undefined);
    assert.equal(service.env_file, undefined);
    assert.equal(service.restart, 'unless-stopped');
    assert.deepEqual(Object.keys(service.networks), ['trackflow']);
    assert.equal(service.logging.options['max-file'], '3');
  }
  assert.deepEqual(ui.ports.map(p => [p.host_ip, p.published, p.target]), [['127.0.0.1', '3000', 3000], ['127.0.0.1', '3001', 3001]]);
  for (const key of ['USERS', 'SUPPLIERS', 'INCIDENTS']) assert.equal(api.environment[`TRACKFLOW_${key}_DB_PATH`], `/app/data/${key.toLowerCase()}.json`);
  const missing = config({ JWT_SECRET_KEY: '' }, 'docker-compose.production.yml');
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /JWT_SECRET_KEY/);
  for (const key of ['TRACKFLOW_UI_IMAGE', 'TRACKFLOW_API_IMAGE']) {
    assert.notEqual(config({ [key]: '' }, 'docker-compose.production.yml').status, 0);
  }
  const changed = config({ WEBSITE_HOST_PORT: '13300', BACKOFFICE_HOST_PORT: '13301' }, 'docker-compose.production.yml');
  assert.equal(changed.status, 0, changed.stderr);
  assert.deepEqual(JSON.parse(changed.stdout).services.ui.ports.map(p => p.published), ['13300', '13301']);
});
test('UI image defaults to dev and builds sequentially with only public proxy args', () => {
  const image = readFileSync('uis/Dockerfile', 'utf8');
  assert.match(image, /FROM node:24-alpine/);
  assert.match(image, /ARG TRACKFLOW_UI_MODE=development/);
  assert.match(image, /npm ci --include=dev/g);
  assert.match(image, /npm run build &&.*backoffice.*npm run build/s);
  assert.match(image, /ARG TRACKFLOW_API_PROXY=0/);
  assert.match(image, /ARG TRACKFLOW_API_ORIGIN=/);
  assert.doesNotMatch(image, /JWT_SECRET_KEY|DATABASE_URL|RESEND/);
  assert.match(image, /CMD \["sh", "\/app\/uis\/start.sh"\]/);
});
test('API image uses uv virtualenv, exact source copies and single reload process', () => {
  const image = readFileSync('services/Dockerfile', 'utf8');
  assert.match(image, /FROM python:3\.11-slim/);
  assert.match(image, /WORKDIR \/app/);
  assert.match(image, /uv venv \/opt\/venv/);
  assert.match(image, /uv pip install.*-r requirements\.txt/);
  assert.match(image, /COPY api\/requirements\.txt .*requirements\.txt/);
  assert.match(image, /COPY \. \/app\/services/);
  assert.match(image, /COPY --from=shared __init__\.py incident_analysis\.py \/app\/shared\//);
  assert.match(image, /COPY --from=packages_shared incidents\.py incident_validation\.py \/app\/packages\/shared\//);
  const cmd = JSON.parse(image.match(/^CMD (.+)$/m)[1]);
  assert.deepEqual(cmd, ['uvicorn', 'services.api.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload']);
  const ignore = readFileSync('services/.dockerignore', 'utf8');
  for (const pattern of ['**/__pycache__', '**/*.pyc', '**/.env*', '**/tests', '**/*.log', '**/*.json', '**/*.db', '**/*.sqlite*', 'api/data/']) {
    assert.ok(ignore.split('\n').includes(pattern), pattern);
  }
});
