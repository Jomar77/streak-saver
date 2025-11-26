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
    
    // Find the conversation in the list (by searching DOM)
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
    
    // Find message input box
    console.log('Looking for message input...');
    const messageInput = await findMessageInput();
    if (!messageInput) {
      throw new Error('Could not find message input box');
    }
    
    // Click to focus and trigger state change: placeholder-root → has-focus
    console.log('Focusing message input...');
    messageInput.click();
    messageInput.focus();
    await wait(800);
    
    // Verify has-focus state
    const parentDiv = messageInput.closest('div[class*="DraftEditor"]');
    console.log('Parent div classes after focus:', parentDiv?.className);
    
    // Type the message - this should trigger: has-focus → editorContainer
    console.log('Typing message...');
    await typeTextToDraftJS(messageInput, message);
    
    // Wait and verify editorContainer state appeared
    await wait(1500);
    console.log('Parent div classes after typing:', parentDiv?.className);
    
    // Find the send button that should now be visible
    console.log('Looking for send button in new container...');
    const sendButton = await findSendButton();
    
    if (sendButton) {
      console.log('Found send button - SVG is present, sending Enter key instead of clicking');
      
      // Focus back on the message input
      messageInput.focus();
      await wait(200);
      
      // Press Enter key to send the message
      console.log('Pressing Enter key...');
      
      // KeyDown event
      messageInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      }));
      
      await wait(50);
      
      // KeyPress event
      messageInput.dispatchEvent(new KeyboardEvent('keypress', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      }));
      
      await wait(50);
      
      // KeyUp event
      messageInput.dispatchEvent(new KeyboardEvent('keyup', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      }));
      
      console.log('Enter key pressed');
      await wait(1000);
      console.log('Message sent successfully');
    } else {
      throw new Error('Send button did not appear after typing');
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

// Helper function to find user chat in conversation list (by searching DOM)
async function findUserChatInList(username) {
  const maxAttempts = 20;
  
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Searching DOM for user: ${username} (attempt ${i + 1}/${maxAttempts})`);
    
    // Try multiple selector strategies for conversation nicknames
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
      
      if (elements.length > 0) {
        console.log(`Found ${elements.length} conversation items with selector: ${selector}`);
        
        for (const element of elements) {
          const text = element.textContent.trim().toLowerCase();
          
          if (text === username.toLowerCase()) {
            console.log(`✅ Found matching conversation: ${text}`);
            
            // Find the clickable conversation container
            let parent = element;
            let depth = 0;
            
            while (parent && depth < 10) {
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
            
            // Fallback: use closest clickable parent
            const container = element.closest('div[role="button"]') || 
                             element.closest('div[role="link"]') ||
                             element.closest('a') ||
                             element.parentElement.parentElement;
            
            if (container) {
              console.log('Using fallback container');
              return container;
            }
          }
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
    '[data-e2e="message-input"]'
  ];
  
  return await findElementBySelectors(selectors, 10000);
}

// Find send button in the new container (css-1du5ih7-0be0dc34--DivMessageInputAndSendButton)
async function findSendButton() {
  const maxAttempts = 15;
  
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Looking for send button (attempt ${i + 1}/${maxAttempts})`);
    
    // Strategy 1: Look for the specific container class that appears with editorContainer
    const containerSelectors = [
      'div[class*="DivMessageInputAndSendButton"]',
      'div[class*="MessageInputAndSendButton"]',
      'div.css-1du5ih7-0be0dc34--DivMessageInputAndSendButton'
    ];
    
    for (const selector of containerSelectors) {
      const container = document.querySelector(selector);
      if (container) {
        console.log('Found send button container:', selector);
        
        // Look for button first (preferred), then SVG
        const button = container.querySelector('button[aria-label*="Send"]') || 
                      container.querySelector('button');
        if (button) {
          console.log('Found send button element in container');
          return button;
        }
        
        // If no button, look for SVG and get its button parent
        const svg = container.querySelector('svg[data-e2e="message-send"]') ||
                   container.querySelector('svg');
        if (svg) {
          const buttonParent = svg.closest('button');
          if (buttonParent) {
            console.log('Found send button via container + SVG -> button parent');
            return buttonParent;
          }
        }
      }
    }
    
    // Strategy 2: Direct SVG search
    const sendSVG = document.querySelector('svg[data-e2e="message-send"]');
    if (sendSVG) {
      console.log('Found send SVG via data-e2e');
      return sendSVG.closest('button') || sendSVG.parentElement;
    }
    
    // Strategy 3: aria-label
    const sendButton = document.querySelector('button[aria-label*="Send"]');
    if (sendButton && !sendButton.disabled) {
      console.log('Found send button via aria-label');
      return sendButton;
    }
    
    await wait(500);
  }
  
  console.error('Could not find send button after all attempts');
  return null;
}

// Helper function to find element by multiple selectors
async function findElementBySelectors(selectors, timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('Found element with selector:', selector);
        return element;
      }
    }
    await wait(500);
  }
  
  console.error('Could not find element with any selector:', selectors);
  return null;
}

// Type text into DraftJS editor (TikTok's message input)
// This properly triggers: placeholder-root → has-focus → editorContainer
async function typeTextToDraftJS(contentEditableDiv, text) {
  console.log('Typing into DraftJS editor with proper state transitions');
  
  // Find the inner structure: data-block → data-offset-key div → span[data-text="true"]
  const dataBlock = contentEditableDiv.querySelector('div[data-block="true"]');
  if (!dataBlock) {
    throw new Error('Could not find data-block element');
  }
  
  const offsetKeyDiv = dataBlock.querySelector('div[data-offset-key]');
  if (!offsetKeyDiv) {
    throw new Error('Could not find data-offset-key element');
  }
  
  // When empty, there's a <br> inside. When typing, we need to replace with <span data-text="true">
  console.log('Current inner HTML:', offsetKeyDiv.innerHTML);
  
  // Clear any existing content (br tag)
  offsetKeyDiv.innerHTML = '';
  
  // Create the span element with data-text="true" and insert text
  const span = document.createElement('span');
  span.setAttribute('data-text', 'true');
  span.textContent = text;
  offsetKeyDiv.appendChild(span);
  
  console.log('Updated inner HTML:', offsetKeyDiv.innerHTML);
  
  // Trigger React events to notify TikTok's state management
  // This is crucial for transitioning to editorContainer state
  
  // 1. Focus event
  contentEditableDiv.dispatchEvent(new FocusEvent('focus', {
    bubbles: true,
    cancelable: true
  }));
  
  await wait(100);
  
  // 2. BeforeInput event
  contentEditableDiv.dispatchEvent(new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text
  }));
  
  await wait(100);
  
  // 3. Input event - this triggers React's onChange
  contentEditableDiv.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: false,
    inputType: 'insertText',
    data: text
  }));
  
  await wait(100);
  
  // 4. KeyUp event for good measure
  contentEditableDiv.dispatchEvent(new KeyboardEvent('keyup', {
    bubbles: true,
    cancelable: true,
    key: text.slice(-1),
    code: 'Key' + text.slice(-1).toUpperCase()
  }));
  
  // 5. Change event
  contentEditableDiv.dispatchEvent(new Event('change', {
    bubbles: true
  }));
  
  console.log('All events dispatched, text should be set');
  
  // Verify the content is actually there
  await wait(200);
  const finalText = contentEditableDiv.textContent;
  console.log('Final textContent:', finalText);
  
  if (!finalText || finalText.trim() !== text.trim()) {
    console.warn('Text content mismatch! Expected:', text, 'Got:', finalText);
  }
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
