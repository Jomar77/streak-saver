---
applyTo: '**'
---
# TikTok Streak Saver - Implementation Plan

Based on your clarifications, here's a comprehensive plan to fix the core issue (message input not triggering TikTok's send button) and complete your extension:

## Core Problem Analysis

The main issue is that TikTok's DraftJS editor isn't recognizing your typed text as "real" input. The errors show:
- Text appears as placeholder only
- Send button never activates
- React errors from DOM manipulation conflicts

## Implementation Plan

### **Phase 1: Fix the Message Input (Priority)**

**Problem**: `document.execCommand('insertText')` doesn't trigger TikTok's React state updates properly.

**Solution**: Use proper React event simulation and state manipulation:

```javascript
// Replace typeTextToContentEditable function
async function typeTextToContentEditable(element, text) {
  console.log('Setting text using React-compatible method');
  
  // Method 1: Direct property manipulation (try first)
  element.focus();
  await wait(500);
  
  // Set the text content directly
  element.textContent = text;
  
  // Trigger React's synthetic events in correct order
  const inputEvent = new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text,
    composed: true
  });
  
  element.dispatchEvent(inputEvent);
  
  // Also trigger keyup to ensure React detects change
  const keyupEvent = new KeyboardEvent('keyup', {
    bubbles: true,
    cancelable: true,
    key: 'a',
    code: 'KeyA'
  });
  
  element.dispatchEvent(keyupEvent);
  
  // If Method 1 fails, try Method 2: Paste event
  if (!element.textContent || element.textContent !== text) {
    console.log('Trying paste method...');
    
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);
    
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dataTransfer
    });
    
    element.dispatchEvent(pasteEvent);
    
    // Manually insert if paste blocked
    if (!element.textContent.includes(text)) {
      element.innerHTML = `<div>${text}</div>`;
      element.dispatchEvent(inputEvent);
    }
  }
  
  await wait(500);
  console.log('Text input complete, content:', element.textContent);
}
```

### **Phase 2: Improve Conversation Finding**

**Issue**: `querySelectorAll('p[class*="PInfoNickname"]')` returns 0 items initially.

**Fix**: Add better selectors and wait logic:

```javascript
async function findUserChatInList(username) {
  const maxAttempts = 20;
  
  // Wait for conversations to load
  await wait(2000);
  
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Searching for user: ${username} (attempt ${i + 1}/${maxAttempts})`);
    
    // Try multiple selector strategies
    const selectors = [
      'p[class*="PInfoNickname"]',
      'p[class*="Nickname"]',
      'span[class*="username"]',
      'div[data-e2e="conversation-item"] p',
      '[class*="ConversationItem"] [class*="name"]'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      
      if (elements.length > 0) {
        console.log(`Found ${elements.length} items with selector: ${selector}`);
        
        for (const element of elements) {
          const text = element.textContent.trim().toLowerCase();
          
          if (text === username.toLowerCase()) {
            console.log(`✅ Match found: ${text}`);
            
            // Find clickable parent
            let parent = element;
            for (let depth = 0; depth < 8; depth++) {
              parent = parent.parentElement;
              if (!parent) break;
              
              if (parent.onclick || 
                  parent.getAttribute('role') === 'button' ||
                  parent.tagName === 'A') {
                console.log(`Found clickable at depth ${depth}`);
                return parent;
              }
            }
          }
        }
      }
    }
    
    await wait(800);
  }
  
  return null;
}
```

### **Phase 3: Enhanced Send Button Detection**

**Add fallback detection methods**:

```javascript
async function findSendButtonSVG() {
  const maxAttempts = 15;
  
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Looking for send button (attempt ${i + 1}/${maxAttempts})`);
    
    // Strategy 1: data-e2e attribute
    let button = document.querySelector('svg[data-e2e="message-send"]');
    if (button) {
      return button.closest('button') || button.parentElement;
    }
    
    // Strategy 2: aria-label
    button = document.querySelector('button[aria-label*="Send"]');
    if (button && !button.disabled) {
      return button;
    }
    
    // Strategy 3: Check if input has content & look for any nearby button
    const messageInput = await findMessageInput();
    if (messageInput && messageInput.textContent.trim().length > 0) {
      // Look for buttons near the input
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const svg = btn.querySelector('svg');
        const rect = btn.getBoundingClientRect();
        
        // Check if button is visible and near bottom-right
        if (svg && rect.width > 20 && rect.height > 20 && 
            rect.bottom > window.innerHeight - 200) {
          console.log('Found potential send button by proximity');
          return btn;
        }
      }
    }
    
    await wait(500);
  }
  
  return null;
}
```

### **Phase 4: System Architecture**

Your current architecture is solid. Key flow:

```
1. Chrome Startup (if not sent today)
   ↓
2. background.js triggers checkAndSendDailyMessage()
   ↓
3. Opens/finds TikTok tab (background)
   ↓
4. Injects content.js
   ↓
5. Sends message via chrome.tabs.sendMessage()
   ↓
6. content.js navigates & automates
   ↓
7. Confirms back to background.js
   ↓
8. Marks as sent today
```

### **Phase 5: Add Retry Logic & Error Handling**

```javascript
// In background.js
async function checkAndSendDailyMessage(force = false, retryCount = 0) {
  const MAX_RETRIES = 2;
  
  try {
    // ... existing code ...
    
    // Send message with timeout
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for response'));
      }, 60000); // 60 second timeout
      
      chrome.tabs.sendMessage(targetTab.id, {
        action: 'sendMessage',
        targetUser: config.targetUser,
        message: message
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (!response.success && retryCount < MAX_RETRIES) {
      console.log(`Retry ${retryCount + 1}/${MAX_RETRIES}`);
      await wait(5000);
      return checkAndSendDailyMessage(force, retryCount + 1);
    }
    
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      return checkAndSendDailyMessage(force, retryCount + 1);
    }
    console.error('All retries failed:', error);
    showNotification('Failed', 'Could not send message after retries');
  }
}
```

### **Phase 6: Testing Checklist**

1. ✅ Test on fresh TikTok session
2. ✅ Test with existing open conversation
3. ✅ Test with conversation not in recent list
4. ✅ Test Chrome restart behavior
5. ✅ Test "already sent today" logic
6. ✅ Test manual send from popup
7. ✅ Verify notification appears
8. ✅ Check console logs for errors

### **Phase 7: Manifest & Permissions**

Ensure your `manifest.json` has:

```json
{
  "manifest_version": 3,
  "permissions": [
    "storage",
    "alarms",
    "notifications",
    "tabs"
  ],
  "host_permissions": [
    "https://www.tiktok.com/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [{
    "matches": ["https://www.tiktok.com/*"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }]
}
```

## Priority Actions

**Immediate (to fix sending)**:
1. Replace `typeTextToContentEditable` with React-compatible version
2. Add paste event fallback
3. Test if send button activates after new input method

**If still blocked**:
4. Consider using Chrome DevTools Protocol to bypass React detection
5. Or add manual "click send" prompt for user

Would you like me to create a complete, updated `content.js` file with all these fixes integrated?