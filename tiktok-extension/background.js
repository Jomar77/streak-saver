// Background service worker for TikTok Streak Saver
import { hasRunToday, markRunToday, getDailyMessage, loadConfig } from './utils.js';

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
async function checkAndSendDailyMessage(force = false) {
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

    // Get today's message
    const message = await getDailyMessage();
    
    // Find or open TikTok messages tab
    const tabs = await chrome.tabs.query({ url: 'https://www.tiktok.com/*' });
    
    let targetTab;
    if (tabs.length > 0) {
      // Use existing TikTok tab
      targetTab = tabs[0];
      await chrome.tabs.update(targetTab.id, { active: false }); // Keep it in background
    } else {
      // Open new TikTok tab in background
      targetTab = await chrome.tabs.create({ 
        url: 'https://www.tiktok.com/messages',
        active: false 
      });
    }

    // Wait for tab to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Send message to content script to perform the action
    chrome.tabs.sendMessage(targetTab.id, {
      action: 'sendMessage',
      targetUser: config.targetUser,
      message: message
    });

  } catch (error) {
    console.error('Error in checkAndSendDailyMessage:', error);
    showNotification('Error', 'Failed to send message: ' + error.message);
  }
}

// Handle message sent confirmation
async function handleMessageSent(success, error) {
  if (success) {
    await markRunToday();
    showNotification('Message Sent! ✅', 'Your daily TikTok message was sent successfully');
    console.log('Message sent successfully');
  } else {
    showNotification('Failed to Send Message', error || 'Unknown error occurred');
    console.error('Failed to send message:', error);
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
