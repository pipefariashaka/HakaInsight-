/**
 * Tree Data Provider for the sidebar view
 * Provides the tree structure for the Haka Insight view
 */

import * as vscode from 'vscode';

export class ArchitectureTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    // Return empty array - the panel opens automatically when the view becomes visible
    return Promise.resolve([]);
  }
}
