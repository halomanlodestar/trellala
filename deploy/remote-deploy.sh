#!/usr/bin/env bash
# Runs on the server from inside an extracted release: migrate, switch `current`, reload PM2, health-check.
# Rolls the symlink back if the new web process doesn't come up. Migrations are NOT rolled back,
# so keep them backward compatible with the previous release (add columns first, drop them later).
set -euo pipefail

APP_ROOT=/srv/trellala
ENV_FILE="$APP_ROOT/shared/.env"
RELEASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREVIOUS="$(readlink -f "$APP_ROOT/current" || true)"
KEEP_RELEASES=5

log() { echo "[deploy $(cut -c1-7 "$RELEASE_DIR/REVISION")] $*"; }

point_current_at() {
  ln -sfn "$1" "$APP_ROOT/current.next"
  mv -Tf "$APP_ROOT/current.next" "$APP_ROOT/current"
}

reload() {
  # startOrReload re-reads the ecosystem file (fresh .env) and starts the apps on the first deploy.
  pm2 startOrReload "$APP_ROOT/current/ecosystem.config.cjs" --update-env
  pm2 save
}

healthy() {
  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null "http://127.0.0.1:3000/login"; then return 0; fi
    sleep 2
  done
  return 1
}

if [ ! -f "$ENV_FILE" ]; then
  log "missing $ENV_FILE; create it from .env.example (see deploy/README.md)"
  exit 1
fi

log "migrating"
(
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
  cd "$RELEASE_DIR/migrate"
  node ./node_modules/prisma/build/index.js migrate deploy
)

log "switching current -> $RELEASE_DIR"
point_current_at "$RELEASE_DIR"
reload

if ! healthy; then
  log "health check failed"
  pm2 logs trellala-web --lines 40 --nostream || true
  if [ -n "$PREVIOUS" ] && [ "$PREVIOUS" != "$RELEASE_DIR" ]; then
    log "rolling back to $PREVIOUS"
    point_current_at "$PREVIOUS"
    reload
  fi
  exit 1
fi

log "live; pruning old releases"
ls -1dt "$APP_ROOT"/releases/*/ | tail -n +$((KEEP_RELEASES + 1)) | while read -r dir; do
  [ "$(readlink -f "$dir")" = "$RELEASE_DIR" ] || rm -rf "$dir"
done
