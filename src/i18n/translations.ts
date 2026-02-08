/**
 * Internationalization (i18n) module
 * Provides translations for all user-facing messages
 */

import * as vscode from 'vscode';

export type Language = 'en' | 'es';

export interface Translations {
    // Analysis messages
    analyzingFile: string;
    analysisComplete: string;
    analysisFailed: string;
    analyzing: string;
    loadingDiagram: string;
    loadingDiagramInfo: string;
    
    // API Key messages
    apiKeyNotConfigured: string;
    pleaseSetApiKey: string;
    apiKeySaved: string;
    apiKeyCleared: string;
    getApiKey: string;
    
    // API Key validation messages
    testingConnection: string;
    connectionSuccess: string;
    connectionFailed: string;
    testConnection: string;
    
    // Model selection messages
    model: string;
    modelFlash: string;
    modelPro: string;
    modelSaved: string;
    
    // Diagram messages
    diagramCleared: string;
    failedToClearDiagram: string;
    pleaseOpenFile: string;
    
    // Navigation
    navigateToCode: string;
    goToCode: string;
    
    // Reports
    generateSecurityReport: string;
    generateQualityReport: string;
    securityReport: string;
    qualityReport: string;
    reportGenerated: string;
    generateReport: string;
    report: string;
    
    // Tabs
    diagram: string;
    security: string;
    quality: string;
    settings: string;
    geminiAssistant: string;
    
    // Security Tab
    securityAnalysis: string;
    analysisSummary: string;
    overallRiskLevel: string;
    riskCritical: string;
    riskHigh: string;
    riskMedium: string;
    riskLow: string;
    totalFindings: string;
    highSeverity: string;
    mediumSeverity: string;
    lowSeverity: string;
    aiExecutiveSummary: string;
    regenerate: string;
    getRecommendation: string;
    loadingRecommendation: string;
    
    // Quality Tab
    codeQuality: string;
    qualityScore: string;
    improvements: string;
    bugs: string;
    possibleBugs: string;
    performance: string;
    bestPractices: string;
    analyzeQuality: string;
    analyzingQuality: string;
    noQualityIssues: string;
    
    // Settings
    aiConfiguration: string;
    diagramType: string;
    apiKey: string;
    language: string;
    layoutOptimization: string;
    aiOptimized: string;
    hierarchical: string;
    automatic: string;
    applyLayout: string;
    updateDiagram: string;
    saveLanguage: string;
    
    // Chat Assistant
    chatWithGemini: string;
    askAboutCode: string;
    applyCode: string;
    clearChat: string;
    sendMessage: string;
    
    // Actions
    save: string;
    clear: string;
    cancel: string;
    apply: string;
    close: string;
    
    // Error messages
    error: string;
    failedToOpenFile: string;
    noFilesAnalyzed: string;
    pleaseAnalyzeFirst: string;
}

