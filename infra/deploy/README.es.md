# Deploy automático a producción

Cada merge a `main` despliega en el VPS `162.243.69.7` los servicios que cambiaron.

| Cambio en | Reconstruye y recrea |
| --- | --- |
| `uis/` | Contenedor UI (website, backoffice, Talent Tracker) |
| `services/`, `shared/`, `packages/shared/` | Contenedor API |
| cualquier otra ruta | nada |

> _English version: [README.md](./README.md). El inglés es la referencia; esta
> versión resume los mismos pasos._

## Cómo funciona

1. [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) consulta con
   `deploy.sh status` qué commit corre cada servicio y compara `main` contra ese commit,
   así no se pierden cambios de una corrida en cola descartada. Un servicio que sigue
   con su versión previa al pipeline siempre se despliega. Construye las imágenes que
   cambiaron en el runner de GitHub, con tag `gh-<12 caracteres del commit>`.
2. Envía cada imagen al VPS por SSH (`docker save | gzip | ssh … load`).
3. [`deploy.sh`](./deploy.sh) en el VPS escribe `release.override.yml`, un cuarto
   archivo de Compose que solo fija tags de imagen, y recrea ese único servicio.
4. `deploy.sh` espera hasta tres minutos respuestas `200` públicas en `/uis/website/`,
   `/uis/backoffice/login.html` y `/talent/login`, y un `401` anónimo en
   `/api/auth/me`. Si algo falla, restaura el tag anterior, recrea el servicio otra
   vez y el workflow falla.
5. Si sale bien, conserva la imagen `gh-*` actual y la anterior y borra las `gh-*`
   más viejas. Nunca borra tags construidos a mano (por ejemplo `talent-044fde0`).

La clave SSH de deploy es de root pero restringida con `restrict,command=…`: solo
puede ejecutar `deploy.sh status`, `load <ui|api> <tag>` y `deploy <ui|api> <tag>`.

## Configuración inicial (una sola vez)

1. **Clave (tu máquina):**
   `ssh-keygen -t ed25519 -N "" -C github-actions-trackflow-deploy -f ~/.ssh/trackflow_github_deploy`
2. **Script y clave (VPS, con tu acceso root habitual):** copiá `deploy.sh` a
   `/opt/trackflow-containerization/deploy.sh` con `root:root` y `chmod 700`;
   verificá que `sshd -T | grep -i permitrootlogin` no diga `no`; agregá a
   `/root/.ssh/authorized_keys`:
   `restrict,command="/opt/trackflow-containerization/deploy.sh" <contenido de trackflow_github_deploy.pub>`.
   El SSH tiene que ser accesible desde internet (los runners cambian de IP).
3. **Probar (tu máquina):** `ssh -i ~/.ssh/trackflow_github_deploy root@162.243.69.7 status`
   muestra proyecto, tags y 2 contenedores; `… whoami` tiene que mostrar el uso, no `root`.
4. **Host key:** `ssh-keyscan -t ed25519 162.243.69.7 > /tmp/trackflow_known_hosts`;
   su huella (`ssh-keygen -lf`) tiene que coincidir con
   `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` en el VPS.
5. **GitHub:** cualquier colaborador con escritura carga los secrets del repo
   (sin admin ni environment): `gh secret set VPS_SSH_KEY --repo <repo> < ~/.ssh/trackflow_github_deploy`
   y `gh secret set VPS_KNOWN_HOSTS --repo <repo> < /tmp/trackflow_known_hosts`.
6. **Primera ejecución:** después del merge, *Actions → Deploy production → Run
   workflow*, rama `main`, servicio `api`; confirmá con `status` el nuevo tag.

## Rollback y límites

Comandos de rollback manual y límites: ver la [versión en inglés](./README.md#rollback).
Resumen: quien tenga la clave de deploy puede cargar y correr cualquier imagen como
UI o API (como secret del repo la puede leer cualquier workflow del repo: rotala
si se filtra); gracias al caché de build, el VPS solo guarda las capas que cambian
(unos 100 MB por cambio de código de la UI); cada
recreación corta brevemente ese servicio, no se corren tests antes
del deploy, y los cambios de Compose, Nginx, `deployment.env` o del propio
`deploy.sh` siguen siendo manuales.
