const vscode = acquireVsCodeApi();
        let diagramRenderer = null;
        let currentDiagramData = null;
        let currentLanguage = 'en';
        let zoomLevel = 1;
        let panX = 0;
        let panY = 0;
        let draggedNode = null;
        let dragStartX = 0;
        let dragStartY = 0;
        let fileVisibilityMap = new Map(); // Track which files are visible
        let currentFindings = []; // Store current findings for regeneration
        let analysisDataMap = new Map(); // Store analysis data for each file
        let savePositionsTimeout = null; // Timeout for debounced position saving
        
        // Debounce function
        function debounce(func, wait) {
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(savePositionsTimeout);
                    func(...args);
                };
                clearTimeout(savePositionsTimeout);
                savePositionsTimeout = setTimeout(later, wait);
            };
        }
        
        // Debounced save positions function
        const debouncedSavePositions = debounce((positions) => {
            vscode.postMessage({
                command: 'saveNodePositions',
                positions: positions
            });
        }, 500); // Save after 500ms of no movement
        
        // Helper functions to avoid regex in code (causes issues in VS Code webviews)
        function sanitizeId(str) {
            return str.toLowerCase()
                .split('').map(c => /[a-z0-9]/.test(c) ? c : '_').join('')
                .split('_').filter(s => s).join('_');
        }
        
        function removeUnderscores(str) {
            return str.split('_').join('');
        }
        
        function escapeQuotes(str) {
            return str.split('"').join('\\\\"');
        }
        
        function replaceDoubleNewlines(str) {
            return str.split('\\n\\n').join('</p><p>');
        }
        
        function replaceSingleNewlines(str) {
            return str.split('\\n').join('<br>');
        }
        
        const translations = {
            en: {
                // Tabs
                language: 'Language / Idioma',
                diagram: 'Diagram',
                settings: 'Settings',
                security: 'Security Analysis',
                
                // Settings
                apiKey: 'Gemini API Key',
                save: 'Save',
                clear: 'Clear',
                enterApiKey: 'Enter your Gemini API Key',
                languageSettings: 'Language Settings',
                diagramType: 'Diagram Type',
                apiConfiguration: 'API Configuration',
                displayLanguage: 'Display Language',
                getApiKey: 'Get your API key from',
                
                // Messages
                analysisComplete: 'Analysis complete!',
                apiKeySaved: 'API Key saved successfully',
                apiKeyCleared: 'API Key cleared',
                
                // Diagram sections
                codeExplanation: 'Code Explanation',
                warnings: 'Warnings',
                
                // Warning types
                security: 'Security',
                logic: 'Logic',
                bestPractice: 'Best Practice',
                securityWarnings: 'Security Warnings',
                logicWarnings: 'Logic Warnings',
                bestPracticeSuggestions: 'Best Practice Suggestions',
                
                // Left menu
                analyzedFiles: 'Analyzed Files',
                
                // Export menu
                export: 'Export',
                exportAsPNG: 'Export as PNG',
                exportAsSVG: 'Export as SVG',
                exportAsMermaid: 'Export as Mermaid',
                exportAsJSON: 'Export as JSON',
                
                // Zoom controls
                zoomIn: 'Zoom In',
                zoomOut: 'Zoom Out',
                reset: 'Reset',
                
                // Context menu
                analyze: 'Analyze',
                updateAnalysis: 'Update Analysis',
                
                // Details panel
                fileAnalysisDetails: 'File Analysis Details',
                explanation: 'Explanation',
                dependencies: 'Dependencies',
                noAnalysisData: 'No analysis data available for this file.',
                noDetailedAnalysis: 'No detailed analysis available.',
                fromCache: 'From Cache',
                cachedAt: 'Cached at',
                clearCache: 'Clear Cache',
                cacheCleared: 'Analysis cache cleared',
                cacheError: 'Failed to load cache',
                confirmClearCache: 'Are you sure you want to clear the cache? This will remove all cached analyses.',
                never: 'Never',
                
                // Node popup
                noDescription: 'No description available',
                
                // Status messages
                analyzing: 'Analyzing file...',
                analysisFailed: 'Analysis failed',
                diagramCleared: 'Diagram and cache cleared successfully',
                exportSuccess: 'Diagram exported successfully',
                exportFailed: 'Failed to export diagram',
                
                // Errors
                error: 'Error',
                pleaseEnterApiKey: 'Please enter an API Key',
                apiKeyNotConfigured: 'API Key not configured. Please set your Gemini API Key in the Settings tab.',
                failedToNavigate: 'Failed to navigate',
                failedToAnalyze: 'Failed to analyze file',
                failedToUpdate: 'Failed to update analysis',
                failedToToggle: 'Failed to toggle file visibility',
                
                // API Key validation
                testConnection: 'Test Connection',
                testingConnection: 'Testing connection...',
                connectionSuccess: 'Connection successful! API Key is valid.',
                connectionFailed: 'Connection failed',
                
                // Model selection
                model: 'Model',
                modelFlash: 'Gemini 3 Flash (Lite) - Faster',
                modelPro: 'Gemini 3 Pro - More Detailed',
                modelSaved: 'Model preference saved',
                modelHelp: 'Flash is faster and cheaper, Pro provides more detailed analysis',
                updateDiagram: 'Update Diagram',
                loadingDiagramInfo: 'Loading information, please wait...',
                
                // Security tab
                noSecurityAnalysis: 'No Security Analysis Available',
                analyzeFilesPrompt: 'Analyze some files to see security and quality findings here.',
                analysisSummary: 'Analysis Summary',
                totalFindings: 'Total Findings',
                highSeverity: 'High Severity',
                mediumSeverity: 'Medium Severity',
                lowSeverity: 'Low Severity',
                overallRiskLevel: 'Overall Risk Level:',
                findings: 'Findings',
                generateReport: 'Generate Report',
                riskCritical: 'Critical',
                riskHigh: 'High',
                riskMedium: 'Medium',
                riskLow: 'Low',
                securityType: 'Security',
                logicType: 'Logic',
                bestPracticeType: 'Best Practice',
                aiExecutiveSummary: 'AI Executive Summary',
                regenerate: 'Regenerate',
                generatingAISummary: 'Generating AI summary...',
                getRecommendation: 'Get Recommendation',
                recommendation: 'Recommendation',
                loadingRecommendation: 'Loading recommendation...',
                navigateToCode: 'Go to code'
            },
            es: {
                // Tabs
                language: 'Idioma / Language',
                diagram: 'Diagrama',
                settings: 'Configuración',
                security: 'Análisis de Seguridad',
                
                // Settings
                apiKey: 'Clave API de Gemini',
                save: 'Guardar',
                clear: 'Limpiar',
                enterApiKey: 'Ingrese su clave API de Gemini',
                languageSettings: 'Configuración de Idioma',
                diagramType: 'Tipo de Diagrama',
                apiConfiguration: 'Configuración de IA',
                displayLanguage: 'Idioma de Visualización',
                getApiKey: 'Obtenga su clave API desde',
                
                // Messages
                analysisComplete: '¡Análisis completado!',
                apiKeySaved: 'Clave API guardada exitosamente',
                apiKeyCleared: 'Clave API eliminada',
                
                // Diagram sections
                codeExplanation: 'Explicación del Código',
                warnings: 'Advertencias',
                
                // Warning types
                security: 'Seguridad',
                logic: 'Lógica',
                bestPractice: 'Mejores Prácticas',
                securityWarnings: 'Advertencias de Seguridad',
                logicWarnings: 'Advertencias de Lógica',
                bestPracticeSuggestions: 'Sugerencias de Mejores Prácticas',
                
                // Left menu
                analyzedFiles: 'Archivos Analizados',
                
                // Export menu
                export: '',
                exportAsPNG: 'Exportar como PNG',
                exportAsSVG: 'Exportar como SVG',
                exportAsMermaid: 'Exportar como Mermaid',
                exportAsJSON: 'Exportar como JSON',
                
                // Zoom controls
                zoomIn: 'Acercar',
                zoomOut: 'Alejar',
                reset: 'Restablecer',
                
                // Context menu
                analyze: 'Analizar',
                updateAnalysis: 'Actualizar Análisis',
                
                // Details panel
                fileAnalysisDetails: 'Detalles del Análisis del Archivo',
                explanation: 'Explicación',
                dependencies: 'Dependencias',
                noAnalysisData: 'No hay datos de análisis disponibles para este archivo.',
                noDetailedAnalysis: 'No hay análisis detallado disponible.',
                fromCache: 'Desde Caché',
                cachedAt: 'Almacenado en',
                clearCache: 'Limpiar Caché',
                cacheCleared: 'Caché de análisis limpiado',
                cacheError: 'Error al cargar caché',
                confirmClearCache: '¿Está seguro de que desea limpiar el caché? Esto eliminará todos los análisis almacenados.',
                never: 'Nunca',
                
                // Node popup
                noDescription: 'No hay descripción disponible',
                
                // Status messages
                analyzing: 'Analizando archivo...',
                analysisFailed: 'Análisis fallido',
                diagramCleared: 'Diagrama y caché limpiados exitosamente',
                exportSuccess: 'Diagrama exportado exitosamente',
                exportFailed: 'Error al exportar diagrama',
                
                // Errors
                error: 'Error',
                pleaseEnterApiKey: 'Por favor ingrese una clave API',
                apiKeyNotConfigured: 'Clave API no configurada. Por favor configure su clave API de Gemini en la pestaña de Configuración.',
                failedToNavigate: 'Error al navegar',
                failedToAnalyze: 'Error al analizar archivo',
                failedToUpdate: 'Error al actualizar análisis',
                failedToToggle: 'Error al cambiar visibilidad del archivo',
                
                // API Key validation
                testConnection: 'Probar Conexión',
                testingConnection: 'Probando conexión...',
                connectionSuccess: '¡Conexión exitosa! La clave API es válida.',
                connectionFailed: 'Conexión fallida',
                
                // Model selection
                model: 'Modelo',
                modelFlash: 'Gemini 3 Flash (Lite) - Más Rápido',
                modelPro: 'Gemini 3 Pro - Más Detallado',
                modelSaved: 'Preferencia de modelo guardada',
                modelHelp: 'Flash es más rápido y económico, Pro proporciona análisis más detallado',
                updateDiagram: 'Actualizar Diagrama',
                loadingDiagramInfo: 'Cargando información, por favor espera...',
                
                // Security tab
                noSecurityAnalysis: 'No Hay Análisis de Seguridad Disponible',
                analyzeFilesPrompt: 'Analice algunos archivos para ver hallazgos de seguridad y calidad aquí.',
                analysisSummary: 'Resumen del Análisis',
                totalFindings: 'Hallazgos Totales',
                highSeverity: 'Severidad Alta',
                mediumSeverity: 'Severidad Media',
                lowSeverity: 'Severidad Baja',
                overallRiskLevel: 'Nivel de Riesgo General:',
                findings: 'Hallazgos',
                generateReport: 'Generar Reporte',
                riskCritical: 'Crítico',
                riskHigh: 'Alto',
                riskMedium: 'Medio',
                riskLow: 'Bajo',
                securityType: 'Seguridad',
                logicType: 'Lógica',
                bestPracticeType: 'Mejores Prácticas',
                aiExecutiveSummary: 'Resumen Ejecutivo IA',
                regenerate: 'Regenerar',
                generatingAISummary: 'Generando resumen con IA...',
                getRecommendation: 'Obtener Recomendación',
                recommendation: 'Recomendación',
                loadingRecommendation: 'Cargando recomendación...',
                navigateToCode: 'Ir al código'
            }
        };
        
        function t(key) {
            return translations[currentLanguage][key] || translations['en'][key];
        }
        
        function changeLanguage(lang) {
            currentLanguage = lang;
            localStorage.setItem('codeArchitectLanguage', lang);
            // Notify backend about language change
            vscode.postMessage({ command: 'changeLanguage', language: lang });
            updateUILanguage();
        }
        
        function updateUILanguage() {
            // Update tabs
            const diagramTab = document.querySelector('[data-tab="diagram"]');
            const settingsTab = document.querySelector('[data-tab="settings"]');
            const securityTab = document.querySelector('[data-tab="security"]');
            if (diagramTab) diagramTab.textContent = t('diagram');
            if (settingsTab) settingsTab.textContent = t('settings');
            if (securityTab) securityTab.textContent = t('security');
            
            // Update settings section titles
            const settingsTabContent = document.getElementById('settings-tab');
            if (settingsTabContent) {
                const settingsSectionTitles = settingsTabContent.querySelectorAll('.settings-section-title');
                console.log('Found settings section titles:', settingsSectionTitles.length);
                console.log('Translation for aiConfiguration:', t('aiConfiguration'));
                console.log('Translation for languageSettings:', t('languageSettings'));
                console.log('Translation for diagramType:', t('diagramType'));
                
                if (settingsSectionTitles.length >= 1) settingsSectionTitles[0].textContent = t('languageSettings');
                if (settingsSectionTitles.length >= 2) settingsSectionTitles[1].textContent = t('diagramType');
                if (settingsSectionTitles.length >= 3) settingsSectionTitles[2].textContent = t('aiConfiguration');
                
                console.log('Updated titles:');
                for (let i = 0; i < settingsSectionTitles.length; i++) {
                    console.log('  Title ' + i + ': "' + settingsSectionTitles[i].textContent + '"');
                }
            } else {
                console.error('Settings tab not found!');
            }
            
            // Update settings labels
            const displayLanguageLabel = document.querySelector('label[for="language"]');
            const apiKeyLabel = document.querySelector('label[for="api-key"]');
            if (displayLanguageLabel) displayLanguageLabel.textContent = t('displayLanguage');
            if (apiKeyLabel) apiKeyLabel.textContent = t('apiKey');
            
            // Update button text (only the text, keep icons)
            const buttonTexts = document.querySelectorAll('.button-text');
            if (buttonTexts.length >= 2) {
                buttonTexts[0].textContent = t('save');
                buttonTexts[1].textContent = t('clear');
            }
            
            // Update Test Connection button
            const testConnectionBtn = document.getElementById('test-connection-btn');
            if (testConnectionBtn) {
                const testBtnText = testConnectionBtn.querySelector('.button-text');
                if (testBtnText) testBtnText.textContent = t('testConnection');
            }
            
            // Update input placeholders
            const apiKeyInput = document.getElementById('api-key');
            if (apiKeyInput) apiKeyInput.placeholder = t('enterApiKey');
            
            // Update model selector
            const modelLabel = document.querySelector('label[for="model"]');
            if (modelLabel) modelLabel.textContent = t('model');
            
            const modelSelect = document.getElementById('model');
            if (modelSelect) {
                const options = modelSelect.querySelectorAll('option');
                if (options.length >= 2) {
                    options[0].textContent = t('modelFlash');
                    options[1].textContent = t('modelPro');
                }
            }
            
            // Update help texts - use more specific selectors
            // Find the help-text that is inside the same form-group-compact as the model select
            const modelFormGroup = document.querySelector('#model')?.closest('.form-group-compact');
            const apiKeyHelpText = modelFormGroup?.querySelector('.help-text');
            if (apiKeyHelpText) {
                apiKeyHelpText.innerHTML = '<a href="https://aistudio.google.com/app/apikey" target="_blank">' + t('getApiKey') + ' Google AI Studio</a>';
            }
            
            // Update left menu title
            const leftMenuTitle = document.querySelector('.left-menu-title');
            if (leftMenuTitle) leftMenuTitle.textContent = t('analyzedFiles');
            
            // Update export button
            const exportButton = document.querySelector('.export-button');
            if (exportButton) exportButton.innerHTML = '📤 ' + t('export');
            
            // Update export menu items
            const exportMenuItems = document.querySelectorAll('.export-menu-item');
            if (exportMenuItems.length >= 4) {
                exportMenuItems[0].innerHTML = '<span class="export-menu-item-icon">🖼️</span>' + t('exportAsPNG');
                exportMenuItems[1].innerHTML = '<span class="export-menu-item-icon">📐</span>' + t('exportAsSVG');
                exportMenuItems[2].innerHTML = '<span class="export-menu-item-icon">📊</span>' + t('exportAsMermaid');
                exportMenuItems[3].innerHTML = '<span class="export-menu-item-icon">📄</span>' + t('exportAsJSON');
            }
            
            // Update zoom button titles
            const zoomButtons = document.querySelectorAll('.zoom-button');
            if (zoomButtons.length >= 3) {
                zoomButtons[0].title = t('zoomIn');
                zoomButtons[1].title = t('zoomOut');
                zoomButtons[2].title = t('reset');
            }
            
            // Update context menu
            const contextMenuItems = document.querySelectorAll('.context-menu-item');
            if (contextMenuItems.length >= 2) {
                contextMenuItems[0].textContent = t('analyze');
                contextMenuItems[1].textContent = t('updateAnalysis');
            }
            
            // Update explanation and warnings titles
            const explanationTitle = document.querySelector('.explanation-title');
            const warningsTitle = document.querySelector('.warnings-title');
            if (explanationTitle) explanationTitle.textContent = '📝 ' + t('codeExplanation');
            if (warningsTitle) warningsTitle.textContent = '⚠️ ' + t('warnings');
            
            // Update security tab
            const emptyStateTitle = document.querySelector('.empty-state-title');
            const emptyStateMessage = document.querySelector('.empty-state-message');
            if (emptyStateTitle) emptyStateTitle.textContent = t('noSecurityAnalysis');
            if (emptyStateMessage) emptyStateMessage.textContent = t('analyzeFilesPrompt');
            
            // Update all elements with data-i18n attribute
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (key) {
                    // Preserve emojis and icons at the start
                    const currentText = element.textContent || '';
                    const emojiMatch = currentText.match(/^([\u{1F300}-\u{1F9FF}][\u{FE00}-\u{FE0F}]?|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])\s*/u);
                    const emoji = emojiMatch ? emojiMatch[0] : '';
                    element.textContent = emoji + t(key);
                }
            });
            
            const statLabels = document.querySelectorAll('.stat-label');
            if (statLabels.length >= 4) {
                statLabels[0].textContent = t('totalFindings');
                statLabels[1].textContent = t('highSeverity');
                statLabels[2].textContent = t('mediumSeverity');
                statLabels[3].textContent = t('lowSeverity');
            }
            
            const riskLevelLabel = document.querySelector('.risk-level-label');
            if (riskLevelLabel) riskLevelLabel.textContent = t('overallRiskLevel');
            
            // Update analysis summary title with emoji
            const analysisSummaryTitle = document.querySelector('.summary-header h3[data-i18n="analysisSummary"]');
            if (analysisSummaryTitle) analysisSummaryTitle.textContent = '📊 ' + t('analysisSummary');
            
            // Update quality report button
            const generateQualityReportBtn = document.querySelector('#generate-quality-report-btn .button-text');
            if (generateQualityReportBtn) generateQualityReportBtn.textContent = 'Report';
            
            // Update AI report section
            const aiReportHeaders = document.querySelectorAll('.ai-report-header h4');
            if (aiReportHeaders.length > 0) aiReportHeaders[0].textContent = '🤖 ' + t('aiExecutiveSummary');
            
            const regenerateBtnText = document.querySelector('.button-regenerate .button-text');
            if (regenerateBtnText) regenerateBtnText.textContent = t('regenerate');
            
            const loadingText = document.querySelector('.loading-text');
            if (loadingText) loadingText.textContent = t('generatingAISummary');
        }
        
        // Load saved language
        const savedLanguage = localStorage.getItem('codeArchitectLanguage');
        console.log('[Webview] Saved language from localStorage:', savedLanguage);
        if (savedLanguage) {
            currentLanguage = savedLanguage;
            const languageSelect = document.getElementById('language-select');
            if (languageSelect) {
                languageSelect.value = savedLanguage;
            }
            console.log('[Webview] Current language set to:', currentLanguage);
        } else {
            console.log('[Webview] No saved language, using default:', currentLanguage);
        }
        
        // Event listeners configured in window.load event listener

        // Tab switching - configured in window.load event listener

        function switchTab(tab) {
            console.log('[Webview] switchTab called with:', tab);
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            const tabButton = document.querySelector(`[data-tab="${tab}"]`);
            const tabContent = document.getElementById(`${tab}-tab`);
            
            console.log('[Webview] Tab button found:', tabButton);
            console.log('[Webview] Tab content found:', tabContent);
            
            if (tabButton) {
                tabButton.classList.add('active');
            }
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            // Update language when switching to settings tab
            if (tab === 'settings') {
                updateUILanguage();
            }
            
            vscode.postMessage({ command: 'switchTab', tab: tab });
        }

        function saveAPIKey() {
            const apiKey = document.getElementById('api-key').value;
            if (!apiKey) {
                showStatusMessage(t('pleaseEnterApiKey'), 'error');
                return;
            }
            vscode.postMessage({ command: 'saveAPIKey', apiKey: apiKey });
        }

        function clearAPIKey() {
            vscode.postMessage({ command: 'clearAPIKey' });
            document.getElementById('api-key').value = '';
        }

        function testConnection() {
            const apiKey = document.getElementById('api-key').value;
            const statusDiv = document.getElementById('connection-status');
            const testBtn = document.getElementById('test-connection-btn');
            
            if (!apiKey) {
                statusDiv.textContent = t('pleaseEnterApiKey');
                statusDiv.className = 'connection-status visible error';
                return;
            }
            
            // Show loading state
            statusDiv.textContent = t('testingConnection');
            statusDiv.className = 'connection-status visible loading';
            testBtn.disabled = true;
            
            // Send message to extension to validate API key
            vscode.postMessage({ command: 'validateAPIKey', apiKey: apiKey });
        }

        function saveModel(model) {
            vscode.postMessage({ command: 'saveModel', model: model });
            showStatusMessage(t('modelSaved'), 'success');
        }

        function showDiagramLoader() {
            const loader = document.getElementById('diagram-loading');
            if (loader) {
                loader.classList.add('visible');
            }
        }

        function hideDiagramLoader() {
            const loader = document.getElementById('diagram-loading');
            if (loader) {
                loader.classList.remove('visible');
            }
        }

        function showAnalysisModal(fileName) {
            const modal = document.getElementById('analysis-modal');
            const status = document.getElementById('analysis-status');
            if (modal && status) {
                status.textContent = fileName ? `Analyzing ${fileName}` : 'Analyzing...';
                modal.classList.add('visible');
            }
        }

        function hideAnalysisModal() {
            const modal = document.getElementById('analysis-modal');
            if (modal) {
                modal.classList.remove('visible');
            }
        }

        function generateSecurityReport() {
            // Generate HTML report
            vscode.postMessage({ command: 'generateHTMLReport' });
        }

        function analyzeCodeQuality() {
            console.log('[Webview] Analyzing code quality...');
            
            const analyzeQualityBtn = document.getElementById('analyze-quality-btn');
            if (analyzeQualityBtn) {
                analyzeQualityBtn.disabled = true;
                analyzeQualityBtn.innerHTML = '<span class="button-icon">⏳</span><span class="button-text">Analizando...</span>';
            }
            
            // Request quality analysis from backend
            vscode.postMessage({ 
                command: 'analyzeCodeQuality'
            });
        }

        function regenerateAIReport() {
            // Get current findings from the summary
            const findingsList = document.getElementById('findings-list');
            if (!findingsList || findingsList.children.length === 0) {
                console.warn('[Webview] No findings available to regenerate report');
                return;
            }
            
            // Show loading state
            displayAIReport('loading');
            
            // Send message with current findings
            vscode.postMessage({ 
                command: 'regenerateAIReport',
                findings: currentFindings || []
            });
        }

        function displayAIReport(report) {
            const aiReportSection = document.getElementById('ai-report-section');
            const aiReportLoading = document.getElementById('ai-report-loading');
            const aiReportText = document.getElementById('ai-report-text');
            const regenerateBtn = document.getElementById('regenerate-btn');

            // Show section
            aiReportSection.style.display = 'block';

            if (report === 'loading') {
                // Show loading state
                aiReportLoading.style.display = 'flex';
                aiReportText.style.display = 'none';
                regenerateBtn.disabled = true;
            } else {
                // Show report
                aiReportLoading.style.display = 'none';
                aiReportText.style.display = 'block';
                aiReportText.textContent = report;
                regenerateBtn.disabled = false;
            }
        }

        function updateSecurityUI(summary) {
            console.log('[Webview] updateSecurityUI called with:', summary);
            
            const emptyState = document.getElementById('security-empty-state');
            const content = document.getElementById('security-content');
            
            if (!summary || summary.totalFindings === 0) {
                console.log('[Webview] No security findings, showing empty state');
                if (emptyState) emptyState.style.display = 'flex';
                if (content) content.style.display = 'none';
                return;
            }

            console.log('[Webview] Displaying', summary.totalFindings, 'security findings');
            
            // Hide empty state, show content
            if (emptyState) emptyState.style.display = 'none';
            if (content) content.style.display = 'flex';

            // Store findings for regeneration
            currentFindings = summary.findings || [];

            // Update statistics
            document.getElementById('total-findings').textContent = summary.totalFindings;
            document.getElementById('high-severity').textContent = summary.highSeverity;
            document.getElementById('medium-severity').textContent = summary.mediumSeverity;
            document.getElementById('low-severity').textContent = summary.lowSeverity;

            // Update risk level badge
            const riskBadge = document.getElementById('risk-level-badge');
            riskBadge.textContent = t('risk' + summary.riskLevel.charAt(0).toUpperCase() + summary.riskLevel.slice(1));
            riskBadge.className = 'risk-level-badge ' + summary.riskLevel;

            // Update findings list with grouped display
            const findingsList = document.getElementById('findings-list');
            
            if (findingsList) {
                findingsList.innerHTML = '';

                // Use grouped findings if available, otherwise fall back to flat list
                if (summary.groupedFindings && Object.keys(summary.groupedFindings).length > 0) {
                    // Display grouped by file with accordion
                    Object.keys(summary.groupedFindings).forEach(file => {
                        const fileGroup = summary.groupedFindings[file];
                        
                        // Extract filename for display
                        const pathParts = file.split('/');
                        const pathParts2 = pathParts[pathParts.length - 1].split('\\\\');
                        const fileName = pathParts2[pathParts2.length - 1] || file;
                        
                        // Count total findings for this file
                        const totalFileFindings = (fileGroup.security?.length || 0) + 
                                                 (fileGroup.logic?.length || 0) + 
                                                 (fileGroup.bestPractice?.length || 0);
                        
                        // Create file header (accordion button)
                        const fileHeader = document.createElement('div');
                        fileHeader.className = 'findings-file-header';
                        fileHeader.innerHTML = '<h4><span class="accordion-icon">▶</span>📄 ' + fileName + ' (' + totalFileFindings + ')</h4>';
                        
                        // Create content container
                        const fileContent = document.createElement('div');
                        fileContent.className = 'findings-file-content';
                        
                        // Display findings by type within this file
                        ['security', 'logic', 'bestPractice'].forEach(type => {
                            const typedFindings = fileGroup[type] || [];
                            
                            if (typedFindings.length > 0) {
                                // Create type subheader
                                const typeHeader = document.createElement('div');
                                typeHeader.className = 'findings-type-header';
                                const typeLabel = type === 'security' ? '🔐 Security' : 
                                                type === 'logic' ? '⚠️ Logic' : 
                                                '✨ Best Practices';
                                typeHeader.innerHTML = '<h5>' + typeLabel + ' (' + typedFindings.length + ')</h5>';
                                fileContent.appendChild(typeHeader);
                                
                                // Display findings of this type
                                typedFindings.forEach(finding => {
                                    const findingCard = createFindingCard(finding);
                                    fileContent.appendChild(findingCard);
                                });
                            }
                        });
                        
                        // Add click handler for accordion
                        fileHeader.onclick = () => {
                            fileHeader.classList.toggle('collapsed');
                            fileContent.classList.toggle('collapsed');
                        };
                        
                        findingsList.appendChild(fileHeader);
                        findingsList.appendChild(fileContent);
                    });
                } else {
                    // Fallback: display flat list
                    summary.findings.forEach(finding => {
                        const findingCard = createFindingCard(finding);
                        findingsList.appendChild(findingCard);
                    });
                }
            }
        }

        function createFindingCard(finding) {
            const findingCard = document.createElement('div');
            findingCard.className = 'finding-item ' + finding.severity;

            const findingHeader = document.createElement('div');
            findingHeader.className = 'finding-header';

            const severityBadge = document.createElement('span');
            severityBadge.className = 'finding-severity ' + finding.severity;
            severityBadge.textContent = finding.severity.toUpperCase();

            findingHeader.appendChild(severityBadge);

            const findingMessage = document.createElement('div');
            findingMessage.className = 'finding-message';
            findingMessage.textContent = finding.message;

            const findingFile = document.createElement('div');
            findingFile.className = 'finding-file';
            
            // Extract just the filename from the path
            const fullPath = finding.file + (finding.line ? ':' + finding.line : '');
            const pathParts = finding.file.split('/');
            const pathParts2 = pathParts[pathParts.length - 1].split('\\\\');
            const fileName = pathParts2[pathParts2.length - 1] || finding.file;
            const displayText = (finding.line ? 'Line ' + finding.line : 'File');
            
            findingFile.textContent = displayText;
            findingFile.title = fullPath;

            // Add recommendation button and panel
            const findingActions = document.createElement('div');
            findingActions.className = 'finding-actions';

            // Add navigation button
            const navigateBtn = document.createElement('button');
            navigateBtn.className = 'navigate-to-code-btn';
            navigateBtn.innerHTML = '📍 ' + t('navigateToCode');
            navigateBtn.title = t('navigateToCode');
            navigateBtn.onclick = () => {
                vscode.postMessage({
                    command: 'navigateToCode',
                    file: finding.file,
                    line: finding.line
                });
            };

            const recommendationBtn = document.createElement('button');
            recommendationBtn.className = 'button-recommendation';
            recommendationBtn.innerHTML = '💡 ' + t('getRecommendation');
            
            const recommendationPanel = document.createElement('div');
            recommendationPanel.className = 'recommendation-panel';
            
            recommendationBtn.onclick = () => requestRecommendation(finding, recommendationBtn, recommendationPanel);

            findingActions.appendChild(navigateBtn);
            findingActions.appendChild(recommendationBtn);

            findingCard.appendChild(findingHeader);
            findingCard.appendChild(findingMessage);
            findingCard.appendChild(findingFile);
            findingCard.appendChild(findingActions);
            findingCard.appendChild(recommendationPanel);

            return findingCard;
        }

        function requestRecommendation(finding, button, panel) {
            // Show loading state
            panel.className = 'recommendation-panel visible';
            panel.innerHTML = '<div class="recommendation-loading"><div class="loading-spinner"></div>' + t('loadingRecommendation') + '</div>';
            button.disabled = true;

            // Request recommendation from backend
            vscode.postMessage({ 
                command: 'getRecommendation', 
                finding: finding,
                panelId: finding.file + '-' + finding.line
            });
        }

        function displayRecommendation(recommendation, panelId) {
            // Find all recommendation panels and update the matching one
            const panels = document.querySelectorAll('.recommendation-panel');
            panels.forEach(panel => {
                const card = panel.closest('.finding-item');
                if (card) {
                    const fileDiv = card.querySelector('.finding-file');
                    if (fileDiv && fileDiv.textContent.includes(panelId.split('-')[0])) {
                        panel.innerHTML = '<div class="recommendation-text">' + recommendation + '</div>';
                        const button = card.querySelector('.button-recommendation');
                        if (button) button.disabled = false;
                    }
                }
            });
        }

        function showStatusMessage(message, type) {
            const statusDiv = document.getElementById('status-message');
            statusDiv.innerHTML = '';
            const messageEl = document.createElement('div');
            messageEl.className = `${type}-message`;
            messageEl.textContent = message;
            statusDiv.appendChild(messageEl);
            setTimeout(() => messageEl.remove(), 3000);
        }

        function updateQualityUI(result) {
            console.log('[Webview] updateQualityUI called with:', result);
            
            // Re-enable button
            const analyzeQualityBtn = document.getElementById('analyze-quality-btn');
            if (analyzeQualityBtn) {
                analyzeQualityBtn.disabled = false;
                analyzeQualityBtn.innerHTML = '<span class="button-icon">🔍</span><span class="button-text">Analizar Calidad</span>';
            }
            
            if (!result || (
                (!result.bugs || result.bugs.length === 0) && 
                (!result.improvements || result.improvements.length === 0) && 
                (!result.performance || result.performance.length === 0) && 
                (!result.bestPractices || result.bestPractices.length === 0)
            )) {
                console.log('[Webview] No quality issues found');
                // Don't return - still show the empty state with 0 counts
                document.getElementById('quality-empty-state').style.display = 'none';
                document.getElementById('quality-content').style.display = 'block';
            } else {
                // Hide empty state, show content
                document.getElementById('quality-empty-state').style.display = 'none';
                document.getElementById('quality-content').style.display = 'block';
            }

            console.log('[Webview] Displaying quality issues:', {
                bugs: (result.bugs || []).length,
                improvements: (result.improvements || []).length,
                performance: (result.performance || []).length,
                bestPractices: (result.bestPractices || []).length
            });

            // Show quality report button
            const generateQualityReportBtn = document.getElementById('generate-quality-report-btn');
            if (generateQualityReportBtn) {
                generateQualityReportBtn.style.display = 'flex';
            }

            // Update statistics
            const bugCount = (result.bugs || []).length;
            const improvementCount = (result.improvements || []).length;
            const performanceCount = (result.performance || []).length;
            const bestPracticesCount = (result.bestPractices || []).length;
            const totalIssues = bugCount + improvementCount + performanceCount + bestPracticesCount;
            
            // Calculate quality score matching QualityAnalysisManager formula
            // Score: 100 - (bugs * 10 + improvements * 5 + performance * 7 + bestPractices * 3)
            const qualityScore = Math.max(0, 100 - (
                bugCount * 10 + 
                improvementCount * 5 + 
                performanceCount * 7 + 
                bestPracticesCount * 3
            ));
            
            document.getElementById('quality-score').textContent = qualityScore;
            document.getElementById('improvement-count').textContent = improvementCount;
            document.getElementById('bug-count').textContent = bugCount;

            // Update bugs list
            const bugsList = document.getElementById('bugs-list');
            bugsList.innerHTML = '';
            if (result.bugs && result.bugs.length > 0) {
                result.bugs.forEach(bug => {
                    bugsList.appendChild(createQualityItem(bug));
                });
            } else {
                bugsList.innerHTML = '<p style="color: #858585; font-size: 12px;">No se encontraron posibles bugs</p>';
            }

            // Update improvements list
            const improvementsList = document.getElementById('improvements-list');
            improvementsList.innerHTML = '';
            if (result.improvements && result.improvements.length > 0) {
                result.improvements.forEach(improvement => {
                    improvementsList.appendChild(createQualityItem(improvement));
                });
            } else {
                improvementsList.innerHTML = '<p style="color: #858585; font-size: 12px;">No se encontraron oportunidades de mejora</p>';
            }

            // Update performance list
            const performanceList = document.getElementById('performance-list');
            performanceList.innerHTML = '';
            if (result.performance && result.performance.length > 0) {
                result.performance.forEach(perf => {
                    performanceList.appendChild(createQualityItem(perf));
                });
            } else {
                performanceList.innerHTML = '<p style="color: #858585; font-size: 12px;">No se encontraron problemas de rendimiento</p>';
            }

            // Update best practices list
            const bestPracticesList = document.getElementById('best-practices-list');
            bestPracticesList.innerHTML = '';
            if (result.bestPractices && result.bestPractices.length > 0) {
                result.bestPractices.forEach(practice => {
                    bestPracticesList.appendChild(createQualityItem(practice));
                });
            } else {
                bestPracticesList.innerHTML = '<p style="color: #858585; font-size: 12px;">El código sigue las mejores prácticas</p>';
            }

            showStatusMessage('Análisis de calidad completado', 'success');
        }

        function createQualityItem(item) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'quality-item';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'quality-item-header';

            const severitySpan = document.createElement('span');
            severitySpan.className = 'quality-item-severity ' + (item.severity || 'medium');
            severitySpan.textContent = (item.severity || 'medium').toUpperCase();

            const titleDiv = document.createElement('div');
            titleDiv.className = 'quality-item-title';
            titleDiv.textContent = item.title || item.message;

            headerDiv.appendChild(severitySpan);
            headerDiv.appendChild(titleDiv);

            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'quality-item-description';
            descriptionDiv.textContent = item.description || item.message;

            itemDiv.appendChild(headerDiv);
            itemDiv.appendChild(descriptionDiv);

            if (item.file) {
                const fileSpan = document.createElement('span');
                fileSpan.className = 'quality-item-file';
                fileSpan.innerHTML = '📄 ' + item.file + (item.line ? ':' + item.line : '');
                itemDiv.appendChild(fileSpan);

                // Add navigation button
                const navigateBtn = document.createElement('button');
                navigateBtn.className = 'navigate-to-code-btn';
                navigateBtn.innerHTML = '📍 ' + t('navigateToCode');
                navigateBtn.title = t('navigateToCode');
                navigateBtn.style.marginTop = '8px';
                navigateBtn.onclick = () => {
                    vscode.postMessage({
                        command: 'navigateToCode',
                        file: item.file,
                        line: item.line
                    });
                };
                itemDiv.appendChild(navigateBtn);
            }

            if (item.suggestion) {
                const suggestionDiv = document.createElement('div');
                suggestionDiv.className = 'quality-item-suggestion';
                
                const suggestionTitle = document.createElement('div');
                suggestionTitle.className = 'quality-item-suggestion-title';
                suggestionTitle.textContent = '💡 Sugerencia:';
                
                const suggestionText = document.createElement('div');
                suggestionText.className = 'quality-item-suggestion-text';
                suggestionText.textContent = item.suggestion;
                
                suggestionDiv.appendChild(suggestionTitle);
                suggestionDiv.appendChild(suggestionText);
                itemDiv.appendChild(suggestionDiv);
            }

            return itemDiv;
        }

        function applyDiagramPositions(positions) {
            if (!diagramRenderer || !diagramRenderer.nodes) {
                console.log('[Webview] Cannot apply positions: diagram renderer not ready');
                return;
            }

            console.log('[Webview] Applying saved diagram positions:', positions);
            
            // Apply positions to nodes
            Object.keys(positions).forEach(nodeId => {
                const node = diagramRenderer.nodes.get(nodeId);
                if (node && positions[nodeId]) {
                    node.x = positions[nodeId].x;
                    node.y = positions[nodeId].y;
                    console.log(`[Webview] Applied position to node ${nodeId}: x=${node.x}, y=${node.y}`);
                }
            });

            // Redraw the diagram with updated positions
            if (diagramRenderer.draw) {
                diagramRenderer.draw();
            }
        }

        function initializeDiagramRenderer() {
            const svg = document.getElementById('diagram-svg');
            if (!svg || diagramRenderer) return;

            diagramRenderer = {
                svg: svg,
                nodes: new Map(),
                edges: [],

                render: function(diagramData) {
                    if (!diagramData || !diagramData.nodes) return;
                    console.log('Render called with diagramData:', diagramData);
                    console.log('Edges in diagramData:', diagramData.edges);
                    console.log('Layout mode:', diagramData.layoutMode);
                    this.nodes.clear();
                    diagramData.nodes.forEach(node => {
                        // Use saved position if available, otherwise will be calculated in organizeLayers
                        this.nodes.set(node.id, node);
                    });
                    this.edges = diagramData.edges || [];
                    this.layoutMode = diagramData.layoutMode || 'auto';
                    this.groups = diagramData.groups || [];
                    console.log('Edges assigned to renderer:', this.edges);
                    this.draw();
                },

                draw: function() {
                    this.svg.innerHTML = '';
                    const svgNS = 'http://www.w3.org/2000/svg';
                    const width = this.svg.parentElement?.clientWidth || 800;
                    const height = this.svg.parentElement?.clientHeight || 400;
                    
                    this.svg.setAttribute('width', width);
                    this.svg.setAttribute('height', height);
                    
                    // Only set viewBox if it doesn't exist yet (preserve pan position)
                    if (!this.svg.hasAttribute('viewBox') || this.svg.getAttribute('viewBox') === '') {
                        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
                    }
                    
                    // Organize nodes by layers
                    this.organizeLayers(width, height);
                    
                    // Arrow marker and filters - must be added BEFORE the g element
                    const defs = document.createElementNS(svgNS, 'defs');
                    const marker = document.createElementNS(svgNS, 'marker');
                    marker.setAttribute('id', 'arrowhead');
                    marker.setAttribute('markerWidth', '10');
                    marker.setAttribute('markerHeight', '10');
                    marker.setAttribute('refX', '5');
                    marker.setAttribute('refY', '3');
                    marker.setAttribute('orient', 'auto');
                    const polygon = document.createElementNS(svgNS, 'polygon');
                    polygon.setAttribute('points', '0 0, 6 3, 0 6');
                    polygon.setAttribute('fill', '#555555');
                    marker.appendChild(polygon);
                    defs.appendChild(marker);
                    
                    // Glow filter for current file
                    const filter = document.createElementNS(svgNS, 'filter');
                    filter.setAttribute('id', 'glow');
                    filter.setAttribute('x', '-50%');
                    filter.setAttribute('y', '-50%');
                    filter.setAttribute('width', '200%');
                    filter.setAttribute('height', '200%');
                    
                    const feGaussianBlur = document.createElementNS(svgNS, 'feGaussianBlur');
                    feGaussianBlur.setAttribute('stdDeviation', '3');
                    feGaussianBlur.setAttribute('result', 'coloredBlur');
                    filter.appendChild(feGaussianBlur);
                    
                    const feMerge = document.createElementNS(svgNS, 'feMerge');
                    const feMergeNode1 = document.createElementNS(svgNS, 'feMergeNode');
                    feMergeNode1.setAttribute('in', 'coloredBlur');
                    const feMergeNode2 = document.createElementNS(svgNS, 'feMergeNode');
                    feMergeNode2.setAttribute('in', 'SourceGraphic');
                    feMerge.appendChild(feMergeNode1);
                    feMerge.appendChild(feMergeNode2);
                    filter.appendChild(feMerge);
                    
                    defs.appendChild(filter);
                    this.svg.appendChild(defs);
                    
                    const g = document.createElementNS(svgNS, 'g');
                    
                    // Helper function to get connection point on a node
                    const getConnectionPoint = (node, side) => {
                        const nodeWidth = 120;
                        const nodeHeight = 60;
                        switch(side) {
                            case 'top':
                                return { x: node.x + nodeWidth / 2, y: node.y };
                            case 'bottom':
                                return { x: node.x + nodeWidth / 2, y: node.y + nodeHeight };
                            case 'left':
                                return { x: node.x, y: node.y + nodeHeight / 2 };
                            case 'right':
                                return { x: node.x + nodeWidth, y: node.y + nodeHeight / 2 };
                            default:
                                return { x: node.x + nodeWidth / 2, y: node.y + nodeHeight / 2 };
                        }
                    };
                    
                    // Helper function to determine best connection sides based on relative position
                    const getBestConnectionSides = (sourceNode, targetNode) => {
                        const dx = targetNode.x - sourceNode.x;
                        const dy = targetNode.y - sourceNode.y;
                        
                        let sourceSide, targetSide;
                        
                        // Determine primary direction
                        if (Math.abs(dx) > Math.abs(dy)) {
                            // Horizontal connection is primary
                            if (dx > 0) {
                                sourceSide = 'right';
                                targetSide = 'left';
                            } else {
                                sourceSide = 'left';
                                targetSide = 'right';
                            }
                        } else {
                            // Vertical connection is primary
                            if (dy > 0) {
                                sourceSide = 'bottom';
                                targetSide = 'top';
                            } else {
                                sourceSide = 'top';
                                targetSide = 'bottom';
                            }
                        }
                        
                        return { sourceSide, targetSide };
                    };
                    
                    // Debug: log edges
                    console.log('Drawing edges:', this.edges.length, this.edges);
                    console.log('Available nodes:', Array.from(this.nodes.keys()));
                    
                    // Draw edges FIRST (so they appear behind nodes)
                    for (const edge of this.edges) {
                        const sourceNode = this.nodes.get(edge.source);
                        const targetNode = this.nodes.get(edge.target);
                        
                        console.log('Edge:', edge.source, '->', edge.target, 'Found:', !!sourceNode, !!targetNode);
                        
                        if (!sourceNode || !targetNode) continue;
                        
                        // Get best connection sides
                        const { sourceSide, targetSide } = getBestConnectionSides(sourceNode, targetNode);
                        const sourcePoint = getConnectionPoint(sourceNode, sourceSide);
                        const targetPoint = getConnectionPoint(targetNode, targetSide);
                        
                        const line = document.createElementNS(svgNS, 'line');
                        line.setAttribute('x1', sourcePoint.x);
                        line.setAttribute('y1', sourcePoint.y);
                        line.setAttribute('x2', targetPoint.x);
                        line.setAttribute('y2', targetPoint.y);
                        line.setAttribute('stroke', '#00ff00');
                        line.setAttribute('stroke-width', '3');
                        line.setAttribute('marker-end', 'url(#arrowhead)');
                        g.appendChild(line);
                        console.log('Drew line from', sourceNode.label, 'to', targetNode.label);
                    }
                    
                    // Draw nodes as rectangles
                    for (const [nodeId, node] of this.nodes) {
                        const isCurrentFile = node.isCurrentFile === true;
                        const isAnalyzed = node.isAnalyzed === true;
                        
                        // Determine colors based on analysis status
                        let strokeColor = '#555555';  // Gray for unanalyzed dependencies
                        let fillColor = '#2d2d30';
                        let textColor = '#cccccc';
                        let filterId = '';
                        
                        if (isCurrentFile) {
                            // Current file being analyzed: bright blue with glow
                            strokeColor = '#007acc';
                            fillColor = '#1a3a52';
                            textColor = '#e0e0e0';
                            filterId = 'glow';
                        } else if (isAnalyzed) {
                            // Previously analyzed file: blue without glow
                            strokeColor = '#007acc';
                            fillColor = '#1a3a52';
                            textColor = '#e0e0e0';
                        }
                        // else: unanalyzed dependency stays gray (default colors)
                        
                        const rect = document.createElementNS(svgNS, 'rect');
                        rect.setAttribute('x', node.x);
                        rect.setAttribute('y', node.y);
                        rect.setAttribute('width', '120');
                        rect.setAttribute('height', '60');
                        rect.setAttribute('fill', fillColor);
                        rect.setAttribute('stroke', strokeColor);
                        rect.setAttribute('stroke-width', isCurrentFile ? '3' : (isAnalyzed ? '2' : '2'));
                        rect.setAttribute('rx', '4');
                        rect.setAttribute('data-node-id', nodeId);
                        if (filterId) {
                            rect.setAttribute('filter', 'url(#' + filterId + ')');
                        }
                        rect.style.cursor = 'pointer';
                        g.appendChild(rect);
                        
                        // Label
                        const text = document.createElementNS(svgNS, 'text');
                        text.setAttribute('x', node.x + 60);
                        text.setAttribute('y', node.y + 22);
                        text.setAttribute('text-anchor', 'middle');
                        text.setAttribute('fill', textColor);
                        text.setAttribute('font-size', '11');
                        text.setAttribute('font-weight', 'bold');
                        text.setAttribute('pointer-events', 'none');
                        const label = node.label.length > 14 ? node.label.substring(0, 12) + '...' : node.label;
                        text.textContent = label;
                        g.appendChild(text);
                    }
                    
                    this.svg.appendChild(g);
                },

                organizeLayers: function(width, height) {
                    const nodesArray = Array.from(this.nodes.values());
                    const nodeCount = nodesArray.length;
                    
                    // Apply layout based on mode
                    if (this.layoutMode === 'hierarchical' || this.layoutMode === 'ai') {
                        this.applyHierarchicalLayout(nodesArray, width, height);
                    } else {
                        // Default auto layout (grid)
                        this.applyGridLayout(nodesArray, width, height);
                    }
                },
                
                applyGridLayout: function(nodesArray, width, height) {
                    const nodeCount = nodesArray.length;
                    const cols = Math.ceil(Math.sqrt(nodeCount));
                    const rows = Math.ceil(nodeCount / cols);
                    
                    const horizontalSpacing = 180;
                    const verticalSpacing = 140;
                    
                    const gridWidth = cols * horizontalSpacing;
                    const gridHeight = rows * verticalSpacing;
                    const startX = Math.max(20, (width - gridWidth) / 2);
                    const startY = 50;
                    
                    nodesArray.forEach((node, index) => {
                        // Only set position if not already set
                        if (node.x === undefined || node.y === undefined) {
                            const col = index % cols;
                            const row = Math.floor(index / cols);
                            node.x = startX + col * horizontalSpacing;
                            node.y = startY + row * verticalSpacing;
                        }
                    });
                },
                
                applyHierarchicalLayout: function(nodesArray, width, height) {
                    // Group nodes by level if groups are provided (from AI)
                    const nodesByLevel = new Map();
                    
                    if (this.groups && this.groups.length > 0) {
                        // Use AI-provided groups
                        this.groups.forEach(group => {
                            if (!nodesByLevel.has(group.level)) {
                                nodesByLevel.set(group.level, []);
                            }
                            group.nodes.forEach(nodeId => {
                                const node = this.nodes.get(nodeId);
                                if (node) {
                                    nodesByLevel.get(group.level).push(node);
                                }
                            });
                        });
                        
                        // Add ungrouped nodes to level 0
                        nodesArray.forEach(node => {
                            let found = false;
                            for (const group of this.groups) {
                                if (group.nodes.includes(node.id)) {
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                if (!nodesByLevel.has(0)) {
                                    nodesByLevel.set(0, []);
                                }
                                nodesByLevel.get(0).push(node);
                            }
                        });
                    } else {
                        // Simple hierarchical layout based on dependencies
                        // Level 0: nodes with no incoming edges
                        // Level 1: nodes that depend on level 0
                        // etc.
                        const incomingEdges = new Map();
                        nodesArray.forEach(node => incomingEdges.set(node.id, 0));
                        
                        this.edges.forEach(edge => {
                            const count = incomingEdges.get(edge.target) || 0;
                            incomingEdges.set(edge.target, count + 1);
                        });
                        
                        // Assign levels
                        nodesArray.forEach(node => {
                            const level = incomingEdges.get(node.id) === 0 ? 0 : 1;
                            if (!nodesByLevel.has(level)) {
                                nodesByLevel.set(level, []);
                            }
                            nodesByLevel.get(level).push(node);
                        });
                    }
                    
                    // Position nodes by level
                    const verticalSpacing = 180;
                    const horizontalSpacing = 200;
                    const startY = 80;
                    
                    const levels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
                    
                    levels.forEach(level => {
                        const levelNodes = nodesByLevel.get(level);
                        const levelWidth = levelNodes.length * horizontalSpacing;
                        const startX = Math.max(50, (width - levelWidth) / 2);
                        const y = startY + level * verticalSpacing;
                        
                        levelNodes.forEach((node, index) => {
                            node.x = startX + index * horizontalSpacing;
                            node.y = y;
                        });
                    });
                }
            };

            svg.addEventListener('wheel', (e) => {
                e.preventDefault();
            });

            let isPanning = false;
            let panStartX = 0;
            let panStartY = 0;
            let viewBoxX = 0;
            let viewBoxY = 0;
            let isDragging = false;
            let hasMoved = false;

            svg.addEventListener('mousedown', (e) => {
                const rect = e.target;
                if (rect.tagName === 'rect' && rect.hasAttribute('data-node-id')) {
                    // Dragging a node
                    draggedNode = rect.getAttribute('data-node-id');
                    dragStartX = e.clientX;
                    dragStartY = e.clientY;
                    isDragging = true;
                    hasMoved = false;
                    e.preventDefault(); // Prevent text selection
                } else {
                    // Panning
                    isPanning = true;
                    panStartX = e.clientX;
                    panStartY = e.clientY;
                    const viewBox = svg.getAttribute('viewBox').split(' ');
                    viewBoxX = parseFloat(viewBox[0]);
                    viewBoxY = parseFloat(viewBox[1]);
                }
            });

            svg.addEventListener('mousemove', (e) => {
                if (draggedNode && isDragging) {
                    // Dragging a node
                    const node = diagramRenderer.nodes.get(draggedNode);
                    if (node) {
                        const deltaX = (e.clientX - dragStartX);
                        const deltaY = (e.clientY - dragStartY);
                        
                        // Mark as moved if moved more than 3 pixels
                        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                            hasMoved = true;
                        }
                        
                        node.x += deltaX;
                        node.y += deltaY;
                        dragStartX = e.clientX;
                        dragStartY = e.clientY;
                        diagramRenderer.draw();
                        // IMPORTANT: Reapply zoom after redrawing
                        applyZoom();
                    }
                } else if (isPanning) {
                    const deltaX = e.clientX - panStartX;
                    const deltaY = e.clientY - panStartY;
                    const viewBox = svg.getAttribute('viewBox').split(' ');
                    const width = parseFloat(viewBox[2]);
                    const height = parseFloat(viewBox[3]);
                    const newX = viewBoxX - (deltaX / svg.clientWidth) * width;
                    const newY = viewBoxY - (deltaY / svg.clientHeight) * height;
                    svg.setAttribute('viewBox', `${newX} ${newY} ${width} ${height}`);
                }
            });

            svg.addEventListener('mouseup', (e) => {
                if (isDragging && hasMoved) {
                    // Save node positions after drag (debounced)
                    const positions = {};
                    diagramRenderer.nodes.forEach((node, id) => {
                        positions[id] = { x: node.x, y: node.y };
                    });
                    debouncedSavePositions(positions);
                }
                isPanning = false;
                isDragging = false;
                draggedNode = null;
            });

            svg.addEventListener('mouseleave', () => {
                isPanning = false;
                isDragging = false;
                draggedNode = null;
            });

            svg.addEventListener('click', (e) => {
                // Only handle click if we didn't just drag
                if (hasMoved) {
                    hasMoved = false;
                    return;
                }
                
                const rect = e.target;
                if (rect.tagName === 'rect' && rect.hasAttribute('data-node-id')) {
                    const nodeId = rect.getAttribute('data-node-id');
                    const node = diagramRenderer.nodes.get(nodeId);
                    if (node) {
                        // If node is analyzed, show details panel instead of popup
                        if (node.isAnalyzed) {
                            showDetailsPanel(node);
                        } else {
                            showNodePopup(e, node);
                        }
                    }
                }
            });

            svg.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const rect = e.target;
                if (rect.tagName === 'rect' && rect.hasAttribute('data-node-id')) {
                    const nodeId = rect.getAttribute('data-node-id');
                    const node = diagramRenderer.nodes.get(nodeId);
                    if (node && !node.isCurrentFile) {
                        showContextMenu(e, node);
                    }
                }
            });
        }

        window.addEventListener('message', event => {
            const message = event.data;
            console.log('[Webview] Message received:', message.command, message);
            switch (message.command) {
                case 'updateDiagram':
                    // Show loading indicator
                    showDiagramLoader();
                    
                    currentDiagramData = message.data;
                    
                    // Store analysis data for details panel
                    if (message.analysisResult && message.analysisResult.currentFile) {
                        const fileName = message.analysisResult.currentFile.name;
                        const fileId = sanitizeId(fileName);
                        analysisDataMap.set(fileId, message.analysisResult);
                        analysisDataMap.set(fileName, message.analysisResult);
                    }
                    
                    // Update file visibility map and analyzed files list
                    if (message.analyzedFiles) {
                        updateAnalyzedFilesList(message.analyzedFiles);
                    }
                    
                    if (!diagramRenderer) {
                        initializeDiagramRenderer();
                    }
                    if (diagramRenderer && currentDiagramData) {
                        diagramRenderer.render(currentDiagramData);
                    }
                    
                    // Hide loading indicator
                    hideDiagramLoader();
                    
                    // Don't show explanation and warnings in the side view
                    // Users can see this information in the details panel when clicking on nodes
                    // if (message.analysisResult) {
                    //     displayExplanation(message.analysisResult);
                    //     displayWarnings(message.analysisResult);
                    // }
                    showStatusMessage(t('analysisComplete'), 'success');
                    break;
                case 'updateDiagramWithCache':
                    // Show loading indicator
                    showDiagramLoader();
                    
                    currentDiagramData = message.data;
                    
                    // Store ALL analysis data from cache
                    if (message.analyses && Array.isArray(message.analyses)) {
                        message.analyses.forEach(item => {
                            if (item.analysis && item.analysis.currentFile) {
                                const fileName = item.analysis.currentFile.name;
                                const fileId = sanitizeId(fileName);
                                analysisDataMap.set(fileId, item.analysis);
                                analysisDataMap.set(fileName, item.analysis);
                            }
                        });
                    }
                    
                    // Update file visibility map and analyzed files list
                    if (message.analyzedFiles) {
                        updateAnalyzedFilesList(message.analyzedFiles);
                    }
                    
                    if (!diagramRenderer) {
                        initializeDiagramRenderer();
                    }
                    if (diagramRenderer && currentDiagramData) {
                        diagramRenderer.render(currentDiagramData);
                    }
                    
                    // Hide loading indicator
                    hideDiagramLoader();
                    break;
                case 'showWarning':
                    showStatusMessage(message.message, 'warning');
                    break;
                case 'apiKeySaved':
                    showStatusMessage(t('apiKeySaved'), 'success');
                    break;
                case 'apiKeyCleared':
                    showStatusMessage(t('apiKeyCleared'), 'success');
                    break;
                case 'apiKeyError':
                    showStatusMessage(t('error') + ': ' + message.message, 'error');
                    break;
                case 'validationResult':
                    const statusDiv = document.getElementById('connection-status');
                    const testBtn = document.getElementById('test-connection-btn');
                    
                    if (message.valid) {
                        statusDiv.textContent = t('connectionSuccess');
                        statusDiv.className = 'connection-status visible success';
                    } else {
                        statusDiv.textContent = t('connectionFailed') + ': ' + message.message;
                        statusDiv.className = 'connection-status visible error';
                    }
                    
                    testBtn.disabled = false;
                    break;
                case 'layoutApplied':
                    const layoutStatus = document.getElementById('layout-status');
                    const applyLayoutBtn = document.getElementById('apply-layout-btn');
                    
                    if (layoutStatus) {
                        const modeNames = {
                            'auto': 'Automatic',
                            'hierarchical': 'Hierarchical',
                            'ai': 'AI-Optimized'
                        };
                        layoutStatus.textContent = modeNames[message.mode] + ' layout applied successfully!';
                        layoutStatus.className = 'connection-status visible success';
                        
                        setTimeout(() => {
                            layoutStatus.className = 'connection-status';
                        }, 3000);
                    }
                    
                    if (applyLayoutBtn) {
                        applyLayoutBtn.disabled = false;
                    }
                    break;
                case 'layoutError':
                    const layoutStatusError = document.getElementById('layout-status');
                    const applyLayoutBtnError = document.getElementById('apply-layout-btn');
                    
                    if (layoutStatusError) {
                        layoutStatusError.textContent = 'Error: ' + message.message;
                        layoutStatusError.className = 'connection-status visible error';
                    }
                    
                    if (applyLayoutBtnError) {
                        applyLayoutBtnError.disabled = false;
                    }
                    break;
                case 'setModel':
                    const modelSelect = document.getElementById('model');
                    if (modelSelect && message.model) {
                        modelSelect.value = message.model;
                    }
                    break;
                case 'updateSecuritySummary':
                    updateSecurityUI(message.summary);
                    break;
                case 'updateQualitySummary':
                    updateQualityUI(message.summary);
                    break;
                case 'loadDiagramPositions':
                    if (diagramRenderer && message.positions) {
                        applyDiagramPositions(message.positions);
                    }
                    break;
                case 'qualityAnalysisResult':
                    updateQualityUI(message.result);
                    break;
                case 'updateDeepenedExplanation':
                    console.log('[Webview] Received updateDeepenedExplanation:', message.nodeId, 'explanation length:', message.explanation?.length);
                    
                    // Re-enable the deepen button
                    const deepenBtnUpdate = document.querySelector('.deepen-button');
                    if (deepenBtnUpdate) {
                        deepenBtnUpdate.disabled = false;
                        deepenBtnUpdate.style.opacity = '1';
                        deepenBtnUpdate.style.cursor = 'pointer';
                    }
                    
                    // Find the node data and update it
                    let nodeDataToUpdate = null;
                    let nodeKeyUsed = null;
                    
                    const nodeIdLower = message.nodeId.toLowerCase();
                    const possibleKeys = [
                        message.nodeId,
                        nodeIdLower,
                        nodeIdLower + '_java',
                        nodeIdLower + '_js',
                        nodeIdLower + '_ts',
                        nodeIdLower + '_py'
                    ];
                    
                    for (const key of possibleKeys) {
                        if (analysisDataMap.has(key)) {
                            nodeDataToUpdate = analysisDataMap.get(key);
                            nodeKeyUsed = key;
                            break;
                        }
                    }
                    
                    if (!nodeDataToUpdate) {
                        for (const [key, value] of analysisDataMap.entries()) {
                            const keyLower = key.toLowerCase();
                            const keyNoUnderscore = removeUnderscores(keyLower);
                            const nodeIdNoUnderscore = removeUnderscores(nodeIdLower);
                            if (keyLower.startsWith(nodeIdLower) || keyNoUnderscore === nodeIdNoUnderscore) {
                                nodeDataToUpdate = value;
                                nodeKeyUsed = key;
                                break;
                            }
                        }
                    }
                    
                    console.log('[Webview] nodeData found:', !!nodeDataToUpdate, 'key:', nodeKeyUsed);
                    
                    if (nodeDataToUpdate) {
                        nodeDataToUpdate.explanation = message.explanation;
                        console.log('[Webview] Updated analysisDataMap');
                    }
                    
                    // SIMPLE SOLUTION: Close and reopen the panel
                    const detailsPanel = document.getElementById('details-panel');
                    if (detailsPanel) {
                        // Close the panel
                        detailsPanel.classList.remove('show');
                        console.log('[Webview] Panel closed');
                        
                        // Wait a moment, then reopen with the updated data
                        setTimeout(() => {
                            // Find the node that was being viewed
                            let nodeToShow = null;
                            for (const [key, value] of analysisDataMap.entries()) {
                                if (key === nodeKeyUsed || key.toLowerCase() === nodeIdLower || key.startsWith(nodeIdLower)) {
                                    // Create a node object to pass to showDetailsPanel
                                    nodeToShow = {
                                        id: message.nodeId,
                                        label: value.currentFile?.name || message.nodeId,
                                        path: value.currentFile?.path
                                    };
                                    break;
                                }
                            }
                            
                            if (nodeToShow) {
                                console.log('[Webview] Reopening panel with node:', nodeToShow);
                                showDetailsPanel(nodeToShow);
                                
                                // Show success message
                                setTimeout(() => {
                                    const explanationText = document.getElementById('explanation-text');
                                    if (explanationText && explanationText.parentElement) {
                                        const successMsg = document.createElement('div');
                                        successMsg.style.cssText = 'color: #4ec9b0; font-weight: 600; padding: 12px; margin-top: 12px; background: rgba(78, 201, 176, 0.15); border-radius: 4px; border-left: 4px solid #4ec9b0;';
                                        successMsg.innerHTML = '✓ ' + (currentLanguage === 'es' ? '<strong>Análisis actualizado con éxito</strong>' : '<strong>Analysis updated successfully</strong>');
                                        
                                        explanationText.parentElement.insertBefore(successMsg, explanationText.nextSibling);
                                        
                                        setTimeout(() => {
                                            if (successMsg.parentElement) {
                                                successMsg.parentElement.removeChild(successMsg);
                                            }
                                        }, 3000);
                                    }
                                }, 100);
                            }
                        }, 300);
                    }
                    break;
                case 'aiReportGenerated':
                    displayAIReport(message.report);
                    break;
                case 'recommendationGenerated':
                    displayRecommendation(message.recommendation, message.panelId);
                    break;
                case 'cacheStats':
                    // Cache stats section removed - ignore this message
                    console.log('[Webview] Cache stats message received but ignored (feature removed)');
                    break;
            }
        });

        function displayExplanation(analysisResult) {
            const container = document.getElementById('explanation-container');
            const textElement = document.getElementById('explanation-text');
            if (!analysisResult.explanation) {
                container.classList.remove('show');
                return;
            }
            container.classList.add('show');
            textElement.textContent = analysisResult.explanation;
        }

        function displayWarnings(analysisResult) {
            const container = document.getElementById('warnings-container');
            const content = document.getElementById('warnings-content');
            const hasWarnings = (analysisResult.securityWarnings?.length || 0) +
                               (analysisResult.logicWarnings?.length || 0) +
                               (analysisResult.bestPracticeWarnings?.length || 0) > 0;
            
            if (!hasWarnings) {
                container.classList.remove('show');
                return;
            }
            
            container.classList.add('show');
            content.innerHTML = '';
            
            if (analysisResult.securityWarnings?.length > 0) {
                content.innerHTML += '<div style="font-size: 11px; font-weight: 500; color: #858585; margin-bottom: 4px;">🔒 ' + t('security') + '</div>';
                analysisResult.securityWarnings.forEach(w => {
                    content.innerHTML += '<div class="warning-item high">🔴 ' + w.message + '</div>';
                });
            }
            
            if (analysisResult.logicWarnings?.length > 0) {
                content.innerHTML += '<div style="font-size: 11px; font-weight: 500; color: #858585; margin-bottom: 4px; margin-top: 8px;">🔍 ' + t('logic') + '</div>';
                analysisResult.logicWarnings.forEach(w => {
                    content.innerHTML += '<div class="warning-item medium">🟡 ' + w.message + '</div>';
                });
            }
            
            if (analysisResult.bestPracticeWarnings?.length > 0) {
                content.innerHTML += '<div style="font-size: 11px; font-weight: 500; color: #858585; margin-bottom: 4px; margin-top: 8px;">✨ ' + t('bestPractice') + '</div>';
                analysisResult.bestPracticeWarnings.forEach(w => {
                    content.innerHTML += '<div class="warning-item low">🟢 ' + w.message + '</div>';
                });
            }
        }

        function showNodePopup(event, node) {
            const popup = document.getElementById('node-popup');
            const title = document.getElementById('popup-title');
            const description = document.getElementById('popup-description');
            
            title.textContent = node.label;
            description.textContent = node.description || t('noDescription');
            
            popup.classList.add('show');
            popup.style.left = (event.clientX + 10) + 'px';
            popup.style.top = (event.clientY + 10) + 'px';
            
            // Hide popup when clicking elsewhere
            setTimeout(() => {
                document.addEventListener('click', hideNodePopup);
            }, 100);
        }

        function hideNodePopup(e) {
            const popup = document.getElementById('node-popup');
            if (!popup.contains(e.target) && e.target.tagName !== 'rect') {
                popup.classList.remove('show');
                document.removeEventListener('click', hideNodePopup);
            }
        }

        let contextMenuNode = null;

        function showContextMenu(event, node) {
            contextMenuNode = node;
            const menu = document.getElementById('context-menu');
            menu.classList.add('show');
            menu.style.left = event.clientX + 'px';
            menu.style.top = event.clientY + 'px';
            
            setTimeout(() => {
                document.addEventListener('click', hideContextMenu);
            }, 100);
        }

        function hideContextMenu(e) {
            const menu = document.getElementById('context-menu');
            if (!menu.contains(e.target)) {
                menu.classList.remove('show');
                document.removeEventListener('click', hideContextMenu);
            }
        }

        function analyzeContextFile() {
            if (contextMenuNode && contextMenuNode.path) {
                vscode.postMessage({
                    command: 'analyzeFile',
                    filePath: contextMenuNode.path
                });
                hideContextMenu({ target: document.body });
            }
        }

        function updateContextFile() {
            if (contextMenuNode && contextMenuNode.path) {
                vscode.postMessage({
                    command: 'updateAnalysis',
                    filePath: contextMenuNode.path
                });
                hideContextMenu({ target: document.body });
            }
        }

        function convertMarkdownToHTML(markdown) {
            if (!markdown) return "";
            
            let html = markdown;
            
            // Escape HTML first
            const escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            };
            
            // Don't escape if already has HTML tags
            if (!html.includes('<')) {
                // Only escape special chars if no HTML present
                // html = html.replace(/[&<>]/g, m => escapeMap[m]);
            }
            
            // Convert headers (using string methods instead of regex)
            const lines = html.split('\\n');
            const processedLines = lines.map(line => {
                if (line.startsWith('### ')) {
                    return '<h3>' + line.substring(4) + '</h3>';
                } else if (line.startsWith('## ')) {
                    return '<h2>' + line.substring(3) + '</h2>';
                } else if (line.startsWith('# ')) {
                    return '<h1>' + line.substring(2) + '</h1>';
                }
                return line;
            });
            html = processedLines.join('\\n');
            
            // Convert bold (** or __)
            while (html.includes('**')) {
                const start = html.indexOf('**');
                const end = html.indexOf('**', start + 2);
                if (end === -1) break;
                const before = html.substring(0, start);
                const content = html.substring(start + 2, end);
                const after = html.substring(end + 2);
                html = before + '<strong>' + content + '</strong>' + after;
            }
            
            // Convert line breaks
            html = replaceDoubleNewlines(html);
            html = replaceSingleNewlines(html);
            
            // Wrap in paragraph if needed
            if (!html.startsWith('<')) {
                html = '<p>' + html + '</p>';
            }
            
            return html;
        }

        function showDetailsPanel(node) {
            const panel = document.getElementById('details-panel');
            const title = document.getElementById('details-panel-title');
            const content = document.getElementById('details-panel-content');
            
            // Get analysis data for this node
            const analysisData = analysisDataMap.get(node.id) || analysisDataMap.get(node.label);
            
            if (!analysisData) {
                // No analysis data available
                title.textContent = '📋 ' + node.label;
                content.innerHTML = '<div class="details-section"><div class="details-section-text">' + t('noAnalysisData') + '</div></div>';
                panel.classList.add('show');
                return;
            }
            
            // Update title (simple, no cache indicator)
            title.textContent = '📋 ' + node.label;
            
            // Build content HTML
            let html = '';
            
            // Explanation section
            if (analysisData.explanation) {
                html += '<div class="details-section" id="explanation-section">';
                html += '<div class="details-section-title">📝 ' + t('explanation').toUpperCase() + '</div>';
                html += '<div class="details-section-text" id="explanation-text">' + convertMarkdownToHTML(analysisData.explanation) + '</div>';
                
                // Escape attributes to avoid regex issues in template strings
                const escapedNodeId = node.id.split('"').join('&quot;');
                const escapedNodeLabel = node.label.split('"').join('&quot;');
                const escapedNodePath = (node.path || '').split('"').join('&quot;');
                
                html += '<button class="deepen-button" data-node-id="' + escapedNodeId + '" data-node-label="' + escapedNodeLabel + '" data-node-path="' + escapedNodePath + '" style="margin-top: 10px; padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">';
                html += '🔍 ' + (currentLanguage === 'es' ? 'Profundizar' : 'Deepen Analysis');
                html += '</button>';
                html += '</div>';
            }
            
            // Dependencies section
            if (analysisData.dependencies && analysisData.dependencies.length > 0) {
                html += '<div class="details-section">';
                html += '<div class="details-section-title">🔗 ' + t('dependencies').toUpperCase() + ' (' + analysisData.dependencies.length + ')</div>';
                html += '<div class="details-dependencies-list">';
                analysisData.dependencies.forEach(dep => {
                    html += '<div class="details-dependency-tag">' + (dep.name || dep.target) + '</div>';
                });
                html += '</div>';
                html += '</div>';
            }
            
            // Security warnings
            if (analysisData.securityWarnings && analysisData.securityWarnings.length > 0) {
                html += '<div class="details-section">';
                html += '<div class="details-section-title">🔒 ' + t('securityWarnings').toUpperCase() + ' (' + analysisData.securityWarnings.length + ')</div>';
                html += '<div class="details-warning-list">';
                analysisData.securityWarnings.forEach(warning => {
                    html += '<div class="details-warning-item high">🔴 ' + warning.message + '</div>';
                });
                html += '</div>';
                html += '</div>';
            }
            
            // Logic warnings
            if (analysisData.logicWarnings && analysisData.logicWarnings.length > 0) {
                html += '<div class="details-section">';
                html += '<div class="details-section-title">🔍 ' + t('logicWarnings').toUpperCase() + ' (' + analysisData.logicWarnings.length + ')</div>';
                html += '<div class="details-warning-list">';
                analysisData.logicWarnings.forEach(warning => {
                    html += '<div class="details-warning-item medium">🟡 ' + warning.message + '</div>';
                });
                html += '</div>';
                html += '</div>';
            }
            
            // Best practice warnings
            if (analysisData.bestPracticeWarnings && analysisData.bestPracticeWarnings.length > 0) {
                html += '<div class="details-section">';
                html += '<div class="details-section-title">✨ ' + t('bestPracticeSuggestions').toUpperCase() + ' (' + analysisData.bestPracticeWarnings.length + ')</div>';
                html += '<div class="details-warning-list">';
                analysisData.bestPracticeWarnings.forEach(warning => {
                    html += '<div class="details-warning-item low">🟢 ' + warning.message + '</div>';
                });
                html += '</div>';
                html += '</div>';
            }
            
            // If no content, show message
            if (!html) {
                html = '<div class="details-section"><div class="details-section-text">' + t('noDetailedAnalysis') + '</div></div>';
            }
            
            content.innerHTML = html;
            panel.classList.add('show');
            
            // Add event listener for deepen button (NO inline onclick)
            const deepenBtn = content.querySelector('.deepen-button');
            if (deepenBtn) {
                deepenBtn.addEventListener('click', function() {
                    const nodeId = this.getAttribute('data-node-id');
                    const nodeLabel = this.getAttribute('data-node-label');
                    const nodePath = this.getAttribute('data-node-path');
                    deepenAnalysis(nodeId, nodeLabel, nodePath);
                });
            }
        }
        
        function deepenAnalysis(nodeId, nodeLabel, nodePath) {
            console.log('[Webview] deepenAnalysis called for:', nodeId, nodeLabel);
            
            // Disable the button to prevent multiple clicks
            const deepenBtn = document.querySelector('.deepen-button');
            if (deepenBtn) {
                deepenBtn.disabled = true;
                deepenBtn.style.opacity = '0.5';
                deepenBtn.style.cursor = 'not-allowed';
            }
            
            // Show loading state with animation
            const explanationText = document.getElementById('explanation-text');
            if (explanationText) {
                const loadingMsg = currentLanguage === 'es' 
                    ? '🔄 Profundizando análisis... Por favor espera, esto puede tomar unos segundos.' 
                    : '🔄 Deepening analysis... Please wait, this may take a few seconds.';
                    
                explanationText.innerHTML = '<div style="color: #007acc; font-style: italic; padding: 16px; background: rgba(0, 122, 204, 0.15); border-radius: 4px; border-left: 4px solid #007acc; animation: pulse 1.5s ease-in-out infinite;">' + 
                    loadingMsg + 
                    '</div>' +
                    '<style>@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }</style>';
            }
            
            // Send message to backend to deepen analysis
            vscode.postMessage({
                command: 'deepenAnalysis',
                nodeId: nodeId,
                nodeLabel: nodeLabel,
                nodePath: nodePath
            });
        }

        function closeDetailsPanel() {
            const panel = document.getElementById('details-panel');
            panel.classList.remove('show');
        }

        function toggleLeftMenu() {
            console.log('[Webview] toggleLeftMenu called');
            const menu = document.getElementById('left-menu');
            console.log('[Webview] left-menu element:', menu);
            menu.classList.toggle('show');
            console.log('[Webview] Menu toggled, classes:', menu.className);
        }

        function updateAnalyzedFilesList(analyzedFiles) {
            const list = document.getElementById('analyzed-files-list');
            list.innerHTML = '';
            
            analyzedFiles.forEach(file => {
                const item = document.createElement('div');
                item.className = 'left-menu-item';
                
                // Create checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = fileVisibilityMap.get(file.path) !== false; // Default to true
                checkbox.style.marginRight = '8px';
                checkbox.onclick = (e) => {
                    e.stopPropagation();
                    const isVisible = checkbox.checked;
                    fileVisibilityMap.set(file.path, isVisible);
                    vscode.postMessage({
                        command: 'toggleFileVisibility',
                        filePath: file.path,
                        visible: isVisible
                    });
                };
                
                const label = document.createElement('label');
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.style.cursor = 'pointer';
                label.style.width = '100%';
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'left-menu-item-name';
                nameSpan.textContent = file.name;
                nameSpan.style.flex = '1';
                
                label.appendChild(checkbox);
                label.appendChild(nameSpan);
                item.appendChild(label);
                
                // Click on name to load analysis
                nameSpan.onclick = (e) => {
                    e.stopPropagation();
                    // Just close the menu - the diagram already shows all visible files
                    toggleLeftMenu();
                };
                
                list.appendChild(item);
            });
        }

        function zoomIn() {
            zoomLevel = Math.min(zoomLevel + 0.2, 3);
            applyZoom();
        }

        function zoomOut() {
            zoomLevel = Math.max(zoomLevel - 0.2, 0.5);
            applyZoom();
        }

        function resetZoom() {
            zoomLevel = 1;
            panX = 0;
            panY = 0;
            applyZoom();
        }

        function applyZoom() {
            const svg = document.getElementById('diagram-svg');
            if (!svg) return;
            
            const g = svg.querySelector('g');
            if (g) {
                g.setAttribute('transform', 'translate(' + panX + ',' + panY + ') scale(' + zoomLevel + ')');
            }
        }

        function toggleExportMenu() {
            console.log('[Webview] toggleExportMenu called');
            const menu = document.getElementById('export-menu');
            console.log('[Webview] export-menu element:', menu);
            menu.classList.toggle('show');
            console.log('[Webview] Export menu toggled, classes:', menu.className);
            
            // Close menu when clicking elsewhere
            if (menu.classList.contains('show')) {
                setTimeout(() => {
                    document.addEventListener('click', hideExportMenu);
                }, 100);
            }
        }

        function hideExportMenu(e) {
            const menu = document.getElementById('export-menu');
            const button = document.querySelector('.export-button');
            if (!menu.contains(e.target) && e.target !== button) {
                menu.classList.remove('show');
                document.removeEventListener('click', hideExportMenu);
            }
        }

        function exportDiagram(format) {
            hideExportMenu({ target: document.body });
            
            switch(format) {
                case 'png':
                    exportAsPNG();
                    break;
                case 'svg':
                    exportAsSVG();
                    break;
                case 'mermaid':
                    exportAsMermaid();
                    break;
                case 'json':
                    exportAsJSON();
                    break;
            }
        }

        function exportAsPNG() {
            const svg = document.getElementById('diagram-svg');
            
            // Calculate the bounding box of all elements
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            if (diagramRenderer && diagramRenderer.nodes) {
                diagramRenderer.nodes.forEach(node => {
                    minX = Math.min(minX, node.x);
                    minY = Math.min(minY, node.y);
                    maxX = Math.max(maxX, node.x + 120); // node width
                    maxY = Math.max(maxY, node.y + 60);  // node height
                });
            }
            
            // Add padding
            const padding = 40;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Clone the SVG and adjust viewBox to show everything
            const svgClone = svg.cloneNode(true);
            svgClone.setAttribute('width', width);
            svgClone.setAttribute('height', height);
            svgClone.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
            
            // Remove transform from g element to show everything
            const g = svgClone.querySelector('g');
            if (g) {
                g.removeAttribute('transform');
            }
            
            const svgData = new XMLSerializer().serializeToString(svgClone);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // Use higher resolution for better quality
            const scale = 2;
            canvas.width = width * scale;
            canvas.height = height * scale;
            ctx.scale(scale, scale);
            
            img.onload = function() {
                // Fill background
                ctx.fillStyle = '#1e1e1e';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(function(blob) {
                    vscode.postMessage({
                        command: 'exportDiagram',
                        format: 'png',
                        data: canvas.toDataURL('image/png')
                    });
                });
            };
            
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        }

        function exportAsSVG() {
            const svg = document.getElementById('diagram-svg');
            
            // Calculate the bounding box of all elements
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            if (diagramRenderer && diagramRenderer.nodes) {
                diagramRenderer.nodes.forEach(node => {
                    minX = Math.min(minX, node.x);
                    minY = Math.min(minY, node.y);
                    maxX = Math.max(maxX, node.x + 120); // node width
                    maxY = Math.max(maxY, node.y + 60);  // node height
                });
            }
            
            // Add padding
            const padding = 40;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Clone the SVG and adjust viewBox to show everything
            const svgClone = svg.cloneNode(true);
            svgClone.setAttribute('width', width);
            svgClone.setAttribute('height', height);
            svgClone.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
            
            // Remove transform from g element to show everything
            const g = svgClone.querySelector('g');
            if (g) {
                g.removeAttribute('transform');
            }
            
            const svgData = new XMLSerializer().serializeToString(svgClone);
            
            vscode.postMessage({
                command: 'exportDiagram',
                format: 'svg',
                data: svgData
            });
        }

        function exportAsMermaid() {
            if (!currentDiagramData) {
                showStatusMessage('No diagram to export', 'error');
                return;
            }
            
            let mermaidCode = 'graph TD\\n';
            
            // Add nodes
            currentDiagramData.nodes.forEach(node => {
                const nodeId = sanitizeId(node.id);
                const label = escapeQuotes(node.label);
                if (node.isCurrentFile) {
                    mermaidCode += `    ${nodeId}["${label}"]:::current\\n`;
                } else {
                    mermaidCode += `    ${nodeId}["${label}"]\\n`;
                }
            });
            
            mermaidCode += '\\n';
            
            // Add edges
            currentDiagramData.edges.forEach(edge => {
                const sourceId = sanitizeId(edge.source);
                const targetId = sanitizeId(edge.target);
                mermaidCode += `    ${sourceId} --> ${targetId}\\n`;
            });
            
            // Add styling
            mermaidCode += '\\n    classDef current fill:#1a3a52,stroke:#007acc,stroke-width:3px\\n';
            
            vscode.postMessage({
                command: 'exportDiagram',
                format: 'mermaid',
                data: mermaidCode
            });
        }

        function exportAsJSON() {
            if (!currentDiagramData) {
                showStatusMessage('No diagram to export', 'error');
                return;
            }
            
            const jsonData = JSON.stringify(currentDiagramData, null, 2);
            
            vscode.postMessage({
                command: 'exportDiagram',
                format: 'json',
                data: jsonData
            });
        }

        function initializeDetailsPanelResizer() {
            const resizer = document.getElementById('details-panel-resizer');
            const panel = document.getElementById('details-panel');
            
            if (!resizer || !panel) return;
            
            let isResizing = false;
            let startY = 0;
            let startHeight = 0;
            
            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                startY = e.clientY;
                startHeight = panel.offsetHeight;
                
                // Disable transition during resize for smooth dragging
                panel.style.transition = 'none';
                
                // Prevent text selection during drag
                document.body.style.userSelect = 'none';
                
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                // Calculate new height (subtract because we're dragging up from bottom)
                const deltaY = startY - e.clientY;
                const newHeight = startHeight + deltaY;
                
                // Apply constraints
                const minHeight = 200;
                const maxHeight = window.innerHeight * 0.8;
                const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
                
                panel.style.height = constrainedHeight + 'px';
            });
            
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    
                    // Re-enable transition
                    panel.style.transition = 'transform 0.3s ease';
                    
                    // Re-enable text selection
                    document.body.style.userSelect = '';
                }
            });
        }

        window.addEventListener('load', () => {
            console.log('[Webview] Window load event fired');
            
            // Show loading indicator initially
            showDiagramLoader();
            
            initializeDiagramRenderer();
            updateUILanguage();
            
            // Sync language with backend on load
            if (currentLanguage) {
                console.log('[Webview] Syncing language with backend:', currentLanguage);
                vscode.postMessage({ command: 'changeLanguage', language: currentLanguage });
            }
            
            // Initialize details panel resizer
            initializeDetailsPanelResizer();
            
            console.log('[Webview] Adding event listeners...');
            
            // Add event listeners for cache stats buttons (NO inline onclick - learned from bug)
            
            // Control buttons event listeners
            const menuButton = document.getElementById('menu-button');
            console.log('[Webview] menuButton:', menuButton);
            if (menuButton) {
                menuButton.addEventListener('click', toggleLeftMenu);
                console.log('[Webview] Added listener to menuButton');
            }

            const leftMenuClose = document.getElementById('left-menu-close');
            console.log('[Webview] leftMenuClose:', leftMenuClose);
            if (leftMenuClose) {
                leftMenuClose.addEventListener('click', toggleLeftMenu);
                console.log('[Webview] Added listener to leftMenuClose');
            }

            const exportButton = document.getElementById('export-button');
            console.log('[Webview] exportButton:', exportButton);
            if (exportButton) {
                exportButton.addEventListener('click', toggleExportMenu);
                console.log('[Webview] Added listener to exportButton');
            }

            const zoomInButton = document.getElementById('zoom-in-button');
            console.log('[Webview] zoomInButton:', zoomInButton);
            if (zoomInButton) {
                zoomInButton.addEventListener('click', zoomIn);
                console.log('[Webview] Added listener to zoomInButton');
            }

            const zoomOutButton = document.getElementById('zoom-out-button');
            console.log('[Webview] zoomOutButton:', zoomOutButton);
            if (zoomOutButton) {
                zoomOutButton.addEventListener('click', zoomOut);
                console.log('[Webview] Added listener to zoomOutButton');
            }

            const resetZoomButton = document.getElementById('reset-zoom-button');
            console.log('[Webview] resetZoomButton:', resetZoomButton);
            if (resetZoomButton) {
                resetZoomButton.addEventListener('click', resetZoom);
                console.log('[Webview] Added listener to resetZoomButton');
            }

            // Export menu items
            const exportMenuItems = document.querySelectorAll('.export-menu-item');
            console.log('[Webview] exportMenuItems:', exportMenuItems.length);
            exportMenuItems.forEach(item => {
                item.addEventListener('click', function() {
                    const format = this.getAttribute('data-format');
                    console.log('[Webview] Export menu item clicked, format:', format);
                    exportDiagram(format);
                });
            });

            // Settings buttons
            const saveApiKeyBtn = document.getElementById('save-api-key-btn');
            console.log('[Webview] saveApiKeyBtn:', saveApiKeyBtn);
            if (saveApiKeyBtn) {
                saveApiKeyBtn.addEventListener('click', saveAPIKey);
                console.log('[Webview] Added listener to saveApiKeyBtn');
            }

            const clearApiKeyBtn = document.getElementById('clear-api-key-btn');
            console.log('[Webview] clearApiKeyBtn:', clearApiKeyBtn);
            if (clearApiKeyBtn) {
                clearApiKeyBtn.addEventListener('click', clearAPIKey);
                console.log('[Webview] Added listener to clearApiKeyBtn');
            }

            const testConnectionBtn = document.getElementById('test-connection-btn');
            console.log('[Webview] testConnectionBtn:', testConnectionBtn);
            if (testConnectionBtn) {
                testConnectionBtn.addEventListener('click', testConnection);
                console.log('[Webview] Added listener to testConnectionBtn');
            }

            const modelSelect = document.getElementById('model');
            console.log('[Webview] modelSelect:', modelSelect);
            if (modelSelect) {
                modelSelect.addEventListener('change', function() {
                    console.log('[Webview] Model changed to:', this.value);
                    saveModel(this.value);
                });
                console.log('[Webview] Added listener to modelSelect');
            }

            // Security buttons
            const regenerateBtn = document.getElementById('regenerate-btn');
            console.log('[Webview] regenerateBtn:', regenerateBtn);
            if (regenerateBtn) {
                regenerateBtn.addEventListener('click', regenerateAIReport);
                console.log('[Webview] Added listener to regenerateBtn');
            }

            // Risk info modal
            const riskInfoBtn = document.getElementById('risk-info-btn');
            const riskInfoModal = document.getElementById('risk-info-modal');
            const riskInfoClose = document.getElementById('risk-info-close');
            
            if (riskInfoBtn && riskInfoModal) {
                riskInfoBtn.addEventListener('click', () => {
                    riskInfoModal.classList.add('show');
                });
            }
            
            if (riskInfoClose && riskInfoModal) {
                riskInfoClose.addEventListener('click', () => {
                    riskInfoModal.classList.remove('show');
                });
            }
            
            // Close modal when clicking outside
            if (riskInfoModal) {
                riskInfoModal.addEventListener('click', (e) => {
                    if (e.target === riskInfoModal) {
                        riskInfoModal.classList.remove('show');
                    }
                });
            }

            const generateReportBtn = document.getElementById('generate-report-btn');
            console.log('[Webview] generateReportBtn:', generateReportBtn);
            if (generateReportBtn) {
                generateReportBtn.addEventListener('click', generateSecurityReport);
                console.log('[Webview] Added listener to generateReportBtn');
            }

            // New security report button in header
            const generateSecurityReportBtn = document.getElementById('generate-security-report-btn');
            if (generateSecurityReportBtn) {
                generateSecurityReportBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'generateSecurityReport' });
                });
            }

            // New quality report button in header
            const generateQualityReportBtn = document.getElementById('generate-quality-report-btn');
            if (generateQualityReportBtn) {
                generateQualityReportBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'generateQualityReport' });
                });
            }

            // Quality analysis button
            const analyzeQualityBtn = document.getElementById('analyze-quality-btn');
            console.log('[Webview] analyzeQualityBtn:', analyzeQualityBtn);
            if (analyzeQualityBtn) {
                analyzeQualityBtn.addEventListener('click', analyzeCodeQuality);
                console.log('[Webview] Added listener to analyzeQualityBtn');
            }

            // Context menu items
            const analyzeContextFileItem = document.getElementById('analyze-context-file');
            console.log('[Webview] analyzeContextFileItem:', analyzeContextFileItem);
            if (analyzeContextFileItem) {
                analyzeContextFileItem.addEventListener('click', analyzeContextFile);
                console.log('[Webview] Added listener to analyzeContextFileItem');
            }

            const updateContextFileItem = document.getElementById('update-context-file');
            console.log('[Webview] updateContextFileItem:', updateContextFileItem);
            if (updateContextFileItem) {
                updateContextFileItem.addEventListener('click', updateContextFile);
                console.log('[Webview] Added listener to updateContextFileItem');
            }

            // Details panel close button
            const detailsPanelClose = document.getElementById('details-panel-close');
            console.log('[Webview] detailsPanelClose:', detailsPanelClose);
            if (detailsPanelClose) {
                detailsPanelClose.addEventListener('click', closeDetailsPanel);
                console.log('[Webview] Added listener to detailsPanelClose');
            }
            
            
