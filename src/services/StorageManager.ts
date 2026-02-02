/**
 * Storage Manager Service
 * Handles persistence of diagram data and API credentials
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DiagramData } from '../models';
import { IStorageManager } from './types';

const DIAGRAM_STORAGE_KEY = 'code-architect-diagram';
const API_KEY_STORAGE_KEY = 'code-architect-api-key';
const MODEL_STORAGE_KEY = 'code-architect-model';
const LAYOUT_MODE_STORAGE_KEY = 'code-architect-layout-mode';

export type GeminiModel = 'gemini-3-flash-preview' | 'gemini-3-pro';
export type LayoutMode = 'auto' | 'hierarchical' | 'ai';

export class StorageManager implements IStorageManager {
  private storagePath: string;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
    this.ensureStorageDirectory();
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async saveDiagram(diagramData: DiagramData): Promise<void> {
    try {
      const filePath = path.join(this.storagePath, `${DIAGRAM_STORAGE_KEY}.json`);
      const data = JSON.stringify(diagramData, null, 2);
      fs.writeFileSync(filePath, data, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save diagram: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadDiagram(): Promise<DiagramData | null> {
    try {
      const filePath = path.join(this.storagePath, `${DIAGRAM_STORAGE_KEY}.json`);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as DiagramData;
    } catch (error) {
      throw new Error(`Failed to load diagram: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async clearDiagram(): Promise<void> {
    try {
      const filePath = path.join(this.storagePath, `${DIAGRAM_STORAGE_KEY}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      throw new Error(`Failed to clear diagram: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveAPIKey(apiKey: string, context: vscode.ExtensionContext): Promise<void> {
    try {
      await context.secrets.store(API_KEY_STORAGE_KEY, apiKey);
    } catch (error) {
      throw new Error(`Failed to save API Key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getAPIKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    try {
      return await context.secrets.get(API_KEY_STORAGE_KEY);
    } catch (error) {
      throw new Error(`Failed to get API Key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async clearAPIKey(context: vscode.ExtensionContext): Promise<void> {
    try {
      await context.secrets.delete(API_KEY_STORAGE_KEY);
    } catch (error) {
      throw new Error(`Failed to clear API Key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveModel(model: GeminiModel, context: vscode.ExtensionContext): Promise<void> {
    try {
      await context.globalState.update(MODEL_STORAGE_KEY, model);
    } catch (error) {
      throw new Error(`Failed to save model: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getModel(context: vscode.ExtensionContext): Promise<GeminiModel> {
    try {
      const model = context.globalState.get<GeminiModel>(MODEL_STORAGE_KEY);
      return model || 'gemini-3-flash-preview'; // Default to Flash
    } catch (error) {
      throw new Error(`Failed to get model: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveLayoutMode(layoutMode: LayoutMode, context: vscode.ExtensionContext): Promise<void> {
    try {
      await context.globalState.update(LAYOUT_MODE_STORAGE_KEY, layoutMode);
    } catch (error) {
      throw new Error(`Failed to save layout mode: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getLayoutMode(context: vscode.ExtensionContext): Promise<LayoutMode> {
    try {
      const layoutMode = context.globalState.get<LayoutMode>(LAYOUT_MODE_STORAGE_KEY);
      return layoutMode || 'ai'; // Default to AI-Optimized
    } catch (error) {
      throw new Error(`Failed to get layout mode: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
