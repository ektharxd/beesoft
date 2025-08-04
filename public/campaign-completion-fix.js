/**
 * CAMPAIGN COMPLETION FIX
 * Ensures campaigns complete properly and handles stuck campaigns
 */

(function() {
  'use strict';

  console.log('🔧 Loading Campaign Completion Fix...');

  let campaignMonitor = null;
  let lastProgressUpdate = null;
  let stuckCheckInterval = null;

  function initializeCampaignMonitor() {
    // Monitor campaign progress and detect stuck campaigns
    if (window.electronAPI && window.electronAPI.onUpdate) {
      window.electronAPI.onUpdate((data) => {
        handleCampaignUpdate(data);
      });
    }

    // Start monitoring for stuck campaigns
    startStuckCampaignDetection();

    console.log('✅ Campaign completion monitor initialized');
  }

  function handleCampaignUpdate(data) {
    switch(data.type) {
      case 'campaign-progress':
        lastProgressUpdate = Date.now();
        
        if (data.current !== undefined && data.total !== undefined) {
          console.log(`📊 Campaign Progress: ${data.current}/${data.total} (${Math.round((data.current/data.total)*100)}%)`);
          
          // Update UI
          if (window.appState && window.appState.updateStats) {
            window.appState.updateStats({
              success: data.successCount || 0,
              failed: data.errorCount || 0,
              total: data.total
            });
          }
          
          // Check if campaign should be complete
          if (data.current >= data.total) {
            console.log('🎉 Campaign should be complete, checking status...');
            setTimeout(checkCampaignCompletion, 5000);
          }
        }
        break;
        
      case 'campaign-success':
        lastProgressUpdate = Date.now();
        console.log('✅ Message sent successfully');
        break;
        
      case 'campaign-failure':
        lastProgressUpdate = Date.now();
        console.log('❌ Message failed to send');
        break;
        
      case 'campaign-finished':
        console.log('🎉 Campaign finished!');
        clearStuckCampaignDetection();
        handleCampaignFinished(data);
        break;
        
      case 'campaign-error':
        console.log('❌ Campaign error:', data.error);
        clearStuckCampaignDetection();
        handleCampaignError(data);
        break;
    }
  }

  function startStuckCampaignDetection() {
    clearStuckCampaignDetection();
    
    stuckCheckInterval = setInterval(() => {
      if (!window.appState || !window.appState.isSessionActive) {
        return;
      }
      
      const now = Date.now();
      const timeSinceLastUpdate = lastProgressUpdate ? (now - lastProgressUpdate) : 0;
      
      // If no progress update for 60 seconds, campaign might be stuck
      if (timeSinceLastUpdate > 60000) {
        console.log('⚠️ Campaign appears to be stuck, checking status...');
        checkCampaignStatus();
      }
    }, 30000); // Check every 30 seconds
  }

  function clearStuckCampaignDetection() {
    if (stuckCheckInterval) {
      clearInterval(stuckCheckInterval);
      stuckCheckInterval = null;
    }
  }

  async function checkCampaignStatus() {
    try {
      if (window.electronAPI && window.electronAPI.getCampaignStatus) {
        const status = await window.electronAPI.getCampaignStatus();
        console.log('📊 Campaign status check:', status);
        
        if (status.isComplete) {
          console.log('🎉 Campaign is actually complete, updating UI...');
          handleCampaignFinished(status);
        } else if (status.isStuck) {
          console.log('⚠️ Campaign is stuck, attempting to resume...');
          attemptCampaignResume();
        }
      }
    } catch (error) {
      console.log('❌ Error checking campaign status:', error);
    }
  }

  async function checkCampaignCompletion() {
    try {
      if (window.electronAPI && window.electronAPI.getCampaignStatus) {
        const status = await window.electronAPI.getCampaignStatus();
        
        if (status.isComplete || (status.processed >= status.total)) {
          console.log('🎉 Confirming campaign completion...');
          handleCampaignFinished(status);
        }
      }
    } catch (error) {
      console.log('❌ Error confirming campaign completion:', error);
    }
  }

  async function attemptCampaignResume() {
    try {
      console.log('🔄 Attempting to resume stuck campaign...');
      
      if (window.electronAPI && window.electronAPI.continueSession) {
        await window.electronAPI.continueSession();
        console.log('✅ Campaign resume attempted');
        
        if (window.notifications) {
          window.notifications.info('Campaign resumed automatically');
        }
        
        if (window.logger) {
          window.logger.info('Campaign resumed automatically due to inactivity');
        }
      }
    } catch (error) {
      console.log('❌ Error resuming campaign:', error);
      
      if (window.notifications) {
        window.notifications.warning('Campaign may be stuck. Try pausing and resuming manually.');
      }
    }
  }

  function handleCampaignFinished(data) {
    clearStuckCampaignDetection();
    
    if (window.appState) {
      window.appState.isSessionActive = false;
      window.appState.sessionPaused = false;
      
      if (window.appState.updateWorkflowUI) {
        window.appState.updateWorkflowUI();
      }
      
      if (data.stats && window.appState.updateStats) {
        window.appState.updateStats({
          success: data.stats.success || data.successCount || 0,
          failed: data.stats.failed || data.errorCount || 0,
          total: data.stats.total || data.total || 0
        });
      }
    }
    
    const summary = data.summary || `Campaign completed. Sent: ${data.stats?.success || 0}, Failed: ${data.stats?.failed || 0}`;
    
    if (window.logger) {
      window.logger.success(summary);
    }
    
    if (window.notifications) {
      window.notifications.success('🎉 Campaign finished successfully!');
    }
    
    console.log('✅ Campaign completion handled');
  }

  function handleCampaignError(data) {
    clearStuckCampaignDetection();
    
    if (window.appState) {
      window.appState.isSessionActive = false;
      window.appState.sessionPaused = false;
      
      if (window.appState.updateWorkflowUI) {
        window.appState.updateWorkflowUI();
      }
    }
    
    const errorMsg = data.error || 'Unknown campaign error';
    
    if (window.logger) {
      window.logger.error(`Campaign error: ${errorMsg}`);
    }
    
    if (window.notifications) {
      window.notifications.error(`Campaign error: ${errorMsg}`);
    }
    
    console.log('❌ Campaign error handled');
  }

  // Add manual completion button for stuck campaigns
  function addManualCompletionButton() {
    const actionControls = document.querySelector('.action-controls');
    if (!actionControls) return;
    
    const completeBtn = document.createElement('button');
    completeBtn.id = 'complete-campaign-btn';
    completeBtn.className = 'btn btn-success';
    completeBtn.title = 'Manually complete campaign';
    completeBtn.style.display = 'none';
    completeBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span>';
    
    completeBtn.addEventListener('click', async () => {
      try {
        console.log('🏁 Manually completing campaign...');
        
        if (window.electronAPI && window.electronAPI.stopSession) {
          await window.electronAPI.stopSession();
        }
        
        // Force completion
        handleCampaignFinished({
          stats: window.appState?.stats || { success: 0, failed: 0, total: 0 },
          summary: 'Campaign manually completed'
        });
        
        if (window.notifications) {
          window.notifications.success('Campaign manually completed');
        }
        
      } catch (error) {
        console.log('❌ Error manually completing campaign:', error);
      }
    });
    
    actionControls.appendChild(completeBtn);
    
    // Show/hide based on campaign state
    setInterval(() => {
      if (window.appState && window.appState.isSessionActive) {
        const timeSinceLastUpdate = lastProgressUpdate ? (Date.now() - lastProgressUpdate) : 0;
        completeBtn.style.display = timeSinceLastUpdate > 45000 ? 'inline-flex' : 'none';
      } else {
        completeBtn.style.display = 'none';
      }
    }, 5000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeCampaignMonitor();
      setTimeout(addManualCompletionButton, 2000);
    });
  } else {
    initializeCampaignMonitor();
    setTimeout(addManualCompletionButton, 2000);
  }

  console.log('✅ Campaign Completion Fix Loaded');

})();