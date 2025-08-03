// Message Limits Widget for Trial Users - Production Version
class MessageLimitsWidget {
  constructor() {
    this.deviceId = null;
    this.messageStats = null;
    this.widget = null;
    this.updateInterval = null;
    this.isExpanded = false;
    this.allowedPages = ['welcome-page', 'main-app-page'];
  }

  async getDeviceId() {
    let deviceId = null;
    
    // Try Electron API
    if (window.electronAPI && typeof window.electronAPI.getDeviceId === 'function') {
      try {
        deviceId = await window.electronAPI.getDeviceId();
      } catch (e) {
        // Fallback to localStorage
      }
    }
    
    // Try localStorage
    if (!deviceId) {
      deviceId = localStorage.getItem('beesoft_device_id');
    }
    
    // Use known device ID as fallback
    if (!deviceId || deviceId === 'unknown') {
      deviceId = 'a2097bbe-5ca6-40a2-befd-e3bac3cf5679';
    }
    
    return deviceId;
  }

  async init() {
    this.deviceId = await this.getDeviceId();
    await this.loadMessageStats();
    this.createWidget();
    this.startAutoUpdate();
    this.setupPageVisibilityListener();
  }

  async loadMessageStats() {
    try {
      const response = await fetch(`http://34.10.132.60:3001/api/message-limits?machineId=${encodeURIComponent(this.deviceId)}`);
      
      if (response.ok) {
        const data = await response.json();
        this.messageStats = data.messageStats;
        return data;
      }
    } catch (error) {
      // Silent fail - widget won't show if API is unavailable
    }
    return null;
  }

  shouldShowWidget() {
    const currentPage = this.getCurrentPage();
    return this.allowedPages.includes(currentPage);
  }

  getCurrentPage() {
    const welcomePage = document.getElementById('welcome-page');
    const mainPage = document.getElementById('main-app-page');
    
    if (welcomePage && welcomePage.style.display !== 'none') {
      return 'welcome-page';
    } else if (mainPage && mainPage.style.display !== 'none') {
      return 'main-app-page';
    }
    return 'other';
  }

  setupPageVisibilityListener() {
    const observer = new MutationObserver(() => {
      if (this.widget) {
        if (this.shouldShowWidget()) {
          this.widget.style.display = 'block';
        } else {
          this.widget.style.display = 'none';
        }
      }
    });

    const welcomePage = document.getElementById('welcome-page');
    const mainPage = document.getElementById('main-app-page');
    
    if (welcomePage) {
      observer.observe(welcomePage, { attributes: true, attributeFilter: ['style'] });
    }
    if (mainPage) {
      observer.observe(mainPage, { attributes: true, attributeFilter: ['style'] });
    }
  }

