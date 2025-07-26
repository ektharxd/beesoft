// Debug script to test IPC communication
console.log('🔍 Debug script loaded');

// Test if we're in Electron
console.log('Environment check:', {
  isElectron: typeof window !== 'undefined' && window.process && window.process.type,
  hasElectronAPI: !!window.electronAPI,
  userAgent: navigator.userAgent
});

// Wait for DOM and test IPC
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 DOM loaded, checking electronAPI...');
  
  if (window.electronAPI) {
    console.log('✅ electronAPI is available');
    console.log('📋 Available methods:', Object.keys(window.electronAPI));
    
    // Test a simple IPC call
    if (window.electronAPI.connectWhatsApp) {
      console.log('✅ connectWhatsApp method is available');
    } else {
      console.error('❌ connectWhatsApp method is NOT available');
    }
  } else {
    console.error('❌ electronAPI is NOT available');
    
    // Check if preload script ran
    console.log('Checking for preload indicators...');
    console.log('window.electronAPI:', window.electronAPI);
    console.log('window.__ELECTRON_PRELOAD__:', window.__ELECTRON_PRELOAD__);
  }
});

// Add a button to test IPC manually
setTimeout(() => {
  const testButton = document.createElement('button');
  testButton.textContent = 'Test IPC Connection';
  testButton.style.position = 'fixed';
  testButton.style.top = '10px';
  testButton.style.left = '10px';
  testButton.style.zIndex = '99999';
  testButton.style.background = 'red';
  testButton.style.color = 'white';
  testButton.style.padding = '10px';
  testButton.style.border = 'none';
  testButton.style.borderRadius = '5px';
  
  testButton.onclick = async () => {
    console.log('🧪 Testing IPC connection...');
    
    if (window.electronAPI && window.electronAPI.connectWhatsApp) {
      try {
        console.log('📞 Calling connectWhatsApp...');
        const result = await window.electronAPI.connectWhatsApp();
        console.log('✅ IPC call successful:', result);
        alert('IPC call successful: ' + JSON.stringify(result));
      } catch (error) {
        console.error('❌ IPC call failed:', error);
        alert('IPC call failed: ' + error.message);
      }
    } else {
      console.error('❌ electronAPI.connectWhatsApp not available');
      alert('electronAPI.connectWhatsApp not available');
    }
  };
  
  document.body.appendChild(testButton);
}, 1000);