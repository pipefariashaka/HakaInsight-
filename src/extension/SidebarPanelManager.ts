/**
 * Sidebar Panel Manager
 * Creates and manages the sidebar panel with webview
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DiagramData } from '../models';
import { ISidebarPanelManager } from '../services/types';
import { setCurrentLanguage, clearLanguageCache } from '../i18n/translations';
import { TemplateLoader } from '../webview/TemplateLoader';

const ACTIVE_TAB_STATE_KEY = 'code-architect-active-tab';

export class SidebarPanelManager implements ISidebarPanelManager {
  private panel: vscode.WebviewPanel | undefined;
  private globalState: vscode.Memento | undefined;
  private context: vscode.ExtensionContext | undefined;
  private templateLoader: TemplateLoader | undefined;
  private onSaveAPIKeyCallback?: (apiKey: string) => Promise<void>;
  private onClearAPIKeyCallback?: (() => Promise<void>) | undefined;
  private onValidateAPIKeyCallback?: (apiKey: string) => Promise<{ valid: boolean; message: string }>;
  private onSaveModelCallback?: (model: string) => Promise<void>;
  private onApplyLayoutCallback?: (mode: string) => Promise<void>;
  private onGenerateAIReportCallback?: (findings: any[]) => Promise<string>;
  private onGetRecommendationCallback?: (finding: any) => Promise<string>;
  private onGenerateHTMLReportCallback?: () => Promise<void>;
  private onGenerateSecurityReportCallback?: () => Promise<void>;
  private onGenerateQualityReportCallback?: () => Promise<void>;
  private onNavigateToDependencyCallback?: (filePath: string) => Promise<void>;
  private onAnalyzeFileCallback?: (filePath: string) => Promise<void>;
  private onUpdateAnalysisCallback?: (filePath: string) => Promise<void>;
  private onToggleFileVisibilityCallback?: (filePath: string, visible: boolean) => Promise<void>;
  private onGetCacheStatsCallback?: () => Promise<void>;
  private onDeepenAnalysisCallback?: (nodeId: string, nodeLabel: string, nodePath?: string) => Promise<void>;
  private onAnalyzeCodeQualityCallback?: () => Promise<any>;
  private onNavigateToCodeCallback?: (file: string, line?: number, column?: number) => Promise<void>;
  private onSaveDiagramPositionsCallback?: (positions: any) => Promise<void>;
  private messageDisposable: vscode.Disposable | undefined;

  createPanel(context: vscode.ExtensionContext, analysisCache?: any): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.globalState = context.globalState;
    this.context = context;
    this.templateLoader = new TemplateLoader(context.extensionPath);

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

  switchTab(tabName: 'diagram' | 'settings' | 'security' | 'quality'): void {
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

  updateQualitySummary(summary: any): void {
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'updateQualitySummary',
        summary: summary,
      });
    }
  }

  sendDiagramPositions(positions: any): void {
    if (this.panel) {
      this.panel.webview.postMessage({
        command: 'loadDiagramPositions',
        positions: positions,
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

  setOnGenerateSecurityReportCallback(callback: () => Promise<void>): void {
    this.onGenerateSecurityReportCallback = callback;
  }

  setOnGenerateQualityReportCallback(callback: () => Promise<void>): void {
    this.onGenerateQualityReportCallback = callback;
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

  setOnAnalyzeCodeQualityCallback(callback: () => Promise<any>): void {
    this.onAnalyzeCodeQualityCallback = callback;
  }

  setOnNavigateToCodeCallback(callback: (file: string, line?: number, column?: number) => Promise<void>): void {
    this.onNavigateToCodeCallback = callback;
  }

  setOnSaveDiagramPositionsCallback(callback: (positions: any) => Promise<void>): void {
    this.onSaveDiagramPositionsCallback = callback;
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
          const languageName = message.language === 'es' ? 'espaÃ±ol' : 'English';
          vscode.window.showInformationMessage(
            message.language === 'es' 
              ? `Idioma cambiado a espaÃ±ol. Los anÃ¡lisis existentes permanecen en su idioma original. Para ver anÃ¡lisis en espaÃ±ol, vuelva a analizar los archivos.`
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
      case 'generateSecurityReport':
        if (this.onGenerateSecurityReportCallback) {
          try {
            await this.onGenerateSecurityReportCallback();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to generate security report: ${errorMessage}`);
          }
        }
        break;
      case 'generateQualityReport':
        if (this.onGenerateQualityReportCallback) {
          try {
            await this.onGenerateQualityReportCallback();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to generate quality report: ${errorMessage}`);
          }
        }
        break;
      case 'analyzeCodeQuality':
        if (this.onAnalyzeCodeQualityCallback) {
          try {
            const result = await this.onAnalyzeCodeQualityCallback();
            this.panel?.webview.postMessage({
              command: 'qualityAnalysisResult',
              result: result,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to analyze code quality: ${errorMessage}`);
          }
        }
        break;
      case 'navigateToCode':
        if (this.onNavigateToCodeCallback) {
          try {
            await this.onNavigateToCodeCallback(message.file, message.line, message.column);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to navigate to code: ${errorMessage}`);
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
        if (this.onSaveDiagramPositionsCallback) {
          try {
            await this.onSaveDiagramPositionsCallback(message.positions);
          } catch (error) {
            console.error('Failed to save node positions:', error);
          }
        }
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
    if (!this.templateLoader) {
      return '<!DOCTYPE html><html><body>Error: Template loader not initialized</body></html>';
    }

    try {
      // Load all CSS files
      const styles = `
        <style>
          ${this.templateLoader.loadStyle('extracted.css')}
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
        'SCRIPTS': `<!-- Build: ${Date.now()} -->\n${scripts}`,
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
}
