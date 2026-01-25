// @ai:cl - Metrics collection for Prometheus-compatible monitoring
// Collects API latency, error counts, and system metrics

interface MetricValue {
    value: number;
    timestamp: number;
    labels?: Record<string, string>;
}

interface HistogramBucket {
    le: number;
    count: number;
}

interface HistogramValue {
    buckets: HistogramBucket[];
    sum: number;
    count: number;
    labels?: Record<string, string>;
}

// In-memory metrics storage
class MetricsCollector {
    private counters: Map<string, MetricValue[]> = new Map();
    private gauges: Map<string, MetricValue> = new Map();
    private histograms: Map<string, HistogramValue[]> = new Map();

    // Default histogram buckets for latency (in ms)
    private readonly latencyBuckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

    // Counter: increment only
    incrementCounter(name: string, labels?: Record<string, string>, value = 1): void {
        const key = this.getKey(name, labels);
        const existing = this.counters.get(key) || [];
        existing.push({
            value,
            timestamp: Date.now(),
            labels,
        });
        this.counters.set(key, existing);
    }

    // Gauge: set absolute value
    setGauge(name: string, value: number, labels?: Record<string, string>): void {
        const key = this.getKey(name, labels);
        this.gauges.set(key, {
            value,
            timestamp: Date.now(),
            labels,
        });
    }

    // Histogram: observe value
    observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
        const key = this.getKey(name, labels);
        const existing = this.histograms.get(key) || [];

        // Create bucket counts
        const buckets: HistogramBucket[] = this.latencyBuckets.map((le) => ({
            le,
            count: value <= le ? 1 : 0,
        }));
        buckets.push({ le: Infinity, count: 1 }); // +Inf bucket

