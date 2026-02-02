/**
 * Haka Insight Extension
 * Main extension entry point
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { SidebarPanelManager } from './extension/SidebarPanelManager';
import { ContextMenuHandler } from './extension/ContextMenuHandler';
import { ArchitectureTreeDataProvider } from './extension/TreeDataProvider';
import { AnalysisCache } from './extension/AnalysisCache';
import { StorageManager } from './services/StorageManager';
import { GeminiAPIClient } from './services/GeminiAPIClient';
import { PersistenceManager } from './services/PersistenceManager';
import { SecurityAnalysisManager } from './services/SecurityAnalysisManager';
import { t, getCurrentLanguage } from './i18n/translations';

let sidebarPanelManager: SidebarPanelManager;
let contextMenuHandler: ContextMenuHandler;
let storageManager: StorageManager;
let geminiAPIClient: GeminiAPIClient;
let persistenceManager: PersistenceManager;
let analysisCache: AnalysisCache;
let securityAnalysisManager: SecurityAnalysisManager;
let fileVisibilityMap: Map<string, boolean> = new Map();

// Cache storage keys
const CACHE_KEY = 'codeArchitectAnalysisCache';
const SECURITY_CACHE_KEY = 'codeArchitectSecurityCache';
const CACHE_VERSION = '1.0';

// Cache data structures
interface CachedAnalysis {
	filePath: string;
	timestamp: number;
	analysisResult: any;
}

interface AnalysisCacheData {
	version: string;
	timestamp: number;
	analyses: [string, CachedAnalysis][];
	securityFindings?: {
		findings: any[];
		analyzedFiles: string[];
	};
}

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('Haka Insight extension is now active!');

	// Initialize services
	const storagePath = path.join(context.globalStorageUri.fsPath);
	storageManager = new StorageManager(storagePath);
	geminiAPIClient = new GeminiAPIClient();
	sidebarPanelManager = new SidebarPanelManager();
	contextMenuHandler = new ContextMenuHandler();
	persistenceManager = new PersistenceManager(storageManager);
	analysisCache = new AnalysisCache(context);
	securityAnalysisManager = new SecurityAnalysisManager();

	// Load cached analyses from previous sessions
	loadAnalysisCache(context).then(cachedData => {
		if (cachedData && cachedData.analyses.length > 0) {
			console.log(`Restoring ${cachedData.analyses.length} cached analyses...`);
			
			// Restore analyses to AnalysisCache
			cachedData.analyses.forEach(([filePath, cachedAnalysis]) => {
				analysisCache.saveAnalysis(filePath, cachedAnalysis.analysisResult);
			});

			// Restore security findings if available using the new restoreFromCache method
			if (cachedData.securityFindings) {
				securityAnalysisManager.restoreFromCache({
					findings: cachedData.securityFindings.findings,
					analyzedFiles: cachedData.securityFindings.analyzedFiles
				});
			}

			console.log('Cache restored successfully');
		}
	}).catch(error => {
		console.error('Error loading cache:', error);
	});

	// Register the tree data provider for the sidebar view
	const treeDataProvider = new ArchitectureTreeDataProvider();
	const treeView = vscode.window.createTreeView('codeArchitectAnalyzer', {
		treeDataProvider: treeDataProvider
	});
	context.subscriptions.push(treeView);

	// When the tree view becomes visible, automatically open the diagram panel
	let hasAutoOpened = false;
	treeView.onDidChangeVisibility(async (e) => {
		if (e.visible && !hasAutoOpened) {
			hasAutoOpened = true;
			// Small delay to ensure the view is fully loaded
			setTimeout(async () => {
				// Open the diagram panel
				sidebarPanelManager.createPanel(context, analysisCache);
				
				// Load and send selected model to webview
				const model = await storageManager.getModel(context);
				sidebarPanelManager.setSelectedModel(model);
				
				// Load and display the saved diagram automatically
				const allAnalyzedFiles = analysisCache.getAllAnalyzedFiles();
				if (allAnalyzedFiles.length > 0) {
					// Build diagram from cache with current visibility settings
					const comprehensiveDiagram = buildComprehensiveDiagram(analysisCache, null, fileVisibilityMap);
					
					// Get all analyses from cache
					const allAnalyses = new Map<string, any>();
					allAnalyzedFiles.forEach(file => {
						const analysis = analysisCache.getAnalysis(file.path);
						if (analysis) {
							allAnalyses.set(file.path, analysis);
						}
					});
					
					// Send diagram with all cached analyses
					sidebarPanelManager.updateDiagramWithCache(comprehensiveDiagram, allAnalyzedFiles, allAnalyses);
					
					// Update security summary from restored cache
					const securitySummary = securityAnalysisManager.getSummary();
					if (securitySummary.totalFindings > 0) {
						sidebarPanelManager.updateSecuritySummary(securitySummary);
					}
				}
				hasAutoOpened = false;
			}, 100);
		}
	});

	// Register the sidebar icon command
	const sidebarCommand = vscode.commands.registerCommand(
		'code-architect-hakalab.openSidebar',
		async () => {
			sidebarPanelManager.createPanel(context, analysisCache);
			
			// Load and send selected model to webview
			const model = await storageManager.getModel(context);
			sidebarPanelManager.setSelectedModel(model);
			
			// Load and display the saved diagram automatically
			const allAnalyzedFiles = analysisCache.getAllAnalyzedFiles();
			if (allAnalyzedFiles.length > 0) {
				// Build diagram from cache with current visibility settings
				const comprehensiveDiagram = buildComprehensiveDiagram(analysisCache, null, fileVisibilityMap);
				
				// Get all analyses from cache
				const allAnalyses = new Map<string, any>();
				allAnalyzedFiles.forEach(file => {
					const analysis = analysisCache.getAnalysis(file.path);
					if (analysis) {
						allAnalyses.set(file.path, analysis);
					}
				});
				
				// Send diagram with all cached analyses
				sidebarPanelManager.updateDiagramWithCache(comprehensiveDiagram, allAnalyzedFiles, allAnalyses);
				
				// Update security summary from restored cache
				const securitySummary = securityAnalysisManager.getSummary();
				if (securitySummary.totalFindings > 0) {
					sidebarPanelManager.updateSecuritySummary(securitySummary);
				}
			}
		}
	);
	context.subscriptions.push(sidebarCommand);

	// Register context menu
	contextMenuHandler.registerContextMenu(context);

	// Set up the analyze callback
	contextMenuHandler.setOnAnalyzeCallback(async (fileUri: vscode.Uri) => {
		await handleAnalyzeCommand(fileUri, context);
	});

	// Register the analyze architecture command (for command palette)
	const analyzeCommandPalette = vscode.commands.registerCommand(
		'code-architect-hakalab.analyzeArchitecture',
		async (fileUri?: vscode.Uri) => {
			// If no file URI provided, use the active editor's file
			let targetUri = fileUri;
			if (!targetUri && vscode.window.activeTextEditor) {
				targetUri = vscode.window.activeTextEditor.document.uri;
			}

			if (!targetUri) {
				vscode.window.showErrorMessage(await t('pleaseOpenFile', context));
				return;
			}

			await handleAnalyzeCommand(targetUri, context);
		}
	);
	context.subscriptions.push(analyzeCommandPalette);

	// Set up sidebar panel callbacks
	sidebarPanelManager.setOnSaveAPIKeyCallback(async (apiKey: string) => {
		await storageManager.saveAPIKey(apiKey, context);
	});

	sidebarPanelManager.setOnClearAPIKeyCallback(async () => {
		await storageManager.clearAPIKey(context);
	});

	sidebarPanelManager.setOnValidateAPIKeyCallback(async (apiKey: string) => {
		return await geminiAPIClient.validateAPIKey(apiKey);
	});

	sidebarPanelManager.setOnSaveModelCallback(async (model: string) => {
		await storageManager.saveModel(model as any, context);
	});

	sidebarPanelManager.setOnGenerateAIReportCallback(async (findings: any[]) => {
		const apiKey = await storageManager.getAPIKey(context);
		if (!apiKey) {
			throw new Error('API Key not configured');
		}
		const model = await storageManager.getModel(context);
		return await geminiAPIClient.generateSecurityReport(findings, apiKey, model as any);
	});

	sidebarPanelManager.setOnGetRecommendationCallback(async (finding: any) => {
		const apiKey = await storageManager.getAPIKey(context);
		if (!apiKey) {
			throw new Error('API Key not configured');
		}
		const model = await storageManager.getModel(context);
		return await geminiAPIClient.getRecommendation(finding, apiKey, model as any);
	});

	sidebarPanelManager.setOnGenerateHTMLReportCallback(async () => {
		const summary = securityAnalysisManager.getSummary();
		if (summary.totalFindings === 0) {
			vscode.window.showWarningMessage('No findings to report. Analyze some files first.');
			return;
		}

		// Generate HTML report
		const html = await generateHTMLReport(summary, context);
		
		// Save to file
		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file('security-report.html'),
			filters: {
				'HTML': ['html']
			}
		});

		if (uri) {
			await vscode.workspace.fs.writeFile(uri, Buffer.from(html, 'utf8'));
			vscode.window.showInformationMessage('Report generated successfully!');
			
			// Open in browser
			await vscode.env.openExternal(uri);
		}
	});

	sidebarPanelManager.setOnNavigateToDependencyCallback(async (filePath: string) => {
		await navigateToFile(filePath, context);
	});

	sidebarPanelManager.setOnAnalyzeFileCallback(async (filePath: string) => {
		const uri = vscode.Uri.file(filePath);
		await handleAnalyzeCommand(uri, context);
	});

	sidebarPanelManager.setOnUpdateAnalysisCallback(async (filePath: string) => {
		const uri = vscode.Uri.file(filePath);
		await handleAnalyzeCommand(uri, context);
	});

	sidebarPanelManager.setOnToggleFileVisibilityCallback(async (filePath: string, visible: boolean) => {
		fileVisibilityMap.set(filePath, visible);
		// Rebuild diagram with current visibility settings
		const allAnalyzedFiles = analysisCache.getAllAnalyzedFiles();
		const comprehensiveDiagram = buildComprehensiveDiagram(analysisCache, null, fileVisibilityMap);
		
		// Get all analyses from cache
		const allAnalyses = new Map<string, any>();
		allAnalyzedFiles.forEach(file => {
			const analysis = analysisCache.getAnalysis(file.path);
			if (analysis) {
				allAnalyses.set(file.path, analysis);
			}
		});
		
		// Send diagram with all cached analyses
		sidebarPanelManager.updateDiagramWithCache(comprehensiveDiagram, allAnalyzedFiles, allAnalyses);
	});

	sidebarPanelManager.setOnGetCacheStatsCallback(async () => {
		// Check if workspace is open
		if (!vscode.workspace.workspaceFolders) {
			sidebarPanelManager.sendCacheStats({
				fileCount: 0,
				tokensSaved: 0,
				sizeKB: 0,
				lastUpdate: null
			});
			return;
		}

		const allAnalyzedFiles = analysisCache.getAllAnalyzedFiles();
		const cacheData = await context.workspaceState.get<any>(CACHE_KEY);
		
		// Calculate stats
		const fileCount = allAnalyzedFiles.length;
		const tokensSaved = fileCount * 1500; // Estimate 1500 tokens per analysis
		const sizeKB = cacheData ? Math.round(JSON.stringify(cacheData).length / 1024) : 0;
		const lastUpdate = cacheData?.timestamp || null;
		
		// Send stats to webview
		sidebarPanelManager.sendCacheStats({
			fileCount,
			tokensSaved,
			sizeKB,
			lastUpdate
		});
	});

	sidebarPanelManager.setOnDeepenAnalysisCallback(async (nodeId: string, nodeLabel: string, nodePath?: string) => {
		try {
			console.log('[deepenAnalysis] nodeId:', nodeId, 'nodeLabel:', nodeLabel, 'nodePath:', nodePath);
			
			// Get API key
			const apiKey = await storageManager.getAPIKey(context);
			if (!apiKey) {
				vscode.window.showErrorMessage(await t('apiKeyNotConfigured', context));
				return;
			}

			// Helper function to normalize file names (same logic as normalizeNodeId)
			const normalizeFileName = (filename: string): string => {
				// Remove common suffixes like _java, _js, etc.
				let normalized = filename.replace(/_(java|js|ts|tsx|jsx|py|cpp|c|h|cs|go|rb|php|swift)$/i, '');
				// Remove common file extensions
				normalized = normalized.replace(/\.(java|js|ts|tsx|jsx|py|cpp|c|h|cs|go|rb|php|swift)$/i, '');
				// Lowercase and sanitize
				normalized = normalized
					.toLowerCase()
					.replace(/[^a-z0-9]/g, '_')
					.replace(/_+/g, '_')
					.replace(/^_|_$/g, '');
				return normalized;
			};

			// Get the file from analyzed files
			const allAnalyzedFiles = analysisCache.getAllAnalyzedFiles();
			console.log('[deepenAnalysis] All analyzed files:', allAnalyzedFiles.map(f => ({ name: f.name, path: f.path })));
			
			let file: { path: string; name: string } | undefined;

			// First, try to use nodePath if provided
			if (nodePath && nodePath.trim().length > 0) {
				console.log('[deepenAnalysis] Using nodePath:', nodePath);
				file = allAnalyzedFiles.find(f => f.path === nodePath);
				if (file) {
					console.log('[deepenAnalysis] Found file by path:', file.path);
				}
			}

			// If not found by path, try to match by normalized name
			if (!file) {
				console.log('[deepenAnalysis] Trying to find by normalized name...');
				// Normalize the nodeId for comparison
				const normalizedNodeId = nodeId.toLowerCase();
				
				// Try to find the file by matching the normalized nodeId with normalized file names
				file = allAnalyzedFiles.find(f => {
					// Extract just the filename from the path (handle both / and \ separators)
					const fileName = f.path.split(/[/\\]/).pop() || f.path;
					const normalizedFileName = normalizeFileName(fileName);
					
					console.log('[deepenAnalysis] Comparing normalized:', normalizedFileName, 'with nodeId:', normalizedNodeId);
					
					return normalizedFileName === normalizedNodeId;
				});
			}

			if (!file) {
				console.error('[deepenAnalysis] File not found. nodeId:', nodeId, 'nodeLabel:', nodeLabel, 'nodePath:', nodePath);
				console.error('[deepenAnalysis] Available normalized names:', allAnalyzedFiles.map(f => {
					const fileName = f.path.split(/[/\\]/).pop() || f.path;
					return normalizeFileName(fileName);
				}));
				vscode.window.showErrorMessage('File not found for deepening analysis');
				return;
			}

			console.log('[deepenAnalysis] Found file:', file.path);

			// Read file content
			const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(file.path));
			let code = new TextDecoder().decode(fileContent);

			// Optimize code for analysis - limit size and remove unnecessary parts
			const MAX_CODE_LENGTH = 3000; // characters
			if (code.length > MAX_CODE_LENGTH) {
				console.log('[deepenAnalysis] Code too long, optimizing...', code.length, 'chars');
				
				// Try to extract key parts: class/function signatures, important logic
				const lines = code.split('\n');
				const optimizedLines: string[] = [];
				let charCount = 0;
				let inMultilineComment = false;
				
				for (const line of lines) {
					// Skip empty lines and single-line comments at the start
					const trimmed = line.trim();
					
					// Track multiline comments
					if (trimmed.includes('/*')) {
						inMultilineComment = true;
					}
					if (trimmed.includes('*/')) {
						inMultilineComment = false;
						continue;
					}
					if (inMultilineComment) {
						continue;
					}
					
					// Skip single-line comments unless they're important (TODO, FIXME, etc)
					if (trimmed.startsWith('//') && !trimmed.includes('TODO') && !trimmed.includes('FIXME') && !trimmed.includes('IMPORTANT')) {
						continue;
					}
					
					// Keep important lines: class/function declarations, imports, key logic
					if (
						trimmed.startsWith('import ') ||
						trimmed.startsWith('export ') ||
						trimmed.includes('class ') ||
						trimmed.includes('function ') ||
						trimmed.includes('const ') ||
						trimmed.includes('let ') ||
						trimmed.includes('var ') ||
						trimmed.includes('async ') ||
						trimmed.includes('public ') ||
						trimmed.includes('private ') ||
						trimmed.includes('protected ') ||
						trimmed.includes('static ') ||
						trimmed.includes('return ') ||
						trimmed.includes('if ') ||
						trimmed.includes('for ') ||
						trimmed.includes('while ') ||
						trimmed.length > 0
					) {
						if (charCount + line.length < MAX_CODE_LENGTH) {
							optimizedLines.push(line);
							charCount += line.length + 1;
						} else {
							optimizedLines.push('// ... (código adicional omitido para optimización)');
							break;
						}
					}
				}
				
				code = optimizedLines.join('\n');
				console.log('[deepenAnalysis] Optimized to:', code.length, 'chars');
			}

			// Get current language
			const currentLanguage = await getCurrentLanguage(context);

			// Get model
			const model = await storageManager.getModel(context);

			console.log('[deepenAnalysis] Calling Gemini API with code length:', code.length, 'model:', model, 'language:', currentLanguage);

			// Call deepenAnalysis method
			const deepenedExplanation = await geminiAPIClient.deepenAnalysis(code, apiKey, model as any, currentLanguage);

			console.log('[deepenAnalysis] Received explanation, length:', deepenedExplanation.length);

			// Update the cache with the deepened explanation
			const cachedAnalysis = analysisCache.getAnalysis(file.path);
			if (cachedAnalysis) {
				cachedAnalysis.explanation = deepenedExplanation;
				analysisCache.saveAnalysis(file.path, cachedAnalysis);
				console.log('[deepenAnalysis] Updated cache with deepened explanation');
				
				// Save cache to disk
				await saveAnalysisCache(context);
			}

			// Send back to webview
			sidebarPanelManager.sendDeepenedExplanation(nodeId, deepenedExplanation);

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error('[deepenAnalysis] Error:', error);
			vscode.window.showErrorMessage(`Failed to deepen analysis: ${errorMessage}`);
			sidebarPanelManager.sendDeepenedExplanation(nodeId, `Error: ${errorMessage}`);
		}
	});

	// Register the clear diagram command
	const clearCommand = vscode.commands.registerCommand(
		'code-architect-hakalab.clearDiagram',
		async () => {
			try {
				await storageManager.clearDiagram();
				analysisCache.clearAll();
				securityAnalysisManager.clear();
				await clearAnalysisCache(context);
				sidebarPanelManager.createPanel(context, analysisCache);
				sidebarPanelManager.switchTab('diagram');
				sidebarPanelManager.showWarning(await t('diagramCleared', context));
				vscode.window.showInformationMessage(await t('diagramCleared', context));
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				vscode.window.showErrorMessage(`${await t('failedToClearDiagram', context)}: ${errorMessage}`);
			}
		}
	);
	context.subscriptions.push(clearCommand);

	// Register the clear cache command
	const clearCacheCommand = vscode.commands.registerCommand(
		'code-architect-hakalab.clearCache',
		async () => {
			try {
				await clearAnalysisCache(context);
				analysisCache.clearAll();
				securityAnalysisManager.clear();
				sidebarPanelManager.createPanel(context, analysisCache);
				sidebarPanelManager.switchTab('diagram');
				vscode.window.showInformationMessage('Analysis cache cleared successfully');
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				vscode.window.showErrorMessage(`Failed to clear cache: ${errorMessage}`);
			}
		}
	);
	context.subscriptions.push(clearCacheCommand);
}

