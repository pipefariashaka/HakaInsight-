/**
 * Persistence Manager Service
 * Handles immediate persistence with debouncing
 * 
 * Features:
 * - Save diagram data immediately after updates
 * - Implement debouncing to avoid excessive writes
 * - Ensure changes are persisted within 100ms
 */

import { DiagramData } from '../models';
import { IStorageManager } from './types';

export class PersistenceManager {
  private storageManager: IStorageManager;
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingDiagram: DiagramData | null = null;
  private lastSavedDiagram: DiagramData | null = null;
  private readonly DEBOUNCE_DELAY_MS = 100;

  constructor(storageManager: IStorageManager) {
    this.storageManager = storageManager;
  }

  /**
   * Schedule a diagram save with debouncing
   * 
   * @param diagramData - The diagram data to save
   */
  async scheduleSave(diagramData: DiagramData): Promise<void> {
    this.pendingDiagram = diagramData;

    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = setTimeout(async () => {
      await this.flush();
    }, this.DEBOUNCE_DELAY_MS);
  }

  /**
   * Flush pending saves immediately
   */
  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.pendingDiagram) {
      try {
        // Check if diagram has actually changed
        if (!this.isDiagramEqual(this.pendingDiagram, this.lastSavedDiagram)) {
          await this.storageManager.saveDiagram(this.pendingDiagram);
          if (this.pendingDiagram) {
            this.lastSavedDiagram = JSON.parse(JSON.stringify(this.pendingDiagram));
          }
        }
      } catch (error) {
        console.error('Failed to persist diagram:', error);
      }
      this.pendingDiagram = null;
    }
  }

  /**
   * Check if two diagrams are equal
   * 
   * @param diagram1 - First diagram
   * @param diagram2 - Second diagram
   * @returns True if diagrams are equal
   */
  private isDiagramEqual(diagram1: DiagramData | null, diagram2: DiagramData | null): boolean {
    if (!diagram1 && !diagram2) {return true;}
    if (!diagram1 || !diagram2) {return false;}

    if (diagram1.nodes.length !== diagram2.nodes.length) {return false;}
    if (diagram1.edges.length !== diagram2.edges.length) {return false;}

    // Compare nodes
    const nodes2Map = new Map();
    diagram2.nodes.forEach(node => {
      nodes2Map.set(node.id, node);
    });

    for (const node1 of diagram1.nodes) {
      const node2 = nodes2Map.get(node1.id);
      if (!node2 || JSON.stringify(node1) !== JSON.stringify(node2)) {
        return false;
      }
    }

    // Compare edges
    const edges2Map = new Map();
    diagram2.edges.forEach(edge => {
      edges2Map.set(edge.id, edge);
    });

    for (const edge1 of diagram1.edges) {
      const edge2 = edges2Map.get(edge1.id);
      if (!edge2 || JSON.stringify(edge1) !== JSON.stringify(edge2)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the debounce delay in milliseconds
   */
  getDebounceDelay(): number {
    return this.DEBOUNCE_DELAY_MS;
  }
}
