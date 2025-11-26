# Verify Chrome is installed and get its path
import shutil
chrome_path = shutil.which('google-chrome') or shutil.which('chromium-browser')
print(f"Chrome found at: {chrome_path}")