/**
 * Handle the analyze architecture command
 */
async function handleAnalyzeCommand(fileUri: vscode.Uri, context: vscode.ExtensionContext): Promise<void> {
	try {
		// Check if API Key is configured
		const apiKey = await storageManager.getAPIKey(context);
		if (!apiKey) {
			sidebarPanelManager.createPanel(context);
			sidebarPanelManager.showWarning(await t('apiKeyNotConfigured', context));
			sidebarPanelManager.switchTab('settings');
			return;
		}

		// Get selected model
		const model = await storageManager.getModel(context);

		// Create panel and show loading indicator
		sidebarPanelManager.createPanel(context);
		sidebarPanelManager.switchTab('diagram');
		
		// Send selected model to webview
		sidebarPanelManager.setSelectedModel(model);

		// Show loading message
		vscode.window.showInformationMessage(await t('analyzingFile', context));

		// Read file content
		const fileContent = await vscode.workspace.fs.readFile(fileUri);
		const code = new TextDecoder().decode(fileContent);

		// Get current language for analysis
		const currentLanguage = await getCurrentLanguage(context);
		console.log('[handleAnalyzeCommand] Current language for analysis:', currentLanguage);

		// Analyze code with selected model and language
		const analysisResult = await geminiAPIClient.analyzeCode(code, apiKey, model as any, currentLanguage);

		// Resolve relative paths to absolute paths
		const projectRoot = getProjectRoot();
		if (projectRoot && analysisResult.diagram.nodes) {
			for (const node of analysisResult.diagram.nodes) {
				if (node.path) {
					// First try to resolve as relative path
					let resolvedPath = node.path;
					if (!path.isAbsolute(node.path)) {
						resolvedPath = path.join(projectRoot, node.path);
					}

					// Check if file exists
					try {
						await vscode.workspace.fs.stat(vscode.Uri.file(resolvedPath));
						node.path = resolvedPath;
					} catch {
						// File not found, try to search for it by filename
						const fileName = path.basename(node.path);
						const foundPath = await findFileInProject(fileName);
						if (foundPath) {
							node.path = foundPath;
						} else {
							// Keep the original path if not found
							node.path = resolvedPath;
						}
					}
				}
			}
		}

		// Save to cache
		analysisCache.saveAnalysis(fileUri.fsPath, analysisResult);

		// Add findings to security analysis manager
		const fileName = path.basename(fileUri.fsPath);
		securityAnalysisManager.addFindings(fileName, analysisResult);

		// Build a comprehensive diagram from all cached analyses
		const allAnalyzedFiles = analysisCache.getAllAnalyzedFiles();
		
		// Initialize visibility for new file
		if (!fileVisibilityMap.has(fileUri.fsPath)) {
			fileVisibilityMap.set(fileUri.fsPath, true);
		}
		
		const comprehensiveDiagram = buildComprehensiveDiagram(analysisCache, analysisResult, fileVisibilityMap);

		// Get security summary
		const securitySummary = securityAnalysisManager.getSummary();

		// Schedule persistence with debouncing
		await persistenceManager.scheduleSave(comprehensiveDiagram);

		// Update panel with complete analysis and file list
		sidebarPanelManager.updateDiagramWithAnalysis(comprehensiveDiagram, analysisResult, allAnalyzedFiles);
		
		// Update security summary
		sidebarPanelManager.updateSecuritySummary(securitySummary);

		// Save analysis cache to persistent storage
		await saveAnalysisCache(context);

		vscode.window.showInformationMessage(await t('analysisComplete', context));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		vscode.window.showErrorMessage(`${await t('analysisFailed', context)}: ${errorMessage}`);
		sidebarPanelManager.createPanel(context);
		sidebarPanelManager.showWarning(`${await t('error', context)}: ${errorMessage}`);
	}
}

