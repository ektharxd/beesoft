import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'beesoft';

const ADMIN_API_KEY = 'Ekthar@8302';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check admin API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await client.connect();
        const db = client.db(dbName);
        const devices = db.collection('devices');
        const heartbeats = db.collection('heartbeats');

        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Get all devices with their latest heartbeat data
        const allDevices = await devices.find().toArray();
        
        // Get recent heartbeats for analysis
        const recentHeartbeats = await heartbeats.find({
            timestamp: { $gte: oneHourAgo }
        }).sort({ timestamp: -1 }).toArray();

        // Process device data with enhanced information
        const processedDevices = allDevices.map(device => {
            const isOnline = new Date(device.lastSeen) > oneMinuteAgo;
            const isRecentlyActive = new Date(device.lastSeen) > fiveMinutesAgo;
            
            // Get device heartbeats from the last hour
            const deviceHeartbeats = recentHeartbeats.filter(hb => hb.machineId === device.machineId);
            const latestHeartbeat = deviceHeartbeats[0];

            // Calculate uptime and performance metrics
            let uptimeSeconds = 0;
            let memoryUsagePercent = 0;
            let cpuInfo = {};
            let networkInfo = {};
            let performanceMetrics = {};

            if (latestHeartbeat && latestHeartbeat.systemInfo) {
                const sysInfo = latestHeartbeat.systemInfo;
                uptimeSeconds = sysInfo.uptime || 0;
                memoryUsagePercent = sysInfo.memoryUsagePercent || 0;
                
                cpuInfo = {
                    count: sysInfo.cpuCount || 0,
                    model: sysInfo.cpuModel || 'Unknown',
                    speed: sysInfo.cpuSpeed || 0,
                    loadAverage: sysInfo.loadAverage || [0, 0, 0]
                };

                networkInfo = {
                    primaryIP: sysInfo.primaryIP || 'unknown',
                    macAddress: sysInfo.macAddress || 'unknown'
                };

                if (latestHeartbeat.performance) {
                    performanceMetrics = {
                        processUptime: latestHeartbeat.performance.processUptime || 0,
                        memoryUsage: latestHeartbeat.performance.memoryUsage || {},
                        cpuUsage: latestHeartbeat.performance.cpuUsage || {}
                    };
                }
            }

            // Format memory sizes
            const formatBytes = (bytes) => {
                if (!bytes) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };

            // Format uptime
            const formatUptime = (seconds) => {
                const days = Math.floor(seconds / 86400);
                const hours = Math.floor((seconds % 86400) / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                
                if (days > 0) return `${days}d ${hours}h ${minutes}m`;
                if (hours > 0) return `${hours}h ${minutes}m`;
                return `${minutes}m`;
            };

            return {
                // Basic device info
                machineId: device.machineId,
                username: device.username || 'Unknown',
                email: device.email || 'No email',
                name: device.name || 'Unknown Device',
                hostname: device.hostname || 'unknown',
                
                // Status information
                isOnline,
                isRecentlyActive,
                lastSeen: device.lastSeen,
                whatsappConnected: device.whatsappConnected || false,
                sessionActive: device.sessionActive || false,
                
                // System information
                platform: device.platform || 'unknown',
                version: device.version || 'unknown',
                ip: device.ip || networkInfo.primaryIP || 'unknown',
                
                // Enhanced system details
                systemInfo: latestHeartbeat?.systemInfo ? {
                    arch: latestHeartbeat.systemInfo.arch,
                    release: latestHeartbeat.systemInfo.release,
                    type: latestHeartbeat.systemInfo.type,
                    uptime: formatUptime(uptimeSeconds),
                    uptimeSeconds: uptimeSeconds,
                    
                    // Memory information
                    totalMemory: formatBytes(latestHeartbeat.systemInfo.totalMemory),
                    freeMemory: formatBytes(latestHeartbeat.systemInfo.freeMemory),
                    usedMemory: formatBytes(latestHeartbeat.systemInfo.usedMemory),
                    memoryUsagePercent: memoryUsagePercent,
                    
                    // CPU information
                    cpu: cpuInfo,
                    
                    // Network information
                    network: networkInfo,
                    
                    // User information
                    userInfo: latestHeartbeat.systemInfo.userInfo,
                    
                    // Software versions
                    nodeVersion: latestHeartbeat.systemInfo.nodeVersion,
                    electronVersion: latestHeartbeat.systemInfo.electronVersion,
                    chromeVersion: latestHeartbeat.systemInfo.chromeVersion
                } : null,
                
                // Application information
                appInfo: latestHeartbeat?.appInfo || null,
                
                // Performance metrics
                performance: performanceMetrics,
                
                // Heartbeat statistics
                heartbeatStats: {
                    totalHeartbeats: deviceHeartbeats.length,
                    lastHeartbeat: latestHeartbeat?.timestamp || null,
                    heartbeatFrequency: deviceHeartbeats.length > 1 ? 
                        Math.round((deviceHeartbeats[0].timestamp - deviceHeartbeats[deviceHeartbeats.length - 1].timestamp) / deviceHeartbeats.length / 1000) : 0
                },
                
                // Registration info
                createdAt: device.createdAt,
                subscription: device.subscription || null
            };
        });

        // Sort devices by online status and last seen
        processedDevices.sort((a, b) => {
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;
            return new Date(b.lastSeen) - new Date(a.lastSeen);
        });

        // Calculate summary statistics
        const onlineDevices = processedDevices.filter(d => d.isOnline);
        const offlineDevices = processedDevices.filter(d => !d.isOnline);
        const whatsappConnectedDevices = processedDevices.filter(d => d.whatsappConnected);
        const activeSessionDevices = processedDevices.filter(d => d.sessionActive);

        // System overview
        const systemOverview = {
            totalDevices: processedDevices.length,
            onlineDevices: onlineDevices.length,
            offlineDevices: offlineDevices.length,
            whatsappConnected: whatsappConnectedDevices.length,
            activeSessions: activeSessionDevices.length,
            totalHeartbeats: recentHeartbeats.length,
            
            // Platform distribution
            platformDistribution: processedDevices.reduce((acc, device) => {
                const platform = device.platform || 'unknown';
                acc[platform] = (acc[platform] || 0) + 1;
                return acc;
            }, {}),
            
            // Average uptime of online devices
            averageUptime: onlineDevices.length > 0 ? 
                Math.round(onlineDevices.reduce((sum, device) => 
                    sum + (device.systemInfo?.uptimeSeconds || 0), 0) / onlineDevices.length) : 0
        };

        return res.json({
            success: true,
            timestamp: new Date().toISOString(),
            overview: systemOverview,
            devices: processedDevices,
            onlineDevices: onlineDevices,
            offlineDevices: offlineDevices
        });

    } catch (error) {
        console.error('Heartbeat monitor error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    } finally {
        await client.close();
    }
}