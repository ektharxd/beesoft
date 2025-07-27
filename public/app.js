/**
 * BEESOFT UI/UX - ENHANCED APPLICATION LOGIC
 * Comprehensive redesign with improved workflow, accessibility, and user experience
 */

// ==========================================================================
// APPLICATION STATE MANAGEMENT
// ==========================================================================

class AppState {
  constructor() {
    this.currentStep = 1;
    this.isConnected = false;
    this.hasFile = false;
    this.hasMessage = false;
    this.isSessionActive = false;
    this.sessionPaused = false;
    this.selectedImagePath = null;
    this.contactCount = 0;
    this.stats = {
      success: 0,
      failed: 0,
      total: 0
    };
  }

  updateStep(step) {
    this.currentStep = step;
    this.updateWorkflowUI();
  }

  updateWorkflowUI() {
    // Update step indicators
    for (let i = 1; i <= 3; i++) {
      const indicator = document.getElementById(`step-${i}-indicator`);
      if (indicator) {
        indicator.className = 'workflow-step';
        if (i < this.currentStep) {
          indicator.className += ' completed';
          indicator.innerHTML = '<span class="material-symbols-outlined">check</span>';
        } else if (i === this.currentStep) {
          indicator.className += '';
          indicator.textContent = i;
        } else {
          indicator.className += ' disabled';
          indicator.textContent = i;
        }
      }
    }

    // Update action button state
    this.updateActionButtons();
  }

  updateActionButtons() {
    const sendButton = document.getElementById('sendButton');
    const pauseButton = document.getElementById('pauseButton');
    const continueButton = document.getElementById('continueButton');
    const stopButton = document.getElementById('stopButton');

    if (sendButton) {
      const canSend = this.isConnected && this.hasFile && this.hasMessage && !this.isSessionActive;
      sendButton.disabled = !canSend;
      
      if (this.isSessionActive) {
        sendButton.innerHTML = '<span class="bee-spinner"></span> Campaign Running...';
        sendButton.classList.add('loading');
      } else {
        sendButton.innerHTML = '<span class="material-symbols-outlined">send</span><span id="send-btn-text">Start Campaign</span>';
        sendButton.classList.remove('loading');
      }
    }

    if (pauseButton) pauseButton.disabled = !this.isSessionActive || this.sessionPaused;
    if (continueButton) continueButton.disabled = !this.isSessionActive || !this.sessionPaused;
    if (stopButton) stopButton.disabled = !this.isSessionActive;
  }

  updateConnectionStatus(connected) {
    this.isConnected = connected;
    const statusEl = document.getElementById('connection-status');
    
    if (statusEl) {
      if (connected) {
        statusEl.className = 'status-indicator online';
        statusEl.innerHTML = '<span class="status-dot"></span><span>Connected</span>';
        this.updateStep(Math.max(this.currentStep, 2));
      } else {
        statusEl.className = 'status-indicator offline';
        statusEl.innerHTML = '<span class="status-dot"></span><span>Disconnected</span>';
        this.updateStep(1);
      }
    }

    this.updateWorkflowUI();
  }

  updateStats(stats) {
    this.stats = { ...this.stats, ...stats };
    
    const successEl = document.getElementById('success-count');
    const failedEl = document.getElementById('failed-count');
    const totalEl = document.getElementById('total-count');

    if (successEl) successEl.textContent = this.stats.success;
    if (failedEl) failedEl.textContent = this.stats.failed;
    if (totalEl) totalEl.textContent = this.stats.total;
  }
}

// ==========================================================================
// NOTIFICATION SYSTEM
// ==========================================================================

class NotificationManager {
  constructor() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = this.getIcon(type);
    toast.innerHTML = `
      <span class="material-symbols-outlined" style="margin-right: var(--space-sm);">${icon}</span>
      <span>${message}</span>
    `;

