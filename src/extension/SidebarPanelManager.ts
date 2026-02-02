/**
 * Sidebar Panel Manager
 * Creates and manages the sidebar panel with webview
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DiagramData } from '../models';
import { ISidebarPanelManager } from '../services/types';
import { setCurrentLanguage, clearLanguageCache } from '../i18n/translations';

const ACTIVE_TAB_STATE_KEY = 'code-architect-active-tab';

export class SidebarPanelManager implements ISidebarPanelManager {
  private panel: vscode.WebviewPanel | undefined;
  private globalState: vscode.Memento | undefined;
  private context: vscode.ExtensionContext | undefined;
  private onSaveAPIKeyCallback?: (apiKey: string) => Promise<void>;
  private onClearAPIKeyCallback?: (() => Promise<void>) | undefined;
  private onValidateAPIKeyCallback?: (apiKey: string) => Promise<{ valid: boolean; message: string }>;
  private onSaveModelCallback?: (model: string) => Promise<void>;
  private onApplyLayoutCallback?: (mode: string) => Promise<void>;
  private onGenerateAIReportCallback?: (findings: any[]) => Promise<string>;
  private onGetRecommendationCallback?: (finding: any) => Promise<string>;
  private onGenerateHTMLReportCallback?: () => Promise<void>;
  private onNavigateToDependencyCallback?: (filePath: string) => Promise<void>;
  private onAnalyzeFileCallback?: (filePath: string) => Promise<void>;
  private onUpdateAnalysisCallback?: (filePath: string) => Promise<void>;
  private onToggleFileVisibilityCallback?: (filePath: string, visible: boolean) => Promise<void>;
  private onGetCacheStatsCallback?: () => Promise<void>;
  private onDeepenAnalysisCallback?: (nodeId: string, nodeLabel: string, nodePath?: string) => Promise<void>;
  private messageDisposable: vscode.Disposable | undefined;

  createPanel(context: vscode.ExtensionContext, analysisCache?: any): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.globalState = context.globalState;
    this.context = context;

    this.panel = vscode.window.createWebviewPanel(
      'codeArchitectAnalyzer',
      'Haka Insight',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getWebviewContent();
    this.restoreActiveTab();

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      if (this.messageDisposable) {
        this.messageDisposable.dispose();
        this.messageDisposable = undefined;
      }
    });

    this.messageDisposable = this.panel.webview.onDidReceiveMessage((message) => {
      this.handleWebviewMessage(message);
    });
  }

  switchTab(tabName: 'diagram' | 'settings'): void {
    if (this.globalState) {
      this.globalState.update(ACTIVE_TAB_STATE_KEY, tabName);
    }
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'switchTab',
        tab: tabName,
      });
    }
  }

  updateDiagram(diagramData: DiagramData): void {
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'updateDiagram',
        data: diagramData,
      });
    }
  }

  updateDiagramWithAnalysis(diagramData: DiagramData, analysisResult: any, analyzedFiles?: any[]): void {
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'updateDiagram',
        data: diagramData,
        analysisResult: analysisResult,
        analyzedFiles: analyzedFiles || [],
      });
    }
  }

  updateDiagramWithFiles(diagramData: DiagramData, analyzedFiles: any[]): void {
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'updateDiagram',
        data: diagramData,
        analyzedFiles: analyzedFiles,
      });
    }
  }

  updateDiagramWithCache(diagramData: DiagramData, analyzedFiles: any[], allAnalyses: Map<string, any>): void {
    if (this.panel) {
      // Convert Map to array of analyses for sending
      const analysesArray: any[] = [];
      allAnalyses.forEach((analysis, filePath) => {
        analysesArray.push({
          filePath: filePath,
          analysis: analysis
        });
      });

      this.panel.webview.postMessage({
        command: 'updateDiagramWithCache',
        data: diagramData,
        analyzedFiles: analyzedFiles,
        analyses: analysesArray
      });
    }
  }

  setSelectedModel(model: string): void {
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'setModel',
        model: model,
      });
    }
  }

  updateSecuritySummary(summary: any): void {
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'updateSecuritySummary',
        summary: summary,
      });
    }
  }

  sendCacheStats(stats: any): void {
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'cacheStats',
        stats: stats,
      });
    }
  }

  showWarning(message: string): void {
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'showWarning',
        message,
      });
    }
  }

  setOnSaveAPIKeyCallback(callback: (apiKey: string) => Promise<void>): void {
    this.onSaveAPIKeyCallback = callback;
  }

  setOnClearAPIKeyCallback(callback: () => Promise<void>): void {
    this.onClearAPIKeyCallback = callback;
  }

  setOnValidateAPIKeyCallback(callback: (apiKey: string) => Promise<{ valid: boolean; message: string }>): void {
    this.onValidateAPIKeyCallback = callback;
  }

  setOnSaveModelCallback(callback: (model: string) => Promise<void>): void {
    this.onSaveModelCallback = callback;
  }

  setOnApplyLayoutCallback(callback: (mode: string) => Promise<void>): void {
    this.onApplyLayoutCallback = callback;
  }

  setOnGenerateAIReportCallback(callback: (findings: any[]) => Promise<string>): void {
    this.onGenerateAIReportCallback = callback;
  }

  setOnGetRecommendationCallback(callback: (finding: any) => Promise<string>): void {
    this.onGetRecommendationCallback = callback;
  }

  setOnGenerateHTMLReportCallback(callback: () => Promise<void>): void {
    this.onGenerateHTMLReportCallback = callback;
  }

  setOnNavigateToDependencyCallback(callback: (filePath: string) => Promise<void>): void {
    this.onNavigateToDependencyCallback = callback;
  }

  setOnAnalyzeFileCallback(callback: (filePath: string) => Promise<void>): void {
    this.onAnalyzeFileCallback = callback;
  }

  setOnUpdateAnalysisCallback(callback: (filePath: string) => Promise<void>): void {
    this.onUpdateAnalysisCallback = callback;
  }

  setOnToggleFileVisibilityCallback(callback: (filePath: string, visible: boolean) => Promise<void>): void {
    this.onToggleFileVisibilityCallback = callback;
  }

  setOnGetCacheStatsCallback(callback: () => Promise<void>): void {
    this.onGetCacheStatsCallback = callback;
  }

  setOnDeepenAnalysisCallback(callback: (nodeId: string, nodeLabel: string, nodePath?: string) => Promise<void>): void {
    this.onDeepenAnalysisCallback = callback;
  }

  sendDeepenedExplanation(nodeId: string, explanation: string): void {
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'updateDeepenedExplanation',
        nodeId: nodeId,
        explanation: explanation
      });
    }
  }

  private async handleWebviewMessage(message: any): Promise<void> {
    switch (message.command) {
      case 'switchTab':
        if (this.globalState) {
          await this.globalState.update(ACTIVE_TAB_STATE_KEY, message.tab);
        }
        break;
      case 'changeLanguage':
        console.log('[SidebarPanelManager] Received changeLanguage message:', message.language);
        if (this.context) {
          await setCurrentLanguage(this.context, message.language);
          clearLanguageCache();
          console.log('[SidebarPanelManager] Language changed and cache cleared');
          
          // Notify user that they should re-analyze for language change to take effect
          const languageName = message.language === 'es' ? 'español' : 'English';
          vscode.window.showInformationMessage(
            message.language === 'es' 
              ? `Idioma cambiado a español. Los análisis existentes permanecen en su idioma original. Para ver análisis en español, vuelva a analizar los archivos.`
              : `Language changed to English. Existing analyses remain in their original language. To see analyses in English, re-analyze the files.`
          );
        }
        break;
      case 'deepenAnalysis':
        if (this.onDeepenAnalysisCallback) {
          this.onDeepenAnalysisCallback(message.nodeId, message.nodeLabel, message.nodePath);
        }
        break;
      case 'saveAPIKey':
        if (this.onSaveAPIKeyCallback) {
          try {
            await this.onSaveAPIKeyCallback(message.apiKey);
            this.panel?.webview.postMessage({
              command: 'apiKeySaved',
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.panel?.webview.postMessage({
              command: 'apiKeyError',
              message: errorMessage,
            });
          }
        }
        break;
      case 'clearAPIKey':
        if (this.onClearAPIKeyCallback) {
          try {
            await this.onClearAPIKeyCallback();
            this.panel?.webview.postMessage({
              command: 'apiKeyCleared',
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.panel?.webview.postMessage({
              command: 'apiKeyError',
              message: errorMessage,
            });
          }
        }
        break;
      case 'validateAPIKey':
        if (this.onValidateAPIKeyCallback) {
          try {
            const result = await this.onValidateAPIKeyCallback(message.apiKey);
            this.panel?.webview.postMessage({
              command: 'validationResult',
              valid: result.valid,
              message: result.message,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.panel?.webview.postMessage({
              command: 'validationResult',
              valid: false,
              message: errorMessage,
            });
          }
        }
        break;
      case 'saveModel':
        if (this.onSaveModelCallback) {
          try {
            await this.onSaveModelCallback(message.model);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to save model: ${errorMessage}`);
          }
        }
        break;
      case 'applyLayout':
        if (this.onApplyLayoutCallback) {
          try {
            await this.onApplyLayoutCallback(message.mode);
            this.panel?.webview.postMessage({
              command: 'layoutApplied',
              mode: message.mode,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.panel?.webview.postMessage({
              command: 'layoutError',
              message: errorMessage,
            });
          }
        }
        break;
      case 'generateAIReport':
      case 'regenerateAIReport':
        if (this.onGenerateAIReportCallback) {
          try {
            // Show loading state
            this.panel?.webview.postMessage({
              command: 'aiReportGenerated',
              report: 'loading',
            });
            
            const report = await this.onGenerateAIReportCallback(message.findings || []);
            this.panel?.webview.postMessage({
              command: 'aiReportGenerated',
              report: report,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.panel?.webview.postMessage({
              command: 'aiReportGenerated',
              report: `Error generating report: ${errorMessage}`,
            });
          }
        }
        break;
      case 'getRecommendation':
        if (this.onGetRecommendationCallback) {
          try {
            const recommendation = await this.onGetRecommendationCallback(message.finding);
            this.panel?.webview.postMessage({
              command: 'recommendationGenerated',
              recommendation: recommendation,
              panelId: message.panelId,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.panel?.webview.postMessage({
              command: 'recommendationGenerated',
              recommendation: `Error: ${errorMessage}`,
              panelId: message.panelId,
            });
          }
        }
        break;
      case 'generateHTMLReport':
        if (this.onGenerateHTMLReportCallback) {
          try {
            await this.onGenerateHTMLReportCallback();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to generate report: ${errorMessage}`);
          }
        }
        break;
      case 'navigateToDependency':
        if (this.onNavigateToDependencyCallback) {
          try {
            await this.onNavigateToDependencyCallback(message.filePath);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to navigate: ${errorMessage}`);
          }
        }
        break;
      case 'analyzeFile':
        if (this.onAnalyzeFileCallback) {
          try {
            await this.onAnalyzeFileCallback(message.filePath);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to analyze file: ${errorMessage}`);
          }
        }
        break;
      case 'updateAnalysis':
        if (this.onUpdateAnalysisCallback) {
          try {
            await this.onUpdateAnalysisCallback(message.filePath);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to update analysis: ${errorMessage}`);
          }
        }
        break;
      case 'toggleFileVisibility':
        if (this.onToggleFileVisibilityCallback) {
          try {
            await this.onToggleFileVisibilityCallback(message.filePath, message.visible);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to toggle file visibility: ${errorMessage}`);
          }
        }
        break;
      case 'saveNodePositions':
        // Node positions will be handled by the extension
        // For now, just acknowledge receipt
        console.log('Node positions saved:', message.positions);
        break;
      case 'exportDiagram':
        await this.handleExportDiagram(message.format, message.data);
        break;
      case 'getCacheStats':
        if (this.onGetCacheStatsCallback) {
          try {
            await this.onGetCacheStatsCallback();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Failed to get cache stats:', errorMessage);
          }
        }
        break;
    }
  }

  private async handleExportDiagram(format: string, data: string): Promise<void> {
    try {
      const extensions: { [key: string]: string } = {
        png: 'png',
        svg: 'svg',
        mermaid: 'mmd',
        json: 'json'
      };
      
      const ext = extensions[format] || 'txt';
      const defaultFileName = `architecture-diagram.${ext}`;
      
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(defaultFileName),
        filters: {
          'PNG Image': ['png'],
          'SVG Image': ['svg'],
          'Mermaid Diagram': ['mmd'],
          'JSON': ['json'],
          'All Files': ['*']
        }
      });
      
      if (uri) {
        let buffer: Buffer;
        
        if (format === 'png') {
          // Convert base64 to buffer
          const base64Data = data.replace(/^data:image\/png;base64,/, '');
          buffer = Buffer.from(base64Data, 'base64');
        } else {
          // Text formats
          buffer = Buffer.from(data, 'utf-8');
        }
        
        await vscode.workspace.fs.writeFile(uri, buffer);
        vscode.window.showInformationMessage(`Diagram exported successfully as ${format.toUpperCase()}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to export diagram: ${errorMessage}`);
    }
  }

  private restoreActiveTab(): void {
    if (this.globalState) {
      const savedTab = this.globalState.get<'diagram' | 'settings'>(ACTIVE_TAB_STATE_KEY);
      if (savedTab) {
        this.switchTab(savedTab);
      }
    }
  }

  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Haka Insight</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #1e1e1e;
            color: #e0e0e0;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .tab-container {
            display: flex;
            border-bottom: 1px solid #1a1a1a;
            background-color: #0a0e27;
            flex-shrink: 0;
            padding: 4px 8px 0 8px;
        }
        .tab-button {
            min-width: 90px;
            max-width: 120px;
            flex: 0 1 auto;
            padding: 5px 12px;
            border: 1px solid #1a3a52 !important;
            background-color: rgba(10, 14, 39, 0.5) !important;
            color: #4a90b8 !important;
            cursor: pointer;
            font-size: 9px;
            font-weight: 600;
            border-radius: 5px;
            margin: 0 2px;
            transition: all 0.3s ease;
            position: relative;
            letter-spacing: 0.3px;
            white-space: nowrap;
        }
        .tab-button:hover:not(.active) {
            border-color: #2a5a82 !important;
            color: #6ab0d8 !important;
            background-color: rgba(26, 58, 82, 0.3) !important;
        }
        .tab-button.active {
            background: #0099cc !important;
            color: #ffffff !important;
            border-color: #0099cc !important;
            box-shadow: 
                0 0 10px rgba(0, 153, 204, 0.4),
                0 0 5px rgba(0, 153, 204, 0.3),
                0 2px 6px rgba(0, 153, 204, 0.2) !important;
        }
        .tab-button.active::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            background: linear-gradient(135deg, #0099cc, #007799);
            border-radius: 5px;
            z-index: -1;
            opacity: 0.2;
            filter: blur(3px);
        }
        .content-wrapper {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .tab-content {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            display: none;
        }
        .tab-content.active { display: flex; flex-direction: column; }
        .diagram-container { width: 100%; height: 100%; display: flex; flex-direction: column; gap: 16px; }
        .settings-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .settings-section {
            background-color: #252526;
            border: 1px solid #3e3e42;
            border-radius: 6px;
            margin-bottom: 16px;
            overflow: hidden;
        }
        .settings-section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            background-color: #2d2d30;
            border-bottom: 1px solid #3e3e42;
        }
        .settings-section-icon {
            font-size: 18px;
        }
        .settings-section-title {
            font-size: 14px;
            font-weight: 600;
            color: #cccccc;
        }
        .settings-section-content {
            padding: 16px;
        }
        .form-group-compact {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .label-compact {
            font-size: 12px;
            font-weight: 500;
            color: #858585;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .input-compact {
            max-width: 400px;
            padding: 6px 10px;
            background-color: #3c3c3c;
            border: 1px solid #555555;
            color: #e0e0e0;
            border-radius: 3px;
            font-size: 12px;
            transition: border-color 0.2s ease;
        }
        .input-compact:focus {
            outline: none;
            border-color: #007acc;
            box-shadow: 0 0 0 1px #007acc;
        }
        .input-with-buttons {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .input-api-key {
            width: 100%;
            max-width: 400px;
        }
        .button-group-inline {
            display: flex;
            gap: 8px;
        }
        .button-compact {
            padding: 6px 12px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .button-compact .button-icon {
            font-size: 12px;
        }
        .button-compact .button-text {
            font-size: 11px;
        }
        .button-primary {
            background-color: #007acc;
            color: white;
        }
        .button-primary:hover {
            background-color: #005a9e;
        }
        .button-secondary {
            background-color: #3e3e42;
            color: #cccccc;
        }
        .button-secondary:hover {
            background-color: #4e4e54;
        }
        .button-test {
            background-color: #2d7d2d;
            color: white;
        }
        .button-test:hover {
            background-color: #236623;
        }
        .button-test:disabled {
            background-color: #3e3e42;
            color: #858585;
            cursor: not-allowed;
        }
        .connection-status {
            margin-top: 8px;
            padding: 8px 12px;
            border-radius: 3px;
            font-size: 11px;
            display: none;
        }
        .connection-status.visible {
            display: block;
        }
        .connection-status.success {
            background-color: #1e3a1e;
            border: 1px solid #2d7d2d;
            color: #4ec94e;
        }
        .connection-status.error {
            background-color: #3a1e1e;
            border: 1px solid #7d2d2d;
            color: #e94e4e;
        }
        .connection-status.loading {
            background-color: #2d3a4e;
            border: 1px solid #4e6a8a;
            color: #7db8e9;
        }
        .help-text {
            font-size: 11px;
            color: #858585;
            margin-top: 4px;
        }
        .help-text a {
            color: #007acc;
            text-decoration: none;
        }
        .help-text a:hover {
            text-decoration: underline;
        }
        .button-danger {
            background-color: #7d2d2d;
            color: #ffffff;
        }
        .button-danger:hover {
            background-color: #a03838;
        }
        .cache-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
        }
        .cache-stat-card {
            background-color: #1e1e1e;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            padding: 12px;
            text-align: center;
            transition: border-color 0.2s ease;
        }
        .cache-stat-card:hover {
            border-color: #007acc;
        }
        .cache-stat-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }
        .cache-stat-value {
            font-size: 18px;
            font-weight: 600;
            color: #4ec9b0;
            margin-bottom: 4px;
        }
        .cache-stat-label {
            font-size: 10px;
            color: #858585;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .cache-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        /* Keep old button styles for other parts */
        .button-group { display: flex; gap: 8px; margin-top: 8px; }
        .button-group button:not(.button-compact) {
            flex: 1;
            padding: 8px 16px;
            background-color: #007acc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background-color 0.2s ease;
        }
        .button-group button:not(.button-compact):hover { background-color: #005a9e; }
        .button-group button.secondary:not(.button-compact) {
            background-color: #3e3e42;
            color: #cccccc;
        }
        .button-group button.secondary:not(.button-compact):hover { background-color: #4e4e54; }
        .success-message {
            padding: 12px;
            background-color: #0a3a0a;
            border-left: 3px solid #4ec9b0;
            border-radius: 4px;
            color: #4ec9b0;
            font-size: 13px;
            margin-bottom: 16px;
        }
        .error-message {
            padding: 12px;
            background-color: #3a0a0a;
            border-left: 3px solid #f48771;
            border-radius: 4px;
            color: #f48771;
            font-size: 13px;
            margin-bottom: 16px;
        }
        svg { width: 100%; height: 100%; display: block; }
        #diagram-svg { 
            background-color: #252526; 
            border: 1px solid #3e3e42; 
            border-radius: 4px;
            flex: 1;
            min-height: 300px;
            width: 100%;
        }
        .explanation-container {
            margin-top: 12px;
            padding: 12px;
            background-color: #252526;
            border-radius: 4px;
            border-left: 3px solid #4ec9b0;
            display: none;
        }
        .explanation-container.show { display: block; }
        .explanation-title { font-weight: 500; margin-bottom: 8px; color: #4ec9b0; font-size: 12px; }
        .explanation-text { font-size: 12px; line-height: 1.6; color: #cccccc; }
        .warnings-container {
            margin-top: 12px;
            padding: 12px;
            background-color: #252526;
            border-radius: 4px;
            display: none;
        }
        .warnings-container.show { display: block; }
        .warnings-title { font-weight: 500; margin-bottom: 8px; color: #dcdcaa; font-size: 12px; }
        .warning-item {
            padding: 8px;
            margin-bottom: 6px;
            background-color: #1e1e1e;
            border-left: 3px solid #dcdcaa;
            border-radius: 2px;
            font-size: 11px;
            line-height: 1.4;
        }
        .warning-item.high { border-left-color: #f48771; }
        .warning-item.medium { border-left-color: #dcdcaa; }
        .warning-item.low { border-left-color: #4ec9b0; }
        .node-popup {
            position: fixed;
            background-color: #2d2d30;
            border: 1px solid #007acc;
            border-radius: 4px;
            padding: 12px;
            max-width: 300px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            display: none;
        }
        .node-popup.show { display: block; }
        .node-popup-title { font-weight: bold; color: #007acc; margin-bottom: 8px; font-size: 12px; }
        .node-popup-description { color: #cccccc; font-size: 11px; line-height: 1.5; }
        .context-menu {
            position: fixed;
            background-color: #2d2d30;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            padding: 4px 0;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            display: none;
            min-width: 150px;
        }
        .context-menu.show { display: block; }
        .context-menu-item {
            padding: 8px 16px;
            cursor: pointer;
            font-size: 12px;
            color: #cccccc;
            transition: background-color 0.2s ease;
        }
        .context-menu-item:hover { background-color: #3e3e42; }
        .left-menu {
            position: fixed;
            left: 0;
            top: 0;
            width: 250px;
            height: 100vh;
            background-color: #1e1e1e;
            border-right: 1px solid #3e3e42;
            overflow-y: auto;
            z-index: 999;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
        .left-menu.show { transform: translateX(0); }
        .left-menu-header {
            padding: 16px;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .left-menu-title { font-weight: bold; color: #007acc; font-size: 13px; }
        .left-menu-close { cursor: pointer; color: #858585; font-size: 18px; }
        .left-menu-item {
            padding: 12px 16px;
            border-bottom: 1px solid #2d2d30;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        .left-menu-item:hover { background-color: #2d2d30; }
        .left-menu-item.active { background-color: #007acc; color: white; }
        .left-menu-item-name { font-size: 12px; color: #cccccc; }
        .left-menu-item.active .left-menu-item-name { color: white; }
        .control-buttons {
            position: absolute;
            bottom: 20px;
            left: 20px;
            display: flex;
            flex-direction: row;
            gap: 8px;
            z-index: 100;
        }
        .control-button {
            width: 36px;
            height: 36px;
            padding: 8px;
            background-color: rgba(10, 14, 39, 0.5);
            border: 1px solid #1a3a52;
            border-radius: 4px;
            color: #cccccc;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        .control-button:hover { 
            background-color: #0099cc;
            color: #ffffff;
            border-color: #0099cc;
        }
        .control-button.export-button {
            background-color: rgba(10, 14, 39, 0.5);
            border: 1px solid #1a3a52;
        }
        .control-button.export-button:hover {
            background-color: #0099cc;
            color: #ffffff;
            border-color: #0099cc;
        }
        .export-menu {
            position: absolute;
            bottom: 70px;
            left: 20px;
            background-color: #2d2d30;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            padding: 4px 0;
            z-index: 101;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            display: none;
            min-width: 180px;
        }
        .export-menu.show { display: block; }
        .export-menu-item {
            padding: 8px 16px;
            cursor: pointer;
            font-size: 12px;
            color: #cccccc;
            transition: background-color 0.2s ease;
        }
        .export-menu-item:hover { background-color: #3e3e42; }
        .export-menu-item-icon {
            margin-right: 8px;
        }
        .diagram-wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
        .details-panel {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40%;
            min-height: 200px;
            max-height: 80%;
            background-color: #252526;
            border-top: 2px solid #007acc;
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.5);
            z-index: 200;
            transform: translateY(100%);
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
        }
        .details-panel.show {
            transform: translateY(0);
        }
        .details-panel-resizer {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            cursor: ns-resize;
            background: transparent;
            z-index: 201;
        }
        .details-panel-resizer:hover {
            background: rgba(0, 122, 204, 0.3);
        }
        .details-panel-resizer::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 2px;
            background: #858585;
            border-radius: 2px;
        }
        .details-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #3e3e42;
            background-color: #2d2d30;
            flex-shrink: 0;
        }
        .details-panel-title {
            font-size: 14px;
            font-weight: bold;
            color: #007acc;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .cache-badge {
            display: inline-block;
            padding: 2px 8px;
            background-color: #4ec9b0;
            color: #1e1e1e;
            font-size: 10px;
            font-weight: 600;
            border-radius: 3px;
            text-transform: uppercase;
        }
        .details-panel-close {
            cursor: pointer;
            color: #858585;
            font-size: 20px;
            padding: 0 8px;
            transition: color 0.2s ease;
        }
        .details-panel-close:hover {
            color: #cccccc;
        }
        .details-panel-content {
            padding: 16px;
            overflow-y: auto;
            flex: 1;
        }
        .details-section {
            margin-bottom: 16px;
        }
        .cache-info-section {
            background-color: #1e1e1e;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #3e3e42;
        }
        .cache-info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
        }
        .cache-timestamp {
            font-size: 11px;
            color: #858585;
            flex: 1;
        }
        .update-analysis-btn {
            padding: 6px 12px;
            background-color: #007acc;
            color: #ffffff;
            border: none;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        .update-analysis-btn:hover {
            background-color: #005a9e;
        }
        .details-section-title {
            font-size: 12px;
            font-weight: 500;
            color: #4ec9b0;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .details-section-text {
            font-size: 12px;
            line-height: 1.6;
            color: #cccccc;
        }
        .details-section-text h1,
        .details-section-text h2,
        .details-section-text h3 {
            color: #4ec9b0;
            margin: 12px 0 8px 0;
            font-weight: 600;
        }
        .details-section-text h1 { font-size: 16px; }
        .details-section-text h2 { font-size: 14px; }
        .details-section-text h3 { font-size: 13px; }
        .details-section-text strong {
            color: #dcdcaa;
            font-weight: 600;
        }
        .details-section-text em {
            color: #ce9178;
            font-style: italic;
        }
        .details-section-text code {
            background-color: #1e1e1e;
            color: #d7ba7d;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 11px;
        }
        .details-section-text pre {
            background-color: #1e1e1e;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 8px 0;
        }
        .details-section-text pre code {
            background: none;
            padding: 0;
        }
        .details-section-text p {
            margin: 8px 0;
        }
        .details-section-text br {
            display: block;
            content: "";
            margin: 4px 0;
        }
        .details-warning-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .details-warning-item {
            padding: 8px 12px;
            background-color: #1e1e1e;
            border-left: 3px solid;
            border-radius: 2px;
            font-size: 11px;
            line-height: 1.4;
        }
        .details-warning-item.high {
            border-left-color: #f48771;
        }
        .details-warning-item.medium {
            border-left-color: #dcdcaa;
        }
        .details-warning-item.low {
            border-left-color: #4ec9b0;
        }
        .details-dependencies-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .details-dependency-tag {
            padding: 4px 8px;
            background-color: #1e1e1e;
            border: 1px solid #3e3e42;
            border-radius: 3px;
            font-size: 11px;
            color: #cccccc;
        }
        
        /* Security Tab Styles */
        .security-container {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .security-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
        }
        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.5;
        }
        .empty-state-title {
            font-size: 18px;
            font-weight: 600;
            color: #cccccc;
            margin-bottom: 8px;
        }
        .empty-state-message {
            font-size: 13px;
            color: #858585;
        }
        .security-content {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        .security-summary {
            background-color: #252526;
            border: 1px solid #3e3e42;
            border-radius: 6px;
            padding: 20px;
        }
        .summary-header h3 {
            margin: 0 0 16px 0;
            font-size: 16px;
            color: #cccccc;
        }
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
        }
        .stat-card {
            background-color: #1e1e1e;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            padding: 16px;
            text-align: center;
        }
        .stat-card.stat-high {
            border-left: 3px solid #f48771;
        }
        .stat-card.stat-medium {
            border-left: 3px solid #dcdcaa;
        }
        .stat-card.stat-low {
            border-left: 3px solid #4ec9b0;
        }
        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 4px;
        }
        .stat-label {
            font-size: 11px;
            color: #858585;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .risk-level-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 16px;
            background-color: #1e1e1e;
            border-radius: 4px;
        }
        .risk-level-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .risk-level-label {
            font-size: 13px;
            color: #cccccc;
            font-weight: 500;
        }
        .risk-level-badge {
            padding: 6px 16px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .risk-level-badge.critical {
            background-color: #5a1e1e;
            color: #f48771;
            border: 1px solid #f48771;
        }
        .risk-level-badge.high {
            background-color: #5a3a1e;
            color: #dcdcaa;
            border: 1px solid #dcdcaa;
        }
        .risk-level-badge.medium {
            background-color: #1e3a5a;
            color: #4ec9b0;
            border: 1px solid #4ec9b0;
        }
        .risk-level-badge.low {
            background-color: #1e5a1e;
            color: #4ec94e;
            border: 1px solid #4ec94e;
        }
        .risk-info-button {
            width: 18px;
            height: 18px;
            min-width: 18px;
            min-height: 18px;
            flex-shrink: 0;
            border-radius: 50%;
            background-color: rgba(125, 184, 233, 0.2);
            color: #7db8e9;
            border: 1px solid #7db8e9;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            padding: 0;
            margin-left: auto;
        }
        .risk-info-button:hover {
            background-color: #0099cc;
            color: #ffffff;
            border-color: #0099cc;
            transform: scale(1.15);
        }
        .risk-info-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        .risk-info-modal.show {
            display: flex;
        }
        .risk-info-content {
            background-color: #1e1e1e;
            border: 1px solid #3e3e42;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .risk-info-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #3e3e42;
        }
        .risk-info-header h4 {
            margin: 0;
            font-size: 15px;
            color: #7db8e9;
        }
        .risk-info-close {
            background: none;
            border: none;
            color: #858585;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 3px;
            transition: all 0.2s ease;
        }
        .risk-info-close:hover {
            background-color: #3e3e42;
            color: #ffffff;
        }
        .risk-info-body {
            padding: 20px;
            color: #cccccc;
            font-size: 12px;
            line-height: 1.6;
        }
        .risk-info-body p {
            margin: 0 0 16px 0;
        }
        .risk-formula {
            background-color: rgba(10, 14, 39, 0.3);
            border: 1px solid #1a3a52;
            border-radius: 6px;
            padding: 12px;
            margin: 12px 0;
        }
        .risk-formula-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 8px 0;
        }
        .severity-badge {
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            min-width: 60px;
            text-align: center;
        }
        .severity-badge.high {
            background-color: #5a1e1e;
            color: #f48771;
            border: 1px solid #f48771;
        }
        .severity-badge.medium {
            background-color: #5a3a1e;
            color: #dcdcaa;
            border: 1px solid #dcdcaa;
        }
        .severity-badge.low {
            background-color: #1e5a1e;
            color: #4ec94e;
            border: 1px solid #4ec94e;
        }
        .formula-text {
            color: #7db8e9;
            font-family: 'Courier New', monospace;
        }
        .risk-levels {
            margin-top: 16px;
        }
        .risk-level-item {
            padding: 10px 12px;
            margin: 8px 0;
            border-radius: 6px;
            border-left: 3px solid;
        }
        .risk-level-item.critical {
            background-color: rgba(90, 30, 30, 0.2);
            border-left-color: #f48771;
        }
        .risk-level-item.high {
            background-color: rgba(90, 58, 30, 0.2);
            border-left-color: #dcdcaa;
        }
        .risk-level-item.medium {
            background-color: rgba(30, 58, 90, 0.2);
            border-left-color: #4ec9b0;
        }
        .risk-level-item.low {
            background-color: rgba(30, 90, 30, 0.2);
            border-left-color: #4ec94e;
        }
        .risk-level-item strong {
            display: block;
            margin-bottom: 4px;
            font-size: 11px;
        }
        .risk-level-item p {
            margin: 0;
            font-size: 11px;
            color: #cccccc;
        }
        .ai-report-section {
            margin-top: 20px;
            padding: 20px;
            background-color: rgba(10, 14, 39, 0.3);
            border-radius: 6px;
            border: 1px solid #1a3a52;
        }
        .ai-report-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(26, 58, 82, 0.5);
        }
        .ai-report-header h4 {
            margin: 0;
            font-size: 14px;
            color: #7db8e9;
            font-weight: 600;
        }
        .button-regenerate {
            padding: 5px 12px;
            background-color: rgba(10, 14, 39, 0.5);
            color: #7db8e9;
            border: 1px solid #1a3a52;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        .button-regenerate:hover {
            background-color: #0099cc;
            color: #ffffff;
            border-color: #0099cc;
        }
        .button-regenerate:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .button-regenerate .button-icon {
            font-size: 11px;
        }
        .ai-report-content {
            position: relative;
            min-height: 60px;
        }
        .ai-report-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px 20px;
            gap: 12px;
        }
        .loading-spinner {
            width: 28px;
            height: 28px;
            border: 3px solid rgba(26, 58, 82, 0.3);
            border-top-color: #0099cc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .loading-text {
            font-size: 11px;
            color: #7db8e9;
        }
        .ai-report-text {
            font-size: 12px;
            line-height: 1.7;
            color: #cccccc;
            white-space: pre-wrap;
            padding: 8px;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
        }
        .security-findings {
            background-color: #252526;
            border: 1px solid #3e3e42;
            border-radius: 6px;
            padding: 20px;
        }
        .findings-header h3 {
            margin: 0 0 16px 0;
            font-size: 16px;
            color: #cccccc;
        }
        #findings-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .finding-item {
            background-color: #1e1e1e;
            border: 1px solid #3e3e42;
            border-left: 3px solid #858585;
            border-radius: 4px;
            padding: 12px;
        }
        .finding-item.high {
            border-left-color: #f48771;
        }
        .finding-item.medium {
            border-left-color: #dcdcaa;
        }
        .finding-item.low {
            border-left-color: #4ec9b0;
        }
        .finding-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .finding-type {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .finding-type-badge {
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .finding-type-badge.security {
            background-color: #5a1e1e;
            color: #f48771;
        }
        .finding-type-badge.logic {
            background-color: #5a3a1e;
            color: #dcdcaa;
        }
        .finding-type-badge.bestPractice {
            background-color: #1e3a5a;
            color: #4ec9b0;
        }
        .finding-severity {
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .finding-severity.high {
            background-color: #5a1e1e;
            color: #f48771;
        }
        .finding-severity.medium {
            background-color: #5a3a1e;
            color: #dcdcaa;
        }
        .finding-severity.low {
            background-color: #1e5a1e;
            color: #4ec94e;
        }
        .finding-message {
            font-size: 12px;
            color: #cccccc;
            margin-bottom: 4px;
        }
        .finding-file {
            font-size: 11px;
            color: #7db8e9;
            background-color: rgba(125, 184, 233, 0.1);
            padding: 4px 8px;
            border-radius: 3px;
            display: inline-block;
            margin-top: 6px;
            margin-bottom: 6px;
            font-family: 'Courier New', monospace;
            border: 1px solid rgba(125, 184, 233, 0.2);
        }
        .finding-file::before {
            content: '📄 ';
            margin-right: 4px;
        }
        .finding-actions {
            margin-top: 8px;
            display: flex;
            gap: 8px;
        }
        .button-recommendation {
            padding: 5px 12px;
            background-color: rgba(10, 14, 39, 0.5);
            color: #7db8e9;
            border: 1px solid #1a3a52;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s ease;
            width: auto;
            white-space: nowrap;
        }
        .button-recommendation:hover {
            background-color: #0099cc;
            color: #ffffff;
            border-color: #0099cc;
        }
        .button-recommendation:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .recommendation-panel {
            margin-top: 8px;
            padding: 12px;
            background-color: #252526;
            border: 1px solid #4e6a8a;
            border-radius: 4px;
            display: none;
        }
        .recommendation-panel.visible {
            display: block;
        }
        .recommendation-loading {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #858585;
            font-size: 11px;
        }
        .recommendation-loading .loading-spinner {
            width: 16px;
            height: 16px;
            border-width: 2px;
        }
        .recommendation-text {
            font-size: 11px;
            line-height: 1.6;
            color: #cccccc;
            white-space: pre-wrap;
        }
        .security-actions {
            display: flex;
            justify-content: center;
            padding: 20px;
        }
        .button-generate-report {
            padding: 12px 24px;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .button-generate-report .button-icon {
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="left-menu" id="left-menu">
        <div class="left-menu-header">
            <div class="left-menu-title">Analyzed Files</div>
            <div class="left-menu-close" id="left-menu-close">✕</div>
        </div>
        <div id="analyzed-files-list"></div>
    </div>

    <div class="tab-container">
        <button class="tab-button active" data-tab="diagram">Diagrama</button>
        <button class="tab-button" data-tab="security">Seguridad</button>
        <button class="tab-button" data-tab="settings">Config</button>
    </div>

    <div class="content-wrapper">
        <div class="tab-content active" id="diagram-tab">
            <div class="diagram-container">
                <div class="diagram-wrapper">
                    <svg id="diagram-svg"></svg>
                    
                    <!-- Unified control buttons in bottom-left corner -->
                    <div class="control-buttons">
                        <button class="control-button menu-button" id="menu-button" title="Menu">☰</button>
                        <button class="control-button export-button" id="export-button" title="Export">📤</button>
                        <button class="control-button" id="zoom-in-button" title="Zoom In">+</button>
                        <button class="control-button" id="zoom-out-button" title="Zoom Out">−</button>
                        <button class="control-button" id="reset-zoom-button" title="Reset">⟲</button>
                    </div>
                    
                    <!-- Export menu -->
                    <div class="export-menu" id="export-menu">
                        <div class="export-menu-item" data-format="png">
                            <span class="export-menu-item-icon">🖼️</span>Export as PNG
                        </div>
                        <div class="export-menu-item" data-format="svg">
                            <span class="export-menu-item-icon">📐</span>Export as SVG
                        </div>
                        <div class="export-menu-item" data-format="mermaid">
                            <span class="export-menu-item-icon">📊</span>Export as Mermaid
                        </div>
                        <div class="export-menu-item" data-format="json">
                            <span class="export-menu-item-icon">📄</span>Export as JSON
                        </div>
                    </div>
                </div>
                <div class="explanation-container" id="explanation-container">
                    <div class="explanation-title">📝 Code Explanation</div>
                    <div class="explanation-text" id="explanation-text"></div>
                </div>
                <div class="warnings-container" id="warnings-container">
                    <div class="warnings-title">⚠️ Warnings</div>
                    <div id="warnings-content"></div>
                </div>
            </div>
        </div>

        <div class="tab-content" id="settings-tab">
            <div class="settings-container">
                <div class="settings-section">
                    <div class="settings-section-header">
                        <span class="settings-section-icon">🌍</span>
                        <span class="settings-section-title">Language Settings</span>
                    </div>
                    <div class="settings-section-content">
                        <div class="form-group-compact">
                            <label for="language" class="label-compact">Display Language</label>
                            <select id="language-select" class="input-compact">
                                <option value="en">English</option>
                                <option value="es">Español</option>
                            </select>
                        </div>
                        <button id="save-language-btn" class="button-primary" style="margin-top: 10px;">
                            Save Language
                        </button>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-header">
                        <span class="settings-section-icon">🎯</span>
                        <span class="settings-section-title">Diagram Layout</span>
                    </div>
                    <div class="settings-section-content">
                        <div class="form-group-compact">
                            <label for="layout-mode" class="label-compact">Layout Optimization</label>
                            <select id="layout-mode" class="input-compact">
                                <option value="ai" selected>AI-Optimized (Gemini)</option>
                                <option value="hierarchical">Hierarchical (Layered)</option>
                                <option value="auto">Automatic (D3 Force-Directed)</option>
                            </select>
                            <div class="help-text">
                                <strong>AI-Optimized:</strong> Gemini analyzes and optimizes the layout (requires API key)<br>
                                <strong>Hierarchical:</strong> Organized in layers, reduces crossings<br>
                                <strong>Automatic:</strong> Fast, physics-based layout
                            </div>
                        </div>
                        <button id="apply-layout-btn" class="button-primary" style="margin-top: 10px;">
                            Apply Layout
                        </button>
                        <div id="layout-status" class="connection-status"></div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-header">
                        <span class="settings-section-icon">�</span>
                        <span class="settings-section-title">API Configuration</span>
                    </div>
                    <div class="settings-section-content">
                        <div class="form-group-compact">
                            <label for="api-key" class="label-compact">Gemini API Key</label>
                            <div class="input-with-buttons">
                                <input type="password" id="api-key" class="input-compact input-api-key" placeholder="Enter your Gemini API Key">
                                <div class="button-group-inline">
                                    <button class="button-compact button-primary" id="save-api-key-btn">
                                        <span class="button-icon">💾</span>
                                        <span class="button-text">Save</span>
                                    </button>
                                    <button class="button-compact button-secondary" id="clear-api-key-btn">
                                        <span class="button-icon">🗑️</span>
                                        <span class="button-text">Clear</span>
                                    </button>
                                </div>
                            </div>
                            <div class="help-text">
                                Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a>
                            </div>
                        </div>
                        
                        <div class="form-group-compact" style="margin-top: 16px;">
                            <button class="button-compact button-test" id="test-connection-btn">
                                <span class="button-icon">🔌</span>
                                <span class="button-text">Test Connection</span>
                            </button>
                            <div id="connection-status" class="connection-status"></div>
                        </div>
                        
                        <div class="form-group-compact" style="margin-top: 16px;">
                            <label for="model" class="label-compact">Model</label>
                            <select id="model" class="input-compact">
                                <option value="gemini-3-flash-preview">Gemini 3 Flash (Lite) - Faster</option>
                                <option value="gemini-3-pro">Gemini 3 Pro - More Detailed</option>
                            </select>
                            <div class="help-text">
                                Flash is faster and cheaper, Pro provides more detailed analysis
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-header">
                        <span class="settings-section-icon">💾</span>
                        <span class="settings-section-title">Cache Statistics</span>
                    </div>
                    <div class="settings-section-content">
                        <div class="cache-stats-grid">
                            <div class="cache-stat-card">
                                <div class="cache-stat-icon">📊</div>
                                <div class="cache-stat-value" id="cache-stat-files">0</div>
                                <div class="cache-stat-label">Cached Analyses</div>
                            </div>
                            <div class="cache-stat-card">
                                <div class="cache-stat-icon">💰</div>
                                <div class="cache-stat-value" id="cache-stat-tokens">0</div>
                                <div class="cache-stat-label">Tokens Saved (est.)</div>
                            </div>
                            <div class="cache-stat-card">
                                <div class="cache-stat-icon">🕒</div>
                                <div class="cache-stat-value" id="cache-stat-time">Never</div>
                                <div class="cache-stat-label">Last Updated</div>
                            </div>
                            <div class="cache-stat-card">
                                <div class="cache-stat-icon">📦</div>
                                <div class="cache-stat-value" id="cache-stat-size">0 KB</div>
                                <div class="cache-stat-label">Cache Size (est.)</div>
                            </div>
                        </div>
                        <div class="cache-actions" style="margin-top: 16px;">
                            <button class="button-compact button-secondary" id="refresh-cache-stats-btn">
                                <span class="button-icon">🔄</span>
                                <span class="button-text">Refresh Stats</span>
                            </button>
                            <button class="button-compact button-danger" id="clear-cache-settings-btn">
                                <span class="button-icon">🗑️</span>
                                <span class="button-text">Clear Cache</span>
                            </button>
                        </div>
                        <div class="help-text" style="margin-top: 12px;">
                            Cache stores previous analyses to save API tokens and improve performance
                        </div>
                    </div>
                </div>

                <div id="status-message"></div>
            </div>
        </div>
        
        <div class="tab-content" id="security-tab">
            <div class="security-container">
                <div class="security-empty-state" id="security-empty-state">
                    <div class="empty-state-icon">🔒</div>
                    <div class="empty-state-title">No Security Analysis Available</div>
                    <div class="empty-state-message">
                        Analyze some files to see security and quality findings here.
                    </div>
                </div>
                
                <div class="security-content" id="security-content" style="display: none;">
                    <div class="security-summary" id="security-summary">
                        <div class="summary-header">
                            <h3 data-i18n="analysisSummary">📊 Analysis Summary</h3>
                        </div>
                        <div class="summary-stats">
                            <div class="stat-card">
                                <div class="stat-value" id="total-findings">0</div>
                                <div class="stat-label" data-i18n="totalFindings">Total Findings</div>
                            </div>
                            <div class="stat-card stat-high">
                                <div class="stat-value" id="high-severity">0</div>
                                <div class="stat-label" data-i18n="highSeverity">High Severity</div>
                            </div>
                            <div class="stat-card stat-medium">
                                <div class="stat-value" id="medium-severity">0</div>
                                <div class="stat-label" data-i18n="mediumSeverity">Medium Severity</div>
                            </div>
                            <div class="stat-card stat-low">
                                <div class="stat-value" id="low-severity">0</div>
                                <div class="stat-label" data-i18n="lowSeverity">Low Severity</div>
                            </div>
                        </div>
                        <div class="risk-level-container">
                            <div class="risk-level-content">
                                <div class="risk-level-label" data-i18n="overallRiskLevel">Overall Risk Level:</div>
                                <div class="risk-level-badge" id="risk-level-badge" data-i18n="riskLow">Low</div>
                            </div>
                            <button class="risk-info-button" id="risk-info-btn" title="How is risk calculated?">?</button>
                        </div>
                        
                        <div class="ai-report-section" id="ai-report-section" style="display: none;">
                            <div class="ai-report-header">
                                <h4 data-i18n="aiExecutiveSummary">🤖 AI Executive Summary</h4>
                                <button class="button-regenerate" id="regenerate-btn">
                                    <span class="button-icon">🔄</span>
                                    <span class="button-text" data-i18n="regenerate">Regenerate</span>
                                </button>
                            </div>
                            <div class="ai-report-content" id="ai-report-content">
                                <div class="ai-report-loading" id="ai-report-loading">
                                    <div class="loading-spinner"></div>
                                    <div class="loading-text" data-i18n="generatingAISummary">Generating AI summary...</div>
                                </div>
                                <div class="ai-report-text" id="ai-report-text"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="security-findings" id="security-findings">
                        <div class="findings-header">
                            <h3 data-i18n="findings">🔍 Findings</h3>
                        </div>
                        <div id="findings-list"></div>
                    </div>
                    
                    <div class="security-actions">
                        <button class="button-primary button-generate-report" id="generate-report-btn">
                            <span class="button-icon">📄</span>
                            <span class="button-text" data-i18n="generateReport">Generate Report</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="node-popup" id="node-popup">
        <div class="node-popup-title" id="popup-title"></div>
        <div class="node-popup-description" id="popup-description"></div>
    </div>

    <div class="context-menu" id="context-menu">
        <div class="context-menu-item" id="analyze-context-file">Analyze</div>
        <div class="context-menu-item" id="update-context-file">Update Analysis</div>
    </div>

    <div class="details-panel" id="details-panel">
        <div class="details-panel-resizer" id="details-panel-resizer"></div>
        <div class="details-panel-header">
            <div class="details-panel-title" id="details-panel-title">📋 File Analysis Details</div>
            <div class="details-panel-close" id="details-panel-close">✕</div>
        </div>
        <div class="details-panel-content" id="details-panel-content">
            <!-- Content will be populated dynamically -->
        </div>
    </div>

    <!-- Risk calculation info modal -->
    <div class="risk-info-modal" id="risk-info-modal">
        <div class="risk-info-content">
            <div class="risk-info-header">
                <h4>Risk Level Calculation</h4>
                <button class="risk-info-close" id="risk-info-close">X</button>
            </div>
            <div class="risk-info-body">
                <p><strong>How we calculate the overall risk level:</strong></p>
                
                <div class="risk-formula">
                    <div class="risk-formula-item">
                        <span class="severity-badge high">High</span>
                        <span class="formula-text">x 5 points</span>
                    </div>
                    <div class="risk-formula-item">
                        <span class="severity-badge medium">Medium</span>
                        <span class="formula-text">x 2 points</span>
                    </div>
                    <div class="risk-formula-item">
                        <span class="severity-badge low">Low</span>
                        <span class="formula-text">x 1 point</span>
                    </div>
                </div>
                
                <div class="risk-levels">
                    <div class="risk-level-item critical">
                        <strong>CRITICAL</strong>
                        <p>Any high severity finding OR score &gt;= 12</p>
                    </div>
                    <div class="risk-level-item high">
                        <strong>HIGH</strong>
                        <p>Score &gt;= 6 (e.g., 3 medium issues)</p>
                    </div>
                    <div class="risk-level-item medium">
                        <strong>MEDIUM</strong>
                        <p>Score &gt;= 3 (e.g., 1-2 medium issues)</p>
                    </div>
                    <div class="risk-level-item low">
                        <strong>LOW</strong>
                        <p>Score &lt; 3 (only low severity findings)</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let diagramRenderer = null;
        let currentDiagramData = null;
        let currentLanguage = 'en';
        let zoomLevel = 1;
        let panX = 0;
        let panY = 0;
        let draggedNode = null;
        let dragStartX = 0;
        let dragStartY = 0;
        let fileVisibilityMap = new Map(); // Track which files are visible
        let currentFindings = []; // Store current findings for regeneration
        let analysisDataMap = new Map(); // Store analysis data for each file
        
        // Helper functions to avoid regex in code (causes issues in VS Code webviews)
        function sanitizeId(str) {
            return str.toLowerCase()
                .split('').map(c => /[a-z0-9]/.test(c) ? c : '_').join('')
                .split('_').filter(s => s).join('_');
        }
        
        function removeUnderscores(str) {
            return str.split('_').join('');
        }
        
        function escapeQuotes(str) {
            return str.split('"').join('\\\\"');
        }
        
        function replaceDoubleNewlines(str) {
            return str.split('\\n\\n').join('</p><p>');
        }
        
        function replaceSingleNewlines(str) {
            return str.split('\\n').join('<br>');
        }
        
        const translations = {
            en: {
                // Tabs
                language: 'Language / Idioma',
                diagram: 'Diagram',
                settings: 'Settings',
                security: 'Security Analysis',
                
                // Settings
                apiKey: 'Gemini API Key',
                save: 'Save',
                clear: 'Clear',
                enterApiKey: 'Enter your Gemini API Key',
                languageSettings: 'Language Settings',
                apiConfiguration: 'API Configuration',
                displayLanguage: 'Display Language',
                getApiKey: 'Get your API key from',
                
                // Messages
                analysisComplete: 'Analysis complete!',
                apiKeySaved: 'API Key saved successfully',
                apiKeyCleared: 'API Key cleared',
                
                // Diagram sections
                codeExplanation: 'Code Explanation',
                warnings: 'Warnings',
                
                // Warning types
                security: 'Security',
                logic: 'Logic',
                bestPractice: 'Best Practice',
                securityWarnings: 'Security Warnings',
                logicWarnings: 'Logic Warnings',
                bestPracticeSuggestions: 'Best Practice Suggestions',
                
                // Left menu
                analyzedFiles: 'Analyzed Files',
                
                // Export menu
                export: 'Export',
                exportAsPNG: 'Export as PNG',
                exportAsSVG: 'Export as SVG',
                exportAsMermaid: 'Export as Mermaid',
                exportAsJSON: 'Export as JSON',
                
                // Zoom controls
                zoomIn: 'Zoom In',
                zoomOut: 'Zoom Out',
                reset: 'Reset',
                
                // Context menu
                analyze: 'Analyze',
                updateAnalysis: 'Update Analysis',
                
                // Details panel
                fileAnalysisDetails: 'File Analysis Details',
                explanation: 'Explanation',
                dependencies: 'Dependencies',
                noAnalysisData: 'No analysis data available for this file.',
                noDetailedAnalysis: 'No detailed analysis available.',
                fromCache: 'From Cache',
                cachedAt: 'Cached at',
                clearCache: 'Clear Cache',
                cacheCleared: 'Analysis cache cleared',
                cacheError: 'Failed to load cache',
                confirmClearCache: 'Are you sure you want to clear the cache? This will remove all cached analyses.',
                never: 'Never',
                
                // Node popup
                noDescription: 'No description available',
                
                // Status messages
                analyzing: 'Analyzing file...',
                analysisFailed: 'Analysis failed',
                diagramCleared: 'Diagram and cache cleared successfully',
                exportSuccess: 'Diagram exported successfully',
                exportFailed: 'Failed to export diagram',
                
                // Errors
                error: 'Error',
                pleaseEnterApiKey: 'Please enter an API Key',
                apiKeyNotConfigured: 'API Key not configured. Please set your Gemini API Key in the Settings tab.',
                failedToNavigate: 'Failed to navigate',
                failedToAnalyze: 'Failed to analyze file',
                failedToUpdate: 'Failed to update analysis',
                failedToToggle: 'Failed to toggle file visibility',
                
                // API Key validation
                testConnection: 'Test Connection',
                testingConnection: 'Testing connection...',
                connectionSuccess: 'Connection successful! API Key is valid.',
                connectionFailed: 'Connection failed',
                
                // Model selection
                model: 'Model',
                modelFlash: 'Gemini 3 Flash (Lite) - Faster',
                modelPro: 'Gemini 3 Pro - More Detailed',
                modelSaved: 'Model preference saved',
                modelHelp: 'Flash is faster and cheaper, Pro provides more detailed analysis',
                
                // Security tab
                noSecurityAnalysis: 'No Security Analysis Available',
                analyzeFilesPrompt: 'Analyze some files to see security and quality findings here.',
                analysisSummary: 'Analysis Summary',
                totalFindings: 'Total Findings',
                highSeverity: 'High Severity',
                mediumSeverity: 'Medium Severity',
                lowSeverity: 'Low Severity',
                overallRiskLevel: 'Overall Risk Level:',
                findings: 'Findings',
                generateReport: 'Generate Report',
                riskCritical: 'Critical',
                riskHigh: 'High',
                riskMedium: 'Medium',
                riskLow: 'Low',
                securityType: 'Security',
                logicType: 'Logic',
                bestPracticeType: 'Best Practice',
                aiExecutiveSummary: 'AI Executive Summary',
                regenerate: 'Regenerate',
                generatingAISummary: 'Generating AI summary...',
                getRecommendation: 'Get Recommendation',
                recommendation: 'Recommendation',
                loadingRecommendation: 'Loading recommendation...'
            },
            es: {
                // Tabs
                language: 'Idioma / Language',
                diagram: 'Diagrama',
                settings: 'Configuración',
                security: 'Análisis de Seguridad',
                
                // Settings
                apiKey: 'Clave API de Gemini',
                save: 'Guardar',
                clear: 'Limpiar',
                enterApiKey: 'Ingrese su clave API de Gemini',
                languageSettings: 'Configuración de Idioma',
                apiConfiguration: 'Configuración de API',
                displayLanguage: 'Idioma de Visualización',
                getApiKey: 'Obtenga su clave API desde',
                
                // Messages
                analysisComplete: '¡Análisis completado!',
                apiKeySaved: 'Clave API guardada exitosamente',
                apiKeyCleared: 'Clave API eliminada',
                
                // Diagram sections
                codeExplanation: 'Explicación del Código',
                warnings: 'Advertencias',
                
                // Warning types
                security: 'Seguridad',
                logic: 'Lógica',
                bestPractice: 'Mejores Prácticas',
                securityWarnings: 'Advertencias de Seguridad',
                logicWarnings: 'Advertencias de Lógica',
                bestPracticeSuggestions: 'Sugerencias de Mejores Prácticas',
                
                // Left menu
                analyzedFiles: 'Archivos Analizados',
                
                // Export menu
                export: '',
                exportAsPNG: 'Exportar como PNG',
                exportAsSVG: 'Exportar como SVG',
                exportAsMermaid: 'Exportar como Mermaid',
                exportAsJSON: 'Exportar como JSON',
                
                // Zoom controls
                zoomIn: 'Acercar',
                zoomOut: 'Alejar',
                reset: 'Restablecer',
                
                // Context menu
                analyze: 'Analizar',
                updateAnalysis: 'Actualizar Análisis',
                
                // Details panel
                fileAnalysisDetails: 'Detalles del Análisis del Archivo',
                explanation: 'Explicación',
                dependencies: 'Dependencias',
                noAnalysisData: 'No hay datos de análisis disponibles para este archivo.',
                noDetailedAnalysis: 'No hay análisis detallado disponible.',
                fromCache: 'Desde Caché',
                cachedAt: 'Almacenado en',
                clearCache: 'Limpiar Caché',
                cacheCleared: 'Caché de análisis limpiado',
                cacheError: 'Error al cargar caché',
                confirmClearCache: '¿Está seguro de que desea limpiar el caché? Esto eliminará todos los análisis almacenados.',
                never: 'Nunca',
                
                // Node popup
                noDescription: 'No hay descripción disponible',
                
                // Status messages
                analyzing: 'Analizando archivo...',
                analysisFailed: 'Análisis fallido',
                diagramCleared: 'Diagrama y caché limpiados exitosamente',
                exportSuccess: 'Diagrama exportado exitosamente',
                exportFailed: 'Error al exportar diagrama',
                
                // Errors
                error: 'Error',
                pleaseEnterApiKey: 'Por favor ingrese una clave API',
                apiKeyNotConfigured: 'Clave API no configurada. Por favor configure su clave API de Gemini en la pestaña de Configuración.',
                failedToNavigate: 'Error al navegar',
                failedToAnalyze: 'Error al analizar archivo',
                failedToUpdate: 'Error al actualizar análisis',
                failedToToggle: 'Error al cambiar visibilidad del archivo',
                
                // API Key validation
                testConnection: 'Probar Conexión',
                testingConnection: 'Probando conexión...',
                connectionSuccess: '¡Conexión exitosa! La clave API es válida.',
                connectionFailed: 'Conexión fallida',
                
                // Model selection
                model: 'Modelo',
                modelFlash: 'Gemini 3 Flash (Lite) - Más Rápido',
                modelPro: 'Gemini 3 Pro - Más Detallado',
                modelSaved: 'Preferencia de modelo guardada',
                modelHelp: 'Flash es más rápido y económico, Pro proporciona análisis más detallado',
                
                // Security tab
                noSecurityAnalysis: 'No Hay Análisis de Seguridad Disponible',
                analyzeFilesPrompt: 'Analice algunos archivos para ver hallazgos de seguridad y calidad aquí.',
                analysisSummary: 'Resumen del Análisis',
                totalFindings: 'Hallazgos Totales',
                highSeverity: 'Severidad Alta',
                mediumSeverity: 'Severidad Media',
                lowSeverity: 'Severidad Baja',
                overallRiskLevel: 'Nivel de Riesgo General:',
                findings: 'Hallazgos',
                generateReport: 'Generar Reporte',
                riskCritical: 'Crítico',
                riskHigh: 'Alto',
                riskMedium: 'Medio',
                riskLow: 'Bajo',
                securityType: 'Seguridad',
                logicType: 'Lógica',
                bestPracticeType: 'Mejores Prácticas',
                aiExecutiveSummary: 'Resumen Ejecutivo IA',
                regenerate: 'Regenerar',
                generatingAISummary: 'Generando resumen con IA...',
                getRecommendation: 'Obtener Recomendación',
                recommendation: 'Recomendación',
                loadingRecommendation: 'Cargando recomendación...'
            }
        };
        
        function t(key) {
            return translations[currentLanguage][key] || translations['en'][key];
        }
        
        function changeLanguage(lang) {
            currentLanguage = lang;
            localStorage.setItem('codeArchitectLanguage', lang);
            // Notify backend about language change
            vscode.postMessage({ command: 'changeLanguage', language: lang });
            updateUILanguage();
        }
        
        function updateUILanguage() {
            // Update tabs
            const diagramTab = document.querySelector('[data-tab="diagram"]');
            const settingsTab = document.querySelector('[data-tab="settings"]');
            const securityTab = document.querySelector('[data-tab="security"]');
            if (diagramTab) diagramTab.textContent = t('diagram');
            if (settingsTab) settingsTab.textContent = t('settings');
            if (securityTab) securityTab.textContent = t('security');
            
            // Update settings section titles
            const settingsSectionTitles = document.querySelectorAll('.settings-section-title');
            if (settingsSectionTitles.length >= 2) {
                settingsSectionTitles[0].textContent = t('languageSettings');
                settingsSectionTitles[1].textContent = t('apiConfiguration');
            }
            
            // Update settings labels
            const displayLanguageLabel = document.querySelector('label[for="language"]');
            const apiKeyLabel = document.querySelector('label[for="api-key"]');
            if (displayLanguageLabel) displayLanguageLabel.textContent = t('displayLanguage');
            if (apiKeyLabel) apiKeyLabel.textContent = t('apiKey');
            
            // Update button text (only the text, keep icons)
            const buttonTexts = document.querySelectorAll('.button-text');
            if (buttonTexts.length >= 2) {
                buttonTexts[0].textContent = t('save');
                buttonTexts[1].textContent = t('clear');
            }
            
            // Update Test Connection button
            const testConnectionBtn = document.getElementById('test-connection-btn');
            if (testConnectionBtn) {
                const testBtnText = testConnectionBtn.querySelector('.button-text');
                if (testBtnText) testBtnText.textContent = t('testConnection');
            }
            
            // Update input placeholders
            const apiKeyInput = document.getElementById('api-key');
            if (apiKeyInput) apiKeyInput.placeholder = t('enterApiKey');
            
            // Update model selector
            const modelLabel = document.querySelector('label[for="model"]');
            if (modelLabel) modelLabel.textContent = t('model');
            
            const modelSelect = document.getElementById('model');
            if (modelSelect) {
                const options = modelSelect.querySelectorAll('option');
                if (options.length >= 2) {
                    options[0].textContent = t('modelFlash');
                    options[1].textContent = t('modelPro');
                }
            }
            
            // Update help texts
            const helpTexts = document.querySelectorAll('.help-text');
            if (helpTexts.length >= 1) {
                helpTexts[0].innerHTML = t('getApiKey') + ' <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a>';
            }
            if (helpTexts.length >= 2) {
                helpTexts[1].textContent = t('modelHelp');
            }
            
            // Update left menu title
            const leftMenuTitle = document.querySelector('.left-menu-title');
            if (leftMenuTitle) leftMenuTitle.textContent = t('analyzedFiles');
            
            // Update export button
            const exportButton = document.querySelector('.export-button');
            if (exportButton) exportButton.innerHTML = '📤 ' + t('export');
            
            // Update export menu items
            const exportMenuItems = document.querySelectorAll('.export-menu-item');
            if (exportMenuItems.length >= 4) {
                exportMenuItems[0].innerHTML = '<span class="export-menu-item-icon">🖼️</span>' + t('exportAsPNG');
                exportMenuItems[1].innerHTML = '<span class="export-menu-item-icon">📐</span>' + t('exportAsSVG');
                exportMenuItems[2].innerHTML = '<span class="export-menu-item-icon">📊</span>' + t('exportAsMermaid');
                exportMenuItems[3].innerHTML = '<span class="export-menu-item-icon">📄</span>' + t('exportAsJSON');
            }
            
            // Update zoom button titles
            const zoomButtons = document.querySelectorAll('.zoom-button');
            if (zoomButtons.length >= 3) {
                zoomButtons[0].title = t('zoomIn');
                zoomButtons[1].title = t('zoomOut');
                zoomButtons[2].title = t('reset');
            }
            
            // Update context menu
            const contextMenuItems = document.querySelectorAll('.context-menu-item');
            if (contextMenuItems.length >= 2) {
                contextMenuItems[0].textContent = t('analyze');
                contextMenuItems[1].textContent = t('updateAnalysis');
            }
            
            // Update explanation and warnings titles
            const explanationTitle = document.querySelector('.explanation-title');
            const warningsTitle = document.querySelector('.warnings-title');
            if (explanationTitle) explanationTitle.textContent = '📝 ' + t('codeExplanation');
            if (warningsTitle) warningsTitle.textContent = '⚠️ ' + t('warnings');
            
            // Update security tab
            const emptyStateTitle = document.querySelector('.empty-state-title');
            const emptyStateMessage = document.querySelector('.empty-state-message');
            if (emptyStateTitle) emptyStateTitle.textContent = t('noSecurityAnalysis');
            if (emptyStateMessage) emptyStateMessage.textContent = t('analyzeFilesPrompt');
            
            // Update all elements with data-i18n attribute
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (key) {
                    // Preserve emojis and icons at the start
                    const currentText = element.textContent || '';
                    const emojiMatch = currentText.match(/^([\u{1F300}-\u{1F9FF}][\u{FE00}-\u{FE0F}]?|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])\s*/u);
                    const emoji = emojiMatch ? emojiMatch[0] : '';
                    element.textContent = emoji + t(key);
                }
            });
            
            const statLabels = document.querySelectorAll('.stat-label');
            if (statLabels.length >= 4) {
                statLabels[0].textContent = t('totalFindings');
                statLabels[1].textContent = t('highSeverity');
                statLabels[2].textContent = t('mediumSeverity');
                statLabels[3].textContent = t('lowSeverity');
            }
            
            const riskLevelLabel = document.querySelector('.risk-level-label');
            if (riskLevelLabel) riskLevelLabel.textContent = t('overallRiskLevel');
            
            const generateReportBtn = document.querySelector('.button-generate-report .button-text');
            if (generateReportBtn) generateReportBtn.textContent = t('generateReport');
            
            // Update AI report section
            const aiReportHeaders = document.querySelectorAll('.ai-report-header h4');
            if (aiReportHeaders.length > 0) aiReportHeaders[0].textContent = '🤖 ' + t('aiExecutiveSummary');
            
            const regenerateBtnText = document.querySelector('.button-regenerate .button-text');
            if (regenerateBtnText) regenerateBtnText.textContent = t('regenerate');
            
            const loadingText = document.querySelector('.loading-text');
            if (loadingText) loadingText.textContent = t('generatingAISummary');
        }
        
        // Load saved language
        const savedLanguage = localStorage.getItem('codeArchitectLanguage');
        console.log('[Webview] Saved language from localStorage:', savedLanguage);
        if (savedLanguage) {
            currentLanguage = savedLanguage;
            const languageSelect = document.getElementById('language-select');
            if (languageSelect) {
                languageSelect.value = savedLanguage;
            }
            console.log('[Webview] Current language set to:', currentLanguage);
        } else {
            console.log('[Webview] No saved language, using default:', currentLanguage);
        }
        
        // Add event listener for save language button
        const saveLanguageBtn = document.getElementById('save-language-btn');
        if (saveLanguageBtn) {
            saveLanguageBtn.addEventListener('click', () => {
                const languageSelect = document.getElementById('language-select');
                if (languageSelect) {
                    const selectedLanguage = languageSelect.value;
                    changeLanguage(selectedLanguage);
                }
            });
        }

        // Add event listener for apply layout button
        const applyLayoutBtn = document.getElementById('apply-layout-btn');
        if (applyLayoutBtn) {
            applyLayoutBtn.addEventListener('click', () => {
                const layoutMode = document.getElementById('layout-mode');
                const layoutStatus = document.getElementById('layout-status');
                
                if (layoutMode) {
                    const selectedMode = layoutMode.value;
                    
                    // Show loading state
                    layoutStatus.textContent = 'Applying layout...';
                    layoutStatus.className = 'connection-status visible loading';
                    applyLayoutBtn.disabled = true;
                    
                    // Send message to extension
                    vscode.postMessage({ 
                        command: 'applyLayout', 
                        mode: selectedMode 
                    });
                }
            });
        }

        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;
                switchTab(tab);
            });
        });

        function switchTab(tab) {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelector(\`[data-tab="\${tab}"]\`).classList.add('active');
            document.getElementById(\`\${tab}-tab\`).classList.add('active');
            vscode.postMessage({ command: 'switchTab', tab: tab });
        }

        function saveAPIKey() {
            const apiKey = document.getElementById('api-key').value;
            if (!apiKey) {
                showStatusMessage(t('pleaseEnterApiKey'), 'error');
                return;
            }
            vscode.postMessage({ command: 'saveAPIKey', apiKey: apiKey });
        }

        function clearAPIKey() {
            vscode.postMessage({ command: 'clearAPIKey' });
            document.getElementById('api-key').value = '';
        }

        function testConnection() {
            const apiKey = document.getElementById('api-key').value;
            const statusDiv = document.getElementById('connection-status');
            const testBtn = document.getElementById('test-connection-btn');
            
            if (!apiKey) {
                statusDiv.textContent = t('pleaseEnterApiKey');
                statusDiv.className = 'connection-status visible error';
                return;
            }
            
            // Show loading state
            statusDiv.textContent = t('testingConnection');
            statusDiv.className = 'connection-status visible loading';
            testBtn.disabled = true;
            
            // Send message to extension to validate API key
            vscode.postMessage({ command: 'validateAPIKey', apiKey: apiKey });
        }

        function saveModel(model) {
            vscode.postMessage({ command: 'saveModel', model: model });
            showStatusMessage(t('modelSaved'), 'success');
        }

        function refreshCacheStats() {
            vscode.postMessage({ command: 'getCacheStats' });
        }

        function clearCacheFromSettings() {
            if (confirm(t('confirmClearCache') || 'Are you sure you want to clear the cache? This will remove all cached analyses.')) {
                vscode.postMessage({ command: 'clearCache' });
            }
        }

        function updateCacheStats(stats) {
            document.getElementById('cache-stat-files').textContent = stats.fileCount || 0;
            document.getElementById('cache-stat-tokens').textContent = stats.tokensSaved || 0;
            document.getElementById('cache-stat-size').textContent = stats.sizeKB ? stats.sizeKB + ' KB' : '0 KB';
            
            if (stats.lastUpdate) {
                const date = new Date(stats.lastUpdate);
                const timeStr = date.toLocaleString();
                document.getElementById('cache-stat-time').textContent = timeStr;
            } else {
                document.getElementById('cache-stat-time').textContent = t('never') || 'Never';
            }
        }

        function generateSecurityReport() {
            // Generate HTML report
            vscode.postMessage({ command: 'generateHTMLReport' });
        }

        function regenerateAIReport() {
            // Get current findings from the summary
            const findingsList = document.getElementById('findings-list');
            if (!findingsList || findingsList.children.length === 0) {
                console.warn('[Webview] No findings available to regenerate report');
                return;
            }
            
            // Show loading state
            displayAIReport('loading');
            
            // Send message with current findings
            vscode.postMessage({ 
                command: 'regenerateAIReport',
                findings: currentFindings || []
            });
        }

        function displayAIReport(report) {
            const aiReportSection = document.getElementById('ai-report-section');
            const aiReportLoading = document.getElementById('ai-report-loading');
            const aiReportText = document.getElementById('ai-report-text');
            const regenerateBtn = document.getElementById('regenerate-btn');

            // Show section
            aiReportSection.style.display = 'block';

            if (report === 'loading') {
                // Show loading state
                aiReportLoading.style.display = 'flex';
                aiReportText.style.display = 'none';
                regenerateBtn.disabled = true;
            } else {
                // Show report
                aiReportLoading.style.display = 'none';
                aiReportText.style.display = 'block';
                aiReportText.textContent = report;
                regenerateBtn.disabled = false;
            }
        }

        function updateSecurityUI(summary) {
            if (!summary || summary.totalFindings === 0) {
                // Show empty state
                document.getElementById('security-empty-state').style.display = 'flex';
                document.getElementById('security-content').style.display = 'none';
                return;
            }

            // Store findings for regeneration
            currentFindings = summary.findings || [];

            // Hide empty state, show content
            document.getElementById('security-empty-state').style.display = 'none';
            document.getElementById('security-content').style.display = 'block';

            // Update statistics
            document.getElementById('total-findings').textContent = summary.totalFindings;
            document.getElementById('high-severity').textContent = summary.highSeverity;
            document.getElementById('medium-severity').textContent = summary.mediumSeverity;
            document.getElementById('low-severity').textContent = summary.lowSeverity;

            // Update risk level badge
            const riskBadge = document.getElementById('risk-level-badge');
            riskBadge.textContent = t('risk' + summary.riskLevel.charAt(0).toUpperCase() + summary.riskLevel.slice(1));
            riskBadge.className = 'risk-level-badge ' + summary.riskLevel;

            // Update findings list
            const findingsList = document.getElementById('findings-list');
            findingsList.innerHTML = '';

            summary.findings.forEach(finding => {
                const findingCard = document.createElement('div');
                findingCard.className = 'finding-item ' + finding.severity;

                const findingHeader = document.createElement('div');
                findingHeader.className = 'finding-header';

                const findingType = document.createElement('div');
                findingType.className = 'finding-type';

                const typeBadge = document.createElement('span');
                typeBadge.className = 'finding-type-badge ' + finding.type;
                typeBadge.textContent = t(finding.type + 'Type');
                findingType.appendChild(typeBadge);

                const severityBadge = document.createElement('span');
                severityBadge.className = 'finding-severity ' + finding.severity;
                severityBadge.textContent = finding.severity.toUpperCase();

                findingHeader.appendChild(findingType);
                findingHeader.appendChild(severityBadge);

                const findingMessage = document.createElement('div');
                findingMessage.className = 'finding-message';
                findingMessage.textContent = finding.message;

                const findingFile = document.createElement('div');
                findingFile.className = 'finding-file';
                
                // Extract just the filename from the path
                const fullPath = finding.file + (finding.line ? ':' + finding.line : '');
                // Split by both / and \\ to get filename
                const pathParts = finding.file.split('/');
                const pathParts2 = pathParts[pathParts.length - 1].split('\\\\');
                const fileName = pathParts2[pathParts2.length - 1] || finding.file;
                const displayText = fileName + (finding.line ? ':' + finding.line : '');
                
                findingFile.textContent = displayText;
                findingFile.title = fullPath; // Show full path on hover

                // Add recommendation button and panel
                const findingActions = document.createElement('div');
                findingActions.className = 'finding-actions';

                const recommendationBtn = document.createElement('button');
                recommendationBtn.className = 'button-recommendation';
                recommendationBtn.innerHTML = '💡 ' + t('getRecommendation');
                recommendationBtn.onclick = () => requestRecommendation(finding, recommendationBtn, recommendationPanel);

                const recommendationPanel = document.createElement('div');
                recommendationPanel.className = 'recommendation-panel';

                findingActions.appendChild(recommendationBtn);

                findingCard.appendChild(findingHeader);
                findingCard.appendChild(findingMessage);
                findingCard.appendChild(findingFile);
                findingCard.appendChild(findingActions);
                findingCard.appendChild(recommendationPanel);

                findingsList.appendChild(findingCard);
            });

            // Request AI report generation
            vscode.postMessage({ command: 'generateAIReport', findings: summary.findings });
        }

        function requestRecommendation(finding, button, panel) {
            // Show loading state
            panel.className = 'recommendation-panel visible';
            panel.innerHTML = '<div class="recommendation-loading"><div class="loading-spinner"></div>' + t('loadingRecommendation') + '</div>';
            button.disabled = true;

            // Request recommendation from backend
            vscode.postMessage({ 
                command: 'getRecommendation', 
                finding: finding,
                panelId: finding.file + '-' + finding.line
            });
        }

        function displayRecommendation(recommendation, panelId) {
            // Find all recommendation panels and update the matching one
            const panels = document.querySelectorAll('.recommendation-panel');
            panels.forEach(panel => {
                const card = panel.closest('.finding-item');
                if (card) {
                    const fileDiv = card.querySelector('.finding-file');
                    if (fileDiv && fileDiv.textContent.includes(panelId.split('-')[0])) {
                        panel.innerHTML = '<div class="recommendation-text">' + recommendation + '</div>';
                        const button = card.querySelector('.button-recommendation');
                        if (button) button.disabled = false;
                    }
                }
            });
        }

        function showStatusMessage(message, type) {
            const statusDiv = document.getElementById('status-message');
            statusDiv.innerHTML = '';
            const messageEl = document.createElement('div');
            messageEl.className = \`\${type}-message\`;
            messageEl.textContent = message;
            statusDiv.appendChild(messageEl);
            setTimeout(() => messageEl.remove(), 3000);
        }

        function initializeDiagramRenderer() {
            const svg = document.getElementById('diagram-svg');
            if (!svg || diagramRenderer) return;

            diagramRenderer = {
                svg: svg,
                nodes: new Map(),
                edges: [],

                render: function(diagramData) {
                    if (!diagramData || !diagramData.nodes) return;
                    console.log('Render called with diagramData:', diagramData);
                    console.log('Edges in diagramData:', diagramData.edges);
                    console.log('Layout mode:', diagramData.layoutMode);
                    this.nodes.clear();
                    diagramData.nodes.forEach(node => {
                        // Use saved position if available, otherwise will be calculated in organizeLayers
                        this.nodes.set(node.id, node);
                    });
                    this.edges = diagramData.edges || [];
                    this.layoutMode = diagramData.layoutMode || 'auto';
                    this.groups = diagramData.groups || [];
                    console.log('Edges assigned to renderer:', this.edges);
                    this.draw();
                },

                draw: function() {
                    this.svg.innerHTML = '';
                    const svgNS = 'http://www.w3.org/2000/svg';
                    const width = this.svg.parentElement?.clientWidth || 800;
                    const height = this.svg.parentElement?.clientHeight || 400;
                    
                    this.svg.setAttribute('width', width);
                    this.svg.setAttribute('height', height);
                    
                    // Only set viewBox if it doesn't exist yet (preserve pan position)
                    if (!this.svg.hasAttribute('viewBox') || this.svg.getAttribute('viewBox') === '') {
                        this.svg.setAttribute('viewBox', \`0 0 \${width} \${height}\`);
                    }
                    
                    // Organize nodes by layers
                    this.organizeLayers(width, height);
                    
                    // Arrow marker and filters - must be added BEFORE the g element
                    const defs = document.createElementNS(svgNS, 'defs');
                    const marker = document.createElementNS(svgNS, 'marker');
                    marker.setAttribute('id', 'arrowhead');
                    marker.setAttribute('markerWidth', '10');
                    marker.setAttribute('markerHeight', '10');
                    marker.setAttribute('refX', '5');
                    marker.setAttribute('refY', '3');
                    marker.setAttribute('orient', 'auto');
                    const polygon = document.createElementNS(svgNS, 'polygon');
                    polygon.setAttribute('points', '0 0, 6 3, 0 6');
                    polygon.setAttribute('fill', '#555555');
                    marker.appendChild(polygon);
                    defs.appendChild(marker);
                    
                    // Glow filter for current file
                    const filter = document.createElementNS(svgNS, 'filter');
                    filter.setAttribute('id', 'glow');
                    filter.setAttribute('x', '-50%');
                    filter.setAttribute('y', '-50%');
                    filter.setAttribute('width', '200%');
                    filter.setAttribute('height', '200%');
                    
                    const feGaussianBlur = document.createElementNS(svgNS, 'feGaussianBlur');
                    feGaussianBlur.setAttribute('stdDeviation', '3');
                    feGaussianBlur.setAttribute('result', 'coloredBlur');
                    filter.appendChild(feGaussianBlur);
                    
                    const feMerge = document.createElementNS(svgNS, 'feMerge');
                    const feMergeNode1 = document.createElementNS(svgNS, 'feMergeNode');
                    feMergeNode1.setAttribute('in', 'coloredBlur');
                    const feMergeNode2 = document.createElementNS(svgNS, 'feMergeNode');
                    feMergeNode2.setAttribute('in', 'SourceGraphic');
                    feMerge.appendChild(feMergeNode1);
                    feMerge.appendChild(feMergeNode2);
                    filter.appendChild(feMerge);
                    
                    defs.appendChild(filter);
                    this.svg.appendChild(defs);
                    
                    const g = document.createElementNS(svgNS, 'g');
                    
                    // Helper function to get connection point on a node
                    const getConnectionPoint = (node, side) => {
                        const nodeWidth = 120;
                        const nodeHeight = 60;
                        switch(side) {
                            case 'top':
                                return { x: node.x + nodeWidth / 2, y: node.y };
                            case 'bottom':
                                return { x: node.x + nodeWidth / 2, y: node.y + nodeHeight };
                            case 'left':
                                return { x: node.x, y: node.y + nodeHeight / 2 };
                            case 'right':
                                return { x: node.x + nodeWidth, y: node.y + nodeHeight / 2 };
                            default:
                                return { x: node.x + nodeWidth / 2, y: node.y + nodeHeight / 2 };
                        }
                    };
                    
                    // Helper function to determine best connection sides based on relative position
                    const getBestConnectionSides = (sourceNode, targetNode) => {
                        const dx = targetNode.x - sourceNode.x;
                        const dy = targetNode.y - sourceNode.y;
                        
                        let sourceSide, targetSide;
                        
                        // Determine primary direction
                        if (Math.abs(dx) > Math.abs(dy)) {
                            // Horizontal connection is primary
                            if (dx > 0) {
                                sourceSide = 'right';
                                targetSide = 'left';
                            } else {
                                sourceSide = 'left';
                                targetSide = 'right';
                            }
                        } else {
                            // Vertical connection is primary
                            if (dy > 0) {
                                sourceSide = 'bottom';
                                targetSide = 'top';
                            } else {
                                sourceSide = 'top';
                                targetSide = 'bottom';
                            }
                        }
                        
                        return { sourceSide, targetSide };
                    };
                    
                    // Debug: log edges
                    console.log('Drawing edges:', this.edges.length, this.edges);
                    console.log('Available nodes:', Array.from(this.nodes.keys()));
                    
                    // Draw edges FIRST (so they appear behind nodes)
                    for (const edge of this.edges) {
                        const sourceNode = this.nodes.get(edge.source);
                        const targetNode = this.nodes.get(edge.target);
                        
                        console.log('Edge:', edge.source, '->', edge.target, 'Found:', !!sourceNode, !!targetNode);
                        
                        if (!sourceNode || !targetNode) continue;
                        
                        // Get best connection sides
                        const { sourceSide, targetSide } = getBestConnectionSides(sourceNode, targetNode);
                        const sourcePoint = getConnectionPoint(sourceNode, sourceSide);
                        const targetPoint = getConnectionPoint(targetNode, targetSide);
                        
                        const line = document.createElementNS(svgNS, 'line');
                        line.setAttribute('x1', sourcePoint.x);
                        line.setAttribute('y1', sourcePoint.y);
                        line.setAttribute('x2', targetPoint.x);
                        line.setAttribute('y2', targetPoint.y);
                        line.setAttribute('stroke', '#00ff00');
                        line.setAttribute('stroke-width', '3');
                        line.setAttribute('marker-end', 'url(#arrowhead)');
                        g.appendChild(line);
                        console.log('Drew line from', sourceNode.label, 'to', targetNode.label);
                    }
                    
                    // Draw nodes as rectangles
                    for (const [nodeId, node] of this.nodes) {
                        const isCurrentFile = node.isCurrentFile === true;
                        const isAnalyzed = node.isAnalyzed === true;
                        
                        // Determine colors based on analysis status
                        let strokeColor = '#555555';  // Gray for unanalyzed dependencies
                        let fillColor = '#2d2d30';
                        let textColor = '#cccccc';
                        let filterId = '';
                        
                        if (isCurrentFile) {
                            // Current file being analyzed: bright blue with glow
                            strokeColor = '#007acc';
                            fillColor = '#1a3a52';
                            textColor = '#e0e0e0';
                            filterId = 'glow';
                        } else if (isAnalyzed) {
                            // Previously analyzed file: blue without glow
                            strokeColor = '#007acc';
                            fillColor = '#1a3a52';
                            textColor = '#e0e0e0';
                        }
                        // else: unanalyzed dependency stays gray (default colors)
                        
                        const rect = document.createElementNS(svgNS, 'rect');
                        rect.setAttribute('x', node.x);
                        rect.setAttribute('y', node.y);
                        rect.setAttribute('width', '120');
                        rect.setAttribute('height', '60');
                        rect.setAttribute('fill', fillColor);
                        rect.setAttribute('stroke', strokeColor);
                        rect.setAttribute('stroke-width', isCurrentFile ? '3' : (isAnalyzed ? '2' : '2'));
                        rect.setAttribute('rx', '4');
                        rect.setAttribute('data-node-id', nodeId);
                        if (filterId) {
                            rect.setAttribute('filter', 'url(#' + filterId + ')');
                        }
                        rect.style.cursor = 'pointer';
                        g.appendChild(rect);
                        
                        // Label
                        const text = document.createElementNS(svgNS, 'text');
                        text.setAttribute('x', node.x + 60);
                        text.setAttribute('y', node.y + 22);
                        text.setAttribute('text-anchor', 'middle');
                        text.setAttribute('fill', textColor);
                        text.setAttribute('font-size', '11');
                        text.setAttribute('font-weight', 'bold');
                        text.setAttribute('pointer-events', 'none');
                        const label = node.label.length > 14 ? node.label.substring(0, 12) + '...' : node.label;
                        text.textContent = label;
                        g.appendChild(text);
                    }
                    
                    this.svg.appendChild(g);
                },

                organizeLayers: function(width, height) {
                    const nodesArray = Array.from(this.nodes.values());
                    const nodeCount = nodesArray.length;
                    
                    // Apply layout based on mode
                    if (this.layoutMode === 'hierarchical' || this.layoutMode === 'ai') {
                        this.applyHierarchicalLayout(nodesArray, width, height);
                    } else {
                        // Default auto layout (grid)
                        this.applyGridLayout(nodesArray, width, height);
                    }
                },
                
                applyGridLayout: function(nodesArray, width, height) {
                    const nodeCount = nodesArray.length;
                    const cols = Math.ceil(Math.sqrt(nodeCount));
                    const rows = Math.ceil(nodeCount / cols);
                    
                    const horizontalSpacing = 180;
                    const verticalSpacing = 140;
                    
                    const gridWidth = cols * horizontalSpacing;
                    const gridHeight = rows * verticalSpacing;
                    const startX = Math.max(20, (width - gridWidth) / 2);
                    const startY = 50;
                    
                    nodesArray.forEach((node, index) => {
                        // Only set position if not already set
                        if (node.x === undefined || node.y === undefined) {
                            const col = index % cols;
                            const row = Math.floor(index / cols);
                            node.x = startX + col * horizontalSpacing;
                            node.y = startY + row * verticalSpacing;
                        }
                    });
                },
                
                applyHierarchicalLayout: function(nodesArray, width, height) {
                    // Group nodes by level if groups are provided (from AI)
                    const nodesByLevel = new Map();
                    
                    if (this.groups && this.groups.length > 0) {
                        // Use AI-provided groups
                        this.groups.forEach(group => {
                            if (!nodesByLevel.has(group.level)) {
                                nodesByLevel.set(group.level, []);
                            }
                            group.nodes.forEach(nodeId => {
                                const node = this.nodes.get(nodeId);
                                if (node) {
                                    nodesByLevel.get(group.level).push(node);
                                }
                            });
                        });
                        
                        // Add ungrouped nodes to level 0
                        nodesArray.forEach(node => {
                            let found = false;
                            for (const group of this.groups) {
                                if (group.nodes.includes(node.id)) {
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                if (!nodesByLevel.has(0)) {
                                    nodesByLevel.set(0, []);
                                }
                                nodesByLevel.get(0).push(node);
                            }
                        });
                    } else {
                        // Simple hierarchical layout based on dependencies
                        // Level 0: nodes with no incoming edges
                        // Level 1: nodes that depend on level 0
                        // etc.
                        const incomingEdges = new Map();
                        nodesArray.forEach(node => incomingEdges.set(node.id, 0));
                        
                        this.edges.forEach(edge => {
                            const count = incomingEdges.get(edge.target) || 0;
                            incomingEdges.set(edge.target, count + 1);
                        });
                        
                        // Assign levels
                        nodesArray.forEach(node => {
                            const level = incomingEdges.get(node.id) === 0 ? 0 : 1;
                            if (!nodesByLevel.has(level)) {
                                nodesByLevel.set(level, []);
                            }
                            nodesByLevel.get(level).push(node);
                        });
                    }
                    
                    // Position nodes by level
                    const verticalSpacing = 180;
                    const horizontalSpacing = 200;
                    const startY = 80;
                    
                    const levels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
                    
                    levels.forEach(level => {
                        const levelNodes = nodesByLevel.get(level);
                        const levelWidth = levelNodes.length * horizontalSpacing;
                        const startX = Math.max(50, (width - levelWidth) / 2);
                        const y = startY + level * verticalSpacing;
                        
                        levelNodes.forEach((node, index) => {
                            node.x = startX + index * horizontalSpacing;
                            node.y = y;
                        });
                    });
                }
            };

            svg.addEventListener('wheel', (e) => {
                e.preventDefault();
            });

            let isPanning = false;
            let panStartX = 0;
            let panStartY = 0;
            let viewBoxX = 0;
            let viewBoxY = 0;
            let isDragging = false;
            let hasMoved = false;

            svg.addEventListener('mousedown', (e) => {
                const rect = e.target;
                if (rect.tagName === 'rect' && rect.hasAttribute('data-node-id')) {
                    // Dragging a node
                    draggedNode = rect.getAttribute('data-node-id');
                    dragStartX = e.clientX;
                    dragStartY = e.clientY;
                    isDragging = true;
                    hasMoved = false;
                    e.preventDefault(); // Prevent text selection
                } else {
                    // Panning
                    isPanning = true;
                    panStartX = e.clientX;
                    panStartY = e.clientY;
                    const viewBox = svg.getAttribute('viewBox').split(' ');
                    viewBoxX = parseFloat(viewBox[0]);
                    viewBoxY = parseFloat(viewBox[1]);
                }
            });

            svg.addEventListener('mousemove', (e) => {
                if (draggedNode && isDragging) {
                    // Dragging a node
                    const node = diagramRenderer.nodes.get(draggedNode);
                    if (node) {
                        const deltaX = (e.clientX - dragStartX);
                        const deltaY = (e.clientY - dragStartY);
                        
                        // Mark as moved if moved more than 3 pixels
                        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                            hasMoved = true;
                        }
                        
                        node.x += deltaX;
                        node.y += deltaY;
                        dragStartX = e.clientX;
                        dragStartY = e.clientY;
                        diagramRenderer.draw();
                        // IMPORTANT: Reapply zoom after redrawing
                        applyZoom();
                    }
                } else if (isPanning) {
                    const deltaX = e.clientX - panStartX;
                    const deltaY = e.clientY - panStartY;
                    const viewBox = svg.getAttribute('viewBox').split(' ');
                    const width = parseFloat(viewBox[2]);
                    const height = parseFloat(viewBox[3]);
                    const newX = viewBoxX - (deltaX / svg.clientWidth) * width;
                    const newY = viewBoxY - (deltaY / svg.clientHeight) * height;
                    svg.setAttribute('viewBox', \`\${newX} \${newY} \${width} \${height}\`);
                }
            });

            svg.addEventListener('mouseup', (e) => {
                if (isDragging && hasMoved) {
                    // Save node positions after drag
                    const positions = {};
                    diagramRenderer.nodes.forEach((node, id) => {
                        positions[id] = { x: node.x, y: node.y };
                    });
                    vscode.postMessage({
                        command: 'saveNodePositions',
                        positions: positions
                    });
                }
                isPanning = false;
                isDragging = false;
                draggedNode = null;
            });

            svg.addEventListener('mouseleave', () => {
                isPanning = false;
                isDragging = false;
                draggedNode = null;
            });

            svg.addEventListener('click', (e) => {
                // Only handle click if we didn't just drag
                if (hasMoved) {
                    hasMoved = false;
                    return;
                }
                
                const rect = e.target;
                if (rect.tagName === 'rect' && rect.hasAttribute('data-node-id')) {
                    const nodeId = rect.getAttribute('data-node-id');
                    const node = diagramRenderer.nodes.get(nodeId);
                    if (node) {
                        // If node is analyzed, show details panel instead of popup
                        if (node.isAnalyzed) {
                            showDetailsPanel(node);
                        } else {
                            showNodePopup(e, node);
                        }
                    }
                }
            });

            svg.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const rect = e.target;
                if (rect.tagName === 'rect' && rect.hasAttribute('data-node-id')) {
                    const nodeId = rect.getAttribute('data-node-id');
                    const node = diagramRenderer.nodes.get(nodeId);
                    if (node && !node.isCurrentFile) {
                        showContextMenu(e, node);
                    }
                }
            });
        }

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateDiagram':
                    currentDiagramData = message.data;
                    
                    // Store analysis data for details panel
                    if (message.analysisResult && message.analysisResult.currentFile) {
                        const fileName = message.analysisResult.currentFile.name;
                        const fileId = sanitizeId(fileName);
                        analysisDataMap.set(fileId, message.analysisResult);
                        analysisDataMap.set(fileName, message.analysisResult);
                    }
                    
                    // Update file visibility map and analyzed files list
                    if (message.analyzedFiles) {
                        updateAnalyzedFilesList(message.analyzedFiles);
                    }
                    
                    if (!diagramRenderer) {
                        initializeDiagramRenderer();
                    }
                    if (diagramRenderer && currentDiagramData) {
                        diagramRenderer.render(currentDiagramData);
                    }
                    
                    // Don't show explanation and warnings in the side view
                    // Users can see this information in the details panel when clicking on nodes
                    // if (message.analysisResult) {
                    //     displayExplanation(message.analysisResult);
                    //     displayWarnings(message.analysisResult);
                    // }
                    showStatusMessage(t('analysisComplete'), 'success');
                    break;
                case 'updateDiagramWithCache':
                    currentDiagramData = message.data;
                    
                    // Store ALL analysis data from cache
                    if (message.analyses && Array.isArray(message.analyses)) {
                        message.analyses.forEach(item => {
                            if (item.analysis && item.analysis.currentFile) {
                                const fileName = item.analysis.currentFile.name;
                                const fileId = sanitizeId(fileName);
                                analysisDataMap.set(fileId, item.analysis);
                                analysisDataMap.set(fileName, item.analysis);
                            }
                        });
                    }
                    
                    // Update file visibility map and analyzed files list
                    if (message.analyzedFiles) {
                        updateAnalyzedFilesList(message.analyzedFiles);
                    }
                    
                    if (!diagramRenderer) {
                        initializeDiagramRenderer();
                    }
                    if (diagramRenderer && currentDiagramData) {
                        diagramRenderer.render(currentDiagramData);
                    }
                    break;
                case 'showWarning':
                    showStatusMessage(message.message, 'warning');
                    break;
                case 'apiKeySaved':
                    showStatusMessage(t('apiKeySaved'), 'success');
                    break;
                case 'apiKeyCleared':
                    showStatusMessage(t('apiKeyCleared'), 'success');
                    break;
                case 'apiKeyError':
                    showStatusMessage(t('error') + ': ' + message.message, 'error');
                    break;
                case 'validationResult':
                    const statusDiv = document.getElementById('connection-status');
                    const testBtn = document.getElementById('test-connection-btn');
                    
                    if (message.valid) {
                        statusDiv.textContent = t('connectionSuccess');
                        statusDiv.className = 'connection-status visible success';
                    } else {
                        statusDiv.textContent = t('connectionFailed') + ': ' + message.message;
                        statusDiv.className = 'connection-status visible error';
                    }
                    
                    testBtn.disabled = false;
                    break;
                case 'layoutApplied':
                    const layoutStatus = document.getElementById('layout-status');
                    const applyLayoutBtn = document.getElementById('apply-layout-btn');
                    
                    if (layoutStatus) {
                        const modeNames = {
                            'auto': 'Automatic',
                            'hierarchical': 'Hierarchical',
                            'ai': 'AI-Optimized'
                        };
                        layoutStatus.textContent = modeNames[message.mode] + ' layout applied successfully!';
                        layoutStatus.className = 'connection-status visible success';
                        
                        setTimeout(() => {
                            layoutStatus.className = 'connection-status';
                        }, 3000);
                    }
                    
                    if (applyLayoutBtn) {
                        applyLayoutBtn.disabled = false;
                    }
                    break;
                case 'layoutError':
                    const layoutStatusError = document.getElementById('layout-status');
                    const applyLayoutBtnError = document.getElementById('apply-layout-btn');
                    
                    if (layoutStatusError) {
                        layoutStatusError.textContent = 'Error: ' + message.message;
                        layoutStatusError.className = 'connection-status visible error';
                    }
                    
                    if (applyLayoutBtnError) {
                        applyLayoutBtnError.disabled = false;
                    }
                    break;
                case 'setModel':
                    const modelSelect = document.getElementById('model');
                    if (modelSelect && message.model) {
                        modelSelect.value = message.model;
                    }
                    break;
                case 'updateSecuritySummary':
                    updateSecurityUI(message.summary);
                    break;
                case 'updateDeepenedExplanation':
                    console.log('[Webview] Received updateDeepenedExplanation:', message.nodeId, 'explanation length:', message.explanation?.length);
                    
                    // Re-enable the deepen button
                    const deepenBtnUpdate = document.querySelector('.deepen-button');
                    if (deepenBtnUpdate) {
                        deepenBtnUpdate.disabled = false;
                        deepenBtnUpdate.style.opacity = '1';
                        deepenBtnUpdate.style.cursor = 'pointer';
                    }
                    
                    // Find the node data and update it
                    let nodeDataToUpdate = null;
                    let nodeKeyUsed = null;
                    
                    const nodeIdLower = message.nodeId.toLowerCase();
                    const possibleKeys = [
                        message.nodeId,
                        nodeIdLower,
                        nodeIdLower + '_java',
                        nodeIdLower + '_js',
                        nodeIdLower + '_ts',
                        nodeIdLower + '_py'
                    ];
                    
                    for (const key of possibleKeys) {
                        if (analysisDataMap.has(key)) {
                            nodeDataToUpdate = analysisDataMap.get(key);
                            nodeKeyUsed = key;
                            break;
                        }
                    }
                    
                    if (!nodeDataToUpdate) {
                        for (const [key, value] of analysisDataMap.entries()) {
                            const keyLower = key.toLowerCase();
                            const keyNoUnderscore = removeUnderscores(keyLower);
                            const nodeIdNoUnderscore = removeUnderscores(nodeIdLower);
                            if (keyLower.startsWith(nodeIdLower) || keyNoUnderscore === nodeIdNoUnderscore) {
                                nodeDataToUpdate = value;
                                nodeKeyUsed = key;
                                break;
                            }
                        }
                    }
                    
                    console.log('[Webview] nodeData found:', !!nodeDataToUpdate, 'key:', nodeKeyUsed);
                    
                    if (nodeDataToUpdate) {
                        nodeDataToUpdate.explanation = message.explanation;
                        console.log('[Webview] Updated analysisDataMap');
                    }
                    
                    // SIMPLE SOLUTION: Close and reopen the panel
                    const detailsPanel = document.getElementById('details-panel');
                    if (detailsPanel) {
                        // Close the panel
                        detailsPanel.classList.remove('show');
                        console.log('[Webview] Panel closed');
                        
                        // Wait a moment, then reopen with the updated data
                        setTimeout(() => {
                            // Find the node that was being viewed
                            let nodeToShow = null;
                            for (const [key, value] of analysisDataMap.entries()) {
                                if (key === nodeKeyUsed || key.toLowerCase() === nodeIdLower || key.startsWith(nodeIdLower)) {
                                    // Create a node object to pass to showDetailsPanel
                                    nodeToShow = {
                                        id: message.nodeId,
                                        label: value.currentFile?.name || message.nodeId,
                                        path: value.currentFile?.path
                                    };
                                    break;
                                }
                            }
                            
                            if (nodeToShow) {
                                console.log('[Webview] Reopening panel with node:', nodeToShow);
                                showDetailsPanel(nodeToShow);
                                
                                // Show success message
                                setTimeout(() => {
                                    const explanationText = document.getElementById('explanation-text');
                                    if (explanationText && explanationText.parentElement) {
                                        const successMsg = document.createElement('div');
                                        successMsg.style.cssText = 'color: #4ec9b0; font-weight: 600; padding: 12px; margin-top: 12px; background: rgba(78, 201, 176, 0.15); border-radius: 4px; border-left: 4px solid #4ec9b0;';
                                        successMsg.innerHTML = '✓ ' + (currentLanguage === 'es' ? '<strong>Análisis actualizado con éxito</strong>' : '<strong>Analysis updated successfully</strong>');
                                        
                                        explanationText.parentElement.insertBefore(successMsg, explanationText.nextSibling);
                                        
                                        setTimeout(() => {
                                            if (successMsg.parentElement) {
                                                successMsg.parentElement.removeChild(successMsg);
                                            }
                                        }, 3000);
                                    }
                                }, 100);
                            }
                        }, 300);
                    }
                    break;
                case 'aiReportGenerated':
                    displayAIReport(message.report);
                    break;
                case 'recommendationGenerated':
                    displayRecommendation(message.recommendation, message.panelId);
                    break;
                case 'cacheStats':
                    updateCacheStats(message.stats);
                    break;
            }
        });

        function displayExplanation(analysisResult) {
            const container = document.getElementById('explanation-container');
            const textElement = document.getElementById('explanation-text');
            if (!analysisResult.explanation) {
                container.classList.remove('show');
                return;
            }
            container.classList.add('show');
            textElement.textContent = analysisResult.explanation;
        }

        function displayWarnings(analysisResult) {
            const container = document.getElementById('warnings-container');
            const content = document.getElementById('warnings-content');
            const hasWarnings = (analysisResult.securityWarnings?.length || 0) +
                               (analysisResult.logicWarnings?.length || 0) +
                               (analysisResult.bestPracticeWarnings?.length || 0) > 0;
            
            if (!hasWarnings) {
                container.classList.remove('show');
                return;
            }
            
            container.classList.add('show');
            content.innerHTML = '';
            
            if (analysisResult.securityWarnings?.length > 0) {
                content.innerHTML += '<div style="font-size: 11px; font-weight: 500; color: #858585; margin-bottom: 4px;">🔒 ' + t('security') + '</div>';
                analysisResult.securityWarnings.forEach(w => {
                    content.innerHTML += '<div class="warning-item high">🔴 ' + w.message + '</div>';
                });
            }
            
            if (analysisResult.logicWarnings?.length > 0) {
                content.innerHTML += '<div style="font-size: 11px; font-weight: 500; color: #858585; margin-bottom: 4px; margin-top: 8px;">🔍 ' + t('logic') + '</div>';
                analysisResult.logicWarnings.forEach(w => {
                    content.innerHTML += '<div class="warning-item medium">🟡 ' + w.message + '</div>';
                });
            }
            
            if (analysisResult.bestPracticeWarnings?.length > 0) {
                content.innerHTML += '<div style="font-size: 11px; font-weight: 500; color: #858585; margin-bottom: 4px; margin-top: 8px;">✨ ' + t('bestPractice') + '</div>';
                analysisResult.bestPracticeWarnings.forEach(w => {
                    content.innerHTML += '<div class="warning-item low">🟢 ' + w.message + '</div>';
                });
            }
        }

        function showNodePopup(event, node) {
            const popup = document.getElementById('node-popup');
            const title = document.getElementById('popup-title');
            const description = document.getElementById('popup-description');
            
            title.textContent = node.label;
            description.textContent = node.description || t('noDescription');
            
            popup.classList.add('show');
            popup.style.left = (event.clientX + 10) + 'px';
            popup.style.top = (event.clientY + 10) + 'px';
            
            // Hide popup when clicking elsewhere
            setTimeout(() => {
                document.addEventListener('click', hideNodePopup);
            }, 100);
        }

        function hideNodePopup(e) {
            const popup = document.getElementById('node-popup');
            if (!popup.contains(e.target) && e.target.tagName !== 'rect') {
                popup.classList.remove('show');
                document.removeEventListener('click', hideNodePopup);
            }
        }

        let contextMenuNode = null;

        function showContextMenu(event, node) {
            contextMenuNode = node;
            const menu = document.getElementById('context-menu');
            menu.classList.add('show');
            menu.style.left = event.clientX + 'px';
            menu.style.top = event.clientY + 'px';
            
            setTimeout(() => {
                document.addEventListener('click', hideContextMenu);
            }, 100);
        }

        function hideContextMenu(e) {
            const menu = document.getElementById('context-menu');
            if (!menu.contains(e.target)) {
                menu.classList.remove('show');
                document.removeEventListener('click', hideContextMenu);
            }
        }

        function analyzeContextFile() {
            if (contextMenuNode && contextMenuNode.path) {
                vscode.postMessage({
                    command: 'analyzeFile',
                    filePath: contextMenuNode.path
                });
                hideContextMenu({ target: document.body });
            }
        }

        function updateContextFile() {
            if (contextMenuNode && contextMenuNode.path) {
                vscode.postMessage({
                    command: 'updateAnalysis',
                    filePath: contextMenuNode.path
                });
                hideContextMenu({ target: document.body });
            }
        }

        function convertMarkdownToHTML(markdown) {
            if (!markdown) return "";
            
            let html = markdown;
            
            // Escape HTML first
            const escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            };
            
            // Don't escape if already has HTML tags
            if (!html.includes('<')) {
                // Only escape special chars if no HTML present
                // html = html.replace(/[&<>]/g, m => escapeMap[m]);
            }
            
            // Convert headers (using string methods instead of regex)
            const lines = html.split('\\n');
            const processedLines = lines.map(line => {
                if (line.startsWith('### ')) {
                    return '<h3>' + line.substring(4) + '</h3>';
                } else if (line.startsWith('## ')) {
                    return '<h2>' + line.substring(3) + '</h2>';
                } else if (line.startsWith('# ')) {
                    return '<h1>' + line.substring(2) + '</h1>';
                }
                return line;
            });
            html = processedLines.join('\\n');
            
            // Convert bold (** or __)
            while (html.includes('**')) {
                const start = html.indexOf('**');
                const end = html.indexOf('**', start + 2);
                if (end === -1) break;
                const before = html.substring(0, start);
                const content = html.substring(start + 2, end);
                const after = html.substring(end + 2);
                html = before + '<strong>' + content + '</strong>' + after;
            }
            
            // Convert line breaks
            html = replaceDoubleNewlines(html);
            html = replaceSingleNewlines(html);
            
            // Wrap in paragraph if needed
            if (!html.startsWith('<')) {
                html = '<p>' + html + '</p>';
            }
            
            return html;
        }

        function showDetailsPanel(node) {
            const panel = document.getElementById('details-panel');
            const title = document.getElementById('details-panel-title');
            const content = document.getElementById('details-panel-content');
            
            // Get analysis data for this node
            const analysisData = analysisDataMap.get(node.id) || analysisDataMap.get(node.label);
            
            if (!analysisData) {
                // No analysis data available
                title.textContent = '📋 ' + node.label;
                content.innerHTML = '<div class="details-section"><div class="details-section-text">' + t('noAnalysisData') + '</div></div>';
                panel.classList.add('show');
                return;
            }
            
            // Update title (simple, no cache indicator)
            title.textContent = '📋 ' + node.label;
            
            // Build content HTML
            let html = '';
            
            // Explanation section
            if (analysisData.explanation) {
                html += '<div class="details-section" id="explanation-section">';
                html += '<div class="details-section-title">📝 ' + t('explanation').toUpperCase() + '</div>';
                html += '<div class="details-section-text" id="explanation-text">' + convertMarkdownToHTML(analysisData.explanation) + '</div>';
                
                // Escape attributes to avoid regex issues in template strings
                const escapedNodeId = node.id.split('"').join('&quot;');
                const escapedNodeLabel = node.label.split('"').join('&quot;');
                const escapedNodePath = (node.path || '').split('"').join('&quot;');
                
                html += '<button class="deepen-button" data-node-id="' + escapedNodeId + '" data-node-label="' + escapedNodeLabel + '" data-node-path="' + escapedNodePath + '" style="margin-top: 10px; padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">';
                html += '🔍 ' + (currentLanguage === 'es' ? 'Profundizar' : 'Deepen Analysis');
                html += '</button>';
                html += '</div>';
            }
            
            // Dependencies section
            if (analysisData.dependencies && analysisData.dependencies.length > 0) {
                html += '<div class="details-section">';
                html += '<div class="details-section-title">🔗 ' + t('dependencies').toUpperCase() + ' (' + analysisData.dependencies.length + ')</div>';
                html += '<div class="details-dependencies-list">';
                analysisData.dependencies.forEach(dep => {
                    html += '<div class="details-dependency-tag">' + (dep.name || dep.target) + '</div>';
                });
                html += '</div>';
                html += '</div>';
            }
            
            // Security warnings
            if (analysisData.securityWarnings && analysisData.securityWarnings.length > 0) {
                html += '<div class="details-section">';
                html += '<div class="details-section-title">🔒 ' + t('securityWarnings').toUpperCase() + ' (' + analysisData.securityWarnings.length + ')</div>';
                html += '<div class="details-warning-list">';
                analysisData.securityWarnings.forEach(warning => {
                    html += '<div class="details-warning-item high">🔴 ' + warning.message + '</div>';
                });
                html += '</div>';
                html += '</div>';
            }
            
            // Logic warnings
            if (analysisData.logicWarnings && analysisData.logicWarnings.length > 0) {
                html += '<div class="details-section">';
                html += '<div class="details-section-title">🔍 ' + t('logicWarnings').toUpperCase() + ' (' + analysisData.logicWarnings.length + ')</div>';
                html += '<div class="details-warning-list">';
                analysisData.logicWarnings.forEach(warning => {
                    html += '<div class="details-warning-item medium">🟡 ' + warning.message + '</div>';
                });
                html += '</div>';
                html += '</div>';
            }
            
            // Best practice warnings
            if (analysisData.bestPracticeWarnings && analysisData.bestPracticeWarnings.length > 0) {
                html += '<div class="details-section">';
                html += '<div class="details-section-title">✨ ' + t('bestPracticeSuggestions').toUpperCase() + ' (' + analysisData.bestPracticeWarnings.length + ')</div>';
                html += '<div class="details-warning-list">';
                analysisData.bestPracticeWarnings.forEach(warning => {
                    html += '<div class="details-warning-item low">🟢 ' + warning.message + '</div>';
                });
                html += '</div>';
                html += '</div>';
            }
            
            // If no content, show message
            if (!html) {
                html = '<div class="details-section"><div class="details-section-text">' + t('noDetailedAnalysis') + '</div></div>';
            }
            
            content.innerHTML = html;
            panel.classList.add('show');
            
            // Add event listener for deepen button (NO inline onclick)
            const deepenBtn = content.querySelector('.deepen-button');
            if (deepenBtn) {
                deepenBtn.addEventListener('click', function() {
                    const nodeId = this.getAttribute('data-node-id');
                    const nodeLabel = this.getAttribute('data-node-label');
                    const nodePath = this.getAttribute('data-node-path');
                    deepenAnalysis(nodeId, nodeLabel, nodePath);
                });
            }
        }
        
        function deepenAnalysis(nodeId, nodeLabel, nodePath) {
            console.log('[Webview] deepenAnalysis called for:', nodeId, nodeLabel);
            
            // Disable the button to prevent multiple clicks
            const deepenBtn = document.querySelector('.deepen-button');
            if (deepenBtn) {
                deepenBtn.disabled = true;
                deepenBtn.style.opacity = '0.5';
                deepenBtn.style.cursor = 'not-allowed';
            }
            
            // Show loading state with animation
            const explanationText = document.getElementById('explanation-text');
            if (explanationText) {
                const loadingMsg = currentLanguage === 'es' 
                    ? '🔄 Profundizando análisis... Por favor espera, esto puede tomar unos segundos.' 
                    : '🔄 Deepening analysis... Please wait, this may take a few seconds.';
                    
                explanationText.innerHTML = '<div style="color: #007acc; font-style: italic; padding: 16px; background: rgba(0, 122, 204, 0.15); border-radius: 4px; border-left: 4px solid #007acc; animation: pulse 1.5s ease-in-out infinite;">' + 
                    loadingMsg + 
                    '</div>' +
                    '<style>@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }</style>';
            }
            
            // Send message to backend to deepen analysis
            vscode.postMessage({
                command: 'deepenAnalysis',
                nodeId: nodeId,
                nodeLabel: nodeLabel,
                nodePath: nodePath
            });
        }

        function closeDetailsPanel() {
            const panel = document.getElementById('details-panel');
            panel.classList.remove('show');
        }

        function toggleLeftMenu() {
            console.log('[Webview] toggleLeftMenu called');
            const menu = document.getElementById('left-menu');
            console.log('[Webview] left-menu element:', menu);
            menu.classList.toggle('show');
            console.log('[Webview] Menu toggled, classes:', menu.className);
        }

        function updateAnalyzedFilesList(analyzedFiles) {
            const list = document.getElementById('analyzed-files-list');
            list.innerHTML = '';
            
            analyzedFiles.forEach(file => {
                const item = document.createElement('div');
                item.className = 'left-menu-item';
                
                // Create checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = fileVisibilityMap.get(file.path) !== false; // Default to true
                checkbox.style.marginRight = '8px';
                checkbox.onclick = (e) => {
                    e.stopPropagation();
                    const isVisible = checkbox.checked;
                    fileVisibilityMap.set(file.path, isVisible);
                    vscode.postMessage({
                        command: 'toggleFileVisibility',
                        filePath: file.path,
                        visible: isVisible
                    });
                };
                
                const label = document.createElement('label');
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.style.cursor = 'pointer';
                label.style.width = '100%';
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'left-menu-item-name';
                nameSpan.textContent = file.name;
                nameSpan.style.flex = '1';
                
                label.appendChild(checkbox);
                label.appendChild(nameSpan);
                item.appendChild(label);
                
                // Click on name to load analysis
                nameSpan.onclick = (e) => {
                    e.stopPropagation();
                    // Just close the menu - the diagram already shows all visible files
                    toggleLeftMenu();
                };
                
                list.appendChild(item);
            });
        }

        function zoomIn() {
            zoomLevel = Math.min(zoomLevel + 0.2, 3);
            applyZoom();
        }

        function zoomOut() {
            zoomLevel = Math.max(zoomLevel - 0.2, 0.5);
            applyZoom();
        }

        function resetZoom() {
            zoomLevel = 1;
            panX = 0;
            panY = 0;
            applyZoom();
        }

        function applyZoom() {
            const svg = document.getElementById('diagram-svg');
            if (!svg) return;
            
            const g = svg.querySelector('g');
            if (g) {
                g.setAttribute('transform', 'translate(' + panX + ',' + panY + ') scale(' + zoomLevel + ')');
            }
        }

        function toggleExportMenu() {
            console.log('[Webview] toggleExportMenu called');
            const menu = document.getElementById('export-menu');
            console.log('[Webview] export-menu element:', menu);
            menu.classList.toggle('show');
            console.log('[Webview] Export menu toggled, classes:', menu.className);
            
            // Close menu when clicking elsewhere
            if (menu.classList.contains('show')) {
                setTimeout(() => {
                    document.addEventListener('click', hideExportMenu);
                }, 100);
            }
        }

        function hideExportMenu(e) {
            const menu = document.getElementById('export-menu');
            const button = document.querySelector('.export-button');
            if (!menu.contains(e.target) && e.target !== button) {
                menu.classList.remove('show');
                document.removeEventListener('click', hideExportMenu);
            }
        }

        function exportDiagram(format) {
            hideExportMenu({ target: document.body });
            
            switch(format) {
                case 'png':
                    exportAsPNG();
                    break;
                case 'svg':
                    exportAsSVG();
                    break;
                case 'mermaid':
                    exportAsMermaid();
                    break;
                case 'json':
                    exportAsJSON();
                    break;
            }
        }

        function exportAsPNG() {
            const svg = document.getElementById('diagram-svg');
            
            // Calculate the bounding box of all elements
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            if (diagramRenderer && diagramRenderer.nodes) {
                diagramRenderer.nodes.forEach(node => {
                    minX = Math.min(minX, node.x);
                    minY = Math.min(minY, node.y);
                    maxX = Math.max(maxX, node.x + 120); // node width
                    maxY = Math.max(maxY, node.y + 60);  // node height
                });
            }
            
            // Add padding
            const padding = 40;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Clone the SVG and adjust viewBox to show everything
            const svgClone = svg.cloneNode(true);
            svgClone.setAttribute('width', width);
            svgClone.setAttribute('height', height);
            svgClone.setAttribute('viewBox', \`\${minX} \${minY} \${width} \${height}\`);
            
            // Remove transform from g element to show everything
            const g = svgClone.querySelector('g');
            if (g) {
                g.removeAttribute('transform');
            }
            
            const svgData = new XMLSerializer().serializeToString(svgClone);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // Use higher resolution for better quality
            const scale = 2;
            canvas.width = width * scale;
            canvas.height = height * scale;
            ctx.scale(scale, scale);
            
            img.onload = function() {
                // Fill background
                ctx.fillStyle = '#1e1e1e';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(function(blob) {
                    vscode.postMessage({
                        command: 'exportDiagram',
                        format: 'png',
                        data: canvas.toDataURL('image/png')
                    });
                });
            };
            
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        }

        function exportAsSVG() {
            const svg = document.getElementById('diagram-svg');
            
            // Calculate the bounding box of all elements
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            if (diagramRenderer && diagramRenderer.nodes) {
                diagramRenderer.nodes.forEach(node => {
                    minX = Math.min(minX, node.x);
                    minY = Math.min(minY, node.y);
                    maxX = Math.max(maxX, node.x + 120); // node width
                    maxY = Math.max(maxY, node.y + 60);  // node height
                });
            }
            
            // Add padding
            const padding = 40;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Clone the SVG and adjust viewBox to show everything
            const svgClone = svg.cloneNode(true);
            svgClone.setAttribute('width', width);
            svgClone.setAttribute('height', height);
            svgClone.setAttribute('viewBox', \`\${minX} \${minY} \${width} \${height}\`);
            
            // Remove transform from g element to show everything
            const g = svgClone.querySelector('g');
            if (g) {
                g.removeAttribute('transform');
            }
            
            const svgData = new XMLSerializer().serializeToString(svgClone);
            
            vscode.postMessage({
                command: 'exportDiagram',
                format: 'svg',
                data: svgData
            });
        }

        function exportAsMermaid() {
            if (!currentDiagramData) {
                showStatusMessage('No diagram to export', 'error');
                return;
            }
            
            let mermaidCode = 'graph TD\\n';
            
            // Add nodes
            currentDiagramData.nodes.forEach(node => {
                const nodeId = sanitizeId(node.id);
                const label = escapeQuotes(node.label);
                if (node.isCurrentFile) {
                    mermaidCode += \`    \${nodeId}["\${label}"]:::current\\n\`;
                } else {
                    mermaidCode += \`    \${nodeId}["\${label}"]\\n\`;
                }
            });
            
            mermaidCode += '\\n';
            
            // Add edges
            currentDiagramData.edges.forEach(edge => {
                const sourceId = sanitizeId(edge.source);
                const targetId = sanitizeId(edge.target);
                mermaidCode += \`    \${sourceId} --> \${targetId}\\n\`;
            });
            
            // Add styling
            mermaidCode += '\\n    classDef current fill:#1a3a52,stroke:#007acc,stroke-width:3px\\n';
            
            vscode.postMessage({
                command: 'exportDiagram',
                format: 'mermaid',
                data: mermaidCode
            });
        }

        function exportAsJSON() {
            if (!currentDiagramData) {
                showStatusMessage('No diagram to export', 'error');
                return;
            }
            
            const jsonData = JSON.stringify(currentDiagramData, null, 2);
            
            vscode.postMessage({
                command: 'exportDiagram',
                format: 'json',
                data: jsonData
            });
        }

        function initializeDetailsPanelResizer() {
            const resizer = document.getElementById('details-panel-resizer');
            const panel = document.getElementById('details-panel');
            
            if (!resizer || !panel) return;
            
            let isResizing = false;
            let startY = 0;
            let startHeight = 0;
            
            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                startY = e.clientY;
                startHeight = panel.offsetHeight;
                
                // Disable transition during resize for smooth dragging
                panel.style.transition = 'none';
                
                // Prevent text selection during drag
                document.body.style.userSelect = 'none';
                
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                // Calculate new height (subtract because we're dragging up from bottom)
                const deltaY = startY - e.clientY;
                const newHeight = startHeight + deltaY;
                
                // Apply constraints
                const minHeight = 200;
                const maxHeight = window.innerHeight * 0.8;
                const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
                
                panel.style.height = constrainedHeight + 'px';
            });
            
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    
                    // Re-enable transition
                    panel.style.transition = 'transform 0.3s ease';
                    
                    // Re-enable text selection
                    document.body.style.userSelect = '';
                }
            });
        }

        window.addEventListener('load', () => {
            console.log('[Webview] Window load event fired');
            
            initializeDiagramRenderer();
            updateUILanguage();
            
            // Sync language with backend on load
            if (currentLanguage) {
                console.log('[Webview] Syncing language with backend:', currentLanguage);
                vscode.postMessage({ command: 'changeLanguage', language: currentLanguage });
            }
            
            // Initialize details panel resizer
            initializeDetailsPanelResizer();
            
            console.log('[Webview] Adding event listeners...');
            
            // Add event listeners for cache stats buttons (NO inline onclick - learned from bug)
            const refreshStatsBtn = document.getElementById('refresh-cache-stats-btn');
            console.log('[Webview] refreshStatsBtn:', refreshStatsBtn);
            if (refreshStatsBtn) {
                refreshStatsBtn.addEventListener('click', refreshCacheStats);
                console.log('[Webview] Added listener to refreshStatsBtn');
            }
            
            const clearCacheBtn = document.getElementById('clear-cache-settings-btn');
            console.log('[Webview] clearCacheBtn:', clearCacheBtn);
            if (clearCacheBtn) {
                clearCacheBtn.addEventListener('click', clearCacheFromSettings);
                console.log('[Webview] Added listener to clearCacheBtn');
            }
            
            // Control buttons event listeners
            const menuButton = document.getElementById('menu-button');
            console.log('[Webview] menuButton:', menuButton);
            if (menuButton) {
                menuButton.addEventListener('click', toggleLeftMenu);
                console.log('[Webview] Added listener to menuButton');
            }

            const leftMenuClose = document.getElementById('left-menu-close');
            console.log('[Webview] leftMenuClose:', leftMenuClose);
            if (leftMenuClose) {
                leftMenuClose.addEventListener('click', toggleLeftMenu);
                console.log('[Webview] Added listener to leftMenuClose');
            }

            const exportButton = document.getElementById('export-button');
            console.log('[Webview] exportButton:', exportButton);
            if (exportButton) {
                exportButton.addEventListener('click', toggleExportMenu);
                console.log('[Webview] Added listener to exportButton');
            }

            const zoomInButton = document.getElementById('zoom-in-button');
            console.log('[Webview] zoomInButton:', zoomInButton);
            if (zoomInButton) {
                zoomInButton.addEventListener('click', zoomIn);
                console.log('[Webview] Added listener to zoomInButton');
            }

            const zoomOutButton = document.getElementById('zoom-out-button');
            console.log('[Webview] zoomOutButton:', zoomOutButton);
            if (zoomOutButton) {
                zoomOutButton.addEventListener('click', zoomOut);
                console.log('[Webview] Added listener to zoomOutButton');
            }

            const resetZoomButton = document.getElementById('reset-zoom-button');
            console.log('[Webview] resetZoomButton:', resetZoomButton);
            if (resetZoomButton) {
                resetZoomButton.addEventListener('click', resetZoom);
                console.log('[Webview] Added listener to resetZoomButton');
            }

            // Export menu items
            const exportMenuItems = document.querySelectorAll('.export-menu-item');
            console.log('[Webview] exportMenuItems:', exportMenuItems.length);
            exportMenuItems.forEach(item => {
                item.addEventListener('click', function() {
                    const format = this.getAttribute('data-format');
                    console.log('[Webview] Export menu item clicked, format:', format);
                    exportDiagram(format);
                });
            });

            // Settings buttons
            const saveApiKeyBtn = document.getElementById('save-api-key-btn');
            console.log('[Webview] saveApiKeyBtn:', saveApiKeyBtn);
            if (saveApiKeyBtn) {
                saveApiKeyBtn.addEventListener('click', saveAPIKey);
                console.log('[Webview] Added listener to saveApiKeyBtn');
            }

            const clearApiKeyBtn = document.getElementById('clear-api-key-btn');
            console.log('[Webview] clearApiKeyBtn:', clearApiKeyBtn);
            if (clearApiKeyBtn) {
                clearApiKeyBtn.addEventListener('click', clearAPIKey);
                console.log('[Webview] Added listener to clearApiKeyBtn');
            }

            const testConnectionBtn = document.getElementById('test-connection-btn');
            console.log('[Webview] testConnectionBtn:', testConnectionBtn);
            if (testConnectionBtn) {
                testConnectionBtn.addEventListener('click', testConnection);
                console.log('[Webview] Added listener to testConnectionBtn');
            }

            const modelSelect = document.getElementById('model');
            console.log('[Webview] modelSelect:', modelSelect);
            if (modelSelect) {
                modelSelect.addEventListener('change', function() {
                    console.log('[Webview] Model changed to:', this.value);
                    saveModel(this.value);
                });
                console.log('[Webview] Added listener to modelSelect');
            }

            // Security buttons
            const regenerateBtn = document.getElementById('regenerate-btn');
            console.log('[Webview] regenerateBtn:', regenerateBtn);
            if (regenerateBtn) {
                regenerateBtn.addEventListener('click', regenerateAIReport);
                console.log('[Webview] Added listener to regenerateBtn');
            }

            // Risk info modal
            const riskInfoBtn = document.getElementById('risk-info-btn');
            const riskInfoModal = document.getElementById('risk-info-modal');
            const riskInfoClose = document.getElementById('risk-info-close');
            
            if (riskInfoBtn && riskInfoModal) {
                riskInfoBtn.addEventListener('click', () => {
                    riskInfoModal.classList.add('show');
                });
            }
            
            if (riskInfoClose && riskInfoModal) {
                riskInfoClose.addEventListener('click', () => {
                    riskInfoModal.classList.remove('show');
                });
            }
            
            // Close modal when clicking outside
            if (riskInfoModal) {
                riskInfoModal.addEventListener('click', (e) => {
                    if (e.target === riskInfoModal) {
                        riskInfoModal.classList.remove('show');
                    }
                });
            }

            const generateReportBtn = document.getElementById('generate-report-btn');
            console.log('[Webview] generateReportBtn:', generateReportBtn);
            if (generateReportBtn) {
                generateReportBtn.addEventListener('click', generateSecurityReport);
                console.log('[Webview] Added listener to generateReportBtn');
            }

            // Context menu items
            const analyzeContextFileItem = document.getElementById('analyze-context-file');
            console.log('[Webview] analyzeContextFileItem:', analyzeContextFileItem);
            if (analyzeContextFileItem) {
                analyzeContextFileItem.addEventListener('click', analyzeContextFile);
                console.log('[Webview] Added listener to analyzeContextFileItem');
            }

            const updateContextFileItem = document.getElementById('update-context-file');
            console.log('[Webview] updateContextFileItem:', updateContextFileItem);
            if (updateContextFileItem) {
                updateContextFileItem.addEventListener('click', updateContextFile);
                console.log('[Webview] Added listener to updateContextFileItem');
            }

            // Details panel close button
            const detailsPanelClose = document.getElementById('details-panel-close');
            console.log('[Webview] detailsPanelClose:', detailsPanelClose);
            if (detailsPanelClose) {
                detailsPanelClose.addEventListener('click', closeDetailsPanel);
                console.log('[Webview] Added listener to detailsPanelClose');
            }
            
            console.log('[Webview] All event listeners added successfully');
            
            // Request initial cache stats
            refreshCacheStats();
        });
        
    </script>
</body>
</html>`;
  }
}