const translations: Record<Language, Translations> = {
    en: {
        // Analysis messages
        analyzingFile: 'Analyzing file...',
        analysisComplete: 'Analysis complete!',
        analysisFailed: 'Analysis failed',
        analyzing: 'Analyzing...',
        loadingDiagram: 'Loading diagram...',
        loadingDiagramInfo: 'Loading information, please wait...',
        
        // API Key messages
        apiKeyNotConfigured: 'API Key not configured. Please set your Gemini API Key in the Settings tab.',
        pleaseSetApiKey: 'Please set your Gemini API Key in the Settings tab.',
        apiKeySaved: 'API Key saved successfully',
        apiKeyCleared: 'API Key cleared',
        getApiKey: 'Get your API key from Google AI Studio',
        
        // API Key validation messages
        testingConnection: 'Testing connection...',
        connectionSuccess: 'Connection successful!',
        connectionFailed: 'Connection failed',
        testConnection: 'Test Connection',
        
        // Model selection messages
        model: 'Model',
        modelFlash: 'Gemini 3 Flash (Lite) - Faster',
        modelPro: 'Gemini 3 Pro - More Detailed',
        modelSaved: 'Model preference saved',
        
        // Diagram messages
        diagramCleared: 'Architecture diagram and analysis cache cleared',
        failedToClearDiagram: 'Failed to clear diagram',
        pleaseOpenFile: 'Please open a file to analyze',
        
        // Navigation
        navigateToCode: 'Navigate to code',
        goToCode: 'Go to code',
        
        // Reports
        generateSecurityReport: 'Generate Security Report',
        generateQualityReport: 'Generate Quality Report',
        securityReport: 'Security Report',
        qualityReport: 'Quality Report',
        reportGenerated: 'Report generated successfully',
        generateReport: 'Generate Report',
        report: 'Report',
        
        // Tabs
        diagram: 'Diagram',
        security: 'Security',
        quality: 'Quality',
        settings: 'Settings',
        geminiAssistant: 'Gemini Assistant',
        
        // Security Tab
        securityAnalysis: 'Security Analysis',
        analysisSummary: 'Analysis Summary',
        overallRiskLevel: 'Overall Risk Level',
        riskCritical: 'Critical',
        riskHigh: 'High',
        riskMedium: 'Medium',
        riskLow: 'Low',
        totalFindings: 'Total Findings',
        highSeverity: 'High Severity',
        mediumSeverity: 'Medium Severity',
        lowSeverity: 'Low Severity',
        aiExecutiveSummary: 'AI Executive Summary',
        regenerate: 'Regenerate',
        getRecommendation: 'Get Recommendation',
        loadingRecommendation: 'Loading recommendation...',
        
        // Quality Tab
        codeQuality: 'Code Quality',
        qualityScore: 'Quality Score',
        improvements: 'Improvements',
        bugs: 'Bugs',
        possibleBugs: 'Possible Bugs',
        performance: 'Performance',
        bestPractices: 'Best Practices',
        analyzeQuality: 'Analyze Quality',
        analyzingQuality: 'Analyzing quality...',
        noQualityIssues: 'No quality issues found',
        
        // Settings
        aiConfiguration: 'AI Configuration',
        diagramType: 'Diagram Type',
        apiKey: 'API Key',
        language: 'Language',
        layoutOptimization: 'Layout Optimization',
        aiOptimized: 'AI-Optimized (Gemini)',
        hierarchical: 'Hierarchical (Layered)',
        automatic: 'Automatic (Force-Directed)',
        applyLayout: 'Apply Layout',
        updateDiagram: 'Update Diagram',
        saveLanguage: 'Save Language',
        
        // Chat Assistant
        chatWithGemini: 'Chat with Gemini',
        askAboutCode: 'Ask about your code...',
        applyCode: 'Apply Code',
        clearChat: 'Clear Chat',
        sendMessage: 'Send',
        
        // Actions
        save: 'Save',
        clear: 'Clear',
        cancel: 'Cancel',
        apply: 'Apply',
        close: 'Close',
        
        // Error messages
        error: 'Error',
        failedToOpenFile: 'Failed to open file',
        noFilesAnalyzed: 'No files analyzed yet',
        pleaseAnalyzeFirst: 'Please analyze some files first',
    },
    es: {
        // Analysis messages
        analyzingFile: 'Analizando archivo...',
        analysisComplete: '¡Análisis completado!',
        analysisFailed: 'Análisis fallido',
        analyzing: 'Analizando...',
        loadingDiagram: 'Cargando diagrama...',
        loadingDiagramInfo: 'Cargando información, por favor espera...',
        
        // API Key messages
        apiKeyNotConfigured: 'Clave API no configurada. Por favor configure su clave API de Gemini en la pestaña de Configuración.',
        pleaseSetApiKey: 'Por favor configure su clave API de Gemini en la pestaña de Configuración.',
        apiKeySaved: 'Clave API guardada exitosamente',
        apiKeyCleared: 'Clave API eliminada',
        getApiKey: 'Obtenga su clave API desde Google AI Studio',
        
        // API Key validation messages
        testingConnection: 'Probando conexión...',
        connectionSuccess: '¡Conexión exitosa!',
        connectionFailed: 'Conexión fallida',
        testConnection: 'Probar Conexión',
        
        // Model selection messages
        model: 'Modelo',
        modelFlash: 'Gemini 3 Flash (Lite) - Más Rápido',
        modelPro: 'Gemini 3 Pro - Más Detallado',
        modelSaved: 'Preferencia de modelo guardada',
        
        // Diagram messages
        diagramCleared: 'Diagrama de arquitectura y caché limpiados',
        failedToClearDiagram: 'Error al limpiar diagrama',
        pleaseOpenFile: 'Por favor abra un archivo para analizar',
        
        // Navigation
        navigateToCode: 'Navegar al código',
        goToCode: 'Ir al código',
        
        // Reports
        generateSecurityReport: 'Generar Reporte de Seguridad',
        generateQualityReport: 'Generar Reporte de Calidad',
        securityReport: 'Reporte de Seguridad',
        qualityReport: 'Reporte de Calidad',
        reportGenerated: 'Reporte generado exitosamente',
        generateReport: 'Generar Reporte',
        report: 'Reporte',
        
        // Tabs
        diagram: 'Diagrama',
        security: 'Seguridad',
        quality: 'Calidad',
        settings: 'Configuración',
        geminiAssistant: 'Asistente Gemini',
        
        // Security Tab
        securityAnalysis: 'Análisis de Seguridad',
        analysisSummary: 'Resumen del Análisis',
        overallRiskLevel: 'Nivel de Riesgo General',
        riskCritical: 'Crítico',
        riskHigh: 'Alto',
        riskMedium: 'Medio',
        riskLow: 'Bajo',
        totalFindings: 'Hallazgos Totales',
        highSeverity: 'Severidad Alta',
        mediumSeverity: 'Severidad Media',
        lowSeverity: 'Severidad Baja',
        aiExecutiveSummary: 'Resumen Ejecutivo IA',
        regenerate: 'Regenerar',
        getRecommendation: 'Obtener Recomendación',
        loadingRecommendation: 'Cargando recomendación...',
        
        // Quality Tab
        codeQuality: 'Calidad del Código',
        qualityScore: 'Puntuación de Calidad',
        improvements: 'Mejoras',
        bugs: 'Bugs',
        possibleBugs: 'Posibles Bugs',
        performance: 'Rendimiento',
        bestPractices: 'Mejores Prácticas',
        analyzeQuality: 'Analizar Calidad',
        analyzingQuality: 'Analizando calidad...',
        noQualityIssues: 'No se encontraron problemas de calidad',
        
        // Settings
        aiConfiguration: 'Configuración de IA',
        diagramType: 'Tipo de Diagrama',
        apiKey: 'Clave API',
        language: 'Idioma',
        layoutOptimization: 'Optimización de Diseño',
        aiOptimized: 'Optimizado por IA (Gemini)',
        hierarchical: 'Jerárquico (Por Capas)',
        automatic: 'Automático (Dirigido por Fuerza)',
        applyLayout: 'Aplicar Diseño',
        updateDiagram: 'Actualizar Diagrama',
        saveLanguage: 'Guardar Idioma',
        
        // Chat Assistant
        chatWithGemini: 'Chatear con Gemini',
        askAboutCode: 'Pregunta sobre tu código...',
        applyCode: 'Aplicar Código',
        clearChat: 'Limpiar Chat',
        sendMessage: 'Enviar',
        
        // Actions
        save: 'Guardar',
        clear: 'Limpiar',
        cancel: 'Cancelar',
        apply: 'Aplicar',
        close: 'Cerrar',
        
        // Error messages
        error: 'Error',
        failedToOpenFile: 'Error al abrir archivo',
        noFilesAnalyzed: 'No hay archivos analizados aún',
        pleaseAnalyzeFirst: 'Por favor analice algunos archivos primero',
    }
};

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'codeArchitectLanguage';

