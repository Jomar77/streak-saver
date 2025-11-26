// Popup script
import { loadConfig, hasRunToday, getDailyMessage } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadPopupData();
  setupEventListeners();
});

async function loadPopupData() {
  try {
    const config = await loadConfig();
    const hasRun = await hasRunToday();
    const data = await chrome.storage.local.get(['lastRunDate']);

    // Hide loading, show content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    // Update UI based on status
    if (hasRun) {
      document.getElementById('statusIcon').textContent = '✅';
      document.getElementById('statusText').textContent = 'Message sent today!';
      document.getElementById('statusDetail').textContent = 'Your streak is safe 🔥';
    } else {
      document.getElementById('statusIcon').textContent = '⏳';
      document.getElementById('statusText').textContent = 'No message sent yet';
      document.getElementById('statusDetail').textContent = 'Waiting for next Chrome startup';
    }

    // Update info
    document.getElementById('targetUser').textContent = config.targetUser || 'Not configured';
    document.getElementById('enabledStatus').textContent = config.enabled ? '✅ Enabled' : '❌ Disabled';
    document.getElementById('lastRun').textContent = data.lastRunDate || 'Never';

    // Enable/disable send button based on config
    const sendBtn = document.getElementById('sendNowBtn');
    if (!config.targetUser) {
      sendBtn.disabled = true;
      sendBtn.textContent = '⚠️ Configure Settings First';
    }

  } catch (error) {
    console.error('Error loading popup data:', error);
    showError('Failed to load data');
  }
}

function setupEventListeners() {
  // Send now button
  document.getElementById('sendNowBtn').addEventListener('click', async () => {
    const btn = document.getElementById('sendNowBtn');
    const originalText = btn.innerHTML;
    
    try {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span><span>Sending...</span>';

      // Send message to background script
      await chrome.runtime.sendMessage({ action: 'sendMessageNow' });

      // Show success feedback
      btn.innerHTML = '<span>✅</span><span>Sent!</span>';
      
      setTimeout(async () => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        await loadPopupData(); // Refresh status
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      btn.innerHTML = '<span>❌</span><span>Failed</span>';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2000);
    }
  });

  // Options button
  document.getElementById('optionsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Help link
  document.getElementById('helpLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ 
      url: 'https://github.com/Jomar77/streak-saver#readme'
    });
  });
}

function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  document.getElementById('statusIcon').textContent = '❌';
  document.getElementById('statusText').textContent = 'Error';
  document.getElementById('statusDetail').textContent = message;
}
