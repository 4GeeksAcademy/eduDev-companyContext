import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const launcher = new URL('../start.sh', import.meta.url);
async function until(check) {
  for (let i = 0; i < 100; i++) {
    if (await check()) return;
    await delay(100);
  }
  throw new Error('Timed out waiting for owned process');
}
const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };

for (const failedChild of [null, 0, 1, 2]) {
  const failure = failedChild !== null;
  test(failure ? `child ${failedChild} exit stops siblings and exits nonzero` : 'TERM stops and reaps all owned children', async () => {
    const root = await mkdtemp(join(tmpdir(), 'trackflow-start-'));
    let child;
    const pids = [];
    try {
      await writeFile(join(root, 'start.sh'), await readFile(launcher));
      const fake = `const fs = require('node:fs');
fs.writeFileSync(__filename + '.pid', String(process.pid));
process.on('SIGTERM', () => process.exit(0));
setInterval(() => {}, 1000);
`;
      for (const app of ['website', 'backoffice']) {
        const directory = join(root, app, 'node_modules/next/dist/bin');
        await mkdir(directory, { recursive: true });
        await writeFile(join(directory, 'next'), fake);
      }
      await writeFile(join(root, 'backoffice/legacy-server.mjs'), fake.replace("const fs = require('node:fs');", "import fs from 'node:fs';\nimport { fileURLToPath } from 'node:url';\nconst __filename = fileURLToPath(import.meta.url);"));
      child = spawn('sh', [join(root, 'start.sh')], { cwd: '/', stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      child.stderr.on('data', chunk => { output += chunk; });
      const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
      for (const file of ['website/node_modules/next/dist/bin/next', 'backoffice/node_modules/next/dist/bin/next', 'backoffice/legacy-server.mjs']) {
        await until(async () => {
          try { return Number(await readFile(join(root, `${file}.pid`), 'utf8')); } catch { return false; }
        });
        pids.push(Number(await readFile(join(root, `${file}.pid`), 'utf8')));
      }
      if (failure) process.kill(pids[failedChild], failedChild === 1 ? 'SIGTERM' : 'SIGKILL');
      else child.kill('SIGTERM');
      const result = await Promise.race([exited, delay(10000).then(() => { throw new Error('Launcher did not exit'); })]);
      assert.equal(result.signal, null);
      if (failure) {
        assert.notEqual(result.code, 0);
        assert.match(output, /exited unexpectedly/);
      } else assert.equal(result.code, 0);
      for (const pid of pids) assert.equal(alive(pid), false, `PID ${pid} cleaned`);
    } finally {
      if (child?.exitCode === null) child.kill('SIGTERM');
      for (const pid of pids) if (alive(pid)) process.kill(pid, 'SIGTERM');
      await until(() => pids.every(pid => !alive(pid)));
      await rm(root, { recursive: true, force: true });
    }
  });
}
