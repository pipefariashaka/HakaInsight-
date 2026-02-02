/**
 * Unit and Property-Based Tests for GeminiAPIClient
 */

import * as assert from 'assert';
import * as fc from 'fast-check';
import { GeminiAPIClient } from './GeminiAPIClient';
import { AnalysisResult, DiagramNode, DiagramEdge, Warning, Dependency } from '../models';

describe('GeminiAPIClient', () => {
  let client: GeminiAPIClient;

  beforeEach(() => {
    client = new GeminiAPIClient();
  });

  describe('parseResponse - Unit Tests', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        diagram: {
          nodes: [
            {
              id: 'node1',
              label: 'Test',
              filePath: '/test.ts',
              type: 'file',
            },
          ],
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
      });

      const result = client.parseResponse(response);

      assert.strictEqual(result.diagram.nodes.length, 1);
      assert.strictEqual(result.diagram.nodes[0].label, 'Test');
      assert.strictEqual(result.explanation, 'Test explanation');
    });

    it('should handle response with embedded JSON in markdown code blocks', () => {
      const response = `Here is the analysis:
\`\`\`json
{
  "diagram": {
    "nodes": [],
    "edges": [],
    "metadata": {
      "lastUpdated": "${new Date().toISOString()}",
      "filesAnalyzed": []
    }
  },
  "dependencies": [],
  "securityWarnings": [],
  "logicWarnings": [],
  "bestPracticeWarnings": [],
  "explanation": "Test"
}
\`\`\``;

      const result = client.parseResponse(response);

      assert.strictEqual(result.diagram.nodes.length, 0);
      assert.strictEqual(result.explanation, 'Test');
    });

    it('should handle response with embedded JSON without language tag', () => {
      const response = `Here is the analysis:
\`\`\`
{
  "diagram": {
    "nodes": [],
    "edges": [],
    "metadata": {
      "lastUpdated": "${new Date().toISOString()}",
      "filesAnalyzed": []
    }
  },
  "dependencies": [],
  "securityWarnings": [],
  "logicWarnings": [],
  "bestPracticeWarnings": [],
  "explanation": "Test"
}
\`\`\``;

      const result = client.parseResponse(response);

      assert.strictEqual(result.diagram.nodes.length, 0);
      assert.strictEqual(result.explanation, 'Test');
    });

    it('should create basic result for non-JSON response', () => {
      const response = 'This is plain text without JSON';

      const result = client.parseResponse(response);

      assert.strictEqual(result.diagram.nodes.length, 0);
      assert.strictEqual(result.dependencies.length, 0);
      assert.strictEqual(result.securityWarnings.length, 0);
      assert.strictEqual(result.explanation, response);
    });

    it('should handle missing fields in JSON', () => {
      const response = JSON.stringify({
        diagram: {
          nodes: [],
          edges: [],
          metadata: {
            lastUpdated: new Date().toISOString(),
            filesAnalyzed: [],
          },
        },
      });

      const result = client.parseResponse(response);

      assert.strictEqual(result.diagram.nodes.length, 0);
      assert.strictEqual(result.dependencies.length, 0);
      assert.strictEqual(result.securityWarnings.length, 0);
      assert.strictEqual(result.logicWarnings.length, 0);
      assert.strictEqual(result.bestPracticeWarnings.length, 0);
    });

    it('should handle empty response', () => {
      const result = client.parseResponse('');

      assert.strictEqual(result.diagram.nodes.length, 0);
      assert.strictEqual(result.dependencies.length, 0);
      assert.strictEqual(result.explanation, '');
    });

    it('should handle response with only whitespace', () => {
      const result = client.parseResponse('   \n\t  ');

      assert.strictEqual(result.diagram.nodes.length, 0);
      assert.strictEqual(result.dependencies.length, 0);
    });

    it('should handle malformed JSON gracefully', () => {
      const response = '{ invalid json }';

      const result = client.parseResponse(response);

      assert.strictEqual(result.diagram.nodes.length, 0);
      assert.strictEqual(result.explanation, response);
    });

    it('should handle response with multiple JSON objects', () => {
      const response = `{
        "diagram": {
          "nodes": [{"id": "1", "label": "A", "filePath": "a.ts", "type": "file"}],
          "edges": [],
          "metadata": {"lastUpdated": "${new Date().toISOString()}", "filesAnalyzed": []}
        },
        "dependencies": [],
        "securityWarnings": [],
        "logicWarnings": [],
        "bestPracticeWarnings": [],
        "explanation": "Test"
      }`;

      const result = client.parseResponse(response);

      assert.strictEqual(result.diagram.nodes.length, 1);
      assert.strictEqual(result.diagram.nodes[0].label, 'A');
    });

    it('should handle response with invalid diagram structure', () => {
      const response = JSON.stringify({
        diagram: 'not an object',
        dependencies: [],
        securityWarnings: [],
        logicWarnings: [],
        bestPracticeWarnings: [],
        explanation: 'Test',
      });

      const result = client.parseResponse(response);

      assert.strictEqual(result.diagram.nodes.length, 0);
      assert.strictEqual(result.diagram.edges.length, 0);
    });

    it('should handle response with non-array dependencies', () => {
      const response = JSON.stringify({
        diagram: {
          nodes: [],
          edges: [],
          metadata: {
            lastUpdated: new Date().toISOString(),
            filesAnalyzed: [],
          },
        },
        dependencies: 'not an array',
        securityWarnings: [],
        logicWarnings: [],
        bestPracticeWarnings: [],
        explanation: 'Test',
      });

      const result = client.parseResponse(response);

      assert.strictEqual(result.dependencies.length, 0);
    });
  });

  describe('Property-Based Tests', () => {
    // Generators for property-based testing
    const warningArbitrary = (): fc.Arbitrary<Warning> =>
      fc.record({
        type: fc.constantFrom<'security' | 'logic' | 'bestPractice'>('security', 'logic', 'bestPractice'),
        severity: fc.constantFrom<'high' | 'medium' | 'low'>('high', 'medium', 'low'),
        message: fc.string({ minLength: 1, maxLength: 200 }),
        line: fc.option(fc.integer({ min: 1, max: 10000 })),
      });

    const dependencyArbitrary = (): fc.Arbitrary<Dependency> =>
      fc.record({
        source: fc.string({ minLength: 1, maxLength: 100 }),
        target: fc.string({ minLength: 1, maxLength: 100 }),
        type: fc.string({ minLength: 1, maxLength: 50 }),
      });

    const diagramNodeArbitrary = (): fc.Arbitrary<DiagramNode> =>
      fc.record({
        id: fc.uuid(),
        label: fc.string({ minLength: 1, maxLength: 100 }),
        filePath: fc.string({ minLength: 1, maxLength: 200 }),
        type: fc.constantFrom<'file' | 'module' | 'component'>('file', 'module', 'component'),
        description: fc.option(fc.string({ maxLength: 200 })),
        position: fc.option(
          fc.record({
            x: fc.integer({ min: 0, max: 1000 }),
            y: fc.integer({ min: 0, max: 1000 }),
          })
        ),
      });

    const diagramEdgeArbitrary = (): fc.Arbitrary<DiagramEdge> =>
      fc.record({
        id: fc.uuid(),
        source: fc.uuid(),
        target: fc.uuid(),
        label: fc.option(fc.string({ maxLength: 100 })),
        type: fc.constantFrom<'import' | 'dependency' | 'reference'>('import', 'dependency', 'reference'),
      });

    const analysisResultArbitrary = (): fc.Arbitrary<AnalysisResult> =>
      fc.record({
        diagram: fc.record({
          nodes: fc.array(diagramNodeArbitrary(), { maxLength: 10 }),
          edges: fc.array(diagramEdgeArbitrary(), { maxLength: 10 }),
          metadata: fc.record({
            lastUpdated: fc.date().map(d => d.toISOString()),
            filesAnalyzed: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 10 }),
          }),
        }),
        dependencies: fc.array(dependencyArbitrary(), { maxLength: 10 }),
        securityWarnings: fc.array(warningArbitrary(), { maxLength: 10 }),
        logicWarnings: fc.array(warningArbitrary(), { maxLength: 10 }),
        bestPracticeWarnings: fc.array(warningArbitrary(), { maxLength: 10 }),
        explanation: fc.string({ maxLength: 500 }),
      });

    // Property 12: Analysis Response Parsing
    // **Validates: Requirements 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
    it('Property 12: Analysis Response Parsing - valid JSON response is parsed correctly', () => {
      fc.assert(
        fc.property(analysisResultArbitrary(), (expectedResult) => {
          const response = JSON.stringify(expectedResult);
          const result = client.parseResponse(response);

          // Verify all fields are preserved
          assert.strictEqual(result.diagram.nodes.length, expectedResult.diagram.nodes.length);
          assert.strictEqual(result.diagram.edges.length, expectedResult.diagram.edges.length);
          assert.strictEqual(result.dependencies.length, expectedResult.dependencies.length);
          assert.strictEqual(result.securityWarnings.length, expectedResult.securityWarnings.length);
          assert.strictEqual(result.logicWarnings.length, expectedResult.logicWarnings.length);
          assert.strictEqual(result.bestPracticeWarnings.length, expectedResult.bestPracticeWarnings.length);
          assert.strictEqual(result.explanation, expectedResult.explanation);
        }),
        { numRuns: 100 }
      );
    });

    // Property 12b: Analysis Response Parsing with Markdown
    // **Validates: Requirements 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
    it('Property 12b: Analysis Response Parsing - JSON in markdown code blocks is parsed correctly', () => {
      fc.assert(
        fc.property(analysisResultArbitrary(), (expectedResult) => {
          const jsonContent = JSON.stringify(expectedResult);
          const response = `Here is the analysis:\n\`\`\`json\n${jsonContent}\n\`\`\``;
          const result = client.parseResponse(response);

          // Verify all fields are preserved
          assert.strictEqual(result.diagram.nodes.length, expectedResult.diagram.nodes.length);
          assert.strictEqual(result.diagram.edges.length, expectedResult.diagram.edges.length);
          assert.strictEqual(result.dependencies.length, expectedResult.dependencies.length);
          assert.strictEqual(result.securityWarnings.length, expectedResult.securityWarnings.length);
          assert.strictEqual(result.logicWarnings.length, expectedResult.logicWarnings.length);
          assert.strictEqual(result.bestPracticeWarnings.length, expectedResult.bestPracticeWarnings.length);
        }),
        { numRuns: 100 }
      );
    });

    // Property 14: Error Handling
    // **Validates: Requirements 4.5**
    it('Property 14: Error Handling - parseResponse handles invalid input gracefully', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          // Should not throw, should return a valid AnalysisResult
          const result = client.parseResponse(input);

          // Verify result structure is always valid
          assert.ok(result.diagram);
          assert.ok(Array.isArray(result.diagram.nodes));
          assert.ok(Array.isArray(result.diagram.edges));
          assert.ok(Array.isArray(result.dependencies));
          assert.ok(Array.isArray(result.securityWarnings));
          assert.ok(Array.isArray(result.logicWarnings));
          assert.ok(Array.isArray(result.bestPracticeWarnings));
          assert.ok(typeof result.explanation === 'string');
        }),
        { numRuns: 100 }
      );
    });
  });
});
