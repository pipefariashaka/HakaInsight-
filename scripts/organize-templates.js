/**
 * Script to organize extracted HTML/CSS into logical files
 */

const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '..', 'src', 'webview', 'templates');
const stylesDir = path.join(__dirname, '..', 'src', 'webview', 'styles');

// Read the full extracted HTML
const fullHTML = fs.readFileSync(path.join(templatesDir, 'full-extracted.html'), 'utf8');

console.log('Organizing templates and styles...\n');

// Extract the body content (between <body> and </body>)
const bodyMatch = fullHTML.match(/<body>([\s\S]*?)<\/body>/);
const bodyContent = bodyMatch ? bodyMatch[1].trim() : '';

// Split body content into sections
const sections = {
    tabs: '',
    diagram: '',
    settings: '',
    security: '',
    quality: '',
    modals: ''
};

// Extract tab navigation
const tabsMatch = bodyContent.match(/<div class="tab-container">([\s\S]*?)<\/div>/);
if (tabsMatch) {
    sections.tabs = tabsMatch[0];
    console.log('✓ Extracted tabs navigation');
}

// Extract diagram tab
const diagramMatch = bodyContent.match(/<div class="tab-content active" id="diagram-tab">([\s\S]*?)(?=<div class="tab-content"|<div class="analysis-modal")/);
if (diagramMatch) {
    sections.diagram = `<div class="tab-content active" id="diagram-tab">${diagramMatch[1]}</div>`;
    console.log('✓ Extracted diagram tab');
}

// Extract settings tab
const settingsMatch = bodyContent.match(/<div class="tab-content" id="settings-tab">([\s\S]*?)(?=<div class="tab-content"|<div class="analysis-modal")/);
if (settingsMatch) {
    sections.settings = `<div class="tab-content" id="settings-tab">${settingsMatch[1]}</div>`;
    console.log('✓ Extracted settings tab');
}

// Extract security tab
const securityMatch = bodyContent.match(/<div class="tab-content" id="security-tab">([\s\S]*?)(?=<div class="tab-content"|<div class="analysis-modal")/);
if (securityMatch) {
    sections.security = `<div class="tab-content" id="security-tab">${securityMatch[1]}</div>`;
    console.log('✓ Extracted security tab');
}

// Extract quality tab
const qualityMatch = bodyContent.match(/<div class="tab-content" id="quality-tab">([\s\S]*?)(?=<div class="analysis-modal")/);
if (qualityMatch) {
    sections.quality = `<div class="tab-content" id="quality-tab">${qualityMatch[1]}</div>`;
    console.log('✓ Extracted quality tab');
}

// Extract modals (everything after quality tab)
const modalsMatch = bodyContent.match(/<div class="analysis-modal"([\s\S]*?)$/);
if (modalsMatch) {
    sections.modals = `<div class="analysis-modal"${modalsMatch[1]}`;
    console.log('✓ Extracted modals');
}

// Save each section to a file
fs.writeFileSync(path.join(templatesDir, 'tabs.html'), sections.tabs);
fs.writeFileSync(path.join(templatesDir, 'diagram-tab.html'), sections.diagram);
fs.writeFileSync(path.join(templatesDir, 'settings-tab.html'), sections.settings);
fs.writeFileSync(path.join(templatesDir, 'security-tab.html'), sections.security);
fs.writeFileSync(path.join(templatesDir, 'quality-tab.html'), sections.quality);
fs.writeFileSync(path.join(templatesDir, 'modals.html'), sections.modals);

console.log('\n✓ Saved all template files');

// Now organize CSS
const fullCSS = fs.readFileSync(path.join(stylesDir, 'extracted.css'), 'utf8');

// Split CSS into logical sections
const cssFiles = {
    'main.css': '',
    'tabs.css': '',
    'settings.css': '',
    'security.css': '',
    'quality.css': '',
    'diagram.css': ''
};

// Extract CSS sections based on class names
const lines = fullCSS.split('\n');
let currentSection = 'main.css';
let currentContent = '';

for (const line of lines) {
    // Determine which file this CSS belongs to
    if (line.includes('.tab-container') || line.includes('.tab-button')) {
        if (currentContent) cssFiles[currentSection] += currentContent;
        currentSection = 'tabs.css';
        currentContent = line + '\n';
    } else if (line.includes('.settings-') || line.includes('.form-group') || line.includes('.button-compact')) {
        if (currentContent && currentSection !== 'settings.css') {
            cssFiles[currentSection] += currentContent;
            currentSection = 'settings.css';
            currentContent = '';
        }
        currentContent += line + '\n';
    } else if (line.includes('.security-') || line.includes('.finding') || line.includes('.severity')) {
        if (currentContent && currentSection !== 'security.css') {
            cssFiles[currentSection] += currentContent;
            currentSection = 'security.css';
            currentContent = '';
        }
        currentContent += line + '\n';
    } else if (line.includes('.quality-') || line.includes('.issue-')) {
        if (currentContent && currentSection !== 'quality.css') {
            cssFiles[currentSection] += currentContent;
            currentSection = 'quality.css';
            currentContent = '';
        }
        currentContent += line + '\n';
    } else if (line.includes('.diagram-') || line.includes('#diagram-svg') || line.includes('.node-') || line.includes('.control-')) {
        if (currentContent && currentSection !== 'diagram.css') {
            cssFiles[currentSection] += currentContent;
            currentSection = 'diagram.css';
            currentContent = '';
        }
        currentContent += line + '\n';
    } else {
        currentContent += line + '\n';
    }
}

// Add remaining content
if (currentContent) {
    cssFiles[currentSection] += currentContent;
}

// Save CSS files
for (const [filename, content] of Object.entries(cssFiles)) {
    if (content.trim()) {
        fs.writeFileSync(path.join(stylesDir, filename), content.trim());
        console.log(`✓ Saved ${filename} (${content.length} chars)`);
    }
}

console.log('\n✅ Organization complete!');
console.log('\nCreated files:');
console.log('Templates:');
console.log('  - tabs.html');
console.log('  - diagram-tab.html');
console.log('  - settings-tab.html');
console.log('  - security-tab.html');
console.log('  - quality-tab.html');
console.log('  - modals.html');
console.log('\nStyles:');
console.log('  - main.css');
console.log('  - tabs.css');
console.log('  - settings.css');
console.log('  - security.css');
console.log('  - quality.css');
console.log('  - diagram.css');
