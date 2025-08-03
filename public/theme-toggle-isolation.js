/**
 * THEME TOGGLE ISOLATION - Ensures theme toggle never triggers page navigation
 */

(function() {
  'use strict';

  function isolateThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) {
      setTimeout(isolateThemeToggle, 50);
      return;
    }

    console.log('🎨 Isolating theme toggle...');

    // Create a completely isolated theme toggle
    const isolatedToggle = document.createElement('button');
    isolatedToggle.id = 'theme-toggle';
    isolatedToggle.style.cssText = themeToggle.style.cssText;
    
    // Get current theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    isolatedToggle.textContent = currentTheme === 'dark' ? '☀️ Light' : '🌓 Dark';
    isolatedToggle.style.background = currentTheme === 'dark' ? '#f59e0b' : '#4f46e5';

    // Apply current theme
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Add isolated click handler
    isolatedToggle.addEventListener('click', function(e) {
      // Completely stop all event propagation
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = current === 'dark' ? 'light' : 'dark';
      
      // Apply theme
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Update button
      isolatedToggle.textContent = newTheme === 'dark' ? '☀️ Light' : '🌓 Dark';
      isolatedToggle.style.background = newTheme === 'dark' ? '#f59e0b' : '#4f46e5';
      
      console.log('Theme toggled to:', newTheme);

      // Prevent any other handlers
      return false;
    }, true);

    // Prevent any other mouse events from interfering
    ['mousedown', 'mouseup', 'mousemove'].forEach(eventType => {
      isolatedToggle.addEventListener(eventType, function(e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }, true);
    });

    // Replace the old toggle
    themeToggle.parentNode.replaceChild(isolatedToggle, themeToggle);

    console.log('✅ Theme toggle isolated successfully');
  }

  // Run immediately and after DOM ready
  isolateThemeToggle();
  
  document.addEventListener('DOMContentLoaded', isolateThemeToggle);
  
  // Also run after other scripts load
  setTimeout(isolateThemeToggle, 1000);
  setTimeout(isolateThemeToggle, 3000);

})();
