// Test Sentry error reporting
const testSentryFunction = `
// Test Sentry error reporting
ipcMain.handle('test-sentry-error', async () => {
    try {
        sendToUI('log', { level: 'info', message: '🧪 Testing Sentry error reporting...' });
        
        // Create a fake error for testing
        const testError = new Error('Test error for Sentry verification - This is intentional for testing purposes');
        testError.stack = \`Error: Test error for Sentry verification
    at testSentryError (main.cjs:unknown)
    at Object.ipcMain.handle (main.cjs:unknown)\`;
        
        // Add some context to the error
        Sentry.withScope((scope) => {
            scope.setTag('test', 'sentry-verification');
            scope.setLevel('error');
            scope.setContext('test_info', {
                purpose: 'Sentry integration test',
                timestamp: new Date().toISOString(),
                app_version: require('./package.json').version || '1.0.0',
                platform: os.platform(),
                hostname: os.hostname()
            });
            
            // Capture the test error
            Sentry.captureException(testError);
        });
        
        sendToUI('log', { level: 'success', message: '✅ Test error sent to Sentry successfully!' });
        sendToUI('log', { level: 'info', message: '📊 Check your Sentry dashboard to verify the error was received' });
        
        return { success: true, message: 'Test error sent to Sentry' };
    } catch (error) {
        sendToUI('log', { level: 'error', message: \`❌ Failed to send test error to Sentry: \${error.message}\` });
        return { success: false, message: 'Failed to send test error to Sentry' };
    }
});
`;

console.log(testSentryFunction);