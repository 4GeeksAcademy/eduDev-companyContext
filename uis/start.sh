#!/bin/sh
# Own direct leaf processes; never use npm wrappers or a third-party supervisor.
set -u
cd "$(dirname "$0")" || exit 1
BACKOFFICE_LEGACY_PORT=${BACKOFFICE_LEGACY_PORT-3002}
export BACKOFFICE_LEGACY_PORT
case "${TRACKFLOW_UI_MODE-development}" in
  development) next_command=dev ;;
  production) next_command=start ;;
  *) echo 'Invalid TRACKFLOW_UI_MODE: use development or production' >&2; exit 1 ;;
esac
pids=''
cleanup() {
  trap - EXIT
  trap '' TERM INT
  for pid in $pids; do kill -TERM "$pid" 2>/dev/null || :; done
  # Bound shutdown if a child ignores termination, then reap every owned PID.
  attempts=0
  while [ "$attempts" -lt 5 ]; do
    running=false
    for pid in $pids; do
      if kill -0 "$pid" 2>/dev/null; then running=true; fi
    done
    [ "$running" = true ] || break
    sleep 1
    attempts=$((attempts + 1))
  done
  for pid in $pids; do kill -KILL "$pid" 2>/dev/null || :; done
  for pid in $pids; do wait "$pid" 2>/dev/null || :; done
}
trap 'cleanup; exit 0' TERM INT
trap cleanup EXIT
node backoffice/legacy-server.mjs &
pids="$pids $!"
(cd website && exec node node_modules/next/dist/bin/next "$next_command" --hostname 0.0.0.0 --port 3000) &
pids="$pids $!"
(cd backoffice && exec node node_modules/next/dist/bin/next "$next_command" --hostname 0.0.0.0 --port 3001) &
pids="$pids $!"
while :; do
  for pid in $pids; do
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid"
      code=$?
      echo "UI child $pid exited unexpectedly (status $code)" >&2
      exit 1
    fi
  done
  sleep 1
done
