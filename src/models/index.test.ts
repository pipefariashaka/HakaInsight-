/**
 * Unit tests for data models
 */

import * as assert from 'assert';
import {
  DiagramNode,
  DiagramEdge,
  DiagramData,
  Dependency,
  Warning,
  AnalysisResult,
} from './index';

describe('Data Models', () => {
  describe('DiagramNode', () => {
    it('should create a valid node', () => {
      const node: DiagramNode = {
        id: 'node1',
        label: 'Test Node',
        filePath: '/test/file.ts',
        type: 'file',
        description: 'Test description',
        position: { x: 100, y: 200 },
      };

      assert.strictEqual(node.id, 'node1');
      assert.strictEqual(node.label, 'Test Node');
      assert.strictEqual(node.type, 'file');
    });

    it('should allow optional fields', () => {
      const node: DiagramNode = {
        id: 'node1',
        label: 'Test Node',
        filePath: '/test/file.ts',
        type: 'module',
      };

      assert.strictEqual(node.description, undefined);
      assert.strictEqual(node.position, undefined);
    });
  });

  describe('DiagramEdge', () => {
    it('should create a valid edge', () => {
      const edge: DiagramEdge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        label: 'imports',
        type: 'import',
      };

      assert.strictEqual(edge.id, 'edge1');
      assert.strictEqual(edge.source, 'node1');
      assert.strictEqual(edge.target, 'node2');
    });
  });

  describe('DiagramData', () => {
    it('should create valid diagram data', () => {
      const diagramData: DiagramData = {
        nodes: [
          {
            id: 'node1',
            label: 'Test',
            filePath: '/test.ts',
            type: 'file',
          },
        ],
        edges: [
          {
            id: 'edge1',
            source: 'node1',
            target: 'node2',
            type: 'import',
          },
        ],
        metadata: {
          lastUpdated: new Date().toISOString(),
          filesAnalyzed: ['/test.ts'],
        },
      };

      assert.strictEqual(diagramData.nodes.length, 1);
      assert.strictEqual(diagramData.edges.length, 1);
      assert.strictEqual(diagramData.metadata.filesAnalyzed.length, 1);
    });
  });

  describe('Warning', () => {
    it('should create a valid warning', () => {
      const warning: Warning = {
        type: 'security',
        severity: 'high',
        message: 'SQL Injection vulnerability detected',
        line: 42,
      };

      assert.strictEqual(warning.type, 'security');
      assert.strictEqual(warning.severity, 'high');
    });

    it('should allow optional line number', () => {
      const warning: Warning = {
        type: 'bestPractice',
        severity: 'low',
        message: 'Consider using const instead of let',
      };

      assert.strictEqual(warning.line, undefined);
    });
  });

  describe('AnalysisResult', () => {
    it('should create a valid analysis result', () => {
      const result: AnalysisResult = {
        diagram: {
          nodes: [],
          edges: [],
          metadata: {
            lastUpdated: new Date().toISOString(),
            filesAnalyzed: [],
          },
        },
        dependencies: [],
        securityWarnings: [],
        logicWarnings: [],
        bestPracticeWarnings: [],
        explanation: 'Test explanation',
      };

      assert.strictEqual(result.diagram.nodes.length, 0);
      assert.strictEqual(result.dependencies.length, 0);
      assert.strictEqual(result.securityWarnings.length, 0);
      assert.strictEqual(result.logicWarnings.length, 0);
      assert.strictEqual(result.bestPracticeWarnings.length, 0);
    });
  });
});
