// Content script that runs on TikTok pages
// This script interacts with the TikTok DOM to send messages

console.log('TikTok Streak Saver content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendMessage') {
    sendTikTokMessage(request.targetUser, request.message)
      .then(() => {
        chrome.runtime.sendMessage({
          action: 'messageSent',
          success: true
        });
        sendResponse({ success: true });
      })
      .catch((error) => {
        chrome.runtime.sendMessage({
          action: 'messageSent',
          success: false,
          error: error.message
        });
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
});

// Main function to send a message on TikTok
async function sendTikTokMessage(targetUser, message) {
  try {
    console.log(`Attempting to send message to ${targetUser}`);
    
    // Navigate to messages page
    if (!window.location.href.includes('/messages')) {
      console.log('Navigating to messages page');
      window.location.href = 'https://www.tiktok.com/messages';
      await waitForNavigation();
    }
    
    console.log('On messages page, waiting for load...');
    await wait(3000);
    
    // Find the conversation in the list (without using search)
    console.log('Looking for existing conversation...');
    const userChat = await findUserChatInList(targetUser);
    if (!userChat) {
      throw new Error(`Could not find conversation with ${targetUser}. Make sure you have an existing conversation with this user.`);
    }
    
    // Click to open the conversation
    console.log('Opening conversation...');
    try {
      userChat.click();
    } catch (e) {
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      userChat.dispatchEvent(clickEvent);
    }
    
    // Wait for chat to open
    console.log('Waiting for chat to open...');
    await wait(2000);
    
    // Find message input box (should be in the right panel now)
    console.log('Looking for message input...');
    const messageInput = await findMessageInput();
    if (!messageInput) {
      throw new Error('Could not find message input box');
    }
    
    // Focus and type message
    console.log('Typing message...');
    messageInput.focus();
    await wait(500);
    
    // Type the message into the contenteditable div
    await typeTextToContentEditable(messageInput, message);
    
    // Wait for the send button SVG to appear
    console.log('Waiting for send button to appear...');
    await wait(1500);
    
    // Find and click the send button SVG
    console.log('Looking for send button...');
    const sendButton = await findSendButtonSVG();
    
    if (sendButton) {
      console.log('Found send button, clicking...');
      try {
        sendButton.click();
      } catch (e) {
        // Try mouse event if direct click fails
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        sendButton.dispatchEvent(clickEvent);
      }
      await wait(1000);
      console.log('Message sent successfully');
    } else {
      console.log('Send button not found, message may not have been detected');
      throw new Error('Send button did not appear - message may not be properly set');
    }
    
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Helper function to find search input
async function findSearchInput() {
  const selectors = [
    'input[placeholder*="Search"]',
    'input[type="search"]',
    'input[placeholder*="search"]',
    'input[data-e2e="search-user-input"]'
  ];
  
  return await findElementBySelectors(selectors, 10000);
}

// Helper function to find user chat in conversation list (without search)
async function findUserChatInList(username) {
  const maxAttempts = 15;
  
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Searching for user: ${username} in conversation list (attempt ${i + 1}/${maxAttempts})`);
    
    // Look for nickname elements in the conversation list
    const nicknameElements = document.querySelectorAll('p[class*="PInfoNickname"]');
    console.log(`Found ${nicknameElements.length} conversation items`);
    
    for (const element of nicknameElements) {
      const text = element.textContent.trim().toLowerCase();
      
      if (text === username.toLowerCase()) {
        console.log(`✅ Found matching conversation: ${text}`);
        
        // Find the clickable conversation container
        // Try to find the parent that represents the whole conversation item
        let parent = element;
        let depth = 0;
        
        while (parent && depth < 10) {
          // Look for a div or element that looks like a conversation item container
          if (parent.tagName === 'DIV' && 
              (parent.getAttribute('role') === 'button' || 
               parent.getAttribute('role') === 'link' ||
               parent.onclick ||
               parent.classList.toString().includes('Conversation') ||
               parent.classList.toString().includes('Item'))) {
            console.log(`Found conversation container at depth ${depth}`);
            return parent;
          }
          parent = parent.parentElement;
          depth++;
        }
        
        // If we can't find a specific container, try closest div with reasonable size
        const container = element.closest('div[role="button"]') || 
                         element.closest('div[role="link"]') ||
                         element.parentElement.parentElement;
        
        if (container) {
          console.log('Using fallback container');
          return container;
        }
      }
    }
    
    await wait(500);
  }
  
  console.error(`Could not find conversation with ${username} after ${maxAttempts} attempts`);
  return null;
}

// Helper function to find message input
async function findMessageInput() {
  const selectors = [
    'div[class*="DraftEditor-content"][contenteditable="true"]',
    'div[aria-label*="Send a message"][contenteditable="true"]',
    'div[class*="public-DraftEditor-content"]',
    'div[contenteditable="true"][role="textbox"]',
    'textarea[placeholder*="message"]',
    '[data-e2e="message-input"]'
  ];
  
  return await findElementBySelectors(selectors, 10000);
}

// Helper function to find send button SVG that appears when text is entered
async function findSendButtonSVG() {
  const maxAttempts = 10;
  
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Looking for send button (attempt ${i + 1}/${maxAttempts})`);
    
    // Look for the SVG with data-e2e="message-send"
    const sendSVG = document.querySelector('svg[data-e2e="message-send"]');
    if (sendSVG) {
      console.log('Found send SVG via data-e2e');
      // Return the button parent or the SVG itself
      return sendSVG.closest('button') || sendSVG.parentElement || sendSVG;
    }
    
    // Fallback: look for button with aria-label containing "Send"
    const sendButton = document.querySelector('button[aria-label*="Send"]');
    if (sendButton) {
      console.log('Found send button via aria-label');
      return sendButton;
    }
    
    // Fallback: look for any clickable element with role="button" near the message area
    const buttons = document.querySelectorAll('button[role="button"]');
    for (const btn of buttons) {
      const svg = btn.querySelector('svg[data-e2e="message-send"]');
      if (svg) {
        console.log('Found send button containing message-send SVG');
        return btn;
      }
    }
    
    await wait(300);
  }
  
  console.error('Could not find send button');
  return null;
}

// Helper function to find element by multiple selectors
async function findElementBySelectors(selectors, timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    await wait(500);
  }
  
  return null;
}

// Helper function to type text naturally
async function typeText(element, text) {
  if (element.tagName === 'DIV' && element.contentEditable === 'true') {
    // For contenteditable divs
    element.textContent = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // For regular inputs
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// Special function for DraftJS contenteditable (TikTok uses DraftJS)
async function typeTextToContentEditable(element, text) {
  console.log('Setting text in DraftJS editor using character-by-character typing');
  
  // Focus the element first
  element.focus();
  element.click();
  await wait(300);
  
  // Type each character individually to trigger TikTok's event handlers
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Trigger beforeinput event
    element.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: char
    }));
    
    // Simulate the actual text insertion by using document.execCommand (works with contenteditable)
    document.execCommand('insertText', false, char);
    
    // Trigger input event
    element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: false,
      inputType: 'insertText',
      data: char
    }));
    
    // Small delay to simulate human typing
    await wait(20);
  }
  
  // Final change event
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  console.log('Text typed into DraftJS editor');
}

// Helper function to wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to wait for navigation
function waitForNavigation() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve, { once: true });
    }
  });
}
