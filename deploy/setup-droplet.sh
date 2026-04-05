#!/usr/bin/env bash
# DigitalOcean Droplet Setup Script — Trade Replay Backend
# Run as root on a fresh Ubuntu 22.04/24.04 droplet
set -euo pipefail

echo "=== Trade Replay — Droplet Setup ==="

# ---- System updates ----
apt-get update && apt-get upgrade -y
apt-get install -y curl git nginx ufw snapd

# ---- Node.js 20 LTS ----
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js $(node -v)"

# ---- PM2 ----
npm install -g pm2
pm2 startup systemd -u root --hp /root

# ---- Firewall ----
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ---- Create app directory ----
mkdir -p /opt/tradereplay
mkdir -p /var/log/tradereplay

# ---- Clone repo ----
if [ ! -d "/opt/tradereplay/.git" ]; then
  git clone https://github.com/Jatin-cheti/trade-replay.git /opt/tradereplay
else
  cd /opt/tradereplay && git pull origin main
fi

# ---- Install backend deps ----
cd /opt/tradereplay/backend
npm ci --omit=dev

# ---- Nginx config ----
cp /opt/tradereplay/deploy/nginx/tradereplay.conf /etc/nginx/sites-available/tradereplay
ln -sf /etc/nginx/sites-available/tradereplay /etc/nginx/sites-enabled/tradereplay
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# ---- SSL (run after DNS is pointed) ----
# snap install --classic certbot
# ln -s /snap/bin/certbot /usr/bin/certbot
# certbot --nginx -d api.tradereplay.me --non-interactive --agree-tos -m YOUR_EMAIL

echo ""
echo "=== Setup complete ==="
echo "Next steps:"
echo "  1. Copy .env to /opt/tradereplay/.env with PROD_ values"
echo "  2. Run: cd /opt/tradereplay && pm2 start ecosystem.config.cjs"
echo "  3. Run: pm2 save"
echo "  4. Point DNS: api.tradereplay.me → this droplet's IP"
echo "  5. Run SSL: certbot --nginx -d api.tradereplay.me"
