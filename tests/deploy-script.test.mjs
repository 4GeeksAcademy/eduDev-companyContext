import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve('infra/deploy/deploy.sh');

// Fake docker/curl keep all state in files: the script runs Compose under `env -i`.
const dockerStub = state => `#!/usr/bin/env bash
S=${JSON.stringify(state)}
printf '%s\\n' "$*" >> "$S/calls.log"
pinned() { [[ $1 == ui ]] && echo trackflow-ui:talent-044fde0 || echo trackflow-api:pinned; }
released() {
  [[ -f $2 ]] || return 0
  awk -v svc="  $1:" '$0 == svc { hit = 1; next } hit && /image:/ { print $2; exit } /^  [a-z]/ { hit = 0 }' "$2"
}
if [[ $1 == compose ]]; then
  shift; rel=""; args=("$@")
  for ((i = 0; i < \${#args[@]}; i++)); do
    case \${args[i]} in
      -f) [[ \${args[i+1]} == *release.override.yml ]] && rel=\${args[i+1]}; ((i++)) ;;
      --project-directory|--project-name|--env-file) ((i++)) ;;
      *) sub=\${args[i]}; rest=("\${args[@]:i+1}"); break ;;
    esac
  done
  svc=""; [[ \${#rest[@]} -gt 0 ]] && svc=\${rest[-1]}
  case $sub in
    config) [[ ! -f $S/config-fails ]] ;;
    up) img=$(released "$svc" "$rel"); echo "\${img:-$(pinned "$svc")}" > "$S/run-$svc"
        printf 'up %s %s\\n' "$svc" "$(cat "$S/run-$svc")" >> "$S/events.log" ;;
    ps) [[ \${rest[0]:-} == -q ]] && echo "cid-$svc" || echo listing ;;
  esac
  exit
fi
case "$1 $2" in
  "ps -a") cat "$S/projects" ;;
  "image inspect") grep -qxF "$3" <(cut -f2 "$S/images") ;;
  "image ls") grep -F "	$3:" "$S/images" | sed "s|^.*	$3:||" ;;
  "image rm") grep -vF "	$3" "$S/images" > "$S/images.new"; mv "$S/images.new" "$S/images"
              echo "rm $3" >> "$S/events.log" ;;
  "load "*) cat > /dev/null; img=$(cat "$S/load-image")
            [[ -n $img ]] && printf '2026-11-09 12:00:00 +0000 UTC\\t%s\\n' "$img" >> "$S/images"
            echo "Loaded image: \${img:-sha256:abc}" ;;
  "inspect -f") svc=\${4#cid-}; echo "true false 0 $(cat "$S/run-$svc" 2>/dev/null)" ;;
  *) echo "unexpected docker $*" >&2; exit 99 ;;
esac
`;
const curlStub = state => `#!/usr/bin/env bash
S=${JSON.stringify(state)}
url=\${*: -1}
for svc in ui api; do
  [[ -f $S/bad-image && -f $S/run-$svc && $(cat "$S/run-$svc") == $(cat "$S/bad-image") ]] && { printf 502; exit 0; }
done
[[ $url == */api/auth/me ]] && printf 401 || printf 200
`;

function setup({ images = [], release = {}, projects = 'trackflow-production' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'trackflow-deploy-'));
  const dir = join(root, 'opt'), bin = join(root, 'bin'), state = join(root, 'state');
  for (const path of [dir, bin, state]) mkdirSync(path);
  for (const file of ['docker-compose.production.yml', 'resources.override.yml', 'https.override.yml', 'deployment.env']) {
    writeFileSync(join(dir, file), '');
  }
  if (Object.keys(release).length) {
    mkdirSync(join(dir, 'release'));
    for (const [svc, tag] of Object.entries(release)) writeFileSync(join(dir, 'release', svc), `${tag}\n`);
    writeFileSync(join(dir, 'release.override.yml'), releaseYaml(release.ui, release.api));
  }
  writeFileSync(join(state, 'images'), images.map(([created, image]) => `${created}\t${image}\n`).join(''));
  writeFileSync(join(state, 'projects'), `${projects}\n`);
  writeFileSync(join(state, 'load-image'), '');
  for (const [name, body] of [['docker', dockerStub(state)], ['curl', curlStub(state)]]) {
    writeFileSync(join(bin, name), body);
    chmodSync(join(bin, name), 0o755);
  }
  const read = name => existsSync(join(state, name)) ? readFileSync(join(state, name), 'utf8') : '';
  return {
    dir, state,
    calls: () => read('calls.log'),
    events: () => read('events.log').trim().split('\n').filter(Boolean),
    images: () => read('images').trim().split('\n').filter(Boolean).map(line => line.split('\t')[1]),
    releaseFile: () => existsSync(join(dir, 'release.override.yml')) ? readFileSync(join(dir, 'release.override.yml'), 'utf8') : null,
    tag: svc => existsSync(join(dir, 'release', svc)) ? readFileSync(join(dir, 'release', svc), 'utf8').trim() : null,
    run(args, { input = '', sshCommand } = {}) {
      const env = {
        PATH: `${bin}:/usr/bin:/bin`, TRACKFLOW_DEPLOY_DIR: dir, TRACKFLOW_DEPLOY_PATH: `${bin}:/usr/bin:/bin`,
        TRACKFLOW_HEALTH_ATTEMPTS: '2', TRACKFLOW_HEALTH_INTERVAL: '0',
      };
      if (sshCommand !== undefined) env.SSH_ORIGINAL_COMMAND = sshCommand;
      return spawnSync('bash', [script, ...args], { env, input, encoding: 'utf8' });
    },
  };
}

