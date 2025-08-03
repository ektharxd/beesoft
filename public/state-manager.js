/**
 * STATE MANAGER - Centralized state management with reactive updates
 * Reduces global pollution and provides better state coordination
 */

class StateManager {
  constructor() {
    this.state = new Proxy({}, {
      set: (target, property, value) => {
        const oldValue = target[property];
        target[property] = value;
        this.notifySubscribers(property, value, oldValue);
        return true;
      }
    });
    
    this.subscribers = new Map();
    this.computed = new Map();
    this.middleware = [];
    
    this.init();
  }

  init() {
    // Initialize default state
    this.state = {
      currentPage: 'welcome-page',
      isTrialMode: true,
      trialDaysLeft: 30,
      totalMessagesSent: 0,
      isDeveloperAuthenticated: false,
      networkStatus: 'online',
      theme: 'light',
      modalsOpen: new Set(),
      errors: [],
      loading: new Set()
    };
  }

  // Subscribe to state changes
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const keySubscribers = this.subscribers.get(key);
      if (keySubscribers) {
        keySubscribers.delete(callback);
        if (keySubscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Subscribe to multiple keys
  subscribeMultiple(keys, callback) {
    const unsubscribers = keys.map(key => this.subscribe(key, callback));
    return () => unsubscribers.forEach(unsub => unsub());
  }

  // Notify subscribers of changes
  notifySubscribers(key, newValue, oldValue) {
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error(`Error in state subscriber for ${key}:`, error);
        }
      });
    }

    // Also notify wildcard subscribers
    const wildcardSubscribers = this.subscribers.get('*');
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error(`Error in wildcard state subscriber:`, error);
        }
      });
    }

    // Update computed values
    this.updateComputed(key);
  }

  // Get state value
  get(key) {
    return this.state[key];
  }

  // Set state value
  set(key, value) {
    // Apply middleware
    let processedValue = value;
    for (const middleware of this.middleware) {
      processedValue = middleware(key, processedValue, this.state[key]);
    }
    
    this.state[key] = processedValue;
  }

  // Update multiple state values atomically
  update(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  // Add computed property
  addComputed(key, dependencies, computeFn) {
    this.computed.set(key, {
      dependencies,
      compute: computeFn
    });

    // Initial computation
    this.updateComputed(key);

    // Subscribe to dependencies
    dependencies.forEach(dep => {
      this.subscribe(dep, () => this.updateComputed(key));
    });
  }

  // Update computed values
  updateComputed(changedKey) {
    for (const [computedKey, { dependencies, compute }] of this.computed) {
      if (dependencies.includes(changedKey) || changedKey === computedKey) {
        try {
          const dependencyValues = dependencies.map(dep => this.state[dep]);
          const newValue = compute(...dependencyValues);
          
          // Set without triggering middleware
          const oldValue = this.state[computedKey];
          this.state[computedKey] = newValue;
          this.notifySubscribers(computedKey, newValue, oldValue);
        } catch (error) {
          console.error(`Error computing ${computedKey}:`, error);
        }
      }
    }
  }

  // Add middleware
  addMiddleware(middlewareFn) {
    this.middleware.push(middlewareFn);
  }

  // Page management
  navigateToPage(pageId) {
    const currentPage = this.get('currentPage');
    if (currentPage !== pageId) {
      this.set('currentPage', pageId);
    }
  }

  // Modal management
  openModal(modalId) {
    const modalsOpen = new Set(this.get('modalsOpen'));
    modalsOpen.add(modalId);
    this.set('modalsOpen', modalsOpen);
  }

  closeModal(modalId) {
    const modalsOpen = new Set(this.get('modalsOpen'));
    modalsOpen.delete(modalId);
    this.set('modalsOpen', modalsOpen);
  }

  // Error management
  addError(error) {
    const errors = [...this.get('errors'), {
      id: Date.now(),
      message: error.message || error,
      timestamp: new Date(),
      type: error.type || 'error'
    }];
    this.set('errors', errors);
  }

  removeError(errorId) {
    const errors = this.get('errors').filter(err => err.id !== errorId);
    this.set('errors', errors);
  }

  clearErrors() {
    this.set('errors', []);
  }

  // Loading management
  startLoading(key) {
    const loading = new Set(this.get('loading'));
    loading.add(key);
    this.set('loading', loading);
  }

  stopLoading(key) {
    const loading = new Set(this.get('loading'));
    loading.delete(key);
    this.set('loading', loading);
  }

  isLoading(key) {
    return this.get('loading').has(key);
  }

  // Persistence
  persist(keys = []) {
    const dataToStore = {};
    keys.forEach(key => {
      if (this.state.hasOwnProperty(key)) {
        dataToStore[key] = this.state[key];
      }
    });
    
    try {
      localStorage.setItem('beesoft_state', JSON.stringify(dataToStore));
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }

  restore(keys = []) {
    try {
      const stored = localStorage.getItem('beesoft_state');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, value]) => {
          if (keys.length === 0 || keys.includes(key)) {
            this.set(key, value);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to restore state:', error);
    }
  }

  // Debug helpers
  getState() {
    return { ...this.state };
  }

  reset() {
    Object.keys(this.state).forEach(key => {
      delete this.state[key];
    });
    this.init();
  }
}

// Initialize global state manager
window.stateManager = new StateManager();

// Add computed properties
window.stateManager.addComputed('trialStatus', ['isTrialMode', 'trialDaysLeft'], (isTrialMode, daysLeft) => {
  if (!isTrialMode) return 'active';
  if (daysLeft <= 0) return 'expired';
  if (daysLeft <= 3) return 'expiring';
  return 'trial';
});

window.stateManager.addComputed('canSendMessages', ['trialStatus', 'networkStatus'], (trialStatus, networkStatus) => {
  return trialStatus !== 'expired' && networkStatus === 'online';
});

// Subscribe to page changes
window.stateManager.subscribe('currentPage', (newPage, oldPage) => {
  // Hide all pages
  const pages = document.querySelectorAll('.page-wrapper, [id$="-page"]');
  pages.forEach(page => {
    if (page) {
      page.style.display = 'none';
      page.setAttribute('aria-hidden', 'true');
    }
  });

  // Show new page
  const pageElement = document.getElementById(newPage);
  if (pageElement) {
    pageElement.style.display = 'flex';
    pageElement.removeAttribute('aria-hidden');
  }

  // Log navigation
  if (window.logger && typeof window.logger.info === 'function') {
    window.logger.info(`Navigated from ${oldPage} to ${newPage}`);
  }
});

// Subscribe to error changes
window.stateManager.subscribe('errors', (errors) => {
  if (errors.length > 0 && window.notifications) {
    const latestError = errors[errors.length - 1];
    window.notifications.error(latestError.message);
  }
});

// Legacy compatibility
window.appState = {
  get currentStep() { return window.stateManager.get('currentStep') || 1; },
  set currentStep(value) { window.stateManager.set('currentStep', value); },
  
  get selectedImagePath() { return window.stateManager.get('selectedImagePath'); },
  set selectedImagePath(value) { window.stateManager.set('selectedImagePath', value); },
  
  updateWorkflowUI() {
    // Trigger UI update
    document.dispatchEvent(new CustomEvent('workflow:update'));
  },
  
  updateActionButtons() {
    // Trigger button update
    document.dispatchEvent(new CustomEvent('buttons:update'));
  },

  updateStats(stats) {
    window.stateManager.set('messageStats', stats);
  }
};

// Auto-persist important state
const persistedKeys = ['theme', 'totalMessagesSent', 'trialDaysLeft', 'isTrialMode'];
window.stateManager.restore(persistedKeys);

// Persist state changes
persistedKeys.forEach(key => {
  window.stateManager.subscribe(key, () => {
    window.stateManager.persist(persistedKeys);
  });
});
