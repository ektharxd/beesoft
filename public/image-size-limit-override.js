/**
 * IMAGE SIZE LIMIT OVERRIDE
 * Changes the image upload limit from 5MB to 15MB without backend changes
 */

(function() {
  'use strict';

  console.log('📸 Loading Image Size Limit Override...');

  function overrideImageSizeLimit() {
    // Override the FormValidator.validateImageFile method
    if (typeof window.FormValidator !== 'undefined') {
      const originalValidateImageFile = window.FormValidator.validateImageFile;
      
      window.FormValidator.validateImageFile = function(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 15 * 1024 * 1024; // 15MB (increased from 5MB)

        const isValid = validTypes.includes(file.type) && file.size <= maxSize;
        
        if (!isValid && file.size > maxSize) {
          console.log(`📸 Image size: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: 15MB)`);
        }
        
        return isValid;
      };
      
      console.log('✅ Image size limit increased to 15MB');
    } else {
      // If FormValidator doesn't exist yet, try again later
      setTimeout(overrideImageSizeLimit, 100);
    }
  }

  // Also override any file size validation in file upload handlers
  function overrideFileUploadValidation() {
    // Override any drag & drop file validation
    const originalDragOverHandler = window.handleDragOver;
    const originalDropHandler = window.handleDrop;
    
    // Find file upload areas and override their validation
    const fileUploadAreas = document.querySelectorAll('[id*="file"], [class*="upload"], [class*="drop"]');
    
    fileUploadAreas.forEach(area => {
      // Override any existing event listeners for file validation
      const newArea = area.cloneNode(true);
      area.parentNode.replaceChild(newArea, area);
      
      // Add new validation with 15MB limit
      newArea.addEventListener('drop', function(e) {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        
        files.forEach(file => {
          if (file.type.startsWith('image/')) {
            const maxSize = 15 * 1024 * 1024; // 15MB
            if (file.size > maxSize) {
              const sizeMB = (file.size / 1024 / 1024).toFixed(2);
              if (window.notifications) {
                window.notifications.error(`Image too large: ${sizeMB}MB. Maximum allowed: 15MB`);
              } else {
                alert(`Image too large: ${sizeMB}MB. Maximum allowed: 15MB`);
              }
              return false;
            }
          }
        });
      });
    });
  }

  // Add visual indicator of the new limit
  function updateUploadHints() {
    const uploadHints = document.querySelectorAll('.file-upload-hint, .upload-hint, [class*="hint"]');
    
    uploadHints.forEach(hint => {
      if (hint.textContent.includes('5MB') || hint.textContent.includes('5 MB')) {
        hint.textContent = hint.textContent.replace(/5\s?MB/gi, '15MB');
        console.log('📸 Updated upload hint to show 15MB limit');
      }
    });
    
    // Also update any tooltips or help text
    const helpTexts = document.querySelectorAll('[title*="5MB"], [data-tooltip*="5MB"]');
    helpTexts.forEach(element => {
      if (element.title) {
        element.title = element.title.replace(/5\s?MB/gi, '15MB');
      }
      if (element.dataset.tooltip) {
        element.dataset.tooltip = element.dataset.tooltip.replace(/5\s?MB/gi, '15MB');
      }
    });
  }

  // Initialize overrides
  function initializeOverrides() {
    overrideImageSizeLimit();
    overrideFileUploadValidation();
    updateUploadHints();
    
    // Add a notice to console
    console.log('🚀 Image upload limit increased from 5MB to 15MB');
    
    // Add visual confirmation
    if (window.notifications) {
      window.notifications.info('📸 Image upload limit increased to 15MB');
    }
  }

  // Run immediately and after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOverrides);
  } else {
    initializeOverrides();
  }
  
  // Also run after other scripts load
  setTimeout(initializeOverrides, 500);
  setTimeout(initializeOverrides, 1500);
  setTimeout(initializeOverrides, 3000);

})();
