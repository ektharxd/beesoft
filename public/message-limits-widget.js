// Message Limits Widget for Trial Users
class MessageLimitsWidget {
  constructor() {
    this.deviceId = this.getDeviceId();
    this.messageStats = null;
    this.widget = null;
    this.updateInterval = null;
  }

  getDeviceId() {
    if (window.electronAPI && typeof window.electronAPI.getDeviceId === 'function') {
      return window.electronAPI.getDeviceId();
    }
    return localStorage.getItem('beesoft_device_id') || 'unknown';
  }

  async init() {
    await this.loadMessageStats();
    this.createWidget();
    this.startAutoUpdate();
  }

  async loadMessageStats() {
    try {
      const response = await fetch(`http://localhost:3001/api/message-limits?machineId=${encodeURIComponent(this.deviceId)}`);
      if (response.ok) {
        const data = await response.json();
        this.messageStats = data.messageStats;
        return data;
      }
    } catch (error) {
      console.error('Error loading message stats:', error);
    }
    return null;
  }

  createWidget() {
    if (!this.messageStats || this.messageStats.unlimited) return;
    
    // Create widget container
    this.widget = document.createElement('div');
    this.widget.className = 'message-limits-widget';
    this.widget.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--vercel-card, #1c1c1f);
      border: 1px solid var(--vercel-border, #232323);
      border-radius: 12px;
      padding: 16px;
      width: 280px;
      box-shadow: var(--vercel-shadow, 0 2px 16px 0 #000a);
      z-index: 1000;
      font-family: var(--vercel-font, 'Inter', sans-serif);
      color: white;
    `;
    
    // Update content
    this.updateWidgetContent();
    
    // Add to document
    document.body.appendChild(this.widget);
  }

  updateWidgetContent() {
    if (!this.widget || !this.messageStats) return;

    const { totalLimit, totalUsed, totalRemaining, dailyLimit, dailyUsed, dailyRemaining } = this.messageStats;

    // Calculate percentages
    const totalPercentage = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
    const dailyPercentage = dailyLimit > 0 ? Math.round((dailyUsed / dailyLimit) * 100) : 0;

    // Determine status colors
    const getTotalColor = () => {
      if (totalPercentage >= 90) return '#ef4444'; // Red
      if (totalPercentage >= 70) return '#f59e0b'; // Orange
      return '#22c55e'; // Green
    };

    const getDailyColor = () => {
      if (dailyPercentage >= 90) return '#ef4444'; // Red
      if (dailyPercentage >= 70) return '#f59e0b'; // Orange
      return '#22c55e'; // Green
    };

    this.widget.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 8px; height: 8px; background: #6366f1; border-radius: 50%;"></div>
        <span style="font-weight: 600; font-size: 14px;">Trial Message Limits</span>
      </div>
      
      ${totalLimit > 0 ? `
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #cbd5e1;">Total Messages</span>
            <span style="font-weight: 600;">${totalUsed}/${totalLimit}</span>
          </div>
          <div style="background: rgba(255, 255, 255, 0.1); border-radius: 6px; height: 6px; overflow: hidden;">
            <div style="background: ${getTotalColor()}; height: 100%; width: ${totalPercentage}%; transition: width 0.3s ease;"></div>
          </div>
          <div style="text-align: right; margin-top: 2px; font-size: 11px; color: #94a3b8;">
            ${totalRemaining} remaining
          </div>
        </div>
      ` : ''}
      
      ${dailyLimit > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #cbd5e1;">Today</span>
            <span style="font-weight: 600;">${dailyUsed}/${dailyLimit}</span>
          </div>
          <div style="background: rgba(255, 255, 255, 0.1); border-radius: 6px; height: 6px; overflow: hidden;">
            <div style="background: ${getDailyColor()}; height: 100%; width: ${dailyPercentage}%; transition: width 0.3s ease;"></div>
          </div>
          <div style="text-align: right; margin-top: 2px; font-size: 11px; color: #94a3b8;">
            ${dailyRemaining} remaining today
          </div>
        </div>
      ` : ''}
      
      <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 11px; color: #94a3b8; text-align: center;">
        Updates automatically • Trial limits
      </div>
    `;
  }

  async checkMessageLimits(messageCount = 1) {
    try {
      const response = await fetch(`http://localhost:3001/api/message-limits/check?machineId=${encodeURIComponent(this.deviceId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageCount })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const error = await response.json();
        return { allowed: false, reason: error.reason || 'Unknown error' };
      }
    } catch (error) {
      console.error('Error checking message limits:', error);
      return { allowed: false, reason: 'Network error' };
    }
  }

  async trackMessageUsage(messageCount = 1, campaignId = null, contactCount = null) {
    try {
      const payload = { messageCount };
      if (campaignId) payload.campaignId = campaignId;
      if (contactCount) payload.contactCount = contactCount;

      const response = await fetch(`http://localhost:3001/api/message-limits/track?machineId=${encodeURIComponent(this.deviceId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        this.messageStats = data.messageStats;
        this.updateWidgetContent();
        return data;
      } else {
        const error = await response.json();
        throw new Error(error.reason || 'Failed to track message usage');
      }
    } catch (error) {
      console.error('Error tracking message usage:', error);
      throw error;
    }
  }

  startAutoUpdate() {
    // Update every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.loadMessageStats();
      this.updateWidgetContent();
    }, 30000);
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  destroy() {
    this.stopAutoUpdate();
    if (this.widget) {
      this.widget.remove();
      this.widget = null;
    }
  }

  // Show warning when approaching limits
  showLimitWarning(type, remaining) {
    // Remove any existing warnings first
    const existingWarnings = document.querySelectorAll('.message-limit-warning');
    existingWarnings.forEach(w => w.remove());

    const warning = document.createElement('div');
    warning.className = 'message-limit-warning';
    warning.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: white;
      padding: 25px;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(220, 38, 38, 0.4);
      font-family: 'Inter', sans-serif;
      z-index: 10001;
      max-width: 450px;
      text-align: center;
      animation: warningPulse 0.5s ease-out;
      border: 2px solid rgba(255, 255, 255, 0.2);
    `;

    // Add CSS animation
    if (!document.getElementById('warning-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'warning-animation-styles';
      style.textContent = `
        @keyframes warningPulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.05); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes warningShake {
          0%, 100% { transform: translate(-50%, -50%) translateX(0); }
          25% { transform: translate(-50%, -50%) translateX(-5px); }
          75% { transform: translate(-50%, -50%) translateX(5px); }
        }
      `;
      document.head.appendChild(style);
    }

    const isBlocked = remaining <= 0;
    const warningLevel = remaining <= 5 ? 'critical' : remaining <= 10 ? 'warning' : 'info';
    
    warning.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 15px;">
        ${isBlocked ? '🚫' : warningLevel === 'critical' ? '⚠️' : '📊'}
      </div>
      <div style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">
        ${isBlocked ? 'Message Limit Exceeded!' : 'Message Limit Warning'}
      </div>
      <div style="font-size: 16px; margin-bottom: 20px; line-height: 1.4;">
        ${isBlocked 
          ? `You have reached your ${type} message limit for this trial period.`
          : `You have only <strong>${remaining}</strong> ${type} messages remaining in your trial.`
        }
      </div>
      ${!isBlocked ? `
        <div style="background: rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;">
          💡 <strong>Tip:</strong> Contact your administrator to extend your trial or upgrade to unlimited messaging.
        </div>
      ` : `
        <div style="background: rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;">
          🔒 <strong>Trial Limit Reached:</strong> Please contact your administrator to continue using the service.
        </div>
      `}
      <button onclick="this.parentElement.remove()" style="
        background: rgba(255, 255, 255, 0.9);
        border: none;
        color: #dc2626;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-family: inherit;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s ease;
      " onmouseover="this.style.background='white'" onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'">
        ${isBlocked ? 'Understood' : 'Continue Anyway'}
      </button>
    `;

    document.body.appendChild(warning);

    // Add shake animation for critical warnings
    if (warningLevel === 'critical' || isBlocked) {
      setTimeout(() => {
        warning.style.animation = 'warningShake 0.5s ease-in-out';
      }, 500);
    }

    // Auto-remove after longer time for blocked messages
    const autoRemoveTime = isBlocked ? 15000 : 10000;
    setTimeout(() => {
      if (warning.parentElement) {
        warning.style.opacity = '0';
        warning.style.transform = 'translate(-50%, -50%) scale(0.9)';
        setTimeout(() => warning.remove(), 300);
      }
    }, autoRemoveTime);

    // Also show a toast notification
    if (window.notifications) {
      if (isBlocked) {
        window.notifications.error(`${type.charAt(0).toUpperCase() + type.slice(1)} message limit exceeded!`, 8000);
      } else if (warningLevel === 'critical') {
        window.notifications.warning(`Only ${remaining} ${type} messages left!`, 6000);
      }
    }
  }

  // Show limit exceeded modal for campaign blocking
  showLimitExceededModal(reason, messagesRemaining, dailyMessagesRemaining, requestedMessages) {
    // Remove any existing modals
    const existingModals = document.querySelectorAll('.limit-exceeded-modal');
    existingModals.forEach(m => m.remove());

    const modal = document.createElement('div');
    modal.className = 'limit-exceeded-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      backdrop-filter: blur(5px);
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 16px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        position: relative;
      ">
        <div style="font-size: 4rem; margin-bottom: 20px;">🚫</div>
        <h2 style="color: #dc2626; margin-bottom: 15px; font-size: 24px;">Campaign Blocked</h2>
        <p style="font-size: 16px; margin-bottom: 20px; line-height: 1.5; color: #374151;">
          <strong>Reason:</strong> ${reason}
        </p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: center;">
            ${messagesRemaining >= 0 ? `
              <div>
                <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${messagesRemaining}</div>
                <div style="font-size: 12px; color: #6b7280;">Total Remaining</div>
              </div>
            ` : ''}
            ${dailyMessagesRemaining >= 0 ? `
              <div>
                <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${dailyMessagesRemaining}</div>
                <div style="font-size: 12px; color: #6b7280;">Daily Remaining</div>
              </div>
            ` : ''}
          </div>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1d5db;">
            <div style="font-size: 14px; color: #6b7280;">
              You tried to send <strong>${requestedMessages}</strong> messages
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button onclick="this.closest('.limit-exceeded-modal').remove()" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">
            Cancel Campaign
          </button>
          <button onclick="window.open('mailto:support@beesoft.com?subject=Trial Extension Request', '_blank'); this.closest('.limit-exceeded-modal').remove();" style="
            background: #dc2626;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">
            Contact Support
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
}

// Global instance
window.messageLimitsWidget = new MessageLimitsWidget();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.messageLimitsWidget.init();
  });
} else {
  window.messageLimitsWidget.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessageLimitsWidget;
}