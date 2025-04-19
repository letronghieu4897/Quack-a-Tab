// Listen for tab close events to clean up storage
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    chrome.storage.local.get(['tabNames'], function(result) {
      const tabNames = result.tabNames || {};
      
      // Remove the entry for the closed tab
      if (tabNames[tabId]) {
        delete tabNames[tabId];
        chrome.storage.local.set({tabNames: tabNames});
      }
    });
  });
  
  // Listen for tab update events
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // If the URL has changed, check if we need to reset the custom name
    if (changeInfo.url) {
      chrome.storage.local.get(['tabNames'], function(result) {
        const tabNames = result.tabNames || {};
        
        // If this tab had a custom name, update the storage with the new original title
        if (tabNames[tabId]) {
          tabNames[tabId] = {
            originalName: tab.title,
            customName: ''  // Reset custom name on URL change
          };
          chrome.storage.local.set({tabNames: tabNames});
        }
      });
    }
  });
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "titleChanged") {
      // This is a notification that the title was changed by the content script
      // You could use this to update the browser tab title if needed
      // Note: This won't override the actual tab title in the browser UI
      // as Chrome doesn't provide direct API for this
      
      // We can still use this to update our stored data
      chrome.storage.local.get(['tabNames'], function(result) {
        const tabNames = result.tabNames || {};
        
        if (!tabNames[sender.tab.id]) {
          tabNames[sender.tab.id] = {
            originalName: sender.tab.title,
            customName: request.title
          };
        } else {
          tabNames[sender.tab.id].customName = request.title;
        }
        
        chrome.storage.local.set({tabNames: tabNames});
      });
    }
    
    return true;
  });