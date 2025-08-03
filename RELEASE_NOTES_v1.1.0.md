# Release Notes v1.1.0

## 🚀 Cloud Deployment Support

### New Features
- **Cloud Deployment**: Successfully deployed dashboard and backend services to Google Cloud Platform
- **External API Access**: All API endpoints now support external IP configuration (104.154.62.181)
- **Production Ready**: PM2 process management for reliable cloud hosting

### Technical Improvements
- **ES Module Compatibility**: Converted all API endpoints from ES6 modules to CommonJS for Node.js compatibility
- **Environment Configuration**: Centralized environment variables with proper Supabase integration
- **Firewall Configuration**: Google Cloud firewall rules for dashboard access on port 3001

### Backend Services
- **Main API Server**: Running on port 3001 with static file serving
- **Admin API Server**: Running on port 4000 for administrative functions
- **Database Integration**: Full Supabase connection with proper environment variable configuration

### API Endpoints Fixed
- `api/device-heartbeats.js` - Device heartbeat data management
- `api/devices-debug.js` - Debug device information
- `api/heartbeat-monitor.js` - Comprehensive device monitoring
- `api/heartbeat.js` - Simple heartbeat endpoint
- `api/permanent-keys.js` - License key management
- `api/status.js` - System status monitoring

### Dashboard Access
- **Live URL**: http://104.154.62.181:3001/admin-dashboard-new.html
- **Real-time Monitoring**: Device status, heartbeats, and system analytics
- **Admin Features**: License management, device control, and debugging tools

### Deployment Details
- **Platform**: Google Cloud Platform (e2-medium instance)
- **OS**: Ubuntu/Debian
- **Process Manager**: PM2 for production reliability
- **Database**: Supabase with proper environment configuration
- **Firewall**: Configured for external access on required ports

---

**Migration Notes**: This release represents the successful transition from local development to cloud production environment. All services are now running reliably on Google Cloud with proper process management and external accessibility.