    this.container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);

    return toast;
  }

  getIcon(type) {
    const icons = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    return icons[type] || 'info';
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// ==========================================================================
// ACTIVITY LOGGER
// ==========================================================================

class ActivityLogger {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.maxEntries = 100;
  }

  log(message, type = 'info') {
    if (!this.container) return;

    const item = document.createElement('div');
    item.className = `activity-item ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    item.innerHTML = `
      <span class="activity-time">${timestamp}</span>
      <span class="activity-message">${message}</span>
    `;

    // Remove old entries
    while (this.container.children.length >= this.maxEntries) {
      this.container.removeChild(this.container.firstChild);
    }

    this.container.appendChild(item);
    this.container.scrollTop = this.container.scrollHeight;
  }

  success(message) {
    this.log(message, 'success');
  }

  error(message) {
    this.log(message, 'error');
  }

  info(message) {
    this.log(message, 'info');
  }
}

// ==========================================================================
// FORM VALIDATION
// ==========================================================================

class FormValidator {
  static validatePhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's a valid length (10-15 digits)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  static validateExcelFile(file) {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const validExtensions = ['.xlsx', '.xls'];
    
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    return hasValidType || hasValidExtension;
  }

  static validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    return validTypes.includes(file.type) && file.size <= maxSize;
  }
}

// ==========================================================================
// MAIN APPLICATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', function() {
  // Initialize global objects
  window.appState = new AppState();
  window.notifications = new NotificationManager();
  window.logger = new ActivityLogger('live-log-list');

  // Initialize theme system
  initializeTheme();
  
  // Initialize trial system
  initializeTrialSystem();
  
  // Initialize main application
  initializeMainApp();
  
  // Initialize network monitoring
  initializeNetworkMonitoring();

  // Start with trial check
  checkTrial();

  // Support modal logic
  const supportModal = document.getElementById('support-modal');
  const openSupportBtn = document.getElementById('open-support-modal-btn');
  const openSupportBtnFooter = document.getElementById('open-support-modal-btn-footer');
  const closeSupportBtn = document.getElementById('close-support-modal-btn');
  const supportForm = document.getElementById('support-form');
  const supportFormSuccess = document.getElementById('support-form-success');
  const supportFormError = document.getElementById('support-form-error');

  function openSupportModal() {
    if (supportModal) supportModal.style.display = 'flex';
    if (supportForm) {
      supportForm.reset();
      supportFormSuccess.style.display = 'none';
      supportFormError.style.display = 'none';
    }
  }
  function closeSupportModal() {
    if (supportModal) supportModal.style.display = 'none';
  }
  if (openSupportBtn) openSupportBtn.addEventListener('click', openSupportModal);
  if (openSupportBtnFooter) openSupportBtnFooter.addEventListener('click', openSupportModal);
  if (closeSupportBtn) closeSupportBtn.addEventListener('click', closeSupportModal);
  if (supportModal) {
    supportModal.addEventListener('click', function(e) {
      if (e.target === supportModal) closeSupportModal();
    });
  }
  if (supportForm) {
    supportForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      supportFormSuccess.style.display = 'none';
      supportFormError.style.display = 'none';
      const email = document.getElementById('support-email').value.trim();
      const message = document.getElementById('support-message').value.trim();
      try {
        const response = await fetch('https://formspree.io/f/xblkoyno', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, message })
        });
        if (response.ok) {
          supportFormSuccess.style.display = 'block';
          supportFormError.style.display = 'none';
          supportForm.reset();
          setTimeout(() => {
            // Optionally close modal here
          }, 1800);
        } else {
          const data = await response.json();
          supportFormError.textContent = (data && data.errors && data.errors[0] && data.errors[0].message) || 'Failed to send. Please try again.';
          supportFormError.style.display = 'block';
        }
      } catch (err) {
        supportFormError.textContent = 'Network error. Please try again.';
        supportFormError.style.display = 'block';
      }
    });
  }

  const termsCheckbox = document.getElementById('accept-terms-checkbox');
  const getStartedBtn = document.getElementById('get-started-btn');
  if (termsCheckbox && getStartedBtn) {
    // Check localStorage for acceptance
    if (localStorage.getItem('beesoft_terms_accepted') === 'true') {
      termsCheckbox.checked = true;
      getStartedBtn.disabled = false;
    } else {
      getStartedBtn.disabled = true;
    }
    termsCheckbox.addEventListener('change', function () {
      if (termsCheckbox.checked) {
        localStorage.setItem('beesoft_terms_accepted', 'true');
        getStartedBtn.disabled = false;
      } else {
        localStorage.removeItem('beesoft_terms_accepted');
        getStartedBtn.disabled = true;
      }
    });
  }
});

// ==========================================================================
// THEME SYSTEM
// ==========================================================================

function initializeTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'light';

  // Update UI elements based on current theme
  function updateThemeUI(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
      themeToggle.style.background = theme === 'dark' ? '#f59e0b !important' : '#4f46e5 !important';
    }
    
    if (window.notifications) {
      window.notifications.info(`Switched to ${theme} mode`);
    }
  }

  // Initialize UI
  updateThemeUI(currentTheme);

  // Theme toggle handler
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      updateThemeUI(newTheme);
    });
  }

  // System preference detection
  if (!localStorage.getItem('theme')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      updateThemeUI('dark');
    }
  }

  console.log('Theme toggle initialized:', !!themeToggle, 'Current theme:', currentTheme);
}

// ==========================================================================
// TRIAL SYSTEM
// ==========================================================================

async function getTrustedTime() {
  try {
    const response = await fetch('https://worldtimeapi.org/api/ip');
    const data = await response.json();
    return new Date(data.utc_datetime).getTime();
  } catch {
    // fallback to system time if offline
    return Date.now();
  }
}

function initializeTrialSystem() {
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

  function getTrialData() {
    const data = localStorage.getItem('beesoft_trial');
    if (!data) return null;
    try { 
      return JSON.parse(decrypt(data)); 
    } catch { 
      return null; 
    }
  }

  function setTrialData(obj) {
    localStorage.setItem('beesoft_trial', encrypt(JSON.stringify(obj)));
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

  // Page display logic
  function showPage(pageId) {
    const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
    pages.forEach(id => {
      const page = document.getElementById(id);
      if (page) page.style.display = 'none';
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.style.display = 'flex';
    }
  }

  // Enhanced trial check function
  window.checkTrial = async function() {
    const trial = getTrialData();
    if (!trial) {
      showPage('trial-lock-page');
      const trialInfo = document.getElementById('trial-info');
      if (trialInfo) {
        trialInfo.textContent = 'This software is not activated. Please contact an administrator.';
      }
      return;
    }

    // Get trusted time (online, fallback to system)
    const trustedNow = await getTrustedTime();
    // Get last used time from localStorage
    const lastUsed = Number(localStorage.getItem('beesoft_last_used_time') || '0');
    // Use the max of trustedNow, Date.now(), and lastUsed
    const now = Math.max(trustedNow, Date.now(), lastUsed);
    // Save the latest time for next run
    localStorage.setItem('beesoft_last_used_time', String(now));

    // Detect backdating
    if (now < lastUsed) {
      showPage('trial-lock-page');
      const trialInfo = document.getElementById('trial-info');
      if (trialInfo) {
        trialInfo.textContent = 'System clock tampering detected. Please set your date and time correctly.';
      }
      window.notifications.error('System clock tampering detected. Please set your date and time correctly.');
      return;
    }

    if (trial.activated) {
      showPage('welcome-page');
      const statusAlert = document.getElementById('status-alert');
      if (statusAlert) {
        statusAlert.textContent = 'Application is permanently activated.';
        statusAlert.className = 'notification success';
        statusAlert.style.display = 'block';
        setTimeout(() => { statusAlert.style.display = 'none'; }, 5000);
      }
      return;
    }

    const expiryDate = trial.start + (trial.days * 24 * 60 * 60 * 1000);
    
    if (now > expiryDate) {
      showPage('trial-lock-page');
      const trialInfo = document.getElementById('trial-info');
      if (trialInfo) {
        trialInfo.textContent = `Trial expired on ${new Date(expiryDate).toLocaleDateString()}.`;
      }
      return;
    }

    const daysLeft = Math.ceil((expiryDate - now) / (24 * 60 * 60 * 1000));
    showPage('welcome-page');
    
    const statusAlert = document.getElementById('status-alert');
    if (statusAlert) {
      statusAlert.textContent = `Trial active. You have ${daysLeft} days left.`;
      statusAlert.className = 'notification warning';
      statusAlert.style.display = 'block';
      setTimeout(() => { statusAlert.style.display = 'none'; }, 5000);
    }
  };

  // Admin login handlers
  const adminLoginBtn = document.getElementById('admin-login-btn');
  const adminAuthBtn = document.getElementById('admin-auth-btn');
  const clearDataBtn = document.getElementById('clear-data-btn');

  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', () => {
      const form = document.getElementById('admin-login-form');
      if (form) {
        form.style.display = form.style.display === 'block' ? 'none' : 'block';
      }
    });
  }

  if (adminAuthBtn) {
    adminAuthBtn.addEventListener('click', async () => {
      const username = document.getElementById('admin-username').value.trim();
      const password = document.getElementById('admin-password').value.trim();
      const errorEl = document.getElementById('admin-login-error');

      if (!username || !password) {
        if (errorEl) errorEl.textContent = 'Please enter both admin email and password.';
        return;
      }

      // Server-based activation only
      const machineId = getOrCreateDeviceId();
      try {
        const response = await fetch('/api/devices', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ machineId, adminEmail: username, adminPassword: password })
        });
        if (!response.ok) {
          const msg = await response.text();
          if (errorEl) errorEl.textContent = msg || 'Activation failed.';
          return;
        }
        // Success: re-check activation status
        await checkActivationStatus();
        if (errorEl) errorEl.textContent = '';
      } catch (e) {
        if (errorEl) errorEl.textContent = 'Network error. Please try again.';
      }
    });
  }

  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', () => {
      showConfirmationModal(
        'Clear Local Data',
        'Are you sure you want to clear all local data, including trial and admin info? This cannot be undone.',
        () => {
          localStorage.clear();
          window.notifications.success('Local data cleared. Reloading application...');
          setTimeout(() => location.reload(), 1000);
        }
      );
    });
  }

  // Get started button
  const getStartedBtn = document.getElementById('get-started-btn');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      showPage('main-app-page'); window.logger.info('Application started'); setTimeout(() => { if (typeof initializeTotalMessagesCounter === 'function') { initializeTotalMessagesCounter(); } }, 500);
    });
  }

  // Back to welcome button
  const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
  if (backToWelcomeBtn) {
    backToWelcomeBtn.addEventListener('click', () => {
      showConfirmationModal(
        'Return to Welcome',
        'Are you sure you want to return to the welcome screen? Any unsaved progress will be lost.',
        () => {
          // Reset application state
          window.appState = new AppState();
          
          // Clear form data
          const fileInput = document.getElementById('excelFile');
          const messageInput = document.getElementById('message');
          if (fileInput) fileInput.value = '';
          if (messageInput) messageInput.value = '';
          
          // Reset UI elements
          const fileUploadArea = document.getElementById('file-upload-area');
          if (fileUploadArea) {
            fileUploadArea.querySelector('.file-upload-text').textContent = 'Drop your Excel file here or click to browse';
            fileUploadArea.querySelector('.file-upload-hint').textContent = 'Supports .xlsx and .xls files';
          }
          
          const messagePreview = document.getElementById('message-preview');
          if (messagePreview) {
            messagePreview.textContent = 'Your message preview will appear here...';
            messagePreview.style.fontStyle = 'italic';
            messagePreview.style.color = 'var(--text-tertiary)';
          }
          
          const charCount = document.getElementById('char-count');
          if (charCount) charCount.textContent = '0';
          
          // Show welcome page
          showPage('welcome-page');
          window.logger.info('Returned to welcome screen');
          window.notifications.info('Returned to welcome screen');
        }
      );
    });
  }
}

// ==========================================================================
// MAIN APPLICATION LOGIC
// ==========================================================================

function initializeMainApp() {
  initializeFileUpload();
  initializeMessageComposer();
  initializeImageUpload();
  initializeWhatsAppConnection();
  initializeSessionControls();
  initializeSessionReset();
}

function initializeSessionReset() {
  const resetBtn = document.getElementById('reset-session-btn');
  if (!resetBtn) return;
  resetBtn.addEventListener('click', () => {
    // Reset app state
    window.appState = new AppState();
    window.appState.updateWorkflowUI();

    // Clear file input
    const fileInput = document.getElementById('excelFile');
    if (fileInput) fileInput.value = '';
    const fileInfo = document.getElementById('file-info');
    if (fileInfo) fileInfo.style.display = 'none';
    const fileUploadArea = document.getElementById('file-upload-area');
    if (fileUploadArea) {
      fileUploadArea.querySelector('.file-upload-text').textContent = 'Drop your Excel file here or click to browse';
      fileUploadArea.querySelector('.file-upload-hint').textContent = 'Supports .xlsx and .xls files';
    }

    // Clear image
    window.appState.selectedImagePath = null;
    const imagePreview = document.getElementById('image-preview');
    if (imagePreview) imagePreview.style.display = 'none';
    const imageFileName = document.getElementById('imageFileName');
    if (imageFileName) imageFileName.textContent = 'No image selected';

    // Clear message
    const messageInput = document.getElementById('message');
    if (messageInput) messageInput.value = '';
    const messagePreview = document.getElementById('message-preview');
    if (messagePreview) {
      messagePreview.textContent = 'Your message preview will appear here...';
      messagePreview.style.fontStyle = 'italic';
      messagePreview.style.color = 'var(--text-tertiary)';
    }
    const charCount = document.getElementById('char-count');
    if (charCount) charCount.textContent = '0';

    // Reset stats
    window.appState.updateStats({ success: 0, failed: 0, total: 0 });

    // Reset QR and connection UI
    const qrContainer = document.getElementById('qr-container');
    if (qrContainer) qrContainer.style.display = 'none';
    const connectionPlaceholder = document.getElementById('connection-placeholder');
    if (connectionPlaceholder) connectionPlaceholder.style.display = 'block';

    window.notifications.success('Session reset. You can start fresh!');
    window.logger.info('Session reset by user');
  });
}

function initializeFileUpload() {
  const fileInput = document.getElementById('excelFile');
  const fileUploadArea = document.getElementById('file-upload-area');
  const fileInfo = document.getElementById('file-info');

  if (!fileInput || !fileUploadArea) return;

  // File input change handler
  fileInput.addEventListener('change', handleFileSelect);

  // Drag and drop handlers
  fileUploadArea.addEventListener('click', () => fileInput.click());
  
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('drag-over');
  });

  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('drag-over');
  });

  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('drag-over');
    
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      handleFileSelect();
    }
  });

  function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;

    // Validate file
    if (!FormValidator.validateExcelFile(file)) {
      window.notifications.error('Please select a valid Excel file (.xlsx or .xls)');
      fileInput.value = '';
      return;
    }

    // Update UI
    fileUploadArea.querySelector('.file-upload-text').textContent = file.name;
    fileUploadArea.querySelector('.file-upload-hint').textContent = `${(file.size / 1024).toFixed(1)} KB`;
    
    if (fileInfo) {
      fileInfo.style.display = 'block';
      fileInfo.innerHTML = `<strong>File loaded:</strong> ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }

    // Process file
    processExcelFile(file);
  }

  function processExcelFile(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Extract phone numbers
        const phoneNumbers = [];
        data.forEach(row => {
          row.forEach(cell => {
            if (cell && FormValidator.validatePhoneNumber(String(cell))) {
              phoneNumbers.push(String(cell));
            }
          });
        });

        // Remove duplicates
        const uniqueNumbers = [...new Set(phoneNumbers)];
        
        if (uniqueNumbers.length === 0) {
          window.notifications.error('No valid phone numbers found in the file');
          return;
        }

        // Update state
        window.appState.hasFile = true;
        window.appState.contactCount = uniqueNumbers.length;
        window.appState.updateStep(Math.max(window.appState.currentStep, 3));
        window.appState.updateStats({ total: uniqueNumbers.length });

        window.notifications.success(`Found ${uniqueNumbers.length} valid phone numbers`);
        window.logger.info(`Loaded ${uniqueNumbers.length} contacts from ${file.name}`);

      } catch (error) {
        window.notifications.error('Error reading Excel file: ' + error.message);
        window.logger.error('File processing error: ' + error.message);
      }
    };

    reader.onerror = () => {
      window.notifications.error('Error reading file');
    };

    reader.readAsArrayBuffer(file);
  }
}

