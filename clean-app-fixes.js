// ==========================================================================
// TOTAL MESSAGES COUNTER SYSTEM (MAIN APP ONLY)
// ==========================================================================

// Initialize total messages counter (only in main app)
function initializeTotalMessagesCounter() {
  // Only show in main app page
  const mainAppPage = document.getElementById('main-app-page');
  if (!mainAppPage || mainAppPage.style.display === 'none') {
    return;
  }
  
  // Remove existing counter first
  const existingChip = document.getElementById('total-messages-chip');
  if (existingChip) {
    existingChip.remove();
  }
  
  // Create the counter chip
  const chip = document.createElement('div');
  chip.id = 'total-messages-chip';
  chip.style.cssText = `
    position: fixed !important;
    bottom: 20px !important;
    left: 20px !important;
    z-index: 999998 !important;
    background: linear-gradient(135deg, #10b981, #059669) !important;
    color: white !important;
    padding: 12px 20px !important;
    border-radius: 30px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3) !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    transition: all 0.3s ease !important;
    cursor: pointer !important;
    user-select: none !important;
    font-family: 'Inter Tight', sans-serif !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    min-width: 140px !important;
  `;
  
  chip.innerHTML = `
    <span style="font-size: 18px;">📊</span>
    <span>Total: <span id="total-messages-count">0</span></span>
  `;
  
  // Add hover effect
  chip.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-3px) scale(1.05)';
    this.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.5)';
  });
  
  chip.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
    this.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)';
  });
  
  // Add click handler to show detailed stats
  chip.addEventListener('click', function() {
    showTotalMessagesModal();
  });
  
  document.body.appendChild(chip);
  
  // Load and display the total count
  updateTotalMessagesDisplay();
}

// Update the total messages display
function updateTotalMessagesDisplay() {
  const totalCount = getTotalMessagesSent();
  const countElement = document.getElementById('total-messages-count');
  if (countElement) {
    countElement.textContent = totalCount.toLocaleString();
  }
}

// Get total messages sent from localStorage
function getTotalMessagesSent() {
  try {
    const stored = localStorage.getItem('beesoft_total_messages_sent');
    return stored ? parseInt(stored) : 0;
  } catch (e) {
    return 0;
  }
}

// Increment total messages sent (only count actual sent messages)
function incrementTotalMessagesSent(count = 1) {
  try {
    const current = getTotalMessagesSent();
    const newTotal = current + count;
    localStorage.setItem('beesoft_total_messages_sent', newTotal.toString());
    updateTotalMessagesDisplay();
    
    // Add celebration effect for milestones
    if (newTotal % 100 === 0 && newTotal > 0) {
      celebrateMilestone(newTotal);
    }
  } catch (e) {
    console.error('Failed to update total messages count:', e);
  }
}

// Show detailed total messages modal
function showTotalMessagesModal() {
  const totalCount = getTotalMessagesSent();
  const modalHTML = `
    <div style="text-align: center;">
      <div style="font-size: 4rem; margin-bottom: 20px;">📊</div>
      <h3 style="margin-bottom: 10px; color: var(--color-primary);">Total Messages Statistics</h3>
      <div style="background: var(--surface-secondary); padding: 20px; border-radius: 12px; margin: 20px 0;">
        <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-success); margin-bottom: 8px;">
          ${totalCount.toLocaleString()}
        </div>
        <div style="font-size: 1.1rem; color: var(--text-secondary);">
          Total Messages Sent All Time
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0;">
        <div style="background: var(--surface-secondary); padding: 16px; border-radius: 8px;">
          <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary);">
            ${Math.ceil(totalCount / 30)}
          </div>
          <div style="font-size: 0.9rem; color: var(--text-tertiary);">
            Avg. per Month
          </div>
        </div>
        <div style="background: var(--surface-secondary); padding: 16px; border-radius: 8px;">
          <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary);">
            ${Math.ceil(totalCount / 7)}
          </div>
          <div style="font-size: 0.9rem; color: var(--text-tertiary);">
            Avg. per Week
          </div>
        </div>
      </div>
      <div style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; color: white;">
        <div style="font-size: 0.9rem; opacity: 0.9;">
          🎯 Keep up the great work! Every message sent helps grow your business.
        </div>
      </div>
    </div>
  `;

  if (typeof showModal === 'function') {
    showModal('📊 Message Statistics', modalHTML, {
      okText: 'Close',
      cancelText: 'Reset Counter',
      validate: () => true
    }).then((result) => {
      if (result === false) { // Cancel button (Reset Counter)
        if (typeof showConfirmationModal === 'function') {
          showConfirmationModal(
            'Reset Message Counter',
            'Are you sure you want to reset the total message counter to zero? This action cannot be undone.',
            () => {
              localStorage.setItem('beesoft_total_messages_sent', '0');
              updateTotalMessagesDisplay();
              if (window.notifications) {
                window.notifications.success('Message counter reset to zero');
              }
            }
          );
        }
      }
    });
  }
}

// Celebrate milestone achievements
function celebrateMilestone(count) {
  if (window.notifications) {
    window.notifications.success(`🎉 Milestone achieved! ${count.toLocaleString()} messages sent!`, 8000);
  }
  
  // Add visual celebration effect
  const chip = document.getElementById('total-messages-chip');
  if (chip) {
    chip.style.animation = 'pulse 0.6s ease-in-out 3';
    setTimeout(() => {
      chip.style.animation = '';
    }, 2000);
  }
}

// ==========================================================================
// RESPONSIVE UI MANAGEMENT
// ==========================================================================

