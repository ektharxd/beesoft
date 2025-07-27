// ==========================================================================
// CONNECTION MONITORING AND CAMPAIGN CONFIRMATION
// ==========================================================================

// Initialize connection monitoring
function initializeConnectionMonitoring() {
    let connectionCheckInterval;
    let lastConnectionStatus = false;

    // Check connection status every 5 seconds
    function startConnectionMonitoring() {
        if (connectionCheckInterval) {
            clearInterval(connectionCheckInterval);
        }

        connectionCheckInterval = setInterval(async () => {
            if (window.electronAPI && window.electronAPI.checkWhatsAppConnection) {
                try {
                    const isConnected = await window.electronAPI.checkWhatsAppConnection();
                    
                    // Only update if status changed
                    if (isConnected !== lastConnectionStatus) {
                        lastConnectionStatus = isConnected;
                        
                        if (!isConnected && window.appState.isConnected) {
                            // WhatsApp was connected but now disconnected
                            window.appState.updateConnectionStatus(false);
                            window.logger.error('WhatsApp connection lost - detected by monitoring');
                            window.notifications.warning('WhatsApp connection lost. Please reconnect.');
                            
                            // Reset QR container
                            const qrContainer = document.getElementById('qr-container');
                            const connectionPlaceholder = document.getElementById('connection-placeholder');
                            if (qrContainer) qrContainer.style.display = 'none';
                            if (connectionPlaceholder) connectionPlaceholder.style.display = 'block';
                        } else if (isConnected && !window.appState.isConnected) {
                            // WhatsApp reconnected
                            window.appState.updateConnectionStatus(true);
                            window.logger.success('WhatsApp connection restored');
                            window.notifications.success('WhatsApp connection restored!');
                        }
                    }
                } catch (error) {
                    // If we can't check connection, assume disconnected
                    if (window.appState.isConnected) {
                        window.appState.updateConnectionStatus(false);
                        window.logger.error('WhatsApp connection check failed - assuming disconnected');
                    }
                }
            }
        }, 5000); // Check every 5 seconds
    }

    // Start monitoring when app loads
    startConnectionMonitoring();

    // Also monitor for window focus events (user might close WhatsApp while app is minimized)
    window.addEventListener('focus', () => {
        // Force a connection check when window regains focus
        setTimeout(async () => {
            if (window.electronAPI && window.electronAPI.checkWhatsAppConnection) {
                try {
                    const isConnected = await window.electronAPI.checkWhatsAppConnection();
                    if (isConnected !== window.appState.isConnected) {
                        window.appState.updateConnectionStatus(isConnected);
                        if (!isConnected) {
                            window.logger.error('WhatsApp disconnected - detected on window focus');
                            window.notifications.warning('WhatsApp is disconnected. Please reconnect.');
                        }
                    }
                } catch (error) {
                    console.log('Connection check failed on focus:', error);
                }
            }
        }, 1000);
    });
}

// Enhanced campaign confirmation modal
function showCampaignConfirmationModal(uniqueNumbers, message, imagePath, onConfirm) {
    const hasImage = imagePath ? ' with image' : '';
    const messagePreview = message.length > 100 ? message.substring(0, 100) + '...' : message;
    
    const bodyHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 3rem; margin-bottom: 12px;">🚀</div>
            <p style="color: var(--text-tertiary); margin-bottom: 20px;">
                Review your campaign details before starting
            </p>
        </div>
        
        <div style="background: var(--surface-secondary); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h4 style="margin: 0 0 12px 0; color: var(--text-primary);">📊 Campaign Details</h4>
            <div style="display: grid; gap: 8px; font-size: 0.9rem;">
                <div><strong>Recipients:</strong> ${uniqueNumbers.length} contacts</div>
                <div><strong>Message:</strong> "${messagePreview}"</div>
                <div><strong>Attachments:</strong> ${hasImage || 'None'}</div>
            </div>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 1.2rem;">⚠️</span>
                <strong style="color: #92400e;">Important Notice</strong>
            </div>
            <p style="margin: 0; font-size: 0.85rem; color: #92400e;">
                Once started, the campaign will begin sending messages immediately. 
                Please ensure your message and contact list are correct before proceeding.
            </p>
        </div>
    `;

    showModal('Start Campaign Confirmation', bodyHTML, {
        okText: 'Yes, Start Campaign',
        cancelText: 'Cancel'
    }).then((confirmed) => {
        if (confirmed && onConfirm) {
            onConfirm();
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Start connection monitoring after a short delay to ensure app is initialized
    setTimeout(() => {
        if (typeof initializeConnectionMonitoring === 'function') {
            initializeConnectionMonitoring();
        }
    }, 2000);
});