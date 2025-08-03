/**
 * MAIN INITIALIZATION - Coordinates all UI/UX improvements
 * This script ensures proper loading order and feature coordination
 */

(function() {
  'use strict';

  // Feature detection and polyfills
  function initializeFeatureDetection() {
    // Add feature detection classes to body
    const features = {
      'js': true,
      'touch': 'ontouchstart' in window,
      'mobile': /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      'reduced-motion': window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      'high-contrast': window.matchMedia('(prefers-contrast: high)').matches,
      'dark-scheme': window.matchMedia('(prefers-color-scheme: dark)').matches
    };

    Object.entries(features).forEach(([feature, supported]) => {
      if (supported) {
        document.body.classList.add(`feature-${feature}`);
      } else {
        document.body.classList.add(`no-${feature}`);
      }
    });
  }

  // Initialize CSS custom properties for dynamic theming
  function initializeCSSProperties() {
    const root = document.documentElement;
    
    // Set initial theme based on system preference or saved preference
    const savedTheme = localStorage.getItem('beesoft_theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemDark ? 'dark' : 'light');
    
    root.setAttribute('data-theme', theme);
    
    // Update theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀️ Light' : '🌓 Dark';
    }
  }

  // Wait for all dependencies to load
  function waitForDependencies() {
    return new Promise((resolve) => {
      const checkDependencies = () => {
        const required = [
          'performanceManager',
          'modalSystem', 
          'stateManager'
        ];
        
        const loaded = required.every(dep => window[dep]);
        
        if (loaded) {
          resolve();
        } else {
          // Check again in 50ms
          setTimeout(checkDependencies, 50);
        }
      };
      
      checkDependencies();
    });
  }

  // Enhanced initialization sequence
  async function initializeApp() {
    console.log('🚀 Main Initialization Starting...');
    
    try {
      // Phase 1: Feature detection and CSS setup
      initializeFeatureDetection();
      initializeCSSProperties();
      
      // Phase 2: Wait for dependencies
      await waitForDependencies();
      console.log('✅ Core dependencies loaded');
      
      // Phase 3: Initialize core systems
      if (window.stateManager) {
        // Set initial state based on current page
        const currentPage = getCurrentPage();
        if (currentPage) {
          window.stateManager.set('currentPage', currentPage);
        }
        
        // Initialize network monitoring
        updateNetworkStatus();
        window.addEventListener('online', () => {
          window.stateManager.set('networkStatus', 'online');
          if (window.announceToScreenReader) {
            window.announceToScreenReader('Connection restored');
          }
        });
        
        window.addEventListener('offline', () => {
          window.stateManager.set('networkStatus', 'offline');
          if (window.announceToScreenReader) {
            window.announceToScreenReader('Connection lost', 'assertive');
          }
        });
      }
      
      // Phase 4: Enhanced theme management
      initializeEnhancedThemeSystem();
      
      // Phase 5: Initialize performance monitoring
      if (window.performanceManager) {
        // Add global error handling
        window.addEventListener('error', (event) => {
          console.error('Application error:', event.error);
          
          if (window.stateManager) {
            window.stateManager.addError({
              message: event.error?.message || 'An unexpected error occurred',
              type: 'javascript'
            });
          }
        });
        
        // Monitor performance metrics
        if (typeof PerformanceObserver !== 'undefined') {
          try {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              entries.forEach(entry => {
                if (entry.entryType === 'navigation') {
                  console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart, 'ms');
                }
              });
            });
            observer.observe({ entryTypes: ['navigation'] });
          } catch (error) {
            console.warn('Performance monitoring not available:', error);
          }
        }
      }
      
      // Phase 6: Initialize legacy compatibility
      initializeLegacyCompatibility();
      
      // Phase 7: Setup enhanced error boundaries
      setupGlobalErrorHandling();
      
      // Phase 8: Initialize responsive management
      initializeResponsiveManagement();
      
      console.log('✅ Main Initialization Complete');
      
      // Notify all systems that initialization is complete
      document.dispatchEvent(new CustomEvent('app:initialized', {
        detail: {
          timestamp: Date.now(),
          features: Array.from(document.body.classList).filter(cls => cls.startsWith('feature-'))
        }
      }));
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      
      // Fallback error display
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #fee; border: 1px solid #fcc; color: #c33;
        padding: 12px 20px; border-radius: 8px; z-index: 999999;
        font-family: system-ui, sans-serif; font-size: 14px;
      `;
      errorDiv.textContent = 'App initialization failed. Please refresh the page.';
      document.body.appendChild(errorDiv);
      
      setTimeout(() => errorDiv.remove(), 5000);
    }
  }
  
  function getCurrentPage() {
    const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
    return pages.find(pageId => {
      const page = document.getElementById(pageId);
      return page && page.style.display !== 'none';
    }) || 'welcome-page';
  }
  
  function updateNetworkStatus() {
    const status = navigator.onLine ? 'online' : 'offline';
    if (window.stateManager) {
      window.stateManager.set('networkStatus', status);
    }
  }
  
  function initializeEnhancedThemeSystem() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Enhanced theme toggle with better UX
    themeToggle.addEventListener('click', () => {
      const root = document.documentElement;
      const currentTheme = root.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      root.setAttribute('data-theme', newTheme);
      themeToggle.textContent = newTheme === 'dark' ? '☀️ Light' : '🌓 Dark';
      
      // Save preference
      localStorage.setItem('beesoft_theme', newTheme);
      
      // Update state manager
      if (window.stateManager) {
        window.stateManager.set('theme', newTheme);
      }
      
      // Announce to screen readers
      if (window.announceToScreenReader) {
        window.announceToScreenReader(`Switched to ${newTheme} theme`);
      }
    });
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      const savedTheme = localStorage.getItem('beesoft_theme');
      if (!savedTheme) { // Only auto-switch if user hasn't manually set preference
        const theme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        themeToggle.textContent = theme === 'dark' ? '☀️ Light' : '🌓 Dark';
        
        if (window.stateManager) {
          window.stateManager.set('theme', theme);
        }
      }
    });
  }
  
  function initializeLegacyCompatibility() {
    // Ensure existing functions still work
    if (!window.showPage && window.stateManager) {
      window.showPage = (pageId) => window.stateManager.navigateToPage(pageId);
    }
    
    if (!window.hideAllPages) {
      window.hideAllPages = () => {
        const pages = document.querySelectorAll('.page-wrapper, [id$="-page"]');
        pages.forEach(page => {
          if (page) {
            page.style.display = 'none';
            page.setAttribute('aria-hidden', 'true');
          }
        });
      };
    }
    
    // Ensure global objects exist
    if (!window.appState && window.stateManager) {
      window.appState = {
        get currentStep() { return window.stateManager.get('currentStep') || 1; },
        set currentStep(value) { window.stateManager.set('currentStep', value); },
        
        updateWorkflowUI() {
          document.dispatchEvent(new CustomEvent('workflow:update'));
        },
        
        updateActionButtons() {
          document.dispatchEvent(new CustomEvent('buttons:update'));  
        },
        
        updateStats(stats) {
          window.stateManager.set('messageStats', stats);
        }
      };
    }
  }
  
  function setupGlobalErrorHandling() {
    // Enhanced error handling with user-friendly messages
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      
      // Show user-friendly error message
      if (window.notifications && typeof window.notifications.error === 'function') {
        window.notifications.error('Something went wrong. Please try again.');
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Prevent the default console error
      event.preventDefault();
      
      // Show user-friendly error message
      if (window.notifications && typeof window.notifications.error === 'function') {
        window.notifications.error('A network request failed. Please check your connection.');
      }
    });
  }
  
  function initializeResponsiveManagement() {
    // Enhanced responsive breakpoint management
    const breakpoints = {
      mobile: '(max-width: 768px)',
      tablet: '(max-width: 1024px) and (min-width: 769px)',
      desktop: '(min-width: 1025px)'
    };
    
    Object.entries(breakpoints).forEach(([name, query]) => {
      const mediaQuery = window.matchMedia(query);
      
      const handleBreakpointChange = (e) => {
        if (e.matches) {
          document.body.classList.add(`bp-${name}`);
          document.body.classList.remove(...Object.keys(breakpoints).filter(bp => bp !== name).map(bp => `bp-${bp}`));
          
          // Notify state manager
          if (window.stateManager) {
            window.stateManager.set('viewport', name);
          }
          
          // Trigger custom event
          document.dispatchEvent(new CustomEvent('viewport:change', {
            detail: { breakpoint: name, mediaQuery: query }
          }));
        }
      };
      
      mediaQuery.addEventListener('change', handleBreakpointChange);
      handleBreakpointChange(mediaQuery); // Initial check
    });
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

})();
