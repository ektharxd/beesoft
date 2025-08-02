// API Configuration for different environments
window.API_CONFIG = {
  // Production URL for Vercel deployment
  PROD_BASE_URL: 'https://beesoft-one.vercel.app',
  
  // Development URLs for local testing
  DEV_BASE_URLS: [
    'http://localhost:3001',
    'http://localhost:4000',
    'http://127.0.0.1:3001'
  ],
  
  // Get the appropriate base URL based on environment
  getBaseUrl: function() {
    // Always use Vercel in production (including Electron builds)
    // Only use localhost for development when explicitly in a browser with localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return this.DEV_BASE_URLS[0];
    }
    
    // Default to Vercel for all other cases (Vercel web app, Electron builds, etc.)
    return this.PROD_BASE_URL;
  },
  
  // Get all possible base URLs for fallback attempts
  getAllUrls: function() {
    // For localhost development, try local servers first, then Vercel as fallback
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return [...this.DEV_BASE_URLS, this.PROD_BASE_URL];
    }
    
    // For everything else (Vercel web app, Electron builds), use Vercel only
    return [this.PROD_BASE_URL];
  }
};

// Helper function to make API calls with automatic fallback
window.apiCall = async function(endpoint, options = {}) {
  const urls = window.API_CONFIG.getAllUrls();
  
  for (let i = 0; i < urls.length; i++) {
    try {
      const url = `${urls[i]}${endpoint}`;
      console.log(`Attempting API call to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (response.ok) {
        return response;
      }
      
      // If not ok but not the last URL, continue to next
      if (i === urls.length - 1) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`API call failed for ${urls[i]}:`, error.message);
      
      // If this is the last URL, throw the error
      if (i === urls.length - 1) {
        throw error;
      }
    }
  }
};
