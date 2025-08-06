/**
 * CRITICAL FIXES - Addresses theme toggle, page navigation, and trial check issues
 * This script fixes the specific problems mentioned by the user
 */

(function() {
  'use strict';

  console.log('🔧 Loading Critical Fixes...');

  // Fix 1: Theme System - Prevent conflicts with existing theme system
  function fixThemeSystem() {
    // Wait for DOM to be ready
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) {
      setTimeout(fixThemeSystem, 100);
      return;
    }

    // Remove any existing click listeners to prevent conflicts
    const newThemeToggle = themeToggle.cloneNode(true);
    themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);

    // Get current theme
    let currentTheme = localStorage.getItem('theme') || 'light';
    
    // Apply theme immediately
    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      // Update button text and style
      newThemeToggle.textContent = theme === 'dark' ? '☀️ Light' : '🌓 Dark';
      newThemeToggle.style.background = theme === 'dark' ? '#f59e0b' : '#4f46e5';
      
      console.log('Theme applied:', theme);
    }

    // Apply initial theme
    applyTheme(currentTheme);

    // Add new click handler with complete isolation
    newThemeToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Prevent any other event handlers from running
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = current === 'dark' ? 'light' : 'dark';
      
      applyTheme(newTheme);
      
      // Show feedback
      if (window.notifications && typeof window.notifications.info === 'function') {
        window.notifications.info(`Switched to ${newTheme} mode`);
      }
      
      // Don't let this event bubble or trigger any other handlers
      return false;
    }, true); // Use capture phase to run before other handlers

    // Also prevent any other event handlers on the theme toggle
    newThemeToggle.addEventListener('mousedown', function(e) {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true);

    newThemeToggle.addEventListener('mouseup', function(e) {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true);

    console.log('✅ Theme system fixed');
  }

  // Fix 2: Page Navigation - Prevent overlapping pages
  function fixPageNavigation() {
    // Override the existing showPage function to prevent conflicts
    window.showPageFixed = function(pageId) {
      console.log('Navigating to page:', pageId);
      
      const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
      
      // Use requestAnimationFrame to ensure smooth transitions
      requestAnimationFrame(() => {
        // First, hide ALL pages completely
        pages.forEach(id => {
          const pageElements = document.querySelectorAll(`#${id}`);
          pageElements.forEach(page => {
            page.style.display = 'none';
            page.style.visibility = 'hidden';
            page.style.opacity = '0';
            page.style.position = 'relative';
            page.style.zIndex = '1';
            page.setAttribute('aria-hidden', 'true');
            page.classList.remove('flex');
          });
        });

        // Then show ONLY the target page
        const targetElements = document.querySelectorAll(`#${pageId}`);
        targetElements.forEach(targetPage => {
          targetPage.style.display = 'flex';
          targetPage.style.visibility = 'visible';
          targetPage.style.opacity = '1';
          targetPage.style.position = 'relative';
          targetPage.style.zIndex = '2';
          targetPage.removeAttribute('aria-hidden');
          targetPage.classList.add('flex');
        });

        console.log('Page navigation completed:', pageId);
      });
    };

    // Replace the original showPage function
    if (window.showPage) {
      window.showPage = window.showPageFixed;
    }

    console.log('✅ Page navigation fixed');
  }

  // Fix 3: Trial Check System - Prevent excessive redirects and page navigation
  function fixTrialSystem() {
    let trialCheckInProgress = false;
    let lastTrialCheck = 0;
    const TRIAL_CHECK_COOLDOWN = 300000; // 5 minutes as requested
    let currentPageBeforeCheck = null;

    // Store the original checkTrial function
    const originalCheckTrial = window.checkTrial;

    if (typeof originalCheckTrial === 'function') {
      window.checkTrial = async function() {
        const now = Date.now();
        
        // Prevent rapid successive calls
        if (trialCheckInProgress || (now - lastTrialCheck) < TRIAL_CHECK_COOLDOWN) {
          console.log('Trial check skipped - cooldown active or in progress');
          return;
        }

        // Store current page before check
        currentPageBeforeCheck = getCurrentVisiblePage();
        console.log('Trial check starting, current page:', currentPageBeforeCheck);

        trialCheckInProgress = true;
        lastTrialCheck = now;

        try {
          // Temporarily override showPage to prevent unwanted navigation
          const originalShowPage = window.showPage;
          let shouldNavigate = false;
          let targetPage = null;

          window.showPage = function(pageId) {
            console.log('Trial check wants to navigate to:', pageId);
            
            // Only allow navigation if it's really necessary (trial expired/locked)
            if (pageId === 'trial-lock-page') {
              shouldNavigate = true;
              targetPage = pageId;
              originalShowPage(pageId);
            } else if (pageId === 'welcome-page') {
              // Don't force navigation to welcome page if user is already somewhere else
              if (currentPageBeforeCheck === 'main-app-page') {
                console.log('User is on main app, not forcing welcome page navigation');
                return;
              } else {
                shouldNavigate = true;
                targetPage = pageId;
                originalShowPage(pageId);
              }
            } else {
              shouldNavigate = true;
              targetPage = pageId;
              originalShowPage(pageId);
            }
          };

          await originalCheckTrial();

          // Restore original showPage
          window.showPage = originalShowPage;

          if (!shouldNavigate && currentPageBeforeCheck) {
            // Restore the page user was on if no navigation was necessary
            console.log('Restoring user to previous page:', currentPageBeforeCheck);
            if (window.showPageFixed) {
              window.showPageFixed(currentPageBeforeCheck);
            } else {
              originalShowPage(currentPageBeforeCheck);
            }
          }

        } catch (error) {
          console.error('Trial check error:', error);
        } finally {
          trialCheckInProgress = false;
        }
      };

      // Clear any existing intervals and create a safer one
      const existingIntervals = [];
      const originalSetInterval = window.setInterval;
      
      window.setInterval = function(callback, delay) {
        const intervalId = originalSetInterval(callback, delay);
        
        // Track intervals related to checkTrial
        if (callback.toString().includes('checkTrial')) {
          existingIntervals.push(intervalId);
        }
        
        return intervalId;
      };

      // Clear existing checkTrial intervals
      setTimeout(() => {
        existingIntervals.forEach(id => clearInterval(id));
        
        // Create a new, safer interval - 5 minutes as requested
        setInterval(() => {
          if (!trialCheckInProgress) {
            window.checkTrial();
          }
        }, TRIAL_CHECK_COOLDOWN);
        
        console.log('✅ Trial system intervals fixed - now checks every 5 minutes');
      }, 1000);
    }

    function getCurrentVisiblePage() {
      const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
      
      for (const pageId of pages) {
        const page = document.getElementById(pageId);
        if (page && page.style.display !== 'none' && page.style.visibility !== 'hidden') {
          return pageId;
        }
      }
      
      return 'welcome-page'; // Default fallback
    }

    console.log('✅ Trial system fixed');
  }

  // Fix 4: Modal and Updates System - Prevent page overlap after updates
  function fixModalSystem() {
    // Listen for modal events that might cause page issues
    document.addEventListener('click', function(e) {
      // Check if updates modal was clicked
      if (e.target.id === 'updates-btn' || e.target.closest('#updates-btn')) {
        setTimeout(() => {
          // Ensure we're still on the correct page after updates modal
          const currentPage = getCurrentVisiblePage();
          if (currentPage && window.showPageFixed) {
            window.showPageFixed(currentPage);
          }
        }, 500);
      }
    });

    // Listen for modal close events
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        setTimeout(() => {
          // Fix any page display issues after modal close
          const currentPage = getCurrentVisiblePage();
          if (currentPage && window.showPageFixed) {
            window.showPageFixed(currentPage);
          }
        }, 100);
      }
    });

    function getCurrentVisiblePage() {
      const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
      
      for (const pageId of pages) {
        const page = document.getElementById(pageId);
        if (page && page.style.display !== 'none' && page.style.visibility !== 'hidden') {
          return pageId;
        }
      }
      
      return 'welcome-page'; // Default fallback
    }

    console.log('✅ Modal system fixes applied');
  }

  // Fix 5: Welcome Screen Button - Ensure it works properly
  function fixWelcomeScreen() {
    const initWelcomeButton = () => {
      const getStartedBtn = document.getElementById('get-started-btn');
      const termsCheckbox = document.getElementById('accept-terms-checkbox');
      
      if (getStartedBtn && termsCheckbox) {
        // Remove existing listeners
        const newBtn = getStartedBtn.cloneNode(true);
        getStartedBtn.parentNode.replaceChild(newBtn, getStartedBtn);
        
        // Check localStorage for previous acceptance
        const wasAccepted = localStorage.getItem('beesoft_terms_accepted') === 'true';
        
        // Set initial state
        termsCheckbox.checked = wasAccepted;
        newBtn.disabled = !wasAccepted;
        
        // Add checkbox handler
        termsCheckbox.addEventListener('change', function() {
          if (this.checked) {
            localStorage.setItem('beesoft_terms_accepted', 'true');
            newBtn.disabled = false;
          } else {
            localStorage.removeItem('beesoft_terms_accepted');
            newBtn.disabled = true;
          }
        });
        
        newBtn.addEventListener('click', function(e) {
          e.preventDefault();
          
          if (!termsCheckbox.checked) {
            alert('Please accept the Terms and Conditions to continue.');
            return;
          }
          
          console.log('Get Started clicked - navigating to main app');
          
          if (window.showPageFixed) {
            window.showPageFixed('main-app-page');
          }
          
          // Also update state manager if available
          if (window.stateManager) {
            window.stateManager.navigateToPage('main-app-page');
          }
        });
        
        console.log('✅ Welcome screen button fixed');
      } else {
        setTimeout(initWelcomeButton, 100);
      }
    };

    initWelcomeButton();
  }

  // Fix 6: CSS Conflicts - Ensure pages don't overlap
  function fixCSSConflicts() {
    const style = document.createElement('style');
    style.textContent = `
      /* Critical page navigation fixes */
      .page-wrapper {
        position: relative !important;
        width: 100% !important;
        height: 100vh !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
      }
      
      .page-wrapper[style*="display: none"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
      }
      
      .page-wrapper[style*="display: flex"] {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        position: relative !important;
        left: 0 !important;
      }
      
      /* Prevent scrollable page stacking */
      body {
        overflow-x: hidden !important;
      }
      
      .app-container {
        overflow-x: hidden !important;
        position: relative !important;
      }
      
      /* Theme toggle fixes */
      #theme-toggle {
        position: fixed !important;
        top: 15px !important;
        right: 15px !important;
        z-index: 999999 !important;
        pointer-events: auto !important;
        transition: all 0.3s ease !important;
      }
      
      #theme-toggle:hover {
        transform: scale(1.05) !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log('✅ CSS conflicts fixed');
  }

  // Initialize all fixes
  function initializeFixes() {
    console.log('🚀 Initializing critical fixes...');
    
    fixCSSConflicts();
    fixPageNavigation();
    fixThemeSystem();
    fixTrialSystem();
    fixModalSystem();
    fixWelcomeScreen();
    
    console.log('✅ All critical fixes applied');
    
    // Trigger a global event
    document.dispatchEvent(new CustomEvent('fixes:applied'));
  }

  // Start fixes when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFixes);
  } else {
    initializeFixes();
  }

  // Also run fixes after other scripts load
  setTimeout(initializeFixes, 2000);

})();
