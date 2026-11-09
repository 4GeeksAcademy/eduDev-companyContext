# Automatic production deploy

Every merge to `main` deploys the services it changed to the VPS `162.243.69.7`.

| Change under | Rebuilds and recreates |
| --- | --- |
| `uis/` | UI container (website, backoffice, Talent Tracker) |
| `services/`, `shared/`, `packages/shared/` | API container |
| anything else | nothing |

> _Spanish version: [README.es.md](./README.es.md)._

## How it works

1. [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) asks
   `deploy.sh status` which commit each service runs and diffs `main` against it,
   so changes from a skipped queued run are still deployed. A service still on its
   pre-pipeline pin is always deployed. It builds the changed images on the GitHub
   runner, tagged `gh-<12-char commit>`.
2. It streams each image to the VPS over SSH (`docker save | gzip | ssh … load`).
3. [`deploy.sh`](./deploy.sh) on the VPS writes `release.override.yml`, a fourth
   Compose file that only pins image tags, and recreates that one service.
4. `deploy.sh` waits up to three minutes for public `200`s on `/uis/website/`,
   `/uis/backoffice/login.html` and `/talent/login`, plus an anonymous `401` on
   `/api/auth/me`. If any check fails, it restores the previous tag, recreates
   the service again and the workflow fails.
5. On success it keeps the current and previous `gh-*` images and removes older
   `gh-*` images. Manually built tags (for example `talent-044fde0`) are never removed.

The deploy SSH key is a root key restricted with `restrict,command=…`: it can only
run `deploy.sh status`, `load <ui|api> <tag>` and `deploy <ui|api> <tag>`.

## One-time setup

### 1. Create the deploy key (your machine)

```bash
ssh-keygen -t ed25519 -N "" -C github-actions-trackflow-deploy -f ~/.ssh/trackflow_github_deploy
```

### 2. Install the script and key (VPS, with your usual root access)

```bash
scp infra/deploy/deploy.sh root@162.243.69.7:/opt/trackflow-containerization/deploy.sh
ssh root@162.243.69.7
chown root:root /opt/trackflow-containerization/deploy.sh
chmod 700 /opt/trackflow-containerization/deploy.sh
sshd -T | grep -i permitrootlogin   # must not be "no"
```

Append one line to `/root/.ssh/authorized_keys`, pasting the content of
`~/.ssh/trackflow_github_deploy.pub` after the options:

```text
restrict,command="/opt/trackflow-containerization/deploy.sh" ssh-ed25519 AAAA… github-actions-trackflow-deploy
```

GitHub runners use changing IPs: SSH must be reachable from the internet.

### 3. Check the key (your machine)

```bash
ssh -i ~/.ssh/trackflow_github_deploy root@162.243.69.7 status   # project, tags, 2 containers
ssh -i ~/.ssh/trackflow_github_deploy root@162.243.69.7 whoami   # must print usage, not "root"
```

### 4. Get the trusted host key (your machine)

```bash
ssh-keyscan -t ed25519 162.243.69.7 > /tmp/trackflow_known_hosts
ssh-keygen -lf /tmp/trackflow_known_hosts
```

The fingerprint must match `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the VPS.

### 5. Add the repository secrets

Any collaborator with write access can add them (no admin or environment needed):

```bash
R=4GeeksAcademy/eduDev-companyContext
gh secret set VPS_SSH_KEY --repo $R < ~/.ssh/trackflow_github_deploy
gh secret set VPS_KNOWN_HOSTS --repo $R < /tmp/trackflow_known_hosts
```

Then delete the local private key copy if you do not need it for manual runs.

### 6. First run

After this folder is merged, open **Actions → Deploy production → Run workflow**,
choose `main` and `api` (the smaller image). Confirm the run passes and
`ssh -i … root@162.243.69.7 status` shows the new `api: gh-…` tag.

## Rollback

`deploy.sh` rolls back failed deploys automatically. To return to the previous
release by hand, use a tag it still keeps:

```bash
ssh root@162.243.69.7 /opt/trackflow-containerization/deploy.sh deploy ui gh-<previous>
```

To return a service to its pre-pipeline pin, in `/opt/trackflow-containerization`
delete `release/<service>` and that service's block in `release.override.yml`
(delete the file when no block remains). Then recreate it with the `compose_ui`
command in [`../nginx/README.md`](../nginx/README.md), adding
`-f /opt/trackflow-containerization/release.override.yml` if that file still exists.

## Limits

- Whoever holds the deploy key can load and run any image as UI or API. As a
  repository secret, any workflow pushed to this repository can read it: rotate
  it if it leaks.
- Each deploy transfers the whole image, but the VPS stores only layers it lacks.
  The GitHub build cache keeps unchanged layers (base image, `npm ci`) identical,
  so a UI code change adds about 100 MB on disk; a dependency change adds more.
- Each recreate causes a short outage of that service (no zero-downtime deploy).
- No tests run before deploy: merge only reviewed, checked PRs.
- Changes to Compose files, Nginx, `deployment.env` or secrets stay manual.
- Updating `deploy.sh` itself requires copying it to the VPS again (step 2).
- Tests: `node --test tests/deploy-script.test.mjs` (fake Docker/curl, no VPS).
