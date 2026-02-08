# Script to replace getWebviewContent method
$filePath = "src/extension/SidebarPanelManager.ts"
$lines = Get-Content $filePath

# New method implementation
$newMethod = @'
  private getWebviewContent(): string {
    if (!this.templateLoader) {
      return '<!DOCTYPE html><html><body>Error: Template loader not initialized</body></html>';
    }

    try {
      // Load all CSS files
      const styles = `
        <style>
          ${this.templateLoader.loadStyle('main.css')}
        </style>
        <style>
          ${this.templateLoader.loadStyle('tabs.css')}
        </style>
        <style>
          ${this.templateLoader.loadStyle('settings.css')}
        </style>
        <style>
          ${this.templateLoader.loadStyle('diagram.css')}
        </style>
        <style>
          ${this.templateLoader.loadStyle('security.css')}
        </style>
        <style>
          ${this.templateLoader.loadStyle('quality.css')}
        </style>
      `;

      // Load JavaScript
      const scripts = `
        <script>
          ${this.templateLoader.loadScript('webview.js')}
        </script>
      `;

      // Load all template parts
      const modals = this.templateLoader.loadTemplate('modals.html');
      const tabs = this.templateLoader.loadTemplate('tabs.html');
      const diagramTab = this.templateLoader.loadTemplate('diagram-tab.html');
      const settingsTab = this.templateLoader.loadTemplate('settings-tab.html');
      const securityTab = this.templateLoader.loadTemplate('security-tab.html');
      const qualityTab = this.templateLoader.loadTemplate('quality-tab.html');

      // Load main template and replace placeholders
      const html = this.templateLoader.loadTemplateWithReplacements('main.html', {
        'STYLES': styles,
        'SCRIPTS': scripts,
        'MODALS': modals,
        'TABS': tabs,
        'DIAGRAM_TAB': diagramTab,
        'SETTINGS_TAB': settingsTab,
        'SECURITY_TAB': securityTab,
        'QUALITY_TAB': qualityTab
      });

      return html;
    } catch (error) {
      console.error('Error loading webview content:', error);
      return '<!DOCTYPE html><html><body>Error loading webview content</body></html>';
    }
  }
'@

# Replace lines 600-5278 with the new method
$newLines = @()
$newLines += $lines[0..599]  # Keep everything before the method
$newLines += $newMethod
$newLines += $lines[5279..($lines.Count-1)]  # Keep everything after the method

# Write back to file
$newLines | Out-File $filePath -Encoding UTF8

Write-Host "Method replaced successfully!"
Write-Host "Old method: 4679 lines"
Write-Host "New method: $($newMethod.Split("`n").Count) lines"
Write-Host "Reduction: $(4679 - $newMethod.Split("`n").Count) lines"