/**
 * Navigate to a file in the editor
 */
/**
 * Navigate to a file in the editor
 */
async function navigateToFile(filePath: string, context: vscode.ExtensionContext): Promise<void> {
	try {
		const uri = vscode.Uri.file(filePath);
		const document = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(document);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`${await t('failedToOpenFile', context)}: ${errorMessage}`);
	}
}

/**
 * Build a comprehensive diagram from all cached analyses
 */
function buildComprehensiveDiagram(cache: AnalysisCache, currentAnalysis: any, visibilityMap?: Map<string, boolean>): any {
	const nodes: any[] = [];
	const edges: any[] = [];
	const nodeMap = new Map<string, any>();

	// Helper function to normalize node IDs consistently
	// This ensures that "Principal", "Principal.java", "principal.java", "principal_java" all map to the same ID
	const normalizeNodeId = (label: string): string => {
		// First, remove common suffixes like _java, _js, etc. (from edge IDs)
		let normalized = label.replace(/_(java|js|ts|tsx|jsx|py|cpp|c|h|cs|go|rb|php|swift)$/i, '');
		// Then remove common file extensions like .java, .js, etc. (from node labels)
		normalized = normalized.replace(/\.(java|js|ts|tsx|jsx|py|cpp|c|h|cs|go|rb|php|swift)$/i, '');
		// Lowercase and sanitize
		normalized = normalized
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '_')
			.replace(/_+/g, '_')
			.replace(/^_|_$/g, '');
		return normalized;
	};

	// Get all analyzed files
	const analyzedFiles = cache.getAllAnalyzedFiles();
	
	// Create a set of analyzed file paths for quick lookup
	const analyzedFilePaths = new Set(analyzedFiles.map(f => f.path));

	// Filter files based on visibility map (default to visible if not in map)
	const visibleFiles = analyzedFiles.filter(file => {
		if (!visibilityMap) {
			return true;
		}
		return visibilityMap.get(file.path) !== false;
	});

	// First pass: add all nodes from visible analyses
	visibleFiles.forEach(file => {
		const analysis = cache.getAnalysis(file.path);
		if (analysis && analysis.diagram) {
			analysis.diagram.nodes.forEach((node: any) => {
				const nodeKey = normalizeNodeId(node.label);
				console.log('[buildComprehensiveDiagram] Processing node:', node.label, '-> normalized ID:', nodeKey);
				if (!nodeMap.has(nodeKey)) {
					const newNode = { ...node };
					// Use normalized ID for consistency
					newNode.id = nodeKey;
					// Mark as current only if it's from the current analysis
					newNode.isCurrentFile = analysis === currentAnalysis && node.isCurrentFile;
					// Mark as analyzed if this node's path is in the analyzed files list
					// or if it was already marked as analyzed in the original node
					newNode.isAnalyzed = node.isAnalyzed || (node.path && analyzedFilePaths.has(node.path));
					nodeMap.set(nodeKey, newNode);
					nodes.push(newNode);
					console.log('[buildComprehensiveDiagram] Node added to map with ID:', nodeKey);
				} else {
					// Update existing node - merge information
					const existingNode = nodeMap.get(nodeKey);
					if (existingNode) {
						// Update isCurrentFile if this is the current analysis
						if (analysis === currentAnalysis && node.isCurrentFile) {
							existingNode.isCurrentFile = true;
						}
						// Update isAnalyzed if this node is analyzed
						if (node.isAnalyzed || (node.path && analyzedFilePaths.has(node.path))) {
							existingNode.isAnalyzed = true;
						}
						// Update path if the new node has a path and existing doesn't
						if (node.path && !existingNode.path) {
							existingNode.path = node.path;
						}
						// Prefer label with extension if available
						if (node.label.includes('.') && !existingNode.label.includes('.')) {
							existingNode.label = node.label;
						}
					}
				}
			});
		}
	});

	// Second pass: add edges only between visible nodes
	const edgeSet = new Set<string>();
	visibleFiles.forEach(file => {
		const analysis = cache.getAnalysis(file.path);
		if (analysis && analysis.diagram) {
			console.log('[buildComprehensiveDiagram] Processing file:', file.name);
			console.log('[buildComprehensiveDiagram] Diagram has edges:', analysis.diagram.edges ? analysis.diagram.edges.length : 0);
			console.log('[buildComprehensiveDiagram] Edges:', JSON.stringify(analysis.diagram.edges));
			
			if (analysis.diagram.edges && Array.isArray(analysis.diagram.edges)) {
				analysis.diagram.edges.forEach((edge: any) => {
					// IMPORTANT: Normalize BOTH the edge source/target AND use them to find nodes
					// The edge might come as "init_java" but the node is "Init.java"
					// We need to normalize both to match
					const normalizedSource = normalizeNodeId(edge.source);
					const normalizedTarget = normalizeNodeId(edge.target);
					
					// Find nodes by normalized ID
					const sourceNode = nodeMap.get(normalizedSource);
					const targetNode = nodeMap.get(normalizedTarget);
					
					console.log('[buildComprehensiveDiagram] Edge:', edge.source, '->', edge.target);
					console.log('[buildComprehensiveDiagram] Normalized:', normalizedSource, '->', normalizedTarget);
					console.log('[buildComprehensiveDiagram] Source node found:', !!sourceNode, sourceNode?.label);
					console.log('[buildComprehensiveDiagram] Target node found:', !!targetNode, targetNode?.label);
					
					if (sourceNode && targetNode) {
						const normalizedEdge = {
							...edge,
							id: `${sourceNode.id}->${targetNode.id}`,
							source: sourceNode.id,
							target: targetNode.id,
						};
						const edgeKey = `${sourceNode.id}->${targetNode.id}`;
						if (!edgeSet.has(edgeKey)) {
							edges.push(normalizedEdge);
							edgeSet.add(edgeKey);
							console.log('[buildComprehensiveDiagram] Edge added:', edgeKey);
						}
					} else {
						console.log('[buildComprehensiveDiagram] Edge NOT added - nodes not found');
						console.log('[buildComprehensiveDiagram] Available node IDs:', Array.from(nodeMap.keys()));
					}
				});
			}
		}
	});

	console.log('[buildComprehensiveDiagram] Final diagram - nodes:', nodes.length, 'edges:', edges.length);
	console.log('[buildComprehensiveDiagram] Final edges:', JSON.stringify(edges));

	return {
		nodes,
		edges,
		metadata: {
			lastUpdated: new Date().toISOString(),
			filesAnalyzed: visibleFiles.map(f => f.name),
		},
	};
}

