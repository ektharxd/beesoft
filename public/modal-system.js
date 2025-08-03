/**
 * MODAL SYSTEM - Centralized modal management with proper lifecycle
 * Fixes z-index conflicts, memory leaks, and accessibility issues
 */

class ModalSystem {
  constructor() {
    this.activeModals = new Set();
    this.zIndexCounter = 10000;
    this.originalBodyOverflow = '';
    this.focusStack = [];
    
    this.init();
  }

  init() {
    // Global keyboard handler
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Global click handler for backdrop clicks
    document.addEventListener('click', this.handleBackdropClick.bind(this));
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  }

  show(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.warn(`Modal ${modalId} not found`);
      return;
    }

    // Store current focus
    this.focusStack.push(document.activeElement);

    // Prevent body scroll
    if (this.activeModals.size === 0) {
      this.originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    // Set proper z-index
    const zIndex = this.zIndexCounter++;
    modal.style.zIndex = zIndex;

    // Show modal with proper attributes
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    // Add to active modals
    this.activeModals.add(modalId);

    // Focus management
    this.setInitialFocus(modal);

    // Trigger custom event
    modal.dispatchEvent(new CustomEvent('modal:shown', { detail: options }));

    return modal;
  }

  hide(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal || !this.activeModals.has(modalId)) {
      return;
    }

    // Hide modal
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('role');
    modal.removeAttribute('aria-modal');

    // Remove from active modals
    this.activeModals.delete(modalId);

    // Restore body scroll if no modals are active
    if (this.activeModals.size === 0) {
      document.body.style.overflow = this.originalBodyOverflow;
    }

    // Restore focus
    if (this.focusStack.length > 0) {
      const previousFocus = this.focusStack.pop();
      if (previousFocus && previousFocus.focus) {
        previousFocus.focus();
      }
    }

    // Trigger custom event
    modal.dispatchEvent(new CustomEvent('modal:hidden'));
  }

  hideAll() {
    // Create a copy to avoid modification during iteration
    const modalsToHide = Array.from(this.activeModals);
    modalsToHide.forEach(modalId => this.hide(modalId));
  }

  setInitialFocus(modal) {
    // Find first focusable element
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      modal.focus();
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape' && this.activeModals.size > 0) {
      // Close the topmost modal
      const lastModal = Array.from(this.activeModals).pop();
      this.hide(lastModal);
      e.preventDefault();
      e.stopPropagation();
    }

    // Tab key focus trapping
    if (e.key === 'Tab' && this.activeModals.size > 0) {
      this.handleTabKey(e);
    }
  }

  handleTabKey(e) {
    const lastModal = Array.from(this.activeModals).pop();
    const modal = document.getElementById(lastModal);
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  handleBackdropClick(e) {
    if (e.target.classList.contains('modal-overlay')) {
      const modalId = e.target.id;
      if (modalId && this.activeModals.has(modalId)) {
        this.hide(modalId);
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  cleanup() {
    this.hideAll();
    document.body.style.overflow = this.originalBodyOverflow;
  }

  // Legacy compatibility methods
  showModal(title, bodyHTML, options = {}) {
    const modal = document.getElementById('modal');
    if (!modal) return Promise.resolve(false);

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalOk = document.getElementById('modal-ok');
    const modalCancel = document.getElementById('modal-cancel');
    const modalError = document.getElementById('modal-error');

    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.innerHTML = bodyHTML;
    if (modalOk) modalOk.textContent = options.okText || 'OK';
    if (modalCancel) modalCancel.textContent = options.cancelText || 'Cancel';
    if (modalError) modalError.textContent = '';

    this.show('modal');

    return new Promise((resolve) => {
      const cleanup = () => {
        this.hide('modal');
        if (modalOk) modalOk.onclick = null;
        if (modalCancel) modalCancel.onclick = null;
      };

      if (modalOk) {
        modalOk.onclick = () => {
          if (options.validate && !options.validate()) {
            return;
          }
          cleanup();
          resolve(true);
        };
      }

      if (modalCancel) {
        modalCancel.onclick = () => {
          cleanup();
          resolve(false);
        };
      }
    });
  }
}

// Initialize global modal system
window.modalSystem = new ModalSystem();

// Legacy compatibility
window.showModal = (title, bodyHTML, options) => window.modalSystem.showModal(title, bodyHTML, options);
window.hideModal = (modalId) => window.modalSystem.hide(modalId);
window.showModalSafe = (modalId) => window.modalSystem.show(modalId);
window.hideModalSafe = (modalId) => window.modalSystem.hide(modalId);
