// Fix for back button functionality
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for the main app.js to load
  setTimeout(() => {
    console.log('Back button fix: Initializing back button functionality');
    
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
    if (backToWelcomeBtn) {
      console.log('Back button fix: Found back button, adding event listener');
      
      // Remove any existing event listeners by cloning the button
      const newBackBtn = backToWelcomeBtn.cloneNode(true);
      backToWelcomeBtn.parentNode.replaceChild(newBackBtn, backToWelcomeBtn);
      
      // Add the click event listener to the new button
      newBackBtn.addEventListener('click', function() {
        console.log('Back button clicked');
        
        // Check if showConfirmationModal exists
        if (typeof showConfirmationModal === 'function') {
          showConfirmationModal(
            'Return to Welcome',
            'Are you sure you want to return to the welcome screen? Any unsaved progress will be lost.',
            () => {
              console.log('User confirmed return to welcome');
              
              // Reset application state if available
              if (window.appState) {
                window.appState = new (window.appState.constructor)();
              }
              
              // Clear form data
              const fileInput = document.getElementById('excelFile');
              const messageInput = document.getElementById('message');
              if (fileInput) fileInput.value = '';
              if (messageInput) messageInput.value = '';
              
              // Reset UI elements
              const fileUploadArea = document.getElementById('file-upload-area');
              if (fileUploadArea) {
                const textEl = fileUploadArea.querySelector('.file-upload-text');
                const hintEl = fileUploadArea.querySelector('.file-upload-hint');
                if (textEl) textEl.textContent = 'Drop your Excel file here or click to browse';
                if (hintEl) hintEl.textContent = 'Supports .xlsx and .xls files';
              }
              
              const messagePreview = document.getElementById('message-preview');
              if (messagePreview) {
                messagePreview.textContent = 'Your message preview will appear here...';
                messagePreview.style.fontStyle = 'italic';
                messagePreview.style.color = 'var(--text-tertiary)';
              }
              
              const charCount = document.getElementById('char-count');
              if (charCount) charCount.textContent = '0';
              
              // Reset image selection
              if (window.appState) {
                window.appState.selectedImagePath = null;
              }
              const imagePreview = document.getElementById('image-preview');
              if (imagePreview) imagePreview.style.display = 'none';
              const imageFileName = document.getElementById('imageFileName');
              if (imageFileName) imageFileName.textContent = 'No image selected';
              
              // Reset stats if available
              if (window.appState && typeof window.appState.updateStats === 'function') {
                window.appState.updateStats({ success: 0, failed: 0, total: 0 });
              }
              
              // Show welcome page
              console.log('Navigating to welcome page');
              const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
              pages.forEach(id => {
                const page = document.getElementById(id);
                if (page) {
                  page.style.display = 'none';
                  console.log(`Hidden page: ${id}`);
                }
              });
              
              const welcomePage = document.getElementById('welcome-page');
              if (welcomePage) {
                welcomePage.style.display = 'flex';
                console.log('Welcome page shown');
              } else {
                console.error('Welcome page element not found');
              }
              
              // Log and notify
              if (window.logger && typeof window.logger.info === 'function') {
                window.logger.info('Returned to welcome screen');
              }
              if (window.notifications && typeof window.notifications.info === 'function') {
                window.notifications.info('Returned to welcome screen');
              }
            }
          );
        } else {
          // Fallback if showConfirmationModal is not available
          console.log('showConfirmationModal not available, using confirm dialog');
          if (confirm('Are you sure you want to return to the welcome screen? Any unsaved progress will be lost.')) {
            // Same logic as above but without the modal
            console.log('User confirmed return to welcome (fallback)');
            
            // Reset application state if available
            if (window.appState) {
              window.appState = new (window.appState.constructor)();
            }
            
            // Clear form data
            const fileInput = document.getElementById('excelFile');
            const messageInput = document.getElementById('message');
            if (fileInput) fileInput.value = '';
            if (messageInput) messageInput.value = '';
            
            // Show welcome page
            const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
            pages.forEach(id => {
              const page = document.getElementById(id);
              if (page) page.style.display = 'none';
            });
            
            const welcomePage = document.getElementById('welcome-page');
            if (welcomePage) {
              welcomePage.style.display = 'flex';
              console.log('Welcome page shown (fallback)');
            }
            
            if (window.notifications && typeof window.notifications.info === 'function') {
              window.notifications.info('Returned to welcome screen');
            }
          }
        }
      });
      
      console.log('Back button fix: Event listener added successfully');
    } else {
      console.error('Back button fix: Could not find back-to-welcome-btn element');
    }
  }, 1500); // Wait longer to ensure all other scripts have loaded
});