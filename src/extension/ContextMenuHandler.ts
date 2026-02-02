/**
 * Context Menu Handler
 * Registers and handles the "Analyze Architecture" context menu option
 */

import * as vscode from 'vscode';
import { IContextMenuHandler } from '../services/types';

export class ContextMenuHandler implements IContextMenuHandler {
  private onAnalyzeCallback?: (fileUri: vscode.Uri) => Promise<void>;

  /**
   * Sets the callback function to be called when analysis is triggered
   */
  setOnAnalyzeCallback(callback: (fileUri: vscode.Uri) => Promise<void>): void {
    this.onAnalyzeCallback = callback;
  }

  /**
   * Registers the context menu command
   * Note: The actual command registration happens in extension.ts
   * This class just manages the callback
   */
  registerContextMenu(context: vscode.ExtensionContext): void {
    // Command is registered in extension.ts to avoid duplication
    // This method is kept for interface compatibility
  }
}