const releaseYaml = (ui, api) => ['services:', ...(ui ? ['  ui:', `    image: trackflow-ui:${ui}`] : []),
  ...(api ? ['  api:', `    image: trackflow-api:${api}`] : [])].join('\n') + '\n';

test('rejects unknown commands, services, tags and extra arguments without touching Docker', () => {
  for (const args of [[], ['shell'], ['deploy', 'web', 'gh-abc1234'], ['deploy', 'ui', 'latest'],
    ['deploy', 'ui', 'gh-abc1234;id'], ['deploy', 'ui', 'gh-ABC1234'], ['load', 'ui'], ['status', 'extra'],
    ['deploy', 'ui', 'gh-abc1234', 'extra']]) {
    const env = setup({ images: [['2026-11-09 10:00:00 +0000 UTC', 'trackflow-ui:gh-abc1234']] });
    const result = env.run(args);
    assert.equal(result.status, 2, `${args.join(' ')}: ${result.stderr}`);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^usage: deploy\.sh status \| load <ui\|api> <gh-sha> \| deploy <ui\|api> <gh-sha>$/m);
    assert.equal(env.calls(), '');
    assert.equal(env.releaseFile(), null);
  }
});

test('forced SSH command is parsed from SSH_ORIGINAL_COMMAND, not from shell syntax', () => {
  const env = setup();
  const rejected = env.run([], { sshCommand: 'status; rm -rf /' });
  assert.equal(rejected.status, 2);
  assert.equal(env.calls(), '');
  const accepted = env.run([], { sshCommand: 'status' });
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.match(accepted.stdout, /^project: trackflow-production$/m);
});

test('status reports project and release tags without recreating anything', () => {
  const env = setup({ release: { api: 'gh-def5678' } });
  const result = env.run(['status']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^project: trackflow-production$/m);
  assert.match(result.stdout, /^ui: pre-pipeline pin$/m);
  assert.match(result.stdout, /^api: gh-def5678$/m);
  assert.match(env.calls(), / config --quiet$/m);
  assert.doesNotMatch(env.calls(), / up /);
});

test('refuses to guess when the deploy directory does not own exactly one Compose project', () => {
  for (const projects of ['', 'trackflow-production\nother']) {
    const env = setup({ projects });
    const result = env.run(['status']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /error: expected exactly one Compose project in /);
    assert.doesNotMatch(env.calls(), /^compose /m);
  }
});

