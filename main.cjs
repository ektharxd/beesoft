// @ts-nocheck
const Sentry = require("@sentry/electron/main");
Sentry.init({
  dsn: "https://2d868c4a667e70f6b07da800f0923a76@o4509730213265408.ingest.us.sentry.io/4509730219229184",
  debug: false, // Disable debug logging in production
});

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const https = require('https');
const { v4: uuidv4 } = require('crypto').randomUUID ? require('crypto') : { randomUUID: () => require('os').hostname() + '-' + Date.now() };

let mainWindow;
let whatsappWindow;
let waClient;
let isReady = false;
let connectionAttempts = 0;
let lastConnectionTime = 0;
let qrRetryCount = 0;
const MAX_QR_RETRIES = 5;
const CONNECTION_COOLDOWN = 15000;
const QR_TIMEOUT = 45000;

// Anti-ban configuration
const ANTI_BAN_CONFIG = {
    minDelay: 3000,
    maxDelay: 8000,
    batchSize: 20,
    batchDelay: 300000,
    dailyLimit: 500,
    hourlyLimit: 50,
    randomizeDelay: true,
    respectTyping: true,
    respectOnline: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// Message tracking for rate limiting
let messageTracker = {
    hourly: [],
    daily: [],
    lastMessageTime: 0
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: path.join(__dirname, 'public', 'Bee.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webviewTag: true, // Enable webview tag
            webSecurity: false,
            allowRunningInsecureContent: true
        }
    });

    mainWindow.setMenu(null);
    mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));
    
    // Only open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
        cleanupWhatsAppClient();
    });
}

// Global paths for data storage (works in both dev and production)
const getAppDataPath = () => {
    if (app.isPackaged) {
        // In production, use app's userData directory
        return app.getPath('userData');
    } else {
        // In development, use a folder in the project directory
        return path.join(__dirname, '.beesoft-data');
    }
};

const getAuthDataPath = () => {
    return path.join(getAppDataPath(), 'wwebjs_auth');
};

const getCacheDataPath = () => {
    return path.join(getAppDataPath(), 'wwebjs_cache');
};

// Ensure directory exists and is writable
function ensureDirectoryExists(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        // Test write access
        const testFile = path.join(dirPath, '.test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        return true;
    } catch (error) {
        console.error(`Failed to ensure directory ${dirPath}:`, error.message);
        return false;
    }
}

// Safe directory cleanup with retry mechanism
function safeRemoveDir(dirPath, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (fs.existsSync(dirPath)) {
                // First try to change permissions
                try {
                    const stats = fs.statSync(dirPath);
                    if (stats.isDirectory()) {
                        // Recursively change permissions
                        const files = fs.readdirSync(dirPath);
                        for (const file of files) {
                            const filePath = path.join(dirPath, file);
                            try {
                                fs.chmodSync(filePath, 0o666);
                            } catch (e) { /* ignore permission errors */ }
                        }
                    }
                    fs.chmodSync(dirPath, 0o666);
                } catch (e) { /* ignore permission errors */ }
                
                // Remove the directory
                fs.rmSync(dirPath, { recursive: true, force: true });
                return true;
            }
            return true;
        } catch (error) {
            if (attempt === maxRetries) {
                console.error(`Failed to remove directory ${dirPath} after ${maxRetries} attempts:`, error.message);
                return false;
            }
            // Wait before retry
            const wait = new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            wait.then(() => {});
        }
    }
    return false;
}

app.whenReady().then(() => {
    // Ensure app data directory exists
    const appDataPath = getAppDataPath();
    if (!fs.existsSync(appDataPath)) {
        fs.mkdirSync(appDataPath, { recursive: true });
    }
    
    // Set userData path for Electron
    if (!app.isPackaged) {
        app.setPath('userData', appDataPath);
    }
    
    sendToUI('log', { level: 'info', message: `📁 App data path: ${appDataPath}` });
    
    createWindow();
    
    // Initialize heartbeat system
    initializeHeartbeat();
});

app.on('window-all-closed', () => { 
    if (process.platform !== 'darwin') {
        cleanupWhatsAppClient();
        stopHeartbeat();
        app.quit(); 
    }
});

function sendToUI(type, payload) {
    if (type === 'log' && payload && payload.message) {
        console.log(`[${payload.level || 'info'}] ${payload.message}`);
    }
    if (mainWindow) {
        mainWindow.webContents.send('update', { type, ...payload });
    }
}

// Enhanced browser cache management with proper error handling
function clearBrowserCache() {
    const cacheDir = getCacheDataPath();
    
    sendToUI('log', { level: 'info', message: `🧹 Clearing cache directory: ${cacheDir}` });
    
    const success = safeRemoveDir(cacheDir);
    if (success) {
        sendToUI('log', { level: 'info', message: '✅ Cache cleanup completed' });
    } else {
        sendToUI('log', { level: 'error', message: '❌ Cache cleanup failed: Directory in use or permission denied' });
    }
    return success;
}

// Clear auth data for fresh start with proper error handling
function clearAuthData() {
    const authDir = getAuthDataPath();
    
    sendToUI('log', { level: 'info', message: `🔑 Clearing auth directory: ${authDir}` });
    
    const success = safeRemoveDir(authDir);
    if (success) {
        sendToUI('log', { level: 'info', message: '✅ Auth cleanup completed' });
    } else {
        sendToUI('log', { level: 'error', message: '❌ Auth cleanup failed: Directory in use or permission denied' });
    }
    return success;
}

// Get system Chrome path for production builds
function findSystemChrome() {
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    
    for (const chromePath of possiblePaths) {
        try {
            if (fs.existsSync(chromePath)) {
                sendToUI('log', { level: 'info', message: `🌐 Found system browser: ${chromePath}` });
                return chromePath;
            }
        } catch (error) {
            // Continue checking other paths
        }
    }
    
    sendToUI('log', { level: 'warning', message: '⚠️ No system browser found, using bundled Chromium' });
    return null;
}

