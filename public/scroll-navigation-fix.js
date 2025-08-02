// Scroll Navigation Fix for Beesoft
// Prevents unwanted page switches during scrolling

console.log('Scroll navigation fix loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('Setting up scroll navigation fix');
  
  let isScrolling = false;
  let scrollTimeout;
  let currentPage = null;
  let pageChangeBlocked = false;
  
  // Track current page
  function setCurrentPage(pageId) {
    currentPage = pageId;
    console.log(`Current page set to: ${pageId}`);
  }
  
  // Enhanced showPage function that prevents scroll-triggered changes
  const originalShowPage = window.showPage;
  window.showPage = function(pageId) {
    // If we're currently scrolling and trying to change to a different page, block it
    if (isScrolling && currentPage && currentPage !== pageId) {
      console.log(`Blocked page change to ${pageId} during scrolling (current: ${currentPage})`);
      return;
    }
    
    // If page change is explicitly blocked, don't allow it
    if (pageChangeBlocked && currentPage && currentPage !== pageId) {
      console.log(`Page change to ${pageId} blocked (current: ${currentPage})`);
      return;
    }
    
    console.log(`Allowing page change to: ${pageId}`);
    
    // Call original showPage function
    if (originalShowPage) {
      originalShowPage(pageId);
    } else {
      // Fallback implementation
      const allPages = ['welcome-page', 'main-app-page', 'trial-lock-page'];
      
      allPages.forEach(id => {
        const pages = document.querySelectorAll(`#${id}`);
        pages.forEach(page => {
          page.style.display = 'none';
          page.classList.remove('flex', 'active');
        });
      });
      
      const targetPages = document.querySelectorAll(`#${pageId}`);
      targetPages.forEach(targetPage => {
        targetPage.style.display = 'flex';
        targetPage.classList.add('flex', 'active');
      });
    }
    
    // Update current page
    setCurrentPage(pageId);
  };
  
  // Detect scrolling and block page changes during scroll
  let scrollDetectionTimeout;
  
  function handleScroll() {
    if (!isScrolling) {
      isScrolling = true;
      console.log('Scrolling started - blocking automatic page changes');
    }
    
    // Clear existing timeout
    clearTimeout(scrollDetectionTimeout);
    
    // Set new timeout to detect when scrolling stops
    scrollDetectionTimeout = setTimeout(() => {
      isScrolling = false;
      console.log('Scrolling stopped - allowing page changes');
    }, 150); // 150ms after scroll stops
  }
  
  // Add scroll listeners to prevent page changes during scrolling
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('scroll', handleScroll, { passive: true });
  
  // Also listen for wheel events (mouse wheel)
  window.addEventListener('wheel', () => {
    pageChangeBlocked = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      pageChangeBlocked = false;
    }, 300);
  }, { passive: true });
  
  // Listen for touch events (mobile scrolling)
  window.addEventListener('touchmove', () => {
    pageChangeBlocked = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      pageChangeBlocked = false;
    }, 300);
  }, { passive: true });
  
  // Override any intersection observers that might be causing page changes
  const originalIntersectionObserver = window.IntersectionObserver;
  window.IntersectionObserver = function(callback, options) {
    const wrappedCallback = function(entries, observer) {
      // Only allow intersection observer callbacks if we're not scrolling
      if (!isScrolling && !pageChangeBlocked) {
        callback(entries, observer);
      } else {
        console.log('Blocked intersection observer callback during scrolling');
      }
    };
    
    return new originalIntersectionObserver(wrappedCallback, options);
  };
  
  // Disable any existing scroll-based navigation
  function disableScrollNavigation() {
    // Remove any scroll event listeners that might trigger page changes
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      // Clone element to remove all event listeners
      if (element.onscroll) {
        element.onscroll = null;
      }
    });
  }
  
  // Enhanced button click handlers that work regardless of scroll state
  function setupButtonHandlers() {
    // Get Started button - always allow this navigation
    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {
      getStartedBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Get Started button clicked - forcing navigation');
        
        // Check terms
        const termsCheckbox = document.getElementById('accept-terms-checkbox');
        if (!termsCheckbox || !termsCheckbox.checked) {
          alert('Please accept the Terms and Conditions to continue.');
          return;
        }
        
        // Force page change regardless of scroll state
        pageChangeBlocked = false;
        isScrolling = false;
        window.showPage('main-app-page');
        
        // Scroll to top of new page
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      });
    }
    
    // Back to Welcome button - always allow this navigation
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
    if (backToWelcomeBtn) {
      backToWelcomeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Back to Welcome button clicked - forcing navigation');
        
        // Force page change regardless of scroll state
        pageChangeBlocked = false;
        isScrolling = false;
        window.showPage('welcome-page');
        
        // Scroll to top of new page
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      });
    }
  }
  
  // Setup button handlers after a short delay
  setTimeout(setupButtonHandlers, 500);
  
  // Disable scroll navigation after page load
  setTimeout(disableScrollNavigation, 1000);
  
  // Override checkTrial to prevent it from changing pages during scroll
  const originalCheckTrial = window.checkTrial;
  window.checkTrial = async function() {
    // Don't run checkTrial if we're scrolling or if user is actively navigating
    if (isScrolling || pageChangeBlocked) {
      console.log('Skipped checkTrial during scrolling');
      return;
    }
    
    // Only run checkTrial if no page is currently set (initial load)
    if (currentPage && currentPage !== 'trial-lock-page') {
      console.log('Skipped checkTrial - user is on a specific page');
      return;
    }
    
    if (originalCheckTrial) {
      await originalCheckTrial();
    }
  };
  
  // Prevent any automatic page changes after initial load
  let initialLoadComplete = false;
  setTimeout(() => {
    initialLoadComplete = true;
    console.log('Initial load complete - preventing automatic page changes');
  }, 2000);
  
  // Monitor for unwanted page changes and prevent them
  const observer = new MutationObserver(function(mutations) {
    if (!initialLoadComplete) return;
    
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target;
        
        // If an element is being shown/hidden and we're scrolling, prevent it
        if (isScrolling || pageChangeBlocked) {
          if (target.id && target.id.includes('page')) {
            const currentDisplay = target.style.display;
            if (currentDisplay === 'flex' && currentPage && target.id !== currentPage) {
              console.log(`Prevented unwanted page show: ${target.id} during scroll`);
              target.style.display = 'none';
            }
          }
        }
      }
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['style']
  });
  
  // Set initial page based on what's currently visible
  setTimeout(() => {
    const visiblePage = document.querySelector('[id$="-page"][style*="flex"], [id$="-page"]:not([style*="none"])');
    if (visiblePage) {
      setCurrentPage(visiblePage.id);
      console.log(`Initial page detected: ${visiblePage.id}`);
    }
  }, 100);
  
  console.log('Scroll navigation fix setup complete');
});