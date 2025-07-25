@echo off
echo Beesoft - Clean Professional Installer Builder
echo ============================================

echo.
echo Building a clean, professional installer without custom graphics...
echo Using standard Windows installer appearance with modern functionality.

echo.
echo Step 1: Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Building clean installer...
npm run build:installer
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Clean professional installer created
echo =============================================

echo.
echo 📦 Installer files created:
if exist "dist\Beesoft-Setup-*.exe" (
    for %%f in ("dist\Beesoft-Setup-*.exe") do (
        echo    ✅ %%~nxf
        echo       Size: %%~zf bytes
    )
) else (
    echo ❌ No installer found in dist\
)

echo.
echo 🎯 Features of your clean installer:
echo ✅ Professional Windows-standard appearance
echo ✅ No custom graphics or banners
echo ✅ Clean, minimal design
echo ✅ Standard Windows fonts and colors
echo ✅ Component selection dialog
echo ✅ Custom installation directory
echo ✅ Desktop and Start Menu shortcuts
echo ✅ Optional Quick Launch shortcut
echo ✅ Excel file association option
echo ✅ Proper uninstaller with data cleanup options
echo ✅ Registry integration
echo ✅ Windows 10/11 compatibility check
echo ✅ Upgrade detection and handling
echo ✅ Professional license agreement
echo ✅ High DPI support
echo ✅ Unicode support for international users

echo.
echo 📋 Installer includes:
echo • Welcome page with product description
echo • License agreement page
echo • Component selection (Core, Desktop shortcut, Quick Launch, File association)
echo • Installation directory selection
echo • Progress page with file installation
echo • Finish page with option to run application
echo • Complete uninstaller with user data options

echo.
echo 🚀 Your clean, professional installer is ready!
echo No custom graphics needed - uses Windows standard appearance.
echo.
pause