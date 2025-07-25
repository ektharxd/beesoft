; ===============================================
; 🐝 Beesoft Minimal Professional Installer
; Clean, modern NSIS installer without custom graphics
; ===============================================

!define PRODUCT_NAME "Beesoft"
!define PRODUCT_VERSION "1.0.0-beta.1"
!define PRODUCT_PUBLISHER "Ekthar"
!define PRODUCT_WEB_SITE "https://github.com/ektharxd/beesoft"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\Beesoft.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

; ===============================================
; Modern UI 2 Configuration
; ===============================================
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "WinVer.nsh"

; ===============================================
; Installer Settings
; ===============================================
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "Beesoft-Setup-${PRODUCT_VERSION}.exe"
InstallDir "$PROGRAMFILES64\Beesoft"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show
RequestExecutionLevel admin
SetCompressor /SOLID lzma
SetCompressorDictSize 32

; ===============================================
; Version Information
; ===============================================
VIProductVersion "1.0.0.1"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "Comments" "Smart WhatsApp Automation Tool"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "LegalCopyright" "© 2024 ${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileDescription" "${PRODUCT_NAME} Installer"
VIAddVersionKey "FileVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "InternalName" "${PRODUCT_NAME}"
VIAddVersionKey "OriginalFilename" "Beesoft-Setup-${PRODUCT_VERSION}.exe"

; ===============================================
; Clean Professional UI Configuration
; ===============================================

; High DPI Support
ManifestDPIAware true
ManifestSupportedOS all

; Modern UI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install-blue.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall-blue.ico"

; Use default NSIS graphics (clean, professional)
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_RIGHT

; Clean welcome page
!define MUI_WELCOMEPAGE_TITLE "Welcome to ${PRODUCT_NAME} Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of ${PRODUCT_NAME}.$\r$\n$\r$\n${PRODUCT_NAME} is a smart WhatsApp automation tool that helps you send bulk messages, manage campaigns, and automate WhatsApp communication with advanced anti-ban protection.$\r$\n$\r$\nIt is recommended that you close all other applications before starting Setup. This will make it possible to update relevant system files without having to reboot your computer.$\r$\n$\r$\nClick Next to continue."

; Clean finish page
!define MUI_FINISHPAGE_TITLE "Completing the ${PRODUCT_NAME} Setup Wizard"
!define MUI_FINISHPAGE_TEXT "${PRODUCT_NAME} has been installed on your computer.$\r$\n$\r$\nClick Finish to close this wizard."
!define MUI_FINISHPAGE_RUN "$INSTDIR\Beesoft.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Run ${PRODUCT_NAME}"
!define MUI_FINISHPAGE_LINK "Visit the ${PRODUCT_NAME} website"
!define MUI_FINISHPAGE_LINK_LOCATION "${PRODUCT_WEB_SITE}"

; Directory page
!define MUI_DIRECTORYPAGE_TEXT_TOP "Setup will install ${PRODUCT_NAME} in the following folder. To install in a different folder, click Browse and select another folder. Click Next to continue."

; Components page
!define MUI_COMPONENTSPAGE_TEXT_TOP "Check the components you want to install and uncheck the components you do not want to install. Click Next to continue."

; ===============================================
; Pages
; ===============================================
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "license.txt"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; ===============================================
; Languages
; ===============================================
!insertmacro MUI_LANGUAGE "English"

; ===============================================
; Installer Sections
; ===============================================

Section "!Core Application" SecCore
  SectionIn RO  ; Read-only (required)
  
  SetOutPath "$INSTDIR"
  SetOverwrite ifnewer
  
  ; Main application files
  File /r "..\dist\win-unpacked\*.*"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\Beesoft.exe"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall ${PRODUCT_NAME}.lnk" "$INSTDIR\uninst.exe"
  
  ; Register application
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\Beesoft.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\Beesoft.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoRepair" 1
  
  ; Calculate installed size
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "EstimatedSize" "$0"
  
  WriteUninstaller "$INSTDIR\uninst.exe"