function initializeMessageComposer() {
  const messageInput = document.getElementById('message');
  const charCount = document.getElementById('char-count');
  const messagePreview = document.getElementById('message-preview');

  if (!messageInput) return;

  messageInput.addEventListener('input', () => {
    const text = messageInput.value;
    const length = text.length;

    // Update character count
    if (charCount) {
      charCount.textContent = length;
      charCount.style.color = length > 1000 ? 'var(--color-warning)' : 'var(--text-tertiary)';
    }

    // Update preview
    if (messagePreview) {
      if (text.trim()) {
        messagePreview.textContent = text;
        messagePreview.style.fontStyle = 'normal';
        messagePreview.style.color = 'var(--text-primary)';
      } else {
        messagePreview.textContent = 'Your message preview will appear here...';
        messagePreview.style.fontStyle = 'italic';
        messagePreview.style.color = 'var(--text-tertiary)';
      }
    }

    // Update state
    window.appState.hasMessage = text.trim().length > 0;
    window.appState.updateWorkflowUI();
  });

  // Add keyboard shortcuts
  messageInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      const sendButton = document.getElementById('sendButton');
      if (sendButton && !sendButton.disabled) {
        sendButton.click();
      }
    }
  });
}

function initializeImageUpload() {
  const attachImageBtn = document.getElementById('attachImageBtn');
  const imagePreview = document.getElementById('image-preview');
  const imageFileName = document.getElementById('imageFileName');

  if (!attachImageBtn) return;

  attachImageBtn.addEventListener('click', async () => {
    if (window.electronAPI && window.electronAPI.selectImage) {
      try {
        const filePath = await window.electronAPI.selectImage();
        if (filePath) {
          window.appState.selectedImagePath = filePath;
          const fileName = filePath.split(/[\\/]/).pop();
          
          if (imageFileName) imageFileName.textContent = fileName;
          if (imagePreview) imagePreview.style.display = 'block';
          
          window.notifications.success('Image attached successfully');
          window.logger.info(`Image attached: ${fileName}`);
        }
      } catch (error) {
        window.notifications.error('Error selecting image: ' + error.message);
      }
    } else {
      window.notifications.error('Image selection not available in this environment');
    }
  });
}

