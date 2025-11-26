@echo off
SET SCRIPT_DIR=%~dp0

schtasks /create /tn "TikTokDailyMessage" /tr "cmd /c cd /d %SCRIPT_DIR% && %SCRIPT_DIR%venv\Scripts\python.exe %SCRIPT_DIR%tiktok_bot.py" /sc onlogon /f

echo Task scheduled: Run on Windows logon (once per day)
echo To view: schtasks /query /tn "TikTokDailyMessage"
echo To delete: schtasks /delete /tn "TikTokDailyMessage"
pause