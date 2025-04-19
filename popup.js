document.addEventListener('DOMContentLoaded', function() {
    const tabNameInput = document.getElementById('tabName');
    const saveButton = document.getElementById('saveButton');
    const resetButton = document.getElementById('resetButton');
    const savedNamesDiv = document.getElementById('savedNames');
    
    let currentTabId;
    let originalTitle;
    
    // Get the current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      currentTabId = tabs[0].id;
      
      // Pre-fill the input with the current custom name if it exists
      chrome.storage.local.get(['tabNames'], function(result) {
        const tabNames = result.tabNames || {};
        if (tabNames[currentTabId]) {
          tabNameInput.value = tabNames[currentTabId].customName;
          originalTitle = tabNames[currentTabId].originalName;
        } else {
          // Store the original title if not already stored
          originalTitle = tabs[0].title;
          chrome.storage.local.get(['tabNames'], function(result) {
            const tabNames = result.tabNames || {};
            tabNames[currentTabId] = {
              originalName: originalTitle,
              customName: ''
            };
            chrome.storage.local.set({tabNames: tabNames});
          });
        }
      });
      
      // Load recent names
      loadSavedNames();
    });
    
    // Save button click handler
    saveButton.addEventListener('click', function() {
      const newName = tabNameInput.value.trim();
      if (newName) {
        chrome.tabs.sendMessage(currentTabId, {
          action: "rename",
          title: newName
        });
        
        // Save to storage
        chrome.storage.local.get(['tabNames'], function(result) {
          const tabNames = result.tabNames || {};
          
          if (!tabNames[currentTabId]) {
            tabNames[currentTabId] = {
              originalName: originalTitle,
              customName: newName
            };
          } else {
            tabNames[currentTabId].customName = newName;
          }
          
          chrome.storage.local.set({tabNames: tabNames}, function() {
            // Update saved names list
            loadSavedNames();
          });
        });
        
        // Also add to recent names for reuse
        addToRecentNames(newName);
      }
    });
    
    // Reset button click handler
    resetButton.addEventListener('click', function() {
      chrome.tabs.sendMessage(currentTabId, {
        action: "reset"
      });
      
      chrome.storage.local.get(['tabNames'], function(result) {
        const tabNames = result.tabNames || {};
        if (tabNames[currentTabId]) {
          tabNames[currentTabId].customName = '';
          chrome.storage.local.set({tabNames: tabNames});
        }
      });
      
      tabNameInput.value = '';
    });
    
    // Add to recent names
    function addToRecentNames(name) {
      chrome.storage.local.get(['recentNames'], function(result) {
        const recentNames = result.recentNames || [];
        
        // Remove if already exists
        const index = recentNames.indexOf(name);
        if (index > -1) {
          recentNames.splice(index, 1);
        }
        
        // Add to beginning
        recentNames.unshift(name);
        
        // Keep only the 5 most recent
        if (recentNames.length > 5) {
          recentNames.pop();
        }
        
        chrome.storage.local.set({recentNames: recentNames}, function() {
          loadSavedNames();
        });
      });
    }
    
    // Load saved names
    function loadSavedNames() {
      chrome.storage.local.get(['recentNames'], function(result) {
        const recentNames = result.recentNames || [];
        
        // Clear current list
        while (savedNamesDiv.children.length > 1) {
          savedNamesDiv.removeChild(savedNamesDiv.lastChild);
        }
        
        // Add each recent name
        recentNames.forEach(name => {
          const div = document.createElement('div');
          div.className = 'saved-name';
          
          const nameSpan = document.createElement('span');
          nameSpan.textContent = name;
          nameSpan.style.cursor = 'pointer';
          nameSpan.addEventListener('click', function() {
            tabNameInput.value = name;
          });
          
          const useButton = document.createElement('button');
          useButton.textContent = 'Use';
          useButton.addEventListener('click', function() {
            tabNameInput.value = name;
            saveButton.click();
          });
          
          div.appendChild(nameSpan);
          div.appendChild(useButton);
          savedNamesDiv.appendChild(div);
        });
      });
    }
  });