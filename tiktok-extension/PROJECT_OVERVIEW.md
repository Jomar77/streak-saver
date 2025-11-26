# 🎯 TikTok Streak Saver Chrome Extension - Project Overview

## 📦 What You Have

A complete Chrome extension that automatically sends daily TikTok messages to maintain your streak!

## 📁 File Structure

```
tiktok-extension/
│
├── 📄 manifest.json          # Extension configuration
├── 🔧 background.js          # Main automation logic (runs on Chrome startup)
├── 💬 content.js             # TikTok page interaction script
├── 🛠️ utils.js               # Helper functions (date checking, message selection)
│
├── 🎨 popup.html             # Extension popup UI
├── 🎨 popup.js               # Popup functionality
├── ⚙️ options.html           # Settings page UI
├── ⚙️ options.js             # Settings functionality
│
├── 📋 config.json            # Your configuration (username, settings)
├── 💌 messages.json          # Daily message templates
│
├── 📖 README.md              # Complete documentation
├── 🚀 QUICK_START.md         # 5-minute setup guide
├── ✅ CHECKLIST.md           # Installation checklist
│
├── 🖼️ generate_icons.py      # Python icon generator
├── 🖼️ generate_icons.html    # Browser-based icon generator
├── ⚡ setup.bat              # Windows setup script
│
└── 📁 icons/                 # Extension icons (to be generated)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🎯 How It Works

### Daily Automation Flow

```
1. You open Chrome
   ↓
2. background.js wakes up
   ↓
3. Checks: "Did I send a message today?"
   ↓
   ├─ YES → Do nothing
   └─ NO → Continue
      ↓
4. Opens TikTok in background tab
   ↓
5. content.js interacts with page
   ↓
6. Finds your friend's chat
   ↓
7. Selects random message for today
   ↓
8. Sends the message
   ↓
9. Shows you a notification ✅
   ↓
10. Marks today as "done"
```

### Key Features

✅ **Automatic**: Runs when you open Chrome  
✅ **Silent**: Works in background  
✅ **Smart**: Only once per day  
✅ **Flexible**: Day-specific message pools  
✅ **Random**: Different message each time  
✅ **Safe**: Uses your existing TikTok session  
✅ **Configurable**: Easy settings page  
✅ **Manual Override**: Send anytime from popup  

## 🚀 Getting Started

### Quick Setup (3 Steps)

1. **Generate Icons**
   - Option A: Open `generate_icons.html` in browser
   - Option B: Run `python generate_icons.py`
   - Option C: Create manually in Paint/Photoshop

2. **Load Extension**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `tiktok-extension` folder

3. **Configure**
   - Click extension icon
   - Go to Settings
   - Enter friend's username
   - Save!

### Detailed Setup

See `QUICK_START.md` or `CHECKLIST.md` for step-by-step instructions.

## 🎨 Customization

### Change Messages

Edit `messages.json`:
```json
{
  "Monday": [
    "Your custom Monday message! 🎉",
    "Another Monday option"
  ],
  "Tuesday": ["Custom Tuesday message"],
  ...
}
```

Or use the Settings page for easier editing.

### Change Target User

Either:
- Use the Settings page in the extension
- Edit `config.json` directly

### Change Behavior

Edit settings to:
- Disable/enable automatic sending
- Turn off startup trigger (manual only)

## 🔍 Technical Details

### Technologies
- Chrome Extension Manifest V3
- JavaScript ES6 Modules
- Chrome Storage API
- Chrome Alarms API
- Chrome Notifications API
- DOM Manipulation

### Key Components

**background.js** - Service Worker
- Listens for Chrome startup
- Manages daily alarm
- Orchestrates message sending
- Shows notifications

**content.js** - Content Script
- Runs on TikTok pages
- Finds DOM elements
- Interacts with message UI
- Sends messages

**utils.js** - Helper Functions
- Date checking logic
- Message selection
- Config management
- Storage operations

## 🐛 Troubleshooting

### Common Issues

**Extension won't load**
- Missing icons? Generate them first
- Check for errors in `chrome://extensions/`

**Messages not sending**
- Log into TikTok on Chrome first
- Verify username is correct
- Check extension popup for status

**Sends multiple times**
- Shouldn't happen, but check if installed twice
- Clear extension storage and restart

**TikTok changed their layout**
- Selectors in `content.js` may need updating
- Check console for errors
- Report issue on GitHub

## 🔒 Privacy

- **No data collection** - Everything local
- **No external servers** - No data sent anywhere
- **No credentials stored** - Uses your TikTok session
- **Open source** - You can inspect all code

## 📚 Documentation

- `README.md` - Complete documentation
- `QUICK_START.md` - Fast 5-minute setup
- `CHECKLIST.md` - Installation checklist
- Code comments - Inline documentation

## 🎉 What's Next?

After installation:
1. Test with "Send Message Now" button
2. Close and reopen Chrome to test auto-run
3. Check popup to see status
4. Customize messages if desired
5. Enjoy your maintained streak! 🔥

## 💡 Tips

- Extension runs silently - you'll see a notification
- Check popup anytime to see today's status
- Messages reset at midnight (local time)
- Can manually send multiple times if needed
- Customize messages for each day of the week
- Works as long as you're logged into TikTok

## 🆘 Need Help?

1. Check `README.md` for detailed docs
2. Review `QUICK_START.md` for setup help
3. Look at extension console for errors
4. Check `CHECKLIST.md` to verify installation
5. Open GitHub issue if stuck

## 📝 Future Enhancements

Possible additions:
- Multiple target users
- Custom scheduling times
- Message history tracking
- Statistics dashboard
- Backup/restore settings

## ⚠️ Important Notes

- Must be logged into TikTok in Chrome
- Only sends once per 24 hours (resets at midnight)
- Uses your existing session (no credentials)
- Requires Chrome to be opened at least once per day
- TikTok layout changes may require updates

## 🎊 Enjoy!

Your TikTok streaks are now automated! Set it up once, and never worry about losing a streak again.

---

**Version**: 1.0.0  
**Author**: Jomar77  
**License**: MIT  
**Repo**: streak-saver
