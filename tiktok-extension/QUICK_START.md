# Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Generate Icons
```bash
cd tiktok-extension
python generate_icons.py
```

If you don't have Pillow installed:
```bash
pip install Pillow
```

### 2. Load Extension in Chrome
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked"
4. Select the `tiktok-extension` folder
5. ✅ Extension installed!

### 3. Configure
1. Click the extension icon in Chrome toolbar
2. Click "Open Settings"
3. Enter your friend's TikTok username
4. Click "Save Settings"

### 4. Test It
1. Click the extension icon
2. Click "Send Message Now"
3. Check TikTok to verify the message was sent

## ✅ Done!
Your extension will now automatically send a message once per day when you open Chrome.

---

## 📝 Configuration Files

### Before First Use
Edit these files with your information:

**config.json:**
```json
{
  "targetUser": "your_friends_username_here",
  "enabled": true,
  "autoRunOnStartup": true
}
```

Or just use the Settings page in the extension (easier!).

---

## 🐛 Troubleshooting

**Extension doesn't load:**
- Make sure all files are in the `tiktok-extension` folder
- Check that icons exist in `icons/` folder
- Look for errors in `chrome://extensions/`

**Messages not sending:**
- Log into TikTok in Chrome first
- Check that username is correct (no @ symbol)
- Look at extension console for errors (right-click extension → Inspect)

**Need help?**
Check the full README.md for detailed troubleshooting.

---

## 🎉 Tips

- The extension runs silently in the background
- You'll get a notification when the message is sent
- Check the popup to see today's status
- Customize messages in `messages.json` or Settings page
- It only sends once per day (resets at midnight)

Enjoy your streak! 🔥
