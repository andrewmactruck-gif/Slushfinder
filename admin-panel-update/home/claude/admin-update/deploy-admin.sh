#!/bin/bash
# ============================================================
# Slush Finder — Deploy Admin Panel
# Run this on your VPS inside /var/www/slushfinder
# ============================================================
set -e

echo "📁 Creating admin directories..."
mkdir -p app/admin
mkdir -p app/api/admin/submissions

echo "📋 Copying admin files..."
cp /tmp/admin-page.tsx       app/admin/page.tsx
cp /tmp/admin-api-route.ts   app/api/admin/submissions/route.ts

echo "🔑 Adding admin password to .env.local..."
if ! grep -q "NEXT_PUBLIC_ADMIN_PASSWORD" .env.local; then
  echo "" >> .env.local
  echo "# Admin panel password" >> .env.local
  echo "NEXT_PUBLIC_ADMIN_PASSWORD=slushAdmin2024!" >> .env.local
  echo "ADMIN_SECRET=slushAdmin2024!" >> .env.local
  echo "✅ Password added to .env.local"
  echo "⚠️  CHANGE the password! Edit .env.local and set your own password."
else
  echo "✅ Password already set in .env.local"
fi

echo "🔨 Building..."
npm run build

echo "♻️  Reloading app..."
pm2 reload slushfinder

echo ""
echo "✅ Admin panel deployed!"
echo "Visit: https://yourdomain.com/admin"
echo "Password: Check your .env.local file"
