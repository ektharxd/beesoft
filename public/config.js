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
    // Check if we're running on Vercel (production)
    if (window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('beesoft-one.vercel.app')) {
      return this.PROD_BASE_URL;
    }
    
    // For local development, return the first dev URL
    return this.DEV_BASE_URLS[0];
  },
  
  // Get all possible base URLs for fallback attempts
  getAllUrls: function() {
    if (window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('beesoft-one.vercel.app')) {
      return [this.PROD_BASE_URL];
    }
    return this.DEV_BASE_URLS;
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
