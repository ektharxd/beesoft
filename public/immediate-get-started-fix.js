/**
 * IMMEDIATE GET STARTED BUTTON FIX
 * Simple, direct fix that works immediately without dependencies
 */

console.log('🔧 IMMEDIATE Get Started Fix Loading...');

// Run immediately when script loads
(function() {
  'use strict';

  function applyImmediateFix() {
    console.log('🚀 Applying immediate Get Started fix...');
    
    const checkbox = document.getElementById('accept-terms-checkbox');
    const button = document.getElementById('get-started-btn');
    
    if (!checkbox || !button) {
      console.log('⏳ Elements not found, retrying...');
      setTimeout(applyImmediateFix, 50);
      return;
    }

    console.log('✅ Found elements, applying fix...');

    // Clear any existing handlers
    button.onclick = null;
    button.removeAttribute('onclick');
    
    // Clone to remove all event listeners
    const newButton = button.cloneNode(true);
    const newCheckbox = checkbox.cloneNode(true);
    
    button.parentNode.replaceChild(newButton, button);
    checkbox.parentNode.replaceChild(newCheckbox, checkbox);

    // Check localStorage for previous acceptance
    const wasAccepted = localStorage.getItem('beesoft_terms_accepted') === 'true';
    
    if (wasAccepted) {
      newCheckbox.checked = true;
      newButton.disabled = false;
      console.log('✅ Terms previously accepted');
    } else {
      newCheckbox.checked = false;
      newButton.disabled = true;
      console.log('📋 Terms not accepted');
    }

    // Add checkbox handler
    newCheckbox.onchange = function() {
      console.log('📋 Checkbox changed:', this.checked);
      
      if (this.checked) {
        localStorage.setItem('beesoft_terms_accepted', 'true');
        newButton.disabled = false;
        newButton.style.opacity = '1';
        newButton.style.cursor = 'pointer';
        console.log('✅ Button enabled');
      } else {
        localStorage.removeItem('beesoft_terms_accepted');
        newButton.disabled = true;
        newButton.style.opacity = '0.6';
        newButton.style.cursor = 'not-allowed';
        console.log('❌ Button disabled');
      }
    };

    // Add button handler
    newButton.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🚀 Get Started clicked!');
      
      if (!newCheckbox.checked) {
        alert('Please accept the Terms and Conditions to continue.');
        return false;
      }

      console.log('🔄 Navigating to main app...');
      
      // Simple page navigation
      const welcomePage = document.getElementById('welcome-page');
      const mainAppPage = document.getElementById('main-app-page');
      const trialLockPage = document.getElementById('trial-lock-page');
      
      // Hide all pages
      if (welcomePage) {
        welcomePage.style.display = 'none';
        welcomePage.style.visibility = 'hidden';
      }
      if (trialLockPage) {
        trialLockPage.style.display = 'none';
        trialLockPage.style.visibility = 'hidden';
      }
      
      // Show main app
      if (mainAppPage) {
        mainAppPage.style.display = 'flex';
        mainAppPage.style.visibility = 'visible';
        mainAppPage.style.opacity = '1';
        console.log('✅ Navigated to main app');
      } else {
        console.error('❌ Main app page not found');
      }
      
      return false;
    };

    // Apply initial styling
    if (newButton.disabled) {
      newButton.style.opacity = '0.6';
      newButton.style.cursor = 'not-allowed';
    } else {
      newButton.style.opacity = '1';
      newButton.style.cursor = 'pointer';
    }

    console.log('✅ Immediate Get Started fix applied successfully');
  }

  // Apply fix immediately
  applyImmediateFix();

})();

// Also apply when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 DOM ready, re-applying Get Started fix...');
  setTimeout(function() {
    const checkbox = document.getElementById('accept-terms-checkbox');
    const button = document.getElementById('get-started-btn');
    
    if (checkbox && button) {
      // Re-apply the fix
      const wasAccepted = localStorage.getItem('beesoft_terms_accepted') === 'true';
      
      checkbox.checked = wasAccepted;
      button.disabled = !wasAccepted;
      
      if (wasAccepted) {
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      } else {
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
      }
      
      console.log('✅ Get Started state refreshed');
    }
  }, 100);
});

console.log('✅ IMMEDIATE Get Started Fix Loaded');