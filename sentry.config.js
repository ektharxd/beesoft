// Sentry Configuration for Beesoft WhatsApp Automation
module.exports = {
    // Your Sentry DSN
    dsn: "https://2d868c4a667e70f6b07da800f0923a76@o4509730213265408.ingest.us.sentry.io/4509730219229184",
    
    // Environment configuration
    environment: process.env.NODE_ENV || 'production',
    
    // Release version (automatically pulled from package.json)
    release: require('./package.json').version,
    
    // Sample rate for performance monitoring (0.0 to 1.0)
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
    // Tags to apply to all events
    defaultTags: {
        app: 'beesoft',
        platform: process.platform,
        arch: process.arch,
    },
    
    // Context to include with all events
    defaultContext: {
        app_info: {
            name: 'Beesoft',
            description: 'Smart WhatsApp Automation & Dashboard',
            author: 'Ekthar',
        }
    },
    
    // Error filtering configuration
    beforeSend: (event) => {
        // Filter out sensitive information
        if (event.exception) {
            const error = event.exception.values[0];
            if (error && error.stacktrace && error.stacktrace.frames) {
                error.stacktrace.frames.forEach(frame => {
                    // Mark node_modules frames as not in-app
                    if (frame.filename && frame.filename.includes('node_modules')) {
                        frame.in_app = false;
                    }
                    
                    // Remove sensitive file paths
                    if (frame.filename) {
                        frame.filename = frame.filename.replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]');
                    }
                });
            }
        }
        
        // Filter out certain error types in production
        if (process.env.NODE_ENV === 'production') {
            // Skip network errors that are expected
            if (event.exception && event.exception.values[0]) {
                const errorMessage = event.exception.values[0].value || '';
                if (errorMessage.includes('net::ERR_NETWORK_CHANGED') ||
                    errorMessage.includes('net::ERR_INTERNET_DISCONNECTED')) {
                    return null; // Don't send these errors
                }
            }
        }
        
        return event;
    },
    
    // Integration-specific settings
    integrations: {
        mainProcess: {
            enabled: true,
            captureUnhandledRejections: true,
            captureUncaughtExceptions: true,
        },
        rendererProcess: {
            enabled: true,
            captureUnhandledRejections: true,
            captureUncaughtExceptions: true,
        },
        childProcess: {
            enabled: true,
        }
    },
    
    // Performance monitoring settings
    performance: {
        // Monitor app startup time
        markAppStart: true,
        
        // Monitor navigation performance
        markNavigationStart: true,
        
        // Custom performance marks
        customMarks: [
            'whatsapp-connection-start',
            'whatsapp-connection-ready',
            'campaign-start',
            'campaign-complete'
        ]
    },
    
    // User privacy settings
    privacy: {
        // Don't send user IP addresses
        sendDefaultPii: false,
        
        // Scrub sensitive data from breadcrumbs
        scrubBreadcrumbs: true,
        
        // Fields to scrub from events
        scrubFields: [
            'phone',
            'number',
            'phoneNumber',
            'message',
            'password',
            'token',
            'auth',
            'session'
        ]
    }
};