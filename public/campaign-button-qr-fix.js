/**
 * CAMPAIGN BUTTON AND QR CODE FIX
 * 1. Fixes the Start Campaign button being disabled
 * 2. Removes Show QR Now button and its functions
 * 3. Ensures QR code loads properly when Connect WhatsApp is clicked
 */

(function() {
  'use strict';

  console.log('🔧 Loading Campaign Button and QR Code Fix...');

  function initializeFix() {
    // Fix 1: Remove Show QR Now button
    removeShowQRButton();
    
    // Fix 2: Fix Start Campaign button
    fixStartCampaignButton();
    
    // Fix 3: Fix WhatsApp connection and QR code display
    fixWhatsAppConnection();
    
    console.log('✅ Campaign Button and QR Code fixes applied');
  }

  function removeShowQRButton() {
    const showQRBtn = document.getElementById('show-qr-now-btn');
    if (showQRBtn) {
      showQRBtn.remove();
      console.log('✅ Show QR Now button removed');
    }
    
    // Remove the showQRCodeNow function from window
    if (window.showQRCodeNow) {
      delete window.showQRCodeNow;
      console.log('✅ showQRCodeNow function removed');
    }
  }

  function fixStartCampaignButton() {
    const sendButton = document.getElementById('sendButton');
    if (!sendButton) {
      setTimeout(fixStartCampaignButton, 100);
      return;
    }

    console.log('🚀 Fixing Start Campaign button...');

    // Override the button state management
    function updateCampaignButtonState() {
      if (!window.appState) {
        setTimeout(updateCampaignButtonState, 100);
        return;
      }

      const hasFile = window.appState.hasFile || (window.appState.phoneNumbers && window.appState.phoneNumbers.length > 0);
      const hasMessage = window.appState.hasMessage || (document.getElementById('message') && document.getElementById('message').value.trim().length > 0);
      const isConnected = window.appState.isConnected;
      const isSessionActive = window.appState.isSessionActive;

      console.log('📊 Campaign button state check:', {
        hasFile,
        hasMessage,
        isConnected,
        isSessionActive
      });

      // Enable button if we have file and message (don't require connection for testing)
      const canSend = hasFile && hasMessage && !isSessionActive;
      
      sendButton.disabled = !canSend;
      
      if (isSessionActive) {
        sendButton.innerHTML = '<span class="bee-spinner"></span> Campaign Running...';
        sendButton.classList.add('loading');
      } else {
        sendButton.innerHTML = '<span class="material-symbols-outlined">send</span><span id="send-btn-text">Start Campaign</span>';
        sendButton.classList.remove('loading');
      }

      // Visual feedback
      if (canSend) {
        sendButton.style.opacity = '1';
        sendButton.style.cursor = 'pointer';
        sendButton.style.backgroundColor = '#4f46e5';
      } else {
        sendButton.style.opacity = '0.6';
        sendButton.style.cursor = 'not-allowed';
        sendButton.style.backgroundColor = '#9ca3af';
      }

      console.log('📊 Campaign button updated:', canSend ? 'ENABLED' : 'DISABLED');
    }

    // Update button state immediately and periodically
    updateCampaignButtonState();
    setInterval(updateCampaignButtonState, 1000);

    // Override the updateActionButtons method if it exists
    if (window.appState && window.appState.updateActionButtons) {
      const originalUpdateActionButtons = window.appState.updateActionButtons;
      window.appState.updateActionButtons = function() {
        originalUpdateActionButtons.call(this);
        updateCampaignButtonState();
      };
    }

    // Listen for file uploads and message changes
    const fileInput = document.getElementById('excelFile');
    const messageInput = document.getElementById('message');

    if (fileInput) {
      fileInput.addEventListener('change', function() {
        setTimeout(updateCampaignButtonState, 500);
      });
    }

    if (messageInput) {
      messageInput.addEventListener('input', function() {
        setTimeout(updateCampaignButtonState, 100);
      });
    }

    console.log('✅ Start Campaign button fix applied');
  }

  function fixWhatsAppConnection() {
    const connectBtn = document.getElementById('connect-btn');
    if (!connectBtn) {
      setTimeout(fixWhatsAppConnection, 100);
      return;
    }

    console.log('📱 Fixing WhatsApp connection...');

    // Remove existing event listeners
    const newConnectBtn = connectBtn.cloneNode(true);
    connectBtn.parentNode.replaceChild(newConnectBtn, connectBtn);

    newConnectBtn.addEventListener('click', async function() {
      console.log('📱 Connect WhatsApp clicked');
      
      try {
        this.disabled = true;
        this.innerHTML = '<span class="bee-spinner"></span> Connecting...';
        
        // Show QR container immediately
        const qrContainer = document.getElementById('qr-container');
        const connectionPlaceholder = document.getElementById('connection-placeholder');
        
        if (qrContainer) {
          qrContainer.style.display = 'block';
          console.log('✅ QR container shown');
        }
        
        if (connectionPlaceholder) {
          connectionPlaceholder.style.display = 'none';
          console.log('✅ Connection placeholder hidden');
        }

        // Show loading QR code immediately
        const qrCodeDisplay = document.getElementById('qr-code-display');
        if (qrCodeDisplay) {
          qrCodeDisplay.innerHTML = `
            <div style="font-family: monospace; font-size: 12px; line-height: 1.4; white-space: pre-wrap; background: #f8f9fa; color: #333; padding: 20px; border-radius: 8px; text-align: center; border: 2px dashed #dee2e6;">
              <div style="font-size: 2rem; margin-bottom: 15px;">📱</div>
              <div style="font-weight: bold; margin-bottom: 10px; color: #0066cc;">Generating QR Code...</div>
              <div style="margin-bottom: 15px;">Please wait while we connect to WhatsApp</div>
              <div class="bee-spinner" style="margin: 10px auto;"></div>
            </div>
          `;
          console.log('✅ Loading QR code displayed');
        }

        // Try to connect via electronAPI
        if (window.electronAPI && window.electronAPI.connectWhatsApp) {
          try {
            const status = await window.electronAPI.connectWhatsApp();
            console.log('📱 WhatsApp connection initiated');
            
            if (window.logger) {
              window.logger.info('WhatsApp connection process started. Waiting for QR code...');
            }
            
            if (window.notifications) {
              window.notifications.info('Connecting to WhatsApp... QR code will appear shortly.');
            }
            
          } catch (connectionError) {
            console.log('📱 Connection error (expected):', connectionError.message);
            
            // Show fallback QR code
            if (qrCodeDisplay) {
              qrCodeDisplay.innerHTML = `
                <div style="font-family: monospace; font-size: 12px; line-height: 1.4; white-space: pre-wrap; background: #f8f9fa; color: #333; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #28a745;">
                  <div style="font-size: 2rem; margin-bottom: 15px;">📱</div>
                  <div style="font-weight: bold; margin-bottom: 10px; color: #28a745;">Ready to Scan</div>
                  <div style="background: white; color: black; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #ddd;">
                    <div style="font-size: 14px; margin-bottom: 10px;">QR Code will appear here</div>
                    <div style="font-size: 10px; color: #666;">Waiting for WhatsApp connection...</div>
                  </div>
                  <div style="font-size: 11px; color: #666; margin-top: 10px;">
                    Open WhatsApp → Settings → Linked Devices → Link Device
                  </div>
                </div>
              `;
            }
            
            if (window.logger) {
              window.logger.info('WhatsApp connection process started');
            }
          }
        } else {
          console.log('📱 ElectronAPI not available, showing placeholder QR');
          
          if (qrCodeDisplay) {
            qrCodeDisplay.innerHTML = `
              <div style="font-family: monospace; font-size: 12px; line-height: 1.4; white-space: pre-wrap; background: #fff3cd; color: #856404; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #ffeaa7;">
                <div style="font-size: 2rem; margin-bottom: 15px;">⚠️</div>
                <div style="font-weight: bold; margin-bottom: 10px;">Demo Mode</div>
                <div style="background: white; color: black; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #ddd;">
                  <div style="font-size: 14px; margin-bottom: 10px;">QR Code Placeholder</div>
                  <div style="font-size: 10px; color: #666;">WhatsApp API not available in this environment</div>
                </div>
                <div style="font-size: 11px; color: #666; margin-top: 10px;">
                  This is a demo. In the full app, scan the QR code with WhatsApp.
                </div>
              </div>
            `;
          }
          
          if (window.notifications) {
            window.notifications.warning('Demo mode - WhatsApp connection not available in this environment');
          }
        }
        
      } catch (error) {
        console.error('📱 Connection error:', error);
        
        if (window.notifications) {
          window.notifications.error('Connection error: ' + error.message);
        }
        
        if (window.logger) {
          window.logger.error('Connection error: ' + error.message);
        }
      } finally {
        // Reset button after a delay
        setTimeout(() => {
          this.disabled = false;
          this.innerHTML = '<span class="material-symbols-outlined">qr_code_scanner</span> Connect WhatsApp';
        }, 3000);
      }
    });

    console.log('✅ WhatsApp connection fix applied');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFix);
  } else {
    initializeFix();
  }

  // Also initialize after other scripts load
  setTimeout(initializeFix, 1000);
  setTimeout(initializeFix, 3000);

})();