// Get Puppeteer executable path for different environments
function getPuppeteerExecutablePath() {
    if (app.isPackaged) {
        // In production, try to find system Chrome first
        const systemChrome = findSystemChrome();
        if (systemChrome) {
            return systemChrome;
        }
        
        // If no system Chrome, try to extract bundled Chromium
        const puppeteerPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'puppeteer-core', '.local-chromium');
        if (fs.existsSync(puppeteerPath)) {
            const chromeDir = fs.readdirSync(puppeteerPath).find(dir => dir.startsWith('win64-'));
            if (chromeDir) {
                const chromePath = path.join(puppeteerPath, chromeDir, 'chrome-win', 'chrome.exe');
                if (fs.existsSync(chromePath)) {
                    sendToUI('log', { level: 'info', message: `🌐 Using extracted Chromium: ${chromePath}` });
                    return chromePath;
                }
            }
        }
        
        // Last resort: use system-installed Chrome
        return findSystemChrome();
    }
    
    // In development, let Puppeteer handle it
    return undefined;
}

// FIXED: Enhanced WhatsApp client initialization with bypass for browser connection
function initWhatsAppClient(bypassCooldown = false) {
    const now = Date.now();
    
    // CRITICAL FIX: Allow bypass of cooldown when browser is connected
    if (!bypassCooldown && now - lastConnectionTime < CONNECTION_COOLDOWN) {
        const waitTime = Math.ceil((CONNECTION_COOLDOWN - (now - lastConnectionTime)) / 1000);
        sendToUI('log', { level: 'warning', message: `⏳ Please wait ${waitTime} seconds before reconnecting` });
        return;
    }
    
    lastConnectionTime = now;
    connectionAttempts++;
    
    sendToUI('log', { level: 'info', message: `🔄 Initializing WhatsApp client (attempt ${connectionAttempts})` });
    
    // Clear corrupted auth data if too many failed attempts
    if (connectionAttempts > 2) {
        sendToUI('log', { level: 'warning', message: '🧹 Multiple connection attempts detected, clearing auth data...' });
        clearAuthData();
        clearBrowserCache();
    }
    
    // Get the appropriate executable path
    const executablePath = getPuppeteerExecutablePath();
    
    // Enhanced puppeteer configuration for anti-ban
    const puppeteerConfig = {
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-default-apps',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-field-trial-config',
            '--disable-back-forward-cache',
            '--disable-ipc-flooding-protection',
            `--user-agent=${ANTI_BAN_CONFIG.userAgent}`
        ],
        defaultViewport: null,
        ignoreDefaultArgs: ['--disable-extensions'],
        timeout: 60000
    };
    
    // Add executable path if we found one
    if (executablePath) {
        puppeteerConfig.executablePath = executablePath;
        sendToUI('log', { level: 'info', message: `🚀 Using browser: ${executablePath}` });
    }
    
    try {
        // Ensure directories exist and are writable
        const authDir = getAuthDataPath();
        const cacheDir = getCacheDataPath();
        
        if (!ensureDirectoryExists(authDir)) {
            throw new Error(`Cannot create or access auth directory: ${authDir}`);
        }
        
        if (!ensureDirectoryExists(cacheDir)) {
            throw new Error(`Cannot create or access cache directory: ${cacheDir}`);
        }
        
        sendToUI('log', { level: 'info', message: `📁 Auth directory: ${authDir}` });
        sendToUI('log', { level: 'info', message: `📁 Cache directory: ${cacheDir}` });
        
        // Enhanced puppeteer config with better error handling
        // Note: Cannot use userDataDir with LocalAuth, it manages its own data directory
        const enhancedPuppeteerConfig = {
            ...puppeteerConfig,
            handleSIGINT: false,
            handleSIGTERM: false,
            handleSIGHUP: false
        };
        
        waClient = new Client({
            authStrategy: new LocalAuth({
                dataPath: authDir,
                clientId: 'beesoft-client'
            }),
            puppeteer: enhancedPuppeteerConfig,
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
            }
        });

        setupWhatsAppEventHandlers();
        
        // Initialize with timeout
        const initTimeout = setTimeout(() => {
            sendToUI('log', { level: 'error', message: '⏰ WhatsApp initialization timeout' });
            restartWhatsAppClient();
        }, 120000);
        
        waClient.initialize().then(() => {
            clearTimeout(initTimeout);
            sendToUI('log', { level: 'info', message: '🚀 WhatsApp client initialization started' });
        }).catch((error) => {
            clearTimeout(initTimeout);
            sendToUI('log', { level: 'error', message: `❌ WhatsApp initialization failed: ${error.message}` });
            handleConnectionError(error);
        });
        
    } catch (error) {
        sendToUI('log', { level: 'error', message: `💥 Failed to create WhatsApp client: ${error.message}` });
        handleConnectionError(error);
    }
}

