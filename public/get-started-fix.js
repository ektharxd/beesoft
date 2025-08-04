/**
 * GET STARTED BUTTON FIX - Complete solution
 * Fixes checkbox validation and button activation
 */

(function() {
  'use strict';

  console.log('🔧 Loading Get Started Button Fix...');

  function fixGetStartedButton() {
    const termsCheckbox = document.getElementById('accept-terms-checkbox');
    const getStartedBtn = document.getElementById('get-started-btn');
    
    if (!termsCheckbox || !getStartedBtn) {
      console.warn('Get Started elements not found, retrying...');
      setTimeout(fixGetStartedButton, 200);
      return;
    }

    console.log('✅ Found Get Started elements, applying fix...');

    // Initial state - button should be disabled
    getStartedBtn.disabled = !termsCheckbox.checked;
    getStartedBtn.style.opacity = termsCheckbox.checked ? '1' : '0.5';
    getStartedBtn.style.cursor = termsCheckbox.checked ? 'pointer' : 'not-allowed';

    // Remove any existing event listeners by cloning elements
    const newCheckbox = termsCheckbox.cloneNode(true);
    const newButton = getStartedBtn.cloneNode(true);
    
    termsCheckbox.parentNode.replaceChild(newCheckbox, termsCheckbox);
    getStartedBtn.parentNode.replaceChild(newButton, getStartedBtn);

    // Set up checkbox change handler
    newCheckbox.addEventListener('change', function() {
      const isChecked = this.checked;
      console.log('📋 Terms checkbox changed:', isChecked);
      
      // Update button state
      newButton.disabled = !isChecked;
      newButton.style.opacity = isChecked ? '1' : '0.5';
      newButton.style.cursor = isChecked ? 'pointer' : 'not-allowed';
      
      if (isChecked) {
        newButton.classList.remove('btn-disabled');
        newButton.classList.add('btn-primary');
      } else {
        newButton.classList.add('btn-disabled');
        newButton.classList.remove('btn-primary');
      }
    });

    // Set up button click handler
    newButton.addEventListener('click', function(e) {
      console.log('🚀 Get Started button clicked');
      
      // Prevent default and stop propagation
      e.preventDefault();
      e.stopPropagation();
      
      // Check if terms are accepted
      if (!newCheckbox.checked) {
        console.warn('❌ Terms not accepted, blocking navigation');
        
        // Highlight the checkbox
        newCheckbox.style.outline = '2px solid #ef4444';
        setTimeout(() => {
          newCheckbox.style.outline = '';
        }, 2000);
        
        if (window.notifications) {
          window.notifications.error('Please accept the Terms and Conditions to continue');
        } else {
          alert('Please accept the Terms and Conditions to continue');
        }
        return false;
      }

      // Prevent multiple clicks
      if (newButton.disabled) {
        return false;
      }

      // Disable button temporarily
      newButton.disabled = true;
      newButton.innerHTML = '<span class="bee-spinner"></span> Loading...';

      console.log('✅ Terms accepted, navigating to main app...');
      
      // Set navigation flag
      window.userNavigatedToMain = true;
      
      try {
        // Hide all pages
        const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
        pages.forEach(pageId => {
          const page = document.getElementById(pageId);
          if (page) {
            page.style.display = 'none';
            console.log(`📄 Hidden page: ${pageId}`);
          }
        });

        // Show main app page
        const mainAppPage = document.getElementById('main-app-page');
        if (mainAppPage) {
          mainAppPage.style.display = 'flex';
          console.log('📱 Main app page shown');
          
          // Update body data attribute
          document.body.setAttribute('data-current-page', 'main');
          
          // Success notification
          setTimeout(() => {
            if (window.notifications) {
              window.notifications.success('Welcome to Beesoft! Connect WhatsApp to get started.');
            }
          }, 500);
          
          // Initialize components
          setTimeout(() => {
            if (typeof initializeTotalMessagesCounter === 'function') {
              initializeTotalMessagesCounter();
            }
          }, 200);
          
        } else {
          throw new Error('Main app page element not found');
        }
        
      } catch (error) {
        console.error('❌ Error navigating to main app:', error);
        
        // Reset button
        newButton.disabled = false;
        newButton.innerHTML = '<span class="material-symbols-outlined">rocket_launch</span> Get Started';
        
        if (window.notifications) {
          window.notifications.error('Error loading main application. Please try again.');
        } else {
          alert('Error loading main application. Please try again.');
        }
      } finally {
        // Clear navigation flag
        setTimeout(() => {
          window.userNavigatedToMain = false;
        }, 3000);
      }
    });

    // Set initial state based on checkbox
    const changeEvent = new Event('change');
    newCheckbox.dispatchEvent(changeEvent);

    console.log('✅ Get Started button fix applied successfully');
  }

  // Initialize fix
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixGetStartedButton);
  } else {
    fixGetStartedButton();
  }
  
  // Also try after other scripts load
  setTimeout(fixGetStartedButton, 500);
  setTimeout(fixGetStartedButton, 1500);

})();
