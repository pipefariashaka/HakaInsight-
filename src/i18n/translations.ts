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
    
    // API Key messages
    apiKeyNotConfigured: string;
    pleaseSetApiKey: string;
    
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
    
    // Error messages
    error: string;
    failedToOpenFile: string;
}

const translations: Record<Language, Translations> = {
    en: {
        // Analysis messages
        analyzingFile: 'Analyzing file...',
        analysisComplete: 'Analysis complete!',
        analysisFailed: 'Analysis failed',
        
        // API Key messages
        apiKeyNotConfigured: 'API Key not configured. Please set your Gemini API Key in the Settings tab.',
        pleaseSetApiKey: 'Please set your Gemini API Key in the Settings tab.',
        
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
        
        // Error messages
        error: 'Error',
        failedToOpenFile: 'Failed to open file',
    },
    es: {
        // Analysis messages
        analyzingFile: 'Analizando archivo...',
        analysisComplete: '¡Análisis completado!',
        analysisFailed: 'Análisis fallido',
        
        // API Key messages
        apiKeyNotConfigured: 'Clave API no configurada. Por favor configure su clave API de Gemini en la pestaña de Configuración.',
        pleaseSetApiKey: 'Por favor configure su clave API de Gemini en la pestaña de Configuración.',
        
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
        
        // Error messages
        error: 'Error',
        failedToOpenFile: 'Error al abrir archivo',
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
