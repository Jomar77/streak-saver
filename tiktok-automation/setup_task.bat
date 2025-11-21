@echo off
SET SCRIPT_DIR=%~dp0

schtasks /create /tn "TikTokDailyMessage" /tr "cmd /c cd /d %SCRIPT_DIR% && %SCRIPT_DIR%venv\Scripts\python.exe %SCRIPT_DIR%tiktok_bot.py" /sc daily /st 09:00 /f

echo Task scheduled: Daily at 9:00 AM
echo To view: schtasks /query /tn "TikTokDailyMessage"
echo To delete: schtasks /delete /tn "TikTokDailyMessage"
pause