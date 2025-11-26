// Options page script
import { loadConfig, saveConfig, loadMessages } from './utils.js';

// Load saved settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
});

// Save button
document.getElementById('saveBtn').addEventListener('click', async () => {
  await saveSettings();
});

// Reset button
document.getElementById('resetBtn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    await resetSettings();
  }
});

// Load settings from storage
async function loadSettings() {
  try {
    const config = await loadConfig();
    const messages = await loadMessages();

    document.getElementById('targetUser').value = config.targetUser || '';
    document.getElementById('enabled').checked = config.enabled !== false;
    document.getElementById('autoRunOnStartup').checked = config.autoRunOnStartup !== false;
    document.getElementById('messages').value = JSON.stringify(messages, null, 2);

  } catch (error) {
    showStatus('Error loading settings: ' + error.message, 'error');
  }
}

// Save settings to storage
async function saveSettings() {
  try {
    // Validate target user
    const targetUser = document.getElementById('targetUser').value.trim();
    if (!targetUser) {
      showStatus('Please enter a target username', 'error');
      return;
    }

    // Validate and parse messages JSON
    const messagesText = document.getElementById('messages').value;
    let messages;
    try {
      messages = JSON.parse(messagesText);
    } catch (e) {
      showStatus('Invalid JSON format for messages. Please check your syntax.', 'error');
      return;
    }

    // Save config
    const config = {
      targetUser: targetUser,
      enabled: document.getElementById('enabled').checked,
      autoRunOnStartup: document.getElementById('autoRunOnStartup').checked
    };

    await chrome.storage.local.set({ 
      config: config,
      messages: messages
    });

    showStatus('✅ Settings saved successfully!', 'success');

  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
  }
}

// Reset to default settings
async function resetSettings() {
  try {
    // Load default config from file
    const configResponse = await fetch(chrome.runtime.getURL('config.json'));
    const defaultConfig = await configResponse.json();

    // Load default messages from file
    const messagesResponse = await fetch(chrome.runtime.getURL('messages.json'));
    const defaultMessages = await messagesResponse.json();

    // Clear storage and set defaults
    await chrome.storage.local.clear();
    await chrome.storage.local.set({
      config: defaultConfig,
      messages: defaultMessages
    });

    // Reload the form
    await loadSettings();
    showStatus('✅ Settings reset to defaults', 'success');

  } catch (error) {
    showStatus('Error resetting settings: ' + error.message, 'error');
  }
}

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.textContent = message;
  statusDiv.className = 'status-message ' + type;
  statusDiv.style.display = 'block';

  // Hide after 5 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 5000);
}
