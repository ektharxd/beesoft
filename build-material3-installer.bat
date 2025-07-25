@echo off
echo 🐝 Beesoft Material 3 Installer Builder
echo =======================================

echo.
echo Step 1: Creating installer graphics...
echo Opening graphics generator...
start "" "installer\create-installer-graphics.html"

echo.
echo Please follow these steps:
echo 1. Download all graphics from the web page
echo 2. Convert PNG files to BMP/ICO format using an image editor
echo 3. Place files in installer\ directory:
echo    - header.bmp (150x57)
echo    - welcome.bmp (164x314) 
echo    - installer-icon.ico (256x256)
echo 4. Press any key to continue when ready...
echo.
pause

echo.
echo Step 2: Checking required files...
set MISSING_FILES=0

if not exist "installer\header.bmp" (
    echo ❌ installer\header.bmp missing
    set MISSING_FILES=1
) else (
    echo ✅ installer\header.bmp found
)

if not exist "installer\welcome.bmp" (
    echo ❌ installer\welcome.bmp missing
    set MISSING_FILES=1
) else (
    echo ✅ installer\welcome.bmp found
)

if not exist "installer\installer-icon.ico" (
    echo ❌ installer\installer-icon.ico missing
    set MISSING_FILES=1
) else (
    echo ✅ installer\installer-icon.ico found
)

if not exist "installer\license.txt" (
    echo ❌ installer\license.txt missing
    set MISSING_FILES=1
) else (
    echo ✅ installer\license.txt found
)

if %MISSING_FILES% equ 1 (
    echo.
    echo ❌ Required files missing! Please create the graphics first.
    pause
    exit /b 1
)

echo.
echo Step 3: Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 4: Building Material 3 installer...
npm run build:installer
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Material 3 installer created
echo ==========================================

echo.
echo 📦 Installer files created:
if exist "dist\Beesoft Setup *.exe" (
    dir "dist\Beesoft Setup *.exe" /b
) else (
    echo ❌ No installer found in dist\
)

echo.
echo 🎨 Features of your Material 3 installer:
echo ✅ High-resolution graphics (150x57, 164x314, 256x256)
echo ✅ Material 3 color scheme (Primary: #4f46e5)
echo ✅ Custom welcome and header images
echo ✅ Professional bee-themed graphics
echo ✅ Modern UI with smooth gradients
echo ✅ High DPI support
echo ✅ Custom license agreement
echo ✅ Component selection
echo ✅ Desktop and Start Menu shortcuts
echo ✅ Proper uninstaller
echo ✅ Registry integration
echo ✅ Windows 10/11 compatibility check

echo.
echo 🚀 Your installer is ready for distribution!
echo.
pause