// Save language button
            const saveLanguageBtn = document.getElementById('save-language-btn');
            if (saveLanguageBtn) {
                saveLanguageBtn.addEventListener('click', () => {
                    const languageSelect = document.getElementById('language-select');
                    if (languageSelect) {
                        const selectedLanguage = languageSelect.value;
                        changeLanguage(selectedLanguage);
                    }
                });
            }

            // Apply layout button
            const applyLayoutBtn = document.getElementById('apply-layout-btn');
            if (applyLayoutBtn) {
                applyLayoutBtn.addEventListener('click', () => {
                    const layoutMode = document.getElementById('layout-mode');
                    const layoutStatus = document.getElementById('layout-status');
                    
                    if (layoutMode) {
                        const selectedMode = layoutMode.value;
                        
                        // Show loading state
                        layoutStatus.textContent = 'Applying layout...';
                        layoutStatus.className = 'connection-status visible loading';
                        applyLayoutBtn.disabled = true;
                        
                        // Send message to extension
                        vscode.postMessage({ 
                            command: 'applyLayout', 
                            mode: selectedMode 
                        });
                    }
                });
            }

            // Tab switching event listeners
            console.log('[Webview] Setting up tab switching...');
            document.querySelectorAll('.tab-button').forEach(button => {
                button.addEventListener('click', () => {
                    const tab = button.dataset.tab;
                    console.log('[Webview] Tab button clicked:', tab);
                    switchTab(tab);
                });
            });
            console.log('[Webview] Tab switching configured');

            console.log('[Webview] All event listeners added successfully');
        });