/**
 * Get the project root directory
 */
function getProjectRoot(): string | undefined {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders && workspaceFolders.length > 0) {
		return workspaceFolders[0].uri.fsPath;
	}
	return undefined;
}

/**
 * Find a file in the project by name
 */
async function findFileInProject(fileName: string): Promise<string | undefined> {
	const projectRoot = getProjectRoot();
	if (!projectRoot) {
		return undefined;
	}

	try {
		// Search for files matching the name
		const files = await vscode.workspace.findFiles(`**/${fileName}`, '**/node_modules/**');
		if (files.length > 0) {
			return files[0].fsPath;
		}
	} catch (error) {
		console.error('Error searching for file:', error);
	}

	return undefined;
}

/**
 * Generate HTML report from security summary
 */
async function generateHTMLReport(summary: any, context: vscode.ExtensionContext): Promise<string> {
	const currentDate = new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	// Group findings by severity
	const highFindings = summary.findings.filter((f: any) => f.severity === 'high');
	const mediumFindings = summary.findings.filter((f: any) => f.severity === 'medium');
	const lowFindings = summary.findings.filter((f: any) => f.severity === 'low');

	// Risk level colors
	const riskColors: Record<string, string> = {
		critical: '#d32f2f',
		high: '#f57c00',
		medium: '#fbc02d',
		low: '#388e3c'
	};

	const riskColor = riskColors[summary.riskLevel] || '#757575';

	// Generate findings HTML
	const generateFindingsHTML = (findings: any[], severity: string) => {
		if (findings.length === 0) {
			return `<p style="color: #888; font-style: italic;">No ${severity} severity findings</p>`;
		}
		return findings.map(f => `
			<div class="finding-card ${severity}">
				<div class="finding-header">
					<span class="finding-type">${f.type === 'security' ? '🔒 Security' : f.type === 'logic' ? '⚙️ Logic' : '✨ Best Practice'}</span>
					<span class="finding-file">${f.file}${f.line ? `:${f.line}` : ''}</span>
				</div>
				<p class="finding-message">${f.message}</p>
			</div>
		`).join('');
	};

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Security Analysis Report</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			padding: 20px;
		}

		.container {
			max-width: 1200px;
			margin: 0 auto;
			background: white;
			border-radius: 12px;
			box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
			overflow: hidden;
		}

		header {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			padding: 40px;
			text-align: center;
		}

		header h1 {
			font-size: 32px;
			margin-bottom: 10px;
			font-weight: 600;
		}

		header p {
			font-size: 14px;
			opacity: 0.9;
		}

		.content {
			padding: 40px;
		}

		.summary {
			background: #f8f9fa;
			border-radius: 8px;
			padding: 30px;
			margin-bottom: 40px;
		}

		.summary h2 {
			font-size: 24px;
			margin-bottom: 20px;
			color: #333;
		}

		.metrics {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 20px;
			margin-bottom: 20px;
		}

		.metric {
			background: white;
			padding: 20px;
			border-radius: 8px;
			text-align: center;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}

		.metric-number {
			font-size: 36px;
			font-weight: bold;
			color: #667eea;
			display: block;
			margin-bottom: 5px;
		}

		.metric-label {
			font-size: 14px;
			color: #666;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.risk-badge {
			display: inline-block;
			padding: 8px 20px;
			border-radius: 20px;
			font-weight: 600;
			font-size: 14px;
			text-transform: uppercase;
			letter-spacing: 1px;
			background: ${riskColor};
			color: white;
		}

		.section {
			margin-bottom: 40px;
		}

		.section h2 {
			font-size: 22px;
			margin-bottom: 20px;
			color: #333;
			border-bottom: 2px solid #667eea;
			padding-bottom: 10px;
		}

		.files-list {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
		}

		.file-badge {
			background: #e3f2fd;
			color: #1976d2;
			padding: 6px 12px;
			border-radius: 4px;
			font-size: 13px;
			font-family: 'Courier New', monospace;
		}

		.findings-section {
			margin-bottom: 30px;
		}

		.findings-section h3 {
			font-size: 18px;
			margin-bottom: 15px;
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.severity-count {
			background: #f5f5f5;
			padding: 4px 12px;
			border-radius: 12px;
			font-size: 14px;
			font-weight: normal;
		}

		.finding-card {
			background: white;
			border-left: 4px solid #ccc;
			padding: 15px;
			margin-bottom: 15px;
			border-radius: 4px;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		}

		.finding-card.high {
			border-left-color: #d32f2f;
			background: #ffebee;
		}

		.finding-card.medium {
			border-left-color: #f57c00;
			background: #fff3e0;
		}

		.finding-card.low {
			border-left-color: #fbc02d;
			background: #fffde7;
		}

		.finding-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 10px;
			flex-wrap: wrap;
			gap: 10px;
		}

		.finding-type {
			font-weight: 600;
			font-size: 13px;
		}

		.finding-file {
			font-family: 'Courier New', monospace;
			font-size: 12px;
			color: #666;
		}

		.finding-message {
			font-size: 14px;
			color: #333;
			line-height: 1.5;
		}

		.chart-container {
			background: #f8f9fa;
			padding: 30px;
			border-radius: 8px;
			text-align: center;
		}

		.chart-container h2 {
			margin-bottom: 20px;
		}

		footer {
			background: #f8f9fa;
			padding: 20px;
			text-align: center;
			color: #666;
			font-size: 14px;
		}

		@media print {
			body {
				background: white;
				padding: 0;
			}

			.container {
				box-shadow: none;
			}
		}
	</style>
