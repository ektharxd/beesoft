/**
 * PAGE INITIALIZATION FIX - Ensures proper page display on load
 * This fixes the welcome page and navigation issues immediately on load
 */

(function() {
  'use strict';

  // Immediate fix for page display
  function immediatePageFix() {
    console.log('🔧 Applying immediate page fixes...');
    
    // Ensure welcome page is visible by default
    const welcomePage = document.getElementById('welcome-page');
    const mainAppPage = document.getElementById('main-app-page');
    const trialLockPage = document.getElementById('trial-lock-page');
    
    if (welcomePage) {
      welcomePage.style.display = 'flex';
      welcomePage.style.visibility = 'visible';
      welcomePage.style.opacity = '1';
      welcomePage.removeAttribute('aria-hidden');
    }
    
    if (mainAppPage) {
      mainAppPage.style.display = 'none';
      mainAppPage.style.visibility = 'hidden';
      mainAppPage.style.opacity = '0';
      mainAppPage.setAttribute('aria-hidden', 'true');
    }
    
    if (trialLockPage) {
      trialLockPage.style.display = 'none';
      trialLockPage.style.visibility = 'hidden';
      trialLockPage.style.opacity = '0';
      trialLockPage.setAttribute('aria-hidden', 'true');
    }
    
    console.log('✅ Initial page state fixed');
  }

  // Fix theme toggle immediately
  function immediateThemeFix() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      const savedTheme = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);
      themeToggle.textContent = savedTheme === 'dark' ? '☀️ Light' : '🌓 Dark';
      themeToggle.style.background = savedTheme === 'dark' ? '#f59e0b' : '#4f46e5';
      console.log('✅ Initial theme applied:', savedTheme);
    }
  }

  // Apply fixes immediately
  immediatePageFix();
  immediateThemeFix();

  // Apply fixes again when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      immediatePageFix();
      immediateThemeFix();
    }, 100);
  });

  // Also apply after all scripts load
  window.addEventListener('load', function() {
    setTimeout(() => {
      immediatePageFix();
      immediateThemeFix();
    }, 500);
  });

})();