test('load accepts only a stream that contains the announced image', () => {
  const env = setup();
  writeFileSync(join(env.state, 'load-image'), 'trackflow-ui:gh-abc1234');
  const ok = env.run(['load', 'ui', 'gh-abc1234'], { input: 'image-bytes' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.deepEqual(env.images(), ['trackflow-ui:gh-abc1234']);

  writeFileSync(join(env.state, 'load-image'), 'trackflow-ui:something-else');
  const wrong = env.run(['load', 'ui', 'gh-0000000'], { input: 'image-bytes' });
  assert.equal(wrong.status, 1);
  assert.match(wrong.stderr, /error: stream did not load trackflow-ui:gh-0000000/);
});

test('deploy refuses an image that was not loaded and changes nothing', () => {
  const env = setup({ release: { ui: 'gh-1111111' } });
  const result = env.run(['deploy', 'ui', 'gh-abc1234']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /error: trackflow-ui:gh-abc1234 is not loaded; run load first/);
  assert.doesNotMatch(env.calls(), /^compose /m);
  assert.equal(env.tag('ui'), 'gh-1111111');
});

test('deploy pins only the chosen service and recreates only that service with every Compose file', () => {
  const env = setup({
    release: { api: 'gh-def5678' },
    images: [['2026-11-09 10:00:00 +0000 UTC', 'trackflow-ui:gh-abc1234'], ['2026-11-01 10:00:00 +0000 UTC', 'trackflow-api:gh-def5678']],
  });
  const result = env.run(['deploy', 'ui', 'gh-abc1234']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /ui now runs trackflow-ui:gh-abc1234/);
  assert.equal(env.tag('ui'), 'gh-abc1234');
  assert.equal(env.tag('api'), 'gh-def5678');
  assert.equal(env.releaseFile(), releaseYaml('gh-abc1234', 'gh-def5678'));
  assert.deepEqual(env.events(), ['up ui trackflow-ui:gh-abc1234']);
  const up = env.calls().split('\n').find(line => / up /.test(line));
  const files = ['docker-compose.production.yml', 'resources.override.yml', 'https.override.yml', 'release.override.yml'];
  assert.equal(up, `compose --project-directory ${env.dir} --project-name trackflow-production --env-file ${env.dir}/deployment.env `
    + files.map(file => `-f ${env.dir}/${file}`).join(' ') + ' up -d --no-deps --no-build --pull never --force-recreate ui');
});

test('unhealthy deploy rolls back to the previous pipeline tag and fails', () => {
  const env = setup({
    release: { ui: 'gh-1111111' },
    images: [['2026-11-09 10:00:00 +0000 UTC', 'trackflow-ui:gh-abc1234'], ['2026-11-08 10:00:00 +0000 UTC', 'trackflow-ui:gh-1111111']],
  });
  writeFileSync(join(env.state, 'bad-image'), 'trackflow-ui:gh-abc1234');
  const result = env.run(['deploy', 'ui', 'gh-abc1234']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /health checks failed for ui/);
  assert.match(result.stderr, /rolled back ui to trackflow-ui:gh-1111111/);
  assert.equal(env.tag('ui'), 'gh-1111111');
  assert.equal(env.releaseFile(), releaseYaml('gh-1111111'));
  assert.deepEqual(env.events(), ['up ui trackflow-ui:gh-abc1234', 'up ui trackflow-ui:gh-1111111']);
  assert.deepEqual(env.images().sort(), ['trackflow-ui:gh-1111111', 'trackflow-ui:gh-abc1234']);
});

test('unhealthy first pipeline deploy falls back to the pre-pipeline pin', () => {
  const env = setup({ images: [['2026-11-09 10:00:00 +0000 UTC', 'trackflow-api:gh-abc1234']] });
  writeFileSync(join(env.state, 'bad-image'), 'trackflow-api:gh-abc1234');
  const result = env.run(['deploy', 'api', 'gh-abc1234']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /rolled back api to its pre-pipeline pin/);
  assert.equal(env.tag('api'), null);
  assert.equal(env.releaseFile(), null);
  assert.deepEqual(env.events(), ['up api trackflow-api:gh-abc1234', 'up api trackflow-api:pinned']);
});

test('invalid Compose configuration stops before recreating and keeps the previous release', () => {
  const env = setup({
    release: { ui: 'gh-1111111' },
    images: [['2026-11-09 10:00:00 +0000 UTC', 'trackflow-ui:gh-abc1234']],
  });
  writeFileSync(join(env.state, 'config-fails'), '');
  const result = env.run(['deploy', 'ui', 'gh-abc1234']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /error: Compose configuration is invalid; nothing was recreated/);
  assert.deepEqual(env.events(), []);
  assert.equal(env.tag('ui'), 'gh-1111111');
  assert.equal(env.releaseFile(), releaseYaml('gh-1111111'));
});

test('successful deploy keeps the current and previous pipeline images and never removes other tags', () => {
  const env = setup({
    release: { ui: 'gh-3333333' },
    images: [
      ['2026-11-09 10:00:00 +0000 UTC', 'trackflow-ui:gh-4444444'],
      ['2026-11-08 10:00:00 +0000 UTC', 'trackflow-ui:gh-3333333'],
      ['2026-11-07 10:00:00 +0000 UTC', 'trackflow-ui:gh-2222222'],
      ['2026-11-06 10:00:00 +0000 UTC', 'trackflow-ui:gh-1111111'],
      ['2026-11-01 10:00:00 +0000 UTC', 'trackflow-ui:talent-044fde0'],
      ['2026-10-01 10:00:00 +0000 UTC', 'trackflow-api:gh-0000000'],
    ],
  });
  const result = env.run(['deploy', 'ui', 'gh-4444444']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(env.images().sort(), ['trackflow-api:gh-0000000', 'trackflow-ui:gh-3333333',
    'trackflow-ui:gh-4444444', 'trackflow-ui:talent-044fde0']);
  assert.deepEqual(env.events().filter(event => event.startsWith('rm ')).sort(),
    ['rm trackflow-ui:gh-1111111', 'rm trackflow-ui:gh-2222222']);
});
