# Product Requirements Document: TikTok Streak Saver - Critical Fixes

**Version:** 1.0  
**Date:** December 17, 2025  
**Status:** Draft  
**Priority:** P0 (Blocker for Production Release)

---

## Executive Summary

TikTok Streak Saver has a well-architected foundation but suffers from critical reliability issues that prevent it from functioning in production. This PRD outlines the essential fixes needed to make the extension production-ready.

**Key Problem:** The current DOM manipulation approach for typing messages into TikTok's DraftJS editor doesn't trigger React state updates, causing the send button to never activate.

**Impact:** 100% failure rate for automated message sending, making the extension non-functional.

---

## Problem Statement

### Current State
- Extension structure is solid (Manifest V3, proper permissions, good UX)
- Message input method bypasses React's state management
- Send button never activates because TikTok doesn't detect "real" input
- Users experience silent failures with no clear feedback

### Desired State
- Reliable message input that triggers TikTok's React state updates
- Send button consistently activates after text input
- Comprehensive error handling with clear user feedback
- Safe tab management that doesn't disrupt user workflow

---

## Critical Issues & Solutions

## 1. React State Management for Message Input

### Priority: P0 (Blocker)
### Component: `content.js` - `typeTextToDraftJS()` function

#### Problem
Current implementation directly manipulates DOM:
```javascript
offsetKeyDiv.innerHTML = '';
const span = document.createElement('span');
span.setAttribute('data-text', 'true');
span.textContent = text;
offsetKeyDiv.appendChild(span);
```

**Why it fails:**
- React doesn't detect DOM changes made outside its lifecycle
- TikTok's internal state remains "empty input"
- Send button conditional logic never triggers
- Events dispatched after DOM manipulation don't sync state

#### Solution Approach

**Strategy 1: ClipboardEvent Simulation (Primary)**
```javascript
async function typeTextToDraftJS(element, text) {
  // Focus the editor
  element.focus();
  await wait(500);
  
  // Create DataTransfer with text
  const dataTransfer = new DataTransfer();
  dataTransfer.setData('text/plain', text);
  
  // Dispatch paste event (triggers React onChange)
  const pasteEvent = new ClipboardEvent('paste', {
    bubbles: true,
    cancelable: true,
    clipboardData: dataTransfer
  });
  
  element.dispatchEvent(pasteEvent);
  await wait(300);
  
  // Verify content was set
  if (!element.textContent || !element.textContent.includes(text)) {
    // Fallback to Strategy 2
    return await fallbackInputMethod(element, text);
  }
  
  return true;
}
```

**Strategy 2: Direct Property + Events (Fallback)**
```javascript
async function fallbackInputMethod(element, text) {
  element.focus();
  await wait(300);
  
  // Set textContent directly
  element.textContent = text;
  
  // Dispatch comprehensive event sequence
  const events = [
    new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text,
      composed: true
    }),
    new InputEvent('input', {
      bubbles: true,
      cancelable: false,
      inputType: 'insertText',
      data: text,
      composed: true
    }),
    new KeyboardEvent('keyup', {
      bubbles: true,
      key: text.slice(-1),
      code: 'Key' + text.slice(-1).toUpperCase()
    }),
    new Event('change', { bubbles: true })
  ];
  
  for (const event of events) {
    element.dispatchEvent(event);
    await wait(50);
  }
  
  // Final verification
  await wait(500);
  return element.textContent.trim() === text.trim();
}
```

**Strategy 3: Character-by-Character Typing (Last Resort)**
```javascript
async function characterTypingMethod(element, text) {
  element.focus();
  await wait(300);
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Simulate real keypress
    element.dispatchEvent(new KeyboardEvent('keydown', {
      key: char,
      code: `Key${char.toUpperCase()}`,
      bubbles: true
    }));
    
    // Update content incrementally
    element.textContent += char;
    
    element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: char,
      composed: true
    }));
    
    element.dispatchEvent(new KeyboardEvent('keyup', {
      key: char,
      code: `Key${char.toUpperCase()}`,
      bubbles: true
    }));
    
    await wait(50); // Human-like typing speed
  }
  
  return true;
}
```

