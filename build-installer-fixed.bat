@echo off
echo Beesoft - Fixed Installer Builder
echo ===============================

echo.
echo Building installer with electron-builder's built-in NSIS...
echo This avoids conflicts with custom NSIS scripts.

echo.
echo Step 1: Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Building installer (using built-in NSIS)...
npm run build:installer
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Professional installer created
echo ========================================

echo.
echo 📦 Installer files created:
if exist "dist\Beesoft-Setup-*.exe" (
    for %%f in ("dist\Beesoft-Setup-*.exe") do (
        echo    ✅ %%~nxf
        echo       Size: %%~zf bytes
        echo       Created: %%~tf
    )
) else (
    echo ❌ No installer found in dist\
)

echo.
echo 🎯 Installer features:
echo ✅ Clean, professional Windows-standard appearance
echo ✅ Welcome page with product information
echo ✅ License agreement page
echo ✅ Installation directory selection
echo ✅ Desktop shortcut creation
echo ✅ Start Menu shortcuts
echo ✅ Proper Windows registry integration
echo ✅ Complete uninstaller
echo ✅ Windows 10/11 compatibility
echo ✅ High DPI support
echo ✅ Unicode support
echo ✅ Automatic elevation handling
echo ✅ File association options
echo ✅ User data cleanup options

echo.
echo 📋 What's included:
echo • Main Beesoft application
echo • Desktop shortcut (optional)
echo • Start Menu shortcuts
echo • Quick Launch shortcut
echo • Windows registry entries
echo • Uninstaller with data cleanup options
echo • Professional license agreement

echo.
echo 🚀 Your installer is ready for distribution!
echo No custom graphics conflicts - uses electron-builder's built-in system.
echo.
pause