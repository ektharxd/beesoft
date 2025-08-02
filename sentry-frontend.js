// ==========================================================================
// SENTRY TEST FUNCTIONALITY
// ==========================================================================

// Add test Sentry button functionality when DOM is ready
setTimeout(() => {
  // Create test Sentry button if it doesn't exist
  if (!document.getElementById('test-sentry-btn')) {
    const testButton = document.createElement('button');
    testButton.id = 'test-sentry-btn';
    testButton.innerHTML = '🐛 Test Sentry';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '20px';
    testButton.style.right = '20px';
    testButton.style.zIndex = '9999';
    testButton.style.backgroundColor = '#ff6b6b';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.padding = '10px 15px';
    testButton.style.borderRadius = '8px';
    testButton.style.cursor = 'pointer';
    testButton.style.fontSize = '14px';
    testButton.style.fontWeight = '500';
    testButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    testButton.style.transition = 'all 0.2s ease';
    
    testButton.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
    });
    
    testButton.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    document.body.appendChild(testButton);
  }
  
  // Add click handler for test Sentry button
  const testSentryButton = document.getElementById('test-sentry-btn');
  if (testSentryButton) {
    testSentryButton.addEventListener('click', async () => {
      try {
        testSentryButton.disabled = true;
        testSentryButton.innerHTML = '⏳ Testing...';
        
        if (window.electronAPI && window.electronAPI.testSentryError) {
          const result = await window.electronAPI.testSentryError();
          
          if (result.success) {
            if (window.notifications) {
              window.notifications.success('Test error sent to Sentry successfully!');
            }
            if (window.logger) {
              window.logger.success('Sentry test completed - Check your Sentry dashboard');
            }
            console.log('✅ Sentry test successful!');
          } else {
            if (window.notifications) {
              window.notifications.error('Failed to send test error to Sentry');
            }
            if (window.logger) {
              window.logger.error('Sentry test failed: ' + result.message);
            }
            console.error('❌ Sentry test failed:', result.message);
          }
        } else {
          if (window.notifications) {
            window.notifications.error('Sentry test not available in this environment');
          }
          if (window.logger) {
            window.logger.error('Sentry test API not available');
          }
          console.error('❌ Sentry test API not available');
        }
      } catch (error) {
        if (window.notifications) {
          window.notifications.error('Error testing Sentry: ' + error.message);
        }
        if (window.logger) {
          window.logger.error('Sentry test error: ' + error.message);
        }
        console.error('❌ Sentry test error:', error.message);
      } finally {
        setTimeout(() => {
          if (testSentryButton) {
            testSentryButton.disabled = false;
            testSentryButton.innerHTML = '🐛 Test Sentry';
          }
        }, 2000);
      }
    });
  }
}, 1000);