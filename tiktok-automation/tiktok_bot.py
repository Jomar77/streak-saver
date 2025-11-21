"""
TikTok Daily Message Automation Script
Sends a daily message to a specific user with day-of-week based random selection
"""

import os
import json
import random
import time
from datetime import datetime
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import undetected_chromedriver as uc
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
TIKTOK_USERNAME = os.getenv('TIKTOK_USERNAME')
TIKTOK_PASSWORD = os.getenv('TIKTOK_PASSWORD')
TARGET_USER = os.getenv('TARGET_USER')
MESSAGES_FILE = 'messages.json'
LOG_FILE = 'tiktok_automation.log'
SCREENSHOTS_DIR = 'screenshots'
COOKIES_FILE = 'tiktok_cookies.json'

# Create necessary directories
Path(SCREENSHOTS_DIR).mkdir(exist_ok=True)


def log_message(message, level='INFO'):
    """Log messages to file with timestamp"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_entry = f"[{timestamp}] [{level}] {message}\n"
    
    print(log_entry.strip())
    
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(log_entry)


def load_messages():
    """Load messages from JSON file organized by day of week"""
    try:
        with open(MESSAGES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        log_message(f"Messages file {MESSAGES_FILE} not found", 'ERROR')
        raise
    except json.JSONDecodeError:
        log_message(f"Invalid JSON in {MESSAGES_FILE}", 'ERROR')
        raise


def get_daily_message():
    """Get random message based on current day of week"""
    messages = load_messages()
    day_of_week = datetime.now().strftime('%A')  # Monday, Tuesday, etc.
    
    if day_of_week not in messages:
        log_message(f"No messages found for {day_of_week}, using default", 'WARNING')
        day_of_week = 'default'
    
    message_pool = messages.get(day_of_week, messages.get('default', ['Hello!']))
    selected_message = random.choice(message_pool)
    
    log_message(f"Selected message for {day_of_week}: {selected_message[:50]}...")
    return selected_message


def save_cookies(driver):
    """Save browser cookies to file"""
    try:
        cookies = driver.get_cookies()
        with open(COOKIES_FILE, 'w') as f:
            json.dump(cookies, f)
        log_message("Cookies saved successfully")
    except Exception as e:
        log_message(f"Failed to save cookies: {str(e)}", 'ERROR')


def load_cookies(driver):
    """Load cookies from file"""
    try:
        if not os.path.exists(COOKIES_FILE):
            return False
        
        with open(COOKIES_FILE, 'r') as f:
            cookies = json.load(f)
        
        for cookie in cookies:
            # Remove domain if it causes issues
            if 'domain' in cookie and not cookie['domain'].startswith('.'):
                cookie['domain'] = f".{cookie['domain']}"
            try:
                driver.add_cookie(cookie)
            except Exception as e:
                log_message(f"Could not add cookie: {str(e)}", 'WARNING')
        
        log_message("Cookies loaded successfully")
        return True
    except Exception as e:
        log_message(f"Failed to load cookies: {str(e)}", 'ERROR')
        return False


def check_login_required(driver):
    """Check if login is required"""
    try:
        # Check for login button or form
        login_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Log in')]")
        return len(login_elements) > 0
    except:
        return True


def login_to_tiktok(driver):
    """Perform TikTok login"""
    try:
        log_message("Navigating to TikTok login page")
        driver.get('https://www.tiktok.com/login/phone-or-email/email')
        time.sleep(3)
        
        # Wait for login form
        wait = WebDriverWait(driver, 10)
        
        # Enter username/email
        log_message("Entering credentials")
        username_input = wait.until(
            EC.presence_of_element_located((By.NAME, "username"))
        )
        username_input.clear()
        username_input.send_keys(TIKTOK_USERNAME)
        
        # Enter password
        password_input = driver.find_element(By.XPATH, "//input[@type='password']")
        password_input.clear()
        password_input.send_keys(TIKTOK_PASSWORD)
        
        # Click login button
        login_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        login_button.click()
        
        log_message("Login submitted, waiting for verification...")
        time.sleep(10)  # Wait for potential 2FA or CAPTCHA
        
        # Check if login was successful
        if check_login_required(driver):
            log_message("Login may require manual intervention (CAPTCHA/2FA)", 'WARNING')
            log_message("Waiting 60 seconds for manual completion...")
            time.sleep(60)
        
        # Save cookies after successful login
        save_cookies(driver)
        log_message("Login successful")
        return True
        
    except Exception as e:
        log_message(f"Login failed: {str(e)}", 'ERROR')
        driver.save_screenshot(f"{SCREENSHOTS_DIR}/login_error_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
        return False


def send_message(driver, message):
    """Navigate to user and send message"""
    try:
        log_message(f"Navigating to messages for user: {TARGET_USER}")
        
        # Go to messages page
        driver.get('https://www.tiktok.com/messages')
        time.sleep(5)
        
        wait = WebDriverWait(driver, 15)
        
        # Search for user - try multiple selectors
        log_message("Searching for target user")
        search_selectors = [
            "//input[@placeholder='Search']",
            "//input[@type='search']",
            "//input[contains(@placeholder, 'search')]"
        ]
        
        search_input = None
        for selector in search_selectors:
            try:
                search_input = driver.find_element(By.XPATH, selector)
                break
            except NoSuchElementException:
                continue
        
        if not search_input:
            raise Exception("Could not find search input")
        
        search_input.clear()
        search_input.send_keys(TARGET_USER)
        time.sleep(3)
        
        # Click on user conversation
        log_message("Opening conversation")
        user_chat = wait.until(
            EC.element_to_be_clickable((By.XPATH, f"//span[contains(text(), '{TARGET_USER}')]"))
        )
        user_chat.click()
        time.sleep(3)
        
        # Find message input box
        log_message("Locating message input")
        message_selectors = [
            "//textarea[@placeholder='Send a message...']",
            "//div[@contenteditable='true']",
            "//textarea[contains(@placeholder, 'message')]"
        ]
        
        message_input = None
        for selector in message_selectors:
            try:
                message_input = driver.find_element(By.XPATH, selector)
                break
            except NoSuchElementException:
                continue
        
        if not message_input:
            raise Exception("Could not find message input")
        
        # Type and send message
        log_message(f"Sending message: {message[:50]}...")
        message_input.clear()
        message_input.send_keys(message)
        time.sleep(1)
        
        # Send message - try Enter key first, then button
        try:
            message_input.send_keys(Keys.RETURN)
        except:
            send_button = driver.find_element(By.XPATH, "//button[contains(@aria-label, 'Send')]")
            send_button.click()
        
        time.sleep(2)
        log_message("Message sent successfully", 'SUCCESS')
        return True
        
    except Exception as e:
        log_message(f"Failed to send message: {str(e)}", 'ERROR')
        driver.save_screenshot(f"{SCREENSHOTS_DIR}/send_error_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
        return False


def main():
    """Main execution flow"""
    log_message("=" * 60)
    log_message("Starting TikTok automation")
    
    # Validate configuration
    if not all([TIKTOK_USERNAME, TIKTOK_PASSWORD, TARGET_USER]):
        log_message("Missing required environment variables", 'ERROR')
        return 1
    
    driver = None
    
    try:
        # Get daily message
        message = get_daily_message()
        
        # Setup undetected Chrome driver
        log_message("Initializing browser")
        options = uc.ChromeOptions()
        # options.add_argument('--headless')  # Uncomment for headless mode
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        
        driver = uc.Chrome(options=options)
        driver.set_window_size(1920, 1080)
        
        # Navigate to TikTok
        log_message("Navigating to TikTok")
        driver.get('https://www.tiktok.com')
        time.sleep(3)
        
        # Try to load cookies
        cookies_loaded = load_cookies(driver)
        if cookies_loaded:
            driver.refresh()
            time.sleep(3)
        
        # Check if login is required
        if check_login_required(driver):
            log_message("Login required")
            if not login_to_tiktok(driver):
                raise Exception("Login failed")
        else:
            log_message("Already logged in via cookies")
        
        # Send the message
        if not send_message(driver, message):
            raise Exception("Failed to send message")
        
        log_message("Automation completed successfully", 'SUCCESS')
        return 0
        
    except Exception as e:
        log_message(f"Automation failed: {str(e)}", 'ERROR')
        if driver:
            driver.save_screenshot(f"{SCREENSHOTS_DIR}/error_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
        return 1
        
    finally:
        if driver:
            time.sleep(2)
            driver.quit()
            log_message("Browser closed")


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)