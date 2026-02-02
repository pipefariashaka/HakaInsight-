/**
 * Gemini API Client Service
 * Handles communication with Google's Gemini API for code analysis
 * 
 * This service is responsible for:
 * - Sending code to the Gemini API for analysis
 * - Parsing API responses into structured AnalysisResult objects
 * - Handling various error scenarios (network, authentication, rate limiting, timeouts)
 * - Building appropriate prompts for code analysis
 */

import axios, { AxiosError } from 'axios';
import { AnalysisResult, DiagramData, DiagramNode, DiagramEdge, Dependency, Warning } from '../models';
import { IGeminiAPIClient } from './types';

type GeminiModel = 'gemini-3-flash-preview' | 'gemini-3-pro';

const API_TIMEOUT_MS = 30000;
const DEEPEN_ANALYSIS_TIMEOUT_MS = 60000; // 60 seconds for deeper analysis
const NETWORK_ERROR_MESSAGE = 'Network error: Unable to connect to Gemini API. Please check your internet connection.';
const INVALID_API_KEY_MESSAGE = 'Invalid API Key. Please check your Gemini API Key in settings.';
const RATE_LIMIT_MESSAGE = 'Rate limit exceeded. Please try again later.';
const TIMEOUT_MESSAGE = 'Request timeout. The analysis took too long. Please try again.';
const INVALID_RESPONSE_MESSAGE = 'Invalid API response: no content returned from Gemini API.';

