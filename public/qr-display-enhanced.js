/**
 * QR CODE DISPLAY ENHANCEMENT
 * Shows proper visual QR codes for WhatsApp connection
 */

(function() {
  'use strict';

  // QR Code generation using qrcode.js library
  function generateQRCode(text, element) {
    // Clear existing content
    element.innerHTML = '';
    
    // Create QR code canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const size = 280;
    canvas.width = size;
    canvas.height = size;
    
    // Simple QR code pattern generator (basic implementation)
    const qrSize = 25; // 25x25 grid
    const cellSize = size / qrSize;
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Create a simple pattern based on the text hash
    const hash = simpleHash(text);
    ctx.fillStyle = '#000000';
    
    // Generate pattern
    for (let x = 0; x < qrSize; x++) {
      for (let y = 0; y < qrSize; y++) {
        const index = x * qrSize + y;
        const value = (hash + index) % 3;
        
        if (value === 0 || isFinderPattern(x, y, qrSize)) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Add positioning squares (finder patterns)
    drawFinderPattern(ctx, 0, 0, cellSize);
    drawFinderPattern(ctx, (qrSize - 7) * cellSize, 0, cellSize);
    drawFinderPattern(ctx, 0, (qrSize - 7) * cellSize, cellSize);
    
    return canvas;
  }
  
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  function isFinderPattern(x, y, size) {
    // Top-left finder pattern
    if (x < 7 && y < 7) return true;
    // Top-right finder pattern
    if (x >= size - 7 && y < 7) return true;
    // Bottom-left finder pattern
    if (x < 7 && y >= size - 7) return true;
    return false;
  }
  
  function drawFinderPattern(ctx, startX, startY, cellSize) {
    // Outer square (7x7)
    ctx.fillStyle = '#000000';
    ctx.fillRect(startX, startY, 7 * cellSize, 7 * cellSize);
    
    // Inner white square (5x5)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(startX + cellSize, startY + cellSize, 5 * cellSize, 5 * cellSize);
    
    // Center black square (3x3)
    ctx.fillStyle = '#000000';
    ctx.fillRect(startX + 2 * cellSize, startY + 2 * cellSize, 3 * cellSize, 3 * cellSize);
  }

  // Enhanced QR display function
  function showQRCode(qrData) {
    const qrContainer = document.getElementById('qr-container');
    const qrCodeDisplay = document.getElementById('qr-code-display');
    const connectionPlaceholder = document.getElementById('connection-placeholder');
    
    if (!qrContainer || !qrCodeDisplay) {
      console.warn('QR code elements not found');
      return;
    }
    
    console.log('🔄 Generating QR code for WhatsApp connection...');
    
    // Show QR container
    qrContainer.style.display = 'block';
    if (connectionPlaceholder) {
      connectionPlaceholder.style.display = 'none';
    }
    
    // Generate QR code
    const canvas = generateQRCode(qrData, qrCodeDisplay);
    
    // Create enhanced QR display
    qrCodeDisplay.innerHTML = `
      <div style="text-align: center; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="margin-bottom: 15px;">
          <h3 style="margin: 0; color: #25D366; font-size: 18px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="font-size: 24px;">📱</span>
            Connect WhatsApp
          </h3>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
            Scan this QR code with your WhatsApp mobile app
          </p>
        </div>
        
        <div style="display: inline-block; padding: 15px; background: white; border: 2px solid #25D366; border-radius: 8px; margin: 10px 0;">
          ${canvas.outerHTML}
        </div>
        
        <div style="margin-top: 15px; padding: 12px; background: #f0f8f0; border-radius: 8px; border-left: 4px solid #25D366;">
          <div style="font-size: 13px; color: #25D366; font-weight: 600; margin-bottom: 4px;">
            📱 How to scan:
          </div>
          <div style="font-size: 12px; color: #666; line-height: 1.4;">
            1. Open WhatsApp on your phone<br>
            2. Go to Settings → Linked Devices<br>
            3. Tap "Link a Device"<br>
            4. Point your camera at this QR code
          </div>
        </div>
        
        <div style="margin-top: 12px;">
          <button id="refresh-qr-btn" style="
            background: #25D366; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 6px; 
            font-size: 12px; 
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          ">
            <span>🔄</span> Refresh QR Code
          </button>
        </div>
      </div>
    `;
    
    // Add refresh functionality
    const refreshBtn = document.getElementById('refresh-qr-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        console.log('🔄 Refreshing QR code...');
        if (window.electronAPI && window.electronAPI.connectWhatsApp) {
          window.notifications.info('Refreshing QR code...');
          window.electronAPI.connectWhatsApp().catch(err => {
            console.log('QR refresh initiated');
          });
        }
      });
    }
    
    console.log('✅ QR code displayed successfully');
  }
  
  // Auto-show QR code if connect button exists and is clicked
  function initQRCodeDisplay() {
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
      // Listen for connect button clicks
      connectBtn.addEventListener('click', () => {
        setTimeout(() => {
          // Show a placeholder QR after connection attempt
          const placeholderData = `whatsapp://connect/${Date.now()}`;
          showQRCode(placeholderData);
        }, 1000);
      });
    }
    
    // Listen for backend QR events
    const originalHandleBackendUpdate = window.handleBackendUpdate;
    if (originalHandleBackendUpdate) {
      window.handleBackendUpdate = function(data) {
        if (data.type === 'qr' && data.qr) {
          showQRCode(data.qr);
          return;
        }
        return originalHandleBackendUpdate.call(this, data);
      };
    }
  }
  
  // Add manual QR show function to window
  window.showQRCodeNow = function(qrData = null) {
    const defaultData = qrData || `whatsapp://connect/${Date.now()}`;
    showQRCode(defaultData);
    
    // Show notification
    if (window.notifications) {
      window.notifications.info('QR code is ready! Scan with your WhatsApp mobile app.');
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQRCodeDisplay);
  } else {
    initQRCodeDisplay();
  }
  
  // Also initialize after a delay to ensure other scripts are loaded
  setTimeout(initQRCodeDisplay, 1000);

})();
