// Original title of the page
let originalTitle = document.title;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "rename") {
    // Store the original title if not already stored
    if (!originalTitle) {
      originalTitle = document.title;
    }
    
    // Set the new title
    document.title = request.title;
    
    // Send a message to the background script to update tab title
    chrome.runtime.sendMessage({
      action: "titleChanged",
      tabId: chrome.runtime.id,
      title: request.title
    });
    
    sendResponse({success: true});
  } else if (request.action === "reset") {
    // Reset to original title
    if (originalTitle) {
      document.title = originalTitle;
      
      // Notify background script
      chrome.runtime.sendMessage({
        action: "titleChanged",
        tabId: chrome.runtime.id,
        title: originalTitle
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
      
      // Update title to custom name
      document.title = tabNames[tabId].customName;
    }
  });
});