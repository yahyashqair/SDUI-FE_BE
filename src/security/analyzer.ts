/**
 * Code Security Analyzer
 * Analyzes AI-generated code for security issues before execution
 */

// ============================================================================
// Types
// ============================================================================

export interface CodeAnalysisResult {
    safe: boolean;
    issues: CodeIssue[];
    warnings: CodeWarning[];
    metrics: CodeMetrics;
}

export interface CodeIssue {
    type: 'critical' | 'high' | 'medium';
    category: string;
    message: string;
    line?: number;
    pattern?: string;
}

export interface CodeWarning {
    type: 'warning' | 'info';
    category: string;
    message: string;
    line?: number;
}

export interface CodeMetrics {
    lines: number;
    characters: number;
    hasImports: boolean;
    hasExports: boolean;
    estimatedComplexity: 'low' | 'medium' | 'high';
}

// ============================================================================
// Dangerous Patterns
// ============================================================================

interface DangerousPattern {
    pattern: RegExp;
    category: string;
    message: string;
    severity: 'critical' | 'high' | 'medium';
}

const DANGEROUS_PATTERNS: DangerousPattern[] = [
    // Code execution
    {
        pattern: /\beval\s*\(/gi,
        category: 'code_execution',
        message: 'Use of eval() can execute arbitrary code',
        severity: 'critical'
    },
    {
        pattern: /\bnew\s+Function\s*\(/gi,
        category: 'code_execution',
        message: 'Dynamic Function constructor can execute arbitrary code',
        severity: 'critical'
    },
    {
        pattern: /\bsetTimeout\s*\(\s*['"`]/gi,
        category: 'code_execution',
        message: 'setTimeout with string argument can execute arbitrary code',
        severity: 'high'
    },
    {
        pattern: /\bsetInterval\s*\(\s*['"`]/gi,
        category: 'code_execution',
        message: 'setInterval with string argument can execute arbitrary code',
        severity: 'high'
    },
    
    // File system
    {
        pattern: /\brequire\s*\(\s*['"`]fs['"`]\s*\)/gi,
        category: 'file_system',
        message: 'Direct fs module access detected',
        severity: 'high'
    },
    {
        pattern: /\bimport\s+.*\s+from\s+['"`]fs['"`]/gi,
        category: 'file_system',
        message: 'Direct fs module import detected',
        severity: 'high'
    },
    {
        pattern: /\bfs\.(unlink|rmdir|rm|writeFile|appendFile|chmod|chown)/gi,
        category: 'file_system',
        message: 'Destructive file system operation detected',
        severity: 'critical'
    },
    
    // Process/System
    {
        pattern: /\brequire\s*\(\s*['"`]child_process['"`]\s*\)/gi,
        category: 'process',
        message: 'child_process module access detected',
        severity: 'critical'
    },
    {
        pattern: /\bimport\s+.*\s+from\s+['"`]child_process['"`]/gi,
        category: 'process',
        message: 'child_process module import detected',
        severity: 'critical'
    },
    {
        pattern: /\b(exec|spawn|execSync|spawnSync)\s*\(/gi,
        category: 'process',
        message: 'Shell command execution detected',
        severity: 'critical'
    },
    {
        pattern: /\bprocess\.(exit|kill|abort)/gi,
        category: 'process',
        message: 'Process termination command detected',
        severity: 'critical'
    },
    {
        pattern: /\bprocess\.env/gi,
        category: 'environment',
        message: 'Environment variable access detected',
        severity: 'medium'
    },
    
    // Network
    {
        pattern: /\brequire\s*\(\s*['"`](http|https|net|dgram)['"`]\s*\)/gi,
        category: 'network',
        message: 'Network module access detected',
        severity: 'high'
    },
    {
        pattern: /\bfetch\s*\(/gi,
        category: 'network',
        message: 'Network fetch detected - verify destination',
        severity: 'medium'
    },
    
    // Crypto/Secrets
    {
        pattern: /(password|secret|api_key|apikey|token|private_key)\s*[=:]\s*['"`][^'"`]+['"`]/gi,
        category: 'secrets',
        message: 'Hardcoded secret or credential detected',
        severity: 'critical'
    },
    
    // Prototype pollution
    {
        pattern: /__proto__/gi,
        category: 'prototype_pollution',
        message: '__proto__ access can lead to prototype pollution',
        severity: 'high'
    },
    {
        pattern: /\bconstructor\s*\[\s*['"`]prototype['"`]\s*\]/gi,
        category: 'prototype_pollution',
        message: 'Prototype manipulation detected',
        severity: 'high'
    },
    
    // SQL Injection patterns (in string templates)
    {
        pattern: /`[^`]*\$\{[^}]+\}[^`]*(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/gi,
        category: 'sql_injection',
        message: 'Potential SQL injection in template string',
        severity: 'high'
    },
    
    // Path traversal
    {
        pattern: /\.\.\//g,
        category: 'path_traversal',
        message: 'Path traversal pattern detected',
        severity: 'medium'
    }
];

// ============================================================================
// Warning Patterns
// ============================================================================

interface WarningPattern {
    pattern: RegExp;
    category: string;
    message: string;
}

const WARNING_PATTERNS: WarningPattern[] = [
    {
        pattern: /while\s*\(\s*true\s*\)/gi,
        category: 'infinite_loop',
        message: 'Potential infinite loop detected'
    },
    {
        pattern: /for\s*\(\s*;\s*;\s*\)/gi,
        category: 'infinite_loop',
        message: 'Potential infinite loop detected'
    },
    {
        pattern: /console\.(log|error|warn|debug)/gi,
        category: 'debugging',
        message: 'Console statement should be removed in production'
    },
    {
        pattern: /debugger\s*;/gi,
        category: 'debugging',
        message: 'Debugger statement should be removed'
    },
    {
        pattern: /TODO|FIXME|HACK|XXX/gi,
        category: 'incomplete',
        message: 'Code contains TODO/FIXME markers'
    },
    {
        pattern: /\bany\b/gi,
        category: 'type_safety',
        message: 'Use of "any" type reduces type safety'
    },
    {
        pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/gi,
        category: 'error_handling',
        message: 'Empty catch block swallows errors'
    }
];

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Find line number for a match
 */
function findLineNumber(code: string, matchIndex: number): number {
    const lines = code.substring(0, matchIndex).split('\n');
    return lines.length;
}

/**
 * Analyze code for dangerous patterns
 */
function analyzePatterns(code: string): { issues: CodeIssue[], warnings: CodeWarning[] } {
    const issues: CodeIssue[] = [];
    const warnings: CodeWarning[] = [];

    // Check dangerous patterns
    for (const { pattern, category, message, severity } of DANGEROUS_PATTERNS) {
        pattern.lastIndex = 0; // Reset regex state
        let match;
        while ((match = pattern.exec(code)) !== null) {
            issues.push({
                type: severity,
                category,
                message,
                line: findLineNumber(code, match.index),
                pattern: match[0]
            });
        }
    }

    // Check warning patterns
    for (const { pattern, category, message } of WARNING_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(code)) !== null) {
            warnings.push({
                type: 'warning',
                category,
                message,
                line: findLineNumber(code, match.index)
            });
        }
    }

    return { issues, warnings };
}

/**
 * Calculate code metrics
 */
function calculateMetrics(code: string): CodeMetrics {
    const lines = code.split('\n').length;
    const characters = code.length;
    const hasImports = /\b(import|require)\b/.test(code);
    const hasExports = /\b(export|module\.exports)\b/.test(code);
    
    // Estimate complexity based on control flow statements
    const controlFlowCount = (code.match(/\b(if|else|for|while|switch|try|catch)\b/g) || []).length;
    const functionCount = (code.match(/\b(function|=>)\b/g) || []).length;
    const complexity = controlFlowCount + functionCount;
    
    let estimatedComplexity: 'low' | 'medium' | 'high';
    if (complexity < 5) {
        estimatedComplexity = 'low';
    } else if (complexity < 15) {
        estimatedComplexity = 'medium';
    } else {
        estimatedComplexity = 'high';
    }

    return {
        lines,
        characters,
        hasImports,
        hasExports,
        estimatedComplexity
    };
}

/**
 * Main analysis function
 */
export async function analyzeGeneratedCode(
    code: string,
    language: 'javascript' | 'typescript' = 'javascript'
): Promise<CodeAnalysisResult> {
    // Basic validation
    if (!code || typeof code !== 'string') {
        return {
            safe: false,
            issues: [{
                type: 'critical',
                category: 'invalid',
                message: 'Invalid code input'
            }],
            warnings: [],
            metrics: {
                lines: 0,
                characters: 0,
                hasImports: false,
                hasExports: false,
                estimatedComplexity: 'low'
            }
        };
    }

    // Size check
    const MAX_CODE_SIZE = 100000; // 100KB
    if (code.length > MAX_CODE_SIZE) {
        return {
            safe: false,
            issues: [{
                type: 'critical',
                category: 'size',
                message: `Code exceeds maximum size of ${MAX_CODE_SIZE} characters`
            }],
            warnings: [],
            metrics: calculateMetrics(code)
        };
    }

    // Pattern analysis
    const { issues, warnings } = analyzePatterns(code);
    
    // Calculate metrics
    const metrics = calculateMetrics(code);

    // Add size warning if large
    if (metrics.characters > 50000) {
        warnings.push({
            type: 'warning',
            category: 'size',
            message: 'Code size is large, consider splitting'
        });
    }

    // Determine if safe (no critical or high severity issues)
    const safe = !issues.some(issue => 
        issue.type === 'critical' || issue.type === 'high'
    );

    return {
        safe,
        issues,
        warnings,
        metrics
    };
}

/**
 * Quick safety check (faster, less detailed)
 */
export function quickSafetyCheck(code: string): boolean {
    if (!code || typeof code !== 'string') return false;
    if (code.length > 100000) return false;

    // Check only critical patterns
    const criticalPatterns = DANGEROUS_PATTERNS.filter(p => p.severity === 'critical');
    
    for (const { pattern } of criticalPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(code)) {
            return false;
        }
    }

    return true;
}

/**
 * Sanitize code by removing dangerous patterns (experimental)
 */
export function sanitizeCode(code: string): string {
    let sanitized = code;

    // Remove obvious dangerous patterns
    sanitized = sanitized.replace(/\beval\s*\([^)]*\)/gi, '/* eval removed */');
    sanitized = sanitized.replace(/\bnew\s+Function\s*\([^)]*\)/gi, '/* Function constructor removed */');
    
    return sanitized;
}
