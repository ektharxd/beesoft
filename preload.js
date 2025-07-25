const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // WhatsApp connection
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

    // File selection
    selectImage: () => ipcRenderer.invoke('select-image'),
    
    // Event listeners
    onUpdate: (callback) => {
        ipcRenderer.on('update', (event, data) => callback(data));
    },
    
    // WhatsApp Web specific events
    onWhatsAppQR: (callback) => {
        ipcRenderer.on('whatsapp-qr', (event, qr) => callback(qr));
    },
    onWhatsAppLoading: (callback) => {
        ipcRenderer.on('whatsapp-loading', (event, data) => callback(data));
    }
});