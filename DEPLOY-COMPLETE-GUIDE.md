# 🧊 Slushy Search — Complete VPS Deployment Guide
### Hostinger VPS + GitHub → Live Website

---

## OVERVIEW

This guide covers three things in order:

1. **GitHub** — Put your code on GitHub (version control + easy deploys)
2. **Hostinger VPS** — Set up your server
3. **Go Live** — Deploy, domain, SSL, done

**Total time:** ~45–60 minutes  
**Monthly cost:** ~$6–8 USD/month (VPS + domain, everything else is free)

---

---

# PART 1 — GITHUB SETUP

GitHub stores your code in the cloud. Every time you update the site, you push to GitHub and pull it down on the server. This is the standard professional workflow.

---

## Step 1.1 — Create a GitHub Account

If you don't have one:

1. Go to **github.com**
2. Click **Sign up**
3. Choose a username (e.g. `slushysearch`)
4. Verify your email

---

## Step 1.2 — Create a New Repository

1. Click the **+** icon in the top right → **New repository**
2. Fill in:
   - **Repository name:** `slushysearch`
   - **Visibility:** Private ✅ (keeps your code private)
   - **Do NOT check** "Add a README" (your project already has one)
3. Click **Create repository**
4. GitHub shows you a page with commands — **keep this tab open**

---

## Step 1.3 — Install Git on Your Computer

**Mac:**
```bash
# Git usually comes pre-installed. Check with:
git --version

# If not installed, it will prompt you to install. Or use Homebrew:
brew install git
```

**Windows:**
1. Download from **git-scm.com/download/win**
2. Install with all default options
3. Open **Git Bash** (installed with Git) for all commands below

---

## Step 1.4 — Unzip Your Project

If you downloaded `slushyfind-hostinger.zip`:

**Mac:**
```bash
cd ~/Downloads
unzip slushyfind-hostinger.zip
cd slushyfind
```

**Windows (Git Bash):**
```bash
cd ~/Downloads
unzip slushyfind-hostinger.zip
cd slushyfind
```

---

## Step 1.5 — Push to GitHub

Run these commands inside your project folder:

```bash
# 1. Initialize Git in the project
git init

# 2. Add all files
git add .

# 3. Make your first commit
git commit -m "Initial commit — Slushy Search"

# 4. Rename branch to main
git branch -M main

# 5. Connect to your GitHub repo (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/slushysearch.git

# 6. Push the code
git push -u origin main
```

GitHub will ask for your **username** and **password**.  
⚠️ For the password, you need a **Personal Access Token**, NOT your GitHub password:

1. Go to **github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Give it a name like "VPS Deploy"
4. Check the **repo** checkbox
5. Click **Generate token**
6. Copy the token — paste it as your password when Git asks

✅ **Your code is now on GitHub.**

---

## Step 1.6 — Create a .gitignore File

Before pushing, make sure you never accidentally commit secrets:

```bash
# In your project folder, create .gitignore if it doesn't exist
cat > .gitignore << 'EOF'
node_modules/
.next/
.env.local
.env*.local
*.log
.DS_Store
Thumbs.db
EOF

git add .gitignore
git commit -m "Add gitignore"
git push
```

---

---

# PART 2 — HOSTINGER VPS SETUP

---

## Step 2.1 — Order Your VPS

1. Go to **hostinger.com → VPS Hosting**
2. Choose **KVM 1** plan (~$5.99 USD/month)
   - 1 vCPU, 4GB RAM, 50GB SSD — more than enough
3. During checkout, select:
   - **OS: Ubuntu 22.04**
   - Data center closest to Canada (New York or any US location)
4. Complete purchase
5. Go to **hPanel dashboard** — note your **VPS IP address** (looks like `123.456.78.90`)

---

## Step 2.2 — Connect to Your VPS

Open Terminal (Mac) or Git Bash (Windows):

```bash
ssh root@YOUR_VPS_IP_ADDRESS
```

Example:
```bash
ssh root@123.456.78.90
```

