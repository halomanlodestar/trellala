#!/usr/bin/env bash
# Assembles a self-contained release tarball after `bun run build`. Runs in CI from the repo root.
#
#   release/
#     web/        Next standalone server (apps/web/server.js + traced node_modules + static assets)
#     worker/     the worker bundled into one file
#     migrate/    prisma schema + migrations + a minimal prisma CLI install
#     remote-deploy.sh, ecosystem.config.cjs, REVISION
set -euo pipefail

SHA="${1:?usage: package.sh <git-sha>}"
OUT=dist/release

rm -rf dist
mkdir -p "$OUT"

# Web: standalone output omits static assets and public/, they must be copied next to server.js.
cp -a apps/web/.next/standalone "$OUT/web"
mkdir -p "$OUT/web/apps/web/.next"
cp -a apps/web/.next/static "$OUT/web/apps/web/.next/static"
if [ -d apps/web/public ]; then cp -a apps/web/public "$OUT/web/apps/web/public"; fi

# Worker: one file for Node, no node_modules needed on the server.
mkdir -p "$OUT/worker"
bun build apps/worker/src/index.ts --target=node --outfile "$OUT/worker/index.js"

# Migrations: run on the server because the database isn't reachable from GitHub runners.
mkdir -p "$OUT/migrate/prisma"
cp -a packages/db/prisma/schema.prisma packages/db/prisma/migrations "$OUT/migrate/prisma/"
cp packages/db/prisma.config.ts "$OUT/migrate/"
PRISMA_VERSION=$(cd packages/db && bun -p "require('prisma/package.json').version")
DOTENV_VERSION=$(cd packages/db && bun -p "require('dotenv/package.json').version")
cat > "$OUT/migrate/package.json" <<EOF
{
  "private": true,
  "type": "module",
  "dependencies": { "prisma": "$PRISMA_VERSION", "dotenv": "$DOTENV_VERSION" },
  "trustedDependencies": ["prisma", "@prisma/engines"]
}
EOF
(cd "$OUT/migrate" && bun install --production)

cp deploy/remote-deploy.sh deploy/ecosystem.config.cjs "$OUT/"
echo "$SHA" > "$OUT/REVISION"

tar -C "$OUT" -czf "dist/trellala-$SHA.tar.gz" .
du -sh "dist/trellala-$SHA.tar.gz"
