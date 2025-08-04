// UI Layer Management Fix - Prevents UI bleeding and z-index conflicts
(function() {
    'use strict';
    
    console.log('🔧 Loading UI Layer Management Fix...');
    
    // Enhanced page management with proper cleanup
    function hideAllPages() {
        const pages = document.querySelectorAll('.page-wrapper, [id$="-page"]');
        pages.forEach(page => {
            if (page) {
                page.style.display = 'none';
                page.style.visibility = 'hidden';
                page.style.opacity = '0';
                page.style.pointerEvents = 'none';
                page.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    function showPage(pageId) {
        hideAllPages(); // First hide all pages
        
        const page = document.getElementById(pageId);
        if (page) {
            // Use requestAnimationFrame to ensure proper rendering
            requestAnimationFrame(() => {
                page.style.display = 'flex';
                page.style.visibility = 'visible';
                page.style.opacity = '1';
                page.style.pointerEvents = 'auto';
                page.removeAttribute('aria-hidden');
                
                // Ensure proper z-index
                page.style.zIndex = '1';
            });
        }
    }
    
    // Enhanced modal management
    function hideAllModals() {
        const modals = document.querySelectorAll('.modal-overlay, [id$="-modal"]');
        modals.forEach(modal => {
            if (modal && modal.style.display !== 'none') {
                modal.style.display = 'none';
                modal.style.visibility = 'hidden';
                modal.style.opacity = '0';
                modal.style.pointerEvents = 'none';
                modal.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Ensure modal appears above everything
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.style.pointerEvents = 'auto';
            modal.style.zIndex = '99999';
            modal.removeAttribute('aria-hidden');
        }
    }
    
    // Clean up floating elements
    function cleanupFloatingElements() {
        // Remove any orphaned tooltips, dropdowns, or popover elements
        const floatingElements = document.querySelectorAll('[style*="position: absolute"], [style*="position: fixed"]');
        floatingElements.forEach(element => {
            // Skip essential UI elements
            if (element.id === 'theme-toggle' || 
                element.classList.contains('modal-overlay') || 
                element.classList.contains('tooltip') ||
                element.closest('.page-wrapper')) {
                return;
            }
            
            // Clean up orphaned elements
            if (element.style.display === 'none' || element.style.visibility === 'hidden') {
                element.remove();
            }
        });
    }
    
    // Override existing navigation functions
    window.navigateToPage = function(pageId) {
        console.log(`🧭 Navigating to page: ${pageId}`);
        hideAllModals();
        cleanupFloatingElements();
        showPage(pageId);
    };
    
    // Enhanced modal showing
    window.showModalSafe = function(modalId) {
        console.log(`📱 Showing modal: ${modalId}`);
        cleanupFloatingElements();
        showModal(modalId);
    };
    
    // Enhanced modal hiding
    window.hideModalSafe = function(modalId) {
        console.log(`❌ Hiding modal: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
        cleanupFloatingElements();
    };
    
    // Scroll fix for mobile and desktop
    function fixScrollIssues() {
        const activePageWrapper = document.querySelector('.page-wrapper:not([style*="display: none"])');
        if (activePageWrapper) {
            // Ensure proper scroll behavior
            activePageWrapper.style.overflowY = 'auto';
            activePageWrapper.style.overflowX = 'hidden';
            activePageWrapper.style.height = '100vh';
            activePageWrapper.style.position = 'relative';
        }
    }
    
    // Background cleanup interval
    setInterval(() => {
        cleanupFloatingElements();
        fixScrollIssues();
    }, 5000);
    
    // Enhanced event listeners for better cleanup
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🎯 DOM loaded - applying UI fixes');
        
        // Fix initial state
        hideAllPages();
        hideAllModals();
        
        // Show welcome page if it exists
        const welcomePage = document.getElementById('welcome-page');
        if (welcomePage) {
            showPage('welcome-page');
        }
        
        // Override click handlers for better modal management
        document.addEventListener('click', function(e) {
            // Close modals when clicking outside
            if (e.target.classList.contains('modal-overlay')) {
                const modalId = e.target.id;
                if (modalId) {
                    hideModalSafe(modalId);
                }
            }
            
            // Handle updates button specifically
            if (e.target.id === 'updates-btn' || e.target.closest('#updates-btn')) {
                e.preventDefault();
                showModalSafe('updates-modal');
            }
        });
        
        // Enhanced escape key handling
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideAllModals();
                cleanupFloatingElements();
            }
        });
        
        // Fix for theme toggle positioning
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.style.zIndex = '999999';
            themeToggle.style.position = 'fixed';
        }
    });
    
    // Window resize handler
    window.addEventListener('resize', function() {
        fixScrollIssues();
        cleanupFloatingElements();
    });
    
    // Mutation observer to catch dynamic content
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Check for modal overlays
                        if (node.classList && node.classList.contains('modal-overlay')) {
                            node.style.zIndex = '99999';
                        }
                        
                        // Check for page wrappers
                        if (node.classList && node.classList.contains('page-wrapper')) {
                            node.style.zIndex = '1';
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ UI Layer Management Fix loaded successfully');
})();
