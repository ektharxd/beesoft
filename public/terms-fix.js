// Fix for Get Started button functionality
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for the main app.js to load
  setTimeout(() => {
    const termsCheckbox = document.getElementById('accept-terms-checkbox');
    const getStartedBtn = document.getElementById('get-started-btn');
    
    if (termsCheckbox && getStartedBtn) {
      console.log('Terms fix script: Setting up Get Started button');
      
      // Remove any existing event listeners by cloning the button
      const newGetStartedBtn = getStartedBtn.cloneNode(true);
      getStartedBtn.parentNode.replaceChild(newGetStartedBtn, getStartedBtn);
      
      // Add the click event listener to the new button
      newGetStartedBtn.addEventListener('click', function() {
        console.log('Get Started button clicked');
        
        if (!termsCheckbox.checked) {
          if (window.notifications) {
            window.notifications.error('Please accept the terms and conditions to continue');
          } else {
            alert('Please accept the terms and conditions to continue');
          }
          return;
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
      
      console.log('Terms fix script: Get Started button event listener added');
    } else {
      console.error('Terms fix script: Could not find terms checkbox or get started button');
    }
  }, 1000);
});