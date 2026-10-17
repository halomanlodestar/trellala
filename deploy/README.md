# Deploy

CI builds once, ships a tarball, and the server only migrates and reloads. Nothing is compiled on the box.

The instance (t3.micro) runs only Node, PM2 and cloudflared. Postgres (RDS) and Redis live elsewhere.

```text
/srv/trellala/
  shared/.env              real secrets (see .env.example), owned by ubuntu, mode 600
  releases/<sha>/          one extracted tarball per deploy (last 5 kept)
  current -> releases/<sha>
```

## One-time server setup (Ubuntu 24.04 x86_64, same as the CI runner)

```bash
# layout (deploy and run as the default `ubuntu` user)
sudo mkdir -p /srv/trellala/{releases,shared} && sudo chown -R ubuntu: /srv/trellala

# small swap as a safety net on 1 GiB RAM
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Node 22 LTS + PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt install -y nodejs
sudo npm install -g pm2

# PM2 on boot, as ubuntu (resurrects the list saved by each deploy)
sudo env PATH=$PATH pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Put the real values in `/srv/trellala/shared/.env` (`chmod 600`). `REDIS_URL` and `DATABASE_URL` point
at the external hosts. The first CI deploy starts both PM2 apps.

## Cloudflare Tunnel

The tunnel connects outbound, so the security group needs **no inbound 80/443**, only 22 for deploys.

```bash
# install cloudflared (https://pkg.cloudflare.com), then create the tunnel in the Zero Trust
# dashboard and run the install command it gives you:
sudo cloudflared service install <token>
```

Public hostname: `trellala.example.com` → `http://127.0.0.1:3000`.

Set `BETTER_AUTH_URL=https://trellala.example.com` in `shared/.env` and add
`https://trellala.example.com/api/auth/callback/google` to the Google OAuth client.

## GitHub

Environment `production` with these secrets:

| Secret | Value |
| --- | --- |
| `SSH_HOST` | Elastic IP or hostname of the instance |
| `SSH_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | contents of the EC2 key pair `.pem` |
| `SSH_KNOWN_HOSTS` | `<SSH_HOST> <first two fields of /etc/ssh/ssh_host_ed25519_key.pub>` |
| `SSH_PORT` | optional, defaults to 22 |

## Operating

```bash
pm2 ls                       # status, memory, restarts
pm2 logs trellala-worker     # tail logs
```

Rollback:

```bash
ln -sfn /srv/trellala/releases/<old-sha> /srv/trellala/current
pm2 startOrReload /srv/trellala/current/ecosystem.config.cjs --update-env && pm2 save
```

Or re-run an older successful workflow from the Actions tab. Its artifact is kept for 14 days.
