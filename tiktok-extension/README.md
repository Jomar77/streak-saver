# 🔥 TikTok Streak Saver - Chrome Extension

Never lose your TikTok message streak again! This Chrome extension automatically sends a daily message to your chosen friend when you open Chrome, keeping your streak alive effortlessly.

## ✨ Features

- **🚀 Automatic Daily Messages**: Sends one message per day automatically when you open Chrome
- **🤫 Silent Operation**: Runs completely in the background with just a notification when done
- **📅 Day-Based Messages**: Different message pools for each day of the week
- **🎲 Random Selection**: Picks a random message from the daily pool
- **🔒 Uses Your Session**: Works with your existing TikTok login (no credentials needed)
- **⚙️ Easy Configuration**: Simple settings page to customize everything
- **🎯 Manual Override**: Send a message manually anytime from the popup

## 📋 Prerequisites

- Google Chrome browser
- Active TikTok account (logged in on Chrome)
- Windows, Mac, or Linux

## 🔧 Installation

### Step 1: Get the Extension Files

The extension is located in the `tiktok-extension` folder of this repository.

### Step 2: Install in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `tiktok-extension` folder
5. The extension should now appear in your extensions list

### Step 3: Add Icons (Required)

The extension needs icons to work properly. Create three PNG images or use any simple icon:

- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)
- `icons/icon128.png` (128x128 pixels)

You can:
- Create simple colored squares in Paint/Photoshop
- Use an online icon generator
- Download a lightning bolt emoji icon (⚡)

Place these in the `tiktok-extension/icons/` folder.

### Step 4: Configure Your Settings

1. Click the extension icon in Chrome toolbar
2. Click **"Open Settings"** or right-click the extension → **Options**
3. Enter your **Target TikTok Username** (the person you want to message)
4. Customize your messages if desired (optional)
5. Click **"Save Settings"**

## 🎯 Usage

### Automatic Mode (Default)

Once configured, the extension works automatically:

1. **Open Chrome** → Extension checks if message was sent today
2. **Not sent yet?** → Opens TikTok in background and sends message
3. **Already sent?** → Does nothing (once per day only)
4. **Notification** → Shows success/failure notification

### Manual Mode

You can also send messages manually:

1. Click the extension icon
2. Click **"Send Message Now"**
3. Wait for confirmation

## ⚙️ Configuration Files

### `config.json`
```json
{
  "targetUser": "your_friend_username",
  "enabled": true,
  "autoRunOnStartup": true
}
```

### `messages.json`
Customize messages for each day of the week:
```json
{
  "Monday": [
    "Happy Monday! Let's start this week strong! 💪",
    "Good morning! Hope you have an amazing week ahead! ☀️"
  ],
  "Tuesday": [
    "Happy Tuesday! Keep pushing forward! 💫"
  ],
  ...
}
```

## 🔍 How It Works

1. **Background Service Worker** (`background.js`):
   - Runs when Chrome starts
   - Checks if message was sent today
   - Opens TikTok tab in background if needed

2. **Content Script** (`content.js`):
   - Interacts with TikTok's DOM
   - Finds the message input
   - Sends the message automatically

3. **Daily Tracking**:
   - Stores the last run date in Chrome storage
   - Only runs once per calendar day
   - Resets at midnight

## 🐛 Troubleshooting

### Extension doesn't send messages

1. **Make sure you're logged into TikTok in Chrome**
   - Visit `tiktok.com` and log in
   - The extension uses your existing session

2. **Check the target username**
   - Go to Settings and verify the username is correct
   - No @ symbol needed, just the username

3. **Check the console**
   - Right-click extension → Inspect popup
   - Check Console for error messages

### Message sends multiple times

- This shouldn't happen, but if it does:
  - Check `chrome://extensions/` and ensure only one instance is installed
  - Clear extension data: Settings → Clear all data

### TikTok layout changes

If TikTok updates their website and the extension stops working:
- The selectors in `content.js` may need updating
- Check for console errors on the TikTok messages page
- Open an issue on GitHub

## 🔒 Privacy & Security

- **No data collection**: Everything stays on your computer
- **No external servers**: Extension works entirely locally
- **Uses your session**: No credentials stored or transmitted
- **Open source**: All code is visible and auditable

## ⚠️ Important Disclaimer

**USE AT YOUR OWN RISK**

This extension is provided for **educational and personal use only**.

- 🚫 **Terms of Service**: Using automation tools may violate TikTok's Terms of Service
- ⛔ **Account Risk**: Your TikTok account could be suspended, restricted, or permanently banned
- 📵 **No Guarantees**: The extension may stop working if TikTok updates their website
- 🔒 **No Warranty**: This software is provided "as is" without any warranty
- 👤 **Personal Responsibility**: You are solely responsible for any consequences of using this extension

**The developer is not responsible for:**
- Account suspensions or bans
- Loss of data or messages
- Any damages arising from the use of this extension
- Changes to TikTok's platform that break functionality

By using this extension, you acknowledge these risks and agree to use it responsibly.

## 📝 Customization

### Add More Messages

Edit `messages.json` to add more message options for any day:

```json
{
  "Monday": [
    "Your message here",
    "Another message",
    "As many as you want!"
  ]
}
```

### Change When It Runs

By default, runs on Chrome startup. To disable:
1. Go to Options
2. Uncheck "Run automatically when Chrome starts"
3. Use manual trigger from popup instead

### Modify Timing

Edit `background.js` to change the alarm timing or add additional triggers.

## 🤝 Contributing

Found a bug or want to improve the extension?

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

Having issues? Here's how to get help:

1. **Check this README** - Most common issues are covered
2. **Check the Console** - Look for error messages
3. **GitHub Issues** - Open an issue with details
4. **Popup Status** - Check the extension popup for current status

## 📚 Technical Details

**Technologies Used:**
- Chrome Extension Manifest V3
- Vanilla JavaScript (ES6 modules)
- Chrome Storage API
- Chrome Alarms API
- Chrome Notifications API

**File Structure:**
```
tiktok-extension/
├── manifest.json         # Extension configuration
├── background.js         # Service worker (main logic)
├── content.js           # TikTok page interaction
├── utils.js             # Helper functions
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic
├── options.html         # Settings page UI
├── options.js           # Settings page logic
├── config.json          # User configuration
├── messages.json        # Message templates
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🎉 Enjoy!

Your TikTok streaks are now safe! The extension will work silently in the background, keeping your friendships alive one message at a time. 🔥

---

**Made with ❤️ by Jomar77** | [Report Issues](https://github.com/Jomar77/streak-saver/issues)
