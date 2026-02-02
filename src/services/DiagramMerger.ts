/**
 * Diagram Merger Service
 * Handles merging of diagram data to support incremental updates
 * 
 * Features:
 * - Merge new analysis results with existing diagram
 * - Avoid duplicate nodes and edges
 * - Update existing nodes with new information
 */

import { DiagramData, DiagramNode, DiagramEdge } from '../models';

export class DiagramMerger {
  /**
   * Merge a new diagram with an existing one
   * 
   * @param existingDiagram - The existing diagram (can be null)
   * @param newDiagram - The new diagram to merge
   * @returns The merged diagram
   */
  static merge(existingDiagram: DiagramData | null, newDiagram: DiagramData): DiagramData {
    if (!existingDiagram) {
      return newDiagram;
    }

    // Create maps for efficient lookup
    const existingNodesMap = new Map<string, DiagramNode>();
    const existingEdgesMap = new Map<string, DiagramEdge>();

    existingDiagram.nodes.forEach(node => {
      existingNodesMap.set(node.id, node);
    });

    existingDiagram.edges.forEach(edge => {
      existingEdgesMap.set(edge.id, edge);
    });

    // Merge nodes
    const mergedNodes: DiagramNode[] = [];
    const processedNodeIds = new Set<string>();

    // Add existing nodes
    for (const [nodeId, node] of existingNodesMap) {
      mergedNodes.push(node);
      processedNodeIds.add(nodeId);
    }

    // Add new nodes that don't exist
    for (const newNode of newDiagram.nodes) {
      if (!processedNodeIds.has(newNode.id)) {
        mergedNodes.push(newNode);
        processedNodeIds.add(newNode.id);
      } else {
        // Update existing node with new information
        const existingNode = existingNodesMap.get(newNode.id);
        if (existingNode) {
          // Update properties if they're different
          if (newNode.label && newNode.label !== existingNode.label) {
            existingNode.label = newNode.label;
          }
          if (newNode.description && newNode.description !== existingNode.description) {
            existingNode.description = newNode.description;
          }
          if (newNode.type && newNode.type !== existingNode.type) {
            existingNode.type = newNode.type;
          }
        }
      }
    }

    // Merge edges
    const mergedEdges: DiagramEdge[] = [];
    const processedEdgeIds = new Set<string>();

    // Add existing edges
    for (const [edgeId, edge] of existingEdgesMap) {
      mergedEdges.push(edge);
      processedEdgeIds.add(edgeId);
    }

    // Add new edges that don't exist
    for (const newEdge of newDiagram.edges) {
      if (!processedEdgeIds.has(newEdge.id)) {
        mergedEdges.push(newEdge);
        processedEdgeIds.add(newEdge.id);
      }
    }

    // Merge metadata
    const mergedMetadata = {
      lastUpdated: new Date().toISOString(),
      filesAnalyzed: Array.from(
        new Set([
          ...existingDiagram.metadata.filesAnalyzed,
          ...newDiagram.metadata.filesAnalyzed,
        ])
      ),
    };

    return {
      nodes: mergedNodes,
      edges: mergedEdges,
      metadata: mergedMetadata,
    };
  }

  /**
   * Check if two diagrams are equivalent
   * 
   * @param diagram1 - First diagram
   * @param diagram2 - Second diagram
   * @returns True if diagrams are equivalent
   */
  static areEquivalent(diagram1: DiagramData, diagram2: DiagramData): boolean {
    if (diagram1.nodes.length !== diagram2.nodes.length) {
      return false;
    }

    if (diagram1.edges.length !== diagram2.edges.length) {
      return false;
    }

    // Check nodes
    const nodes2Map = new Map<string, DiagramNode>();
    diagram2.nodes.forEach(node => {
      nodes2Map.set(node.id, node);
    });

    for (const node1 of diagram1.nodes) {
      const node2 = nodes2Map.get(node1.id);
      if (!node2 || node1.label !== node2.label || node1.type !== node2.type) {
        return false;
      }
    }

    // Check edges
    const edges2Map = new Map<string, DiagramEdge>();
    diagram2.edges.forEach(edge => {
      edges2Map.set(edge.id, edge);
    });

    for (const edge1 of diagram1.edges) {
      const edge2 = edges2Map.get(edge1.id);
      if (!edge2 || edge1.source !== edge2.source || edge1.target !== edge2.target) {
        return false;
      }
    }

    return true;
  }
}
