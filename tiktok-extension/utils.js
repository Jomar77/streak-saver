// Utility functions for TikTok Streak Saver

// Check if message has been sent today
export async function hasRunToday() {
  const data = await chrome.storage.local.get(['lastRunDate']);
  const today = new Date().toDateString();
  return data.lastRunDate === today;
}

// Mark that message was sent today
export async function markRunToday() {
  const today = new Date().toDateString();
  await chrome.storage.local.set({ lastRunDate: today });
}

// Load configuration
export async function loadConfig() {
  try {
    const data = await chrome.storage.local.get(['config']);
    if (data.config) {
      return data.config;
    }
    
    // Load default config from file
    const response = await fetch(chrome.runtime.getURL('config.json'));
    const config = await response.json();
    
    // Save to storage for future use
    await chrome.storage.local.set({ config: config });
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    return { targetUser: '', enabled: true };
  }
}

// Save configuration
export async function saveConfig(config) {
  await chrome.storage.local.set({ config: config });
}

// Load messages from file
export async function loadMessages() {
  try {
    const data = await chrome.storage.local.get(['messages']);
    if (data.messages) {
      return data.messages;
    }
    
    // Load from file
    const response = await fetch(chrome.runtime.getURL('messages.json'));
    const messages = await response.json();
    
    // Save to storage
    await chrome.storage.local.set({ messages: messages });
    return messages;
  } catch (error) {
    console.error('Error loading messages:', error);
    return {
      default: ['Hey! Hope you\'re having a great day! 😊']
    };
  }
}

// Get random message for current day
export async function getDailyMessage() {
  const messages = await loadMessages();
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  const messagePool = messages[dayOfWeek] || messages.default || ['Hello!'];
  const randomIndex = Math.floor(Math.random() * messagePool.length);
  
  return messagePool[randomIndex];
}

// Format date for display
export function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