</head>
<body>
	<div class="container">
		<header>
			<h1>🔒 Code Architecture Security Analysis</h1>
			<p>Generated on ${currentDate}</p>
		</header>

		<div class="content">
			<div class="summary">
				<h2>Executive Summary</h2>
				<div class="metrics">
					<div class="metric">
						<span class="metric-number">${summary.totalFindings}</span>
						<span class="metric-label">Total Findings</span>
					</div>
					<div class="metric">
						<span class="metric-number">${summary.highSeverity}</span>
						<span class="metric-label">High Severity</span>
					</div>
					<div class="metric">
						<span class="metric-number">${summary.mediumSeverity}</span>
						<span class="metric-label">Medium Severity</span>
					</div>
					<div class="metric">
						<span class="metric-number">${summary.lowSeverity}</span>
						<span class="metric-label">Low Severity</span>
					</div>
				</div>
				<div style="text-align: center; margin-top: 20px;">
					<span style="font-size: 14px; color: #666; margin-right: 10px;">Overall Risk Level:</span>
					<span class="risk-badge">${summary.riskLevel}</span>
				</div>
			</div>

			<div class="section">
				<h2>📁 Analyzed Files (${summary.analyzedFiles.length})</h2>
				<div class="files-list">
					${summary.analyzedFiles.map((file: string) => `<span class="file-badge">${file}</span>`).join('')}
				</div>
			</div>

			<div class="section">
				<h2>🔍 Findings by Severity</h2>

				<div class="findings-section">
					<h3>
						🔴 High Severity
						<span class="severity-count">${highFindings.length}</span>
					</h3>
					${generateFindingsHTML(highFindings, 'high')}
				</div>

				<div class="findings-section">
					<h3>
						🟠 Medium Severity
						<span class="severity-count">${mediumFindings.length}</span>
					</h3>
					${generateFindingsHTML(mediumFindings, 'medium')}
				</div>

				<div class="findings-section">
					<h3>
						🟡 Low Severity
						<span class="severity-count">${lowFindings.length}</span>
					</h3>
					${generateFindingsHTML(lowFindings, 'low')}
				</div>
			</div>

			<div class="chart-container">
				<h2>📊 Findings Distribution</h2>
				<canvas id="findingsChart" width="400" height="200"></canvas>
			</div>
		</div>

		<footer>
			<p>Generated by <strong>Haka Insight</strong> - VS Code Extension</p>
			<p style="margin-top: 5px; font-size: 12px;">This report provides an overview of security and quality findings in your codebase.</p>
		</footer>
	</div>

	<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
	<script>
		// Create pie chart
		const ctx = document.getElementById('findingsChart').getContext('2d');
		new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: ['High Severity', 'Medium Severity', 'Low Severity'],
				datasets: [{
					data: [${summary.highSeverity}, ${summary.mediumSeverity}, ${summary.lowSeverity}],
					backgroundColor: ['#d32f2f', '#f57c00', '#fbc02d'],
					borderWidth: 2,
					borderColor: '#fff'
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							padding: 20,
							font: {
								size: 14
							}
						}
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								const label = context.label || '';
								const value = context.parsed || 0;
								const total = ${summary.totalFindings};
								const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
								return label + ': ' + value + ' (' + percentage + '%)';
							}
						}
					}
				}
			}
		});
	</script>
