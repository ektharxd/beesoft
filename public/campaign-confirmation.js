// ==========================================================================
// CAMPAIGN CONFIRMATION ENHANCEMENT
// ==========================================================================

// Override the original startSession function to add confirmation
document.addEventListener('DOMContentLoaded', function() {
    // Wait for app to initialize
    setTimeout(() => {
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            // Remove existing event listeners and add our enhanced one
            const newSendButton = sendButton.cloneNode(true);
            sendButton.parentNode.replaceChild(newSendButton, sendButton);
            
            newSendButton.addEventListener('click', enhancedStartSession);
        }
    }, 3000);
});

async function enhancedStartSession() {
    if (!window.appState.isConnected) {
        window.notifications.error('Please connect to WhatsApp first');
        return;
    }

    if (!window.appState.hasFile || !window.appState.hasMessage) {
        window.notifications.error('Please upload a contact file and write a message');
        return;
    }

    try {
        const fileInput = document.getElementById('excelFile');
        const messageInput = document.getElementById('message');
        
        if (!fileInput.files[0] || !messageInput.value.trim()) {
            window.notifications.error('Missing required data');
            return;
        }

        // Process file data first to get contact count
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const phoneNumbers = [];
                data.forEach(row => {
                    row.forEach(cell => {
                        if (cell && FormValidator.validatePhoneNumber(String(cell))) {
                            phoneNumbers.push(String(cell));
                        }
                    });
                });

                const uniqueNumbers = [...new Set(phoneNumbers)];
                
                if (uniqueNumbers.length === 0) {
                    window.notifications.error('No valid phone numbers found');
                    return;
                }

                // Show confirmation dialog
                const message = messageInput.value.trim();
                const hasImage = window.appState.selectedImagePath ? ' with image' : '';
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
                }).then(async (confirmed) => {
                    if (confirmed) {
                        // User confirmed, start the campaign
                        const sessionData = {
                            numbers: uniqueNumbers,
                            message: message,
                            imagePath: window.appState.selectedImagePath
                        };

                        if (window.electronAPI && window.electronAPI.startSession) {
                            window.appState.isSessionActive = true;
                            window.appState.updateWorkflowUI();
                            
                            try {
                                const response = await window.electronAPI.startSession(sessionData);
                                window.logger.success(`Campaign started with ${uniqueNumbers.length} contacts`);
                                window.notifications.success('Campaign started successfully!');
                            } catch (error) {
                                window.appState.isSessionActive = false;
                                window.appState.updateWorkflowUI();
                                window.notifications.error('Error starting session: ' + error.message);
                                window.logger.error('Session start error: ' + error.message);
                            }
                        } else {
                            window.appState.isSessionActive = false;
                            window.appState.updateWorkflowUI();
                            window.notifications.error('Session management not available');
                        }
                    }
                });
            } catch (error) {
                window.notifications.error('Error processing file: ' + error.message);
                window.logger.error('File processing error: ' + error.message);
            }
        };

        reader.readAsArrayBuffer(file);
    } catch (error) {
        window.notifications.error('Error preparing campaign: ' + error.message);
    }
}