// Enhanced license status checking with proper permanent license support
console.log('License status fix script loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('Setting up enhanced license status checking');
  
  // Override the checkTrial function with better license handling
  window.checkTrial = async function() {
    console.log('Enhanced checkTrial called');
    
    try {
      const status = await fetchDeviceStatus();
      console.log('Device status:', status);
      
      if (!status || !status.subscription) {
        showPage('trial-lock-page');
        const trialInfo = document.getElementById('trial-info');
        if (trialInfo) trialInfo.textContent = 'This software is not activated. Please contact an administrator.';
        return;
      }
      
      const { subscription } = status;
      if (!subscription.active) {
        showPage('trial-lock-page');
        const trialInfo = document.getElementById('trial-info');
        if (trialInfo) trialInfo.textContent = 'No active subscription. Please contact admin.';
        return;
      }
      
      // Handle permanent license
      if (subscription.type === 'permanent') {
        showPage('welcome-page');
        const statusAlert = document.getElementById('status-alert');
        if (statusAlert) {
          statusAlert.textContent = '🔓 Permanently Activated - Full Access';
          statusAlert.className = 'notification success';
          statusAlert.style.display = 'block';
          statusAlert.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          statusAlert.style.color = 'white';
          statusAlert.style.fontWeight = 'bold';
          
          // Auto-hide after 5 seconds
          setTimeout(() => { 
            if (statusAlert) statusAlert.style.display = 'none'; 
          }, 5000);
        }
        console.log('Permanent license detected - full access granted');
        return;
      }
      
      // Handle trial license
      if (subscription.type === 'trial') {
        const now = Date.now();
        const start = new Date(subscription.start).getTime();
        const expiry = start + (subscription.days * 24 * 60 * 60 * 1000);
        
        if (now > expiry) {
          showPage('trial-lock-page');
          const trialInfo = document.getElementById('trial-info');
          if (trialInfo) trialInfo.textContent = `Trial expired on ${new Date(expiry).toLocaleDateString()}. Please contact admin for activation.`;
          return;
        }
        
        const daysLeft = Math.ceil((expiry - now) / (24 * 60 * 60 * 1000));
        const hoursLeft = Math.ceil((expiry - now) / (60 * 60 * 1000));
        
        showPage('welcome-page');
        const statusAlert = document.getElementById('status-alert');
        if (statusAlert) {
          let message = '';
          let alertClass = 'notification success';
          
          if (daysLeft <= 1) {
            // Less than 1 day left
            if (hoursLeft <= 1) {
              message = `⚠️ Trial expires in less than 1 hour!`;
              alertClass = 'notification error';
            } else {
              message = `⚠️ Trial expires in ${hoursLeft} hours!`;
              alertClass = 'notification warning';
            }
          } else if (daysLeft <= 3) {
            // 3 days or less
            message = `⚠️ Trial expires in ${daysLeft} days`;
            alertClass = 'notification warning';
          } else {
            // More than 3 days
            message = `✅ Trial active - ${daysLeft} days remaining`;
            alertClass = 'notification success';
          }
          
          statusAlert.textContent = message;
          statusAlert.className = alertClass;
          statusAlert.style.display = 'block';
          
          // Auto-hide after 8 seconds for trial messages
          setTimeout(() => { 
            if (statusAlert) statusAlert.style.display = 'none'; 
          }, 8000);
        }
        console.log(`Trial license detected - ${daysLeft} days remaining`);
        return;
      }
      
      // Unknown subscription type
      showPage('trial-lock-page');
      const trialInfo = document.getElementById('trial-info');
      if (trialInfo) trialInfo.textContent = 'Unknown subscription type. Please contact admin.';
      
    } catch (error) {
      console.error('Error checking license status:', error);
      showPage('trial-lock-page');
      const trialInfo = document.getElementById('trial-info');
      if (trialInfo) trialInfo.textContent = 'Error checking license status. Please try again.';
    }
  };
  
  // Helper function to fetch device status (reuse existing or create new)
  async function fetchDeviceStatus() {
    try {
      // Try to use existing getDeviceId function
      let machineId = '';
      if (window.electronAPI && typeof window.electronAPI.getDeviceId === 'function') {
        machineId = window.electronAPI.getDeviceId();
      } else {
        // Fallback to localStorage
        machineId = localStorage.getItem('beesoft_device_id') || 'unknown';
      }
      
      const res = await fetch(`http://localhost:3001/api/device-status?machineId=${encodeURIComponent(machineId)}`);
      if (!res.ok) {
        console.error('Failed to fetch device status:', res.status, res.statusText);
        return null;
      }
      return await res.json();
    } catch (error) {
      console.error('Error fetching device status:', error);
      return null;
    }
  }
  
  // Helper function to show page (reuse existing or create new)
  function showPage(pageId) {
    console.log('Showing page:', pageId);
    const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
    pages.forEach(id => {
      const page = document.getElementById(id);
      if (page) page.style.display = 'none';
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.style.display = 'flex';
  }
  
  console.log('Enhanced license status checking set up successfully');
});