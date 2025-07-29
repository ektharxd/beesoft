const { contextBridge, ipcRenderer } = require('electron');

console.log('preload.js loaded');
window.testPreload = true;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // WhatsApp connection methods
  connectWhatsApp: () => ipcRenderer.invoke('connect-whatsapp'),
  connectWhatsAppFallback: () => ipcRenderer.invoke('connect-whatsapp-fallback'),
  forceInitClient: () => ipcRenderer.invoke('force-init-client'),
  restartWhatsApp: () => ipcRenderer.invoke('restart-whatsapp'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  clearAuth: () => ipcRenderer.invoke('clear-auth'),

  // Session management
  startSession: (data) => ipcRenderer.invoke('start-session', data),
  pauseSession: () => ipcRenderer.invoke('pause-session'),
  continueSession: () => ipcRenderer.invoke('continue-session'),
  stopSession: () => ipcRenderer.invoke('stop-session'),
  getSessionStatus: () => ipcRenderer.invoke('get-session-status'),
  getAntiBanStatus: () => ipcRenderer.invoke('get-antiban-status'),

  // File operations
  selectImage: () => ipcRenderer.invoke('select-image'),

  // Update management
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (asset) => ipcRenderer.invoke('download-update', asset),
  openReleasePage: () => ipcRenderer.invoke('open-release-page'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  formatReleaseNotes: (body) => ipcRenderer.invoke('format-release-notes', body),
  formatFileSize: (bytes) => ipcRenderer.invoke('format-file-size', bytes),
  getPlatformAsset: (assets) => ipcRenderer.invoke('get-platform-asset', assets),

  // Testing
  testSentryError: () => ipcRenderer.invoke('test-sentry-error'),

  // Event listeners
  onUpdate: (callback) => ipcRenderer.on('update', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Device info (for compatibility)
  getDeviceId: () => {
    // Generate a persistent device ID
    let deviceId = localStorage.getItem('beesoft_device_id');
    if (!deviceId) {
      // Create a more stable device ID based on system info
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const language = navigator.language;
      const screenRes = `${screen.width}x${screen.height}`;
      
      // Create a hash-like ID from system properties
      const systemInfo = `${userAgent}-${platform}-${language}-${screenRes}`;
      const hash = systemInfo.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      deviceId = `beesoft-${Math.abs(hash)}-${Date.now()}`;
      localStorage.setItem('beesoft_device_id', deviceId);
    }
    return deviceId;
  }
});

console.log('electronAPI bridge exposed successfully');
