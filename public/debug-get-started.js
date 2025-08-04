/**
 * DEBUG GET STARTED BUTTON
 * Simple debug script to see what's happening with the button
 */

console.log('🔍 DEBUG: Get Started button debug script loaded');

function debugGetStarted() {
  const checkbox = document.getElementById('accept-terms-checkbox');
  const button = document.getElementById('get-started-btn');
  
  console.log('🔍 DEBUG: Elements found:', {
    checkbox: !!checkbox,
    button: !!button,
    checkboxChecked: checkbox ? checkbox.checked : 'N/A',
    buttonDisabled: button ? button.disabled : 'N/A'
  });
  
  if (checkbox && button) {
    // Add debug attributes
    button.setAttribute('data-status', button.disabled ? 'DISABLED' : 'ENABLED');
    
    // Add simple event listeners for testing
    checkbox.addEventListener('change', function() {
      console.log('🔍 DEBUG: Checkbox changed to:', this.checked);
      button.disabled = !this.checked;
      button.setAttribute('data-status', button.disabled ? 'DISABLED' : 'ENABLED');
      
      if (this.checked) {
        localStorage.setItem('beesoft_terms_accepted', 'true');
        console.log('🔍 DEBUG: Terms accepted, button enabled');
      } else {
        localStorage.removeItem('beesoft_terms_accepted');
        console.log('🔍 DEBUG: Terms not accepted, button disabled');
      }
    });
    
    button.addEventListener('click', function(e) {
      console.log('🔍 DEBUG: Button clicked!', {
        disabled: this.disabled,
        checkboxChecked: checkbox.checked
      });
      
      if (!checkbox.checked) {
        console.log('🔍 DEBUG: Checkbox not checked, showing alert');
        alert('Please accept the Terms and Conditions first!');
        e.preventDefault();
        return false;
      }
      
      console.log('🔍 DEBUG: Attempting navigation...');
      e.preventDefault();
      
      // Simple navigation
      const welcome = document.getElementById('welcome-page');
      const mainApp = document.getElementById('main-app-page');
      
      if (welcome) {
        welcome.style.display = 'none';
        console.log('🔍 DEBUG: Welcome page hidden');
      }
      
      if (mainApp) {
        mainApp.style.display = 'flex';
        console.log('🔍 DEBUG: Main app page shown');
      }
      
      console.log('🔍 DEBUG: Navigation completed');
    });
    
    // Check initial state
    const wasAccepted = localStorage.getItem('beesoft_terms_accepted') === 'true';
    if (wasAccepted) {
      checkbox.checked = true;
      button.disabled = false;
      button.setAttribute('data-status', 'ENABLED');
      console.log('🔍 DEBUG: Initial state - terms previously accepted');
    } else {
      checkbox.checked = false;
      button.disabled = true;
      button.setAttribute('data-status', 'DISABLED');
      console.log('🔍 DEBUG: Initial state - terms not accepted');
    }
  } else {
    console.log('🔍 DEBUG: Elements not found, retrying in 100ms...');
    setTimeout(debugGetStarted, 100);
  }
}

// Run immediately
debugGetStarted();

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', debugGetStarted);

// Run after a delay
setTimeout(debugGetStarted, 1000);
setTimeout(debugGetStarted, 3000);

console.log('🔍 DEBUG: Get Started debug script initialized');