function initializeWhatsAppConnection() {
    const connectBtn = document.getElementById('connect-btn');
    const connectFallbackBtn = document.getElementById('connect-fallback-btn');
    const qrContainer = document.getElementById('qr-container');
    const qrCodeDisplay = document.getElementById('qr-code-display');
    const connectionPlaceholder = document.getElementById('connection-placeholder');

    if (!connectBtn) return;

    // Main connection button
    connectBtn.addEventListener('click', async () => {
        try {
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<span class="bee-spinner"></span> Connecting...';
            
            if (window.electronAPI && window.electronAPI.connectWhatsApp) {
                window.logger.info('Initiating WhatsApp connection...');
                
                try {
                    const status = await window.electronAPI.connectWhatsApp();
                    window.logger.info('WhatsApp connection process initiated. Waiting for QR code...');
                    window.notifications.info('Connecting to WhatsApp... Please wait for QR code.');
                    
                } catch (connectionError) {
                    if (connectionError.message && 
                        !connectionError.message.includes('timeout') && 
                        !connectionError.message.includes('pending') &&
                        !connectionError.message.includes('already')) {
                        window.notifications.error('Connection error: ' + connectionError.message);
                        window.logger.error('Connection error: ' + connectionError.message);
                    } else {
                        window.logger.info('WhatsApp connection process started');
                    }
                }
            } else {
                window.notifications.error('WhatsApp connection not available in this environment');
                window.logger.error('WhatsApp API not available');
            }
        } catch (error) {
            window.notifications.error('Unexpected error: ' + error.message);
            window.logger.error('Unexpected error: ' + error.message);
        } finally {
            // Reset button after a short delay
            setTimeout(() => {
                if (connectBtn) {
                    connectBtn.disabled = false;
                    connectBtn.innerHTML = '<span class="material-symbols-outlined">qr_code_scanner</span> Connect WhatsApp';
                }
            }, 2000);
        }
    });

    // Fallback connection button
    if (connectFallbackBtn) {
        connectFallbackBtn.addEventListener('click', async () => {
            try {
                connectFallbackBtn.disabled = true;
                connectFallbackBtn.innerHTML = '<span class="bee-spinner"></span> Connecting...';
                
                if (window.electronAPI && window.electronAPI.connectWhatsAppFallback) {
                    window.logger.info('Using fallback WhatsApp connection method...');
                    
                    try {
                        const status = await window.electronAPI.connectWhatsAppFallback();
                        window.logger.info('Fallback connection initiated. Please scan QR code when it appears.');
                        window.notifications.info('Fallback connection started. QR code will appear shortly.');
                        
                    } catch (fallbackError) {
                        window.notifications.error('Fallback connection error: ' + fallbackError.message);
                        window.logger.error('Fallback connection error: ' + fallbackError.message);
                    }
                } else {
                    window.notifications.error('Fallback connection not available');
                    window.logger.error('Fallback connection API not available');
                }
            } catch (error) {
                window.notifications.error('Unexpected fallback error: ' + error.message);
                window.logger.error('Unexpected fallback error: ' + error.message);
            } finally {
                setTimeout(() => {
                    if (connectFallbackBtn) {
                        connectFallbackBtn.disabled = false;
                        connectFallbackBtn.innerHTML = '<span class="material-symbols-outlined">backup</span> Use Fallback Connection';
                    }
                }, 2000);
            }
        });
    }

    // Listen for backend updates
    if (window.electronAPI && window.electronAPI.onUpdate) {
        window.electronAPI.onUpdate((data) => {
            handleBackendUpdate(data);
        });
    }

}

// ==========================================================================
// BACKEND UPDATE HANDLER
// ==========================================================================

function handleBackendUpdate(data) {
    const qrContainer = document.getElementById('qr-container');
    const qrCodeDisplay = document.getElementById('qr-code-display');
    const connectionPlaceholder = document.getElementById('connection-placeholder');
    
    switch(data.type) {
        case 'qr':
            // Show QR code
            if (qrContainer && qrCodeDisplay) {
                qrContainer.style.display = 'block';
                if (connectionPlaceholder) {
                    connectionPlaceholder.style.display = 'none';
                }
                
                // Create QR code using a simple text display (you can use a QR library here)
                qrCodeDisplay.innerHTML = `
                    <div style="font-family: monospace; font-size: 8px; line-height: 1; white-space: pre-wrap; background: #000; color: #fff; padding: 10px; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 10px; color: #00f; font-size: 12px;">📱 Scan this QR Code with WhatsApp</div>
                        <div style="background: white; color: black; padding: 10px; border-radius: 4px; text-align: center;">
                            QR Code Data: ${data.qr.substring(0, 50)}...
                        </div>
                        <div style="text-align: center; margin-top: 10px; color: #0f0; font-size: 10px;">Open WhatsApp → Settings → Linked Devices → Link Device</div>
                    </div>
                `;
                
                window.logger.info(`QR Code generated (attempt ${data.attempt || 1})`);
                window.notifications.info('QR Code generated. Scan with your phone to connect.');
            }
            break;
            
        case 'whatsapp-ready':
            window.appState.updateConnectionStatus(true);
            if (qrContainer) qrContainer.style.display = 'none';
            if (connectionPlaceholder) connectionPlaceholder.style.display = 'block';
            window.logger.success('WhatsApp connected successfully!');
            window.notifications.success('WhatsApp connected! You can now start your campaign.');
            break;
            
        case 'whatsapp-disconnected':
            window.appState.updateConnectionStatus(false);
            if (qrContainer) qrContainer.style.display = 'none';
            if (connectionPlaceholder) connectionPlaceholder.style.display = 'block';
            window.logger.error(`WhatsApp disconnected: ${data.reason}`);
            window.notifications.error('WhatsApp disconnected. Please reconnect.');
            break;
            
        case 'log':
            if (data.level && data.message) {
                switch(data.level) {
                    case 'success':
                        window.logger.success(data.message);
                        break;
                    case 'error':
                        window.logger.error(data.message);
                        break;
                    case 'warning':
                        window.logger.log(data.message, 'warning');
                        break;
                    default:
                        window.logger.info(data.message);
                }
            }
            break;
            
        case 'campaign-progress':
            if (data.current !== undefined && data.total !== undefined) {
                window.appState.updateStats({
                    success: data.successCount || 0,
                    failed: data.errorCount || 0,
                    total: data.total
                });
                
                window.logger.info(`Progress: ${data.current}/${data.total} (${data.progress || 0}%)`);
            }
            break;
            
        case 'campaign-success':
            if (data.successCount !== undefined) {
                window.appState.updateStats({ success: data.successCount }); if (typeof incrementTotalMessagesSent === 'function') { incrementTotalMessagesSent(1); }
            }
            break;
            
        case 'campaign-failure':
            if (data.errorCount !== undefined) {
                window.appState.updateStats({ failed: data.errorCount });
            }
            break;
            
        case 'campaign-finished':
            window.appState.isSessionActive = false;
            window.appState.sessionPaused = false;
            window.appState.updateWorkflowUI();
            
            if (data.stats) {
                window.appState.updateStats({
                    success: data.stats.success || 0,
                    failed: data.stats.failed || 0,
                    total: data.stats.total || 0
                });
            }
            
            window.logger.success(`Campaign ${data.reason || 'completed'}: ${data.summary || ''}`);
            window.notifications.success('Campaign finished!');
            break;
            
        case 'campaign-error':
            window.appState.isSessionActive = false;
            window.appState.sessionPaused = false;
            window.appState.updateWorkflowUI();
            
            window.logger.error(`Campaign error: ${data.error}`);
            window.notifications.error(`Campaign error: ${data.error}`);
            break;
            
        default:
            console.log('Unknown backend update:', data);
    }
}

