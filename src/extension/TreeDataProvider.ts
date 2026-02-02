/**
 * Tree Data Provider for the sidebar view
 * Provides the tree structure for the Code Architecture Analyzer view
 */

import * as vscode from 'vscode';

export class ArchitectureTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!element) {
      // Root level - show a button to open the diagram
      const item = new vscode.TreeItem('📊 Open Diagram', vscode.TreeItemCollapsibleState.None);
      item.command = {
        command: 'code-architect-hakalab.openSidebar',
        title: 'Open Diagram',
        arguments: []
      };
      item.tooltip = 'Click to open the architecture diagram';
      return Promise.resolve([item]);
    }
    return Promise.resolve([]);
  }
}
