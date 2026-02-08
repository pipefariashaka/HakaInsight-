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
    noDiagramYet: string;
    
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
    
    // Report content
    generatedOn: string;
    executiveSummary: string;
    totalFindings: string;
    riskLevel: string;
    filesAnalyzed: string;
    severityBreakdown: string;
    highSeverityFindings: string;
    mediumSeverityFindings: string;
    lowSeverityFindings: string;
    analyzedFiles: string;
    generatedBy: string;
    reportDate: string;
    noHighSeverityFindings: string;
    noMediumSeverityFindings: string;
    noLowSeverityFindings: string;
    
    // Quality report
    qualityOverview: string;
    qualityScore: string;
    totalIssues: string;
    issueBreakdown: string;
    bugs: string;
    improvements: string;
    performance: string;
    bestPractices: string;
    performanceIssues: string;
    noBugsFound: string;
    noImprovementIssues: string;
    noPerformanceIssuesFound: string;
    noBestPracticeIssues: string;
    
    // Tabs
    diagram: string;
    security: string;
    quality: string;
    settings: string;
    about: string;
    geminiAssistant: string;
    
    // Security Tab
    securityAnalysis: string;
    analysisSummary: string;
    overallRiskLevel: string;
    riskCritical: string;
    riskHigh: string;
    riskMedium: string;
    riskLow: string;
    highSeverity: string;
    mediumSeverity: string;
    lowSeverity: string;
    aiExecutiveSummary: string;
    regenerate: string;
    getRecommendation: string;
    loadingRecommendation: string;
    generatingAISummary: string;
    recommendation: string;
    securityType: string;
    logicType: string;
    bestPracticeType: string;
    
    // Quality Tab
    codeQuality: string;
    possibleBugs: string;
    analyzeQuality: string;
    noQualityAnalysis: string;
    pressAnalyzeQuality: string;
    analysisSummaryQuality: string;
    improvementOpportunities: string;
    findings: string;
    performanceOptimizations: string;
    analyzingQuality: string;
    noQualityIssues: string;
    suggestion: string;
    noImprovementsFound: string;
    noPerformanceIssues: string;
    followsBestPractices: string;
    qualityAnalysisComplete: string;
    
    // Settings
    aiConfiguration: string;
    diagramType: string;
    apiKey: string;
    language: string;
    languageSettings: string;
    displayLanguage: string;
    enterApiKey: string;
    layoutOptimization: string;
    aiOptimized: string;
    hierarchical: string;
    automatic: string;
    applyLayout: string;
    updateDiagram: string;
    saveLanguage: string;
    analyzeFilesPrompt: string;
    
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
    confirmClearDiagram: string;
    
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
        noDiagramYet: 'To view the diagram, right-click on any file in your project and select "Analyze with Haka Insight"',
        
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
        
        // Report content
        generatedOn: 'Generated on',
        executiveSummary: 'Executive Summary',
        totalFindings: 'Total Findings',
        riskLevel: 'Risk Level',
        filesAnalyzed: 'Files Analyzed',
        severityBreakdown: 'Severity Breakdown',
        highSeverityFindings: 'High Severity Findings',
        mediumSeverityFindings: 'Medium Severity Findings',
        lowSeverityFindings: 'Low Severity Findings',
        analyzedFiles: 'Analyzed Files',
        generatedBy: 'Generated by Haka Insight - Code Architecture Analyzer',
        reportDate: 'Report Date',
        noHighSeverityFindings: 'No high severity findings',
        noMediumSeverityFindings: 'No medium severity findings',
        noLowSeverityFindings: 'No low severity findings',
        
        // Quality report
        qualityOverview: 'Quality Overview',
        qualityScore: 'Quality Score',
        totalIssues: 'Total Issues',
        issueBreakdown: 'Issue Breakdown',
        bugs: 'Bugs',
        improvements: 'Improvements',
        performance: 'Performance',
        bestPractices: 'Best Practices',
        performanceIssues: 'Performance Issues',
        noBugsFound: 'No bug issues found',
        noImprovementIssues: 'No improvement issues found',
        noPerformanceIssuesFound: 'No performance issues found',
        noBestPracticeIssues: 'No best practice issues found',
        
        // Tabs
        diagram: 'Diagram',
        security: 'Security',
        quality: 'Quality',
        settings: 'Settings',
        about: 'About Haka Insight',
        geminiAssistant: 'Gemini Assistant',
        
        // Security Tab
        securityAnalysis: 'Security Analysis',
        analysisSummary: 'Analysis Summary',
        overallRiskLevel: 'Overall Risk Level',
        riskCritical: 'Critical',
        riskHigh: 'High',
        riskMedium: 'Medium',
        riskLow: 'Low',
        highSeverity: 'High Severity',
        mediumSeverity: 'Medium Severity',
        lowSeverity: 'Low Severity',
        aiExecutiveSummary: 'AI Executive Summary',
        regenerate: 'Regenerate',
        getRecommendation: 'Get Recommendation',
        loadingRecommendation: 'Loading recommendation...',
        generatingAISummary: 'Generating AI summary...',
        recommendation: 'Recommendation',
        securityType: 'Security',
        logicType: 'Logic',
        bestPracticeType: 'Best Practices',
        
        // Quality Tab
        codeQuality: 'Code Quality',
        possibleBugs: 'Possible Bugs',
        analyzeQuality: 'Analyze Quality',
        noQualityAnalysis: 'No Quality Analysis Available',
        pressAnalyzeQuality: 'Press the "Analyze Quality" button to begin',
        analysisSummaryQuality: 'Analysis Summary',
        improvementOpportunities: 'Improvement Opportunities',
        findings: 'Findings',
        performanceOptimizations: 'Performance Optimizations',
        analyzingQuality: 'Analyzing quality...',
        noQualityIssues: 'No quality issues found',
        suggestion: 'Suggestion:',
        noImprovementsFound: 'No improvement opportunities found',
        noPerformanceIssues: 'No performance issues found',
        followsBestPractices: 'Code follows best practices',
        qualityAnalysisComplete: 'Quality analysis completed',
        
        // Settings
        aiConfiguration: 'AI Configuration',
        diagramType: 'Diagram Type',
        apiKey: 'API Key',
        language: 'Language',
        languageSettings: 'Language Settings',
        displayLanguage: 'Display Language',
        enterApiKey: 'Enter your Gemini API Key',
        layoutOptimization: 'Layout Optimization',
        aiOptimized: 'AI-Optimized (Gemini)',
        hierarchical: 'Hierarchical (Layered)',
        automatic: 'Automatic (Force-Directed)',
        applyLayout: 'Apply Layout',
        updateDiagram: 'Update Diagram',
        saveLanguage: 'Save Language',
        analyzeFilesPrompt: 'To view the diagram, right-click on any file in your project and select "Analyze with Haka Insight"',
        
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
        confirmClearDiagram: 'Are you sure you want to clear the diagram? This will remove all analyses and cannot be undone.',
        
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
        noDiagramYet: 'Para ver el diagrama, haz clic derecho sobre algún archivo de tu proyecto y selecciona "Analyze with Haka Insight"',
        
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
        
        // Report content
        generatedOn: 'Generado el',
        executiveSummary: 'Resumen Ejecutivo',
        totalFindings: 'Hallazgos Totales',
        riskLevel: 'Nivel de Riesgo',
        filesAnalyzed: 'Archivos Analizados',
        severityBreakdown: 'Desglose por Severidad',
        highSeverityFindings: 'Hallazgos de Severidad Alta',
        mediumSeverityFindings: 'Hallazgos de Severidad Media',
        lowSeverityFindings: 'Hallazgos de Severidad Baja',
        analyzedFiles: 'Archivos Analizados',
        generatedBy: 'Generado por Haka Insight - Analizador de Arquitectura de Código',
        reportDate: 'Fecha del Reporte',
        noHighSeverityFindings: 'No se encontraron hallazgos de severidad alta',
        noMediumSeverityFindings: 'No se encontraron hallazgos de severidad media',
        noLowSeverityFindings: 'No se encontraron hallazgos de severidad baja',
        
        // Quality report
        qualityOverview: 'Resumen de Calidad',
        qualityScore: 'Puntuación de Calidad',
        totalIssues: 'Problemas Totales',
        issueBreakdown: 'Desglose de Problemas',
        bugs: 'Bugs',
        improvements: 'Mejoras',
        performance: 'Rendimiento',
        bestPractices: 'Mejores Prácticas',
        performanceIssues: 'Problemas de Rendimiento',
        noBugsFound: 'No se encontraron bugs',
        noImprovementIssues: 'No se encontraron oportunidades de mejora',
        noPerformanceIssuesFound: 'No se encontraron problemas de rendimiento',
        noBestPracticeIssues: 'No se encontraron problemas de mejores prácticas',
        
        // Tabs
        diagram: 'Diagrama',
        security: 'Seguridad',
        quality: 'Calidad',
        settings: 'Configuración',
        about: 'Sobre Haka Insight',
        geminiAssistant: 'Asistente Gemini',
        
        // Security Tab
        securityAnalysis: 'Análisis de Seguridad',
        analysisSummary: 'Resumen del Análisis',
        overallRiskLevel: 'Nivel de Riesgo General',
        riskCritical: 'Crítico',
        riskHigh: 'Alto',
        riskMedium: 'Medio',
        riskLow: 'Bajo',
        highSeverity: 'Severidad Alta',
        mediumSeverity: 'Severidad Media',
        lowSeverity: 'Severidad Baja',
        aiExecutiveSummary: 'Resumen Ejecutivo IA',
        regenerate: 'Regenerar',
        getRecommendation: 'Obtener Recomendación',
        loadingRecommendation: 'Cargando recomendación...',
        generatingAISummary: 'Generando resumen con IA...',
        recommendation: 'Recomendación',
        securityType: 'Seguridad',
        logicType: 'Lógica',
        bestPracticeType: 'Mejores Prácticas',
        
        // Quality Tab
        codeQuality: 'Calidad del Código',
        possibleBugs: 'Posibles Bugs',
        analyzeQuality: 'Analizar Calidad',
        noQualityAnalysis: 'No hay análisis de calidad disponible',
        pressAnalyzeQuality: 'Presiona el botón "Analizar Calidad" para comenzar',
        analysisSummaryQuality: 'Resumen del Análisis',
        improvementOpportunities: 'Oportunidades de Mejora',
        findings: 'Hallazgos',
        performanceOptimizations: 'Optimizaciones de Rendimiento',
        analyzingQuality: 'Analizando calidad...',
        noQualityIssues: 'No se encontraron problemas de calidad',
        suggestion: 'Sugerencia:',
        noImprovementsFound: 'No se encontraron oportunidades de mejora',
        noPerformanceIssues: 'No se encontraron problemas de rendimiento',
        followsBestPractices: 'El código sigue las mejores prácticas',
        qualityAnalysisComplete: 'Análisis de calidad completado',
        
        // Settings
        aiConfiguration: 'Configuración de IA',
        diagramType: 'Tipo de Diagrama',
        apiKey: 'Clave API',
        language: 'Idioma',
        languageSettings: 'Configuración de Idioma',
        displayLanguage: 'Idioma de Visualización',
        enterApiKey: 'Ingrese su clave API de Gemini',
        layoutOptimization: 'Optimización de Diseño',
        aiOptimized: 'Optimizado por IA (Gemini)',
        hierarchical: 'Jerárquico (Por Capas)',
        automatic: 'Automático (Dirigido por Fuerza)',
        applyLayout: 'Aplicar Diseño',
        updateDiagram: 'Actualizar Diagrama',
        saveLanguage: 'Guardar Idioma',
        analyzeFilesPrompt: 'Para ver el diagrama, haz clic derecho sobre algún archivo de tu proyecto y selecciona "Analyze with Haka Insight"',
        
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
        confirmClearDiagram: '¿Está seguro de que desea limpiar el diagrama? Esto eliminará todos los análisis y no se puede deshacer.',
        
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
