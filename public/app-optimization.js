/**
 * APP OPTIMIZATION - Focused fixes for the main app.js file
 * Reduces memory leaks and improves performance without major refactoring
 */

(function() {
  'use strict';

  // Wait for DOM and dependencies to load
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App Optimization Loading...');

    // 1. Fix memory leaks in interval management
    const originalSetInterval = window.setInterval;
    const activeIntervals = new Set();

    window.setInterval = function(callback, delay) {
      const intervalId = originalSetInterval(callback, delay);
      activeIntervals.add(intervalId);
      return intervalId;
    };

    window.clearInterval = function(intervalId) {
      activeIntervals.delete(intervalId);
      clearInterval(intervalId);
    };

    // Cleanup all intervals on page unload
    window.addEventListener('beforeunload', function() {
      activeIntervals.forEach(id => clearInterval(id));
      activeIntervals.clear();
    });

    // 2. Optimize the admin modal system by removing excessive inline styles
    if (typeof window.showAdminActionsWindow === 'function') {
      const originalShowAdminActionsWindow = window.showAdminActionsWindow;
      
      window.showAdminActionsWindow = function() {
        // Create modal with minimal inline styles
        const existingModal = document.getElementById('admin-actions-modal');
        if (existingModal) {
          existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'admin-actions-modal';
        modal.className = 'modal-overlay admin-actions-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'admin-modal-title');

        modal.innerHTML = `
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="admin-modal-title" class="modal-title">
                <span class="material-symbols-outlined">admin_panel_settings</span>
                Admin Actions
              </h3>
              <button class="modal-close" aria-label="Close modal">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="admin-section">
                <h4>Device Information</h4>
                <div class="device-info-card">
                  <div class="device-info">
                    <p><strong>Device ID:</strong></p>
                    <div class="device-id-chip" id="device-id-display">Loading...</div>
                  </div>
                  <div class="device-actions">
                    <button class="btn btn-outline" onclick="copyDeviceId()">
                      <span class="material-symbols-outlined">content_copy</span>
                      Copy ID
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="admin-section">
                <h4>Trial Management</h4>
                <div class="customer-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Customer Email</label>
                      <input type="email" id="customer-email" class="form-input" placeholder="Enter customer email">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Trial Days</label>
                      <input type="number" id="trial-days" class="form-input" placeholder="30" min="1" max="365">
                    </div>
                  </div>
                  <div class="form-actions">
                    <button class="btn btn-primary btn-large" onclick="setTrialDays()">
                      <span class="material-symbols-outlined">schedule</span>
                      Set Trial
                    </button>
                    <button class="btn btn-success btn-large" onclick="activatePermanent()">
                      <span class="material-symbols-outlined">verified</span>
                      Activate Permanent
                    </button>
                  </div>
                </div>
              </div>
              
              <div id="admin-result-message" class="result-message" style="display: none;"></div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        // Use the centralized modal system
        if (window.modalSystem) {
          window.modalSystem.show('admin-actions-modal');
        } else {
          modal.style.display = 'flex';
        }

        // Setup event handlers
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            if (window.modalSystem) {
              window.modalSystem.hide('admin-actions-modal');
            } else {
              modal.remove();
            }
          });
        }

        // Load device ID
        if (typeof getDeviceId === 'function') {
          getDeviceId().then(deviceId => {
            const deviceIdDisplay = document.getElementById('device-id-display');
            if (deviceIdDisplay) {
              deviceIdDisplay.textContent = deviceId;
            }
          }).catch(error => {
            console.error('Failed to load device ID:', error);
            const deviceIdDisplay = document.getElementById('device-id-display');
            if (deviceIdDisplay) {
              deviceIdDisplay.textContent = 'Failed to load';
            }
          });
        }
      };
    }

    // 3. Optimize responsive UI management
    let resizeTimeout;
    const optimizedResize = function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        // Use custom event instead of direct DOM manipulation
        document.dispatchEvent(new CustomEvent('optimized:resize', {
          detail: {
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile: window.innerWidth < 768,
            isTablet: window.innerWidth < 1024
          }
        }));
      }, 150);
    };

    window.addEventListener('resize', optimizedResize);

    // 4. Optimize the total messages counter
    let messageCounterCache = null;
    const originalUpdateTotalMessagesDisplay = window.updateTotalMessagesDisplay;
    
    if (typeof originalUpdateTotalMessagesDisplay === 'function') {
      window.updateTotalMessagesDisplay = function() {
        const currentCount = getTotalMessagesSent();
        
        // Only update if count changed
        if (messageCounterCache !== currentCount) {
          messageCounterCache = currentCount;
          
          // Use requestAnimationFrame for smooth updates
          requestAnimationFrame(() => {
            originalUpdateTotalMessagesDisplay();
          });
        }
      };
    }

    // 5. Fix developer panel positioning using CSS instead of JS
    const originalShowDeveloperTools = window.showDeveloperTools;
    if (typeof originalShowDeveloperTools === 'function') {
      window.showDeveloperTools = function() {
        // Call original but let CSS handle positioning
        originalShowDeveloperTools();
        
        // Remove inline positioning styles
        const devPanel = document.getElementById('dev-panel');
        if (devPanel) {
          // Let CSS handle the positioning
          devPanel.style.position = '';
          devPanel.style.bottom = '';
          devPanel.style.right = '';
          devPanel.style.left = '';
          devPanel.style.width = '';
          devPanel.style.minWidth = '';
        }
      };
    }

    // 6. Optimize modal event handlers to prevent memory leaks
    const originalShowModal = window.showModal;
    if (typeof originalShowModal === 'function' && !window.modalSystem) {
      window.showModal = function(title, bodyHTML, options = {}) {
        // Use the new modal system if available
        if (window.modalSystem) {
          return window.modalSystem.showModal(title, bodyHTML, options);
        }
        
        // Fallback to original with cleanup
        return originalShowModal(title, bodyHTML, options);
      };
    }

    // 7. Add global error boundary
    window.addEventListener('error', function(event) {
      console.error('Global error caught:', event.error);
      
      if (window.stateManager) {
        window.stateManager.addError({
          message: event.error?.message || 'An unexpected error occurred',
          type: 'javascript',
          stack: event.error?.stack
        });
      }
      
      // Don't prevent default error handling
      return false;
    });

    // 8. Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
      console.error('Unhandled promise rejection:', event.reason);
      
      if (window.stateManager) {
        window.stateManager.addError({
          message: event.reason?.message || 'Promise rejection occurred',
          type: 'promise'
        });
      }
      
      // Prevent the default unhandled rejection behavior
      event.preventDefault();
    });

    // 9. Optimize page navigation
    const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
    
    window.navigateToPageOptimized = function(targetPageId) {
      if (window.stateManager) {
        window.stateManager.navigateToPage(targetPageId);
      } else {
        // Fallback implementation
        requestAnimationFrame(() => {
          pages.forEach(pageId => {
            const page = document.getElementById(pageId);
            if (page) {
              page.style.display = pageId === targetPageId ? 'flex' : 'none';
              page.setAttribute('aria-hidden', pageId !== targetPageId ? 'true' : 'false');
            }
          });
        });
      }
    };

    // 10. Add performance monitoring (development only)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      let performanceCheckInterval = setInterval(() => {
        if (window.performanceManager) {
          window.performanceManager.monitorMemory();
        }
      }, 30000); // Every 30 seconds

      window.addEventListener('beforeunload', () => {
        clearInterval(performanceCheckInterval);
      });
    }

    console.log('✅ App Optimization Complete');
    
    // Trigger a custom event to let other scripts know optimization is done
    document.dispatchEvent(new CustomEvent('app:optimized'));
  });

})();
