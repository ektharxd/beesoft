/**
 * TRIAL CHECK OVERRIDE - Completely fixes the trial check navigation issues
 * Prevents checkTrial from forcing navigation to welcome page when user is on main app
 */

(function() {
  'use strict';

  console.log('🔧 Loading Trial Check Override...');

  // Wait for app.js to load and then override the problematic behavior
  function overrideTrialCheck() {
    if (typeof window.checkTrial !== 'function') {
      setTimeout(overrideTrialCheck, 100);
      return;
    }

    const originalCheckTrial = window.checkTrial;
    let isOverrideActive = false;

    window.checkTrial = async function() {
      if (isOverrideActive) {
        console.log('Trial check override: preventing recursive call');
        return;
      }

      isOverrideActive = true;
      
      try {
        console.log('Trial check override: starting safe check');
        
        // Get current page before check
        const currentPage = getCurrentVisiblePage();
        console.log('Current page before trial check:', currentPage);

        // Temporarily override showPage to prevent unwanted navigation
        const originalShowPage = window.showPage;
        let navigationAttempts = [];

        window.showPage = function(pageId) {
          navigationAttempts.push(pageId);
          console.log('Trial check attempting navigation to:', pageId);
          
          // Only allow navigation if it's really necessary
          if (pageId === 'trial-lock-page') {
            // Trial is expired/locked - allow this navigation
            console.log('Trial expired - allowing navigation to trial-lock-page');
            originalShowPage(pageId);
          } else if (pageId === 'welcome-page') {
            // Check if user was already on main app
            if (currentPage === 'main-app-page') {
              console.log('Trial check tried to force welcome page, but user is on main app - ignoring');
              // Don't navigate - let user stay on main app
              return;
            } else {
              // User was on welcome page anyway, allow it
              console.log('User was on welcome page - allowing navigation');
              originalShowPage(pageId);
            }
          } else {
            // Other navigation
            originalShowPage(pageId);
          }
        };

        // Call the original checkTrial with our showPage override
        await originalCheckTrial.call(this);

        // Restore original showPage
        window.showPage = originalShowPage;

        console.log('Trial check completed. Navigation attempts:', navigationAttempts);

        // If user was on main app and trial check tried to go to welcome, restore main app
        if (currentPage === 'main-app-page' && navigationAttempts.includes('welcome-page')) {
          console.log('Restoring user to main app page after trial check');
          setTimeout(() => {
            if (window.showPageFixed) {
              window.showPageFixed('main-app-page');
            } else {
              originalShowPage('main-app-page');
            }
          }, 100);
        }

      } catch (error) {
        console.error('Trial check override error:', error);
      } finally {
        isOverrideActive = false;
      }
    };

    function getCurrentVisiblePage() {
      const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
      
      for (const pageId of pages) {
        const page = document.getElementById(pageId);
        if (page && page.style.display !== 'none' && page.style.visibility !== 'hidden') {
          return pageId;
        }
      }
      
      return null;
    }

    console.log('✅ Trial check override installed');
  }

  // Also override the interval to be less frequent (5 minutes)
  function overrideTrialInterval() {
    // Find and clear existing trial intervals
    let intervalId = null;
    
    const originalSetInterval = window.setInterval;
    window.setInterval = function(callback, delay) {
      const id = originalSetInterval(callback, delay);
      
      // Check if this is a trial check interval
      if (callback.toString().includes('checkTrial') && delay < 60000) {
        console.log('Intercepted short trial check interval, clearing it');
        clearInterval(id);
        
        // Create new 5-minute interval if not already exists
        if (!intervalId) {
          intervalId = originalSetInterval(() => {
            if (window.checkTrial) {
              window.checkTrial();
            }
          }, 300000); // 5 minutes
          console.log('Created new 5-minute trial check interval');
        }
        
        return intervalId;
      }
      
      return id;
    };
  }

  // Initialize overrides
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      overrideTrialCheck();
      overrideTrialInterval();
    }, 3000); // Wait for app.js to fully initialize
  });

  // Also run after page load
  window.addEventListener('load', function() {
    setTimeout(() => {
      overrideTrialCheck();
      overrideTrialInterval();
    }, 2000);
  });

})();
