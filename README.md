
# 🐝 Beesoft - Smart WhatsApp Automation

[![Version](https://img.shields.io/badge/version-1.0.0--beta.1-blue.svg)](https://github.com/ektharxd/beesoft)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)](https://github.com/ektharxd/beesoft)
[![Electron](https://img.shields.io/badge/electron-32.2.5-brightgreen.svg)](https://electronjs.org/)

> **Smart, secure WhatsApp automation tool for bulk messaging with advanced anti-ban protection and modern Material 3 design.**

![Beesoft Banner](https://via.placeholder.com/800x200/4f46e5/ffffff?text=🐝+Beesoft+-+WhatsApp+Automation)

## ✨ Features

### 🚀 **Core Functionality**
- **📱 WhatsApp Web Integration** - Seamless connection via QR code scanning
- **📊 Bulk Messaging** - Send messages to hundreds of contacts from Excel files
- **🖼️ Media Support** - Attach images with captions to your messages
- **📈 Real-time Analytics** - Live progress tracking with success/failure metrics
- **⏸️ Campaign Control** - Pause, resume, and stop campaigns mid-execution

### 🛡️ **Advanced Anti-Ban Protection**
- **🤖 Human-like Behavior** - Randomized delays (3-8s) and typing simulation
- **📦 Smart Batching** - 20 messages per batch with 5-minute breaks
- **⏱️ Rate Limiting** - 50 msgs/hour, 500 msgs/day with automatic tracking
- **🔄 Adaptive Delays** - Dynamic adjustment based on WhatsApp responses
- **📊 Usage Analytics** - Monitor your sending patterns and limits

### 🎨 **Modern User Experience**
- **🌙 Dark/Light Theme** - Automatic system detection with manual toggle
- **📱 Responsive Design** - Optimized for desktop, tablet, and mobile
- **♿ Accessibility** - WCAG AAA compliant with full keyboard navigation
- **🎯 Material 3 Design** - Clean, intuitive interface with smooth animations
- **⌨️ Keyboard Shortcuts** - Power user shortcuts for efficient workflow

### 🔧 **Technical Excellence**
- **🏗️ Electron Desktop App** - Native Windows application
- **🔒 Local Data Storage** - Your data never leaves your device
- **📦 Portable & Installer** - Available as both portable and installable versions
- **🔄 Auto-Recovery** - Automatic error recovery and connection restoration

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [🎯 Usage Guide](#-usage-guide)
- [📊 Excel File Format](#-excel-file-format)
- [🛡️ Anti-Ban Features](#️-anti-ban-features)
- [⚙️ Configuration](#️-configuration)
- [🔧 Development](#-development)
- [🐛 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🚀 Quick Start

### Prerequisites
- **Windows 10/11** (64-bit)
- **Node.js 18+** (for development)
- **WhatsApp** installed on your mobile device
- **Google Chrome** or **Microsoft Edge** browser

### 1-Minute Setup

1. **Download & Install**
   ```bash
   # Clone the repository
   git clone https://github.com/ektharxd/beesoft.git
   cd beesoft
   
   # Install dependencies
   npm install
   
   # Start the application
   npm start
   ```

2. **Connect WhatsApp**
   - Launch Beesoft
   - Click "Connect WhatsApp"
   - Scan QR code with your phone
   - Wait for "Connected" status

3. **Send Your First Campaign**
   - Upload Excel file with phone numbers
   - Write your message
   - Click "Start Campaign"
   - Monitor real-time progress

## 📦 Installation

### Option 1: Pre-built Installer (Recommended)
1. Download `Beesoft-Setup-1.0.0-beta.1.exe` from [Releases](https://github.com/ektharxd/beesoft/releases)
2. Run installer and follow setup wizard
3. Launch from Start Menu or Desktop shortcut

### Option 2: Portable Version
1. Download `Beesoft-Portable-1.0.0-beta.1.exe` from [Releases](https://github.com/ektharxd/beesoft/releases)
2. Run directly - no installation required
3. Perfect for USB drives or temporary usage

### Option 3: Build from Source
```bash
# Clone repository
git clone https://github.com/ektharxd/beesoft.git
cd beesoft

# Install dependencies
npm install

# Development mode
npm start

# Build for production
npm run build:win        # Windows installer
npm run build:portable   # Portable executable
npm run build:all        # Both versions
```

## 🎯 Usage Guide

### Step 1: Connect WhatsApp
1. **Launch Beesoft** - Open the application
2. **Click "Connect WhatsApp"** - Initiates connection process
3. **Scan QR Code** - Use WhatsApp mobile app to scan
4. **Wait for Connection** - Status will show "Connected" when ready

### Step 2: Prepare Your Contact List
1. **Create Excel File** - Use Excel, Google Sheets, or LibreOffice
2. **Add Phone Numbers** - Place numbers in any column
3. **Include Country Code** - Format: `919876543210` (no + or spaces)
4. **Save as .xlsx** - Ensure file is in Excel format

### Step 3: Compose Your Message
1. **Write Message** - Type your message in the text area
2. **Add Variables** - Use `{name}` for personalization (if Excel has name column)
3. **Attach Image** - Optional: Click "Choose Image" to add media
4. **Preview** - Check message preview before sending

### Step 4: Launch Campaign
1. **Upload Excel File** - Drag & drop or click to browse
2. **Review Settings** - Check anti-ban settings if needed
3. **Start Campaign** - Click "Start Campaign" button
4. **Monitor Progress** - Watch real-time statistics and logs

### Step 5: Campaign Management
- **⏸️ Pause** - Temporarily pause the campaign
- **▶️ Resume** - Continue paused campaign
- **⏹️ Stop** - Permanently stop campaign
- **📊 Monitor** - View success/failure statistics

## 📊 Excel File Format

### Supported Formats
- **.xlsx** (Excel 2007+)
- **.xls** (Excel 97-2003)

### Phone Number Format
```
✅ Correct Examples:
919876543210    (India)
14155552671     (USA)
447911123456    (UK)
8613800138000   (China)

❌ Incorrect Examples:
+91 9876543210  (no + or spaces)
91-9876-543210  (no dashes)
9876543210      (missing country code)
```

### Excel Structure
```
Column A    Column B    Column C
Phone       Name        Company     (optional columns)
919876543210 John Doe   ABC Corp
919876543211 Jane Smith XYZ Ltd
...
```

### Variable Support
Use variables in your message for personalization:
- `{name}` - Uses Column B (Name)
- `{company}` - Uses Column C (Company)
- `{phone}` - Uses Column A (Phone)

**Example Message:**
```
Hi {name}! 

We have a special offer for {company}. 
Contact us at your convenience.

Best regards,
Your Team
```

## 🛡️ Anti-Ban Features

Beesoft includes sophisticated anti-ban protection to keep your WhatsApp account safe:

### 🤖 Human-like Behavior
- **Typing Simulation** - Simulates natural typing patterns
- **Random Delays** - Varies message timing (3-8 seconds)
- **Presence Updates** - Shows online/typing status naturally

### 📦 Smart Batching
- **Batch Size** - Sends 20 messages per batch (configurable)
- **Batch Breaks** - 5-minute breaks between batches
- **Daily Limits** - Maximum 500 messages per day
- **Hourly Limits** - Maximum 50 messages per hour

### 🔄 Adaptive Protection
- **Error Detection** - Automatically detects rate limiting
- **Delay Adjustment** - Increases delays when needed
- **Connection Monitoring** - Monitors WhatsApp connection health
- **Auto-Recovery** - Automatically recovers from errors

### 📊 Usage Tracking
```
Current Usage:
├── Hourly: 15/50 messages
├── Daily: 127/500 messages
├── Last Message: 2 minutes ago
└── Next Batch: 3 minutes
```

### ⚙️ Configurable Settings
```javascript
// Anti-ban configuration (advanced users)
const ANTI_BAN_CONFIG = {
    minDelay: 3000,        // Minimum delay (3 seconds)
    maxDelay: 8000,        // Maximum delay (8 seconds)
    batchSize: 20,         // Messages per batch
    batchDelay: 300000,    // Break between batches (5 minutes)
    dailyLimit: 500,       // Daily message limit
    hourlyLimit: 50,       // Hourly message limit
    randomizeDelay: true,  // Enable random delays
    respectTyping: true,   // Simulate typing
    respectOnline: true    // Show online status
};
```

## ⚙️ Configuration

### Application Settings
Located in `package.json`:
```json
{
  "name": "beesoft",
  "version": "1.0.0-beta.1",
  "description": "🐝 Beesoft — Smart WhatsApp Automation",
  "main": "main.js",
  "author": "Ekthar"
}
```

### Build Configuration
Located in `build-config.js`:
```javascript
module.exports = {
  appId: "com.ekthar.beesoft",
  productName: "Beesoft",
  directories: {
    output: "dist",
    buildResources: "assets"
  },
  win: {
    target: ["nsis", "portable"],
    icon: "public/Bee.ico"
  }
};
```

## 🔧 Development

### Development Setup
```bash
# Clone repository
git clone https://github.com/ektharxd/beesoft.git
cd beesoft

# Install dependencies
npm install

# Start development server
npm start

# Open DevTools (development mode)
# Set NODE_ENV=development in your environment
```

### Project Structure
```
beesoft/
├── 📁 public/              # Frontend assets
│   ├── index.html          # Main HTML file
│   ├── app.js             # Frontend JavaScript
│   ├── style.css          # Styling
│   └── Bee.ico            # Application icon
├── 📁 installer/          # Installer assets
├── main.js                # Electron main process
├── preload.js             # Electron preload script
├── package.json           # Dependencies & scripts
├── build-config.js        # Build configuration
├── README.md              # This file
└── LICENSE                # License file
```

### Available Scripts
```bash
npm start              # Start development
npm run pack           # Package app
npm run build          # Build for production
npm run build:win      # Build Windows installer
npm run build:portable # Build portable version
npm run build:all      # Build all versions
```

### Development Tools
- **Electron DevTools** - Available in development mode
- **Hot Reload** - Automatic reload on file changes
- **Debug Logging** - Comprehensive logging system
- **Error Boundaries** - Graceful error handling

## 🐛 Troubleshooting

### Common Issues

#### 🔌 Connection Problems
**Issue**: WhatsApp won't connect or QR code doesn't appear
```bash
# Solutions:
1. Clear cache: Settings → Clear Cache
2. Clear auth: Settings → Clear Auth Data
3. Restart app completely
4. Check Chrome/Edge installation
5. Disable antivirus temporarily
```

**Issue**: "Chrome compatibility error"
```bash
# Solutions:
1. Update Chrome to latest version
2. Install Microsoft Edge as fallback
3. Run as administrator
4. Check Windows updates
```

#### 📱 QR Code Issues
**Issue**: QR code expires too quickly
```bash
# Solutions:
1. Use fallback connection method
2. Ensure stable internet connection
3. Close other WhatsApp Web sessions
4. Clear browser cache
```

#### 📊 Campaign Problems
**Issue**: Messages fail to send
```bash
# Solutions:
1. Check phone number format (include country code)
2. Verify WhatsApp connection status
3. Reduce batch size in anti-ban settings
4. Check daily/hourly limits
5. Wait for rate limit cooldown
```

**Issue**: Excel file not recognized
```bash
# Solutions:
1. Save as .xlsx format
2. Ensure numbers are in text format
3. Remove empty rows/columns
4. Check file permissions
```

#### 🖼️ Image Upload Issues
**Issue**: Image won't attach
```bash
# Solutions:
1. Use supported formats: JPG, PNG, GIF, WebP
2. Check file size (max 16MB)
3. Ensure file isn't corrupted
4. Try different image
```

### Debug Mode
Enable debug logging:
```bash
# Set environment variable
set NODE_ENV=development

# Or add to .env file
NODE_ENV=development
```

### Log Files
Application logs are stored in:
```
Windows: %APPDATA%/Beesoft/logs/
Portable: ./logs/
```

### Performance Issues
**Issue**: App runs slowly
```bash
# Solutions:
1. Close unnecessary programs
2. Increase virtual memory
3. Update graphics drivers
4. Disable Windows animations
5. Run disk cleanup
```

### Getting Help
1. **Check Logs** - Review application logs for errors
2. **Update App** - Ensure you're using the latest version
3. **Contact Support** - Email: ekthar.xd@gmail.com
4. **GitHub Issues** - Report bugs on GitHub repository

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
```bash
# Fork the repository
git clone https://github.com/yourusername/beesoft.git
cd beesoft

# Create feature branch
git checkout -b feature/amazing-feature

# Install dependencies
npm install

# Make your changes
# ...

# Test your changes
npm test

# Commit changes
git commit -m "Add amazing feature"

# Push to branch
git push origin feature/amazing-feature

# Create Pull Request
```

### Contribution Guidelines
- **Code Style** - Follow existing code style
- **Testing** - Add tests for new features
- **Documentation** - Update README and docs
- **Commits** - Use conventional commit messages
- **Issues** - Link PRs to relevant issues

### Areas for Contribution
- 🌐 **Internationalization** - Add language support
- 🎨 **UI/UX** - Improve design and usability
- 🔧 **Features** - Add new functionality
- 🐛 **Bug Fixes** - Fix reported issues
- 📚 **Documentation** - Improve docs and guides
- 🧪 **Testing** - Add automated tests

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

```
ISC License

Copyright (c) 2024 Ekthar

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.
```

## 🙏 Acknowledgments

- **[WhatsApp Web.js](https://github.com/pedroslopez/whatsapp-web.js)** - Core WhatsApp integration
- **[Electron](https://electronjs.org/)** - Desktop application framework
- **[Material Design](https://material.io/)** - UI design system
- **[Puppeteer](https://pptr.dev/)** - Browser automation

## 📞 Support & Contact

- **📧 Email**: ekthar.xd@gmail.com
- **🐛 Issues**: [GitHub Issues](https://github.com/ektharxd/beesoft/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/ektharxd/beesoft/discussions)
- **📖 Wiki**: [GitHub Wiki](https://github.com/ektharxd/beesoft/wiki)

## 🔄 Changelog

### Version 1.0.0-beta.1 (Latest)
- ✅ Initial beta release
- ✅ WhatsApp Web integration with QR code
- ✅ Bulk messaging with Excel support
- ✅ Image attachment support
- ✅ Real-time campaign monitoring
- ✅ Advanced anti-ban protection
- ✅ Material 3 design system
- ✅ Dark/Light theme support
- ✅ Accessibility compliance
- ✅ Windows installer & portable versions

---

## 🚀 System Requirements

- **Operating System:** Windows 10/11 (64-bit)
- **Memory:** 4GB RAM minimum, 8GB recommended
- **Storage:** 500MB free space
- **Browser:** Google Chrome or Microsoft Edge
- **Mobile Device:** WhatsApp installed on your phone
- **Network:** Stable internet connection

## 🎯 Key Features Summary

| Feature | Description | Status |
|---------|-------------|--------|
| 📱 WhatsApp Integration | QR code connection to WhatsApp Web | ✅ Ready |
| 📊 Bulk Messaging | Send to hundreds of contacts from Excel | ✅ Ready |
| 🖼️ Media Support | Attach images with captions | ✅ Ready |
| 🛡️ Anti-Ban Protection | Smart delays and human-like behavior | ✅ Ready |
| 📈 Real-time Analytics | Live progress tracking | ✅ Ready |
| ���� Modern UI | Material 3 design with themes | ✅ Ready |
| ⏸️ Campaign Control | Pause/resume/stop functionality | ✅ Ready |
| 📦 Windows Build | Installer and portable versions | ✅ Ready |

---

<div align="center">

**Made with ❤️ by [Ekthar](https://github.com/ektharxd)**

*Beesoft - Smart WhatsApp Automation for Everyone* 🐝

[⬆ Back to Top](#-beesoft---smart-whatsapp-automation)

</div>