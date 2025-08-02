// ==========================================================================
// ADMIN PASSWORD RESET (HIDDEN FEATURE)
// ==========================================================================

function initializeAdminPasswordReset() {
  let clickCount = 0;
  let clickTimer = null;
  const CLICK_THRESHOLD = 5;
  const CLICK_TIMEOUT = 3000; // 3 seconds

  // Find the welcome title element
  const welcomeTitle = document.querySelector('.welcome-title');
  if (!welcomeTitle) return;

  // Make it clickable
  welcomeTitle.style.cursor = 'pointer';
  welcomeTitle.style.userSelect = 'none';
  welcomeTitle.style.transition = 'transform 0.1s ease';

  welcomeTitle.addEventListener('click', () => {
    clickCount++;
    
    // Visual feedback
    welcomeTitle.style.transform = 'scale(0.98)';
    setTimeout(() => {
      welcomeTitle.style.transform = 'scale(1)';
    }, 100);

    // Reset timer
    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    // Check if threshold reached
    if (clickCount >= CLICK_THRESHOLD) {
      showAdminPasswordResetModal();
      clickCount = 0;
      return;
    }

    // Set timeout to reset counter
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, CLICK_TIMEOUT);
  });
}

function showAdminPasswordResetModal() {
  // Create modal HTML if it doesn't exist
  let modal = document.getElementById('admin-reset-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-reset-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">🔧 Admin Password Reset</h3>
          <button id="close-admin-reset-modal-btn" class="btn btn-ghost btn-sm" style="position: absolute; top: 16px; right: 16px;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 3rem; margin-bottom: 12px;">🔐</div>
            <p style="color: var(--text-tertiary); margin-bottom: 20px;">
              This will reset the admin password to default. Are you sure you want to continue?
            </p>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="reset-confirmation">Type "RESET" to confirm</label>
            <input id="reset-confirmation" type="text" class="form-input" placeholder="Type RESET to confirm" />
          </div>
          
          <div id="admin-reset-success" class="form-help" style="color: #059669; display: none; text-align: center; margin: 16px 0;">
            ✅ Admin password has been reset to default!
          </div>
          <div id="admin-reset-error" class="form-error" style="display: none; text-align: center; margin: 16px 0;"></div>
          
          <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button type="button" id="cancel-admin-reset-btn" class="btn btn-ghost btn-full">Cancel</button>
            <button type="button" id="confirm-admin-reset-btn" class="btn btn-danger btn-full" disabled>
              <span class="material-symbols-outlined">lock_reset</span>
              Reset Password
            </button>
          </div>
          
          <div style="margin-top: 16px; padding: 12px; background: var(--surface-secondary); border-radius: 6px; font-size: 0.85rem; color: var(--text-tertiary);">
            <strong>⚠️ Warning:</strong> This will reset the admin password to the default value. Make sure to change it after logging in.
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Get elements
  const closeBtn = document.getElementById('close-admin-reset-modal-btn');
  const cancelBtn = document.getElementById('cancel-admin-reset-btn');
  const confirmBtn = document.getElementById('confirm-admin-reset-btn');
  const confirmationInput = document.getElementById('reset-confirmation');
  const successDiv = document.getElementById('admin-reset-success');
  const errorDiv = document.getElementById('admin-reset-error');

  // Close modal function
  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    if (confirmationInput) confirmationInput.value = '';
    if (successDiv) successDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
    if (confirmBtn) confirmBtn.disabled = true;
  }

  // Event listeners
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Enable/disable confirm button based on input
  if (confirmationInput) {
    confirmationInput.addEventListener('input', () => {
      const isValid = confirmationInput.value.trim().toUpperCase() === 'RESET';
      if (confirmBtn) confirmBtn.disabled = !isValid;
    });
  }

  // Confirm reset
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const confirmation = confirmationInput?.value.trim().toUpperCase();
      
      if (confirmation !== 'RESET') {
        if (errorDiv) {
          errorDiv.textContent = 'Please type "RESET" to confirm.';
          errorDiv.style.display = 'block';
        }
        return;
      }

      try {
        // Reset admin password to default
        const defaultAdmin = { username: 'admin', password: 'beesoft@2025' };
        const encrypted = btoa(unescape(encodeURIComponent(JSON.stringify(defaultAdmin))));
        localStorage.setItem('beesoft_admin', encrypted);

        // Show success message
        if (successDiv) {
          successDiv.style.display = 'block';
        }
        if (errorDiv) {
          errorDiv.style.display = 'none';
        }

        // Show notification
        if (window.notifications) {
          window.notifications.success('Admin password reset to default: admin / beesoft@2025');
        }

        // Log the action
        if (window.logger) {
          window.logger.info('Admin password reset to default via hidden feature');
        }

        // Close modal after delay
        setTimeout(() => {
          closeModal();
        }, 2000);

      } catch (error) {
        if (errorDiv) {
          errorDiv.textContent = 'Failed to reset password. Please try again.';
          errorDiv.style.display = 'block';
        }
        console.error('Admin password reset error:', error);
      }
    });
  }

  // Focus on input
  if (confirmationInput) {
    setTimeout(() => confirmationInput.focus(), 100);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for other initializations
  setTimeout(initializeAdminPasswordReset, 1000);
});