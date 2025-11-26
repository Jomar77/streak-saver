# TikTok Auto-Message Setup Instructions

## What Changed
The script now:
1. ✅ Runs automatically when you log in to Windows
2. ✅ Uses your existing Chrome profile (no password needed)
3. ✅ Only runs once per day (resets at 12:01 AM)
4. ✅ Skips execution if already run today

## Setup Steps

### 1. Update Your .env File
Edit `.env` and only set the target user:
```
TARGET_USER=recipient_username
```
You no longer need TIKTOK_USERNAME or TIKTOK_PASSWORD.

### 2. Run the Setup Script
Right-click `setup_task.bat` and select "Run as administrator"

This will create a Windows Task that runs on logon.

### 3. Test It
You can manually run the script to test:
```
cd tiktok-automation
venv\Scripts\python.exe tiktok_bot.py
```

## How It Works

- **On Login**: Script runs automatically when you log in to Windows
- **Daily Check**: Creates/reads `last_run.txt` to track if already run today
- **Chrome Profile**: Uses your default Chrome profile at `%LOCALAPPDATA%\Google\Chrome\User Data`
- **Reset Time**: Daily counter resets at midnight (12:01 AM)

## Managing the Task

View the task:
```
schtasks /query /tn "TikTokDailyMessage"
```

Delete the task:
```
schtasks /delete /tn "TikTokDailyMessage"
```

## Important Notes

⚠️ **Chrome Profile**: Make sure TikTok is logged in your default Chrome browser before running the script.

⚠️ **Close Chrome**: The script needs to open Chrome with your profile. Close any Chrome windows before the script runs, or it may use a temporary profile.

⚠️ **Testing**: If you want to test multiple times in one day, delete the `last_run.txt` file between runs.
