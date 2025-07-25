@echo off
echo Beesoft - Cleanup Script
echo ========================

echo Stopping all related processes...
taskkill /F /IM "electron.exe" /T >nul 2>&1
taskkill /F /IM "chrome.exe" /T >nul 2>&1
taskkill /F /IM "node.exe" /T >nul 2>&1

echo Waiting for processes to close...
timeout /t 3 /nobreak >nul

echo Taking ownership of cache directories...
takeown /f "C:\Users\Ekthar\AppData\Roaming\beesoft" /r /d y >nul 2>&1
icacls "C:\Users\Ekthar\AppData\Roaming\beesoft" /grant %USERNAME%:F /t >nul 2>&1

echo Removing cache directories...
rmdir /s /q "C:\Users\Ekthar\AppData\Roaming\beesoft" >nul 2>&1
rmdir /s /q "C:\Users\Ekthar\WhatsAppProject\.wwebjs_auth" >nul 2>&1
rmdir /s /q "C:\Users\Ekthar\WhatsAppProject\.beesoft-data" >nul 2>&1

echo Cleanup completed!
echo You can now start the application.

pause
