// Original title of the page
let originalTitle = document.title;
let customTitle = '';
let favicon = '';

// Get the current favicon
const getFavicon = () => {
  const linkElement = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  return linkElement ? linkElement.href : '';
};

// Store original favicon
favicon = getFavicon();

// Set up MutationObserver to detect title changes by the page itself
const setupTitleObserver = () => {
  // Create an observer instance
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.target === document.querySelector('title')) {
        // Title has been changed by the page, but we have a custom title
        if (customTitle) {
          // Wait a tiny bit to ensure the page's change is complete
          setTimeout(() => {
            document.title = customTitle;
          }, 10);
        } else {
          // No custom title, but we should update our record of the original
          originalTitle = document.title;
          
          // Notify the background script about the title change
          chrome.runtime.sendMessage({
            action: "originalTitleChanged",
            title: originalTitle
          });
        }
      }
    });
  });

  // Start observing title changes
  const titleElement = document.querySelector('title');
  if (titleElement) {
    observer.observe(titleElement, { 
      childList: true,
      subtree: true,
      characterData: true
    });
  }
};

// Initialize observers
setupTitleObserver();

// Handle dynamic title changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && customTitle) {
    // When tab becomes visible again, restore our custom title
    // (some websites change the title when tab is not active)
    document.title = customTitle;
  }
});

// Create a subtle notification overlay
const createNotification = (message, type = 'info') => {
  // Remove any existing notification
  const existingNotification = document.getElementById('tab-renamer-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'tab-renamer-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 15px;
    border-radius: 4px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transition: opacity 0.3s, transform 0.3s;
    opacity: 0;
    transform: translateY(-10px);
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  // Set color based on type
  if (type === 'success') {
    notification.style.backgroundColor = '#d4edda';
    notification.style.color = '#155724';
    notification.style.border = '1px solid #c3e6cb';
    notification.innerHTML = '<span style="font-size: 16px;">✓</span> ' + message;
  } else if (type === 'info') {
    notification.style.backgroundColor = '#d1ecf1';
    notification.style.color = '#0c5460';
    notification.style.border = '1px solid #bee5eb';
    notification.innerHTML = '<span style="font-size: 16px;">ℹ</span> ' + message;
  } else if (type === 'warning') {
    notification.style.backgroundColor = '#fff3cd';
    notification.style.color = '#856404';
    notification.style.border = '1px solid #ffeeba';
    notification.innerHTML = '<span style="font-size: 16px;">⚠</span> ' + message;
  }
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "rename") {
    // Store the original title if not already stored
    if (!originalTitle) {
      originalTitle = document.title;
    }
    
    // Set the new title
    document.title = request.title;
    customTitle = request.title;
    
    // Show notification
    createNotification('Tab renamed successfully!', 'success');
    
    // Send a message to the background script to update tab title
    chrome.runtime.sendMessage({
      action: "titleChanged",
      tabId: chrome.runtime.id,
      title: request.title,
      originalTitle: originalTitle
    });
    
    sendResponse({success: true});
  } else if (request.action === "reset") {
    // Reset to original title
    if (originalTitle) {
      document.title = originalTitle;
      customTitle = ''; // Clear custom title
      
      // Show notification
      createNotification('Tab name has been reset', 'info');
      
      // Notify background script
      chrome.runtime.sendMessage({
        action: "titleChanged",
        tabId: chrome.runtime.id,
        title: originalTitle,
        originalTitle: originalTitle
      });
    }
    
    sendResponse({success: true});
  }
  return true; // Keep the message channel open for async response
});

// Handle page refreshes - restore custom title if set
window.addEventListener('load', function() {
  const tabId = chrome.runtime.id;
  
  // Check if this tab has a custom name
  chrome.storage.local.get(['tabNames'], function(result) {
    const tabNames = result.tabNames || {};
    
    if (tabNames[tabId] && tabNames[tabId].customName) {
      // Store original title
      originalTitle = document.title;
      
      // Wait a bit to ensure the page has fully loaded
      setTimeout(() => {
        // Update title to custom name
        document.title = tabNames[tabId].customName;
        customTitle = tabNames[tabId].customName;
        
        // Show subtle notification
        createNotification('Custom tab name restored', 'info');
      }, 500);
    }
  });
});