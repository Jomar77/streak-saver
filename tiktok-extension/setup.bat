@echo off
echo ========================================
echo TikTok Streak Saver - Setup Script
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "manifest.json" (
    echo ERROR: Please run this script from the tiktok-extension folder
    echo.
    pause
    exit /b 1
)

echo Step 1: Generating icons...
echo.

REM Try to generate icons with Python
python generate_icons.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Could not generate icons automatically
    echo Please create icon files manually or install Pillow:
    echo   pip install Pillow
    echo.
    echo Required icons:
    echo   - icons/icon16.png (16x16)
    echo   - icons/icon48.png (48x48)
    echo   - icons/icon128.png (128x128)
    echo.
)

echo.
echo Step 2: Opening Chrome Extensions page...
echo.
start chrome chrome://extensions/
timeout /t 2 >nul

echo ========================================
echo Setup Instructions:
echo ========================================
echo.
echo 1. Enable 'Developer mode' (toggle top-right)
echo 2. Click 'Load unpacked'
echo 3. Select this folder: %CD%
echo 4. Click the extension icon
echo 5. Go to Settings and enter your friend's username
echo 6. Save settings
echo 7. Test by clicking 'Send Message Now'
echo.
echo ========================================
echo.
echo The extension will now automatically send a message
echo once per day when you open Chrome!
echo.
echo For detailed help, see README.md
echo ========================================
echo.
pause
