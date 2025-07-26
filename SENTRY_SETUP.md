# Sentry Error Tracking Setup for Beesoft

This guide will help you set up Sentry error tracking for your Beesoft WhatsApp automation application.

## What is Sentry?

Sentry is a real-time error tracking and performance monitoring platform that helps you:
- Track and debug errors in production
- Monitor application performance
- Get alerts when issues occur
- Analyze error trends and patterns

## Setup Instructions

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and create a free account
2. Create a new project and select "Electron" as the platform
3. Copy your DSN (Data Source Name) from the project settings

### 2. Configure Your DSN

You have two options to configure your Sentry DSN:

#### Option A: Environment Variable (Recommended)
1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your DSN to the `.env` file:
```
SENTRY_DSN=https://your-actual-dsn@sentry.io/project-id
NODE_ENV=production
```

#### Option B: Direct Configuration
1. Open `main.js` and `preload.js`
2. Replace `'https://your-sentry-dsn@sentry.io/project-id'` with your actual DSN

### 3. Test the Integration

1. Start your application
2. Trigger an error (you can temporarily add `throw new Error('Test error')` somewhere)
3. Check your Sentry dashboard to see if the error appears

## Features Enabled

### Error Tracking
- **Main Process Errors**: Crashes, unhandled exceptions, and connection errors
- **Renderer Process Errors**: UI errors, JavaScript exceptions
- **WhatsApp Connection Errors**: Authentication failures, network issues
- **Campaign Errors**: Message sending failures, rate limiting detection

### Performance Monitoring
- Application startup time
- WhatsApp connection performance
- Campaign execution metrics
- Memory and CPU usage patterns

### Context Information
- User environment (OS, architecture)
- Application version
- WhatsApp connection status
- Campaign statistics
- Error location and stack traces

## Privacy and Security

The Sentry integration is configured with privacy in mind:
- **No Personal Data**: Phone numbers, messages, and user content are not sent
- **Filtered Stack Traces**: Only application code is marked as relevant
- **Scrubbed Sensitive Fields**: Authentication tokens and personal data are removed
- **Local Processing**: Sensitive operations are filtered before sending to Sentry

## Error Categories

### Connection Errors
- WhatsApp authentication failures
- Network connectivity issues
- Browser compatibility problems
- Session management errors

### Campaign Errors
- Message sending failures
- Rate limiting detection
- Media upload issues
- Batch processing errors

### Application Errors
- File system access issues
- Configuration problems
- UI rendering errors
- Memory management issues

## Monitoring Dashboard

Once configured, you can monitor your application through the Sentry dashboard:

1. **Issues**: View and manage errors as they occur
2. **Performance**: Monitor application performance metrics
3. **Releases**: Track errors across different versions
4. **Alerts**: Set up notifications for critical errors

## Environment Configuration

### Development
- Full error tracking enabled
- Debug mode active
- 100% transaction sampling
- Detailed logging

### Production
- Optimized error tracking
- Performance monitoring
- 10% transaction sampling
- Privacy-focused filtering

## Troubleshooting

### Common Issues

1. **DSN Not Working**
   - Verify your DSN is correct
   - Check network connectivity
   - Ensure Sentry project is active

2. **No Errors Appearing**
   - Check if errors are actually occurring
   - Verify DSN configuration
   - Test with a manual error

3. **Too Many Events**
   - Adjust sample rates in configuration
   - Add more filtering rules
   - Review error frequency

### Support

For Sentry-specific issues:
- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Community Forum](https://forum.sentry.io/)
- [Electron Integration Guide](https://docs.sentry.io/platforms/javascript/guides/electron/)

## Benefits for Beesoft

1. **Proactive Issue Detection**: Know about problems before users report them
2. **Faster Debugging**: Detailed error context and stack traces
3. **Performance Insights**: Understand how your app performs in real-world usage
4. **User Experience**: Identify and fix issues that impact user workflows
5. **Reliability Monitoring**: Track application stability over time

## Next Steps

1. Set up your Sentry DSN using the instructions above
2. Deploy your application and monitor the dashboard
3. Set up alerts for critical errors
4. Review and analyze error patterns regularly
5. Use insights to improve application stability

Remember to keep your DSN secure and never commit it to public repositories!