#!/usr/bin/env bash
# Production deploy entry point for the GitHub Actions key.
# Installed as root at /opt/trackflow-containerization/deploy.sh and used as that
# key's forced SSH command; see README.md in this folder.
set -Eeuo pipefail
umask 077

DIR=${TRACKFLOW_DEPLOY_DIR:-/opt/trackflow-containerization}
PUBLIC_URL=${TRACKFLOW_PUBLIC_URL:-https://162.243.69.7}
DEPLOY_PATH=${TRACKFLOW_DEPLOY_PATH:-/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin}
HEALTH_ATTEMPTS=${TRACKFLOW_HEALTH_ATTEMPTS:-36}
HEALTH_INTERVAL=${TRACKFLOW_HEALTH_INTERVAL:-5}
RELEASE_DIR=$DIR/release
RELEASE_FILE=$DIR/release.override.yml
TAG_PATTERN='^gh-[0-9a-f]{7,40}$'
PROJECT=''

log() { printf '[deploy] %s\n' "$*" >&2; }
die() { log "error: $*"; exit 1; }
usage() {
  echo 'usage: deploy.sh status | load <ui|api> <gh-sha> | deploy <ui|api> <gh-sha>' >&2
  exit 2
}

# The pre-pipeline Compose files stay untouched; release.override.yml only pins images.
compose() {
  local files=(-f "$DIR/docker-compose.production.yml" -f "$DIR/resources.override.yml"
    -f "$DIR/https.override.yml")
  if [[ -f $RELEASE_FILE ]]; then files+=(-f "$RELEASE_FILE"); fi
  env -i PATH="$DEPLOY_PATH" HOME=/root COMPOSE_DISABLE_ENV_FILE=1 \
    docker compose --project-directory "$DIR" --project-name "$PROJECT" \
    --env-file "$DIR/deployment.env" "${files[@]}" "$@"
}

find_project() {
  local names
  names=$(docker ps -a --filter "label=com.docker.compose.project.working_dir=$DIR" \
    --format '{{.Label "com.docker.compose.project"}}' | sort -u)
  [[ -n $names && $names != *$'\n'* ]] ||
    die "expected exactly one Compose project in $DIR, found: ${names:-none}"
  PROJECT=$names
}

render_release() {
  local svc body=''
  for svc in ui api; do
    [[ -f $RELEASE_DIR/$svc ]] || continue
    body+="  $svc:"$'\n'"    image: trackflow-$svc:$(<"$RELEASE_DIR/$svc")"$'\n'
  done
  if [[ -z $body ]]; then
    rm -f "$RELEASE_FILE"
    return
  fi
  printf 'services:\n%s' "$body" >"$RELEASE_FILE.tmp"
  mv -f "$RELEASE_FILE.tmp" "$RELEASE_FILE"
}

# An empty tag returns the service to its pre-pipeline pin.
set_tag() {
  mkdir -p "$RELEASE_DIR"
  if [[ -n $2 ]]; then printf '%s\n' "$2" >"$RELEASE_DIR/$1"; else rm -f "$RELEASE_DIR/$1"; fi
  render_release
}

recreate() { compose up -d --no-deps --no-build --pull never --force-recreate "$1"; }

http_code() {
  curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$PUBLIC_URL$1" 2>/dev/null || true
}

# Public pages prove Nginx and the UI; an anonymous 401 proves the UI reaches the API.
probe() {
  local id state path
  id=$(compose ps -q "$1") && [[ -n $id ]] || return 1
  state=$(docker inspect -f \
    '{{.State.Running}} {{.State.Restarting}} {{.RestartCount}} {{.Config.Image}}' "$id") || return 1
  [[ $state == "true false 0 "* && ( -z $2 || $state == "true false 0 $2" ) ]] || return 1
  for path in /uis/website/ /uis/backoffice/login.html /talent/login; do
    [[ $(http_code "$path") == 200 ]] || return 1
  done
  [[ $(http_code /api/auth/me) == 401 ]]
}

healthy() {
  local attempt
  for ((attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt++)); do
    probe "$1" "$2" && return 0
    sleep "$HEALTH_INTERVAL"
  done
  log "health checks failed for $1"
  return 1
}

# Keep the running pipeline image and its rollback target; never touch manual tags.
prune() {
  local tag tags
  mapfile -t tags < <(docker image ls "trackflow-$1" --format '{{.Tag}}')
  for tag in "${tags[@]}"; do
    [[ $tag =~ $TAG_PATTERN && $tag != "$2" && $tag != "$3" ]] || continue
    docker image rm "trackflow-$1:$tag" >/dev/null || log "could not remove trackflow-$1:$tag"
  done
}

cmd_status() {
  local svc
  find_project
  printf 'project: %s\n' "$PROJECT"
  for svc in ui api; do
    if [[ -f $RELEASE_DIR/$svc ]]; then
      printf '%s: %s\n' "$svc" "$(<"$RELEASE_DIR/$svc")"
    else
      printf '%s: pre-pipeline pin\n' "$svc"
    fi
  done
  compose config --quiet || die 'Compose configuration is invalid'
  compose ps
}

# docker load reads the gzip stream from stdin directly.
cmd_load() {
  local image="trackflow-$1:$2"
  docker load >&2 || die 'docker load failed'
  docker image inspect "$image" >/dev/null 2>&1 || die "stream did not load $image"
  log "loaded $image"
}

cmd_deploy() {
  local svc=$1 tag=$2 image="trackflow-$1:$2" previous=''
  exec 9>"$DIR/.deploy.lock"
  flock -n 9 || die 'another deploy is running'
  docker image inspect "$image" >/dev/null 2>&1 || die "$image is not loaded; run load first"
  find_project
  if [[ -f $RELEASE_DIR/$svc ]]; then previous=$(<"$RELEASE_DIR/$svc"); fi

  set_tag "$svc" "$tag"
  if ! compose config --quiet; then
    set_tag "$svc" "$previous"
    die 'Compose configuration is invalid; nothing was recreated'
  fi
  if recreate "$svc" && healthy "$svc" "$image"; then
    log "$svc now runs $image"
    prune "$svc" "$tag" "$previous"
    return
  fi

  local target='its pre-pipeline pin' expected=''
  if [[ -n $previous ]]; then target=trackflow-$svc:$previous expected=$target; fi
  set_tag "$svc" "$previous"
  if recreate "$svc" && healthy "$svc" "$expected"; then
    die "rolled back $svc to $target"
  fi
  die "rollback of $svc failed; manual intervention required"
}

# A forced command receives the client's request only in SSH_ORIGINAL_COMMAND.
# It is split into words and never evaluated by a shell.
if [[ -v SSH_ORIGINAL_COMMAND ]]; then
  read -r -a args <<<"$SSH_ORIGINAL_COMMAND"
else
  args=("$@")
fi

case "${args[0]:-} ${#args[@]}" in
  'status 1') cmd_status ;;
  'load 3' | 'deploy 3')
    [[ ${args[1]} == ui || ${args[1]} == api ]] && [[ ${args[2]} =~ $TAG_PATTERN ]] || usage
    "cmd_${args[0]}" "${args[1]}" "${args[2]}"
    ;;
  *) usage ;;
esac