#### Success Criteria
- [ ] Text appears in message input
- [ ] TikTok's UI shows text as "typed" (not placeholder)
- [ ] Send button becomes active/clickable
- [ ] Character count updates (if visible)
- [ ] Works consistently across 10 consecutive tests

#### Testing Plan
1. Test on fresh TikTok session (logged out → log in)
2. Test with browser restart
3. Test with existing conversation open
4. Test with no recent conversations
5. Test with TikTok already open in another tab
6. Test with slow network connection (throttled)
7. Test each strategy independently
8. Measure success rate for each approach

---

## 2. Tab Management Safety

### Priority: P0 (Blocker)
### Component: `background.js` - `checkAndSendDailyMessage()`

#### Problem
Lines 116-129 auto-close tabs without safety checks:
```javascript
if (tabs.length === 0) {
  await chrome.tabs.remove(targetTab.id);
}
```

**Risks:**
- Closes tab while user is actively typing
- Interrupts if user navigated to TikTok during automation
- No verification message actually sent before closing

#### Solution

```javascript
// Enhanced tab closing logic
async function safeCloseTab(tabId, wasNewlyCreated) {
  if (!wasNewlyCreated) {
    console.log('Tab existed before automation, keeping it open');
    return false;
  }
  
  try {
    // Check if user has interacted with the tab
    const tab = await chrome.tabs.get(tabId);
    
    // Get tab's active state
    if (tab.active) {
      console.log('User switched to tab, keeping it open');
      return false;
    }
    
    // Check if tab URL changed (user navigated)
    if (!tab.url.includes('tiktok.com/messages')) {
      console.log('User navigated away, keeping tab open');
      return false;
    }
    
    // Safe to close
    console.log('Auto-closing tab created by extension');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Grace period
    await chrome.tabs.remove(tabId);
    return true;
    
  } catch (error) {
    console.error('Error checking tab state:', error);
    return false; // Keep open on error
  }
}

// Usage in checkAndSendDailyMessage
const wasNewlyCreated = tabs.length === 0;
const targetTab = wasNewlyCreated 
  ? await chrome.tabs.create({ url: 'https://www.tiktok.com/messages', active: false })
  : tabs[0];

// After successful send
if (response && response.success) {
  await safeCloseTab(targetTab.id, wasNewlyCreated);
}
```

#### Success Criteria
- [ ] Never closes user's existing tabs
- [ ] Never closes if user switched to the tab
- [ ] Never closes if user navigated within tab
- [ ] Closes only extension-created tabs
- [ ] Waits for message confirmation before closing

---

## 3. Pre-Flight Validation & Error Handling

### Priority: P0 (Blocker)
### Component: `content.js` - `sendTikTokMessage()`

#### Problem
No validation before attempting send:
- User might not be logged in
- Conversation might not exist
- Network might be down
- TikTok might be showing captcha/rate limit

#### Solution

