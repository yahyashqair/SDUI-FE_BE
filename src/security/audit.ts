/**
 * Audit Logging
 * Provides structured audit logging for security-relevant events
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface AuditEvent {
    timestamp: string;
    action: string;
    userId?: string;
    resource: string;
    success: boolean;
    metadata?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
    correlationId?: string;
}

export interface AuditLogOptions {
    action: string;
    userId?: string;
    resource?: string;
    success?: boolean;
    metadata?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
    correlationId?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const AUDIT_LOG_DIR = process.env.AUDIT_LOG_DIR || path.join(process.cwd(), 'data', 'audit');
const AUDIT_LOG_RETENTION_DAYS = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90', 10);
const LOG_TO_CONSOLE = process.env.AUDIT_LOG_CONSOLE !== 'false';
const LOG_TO_FILE = process.env.AUDIT_LOG_FILE !== 'false';

// Ensure audit log directory exists
if (LOG_TO_FILE && !fs.existsSync(AUDIT_LOG_DIR)) {
    fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
}

// ============================================================================
// Logging Functions
// ============================================================================

/**
 * Generate correlation ID
 */
function generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current log file path
 */
function getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(AUDIT_LOG_DIR, `audit-${date}.jsonl`);
}

/**
 * Write audit event to file
 */
function writeToFile(event: AuditEvent): void {
    if (!LOG_TO_FILE) return;

    try {
        const logLine = JSON.stringify(event) + '\n';
        fs.appendFileSync(getLogFilePath(), logLine);
    } catch (error) {
        console.error('[Audit] Failed to write to file:', error);
    }
}

/**
 * Write audit event to console
 */
function writeToConsole(event: AuditEvent): void {
    if (!LOG_TO_CONSOLE) return;

    const level = event.success ? 'INFO' : 'WARN';
    const emoji = event.success ? '✓' : '✗';
    console.log(
        `[Audit] ${emoji} ${level} | ${event.action} | ${event.userId || 'anonymous'} | ${event.resource} | ${event.timestamp}`
    );
}

/**
 * Log an audit event
 */
export async function auditLog(options: AuditLogOptions): Promise<AuditEvent> {
    const event: AuditEvent = {
        timestamp: new Date().toISOString(),
        action: options.action,
        userId: options.userId,
        resource: options.resource || 'unknown',
        success: options.success ?? true,
        metadata: options.metadata,
        ip: options.ip,
        userAgent: options.userAgent,
        correlationId: options.correlationId || generateCorrelationId()
    };

    writeToFile(event);
    writeToConsole(event);

    return event;
}

/**
 * Log a security event (always treated as important)
 */
export async function securityLog(
    action: string,
    details: Omit<AuditLogOptions, 'action'>
): Promise<AuditEvent> {
    return auditLog({
        ...details,
        action: `SECURITY:${action}`,
        metadata: {
            ...details.metadata,
            securityEvent: true
        }
    });
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Read audit events from a specific date
 */
export async function getAuditEvents(
    date: string,
    filter?: Partial<AuditEvent>
): Promise<AuditEvent[]> {
    const logPath = path.join(AUDIT_LOG_DIR, `audit-${date}.jsonl`);
    
    if (!fs.existsSync(logPath)) {
        return [];
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    let events: AuditEvent[] = lines.map(line => {
        try {
            return JSON.parse(line) as AuditEvent;
        } catch {
            return null;
        }
    }).filter((event): event is AuditEvent => event !== null);

    // Apply filters
    if (filter) {
        events = events.filter(event => {
            for (const [key, value] of Object.entries(filter)) {
                if (event[key as keyof AuditEvent] !== value) {
                    return false;
                }
            }
            return true;
        });
    }

    return events;
}

/**
 * Get recent events for a user
 */
export async function getUserAuditEvents(
    userId: string,
    days: number = 7
): Promise<AuditEvent[]> {
    const events: AuditEvent[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEvents = await getAuditEvents(dateStr, { userId });
        events.push(...dayEvents);
    }

    return events.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

/**
 * Get failed events (potential security issues)
 */
export async function getFailedEvents(days: number = 1): Promise<AuditEvent[]> {
    const events: AuditEvent[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEvents = await getAuditEvents(dateStr, { success: false });
        events.push(...dayEvents);
    }

    return events;
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Clean up old audit logs
 */
export async function cleanupOldLogs(): Promise<number> {
    if (!fs.existsSync(AUDIT_LOG_DIR)) return 0;

    const files = fs.readdirSync(AUDIT_LOG_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUDIT_LOG_RETENTION_DAYS);
    
    let deletedCount = 0;

    for (const file of files) {
        if (!file.startsWith('audit-') || !file.endsWith('.jsonl')) continue;

        const dateMatch = file.match(/audit-(\d{4}-\d{2}-\d{2})\.jsonl/);
        if (!dateMatch) continue;

        const fileDate = new Date(dateMatch[1]);
        if (fileDate < cutoffDate) {
            fs.unlinkSync(path.join(AUDIT_LOG_DIR, file));
            deletedCount++;
        }
    }

    if (deletedCount > 0) {
        console.log(`[Audit] Cleaned up ${deletedCount} old log files`);
    }

    return deletedCount;
}

// Schedule daily cleanup
if (typeof setInterval !== 'undefined') {
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    setInterval(() => {
        cleanupOldLogs().catch(console.error);
    }, CLEANUP_INTERVAL);
}

// ============================================================================
// Predefined Audit Actions
// ============================================================================

export const AuditActions = {
    // Auth
    AUTH_LOGIN: 'auth.login',
    AUTH_LOGOUT: 'auth.logout',
    AUTH_FAILED: 'auth.failed',
    AUTH_TOKEN_REFRESH: 'auth.token_refresh',
    
    // Projects
    PROJECT_CREATE: 'project.create',
    PROJECT_UPDATE: 'project.update',
    PROJECT_DELETE: 'project.delete',
    
    // MFE
    MFE_CREATE: 'mfe.create',
    MFE_UPDATE: 'mfe.update',
    MFE_DELETE: 'mfe.delete',
    MFE_TOGGLE: 'mfe.toggle',
    
    // Functions
    FUNCTION_CREATE: 'function.create',
    FUNCTION_UPDATE: 'function.update',
    FUNCTION_DELETE: 'function.delete',
    FUNCTION_DEPLOY: 'function.deploy',
    
    // Releases
    RELEASE_CREATE: 'release.create',
    RELEASE_PROMOTE: 'release.promote',
    RELEASE_ROLLBACK: 'release.rollback',
    
    // AI
    AI_AGENT_INVOKE: 'ai.agent_invoke',
    AI_TOOL_EXECUTE: 'ai.tool_execute',
    AI_CODE_GENERATE: 'ai.code_generate',
    
    // Security
    SECURITY_RATE_LIMIT: 'security.rate_limit',
    SECURITY_VALIDATION_FAIL: 'security.validation_fail',
    SECURITY_ACCESS_DENIED: 'security.access_denied'
} as const;
