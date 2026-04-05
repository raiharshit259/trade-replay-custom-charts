#!/usr/bin/env bash
# SSL setup with Let's Encrypt + Certbot for api.tradereplay.me
# Run AFTER DNS A record points to this droplet
set -euo pipefail

DOMAIN="api.tradereplay.me"
EMAIL="${1:-admin@tradereplay.me}"

echo "=== SSL Setup for ${DOMAIN} ==="

# Install certbot
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# Get certificate and auto-configure Nginx
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}"

# Auto-renewal is enabled by default via snap
echo ""
echo "=== SSL configured ==="
echo "Domain: https://${DOMAIN}"
echo "Auto-renewal: enabled (snap timer)"
echo "Test renewal: certbot renew --dry-run"
