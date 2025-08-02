; Custom NSIS installer script for Beesoft
; This script adds custom behavior to the installer

!macro customInstall
  ; Create a custom message during installation
  DetailPrint "Installing Beesoft WhatsApp Automation Tool..."
  DetailPrint "Please ensure WhatsApp is installed on your phone for full functionality."
  
  ; Create additional shortcuts
  CreateShortCut "$DESKTOP\Beesoft.lnk" "$INSTDIR\Beesoft.exe" "" "$INSTDIR\resources\app\public\Bee.ico" 0
  
  ; Add to Windows Start Menu
  CreateDirectory "$SMPROGRAMS\Beesoft"
  CreateShortCut "$SMPROGRAMS\Beesoft\Beesoft.lnk" "$INSTDIR\Beesoft.exe" "" "$INSTDIR\resources\app\public\Bee.ico" 0
  CreateShortCut "$SMPROGRAMS\Beesoft\Uninstall Beesoft.lnk" "$INSTDIR\Uninstall Beesoft.exe"
!macroend

!macro customUnInstall
  ; Remove additional shortcuts
  Delete "$DESKTOP\Beesoft.lnk"
  Delete "$SMPROGRAMS\Beesoft\Beesoft.lnk"
  Delete "$SMPROGRAMS\Beesoft\Uninstall Beesoft.lnk"
  RMDir "$SMPROGRAMS\Beesoft"
  
  ; Remove application data folder (optional - user choice)
  MessageBox MB_YESNO "Do you want to remove all application data including settings and authentication?" IDNO +3
  RMDir /r "$LOCALAPPDATA\Beesoft"
  RMDir /r "$APPDATA\Beesoft"
!macroend

!macro customHeader
  ; Custom header for installer
  !echo "Building Beesoft Installer..."
!macroend
