/**
 * Analysis Cache Manager
 * Handles in-memory cache of code analysis results
 * Persistence is handled by saveAnalysisCache/loadAnalysisCache in extension.ts
 */

import * as vscode from 'vscode';
import { AnalysisResult } from '../models';

export class AnalysisCache {
  private cache: Map<string, AnalysisResult> = new Map();
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    // Don't load from storage here - it's handled by loadAnalysisCache in extension.ts
  }

  /**
   * Save analysis result for a file (in-memory only)
   */
  saveAnalysis(filePath: string, result: AnalysisResult): void {
    this.cache.set(filePath, result);
    // Don't persist here - it's handled by saveAnalysisCache in extension.ts
  }

  /**
   * Get cached analysis for a file
   */
  getAnalysis(filePath: string): AnalysisResult | undefined {
    return this.cache.get(filePath);
  }

  /**
   * Check if file has been analyzed
   */
  hasAnalysis(filePath: string): boolean {
    return this.cache.has(filePath);
  }

  /**
   * Get all analyzed files
   */
  getAllAnalyzedFiles(): Array<{ path: string; name: string }> {
    return Array.from(this.cache.keys()).map(path => ({
      path,
      name: path.split(/[/\\]/).pop() || path,
    }));
  }

  /**
   * Clear analysis for a file
   */
  clearAnalysis(filePath: string): void {
    this.cache.delete(filePath);
  }

  /**
   * Clear all analyses
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Clear all analyses (alias for clearAll)
   */
  clear(): void {
    this.clearAll();
  }
}
