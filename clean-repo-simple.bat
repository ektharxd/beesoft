@echo off
chcp 65001 >nul
echo Beesoft - Clean Repository Setup
echo ================================

echo.
echo Step 1: Removing .git directory...
if exist ".git" rmdir /s /q ".git"

echo Step 2: Cleaning unnecessary files...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "dist" rmdir /s /q "dist"
if exist ".wwebjs_auth" rmdir /s /q ".wwebjs_auth"
if exist ".wwebjs_cache" rmdir /s /q ".wwebjs_cache"
if exist ".beesoft-data" rmdir /s /q ".beesoft-data"
if exist "beesoft-backend" rmdir /s /q "beesoft-backend"
if exist "admin-portal" rmdir /s /q "admin-portal"
if exist ".qodo" rmdir /s /q ".qodo"

del /q "*.rar" 2>nul
del /q "*.zip" 2>nul
del /q "wa_error_*.png" 2>nul
del /q "*.log" 2>nul
del /q "main_*.js" 2>nul
del /q "preload-*.js" 2>nul
del /q "oauth-callback-server.js" 2>nul
del /q "send_whatsapp.js" 2>nul
del /q ".env" 2>nul

echo Step 3: Initializing Git...
git init
git config core.autocrlf true

echo Step 4: Adding core files...
git add .gitignore
git add main.js
git add preload.js
git add package.json
git add README.md
git add LICENSE
git add CHANGELOG.md
git add build-config.js
git add installer.nsh
git add public/index.html
git add public/app.js
git add public/style.css
git add public/Bee.ico

echo Step 5: Creating commit...
git commit -m "Initial commit: Beesoft WhatsApp Automation v1.0.0-beta.1"

echo Step 6: Setting up remote...
git branch -M main
git remote add origin https://github.com/ektharxd/beesoft.git

echo Step 7: Creating tag...
git tag v1.0.0-beta.1

echo.
echo SUCCESS! Repository is ready.
echo.
echo Next steps:
echo 1. git push -u origin main
echo 2. git push origin v1.0.0-beta.1
echo 3. Create GitHub release
echo.
pause