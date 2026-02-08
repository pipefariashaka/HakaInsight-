/**
 * Service interface definitions
 */

import * as vscode from 'vscode';
import { DiagramData, AnalysisResult } from '../models';

/**
 * Interface for the Storage Manager service
 */
export interface IStorageManager {
  /**
   * Save diagram data to local storage
   */
  saveDiagram(diagramData: DiagramData): Promise<void>;

  /**
   * Load diagram data from local storage
   */
  loadDiagram(): Promise<DiagramData | null>;

  /**
   * Clear all stored diagram data
   */
  clearDiagram(): Promise<void>;

  /**
   * Save API Key to VS Code's secret storage
   */
  saveAPIKey(apiKey: string, context: vscode.ExtensionContext): Promise<void>;

  /**
   * Get API Key from VS Code's secret storage
   */
  getAPIKey(context: vscode.ExtensionContext): Promise<string | undefined>;

  /**
   * Clear API Key from VS Code's secret storage
   */
  clearAPIKey(context: vscode.ExtensionContext): Promise<void>;
}

/**
 * Interface for the Gemini API Client service
 */
export interface IGeminiAPIClient {
  /**
   * Analyze code using Gemini API
   */
  analyzeCode(code: string, apiKey: string): Promise<AnalysisResult>;

  /**
   * Parse Gemini API response into AnalysisResult
   */
  parseResponse(response: string): AnalysisResult;
}

/**
 * Interface for the Sidebar Panel Manager service
 */
export interface ISidebarPanelManager {
  /**
   * Create and show the sidebar panel
   */
  createPanel(context: vscode.ExtensionContext): void;

  /**
   * Switch between tabs in the panel
   */
  switchTab(tabName: 'diagram' | 'settings' | 'security' | 'quality' | 'about'): void;

  /**
   * Update the diagram displayed in the panel
   */
  updateDiagram(diagramData: DiagramData): void;

  /**
   * Update the diagram with complete analysis result
   */
  updateDiagramWithAnalysis(diagramData: DiagramData, analysisResult: any): void;

  /**
   * Show a warning message in the panel
   */
  showWarning(message: string): void;

  /**
   * Set callback for when user saves API Key
   */
  setOnSaveAPIKeyCallback(callback: (apiKey: string) => Promise<void>): void;

  /**
   * Set callback for when user clears API Key
   */
  setOnClearAPIKeyCallback(callback: () => Promise<void>): void;

  /**
   * Set callback for when user navigates to a dependency
   */
  setOnNavigateToDependencyCallback(callback: (filePath: string) => Promise<void>): void;
}

/**
 * Interface for the Context Menu Handler service
 */
export interface IContextMenuHandler {
  /**
   * Register the context menu command
   */
  registerContextMenu(context: vscode.ExtensionContext): void;

  /**
   * Set callback for when analysis is triggered
   */
  setOnAnalyzeCallback(callback: (fileUri: vscode.Uri) => Promise<void>): void;
}
