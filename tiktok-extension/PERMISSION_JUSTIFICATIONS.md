# Chrome Web Store Permission Justifications

## Extension: TikTok Streak Saver

### Single Purpose Statement
Automatically sends a daily message to a specified TikTok contact to maintain chat streaks, ensuring users never accidentally lose their TikTok relationship streaks due to busy schedules or forgetfulness.

---

## Permission Justifications (for Chrome Web Store Submission Form)

### **Storage Permission**
**Justification (1000 chars max):**
The storage permission is essential for saving user configuration and tracking daily operations. Specifically, we store: (1) the target TikTok username that the user wants to maintain a streak with, (2) the user's enabled/disabled preference, (3) custom message templates if the user chooses to personalize their daily messages, and (4) a timestamp of the last successful message send to prevent duplicate messages within the same day. Without storage permission, the extension cannot remember which user to message, cannot track whether today's message has already been sent, and would require users to reconfigure settings every time they restart their browser. All data is stored locally using chrome.storage.local API and never transmitted to external servers, ensuring complete privacy.

---

### **Notifications Permission**
**Justification (1000 chars max):**
The notifications permission allows the extension to inform users about important events and the status of automated message sending. Since the extension operates automatically in the background when Chrome starts, users need confirmation that their daily message was successfully sent to maintain their streak. We display notifications for: (1) successful message delivery with a green checkmark, confirming the streak is protected for today, (2) failure scenarios with specific error information (e.g., "Not logged into TikTok" or "Conversation not found"), allowing users to take corrective action, and (3) first-time setup guidance when the extension is installed. Without notifications, users would have no feedback about whether the automation succeeded or failed, creating anxiety about their streak status and defeating the extension's purpose of providing peace of mind.

---

### **Alarms Permission**
**Justification (1000 chars max):**
The alarms permission is required to implement the daily reset mechanism that enables once-per-day message sending. The extension uses chrome.alarms.create() to schedule a daily alarm that fires at midnight, which resets the "already sent today" flag stored in chrome.storage. This ensures that the extension will send exactly one message per 24-hour period, preventing spam to the user's contact while maintaining the streak. Without alarms, there would be no reliable way to determine when a new day begins, potentially causing either (1) multiple messages to be sent in the same day if the user restarts Chrome multiple times, annoying the recipient, or (2) no messages being sent if the timing logic fails, breaking the streak. The alarm runs entirely in the background service worker and does not wake the user's computer or interrupt their work.

---

### **Tabs Permission**
**Justification (1000 chars max):**
The tabs permission is necessary for the extension to manage TikTok tabs intelligently during automated message sending. When Chrome starts and triggers the daily automation, the extension needs to: (1) query existing tabs using chrome.tabs.query() to check if TikTok is already open, (2) reuse an existing TikTok tab if available rather than creating duplicate tabs, (3) create a new background tab at https://www.tiktok.com/messages if no TikTok tab exists, (4) update the tab's active state to keep it in the background so it doesn't interrupt the user's current work, and (5) close the tab after successful message delivery only if the extension created it (preserving user-opened tabs). Without tabs permission, the extension cannot detect existing TikTok tabs, would create unnecessary duplicate tabs, and could not clean up after itself, resulting in tab clutter and a poor user experience.

---

### **Scripting Permission**
**Justification (1000 chars max):**
The scripting permission enables the extension to interact with TikTok's messaging interface to automatically send messages. After opening TikTok in a tab, the background service worker uses chrome.tabs.sendMessage() and chrome.scripting APIs to communicate with the content script that performs the actual message sending automation. The content script must: (1) navigate to the messages page if not already there, (2) locate the conversation with the target user by searching the conversation list, (3) click to open that specific conversation, (4) find the message input field, (5) type the pre-configured message text, and (6) click the send button. This entire sequence requires programmatic interaction with TikTok's DOM elements. Without scripting permission, the extension cannot automate the message sending process and would be non-functional, as manual user intervention would be required—negating the extension's core automation purpose.

---

### **Host Permission: https://www.tiktok.com/***
**Justification (1000 chars max):**
Host permission for https://www.tiktok.com/* is absolutely essential as this is the only website the extension interacts with. The extension requires access to TikTok.com to: (1) inject the content script that automates message sending on the TikTok messages page, (2) read the DOM structure to locate conversation lists, message input fields, and send buttons, (3) interact with TikTok's messaging interface by simulating user clicks and typing, (4) verify the user is logged in before attempting automation, and (5) confirm successful message delivery by checking for sent message confirmation in the chat thread. The wildcard path (/*) is necessary because TikTok uses multiple URL paths including /messages, /messages/conversation/*, and various user profile URLs. The extension never accesses any other websites, never injects code into non-TikTok pages, and never transmits data outside of the user's local browser. This permission scope is the absolute minimum required to fulfill the extension's single purpose of maintaining TikTok chat streaks.

---

## Why These Permissions Are Minimal and Necessary

### No Unnecessary Permissions Requested
We specifically **do NOT request**:
- ❌ `<all_urls>` or broad host permissions (only TikTok.com)
- ❌ `webRequest` or `webRequestBlocking` (no network interception)
- ❌ `cookies` (we don't read or modify cookies)
- ❌ `history` (we don't access browsing history)
- ❌ `bookmarks` (we don't touch bookmarks)
- ❌ `downloads` (no file downloads)
- ❌ `clipboardRead` or `clipboardWrite` (no clipboard access)
- ❌ `geolocation` (no location tracking)
- ❌ `management` (no control over other extensions)

### Alignment with Single Purpose
Every permission directly supports the extension's single purpose: **automatically sending one daily message on TikTok to maintain chat streaks**. There are no extraneous permissions for analytics, tracking, monetization, or secondary features.

### Privacy-First Design
- All data stays local (chrome.storage.local only)
- No external API calls or data transmission
- No user tracking or analytics
- No third-party integrations
- No advertising or monetization code

---

## Quick Reference Table

| Permission | Used For | Without It |
|------------|----------|------------|
| `storage` | Save target username, settings, last-sent timestamp | Can't remember configuration, sends duplicate messages |
| `notifications` | Confirm successful send, alert on errors | Users have no feedback, uncertainty about streak status |
| `alarms` | Reset daily flag at midnight | Multiple messages per day or no messages sent |
| `tabs` | Find/create/manage TikTok tabs intelligently | Creates duplicate tabs, can't clean up, interrupts user |
| `scripting` | Communicate with content script for automation | Cannot automate message sending, extension non-functional |
| `https://www.tiktok.com/*` | Access TikTok to send messages | Cannot interact with TikTok, extension purpose impossible |

---

## Verification for Reviewers

To verify these permissions are used correctly:

1. **Storage**: Check `utils.js` - functions `hasRunToday()`, `markRunToday()`, `loadConfig()`, `saveConfig()`
2. **Notifications**: Check `background.js` - function `showNotification()`
3. **Alarms**: Check `background.js` - `chrome.alarms.create('dailyReset', ...)` and `chrome.alarms.onAlarm.addListener()`
4. **Tabs**: Check `background.js` - `chrome.tabs.query()`, `chrome.tabs.create()`, `chrome.tabs.update()`, `chrome.tabs.remove()`
5. **Scripting**: Check `background.js` - `chrome.tabs.sendMessage()` for content script communication
6. **Host permission**: Check `content.js` and `manifest.json` content_scripts - only injects into `https://www.tiktok.com/*`

All permission usage is transparent, documented in code comments, and serves no purpose other than fulfilling the extension's stated functionality.