function initializeSessionControls() {
  const sendButton = document.getElementById('sendButton');
  const pauseButton = document.getElementById('pauseButton');
  const continueButton = document.getElementById('continueButton');
  const stopButton = document.getElementById('stopButton');

  if (sendButton) {
    sendButton.addEventListener('click', startSession);
  }

  if (pauseButton) {
    pauseButton.addEventListener('click', pauseSession);
  }

  if (continueButton) {
    continueButton.addEventListener('click', continueSession);
  }

  if (stopButton) {
    stopButton.addEventListener('click', () => {
      showConfirmationModal(
        'Stop Campaign',
        'Are you sure you want to stop the current campaign? This action cannot be undone.',
        stopSession
      );
    });
  }

  async function startSession() {
    if (!window.appState.isConnected) {
      window.notifications.error('Please connect to WhatsApp first');
      return;
    }

    if (!window.appState.hasFile || !window.appState.hasMessage) {
      window.notifications.error('Please upload a contact file and write a message');
      return;
    }

    try {
      const fileInput = document.getElementById('excelFile');
      const messageInput = document.getElementById('message');
      
      if (!fileInput.files[0] || !messageInput.value.trim()) {
        window.notifications.error('Missing required data');
        return;
      }

      // Get contact count for confirmation
      const file = fileInput.files[0];
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const phoneNumbers = [];
          data.forEach(row => {
            row.forEach(cell => {
              if (cell && FormValidator.validatePhoneNumber(String(cell))) {
                phoneNumbers.push(String(cell));
              }
            });
          });

          const uniqueNumbers = [...new Set(phoneNumbers)];
          
          if (uniqueNumbers.length === 0) {
            window.notifications.error('No valid phone numbers found');
            return;
          }

          // Show confirmation dialog
          const confirmMessage = `Are you sure you want to start the campaign?\n\n` +
            `• ${uniqueNumbers.length} contacts will receive your message\n` +
            `• Message: "${messageInput.value.trim().substring(0, 100)}${messageInput.value.trim().length > 100 ? '...' : ''}"\n` +
            `${window.appState.selectedImagePath ? '• An image will be attached\n' : ''}` +
            `\nThis action cannot be undone once started.`;

          showConfirmationModal(
            'Start Campaign',
            confirmMessage,
            async () => {
              // Start session after confirmation
              const sessionData = {
                numbers: uniqueNumbers,
                message: messageInput.value.trim(),
                imagePath: window.appState.selectedImagePath
              };

              if (window.electronAPI && window.electronAPI.startSession) {
                window.appState.isSessionActive = true;
                window.appState.updateWorkflowUI();
                
                const response = await window.electronAPI.startSession(sessionData);
                window.logger.success(`Campaign started with ${uniqueNumbers.length} contacts`);
                window.notifications.success('Campaign started successfully!');
              } else {
                window.notifications.error('Session management not available');
              }
            }
          );
        } catch (error) {
          window.notifications.error('Error starting session: ' + error.message);
          window.logger.error('Session start error: ' + error.message);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      window.notifications.error('Error starting campaign: ' + error.message);
    }
  }

  async function pauseSession() {
    try {
      if (window.electronAPI && window.electronAPI.pauseSession) {
        await window.electronAPI.pauseSession();
        window.appState.sessionPaused = true;
        window.appState.updateWorkflowUI();
        window.notifications.info('Campaign paused');
        window.logger.info('Campaign paused by user');
      }
    } catch (error) {
      window.notifications.error('Error pausing session: ' + error.message);
    }
  }

  async function continueSession() {
    try {
      if (window.electronAPI && window.electronAPI.continueSession) {
        await window.electronAPI.continueSession();
        window.appState.sessionPaused = false;
        window.appState.updateWorkflowUI();
        window.notifications.info('Campaign resumed');
        window.logger.info('Campaign resumed by user');
      }
    } catch (error) {
      window.notifications.error('Error resuming session: ' + error.message);
    }
  }

  async function stopSession() {
    try {
      if (window.electronAPI && window.electronAPI.stopSession) {
        await window.electronAPI.stopSession();
        handleSessionFinished();
        window.notifications.warning('Campaign stopped');
        window.logger.warning('Campaign stopped by user');
      }
    } catch (error) {
      window.notifications.error('Error stopping session: ' + error.message);
    }
  }

  function handleSessionUpdate(data) {
    if (data.success !== undefined) {
      window.appState.updateStats({ success: data.success });
    }
    if (data.failed !== undefined) {
      window.appState.updateStats({ failed: data.failed });
    }
  }

  function handleSessionFinished() {
    window.appState.isSessionActive = false;
    window.appState.sessionPaused = false;
    window.appState.updateWorkflowUI();
    
    const total = window.appState.stats.success + window.appState.stats.failed;
    window.logger.success(`Campaign completed. Sent: ${window.appState.stats.success}, Failed: ${window.appState.stats.failed}, Total: ${total}`);
  }
}

// ==========================================================================
// NETWORK MONITORING
// ==========================================================================

function initializeNetworkMonitoring() {
  updateNetworkStatus();
  setInterval(updateNetworkStatus, 30000); // Update every 30 seconds

  // Listen for online/offline events
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  if (navigator.connection) {
    navigator.connection.addEventListener('change', updateNetworkStatus);
  }

  async function updateNetworkStatus() {
    const statusEl = document.getElementById('network-status');
    const pingEl = document.getElementById('network-ping');
    const ipEl = document.getElementById('network-ip');
    const connEl = document.getElementById('network-conn');

    // Network status
    if (statusEl) {
      statusEl.textContent = navigator.onLine ? 'Online' : 'Offline';
    }

    // Connection type
    if (connEl) {
      if (navigator.connection && navigator.connection.effectiveType) {
        connEl.textContent = navigator.connection.effectiveType.toUpperCase();
      } else {
        connEl.textContent = 'Unknown';
      }
    }

    // IP Address
    if (ipEl && navigator.onLine) {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipEl.textContent = data.ip;
      } catch {
        ipEl.textContent = 'Unavailable';
      }
    }

    // Ping test
    if (pingEl && navigator.onLine) {
      try {
        const start = Date.now();
        await fetch('https://1.1.1.1/cdn-cgi/trace', { 
          cache: 'no-store', 
          mode: 'no-cors' 
        });
        const ping = Date.now() - start;
        pingEl.textContent = `${ping}ms`;
      } catch {
        pingEl.textContent = 'Timeout';
      }
    }
  }
}

// ==========================================================================
// MODAL SYSTEM
// ==========================================================================

function showModal(title, bodyHTML, options = {}) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalOk = document.getElementById('modal-ok');
  const modalCancel = document.getElementById('modal-cancel');
  const modalError = document.getElementById('modal-error');

  if (!modal) return;

  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalOk.textContent = options.okText || 'OK';
  modalCancel.textContent = options.cancelText || 'Cancel';
  modalError.textContent = '';

  modal.style.display = 'flex';

  return new Promise((resolve) => {
    const cleanup = () => {
      modal.style.display = 'none';
      modalOk.onclick = null;
      modalCancel.onclick = null;
    };

    modalOk.onclick = () => {
      if (options.validate && !options.validate()) {
        return;
      }
      cleanup();
      resolve(true);
    };

    modalCancel.onclick = () => {
      cleanup();
      resolve(false);
    };

    // Close on backdrop click
    modal.onclick = (e) => {
      if (e.target === modal) {
        cleanup();
        resolve(false);
      }
    };
  });
}

function showConfirmationModal(title, message, onConfirm) {
  showModal(title, `<p>${message}</p>`, {
    okText: 'Confirm',
    cancelText: 'Cancel'
  }).then((confirmed) => {
    if (confirmed && onConfirm) {
      onConfirm();
    }
  });
}

// ==========================================================================
// KEYBOARD SHORTCUTS
// ==========================================================================