  createWidget() {
    // Only show widget for trial subscriptions with limits
    if (!this.messageStats || this.messageStats.unlimited || this.messageStats.type !== 'trial') {
      return;
    }
    
    // Create widget container as a compact chip
    this.widget = document.createElement('div');
    this.widget.className = 'message-limits-chip';
    this.widget.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--surface-primary, #ffffff);
      border: 2px solid var(--color-primary, #4f46e5);
      border-radius: 25px;
      padding: 8px 16px;
      min-width: 120px;
      max-width: 300px;
      box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
      z-index: 1000;
      font-family: var(--font-primary, 'Inter', sans-serif);
      color: var(--text-primary, #0f172a);
      cursor: pointer;
      transition: all 0.3s ease;
      user-select: none;
      display: ${this.shouldShowWidget() ? 'block' : 'none'};
    `;
    
    this.widget.addEventListener('click', () => this.toggleExpanded());
    this.updateWidgetContent();
    document.body.appendChild(this.widget);
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
    this.updateWidgetContent();
    
    this.widget.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.widget.style.transform = 'scale(1)';
    }, 150);
  }

  updateWidgetContent() {
    if (!this.widget || !this.messageStats) return;

    const { totalLimit, totalUsed, totalRemaining, dailyLimit, dailyUsed, dailyRemaining } = this.messageStats;

    // Calculate percentages
    const totalPercentage = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
    const dailyPercentage = dailyLimit > 0 ? Math.round((dailyUsed / dailyLimit) * 100) : 0;

    // Determine status colors
    const getTotalColor = () => {
      if (totalPercentage >= 90) return 'var(--color-error, #dc2626)';
      if (totalPercentage >= 70) return 'var(--color-warning, #d97706)';
      return 'var(--color-success, #059669)';
    };

    const getDailyColor = () => {
      if (dailyPercentage >= 90) return 'var(--color-error, #dc2626)';
      if (dailyPercentage >= 70) return 'var(--color-warning, #d97706)';
      return 'var(--color-success, #059669)';
    };

    // Get the most critical remaining count for compact view
    const getCriticalRemaining = () => {
      if (dailyLimit > 0 && totalLimit > 0) {
        return Math.min(dailyRemaining, totalRemaining);
      } else if (dailyLimit > 0) {
        return dailyRemaining;
      } else if (totalLimit > 0) {
        return totalRemaining;
      }
      return 0;
    };

    const criticalRemaining = getCriticalRemaining();
    const criticalColor = criticalRemaining <= 5 ? 'var(--color-error, #dc2626)' : 
                         criticalRemaining <= 20 ? 'var(--color-warning, #d97706)' : 
                         'var(--color-success, #059669)';

    this.widget.style.borderColor = criticalColor;

    if (this.isExpanded) {
      // Expanded view
      this.widget.style.padding = '16px';
      this.widget.style.minWidth = '280px';
      this.widget.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 8px; height: 8px; background: ${criticalColor}; border-radius: 50%;"></div>
            <span style="font-weight: 600; font-size: 14px;">Trial Limits</span>
          </div>
          <span style="font-size: 12px; color: var(--text-tertiary, #64748b); cursor: pointer;">
            ▲ Collapse
          </span>
        </div>
        
        ${totalLimit > 0 ? `
          <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: var(--text-secondary, #475569); font-size: 12px;">Total Messages</span>
              <span style="font-weight: 600; font-size: 12px;">${totalUsed}/${totalLimit}</span>
            </div>
            <div style="background: var(--surface-tertiary, #f1f5f9); border-radius: 6px; height: 6px; overflow: hidden;">
              <div style="background: ${getTotalColor()}; height: 100%; width: ${totalPercentage}%; transition: width 0.3s ease;"></div>
            </div>
            <div style="text-align: right; margin-top: 2px; font-size: 10px; color: var(--text-tertiary, #64748b);">
              ${totalRemaining} remaining
            </div>
          </div>
        ` : ''}
        
        ${dailyLimit > 0 ? `
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: var(--text-secondary, #475569); font-size: 12px;">Today</span>
              <span style="font-weight: 600; font-size: 12px;">${dailyUsed}/${dailyLimit}</span>
            </div>
            <div style="background: var(--surface-tertiary, #f1f5f9); border-radius: 6px; height: 6px; overflow: hidden;">
              <div style="background: ${getDailyColor()}; height: 100%; width: ${dailyPercentage}%; transition: width 0.3s ease;"></div>
            </div>
            <div style="text-align: right; margin-top: 2px; font-size: 10px; color: var(--text-tertiary, #64748b);">
              ${dailyRemaining} remaining today
            </div>
          </div>
        ` : ''}
        
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--border-primary, #e2e8f0); font-size: 10px; color: var(--text-tertiary, #64748b); text-align: center;">
          Live data • Click to collapse
        </div>
      `;
    } else {
      // Compact view
      this.widget.style.padding = '8px 16px';
      this.widget.style.minWidth = '120px';
      this.widget.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 6px; height: 6px; background: ${criticalColor}; border-radius: 50%;"></div>
          <span style="font-weight: 600; font-size: 13px; color: ${criticalColor};">
            ${criticalRemaining} left
          </span>
          <span style="font-size: 11px; color: var(--text-tertiary, #64748b);">▼</span>
        </div>
      `;
    }

    // Add pulse animation for critical states
    if (criticalRemaining <= 5) {
      this.widget.style.animation = 'pulse 2s infinite';
    } else {
      this.widget.style.animation = 'none';
    }
  }

  async checkMessageLimits(messageCount = 1) {
    try {
      const response = await fetch(`http://34.10.132.60:3001/api/message-limits/check?machineId=${encodeURIComponent(this.deviceId)}`, {
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
      return { allowed: false, reason: 'Network error' };
    }
  }

  async trackMessageUsage(messageCount = 1, campaignId = null, contactCount = null) {
    try {
      const payload = { messageCount };
      if (campaignId) payload.campaignId = campaignId;
      if (contactCount) payload.contactCount = contactCount;

      const response = await fetch(`http://34.10.132.60:3001/api/message-limits/track?machineId=${encodeURIComponent(this.deviceId)}`, {
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

    if (!document.getElementById('warning-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'warning-animation-styles';
      style.textContent = `
        @keyframes warningPulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.05); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
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
      ">
        ${isBlocked ? 'Understood' : 'Continue Anyway'}
      </button>
    `;

    document.body.appendChild(warning);

    const autoRemoveTime = isBlocked ? 15000 : 10000;
    setTimeout(() => {
      if (warning.parentElement) {
        warning.style.opacity = '0';
        warning.style.transform = 'translate(-50%, -50%) scale(0.9)';
        setTimeout(() => warning.remove(), 300);
      }
    }, autoRemoveTime);
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