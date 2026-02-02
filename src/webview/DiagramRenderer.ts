/**
 * Diagram Renderer
 * Handles rendering of architecture diagrams in the webview
 * 
 * Features:
 * - Render nodes (files/modules) with modern styling
 * - Render edges (dependencies) with visual connections
 * - Dark theme consistent with VS Code
 * - Clickable dependencies for navigation
 * - Zoom and scroll functionality
 */

import { DiagramData, DiagramNode, DiagramEdge } from '../models';

export class DiagramRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private zoomLevel: number = 1;
  private panX: number = 0;
  private panY: number = 0;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private nodes: Map<string, DiagramNode> = new Map();
  private edges: DiagramEdge[] = [];
  private onNodeClick?: (nodeId: string) => void;

  /**
   * Initialize the diagram renderer
   * 
   * @param canvasElement - The canvas element to render on
   */
  initialize(canvasElement: HTMLCanvasElement): void {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    if (!this.ctx) {
      throw new Error('Failed to get canvas context');
    }

    this.setupEventListeners();
    this.resizeCanvas();
  }

  /**
   * Render a diagram
   * 
   * @param diagramData - The diagram data to render
   */
  render(diagramData: DiagramData): void {
    // Store nodes and edges
    this.nodes.clear();
    diagramData.nodes.forEach(node => {
      this.nodes.set(node.id, node);
    });
    this.edges = diagramData.edges;

    // Calculate positions if not already set
    this.calculateNodePositions();

    // Clear canvas
    this.clear();

    // Draw edges first (so they appear behind nodes)
    this.drawEdges();

    // Draw nodes
    this.drawNodes();
  }

  /**
   * Set the callback for when a node is clicked
   * 
   * @param callback - The callback function
   */
  setOnNodeClick(callback: (nodeId: string) => void): void {
    this.onNodeClick = callback;
  }

  /**
   * Zoom in
   */
  zoomIn(): void {
    this.zoomLevel *= 1.2;
    this.redraw();
  }

  /**
   * Zoom out
   */
  zoomOut(): void {
    this.zoomLevel /= 1.2;
    this.redraw();
  }

  /**
   * Reset zoom and pan
   */
  resetZoom(): void {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.redraw();
  }

  /**
   * Setup event listeners for canvas interactions
   */
  private setupEventListeners(): void {
    if (!this.canvas) {return;}

    // Mouse wheel for zoom
    this.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    });

    // Mouse drag for pan
    this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    });

    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        this.panX += deltaX;
        this.panY += deltaY;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.redraw();
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });

    // Click for node selection
    this.canvas.addEventListener('click', (e: MouseEvent) => {
      const rect = this.canvas!.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.panX) / this.zoomLevel;
      const y = (e.clientY - rect.top - this.panY) / this.zoomLevel;

      // Check if click is on a node
      for (const [nodeId, node] of this.nodes) {
        const nodeX = node.position?.x || 0;
        const nodeY = node.position?.y || 0;
        const nodeWidth = 150;
        const nodeHeight = 60;

        if (
          x >= nodeX - nodeWidth / 2 &&
          x <= nodeX + nodeWidth / 2 &&
          y >= nodeY - nodeHeight / 2 &&
          y <= nodeY + nodeHeight / 2
        ) {
          if (this.onNodeClick) {
            this.onNodeClick(nodeId);
          }
          break;
        }
      }
    });

    // Resize canvas on window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.redraw();
    });
  }

  /**
   * Resize canvas to fit container
   */
  private resizeCanvas(): void {
    if (!this.canvas) {return;}

    const container = this.canvas.parentElement;
    if (!container) {return;}

    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  /**
   * Clear the canvas
   */
  private clear(): void {
    if (!this.ctx || !this.canvas) {return;}

    this.ctx.fillStyle = '#252526';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Redraw the diagram
   */
  private redraw(): void {
    this.clear();
    this.drawEdges();
    this.drawNodes();
  }

  /**
   * Draw edges (dependencies)
   */
  private drawEdges(): void {
    if (!this.ctx) {return;}

    this.ctx.strokeStyle = '#555555';
    this.ctx.lineWidth = 2 / this.zoomLevel;

    for (const edge of this.edges) {
      const sourceNode = this.nodes.get(edge.source);
      const targetNode = this.nodes.get(edge.target);

      if (!sourceNode || !targetNode) {continue;}

      const sourceX = (sourceNode.position?.x || 0) * this.zoomLevel + this.panX;
      const sourceY = (sourceNode.position?.y || 0) * this.zoomLevel + this.panY;
      const targetX = (targetNode.position?.x || 0) * this.zoomLevel + this.panX;
      const targetY = (targetNode.position?.y || 0) * this.zoomLevel + this.panY;

      // Draw line
      this.ctx.beginPath();
      this.ctx.moveTo(sourceX, sourceY);
      this.ctx.lineTo(targetX, targetY);
      this.ctx.stroke();

      // Draw arrow
      this.drawArrow(sourceX, sourceY, targetX, targetY);
    }
  }

  /**
   * Draw an arrow on an edge
   */
  private drawArrow(fromX: number, fromY: number, toX: number, toY: number): void {
    if (!this.ctx) {return;}

    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    this.ctx.fillStyle = '#555555';
    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Draw nodes (files/modules)
   */
  private drawNodes(): void {
    if (!this.ctx) {return;}

    for (const [nodeId, node] of this.nodes) {
      const x = (node.position?.x || 0) * this.zoomLevel + this.panX;
      const y = (node.position?.y || 0) * this.zoomLevel + this.panY;
      const width = 150;
      const height = 60;

      // Draw node background
      this.ctx.fillStyle = '#3c3c3c';
      this.ctx.strokeStyle = '#007acc';
      this.ctx.lineWidth = 2 / this.zoomLevel;
      this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
      this.ctx.strokeRect(x - width / 2, y - height / 2, width, height);

      // Draw node text
      this.ctx.fillStyle = '#e0e0e0';
      this.ctx.font = `${12 * this.zoomLevel}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Draw label
      const label = node.label.length > 20 ? node.label.substring(0, 17) + '...' : node.label;
      this.ctx.fillText(label, x, y - 10);

      // Draw type
      this.ctx.fillStyle = '#858585';
      this.ctx.font = `${10 * this.zoomLevel}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`;
      this.ctx.fillText(node.type, x, y + 15);
    }
  }

  /**
   * Calculate node positions using a simple force-directed layout
   */
  private calculateNodePositions(): void {
    if (this.nodes.size === 0) {return;}

    // Initialize positions if not set
    let nodeIndex = 0;
    for (const [, node] of this.nodes) {
      if (!node.position) {
        const angle = (nodeIndex / this.nodes.size) * Math.PI * 2;
        const radius = 200;
        node.position = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };
      }
      nodeIndex++;
    }

    // Simple force-directed layout
    for (let iteration = 0; iteration < 50; iteration++) {
      // Repulsive forces
      const nodeArray = Array.from(this.nodes.values());
      for (let i = 0; i < nodeArray.length; i++) {
        for (let j = i + 1; j < nodeArray.length; j++) {
          const node1 = nodeArray[i];
          const node2 = nodeArray[j];

          if (!node1.position || !node2.position) {continue;}

          const dx = node2.position.x - node1.position.x;
          const dy = node2.position.y - node1.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const repulsion = 50000 / (distance * distance);

          node1.position.x -= (dx / distance) * repulsion;
          node1.position.y -= (dy / distance) * repulsion;
          node2.position.x += (dx / distance) * repulsion;
          node2.position.y += (dy / distance) * repulsion;
        }
      }

      // Attractive forces for connected nodes
      for (const edge of this.edges) {
        const sourceNode = this.nodes.get(edge.source);
        const targetNode = this.nodes.get(edge.target);

        if (!sourceNode?.position || !targetNode?.position) {continue;}

        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const attraction = (distance * distance) / 100;

        sourceNode.position.x += (dx / distance) * attraction;
        sourceNode.position.y += (dy / distance) * attraction;
        targetNode.position.x -= (dx / distance) * attraction;
        targetNode.position.y -= (dy / distance) * attraction;
      }
    }
  }
}
