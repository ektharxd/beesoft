@echo off
echo 🔍 Beesoft Core Files Check
echo ===========================

echo.
echo 📋 CORE APPLICATION FILES:
echo.

echo ✅ MAIN APPLICATION:
if exist "main.js" (
    echo    ✓ main.js [%~z1 bytes]
) else (
    echo    ✗ main.js [MISSING]
)

if exist "preload.js" (
    echo    ✓ preload.js
) else (
    echo    ✗ preload.js [MISSING]
)

if exist "package.json" (
    echo    ✓ package.json
) else (
    echo    ✗ package.json [MISSING]
)

echo.
echo ✅ PUBLIC ASSETS:
if exist "public\index.html" (
    echo    ✓ public\index.html
) else (
    echo    ✗ public\index.html [MISSING]
)

if exist "public\app.js" (
    echo    ✓ public\app.js
) else (
    echo    ✗ public\app.js [MISSING]
)

if exist "public\style.css" (
    echo    ✓ public\style.css
) else (
    echo    ✗ public\style.css [MISSING]
)

if exist "public\Bee.ico" (
    echo    ✓ public\Bee.ico
) else (
    echo    ✗ public\Bee.ico [MISSING]
)

echo.
echo ✅ DOCUMENTATION:
if exist "README.md" (
    echo    ✓ README.md
) else (
    echo    ✗ README.md [MISSING]
)

if exist "LICENSE" (
    echo    ✓ LICENSE
) else (
    echo    ✗ LICENSE [MISSING]
)

if exist "CHANGELOG.md" (
    echo    ✓ CHANGELOG.md
) else (
    echo    ✗ CHANGELOG.md [MISSING]
)

echo.
echo ✅ BUILD CONFIGURATION:
if exist "build-config.js" (
    echo    ✓ build-config.js
) else (
    echo    ✗ build-config.js [MISSING]
)

if exist "installer.nsh" (
    echo    ✓ installer.nsh
) else (
    echo    ✗ installer.nsh [MISSING]
)

if exist ".gitignore" (
    echo    ✓ .gitignore
) else (
    echo    ✗ .gitignore [MISSING]
)

echo.
echo ❌ FILES TO BE EXCLUDED:
echo.

if exist "node_modules" (
    echo    ✗ node_modules\ [WILL BE REMOVED]
) else (
    echo    ✓ node_modules\ [NOT PRESENT]
)

if exist "beesoft-backend" (
    echo    ✗ beesoft-backend\ [WILL BE REMOVED]
) else (
    echo    ✓ beesoft-backend\ [NOT PRESENT]
)

if exist "admin-portal" (
    echo    ✗ admin-portal\ [WILL BE REMOVED]
) else (
    echo    ✓ admin-portal\ [NOT PRESENT]
)

if exist ".wwebjs_auth" (
    echo    ✗ .wwebjs_auth\ [WILL BE REMOVED]
) else (
    echo    ✓ .wwebjs_auth\ [NOT PRESENT]
)

if exist ".wwebjs_cache" (
    echo    ✗ .wwebjs_cache\ [WILL BE REMOVED]
) else (
    echo    ✓ .wwebjs_cache\ [NOT PRESENT]
)

if exist "dist" (
    echo    ✗ dist\ [WILL BE REMOVED]
) else (
    echo    ✓ dist\ [NOT PRESENT]
)

echo.
echo 🎯 SUMMARY:
echo ==========================================
echo This will create a clean repository with:
echo.
echo ✅ INCLUDED:
echo    • Core Electron application (main.js, preload.js)
echo    • Frontend assets (public/ folder)
echo    • Configuration files (package.json, build-config.js)
echo    • Documentation (README.md, LICENSE, CHANGELOG.md)
echo    • Build tools (installer.nsh, *.bat scripts)
echo    • Git configuration (.gitignore)
echo.
echo ❌ EXCLUDED:
echo    • node_modules/ (dependencies)
echo    • Backend server (beesoft-backend/)
echo    • Admin portal (admin-portal/)
echo    • WhatsApp session data
echo    • Build outputs (dist/, build/)
echo    • User data and logs
echo    • Backup files and archives
echo.
echo 🚀 Ready to run: reset-and-publish.bat
echo.
pause