        existing.push({
            buckets,
            sum: value,
            count: 1,
            labels,
        });
        this.histograms.set(key, existing);
    }

    // Get counter total
    getCounterTotal(name: string, labels?: Record<string, string>): number {
        const key = this.getKey(name, labels);
        const values = this.counters.get(key) || [];
        return values.reduce((sum, v) => sum + v.value, 0);
    }

    // Get gauge value
    getGaugeValue(name: string, labels?: Record<string, string>): number | undefined {
        const key = this.getKey(name, labels);
        return this.gauges.get(key)?.value;
    }

    // Get histogram stats
    getHistogramStats(name: string, labels?: Record<string, string>): {
        count: number;
        sum: number;
        buckets: HistogramBucket[];
    } {
        const key = this.getKey(name, labels);
        const values = this.histograms.get(key) || [];

        const count = values.reduce((sum, v) => sum + v.count, 0);
        const sum = values.reduce((total, v) => total + v.sum, 0);

        // Aggregate bucket counts
        const buckets: HistogramBucket[] = [...this.latencyBuckets, Infinity].map((le) => ({
            le,
            count: values.reduce((total, v) => {
                const bucket = v.buckets.find((b) => b.le === le);
                return total + (bucket?.count || 0);
            }, 0),
        }));

        return { count, sum, buckets };
    }

    // Export all metrics in Prometheus format
    toPrometheusFormat(): string {
        const lines: string[] = [];

        // Export counters
        const counterNames = new Set<string>();
        this.counters.forEach((_, key) => {
            const name = key.split("{")[0];
            counterNames.add(name);
        });

        counterNames.forEach((name) => {
            lines.push(`# HELP ${name} Counter metric`);
            lines.push(`# TYPE ${name} counter`);
            this.counters.forEach((values, key) => {
                if (key.startsWith(name)) {
                    const total = values.reduce((sum, v) => sum + v.value, 0);
                    const labelsStr = this.extractLabelsStr(key);
                    lines.push(`${name}${labelsStr} ${total}`);
                }
            });
        });

        // Export gauges
        const gaugeNames = new Set<string>();
        this.gauges.forEach((_, key) => {
            const name = key.split("{")[0];
            gaugeNames.add(name);
        });

        gaugeNames.forEach((name) => {
            lines.push(`# HELP ${name} Gauge metric`);
            lines.push(`# TYPE ${name} gauge`);
            this.gauges.forEach((value, key) => {
                if (key.startsWith(name)) {
                    const labelsStr = this.extractLabelsStr(key);
                    lines.push(`${name}${labelsStr} ${value.value}`);
                }
            });
        });

        // Export histograms
        const histogramNames = new Set<string>();
        this.histograms.forEach((_, key) => {
            const name = key.split("{")[0];
            histogramNames.add(name);
        });

        histogramNames.forEach((name) => {
            lines.push(`# HELP ${name} Histogram metric`);
            lines.push(`# TYPE ${name} histogram`);
            this.histograms.forEach((values, key) => {
                if (key.startsWith(name)) {
                    const stats = this.getHistogramStats(name);
                    const labelsStr = this.extractLabelsStr(key);
                    const baseLabels = labelsStr.replace(/[{}]/g, "");

                    // Bucket lines
                    let cumulativeCount = 0;
                    stats.buckets.forEach((bucket) => {
                        cumulativeCount += bucket.count;
                        const leLabel = bucket.le === Infinity ? "+Inf" : bucket.le.toString();
                        const bucketLabels = baseLabels ? `{${baseLabels},le="${leLabel}"}` : `{le="${leLabel}"}`;
                        lines.push(`${name}_bucket${bucketLabels} ${cumulativeCount}`);
                    });

                    lines.push(`${name}_sum${labelsStr} ${stats.sum}`);
                    lines.push(`${name}_count${labelsStr} ${stats.count}`);
                }
            });
        });

        return lines.join("\n");
    }

    // Reset all metrics (useful for testing)
    reset(): void {
        this.counters.clear();
        this.gauges.clear();
        this.histograms.clear();
    }

    private getKey(name: string, labels?: Record<string, string>): string {
        if (!labels || Object.keys(labels).length === 0) {
            return name;
        }
        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}="${v}"`)
            .join(",");
        return `${name}{${labelStr}}`;
    }

    private extractLabelsStr(key: string): string {
        const match = key.match(/\{.*\}/);
        return match ? match[0] : "";
    }
}

// Singleton instance
export const metrics = new MetricsCollector();

// Convenience functions for common metrics
export const recordApiRequest = (
    method: string,
    path: string,
    statusCode: number,
    durationMs: number
): void => {
    const labels = { method, path: normalizePath(path), status: statusCode.toString() };

    metrics.incrementCounter("http_requests_total", labels);
    metrics.observeHistogram("http_request_duration_ms", durationMs, { method, path: normalizePath(path) });

    if (statusCode >= 400) {
        metrics.incrementCounter("http_errors_total", labels);
    }
};

export const recordDbQuery = (operation: string, table: string, durationMs: number): void => {
    metrics.incrementCounter("db_queries_total", { operation, table });
    metrics.observeHistogram("db_query_duration_ms", durationMs, { operation, table });
};

export const setActiveConnections = (count: number): void => {
    metrics.setGauge("db_connections_active", count);
};

export const setMemoryUsage = (): void => {
    const usage = process.memoryUsage();
    metrics.setGauge("nodejs_memory_heap_used_bytes", usage.heapUsed);
    metrics.setGauge("nodejs_memory_heap_total_bytes", usage.heapTotal);
    metrics.setGauge("nodejs_memory_external_bytes", usage.external);
    metrics.setGauge("nodejs_memory_rss_bytes", usage.rss);
};

export const setUptime = (): void => {
    metrics.setGauge("nodejs_uptime_seconds", process.uptime());
};

// Normalize path to avoid high cardinality (e.g., /users/123 -> /users/:id)
const normalizePath = (path: string): string => {
    return path
        .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:uuid")
        .replace(/\/\d+/g, "/:id")
        .replace(/\?.*$/, ""); // Remove query params
};

export type { MetricsCollector };
