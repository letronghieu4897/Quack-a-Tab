# Chrome Tab Renamer Extension

A Chrome extension that allows you to rename browser tabs for better organization and workflow management.

## Features

- Rename any browser tab with a custom title
- Reset tab names to their original titles
- Saves recently used names for quick reuse
- Custom names persist during page refreshes
- Names are automatically cleared when tabs are closed

## How It Works

The extension temporarily modifies the document.title property of web pages to display custom names in your browser tabs. While Chrome doesn't allow complete tab title replacement through its API, this extension uses a content script to modify the page title, which affects how the tab appears in your browser.

## Setup Instructions

### Installation from Source

1. Clone or download this repository to your local machine
2. Open Google Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files
5. The Tab Renamer extension should now appear in your extensions list

### Using the Extension

1. Click the Tab Renamer icon in your browser toolbar
2. Enter a new name for the current tab in the input field
3. Click "Save" to apply the new name
4. To revert to the original name, click "Reset to Original"
5. Previously used names appear in the "Recent Names" section for quick reuse

## Project Structure

- `manifest.json` - Extension configuration and metadata
- `popup.html` - The UI for the extension popup
- `popup.js` - Handles user interactions and storage management
- `content.js` - Content script that modifies page titles
- `background.js` - Background script that manages tab events and cleanup
- `icons/` - Directory containing extension icons

## Technical Details

The extension uses:
- Chrome's storage API to persist custom tab names
- Content scripts to modify the page title
- Background scripts to monitor tab events and clean up when tabs are closed
- Message passing between components for communication

## Limitations

- The extension can only modify the title as it appears in the browser tab
- It cannot change the page's URL or other browser UI elements
- Custom names are reset when navigating to a new URL within the same tab

## Privacy Policy

### Data Collection
Tab Renamer does not collect, transmit, or share any personal data. All the information used by the extension is stored locally on your device using Chrome's storage API and is never sent to external servers.

### Information Usage
- The extension stores tab names and your recently used custom names locally on your device.
- This information is used solely to provide the tab renaming functionality.
- No analytics, tracking, or fingerprinting technologies are used.

### Permissions
Tab Renamer requires the following permissions:
- **tabs**: To access and modify the titles of browser tabs.
- **storage**: To save your custom tab names and recent names locally.

### Data Retention
- All data is stored locally on your device.
- Tab name data is automatically deleted when you close a tab.
- Recent names history persists until you uninstall the extension.

### Updates to Policy
If there are material changes to this Privacy Policy, users will be notified through an extension update.

### Contact
If you have any questions about this Privacy Policy, please create an issue in the repository.

## License

This project is open source and available for personal and commercial use. 