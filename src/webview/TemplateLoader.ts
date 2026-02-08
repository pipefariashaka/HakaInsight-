/**
 * Template Loader
 * Loads and manages HTML templates for the webview
 */

import * as fs from 'fs';
import * as path from 'path';

export class TemplateLoader {
    private templatesPath: string;
    private stylesPath: string;
    private scriptsPath: string;
    private cache: Map<string, string> = new Map();

    constructor(extensionPath: string) {
        this.templatesPath = path.join(extensionPath, 'dist', 'webview', 'templates');
        this.stylesPath = path.join(extensionPath, 'dist', 'webview', 'styles');
        this.scriptsPath = path.join(extensionPath, 'dist', 'webview', 'scripts');
    }

    /**
     * Load a template file
     */
    loadTemplate(templateName: string): string {
        // Check cache first
        const cacheKey = `template:${templateName}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const templatePath = path.join(this.templatesPath, templateName);
        
        try {
            const content = fs.readFileSync(templatePath, 'utf8');
            this.cache.set(cacheKey, content);
            return content;
        } catch (error) {
            console.error(`Failed to load template: ${templateName}`, error);
            return `<!-- Template ${templateName} not found -->`;
        }
    }

    /**
     * Load a style file
     */
    loadStyle(styleName: string): string {
        // Check cache first
        const cacheKey = `style:${styleName}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const stylePath = path.join(this.stylesPath, styleName);
        
        try {
            const content = fs.readFileSync(stylePath, 'utf8');
            this.cache.set(cacheKey, content);
            return content;
        } catch (error) {
            console.error(`Failed to load style: ${styleName}`, error);
            return `/* Style ${styleName} not found */`;
        }
    }

    /**
     * Load a script file
     */
    loadScript(scriptName: string): string {
        // Check cache first
        const cacheKey = `script:${scriptName}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const scriptPath = path.join(this.scriptsPath, scriptName);
        
        try {
            const content = fs.readFileSync(scriptPath, 'utf8');
            this.cache.set(cacheKey, content);
            return content;
        } catch (error) {
            console.error(`Failed to load script: ${scriptName}`, error);
            return `/* Script ${scriptName} not found */`;
        }
    }

    /**
     * Load template with replacements
     */
    loadTemplateWithReplacements(templateName: string, replacements: Record<string, string>): string {
        let content = this.loadTemplate(templateName);
        
        for (const [key, value] of Object.entries(replacements)) {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        
        return content;
    }

    /**
     * Load and combine multiple templates
     */
    loadCompositeTemplate(mainTemplate: string, partials: Record<string, string>): string {
        let content = this.loadTemplate(mainTemplate);
        
        for (const [placeholder, templateName] of Object.entries(partials)) {
            const partial = this.loadTemplate(templateName);
            content = content.replace(new RegExp(`{{${placeholder}}}`, 'g'), partial);
        }
        
        return content;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Validate template exists
     */
    templateExists(templateName: string): boolean {
        const templatePath = path.join(this.templatesPath, templateName);
        return fs.existsSync(templatePath);
    }

    /**
     * Validate style exists
     */
    styleExists(styleName: string): boolean {
        const stylePath = path.join(this.stylesPath, styleName);
        return fs.existsSync(stylePath);
    }

    /**
     * Validate script exists
     */
    scriptExists(scriptName: string): boolean {
        const scriptPath = path.join(this.scriptsPath, scriptName);
        return fs.existsSync(scriptPath);
    }
}
