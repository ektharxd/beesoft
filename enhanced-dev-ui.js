// Enhanced futuristic developer UI with additional features
function showDeveloperTools() {
  if (!isDeveloperAuthenticated) return;
  
  // Remove any existing panel first
  const existingPanel = document.getElementById('dev-panel');
  if (existingPanel) existingPanel.remove();
  
  // Create futuristic developer panel
  const devPanel = document.createElement('div');
  devPanel.id = 'dev-panel';
  devPanel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 40, 0.95));
    backdrop-filter: blur(20px);
    color: white;
    padding: 20px;
    border-radius: 20px;
    border: 2px solid transparent;
    background-clip: padding-box;
    box-shadow: 
      0 20px 40px rgba(0, 255, 255, 0.2),
      0 0 0 1px rgba(0, 255, 255, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    font-family: 'Courier New', monospace;
    font-size: 12px;
    min-width: 280px;
    animation: devPanelGlow 2s ease-in-out infinite alternate;
  `;
  
  devPanel.innerHTML = `
    <div style="
      background: linear-gradient(90deg, #00ffff, #ff00ff, #00ffff);
      background-size: 200% 100%;
      animation: gradientShift 3s ease-in-out infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: bold;
      margin-bottom: 15px;
      text-align: center;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 2px;
    ">
      ⚡ EKTHAR DEV CONSOLE ⚡
    </div>
    
    <div style="
      background: rgba(0, 255, 255, 0.1);
      border: 1px solid rgba(0, 255, 255, 0.3);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 15px;
      font-size: 10px;
      text-align: center;
      color: #00ffff;
    ">
      <div>🔐 AUTHENTICATED SESSION</div>
      <div style="margin-top: 4px; opacity: 0.7;">Access Level: DEVELOPER</div>
    </div>
    
    <button id="test-sentry-btn" style="
      width: 100%;
      background: linear-gradient(45deg, #ff0080, #ff4040, #ff8000);
      background-size: 200% 100%;
      animation: buttonGlow 2s ease-in-out infinite alternate;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 10px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(255, 0, 128, 0.4);
    ">🐛 SENTRY TEST</button>
    
    <button id="activate-software-btn" style="
      width: 100%;
      background: linear-gradient(45deg, #00ff80, #00ffff);
      background-size: 200% 100%;
      animation: buttonGlow 2s ease-in-out infinite alternate;
      color: black;
      border: none;
      padding: 12px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 10px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(0, 255, 128, 0.4);
    ">🔓 ACTIVATE SOFTWARE</button>
    
    <button id="reset-admin-password-btn" style="
      width: 100%;
      background: linear-gradient(45deg, #ffff00, #ff8000);
      background-size: 200% 100%;
      animation: buttonGlow 2s ease-in-out infinite alternate;
      color: black;
      border: none;
      padding: 12px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 15px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(255, 255, 0, 0.4);
    ">🔑 RESET ADMIN PWD</button>
    
    <button id="dev-logout-btn" style="
      width: 100%;
      background: linear-gradient(45deg, #666, #999);
      color: white;
      border: none;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    ">🚪 LOGOUT</button>
    
    <style>
      @keyframes devPanelGlow {
        0% { box-shadow: 0 20px 40px rgba(0, 255, 255, 0.2), 0 0 0 1px rgba(0, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
        100% { box-shadow: 0 20px 40px rgba(255, 0, 255, 0.3), 0 0 0 1px rgba(255, 0, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
      }
      
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes buttonGlow {
        0% { background-position: 0% 50%; transform: scale(1); }
        100% { background-position: 100% 50%; transform: scale(1.02); }
      }
    </style>
  `;
  
  document.body.appendChild(devPanel);
  
  // Add button event listeners
  setupDeveloperButtonHandlers(devPanel);
}

// Setup all developer button handlers
function setupDeveloperButtonHandlers(devPanel) {
  // Sentry test button
  const testBtn = devPanel.querySelector('#test-sentry-btn');
  if (testBtn) {
    testBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) scale(1.05)';
      this.style.boxShadow = '0 8px 25px rgba(255, 0, 128, 0.6)';
    });
    testBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 4px 15px rgba(255, 0, 128, 0.4)';
    });
    testBtn.addEventListener('click', handleSentryTest);
  }
  
  // Activate software button
  const activateBtn = devPanel.querySelector('#activate-software-btn');
  if (activateBtn) {
    activateBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) scale(1.05)';
      this.style.boxShadow = '0 8px 25px rgba(0, 255, 128, 0.6)';
    });
    activateBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 4px 15px rgba(0, 255, 128, 0.4)';
    });
    activateBtn.addEventListener('click', handleSoftwareActivation);
  }
  
  // Reset admin password button
  const resetBtn = devPanel.querySelector('#reset-admin-password-btn');
  if (resetBtn) {
    resetBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) scale(1.05)';
      this.style.boxShadow = '0 8px 25px rgba(255, 255, 0, 0.6)';
    });
    resetBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 4px 15px rgba(255, 255, 0, 0.4)';
    });
    resetBtn.addEventListener('click', handleAdminPasswordReset);
  }
  
  // Logout button
  const logoutBtn = devPanel.querySelector('#dev-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('beesoft_dev_auth');
      isDeveloperAuthenticated = false;
      devPanel.remove();
      if (window.notifications) {
        window.notifications.info('Developer session ended');
      }
    });
  }
}

// Handle Sentry test
async function handleSentryTest() {
  const testBtn = document.getElementById('test-sentry-btn');
  if (!testBtn) return;
  
  try {
    testBtn.disabled = true;
    testBtn.innerHTML = '⏳ TESTING...';
    
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
      console.error('❌ Sentry test API not available');
    }
  } catch (error) {
    if (window.notifications) {
      window.notifications.error('Error testing Sentry: ' + error.message);
    }
    console.error('❌ Sentry test error:', error.message);
  } finally {
    setTimeout(() => {
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.innerHTML = '🐛 SENTRY TEST';
      }
    }, 2000);
  }
}

// Handle software activation
function handleSoftwareActivation() {
  showConfirmationModal(
    '🔓 Activate Software',
    'Are you sure you want to permanently activate this software? This will remove all trial restrictions.',
    () => {
      // Utility functions for encryption
      function encrypt(str) { 
        return btoa(unescape(encodeURIComponent(str))); 
      }
      
      function setTrialData(obj) {
        localStorage.setItem('beesoft_trial', encrypt(JSON.stringify(obj)));
      }
      
      // Activate the software
      setTrialData({ start: Date.now(), days: 9999, activated: true });
      
      if (window.notifications) {
        window.notifications.success('🎉 Software activated permanently! Reloading...');
      }
      
      setTimeout(() => location.reload(), 2000);
    }
  );
}

// Handle admin password reset
function handleAdminPasswordReset() {
  showConfirmationModal(
    '🔑 Reset Admin Password',
    'Are you sure you want to reset the admin password to the default? This will set it back to "beesoft@2025".',
    () => {
      // Utility functions for encryption
      function encrypt(str) { 
        return btoa(unescape(encodeURIComponent(str))); 
      }
      
      // Reset admin password to default
      const defaultAdmin = { username: 'admin', password: 'beesoft@2025' };
      localStorage.setItem('beesoft_admin', encrypt(JSON.stringify(defaultAdmin)));
      
      if (window.notifications) {
        window.notifications.success('🔑 Admin password reset to default: beesoft@2025');
      }
      
      if (window.logger) {
        window.logger.info('Admin password reset by developer');
      }
    }
  );
}