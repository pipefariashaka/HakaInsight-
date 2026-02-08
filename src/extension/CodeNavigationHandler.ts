/**
 * Code Navigation Handler
 * Handles navigation from webview recommendations to code locations in VS Code
 */

import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Interface for navigation requests from the webview
 */
export interface NavigationRequest {
  file: string;
  line?: number;
  column?: number;
}

/**
 * Handles code navigation from webview to editor
 */
export class CodeNavigationHandler {
  private workspaceRoot: string | undefined;

  constructor(context: vscode.ExtensionContext) {
    // Get workspace root
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this.workspaceRoot = workspaceFolders[0].uri.fsPath;
    }
  }

  /**
   * Navigate to a specific code location
   * @param request Navigation request with file path and optional line/column
   */
  async navigateToCode(request: NavigationRequest): Promise<void> {
    try {
      // Resolve the file path
      let uri = this.resolveFilePath(request.file);
      
      // If not found, try searching by filename
      if (!uri) {
        const fileName = path.basename(request.file);
        uri = await this.searchFileInWorkspace(fileName);
      }
      
      if (!uri) {
        vscode.window.showErrorMessage(`Could not find file: ${request.file}`);
        return;
      }

      // Check if file exists
      try {
        await vscode.workspace.fs.stat(uri);
      } catch (error) {
        // Try searching by filename as last resort
        const fileName = path.basename(request.file);
        const searchUri = await this.searchFileInWorkspace(fileName);
        
        if (searchUri) {
          uri = searchUri;
        } else {
          vscode.window.showErrorMessage(`File not found: ${request.file}`);
          return;
        }
      }

      // Open the document
      const document = await vscode.workspace.openTextDocument(uri);
      
      // Calculate position (VS Code uses 0-based indexing)
      const line = request.line ? Math.max(0, request.line - 1) : 0;
      const column = request.column ? Math.max(0, request.column) : 0;
      const position = new vscode.Position(line, column);
      
      // Create a range for selection
      const range = new vscode.Range(position, position);
      
      // Show the document with selection
      const editor = await vscode.window.showTextDocument(document, {
        selection: range,
        viewColumn: vscode.ViewColumn.One,
        preserveFocus: false
      });
      
      // Reveal the range in the center of the editor
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
      
      console.log(`[CodeNavigationHandler] Navigated to ${uri.fsPath}:${request.line || 1}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[CodeNavigationHandler] Navigation error:', errorMessage);
      vscode.window.showErrorMessage(`Failed to navigate to code: ${errorMessage}`);
    }
  }

  /**
   * Resolve a file path to a VS Code URI
   * Handles both relative and absolute paths
   * @param filePath The file path to resolve
   * @returns VS Code URI or undefined if not found
   */
  private resolveFilePath(filePath: string): vscode.Uri | undefined {
    try {
      // Handle absolute paths
      if (path.isAbsolute(filePath)) {
        return vscode.Uri.file(filePath);
      }

      // Handle relative paths - resolve relative to workspace root
      if (this.workspaceRoot) {
        const absolutePath = path.join(this.workspaceRoot, filePath);
        return vscode.Uri.file(absolutePath);
      }

      // If no workspace root, try to resolve relative to first workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const absolutePath = path.join(workspaceFolders[0].uri.fsPath, filePath);
        return vscode.Uri.file(absolutePath);
      }

      // Last resort: treat as absolute path
      return vscode.Uri.file(filePath);
    } catch (error) {
      console.error('[CodeNavigationHandler] Error resolving file path:', error);
      return undefined;
    }
  }

  /**
   * Search for a file by name in the workspace
   * @param fileName The file name to search for
   * @returns VS Code URI or undefined if not found
   */
  private async searchFileInWorkspace(fileName: string): Promise<vscode.Uri | undefined> {
    try {
      // Search for files matching the name
      const files = await vscode.workspace.findFiles(`**/${fileName}`, '**/node_modules/**', 10);
      
      if (files.length > 0) {
        // Return the first match
        return files[0];
      }
      
      return undefined;
    } catch (error) {
      console.error('[CodeNavigationHandler] Error searching for file:', error);
      return undefined;
    }
  }

  /**
   * Navigate to a file without a specific line number
   * @param filePath The file path to open
   */
  async navigateToFile(filePath: string): Promise<void> {
    await this.navigateToCode({ file: filePath });
  }
}
