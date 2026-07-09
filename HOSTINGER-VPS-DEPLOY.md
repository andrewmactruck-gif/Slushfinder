# 🧊 SlushyFind — Hostinger VPS Deployment Guide

Complete step-by-step guide to get SlushyFind live on a Hostinger VPS.

---

## What You'll Need

- A Hostinger VPS plan (KVM 1 or higher recommended — starts ~$5.99 USD/month)
- Your domain name (e.g. slushysearch.ca) pointed at Hostinger
- A Supabase account (free tier works)
- About 30–45 minutes

---

## Step 1 — Order Your Hostinger VPS

1. Go to hostinger.com → **VPS Hosting**
2. Choose **KVM 1** (1 vCPU, 4GB RAM, 50GB SSD) — more than enough
3. During setup, select **Ubuntu 22.04** as the OS
4. Note down your VPS IP address from the Hostinger hPanel dashboard

---

## Step 2 — Connect to Your VPS

Open your terminal (Mac/Linux) or PowerShell (Windows) and SSH in:

```bash
ssh root@YOUR_VPS_IP_ADDRESS
```

Hostinger will email you the root password, or you can set an SSH key in hPanel.

---

## Step 3 — Run the Server Setup Script

Copy and paste this entire block into your SSH session. It installs everything:

```bash
bash <(curl -s https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh)
source ~/.bashrc

# Install Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Install PM2 (keeps your app running 24/7)
npm install -g pm2

# Install Nginx (web server / reverse proxy)
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx ufw git unzip

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "✅ Server setup complete. Node $(node -v), npm $(npm -v)"
```

---

## Step 4 — Upload Your Project

### Option A — Upload the zip file (easiest)

On your **local machine**, upload the zip using scp:

```bash
scp slushyfind.zip root@YOUR_VPS_IP_ADDRESS:/var/www/
```

Then on the **VPS**:

```bash
cd /var/www
unzip slushyfind.zip
mv slushyfind slushysearch
cd slushysearch
```

### Option B — Use GitHub (recommended for ongoing updates)

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/slushyfind.git slushysearch
cd slushysearch
```

---

## Step 5 — Configure Environment Variables

On the VPS, create your `.env.local` file:

```bash
cd /var/www/slushysearch
nano .env.local
```

Paste this, filling in your real values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_BASE_URL=https://slushysearch.ca
```

Save with `Ctrl+X` → `Y` → `Enter`.

---

## Step 6 — Install Dependencies & Build

```bash
cd /var/www/slushysearch
npm install
npm run build
```

The build takes 1–2 minutes. You should see:

```
Route (app)
✓ /
✓ /search
✓ /location/[id]
✓ /add
```

---

## Step 7 — Start the App with PM2

PM2 keeps your app alive 24/7 and restarts it if it crashes:

```bash
cd /var/www/slushysearch

# Start the app
pm2 start npm --name "slushysearch" -- start

# Save PM2 config so it survives reboots
pm2 save
pm2 startup
```

PM2 will print a command starting with `sudo env PATH=...` — copy and run that command.

### Check the app is running:

```bash
pm2 status
pm2 logs slushysearch --lines 20
```

The app runs on port **3000** internally. Nginx will forward traffic from port 80/443.

---

## Step 8 — Configure Nginx

Create the Nginx config for your site:

```bash
nano /etc/nginx/sites-available/slushysearch
```

Paste this (replace `slushysearch.ca` with your actual domain):

```nginx
server {
    listen 80;
    server_name slushysearch.ca www.slushysearch.ca;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Proxy to Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /favicon.ico {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

Enable the site and restart Nginx:

```bash
# Enable your site
ln -s /etc/nginx/sites-available/slushysearch /etc/nginx/sites-enabled/

# Remove the default Nginx page
rm /etc/nginx/sites-enabled/default

# Test the config
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

---

## Step 9 — Point Your Domain to the VPS

In your domain registrar (or Hostinger Domains dashboard), add these DNS records:

| Type | Name | Value              | TTL  |
|------|------|--------------------|------|
| A    | @    | YOUR_VPS_IP        | 3600 |
| A    | www  | YOUR_VPS_IP        | 3600 |

DNS changes take 5–30 minutes to propagate.

---

## Step 10 — Add Free SSL (HTTPS)

Once DNS is pointed and propagated, run:

```bash
certbot --nginx -d slushysearch.ca -d www.slushysearch.ca
```

Follow the prompts — enter your email, agree to terms, choose option **2** (redirect HTTP → HTTPS).

Certbot auto-renews SSL every 90 days. Test renewal works:

```bash
certbot renew --dry-run
```

---

## Step 11 — Run the Supabase Schema

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Open the file `supabase-schema.sql` from your project
3. Paste the entire contents and click **Run**

This creates all tables, PostGIS indexes, and sample data.

---

## Step 12 — Seed Real Canadian Locations (Optional)

Get a Google Places API key from [console.cloud.google.com](https://console.cloud.google.com), then on the VPS:

```bash
cd /var/www/slushysearch
GOOGLE_PLACES_API_KEY=AIza... \
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_KEY=eyJ... \
npx ts-node scripts/seed-from-places.ts
```

This populates the database with real slushy machine locations across Canada.

---

## Updating the App

When you make changes, deploy updates like this:

```bash
cd /var/www/slushysearch

# Pull latest code (if using Git)
git pull

# Reinstall dependencies if package.json changed
npm install

# Rebuild
npm run build

# Restart with zero downtime
pm2 reload slushysearch
```

---

## Useful Commands

```bash
# View live logs
pm2 logs slushysearch

# Restart the app
pm2 restart slushysearch

# Check app status
pm2 status

# Check Nginx status
systemctl status nginx

# View Nginx error logs
tail -f /var/log/nginx/error.log

# Check disk space
df -h

# Check memory usage
free -m

# Check CPU usage
htop
```

---

## Troubleshooting

**App won't start:**
```bash
pm2 logs slushysearch --lines 50
# Look for missing env vars or build errors
```

**502 Bad Gateway:**
```bash
# App probably isn't running
pm2 restart slushysearch
pm2 status
```

**SSL certificate error:**
```bash
# Make sure DNS has propagated first, then:
certbot --nginx -d yourdomain.ca
```

**Out of memory during build:**
```bash
# Increase Node memory limit
NODE_OPTIONS=--max_old_space_size=1024 npm run build
```

---

## Monthly Cost Summary

| Item | Cost |
|------|------|
| Hostinger KVM 1 VPS | ~$5.99 USD/month |
| Domain (.ca) | ~$15 CAD/year |
| Supabase (free tier) | $0 |
| SSL Certificate (Let's Encrypt) | $0 |
| Google Places API (seed only, one-time) | ~$0.50 USD |
| **Total ongoing** | **~$6–8 USD/month** |

---

## Your App Will Be Live At

```
https://slushysearch.ca
```