- Hostinger emails you the **root password** after purchase
- Type it when prompted (nothing appears as you type — that's normal)
- Type `yes` if asked about fingerprint

You're now inside your server. 🎉

---

## Step 2.3 — Run the Setup Script

Copy and paste this **entire block** into your SSH session and press Enter.  
It installs Node.js, PM2, Nginx, and configures the firewall automatically:

```bash
# Update system
apt-get update -y && apt-get upgrade -y

# Install required packages
apt-get install -y curl git unzip nano ufw nginx certbot python3-certbot-nginx htop

# Install Node.js 20 via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20

# Add NVM to shell profile so it persists
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc

# Install PM2 globally (keeps app running 24/7)
npm install -g pm2

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Create log directory for PM2
mkdir -p /var/log/pm2
mkdir -p /var/www

# Remove default Nginx page
rm -f /etc/nginx/sites-enabled/default
systemctl enable nginx
systemctl start nginx

echo ""
echo "✅ Server setup complete!"
echo "Node: $(node -v) | npm: $(npm -v)"
```

This takes about 3–5 minutes. Wait for the ✅ message.

---

## Step 2.4 — Configure SSH Key (Optional but Recommended)

This lets you log in without a password every time:

**On your LOCAL machine** (new terminal, not the SSH session):
```bash
# Generate an SSH key if you don't have one
ssh-keygen -t ed25519 -C "your@email.com"
# Press Enter 3 times to accept defaults

# Copy your public key to the server
ssh-copy-id root@YOUR_VPS_IP_ADDRESS
```

Now you can SSH in without a password: `ssh root@YOUR_VPS_IP`

---

---

# PART 3 — DEPLOY YOUR APP

---

## Step 3.1 — Clone Your Code from GitHub

On the **VPS** (in your SSH session):

```bash
cd /var/www

# Clone your repository (replace YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/slushysearch.git slushysearch

cd slushysearch
```

If your repo is private, GitHub will ask for credentials.  
Use your GitHub username + Personal Access Token (same one from Step 1.5).

---

## Step 3.2 — Create Your Environment File

Still on the **VPS**:

```bash
nano /var/www/slushysearch/.env.local
```

Paste this and fill in your real values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_BASE_URL=https://yourdomain.ca
```

**Where to find Supabase keys:**
1. Go to **supabase.com** → your project
2. Click **Settings** → **API**
3. Copy **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL`
4. Copy **anon public** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy **service_role** key → paste as `SUPABASE_SERVICE_ROLE_KEY`

Save: `Ctrl+X` → `Y` → `Enter`

---

## Step 3.3 — Run the Supabase Database Schema

Before the app works, you need to set up the database:

1. Go to **supabase.com** → your project → **SQL Editor**
2. Click **New query**
3. Open the file `supabase-schema.sql` from your project zip
4. Paste the entire contents into the SQL editor
5. Click **Run** (green button)

You should see: `Success. No rows returned`

This creates all your tables, PostGIS geospatial index, search function, and sample locations.

---

## Step 3.4 — Install and Build

On the **VPS**:

```bash
cd /var/www/slushysearch

# Install dependencies
npm install

# Build the production app
npm run build
```

The build takes 1–3 minutes. You'll see:

```
Route (app)
✓ /
✓ /search
✓ /location/[id]
✓ /add
✅ Build complete
```

---

## Step 3.5 — Start the App with PM2

```bash
cd /var/www/slushysearch

# Start using the ecosystem config file
pm2 start ecosystem.config.js

# Save PM2 config (survives reboots)
pm2 save

# Set PM2 to start on system boot
pm2 startup
```

PM2 will print a command like:
```
sudo env PATH=$PATH:/root/.nvm/versions/node/v20.x.x/bin pm2 startup ...
```
**Copy and run that exact command.**

### Verify it's running:
```bash
pm2 status
```

You should see `slushysearch` with status `online` ✅

```bash
# Check live logs
pm2 logs slushysearch --lines 20
```

The app is now running on port 3000 internally. Next we connect it to the web.

---

## Step 3.6 — Configure Nginx (Web Server)

Nginx sits in front of your app and handles web traffic on port 80/443:

```bash
# Copy the nginx config from your project
cp /var/www/slushysearch/nginx.conf /etc/nginx/sites-available/slushysearch
```

Now edit it to use your real domain:

```bash
nano /etc/nginx/sites-available/slushysearch
```

Find every instance of `slushysearch.ca` and replace with **your actual domain name**.  
Save: `Ctrl+X` → `Y` → `Enter`

```bash
# Enable the site
ln -s /etc/nginx/sites-available/slushysearch /etc/nginx/sites-enabled/

# Test the config (must say "test is successful")
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## Step 3.7 — Point Your Domain to the VPS

In your domain registrar (Hostinger Domains, GoDaddy, Namecheap, etc.):

Go to **DNS Settings** and add these two records:

| Type | Name | Value               | TTL  |
|------|------|---------------------|------|
| A    | @    | YOUR_VPS_IP_ADDRESS | 3600 |
| A    | www  | YOUR_VPS_IP_ADDRESS | 3600 |

**If your domain is also on Hostinger:**
1. hPanel → Domains → your domain → DNS / Nameservers
2. Edit the A record to point to your VPS IP

DNS takes **5–30 minutes** to propagate. You can check at **whatsmydns.net**.

---

## Step 3.8 — Add Free SSL Certificate (HTTPS)

Once DNS has propagated and your domain loads (even without HTTPS):

```bash
certbot --nginx -d yourdomain.ca -d www.yourdomain.ca
```

Follow the prompts:
- Enter your email address
- Agree to terms: `A`
- Share email with EFF (optional): `N` or `Y`
- Choose option **2** — Redirect (HTTP → HTTPS)

Certbot automatically renews SSL every 90 days. Test it:

```bash
certbot renew --dry-run
```

✅ **Your site is now live at `https://yourdomain.ca`**

---

---

# PART 4 — UPDATING YOUR SITE

When you make changes to the code on your local computer:

### On your LOCAL machine:
```bash
cd slushyfind

# Stage your changes
git add .

# Commit with a description
git commit -m "Update: improved search results UI"

# Push to GitHub
git push
```

### On the VPS:
```bash
cd /var/www/slushysearch

# Pull latest code from GitHub
git pull

# Rebuild (only if you changed code — not needed for content-only changes)
npm run build

# Reload with zero downtime
pm2 reload slushysearch
```

That's it. Your site updates in about 2 minutes.

---

---

# PART 5 — SEEDING REAL CANADIAN DATA

Once the site is live, populate it with real slushy machine locations:

### Get a Google Places API Key
1. Go to **console.cloud.google.com**
2. Create a project (or use existing)
3. Enable **Places API (New)**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Restrict the key to your server IP for security

### Run the seeder on your VPS:
```bash
cd /var/www/slushysearch

GOOGLE_PLACES_API_KEY=AIzaSy... \
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_KEY=eyJhbGci... \
npx ts-node scripts/seed-from-places.ts
```

This queries 18 Canadian cities × 5 brand keywords and imports real locations.  
**Estimated cost: ~$0.50 USD** (within Google's free monthly credit).

---

---

# PART 6 — QUICK REFERENCE

## Useful Commands

```bash
# App status
pm2 status

# View live logs
pm2 logs slushysearch

# Restart app
pm2 restart slushysearch

# Reload (zero downtime)
pm2 reload slushysearch

# Check Nginx
systemctl status nginx
nginx -t

# View Nginx errors
tail -f /var/log/nginx/error.log

# Disk space
df -h

# Memory usage
free -m

# CPU / processes
htop
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Site shows 502 Bad Gateway | `pm2 restart slushysearch` |
| App won't start | `pm2 logs slushysearch` — check for missing env vars |
| SSL not working | Make sure DNS has propagated first, then re-run certbot |
| Build fails with "out of memory" | `NODE_OPTIONS=--max_old_space_size=1024 npm run build` |
| Git push rejected | `git pull --rebase` first, then push again |
| Can't SSH in | Check Hostinger hPanel → VPS → Firewall, make sure port 22 is open |

---

## Cost Summary

| Item | Cost |
|------|------|
| Hostinger KVM 1 VPS | ~$5.99 USD/month |
| Domain name (.ca) | ~$15 CAD/year |
| Supabase (free tier) | $0/month |
| SSL (Let's Encrypt) | $0 |
| GitHub (private repo) | $0 |
| OpenStreetMap / Nominatim | $0 |
| Google Places (one-time seed) | ~$0.50 USD |
| **Total ongoing** | **~$6–8 USD/month** |

---

## File Summary (inside your zip)

| File | Purpose |
|------|---------|
| `app/` | All pages — home, search, detail, add |
| `components/` | SearchBar, LocationCard, Map, BrandFilter |
| `lib/` | Supabase client, geocoding, hours logic |
| `scripts/seed-from-places.ts` | Google Places seeder |
| `supabase-schema.sql` | Run this in Supabase SQL Editor first |
| `nginx.conf` | Web server config — edit domain name |
| `ecosystem.config.js` | PM2 process manager config |
| `setup-vps.sh` | One-command server setup script |
| `.env.local.example` | Template for your environment variables |
| `README.md` | Quick start reference |

---

*Slushy Search — Built for Canada 🇨🇦*
