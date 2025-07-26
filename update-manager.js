// Simple update manager with fallback for development
const https = require('https');
const { shell } = require('electron');

class UpdateManager {
    constructor() {
        this.githubRepo = 'ektharxd/beesoft';
        this.currentVersion = null;
        this.latestRelease = null;
        this.updateCheckInProgress = false;
    }

    getCurrentVersion() {
        if (!this.currentVersion) {
            try {
                const packageJson = require('./package.json');
                this.currentVersion = packageJson.version || '1.0.0';
            } catch (error) {
                this.currentVersion = '1.0.0';
            }
        }
        return this.currentVersion;
    }

    async checkForUpdates() {
        if (this.updateCheckInProgress) {
            return { success: false, error: 'Update check already in progress' };
        }

        this.updateCheckInProgress = true;

        try {
            console.log('[UpdateManager] Checking for updates...');
            
            // For now, simulate a check since the repository might not have releases yet
            const currentVersion = this.getCurrentVersion();
            
            // Try to fetch from GitHub, but provide fallback
            try {
                const releaseData = await this.fetchLatestRelease();
                
                if (releaseData) {
                    this.latestRelease = releaseData;
                    const latestVersion = releaseData.tag_name.replace('v', '');
                    const updateAvailable = this.compareVersions(currentVersion, latestVersion);
                    
                    return {
                        success: true,
                        updateAvailable,
                        currentVersion,
                        latestVersion,
                        releaseInfo: updateAvailable ? {
                            name: releaseData.name,
                            tagName: releaseData.tag_name,
                            publishedAt: releaseData.published_at,
                            body: releaseData.body,
                            htmlUrl: releaseData.html_url,
                            assets: releaseData.assets.map(asset => ({
                                name: asset.name,
                                size: asset.size,
                                downloadUrl: asset.browser_download_url,
                                contentType: asset.content_type
                            })),
                            prerelease: releaseData.prerelease,
                            draft: releaseData.draft
                        } : null
                    };
                }
            } catch (error) {
                console.log('[UpdateManager] GitHub fetch failed, using fallback:', error.message);
            }
            
            // Fallback response when no releases are available
            return {
                success: true,
                updateAvailable: false,
                currentVersion,
                latestVersion: currentVersion,
                message: 'You are running the latest version! (No releases found on GitHub yet)'
            };

        } catch (error) {
            console.error('[UpdateManager] Error checking for updates:', error.message);
            return {
                success: false,
                error: error.message,
                updateAvailable: false,
                currentVersion: this.getCurrentVersion()
            };
        } finally {
            this.updateCheckInProgress = false;
        }
    }

    async fetchLatestRelease() {
        return new Promise((resolve, reject) => {
            const headers = {
                'User-Agent': 'Beesoft-UpdateManager/1.0.0',
                'Accept': 'application/vnd.github.v3+json'
            };

            const options = {
                hostname: 'api.github.com',
                port: 443,
                path: `/repos/${this.githubRepo}/releases/latest`,
                method: 'GET',
                headers: headers
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            const releaseData = JSON.parse(data);
                            console.log('[UpdateManager] Successfully fetched release data');
                            resolve(releaseData);
                        } else if (res.statusCode === 404) {
                            // Repository exists but no releases
                            console.log('[UpdateManager] Repository found but no releases available');
                            resolve(null);
                        } else {
                            reject(new Error(`GitHub API error: ${res.statusCode}`));
                        }
                    } catch (parseError) {
                        reject(new Error(`Failed to parse GitHub response: ${parseError.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Network error: ${error.message}`));
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    compareVersions(current, latest) {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);
        
        const maxLength = Math.max(currentParts.length, latestParts.length);
        while (currentParts.length < maxLength) currentParts.push(0);
        while (latestParts.length < maxLength) latestParts.push(0);
        
        for (let i = 0; i < maxLength; i++) {
            if (latestParts[i] > currentParts[i]) return true;
            if (latestParts[i] < currentParts[i]) return false;
        }
        
        return false;
    }

    async downloadUpdate(asset) {
        try {
            console.log(`[UpdateManager] Opening download for: ${asset.name}`);
            await shell.openExternal(asset.downloadUrl);
            return { success: true, message: 'Download started in browser' };
        } catch (error) {
            console.error('[UpdateManager] Download error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async openReleasePage() {
        try {
            const url = this.latestRelease ? 
                this.latestRelease.html_url : 
                `https://github.com/${this.githubRepo}/releases`;
            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            console.error('[UpdateManager] Error opening release page:', error.message);
            return { success: false, error: error.message };
        }
    }

    formatReleaseNotes(body) {
        if (!body) return ['No release notes available.'];
        
        const lines = body.split('\n').map(line => {
            line = line.trim();
            if (line.startsWith('# ')) return line.replace('# ', '🎉 ');
            if (line.startsWith('## ')) return line.replace('## ', '📋 ');
            if (line.startsWith('### ')) return line.replace('### ', '🔸 ');
            if (line.startsWith('- ')) return line.replace('- ', '• ');
            if (line.startsWith('* ')) return line.replace('* ', '• ');
            line = line.replace(/\*\*(.*?)\*\*/g, '$1');
            line = line.replace(/__(.*?)__/g, '$1');
            return line;
        }).filter(line => line.length > 0);
        
        return lines.length > 0 ? lines : ['No release notes available.'];
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getAssetForPlatform(assets, platform = process.platform) {
        const platformMap = {
            'win32': ['.exe', 'windows', 'win'],
            'darwin': ['.dmg', '.pkg', 'mac', 'darwin'],
            'linux': ['.appimage', '.deb', '.rpm', 'linux']
        };

        const platformKeywords = platformMap[platform] || [];
        
        for (const keyword of platformKeywords) {
            const asset = assets.find(a => 
                a.name.toLowerCase().includes(keyword.toLowerCase())
            );
            if (asset) return asset;
        }
        
        return assets[0] || null;
    }
}

module.exports = UpdateManager;