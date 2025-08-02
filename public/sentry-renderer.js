/**
 * Sentry initialization for Electron renderer process
 * This file initializes Sentry error monitoring for the frontend/UI
 */

// Import Sentry for renderer process
const Sentry = require('@sentry/electron/renderer');

// Initialize Sentry with the same configuration as main process
Sentry.init({
  dsn: "https://2d868c4a667e70f6b07da800f0923a76@o4509730213265408.ingest.us.sentry.io/4509730219229184",
  
  // Environment detection
  environment: process.env.NODE_ENV || 'production',
  
  // Sample rate for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Tags for renderer process
  tags: {
    process: 'renderer',
    component: 'ui'
  },
  
  // Context for renderer process
  contexts: {
    renderer: {
      type: 'renderer_process',
      ui_framework: 'vanilla_js'
    }
  },
  
  // Error filtering for renderer process
  beforeSend: (event) => {
    // Filter out development-only errors in production
    if (process.env.NODE_ENV === 'production') {
      // Skip console errors in production
      if (event.logger === 'console') {
        return null;
      }
    }
    
    // Add renderer-specific context
    if (event.contexts) {
      event.contexts.renderer_info = {
        url: window.location.href,
        user_agent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    }
    
    return event;
  }
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  Sentry.captureException(event.reason);
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  Sentry.captureException(event.error);
});

console.log('🔍 Sentry renderer process initialized');
