/**
 * lib/api/core/logger.ts
 *
 * Structured logger for the API layer. Sanitizes sensitive data before logging,
 * batches log entries via an async queue, and supports multiple transports
 * (console, remote API, Sentry, DataDog). In production only ERROR and WARN
 * are forwarded to remote transports.
 */

import { env } from "@/lib/config/env";

// ── Window augmentation ──────────────────────────────────────────────────────

declare global {
    interface Window {
        __correlationId?: string;
    }
}

// ── Sensitive patterns ───────────────────────────────────────────────────────

const SENSITIVE_PATTERNS: string[] = [
    "password",
    "token",
    "bearer",
    "secret",
    "auth",
    "authorization",
    "api_key",
    "session",
    "cookie",
    "credential",
    "ssn",
    "credit_card",
    "cvv",
    "pin",
    "access_token",
    "refresh_token",
];

// ── Log levels ───────────────────────────────────────────────────────────────

export const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

// ── Types ────────────────────────────────────────────────────────────────────

export interface LogEntry {
    level: LogLevel;
    message: string;
    data?: unknown;
    timestamp: string;
    correlationId?: string;
}

export interface LogTransport {
    name: string;
    send(entry: LogEntry): void;
}

// ── Sanitization ─────────────────────────────────────────────────────────────

function isSensitiveKey(key: string): boolean {
    const lower = key.toLowerCase();
    return SENSITIVE_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Recursively sanitizes an object, replacing sensitive values with [REDACTED].
 * Uses WeakSet to detect circular references. Caps depth at 5, arrays at 100.
 */
export function sanitizeData(
    data: unknown,
    depth = 0,
    seen: WeakSet<object> = new WeakSet()
): unknown {
    if (depth > 5) return "[MAX_DEPTH]";
    if (data === null || data === undefined) return data;
    if (typeof data !== "object") return data;

    if (seen.has(data as object)) return "[CIRCULAR]";
    seen.add(data as object);

    if (Array.isArray(data)) {
        const capped = data.slice(0, 100);
        return capped.map((item) => sanitizeData(item, depth + 1, seen));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        sanitized[key] = isSensitiveKey(key)
            ? "[REDACTED]"
            : sanitizeData(value, depth + 1, seen);
    }
    return sanitized;
}

// ── Transports ───────────────────────────────────────────────────────────────

const consoleTransport: LogTransport = {
    name: "console",
    send(entry: LogEntry): void {
        const prefix = `[${entry.level}] ${entry.timestamp}`;
        const cid = entry.correlationId ? ` (cid:${entry.correlationId})` : "";
        const msg = `${prefix}${cid} ${entry.message}`;
        /* eslint-disable no-console */
        const methods = { ERROR: console.error, WARN: console.warn, INFO: console.info, DEBUG: console.debug } as const;
        (methods[entry.level] ?? console.log)(msg, entry.data ?? "");
        /* eslint-enable no-console */
    },
};

const sentryTransport: LogTransport = {
    name: "sentry",
    send(entry: LogEntry): void {
        // Sentry SDK integration — forward errors only
        if (entry.level !== "ERROR") return;
        if (typeof window === "undefined") return;
        // @ts-expect-error — Sentry loaded via CDN or next-sentry, may not be typed
        if (typeof window.Sentry !== "undefined" && window.Sentry) {
            // @ts-expect-error — dynamic Sentry access
            window.Sentry.captureMessage(entry.message, {
                level: "error",
                extra: entry.data,
            });
        }
    },
};

const dataDogTransport: LogTransport = {
    name: "datadog",
    send(entry: LogEntry): void {
        if (entry.level !== "ERROR" && entry.level !== "WARN") return;
        if (typeof window === "undefined") return;
        // @ts-expect-error — DataDog RUM loaded externally
        if (typeof window.DD_RUM !== "undefined" && window.DD_RUM) {
            // @ts-expect-error — dynamic DataDog access
            window.DD_RUM.addError(entry.message, { extra: entry.data });
        }
    },
};

function createApiTransport(): LogTransport {
    return {
        name: "api",
        send(entry: LogEntry): void {
            const endpoint = env.NEXT_PUBLIC_LOG_ENDPOINT;
            if (!endpoint) return;
            if (entry.level !== "ERROR" && entry.level !== "WARN") return;
            // Fire-and-forget — use sendBeacon for reliability during unload
            const payload = JSON.stringify(entry);
            if (typeof navigator !== "undefined" && navigator.sendBeacon) {
                navigator.sendBeacon(endpoint, payload);
            } else {
                fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: payload,
                    keepalive: true,
                }).catch(() => {
                    /* intentionally swallowed — logger must never throw */
                });
            }
        },
    };
}

// ── Log queue ─────────────────────────────────────────────────────────────────

const logQueue: LogEntry[] = [];
let queueScheduled = false;

function scheduleFlush(): void {
    if (queueScheduled) return;
    queueScheduled = true;

    if (
        typeof window !== "undefined" &&
        typeof window.requestIdleCallback === "function"
    ) {
        window.requestIdleCallback(() => {
            flushQueue();
            queueScheduled = false;
        });
    } else {
        setTimeout(() => {
            flushQueue();
            queueScheduled = false;
        }, 0);
    }
}

function flushQueue(): void {
    const entries = logQueue.splice(0, logQueue.length);
    for (const entry of entries) {
        dispatchToTransports(entry);
    }
}

// Flush on page unload so no logs are dropped
if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
        flushQueue();
    });
}

// ── Transport manager ─────────────────────────────────────────────────────────

let activeTransports: LogTransport[] = [
    consoleTransport,
    sentryTransport,
    dataDogTransport,
    createApiTransport(),
];

let currentLogLevel: number =
    env.NODE_ENV === "development" ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

export function setLogLevel(level: LogLevel): void {
    currentLogLevel = LOG_LEVELS[level];
}

export function addLogTransport(transport: LogTransport): void {
    activeTransports.push(transport);
}

export function removeLogTransport(name: string): void {
    activeTransports = activeTransports.filter((t) => t.name !== name);
}

function dispatchToTransports(entry: LogEntry): void {
    const entryLevel = LOG_LEVELS[entry.level];

    // In production, suppress INFO and DEBUG from remote transports
    const isRemote = (t: LogTransport) =>
        t.name !== "console";

    for (const transport of activeTransports) {
        if (env.NODE_ENV === "production" && isRemote(transport)) {
            if (entryLevel > LOG_LEVELS.WARN) continue;
        }
        try {
            transport.send(entry);
        } catch {
            // Transport failure must never crash the app
        }
    }
}

// ── Core log function ─────────────────────────────────────────────────────────

function log(level: LogLevel, message: string, data?: unknown): void {
    if (LOG_LEVELS[level] > currentLogLevel) return;

    const entry: LogEntry = {
        level,
        message,
        data: data !== undefined ? sanitizeData(data) : undefined,
        timestamp: new Date().toISOString(),
        correlationId:
            typeof window !== "undefined"
                ? window.__correlationId
                : undefined,
    };

    logQueue.push(entry);
    scheduleFlush();
}

// ── Public API ────────────────────────────────────────────────────────────────

export const logger = {
    debug: (message: string, data?: unknown): void =>
        log("DEBUG", message, data),
    info: (message: string, data?: unknown): void =>
        log("INFO", message, data),
    warn: (message: string, data?: unknown): void =>
        log("WARN", message, data),
    error: (message: string, data?: unknown): void =>
        log("ERROR", message, data),
};

export default logger;
