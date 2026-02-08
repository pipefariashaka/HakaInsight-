/**
 * Script to extract HTML/CSS/JS from SidebarPanelManager.ts
 * This automates the template extraction process
 */

const fs = require('fs');
const path = require('path');

// Read the SidebarPanelManager.ts file
const sidebarPath = path.join(__dirname, '..', 'src', 'extension', 'SidebarPanelManager.ts');
const content = fs.readFileSync(sidebarPath, 'utf8');

console.log('Total file length:', content.length, 'characters');

// Find the start of the HTML template
const templateStart = content.indexOf('return `<!DOCTYPE html>');
if (templateStart === -1) {
    console.error('Could not find template start');
    process.exit(1);
}

// Find the end - look for `; after </html>
const searchFrom = templateStart + 1000;
const templateEnd = content.indexOf('`;', searchFrom);

if (templateEnd === -1) {
    console.error('Could not find template end');
    process.exit(1);
}

console.log('Template found at positions:', templateStart, 'to', templateEnd);

// Extract the HTML (remove 'return `' at start and '`;' at end)
const htmlStart = templateStart + 8; // length of 'return `'
const extractedHTML = content.substring(htmlStart, templateEnd);

console.log('Extracted HTML length:', extractedHTML.length, 'characters');
console.log('Starting extraction...\n');

// Create output directories
const templatesDir = path.join(__dirname, '..', 'src', 'webview', 'templates');
const stylesDir = path.join(__dirname, '..', 'src', 'webview', 'styles');
const scriptsDir = path.join(__dirname, '..', 'src', 'webview', 'scripts');

// Extract CSS (everything between <style> and </style>)
const styleMatch = extractedHTML.match(/<style>([\s\S]*?)<\/style>/);
const cssContent = styleMatch ? styleMatch[1] : '';

console.log('✓ Extracted CSS:', cssContent.length, 'characters');

// Extract JavaScript (everything between <script> and </script>)
const scriptMatch = extractedHTML.match(/<script>([\s\S]*?)<\/script>/);
const jsContent = scriptMatch ? scriptMatch[1] : '';

console.log('✓ Extracted JavaScript:', jsContent.length, 'characters');

// Extract HTML body (everything between <body> and </body>)
const bodyMatch = extractedHTML.match(/<body>([\s\S]*?)<\/body>/);
const bodyContent = bodyMatch ? bodyMatch[1] : '';

console.log('✓ Extracted HTML body:', bodyContent.length, 'characters');

// Save full HTML to file for reference
fs.writeFileSync(path.join(templatesDir, 'full-extracted.html'), extractedHTML.trim());
console.log('✓ Saved full-extracted.html');

// Save CSS to file
fs.writeFileSync(path.join(stylesDir, 'extracted.css'), cssContent.trim());
console.log('✓ Saved extracted.css');

// Save JavaScript to file
fs.writeFileSync(path.join(scriptsDir, 'webview.js'), jsContent.trim());
console.log('✓ Saved webview.js');

// Save HTML body to file
fs.writeFileSync(path.join(templatesDir, 'body-content.html'), bodyContent.trim());
console.log('✓ Saved body-content.html');

console.log('\n✅ Extraction complete!');
console.log('\nFiles created:');
console.log('- src/webview/templates/full-extracted.html (' + extractedHTML.length + ' chars)');
console.log('- src/webview/styles/extracted.css (' + cssContent.length + ' chars)');
console.log('- src/webview/scripts/webview.js (' + jsContent.length + ' chars)');
console.log('- src/webview/templates/body-content.html (' + bodyContent.length + ' chars)');
