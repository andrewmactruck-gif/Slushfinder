#!/bin/bash
# ============================================================
# Slush Finder — One-Command VPS Setup Script
# Run this ONCE on a fresh Hostinger VPS (Ubuntu 22.04)
#
# Usage:
#   chmod +x setup-vps.sh
#   sudo ./setup-vps.sh
# ============================================================
set -e

echo ""
echo "🧊 Slush Finder VPS Setup"
echo "=========================="

# 1. System update
echo "📦 Updating system..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git unzip nano ufw nginx certbot python3-certbot-nginx htop

# 2. Node.js 20 via NVM
echo "📦 Installing Node.js 20..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20 && nvm use 20 && nvm alias default 20
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc

# 3. PM2
echo "📦 Installing PM2..."
npm install -g pm2

# 4. Firewall
echo "🔒 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 5. Directories
mkdir -p /var/log/pm2 /var/www
rm -f /etc/nginx/sites-enabled/default
systemctl enable nginx && systemctl start nginx

echo ""
echo "✅ Setup complete!"
echo "Node: $(node -v) | npm: $(npm -v)"
echo ""
echo "Next: upload slushfinder.zip and follow the deployment guide."
