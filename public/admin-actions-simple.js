// Enhanced admin actions with direct page redirect
console.log('Admin actions fix script loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, setting up admin actions fix');
  
  // Override the broken admin actions function
  window.showAdminActionsWindow = function() {
    console.log('showAdminActionsWindow called');
    
    const modalHtml = `
      <div style="padding: 16px; max-width: 500px;">
        <h2 style="margin-bottom: 18px;">Admin Actions - Device Activation</h2>
        <div class="form-group">
          <label>Device ID</label>
          <div id="device-id-chip" style="display:inline-block;padding:8px 16px;background:#f3f4f6;color:#222;border-radius:16px;font-weight:600;font-size:1rem;margin-bottom:8px;user-select:all;"></div>
        </div>
        
        <div class="form-group" style="margin-top: 18px;">
          <h3 style="margin-bottom: 12px; color: #4f46e5;">Device Registration Details</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label for="device-name-input" class="form-label required">Full Name</label>
              <input id="device-name-input" type="text" class="form-input" placeholder="Enter full name" required />
            </div>
            <div>
              <label for="device-email-input" class="form-label required">Email Address</label>
              <input id="device-email-input" type="email" class="form-input" placeholder="Enter email" required />
            </div>
          </div>
          <div style="margin-top: 12px;">
            <label for="device-mobile-input" class="form-label required">Mobile Number</label>
            <input id="device-mobile-input" type="tel" class="form-input" placeholder="Enter mobile number with country code" required />
          </div>
          <div style="display: flex; gap: 12px; margin-top: 12px;">
            <button id="register-device-btn" class="btn btn-primary" style="flex: 1;">Register Device</button>
            <button id="remove-device-btn" class="btn btn-danger" style="flex: 1;">Remove Device</button>
          </div>
        </div>
        
        <div class="form-group" style="margin-top: 18px;">
          <h3 style="margin-bottom: 12px; color: #059669;">Trial Activation</h3>
          <label for="trial-days-input">Trial Days</label>
          <input id="trial-days-input" type="number" class="form-input" min="1" max="365" placeholder="Enter days" />
          <button id="activate-trial-btn" class="btn btn-success" style="margin-top: 8px; width: 100%;">Activate Trial</button>
        </div>
        
        <div class="form-group" style="margin-top: 18px;">
          <h3 style="margin-bottom: 12px; color: #f59e0b;">Permanent Activation</h3>
          <label for="perm-key-input">Activation Key</label>
          <input id="perm-key-input" type="text" class="form-input" placeholder="Enter activation key (e.g., TEST-1234-ABCD-5678)" style="font-family: monospace;" />
          <button id="activate-perm-btn" class="btn btn-warning" style="margin-top: 8px; width: 100%;">Permanent Activate</button>
          <div style="font-size: 0.85rem; color: #6b7280; margin-top: 4px;">
            ⚠️ Valid keys: TEST-1234-ABCD-5678, DEMO-9876-WXYZ-4321, PERM-5555-AAAA-9999
          </div>
        </div>
        
        <div id="admin-action-result" style="margin-top: 16px; font-weight: bold; padding: 12px; border-radius: 6px; background: #f8f9fa; min-height: 20px; display: none;"></div>
      </div>
    `;
    
    if (typeof showModal === 'function') {
      showModal('Admin Actions', modalHtml, { okText: 'Close', cancelText: '' });
      
      // Setup handlers after modal is shown
      setTimeout(() => {
        setupFixedAdminHandlers();
      }, 200);
    } else {
      console.error('showModal function not available');
    }
  };
  
  function setupFixedAdminHandlers() {
    console.log('Setting up fixed admin handlers');
    
    // Get device ID
    let deviceId = '';
    if (window.electronAPI && typeof window.electronAPI.getDeviceId === 'function') {
      deviceId = window.electronAPI.getDeviceId();
      console.log('Device ID from electronAPI:', deviceId);
      const chip = document.getElementById('device-id-chip');
      if (chip) {
        chip.textContent = deviceId || 'Device ID not available';
      }
    } else {
      console.error('electronAPI.getDeviceId not available');
      deviceId = 'fallback-device-id';
    }

    // Helper function to show result message
    function showResult(message, type = 'info') {
      const resultElement = document.getElementById('admin-action-result');
      if (resultElement) {
        resultElement.textContent = message;
        resultElement.style.display = 'block';
        
        // Set colors based on type
        switch(type) {
          case 'success':
            resultElement.style.color = '#059669';
            resultElement.style.backgroundColor = '#d1fae5';
            resultElement.style.border = '1px solid #059669';
            break;
          case 'warning':
            resultElement.style.color = '#d97706';
            resultElement.style.backgroundColor = '#fef3c7';
            resultElement.style.border = '1px solid #d97706';
            break;
          case 'error':
            resultElement.style.color = '#dc2626';
            resultElement.style.backgroundColor = '#fee2e2';
            resultElement.style.border = '1px solid #dc2626';
            break;
          default:
            resultElement.style.color = '#374151';
            resultElement.style.backgroundColor = '#f3f4f6';
            resultElement.style.border = '1px solid #d1d5db';
        }
        
        console.log('Result message:', message, 'Type:', type);
      } else {
        console.error('admin-action-result element not found');
      }
    }

    // Helper function to redirect to welcome page after successful activation
    function forceShowWelcomePage() {
      console.log('Force showing welcome page after successful activation');
      
      setTimeout(() => {
        // Close the modal first
        const modal = document.getElementById('modal');
        if (modal) {
          modal.style.display = 'none';
          console.log('Modal closed');
        }
        
        // Wait a bit then call checkTrial to properly handle the redirect
        setTimeout(() => {
          console.log('Calling window.checkTrial to handle redirect');
          
          if (typeof window.checkTrial === 'function') {
            // Call the fixed checkTrial function which will properly check the backend
            // and redirect to the welcome page if activation was successful
            window.checkTrial();
          } else {
            console.error('window.checkTrial function not available');
            
            // Fallback: manually show welcome page
            console.log('Fallback: manually showing welcome page');
            const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
            pages.forEach(id => {
              const page = document.getElementById(id);
              if (page) page.style.display = 'none';
            });
            
            const welcomePage = document.getElementById('welcome-page');
            if (welcomePage) {
              welcomePage.style.display = 'flex';
              
              // Update status alert
              const statusAlert = document.getElementById('status-alert');
              if (statusAlert) {
                statusAlert.textContent = '✅ Trial activated successfully!';
                statusAlert.className = 'notification success';
                statusAlert.style.display = 'block';
                
                setTimeout(() => { 
                  if (statusAlert) statusAlert.style.display = 'none'; 
                }, 5000);
              }
            }
          }
        }, 500);
      }, 1000);
    }

    // Register device button
    const registerBtn = document.getElementById('register-device-btn');
    if (registerBtn) {
      registerBtn.onclick = async () => {
        console.log('Register device button clicked');
        
        // Get the required form values
        const name = document.getElementById('device-name-input').value.trim();
        const email = document.getElementById('device-email-input').value.trim();
        const mobile = document.getElementById('device-mobile-input').value.trim();
        
        // Validate required fields
        if (!name || !email || !mobile) {
          showResult('Please fill in all required fields: Name, Email, and Mobile Number.', 'error');
          return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showResult('Please enter a valid email address.', 'error');
          return;
        }
        
        // Validate mobile number (basic check for digits and length)
        const mobileRegex = /^[\+]?[1-9][\d]{7,14}$/;
        if (!mobileRegex.test(mobile.replace(/[\s\-\(\)]/g, ''))) {
          showResult('Please enter a valid mobile number with country code.', 'error');
          return;
        }
        
        showResult('Registering device...', 'info');
        
        try {
          let version = 'unknown';
          if (window.electronAPI && typeof window.electronAPI.getAppVersion === 'function') {
            try {
              const versionResult = await window.electronAPI.getAppVersion();
              version = versionResult.version || 'unknown';
            } catch (e) {
              console.warn('Failed to get app version:', e);
            }
          }
          
          const platform = navigator.platform || 'unknown';
          const hostname = window.location.hostname || 'unknown';
          const payload = { 
            machineId: deviceId, 
            username: 'admin', 
            name: name,
            email: email,
            mobile: mobile,
            version, 
            platform, 
            hostname 
          };
          
          console.log('Register device payload:', payload);
          
          const res = await fetch('http://34.10.132.60:3001/api/devices?register=1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          console.log('Register response status:', res.status);
          
          const result = await res.json();
          console.log('Register response data:', result);
          
          if (res.ok) {
            showResult(`Device registered successfully for ${name} (${email})`, 'success');
            
            // Clear the form
            document.getElementById('device-name-input').value = '';
            document.getElementById('device-email-input').value = '';
            document.getElementById('device-mobile-input').value = '';
          } else if (res.status === 409) {
            // Device already registered
            showResult(result.message || 'Device already registered!', 'warning');
          } else {
            showResult(result.error || 'Failed to register device.', 'error');
          }
        } catch (error) {
          console.error('Register device error:', error);
          showResult('Network error: ' + error.message, 'error');
        }
      };
    }

    // Remove device button
    const removeBtn = document.getElementById('remove-device-btn');
    if (removeBtn) {
      removeBtn.onclick = async () => {
        console.log('Remove device button clicked');
        showResult('Removing device...', 'info');
        
        try {
          const res = await fetch(`http://34.10.132.60:3001/api/devices?remove=1&machineId=${encodeURIComponent(deviceId)}`, {
            method: 'DELETE'
          });
          
          console.log('Remove response status:', res.status);
          
          const result = await res.json();
          console.log('Remove response data:', result);
          
          if (res.ok) {
            showResult(result.message || 'Device removed successfully!', 'success');
          } else if (res.status === 404) {
            // Device not found
            showResult(result.message || 'Device is not registered!', 'warning');
          } else {
            showResult(result.error || 'Failed to remove device.', 'error');
          }
        } catch (error) {
          console.error('Remove device error:', error);
          showResult('Network error: ' + error.message, 'error');
        }
      };
    }

    // Activate trial button
    const activateTrialBtn = document.getElementById('activate-trial-btn');
    if (activateTrialBtn) {
      activateTrialBtn.onclick = async () => {
        console.log('Activate trial button clicked');
        
        const daysInput = document.getElementById('trial-days-input');
        const days = parseInt(daysInput ? daysInput.value : '');
        
        if (!days || days < 1) {
          showResult('Please enter a valid number of days (1-365)', 'error');
          return;
        }
        
        showResult('Activating trial...', 'info');
        
        try {
          const res = await fetch('http://34.10.132.60:3001/api/assign-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              machineId: deviceId, 
              type: 'trial', 
              days 
            })
          });
          
          console.log('Trial activation response status:', res.status);
          console.log('Trial activation response headers:', res.headers);
          
          const result = await res.json();
          console.log('Trial activation response data:', result);
          
          if (res.ok && result.success === true) {
            showResult(result.message || `Trial activated for ${days} days!`, 'success');
            console.log('Trial activation successful, redirecting to welcome page');
            // Force redirect to welcome screen after successful activation
            forceShowWelcomePage();
          } else {
            console.log('Trial activation failed:', result);
            showResult(result.error || 'Failed to activate trial.', 'error');
          }
        } catch (error) {
          console.error('Trial activation error:', error);
          showResult('Network error: ' + error.message, 'error');
        }
      };
    }

    // Permanent activation button
    const activatePermBtn = document.getElementById('activate-perm-btn');
    if (activatePermBtn) {
      activatePermBtn.onclick = async () => {
        console.log('Permanent activation button clicked');
        
        const keyInput = document.getElementById('perm-key-input');
        const key = keyInput ? keyInput.value.trim().toUpperCase() : '';
        
        if (!key) {
          showResult('Please enter an activation key', 'error');
          return;
        }
        
        // Strict key format validation
        const keyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!keyPattern.test(key)) {
          showResult('Invalid key format. Use format: ABCD-1234-EFGH-5678', 'error');
          return;
        }
        
        showResult('Validating activation key...', 'info');
        
        try {
          const res = await fetch('http://34.10.132.60:3001/api/assign-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              machineId: deviceId, 
              type: 'permanent', 
              days: 9999, 
              key 
            })
          });
          
          console.log('Permanent activation response status:', res.status);
          
          const result = await res.json();
          console.log('Permanent activation response data:', result);
          
          if (res.ok && result.success === true) {
            showResult(result.message || 'Permanent activation successful!', 'success');
            console.log('Permanent activation successful, redirecting to welcome page');
            // Force redirect to welcome screen after successful activation
            forceShowWelcomePage();
          } else {
            console.log('Permanent activation failed:', result);
            showResult(result.error || 'Failed to activate permanently.', 'error');
          }
        } catch (error) {
          console.error('Permanent activation error:', error);
          showResult('Network error: ' + error.message, 'error');
        }
      };
    }
    
    console.log('All admin handlers set up successfully');
  }
});

console.log('Admin actions script setup complete');