function setupWhatsAppEventHandlers() {
    let qrTimeout;
    
    waClient.on('qr', (qr) => {
        qrRetryCount++;
        console.log('[WA] QR event received');
        
        if (qrTimeout) clearTimeout(qrTimeout);
        
        qrcode.generate(qr, { small: true });
        
        sendToUI('log', { level: 'info', message: `📱 QR Code generated (attempt ${qrRetryCount}/${MAX_QR_RETRIES})` });
        sendToUI('qr', { qr, attempt: qrRetryCount });
        
        qrTimeout = setTimeout(() => {
            if (qrRetryCount >= MAX_QR_RETRIES) {
                sendToUI('log', { level: 'error', message: '❌ Maximum QR retry attempts reached. Clearing auth and restarting...' });
                clearAuthData();
                setTimeout(() => restartWhatsAppClient(), 2000);
            } else {
                sendToUI('log', { level: 'warning', message: '⏰ QR Code expired, generating new one...' });
            }
        }, QR_TIMEOUT);
    });

    waClient.on('authenticated', () => {
        sendToUI('log', { level: 'success', message: '🔐 WhatsApp authenticated successfully!' });
        qrRetryCount = 0;
        connectionAttempts = 0;
    });

    waClient.on('ready', () => {
        console.log('[WA] Client is ready');
        isReady = true;
        qrRetryCount = 0;
        connectionAttempts = 0;
        
        sendToUI('log', { level: 'success', message: '✅ WhatsApp Web client is ready!' });
        sendToUI('whatsapp-ready', { connected: true });
        
        // Initialize anti-ban features
        initializeAntiBanFeatures();
    });

    waClient.on('auth_failure', (msg) => {
        console.log('[WA] Auth failure:', msg);
        isReady = false;
        sendToUI('log', { level: 'error', message: `🔒 Authentication failed: ${msg}` });
        sendToUI('whatsapp-disconnected', { reason: 'auth_failure', message: msg });
        
        setTimeout(() => {
            clearAuthData();
            restartWhatsAppClient();
        }, 5000);
    });

    waClient.on('disconnected', (reason) => {
        console.log('[WA] Disconnected:', reason);
        isReady = false;
        sendToUI('log', { level: 'error', message: `📡 WhatsApp disconnected: ${reason}` });
        sendToUI('whatsapp-disconnected', { reason: 'disconnected', message: reason });
        
        setTimeout(() => {
            if (!isReady) {
                sendToUI('log', { level: 'info', message: '🔄 Attempting to reconnect...' });
                restartWhatsAppClient();
            }
        }, 10000);
    });

    waClient.on('change_state', (state) => {
        console.log('[WA] State changed:', state);
        sendToUI('whatsapp-state-change', { state });
        
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
            sendToUI('log', { level: 'warning', message: `⚠️ WhatsApp state: ${state}` });
            setTimeout(() => restartWhatsAppClient(), 5000);
        }
    });

    waClient.on('error', (err) => {
        console.error('[WA] Client error:', err);
        sendToUI('log', { level: 'error', message: `💥 WhatsApp error: ${err.message}` });
        sendToUI('whatsapp-error', { error: err.message });
        
        handleConnectionError(err);
    });
}

function handleConnectionError(error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('enotdir') || errorMessage.includes('not a directory')) {
        sendToUI('log', { level: 'warning', message: '🔧 Directory corruption detected, performing full cleanup...' });
        cleanupWhatsAppClient();
        clearAuthData();
        clearBrowserCache();
        setTimeout(() => restartWhatsAppClient(), 5000);
    } else if (errorMessage.includes('eperm') || errorMessage.includes('operation not permitted')) {
        sendToUI('log', { level: 'warning', message: '🔒 Permission denied, attempting cleanup and retry...' });
        cleanupWhatsAppClient();
        clearBrowserCache();
        setTimeout(() => restartWhatsAppClient(), 5000);
    } else if (errorMessage.includes('timeout') || errorMessage.includes('navigation')) {
        sendToUI('log', { level: 'warning', message: '⏰ Connection timeout, clearing cache and retrying...' });
        clearBrowserCache();
        setTimeout(() => restartWhatsAppClient(), 5000);
    } else if (errorMessage.includes('protocol error') || errorMessage.includes('target closed')) {
        sendToUI('log', { level: 'warning', message: '🔄 Browser connection lost, restarting...' });
        cleanupWhatsAppClient();
        setTimeout(() => restartWhatsAppClient(), 3000);
    } else if (errorMessage.includes('evaluation failed')) {
        sendToUI('log', { level: 'warning', message: '📜 Script evaluation failed, clearing cache...' });
        clearBrowserCache();
        setTimeout(() => restartWhatsAppClient(), 5000);
    } else if (errorMessage.includes('session closed') || errorMessage.includes('session detached')) {
        sendToUI('log', { level: 'warning', message: '🔌 Browser session lost, performing full restart...' });
        cleanupWhatsAppClient();
        setTimeout(() => restartWhatsAppClient(), 3000);
    } else {
        sendToUI('log', { level: 'error', message: `🚨 Unhandled error: ${error.message}` });
        cleanupWhatsAppClient();
        setTimeout(() => restartWhatsAppClient(), 10000);
    }
}

function restartWhatsAppClient() {
    sendToUI('log', { level: 'info', message: '🔄 Restarting WhatsApp client...' });
    
    cleanupWhatsAppClient();
    
    setTimeout(() => {
        initWhatsAppClient();
    }, 3000);
}

function cleanupWhatsAppClient() {
    if (waClient) {
        try {
            sendToUI('log', { level: 'info', message: '🧹 Cleaning up WhatsApp client...' });
            waClient.removeAllListeners();
            waClient.destroy();
            sendToUI('log', { level: 'info', message: '✅ WhatsApp client cleaned up' });
        } catch (error) {
            sendToUI('log', { level: 'warning', message: `⚠️ Cleanup warning: ${error.message}` });
        }
        waClient = null;
    }
    isReady = false;
    connectionAttempts = 0;
    qrRetryCount = 0;
}

// Anti-ban features initialization
function initializeAntiBanFeatures() {
    sendToUI('log', { level: 'info', message: '🛡️ Initializing anti-ban features...' });
    
    cleanMessageTracker();
    setInterval(cleanMessageTracker, 3600000);
    
    sendToUI('log', { level: 'success', message: '✅ Anti-ban features activated' });
}

function cleanMessageTracker() {
    const now = Date.now();
    const oneHour = 3600000;
    const oneDay = 86400000;
    
    messageTracker.hourly = messageTracker.hourly.filter(time => now - time < oneHour);
    messageTracker.daily = messageTracker.daily.filter(time => now - time < oneDay);
}

function calculateAntiBanDelay(messageCount, isFirstMessage = false) {
    if (isFirstMessage) return 0;
    
    let baseDelay = ANTI_BAN_CONFIG.minDelay;
    
    if (messageCount > 10) baseDelay += 1000;
    if (messageCount > 20) baseDelay += 2000;
    if (messageCount > 50) baseDelay += 3000;
    
    if (ANTI_BAN_CONFIG.randomizeDelay) {
        const randomFactor = 0.3;
        const randomOffset = (Math.random() - 0.5) * 2 * randomFactor * baseDelay;
        baseDelay += randomOffset;
    }
    
    baseDelay = Math.max(ANTI_BAN_CONFIG.minDelay, Math.min(ANTI_BAN_CONFIG.maxDelay, baseDelay));
    
    return Math.round(baseDelay);
}