```javascript
// Add pre-flight checks
async function preflightChecks() {
  console.log('Running pre-flight checks...');
  
  const checks = {
    loggedIn: false,
    messagesAccessible: false,
    notRateLimited: false,
    noCaptcha: false
  };
  
  // Check 1: User is logged in
  const loginButton = document.querySelector('[data-e2e="top-login-button"]');
  const profileButton = document.querySelector('[data-e2e="profile-icon"]');
  checks.loggedIn = !loginButton && !!profileButton;
  
  if (!checks.loggedIn) {
    throw new Error('NOT_LOGGED_IN: Please log into TikTok first');
  }
  
  // Check 2: Messages page is accessible
  const messagesContainer = await findElementBySelectors([
    '[data-e2e="im-inbox"]',
    'div[class*="Inbox"]',
    'div[class*="ConversationList"]'
  ], 5000);
  checks.messagesAccessible = !!messagesContainer;
  
  if (!checks.messagesAccessible) {
    throw new Error('MESSAGES_INACCESSIBLE: Cannot access messages page');
  }
  
  // Check 3: No rate limiting banner
  const rateLimitBanner = document.querySelector('[data-e2e="rate-limit-banner"]');
  const errorBanner = document.querySelector('div[class*="ErrorBanner"]');
  checks.notRateLimited = !rateLimitBanner && !errorBanner;
  
  if (!checks.notRateLimited) {
    throw new Error('RATE_LIMITED: TikTok is rate limiting. Try again later.');
  }
  
  // Check 4: No captcha present
  const captcha = document.querySelector('[data-e2e="captcha-verify"]');
  checks.noCaptcha = !captcha;
  
  if (!checks.noCaptcha) {
    throw new Error('CAPTCHA_REQUIRED: Please complete captcha verification');
  }
  
  console.log('✅ All pre-flight checks passed', checks);
  return checks;
}

// Integrate into sendTikTokMessage
async function sendTikTokMessage(targetUser, message) {
  try {
    // Run pre-flight checks first
    await preflightChecks();
    
    console.log(`Attempting to send message to ${targetUser}`);
    
    // ... rest of existing logic
    
  } catch (error) {
    // Enhanced error handling
    if (error.message.startsWith('NOT_LOGGED_IN')) {
      console.error('❌ User not logged in');
      throw new Error('Please log into TikTok at www.tiktok.com and try again');
    }
    
    if (error.message.startsWith('RATE_LIMITED')) {
      console.error('❌ Rate limited by TikTok');
      throw new Error('TikTok is rate limiting requests. Please wait 1 hour and try again.');
    }
    
    if (error.message.startsWith('CAPTCHA_REQUIRED')) {
      console.error('❌ Captcha verification needed');
      throw new Error('Please open TikTok, complete the captcha, and try again');
    }
    
    console.error('Error sending message:', error);
    throw error;
  }
}
```

#### Success Criteria
- [ ] Detects when user is not logged in
- [ ] Detects rate limiting before attempting send
- [ ] Detects captcha requirements
- [ ] Provides clear, actionable error messages
- [ ] Fails fast with helpful feedback

---

## 4. Conversation Existence Verification

### Priority: P0 (Blocker)
### Component: `content.js` - `findUserChatInList()`

#### Problem
- Function returns null after 20 attempts (10 seconds)
- No feedback to user about why it failed
- Doesn't distinguish between "conversation doesn't exist" vs "still loading"

#### Solution

```javascript
async function findUserChatInList(username) {
  const maxAttempts = 30; // Increased from 20
  let lastElementCount = 0;
  let stableCount = 0;
  
  console.log(`Searching for conversation with: ${username}`);
  
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Attempt ${i + 1}/${maxAttempts}`);
    
    // Check if list is still loading
    const loadingIndicator = document.querySelector('[data-e2e="loading-indicator"]');
    if (loadingIndicator) {
      console.log('Conversation list still loading...');
      await wait(1000);
      continue;
    }
    
    // Try multiple selector strategies
    const selectors = [
      'p[class*="PInfoNickname"]',
      'p[class*="Nickname"]',
      'span[class*="username"]',
      'div[data-e2e="conversation-item"] p',
      '[class*="ConversationItem"] [class*="name"]',
      'p[class*="nickname"]',
      'span[class*="Name"]'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      
      // Track if list is stable (not still loading)
      if (elements.length === lastElementCount) {
        stableCount++;
      } else {
        stableCount = 0;
        lastElementCount = elements.length;
      }
      
      if (elements.length > 0) {
        console.log(`Found ${elements.length} conversations with selector: ${selector}`);
        
        for (const element of elements) {
          const text = element.textContent.trim().toLowerCase();
          
          if (text === username.toLowerCase()) {
            console.log(`✅ Found matching conversation: ${text}`);
            
            // Find clickable parent
            const container = findClickableParent(element);
            if (container) {
              return container;
            }
          }
        }
      }
    }
    
    // If list has been stable for 5 attempts and no match, conversation doesn't exist
    if (stableCount >= 5) {
      console.error(`Conversation list is stable but no match for: ${username}`);
      throw new Error(
        `CONVERSATION_NOT_FOUND: No conversation found with username "${username}". ` +
        `Please send them a message manually first, then try again.`
      );
    }
    
    await wait(500);
  }
  
  throw new Error(
    `TIMEOUT: Could not find conversation with "${username}" after ${maxAttempts} attempts. ` +
    `The conversation may not exist or TikTok's UI may have changed.`
  );
}

