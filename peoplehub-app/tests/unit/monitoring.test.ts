// @ai:cl - Unit tests for monitoring library
import {
    metrics,
    recordApiRequest,
    setMemoryUsage,
    setUptime,
} from "@/lib/monitoring/metrics";

import { logger, createRequestLogger } from "@/lib/monitoring/logger";

describe("Metrics Collector", () => {
    beforeEach(() => {
        metrics.reset();
    });

    describe("Counter", () => {
        it("should increment counter", () => {
            metrics.incrementCounter("test_counter");
            expect(metrics.getCounterTotal("test_counter")).toBe(1);

            metrics.incrementCounter("test_counter");
            expect(metrics.getCounterTotal("test_counter")).toBe(2);
        });

        it("should increment counter with value", () => {
            metrics.incrementCounter("test_counter", undefined, 5);
            expect(metrics.getCounterTotal("test_counter")).toBe(5);
        });

        it("should handle counter with labels", () => {
            metrics.incrementCounter("http_requests", { method: "GET", path: "/api/health" });
            metrics.incrementCounter("http_requests", { method: "POST", path: "/api/users" });
            metrics.incrementCounter("http_requests", { method: "GET", path: "/api/health" });

            expect(metrics.getCounterTotal("http_requests", { method: "GET", path: "/api/health" })).toBe(2);
            expect(metrics.getCounterTotal("http_requests", { method: "POST", path: "/api/users" })).toBe(1);
        });
    });

    describe("Gauge", () => {
        it("should set gauge value", () => {
            metrics.setGauge("memory_usage", 1024);
            expect(metrics.getGaugeValue("memory_usage")).toBe(1024);

            metrics.setGauge("memory_usage", 2048);
            expect(metrics.getGaugeValue("memory_usage")).toBe(2048);
        });

        it("should handle gauge with labels", () => {
            metrics.setGauge("connections", 10, { db: "primary" });
            metrics.setGauge("connections", 5, { db: "replica" });

            expect(metrics.getGaugeValue("connections", { db: "primary" })).toBe(10);
            expect(metrics.getGaugeValue("connections", { db: "replica" })).toBe(5);
        });
    });

    describe("Histogram", () => {
        it("should observe histogram values", () => {
            metrics.observeHistogram("latency_ms", 50);
            metrics.observeHistogram("latency_ms", 100);
            metrics.observeHistogram("latency_ms", 200);

            const stats = metrics.getHistogramStats("latency_ms");
            expect(stats.count).toBe(3);
            expect(stats.sum).toBe(350);
        });

        it("should track bucket counts", () => {
            // Add some values in different buckets
            metrics.observeHistogram("response_time", 5);   // <= 5
            metrics.observeHistogram("response_time", 25);  // <= 25
            metrics.observeHistogram("response_time", 100); // <= 100
            metrics.observeHistogram("response_time", 500); // <= 500

            const stats = metrics.getHistogramStats("response_time");
            expect(stats.count).toBe(4);
        });
    });

    describe("Prometheus Export", () => {
        it("should export metrics in Prometheus format", () => {
            metrics.incrementCounter("http_requests_total", { method: "GET" });
            metrics.setGauge("active_connections", 42);

            const output = metrics.toPrometheusFormat();

            expect(output).toContain("# HELP http_requests_total Counter metric");
            expect(output).toContain("# TYPE http_requests_total counter");
            expect(output).toContain("http_requests_total{method=\"GET\"} 1");

            expect(output).toContain("# HELP active_connections Gauge metric");
            expect(output).toContain("# TYPE active_connections gauge");
            expect(output).toContain("active_connections 42");
        });
    });

    describe("Helper Functions", () => {
        it("should record API request", () => {
            recordApiRequest("GET", "/api/health", 200, 45);

            expect(metrics.getCounterTotal("http_requests_total", {
                method: "GET",
                path: "/api/health",
                status: "200"
            })).toBe(1);
        });

        it("should record error for 4xx/5xx status", () => {
            recordApiRequest("POST", "/api/users", 500, 100);

            expect(metrics.getCounterTotal("http_errors_total", {
                method: "POST",
                path: "/api/users",
                status: "500"
            })).toBe(1);
        });

        it("should set memory usage metrics", () => {
            setMemoryUsage();

            expect(metrics.getGaugeValue("nodejs_memory_heap_used_bytes")).toBeGreaterThan(0);
            expect(metrics.getGaugeValue("nodejs_memory_rss_bytes")).toBeGreaterThan(0);
        });

        it("should set uptime metric", () => {
            setUptime();

            expect(metrics.getGaugeValue("nodejs_uptime_seconds")).toBeGreaterThan(0);
        });
    });

    describe("Path Normalization", () => {
        it("should normalize UUID in path", () => {
            recordApiRequest("GET", "/api/users/550e8400-e29b-41d4-a716-446655440000", 200, 50);

            expect(metrics.getCounterTotal("http_requests_total", {
                method: "GET",
                path: "/api/users/:uuid",
                status: "200"
            })).toBe(1);
        });

        it("should normalize numeric IDs in path", () => {
            recordApiRequest("GET", "/api/posts/123", 200, 50);

            expect(metrics.getCounterTotal("http_requests_total", {
                method: "GET",
                path: "/api/posts/:id",
                status: "200"
            })).toBe(1);
        });
    });
});

describe("Logger", () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    it("should log info messages", () => {
        logger.info("Test message");

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        const logOutput = consoleSpy.mock.calls[0][0];
        expect(logOutput).toContain("Test message");
    });

    it("should log with additional data", () => {
        logger.info("Request completed", { statusCode: 200, path: "/api/health" });

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        const logOutput = consoleSpy.mock.calls[0][0];
        expect(logOutput).toContain("Request completed");
    });

    it("should create child logger with context", () => {
        const childLogger = createRequestLogger("req-123", "tenant-1", "user-1");
        childLogger.info("Processing request");

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        const logOutput = consoleSpy.mock.calls[0][0];
        expect(logOutput).toContain("Processing request");
        expect(logOutput).toContain("req-123");
    });

    describe("Log Levels", () => {
        let warnSpy: jest.SpyInstance;
        let errorSpy: jest.SpyInstance;

        beforeEach(() => {
            warnSpy = jest.spyOn(console, "warn").mockImplementation();
            errorSpy = jest.spyOn(console, "error").mockImplementation();
        });

        afterEach(() => {
            warnSpy.mockRestore();
            errorSpy.mockRestore();
        });

        it("should log warn messages", () => {
            logger.warn("Warning message");
            expect(warnSpy).toHaveBeenCalledTimes(1);
        });

        it("should log error messages", () => {
            logger.error("Error message");
            expect(errorSpy).toHaveBeenCalledTimes(1);
        });
    });
});
