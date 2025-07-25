@echo off
echo 🐝 Beesoft - Fresh Repository Reset & Release
echo =============================================

echo.
echo 🔄 Step 1: Resetting Git repository completely...
echo    Removing .git directory...
if exist ".git" (
    rmdir /s /q ".git"
    echo    ✅ Git history cleared
) else (
    echo    ℹ️ No existing .git directory found
)

echo.
echo 🧹 Step 2: Cleaning up unnecessary files...
echo    Removing node_modules...
if exist "node_modules" rmdir /s /q "node_modules"

echo    Removing build outputs...
if exist "dist" rmdir /s /q "dist"
if exist "build" rmdir /s /q "build"
if exist "out" rmdir /s /q "out"

echo    Removing WhatsApp data...
if exist ".wwebjs_auth" rmdir /s /q ".wwebjs_auth"
if exist ".wwebjs_cache" rmdir /s /q ".wwebjs_cache"
if exist ".beesoft-data" rmdir /s /q ".beesoft-data"

echo    Removing optional components...
if exist "beesoft-backend" rmdir /s /q "beesoft-backend"
if exist "admin-portal" rmdir /s /q "admin-portal"

echo    Removing backup files...
del /q "*.rar" 2>nul
del /q "*.zip" 2>nul
del /q "wa_error_*.png" 2>nul
del /q "*.log" 2>nul

echo    Removing alternative files...
del /q "main_*.js" 2>nul
del /q "main-*.js" 2>nul
del /q "preload-*.js" 2>nul
del /q "oauth-callback-server.js" 2>nul
del /q "send_whatsapp.js" 2>nul
del /q "test-*.js" 2>nul

echo    Removing debug data...
if exist ".qodo" rmdir /s /q ".qodo"

echo    Removing environment files...
del /q ".env" 2>nul

echo.
echo 📋 Step 3: Verifying core files exist...
set MISSING_FILES=0

if not exist "main.js" (
    echo    ❌ main.js missing
    set MISSING_FILES=1
) else (
    echo    ✅ main.js found
)

if not exist "preload.js" (
    echo    ❌ preload.js missing
    set MISSING_FILES=1
) else (
    echo    ✅ preload.js found
)

if not exist "package.json" (
    echo    ❌ package.json missing
    set MISSING_FILES=1
) else (
    echo    ✅ package.json found
)

if not exist "public\index.html" (
    echo    ❌ public\index.html missing
    set MISSING_FILES=1
) else (
    echo    ✅ public\index.html found
)

if not exist "README.md" (
    echo    ❌ README.md missing
    set MISSING_FILES=1
) else (
    echo    ✅ README.md found
)

if not exist ".gitignore" (
    echo    ❌ .gitignore missing
    set MISSING_FILES=1
) else (
    echo    ✅ .gitignore found
)

if %MISSING_FILES% equ 1 (
    echo.
    echo ❌ Critical files missing! Cannot proceed.
    pause
    exit /b 1
)

echo.
echo 🚀 Step 4: Initializing fresh Git repository...
git init
if %errorlevel% neq 0 (
    echo ❌ Failed to initialize Git repository
    pause
    exit /b 1
)
echo    ✅ Git repository initialized

echo.
echo ➕ Step 5: Adding core files to repository...
echo    Adding .gitignore...
git add .gitignore

echo    Adding main application files...
git add main.js
git add preload.js
git add package.json

echo    Adding public assets...
git add public/

echo    Adding documentation...
git add README.md
git add LICENSE
git add CHANGELOG.md

echo    Adding build configuration...
git add build-config.js
git add installer.nsh
if exist "installer\" git add installer/

echo    Adding utility scripts...
git add *.bat

echo    Adding release documentation...
git add BETA_TESTING_CHECKLIST.md
git add GITHUB_RELEASE_TEMPLATE.md

echo.
echo 📊 Step 6: Repository status check...
git status

echo.
echo 💾 Step 7: Creating initial commit...
git commit -m "Initial commit: Beesoft WhatsApp Automation v1.0.0-beta.1

🐝 Core Features:
- WhatsApp Web integration with QR code
- Bulk messaging from Excel files  
- Image attachment support
- Real-time campaign analytics
- Advanced anti-ban protection
- Material 3 design with dark/light themes
- Campaign pause/resume/stop controls
- Windows installer & portable builds

🛡️ Anti-Ban Protection:
- Smart delays (3-8 seconds)
- Batch processing (20 msgs/batch)
- Rate limiting (50/hour, 500/day)
- Human-like behavior simulation

🎯 Technical:
- Electron desktop application
- Local data storage only
- No external dependencies
- Cross-platform compatible"

if %errorlevel% neq 0 (
    echo ❌ Failed to create initial commit
    pause
    exit /b 1
)
echo    ✅ Initial commit created

echo.
echo 🏷️ Step 8: Creating release tag...
git tag v1.0.0-beta.1 -m "Beesoft Beta 1 Release

