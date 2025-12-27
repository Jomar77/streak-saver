// Background service worker for TikTok Streak Saver
import { hasRunToday, markRunToday, getDailyMessage, loadConfig } from './utils.js';

// Helper function to wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run on browser startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started, checking if message needs to be sent');
  checkAndSendDailyMessage();
});

// Run when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  
  // Set up daily alarm at midnight to reset the flag
  chrome.alarms.create('dailyReset', {
    when: getNextMidnight(),
    periodInMinutes: 1440 // 24 hours
  });
  
  // Check if we need to send message on install
  if (details.reason === 'install') {
    checkAndSendDailyMessage();
  }
});

// Listen for alarm to reset daily flag
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    console.log('Daily reset triggered');
    // The next browser startup will trigger a new message
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'messageSent') {
    handleMessageSent(request.success, request.error);
    sendResponse({ received: true });
  } else if (request.action === 'checkStatus') {
    hasRunToday().then(hasRun => {
      sendResponse({ hasRunToday: hasRun });
    });
    return true; // Will respond asynchronously
  } else if (request.action === 'sendMessageNow') {
    // Manual trigger from popup
    checkAndSendDailyMessage(true);
    sendResponse({ started: true });
  }
});

// Main function to check and send daily message
async function checkAndSendDailyMessage(force = false, retryCount = 0) {
  const MAX_RETRIES = 2;
  
  try {
    // Check if already run today
    const alreadyRun = await hasRunToday();
    if (alreadyRun && !force) {
      console.log('Message already sent today, skipping');
      return;
    }

    // Load configuration
    const config = await loadConfig();
    if (!config.targetUser) {
      console.error('No target user configured');
      showNotification('Configuration Error', 'Please set a target user in extension options');
      return;
    }

    if (!config.enabled) {
      console.log('Extension is disabled in settings');
      return;
    }

    // Get today's message
    const message = await getDailyMessage();
    console.log(`Preparing to send message to ${config.targetUser}: "${message}"`);
    
    // Find or open TikTok messages tab
    const tabs = await chrome.tabs.query({ url: 'https://www.tiktok.com/*' });
    
    let targetTab;
    let createdNewTab = false;
    
    if (tabs.length > 0) {
      // Use existing TikTok tab
      targetTab = tabs[0];
      console.log('Found existing TikTok tab:', targetTab.id);
      
      // Navigate to messages if not already there
      if (!targetTab.url.includes('/messages')) {
        await chrome.tabs.update(targetTab.id, { url: 'https://www.tiktok.com/messages' });
      }
    } else {
      // Open new TikTok tab in background
      console.log('Opening new TikTok tab...');
      targetTab = await chrome.tabs.create({ 
        url: 'https://www.tiktok.com/messages',
        active: false 
      });
      createdNewTab = true;
    }

    // Wait for tab to fully load
    console.log('Waiting for tab to load...');
    await waitForTabLoad(targetTab.id);
    
    // Additional wait for TikTok's JS to initialize
    await wait(3000);

    // Ensure content script is injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        files: ['content.js']
      });
      console.log('Content script injected');
    } catch (e) {
      // Content script might already be loaded, that's fine
      console.log('Content script injection skipped (may already be loaded):', e.message);
    }
    
    // Wait a bit after injection
    await wait(1000);

    // Send message with timeout
    console.log('Sending message command to content script...');
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for response (60s)'));
      }, 60000); // 60 second timeout
      
      chrome.tabs.sendMessage(targetTab.id, {
        action: 'sendMessage',
        targetUser: config.targetUser,
        message: message
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!response) {
          reject(new Error('No response from content script'));
        } else {
          resolve(response);
        }
      });
    });
    
    // Handle response
    if (response && response.success) {
      console.log('Message sent successfully!');
      await markRunToday();
      showNotification('Message Sent! ✅', `Sent to ${config.targetUser}: "${message}"`);
      
      // Close tab if we created a new one
      if (createdNewTab) {
        console.log('Closing auto-created tab...');
        await wait(2000);
        try {
          await chrome.tabs.remove(targetTab.id);
          console.log('Tab closed');
        } catch (e) {
          console.log('Could not close tab:', e.message);
        }
      }
    } else if (!response.success && retryCount < MAX_RETRIES) {
      console.log(`Message failed, retry ${retryCount + 1}/${MAX_RETRIES}...`);
      console.log('Error:', response.error);
      await wait(5000);
      return checkAndSendDailyMessage(force, retryCount + 1);
    } else {
      throw new Error(response.error || 'Unknown error');
    }

  } catch (error) {
    console.error('Error in checkAndSendDailyMessage:', error.message);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying after error ${retryCount + 1}/${MAX_RETRIES}...`);
      await wait(5000);
      return checkAndSendDailyMessage(force, retryCount + 1);
    }
    
    console.error('All retries failed:', error);
    showNotification('Failed to Send', `Could not send message after ${MAX_RETRIES + 1} attempts. Error: ${error.message}`);
  }
}

// Wait for a tab to finish loading
function waitForTabLoad(tabId, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkTab = async () => {
      try {
        const tab = await chrome.tabs.get(tabId);
        
        if (tab.status === 'complete') {
          resolve(tab);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Tab load timeout'));
        } else {
          setTimeout(checkTab, 500);
        }
      } catch (e) {
        reject(e);
      }
    };
    
    checkTab();
  });
}

// Handle message sent confirmation
async function handleMessageSent(success, error) {
  if (success) {
    console.log('Message confirmed sent by content script');
    // Note: markRunToday is now called in checkAndSendDailyMessage for better flow control
  } else {
    console.error('Content script reported failure:', error);
  }
}

// Show notification to user
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 2
  });
}

// Get timestamp for next midnight
function getNextMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}