// Cached language to avoid repeated storage reads
let cachedLanguage: Language | null = null;

/**
 * Get the current language from extension storage
 * Falls back to English if not set
 */
export async function getCurrentLanguage(context: vscode.ExtensionContext): Promise<Language> {
    // Return cached value if available
    if (cachedLanguage) {
        console.log('[getCurrentLanguage] Returning cached language:', cachedLanguage);
        return cachedLanguage;
    }
    
    // Try to get from global state (same storage as webview uses)
    const savedLanguage = context.globalState.get<Language>(LANGUAGE_STORAGE_KEY);
    console.log('[getCurrentLanguage] Language from globalState:', savedLanguage);
    
    if (savedLanguage === 'es' || savedLanguage === 'en') {
        cachedLanguage = savedLanguage;
        console.log('[getCurrentLanguage] Setting cached language to:', cachedLanguage);
        return savedLanguage;
    }
    
    // Default to English
    console.log('[getCurrentLanguage] No saved language, defaulting to English');
    cachedLanguage = 'en';
    return 'en';
}

/**
 * Set the current language and cache it
 */
export async function setCurrentLanguage(context: vscode.ExtensionContext, language: Language): Promise<void> {
    cachedLanguage = language;
    await context.globalState.update(LANGUAGE_STORAGE_KEY, language);
}

/**
 * Clear the cached language (useful when language changes)
 */
export function clearLanguageCache(): void {
    cachedLanguage = null;
}

/**
 * Get translation for a key in the current language
 */
export async function t(key: keyof Translations, context: vscode.ExtensionContext): Promise<string> {
    const lang = await getCurrentLanguage(context);
    return translations[lang][key] || translations['en'][key];
}

/**
 * Get translation with parameters
 */
export async function tf(key: keyof Translations, context: vscode.ExtensionContext, ...params: string[]): Promise<string> {
    let text = await t(key, context);
    params.forEach((param, index) => {
        text = text.replace(`{${index}}`, param);
    });
    return text;
}