🎉 First beta release of Beesoft WhatsApp Automation

✨ Features:
- Complete WhatsApp automation solution
- Advanced anti-ban protection
- Modern Material 3 UI
- Real-time campaign monitoring
- Excel file processing
- Image attachment support

📦 Downloads:
- Windows Installer (NSIS)
- Portable Executable
- Source Code

⚠️ Beta Notice:
This is a beta release for testing. Please report any issues."

echo    ✅ Release tag v1.0.0-beta.1 created

echo.
echo 🌐 Step 9: Setting up remote repository...
echo    Setting main branch...
git branch -M main

echo    Adding remote origin...
git remote add origin https://github.com/ektharxd/beesoft.git
if %errorlevel% neq 0 (
    echo ⚠️ Remote already exists or failed to add
)

echo.
echo 📤 Step 10: Pushing to GitHub...
echo    Pushing main branch...
git push -u origin main
if %errorlevel% neq 0 (
    echo ❌ Failed to push main branch
    echo Please check your GitHub credentials and repository access
    pause
    exit /b 1
)

echo    Pushing release tag...
git push origin v1.0.0-beta.1
if %errorlevel% neq 0 (
    echo ❌ Failed to push release tag
    pause
    exit /b 1
)

echo.
echo 🔨 Step 11: Building release artifacts...
echo    Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo    Building application...
npm run build:all
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo 📦 Step 12: Preparing release files...
if not exist "releases\" mkdir "releases\"
if not exist "releases\v1.0.0-beta.1\" mkdir "releases\v1.0.0-beta.1\"

echo    Copying build artifacts...
if exist "dist\Beesoft Setup 1.0.0-beta.1.exe" (
    copy "dist\Beesoft Setup 1.0.0-beta.1.exe" "releases\v1.0.0-beta.1\" >nul
    echo    ✅ Installer copied
) else (
    echo    ⚠️ Installer not found
)

if exist "dist\Beesoft-Portable-1.0.0-beta.1.exe" (
    copy "dist\Beesoft-Portable-1.0.0-beta.1.exe" "releases\v1.0.0-beta.1\" >nul
    echo    ✅ Portable version copied
) else (
    echo    ⚠️ Portable version not found
)

echo    Copying documentation...
copy "README.md" "releases\v1.0.0-beta.1\" >nul
copy "LICENSE" "releases\v1.0.0-beta.1\" >nul
copy "CHANGELOG.md" "releases\v1.0.0-beta.1\" >nul
copy "GITHUB_RELEASE_TEMPLATE.md" "releases\v1.0.0-beta.1\" >nul

echo.
echo ✅ SUCCESS! Repository reset and release prepared
echo ================================================

echo.
echo 📊 REPOSITORY SUMMARY:
echo ✅ Fresh Git repository initialized
echo ✅ Only core application files included
echo ✅ Clean commit history
echo ✅ Release tag v1.0.0-beta.1 created
echo ✅ Pushed to GitHub: https://github.com/ektharxd/beesoft
echo ✅ Build artifacts ready in releases\v1.0.0-beta.1\

echo.
echo 📁 INCLUDED FILES:
echo    • main.js (Electron main process)
echo    • preload.js (Electron preload script)
echo    • package.json (dependencies & config)
echo    • public\ (HTML, CSS, JS, assets)
echo    • README.md (comprehensive documentation)
echo    • LICENSE (ISC license)
echo    • CHANGELOG.md (version history)
echo    • build-config.js (build configuration)
echo    • installer.nsh (installer script)
echo    • *.bat (utility scripts)

echo.
echo 🚀 NEXT STEPS:
echo 1. Go to: https://github.com/ektharxd/beesoft/releases
echo 2. Click "Create a new release"
echo 3. Choose tag: v1.0.0-beta.1
echo 4. Use title: "🐝 Beesoft v1.0.0-beta.1 - First Beta Release"
echo 5. Copy content from GITHUB_RELEASE_TEMPLATE.md
echo 6. Upload files from releases\v1.0.0-beta.1\
echo 7. Mark as "Pre-release" (beta)
echo 8. Publish release

echo.
echo 🎯 RELEASE FILES READY:
if exist "releases\v1.0.0-beta.1\Beesoft Setup 1.0.0-beta.1.exe" (
    echo    ✅ Beesoft Setup 1.0.0-beta.1.exe
) else (
    echo    ❌ Installer missing
)
if exist "releases\v1.0.0-beta.1\Beesoft-Portable-1.0.0-beta.1.exe" (
    echo    ✅ Beesoft-Portable-1.0.0-beta.1.exe
) else (
    echo    ❌ Portable version missing
)
echo    ✅ README.md
echo    ✅ LICENSE
echo    ✅ CHANGELOG.md
echo    ✅ GITHUB_RELEASE_TEMPLATE.md

echo.
echo 🐝 Beesoft Beta 1 is ready for release!
echo.
pause