function checkRateLimit() {
    const now = Date.now();
    
    if (messageTracker.hourly.length >= ANTI_BAN_CONFIG.hourlyLimit) {
        return { allowed: false, reason: 'hourly_limit', waitTime: 3600000 - (now - messageTracker.hourly[0]) };
    }
    
    if (messageTracker.daily.length >= ANTI_BAN_CONFIG.dailyLimit) {
        return { allowed: false, reason: 'daily_limit', waitTime: 86400000 - (now - messageTracker.daily[0]) };
    }
    
    return { allowed: true };
}

function trackMessage() {
    const now = Date.now();
    messageTracker.hourly.push(now);
    messageTracker.daily.push(now);
    messageTracker.lastMessageTime = now;
}

async function simulateTyping(chatId, message) {
    if (!ANTI_BAN_CONFIG.respectTyping || !waClient) return;
    
    try {
        const typingTime = Math.min(Math.max(message.length * 50, 1000), 5000);
        
        await waClient.sendPresenceAvailable();
        await waClient.sendPresenceTyping(chatId);
        
        await new Promise(resolve => setTimeout(resolve, typingTime));
        
        await waClient.sendPresenceAvailable();
    } catch (error) {
        console.log('Typing simulation error:', error.message);
    }
}

// Heartbeat system for live device monitoring
let deviceId = null;
let heartbeatInterval = null;
const HEARTBEAT_URL = 'https://beesoft-one.vercel.app/api/devices';
const HEARTBEAT_INTERVAL = 2 * 60 * 1000; // 2 minutes

function generateDeviceId() {
    try {
        // Try to use crypto.randomUUID if available
        if (typeof require('crypto').randomUUID === 'function') {
            return require('crypto').randomUUID();
        }
    } catch (e) {
        // Fallback to hostname + timestamp
    }
    return `${os.hostname()}-${Date.now()}`;
}

function getDeviceId() {
    if (!deviceId) {
        const deviceIdPath = path.join(getAppDataPath(), 'device-id.txt');
        try {
            if (fs.existsSync(deviceIdPath)) {
                deviceId = fs.readFileSync(deviceIdPath, 'utf8').trim();
            } else {
                deviceId = generateDeviceId();
                fs.writeFileSync(deviceIdPath, deviceId);
            }
        } catch (error) {
            console.error('Error managing device ID:', error);
            deviceId = generateDeviceId();
        }
    }
    return deviceId;
}

async function sendHeartbeat() {
    try {
        const heartbeatData = {
            machineId: getDeviceId(),
            version: require('./package.json').version || '1.0.0',
            platform: os.platform(),
            hostname: os.hostname(),
            whatsappConnected: isReady,
            sessionActive: sessionControl.isRunning
        };

        const data = JSON.stringify(heartbeatData);
        const url = new URL(HEARTBEAT_URL);
        
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'User-Agent': 'Beesoft-Desktop/1.0.0'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`[Heartbeat] Sent successfully to ${HEARTBEAT_URL}`);
                } else {
                    console.error(`[Heartbeat] Failed with status ${res.statusCode}: ${responseData}`);
                }
            });
        });

        req.on('error', (error) => {
            console.error('[Heartbeat] Error:', error.message);
        });

        req.write(data);
        req.end();

    } catch (error) {
        console.error('[Heartbeat] Exception:', error.message);
    }
}

function initializeHeartbeat() {
    console.log(`[Heartbeat] Initializing with device ID: ${getDeviceId()}`);
    
    // Send initial heartbeat
    sendHeartbeat();
    
    // Set up periodic heartbeats
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    
    heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    
    console.log(`[Heartbeat] Scheduled every ${HEARTBEAT_INTERVAL / 1000} seconds`);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        console.log('[Heartbeat] Stopped');
    }
}

// IPC Handlers
ipcMain.handle('select-image', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
        ]
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
});

