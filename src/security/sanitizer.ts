/**
 * Input Sanitization Utilities
 * Provides functions to sanitize user input
 */

/**
 * HTML entities for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
    return str.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char);
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize string for use in SQL LIKE patterns
 */
export function escapeSqlLike(str: string): string {
    return str.replace(/[%_\\]/g, char => '\\' + char);
}

/**
 * Sanitize string for safe use in shell commands
 * WARNING: Prefer using parameterized commands over string interpolation
 */
export function escapeShell(str: string): string {
    return str.replace(/[`$\\!"'&|;><(){}[\]*?#~]/g, '\\$&');
}

/**
 * Remove control characters from string
 */
export function removeControlChars(str: string): string {
    // eslint-disable-next-line no-control-regex
    return str.replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
    // Remove path separators and dangerous characters
    return filename
        .replace(/[/\\:*?"<>|]/g, '')
        .replace(/\.\./g, '')
        .replace(/^\./, '_')
        .substring(0, 255);
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
    try {
        const parsed = new URL(url);
        
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Invalid protocol');
        }
        
        return parsed.toString();
    } catch {
        return '';
    }
}

/**
 * Sanitize JSON string
 */
export function sanitizeJson(json: string): string {
    try {
        // Parse and re-stringify to ensure valid JSON
        return JSON.stringify(JSON.parse(json));
    } catch {
        return '{}';
    }
}

/**
 * Trim and normalize whitespace
 */
export function normalizeWhitespace(str: string): string {
    return str.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize identifier (for table/column names, etc.)
 */
export function sanitizeIdentifier(str: string): string {
    return str.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitize output for API responses
 */
export function sanitizeOutput(data: unknown): unknown {
    if (typeof data === 'string') {
        return escapeHtml(data);
    }
    
    if (Array.isArray(data)) {
        return data.map(sanitizeOutput);
    }
    
    if (data && typeof data === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            // Skip sensitive fields
            if (['password', 'secret', 'token', 'apiKey', 'api_key'].includes(key)) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = sanitizeOutput(value);
            }
        }
        return sanitized;
    }
    
    return data;
}

/**
 * Sanitize error messages for external display
 * Removes stack traces and internal details
 */
export function sanitizeError(error: Error | string): string {
    const message = typeof error === 'string' ? error : error.message;
    
    // Remove file paths
    let sanitized = message.replace(/\/[^\s:]+/g, '[path]');
    
    // Remove line numbers
    sanitized = sanitized.replace(/:\d+:\d+/g, '');
    
    // Truncate if too long
    return truncate(sanitized, 200);
}

/**
 * Create a sanitization pipeline
 */
export function createSanitizer(...fns: Array<(str: string) => string>) {
    return (input: string): string => {
        return fns.reduce((result, fn) => fn(result), input);
    };
}

/**
 * Default text sanitizer
 */
export const sanitizeText = createSanitizer(
    removeControlChars,
    normalizeWhitespace,
    escapeHtml
);

/**
 * Default input sanitizer (less strict)
 */
export const sanitizeInput = createSanitizer(
    removeControlChars,
    normalizeWhitespace
);
