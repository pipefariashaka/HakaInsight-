/**
 * Unit tests for StorageManager
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as fc from 'fast-check';
import { StorageManager } from './StorageManager';
import { DiagramData, DiagramNode, DiagramEdge } from '../models';

describe('StorageManager', () => {
  let tempDir: string;
  let storageManager: StorageManager;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), `test-storage-${Date.now()}`);
    storageManager = new StorageManager(tempDir);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('saveDiagram and loadDiagram', () => {
    it('should save and load diagram data', async () => {
      const testDiagram: DiagramData = {
        nodes: [
          {
            id: 'node1',
            label: 'Test Node',
            filePath: '/test/file.ts',
            type: 'file',
            description: 'Test description',
          },
        ],
        edges: [
          {
            id: 'edge1',
            source: 'node1',
            target: 'node2',
            label: 'imports',
            type: 'import',
          },
        ],
        metadata: {
          lastUpdated: new Date().toISOString(),
          filesAnalyzed: ['/test/file.ts'],
        },
      };

      // Save diagram
      await storageManager.saveDiagram(testDiagram);

      // Load diagram
      const loadedDiagram = await storageManager.loadDiagram();

      // Verify
      assert.deepStrictEqual(loadedDiagram, testDiagram);
    });

    it('should return null when no diagram exists', async () => {
      const loadedDiagram = await storageManager.loadDiagram();
      assert.strictEqual(loadedDiagram, null);
    });
  });

  describe('clearDiagram', () => {
    it('should clear stored diagram', async () => {
      const testDiagram: DiagramData = {
        nodes: [],
        edges: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          filesAnalyzed: [],
        },
      };

      // Save diagram
      await storageManager.saveDiagram(testDiagram);

      // Verify it exists
      let loadedDiagram = await storageManager.loadDiagram();
      assert.notStrictEqual(loadedDiagram, null);

      // Clear diagram
      await storageManager.clearDiagram();

      // Verify it's gone
      loadedDiagram = await storageManager.loadDiagram();
      assert.strictEqual(loadedDiagram, null);
    });
  });

  describe('Property-Based Tests', () => {
    // Generators for property-based testing
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

    const diagramDataArbitrary = (): fc.Arbitrary<DiagramData> =>
      fc.record({
        nodes: fc.array(diagramNodeArbitrary(), { maxLength: 10 }),
        edges: fc.array(diagramEdgeArbitrary(), { maxLength: 10 }),
        metadata: fc.record({
          lastUpdated: fc.date().map(d => d.toISOString()),
          filesAnalyzed: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 10 }),
        }),
      });

    // Property 15: Diagram Persistence
    // **Validates: Requirements 7.1, 7.2**
    it('Property 15: Diagram Persistence - saved diagram can be loaded after restart', async () => {
      await fc.assert(
        fc.asyncProperty(diagramDataArbitrary(), async (diagramData) => {
          // Save diagram
          await storageManager.saveDiagram(diagramData);

          // Simulate restart by creating a new StorageManager instance
          const newStorageManager = new StorageManager(tempDir);

          // Load diagram
          const loadedDiagram = await newStorageManager.loadDiagram();

          // Verify the loaded diagram matches the saved one
          assert.deepStrictEqual(loadedDiagram, diagramData);
        }),
        { numRuns: 100 }
      );
    });

    // Property 16: Diagram Clearing
    // **Validates: Requirements 7.3**
    it('Property 16: Diagram Clearing - cleared diagram returns null on load', async () => {
      await fc.assert(
        fc.asyncProperty(diagramDataArbitrary(), async (diagramData) => {
          // Save diagram
          await storageManager.saveDiagram(diagramData);

          // Clear diagram
          await storageManager.clearDiagram();

          // Load diagram
          const loadedDiagram = await storageManager.loadDiagram();

          // Verify it's null
          assert.strictEqual(loadedDiagram, null);
        }),
        { numRuns: 100 }
      );
    });

    // Property 17: Immediate Persistence
    // **Validates: Requirements 7.4**
    it('Property 17: Immediate Persistence - diagram is persisted immediately', async () => {
      await fc.assert(
        fc.asyncProperty(diagramDataArbitrary(), async (diagramData) => {
          const startTime = Date.now();

          // Save diagram
          await storageManager.saveDiagram(diagramData);

          const endTime = Date.now();
          const duration = endTime - startTime;

          // Verify persistence happened within 100ms
          assert.ok(duration < 100, `Persistence took ${duration}ms, expected < 100ms`);

          // Verify the diagram was actually saved
          const loadedDiagram = await storageManager.loadDiagram();
          assert.deepStrictEqual(loadedDiagram, diagramData);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('API Key Storage (with mock context)', () => {
    // Create a mock ExtensionContext for testing
    const createMockContext = () => {
      const storage = new Map<string, string>();
      return {
        secrets: {
          store: async (key: string, value: string) => {
            storage.set(key, value);
          },
          get: async (key: string) => {
            return storage.get(key);
          },
          delete: async (key: string) => {
            storage.delete(key);
          },
        },
      };
    };

    it('should save and retrieve API Key', async () => {
      const mockContext = createMockContext() as any;
      const testApiKey = 'test-api-key-12345';

      // Save API Key
      await storageManager.saveAPIKey(testApiKey, mockContext);

      // Retrieve API Key
      const retrievedKey = await storageManager.getAPIKey(mockContext);

      // Verify
      assert.strictEqual(retrievedKey, testApiKey);
    });

    it('should return undefined when API Key does not exist', async () => {
      const mockContext = createMockContext() as any;

      // Retrieve non-existent API Key
      const retrievedKey = await storageManager.getAPIKey(mockContext);

      // Verify
      assert.strictEqual(retrievedKey, undefined);
    });

    it('should clear API Key', async () => {
      const mockContext = createMockContext() as any;
      const testApiKey = 'test-api-key-12345';

      // Save API Key
      await storageManager.saveAPIKey(testApiKey, mockContext);

      // Clear API Key
      await storageManager.clearAPIKey(mockContext);

      // Retrieve API Key
      const retrievedKey = await storageManager.getAPIKey(mockContext);

      // Verify it's gone
      assert.strictEqual(retrievedKey, undefined);
    });

    // Property 7: API Key Secure Storage
    // **Validates: Requirements 3.2, 3.3**
    it('Property 7: API Key Secure Storage - saved API Key can be retrieved', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 500 }), async (apiKey) => {
          const mockContext = createMockContext() as any;

          // Save API Key
          await storageManager.saveAPIKey(apiKey, mockContext);

          // Retrieve API Key
          const retrievedKey = await storageManager.getAPIKey(mockContext);

          // Verify the retrieved key matches the saved one
          assert.strictEqual(retrievedKey, apiKey);
        }),
        { numRuns: 100 }
      );
    });

    // Property 8: API Key Lifecycle
    // **Validates: Requirements 3.4**
    it('Property 8: API Key Lifecycle - cleared API Key returns undefined', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 500 }), async (apiKey) => {
          const mockContext = createMockContext() as any;

          // Save API Key
          await storageManager.saveAPIKey(apiKey, mockContext);

          // Clear API Key
          await storageManager.clearAPIKey(mockContext);

          // Retrieve API Key
          const retrievedKey = await storageManager.getAPIKey(mockContext);

          // Verify it's undefined
          assert.strictEqual(retrievedKey, undefined);
        }),
        { numRuns: 100 }
      );
    });
  });
});
