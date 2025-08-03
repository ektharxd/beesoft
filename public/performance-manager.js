/**
 * PERFORMANCE MANAGER - Optimizes DOM operations and reduces memory leaks
 */

class PerformanceManager {
  constructor() {
    this.eventCleanupQueue = new Set();
    this.intervalCleanupQueue = new Set();
    this.observerCleanupQueue = new Set();
    this.rafQueue = new Map();
    
    this.init();
  }

  init() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', this.cleanup.bind(this));
    
    // Debounced resize handler
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
  }

  // Safe event listener management
  addEventListenerSafe(element, event, handler, options = {}) {
    if (!element || typeof handler !== 'function') return;

    element.addEventListener(event, handler, options);
    
    // Store for cleanup
    this.eventCleanupQueue.add({
      element,
      event,
      handler,
      options
    });

    return handler;
  }

  // Safe interval management
  setIntervalSafe(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.intervalCleanupQueue.add(intervalId);
    return intervalId;
  }

  // Safe timeout with RAF fallback
  setTimeoutSafe(callback, delay = 0) {
    if (delay === 0) {
      // Use RAF for immediate execution
      const rafId = requestAnimationFrame(callback);
      return rafId;
    } else {
      const timeoutId = setTimeout(callback, delay);
      return timeoutId;
    }
  }

  // Batch DOM operations
  batchDOMUpdates(operations) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const results = operations.map(op => {
          try {
            return op();
          } catch (error) {
            console.error('DOM operation failed:', error);
            return null;
          }
        });
        resolve(results);
      });
    });
  }

  // Debounce utility
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  }

  // Throttle utility
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Optimized element visibility check
  isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
  }

  // Memory-efficient DOM queries
  queryCache = new Map();
  
  querySelector(selector, useCache = true) {
    if (useCache && this.queryCache.has(selector)) {
      const cached = this.queryCache.get(selector);
      // Verify element is still in DOM
      if (document.contains(cached)) {
        return cached;
      } else {
        this.queryCache.delete(selector);
      }
    }

    const element = document.querySelector(selector);
    if (element && useCache) {
      this.queryCache.set(selector, element);
    }
    
    return element;
  }

  // Optimized style updates
  updateStyles(element, styles) {
    if (!element || !styles) return;

    // Batch style updates to minimize reflows
    requestAnimationFrame(() => {
      Object.entries(styles).forEach(([property, value]) => {
        element.style[property] = value;
      });
    });
  }

  // Handle resize events efficiently
  handleResize() {
    // Clear query cache on resize
    this.queryCache.clear();
    
    // Trigger custom resize event for components
    document.dispatchEvent(new CustomEvent('optimized:resize', {
      detail: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }));
  }

  // Memory monitoring (development only)
  monitorMemory() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory;
      console.log('Memory Usage:', {
        used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
      });
    }
  }

  // Cleanup all resources
  cleanup() {
    // Clean up event listeners
    this.eventCleanupQueue.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options);
      } catch (error) {
        console.warn('Failed to remove event listener:', error);
      }
    });
    this.eventCleanupQueue.clear();

    // Clean up intervals
    this.intervalCleanupQueue.forEach(intervalId => {
      clearInterval(intervalId);
    });
    this.intervalCleanupQueue.clear();

    // Clean up observers
    this.observerCleanupQueue.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect observer:', error);
      }
    });
    this.observerCleanupQueue.clear();

    // Clear caches
    this.queryCache.clear();
    this.rafQueue.clear();
  }
}

// Initialize global performance manager
window.performanceManager = new PerformanceManager();

// Legacy compatibility helpers
window.addEventListenerSafe = (element, event, handler, options) => 
  window.performanceManager.addEventListenerSafe(element, event, handler, options);

window.setIntervalSafe = (callback, delay) => 
  window.performanceManager.setIntervalSafe(callback, delay);

window.batchDOMUpdates = (operations) => 
  window.performanceManager.batchDOMUpdates(operations);
