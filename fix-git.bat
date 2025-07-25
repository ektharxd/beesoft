@echo off
echo 🐝 Beesoft - Git Repository Cleanup Script
echo ==========================================

echo.
echo 📋 Step 1: Unstaging all files...
git reset

echo.
echo 🗑️ Step 2: Removing tracked files that should be ignored...
git rm -r --cached node_modules/ 2>nul
git rm -r --cached beesoft-backend/node_modules/ 2>nul
git rm -r --cached dist/ 2>nul
git rm -r --cached .wwebjs_auth/ 2>nul
git rm -r --cached .wwebjs_cache/ 2>nul
git rm -r --cached .beesoft-data/ 2>nul
git rm --cached .env 2>nul
git rm --cached beesoft-backend/.env 2>nul
git rm --cached *.log 2>nul
git rm --cached wa_error_*.png 2>nul
git rm --cached WhatsAppProject.rar 2>nul
git rm --cached WhatsAppProjectfinal.rar 2>nul
git rm --cached BeesoftProjectBackup.zip 2>nul
git rm -r --cached .qodo/ 2>nul

echo.
echo ➕ Step 3: Adding only the files we want to track...
git add .gitignore
git add README.md
git add LICENSE
git add package.json
git add main.js
git add preload.js
git add public/
git add beesoft-backend/server.js
git add beesoft-backend/package.json
git add admin-portal/
git add installer/
git add build-config.js
git add *.bat
git add *.md
git add *.nsh

echo.
echo ✅ Step 4: Checking what will be committed...
git status

echo.
echo 🎯 Repository cleanup complete!
echo.
echo Next steps:
echo 1. Review the git status above
echo 2. If it looks good, run: git commit -m "Initial commit for Beesoft WhatsApp Automation"
echo 3. Then: git branch -M main
echo 4. Then: git remote add origin https://github.com/ektharxd/beesoft.git
echo 5. Finally: git push -u origin main
echo.
pause