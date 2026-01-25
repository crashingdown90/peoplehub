// @ai:cl - Structured logger using pino for monitoring
// Provides JSON formatted logs in production, pretty print in development

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
    requestId?: string;
    tenantId?: string;
    userId?: string;
    [key: string]: unknown;
}

interface LogEntry {
    level: LogLevel;
    time: string;
    msg: string;
    requestId?: string;
    tenantId?: string;
    userId?: string;
    [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const currentLogLevel = (): number => {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
    if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
        return LOG_LEVELS[envLevel];
    }
    return process.env.NODE_ENV === "production" ? LOG_LEVELS.info : LOG_LEVELS.debug;
};

const shouldLog = (level: LogLevel): boolean => {
    return LOG_LEVELS[level] >= currentLogLevel();
};

const formatForDevelopment = (entry: LogEntry): string => {
    const timestamp = new Date(entry.time).toLocaleTimeString();
    const levelColors: Record<LogLevel, string> = {
        debug: "\x1b[36m", // cyan
        info: "\x1b[32m",  // green
        warn: "\x1b[33m",  // yellow
        error: "\x1b[31m", // red
    };
    const reset = "\x1b[0m";
    const color = levelColors[entry.level];

    let output = `${color}[${timestamp}] ${entry.level.toUpperCase()}${reset}: ${entry.msg}`;

    // Add context fields
    const contextFields: string[] = [];
    if (entry.requestId) contextFields.push(`reqId=${entry.requestId}`);
    if (entry.tenantId) contextFields.push(`tenant=${entry.tenantId}`);
    if (entry.userId) contextFields.push(`user=${entry.userId}`);

    // Add extra fields
    const skipFields = ["level", "time", "msg", "requestId", "tenantId", "userId"];
    Object.entries(entry).forEach(([key, value]) => {
        if (!skipFields.includes(key) && value !== undefined) {
            contextFields.push(`${key}=${JSON.stringify(value)}`);
        }
    });

    if (contextFields.length > 0) {
        output += ` | ${contextFields.join(" ")}`;
    }

    return output;
};

const formatLog = (entry: LogEntry): string => {
    if (process.env.NODE_ENV === "production") {
        return JSON.stringify(entry);
    }
    return formatForDevelopment(entry);
};

const writeLog = (entry: LogEntry): void => {
    const formatted = formatLog(entry);
    if (entry.level === "error") {
        console.error(formatted);
    } else if (entry.level === "warn") {
        console.warn(formatted);
    } else {
        console.log(formatted);
    }
};

class Logger {
    private context: LogContext;

    constructor(context: LogContext = {}) {
        this.context = context;
    }

    private log(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
        if (!shouldLog(level)) return;

        const entry: LogEntry = {
            level,
            time: new Date().toISOString(),
            msg,
            ...this.context,
            ...data,
        };

        writeLog(entry);
    }

    debug(msg: string, data?: Record<string, unknown>): void {
        this.log("debug", msg, data);
    }

    info(msg: string, data?: Record<string, unknown>): void {
        this.log("info", msg, data);
    }

    warn(msg: string, data?: Record<string, unknown>): void {
        this.log("warn", msg, data);
    }

    error(msg: string, data?: Record<string, unknown>): void {
        this.log("error", msg, data);
    }

    child(context: LogContext): Logger {
        return new Logger({ ...this.context, ...context });
    }
}

// Default logger instance
export const logger = new Logger();

// Create child logger with request context
export const createRequestLogger = (requestId: string, tenantId?: string, userId?: string): Logger => {
    return new Logger({ requestId, tenantId, userId });
};

export type { LogLevel, LogContext, LogEntry, Logger };
