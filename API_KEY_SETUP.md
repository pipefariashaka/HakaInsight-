# API Key Setup Guide

This guide explains how to get and configure your Google Gemini 3 API Key for the Code Architecture Analyzer extension.

## Getting Your API Key

### Step 1: Visit Google AI Studio

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account (create one if needed)

### Step 2: Create an API Key

1. Click "Create API Key"
2. Select "Create API key in new project" or choose an existing project
3. Your API Key will be generated and displayed

### Step 3: Copy Your API Key

1. Click the copy icon next to your API Key
2. Keep it safe - don't share it with anyone

## Configuring in VS Code

### Step 1: Open the Extension

1. Click the Code Architecture Analyzer icon in the VS Code sidebar
2. The panel will open with two tabs: "Diagram" and "Settings"

### Step 2: Go to Settings Tab

1. Click the "Settings" tab
2. You'll see an input field labeled "Gemini API Key"

### Step 3: Enter Your API Key

1. Paste your API Key into the input field
2. The field is masked for security (shows dots instead of characters)

### Step 4: Save

1. Click the "Save" button
2. You'll see a success message: "API Key saved successfully"

### Step 5: Verify

1. Your API Key is now stored securely in VS Code
2. It will be used automatically for all code analysis

## Using Your API Key

Once configured, the extension will:

1. Use your API Key to authenticate with Gemini 3
2. Send code for analysis
3. Receive and display results
4. Never expose your API Key in plain text

## Security

### Your API Key is Safe

- Stored in VS Code's secure storage
- Never displayed in plain text
- Never sent to external services (except Google)
- Deleted when you clear it

### Best Practices

1. **Don't share your API Key** - Keep it private
2. **Don't commit it** - Never add it to version control
3. **Rotate regularly** - Generate new keys periodically
4. **Monitor usage** - Check your Google Cloud Console for usage

## Troubleshooting

### "Invalid API Key" Error

- Verify you copied the entire key
- Check that it's not expired
- Try generating a new key

### "Rate limit exceeded" Error

- You've exceeded the free tier limits
- Wait a few minutes and try again
- Consider upgrading your plan

### "Network error" Error

- Check your internet connection
- Verify Google's services are accessible
- Check VS Code's output panel for details

### API Key Not Saving

- Check that you have permission to use VS Code's secret storage
- Try restarting VS Code
- Check the output panel for error messages

## Clearing Your API Key

### To Remove Your API Key

1. Open the Settings tab
2. Click the "Clear" button
3. Your API Key will be deleted from secure storage

### To Change Your API Key

1. Click "Clear" to remove the old key
2. Enter your new API Key
3. Click "Save"

## API Key Limits

### Free Tier

- Limited requests per day
- Suitable for personal use
- Check Google's documentation for current limits

### Paid Plans

- Higher request limits
- Priority support
- See [Google Cloud Pricing](https://cloud.google.com/generative-ai/pricing) for details

## Getting Help

### If You Have Issues

1. Check this guide again
2. Review the [README.md](README.md)
3. Check the [troubleshooting section](README.md#troubleshooting)
4. Open an issue on GitHub

### Useful Links

- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google Cloud Console](https://console.cloud.google.com/)

## FAQ

### Q: Is my API Key safe?

A: Yes, it's stored in VS Code's secure storage and never exposed in plain text.

### Q: Can I use the same API Key on multiple machines?

A: Yes, you can use the same key on different VS Code installations.

### Q: What if I lose my API Key?

A: Generate a new one in Google AI Studio. The old one will stop working.

### Q: Can I use multiple API Keys?

A: The extension stores one API Key. To use different keys, you'd need to update it in settings.

### Q: Is there a free tier?

A: Yes, Google offers a free tier for Gemini API. Check their documentation for current limits.

### Q: What data is sent to Google?

A: Only the code you analyze is sent to Google's Gemini API. No other data is shared.

---

**Need help?** Check the [README.md](README.md) or open an issue on GitHub.

