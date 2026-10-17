// PM2 process file. Shipped inside each release; paths go through the `current` symlink,
// so `pm2 reload` picks up whichever release `current` points at.
const fs = require("node:fs");
const { parseEnv } = require("node:util");

const ROOT = "/srv/trellala";
const env = parseEnv(fs.readFileSync(`${ROOT}/shared/.env`, "utf8"));

module.exports = {
  apps: [
    {
      name: "trellala-web",
      cwd: `${ROOT}/current/web/apps/web`,
      script: "server.js",
      env: { ...env, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: "3000" },
      max_memory_restart: "450M",
      kill_timeout: 10_000,
    },
    {
      name: "trellala-worker",
      cwd: `${ROOT}/current/worker`,
      script: "index.js",
      env: { ...env, NODE_ENV: "production" },
      max_memory_restart: "250M",
      // The worker closes BullMQ on SIGINT; give an in-flight ingest job time to finish.
      kill_timeout: 60_000,
    },
  ],
};
