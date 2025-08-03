/**
 * ENHANCED TRIAL CHECK OVERRIDE - Final solution
 * Prevents unwanted navigation and enforces 5-minute intervals
 */

console.log('🔧 Loading Enhanced Trial Check Override...');

(function() {
  'use strict';

  let lastCheckTime = 0;
  const FIVE_MINUTES = 300000;

  function overrideSystem() {
    // Override checkTrial completely
    window.checkTrial = function() {
      const now = Date.now();
      
      // Enforce 5-minute minimum between checks
      if (now - lastCheckTime < FIVE_MINUTES) {
        console.log('⏰ Trial check blocked - too soon (5-min cooldown active)');
        return;
      }
      
      lastCheckTime = now;
      console.log('✅ Trial check allowed after 5-minute cooldown');
    };

    // Block any rapid setInterval calls for trial checks
    const originalSetInterval = window.setInterval;
    window.setInterval = function(callback, delay) {
      // Block rapid trial check intervals
      if (delay < 60000 && callback.toString().toLowerCase().includes('trial')) {
        console.log(`🚫 Blocked rapid trial check interval (${delay}ms)`);
        return null;
      }
      return originalSetInterval.apply(this, arguments);
    };

    console.log('✅ Enhanced trial check override installed');
  }

  // Install override immediately and repeatedly
  overrideSystem();
  setTimeout(overrideSystem, 100);
  setTimeout(overrideSystem, 500);
  setTimeout(overrideSystem, 1000);
  setTimeout(overrideSystem, 2000);

})();