// Function to create WhatsApp Web browser window with FIXED Chrome compatibility
function createWhatsAppWindow() {
    if (whatsappWindow) {
        whatsappWindow.focus();
        return;
    }

    const modernUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    whatsappWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'WhatsApp Web - Beesoft',
        icon: path.join(__dirname, 'public', 'Bee.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            allowRunningInsecureContent: true,
            experimentalFeatures: true,
            enableRemoteModule: false,
            userAgent: modernUserAgent
        },
        show: false
    });

    whatsappWindow.webContents.session.setUserAgent(modernUserAgent);
    
    whatsappWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = modernUserAgent;
        details.requestHeaders['Accept-Language'] = 'en-US,en;q=0.9';
        details.requestHeaders['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8';
        callback({ requestHeaders: details.requestHeaders });
    });

    loadWhatsAppWebWithRetry();

    function loadWhatsAppWebWithRetry(retryCount = 0) {
        const maxRetries = 3;
        
        sendToUI('log', { level: 'info', message: `🌐 Loading WhatsApp Web (attempt ${retryCount + 1}/${maxRetries + 1})` });
        
        whatsappWindow.loadURL('https://web.whatsapp.com', {
            userAgent: modernUserAgent,
            extraHeaders: 'Accept-Language: en-US,en;q=0.9\r\n'
        }).catch((error) => {
            sendToUI('log', { level: 'error', message: `❌ Failed to load WhatsApp Web: ${error.message}` });
            
            if (retryCount < maxRetries) {
                setTimeout(() => {
                    loadWhatsAppWebWithRetry(retryCount + 1);
                }, 3000);
            } else {
                sendToUI('log', { level: 'error', message: '❌ Failed to load WhatsApp Web after multiple attempts' });
            }
        });
    }

    whatsappWindow.once('ready-to-show', () => {
        whatsappWindow.show();
        sendToUI('log', { level: 'info', message: '🌐 WhatsApp Web opened in browser window' });
        sendToUI('log', { level: 'info', message: '📱 Please scan the QR code with your phone to connect' });
    });

    whatsappWindow.on('closed', () => {
        whatsappWindow = null;
        isReady = false;
        sendToUI('log', { level: 'info', message: '🌐 WhatsApp Web window closed' });
        sendToUI('whatsapp-disconnected', { reason: 'window_closed', message: 'WhatsApp Web window was closed' });
    });

    whatsappWindow.webContents.on('did-finish-load', () => {
        setTimeout(() => {
            checkWhatsAppStatus();
        }, 2000);
    });

    whatsappWindow.webContents.on('did-navigate', (event, url) => {
        sendToUI('log', { level: 'info', message: `🔄 Navigated to: ${url}` });
        
        if (url.includes('web.whatsapp.com')) {
            setTimeout(() => {
                checkWhatsAppStatus();
            }, 3000);
        }
    });

    whatsappWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        sendToUI('log', { level: 'error', message: `❌ Page failed to load: ${errorDescription} (${errorCode})` });
        
        if (errorCode === -106 || errorCode === -105) {
            setTimeout(() => {
                loadWhatsAppWebWithRetry();
            }, 5000);
        }
    });

    // FIXED status checking function - removed invalid CSS selector
    function checkWhatsAppStatus() {
        if (!whatsappWindow || whatsappWindow.isDestroyed()) {
            return;
        }

        whatsappWindow.webContents.executeJavaScript(`
            (function() {
                try {
                    const bodyText = document.body ? (document.body.textContent || document.body.innerText || '') : '';
                    
                    const chromeError = document.querySelector('div[data-testid="unsupported-browser"]') ||
                                       bodyText.includes('WhatsApp works with Google Chrome') ||
                                       bodyText.includes('update Chrome') ||
                                       bodyText.includes('UPDATE GOOGLE CHROME');
                    
                    if (chromeError) {
                        return { status: 'chrome_error', message: 'Chrome compatibility issue detected' };
                    }

                    const isLoggedIn = document.querySelector('[data-testid="chat-list"]') !== null ||
                                      document.querySelector('div[role="main"]') !== null ||
                                      document.querySelector('[data-testid="conversation-panel-wrapper"]') !== null ||
                                      document.querySelector('[data-testid="side"]') !== null ||
                                      document.querySelector('#side') !== null ||
                                      document.querySelector('.two') !== null ||
                                      bodyText.includes('Search or start new chat');
                    
                    if (isLoggedIn) {
                        return { status: 'logged_in', message: 'Successfully logged in' };
                    }

                    const hasQR = document.querySelector('[data-testid="qr-canvas"]') !== null ||
                                 document.querySelector('canvas') !== null ||
                                 document.querySelector('[data-ref="qr"]') !== null ||
                                 document.querySelector('div[data-testid="qr-container"]') !== null ||
                                 bodyText.includes('Use WhatsApp on your phone to scan this QR code') ||
                                 bodyText.includes('Scan this QR code');
                    
                    if (hasQR) {
                        return { status: 'qr_ready', message: 'QR code is ready for scanning' };
                    }

                    const isLoading = document.querySelector('[data-testid="startup-progress-bar"]') !== null ||
                                     bodyText.includes('Loading') ||
                                     bodyText.includes('Connecting') ||
                                     bodyText.includes('Initializing') ||
                                     document.readyState !== 'complete';
                    
                    if (isLoading) {
                        return { status: 'loading', message: 'WhatsApp Web is loading' };
                    }

                    const hasError = bodyText.includes('Error') ||
                                    bodyText.includes('Something went wrong') ||
                                    bodyText.includes('Reload') ||
                                    bodyText.includes('Try again');
                    
                    if (hasError) {
                        return { status: 'error', message: 'WhatsApp Web encountered an error' };
                    }

                    return { status: 'unknown', message: 'Unknown WhatsApp Web state' };
                } catch (error) {
                    return { status: 'script_error', message: 'Error checking status: ' + error.message };
                }
            })();
        `).then((result) => {
            handleWhatsAppStatus(result);
        }).catch((error) => {
            sendToUI('log', { level: 'error', message: `❌ Error checking WhatsApp status: ${error.message}` });
        });
    }

    function handleWhatsAppStatus(result) {
        if (!result) return;

        switch (result.status) {
            case 'chrome_error':
                sendToUI('log', { level: 'error', message: '❌ Chrome compatibility error detected' });
                sendToUI('log', { level: 'info', message: '🔧 Attempting to fix Chrome compatibility...' });
                
                whatsappWindow.webContents.executeJavaScript(`
                    Object.defineProperty(navigator, 'userAgent', {
                        get: function() { return '${modernUserAgent}'; }
                    });
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                `).catch(() => {
                    sendToUI('log', { level: 'error', message: '❌ Failed to fix Chrome compatibility' });
                });
                break;

            case 'logged_in':
                if (!isReady) {
                    isReady = true;
                    connectionAttempts = 0;
                    qrRetryCount = 0;
                    
                    sendToUI('log', { level: 'success', message: '✅ WhatsApp Web connected successfully!' });
                    sendToUI('whatsapp-ready', { connected: true });
                    
                    // CRITICAL FIX: Force initialize WhatsApp-Web.js client with cooldown bypass
                    if (!waClient) {
                        sendToUI('log', { level: 'info', message: '🔄 Force initializing WhatsApp client for message sending...' });
                        // Use bypass flag to ignore cooldown when browser is connected
                        initWhatsAppClient(true);
                    }
                    
                    initializeAntiBanFeatures();
                }
                break;

            case 'qr_ready':
                sendToUI('log', { level: 'info', message: '📱 QR code is ready for scanning' });
                break;

            case 'loading':
                sendToUI('log', { level: 'info', message: '⏳ WhatsApp Web is loading...' });
                setTimeout(() => {
                    checkWhatsAppStatus();
                }, 5000);
                break;

            case 'error':
                sendToUI('log', { level: 'error', message: '❌ WhatsApp Web error detected, attempting reload...' });
                setTimeout(() => {
                    loadWhatsAppWebWithRetry();
                }, 3000);
                break;

            default:
                sendToUI('log', { level: 'info', message: `ℹ️ WhatsApp status: ${result.message}` });
                break;
        }
    }

    const statusCheckInterval = setInterval(() => {
        if (whatsappWindow && !whatsappWindow.isDestroyed()) {
            checkWhatsAppStatus();
        } else {
            clearInterval(statusCheckInterval);
        }
    }, 10000);

    return whatsappWindow;
}

