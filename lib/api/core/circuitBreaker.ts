/**
 * lib/api/core/circuitBreaker.ts
 *
 * Circuit breaker for the external API client.
 * Protects the UI from hanging when an external server is unreachable.
 *
 * States:
 *   CLOSED    — normal operation, all requests pass through.
 *   OPEN      — too many failures; all requests are rejected immediately.
 *   HALF_OPEN — cooldown elapsed; one test request is allowed through.
 */

export class CircuitBreakerError extends Error {
    constructor(message = "Circuit breaker is OPEN — external API unavailable") {
        super(message);
        this.name = "CircuitBreakerError";
    }
}

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerConfig {
    failureThreshold: number;
    cooldownMs: number;
    timeout: number;
}

export class CircuitBreaker {
    private state: CircuitState = "CLOSED";
    private consecutiveFailures = 0;
    private lastFailureTime = 0;
    private readonly config: CircuitBreakerConfig;

    constructor(config: Partial<CircuitBreakerConfig> = {}) {
        this.config = {
            failureThreshold: config.failureThreshold ?? 5,
            cooldownMs: config.cooldownMs ?? 30_000,
            timeout: config.timeout ?? 60_000,
        };
    }

    /** Returns true if a request is allowed through right now. */
    canRequest(): boolean {
        if (this.state === "CLOSED") return true;

        if (this.state === "OPEN") {
            const elapsed = Date.now() - this.lastFailureTime;
            if (elapsed >= this.config.cooldownMs) {
                this.state = "HALF_OPEN";
                return true; // one test request
            }
            return false;
        }

        // HALF_OPEN — one request is already being tested
        return false;
    }

    /** Call this after a successful request. */
    onSuccess(): void {
        this.consecutiveFailures = 0;
        this.state = "CLOSED";
    }

    /** Call this after a failed request. */
    onFailure(): void {
        this.consecutiveFailures += 1;
        this.lastFailureTime = Date.now();

        if (this.consecutiveFailures >= this.config.failureThreshold) {
            this.state = "OPEN";
        }
    }

    /** Returns current circuit state (for observability). */
    getState(): CircuitState {
        return this.state;
    }

    /**
     * Wraps an async operation with circuit breaker logic.
     * Throws CircuitBreakerError if circuit is OPEN.
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (!this.canRequest()) {
            throw new CircuitBreakerError();
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            if (error instanceof CircuitBreakerError) throw error;
            this.onFailure();
            throw error;
        }
    }
}

/** Singleton instance used by the external client. */
export const circuitBreakerSingleton = new CircuitBreaker();
