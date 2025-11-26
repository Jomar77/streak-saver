# Installation Checklist

## ✅ Pre-Installation
- [ ] Chrome browser installed
- [ ] Logged into TikTok on Chrome
- [ ] Know the username you want to message
- [ ] Have this repository downloaded

## ✅ Installation Steps

### Option A: Automatic Setup (Windows)
- [ ] Open `tiktok-extension` folder
- [ ] Double-click `setup.bat`
- [ ] Follow on-screen instructions

### Option B: Manual Setup
- [ ] Run `python generate_icons.py` (or create icons manually)
- [ ] Open `chrome://extensions/` in Chrome
- [ ] Enable "Developer mode"
- [ ] Click "Load unpacked"
- [ ] Select the `tiktok-extension` folder

## ✅ Configuration
- [ ] Click extension icon in Chrome toolbar
- [ ] Click "Open Settings" button
- [ ] Enter target TikTok username
- [ ] Verify "Enable automatic daily messages" is checked
- [ ] Verify "Run automatically when Chrome starts" is checked
- [ ] Click "Save Settings"

## ✅ Testing
- [ ] Click extension icon
- [ ] Click "Send Message Now"
- [ ] Check TikTok messages to verify it worked
- [ ] Close and reopen Chrome to test auto-run

## ✅ Verification
- [ ] Extension icon shows in toolbar
- [ ] Popup shows your configuration
- [ ] No errors in extension console
- [ ] Test message sent successfully

## 🎉 You're Done!

Your streak saver is now active. It will:
- ✅ Send one message per day automatically
- ✅ Run when you open Chrome
- ✅ Notify you when message is sent
- ✅ Track daily status

---

## 📝 Common Issues

**Icons missing?**
```bash
pip install Pillow
python generate_icons.py
```

**Extension won't load?**
- Check that all files are in the folder
- Look for errors in chrome://extensions/
- Make sure icons folder exists

**Messages not sending?**
- Log into TikTok on Chrome first
- Check username is correct (no @ symbol)
- Make sure extension is enabled

---

Need more help? Check README.md for full documentation.
