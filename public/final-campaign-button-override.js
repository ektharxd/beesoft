/**
 * FINAL CAMPAIGN BUTTON OVERRIDE
 * This script ensures the Start Campaign button works correctly
 * and overrides any conflicting logic from other scripts
 */

(function() {
  'use strict';

  console.log('🔧 Loading Final Campaign Button Override...');

  let overrideActive = false;

  function applyFinalOverride() {
    if (overrideActive) return;
    
    const sendButton = document.getElementById('sendButton');
    if (!sendButton) {
      setTimeout(applyFinalOverride, 100);
      return;
    }

    console.log('🚀 Applying final campaign button override...');
    overrideActive = true;

    // Override the disabled property
    Object.defineProperty(sendButton, 'disabled', {
      get: function() {
        // Check if we have the minimum requirements
        const messageInput = document.getElementById('message');
        const hasMessage = messageInput && messageInput.value.trim().length > 0;
        const hasFile = window.appState && (window.appState.hasFile || (window.appState.phoneNumbers && window.appState.phoneNumbers.length > 0));
        const isSessionActive = window.appState && window.appState.isSessionActive;
        
        // Enable if we have message and file, regardless of connection status
        const shouldBeEnabled = hasMessage && hasFile && !isSessionActive;
        
        console.log('📊 Button state check:', {
          hasMessage,
          hasFile,
          isSessionActive,
          shouldBeEnabled
        });
        
        return !shouldBeEnabled;
      },
      set: function(value) {
        // Ignore attempts to disable the button if we have the requirements
        const messageInput = document.getElementById('message');
        const hasMessage = messageInput && messageInput.value.trim().length > 0;
        const hasFile = window.appState && (window.appState.hasFile || (window.appState.phoneNumbers && window.appState.phoneNumbers.length > 0));
        const isSessionActive = window.appState && window.appState.isSessionActive;
        
        const shouldBeEnabled = hasMessage && hasFile && !isSessionActive;
        
        if (shouldBeEnabled && value === true) {
          console.log('🛡️ Prevented button disable - requirements met');
          return;
        }
        
        // Allow disabling if session is active or requirements not met
        this.setAttribute('disabled', value ? 'disabled' : null);
        
        // Update visual state
        if (value) {
          this.style.opacity = '0.6';
          this.style.cursor = 'not-allowed';
          this.style.backgroundColor = '#9ca3af';
        } else {
          this.style.opacity = '1';
          this.style.cursor = 'pointer';
          this.style.backgroundColor = '#4f46e5';
        }
      }
    });

    // Override the updateActionButtons method if it exists
    if (window.appState && window.appState.updateActionButtons) {
      const originalUpdateActionButtons = window.appState.updateActionButtons;
      window.appState.updateActionButtons = function() {
        // Call original method
        originalUpdateActionButtons.call(this);
        
        // Then apply our override
        setTimeout(() => {
          const messageInput = document.getElementById('message');
          const hasMessage = messageInput && messageInput.value.trim().length > 0;
          const hasFile = this.hasFile || (this.phoneNumbers && this.phoneNumbers.length > 0);
          const isSessionActive = this.isSessionActive;
          
          const shouldBeEnabled = hasMessage && hasFile && !isSessionActive;
          
          if (shouldBeEnabled) {
            sendButton.removeAttribute('disabled');
            sendButton.style.opacity = '1';
            sendButton.style.cursor = 'pointer';
            sendButton.style.backgroundColor = '#4f46e5';
            console.log('✅ Button force-enabled via updateActionButtons override');
          }
        }, 10);
      };
    }

    // Monitor for changes and reapply override
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
          setTimeout(() => {
            const messageInput = document.getElementById('message');
            const hasMessage = messageInput && messageInput.value.trim().length > 0;
            const hasFile = window.appState && (window.appState.hasFile || (window.appState.phoneNumbers && window.appState.phoneNumbers.length > 0));
            const isSessionActive = window.appState && window.appState.isSessionActive;
            
            const shouldBeEnabled = hasMessage && hasFile && !isSessionActive;
            
            if (shouldBeEnabled && sendButton.hasAttribute('disabled')) {
              sendButton.removeAttribute('disabled');
              sendButton.style.opacity = '1';
              sendButton.style.cursor = 'pointer';
              sendButton.style.backgroundColor = '#4f46e5';
              console.log('🛡️ Button re-enabled via mutation observer');
            }
          }, 10);
        }
      });
    });

    observer.observe(sendButton, {
      attributes: true,
      attributeFilter: ['disabled']
    });

    // Periodic check to ensure button stays enabled when it should be
    setInterval(() => {
      if (!window.appState) return;
      
      const messageInput = document.getElementById('message');
      const hasMessage = messageInput && messageInput.value.trim().length > 0;
      const hasFile = window.appState.hasFile || (window.appState.phoneNumbers && window.appState.phoneNumbers.length > 0);
      const isSessionActive = window.appState.isSessionActive;
      
      const shouldBeEnabled = hasMessage && hasFile && !isSessionActive;
      
      if (shouldBeEnabled && sendButton.hasAttribute('disabled')) {
        sendButton.removeAttribute('disabled');
        sendButton.style.opacity = '1';
        sendButton.style.cursor = 'pointer';
        sendButton.style.backgroundColor = '#4f46e5';
        console.log('🔄 Button re-enabled via periodic check');
      }
    }, 2000);

    // Initial state check
    setTimeout(() => {
      const messageInput = document.getElementById('message');
      const hasMessage = messageInput && messageInput.value.trim().length > 0;
      const hasFile = window.appState && (window.appState.hasFile || (window.appState.phoneNumbers && window.appState.phoneNumbers.length > 0));
      const isSessionActive = window.appState && window.appState.isSessionActive;
      
      const shouldBeEnabled = hasMessage && hasFile && !isSessionActive;
      
      if (shouldBeEnabled) {
        sendButton.removeAttribute('disabled');
        sendButton.style.opacity = '1';
        sendButton.style.cursor = 'pointer';
        sendButton.style.backgroundColor = '#4f46e5';
        console.log('✅ Button enabled on initial check');
      }
    }, 1000);

    console.log('✅ Final campaign button override applied');
  }

  // Apply override when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFinalOverride);
  } else {
    applyFinalOverride();
  }

  // Apply after other scripts load
  setTimeout(applyFinalOverride, 2000);
  setTimeout(applyFinalOverride, 5000);

})();