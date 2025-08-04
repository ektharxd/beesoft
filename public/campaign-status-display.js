/**
 * CAMPAIGN STATUS DISPLAY
 * Shows real-time campaign progress and status
 */

(function() {
  'use strict';

  console.log('🔧 Loading Campaign Status Display...');

  function initializeStatusDisplay() {
    // Add campaign status indicator to the UI
    addCampaignStatusIndicator();
    
    // Monitor campaign updates
    if (window.electronAPI && window.electronAPI.onUpdate) {
      window.electronAPI.onUpdate((data) => {
        updateStatusDisplay(data);
      });
    }
    
    console.log('✅ Campaign status display initialized');
  }

  function addCampaignStatusIndicator() {
    const statsSection = document.querySelector('.stats-section');
    if (!statsSection) return;
    
    // Create status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'campaign-status-indicator';
    statusIndicator.className = 'campaign-status-card';
    statusIndicator.innerHTML = `
      <div class="status-header">
        <span class="material-symbols-outlined">campaign</span>
        <span>Campaign Status</span>
      </div>
      <div class="status-content">
        <div class="status-item">
          <span class="status-label">Progress:</span>
          <span class="status-value" id="campaign-progress">0/0 (0%)</span>
        </div>
        <div class="status-item">
          <span class="status-label">Status:</span>
          <span class="status-value" id="campaign-status">Ready</span>
        </div>
        <div class="status-item">
          <span class="status-label">Current:</span>
          <span class="status-value" id="current-contact">None</span>
        </div>
        <div class="status-item">
          <span class="status-label">Last Update:</span>
          <span class="status-value" id="last-update">Never</span>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
      </div>
    `;
    
    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
      .campaign-status-card {
        background: var(--surface-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        font-size: 0.9rem;
      }
      
      .status-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--text-primary);
      }
      
      .status-header .material-symbols-outlined {
        font-size: 1.2rem;
        color: var(--color-primary);
      }
      
      .status-content {
        display: grid;
        gap: 6px;
        margin-bottom: 12px;
      }
      
      .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .status-label {
        color: var(--text-secondary);
        font-weight: 500;
      }
      
      .status-value {
        color: var(--text-primary);
        font-weight: 600;
        font-family: monospace;
      }
      
      .progress-bar {
        width: 100%;
        height: 6px;
        background: var(--surface-secondary);
        border-radius: 3px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), var(--color-success));
        transition: width 0.3s ease;
        border-radius: 3px;
      }
      
      #campaign-status.running {
        color: var(--color-primary);
      }
      
      #campaign-status.paused {
        color: var(--color-warning);
      }
      
      #campaign-status.completed {
        color: var(--color-success);
      }
      
      #campaign-status.error {
        color: var(--color-error);
      }
    `;
    
    document.head.appendChild(style);
    statsSection.insertBefore(statusIndicator, statsSection.firstChild);
  }

  function updateStatusDisplay(data) {
    const progressEl = document.getElementById('campaign-progress');
    const statusEl = document.getElementById('campaign-status');
    const currentContactEl = document.getElementById('current-contact');
    const lastUpdateEl = document.getElementById('last-update');
    const progressFillEl = document.getElementById('progress-fill');
    
    if (!progressEl) return;
    
    const now = new Date().toLocaleTimeString();
    lastUpdateEl.textContent = now;
    
    switch(data.type) {
      case 'campaign-progress':
        if (data.current !== undefined && data.total !== undefined) {
          const percentage = Math.round((data.current / data.total) * 100);
          progressEl.textContent = `${data.current}/${data.total} (${percentage}%)`;
          progressFillEl.style.width = `${percentage}%`;
          
          statusEl.textContent = 'Running';
          statusEl.className = 'running';
          
          if (data.currentContact) {
            currentContactEl.textContent = data.currentContact;
          }
        }
        break;
        
      case 'campaign-success':
        statusEl.textContent = 'Sending...';
        statusEl.className = 'running';
        break;
        
      case 'campaign-failure':
        statusEl.textContent = 'Retrying...';
        statusEl.className = 'running';
        break;
        
      case 'campaign-finished':
        statusEl.textContent = 'Completed';
        statusEl.className = 'completed';
        currentContactEl.textContent = 'Campaign finished';
        progressFillEl.style.width = '100%';
        break;
        
      case 'campaign-error':
        statusEl.textContent = 'Error';
        statusEl.className = 'error';
        currentContactEl.textContent = data.error || 'Unknown error';
        break;
        
      case 'campaign-paused':
        statusEl.textContent = 'Paused';
        statusEl.className = 'paused';
        break;
        
      case 'campaign-resumed':
        statusEl.textContent = 'Running';
        statusEl.className = 'running';
        break;
    }
  }

  // Monitor app state changes
  function monitorAppState() {
    if (!window.appState) {
      setTimeout(monitorAppState, 100);
      return;
    }
    
    const statusEl = document.getElementById('campaign-status');
    if (!statusEl) return;
    
    setInterval(() => {
      if (window.appState.isSessionActive) {
        if (window.appState.sessionPaused) {
          statusEl.textContent = 'Paused';
          statusEl.className = 'paused';
        } else {
          statusEl.textContent = 'Running';
          statusEl.className = 'running';
        }
      } else {
        statusEl.textContent = 'Ready';
        statusEl.className = '';
        
        const currentContactEl = document.getElementById('current-contact');
        if (currentContactEl) {
          currentContactEl.textContent = 'None';
        }
      }
    }, 1000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeStatusDisplay();
      setTimeout(monitorAppState, 1000);
    });
  } else {
    initializeStatusDisplay();
    setTimeout(monitorAppState, 1000);
  }

  console.log('✅ Campaign Status Display Loaded');

})();