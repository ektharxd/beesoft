/**
 * ACCESSIBILITY ENHANCEMENTS - Improves app accessibility without major changes
 * Adds ARIA labels, keyboard navigation, and screen reader support
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    console.log('♿ Accessibility Enhancements Loading...');

    // 1. Add proper ARIA labels to existing elements
    function enhanceAriaLabels() {
      // Theme toggle
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.setAttribute('aria-label', 'Toggle dark/light theme');
        themeToggle.setAttribute('role', 'switch');
      }

      // File input
      const fileInput = document.getElementById('excelFile');
      if (fileInput) {
        fileInput.setAttribute('aria-describedby', 'file-help-text');
        
        // Add help text if it doesn't exist
        if (!document.getElementById('file-help-text')) {
          const helpText = document.createElement('div');
          helpText.id = 'file-help-text';
          helpText.className = 'sr-only';
          helpText.textContent = 'Upload an Excel file containing phone numbers and names';
          fileInput.parentNode?.insertBefore(helpText, fileInput.nextSibling);
        }
      }

      // Message textarea
      const messageInput = document.getElementById('message');
      if (messageInput) {
        messageInput.setAttribute('aria-describedby', 'message-help-text');
        
        if (!document.getElementById('message-help-text')) {
          const helpText = document.createElement('div');
          helpText.id = 'message-help-text';
          helpText.className = 'sr-only';
          helpText.textContent = 'Enter your message. Use {{name}} to personalize messages';
          messageInput.parentNode?.insertBefore(helpText, messageInput.nextSibling);
        }
      }

      // Send button
      const sendButton = document.getElementById('sendButton');
      if (sendButton) {
        sendButton.setAttribute('aria-describedby', 'send-status');
      }

      // Progress elements
      const progressBar = document.getElementById('progress');
      if (progressBar) {
        progressBar.setAttribute('role', 'progressbar');
        progressBar.setAttribute('aria-label', 'Message sending progress');
        progressBar.setAttribute('aria-valuenow', '0');
        progressBar.setAttribute('aria-valuemin', '0');
        progressBar.setAttribute('aria-valuemax', '100');
      }
    }

    // 2. Add keyboard navigation for custom elements
    function enhanceKeyboardNavigation() {
      // Make workflow steps keyboard accessible
      const stepIndicators = document.querySelectorAll('[id^="step-"][id$="-indicator"]');
      stepIndicators.forEach((indicator, index) => {
        indicator.setAttribute('tabindex', '0');
        indicator.setAttribute('role', 'button');
        indicator.setAttribute('aria-label', `Step ${index + 1}`);
        
        indicator.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Simulate click
            indicator.click();
          }
        });
      });

      // Enhance card click areas
      const clickableCards = document.querySelectorAll('.card[onclick], .card[data-action]');
      clickableCards.forEach(card => {
        if (!card.hasAttribute('tabindex')) {
          card.setAttribute('tabindex', '0');
          card.setAttribute('role', 'button');
          
          card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              card.click();
            }
          });
        }
      });

      // Add keyboard support for total messages chip
      const messageChip = document.getElementById('total-messages-chip');
      if (messageChip) {
        messageChip.setAttribute('tabindex', '0');
        messageChip.setAttribute('role', 'button');
        messageChip.setAttribute('aria-label', 'View message statistics');
        
        messageChip.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            messageChip.click();
          }
        });
      }
    }

    // 3. Add live regions for dynamic content
    function addLiveRegions() {
      // Create a live region for status updates
      if (!document.getElementById('status-live-region')) {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'status-live-region';
        liveRegion.className = 'sr-only';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
      }

      // Create a live region for errors
      if (!document.getElementById('error-live-region')) {
        const errorRegion = document.createElement('div');
        errorRegion.id = 'error-live-region';
        errorRegion.className = 'sr-only';
        errorRegion.setAttribute('aria-live', 'assertive');
        errorRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(errorRegion);
      }
    }

    // 4. Enhance form validation messages
    function enhanceFormValidation() {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
          // Add aria-required for required fields
          if (input.hasAttribute('required')) {
            input.setAttribute('aria-required', 'true');
          }

          // Add validation message containers
          const existingError = input.parentNode?.querySelector('.form-error');
          if (!existingError) {
            const errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            errorElement.id = `${input.id || input.name}-error`;
            errorElement.setAttribute('role', 'alert');
            errorElement.style.display = 'none';
            input.parentNode?.appendChild(errorElement);
            
            input.setAttribute('aria-describedby', errorElement.id);
          }

          // Enhanced validation on blur
          input.addEventListener('blur', function() {
            const errorElement = document.getElementById(`${input.id || input.name}-error`);
            if (errorElement) {
              if (!input.validity.valid) {
                errorElement.textContent = input.validationMessage;
                errorElement.style.display = 'block';
                input.setAttribute('aria-invalid', 'true');
              } else {
                errorElement.style.display = 'none';
                input.setAttribute('aria-invalid', 'false');
              }
            }
          });
        });
      });
    }

    // 5. Add skip links for better navigation
    function addSkipLinks() {
      if (!document.getElementById('skip-links')) {
        const skipLinks = document.createElement('div');
        skipLinks.id = 'skip-links';
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
          <a href="#main-content" class="skip-link">Skip to main content</a>
          <a href="#navigation" class="skip-link">Skip to navigation</a>
        `;
        document.body.insertBefore(skipLinks, document.body.firstChild);
      }

      // Add main content landmark
      const mainContent = document.querySelector('.page-wrapper');
      if (mainContent && !mainContent.id) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('role', 'main');
      }
    }

    // 6. Enhance focus management
    function enhanceFocusManagement() {
      // Add focus-visible polyfill for older browsers
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
          document.body.classList.add('keyboard-navigation');
        }
      });

      document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
      });

      // Trap focus in modals (if modal system isn't handling it)
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
          const activeModal = document.querySelector('.modal-overlay:not([style*="display: none"])');
          if (activeModal && !window.modalSystem) {
            trapFocus(activeModal, e);
          }
        }
      });

      function trapFocus(modal, e) {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    }

    // 7. Add screen reader announcements for dynamic updates
    function announceToScreenReader(message, priority = 'polite') {
      const regionId = priority === 'assertive' ? 'error-live-region' : 'status-live-region';
      const liveRegion = document.getElementById(regionId);
      if (liveRegion) {
        liveRegion.textContent = message;
        // Clear after a short delay to allow for re-announcements
        setTimeout(() => {
          liveRegion.textContent = '';
        }, 1000);
      }
    }

    // 8. Monitor for dynamic content and enhance it
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              // Enhance new buttons
              const newButtons = node.querySelectorAll ? node.querySelectorAll('button') : [];
              newButtons.forEach(button => {
                if (!button.hasAttribute('aria-label') && !button.textContent.trim()) {
                  const icon = button.querySelector('.material-symbols-outlined');
                  if (icon) {
                    button.setAttribute('aria-label', icon.textContent.replace(/_/g, ' '));
                  }
                }
              });

              // Enhance new links
              const newLinks = node.querySelectorAll ? node.querySelectorAll('a') : [];
              newLinks.forEach(link => {
                if (link.hasAttribute('target') && link.getAttribute('target') === '_blank') {
                  if (!link.hasAttribute('aria-label')) {
                    link.setAttribute('aria-label', `${link.textContent} (opens in new tab)`);
                  }
                }
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 9. Add high contrast mode detection
    function detectHighContrast() {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      
      function handleContrastChange(e) {
        if (e.matches) {
          document.body.classList.add('high-contrast');
          announceToScreenReader('High contrast mode detected');
        } else {
          document.body.classList.remove('high-contrast');
        }
      }

      mediaQuery.addListener(handleContrastChange);
      handleContrastChange(mediaQuery);
    }

    // 10. Add reduced motion detection
    function detectReducedMotion() {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      function handleMotionChange(e) {
        if (e.matches) {
          document.body.classList.add('reduced-motion');
        } else {
          document.body.classList.remove('reduced-motion');
        }
      }

      mediaQuery.addListener(handleMotionChange);
      handleMotionChange(mediaQuery);
    }

    // Initialize all enhancements
    enhanceAriaLabels();
    enhanceKeyboardNavigation();
    addLiveRegions();
    enhanceFormValidation();
    addSkipLinks();
    enhanceFocusManagement();
    detectHighContrast();
    detectReducedMotion();

    // Make the announcement function globally available
    window.announceToScreenReader = announceToScreenReader;

    // Hook into existing notification system
    if (window.notifications && typeof window.notifications.info === 'function') {
      const originalInfo = window.notifications.info;
      window.notifications.info = function(message) {
        announceToScreenReader(message);
        return originalInfo.call(this, message);
      };

      const originalError = window.notifications.error;
      window.notifications.error = function(message) {
        announceToScreenReader(message, 'assertive');
        return originalError.call(this, message);
      };
    }

    console.log('✅ Accessibility Enhancements Complete');
    document.dispatchEvent(new CustomEvent('accessibility:enhanced'));
  });

})();
