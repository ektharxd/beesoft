@echo off
echo Cleaning public folder...

cd public

echo Removing unnecessary files...
del /q "admin.html" 2>nul
del /q "antiban-controls.js" 2>nul
del /q "app-campaign-handlers.js" 2>nul
del /q "app-enhanced.js" 2>nul
del /q "app-modern.js" 2>nul
del /q "app_fixed.js" 2>nul
del /q "components-modern.js" 2>nul
del /q "debug.html" 2>nul
del /q "index-backup.html" 2>nul
del /q "index-modern.html" 2>nul
del /q "splash.html" 2>nul
del /q "style-components.css" 2>nul
del /q "style-modern.css" 2>nul
del /q "test.html" 2>nul

cd ..

echo Keeping only core files:
echo - index.html
echo - app.js
echo - style.css
echo - Bee.ico

echo Done!
pause