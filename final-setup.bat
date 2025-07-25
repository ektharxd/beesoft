@echo off
echo Beesoft - Final Clean Setup
echo ==========================

echo.
echo Step 1: Cleaning public folder...
call clean-public-folder.bat

echo.
echo Step 2: Setting up clean repository...
call clean-repo-simple.bat

echo.
echo Step 3: Installing dependencies...
npm install

echo.
echo Step 4: Building application...
npm run build:all

echo.
echo All done! Repository is clean and ready.
echo.
echo Files included:
echo - main.js (Electron main)
echo - preload.js (Electron preload)
echo - package.json (config)
echo - public/index.html (main UI)
echo - public/app.js (frontend logic)
echo - public/style.css (styling)
echo - public/Bee.ico (icon)
echo - README.md (documentation)
echo - LICENSE (license)
echo - CHANGELOG.md (changes)
echo - build-config.js (build settings)
echo - installer.nsh (installer)
echo.
echo Ready to push:
echo git push -u origin main
echo git push origin v1.0.0-beta.1
echo.
pause