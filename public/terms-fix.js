// Fix for Get Started button functionality
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for the main app.js to load
  setTimeout(() => {
    const termsCheckbox = document.getElementById('accept-terms-checkbox');
    const getStartedBtn = document.getElementById('get-started-btn');
    
    if (termsCheckbox && getStartedBtn) {
      console.log('Terms fix script: Setting up Get Started button');
      
      // Function to update button state based on checkbox
      function updateButtonState() {
        if (termsCheckbox.checked) {
          getStartedBtn.disabled = false;
          localStorage.setItem('beesoft_terms_accepted', 'true');
        } else {
          getStartedBtn.disabled = true;
          localStorage.removeItem('beesoft_terms_accepted');
        }
      }
      
      // Initialize button state based on localStorage
      if (localStorage.getItem('beesoft_terms_accepted') === 'true') {
        termsCheckbox.checked = true;
        getStartedBtn.disabled = false;
      } else {
        getStartedBtn.disabled = true;
      }
      
      // Handle checkbox changes
      termsCheckbox.addEventListener('change', updateButtonState);
      
      // Remove any existing event listeners by cloning the button
      const newGetStartedBtn = getStartedBtn.cloneNode(true);
      getStartedBtn.parentNode.replaceChild(newGetStartedBtn, getStartedBtn);
      
      // Preserve the disabled state on the new button
      if (getStartedBtn.disabled) {
        newGetStartedBtn.disabled = true;
      }
      
      // Add the click event listener to the new button
      newGetStartedBtn.addEventListener('click', function(e) {
        console.log('Get Started button clicked');
        
        // Check if button is disabled
        if (newGetStartedBtn.disabled) {
          console.log('Button is disabled, preventing action');
          e.preventDefault();
          return false;
        }
        
        if (!termsCheckbox.checked) {
          if (window.notifications) {
            window.notifications.error('Please accept the terms and conditions to continue');
          } else {
            alert('Please accept the terms and conditions to continue');
          }
          e.preventDefault();
          return false;
        }
        
        // Navigate to main app
        console.log('Navigating to main app');
        const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
        pages.forEach(id => {
          const page = document.getElementById(id);
          if (page) {
            page.style.display = 'none';
            console.log(`Hidden page: ${id}`);
          }
        });
        
        const mainAppPage = document.getElementById('main-app-page');
        if (mainAppPage) {
          mainAppPage.style.display = 'flex';
          console.log('Main app page shown');
          
          // Initialize total messages counter when entering main app
          setTimeout(() => {
            if (typeof initializeTotalMessagesCounter === 'function') {
              initializeTotalMessagesCounter();
            }
          }, 100);
          
          if (window.notifications) {
            window.notifications.success('Welcome to Beesoft! Start by connecting WhatsApp.');
          }
        } else {
          console.error('Main app page element not found');
          if (window.notifications) {
            window.notifications.error('Error loading main application');
          } else {
            alert('Error loading main application');
          }
        }
      });
      
      // Re-add the checkbox change listener to the new button context
      termsCheckbox.addEventListener('change', function() {
        updateButtonState();
        // Update the new button's disabled state too
        newGetStartedBtn.disabled = !termsCheckbox.checked;
      });
      
      console.log('Terms fix script: Get Started button event listener added');
    } else {
      console.error('Terms fix script: Could not find terms checkbox or get started button');
    }
  }, 1000);
});