document.addEventListener('keydown', (e) => {
  // Ctrl+O: Open file
  if (e.ctrlKey && e.key === 'o') {
    e.preventDefault();
    const fileInput = document.getElementById('excelFile');
    if (fileInput) fileInput.click();
  }

  // Ctrl+Enter: Send message
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    const sendButton = document.getElementById('sendButton');
    if (sendButton && !sendButton.disabled) {
      sendButton.click();
    }
  }

  // Escape: Close modal
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal');
    if (modal && modal.style.display === 'flex') {
      modal.style.display = 'none';
    }
  }
});
// ==========================================================================// ==========================================================================
// ==========================================================================
// ==========================================================================
// TOTAL MESSAGES COUNTER SYSTEM (MAIN APP ONLY)
// ==========================================================================

// Initialize total messages counter (only in main app)
function initializeTotalMessagesCounter() {
  // Only show in main app page
  const mainAppPage = document.getElementById('main-app-page');
  if (!mainAppPage || mainAppPage.style.display === 'none') {
    return;
  }
  
  // Remove existing counter first
  const existingChip = document.getElementById('total-messages-chip');
  if (existingChip) {
    existingChip.remove();
  }
  
  // Create the counter chip
  const chip = document.createElement('div');
  chip.id = 'total-messages-chip';
  chip.style.cssText = `
    position: fixed !important;
    bottom: 20px !important;
    left: 20px !important;
    z-index: 999998 !important;
    background: linear-gradient(135deg, #10b981, #059669) !important;
    color: white !important;
    padding: 12px 20px !important;
    border-radius: 30px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3) !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    transition: all 0.3s ease !important;
    cursor: pointer !important;
    user-select: none !important;
    font-family: 'Inter Tight', sans-serif !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    min-width: 140px !important;
  `;
  
  chip.innerHTML = `
    <span style="font-size: 18px;">📊</span>
    <span>Total: <span id="total-messages-count">0</span></span>
  `;
  
  // Add hover effect
  chip.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-3px) scale(1.05)';
    this.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.5)';
  });
  
  chip.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
    this.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)';
  });
  
  // Add click handler to show detailed stats
  chip.addEventListener('click', function() {
    showTotalMessagesModal();
  });
  
  document.body.appendChild(chip);
  
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

// Increment total messages sent (only count actual sent messages)
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
  // Custom modal HTML with X button
  const modalId = 'total-messages-modal';
  let modal = document.getElementById(modalId);
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px; position: relative;">
      <button id="close-total-messages-modal-btn" class="btn btn-ghost btn-sm" style="position: absolute; top: 16px; right: 16px; z-index: 10;">
        <span class="material-symbols-outlined">close</span>
      </button>
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
    </div>
  `;
  document.body.appendChild(modal);
  // Close on X click or overlay click
  const closeBtn = document.getElementById('close-total-messages-modal-btn');
  closeBtn.onclick = () => { modal.remove(); };
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
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

// ==========================================================================
// RESPONSIVE UI MANAGEMENT
// ==========================================================================

// Manage UI responsiveness and positioning
function manageResponsiveUI() {
  const chip = document.getElementById('total-messages-chip');
  const devPanel = document.getElementById('dev-panel');
  
  // Adjust positioning based on screen size
  function adjustPositioning() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Adjust counter chip position
    if (chip) {
      if (screenWidth < 768) {
        // Mobile: move to top-left, smaller size
        chip.style.bottom = 'auto';
        chip.style.top = '15px';
        chip.style.left = '15px';
        chip.style.padding = '8px 12px';
        chip.style.fontSize = '12px';
        chip.style.borderRadius = '20px';
      } else if (screenWidth < 1024) {
        // Tablet: adjust position
        chip.style.bottom = '15px';
        chip.style.top = 'auto';
        chip.style.left = '15px';
        chip.style.padding = '10px 16px';
        chip.style.fontSize = '13px';
      } else {
        // Desktop: original position
        chip.style.bottom = '20px';
        chip.style.top = 'auto';
        chip.style.left = '20px';
        chip.style.padding = '12px 20px';
        chip.style.fontSize = '14px';
      }
    }
    
    // Adjust developer panel position
    if (devPanel) {
      if (screenWidth < 768) {
        // Mobile: full width at bottom
        devPanel.style.bottom = '10px';
        devPanel.style.right = '10px';
        devPanel.style.left = '10px';
        devPanel.style.width = 'calc(100% - 20px)';
        devPanel.style.minWidth = 'auto';
      } else {
        // Desktop/Tablet: original position
        devPanel.style.bottom = '20px';
        devPanel.style.right = '20px';
        devPanel.style.left = 'auto';
        devPanel.style.width = 'auto';
        devPanel.style.minWidth = '280px';
      }
    }
  }
  
  // Initial adjustment
  adjustPositioning();
  
  // Listen for window resize
  window.addEventListener('resize', adjustPositioning);
}

// ==========================================================================
// PAGE VISIBILITY MANAGEMENT
// ==========================================================================

// Show/hide counter based on current page
function manageCounterVisibility() {
  const chip = document.getElementById('total-messages-chip');
  const mainAppPage = document.getElementById('main-app-page');
  
  if (chip) {
    if (mainAppPage && mainAppPage.style.display !== 'none') {
      chip.style.display = 'flex';
    } else {
      chip.style.display = 'none';
    }
  }
}

// Monitor page changes
function initializePageMonitoring() {
  // Check visibility every second
  setInterval(() => {
    manageCounterVisibility();
  }, 1000);
  
  // Also check when DOM changes
  const observer = new MutationObserver(() => {
    manageCounterVisibility();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
  });
}

// ==========================================================================
// ENHANCED DEVELOPER UI WITH RESPONSIVE DESIGN
// ==========================================================================

// Developer authentication and Sentry test functionality
let isDeveloperAuthenticated = false;

// Check for developer authentication on page load
function checkDeveloperAuth() {
  const devAuth = localStorage.getItem('beesoft_dev_auth');
  if (devAuth) {
    try {
      const authData = JSON.parse(atob(devAuth));
      const now = Date.now();
      // Check if auth is valid and not expired (24 hours)
      if (authData.username === 'ekthar' && authData.timestamp && (now - authData.timestamp) < 86400000) {
        isDeveloperAuthenticated = true;
        showDeveloperTools();
      }
    } catch (e) {
      // Invalid auth data, remove it
      localStorage.removeItem('beesoft_dev_auth');
    }
  }
}

// Enhanced responsive developer UI
function showDeveloperTools() {
  if (!isDeveloperAuthenticated) return;
  
  // Remove any existing panel first
  const existingPanel = document.getElementById('dev-panel');
  if (existingPanel) existingPanel.remove();
  
  // Create futuristic developer panel
  const devPanel = document.createElement('div');
  devPanel.id = 'dev-panel';
  devPanel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background: #1e1e1e;
    color: #b6ffb6;
    padding: 0;
    border-radius: 10px;
    border: 1.5px solid #222;
    box-shadow: 0 8px 32px rgba(0,0,0,0.45);
    font-family: 'ntype82', 'Courier New', monospace;
    font-size: 13px;
    min-width: 340px;
    max-width: 95vw;
    overflow: hidden;
  `;
  
  devPanel.innerHTML = `
    <div style="
      background: #23272b;
      height: 32px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      border-bottom: 1px solid #222;
      position: relative;
    ">
      <span style="display: flex; gap: 7px; align-items: center;">
        <span style="width: 12px; height: 12px; background: #ff5f56; border-radius: 50%; display: inline-block; border: 1px solid #d4d4d4; box-shadow: 0 1px 2px #0002;"></span>
        <span style="width: 12px; height: 12px; background: #ffbd2e; border-radius: 50%; display: inline-block; border: 1px solid #d4d4d4; box-shadow: 0 1px 2px #0002;"></span>
        <span style="width: 12px; height: 12px; background: #27c93f; border-radius: 50%; display: inline-block; border: 1px solid #d4d4d4; box-shadow: 0 1px 2px #0002;"></span>
      </span>
      <span style="flex:1;text-align:center;font-family:'ntype82','Courier New',monospace;font-size:1em;color:#b6ffb6;letter-spacing:0.5px;user-select:none;">Terminal — EKTHAR DEV CONSOLE</span>
    </div>
    <div style="
      font-family: 'ntype82', 'Courier New', monospace;
      font-weight: 600;
      margin-bottom: 0;
      text-align: left;
      font-size: 1.08em;
      color: #b6ffb6;
      background: #181c20;
      padding: 18px 18px 10px 18px;
      border-radius: 0;
      border-left: none;
      letter-spacing: 0.5px;
      box-shadow: none;
      display: flex;
      align-items: center;
      gap: 10px;
    ">
      <span style='color:#00ff00;font-weight:bold;font-size:1.1em;'>ekthar@beesoft</span>
      <span style='color:#b6ffb6;font-size:1.1em;'>~ %</span>
      <span style='font-family:inherit;'>EKTHAR DEV CONSOLE <span style='color:#00ff00;'>⚡</span></span>
    </div>
    <div style="
      background: #23272b;
      border: none;
      border-radius: 0 0 8px 8px;
      padding: 12px 18px 16px 18px;
      margin-bottom: 0;
      font-size: 11.5px;
      text-align: left;
      color: #b6ffb6;
      font-family: 'ntype82', 'Courier New', monospace;
      box-shadow: none;
    ">
      <div>🔐 AUTHENTICATED SESSION</div>
      <div style="margin-top: 4px; opacity: 0.7;">Access Level: DEVELOPER</div>
    </div>
    
    <button id="test-sentry-btn" style="
      width: 100%;
      background: linear-gradient(45deg, #ff0080, #ff4040, #ff8000);
      background-size: 200% 100%;
      animation: buttonGlow 2s ease-in-out infinite alternate;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 10px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(255, 0, 128, 0.4);
    ">🐛 SENTRY TEST</button>
    
    <button id="activate-software-btn" style="
      width: 100%;
      background: linear-gradient(45deg, #00ff80, #00ffff);
      background-size: 200% 100%;
      animation: buttonGlow 2s ease-in-out infinite alternate;
      color: black;
      border: none;
      padding: 12px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 10px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(0, 255, 128, 0.4);
    ">🔓 ACTIVATE SOFTWARE</button>
    
    <button id="reset-admin-password-btn" style="
      width: 100%;
      background: linear-gradient(45deg, #ffff00, #ff8000);
      background-size: 200% 100%;
      animation: buttonGlow 2s ease-in-out infinite alternate;
      color: black;
      border: none;
      padding: 12px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 15px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(255, 255, 0, 0.4);
    ">🔑 RESET ADMIN PWD</button>
    
    <button id="dev-logout-btn" style="
      width: 100%;
      background: linear-gradient(45deg, #666, #999);
      color: white;
      border: none;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    ">🚪 LOGOUT</button>
    
    <style>
      @keyframes devPanelGlow {
        0% { box-shadow: 0 20px 40px rgba(0, 255, 255, 0.2), 0 0 0 1px rgba(0, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
        100% { box-shadow: 0 20px 40px rgba(255, 0, 255, 0.3), 0 0 0 1px rgba(255, 0, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
      }
      
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes buttonGlow {
        0% { background-position: 0% 50%; transform: scale(1); }
        100% { background-position: 100% 50%; transform: scale(1.02); }
      }
    </style>
  `;
  
  document.body.appendChild(devPanel);
  
  // Add button event listeners
  setupDeveloperButtonHandlers(devPanel);
  
  // Apply responsive positioning
  manageResponsiveUI();
}

