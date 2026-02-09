# Testing Instructions for Haka Insight

## 📦 Installation from VS Code Marketplace

### Method 1: Install from VS Code
1. Open Visual Studio Code
2. Click on the Extensions icon in the Activity Bar (or press `Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for **"Haka Insight"**
4. Click **Install**
5. Reload VS Code if prompted

### Method 2: Install from Marketplace Website
1. Visit: https://marketplace.visualstudio.com/items?itemName=hakalab.haka-insight
2. Click **Install**
3. Your browser will prompt to open VS Code
4. Confirm installation in VS Code

---

## 🔑 Get Your Free Gemini API Key

**You need a Google Gemini API key to use Haka Insight. It's completely FREE:**

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Click **"Create API key in new project"** (or select existing project)
5. Copy the generated API key (starts with `AIza...`)
6. Keep it safe - you'll need it in the next step

**Note**: The free tier includes generous limits suitable for testing and regular use.

---

## ⚙️ Configure Haka Insight

1. Open VS Code
2. Click the **Haka Insight icon** in the Activity Bar (left sidebar)
3. Go to the **Settings tab**
4. Paste your Gemini API key in the **"API Key"** field
5. Select your preferred model:
   - **Gemini Flash (Lite)**: Faster, recommended for testing
   - **Gemini Pro**: More detailed analysis
6. Click **"Save Configuration"**
7. (Optional) Click **"Test Connection"** to verify your API key works

---

## 🧪 Test the Extension

### Test 1: Analyze a Simple File

1. Create a new JavaScript file or open an existing one
2. Add some sample code (or use the example below)
3. Right-click on the file in the Explorer
4. Select **"Analyze with Haka Insight"**
5. Wait 5-10 seconds for analysis
6. View the interactive diagram in the Diagram tab

**Sample Code to Test:**
```javascript
// sample.js
class UserService {
    constructor(database) {
        this.db = database;
    }
    
    async getUser(userId) {
        // Intentional SQL injection vulnerability for testing
        const query = `SELECT * FROM users WHERE id = ${userId}`;
        return await this.db.query(query);
    }
    
    validateEmail(email) {
        // Missing proper validation
        return email.includes('@');
    }
}

module.exports = UserService;
```

### Test 2: Explore the Diagram

1. **Zoom**: Use mouse wheel to zoom in/out
2. **Pan**: Click and drag to move around
3. **Navigate**: Click on any node to jump to that code
4. **Rearrange**: Drag nodes to customize layout (auto-saves)

### Test 3: Check Security Findings

1. Click the **Security tab**
2. You should see findings like:
   - SQL Injection vulnerability (High severity)
   - Weak email validation (Medium severity)
3. Click **"Go to code"** on any finding to navigate to the issue
4. Click **"Generate Security Report"** to create an HTML report

### Test 4: Review Quality Metrics

1. Click the **Quality tab**
2. View the quality score (0-100)
3. Explore categorized issues:
   - Bugs
   - Improvements
   - Performance
   - Best Practices
4. Click **"Generate Quality Report"** for detailed analysis

### Test 5: Test Caching

1. Click on a previously analyzed file node in the diagram
2. Notice the **"FROM CACHE"** badge with timestamp
3. Data loads instantly without API call
4. Click **"Update Analysis"** to refresh with new API call

### Test 6: Language Switching

1. Go to **Settings tab**
2. Change **Display Language** to **Spanish**
3. Interface updates immediately
4. Switch back to **English**

### Test 7: Clear Diagram

1. Click the **delete button** (trash icon) in bottom-right of Diagram tab
2. Confirm deletion in the modal
3. Diagram clears and shows empty state
4. Security and Quality tabs reset

---

## 🎯 Expected Results

After testing, you should see:

✅ Interactive diagram with nodes and connections  
✅ Security findings with severity levels  
✅ Quality score with categorized issues  
✅ Professional HTML reports  
✅ Cached data loading instantly  
✅ Smooth language switching  
✅ Code navigation working correctly  

---

## 🐛 Troubleshooting

### "API Key Invalid" Error
- Verify you copied the complete API key (starts with `AIza...`)
- Check for extra spaces before/after the key
- Generate a new API key if needed

### "Analysis Failed" Error
- Check your internet connection
- Verify API key is configured correctly
- Try with a smaller file first
- Check VS Code Output panel for detailed errors

### Diagram Doesn't Render
- Try zooming with mouse wheel
- Refresh VS Code window: `Ctrl+Shift+P` → "Reload Window"
- Check browser console (F12) for errors

### Extension Not Appearing
- Verify installation completed successfully
- Reload VS Code window
- Check Extensions panel to ensure it's enabled

---

## 📊 Test Data Recommendations

For best testing results, use files with:
- **10-200 lines of code** (optimal for quick analysis)
- **Multiple functions/classes** (shows better diagram structure)
- **Some dependencies** (demonstrates relationship mapping)
- **Common issues** (SQL injection, weak validation, etc.)

---

## 💡 Testing Tips

1. **Start Small**: Test with a single small file first
2. **Use Flash Model**: Faster for initial testing
3. **Check Cache**: Analyze the same file twice to see caching in action
4. **Try Different Languages**: Test with JavaScript, TypeScript, Python, etc.
5. **Generate Reports**: Export reports to see full analysis details
6. **Test Navigation**: Click "Go to code" buttons to verify navigation works

---

## 🔗 Support & Feedback

- **Issues**: https://github.com/pipefariashaka/HakaInsight-/issues
- **Marketplace**: https://marketplace.visualstudio.com/items?itemName=hakalab.haka-insight
- **Creator**: [Felipe Farias](https://www.linkedin.com/in/felipefariasalfaro/)

---

## ⏱️ Estimated Testing Time

- **Quick Test** (basic functionality): 5 minutes
- **Full Test** (all features): 15 minutes
- **Comprehensive Test** (multiple files, reports): 30 minutes

---

**Thank you for testing Haka Insight! Your feedback helps make it better.** 🚀
