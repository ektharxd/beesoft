/**
 * COMPREHENSIVE WORKFLOW FIX
 * Fixes Excel upload, campaign button, and updates functionality
 */

(function() {
  'use strict';

  console.log('🔧 Loading Comprehensive Workflow Fix...');

  // Fix Excel File Upload
  function fixExcelUpload() {
    const fileInput = document.getElementById('excelFile');
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileInfo = document.getElementById('file-info');
    
    if (!fileInput || !fileUploadArea) {
      console.warn('Excel upload elements not found, retrying...');
      setTimeout(fixExcelUpload, 200);
      return;
    }

    console.log('📄 Setting up Excel upload fix...');

    // Remove existing event listeners by cloning
    const newFileInput = fileInput.cloneNode(true);
    const newFileUploadArea = fileUploadArea.cloneNode(true);
    
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    fileUploadArea.parentNode.replaceChild(newFileUploadArea, fileUploadArea);

    // File input change handler
    newFileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        console.log('📊 Excel file selected:', file.name);
        processExcelFile(file);
      }
    });

    // Drag and drop handlers
    newFileUploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.add('dragover');
    });

    newFileUploadArea.addEventListener('dragleave', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove('dragover');
    });

    newFileUploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove('dragover');
      
      const files = Array.from(e.dataTransfer.files);
      const excelFile = files.find(file => 
        file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );
      
      if (excelFile) {
        console.log('📊 Excel file dropped:', excelFile.name);
        newFileInput.files = e.dataTransfer.files;
        processExcelFile(excelFile);
      } else {
        showError('Please drop an Excel file (.xlsx or .xls)');
      }
    });

    // Click handler for file selection
    newFileUploadArea.addEventListener('click', function() {
      newFileInput.click();
    });

    function processExcelFile(file) {
      console.log('🔄 Processing Excel file...');
      
      if (!window.XLSX) {
        showError('Excel processing library not loaded. Please refresh the page.');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          // Extract phone numbers from all columns
          const phoneNumbers = [];
          const phoneRegex = /[\+]?[1-9][\d\s\-\(\)]{7,}/g;
          
          jsonData.forEach((row, index) => {
            if (index === 0) return; // Skip header row
            
            row.forEach(cell => {
              if (cell && typeof cell === 'string') {
                const matches = cell.match(phoneRegex);
                if (matches) {
                  matches.forEach(match => {
                    const cleaned = match.replace(/[\s\-\(\)]/g, '');
                    if (cleaned.length >= 8) {
                      phoneNumbers.push(cleaned);
                    }
                  });
                }
              } else if (cell && typeof cell === 'number') {
                const numStr = cell.toString();
                if (numStr.length >= 8) {
                  phoneNumbers.push(numStr);
                }
              }
            });
          });

          const uniqueNumbers = [...new Set(phoneNumbers)];
          
          if (uniqueNumbers.length === 0) {
            showError('No valid phone numbers found in the Excel file.');
            return;
          }

          // Store contacts and update UI
          window.appState.contacts = uniqueNumbers.map((number, index) => ({
            id: index + 1,
            name: `Contact ${index + 1}`,
            phone: number
          }));

          // Update file info display
          if (fileInfo) {
            fileInfo.style.display = 'block';
            fileInfo.innerHTML = `
              <div style="color: #10b981; font-weight: 600;">
                ✅ File loaded successfully!
              </div>
              <div style="margin-top: 4px;">
                <strong>${file.name}</strong> - ${uniqueNumbers.length} contacts found
              </div>
            `;
          }

          // Update upload area
          newFileUploadArea.innerHTML = `
            <span class="material-symbols-outlined file-upload-icon" style="color: #10b981;">check_circle</span>
            <span class="file-upload-text" style="color: #10b981;">File loaded: ${file.name}</span>
            <span class="file-upload-hint">${uniqueNumbers.length} contacts ready</span>
          `;

          // Enable next step
          enableStep('step-compose', 'step-3-indicator');
          
          // Update campaign button state
          updateCampaignButton();

          console.log('✅ Excel processing complete:', uniqueNumbers.length, 'contacts');
          
          if (window.notifications) {
            window.notifications.success(`Excel file loaded! ${uniqueNumbers.length} contacts ready.`);
          }

        } catch (error) {
          console.error('❌ Excel processing error:', error);
          showError('Error processing Excel file: ' + error.message);
        }
      };

      reader.onerror = function() {
        showError('Error reading file. Please try again.');
      };

      reader.readAsArrayBuffer(file);
    }

    function showError(message) {
      if (fileInfo) {
        fileInfo.style.display = 'block';
        fileInfo.innerHTML = `
          <div style="color: #ef4444; font-weight: 600;">
            ❌ ${message}
          </div>
        `;
      }
      
      if (window.notifications) {
        window.notifications.error(message);
      } else {
        alert(message);
      }
    }

    console.log('✅ Excel upload fix applied');
  }

  // Fix Campaign Button
  function fixCampaignButton() {
    const sendButton = document.getElementById('sendButton');
    
    if (!sendButton) {
      console.warn('Campaign button not found, retrying...');
      setTimeout(fixCampaignButton, 200);
      return;
    }

    console.log('🚀 Setting up campaign button fix...');

    function updateCampaignButton() {
      const hasContacts = window.appState?.contacts?.length > 0;
      const hasMessage = document.getElementById('messageText')?.value?.trim().length > 0;
      
      if (hasContacts && hasMessage) {
        sendButton.disabled = false;
        sendButton.classList.remove('btn-disabled');
        sendButton.style.opacity = '1';
        sendButton.style.cursor = 'pointer';
        console.log('✅ Campaign button enabled');
      } else {
        sendButton.disabled = true;
        sendButton.classList.add('btn-disabled');
        sendButton.style.opacity = '0.5';
        sendButton.style.cursor = 'not-allowed';
        console.log('⏸️ Campaign button disabled - missing:', 
          !hasContacts ? 'contacts' : '', 
          !hasMessage ? 'message' : ''
        );
      }
    }

    // Check message text changes
    const messageText = document.getElementById('messageText');
    if (messageText) {
      messageText.addEventListener('input', updateCampaignButton);
      messageText.addEventListener('change', updateCampaignButton);
    }

    // Make updateCampaignButton globally available
    window.updateCampaignButton = updateCampaignButton;

    // Initial update
    updateCampaignButton();

    console.log('✅ Campaign button fix applied');
  }

  // Fix Updates Button
  function fixUpdatesButton() {
    const updatesBtn = document.getElementById('open-updates-modal-btn');
    
    if (!updatesBtn) {
      console.warn('Updates button not found, retrying...');
      setTimeout(fixUpdatesButton, 200);
      return;
    }

    console.log('🔄 Setting up updates button fix...');

    // Remove existing listeners by cloning
    const newUpdatesBtn = updatesBtn.cloneNode(true);
    updatesBtn.parentNode.replaceChild(newUpdatesBtn, updatesBtn);

    newUpdatesBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🔄 Updates button clicked');
      
      // Show updates modal
      if (window.modalSystem) {
        window.modalSystem.show('updates-modal');
      } else if (window.showModalSafe) {
        window.showModalSafe('updates-modal');
      } else {
        // Fallback: show modal directly
        const modal = document.getElementById('updates-modal');
        if (modal) {
          modal.style.display = 'flex';
        } else {
          if (window.notifications) {
            window.notifications.info('Updates feature is loading...');
          } else {
            alert('Updates feature is loading...');
          }
        }
      }
    });

    console.log('✅ Updates button fix applied');
  }

  // Helper function to enable workflow steps
  function enableStep(stepId, indicatorId) {
    const step = document.getElementById(stepId);
    const indicator = document.getElementById(indicatorId);
    
    if (step) {
      step.classList.remove('disabled');
      step.classList.add('active');
    }
    
    if (indicator) {
      indicator.classList.remove('disabled');
      indicator.classList.add('active');
    }
  }

  // Initialize all fixes
  function initializeAllFixes() {
    fixExcelUpload();
    fixCampaignButton();
    fixUpdatesButton();
  }

  // Run fixes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAllFixes);
  } else {
    initializeAllFixes();
  }
  
  // Also run after other scripts load
  setTimeout(initializeAllFixes, 500);
  setTimeout(initializeAllFixes, 1500);
  setTimeout(initializeAllFixes, 3000);

  console.log('✅ Comprehensive Workflow Fix loaded');

})();
