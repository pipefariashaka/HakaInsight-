/**
 * Core data models and interfaces for Code Architecture Analyzer
 */

/**
 * Represents a node in the architecture diagram
 */
export interface DiagramNode {
  id: string;
  label: string;
  filePath?: string;
  type: 'file' | 'module' | 'component';
  description?: string;
  position?: { x: number; y: number };
  isCurrentFile?: boolean;
  isDependency?: boolean;
  isAnalyzed?: boolean;
  parentId?: string;
  path?: string;
}

/**
 * Represents an edge (dependency) in the architecture diagram
 */
export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: 'import' | 'dependency' | 'reference';
}

/**
 * Represents the complete diagram data
 */
export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  metadata: {
    lastUpdated: string;
    filesAnalyzed: string[];
  };
}

/**
 * Represents a dependency between files or modules
 */
export interface Dependency {
  source: string;
  target: string;
  type: string;
}

/**
 * Represents a warning about code quality, security, or best practices
 */
export interface Warning {
  type: 'security' | 'logic' | 'bestPractice';
  severity: 'high' | 'medium' | 'low';
  message: string;
  line?: number;
}

/**
 * Represents the complete analysis result from Gemini API
 */
export interface AnalysisResult {
  diagram: DiagramData;
  dependencies: Dependency[];
  securityWarnings: Warning[];
  logicWarnings: Warning[];
  bestPracticeWarnings: Warning[];
  explanation: string;
  currentFile?: {
    name: string;
    description: string;
    components: Array<{
      id: string;
      name: string;
      type: string;
      description: string;
    }>;
  };
}
