document.addEventListener('DOMContentLoaded', function() {
  // UI Elements
  const tabNameInput = document.getElementById('tabName');
  const saveButton = document.getElementById('saveButton');
  const resetButton = document.getElementById('resetButton');
  const savedNamesContainer = document.getElementById('savedNames');
  const emptyState = document.getElementById('emptyState');
  const currentTabInfo = document.getElementById('currentTabInfo');
  const recentCountBadge = document.getElementById('recentCount');
  const themeToggle = document.getElementById('themeToggle');
  
  // State variables
  let currentTabId;
  let originalTitle;
  let isDarkMode = false;
  
  // Initialize the UI
  initializeUI();
  
  // Get the current tab
  function getCurrentTab() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      currentTabId = currentTab.id;
      
      // Update current tab info
      currentTabInfo.textContent = `Current Tab: ${currentTab.title.length > 30 ? 
                                  currentTab.title.substring(0, 30) + '...' : 
                                  currentTab.title}`;
      
      // Check if this tab has a custom name
      chrome.storage.local.get(['tabNames'], function(result) {
        const tabNames = result.tabNames || {};
        
        if (tabNames[currentTabId]) {
          if (tabNames[currentTabId].customName) {
            tabNameInput.value = tabNames[currentTabId].customName;
            
            // Add visual indication that this tab has a custom name
            currentTabInfo.innerHTML = `<i class="fas fa-check-circle" style="color: #38b000;"></i> Custom name applied`;
          }
          
          originalTitle = tabNames[currentTabId].originalName;
        } else {
          // Store the original title if not already stored
          originalTitle = currentTab.title;
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
  }
  
  // Save button click handler
  saveButton.addEventListener('click', function() {
    const newName = tabNameInput.value.trim();
    if (newName) {
      // Show saving animation
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving';
      saveButton.disabled = true;
      
      chrome.tabs.sendMessage(currentTabId, {
        action: "rename",
        title: newName
      }, function(response) {
        // Update UI after saving
        setTimeout(() => {
          saveButton.innerHTML = '<i class="fas fa-check"></i> Saved!';
          
          setTimeout(() => {
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save';
            saveButton.disabled = false;
          }, 1000);
          
          // Update current tab info
          currentTabInfo.innerHTML = `<i class="fas fa-check-circle" style="color: #38b000;"></i> Custom name applied`;
        }, 500);
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
        
        chrome.storage.local.set({tabNames: tabNames});
      });
      
      // Add to recent names
      addToRecentNames(newName);
    } else {
      // Show error for empty input
      tabNameInput.style.boxShadow = '0 0 0 2px rgba(208, 0, 0, 0.3)';
      tabNameInput.placeholder = 'Please enter a name';
      
      setTimeout(() => {
        tabNameInput.style.boxShadow = '';
        tabNameInput.placeholder = 'Enter new tab name';
      }, 2000);
    }
  });
  
  // Reset button click handler
  resetButton.addEventListener('click', function() {
    // Show reset animation
    resetButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting';
    resetButton.disabled = true;
    
    chrome.tabs.sendMessage(currentTabId, {
      action: "reset"
    }, function(response) {
      // Update UI after resetting
      setTimeout(() => {
        resetButton.innerHTML = '<i class="fas fa-check"></i> Reset!';
        
        setTimeout(() => {
          resetButton.innerHTML = '<i class="fas fa-undo"></i> Reset';
          resetButton.disabled = false;
          
          // Update current tab info
          currentTabInfo.textContent = `Current Tab: ${originalTitle.length > 30 ? 
                                      originalTitle.substring(0, 30) + '...' : 
                                      originalTitle}`;
        }, 1000);
      }, 500);
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
      
      // Keep only the 10 most recent
      if (recentNames.length > 10) {
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
      
      // Update the counter
      recentCountBadge.textContent = recentNames.length > 0 ? 
                                   `(${recentNames.length})` : '';
      
      // Show empty state if no recent names
      if (recentNames.length === 0) {
        emptyState.style.display = 'flex';
        return;
      } else {
        emptyState.style.display = 'none';
      }
      
      // Clear current list except empty state
      const items = savedNamesContainer.querySelectorAll('.recent-item');
      items.forEach(item => item.remove());
      
      // Add each recent name with staggered animation delay
      recentNames.forEach((name, index) => {
        const delay = index * 50; // Staggered animation
        
        const div = document.createElement('div');
        div.className = 'recent-item';
        div.style.animationDelay = `${delay}ms`;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'recent-name';
        nameSpan.textContent = name;
        nameSpan.title = name; // For tooltip on hover
        nameSpan.addEventListener('click', function() {
          tabNameInput.value = name;
          // Add focus effect
          tabNameInput.focus();
        });
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'recent-actions';
        
        // Use button
        const useButton = document.createElement('button');
        useButton.className = 'action-btn use-btn';
        useButton.title = 'Use this name';
        useButton.innerHTML = '<i class="fas fa-check"></i>';
        useButton.addEventListener('click', function() {
          tabNameInput.value = name;
          saveButton.click();
        });
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'action-btn delete-btn';
        deleteButton.title = 'Remove from history';
        deleteButton.innerHTML = '<i class="fas fa-times"></i>';
        deleteButton.addEventListener('click', function() {
          // Remove from storage
          chrome.storage.local.get(['recentNames'], function(result) {
            const recentNames = result.recentNames || [];
            const index = recentNames.indexOf(name);
            if (index > -1) {
              recentNames.splice(index, 1);
              chrome.storage.local.set({recentNames: recentNames}, function() {
                // Animate removal
                div.style.transform = 'translateX(100%)';
                div.style.opacity = '0';
                setTimeout(() => {
                  loadSavedNames();
                }, 300);
              });
            }
          });
        });
        
        actionsDiv.appendChild(useButton);
        actionsDiv.appendChild(deleteButton);
        
        div.appendChild(nameSpan);
        div.appendChild(actionsDiv);
        savedNamesContainer.appendChild(div);
      });
    });
  }
  
  // Handle input keypress (Enter key)
  tabNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveButton.click();
    }
  });
  
  // Theme toggle
  themeToggle.addEventListener('click', function() {
    toggleTheme();
  });
  
  // Toggle between light and dark theme
  function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // Save theme preference
    chrome.storage.local.set({darkMode: isDarkMode});
  }
  
  // Initialize UI
  function initializeUI() {
    // Load saved theme preference
    chrome.storage.local.get(['darkMode'], function(result) {
      if (result.darkMode) {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      }
    });
    
    // Get current tab
    getCurrentTab();
    
    // Focus input field
    setTimeout(() => {
      tabNameInput.focus();
    }, 200);
  }
});