// Setup all developer button handlers
function setupDeveloperButtonHandlers(devPanel) {
  // Sentry test button
  const testBtn = devPanel.querySelector('#test-sentry-btn');
  if (testBtn) {
    testBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) scale(1.05)';
      this.style.boxShadow = '0 8px 25px rgba(255, 0, 128, 0.6)';
    });
    testBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 4px 15px rgba(255, 0, 128, 0.4)';
    });
    testBtn.addEventListener('click', handleSentryTest);
  }
  
  // Activate software button
  const activateBtn = devPanel.querySelector('#activate-software-btn');
  if (activateBtn) {
    activateBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) scale(1.05)';
      this.style.boxShadow = '0 8px 25px rgba(0, 255, 128, 0.6)';
    });
    activateBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 4px 15px rgba(0, 255, 128, 0.4)';
    });
    activateBtn.addEventListener('click', handleSoftwareActivation);
  }
  
  // Reset admin password button
  const resetBtn = devPanel.querySelector('#reset-admin-password-btn');
  if (resetBtn) {
    resetBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) scale(1.05)';
      this.style.boxShadow = '0 8px 25px rgba(255, 255, 0, 0.6)';
    });
    resetBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 4px 15px rgba(255, 255, 0, 0.4)';
    });
    resetBtn.addEventListener('click', handleAdminPasswordReset);
  }
  
  // Logout button
  const logoutBtn = devPanel.querySelector('#dev-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('beesoft_dev_auth');
      isDeveloperAuthenticated = false;
      devPanel.remove();
      if (window.notifications) {
        window.notifications.info('Developer session ended');
      }
    });
  }
}

// Handle Sentry test
async function handleSentryTest() {
  const testBtn = document.getElementById('test-sentry-btn');
  if (!testBtn) return;
  
  try {
    testBtn.disabled = true;
    testBtn.innerHTML = '⏳ TESTING...';
    
    if (window.electronAPI && window.electronAPI.testSentryError) {
      const result = await window.electronAPI.testSentryError();
      
      if (result.success) {
        if (window.notifications) {
          window.notifications.success('Test error sent to Sentry successfully!');
        }
        if (window.logger) {
          window.logger.success('Sentry test completed - Check your Sentry dashboard');
        }
        console.log('✅ Sentry test successful!');
      } else {
        if (window.notifications) {
          window.notifications.error('Failed to send test error to Sentry');
        }
        if (window.logger) {
          window.logger.error('Sentry test failed: ' + result.message);
        }
        console.error('❌ Sentry test failed:', result.message);
      }
    } else {
      if (window.notifications) {
        window.notifications.error('Sentry test not available in this environment');
      }
      console.error('❌ Sentry test API not available');
    }
  } catch (error) {
    if (window.notifications) {
      window.notifications.error('Error testing Sentry: ' + error.message);
    }
    console.error('❌ Sentry test error:', error.message);
  } finally {
    setTimeout(() => {
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.innerHTML = '🐛 SENTRY TEST';
      }
    }, 2000);
  }
}

// Handle software activation
function handleSoftwareActivation() {
  if (typeof showConfirmationModal === 'function') {
    showConfirmationModal(
      '🔓 Activate Software',
      'Are you sure you want to permanently activate this software? This will remove all trial restrictions.',
      () => {
        // Utility functions for encryption
        function encrypt(str) { 
          return btoa(unescape(encodeURIComponent(str))); 
        }
        
        function setTrialData(obj) {
          localStorage.setItem('beesoft_trial', encrypt(JSON.stringify(obj)));
        }
        
        // Activate the software
        setTrialData({ start: Date.now(), days: 9999, activated: true });
        
        if (window.notifications) {
          window.notifications.success('🎉 Software activated permanently! Reloading...');
        }
        
        setTimeout(() => location.reload(), 2000);
      }
    );
  }
}

// Handle admin password reset
function handleAdminPasswordReset() {
  if (typeof showConfirmationModal === 'function') {
    showConfirmationModal(
      '🔑 Reset Admin Password',
      'Are you sure you want to reset the admin password to the default? This will set it back to "beesoft@2025".',
      () => {
        // Utility functions for encryption
        function encrypt(str) { 
          return btoa(unescape(encodeURIComponent(str))); 
        }
        
        // Reset admin password to default
        const defaultAdmin = { username: 'admin', password: 'beesoft@2025' };
        localStorage.setItem('beesoft_admin', encrypt(JSON.stringify(defaultAdmin)));
        
        if (window.notifications) {
          window.notifications.success('🔑 Admin password reset to default: beesoft@2025');
        }
        
        if (window.logger) {
          window.logger.info('Admin password reset by developer');
        }
      }
    );
  }
}

