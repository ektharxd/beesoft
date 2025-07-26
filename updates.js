// Updates functionality for Beesoft
class UpdatesManager {
    constructor() {
        this.currentVersion = null;
        this.latestRelease = null;
        this.isChecking = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadCurrentVersion();
    }

    initializeElements() {
        // Modal elements
        this.modal = document.getElementById('updates-modal');
        this.openBtn = document.getElementById('open-updates-modal-btn');
        this.closeBtn = document.getElementById('close-updates-modal-btn');
        this.checkBtn = document.getElementById('check-updates-btn');
        this.githubBtn = document.getElementById('open-github-btn');

        // Content elements
        this.currentVersionEl = document.getElementById('updates-current-version');
        this.statusEl = document.getElementById('updates-status');
        this.statusContainer = document.getElementById('updates-status-container');
        this.availableContainer = document.getElementById('updates-available-container');
    }

    bindEvents() {
        // Modal controls
        this.openBtn?.addEventListener('click', () => this.openModal());
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Action buttons
        this.checkBtn?.addEventListener('click', () => this.checkForUpdates());
        this.githubBtn?.addEventListener('click', () => this.openGitHubRepo());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.style.display !== 'none') {
                this.closeModal();
            }
        });
    }

    async loadCurrentVersion() {
        try {
            const result = await window.electronAPI.getAppVersion();
            if (result.success) {
                this.currentVersion = result.version;
                this.currentVersionEl.textContent = `v${result.version}`;
                this.statusEl.textContent = 'Ready to check for updates';
            } else {
                this.currentVersionEl.textContent = 'v1.0.0';
                this.statusEl.textContent = 'Version detection failed';
            }
        } catch (error) {
            console.error('Failed to load current version:', error);
            this.currentVersionEl.textContent = 'v1.0.0';
            this.statusEl.textContent = 'Version detection failed';
        }
    }

    openModal() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Auto-check for updates when modal opens
        if (!this.isChecking) {
            setTimeout(() => this.checkForUpdates(), 500);
        }
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    async checkForUpdates() {
        if (this.isChecking) return;
        
        this.isChecking = true;
        this.setCheckingState(true);
        
        try {
            console.log('Checking for updates...');
            const result = await window.electronAPI.checkForUpdates();
            
            if (result.success) {
                this.handleUpdateResult(result);
            } else {
                this.showError('Failed to check for updates: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Update check failed:', error);
            this.showError('Update check failed: ' + error.message);
        } finally {
            this.isChecking = false;
            this.setCheckingState(false);
        }
    }

    setCheckingState(checking) {
        if (checking) {
            this.checkBtn.disabled = true;
            this.checkBtn.innerHTML = `
                <span class="material-symbols-outlined">refresh</span>
                Checking...
            `;
            this.statusEl.textContent = 'Checking for updates...';
            this.statusContainer.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid var(--color-primary); border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
                    <p style="margin: 12px 0 0 0; color: var(--text-tertiary);">Fetching latest release information...</p>
                </div>
            `;
        } else {
            this.checkBtn.disabled = false;
            this.checkBtn.innerHTML = `
                <span class="material-symbols-outlined">refresh</span>
                Check Updates
            `;
        }
    }

    handleUpdateResult(result) {
        if (result.updateAvailable && result.releaseInfo) {
            this.showUpdateAvailable(result.releaseInfo);
        } else {
            this.showNoUpdatesAvailable();
        }
    }

    showUpdateAvailable(releaseInfo) {
        this.statusEl.textContent = `Update available: v${releaseInfo.latestVersion}`;
        this.statusContainer.innerHTML = '';
        
        // Show update available section
        this.availableContainer.style.display = 'block';
        this.availableContainer.innerHTML = this.createUpdateAvailableHTML(releaseInfo);
        
        // Bind download buttons
        this.bindDownloadButtons(releaseInfo);
    }

    showNoUpdatesAvailable() {
        this.statusEl.textContent = 'You are running the latest version!';
        this.statusContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; background: var(--surface-secondary); border-radius: 8px; border: 2px solid var(--color-success);">
                <div style="font-size: 3rem; margin-bottom: 12px;">✅</div>
                <h4 style="margin: 0 0 8px 0; color: var(--color-success);">Up to Date</h4>
                <p style="margin: 0; color: var(--text-tertiary);">You are running the latest version of Beesoft.</p>
            </div>
        `;
        this.availableContainer.style.display = 'none';
    }

    createUpdateAvailableHTML(releaseInfo) {
        const releaseDate = new Date(releaseInfo.publishedAt).toLocaleDateString();
        const isPrerelease = releaseInfo.prerelease;
        
        return `
            <div style="background: var(--surface-secondary); border-radius: 8px; border: 2px solid var(--color-primary); padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div style="font-size: 2.5rem;">🎉</div>
                    <div>
                        <h4 style="margin: 0; color: var(--color-primary);">Update Available!</h4>
                        <p style="margin: 4px 0 0 0; color: var(--text-tertiary);">
                            Version ${releaseInfo.latestVersion} • Released ${releaseDate}
                            ${isPrerelease ? ' • <span style="color: var(--color-warning);">Pre-release</span>' : ''}
                        </p>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <h5 style="margin: 0 0 8px 0;">📋 What's New:</h5>
                    <div style="background: var(--surface-primary); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; max-height: 200px; overflow-y: auto;">
                        ${this.formatReleaseNotes(releaseInfo.body)}
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px; align-items: center;">
                    <button id="download-update-btn" class="btn btn-primary">
                        <span class="material-symbols-outlined">download</span>
                        Download Update
                    </button>
                    <button id="view-release-btn" class="btn btn-outline">
                        <span class="material-symbols-outlined">open_in_new</span>
                        View Release
                    </button>
                    <div style="margin-left: auto; font-size: 0.85rem; color: var(--text-tertiary);">
                        ${this.formatFileSize(releaseInfo.assets[0]?.size || 0)}
                    </div>
                </div>
            </div>
        `;
    }

    formatReleaseNotes(body) {
        if (!body) return '<p>No release notes available.</p>';
        
        // Convert markdown to HTML
        return body
            .split('\n')
            .map(line => {
                line = line.trim();
                if (line.startsWith('# ')) return `<h3>${line.replace('# ', '')}</h3>`;
                if (line.startsWith('## ')) return `<h4>${line.replace('## ', '')}</h4>`;
                if (line.startsWith('### ')) return `<h5>${line.replace('### ', '')}</h5>`;
                if (line.startsWith('- ') || line.startsWith('* ')) return `<li>${line.replace(/^[*-] /, '')}</li>`;
                if (line.length === 0) return '<br>';
                return `<p>${line}</p>`;
            })
            .join('')
            .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
            .replace(/<\/ul><ul>/g, '');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    bindDownloadButtons(releaseInfo) {
        const downloadBtn = document.getElementById('download-update-btn');
        const viewReleaseBtn = document.getElementById('view-release-btn');
        
        downloadBtn?.addEventListener('click', () => this.downloadUpdate(releaseInfo));
        viewReleaseBtn?.addEventListener('click', () => this.viewRelease());
    }

    async downloadUpdate(releaseInfo) {
        try {
            // Get the appropriate asset for the current platform
            const platformResult = await window.electronAPI.getPlatformAsset(releaseInfo.assets);
            const asset = platformResult.success ? platformResult.asset : releaseInfo.assets[0];
            
            if (!asset) {
                this.showError('No download available for your platform');
                return;
            }
            
            console.log('Starting download for asset:', asset.name);
            
            const result = await window.electronAPI.downloadUpdate(asset);
            
            if (result.success) {
                this.showSuccess('Download started in your browser. Please install the update and restart Beesoft.');
            } else {
                this.showError('Download failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Download failed:', error);
            this.showError('Download failed: ' + error.message);
        }
    }

    async viewRelease() {
        try {
            const result = await window.electronAPI.openReleasePage();
            if (!result.success) {
                this.showError('Failed to open release page: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to open release page:', error);
            this.showError('Failed to open release page: ' + error.message);
        }
    }

    async openGitHubRepo() {
        try {
            // Open the GitHub repository
            const result = await window.electronAPI.openReleasePage();
            if (!result.success) {
                this.showError('Failed to open GitHub repository: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to open GitHub repository:', error);
            this.showError('Failed to open GitHub repository: ' + error.message);
        }
    }

    showError(message) {
        this.statusEl.textContent = 'Update check failed';
        this.statusContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; background: var(--surface-secondary); border-radius: 8px; border: 2px solid var(--color-error);">
                <div style="font-size: 3rem; margin-bottom: 12px;">❌</div>
                <h4 style="margin: 0 0 8px 0; color: var(--color-error);">Update Check Failed</h4>
                <p style="margin: 0; color: var(--text-tertiary);">${message}</p>
                <button onclick="updatesManager.checkForUpdates()" class="btn btn-outline btn-sm" style="margin-top: 12px;">
                    <span class="material-symbols-outlined">refresh</span>
                    Try Again
                </button>
            </div>
        `;
        this.availableContainer.style.display = 'none';
    }

    showSuccess(message) {
        this.statusContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; background: var(--surface-secondary); border-radius: 8px; border: 2px solid var(--color-success);">
                <div style="font-size: 3rem; margin-bottom: 12px;">🎉</div>
                <h4 style="margin: 0 0 8px 0; color: var(--color-success);">Download Started</h4>
                <p style="margin: 0; color: var(--text-tertiary);">${message}</p>
            </div>
        `;
    }
}

// Initialize updates manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.updatesManager = new UpdatesManager();
});

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);