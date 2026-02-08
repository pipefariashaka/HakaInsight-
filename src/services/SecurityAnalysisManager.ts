/**
 * Security Analysis Manager Service
 * Aggregates and manages security findings from analyzed files
 */

export interface SecurityFinding {
    file: string;
    type: 'security' | 'logic' | 'bestPractice';
    severity: 'high' | 'medium' | 'low';
    message: string;
    line?: number;
    id?: string; // Unique identifier for deduplication
}

export interface GroupedFindings {
    [file: string]: {
        [type: string]: SecurityFinding[];
    };
}

export interface SecuritySummary {
    totalFindings: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    analyzedFiles: string[];
    findings: SecurityFinding[];
    groupedFindings: GroupedFindings;
}

export class SecurityAnalysisManager {
    private findings: SecurityFinding[] = [];
    private analyzedFiles: Set<string> = new Set();

    /**
     * Generate a unique ID for a finding to detect duplicates
     */
    private generateFindingId(finding: SecurityFinding): string {
        // Create ID based on file, type, severity, and normalized message
        const normalizedMessage = finding.message.toLowerCase().trim();
        return `${finding.file}|${finding.type}|${finding.severity}|${normalizedMessage}`;
    }

    /**
     * Check if a finding is a duplicate
     */
    private isDuplicate(newFinding: SecurityFinding): boolean {
        const newId = this.generateFindingId(newFinding);
        return this.findings.some(existing => {
            const existingId = this.generateFindingId(existing);
            return existingId === newId;
        });
    }

    /**
     * Add findings from a file analysis
     */
    addFindings(fileName: string, analysisResult: any): void {
        this.analyzedFiles.add(fileName);

        // Add security warnings only
        if (analysisResult.securityWarnings && Array.isArray(analysisResult.securityWarnings)) {
            analysisResult.securityWarnings.forEach((warning: any) => {
                const finding: SecurityFinding = {
                    file: fileName,
                    type: 'security',
                    severity: warning.severity || 'medium',
                    message: warning.message,
                    line: warning.line,
                };

                // Only add if not duplicate
                if (!this.isDuplicate(finding)) {
                    finding.id = this.generateFindingId(finding);
                    this.findings.push(finding);
                }
            });
        }
    }

    /**
     * Group findings by file and type
     */
    private groupFindings(): GroupedFindings {
        const grouped: GroupedFindings = {};

        this.findings.forEach(finding => {
            // Initialize file group if not exists
            if (!grouped[finding.file]) {
                grouped[finding.file] = {
                    security: [],
                    logic: [],
                    bestPractice: []
                };
            }

            // Add to appropriate type group
            grouped[finding.file][finding.type].push(finding);
        });

        // Sort findings within each group by severity (high -> medium -> low)
        const severityOrder = { high: 0, medium: 1, low: 2 };
        Object.keys(grouped).forEach(file => {
            Object.keys(grouped[file]).forEach(type => {
                grouped[file][type].sort((a, b) => {
                    return severityOrder[a.severity] - severityOrder[b.severity];
                });
            });
        });

        return grouped;
    }

    /**
     * Get aggregated security summary
     */
    getSummary(): SecuritySummary {
        const summary: SecuritySummary = {
            totalFindings: this.findings.length,
            highSeverity: 0,
            mediumSeverity: 0,
            lowSeverity: 0,
            riskLevel: 'low',
            analyzedFiles: Array.from(this.analyzedFiles),
            findings: this.findings,
            groupedFindings: this.groupFindings(),
        };

        // Count by severity
        this.findings.forEach(finding => {
            if (finding.severity === 'high') {
                summary.highSeverity++;
            } else if (finding.severity === 'medium') {
                summary.mediumSeverity++;
            } else if (finding.severity === 'low') {
                summary.lowSeverity++;
            }
        });

        // Calculate risk level
        summary.riskLevel = this.calculateRiskLevel(summary);

        return summary;
    }

    /**
     * Calculate overall risk level based on findings
     * 
     * Algorithm:
     * - Critical: Any high severity finding OR score >= 12
     * - High: Score >= 6 (e.g., 2 high + 1 medium, or 3 medium)
     * - Medium: Score >= 3 (e.g., 1 high, or 1 medium + 1 low)
     * - Low: Score < 3 (only low severity findings)
     * 
     * Weighted scoring:
     * - High severity: 5 points (critical issues)
     * - Medium severity: 2 points (important issues)
     * - Low severity: 1 point (minor issues)
     */
    private calculateRiskLevel(summary: SecuritySummary): 'critical' | 'high' | 'medium' | 'low' {
        // Any high severity finding automatically means critical risk
        if (summary.highSeverity > 0) {
            return 'critical';
        }

        // Weighted score: high=5, medium=2, low=1
        const score = (summary.highSeverity * 5) + 
                      (summary.mediumSeverity * 2) + 
                      (summary.lowSeverity * 1);

        // Critical: Score >= 12 (e.g., 6+ medium severity issues)
        if (score >= 12) {
            return 'critical';
        } 
        // High: Score >= 6 (e.g., 3 medium severity issues)
        else if (score >= 6) {
            return 'high';
        } 
        // Medium: Score >= 3 (e.g., 1-2 medium severity issues)
        else if (score >= 3) {
            return 'medium';
        } 
        // Low: Score < 3 (only low severity findings)
        else if (score > 0) {
            return 'low';
        }
        
        return 'low';
    }

    /**
     * Clear all findings
     */
    clear(): void {
        this.findings = [];
        this.analyzedFiles.clear();
    }

    /**
     * Get findings for a specific file
     */
    getFindingsForFile(fileName: string): SecurityFinding[] {
        return this.findings.filter(f => f.file === fileName);
    }

    /**
     * Get findings by type
     */
    getFindingsByType(type: 'security' | 'logic' | 'bestPractice'): SecurityFinding[] {
        return this.findings.filter(f => f.type === type);
    }

    /**
     * Get findings by severity
     */
    getFindingsBySeverity(severity: 'high' | 'medium' | 'low'): SecurityFinding[] {
        return this.findings.filter(f => f.severity === severity);
    }

    /**
     * Check if there are any findings
     */
    hasFindings(): boolean {
        return this.findings.length > 0;
    }

    /**
     * Get all findings for cache persistence
     */
    getAllFindings(): SecurityFinding[] {
        return [...this.findings];
    }

    /**
     * Get list of analyzed files for cache persistence
     */
    getAnalyzedFiles(): string[] {
        return Array.from(this.analyzedFiles);
    }

    /**
     * Restore findings and analyzed files from cache
     */
    restoreFromCache(data: { findings: SecurityFinding[], analyzedFiles: string[] }): void {
        // Clear existing data
        this.findings = [];
        this.analyzedFiles.clear();

        // Restore findings
        if (data.findings && Array.isArray(data.findings)) {
            this.findings = [...data.findings];
        }

        // Restore analyzed files
        if (data.analyzedFiles && Array.isArray(data.analyzedFiles)) {
            data.analyzedFiles.forEach(file => this.analyzedFiles.add(file));
        }
    }
}
