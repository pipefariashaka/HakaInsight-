/**
 * Quality Analysis Manager
 * Manages code quality findings separately from security findings
 */

export interface QualityIssue {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  suggestion: string;
  type: 'bug' | 'improvement' | 'performance' | 'bestPractice';
}

export interface QualityFindings {
  bugs: QualityIssue[];
  improvements: QualityIssue[];
  performance: QualityIssue[];
  bestPractices: QualityIssue[];
  qualityScore: number;
  totalIssues: number;
  analyzedFiles: string[];
}

export class QualityAnalysisManager {
  private bugs: QualityIssue[] = [];
  private improvements: QualityIssue[] = [];
  private performance: QualityIssue[] = [];
  private bestPractices: QualityIssue[] = [];
  private analyzedFiles: Set<string> = new Set();

  /**
   * Add quality issues from analysis result
   */
  addQualityIssues(fileName: string, issues: {
    bugs?: QualityIssue[];
    improvements?: QualityIssue[];
    performance?: QualityIssue[];
    bestPractices?: QualityIssue[];
  }): void {
    this.analyzedFiles.add(fileName);

    if (issues.bugs) {
      this.bugs.push(...issues.bugs.map(bug => ({ ...bug, file: fileName, type: 'bug' as const })));
    }

    if (issues.improvements) {
      this.improvements.push(...issues.improvements.map(imp => ({ ...imp, file: fileName, type: 'improvement' as const })));
    }

    if (issues.performance) {
      this.performance.push(...issues.performance.map(perf => ({ ...perf, file: fileName, type: 'performance' as const })));
    }

    if (issues.bestPractices) {
      this.bestPractices.push(...issues.bestPractices.map(bp => ({ ...bp, file: fileName, type: 'bestPractice' as const })));
    }
  }

  /**
   * Add findings from analysis result (converts warnings to quality issues)
   */
  addFindings(fileName: string, analysisResult: any): void {
    this.analyzedFiles.add(fileName);

    console.log('[QualityAnalysisManager] Processing findings for:', fileName);
    console.log('[QualityAnalysisManager] logicWarnings:', analysisResult.logicWarnings?.length || 0);
    console.log('[QualityAnalysisManager] bestPracticeWarnings:', analysisResult.bestPracticeWarnings?.length || 0);

    // Add logic warnings as bugs
    if (analysisResult.logicWarnings && Array.isArray(analysisResult.logicWarnings)) {
      analysisResult.logicWarnings.forEach((warning: any) => {
        this.bugs.push({
          title: 'Logic Issue',
          description: warning.message,
          severity: warning.severity || 'medium',
          file: fileName,
          line: warning.line,
          suggestion: 'Review the logic and ensure it handles all cases correctly.',
          type: 'bug'
        });
      });
      console.log('[QualityAnalysisManager] Added', analysisResult.logicWarnings.length, 'logic warnings as bugs');
    }

    // Add best practice warnings
    if (analysisResult.bestPracticeWarnings && Array.isArray(analysisResult.bestPracticeWarnings)) {
      analysisResult.bestPracticeWarnings.forEach((warning: any) => {
        this.bestPractices.push({
          title: 'Best Practice',
          description: warning.message,
          severity: warning.severity || 'low',
          file: fileName,
          line: warning.line,
          suggestion: 'Consider following best practices to improve code quality.',
          type: 'bestPractice'
        });
      });
      console.log('[QualityAnalysisManager] Added', analysisResult.bestPracticeWarnings.length, 'best practice warnings');
    }
    
    console.log('[QualityAnalysisManager] Total bugs:', this.bugs.length);
    console.log('[QualityAnalysisManager] Total best practices:', this.bestPractices.length);
  }

  /**
   * Calculate quality score based on issues
   * Score: 100 - (bugs * 10 + improvements * 5 + performance * 7 + bestPractices * 3)
   * Minimum score is 0
   */
  private calculateQualityScore(): number {
    const bugPenalty = this.bugs.length * 10;
    const improvementPenalty = this.improvements.length * 5;
    const performancePenalty = this.performance.length * 7;
    const bestPracticePenalty = this.bestPractices.length * 3;

    const totalPenalty = bugPenalty + improvementPenalty + performancePenalty + bestPracticePenalty;
    const score = Math.max(0, 100 - totalPenalty);

    return score;
  }

  /**
   * Get summary of all quality findings
   */
  getSummary(): QualityFindings {
    return {
      bugs: this.bugs,
      improvements: this.improvements,
      performance: this.performance,
      bestPractices: this.bestPractices,
      qualityScore: this.calculateQualityScore(),
      totalIssues: this.bugs.length + this.improvements.length + this.performance.length + this.bestPractices.length,
      analyzedFiles: Array.from(this.analyzedFiles)
    };
  }

  /**
   * Clear all quality findings
   */
  clear(): void {
    this.bugs = [];
    this.improvements = [];
    this.performance = [];
    this.bestPractices = [];
    this.analyzedFiles.clear();
  }

  /**
   * Restore from cached data
   */
  restoreFromCache(data: {
    bugs: QualityIssue[];
    improvements: QualityIssue[];
    performance: QualityIssue[];
    bestPractices: QualityIssue[];
    analyzedFiles: string[];
  }): void {
    this.bugs = data.bugs || [];
    this.improvements = data.improvements || [];
    this.performance = data.performance || [];
    this.bestPractices = data.bestPractices || [];
    this.analyzedFiles = new Set(data.analyzedFiles || []);
  }

  /**
   * Get data for caching
   */
  getCacheData(): {
    bugs: QualityIssue[];
    improvements: QualityIssue[];
    performance: QualityIssue[];
    bestPractices: QualityIssue[];
    analyzedFiles: string[];
  } {
    return {
      bugs: this.bugs,
      improvements: this.improvements,
      performance: this.performance,
      bestPractices: this.bestPractices,
      analyzedFiles: Array.from(this.analyzedFiles)
    };
  }
}
