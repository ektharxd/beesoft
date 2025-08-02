// ==========================================================================
// TOTAL MESSAGES COUNTER SYSTEM
// ==========================================================================

// Initialize total messages counter
function initializeTotalMessagesCounter() {
  // Create the counter chip if it doesn't exist
  if (!document.getElementById('total-messages-chip')) {
    const chip = document.createElement('div');
    chip.id = 'total-messages-chip';
    chip.style.cssText = `
      position: fixed !important;
      top: 15px !important;
      left: 15px !important;
      z-index: 999998 !important;
      background: linear-gradient(135deg, #10b981, #059669) !important;
      color: white !important;
      padding: 8px 16px !important;
      border-radius: 25px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      transition: all 0.3s ease !important;
      cursor: pointer !important;
      user-select: none !important;
      font-family: 'Inter Tight', sans-serif !important;
    `;
    
    chip.innerHTML = `
      <span style="font-size: 16px;">📊</span>
      <span>Total Sent: <span id="total-messages-count">0</span></span>
    `;
    
    // Add hover effect
    chip.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) scale(1.05)';
      this.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
    });
    
    chip.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
    });
    
    // Add click handler to show detailed stats
    chip.addEventListener('click', function() {
      showTotalMessagesModal();
    });
    
    document.body.appendChild(chip);
  }
  
  // Load and display the total count
  updateTotalMessagesDisplay();
}

// Update the total messages display
function updateTotalMessagesDisplay() {
  const totalCount = getTotalMessagesSent();
  const countElement = document.getElementById('total-messages-count');
  if (countElement) {
    countElement.textContent = totalCount.toLocaleString();
  }
}

// Get total messages sent from localStorage
function getTotalMessagesSent() {
  try {
    const stored = localStorage.getItem('beesoft_total_messages_sent');
    return stored ? parseInt(stored) : 0;
  } catch (e) {
    return 0;
  }
}

// Increment total messages sent
function incrementTotalMessagesSent(count = 1) {
  try {
    const current = getTotalMessagesSent();
    const newTotal = current + count;
    localStorage.setItem('beesoft_total_messages_sent', newTotal.toString());
    updateTotalMessagesDisplay();
    
    // Add celebration effect for milestones
    if (newTotal % 100 === 0 && newTotal > 0) {
      celebrateMilestone(newTotal);
    }
  } catch (e) {
    console.error('Failed to update total messages count:', e);
  }
}

// Show detailed total messages modal
function showTotalMessagesModal() {
  const totalCount = getTotalMessagesSent();
  const modalHTML = `
    <div style="text-align: center;">
      <div style="font-size: 4rem; margin-bottom: 20px;">📊</div>
      <h3 style="margin-bottom: 10px; color: var(--color-primary);">Total Messages Statistics</h3>
      <div style="background: var(--surface-secondary); padding: 20px; border-radius: 12px; margin: 20px 0;">
        <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-success); margin-bottom: 8px;">
          ${totalCount.toLocaleString()}
        </div>
        <div style="font-size: 1.1rem; color: var(--text-secondary);">
          Total Messages Sent All Time
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0;">
        <div style="background: var(--surface-secondary); padding: 16px; border-radius: 8px;">
          <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary);">
            ${Math.ceil(totalCount / 30)}
          </div>
          <div style="font-size: 0.9rem; color: var(--text-tertiary);">
            Avg. per Month
          </div>
        </div>
        <div style="background: var(--surface-secondary); padding: 16px; border-radius: 8px;">
          <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary);">
            ${Math.ceil(totalCount / 7)}
          </div>
          <div style="font-size: 0.9rem; color: var(--text-tertiary);">
            Avg. per Week
          </div>
        </div>
      </div>
      <div style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; color: white;">
        <div style="font-size: 0.9rem; opacity: 0.9;">
          🎯 Keep up the great work! Every message sent helps grow your business.
        </div>
      </div>
    </div>
  `;

  showModal('📊 Message Statistics', modalHTML, {
    okText: 'Close',
    cancelText: 'Reset Counter',
    validate: () => true
  }).then((result) => {
    if (result === false) { // Cancel button (Reset Counter)
      showConfirmationModal(
        'Reset Message Counter',
        'Are you sure you want to reset the total message counter to zero? This action cannot be undone.',
        () => {
          localStorage.setItem('beesoft_total_messages_sent', '0');
          updateTotalMessagesDisplay();
          if (window.notifications) {
            window.notifications.success('Message counter reset to zero');
          }
        }
      );
    }
  });
}

// Celebrate milestone achievements
function celebrateMilestone(count) {
  if (window.notifications) {
    window.notifications.success(`🎉 Milestone achieved! ${count.toLocaleString()} messages sent!`, 8000);
  }
  
  // Add visual celebration effect
  const chip = document.getElementById('total-messages-chip');
  if (chip) {
    chip.style.animation = 'pulse 0.6s ease-in-out 3';
    setTimeout(() => {
      chip.style.animation = '';
    }, 2000);
  }
}

// Initialize the counter when DOM is ready
setTimeout(() => {
  initializeTotalMessagesCounter();
}, 500);