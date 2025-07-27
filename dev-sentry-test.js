// ==========================================================================
// DEVELOPER SENTRY TEST FUNCTIONALITY
// ==========================================================================

// Developer authentication and Sentry test functionality
let isDeveloperAuthenticated = false;

// Check for developer authentication on page load
function checkDeveloperAuth() {
  const devAuth = localStorage.getItem('beesoft_dev_auth');
  if (devAuth) {
    try {
      const authData = JSON.parse(atob(devAuth));
      const now = Date.now();
      // Check if auth is valid and not expired (24 hours)
      if (authData.username === 'ekthar' && authData.timestamp && (now - authData.timestamp) < 86400000) {
        isDeveloperAuthenticated = true;
        showDeveloperTools();
      }
    } catch (e) {
      // Invalid auth data, remove it
      localStorage.removeItem('beesoft_dev_auth');
    }
  }
}

// Show developer tools
function showDeveloperTools() {
  if (!isDeveloperAuthenticated) return;
  
  // Remove any existing test button first
  const existingBtn = document.getElementById('test-sentry-btn');
  if (existingBtn) existingBtn.remove();
  
  // Create developer panel
  if (!document.getElementById('dev-panel')) {
    const devPanel = document.createElement('div');
    devPanel.id = 'dev-panel';
    devPanel.style.position = 'fixed';
    devPanel.style.bottom = '20px';
    devPanel.style.right = '20px';
    devPanel.style.zIndex = '9999';
    devPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    devPanel.style.color = 'white';
    devPanel.style.padding = '15px';
    devPanel.style.borderRadius = '12px';
    devPanel.style.border = '2px solid #00ff00';
    devPanel.style.boxShadow = '0 8px 32px rgba(0, 255, 0, 0.3)';
    devPanel.style.fontFamily = 'monospace';
    devPanel.style.fontSize = '12px';
    devPanel.style.minWidth = '200px';
    
    devPanel.innerHTML = `
      <div style="color: #00ff00; font-weight: bold; margin-bottom: 10px; text-align: center;">
        🔧 DEVELOPER PANEL
      </div>
      <button id="test-sentry-btn" style="
        width: 100%;
        background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 8px;
        transition: all 0.2s ease;
      ">🐛 Test Sentry</button>
      <button id="dev-logout-btn" style="
        width: 100%;
        background: #666;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 11px;
      ">🚪 Logout</button>
    `;
    
    document.body.appendChild(devPanel);
    
    // Add hover effects
    const testBtn = devPanel.querySelector('#test-sentry-btn');
    testBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
    });
    testBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
    });
    
    // Add logout functionality
    devPanel.querySelector('#dev-logout-btn').addEventListener('click', () => {
      localStorage.removeItem('beesoft_dev_auth');
      isDeveloperAuthenticated = false;
      devPanel.remove();
      if (window.notifications) {
        window.notifications.info('Developer session ended');
      }
    });
    
    // Add click handler for test Sentry button
    testBtn.addEventListener('click', async () => {
      try {
        testBtn.disabled = true;
        testBtn.innerHTML = '⏳ Testing...';
        
        if (window.electronAPI && window.electronAPI.testSentryError) {
          const result = await window.electronAPI.testSentryError();
          
          if (result.success) {
            if (window.notifications) {
              window.notifications.success('Test error sent to Sentry successfully!');
            }
            if (window.logger) {
              window.logger.success('Sentry test completed - Check your Sentry dashboard');
            }
            console.log('✅ Sentry test successful!');
          } else {
            if (window.notifications) {
              window.notifications.error('Failed to send test error to Sentry');
            }
            if (window.logger) {
              window.logger.error('Sentry test failed: ' + result.message);
            }
            console.error('❌ Sentry test failed:', result.message);
          }
        } else {
          if (window.notifications) {
            window.notifications.error('Sentry test not available in this environment');
          }
          if (window.logger) {
            window.logger.error('Sentry test API not available');
          }
          console.error('❌ Sentry test API not available');
        }
      } catch (error) {
        if (window.notifications) {
          window.notifications.error('Error testing Sentry: ' + error.message);
        }
        if (window.logger) {
          window.logger.error('Sentry test error: ' + error.message);
        }
        console.error('❌ Sentry test error:', error.message);
      } finally {
        setTimeout(() => {
          if (testBtn) {
            testBtn.disabled = false;
            testBtn.innerHTML = '🐛 Test Sentry';
          }
        }, 2000);
      }
    });
  }
}

// Developer login functionality
function showDeveloperLogin() {
  const loginHTML = `
    <div style="text-align: center;">
      <h3 style="color: #00ff00; margin-bottom: 20px;">🔧 Developer Access</h3>
      <div style="margin-bottom: 15px;">
        <input id="dev-username" type="text" placeholder="Username" style="
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 10px;
        " />
      </div>
      <div style="margin-bottom: 20px;">
        <input id="dev-password" type="password" placeholder="Password" style="
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        " />
      </div>
      <div id="dev-login-error" style="color: #ff6b6b; font-size: 12px; margin-bottom: 10px; display: none;"></div>
    </div>
  `;

  showModal('Developer Login', loginHTML, {
    okText: 'Login',
    cancelText: 'Cancel',
    validate: () => {
      const username = document.getElementById('dev-username').value.trim();
      const password = document.getElementById('dev-password').value.trim();
      const errorEl = document.getElementById('dev-login-error');
      
      if (!username || !password) {
        errorEl.textContent = 'Please enter both username and password.';
        errorEl.style.display = 'block';
        return false;
      }
      
      if (username === 'ekthar' && password === 'Ekthar@8302') {
        // Store authentication with timestamp
        const authData = {
          username: 'ekthar',
          timestamp: Date.now()
        };
        localStorage.setItem('beesoft_dev_auth', btoa(JSON.stringify(authData)));
        isDeveloperAuthenticated = true;
        
        if (window.notifications) {
          window.notifications.success('Developer access granted');
        }
        
        setTimeout(() => {
          showDeveloperTools();
        }, 500);
        
        return true;
      } else {
        errorEl.textContent = 'Invalid developer credentials.';
        errorEl.style.display = 'block';
        return false;
      }
    }
  });
}

// Add keyboard shortcut for developer login (Ctrl+Shift+D)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    if (!isDeveloperAuthenticated) {
      showDeveloperLogin();
    } else {
      // If already authenticated, toggle developer panel
      const devPanel = document.getElementById('dev-panel');
      if (devPanel) {
        devPanel.style.display = devPanel.style.display === 'none' ? 'block' : 'none';
      }
    }
  }
});

// Initialize developer authentication check
setTimeout(() => {
  checkDeveloperAuth();
}, 1000);