</body>
</html>`;
}

/**
 * Save analysis cache to JSON file (persistent storage)
 */
async function saveAnalysisCache(context: vscode.ExtensionContext): Promise<void> {
	try {
		// Check if workspace is open
		if (!vscode.workspace.workspaceFolders) {
			console.log('No workspace folder open, skipping cache save');
			return;
		}

		// Get all analyses from cache
		const allAnalyzedFiles = analysisCache.getAllAnalyzedFiles();
		const analyses: [string, CachedAnalysis][] = [];
		
		allAnalyzedFiles.forEach(file => {
			const analysis = analysisCache.getAnalysis(file.path);
			if (analysis) {
				analyses.push([
					file.path,
					{
						filePath: file.path,
						timestamp: Date.now(),
						analysisResult: analysis
					}
				]);
			}
		});

		// Get security findings using new methods
		const securityFindings = {
			findings: securityAnalysisManager.getAllFindings(),
			analyzedFiles: securityAnalysisManager.getAnalyzedFiles()
		};

		// Create cache data
		const cacheData: AnalysisCacheData = {
			version: CACHE_VERSION,
			timestamp: Date.now(),
			analyses: analyses,
			securityFindings: securityFindings
		};

		// Save to JSON file in workspace storage directory
		const workspaceFolder = vscode.workspace.workspaceFolders[0];
		const workspaceHash = Buffer.from(workspaceFolder.uri.fsPath).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
		const cacheFileName = `cache_${workspaceHash}.json`;
		const cacheFilePath = path.join(context.globalStorageUri.fsPath, cacheFileName);
		
		// Ensure directory exists
		try {
			await vscode.workspace.fs.createDirectory(context.globalStorageUri);
		} catch (error) {
			// Directory might already exist, ignore error
		}

		// Write to file
		const cacheJson = JSON.stringify(cacheData, null, 2);
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(cacheFilePath),
			Buffer.from(cacheJson, 'utf8')
		);
		
		console.log(`Analysis cache saved to file: ${cacheFilePath} (${analyses.length} files)`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Failed to save analysis cache:', error);
		
		// Check if it's a quota exceeded error
		if (errorMessage.includes('quota') || errorMessage.includes('storage')) {
			const selection = await vscode.window.showWarningMessage(
				'Cache storage limit reached. Would you like to clear the cache?',
				'Clear Cache', 'Cancel'
			);
			
			if (selection === 'Clear Cache') {
				await clearAnalysisCache(context);
			}
		}
	}
}

/**
 * Load analysis cache from JSON file (persistent storage)
 */
async function loadAnalysisCache(context: vscode.ExtensionContext): Promise<AnalysisCacheData | null> {
	try {
		// Check if workspace is open
		if (!vscode.workspace.workspaceFolders) {
			console.log('No workspace folder open, cache disabled');
			return null;
		}

		// Generate cache file name based on workspace path
		const workspaceFolder = vscode.workspace.workspaceFolders[0];
		const workspaceHash = Buffer.from(workspaceFolder.uri.fsPath).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
		const cacheFileName = `cache_${workspaceHash}.json`;
		const cacheFilePath = path.join(context.globalStorageUri.fsPath, cacheFileName);

		// Check if cache file exists
		try {
			const cacheFileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(cacheFilePath));
			const cacheJson = new TextDecoder().decode(cacheFileContent);
			const cached = JSON.parse(cacheJson) as AnalysisCacheData;

			// Validate cache structure
			if (!cached.version || !Array.isArray(cached.analyses)) {
				console.warn('Invalid cache structure, ignoring');
				return null;
			}

			// Check version compatibility
			if (cached.version !== CACHE_VERSION) {
				console.warn(`Cache version mismatch (${cached.version} vs ${CACHE_VERSION}), ignoring`);
				return null;
			}

			console.log(`Analysis cache loaded from file: ${cacheFilePath} (${cached.analyses.length} files)`);
			return cached;
		} catch (error) {
			// File doesn't exist or can't be read
			console.log('No analysis cache file found for this workspace');
			return null;
		}
	} catch (error) {
		console.error('Failed to load analysis cache:', error);
		return null;
	}
}

/**
 * Clear analysis cache from JSON file
 */
async function clearAnalysisCache(context: vscode.ExtensionContext): Promise<void> {
	try {
		// Check if workspace is open
		if (!vscode.workspace.workspaceFolders) {
			console.log('No workspace folder open');
			return;
		}

		// Generate cache file name based on workspace path
		const workspaceFolder = vscode.workspace.workspaceFolders[0];
		const workspaceHash = Buffer.from(workspaceFolder.uri.fsPath).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
		const cacheFileName = `cache_${workspaceHash}.json`;
		const cacheFilePath = path.join(context.globalStorageUri.fsPath, cacheFileName);

		// Delete cache file if it exists
		try {
			await vscode.workspace.fs.delete(vscode.Uri.file(cacheFilePath));
			console.log(`Analysis cache file deleted: ${cacheFilePath}`);
		} catch (error) {
			// File might not exist, ignore error
			console.log('No cache file to delete');
		}

		// Also clear old workspace state (for migration)
		await context.workspaceState.update(CACHE_KEY, undefined);
		await context.workspaceState.update(SECURITY_CACHE_KEY, undefined);
		
		console.log('Analysis cache cleared for this workspace');
	} catch (error) {
		console.error('Failed to clear analysis cache:', error);
	}
}

/**
 * Extension deactivation
 */
export function deactivate() {
	// Flush any pending saves
	if (persistenceManager) {
		persistenceManager.flush().catch(error => {
			console.error('Failed to flush pending saves:', error);
		});
	}
}
