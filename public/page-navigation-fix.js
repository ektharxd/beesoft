// Page Navigation Fix for Beesoft
// Fixes the issue where welcome page shows on main UI and trial lock shows on welcome UI

console.log('Page navigation fix loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('Setting up page navigation fix');
  
  // Override the showPage function with proper page management
  window.showPage = function(pageId) {
    console.log(`Showing page: ${pageId}`);
    
    // Define all possible page IDs
    const allPages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
    
    // Hide all pages first
    allPages.forEach(id => {
      const pages = document.querySelectorAll(`#${id}`);
      pages.forEach(page => {
        page.style.display = 'none';
        page.classList.remove('flex');
        page.classList.remove('active');
      });
    });
    
    // Show only the requested page
    const targetPages = document.querySelectorAll(`#${pageId}`);
    if (targetPages.length > 0) {
      targetPages.forEach(targetPage => {
        targetPage.style.display = 'flex';
        targetPage.classList.add('flex');
        targetPage.classList.add('active');
      });
      console.log(`Successfully showed page: ${pageId}`);
    } else {
      console.error(`Page not found: ${pageId}`);
    }
    
    // Update URL hash for navigation
    if (pageId === 'welcome-page') {
      window.history.replaceState(null, '', '#welcome');
    } else if (pageId === 'main-app-page') {
      window.history.replaceState(null, '', '#app');
    } else if (pageId === 'trial-lock-page') {
      window.history.replaceState(null, '', '#trial-lock');
    }
  };
  
  // Enhanced checkTrial function with better page management
  const originalCheckTrial = window.checkTrial;
  window.checkTrial = async function() {
    console.log('Enhanced checkTrial called');
    
    try {
      // Get device ID
      let machineId = '';
      if (window.electronAPI && typeof window.electronAPI.getDeviceId === 'function') {
        machineId = window.electronAPI.getDeviceId();
      } else {
        machineId = localStorage.getItem('beesoft_device_id') || 'unknown';
      }
      
      if (!machineId || machineId === 'unknown') {
        console.log('No device ID available, showing trial lock page');
        window.showPage('trial-lock-page');
        const trialInfo = document.getElementById('trial-info');
        if (trialInfo) trialInfo.textContent = 'Device not registered. Please contact administrator.';
        return;
      }
      
      // Fetch device status
      const res = await fetch(`http://34.10.132.60:3001/api/device-status?machineId=${encodeURIComponent(machineId)}`);
      if (!res.ok) {
        console.log('Device status fetch failed, showing trial lock page');
        window.showPage('trial-lock-page');
        const trialInfo = document.getElementById('trial-info');
        if (trialInfo) trialInfo.textContent = 'Unable to verify device status. Please contact administrator.';
        return;
      }
      
      const status = await res.json();
      console.log('Device status:', status);
      
      if (!status || !status.subscription) {
        console.log('No subscription found, showing trial lock page');
        window.showPage('trial-lock-page');
        const trialInfo = document.getElementById('trial-info');
        if (trialInfo) trialInfo.textContent = 'This software is not activated. Please contact an administrator.';
        return;
      }
      
      const { subscription } = status;
      console.log('Subscription details:', subscription);
      
      if (!subscription.active) {
        console.log('Subscription not active, showing trial lock page');
        window.showPage('trial-lock-page');
        const trialInfo = document.getElementById('trial-info');
        if (trialInfo) trialInfo.textContent = 'No active subscription. Please contact admin.';
        return;
      }
      
      // Handle permanent license
      if (subscription.type === 'permanent') {
        console.log('Permanent subscription detected, showing welcome page');
        window.showPage('welcome-page');
        
        const statusAlert = document.getElementById('status-alert');
        if (statusAlert) {
          statusAlert.textContent = '🔓 Permanently Activated - Full Access';
          statusAlert.className = 'notification success';
          statusAlert.style.display = 'block';
          statusAlert.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          statusAlert.style.color = 'white';
          statusAlert.style.fontWeight = 'bold';
          
          setTimeout(() => { 
            if (statusAlert) statusAlert.style.display = 'none'; 
          }, 5000);
        }
        return;
      }
      
      // Handle trial license
      if (subscription.type === 'trial') {
        const now = Date.now();
        let expiry;
        
        if (subscription.expires) {
          expiry = new Date(subscription.expires).getTime();
        } else if (subscription.start && subscription.days) {
          const start = new Date(subscription.start).getTime();
          expiry = start + (subscription.days * 24 * 60 * 60 * 1000);
        } else {
          console.log('Invalid trial format, showing trial lock page');
          window.showPage('trial-lock-page');
          const trialInfo = document.getElementById('trial-info');
          if (trialInfo) trialInfo.textContent = 'Invalid trial configuration. Please contact admin.';
          return;
        }
        
        if (now > expiry) {
          console.log('Trial expired, showing trial lock page');
          window.showPage('trial-lock-page');
          const trialInfo = document.getElementById('trial-info');
          if (trialInfo) trialInfo.textContent = `Trial expired on ${new Date(expiry).toLocaleDateString()}. Please contact admin for activation.`;
          return;
        }
        
        const daysLeft = Math.ceil((expiry - now) / (24 * 60 * 60 * 1000));
        const hoursLeft = Math.ceil((expiry - now) / (60 * 60 * 1000));
        
        console.log(`Trial active with ${daysLeft} days remaining, showing welcome page`);
        window.showPage('welcome-page');
        
        const statusAlert = document.getElementById('status-alert');
        if (statusAlert) {
          let message = '';
          let alertClass = 'notification success';
          
          if (daysLeft <= 1) {
            if (hoursLeft <= 1) {
              message = `⚠️ Trial expires in less than 1 hour!`;
              alertClass = 'notification error';
            } else {
              message = `⚠️ Trial expires in ${hoursLeft} hours!`;
              alertClass = 'notification warning';
            }
          } else if (daysLeft <= 3) {
            message = `⚠️ Trial expires in ${daysLeft} days`;
            alertClass = 'notification warning';
          } else {
            message = `✅ Trial active - ${daysLeft} days remaining`;
            alertClass = 'notification success';
          }
          
          statusAlert.textContent = message;
          statusAlert.className = alertClass;
          statusAlert.style.display = 'block';
          
          setTimeout(() => { 
            if (statusAlert) statusAlert.style.display = 'none'; 
          }, 8000);
        }
        return;
      }
      
      // Unknown subscription type
      console.log('Unknown subscription type, showing trial lock page');
      window.showPage('trial-lock-page');
      const trialInfo = document.getElementById('trial-info');
      if (trialInfo) trialInfo.textContent = 'Unknown subscription type. Please contact admin.';
      
    } catch (error) {
      console.error('Error in enhanced checkTrial:', error);
      window.showPage('trial-lock-page');
      const trialInfo = document.getElementById('trial-info');
      if (trialInfo) trialInfo.textContent = 'Error checking license status. Please try again.';
    }
  };
  
  // Fix the "Get Started" button to properly navigate to main app
  const getStartedBtn = document.getElementById('get-started-btn');
  if (getStartedBtn) {
    // Remove existing event listeners
    const newBtn = getStartedBtn.cloneNode(true);
    getStartedBtn.parentNode.replaceChild(newBtn, getStartedBtn);
    
    // Add proper navigation
    newBtn.addEventListener('click', function() {
      console.log('Get Started button clicked');
      
      // Check if terms are accepted
      const termsCheckbox = document.getElementById('accept-terms-checkbox');
      if (!termsCheckbox || !termsCheckbox.checked) {
        alert('Please accept the Terms and Conditions to continue.');
        return;
      }
      
      // Navigate to main app
      console.log('Navigating to main app');
      window.showPage('main-app-page');
      
      // Initialize main app features if needed
      if (typeof initializeTotalMessagesCounter === 'function') {
        setTimeout(initializeTotalMessagesCounter, 500);
      }
    });
  }
  
  // Fix the "Back to Welcome" button
  const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
  if (backToWelcomeBtn) {
    // Remove existing event listeners
    const newBackBtn = backToWelcomeBtn.cloneNode(true);
    backToWelcomeBtn.parentNode.replaceChild(newBackBtn, backToWelcomeBtn);
    
    // Add proper navigation
    newBackBtn.addEventListener('click', function() {
      console.log('Back to Welcome button clicked');
      window.showPage('welcome-page');
    });
  }
  
  // Handle browser navigation (back/forward buttons)
  window.addEventListener('hashchange', function() {
    const hash = window.location.hash;
    if (hash === '#welcome') {
      window.showPage('welcome-page');
    } else if (hash === '#app') {
      window.showPage('main-app-page');
    } else if (hash === '#trial-lock') {
      window.showPage('trial-lock-page');
    }
  });
  
  // Initial page setup based on URL hash
  const initialHash = window.location.hash;
  if (initialHash === '#app') {
    window.showPage('main-app-page');
  } else if (initialHash === '#trial-lock') {
    window.showPage('trial-lock-page');
  } else {
    // Default to checking trial status
    setTimeout(() => {
      if (typeof window.checkTrial === 'function') {
        window.checkTrial();
      } else {
        window.showPage('welcome-page');
      }
    }, 100);
  }
  
  console.log('Page navigation fix setup complete');
});