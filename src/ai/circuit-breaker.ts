/**
 * Circuit Breaker Pattern
 * Prevents cascading failures in AI operations
 */

// ============================================================================
// Types
// ============================================================================

interface CircuitState {
    isOpen: boolean;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
    lastSuccessTime: number;
    halfOpenAttempts: number;
}

interface CircuitBreakerOptions {
    failureThreshold: number;      // Number of failures before opening
    successThreshold: number;      // Successes in half-open to close
    resetTimeoutMs: number;        // Time before trying half-open
    halfOpenMaxAttempts: number;   // Max attempts in half-open state
    onStateChange?: (state: CircuitBreakerState) => void;
}

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 5,
    successThreshold: 3,
    resetTimeoutMs: 60000, // 1 minute
    halfOpenMaxAttempts: 3
};

// ============================================================================
// Circuit Breaker Class
// ============================================================================

export class CircuitBreaker {
    private state: CircuitState;
    private options: CircuitBreakerOptions;
    private name: string;

    constructor(name: string = 'default', options: Partial<CircuitBreakerOptions> = {}) {
        this.name = name;
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.state = {
            isOpen: false,
            failureCount: 0,
            successCount: 0,
            lastFailureTime: 0,
            lastSuccessTime: 0,
            halfOpenAttempts: 0
        };
    }

    /**
     * Get current circuit state
     */
    getState(): CircuitBreakerState {
        if (!this.state.isOpen) {
            return 'closed';
        }

        const timeSinceFailure = Date.now() - this.state.lastFailureTime;
        if (timeSinceFailure > this.options.resetTimeoutMs) {
            return 'half-open';
        }

        return 'open';
    }

    /**
     * Check if circuit allows requests
     */
    isAllowed(): boolean {
        const state = this.getState();

        if (state === 'closed') {
            return true;
        }

        if (state === 'half-open') {
            // Allow limited attempts in half-open
            return this.state.halfOpenAttempts < this.options.halfOpenMaxAttempts;
        }

        return false;
    }

    /**
     * Execute a function with circuit breaker protection
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        const state = this.getState();

        // Check if open
        if (state === 'open') {
            throw new CircuitBreakerError(
                `Circuit breaker '${this.name}' is open - too many recent failures`,
                this.getTimeUntilReset()
            );
        }

        // Track half-open attempts
        if (state === 'half-open') {
            this.state.halfOpenAttempts++;
        }

        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    /**
     * Record a successful execution
     */
    private recordSuccess(): void {
        this.state.successCount++;
        this.state.lastSuccessTime = Date.now();
        this.state.failureCount = 0; // Reset failure count on success

        const previousState = this.getState();

        // If in half-open and enough successes, close the circuit
        if (previousState === 'half-open') {
            if (this.state.successCount >= this.options.successThreshold) {
                this.state.isOpen = false;
                this.state.halfOpenAttempts = 0;
                this.notifyStateChange('closed');
                console.log(`[CircuitBreaker] ${this.name}: closed after ${this.state.successCount} successes`);
            }
        }
    }

    /**
     * Record a failed execution
     */
    private recordFailure(): void {
        this.state.failureCount++;
        this.state.lastFailureTime = Date.now();
        this.state.successCount = 0; // Reset success count on failure

        const previousState = this.getState();

        // Check if we should open the circuit
        if (this.state.failureCount >= this.options.failureThreshold) {
            if (!this.state.isOpen) {
                this.state.isOpen = true;
                this.notifyStateChange('open');
                console.log(`[CircuitBreaker] ${this.name}: opened after ${this.state.failureCount} failures`);
            }
        }

        // Reset half-open attempts if failed during half-open
        if (previousState === 'half-open') {
            this.state.halfOpenAttempts = this.options.halfOpenMaxAttempts; // Prevent more attempts
        }
    }

    /**
     * Get time until reset (for open state)
     */
    getTimeUntilReset(): number {
        if (!this.state.isOpen) return 0;
        
        const elapsed = Date.now() - this.state.lastFailureTime;
        const remaining = this.options.resetTimeoutMs - elapsed;
        return Math.max(0, remaining);
    }

    /**
     * Force reset the circuit breaker
     */
    reset(): void {
        const wasOpen = this.state.isOpen;
        
        this.state = {
            isOpen: false,
            failureCount: 0,
            successCount: 0,
            lastFailureTime: 0,
            lastSuccessTime: 0,
            halfOpenAttempts: 0
        };

        if (wasOpen) {
            this.notifyStateChange('closed');
        }
    }

    /**
     * Force open the circuit
     */
    forceOpen(): void {
        this.state.isOpen = true;
        this.state.lastFailureTime = Date.now();
        this.notifyStateChange('open');
    }

    /**
     * Get circuit statistics
     */
    getStats(): {
        state: CircuitBreakerState;
        failureCount: number;
        successCount: number;
        lastFailure: number | null;
        lastSuccess: number | null;
        timeUntilReset: number;
    } {
        return {
            state: this.getState(),
            failureCount: this.state.failureCount,
            successCount: this.state.successCount,
            lastFailure: this.state.lastFailureTime || null,
            lastSuccess: this.state.lastSuccessTime || null,
            timeUntilReset: this.getTimeUntilReset()
        };
    }

    /**
     * Notify state change callback
     */
    private notifyStateChange(newState: CircuitBreakerState): void {
        if (this.options.onStateChange) {
            try {
                this.options.onStateChange(newState);
            } catch (e) {
                console.error('Circuit breaker state change callback error:', e);
            }
        }
    }
}

// ============================================================================
// Circuit Breaker Error
// ============================================================================

export class CircuitBreakerError extends Error {
    public readonly retryAfterMs: number;

    constructor(message: string, retryAfterMs: number) {
        super(message);
        this.name = 'CircuitBreakerError';
        this.retryAfterMs = retryAfterMs;
    }
}

// ============================================================================
// Pre-configured Circuit Breakers
// ============================================================================

/**
 * AI operations circuit breaker
 * More lenient as AI calls are expected to sometimes fail
 */
export const aiCircuitBreaker = new CircuitBreaker('ai', {
    failureThreshold: 5,
    successThreshold: 2,
    resetTimeoutMs: 30000, // 30 seconds
    halfOpenMaxAttempts: 2,
    onStateChange: (state) => {
        console.log(`[AI Circuit] State changed to: ${state}`);
    }
});

/**
 * External API circuit breaker
 */
export const externalApiCircuitBreaker = new CircuitBreaker('external-api', {
    failureThreshold: 3,
    successThreshold: 2,
    resetTimeoutMs: 60000, // 1 minute
    halfOpenMaxAttempts: 1
});

/**
 * Database circuit breaker
 * Stricter as DB issues are critical
 */
export const dbCircuitBreaker = new CircuitBreaker('database', {
    failureThreshold: 3,
    successThreshold: 3,
    resetTimeoutMs: 10000, // 10 seconds
    halfOpenMaxAttempts: 1
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wrap a function with circuit breaker protection
 */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    circuitBreaker: CircuitBreaker
): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        return circuitBreaker.execute(() => fn(...args));
    }) as T;
}

/**
 * Create a circuit breaker with custom settings
 */
export function createCircuitBreaker(
    name: string,
    options?: Partial<CircuitBreakerOptions>
): CircuitBreaker {
    return new CircuitBreaker(name, options);
}