SectionEnd

Section "Desktop Shortcut" SecDesktop
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\Beesoft.exe"
SectionEnd

Section "Quick Launch Shortcut" SecQuickLaunch
  CreateShortCut "$QUICKLAUNCH\${PRODUCT_NAME}.lnk" "$INSTDIR\Beesoft.exe"
SectionEnd

Section /o "Associate .xlsx files" SecAssoc
  WriteRegStr HKCR ".xlsx\OpenWithProgids" "Beesoft.xlsx" ""
  WriteRegStr HKCR "Beesoft.xlsx" "" "Beesoft Contact List"
  WriteRegStr HKCR "Beesoft.xlsx\DefaultIcon" "" "$INSTDIR\Beesoft.exe,0"
  WriteRegStr HKCR "Beesoft.xlsx\shell\open\command" "" '"$INSTDIR\Beesoft.exe" "%1"'
SectionEnd

; ===============================================
; Section Descriptions
; ===============================================
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCore} "Core ${PRODUCT_NAME} application files (required)"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "Create a shortcut on the desktop"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecQuickLaunch} "Create a shortcut in the Quick Launch toolbar"
  !insertmacro MUI_DESCRIPTION_TEXT ${SecAssoc} "Associate Excel files (.xlsx) with ${PRODUCT_NAME} for easy contact list opening"
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; ===============================================
; Installer Functions
; ===============================================

Function .onInit
  ; Check Windows version
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_OK|MB_ICONSTOP "This application requires Windows 10 or later."
    Abort
  ${EndIf}
  
  ; Check if already installed
  ReadRegStr $R0 ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString"
  StrCmp $R0 "" done
  
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
  "${PRODUCT_NAME} is already installed. $\n$\nClick 'OK' to remove the previous version or 'Cancel' to cancel this upgrade." \
  IDOK uninst
  Abort
  
uninst:
  ClearErrors
  ExecWait '$R0 _?=$INSTDIR'
  
  IfErrors no_remove_uninstaller done
    no_remove_uninstaller:
  
done:
FunctionEnd

Function .onInstSuccess
  ; Optional: Add Windows Firewall exception
  ; ExecWait 'netsh advfirewall firewall add rule name="${PRODUCT_NAME}" dir=in action=allow program="$INSTDIR\Beesoft.exe"'
  
  ; Optional: Register with Windows Security Center
  ; WriteRegStr HKLM "SOFTWARE\Microsoft\Security Center\Provider\Av" "${PRODUCT_NAME}" "$INSTDIR\Beesoft.exe"
FunctionEnd

; ===============================================
; Uninstaller Section
; ===============================================

Section Uninstall
  ; Remove shortcuts
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall ${PRODUCT_NAME}.lnk"
  Delete "$QUICKLAUNCH\${PRODUCT_NAME}.lnk"
  
  ; Remove directories
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
  
  ; Remove file associations
  DeleteRegKey HKCR ".xlsx\OpenWithProgids\Beesoft.xlsx"
  DeleteRegKey HKCR "Beesoft.xlsx"
  
  ; Remove application files
  RMDir /r "$INSTDIR"
  
  ; Ask about user data
  MessageBox MB_YESNO|MB_ICONQUESTION \
  "Do you want to remove all ${PRODUCT_NAME} user data and settings?$\n$\nThis includes WhatsApp authentication data, contact lists, and application preferences." \
  IDNO skip_userdata
  
  RMDir /r "$LOCALAPPDATA\${PRODUCT_NAME}"
  RMDir /r "$APPDATA\${PRODUCT_NAME}"
  
skip_userdata:
  
  ; Remove registry keys
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  
  SetAutoClose true
SectionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 \
  "Are you sure you want to completely remove ${PRODUCT_NAME} and all of its components?" \
  IDYES +2
  Abort
FunctionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK \
  "${PRODUCT_NAME} was successfully removed from your computer."
FunctionEnd