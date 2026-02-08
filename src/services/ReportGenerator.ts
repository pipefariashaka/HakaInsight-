/**
 * Report Generator
 * Generates HTML reports for security and quality analysis
 */

import * as vscode from 'vscode';
import { SecuritySummary } from './SecurityAnalysisManager';
import { QualityFindings } from './QualityAnalysisManager';
import { t, Language } from '../i18n/translations';

export interface ReportTemplate {
  title: string;
  type: 'security' | 'quality';
  data: SecuritySummary | QualityFindings;
  timestamp: string;
}

export class ReportGenerator {
  private context: vscode.ExtensionContext;
  
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }
  
  /**
   * Generate security analysis report
   */
  async generateSecurityReport(findings: SecuritySummary): Promise<string> {
    const title = await t('securityReport', this.context);
    const template: ReportTemplate = {
      title: `${title} Haka Insight`,
      type: 'security',
      data: findings,
      timestamp: new Date().toISOString()
    };

    return this.buildSecurityHTML(template);
  }

  /**
   * Generate code quality report
   */
  async generateQualityReport(findings: QualityFindings): Promise<string> {
    const title = await t('qualityReport', this.context);
    const template: ReportTemplate = {
      title: `${title} Haka Insight`,
      type: 'quality',
      data: findings,
      timestamp: new Date().toISOString()
    };

    return this.buildQualityHTML(template);
  }

  /**
   * Build HTML for security report
   */
  private async buildSecurityHTML(template: ReportTemplate): Promise<string> {
    const findings = template.data as SecuritySummary;
    const currentDate = new Date(template.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Get translations
    const generatedOn = await t('generatedOn', this.context);
    const executiveSummary = await t('executiveSummary', this.context);
    const totalFindingsLabel = await t('totalFindings', this.context);
    const riskLevelLabel = await t('riskLevel', this.context);
    const filesAnalyzedLabel = await t('filesAnalyzed', this.context);
    const severityBreakdownLabel = await t('severityBreakdown', this.context);
    const highLabel = await t('riskHigh', this.context);
    const mediumLabel = await t('riskMedium', this.context);
    const lowLabel = await t('riskLow', this.context);
    const highSeverityFindingsLabel = await t('highSeverityFindings', this.context);
    const mediumSeverityFindingsLabel = await t('mediumSeverityFindings', this.context);
    const lowSeverityFindingsLabel = await t('lowSeverityFindings', this.context);
    const analyzedFilesLabel = await t('analyzedFiles', this.context);
    const generatedByLabel = await t('generatedBy', this.context);
    const reportDateLabel = await t('reportDate', this.context);

    // Group findings by severity
    const highFindings = findings.findings.filter((f: any) => f.severity === 'high');
    const mediumFindings = findings.findings.filter((f: any) => f.severity === 'medium');
    const lowFindings = findings.findings.filter((f: any) => f.severity === 'low');

    // Risk level colors
    const riskColors: Record<string, string> = {
      critical: '#e74c3c',
      high: '#f39c12',
      medium: '#f39c12',
      low: '#27ae60'
    };

    const riskColor = riskColors[findings.riskLevel] || '#757575';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.title}</title>
  <style>
    ${this.getCommonCSS()}
    ${this.getSecurityCSS()}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔒 ${template.title}</h1>
      <p>${generatedOn} ${currentDate}</p>
    </header>

    <div class="content">
      <div class="summary">
        <h2>${executiveSummary}</h2>
        <div class="metrics">
          <div class="metric">
            <div class="metric-number">${findings.totalFindings}</div>
            <div class="metric-label">${totalFindingsLabel}</div>
          </div>
          <div class="metric">
            <div class="metric-number" style="color: ${riskColor}">${findings.riskLevel.toUpperCase()}</div>
            <div class="metric-label">${riskLevelLabel}</div>
          </div>
          <div class="metric">
            <div class="metric-number">${findings.analyzedFiles.length}</div>
            <div class="metric-label">${filesAnalyzedLabel}</div>
          </div>
        </div>

        <div class="severity-breakdown">
          <h3>${severityBreakdownLabel}</h3>
          <div class="severity-bars">
            <div class="severity-bar">
              <span class="severity-label">${highLabel}</span>
              <div class="bar-container">
                <div class="bar high" style="width: ${(highFindings.length / findings.totalFindings * 100) || 0}%"></div>
              </div>
              <span class="severity-count">${highFindings.length}</span>
            </div>
            <div class="severity-bar">
              <span class="severity-label">${mediumLabel}</span>
              <div class="bar-container">
                <div class="bar medium" style="width: ${(mediumFindings.length / findings.totalFindings * 100) || 0}%"></div>
              </div>
              <span class="severity-count">${mediumFindings.length}</span>
            </div>
            <div class="severity-bar">
              <span class="severity-label">${lowLabel}</span>
              <div class="bar-container">
                <div class="bar low" style="width: ${(lowFindings.length / findings.totalFindings * 100) || 0}%"></div>
              </div>
              <span class="severity-count">${lowFindings.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="findings-section">
        <h2>🔴 ${highSeverityFindingsLabel}</h2>
        ${await this.generateSecurityFindingsHTML(highFindings, 'high')}
      </div>

      <div class="findings-section">
        <h2>🟡 ${mediumSeverityFindingsLabel}</h2>
        ${await this.generateSecurityFindingsHTML(mediumFindings, 'medium')}
      </div>

      <div class="findings-section">
        <h2>🟢 ${lowSeverityFindingsLabel}</h2>
        ${await this.generateSecurityFindingsHTML(lowFindings, 'low')}
      </div>

      <div class="analyzed-files">
        <h2>📁 ${analyzedFilesLabel}</h2>
        <ul>
          ${findings.analyzedFiles.map((file: any) => `<li>${file}</li>`).join('')}
        </ul>
      </div>
    </div>

    <footer>
      <p>${generatedByLabel}</p>
      <p>${reportDateLabel}: ${currentDate}</p>
    </footer>
  </div>
</body>
</html>`;
  }

  /**
   * Build HTML for quality report
   */
  private async buildQualityHTML(template: ReportTemplate): Promise<string> {
    const findings = template.data as QualityFindings;
    const currentDate = new Date(template.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Get translations
    const generatedOn = await t('generatedOn', this.context);
    const qualityOverviewLabel = await t('qualityOverview', this.context);
    const qualityScoreLabel = await t('qualityScore', this.context);
    const totalIssuesLabel = await t('totalIssues', this.context);
    const filesAnalyzedLabel = await t('filesAnalyzed', this.context);
    const issueBreakdownLabel = await t('issueBreakdown', this.context);
    const bugsLabel = await t('bugs', this.context);
    const improvementsLabel = await t('improvements', this.context);
    const performanceLabel = await t('performance', this.context);
    const bestPracticesLabel = await t('bestPractices', this.context);
    const performanceIssuesLabel = await t('performanceIssues', this.context);
    const analyzedFilesLabel = await t('analyzedFiles', this.context);
    const generatedByLabel = await t('generatedBy', this.context);
    const reportDateLabel = await t('reportDate', this.context);

    // Calculate score color
    const scoreColor = findings.qualityScore >= 80 ? '#27ae60' : 
                       findings.qualityScore >= 60 ? '#f39c12' : 
                       findings.qualityScore >= 40 ? '#f39c12' : '#e74c3c';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.title}</title>
  <style>
    ${this.getCommonCSS()}
    ${this.getQualityCSS()}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 ${template.title}</h1>
      <p>${generatedOn} ${currentDate}</p>
    </header>

    <div class="content">
      <div class="summary">
        <h2>${qualityOverviewLabel}</h2>
        <div class="metrics">
          <div class="metric">
            <div class="metric-number" style="color: ${scoreColor}">${findings.qualityScore}</div>
            <div class="metric-label">${qualityScoreLabel}</div>
          </div>
          <div class="metric">
            <div class="metric-number">${findings.totalIssues}</div>
            <div class="metric-label">${totalIssuesLabel}</div>
          </div>
          <div class="metric">
            <div class="metric-number">${findings.analyzedFiles.length}</div>
            <div class="metric-label">${filesAnalyzedLabel}</div>
          </div>
        </div>

        <div class="quality-breakdown">
          <h3>${issueBreakdownLabel}</h3>
          <div class="quality-bars">
            <div class="quality-bar">
              <span class="quality-label">🐛 ${bugsLabel}</span>
              <div class="bar-container">
                <div class="bar bugs" style="width: ${(findings.bugs.length / findings.totalIssues * 100) || 0}%"></div>
              </div>
              <span class="quality-count">${findings.bugs.length}</span>
            </div>
            <div class="quality-bar">
              <span class="quality-label">💡 ${improvementsLabel}</span>
              <div class="bar-container">
                <div class="bar improvements" style="width: ${(findings.improvements.length / findings.totalIssues * 100) || 0}%"></div>
              </div>
              <span class="quality-count">${findings.improvements.length}</span>
            </div>
            <div class="quality-bar">
              <span class="quality-label">⚡ ${performanceLabel}</span>
              <div class="bar-container">
                <div class="bar performance" style="width: ${(findings.performance.length / findings.totalIssues * 100) || 0}%"></div>
              </div>
              <span class="quality-count">${findings.performance.length}</span>
            </div>
            <div class="quality-bar">
              <span class="quality-label">✨ ${bestPracticesLabel}</span>
              <div class="bar-container">
                <div class="bar best-practices" style="width: ${(findings.bestPractices.length / findings.totalIssues * 100) || 0}%"></div>
              </div>
              <span class="quality-count">${findings.bestPractices.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="findings-section">
        <h2>🐛 ${bugsLabel}</h2>
        ${await this.generateQualityIssuesHTML(findings.bugs, 'bug')}
      </div>

      <div class="findings-section">
        <h2>💡 ${improvementsLabel}</h2>
        ${await this.generateQualityIssuesHTML(findings.improvements, 'improvement')}
      </div>

      <div class="findings-section">
        <h2>⚡ ${performanceIssuesLabel}</h2>
        ${await this.generateQualityIssuesHTML(findings.performance, 'performance')}
      </div>

      <div class="findings-section">
        <h2>✨ ${bestPracticesLabel}</h2>
        ${await this.generateQualityIssuesHTML(findings.bestPractices, 'best-practice')}
      </div>

      <div class="analyzed-files">
        <h2>📁 ${analyzedFilesLabel}</h2>
        <ul>
          ${findings.analyzedFiles.map(file => `<li>${file}</li>`).join('')}
        </ul>
      </div>
    </div>

    <footer>
      <p>${generatedByLabel}</p>
      <p>${reportDateLabel}: ${currentDate}</p>
    </footer>
  </div>
</body>
</html>`;
  }

  /**
   * Generate HTML for security findings
   */
  private async generateSecurityFindingsHTML(findings: any[], severity: string): Promise<string> {
    if (findings.length === 0) {
      let noFindingsMsg = '';
      if (severity === 'high') {
        noFindingsMsg = await t('noHighSeverityFindings', this.context);
      } else if (severity === 'medium') {
        noFindingsMsg = await t('noMediumSeverityFindings', this.context);
      } else {
        noFindingsMsg = await t('noLowSeverityFindings', this.context);
      }
      return `<p class="no-findings">${noFindingsMsg}</p>`;
    }

    return findings.map(f => `
      <div class="finding-card ${severity}">
        <div class="finding-header">
          <span class="finding-type">${this.getSecurityTypeIcon(f.type)} ${f.type}</span>
          <span class="finding-file">${f.file}${f.line ? `:${f.line}` : ''}</span>
        </div>
        <p class="finding-message">${f.message}</p>
      </div>
    `).join('');
  }

  /**
   * Generate HTML for quality issues
   */
  private async generateQualityIssuesHTML(issues: any[], type: string): Promise<string> {
    if (issues.length === 0) {
      let noIssuesMsg = '';
      if (type === 'bug') {
        noIssuesMsg = await t('noBugsFound', this.context);
      } else if (type === 'improvement') {
        noIssuesMsg = await t('noImprovementIssues', this.context);
      } else if (type === 'performance') {
        noIssuesMsg = await t('noPerformanceIssuesFound', this.context);
      } else {
        noIssuesMsg = await t('noBestPracticeIssues', this.context);
      }
      return `<p class="no-findings">${noIssuesMsg}</p>`;
    }

    const suggestionLabel = await t('suggestion', this.context);

    return issues.map(issue => `
      <div class="issue-card ${issue.severity}">
        <div class="issue-header">
          <span class="issue-title">${issue.title}</span>
          <span class="issue-severity severity-${issue.severity}">${issue.severity.toUpperCase()}</span>
        </div>
        <p class="issue-description">${issue.description}</p>
        <div class="issue-location">
          <span class="issue-file">📄 ${issue.file}${issue.line ? `:${issue.line}` : ''}</span>
        </div>
        <div class="issue-suggestion">
          <strong>💡 ${suggestionLabel}</strong> ${issue.suggestion}
        </div>
      </div>
    `).join('');
  }

  /**
   * Get security type icon
   */
  private getSecurityTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'security': '🔒',
      'logic': '⚙️',
      'best-practice': '✨',
      'vulnerability': '🚨',
      'warning': '⚠️'
    };
    return icons[type] || '📋';
  }

  /**
   * Get common CSS styles
   */
  private getCommonCSS(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
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
        background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
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
        color: #2c3e50;
      }

      .summary h3 {
        font-size: 18px;
        margin: 20px 0 15px 0;
        color: #2c3e50;
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
        color: #3498db;
        margin-bottom: 8px;
      }

      .metric-label {
        font-size: 14px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .findings-section {
        margin-bottom: 40px;
      }

      .findings-section h2 {
        font-size: 22px;
        margin-bottom: 20px;
        color: #2c3e50;
        border-bottom: 2px solid #3498db;
        padding-bottom: 10px;
      }

      .no-findings {
        color: #888;
        font-style: italic;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
        text-align: center;
      }

      .analyzed-files {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 30px;
        margin-top: 40px;
      }

      .analyzed-files h2 {
        font-size: 20px;
        margin-bottom: 15px;
        color: #2c3e50;
      }

      .analyzed-files ul {
        list-style: none;
        padding: 0;
      }

      .analyzed-files li {
        padding: 8px 0;
        border-bottom: 1px solid #e0e0e0;
        color: #555;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }

      .analyzed-files li:last-child {
        border-bottom: none;
      }

      footer {
        background: #f8f9fa;
        padding: 20px;
        text-align: center;
        color: #666;
        font-size: 13px;
        border-top: 1px solid #e0e0e0;
      }

      footer p {
        margin: 5px 0;
      }

      .bar-container {
        flex: 1;
        height: 24px;
        background: #e0e0e0;
        border-radius: 12px;
        overflow: hidden;
        margin: 0 15px;
      }

      .bar {
        height: 100%;
        transition: width 0.3s ease;
      }
    `;
  }

  /**
   * Get security-specific CSS
   */
  private getSecurityCSS(): string {
    return `
      .severity-breakdown {
        margin-top: 30px;
      }

      .severity-bars {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .severity-bar {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .severity-label {
        min-width: 80px;
        font-weight: 500;
        font-size: 14px;
      }

      .severity-count {
        min-width: 40px;
        text-align: right;
        font-weight: bold;
        font-size: 14px;
      }

      .bar.high {
        background: linear-gradient(90deg, #e74c3c, #c0392b);
      }

      .bar.medium {
        background: linear-gradient(90deg, #f39c12, #e67e22);
      }

      .bar.low {
        background: linear-gradient(90deg, #27ae60, #229954);
      }

      .finding-card {
        background: white;
        border-left: 4px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .finding-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .finding-card.high {
        border-left-color: #e74c3c;
        background: #fff5f5;
      }

      .finding-card.medium {
        border-left-color: #f39c12;
        background: #fff8f0;
      }

      .finding-card.low {
        border-left-color: #27ae60;
        background: #f0fff4;
      }

      .finding-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .finding-type {
        font-weight: 600;
        font-size: 14px;
        color: #3498db;
        text-transform: capitalize;
      }

      .finding-file {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #666;
        background: #f0f0f0;
        padding: 4px 8px;
        border-radius: 4px;
      }

      .finding-message {
        font-size: 14px;
        color: #2c3e50;
        line-height: 1.6;
      }
    `;
  }

  /**
   * Get quality-specific CSS
   */
  private getQualityCSS(): string {
    return `
      .quality-breakdown {
        margin-top: 30px;
      }

      .quality-bars {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .quality-bar {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .quality-label {
        min-width: 150px;
        font-weight: 500;
        font-size: 14px;
      }

      .quality-count {
        min-width: 40px;
        text-align: right;
        font-weight: bold;
        font-size: 14px;
      }

      .bar.bugs {
        background: linear-gradient(90deg, #e74c3c, #c0392b);
      }

      .bar.improvements {
        background: linear-gradient(90deg, #3498db, #2980b9);
      }

      .bar.performance {
        background: linear-gradient(90deg, #f39c12, #e67e22);
      }

      .bar.best-practices {
        background: linear-gradient(90deg, #27ae60, #229954);
      }

      .issue-card {
        background: white;
        border-left: 4px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .issue-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .issue-card.high {
        border-left-color: #e74c3c;
        background: #fff5f5;
      }

      .issue-card.medium {
        border-left-color: #f39c12;
        background: #fff8f0;
      }

      .issue-card.low {
        border-left-color: #27ae60;
        background: #f0fff4;
      }

      .issue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .issue-title {
        font-weight: 600;
        font-size: 16px;
        color: #2c3e50;
      }

      .issue-severity {
        font-size: 11px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .severity-high {
        background: #ffebee;
        color: #e74c3c;
      }

      .severity-medium {
        background: #fff3e0;
        color: #f39c12;
      }

      .severity-low {
        background: #e8f5e9;
        color: #27ae60;
      }

      .issue-description {
        font-size: 14px;
        color: #555;
        line-height: 1.6;
        margin-bottom: 12px;
      }

      .issue-location {
        margin-bottom: 12px;
      }

      .issue-file {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #666;
        background: #f0f0f0;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
      }

      .issue-suggestion {
        background: #f0f7ff;
        border-left: 3px solid #3498db;
        padding: 12px;
        border-radius: 4px;
        font-size: 13px;
        color: #2c3e50;
        line-height: 1.5;
      }

      .issue-suggestion strong {
        color: #3498db;
      }
    `;
  }
}
