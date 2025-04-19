// Global variables to store state
let tabsWithCustomNames = new Set();

// Initialize when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // First installation
    showWelcomeTab();
  } else if (details.reason === 'update') {
    // Extension was updated
    const previousVersion = details.previousVersion;
    const currentVersion = chrome.runtime.getManifest().version;
    
    // Check if this is a major version update
    if (previousVersion.split('.')[0] !== currentVersion.split('.')[0]) {
      showUpdateNotification(previousVersion, currentVersion);
    }
  }
});

// Open a welcome tab when the extension is first installed
function showWelcomeTab() {
  chrome.tabs.create({
    url: 'welcome.html'
  });
  
  // Initialize storage with default values
  chrome.storage.local.set({
    tabNames: {},
    recentNames: [],
    darkMode: false,
    settings: {
      showNotifications: true,
      autoRestore: true,
      maxRecentNames: 10
    }
  });
}

// Show an update notification
function showUpdateNotification(oldVersion, newVersion) {
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || { showNotifications: true };
    
    if (settings.showNotifications) {
      // We could create a notification here if needed
      console.log(`Extension updated from ${oldVersion} to ${newVersion}`);
    }
  });
}

// Listen for tab close events to clean up storage
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  chrome.storage.local.get(['tabNames'], function(result) {
    const tabNames = result.tabNames || {};
    
    // Remove the entry for the closed tab
    if (tabNames[tabId]) {
      delete tabNames[tabId];
      chrome.storage.local.set({tabNames: tabNames});
      
      // Update our runtime record
      tabsWithCustomNames.delete(tabId);
    }
  });
});

// Listen for tab update events
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // If the URL has changed, check if we need to reset the custom name
  if (changeInfo.url) {
    chrome.storage.local.get(['tabNames', 'settings'], function(result) {
      const tabNames = result.tabNames || {};
      const settings = result.settings || { autoRestore: true };
      
      // If this tab had a custom name, update the storage with the new original title
      if (tabNames[tabId]) {
        tabNames[tabId] = {
          originalName: tab.title,
          customName: ''  // Reset custom name on URL change
        };
        chrome.storage.local.set({tabNames: tabNames});
        
        // Update our runtime record
        tabsWithCustomNames.delete(tabId);
      }
    });
  }
  
  // If the tab title has been updated, but it had a custom name
  if (changeInfo.title && tabsWithCustomNames.has(tabId)) {
    chrome.storage.local.get(['tabNames', 'settings'], function(result) {
      const tabNames = result.tabNames || {};
      const settings = result.settings || { autoRestore: true };
      
      // This tab has a custom name, we need to keep track of the original title
      if (tabNames[tabId] && tabNames[tabId].customName) {
        // Update the original name in storage
        tabNames[tabId].originalName = changeInfo.title;
        
        // If auto-restore is enabled, restore the custom name
        if (settings.autoRestore) {
          chrome.tabs.sendMessage(tabId, {
            action: "rename",
            title: tabNames[tabId].customName
          });
        }
        
        chrome.storage.local.set({tabNames: tabNames});
      }
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "titleChanged") {
    // This is a notification that the title was changed by the content script
    const tabId = sender.tab.id;
    
    chrome.storage.local.get(['tabNames'], function(result) {
      const tabNames = result.tabNames || {};
      
      if (!tabNames[tabId]) {
        tabNames[tabId] = {
          originalName: request.originalTitle || sender.tab.title,
          customName: request.title
        };
      } else {
        tabNames[tabId].customName = request.title;
        
        // If originalTitle was provided, update that too
        if (request.originalTitle) {
          tabNames[tabId].originalName = request.originalTitle;
        }
      }
      
      // If this has a custom name (not empty), add to our runtime record
      if (request.title && request.title !== request.originalTitle) {
        tabsWithCustomNames.add(tabId);
      } else {
        tabsWithCustomNames.delete(tabId);
      }
      
      chrome.storage.local.set({tabNames: tabNames});
    });
  } else if (request.action === "originalTitleChanged") {
    // The page has changed its own title, but we need to keep track of it
    const tabId = sender.tab.id;
    
    chrome.storage.local.get(['tabNames'], function(result) {
      const tabNames = result.tabNames || {};
      
      if (tabNames[tabId]) {
        tabNames[tabId].originalName = request.title;
        chrome.storage.local.set({tabNames: tabNames});
      }
    });
  }
  
  return true;
});

// Add context menu when extension icon is right clicked
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: "resetAll",
    title: "Reset All Custom Tab Names",
    contexts: ["action"]
  });
  
  chrome.contextMenus.create({
    id: "clearRecent",
    title: "Clear Recent Names History",
    contexts: ["action"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "resetAll") {
    // Reset all custom names
    chrome.storage.local.get(['tabNames'], function(result) {
      const tabNames = result.tabNames || {};
      let hasReset = false;
      
      // For each tab with a custom name
      Object.keys(tabNames).forEach(tabId => {
        if (tabNames[tabId].customName) {
          // Reset this tab's custom name
          tabNames[tabId].customName = '';
          hasReset = true;
          
          // Try to send a reset message to the tab
          try {
            chrome.tabs.sendMessage(parseInt(tabId), {
              action: "reset"
            });
          } catch (e) {
            // Tab may no longer exist, just ignore
          }
        }
      });
      
      if (hasReset) {
        // Save updated states
        chrome.storage.local.set({tabNames: tabNames});
        
        // Clear runtime record
        tabsWithCustomNames.clear();
        
        // Show a notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Tab Names Reset',
          message: 'All custom tab names have been reset.'
        });
      }
    });
  } else if (info.menuItemId === "clearRecent") {
    // Clear recent names history
    chrome.storage.local.set({recentNames: []}, function() {
      // Show a notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'History Cleared',
        message: 'Recent names history has been cleared.'
      });
    });
  }
});