// Helper function
function findClickableParent(element) {
  let parent = element;
  let depth = 0;
  
  while (parent && depth < 10) {
    if (parent.tagName === 'DIV' && 
        (parent.getAttribute('role') === 'button' || 
         parent.getAttribute('role') === 'link' ||
         parent.onclick ||
         parent.classList.toString().includes('Conversation') ||
         parent.classList.toString().includes('Item'))) {
      return parent;
    }
    parent = parent.parentElement;
    depth++;
  }
  
  // Fallback
  return element.closest('div[role="button"]') || 
         element.closest('div[role="link"]') ||
         element.closest('a');
}
```

#### Success Criteria
- [ ] Detects "still loading" state
- [ ] Distinguishes between "doesn't exist" vs "still loading"
- [ ] Provides specific error: "conversation not found"
- [ ] Suggests user action: "send manual message first"
- [ ] Doesn't timeout prematurely on slow connections

---

## 5. Configuration & First-Run Experience

### Priority: P1 (Critical)
### Component: `config.json`, `background.js`, `options.html`

#### Problem
- `config.json` has empty `targetUser: ""`
- Extension will fail immediately on first run
- No onboarding flow for new users

#### Solution

**A. Update config.json with better defaults**
```json
{
  "targetUser": "",
  "enabled": false,
  "autoRunOnStartup": true,
  "_comment": "Set targetUser and enabled:true in extension options before first use"
}
```

**B. Add first-run setup in background.js**
```javascript
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // First-time install - open options page
    chrome.runtime.openOptionsPage();
    
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Welcome to TikTok Streak Saver! 🎉',
      message: 'Please configure your target username in the options page that just opened.',
      priority: 2
    });
    
    // Don't run automation on first install
    return;
  }
  
  // Set up daily alarm
  chrome.alarms.create('dailyReset', {
    when: getNextMidnight(),
    periodInMinutes: 1440
  });
  
  // Only check on update, not install
  if (details.reason === 'update') {
    checkAndSendDailyMessage();
  }
});
```

**C. Add validation in checkAndSendDailyMessage**
```javascript
async function checkAndSendDailyMessage(force = false, retryCount = 0) {
  const MAX_RETRIES = 2;
  
  try {
    // Check if already run today
    const alreadyRun = await hasRunToday();
    if (alreadyRun && !force) {
      console.log('Message already sent today, skipping');
      return { success: true, reason: 'ALREADY_SENT_TODAY' };
    }

    // Load configuration
    const config = await loadConfig();
    
    // Validate configuration
    if (!config.targetUser || config.targetUser.trim() === '') {
      console.error('No target user configured');
      showNotification(
        '⚙️ Configuration Required',
        'Please set a target username in extension options'
      );
      return { success: false, reason: 'NO_TARGET_USER' };
    }
    
    if (config.enabled === false) {
      console.log('Extension is disabled in settings');
      return { success: false, reason: 'DISABLED' };
    }

    // ... rest of logic
```

#### Success Criteria
- [ ] Options page opens automatically on install
- [ ] Welcome notification explains next steps
- [ ] Extension doesn't attempt send without configuration
- [ ] Clear validation messages for missing config
- [ ] User knows exactly what to do first

---

## 6. Enhanced Error Feedback

### Priority: P1 (Critical)
### Component: `background.js` - notifications

#### Problem
Generic error messages don't help users troubleshoot:
- "Failed to send message"
- "Unknown error occurred"

#### Solution

```javascript
// Enhanced notification system with error codes
function showNotification(title, message, errorCode = null) {
  const notificationOptions = {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 2
  };
  
  // Add action buttons for specific errors
  if (errorCode) {
    notificationOptions.requireInteraction = true;
    
    if (errorCode === 'NOT_LOGGED_IN') {
      notificationOptions.buttons = [
        { title: 'Open TikTok' },
        { title: 'Dismiss' }
      ];
    } else if (errorCode === 'CONVERSATION_NOT_FOUND') {
      notificationOptions.buttons = [
        { title: 'Open Settings' },
        { title: 'Dismiss' }
      ];
    } else if (errorCode === 'RATE_LIMITED') {
      notificationOptions.buttons = [
        { title: 'Try Again Later' },
        { title: 'Dismiss' }
      ];
    }
  }
  
  chrome.notifications.create(errorCode || 'notification', notificationOptions);
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'NOT_LOGGED_IN' && buttonIndex === 0) {
    chrome.tabs.create({ url: 'https://www.tiktok.com' });
  } else if (notificationId === 'CONVERSATION_NOT_FOUND' && buttonIndex === 0) {
    chrome.runtime.openOptionsPage();
  }
  
  chrome.notifications.clear(notificationId);
});

