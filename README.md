# TikTok Streak Saver

Chrome extension that helps keep a TikTok message streak alive by sending one daily message using your existing TikTok login session.

## Install (GitHub Releases)

1. Open the project Releases page on GitHub.
2. Download the latest asset named like `tiktok-extension-vX.Y.Z.zip`.
3. Extract the zip file.
4. In Chrome, open `chrome://extensions/`.
5. Enable **Developer mode**.
6. Click **Load unpacked** and select the extracted `tiktok-extension` folder.

## First-Time Setup

1. Click the extension icon in Chrome.
2. Open **Settings**.
3. Set your target TikTok username.
4. Save settings.
5. Use **Send Message Now** once to verify everything works.

## Update to a New Version

1. Download the newest release zip.
2. Extract it.
3. In `chrome://extensions/`, remove the old unpacked version (or use **Reload** and point to the new folder).
4. Keep your settings if prompted.

## Project Structure

- [tiktok-extension](tiktok-extension): Chrome extension source code
- [CHANGELOG.md](CHANGELOG.md): release notes history

## Release Automation (Maintainer)

This repository is configured to publish releases automatically when you push a semantic tag.

### One-time first release

1. Bump `version` in [tiktok-extension/manifest.json](tiktok-extension/manifest.json).
2. Update [CHANGELOG.md](CHANGELOG.md).
3. Commit and push to `main`.
4. Create and push a matching tag:
   - `git tag v1.0.0`
   - `git push origin v1.0.0`
5. GitHub Actions workflow creates a Release with zip asset `tiktok-extension-v1.0.0.zip`.

### Important version rule

Tag version must match `manifest.json` version exactly (without the leading `v`).

Example:
- Tag: `v1.0.1`
- Manifest version: `1.0.1`

## Existing Extension Docs

For extension-specific troubleshooting and usage details:
- [tiktok-extension/README.md](tiktok-extension/README.md)
- [tiktok-extension/QUICK_START.md](tiktok-extension/QUICK_START.md)
- [tiktok-extension/CHECKLIST.md](tiktok-extension/CHECKLIST.md)

## Disclaimer

Use responsibly. Automation may violate TikTok terms, and account actions are your responsibility.
