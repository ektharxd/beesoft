/**
 * EXCEL UPLOAD AND CAMPAIGN START FIX
 * This script ensures Excel file upload and campaign start work correctly
 * regardless of other script conflicts or timing issues.
 */

(function() {
  'use strict';

  console.log('🔧 Loading Excel Upload and Campaign Start Fix...');

  // Wait for DOM and app initialization
  function initializeExcelCampaignFix() {
    // Ensure window.appState exists and has phoneNumbers array
    if (!window.appState) {
      setTimeout(initializeExcelCampaignFix, 100);
      return;
    }

    if (!window.appState.phoneNumbers) {
      window.appState.phoneNumbers = [];
    }

    // Fix Excel file upload
    fixExcelUpload();
    
    // Fix campaign start
    fixCampaignStart();
    
    console.log('✅ Excel upload and campaign start fixes applied');
  }

  function fixExcelUpload() {
    const fileInput = document.getElementById('excelFile');
    const fileUploadArea = document.getElementById('file-upload-area');
    
    if (!fileInput || !fileUploadArea) {
      setTimeout(fixExcelUpload, 100);
      return;
    }

    // Remove existing event listeners and add our fixed ones
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);

    const newFileUploadArea = fileUploadArea.cloneNode(true);
    fileUploadArea.parentNode.replaceChild(newFileUploadArea, fileUploadArea);

    // Add fixed event listeners
    newFileInput.addEventListener('change', handleFileSelect);
    newFileUploadArea.addEventListener('click', () => newFileInput.click());
    
    newFileUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      newFileUploadArea.classList.add('drag-over');
    });

    newFileUploadArea.addEventListener('dragleave', () => {
      newFileUploadArea.classList.remove('drag-over');
    });

    newFileUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      newFileUploadArea.classList.remove('drag-over');
      
      if (e.dataTransfer.files.length > 0) {
        newFileInput.files = e.dataTransfer.files;
        handleFileSelect();
      }
    });

    function handleFileSelect() {
      const file = newFileInput.files[0];
      if (!file) return;

      // Validate file
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      const validExtensions = ['.xlsx', '.xls'];
      
      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );

      if (!hasValidType && !hasValidExtension) {
        if (window.notifications) {
          window.notifications.error('Please select a valid Excel file (.xlsx or .xls)');
        } else {
          alert('Please select a valid Excel file (.xlsx or .xls)');
        }
        newFileInput.value = '';
        return;
      }

      // Update UI
      const textEl = newFileUploadArea.querySelector('.file-upload-text');
      const hintEl = newFileUploadArea.querySelector('.file-upload-hint');
      if (textEl) textEl.textContent = file.name;
      if (hintEl) hintEl.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      
      const fileInfo = document.getElementById('file-info');
      if (fileInfo) {
        fileInfo.style.display = 'block';
        fileInfo.innerHTML = `<strong>File loaded:</strong> ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      }

      // Process file
      processExcelFile(file);
    }

    function processExcelFile(file) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          if (!window.XLSX) {
            throw new Error('XLSX library not loaded');
          }

          const workbook = window.XLSX.read(e.target.result, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Extract phone numbers
          const phoneNumbers = [];
          data.forEach(row => {
            row.forEach(cell => {
              if (cell && validatePhoneNumber(String(cell))) {
                phoneNumbers.push(String(cell));
              }
            });
          });

          // Remove duplicates
          const uniqueNumbers = [...new Set(phoneNumbers)];
          
          if (uniqueNumbers.length === 0) {
            window.appState.hasFile = false;
            window.appState.phoneNumbers = [];
            window.appState.contactCount = 0;
            if (window.notifications) {
              window.notifications.error('No valid phone numbers found in the file');
            } else {
              alert('No valid phone numbers found in the file');
            }
            return;
          }

          // Update state
          window.appState.hasFile = true;
          window.appState.contactCount = uniqueNumbers.length;
          window.appState.phoneNumbers = uniqueNumbers;
          
          if (window.appState.updateStep) {
            window.appState.updateStep(Math.max(window.appState.currentStep || 1, 3));
          }
          
          if (window.appState.updateStats) {
            window.appState.updateStats({ total: uniqueNumbers.length });
          }

          if (window.appState.updateWorkflowUI) {
            window.appState.updateWorkflowUI();
          }

          if (window.notifications) {
            window.notifications.success(`Found ${uniqueNumbers.length} valid phone numbers`);
          }
          
          if (window.logger) {
            window.logger.info(`Loaded ${uniqueNumbers.length} contacts from ${file.name}`);
          }

          console.log('✅ Excel file processed successfully:', uniqueNumbers.length, 'contacts');

        } catch (error) {
          window.appState.hasFile = false;
          window.appState.phoneNumbers = [];
          window.appState.contactCount = 0;
          
          const errorMsg = 'Error reading Excel file: ' + error.message;
          if (window.notifications) {
            window.notifications.error(errorMsg);
          } else {
            alert(errorMsg);
          }
          
          if (window.logger) {
            window.logger.error('File processing error: ' + error.message);
          }
          
          console.error('Excel processing error:', error);
        }
      };

      reader.onerror = () => {
        const errorMsg = 'Error reading file';
        if (window.notifications) {
          window.notifications.error(errorMsg);
        } else {
          alert(errorMsg);
        }
      };

      reader.readAsArrayBuffer(file);
    }

    function validatePhoneNumber(phone) {
      // Remove all non-digit characters
      const cleaned = phone.replace(/\D/g, '');
      // Check if it's a valid length (10-15 digits)
      return cleaned.length >= 10 && cleaned.length <= 15;
    }

    console.log('✅ Excel upload fix applied');
  }

  function fixCampaignStart() {
    const sendButton = document.getElementById('sendButton');
    
    if (!sendButton) {
      setTimeout(fixCampaignStart, 100);
      return;
    }

    // Remove existing event listeners and add our fixed one
    sendButton.onclick = null;
    
    // Remove all event listeners by cloning
    const newSendButton = sendButton.cloneNode(true);
    sendButton.parentNode.replaceChild(newSendButton, sendButton);

    // Add our fixed event listener
    newSendButton.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      await startCampaignFixed();
    });

    async function startCampaignFixed() {
      console.log('🚀 Starting campaign with fixed logic...');

      // Check connection
      if (!window.appState.isConnected) {
        const errorMsg = 'Please connect to WhatsApp first';
        if (window.notifications) {
          window.notifications.error(errorMsg);
        } else {
          alert(errorMsg);
        }
        return;
      }

      // Check if we have file and message
      if (!window.appState.hasFile || !window.appState.hasMessage) {
        const errorMsg = 'Please upload a contact file and write a message';
        if (window.notifications) {
          window.notifications.error(errorMsg);
        } else {
          alert(errorMsg);
        }
        return;
      }

      // Check phone numbers and message
      const messageInput = document.getElementById('message');
      if (!window.appState.phoneNumbers || window.appState.phoneNumbers.length === 0 || !messageInput || !messageInput.value.trim()) {
        const errorMsg = 'Missing required data - please upload an Excel file and write a message';
        if (window.notifications) {
          window.notifications.error(errorMsg);
        } else {
          alert(errorMsg);
        }
        return;
      }

      try {
        // Use already-parsed phone numbers from appState
        const uniqueNumbers = window.appState.phoneNumbers;
        const message = messageInput.value.trim();
        const hasImage = window.appState.selectedImagePath ? ' with image' : '';
        const messagePreview = message.length > 100 ? message.substring(0, 100) + '...' : message;
        
        // Show confirmation dialog
        const confirmMessage = `Are you sure you want to start the campaign?\n\n` +
          `• ${uniqueNumbers.length} contacts will receive your message\n` +
          `• Message: "${messagePreview}"\n` +
          `${hasImage ? '• An image will be attached\n' : ''}` +
          `\nThis action cannot be undone once started.`;

        const confirmed = confirm(confirmMessage);
        
        if (confirmed) {
          // Start session after confirmation
          const sessionData = {
            numbers: uniqueNumbers,
            message: message,
            imagePath: window.appState.selectedImagePath
          };

          if (window.electronAPI && window.electronAPI.startSession) {
            window.appState.isSessionActive = true;
            
            if (window.appState.updateWorkflowUI) {
              window.appState.updateWorkflowUI();
            }
            
            try {
              const response = await window.electronAPI.startSession(sessionData);
              
              const successMsg = `Campaign started with ${uniqueNumbers.length} contacts`;
              if (window.logger) {
                window.logger.success(successMsg);
              }
              if (window.notifications) {
                window.notifications.success('Campaign started successfully!');
              }
              
              console.log('✅ Campaign started successfully:', uniqueNumbers.length, 'contacts');
              
            } catch (error) {
              window.appState.isSessionActive = false;
              if (window.appState.updateWorkflowUI) {
                window.appState.updateWorkflowUI();
              }
              
              const errorMsg = 'Error starting session: ' + error.message;
              if (window.notifications) {
                window.notifications.error(errorMsg);
              } else {
                alert(errorMsg);
              }
              
              if (window.logger) {
                window.logger.error('Session start error: ' + error.message);
              }
              
              console.error('Campaign start error:', error);
            }
          } else {
            window.appState.isSessionActive = false;
            if (window.appState.updateWorkflowUI) {
              window.appState.updateWorkflowUI();
            }
            
            const errorMsg = 'Session management not available - please ensure the app is running in the correct environment';
            if (window.notifications) {
              window.notifications.error(errorMsg);
            } else {
              alert(errorMsg);
            }
          }
        }
      } catch (error) {
        const errorMsg = 'Error starting campaign: ' + error.message;
        if (window.notifications) {
          window.notifications.error(errorMsg);
        } else {
          alert(errorMsg);
        }
        console.error('Campaign error:', error);
      }
    }

    console.log('✅ Campaign start fix applied');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExcelCampaignFix);
  } else {
    initializeExcelCampaignFix();
  }

  // Also initialize after a delay to ensure all other scripts have loaded
  setTimeout(initializeExcelCampaignFix, 3000);

})();