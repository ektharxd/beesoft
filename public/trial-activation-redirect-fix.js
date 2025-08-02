// Trial Activation Redirect Fix
// Ensures immediate redirect to welcome page after successful trial activation
console.log('Trial activation redirect fix loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('Setting up trial activation redirect fix');
  
  // Override the forceShowWelcomePage function to provide immediate redirect
  window.forceShowWelcomePage = function() {
    console.log('Force showing welcome page after successful activation - IMMEDIATE REDIRECT');
    
    // Close any open modals immediately
    const modal = document.getElementById('modal');
    if (modal) {
      modal.style.display = 'none';
      console.log('Modal closed');
    }
    
    // Close modal overlay if it exists
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.style.display = 'none';
      console.log('Modal overlay closed');
    }
    
    // Immediately show welcome page
    console.log('Immediately showing welcome page');
    const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
    pages.forEach(id => {
      const page = document.getElementById(id);
      if (page) {
        page.style.display = 'none';
      }
    });
    
    const welcomePage = document.getElementById('welcome-page');
    if (welcomePage) {
      welcomePage.style.display = 'flex';
      console.log('Welcome page displayed successfully');
      
      // Update status alert with success message
      const statusAlert = document.getElementById('status-alert');
      if (statusAlert) {
        statusAlert.textContent = '✅ Trial activated successfully! You can now use the application.';
        statusAlert.className = 'notification success';
        statusAlert.style.display = 'block';
        statusAlert.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        statusAlert.style.color = 'white';
        statusAlert.style.fontWeight = 'bold';
        statusAlert.style.padding = '12px 16px';
        statusAlert.style.borderRadius = '8px';
        statusAlert.style.marginBottom = '16px';
        statusAlert.style.textAlign = 'center';
        statusAlert.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
        
        // Auto-hide after 6 seconds
        setTimeout(() => { 
          if (statusAlert) {
            statusAlert.style.display = 'none';
          }
        }, 6000);
        
        console.log('Success alert displayed');
      }
    } else {
      console.error('Welcome page element not found');
    }
    
    // Call checkTrial after a short delay to ensure backend state is properly synced
    setTimeout(() => {
      console.log('Calling window.checkTrial to sync backend state');
      if (typeof window.checkTrial === 'function') {
        window.checkTrial();
      } else {
        console.warn('window.checkTrial function not available for sync');
      }
    }, 1000);
  };
  
  // Also enhance the trial activation success handling
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    
    // Intercept trial activation requests
    if (url && url.includes('/api/assign-subscription') && options && options.method === 'POST') {
      console.log('Intercepting trial activation request');
      
      return originalFetch.apply(this, args).then(response => {
        // Clone the response to read it without consuming it
        const responseClone = response.clone();
        
        if (response.ok) {
          responseClone.json().then(result => {
            if (result.success === true && options.body) {
              try {
                const requestData = JSON.parse(options.body);
                if (requestData.type === 'trial') {
                  console.log('Trial activation successful, triggering immediate redirect');
                  
                  // Small delay to allow the success message to be shown first
                  setTimeout(() => {
                    if (typeof window.forceShowWelcomePage === 'function') {
                      window.forceShowWelcomePage();
                    }
                  }, 500);
                }
              } catch (e) {
                console.warn('Could not parse request body for trial activation check');
              }
            }
          }).catch(e => {
            console.warn('Could not parse response for trial activation check');
          });
        }
        
        return response;
      });
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('Trial activation redirect fix setup complete');
});