export class GeminiAPIClient implements IGeminiAPIClient {
  /**
   * Gets the API URL for a specific model
   */
  private getApiUrl(model: GeminiModel): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  }

  /**
   * Validates the API key by making a simple test request
   * 
   * @param apiKey - The Gemini API key to validate
   * @returns Promise<{ valid: boolean; message: string }> - Validation result
   */
  async validateAPIKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
    if (!apiKey || apiKey.trim().length === 0) {
      return { valid: false, message: 'API Key cannot be empty' };
    }

    try {
      // Make a minimal test request to validate the key (using Flash model for validation)
      const response = await axios.post(
        `${this.getApiUrl('gemini-3-flash-preview')}?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: 'Hello',
                },
              ],
            },
          ],
        },
        {
          timeout: 10000, // 10 second timeout for validation
        }
      );

      // If we get a response, the key is valid
      if (response.status === 200) {
        return { valid: true, message: 'API Key is valid and working!' };
      }

      return { valid: false, message: 'Unexpected response from API' };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          return { valid: false, message: 'Invalid API Key. Please check your key.' };
        } else if (axiosError.response?.status === 429) {
          return { valid: false, message: 'Rate limit exceeded. Please try again later.' };
        } else if (axiosError.code === 'ECONNABORTED') {
          return { valid: false, message: 'Connection timeout. Please check your internet connection.' };
        } else if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
          return { valid: false, message: 'Network error. Please check your internet connection.' };
        }
        
        return { valid: false, message: `Connection error: ${axiosError.message}` };
      }
      
      return { valid: false, message: `Validation error: ${String(error)}` };
    }
  }

  /**
   * Analyzes code by sending it to the Gemini API
   * 
   * @param code - The source code to analyze
   * @param apiKey - The Gemini API key for authentication
   * @param model - The Gemini model to use (default: gemini-3-flash-preview)
   * @returns Promise<AnalysisResult> - The parsed analysis result
   * @throws Error with specific message for different error scenarios
   */
  async analyzeCode(code: string, apiKey: string, model: GeminiModel = 'gemini-3-flash-preview', language: 'en' | 'es' = 'en'): Promise<AnalysisResult> {
    if (!code || code.trim().length === 0) {
      throw new Error('Code to analyze cannot be empty');
    }

    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API Key is required for analysis');
    }

    try {
      const prompt = this.buildAnalysisPrompt(code, language);
      const response = await axios.post(
        `${this.getApiUrl(model)}?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          timeout: API_TIMEOUT_MS,
        }
      );

      const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error(INVALID_RESPONSE_MESSAGE);
      }

      return this.parseResponse(responseText);
    } catch (error) {
      return this.handleAnalysisError(error);
    }
  }

  /**
   * Deepen analysis of code - provides detailed explanation of variables, functions, and methods
   * 
   * @param code - The code to analyze in depth
   * @param apiKey - The Gemini API key
   * @param model - The model to use (default: flash)
   * @param language - The language for the response ('en' or 'es')
   * @returns Promise<string> - Detailed explanation
   */
  async deepenAnalysis(code: string, apiKey: string, model: GeminiModel = 'gemini-3-flash-preview', language: 'en' | 'es' = 'en'): Promise<string> {
    if (!code || code.trim().length === 0) {
      throw new Error('Code to analyze cannot be empty');
    }

    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API Key is required for analysis');
    }

    console.log('[GeminiAPIClient.deepenAnalysis] Starting API call, code length:', code.length, 'model:', model);

    try {
      const prompt = this.buildDeepenPrompt(code, language);
      console.log('[GeminiAPIClient.deepenAnalysis] Prompt built, making axios request...');
      
      const response = await axios.post(
        `${this.getApiUrl(model)}?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          timeout: DEEPEN_ANALYSIS_TIMEOUT_MS,
        }
      );

      console.log('[GeminiAPIClient.deepenAnalysis] Response received from API');

      const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error(INVALID_RESPONSE_MESSAGE);
      }

      console.log('[GeminiAPIClient.deepenAnalysis] Response text extracted, length:', responseText.length);
      return responseText;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === 'ECONNABORTED') {
          throw new Error('Request timeout - the analysis took too long');
        }
        if (axiosError.response?.status === 401) {
          throw new Error('Invalid API Key');
        }
        if (axiosError.response?.status === 429) {
          throw new Error('Rate limit exceeded - please try again later');
        }
      }
      throw error;
    }
  }

  /**
   * Handles errors from API calls and throws appropriate error messages
   * 
   * @param error - The error that occurred
   * @throws Error with specific message based on error type
   */
  private handleAnalysisError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      // Handle specific HTTP status codes
      if (axiosError.response?.status === 401) {
        throw new Error(INVALID_API_KEY_MESSAGE);
      } else if (axiosError.response?.status === 429) {
        throw new Error(RATE_LIMIT_MESSAGE);
      } else if (axiosError.response?.status === 400) {
        throw new Error('Bad request: Invalid code or API parameters');
      } else if (axiosError.response?.status === 500) {
        throw new Error('Gemini API server error. Please try again later.');
      } else if (axiosError.response?.status === 503) {
        throw new Error('Gemini API service unavailable. Please try again later.');
      }
      
      // Handle timeout
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error(TIMEOUT_MESSAGE);
      }
      
      // Handle network errors
      if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
        throw new Error(NETWORK_ERROR_MESSAGE);
      }
      
      // Handle other axios errors
      if (axiosError.message) {
        throw new Error(`API Error: ${axiosError.message}`);
      }
    }
    
    // Handle non-axios errors
    if (error instanceof Error) {
      throw new Error(`Analysis Error: ${error.message}`);
    }
    
    throw new Error(`Analysis Error: ${String(error)}`);
  }

  /**
   * Parses Gemini API response into a structured AnalysisResult
   * 
   * Handles multiple response formats:
   * - Pure JSON response
   * - JSON embedded in markdown code blocks
   * - Plain text responses (fallback)
   * 
   * @param response - The raw response text from Gemini API
   * @returns AnalysisResult - Parsed analysis result with diagram, dependencies, and warnings
   */
  parseResponse(response: string): AnalysisResult {
    if (!response || response.trim().length === 0) {
      return this.createBasicAnalysisResult('');
    }

    try {
      const markdownJsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      let jsonString: string | null = null;

      if (markdownJsonMatch && markdownJsonMatch[1]) {
        jsonString = markdownJsonMatch[1];
      } else {
        const rawJsonMatch = response.match(/\{[\s\S]*\}/);
        if (rawJsonMatch) {
          jsonString = rawJsonMatch[0];
        }
      }

      if (!jsonString) {
        return this.createBasicAnalysisResult(response);
      }

      const parsed = JSON.parse(jsonString);

      // Convert new format to old format for compatibility
      const diagram = this.buildDiagramFromAnalysis(parsed);

      return {
        diagram: diagram,
        dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : [],
        securityWarnings: Array.isArray(parsed.securityWarnings) ? parsed.securityWarnings : [],
        logicWarnings: Array.isArray(parsed.logicWarnings) ? parsed.logicWarnings : [],
        bestPracticeWarnings: Array.isArray(parsed.bestPracticeWarnings) ? parsed.bestPracticeWarnings : [],
        explanation: typeof parsed.explanation === 'string' ? parsed.explanation : response,
        currentFile: parsed.currentFile,
      };
    } catch (error) {
      return this.createBasicAnalysisResult(response);
    }
  }

  private buildDiagramFromAnalysis(analysis: any): DiagramData {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Create a unique ID for the current file based on its name
    const currentFileName = analysis.currentFile?.name || 'unknown';
    const currentFileId = this.sanitizeId(currentFileName);

    // Add current file as main node ONLY
    if (analysis.currentFile) {
      nodes.push({
        id: currentFileId,
        label: analysis.currentFile.name,
        type: 'file' as const,
        description: analysis.currentFile.description,
        isCurrentFile: true,
        isAnalyzed: true,
      });
    }

    // Add dependencies as nodes ONLY (no components)
    if (Array.isArray(analysis.dependencies)) {
      analysis.dependencies.forEach((dep: any, index: number) => {
        const depId = this.sanitizeId(dep.name);
        nodes.push({
          id: depId,
          label: dep.name,
          type: 'file' as const,
          description: dep.description,
          path: dep.path,
          isDependency: true,
          isCurrentFile: false,
        });

        // Add edge from current to dependency
        edges.push({
          id: `${currentFileId}->${depId}`,
          source: currentFileId,
          target: depId,
          type: dep.type || 'import' as const,
        });
      });
    }

    return {
      nodes: nodes as DiagramNode[],
      edges: edges as DiagramEdge[],
      metadata: {
        lastUpdated: new Date().toISOString(),
        filesAnalyzed: [],
      },
    };
  }

  /**
   * Sanitize a filename to create a valid ID
   * This must match the normalizeNodeId function in extension.ts
   */
  private sanitizeId(filename: string): string {
    // First, remove common suffixes like _java, _js, etc. (from edge IDs)
    let normalized = filename.replace(/_(java|js|ts|tsx|jsx|py|cpp|c|h|cs|go|rb|php|swift)$/i, '');
    // Then remove common file extensions like .java, .js, etc. (from node labels)
    normalized = normalized.replace(/\.(java|js|ts|tsx|jsx|py|cpp|c|h|cs|go|rb|php|swift)$/i, '');
    // Lowercase and sanitize
    normalized = normalized
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    return normalized;
  }

  /**
   * Validates and ensures diagram data has the correct structure
   * 
   * @param diagram - The diagram data to validate
   * @returns DiagramData - Valid diagram data or empty diagram
   */
  private validateDiagramData(diagram: any): DiagramData {
    if (!diagram || typeof diagram !== 'object') {
      return this.createEmptyDiagram();
    }

    return {
      nodes: Array.isArray(diagram.nodes) ? diagram.nodes : [],
      edges: Array.isArray(diagram.edges) ? diagram.edges : [],
      metadata: {
        lastUpdated: typeof diagram.metadata?.lastUpdated === 'string' 
          ? diagram.metadata.lastUpdated 
          : new Date().toISOString(),
        filesAnalyzed: Array.isArray(diagram.metadata?.filesAnalyzed) 
          ? diagram.metadata.filesAnalyzed 
          : [],
      },
    };
  }

  /**
   * Builds the analysis prompt for the Gemini API
   * 
   * Creates a detailed prompt that instructs Gemini to analyze code and return
   * structured JSON with diagram, dependencies, and warnings
   * 
   * @param code - The source code to analyze
   * @returns string - The formatted prompt for Gemini API
   */
  private buildAnalysisPrompt(code: string, language: 'en' | 'es' = 'en'): string {
    if (language === 'es') {
      return `IMPORTANTE: Proporciona TODA la respuesta en ESPAÑOL. Todos los campos "description", "message" y "explanation" deben estar en español.

Analiza el siguiente archivo de código y proporciona un análisis detallado en formato JSON.

Código a analizar:
\`\`\`
${code}
\`\`\`

Por favor, proporciona el análisis en el siguiente formato JSON:
{
  "currentFile": {
    "name": "nombre-archivo.ts",
    "description": "Breve descripción de lo que hace este archivo",
    "components": [
      {
        "id": "comp1",
        "name": "NombreComponente",
        "type": "function|class|interface|module",
        "description": "Qué hace este componente"
      }
    ]
  },
  "dependencies": [
    {
      "id": "dep1",
      "name": "archivo-dependencia.ts",
      "path": "ruta/al/archivo-dependencia.ts",
      "type": "import|reference",
      "description": "Cómo se usa este archivo"
    }
  ],
  "securityWarnings": [
    {
      "type": "security",
      "severity": "high|medium|low",
      "message": "Mensaje de advertencia",
      "line": 10
    }
  ],
  "logicWarnings": [],
  "bestPracticeWarnings": [],
  "explanation": "Explicación general del propósito y arquitectura del archivo"
}

IMPORTANTE: Para el campo "path" en dependencies, proporciona la ruta relativa COMPLETA desde la raíz del proyecto (ej: "src/utils/helpers.ts" o "js/urls.js"), no solo el nombre del archivo.`;
    } else {
      return `IMPORTANT: Provide ALL responses in ENGLISH.

Analyze the following code file and provide a detailed analysis in JSON format.

Code to analyze:
\`\`\`
${code}
\`\`\`

Please provide the analysis in the following JSON format:
{
  "currentFile": {
    "name": "filename.ts",
    "description": "Brief description of what this file does",
    "components": [
      {
        "id": "comp1",
        "name": "ComponentName",
        "type": "function|class|interface|module",
        "description": "What this component does"
      }
    ]
  },
  "dependencies": [
    {
      "id": "dep1",
      "name": "dependency-file.ts",
      "path": "path/to/dependency-file.ts",
      "type": "import|reference",
      "description": "How this file is used"
    }
  ],
  "securityWarnings": [
    {
      "type": "security",
      "severity": "high|medium|low",
      "message": "Warning message",
      "line": 10
    }
  ],
  "logicWarnings": [],
  "bestPracticeWarnings": [],
  "explanation": "Overall explanation of the file's purpose and architecture"
}

IMPORTANT: For the "path" field in dependencies, provide the COMPLETE relative path from the project root (e.g., "src/utils/helpers.ts" or "js/urls.js"), not just the filename.`;
    }
  }

  /**
   * Build prompt for deepening analysis
   * 
   * @param code - The code to analyze
   * @param language - The language for the response
   * @returns string - The formatted prompt for deep analysis
   */
  private buildDeepenPrompt(code: string, language: 'en' | 'es' = 'en'): string {
    if (language === 'es') {
      return `Analiza el siguiente código de forma PROFUNDA pero CONCISA.

Código:
\`\`\`
${code}
\`\`\`

Proporciona un análisis estructurado y directo que incluya:

1. **Propósito**: Qué hace este archivo (1-2 líneas)
2. **Componentes Clave**: Lista las variables, clases o funciones más importantes con una breve explicación de cada una
3. **Flujo Principal**: Describe el flujo de ejecución principal en 2-3 pasos
4. **Puntos de Interés**: Menciona patrones, técnicas especiales o aspectos importantes del código

Sé específico pero conciso. Usa markdown para estructura. Máximo 300 palabras.`;
    } else {
      return `Analyze the following code in a DEEP but CONCISE way.

Code:
\`\`\`
${code}
\`\`\`

Provide a structured and direct analysis that includes:

1. **Purpose**: What this file does (1-2 lines)
2. **Key Components**: List the most important variables, classes or functions with a brief explanation of each
3. **Main Flow**: Describe the main execution flow in 2-3 steps
4. **Points of Interest**: Mention patterns, special techniques or important aspects of the code

Be specific but concise. Use markdown for structure. Maximum 300 words.`;
    }
  }

  /**
   * Creates an empty diagram structure
   * 
   * @returns DiagramData - Empty diagram with metadata
   */
  private createEmptyDiagram(): DiagramData {
    return {
      nodes: [],
      edges: [],
      metadata: {
        lastUpdated: new Date().toISOString(),
        filesAnalyzed: [],
      },
    };
  }

  /**
   * Creates a basic analysis result from plain text response
   * 
   * Used as fallback when JSON parsing fails
   * 
   * @param response - The response text
   * @returns AnalysisResult - Basic analysis result with empty diagram
   */
  private createBasicAnalysisResult(response: string): AnalysisResult {
    return {
      diagram: this.createEmptyDiagram(),
      dependencies: [],
      securityWarnings: [],
      logicWarnings: [],
      bestPracticeWarnings: [],
      explanation: response,
    };
  }

  /**
   * Generate security report summary using AI
   * 
   * @param findings - Array of security findings
   * @param apiKey - The Gemini API key
   * @param model - The model to use (default: flash)
   * @returns Promise<string> - AI-generated summary
   */
  async generateSecurityReport(findings: any[], apiKey: string, model: GeminiModel = 'gemini-3-flash-preview'): Promise<string> {
    if (!findings || findings.length === 0) {
      return 'No security findings to report.';
    }

    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API Key is required for report generation');
    }

    try {
      const prompt = this.buildSecurityReportPrompt(findings);
      const response = await axios.post(
        `${this.getApiUrl(model)}?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          timeout: API_TIMEOUT_MS,
        }
      );

      const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error(INVALID_RESPONSE_MESSAGE);
      }

      return responseText;
    } catch (error) {
      return this.handleAnalysisError(error);
    }
  }

  /**
   * Build prompt for security report generation
   */
  private buildSecurityReportPrompt(findings: any[]): string {
    const findingsSummary = findings.map(f => 
      `- ${f.severity.toUpperCase()}: ${f.message} (${f.file}${f.line ? ':' + f.line : ''})`
    ).join('\n');

    return `Analyze the following security and quality findings and generate a brief executive summary.

Findings:
${findingsSummary}

Please provide:
1. Overall assessment (2-3 sentences)
2. Top 3 concerns (if applicable)
3. General recommendations (2-3 key actions)

Keep it concise, actionable, and professional. Focus on the most critical issues.
Maximum 200 words.`;
  }

  /**
   * Get AI recommendation for a specific finding
   * 
   * @param finding - The security finding
   * @param apiKey - The Gemini API key
   * @param model - The model to use (default: flash)
   * @returns Promise<string> - AI-generated recommendation
   */
  async getRecommendation(finding: any, apiKey: string, model: GeminiModel = 'gemini-3-flash-preview'): Promise<string> {
    if (!finding) {
      return 'No finding provided.';
    }

    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API Key is required for recommendation generation');
    }

    try {
      const prompt = this.buildRecommendationPrompt(finding);
      const response = await axios.post(
        `${this.getApiUrl(model)}?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          timeout: API_TIMEOUT_MS,
        }
      );

      const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error(INVALID_RESPONSE_MESSAGE);
      }

      return responseText;
    } catch (error) {
      return this.handleAnalysisError(error);
    }
  }

  /**
   * Build prompt for recommendation generation
   */
  private buildRecommendationPrompt(finding: any): string {
    return `Provide a specific, actionable recommendation for the following code issue:

Type: ${finding.type}
Severity: ${finding.severity}
Issue: ${finding.message}
File: ${finding.file}${finding.line ? ' (line ' + finding.line + ')' : ''}

Please provide:
1. Why this is a concern
2. Specific steps to fix it
3. Code example if applicable

Keep it concise and practical. Maximum 150 words.`;
  }
}