// Manage UI responsiveness and positioning
function manageResponsiveUI() {
  const chip = document.getElementById('total-messages-chip');
  const devPanel = document.getElementById('dev-panel');
  
  // Adjust positioning based on screen size
  function adjustPositioning() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Adjust counter chip position
    if (chip) {
      if (screenWidth < 768) {
        // Mobile: move to top-left, smaller size
        chip.style.bottom = 'auto';
        chip.style.top = '15px';
        chip.style.left = '15px';
        chip.style.padding = '8px 12px';
        chip.style.fontSize = '12px';
        chip.style.borderRadius = '20px';
      } else if (screenWidth < 1024) {
        // Tablet: adjust position
        chip.style.bottom = '15px';
        chip.style.top = 'auto';
        chip.style.left = '15px';
        chip.style.padding = '10px 16px';
        chip.style.fontSize = '13px';
      } else {
        // Desktop: original position
        chip.style.bottom = '20px';
        chip.style.top = 'auto';
        chip.style.left = '20px';
        chip.style.padding = '12px 20px';
        chip.style.fontSize = '14px';
      }
    }
    
    // Adjust developer panel position
    if (devPanel) {
      if (screenWidth < 768) {
        // Mobile: full width at bottom
        devPanel.style.bottom = '10px';
        devPanel.style.right = '10px';
        devPanel.style.left = '10px';
        devPanel.style.width = 'calc(100% - 20px)';
        devPanel.style.minWidth = 'auto';
      } else {
        // Desktop/Tablet: original position
        devPanel.style.bottom = '20px';
        devPanel.style.right = '20px';
        devPanel.style.left = 'auto';
        devPanel.style.width = 'auto';
        devPanel.style.minWidth = '280px';
      }
    }
  }
  
  // Initial adjustment
  adjustPositioning();
  
  // Listen for window resize
  window.addEventListener('resize', adjustPositioning);
}

// ==========================================================================
// PAGE VISIBILITY MANAGEMENT
// ==========================================================================

// Show/hide counter based on current page
function manageCounterVisibility() {
  const chip = document.getElementById('total-messages-chip');
  const mainAppPage = document.getElementById('main-app-page');
  
  if (chip) {
    if (mainAppPage && mainAppPage.style.display !== 'none') {
      chip.style.display = 'flex';
    } else {
      chip.style.display = 'none';
    }
  }
}

// Monitor page changes
function initializePageMonitoring() {
  // Check visibility every second
  setInterval(() => {
    manageCounterVisibility();
  }, 1000);
  
  // Also check when DOM changes
  const observer = new MutationObserver(() => {
    manageCounterVisibility();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
  });
}

// ==========================================================================
// ENHANCED DEVELOPER UI WITH RESPONSIVE DESIGN
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

// Enhanced responsive developer UI
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
    max-width: 90vw;
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
  
  // Apply responsive positioning
  manageResponsiveUI();
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
  if (typeof showConfirmationModal === 'function') {
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
}

// Handle admin password reset
function handleAdminPasswordReset() {
  if (typeof showConfirmationModal === 'function') {
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

  if (typeof showModal === 'function') {
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
}

// Add keyboard shortcut for developer login (Ctrl+Shift+E)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'E') {
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

// Enhanced admin login for ekthar
function enhanceAdminLogin() {
  const adminAuthBtn = document.getElementById('admin-auth-btn');
  if (adminAuthBtn) {
    adminAuthBtn.addEventListener('click', () => {
      const username = document.getElementById('admin-username').value.trim();
      const password = document.getElementById('admin-password').value.trim();
      const errorEl = document.getElementById('admin-login-error');

      if (!username || !password) {
        if (errorEl) errorEl.textContent = 'Please enter both username and password.';
        return;
      }

      // Check for developer credentials first
      if (username === 'ekthar' && password === 'Ekthar@8302') {
        // Grant developer access
        const authData = {
          username: 'ekthar',
          timestamp: Date.now()
        };
        localStorage.setItem('beesoft_dev_auth', btoa(JSON.stringify(authData)));
        isDeveloperAuthenticated = true;
        
        if (window.notifications) {
          window.notifications.success('Developer access granted! Redirecting...');
        }
        
        // Redirect to main app
        setTimeout(() => {
          const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
          pages.forEach(id => {
            const page = document.getElementById(id);
            if (page) page.style.display = 'none';
          });
          
          const mainPage = document.getElementById('main-app-page');
          if (mainPage) {
            mainPage.style.display = 'flex';
            showDeveloperTools();
          }
        }, 1000);
        
        return;
      }

      // Check regular admin credentials
      function decrypt(str) { 
        try { 
          return decodeURIComponent(escape(atob(str))); 
        } catch { 
          return ''; 
        } 
      }

      function getAdminData() {
        const data = localStorage.getItem('beesoft_admin');
        if (!data) return null;
        try { 
          return JSON.parse(decrypt(data)); 
        } catch { 
          return null; 
        }
      }

      let admin = getAdminData();
      if (!admin) {
        admin = { username: 'admin', password: 'beesoft@2025' };
      }

      if (admin.username === username && admin.password === password) {
        if (typeof showAdminModal === 'function') {
          showAdminModal((obj) => {
            localStorage.setItem('beesoft_trial', btoa(unescape(encodeURIComponent(JSON.stringify(obj)))));
          });
        }
      } else {
        if (errorEl) errorEl.textContent = 'Invalid admin credentials.';
      }
    });
  }
}

// Initialize everything when DOM is ready
setTimeout(() => {
  checkDeveloperAuth();
  enhanceAdminLogin();
  initializePageMonitoring();
  manageResponsiveUI();
  
  // Initialize counter only when in main app
  const mainAppPage = document.getElementById('main-app-page');
  if (mainAppPage && mainAppPage.style.display !== 'none') {
    initializeTotalMessagesCounter();
  }
}, 500);