ipcMain.handle('connect-whatsapp', async () => {
    if (isReady && waClient) {
        return { success: true, message: 'WhatsApp already connected.' };
    }
    
    try {
        sendToUI('log', { level: 'info', message: '🔄 Initializing WhatsApp connection...' });
        
        // Use only the WhatsApp-Web.js client approach (no browser window)
        // This prevents dual connections and provides better integration
        initWhatsAppClient();
        
        return { success: true, message: 'WhatsApp client started. Please scan the QR code when it appears.' };
    } catch (error) {
        sendToUI('log', { level: 'error', message: `❌ Failed to initialize WhatsApp client: ${error.message}` });
        return { success: false, message: 'WhatsApp connection failed: ' + error.message };
    }
});

ipcMain.handle('connect-whatsapp-fallback', async () => {
    sendToUI('log', { level: 'info', message: '🔄 Using fallback WhatsApp connection method...' });
    
    if (whatsappWindow && !whatsappWindow.isDestroyed()) {
        whatsappWindow.close();
        whatsappWindow = null;
    }
    
    try {
        initWhatsAppClient(true); // Use bypass flag
        return { success: true, message: 'Fallback WhatsApp client started. Please scan the QR code in the terminal or wait for it to appear in the app.' };
    } catch (error) {
        sendToUI('log', { level: 'error', message: `❌ Fallback connection failed: ${error.message}` });
        return { success: false, message: 'Fallback connection failed.' };
    }
});

// FIXED: Add manual client initialization handler
ipcMain.handle('force-init-client', async () => {
    sendToUI('log', { level: 'info', message: '🔄 Force initializing WhatsApp client...' });
    
    try {
        // Clean up existing client
        cleanupWhatsAppClient();
        
        // Wait a moment then initialize with bypass
        setTimeout(() => {
            initWhatsAppClient(true);
        }, 1000);
        
        return { success: true, message: 'WhatsApp client initialization forced.' };
    } catch (error) {
        sendToUI('log', { level: 'error', message: `❌ Force initialization failed: ${error.message}` });
        return { success: false, message: 'Force initialization failed.' };
    }
});

ipcMain.handle('restart-whatsapp', async () => {
    sendToUI('log', { level: 'info', message: '🔄 Manual WhatsApp restart requested' });
    restartWhatsAppClient();
    return { success: true, message: 'WhatsApp client restarting...' };
});

ipcMain.handle('clear-cache', async () => {
    sendToUI('log', { level: 'info', message: '🧹 Manual cache clear requested' });
    const success = clearBrowserCache();
    return { success, message: success ? 'Cache cleared successfully' : 'Failed to clear cache' };
});

ipcMain.handle('clear-auth', async () => {
    sendToUI('log', { level: 'warning', message: '🔑 Manual auth clear requested' });
    const success = clearAuthData();
    if (success) {
        setTimeout(() => restartWhatsAppClient(), 2000);
    }
    return { success, message: success ? 'Auth data cleared, restarting...' : 'Failed to clear auth data' };
});

// Session Control State with anti-ban features
let sessionControl = {
    paused: false,
    stopped: false,
    currentSession: null,
    isRunning: false,
    batchCount: 0,
    messageCount: 0
};

ipcMain.handle('pause-session', async () => {
    if (!sessionControl.isRunning) {
        return { success: false, message: 'No active session to pause.' };
    }
    
    sessionControl.paused = true;
    sendToUI('log', { level: 'info', message: '⏸️ Campaign paused by user.' });
    sendToUI('campaign-paused', { paused: true });
    return { success: true };
});

ipcMain.handle('continue-session', async () => {
    if (!sessionControl.isRunning) {
        return { success: false, message: 'No active session to resume.' };
    }
    
    sessionControl.paused = false;
    sendToUI('log', { level: 'info', message: '▶️ Campaign resumed by user.' });
    sendToUI('campaign-resumed', { paused: false });
    
    if (sessionControl.currentSession && typeof sessionControl.currentSession.resume === 'function') {
        sessionControl.currentSession.resume();
    }
    return { success: true };
});

ipcMain.handle('stop-session', async () => {
    if (!sessionControl.isRunning) {
        return { success: false, message: 'No active session to stop.' };
    }
    
    sessionControl.stopped = true;
    sendToUI('log', { level: 'warning', message: '⏹️ Campaign stop requested by user.' });
    sendToUI('campaign-stop-requested', { stopped: true });
    
    if (sessionControl.currentSession && typeof sessionControl.currentSession.resume === 'function') {
        sessionControl.currentSession.resume();
    }
    return { success: true };
});

