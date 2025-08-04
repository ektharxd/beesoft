/**
 * MANUAL CAMPAIGN CONTROL
 * Provides manual controls for stuck or problematic campaigns
 */

(function() {
  'use strict';

  console.log('🔧 Loading Manual Campaign Control...');

  function addManualControls() {
    // Add manual control buttons to the action controls
    const actionControls = document.querySelector('.action-controls');
    if (!actionControls) {
      setTimeout(addManualControls, 1000);
      return;
    }

    // Skip to next contact button
    const skipBtn = document.createElement('button');
    skipBtn.id = 'skip-contact-btn';
    skipBtn.className = 'btn btn-warning';
    skipBtn.title = 'Skip current contact and continue';
    skipBtn.innerHTML = '<span class="material-symbols-outlined">skip_next</span>';
    skipBtn.style.display = 'none';
    
    skipBtn.addEventListener('click', async () => {
      try {
        console.log('⏭️ Skipping current contact...');
        
        if (window.electronAPI && window.electronAPI.skipCurrentContact) {
          await window.electronAPI.skipCurrentContact();
          console.log('✅ Contact skipped');
          
          if (window.notifications) {
            window.notifications.info('Skipped current contact');
          }
        } else {
          // Fallback: pause and resume to potentially unstick
          if (window.electronAPI && window.electronAPI.pauseSession && window.electronAPI.continueSession) {
            await window.electronAPI.pauseSession();
            setTimeout(async () => {
              await window.electronAPI.continueSession();
              console.log('✅ Campaign restarted');
            }, 1000);
          }
        }
      } catch (error) {
        console.log('❌ Error skipping contact:', error);
      }
    });

    // Force complete campaign button
    const forceCompleteBtn = document.createElement('button');
    forceCompleteBtn.id = 'force-complete-btn';
    forceCompleteBtn.className = 'btn btn-success';
    forceCompleteBtn.title = 'Force complete campaign';
    forceCompleteBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span>';
    forceCompleteBtn.style.display = 'none';
    
    forceCompleteBtn.addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to force complete the campaign? This will stop the current campaign and mark it as finished.');
      if (!confirmed) return;
      
      try {
        console.log('🏁 Force completing campaign...');
        
        // Stop the session
        if (window.electronAPI && window.electronAPI.stopSession) {
          await window.electronAPI.stopSession();
        }
        
        // Update app state
        if (window.appState) {
          window.appState.isSessionActive = false;
          window.appState.sessionPaused = false;
          
          if (window.appState.updateWorkflowUI) {
            window.appState.updateWorkflowUI();
          }
        }
        
        // Show completion message
        if (window.logger) {
          window.logger.success('Campaign manually completed');
        }
        
        if (window.notifications) {
          window.notifications.success('Campaign force completed');
        }
        
        console.log('✅ Campaign force completed');
        
      } catch (error) {
        console.log('❌ Error force completing campaign:', error);
        
        if (window.notifications) {
          window.notifications.error('Error force completing campaign');
        }
      }
    });

    // Restart campaign button
    const restartBtn = document.createElement('button');
    restartBtn.id = 'restart-campaign-btn';
    restartBtn.className = 'btn btn-info';
    restartBtn.title = 'Restart campaign from beginning';
    restartBtn.innerHTML = '<span class="material-symbols-outlined">restart_alt</span>';
    restartBtn.style.display = 'none';
    
    restartBtn.addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to restart the campaign from the beginning? This will stop the current campaign and start over.');
      if (!confirmed) return;
      
      try {
        console.log('🔄 Restarting campaign...');
        
        // Stop current session
        if (window.electronAPI && window.electronAPI.stopSession) {
          await window.electronAPI.stopSession();
        }
        
        // Wait a moment then restart
        setTimeout(async () => {
          // Trigger the start campaign button
          const sendButton = document.getElementById('sendButton');
          if (sendButton && !sendButton.disabled) {
            sendButton.click();
            console.log('✅ Campaign restarted');
          } else {
            if (window.notifications) {
              window.notifications.warning('Cannot restart - ensure you have a file and message');
            }
          }
        }, 2000);
        
      } catch (error) {
        console.log('❌ Error restarting campaign:', error);
      }
    });

    // Add buttons to action controls
    actionControls.appendChild(skipBtn);
    actionControls.appendChild(forceCompleteBtn);
    actionControls.appendChild(restartBtn);

    // Show/hide buttons based on campaign state
    setInterval(() => {
      const isActive = window.appState && window.appState.isSessionActive;
      const isPaused = window.appState && window.appState.sessionPaused;
      
      // Show manual controls only when campaign is active
      skipBtn.style.display = isActive ? 'inline-flex' : 'none';
      forceCompleteBtn.style.display = isActive ? 'inline-flex' : 'none';
      restartBtn.style.display = isActive ? 'inline-flex' : 'none';
      
      // Update button states
      if (isActive) {
        skipBtn.disabled = isPaused;
        forceCompleteBtn.disabled = false;
        restartBtn.disabled = false;
      }
    }, 1000);

    console.log('✅ Manual campaign controls added');
  }

  // Add keyboard shortcuts for manual controls
  function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only work when campaign is active
      if (!window.appState || !window.appState.isSessionActive) return;
      
      // Ctrl+Shift+S = Skip current contact
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        const skipBtn = document.getElementById('skip-contact-btn');
        if (skipBtn && !skipBtn.disabled) {
          skipBtn.click();
        }
      }
      
      // Ctrl+Shift+C = Force complete campaign
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        const completeBtn = document.getElementById('force-complete-btn');
        if (completeBtn && !completeBtn.disabled) {
          completeBtn.click();
        }
      }
      
      // Ctrl+Shift+R = Restart campaign
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        const restartBtn = document.getElementById('restart-campaign-btn');
        if (restartBtn && !restartBtn.disabled) {
          restartBtn.click();
        }
      }
    });
    
    console.log('✅ Keyboard shortcuts added (Ctrl+Shift+S/C/R)');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addManualControls();
      addKeyboardShortcuts();
    });
  } else {
    addManualControls();
    addKeyboardShortcuts();
  }

  console.log('✅ Manual Campaign Control Loaded');

})();