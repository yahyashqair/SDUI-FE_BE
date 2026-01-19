/**
 * Central ErrorReporter for the MFE Shell
 * Can be integrated with Sentry or other monitoring tools.
 */

export interface ErrorContext {
    mfeName?: string;
    action?: string;
    extra?: Record<string, any>;
}

class ErrorReporter {
    report(error: Error, context: ErrorContext = {}) {
        const { mfeName, action, extra } = context;
        const timestamp = new Date().toISOString();

        console.error(`[ErrorReporter] [${timestamp}] ${mfeName ? `MFE: ${mfeName} | ` : ''}${action ? `Action: ${action} | ` : ''}`, error);

        if (extra) {
            console.error('[ErrorReporter] Context:', extra);
        }

        // INTEGRATION POINT:
        // window.Sentry?.captureException(error, { tags: { mfe: mfeName, action }, extra });
    }
}

export const errorReporter = new ErrorReporter();