// FIXED: Enhanced session start with better client validation
ipcMain.handle('start-session', async (event, data) => {
    // Check if session is already running
    if (sessionControl.isRunning) {
        sendToUI('log', { level: 'error', message: 'A campaign is already running. Please stop it first.' });
        return { success: false, message: 'Campaign already running.' };
    }

    // CRITICAL FIX: Better client validation and auto-initialization
    if (!waClient) {
        sendToUI('log', { level: 'warning', message: '⚠️ WhatsApp client not initialized. Attempting to initialize...' });
        
        // Try to initialize the client
        try {
            initWhatsAppClient(true); // Use bypass flag
            
            // Wait for initialization
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds
            
            while (!waClient && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                sendToUI('log', { level: 'info', message: `⏳ Waiting for client initialization... (${attempts}/${maxAttempts})` });
            }
            
            if (!waClient) {
                sendToUI('log', { level: 'error', message: '❌ Failed to initialize WhatsApp client within timeout.' });
                sendToUI('campaign-error', { error: 'WhatsApp client initialization timeout' });
                return { success: false, message: 'WhatsApp client initialization timeout.' };
            }
            
        } catch (initError) {
            sendToUI('log', { level: 'error', message: `❌ Failed to initialize WhatsApp client: ${initError.message}` });
            sendToUI('campaign-error', { error: 'WhatsApp client initialization failed' });
            return { success: false, message: 'WhatsApp client initialization failed.' };
        }
    }

    if (!isReady) {
        sendToUI('log', { level: 'error', message: 'WhatsApp Web is not connected. Please connect first.' });
        sendToUI('campaign-error', { error: 'WhatsApp not connected' });
        return { success: false, message: 'WhatsApp not connected.' };
    }

    // Check rate limits
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
        const waitMinutes = Math.ceil(rateLimitCheck.waitTime / 60000);
        const message = `Rate limit exceeded (${rateLimitCheck.reason}). Please wait ${waitMinutes} minutes.`;
        sendToUI('log', { level: 'error', message });
        sendToUI('campaign-error', { error: message });
        return { success: false, message };
    }

    // Reset and initialize session control state
    sessionControl.paused = false;
    sessionControl.stopped = false;
    sessionControl.currentSession = null;
    sessionControl.isRunning = true;
    sessionControl.batchCount = 0;
    sessionControl.messageCount = 0;
    
    const { numbers, message, imagePath } = data;
    
    // Validate input data
    if (!numbers || numbers.length === 0) {
        sessionControl.isRunning = false;
        sendToUI('log', { level: 'error', message: 'No phone numbers provided.' });
        sendToUI('campaign-error', { error: 'No phone numbers provided' });
        return { success: false, message: 'No phone numbers provided.' };
    }
    
    if (!message || message.trim() === '') {
        sessionControl.isRunning = false;
        sendToUI('log', { level: 'error', message: 'No message content provided.' });
        sendToUI('campaign-error', { error: 'No message content provided' });
        return { success: false, message: 'No message content provided.' };
    }

    // Check if numbers exceed daily limit
    if (numbers.length > ANTI_BAN_CONFIG.dailyLimit) {
        sessionControl.isRunning = false;
        const message = `Too many numbers (${numbers.length}). Daily limit is ${ANTI_BAN_CONFIG.dailyLimit}.`;
        sendToUI('log', { level: 'error', message });
        sendToUI('campaign-error', { error: message });
        return { success: false, message };
    }

    // Send campaign started event
    sendToUI('campaign-started', { 
        totalNumbers: numbers.length, 
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        hasImage: !!imagePath,
        antiBanEnabled: true,
        batchSize: ANTI_BAN_CONFIG.batchSize
    });
    
    sendToUI('log', { level: 'info', message: `🚀 Anti-ban campaign started for ${numbers.length} numbers` });
    sendToUI('log', { level: 'info', message: `🛡️ Batch size: ${ANTI_BAN_CONFIG.batchSize}, Delays: ${ANTI_BAN_CONFIG.minDelay}-${ANTI_BAN_CONFIG.maxDelay}ms` });

    let successCount = 0, errorCount = 0, errorNumbers = [];
    let processedCount = 0;

    // Handle image if provided
    let media = null;
    let absImagePath = imagePath ? path.resolve(imagePath) : null;
    if (absImagePath && fs.existsSync(absImagePath)) {
        sendToUI('log', { level: 'info', message: `📎 Image file found: ${path.basename(absImagePath)}` });
        try {
            media = MessageMedia.fromFilePath(absImagePath);
            sendToUI('log', { level: 'info', message: `✅ Image loaded successfully.` });
        } catch (e) {
            sendToUI('log', { level: 'error', message: `❌ Failed to load image: ${e.message}` });
            sendToUI('campaign-error', { error: 'Failed to load image', details: e.message });
        }
    } else if (imagePath) {
        sendToUI('log', { level: 'error', message: `❌ Image file not found: ${absImagePath}` });
        sendToUI('campaign-error', { error: 'Image file not found', details: absImagePath });
    }

    // Pause/Continue/Stop Logic
    let pausedPromiseResolve;
    function waitIfPaused() {
        if (sessionControl.stopped) {
            sendToUI('log', { level: 'warning', message: '⏹️ Campaign stopped by user.' });
            return Promise.resolve(false);
        }
        if (!sessionControl.paused) return Promise.resolve(true);
        
        sendToUI('log', { level: 'info', message: '⏸️ Campaign paused. Waiting for resume...' });
        return new Promise(resolve => {
            pausedPromiseResolve = () => {
                sendToUI('log', { level: 'info', message: '▶️ Campaign resumed.' });
                resolve(true);
            };
        });
    }
    
    sessionControl.currentSession = {
        resume: () => {
            if (pausedPromiseResolve) {
                pausedPromiseResolve();
                pausedPromiseResolve = null;
            }
        }
    };

    // Main processing loop with anti-ban features
    try {
        for (let i = 0; i < numbers.length; i++) {
            // Check pause/stop before processing
            const canProceed = await waitIfPaused();
            if (!canProceed || sessionControl.stopped) {
                sendToUI('log', { level: 'warning', message: `⏹️ Campaign stopped at ${i}/${numbers.length} numbers.` });
                break;
            }

            // CRITICAL FIX: Double-check waClient before each message
            if (!waClient) {
                sendToUI('log', { level: 'error', message: '❌ WhatsApp client became null during campaign. Stopping.' });
                break;
            }

            // Check if we need a batch break
            if (i > 0 && i % ANTI_BAN_CONFIG.batchSize === 0) {
                sessionControl.batchCount++;
                sendToUI('log', { level: 'info', message: `📦 Batch ${sessionControl.batchCount} completed. Taking ${ANTI_BAN_CONFIG.batchDelay / 60000} minute break...` });
                
                await new Promise(resolve => setTimeout(resolve, ANTI_BAN_CONFIG.batchDelay));
                
                if (sessionControl.stopped) {
                    sendToUI('log', { level: 'warning', message: `⏹️ Campaign stopped during batch break.` });
                    break;
                }
            }

            // Calculate anti-ban delay
            const delay = calculateAntiBanDelay(sessionControl.messageCount, i === 0);
            
            if (delay > 0) {
                sendToUI('log', { level: 'info', message: `⏳ Anti-ban delay: ${(delay / 1000).toFixed(1)}s` });
                await new Promise(resolve => setTimeout(resolve, delay));
                
                if (sessionControl.stopped) {
                    sendToUI('log', { level: 'warning', message: `⏹️ Campaign stopped during delay.` });
                    break;
                }
            }

            const numberRaw = numbers[i];
            processedCount = i + 1;
            sessionControl.messageCount++;
            
            // Format phone number
            let number = String(numberRaw).replace(/\D/g, '');
            if (number.length === 10) number = '91' + number;
            const whatsappNumber = number + '@c.us';
            
            sendToUI('log', { level: 'info', message: `📱 Processing ${processedCount}/${numbers.length}: ${numberRaw}` });
            
            // Send progress update
            sendToUI('campaign-progress', { 
                current: processedCount, 
                total: numbers.length, 
                number: numberRaw,
                successCount, 
                errorCount,
                progress: Math.round((processedCount / numbers.length) * 100),
                batchCount: sessionControl.batchCount,
                messageCount: sessionControl.messageCount
            });

            try {
                // CRITICAL FIX: Final check before sending
                if (!waClient) {
                    throw new Error('WhatsApp client is null');
                }

                // Simulate typing if enabled
                await simulateTyping(whatsappNumber, message);
                
                if (media) {
                    sendToUI('log', { level: 'info', message: `📤 Sending image with caption to ${numberRaw}` });
                    await waClient.sendMessage(whatsappNumber, media, { caption: message });
                } else {
                    sendToUI('log', { level: 'info', message: `📤 Sending text message to ${numberRaw}` });
                    await waClient.sendMessage(whatsappNumber, message);
                }
                
                // Track successful message
                trackMessage();
                
                successCount++;
                sendToUI('log', { level: 'success', message: `✅ Message sent successfully to ${numberRaw}` });
                sendToUI('campaign-success', { 
                    number: numberRaw, 
                    successCount, 
                    errorCount,
                    progress: Math.round((processedCount / numbers.length) * 100)
                });
                
            } catch (err) {
                errorCount++;
                errorNumbers.push(numberRaw);
                sendToUI('log', { level: 'error', message: `❌ Failed to send to ${numberRaw}: ${err.message}` });
                sendToUI('campaign-failure', { 
                    number: numberRaw, 
                    error: err.message, 
                    successCount, 
                    errorCount,
                    progress: Math.round((processedCount / numbers.length) * 100)
                });
                
                // Check if error indicates rate limiting or ban
                if (err.message.includes('rate') || err.message.includes('limit') || err.message.includes('spam')) {
                    sendToUI('log', { level: 'warning', message: '🚨 Possible rate limiting detected. Increasing delays...' });
                    ANTI_BAN_CONFIG.minDelay = Math.min(ANTI_BAN_CONFIG.minDelay * 1.5, 15000);
                    ANTI_BAN_CONFIG.maxDelay = Math.min(ANTI_BAN_CONFIG.maxDelay * 1.5, 30000);
                }
            }
        }
    } catch (criticalError) {
        sendToUI('log', { level: 'error', message: `💥 Critical error during campaign: ${criticalError.message}` });
        sendToUI('campaign-error', { 
            error: 'Critical campaign error', 
            details: criticalError.message,
            successCount,
            errorCount,
            processedCount
        });
    }

    // Campaign completion
    const completionReason = sessionControl.stopped ? 'stopped' : 'completed';
    const totalProcessed = processedCount;
    
    sendToUI('log', { level: 'info', message: `🏁 Anti-ban campaign ${completionReason}. Processed: ${totalProcessed}/${numbers.length}, Success: ${successCount}, Failed: ${errorCount}` });
    
    sendToUI('campaign-finished', { 
        reason: completionReason,
        summary: `Campaign ${completionReason}. Success: ${successCount}, Failed: ${errorCount}, Total: ${totalProcessed}/${numbers.length}`,
        stats: {
            total: numbers.length,
            processed: totalProcessed,
            success: successCount,
            failed: errorCount,
            skipped: numbers.length - totalProcessed,
            batchCount: sessionControl.batchCount,
            messageCount: sessionControl.messageCount
        },
        errorNumbers: errorNumbers,
        antiBanStats: {
            averageDelay: (ANTI_BAN_CONFIG.minDelay + ANTI_BAN_CONFIG.maxDelay) / 2,
            batchesCompleted: sessionControl.batchCount,
            messagesRemaining: ANTI_BAN_CONFIG.dailyLimit - messageTracker.daily.length
        }
    });

    // Reset session state
    sessionControl.currentSession = null;
    sessionControl.paused = false;
    sessionControl.stopped = false;
    sessionControl.isRunning = false;
    sessionControl.batchCount = 0;
    sessionControl.messageCount = 0;
    
    return { 
        success: true, 
        message: `Anti-ban campaign ${completionReason}.`,
        stats: {
            total: numbers.length,
            processed: totalProcessed,
            success: successCount,
            failed: errorCount
        }
    };
});

// Get session status
ipcMain.handle('get-session-status', async () => {
    return {
        isRunning: sessionControl.isRunning,
        paused: sessionControl.paused,
        stopped: sessionControl.stopped,
        messageCount: sessionControl.messageCount,
        batchCount: sessionControl.batchCount,
        rateLimits: {
            hourly: `${messageTracker.hourly.length}/${ANTI_BAN_CONFIG.hourlyLimit}`,
            daily: `${messageTracker.daily.length}/${ANTI_BAN_CONFIG.dailyLimit}`
        }
    };
});

// Get anti-ban status
ipcMain.handle('get-antiban-status', async () => {
    cleanMessageTracker();
    return {
        config: ANTI_BAN_CONFIG,
        tracker: {
            hourlyCount: messageTracker.hourly.length,
            dailyCount: messageTracker.daily.length,
            lastMessageTime: messageTracker.lastMessageTime
        },
        limits: {
            hourlyRemaining: ANTI_BAN_CONFIG.hourlyLimit - messageTracker.hourly.length,
            dailyRemaining: ANTI_BAN_CONFIG.dailyLimit - messageTracker.daily.length
        }
    };
});