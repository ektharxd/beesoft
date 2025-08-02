// ==========================================================================
// ADMIN PASSWORD CHANGE MODAL - STANDALONE VERSION
// ==========================================================================

function showAdminPasswordChangeModal() {
  console.log('showAdminPasswordChangeModal called');
  
  // Remove any existing password change modal
  const existingModal = document.getElementById('admin-password-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Utility functions for encryption
  function encrypt(str) { 
    return btoa(unescape(encodeURIComponent(str))); 
  }
  
  function decrypt(str) { 
    try { 
      return decodeURIComponent(escape(atob(str))); 
    } catch { 
      return ''; 
    } 
  }

  function getAdminData() {
    const data = localStorage.getItem('beesoft_admin');
    if (!data) return null;
    try { 
      return JSON.parse(decrypt(data)); 
    } catch { 
      return null; 
    }
  }

  function setAdminData(obj) {
    localStorage.setItem('beesoft_admin', encrypt(JSON.stringify(obj)));
  }

  // Create the modal HTML directly
  const modalHTML = `
    <div id="admin-password-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    ">
      <div style="
        background: var(--surface-primary, #ffffff);
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        color: var(--text-primary, #000000);
      ">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🔐</div>
          <h3 style="margin: 0 0 8px 0; font-size: 1.5rem; font-weight: 600;">Change Admin Password</h3>
          <p style="margin: 0; color: var(--text-tertiary, #666); font-size: 0.9rem;">
            You'll need to enter your current password first.
          </p>
        </div>

        <!-- Form -->
        <div style="margin-bottom: 20px;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">Current Password</label>
            <input id="admin-current-password" type="password" placeholder="Enter current password" style="
              width: 100%;
              padding: 12px;
              border: 1px solid var(--border-color, #ddd);
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " />
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">New Password</label>
            <input id="admin-new-password" type="password" placeholder="Enter new password" style="
              width: 100%;
              padding: 12px;
              border: 1px solid var(--border-color, #ddd);
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " />
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">Confirm New Password</label>
            <input id="admin-confirm-password" type="password" placeholder="Confirm new password" style="
              width: 100%;
              padding: 12px;
              border: 1px solid var(--border-color, #ddd);
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " />
          </div>

          <!-- Requirements -->
          <div style="
            margin: 16px 0;
            padding: 12px;
            background: var(--surface-secondary, #f5f5f5);
            border-radius: 6px;
            font-size: 0.85rem;
            color: var(--text-tertiary, #666);
          ">
            <strong>💡 Password Requirements:</strong>
            <ul style="margin: 8px 0 0 20px; padding: 0;">
              <li>At least 6 characters long</li>
              <li>Should be memorable but secure</li>
              <li>Avoid using common passwords</li>
            </ul>
          </div>

          <!-- Error message -->
          <div id="admin-password-error" style="
            color: #dc2626;
            font-size: 0.85rem;
            margin-top: 8px;
            display: none;
          "></div>
        </div>

        <!-- Buttons -->
        <div style="display: flex; gap: 12px;">
          <button id="admin-password-cancel" style="
            flex: 1;
            padding: 12px 20px;
            border: 1px solid var(--border-color, #ddd);
            background: transparent;
            color: var(--text-primary, #000);
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">Cancel</button>
          
          <button id="admin-password-submit" style="
            flex: 1;
            padding: 12px 20px;
            border: none;
            background: #4f46e5;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">Change Password</button>
        </div>
      </div>
    </div>
  `;

  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Get elements
  const modal = document.getElementById('admin-password-modal');
  const currentPasswordInput = document.getElementById('admin-current-password');
  const newPasswordInput = document.getElementById('admin-new-password');
  const confirmPasswordInput = document.getElementById('admin-confirm-password');
  const errorDiv = document.getElementById('admin-password-error');
  const cancelBtn = document.getElementById('admin-password-cancel');
  const submitBtn = document.getElementById('admin-password-submit');

  // Focus on first input
  setTimeout(() => {
    if (currentPasswordInput) {
      currentPasswordInput.focus();
    }
  }, 100);

  // Close modal function
  function closeModal() {
    if (modal) {
      modal.remove();
    }
  }

  // Show error function
  function showError(message) {
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  // Hide error function
  function hideError() {
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  // Validate and change password
  function validateAndChangePassword() {
    hideError();

    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // Get current admin data
    let admin = getAdminData();
    if (!admin) {
      admin = { username: 'admin', password: 'beesoft@2025' };
    }

    // Validate current password
    if (!currentPassword) {
      showError('Please enter your current password.');
      return;
    }

    if (currentPassword !== admin.password) {
      showError('Current password is incorrect.');
      return;
    }

    // Validate new password
    if (!newPassword) {
      showError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      showError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      showError('New password must be different from current password.');
      return;
    }

    // Validate password confirmation
    if (!confirmPassword) {
      showError('Please confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('New password and confirmation do not match.');
      return;
    }

    // Update password
    admin.password = newPassword;
    setAdminData(admin);

    // Close modal
    closeModal();

    // Show success message
    if (window.notifications) {
      window.notifications.success('Admin password changed successfully!');
    } else {
      alert('Admin password changed successfully!');
    }

    if (window.logger) {
      window.logger.info('Admin password changed via admin panel');
    }

    // Show confirmation
    setTimeout(() => {
      if (typeof showConfirmationModal === 'function') {
        showConfirmationModal(
          'Password Changed',
          'Your admin password has been changed successfully. Make sure to remember your new password.',
          () => {}
        );
      } else {
        alert('Password Changed: Your admin password has been changed successfully. Make sure to remember your new password.');
      }
    }, 500);
  }

  // Event listeners
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', validateAndChangePassword);
  }

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Handle Enter key
  [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          validateAndChangePassword();
        }
      });
    }
  });

  console.log('Admin password change modal created and displayed');
}

// Initialize change password button handler when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Admin password change script loaded');
  
  // Use a MutationObserver to watch for when the admin modal is created
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        const changePasswordBtn = document.getElementById('change-admin-password-btn');
        if (changePasswordBtn && !changePasswordBtn.hasAttribute('data-handler-added')) {
          console.log('Found change password button, adding handler');
          changePasswordBtn.setAttribute('data-handler-added', 'true');
          changePasswordBtn.onclick = () => {
            console.log('Change password button clicked');
            // Close current modal first
            const modal = document.getElementById('modal');
            if (modal) modal.style.display = 'none';
            
            // Small delay to ensure modal is closed
            setTimeout(() => {
              showAdminPasswordChangeModal();
            }, 100);
          };
        }
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});