// Developer login functionality
function showDeveloperLogin() {
  const loginHTML = `
    <div style="text-align: center;">
      <h3 style="color: #00ff00; margin-bottom: 20px;">🔧 Developer Access</h3>
      <div style="margin-bottom: 15px;">
        <input id="dev-username" type="text" placeholder="Username" style="
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 10px;
        " />
      </div>
      <div style="margin-bottom: 20px;">
        <input id="dev-password" type="password" placeholder="Password" style="
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        " />
      </div>
      <div id="dev-login-error" style="color: #ff6b6b; font-size: 12px; margin-bottom: 10px; display: none;"></div>
    </div>
  `;

  if (typeof showModal === 'function') {
    showModal('Developer Login', loginHTML, {
      okText: 'Login',
      cancelText: 'Cancel',
      validate: () => {
        const username = document.getElementById('dev-username').value.trim();
        const password = document.getElementById('dev-password').value.trim();
        const errorEl = document.getElementById('dev-login-error');
        
        if (!username || !password) {
          errorEl.textContent = 'Please enter both username and password.';
          errorEl.style.display = 'block';
          return false;
        }
        
        if (username === 'ekthar' && password === 'Ekthar@8302') {
          // Store authentication with timestamp
          const authData = {
            username: 'ekthar',
            timestamp: Date.now()
          };
          localStorage.setItem('beesoft_dev_auth', btoa(JSON.stringify(authData)));
          isDeveloperAuthenticated = true;
          
          if (window.notifications) {
            window.notifications.success('Developer access granted');
          }
          
          setTimeout(() => {
            showDeveloperTools();
          }, 500);
          
          return true;
        } else {
          errorEl.textContent = 'Invalid developer credentials.';
          errorEl.style.display = 'block';
          return false;
        }
      }
    });
  }
}

// Add keyboard shortcut for developer login (Ctrl+Shift+E)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
    e.preventDefault();
    if (!isDeveloperAuthenticated) {
      showDeveloperLogin();
    } else {
      // If already authenticated, toggle developer panel
      const devPanel = document.getElementById('dev-panel');
      if (devPanel) {
        devPanel.style.display = devPanel.style.display === 'none' ? 'block' : 'none';
      }
    }
  }
});

// Enhanced admin login for ekthar
function enhanceAdminLogin() {
  const adminAuthBtn = document.getElementById('admin-auth-btn');
  if (adminAuthBtn) {
    adminAuthBtn.addEventListener('click', () => {
      const username = document.getElementById('admin-username').value.trim();
      const password = document.getElementById('admin-password').value.trim();
      const errorEl = document.getElementById('admin-login-error');

      if (!username || !password) {
        if (errorEl) errorEl.textContent = 'Please enter both username and password.';
        return;
      }

      // Check for developer credentials first
      if (username === 'ekthar' && password === 'Ekthar@8302') {
        // Grant developer access
        const authData = {
          username: 'ekthar',
          timestamp: Date.now()
        };
        localStorage.setItem('beesoft_dev_auth', btoa(JSON.stringify(authData)));
        isDeveloperAuthenticated = true;
        
        if (window.notifications) {
          window.notifications.success('Developer access granted! Redirecting...');
        }
        
        // Redirect to main app
        setTimeout(() => {
          const pages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
          pages.forEach(id => {
            const page = document.getElementById(id);
            if (page) page.style.display = 'none';
          });
          
          const mainPage = document.getElementById('main-app-page');
          if (mainPage) {
            mainPage.style.display = 'flex';
            showDeveloperTools();
          }
        }, 1000);
        
        return;
      }

      // Check regular admin credentials
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

      let admin = getAdminData();
      if (!admin) {
        admin = { username: 'admin', password: 'beesoft@2025' };
      }

      if (admin.username === username && admin.password === password) {
        if (typeof showAdminModal === 'function') {
          showAdminModal((obj) => {
            localStorage.setItem('beesoft_trial', btoa(unescape(encodeURIComponent(JSON.stringify(obj)))));
          });
        }
      } else {
        if (errorEl) errorEl.textContent = 'Invalid admin credentials.';
      }
    });
  }
}

// Initialize everything when DOM is ready
setTimeout(() => {
  checkDeveloperAuth();
  enhanceAdminLogin();
  initializePageMonitoring();
  manageResponsiveUI();
  
  // Initialize counter only when in main app
  const mainAppPage = document.getElementById('main-app-page');
  if (mainAppPage && mainAppPage.style.display !== 'none') {
    initializeTotalMessagesCounter();
  }
}, 500);

// === Activation & Trial System Integration ===
const API_URL = 'https://beesoft-one.vercel.app/api/devices';

function getOrCreateDeviceId() {
  let id = localStorage.getItem('beesoft_device_id');
  if (!id) {
    id = 'bs-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    localStorage.setItem('beesoft_device_id', id);
  }
  return id;
}

async function registerDeviceIfNeeded(machineId) {
  // Try to POST to register the device; ignore errors if already exists
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId })
    });
  } catch (e) {
    // Ignore errors (device may already exist)
  }
}

async function checkActivationStatus() {
  const machineId = getOrCreateDeviceId();
  await registerDeviceIfNeeded(machineId);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId })
    });
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    if (data.canUse) {
      document.getElementById('main-app-page').style.display = 'flex';
      document.getElementById('trial-lock-page').style.display = 'none';
      const statusAlert = document.getElementById('status-alert');
      if (statusAlert) {
        if (data.activated) {
          statusAlert.textContent = 'Application is permanently activated.';
        } else {
          const daysLeft = Math.ceil((new Date(data.trialEnd) - Date.now()) / (1000*60*60*24));
          statusAlert.textContent = `Trial active. ${daysLeft} days left.`;
        }
      }
    } else {
      document.getElementById('main-app-page').style.display = 'none';
      document.getElementById('trial-lock-page').style.display = 'flex';
      const trialInfo = document.getElementById('trial-info');
      if (trialInfo) {
        if (data.isTrialExpired) {
          trialInfo.textContent = 'Trial expired. Please contact admin to activate.';
        } else {
          trialInfo.textContent = 'This software is not activated. Please contact admin.';
        }
      }
    }
  } catch (e) {
    document.getElementById('main-app-page').style.display = 'none';
    document.getElementById('trial-lock-page').style.display = 'flex';
    const trialInfo = document.getElementById('trial-info');
    if (trialInfo) trialInfo.textContent = 'Unable to verify activation. Please check your internet connection or contact support.';
  }
}

if (window.adminAuthBtn) {
  adminAuthBtn.addEventListener('click', async () => {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    const errorEl = document.getElementById('admin-login-error');
    if (!username || !password) {
      if (errorEl) errorEl.textContent = 'Please enter both admin email and password.';
      return;
    }
    const machineId = getOrCreateDeviceId();
    await registerDeviceIfNeeded(machineId);
    try {
      const response = await fetch(API_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineId, adminEmail: username, adminPassword: password })
      });
      if (!response.ok) {
        const msg = await response.text();
        if (errorEl) errorEl.textContent = msg || 'Activation failed.';
        return;
      }
      await checkActivationStatus();
      if (errorEl) errorEl.textContent = '';
    } catch (e) {
      if (errorEl) errorEl.textContent = 'Network error. Please check your internet connection or contact support.';
    }
  });
}

window.addEventListener('DOMContentLoaded', checkActivationStatus);