// Enhanced error handling in checkAndSendDailyMessage
} catch (error) {
  console.error('Error:', error);
  
  let errorCode = null;
  let title = 'Failed to Send Message';
  let message = error.message || 'Unknown error occurred';
  
  // Parse error message for error codes
  if (error.message.includes('NOT_LOGGED_IN')) {
    errorCode = 'NOT_LOGGED_IN';
    title = '⚠️ Login Required';
    message = 'Please log into TikTok and try again';
  } else if (error.message.includes('CONVERSATION_NOT_FOUND')) {
    errorCode = 'CONVERSATION_NOT_FOUND';
    title = '❌ Conversation Not Found';
    message = `No conversation found with your target user. Send them a message manually first.`;
  } else if (error.message.includes('RATE_LIMITED')) {
    errorCode = 'RATE_LIMITED';
    title = '⏸️ Rate Limited';
    message = 'TikTok is rate limiting. Will try again tomorrow.';
  } else if (error.message.includes('CAPTCHA_REQUIRED')) {
    errorCode = 'CAPTCHA_REQUIRED';
    title = '🔐 Verification Needed';
    message = 'Please complete captcha on TikTok and try again';
  }
  
  showNotification(title, message, errorCode);
  
  // Only retry for transient errors
  if (retryCount < MAX_RETRIES && !['CONVERSATION_NOT_FOUND', 'NOT_LOGGED_IN'].includes(errorCode)) {
    console.log(`Retry ${retryCount + 1}/${MAX_RETRIES}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return checkAndSendDailyMessage(force, retryCount + 1);
  }
  
  return { success: false, error: message, errorCode };
}
```

#### Success Criteria
- [ ] Users understand exactly what went wrong
- [ ] Actionable steps provided for each error type
- [ ] Notification buttons open relevant pages
- [ ] No retries for non-transient errors
- [ ] Error codes logged for debugging

---

## Implementation Plan

### Phase 1: Core Functionality (P0)
**Timeline: Week 1**

1. **Day 1-2:** Implement new `typeTextToDraftJS()` with 3 strategies
   - ClipboardEvent method
   - Fallback input method
   - Character-by-character typing
   - Comprehensive testing

2. **Day 3:** Implement safe tab management
   - Track tab creation source
   - User interaction detection
   - Safe closing logic

3. **Day 4:** Add pre-flight checks
   - Login detection
   - Rate limit detection
   - Captcha detection
   - Messages accessibility check

4. **Day 5:** Enhanced conversation finding
   - Loading state detection
   - Stable list detection
   - Clear error messages

### Phase 2: User Experience (P1)
**Timeline: Week 2**

1. **Day 6:** First-run experience
   - Auto-open options on install
   - Welcome notification
   - Configuration validation

2. **Day 7:** Enhanced error feedback
   - Error code system
   - Notification buttons
   - User-friendly messages

3. **Day 8-9:** Testing & refinement
   - End-to-end testing
   - Error scenario testing
   - Performance optimization

4. **Day 10:** Documentation
   - Update README
   - Update QUICK_START
   - Create troubleshooting guide

---

## Testing Strategy

### Unit Testing
- [ ] Each input method tested independently
- [ ] Pre-flight checks tested with mocked DOM
- [ ] Error handling paths verified
- [ ] Configuration validation tested

### Integration Testing
- [ ] Full send flow (login → find → type → send)
- [ ] Retry logic with transient failures
- [ ] Tab management in various scenarios
- [ ] First-run experience

### Manual Testing Scenarios
1. **Happy Path**
   - Fresh browser start
   - Existing conversation
   - Successful send

2. **Error Scenarios**
   - Not logged in
   - Conversation doesn't exist
   - Rate limited
   - Captcha required
   - Network error

3. **Edge Cases**
   - User opens TikTok during automation
   - Multiple TikTok tabs open
   - Slow network connection
   - TikTok UI changes mid-operation

4. **User Experience**
   - First install
   - Update from previous version
   - Configuration change
   - Manual send from popup

### Success Metrics
- [ ] 95%+ success rate for automated sends
- [ ] < 5% false positive error rate
- [ ] 0% tab closure when user active
- [ ] 100% of errors have actionable messages
- [ ] < 30 seconds average send time

---

## Risk Assessment

### High Risk
1. **TikTok UI Changes**
   - **Mitigation:** Multiple selector strategies, quarterly testing
   - **Fallback:** User notification with manual option

2. **React State Sync**
   - **Mitigation:** 3-tier input strategy with fallbacks
   - **Fallback:** Manual send button in popup

### Medium Risk
1. **Rate Limiting**
   - **Mitigation:** Daily limit (1 message/day), exponential backoff
   - **Fallback:** Clear error message, retry next day

2. **Authentication State**
   - **Mitigation:** Pre-flight login check
   - **Fallback:** Open TikTok login page

### Low Risk
1. **Browser Updates**
   - **Mitigation:** Use standard web APIs, test on Chrome Canary
   
2. **Permission Changes**
   - **Mitigation:** Minimal permissions, follow Manifest V3 best practices

---

## Definition of Done

### For Each Fix
- [ ] Code implemented and reviewed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Error messages are user-friendly
- [ ] Console logs are informative
- [ ] Performance is acceptable (< 30s)
- [ ] Documentation updated

### For Overall Release
- [ ] All P0 fixes implemented
- [ ] All P1 fixes implemented
- [ ] 95%+ success rate in testing
- [ ] Zero critical bugs
- [ ] User documentation complete
- [ ] Privacy policy created
- [ ] Store assets prepared
- [ ] Code reviewed and approved

---

## Open Questions

1. Should we add telemetry to track success/failure rates?
2. Should we implement a "test mode" that doesn't actually send messages?
3. Should we add retry scheduling (e.g., try again in 1 hour)?
4. Should we support multiple target users with rotation?
5. Should we add a "verify configuration" button in options?

---

## Appendix

### Related Documents
- `CHECKLIST.md` - Development checklist
- `PROJECT_OVERVIEW.md` - Architecture overview
- `QUICK_START.md` - User guide
- `.github/instructions/extension.instructions.md` - Implementation guide

### Change Log
- 2025-12-17: Initial PRD created

### Reviewers
- [ ] Technical Lead
- [ ] Product Manager
- [ ] QA Lead
- [ ] UX Designer

