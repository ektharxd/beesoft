// Fixed admin actions handlers
function setupAdminActionsHandlers() {
  setTimeout(() => {
    // Show device ID as a chip
    let deviceId = '';
    if (window.electronAPI) {
      deviceId = window.electronAPI.getDeviceId();
      console.log('Device ID from electronAPI:', deviceId);
      const chip = document.getElementById('device-id-chip');
      if (chip) chip.textContent = deviceId || 'Device ID not available';
    } else {
      console.log('window.electronAPI not available');
    }

    // Register device button handler
    const registerBtn = document.getElementById('register-device-btn');
    if (registerBtn) {
      registerBtn.onclick = async () => {
        try {
          // Gather device details
          const version = (window.electronAPI && window.electronAPI.getAppVersion) ? 
            (await window.electronAPI.getAppVersion()).version : 'unknown';
          const platform = navigator.platform || 'unknown';
          const hostname = window.location.hostname || 'unknown';
          const payload = { 
            machineId: deviceId, 
            username: 'admin', 
            version, 
            platform, 
            hostname 
          };
          
          console.log('Register device payload:', payload);
          
          const res = await fetch('http://localhost:3001/api/devices?register=1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          const result = await res.json();
          const resultElement = document.getElementById('admin-action-result');
          
          if (res.ok) {
            resultElement.textContent = result.message || 'Device registered successfully.';
            resultElement.style.color = '#059669';
          } else if (res.status === 409) {
            // Device already registered
            resultElement.textContent = result.message || 'Device already registered.';
            resultElement.style.color = '#f59e0b';
          } else {
            resultElement.textContent = result.error || 'Failed to register device.';
            resultElement.style.color = '#dc2626';
          }
        } catch (error) {
          const resultElement = document.getElementById('admin-action-result');
          resultElement.textContent = 'Network error: ' + error.message;
          resultElement.style.color = '#dc2626';
        }
      };
    }

    // Remove device button handler
    const removeBtn = document.getElementById('remove-device-btn');
    if (removeBtn) {
      removeBtn.onclick = async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/devices?remove=1&machineId=${encodeURIComponent(deviceId)}`, {
            method: 'DELETE'
          });
          
          const result = await res.json();
          const resultElement = document.getElementById('admin-action-result');
          
          if (res.ok) {
            resultElement.textContent = result.message || 'Device removed successfully.';
            resultElement.style.color = '#059669';
          } else if (res.status === 404) {
            // Device not found
            resultElement.textContent = result.message || 'Device is not registered.';
            resultElement.style.color = '#f59e0b';
          } else {
            resultElement.textContent = result.error || 'Failed to remove device.';
            resultElement.style.color = '#dc2626';
          }
        } catch (error) {
          const resultElement = document.getElementById('admin-action-result');
          resultElement.textContent = 'Network error: ' + error.message;
          resultElement.style.color = '#dc2626';
        }
      };
    }

    // Activate trial button handler
    const activateTrialBtn = document.getElementById('activate-trial-btn');
    if (activateTrialBtn) {
      activateTrialBtn.onclick = async () => {
        try {
          const days = parseInt(document.getElementById('trial-days-input').value);
          if (!days) {
            alert('Enter trial days');
            return;
          }
          
          const res = await fetch('http://localhost:3001/api/assign-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              machineId: deviceId, 
              type: 'trial', 
              days 
            })
          });
          
          const result = await res.json();
          const resultElement = document.getElementById('admin-action-result');
          
          if (res.ok) {
            resultElement.textContent = result.message || 'Trial activated successfully.';
            resultElement.style.color = '#059669';
          } else {
            resultElement.textContent = result.error || 'Failed to activate trial.';
            resultElement.style.color = '#dc2626';
          }
        } catch (error) {
          const resultElement = document.getElementById('admin-action-result');
          resultElement.textContent = 'Network error: ' + error.message;
          resultElement.style.color = '#dc2626';
        }
      };
    }

    // Permanent activation button handler
    const activatePermBtn = document.getElementById('activate-perm-btn');
    if (activatePermBtn) {
      activatePermBtn.onclick = async () => {
        try {
          const key = document.getElementById('perm-key-input').value.trim();
          if (!key) {
            alert('Enter activation key');
            return;
          }
          
          const res = await fetch('http://localhost:3001/api/assign-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              machineId: deviceId, 
              type: 'subscription', 
              days: 9999, 
              key 
            })
          });
          
          const result = await res.json();
          const resultElement = document.getElementById('admin-action-result');
          
          if (res.ok) {
            resultElement.textContent = result.message || 'Permanent activation successful.';
            resultElement.style.color = '#059669';
          } else {
            resultElement.textContent = result.error || 'Failed to activate permanently.';
            resultElement.style.color = '#dc2626';
          }
        } catch (error) {
          const resultElement = document.getElementById('admin-action-result');
          resultElement.textContent = 'Network error: ' + error.message;
          resultElement.style.color = '#dc2626';
        }
      };
    }
  }, 200);
}

// Export for use in main app
if (typeof window !== 'undefined') {
  window.setupAdminActionsHandlers = setupAdminActionsHandlers;
}