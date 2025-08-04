/**
 * API ERROR HANDLING FIX
 * Fixes JSON parsing errors and API response handling
 */

(function() {
  'use strict';

  console.log('🔧 Loading API Error Handling Fix...');

  // Override fetch to handle non-JSON responses gracefully
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(this, args);
      
      // Clone response for error handling
      const responseClone = response.clone();
      
      // If response is not ok, try to read as text first
      if (!response.ok) {
        try {
          const text = await responseClone.text();
          console.warn('❌ API Error Response:', {
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            body: text.substring(0, 200) + (text.length > 200 ? '...' : '')
          });
        } catch (e) {
          console.warn('❌ API Error (no body):', {
            url: args[0],
            status: response.status,
            statusText: response.statusText
          });
        }
      }
      
      return response;
      
    } catch (error) {
      console.error('🚫 Fetch Error:', {
        url: args[0],
        error: error.message
      });
      throw error;
    }
  };

  // Add JSON parsing helper with better error handling
  window.safeJsonParse = async function(response) {
    const text = await response.text();
    
    if (!text || text.trim() === '') {
      return null;
    }
    
    // Check if response looks like HTML
    if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
      console.warn('⚠️ Received HTML instead of JSON:', text.substring(0, 100) + '...');
      throw new Error('Server returned HTML instead of JSON. This usually means the API endpoint is not available.');
    }
    
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('❌ JSON Parse Error:', {
        text: text.substring(0, 200),
        error: error.message
      });
      throw new Error(`Invalid JSON response: ${error.message}`);
    }
  };

  // Override common API functions to use better error handling
  function enhanceApiCalls() {
    // Find and enhance device registration calls
    if (typeof window.registerDevice === 'function') {
      const originalRegisterDevice = window.registerDevice;
      window.registerDevice = async function(...args) {
        try {
          return await originalRegisterDevice.apply(this, args);
        } catch (error) {
          console.error('Device registration failed:', error.message);
          if (window.notifications) {
            window.notifications.error('Device registration failed. Please check your internet connection.');
          }
          throw error;
        }
      };
    }

    // Find and enhance message limits API calls
    if (window.messageLimitsWidget) {
      const widget = window.messageLimitsWidget;
      const originalLoadLimits = widget.loadLimits;
      
      if (originalLoadLimits) {
        widget.loadLimits = async function(...args) {
          try {
            return await originalLoadLimits.apply(this, args);
          } catch (error) {
            console.warn('Message limits API unavailable:', error.message);
            // Fail silently for message limits as it's not critical
            return null;
          }
        };
      }
    }
  }

  // Initialize enhancements
  setTimeout(enhanceApiCalls, 1000);
  setTimeout(enhanceApiCalls, 3000);

  console.log('✅ API Error Handling Fix applied');

})();
