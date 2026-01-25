# Monitoring & Observability - PeopleHub

> **Versi:** 1.0 | **Tanggal:** 23 Januari 2026 | **Status:** Active

---

## Ringkasan

Dokumen ini menjelaskan strategi monitoring, logging, metrics, dan alerting untuk PeopleHub HRIS System.

---

## Daftar Isi

1. [Health Check Endpoints](#health-check-endpoints)
2. [Logging](#logging)
3. [Metrics](#metrics)
4. [Alert Thresholds](#alert-thresholds)
5. [Monitoring Tools](#monitoring-tools)
6. [Incident Response](#incident-response)

---

## Health Check Endpoints

PeopleHub menyediakan beberapa endpoint untuk monitoring kesehatan sistem:

| Endpoint | Purpose | Response Time |
|----------|---------|---------------|
| `/api/health` | Quick health check | < 100ms |
| `/api/health/db` | Database connectivity | < 1s |
| `/api/health/redis` | Redis connectivity | < 100ms |
| `/api/health/detailed` | Comprehensive check | < 2s |
| `/api/metrics` | Prometheus metrics | < 500ms |

### Quick Health Check

**Endpoint:** `GET /api/health`

```bash
curl -s https://peoplehub.kreatifindo.com/api/health | jq
```

**Response (Healthy):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-01-23T03:50:00.000Z",
    "version": "1.0.0",
    "uptime": 86400
  }
}
```

**Response (Unhealthy):**
```json
{
  "success": false,
  "data": {
    "status": "error",
    "timestamp": "2026-01-23T03:50:00.000Z",
    "version": "1.0.0",
    "uptime": 86400
  }
}
```

### Database Health Check

**Endpoint:** `GET /api/health/db`

```bash
curl -s https://peoplehub.kreatifindo.com/api/health/db | jq
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "message": "Database connection OK",
    "latencyMs": 5,
    "timestamp": "2026-01-23T03:50:00.000Z"
  }
}
```

### Detailed Health Check

**Endpoint:** `GET /api/health/detailed`

Mengembalikan status lengkap dari semua komponen sistem.

```bash
curl -s https://peoplehub.kreatifindo.com/api/health/detailed | jq
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-23T03:50:00.000Z",
    "version": "1.0.0",
    "uptime": 86400,
    "checks": {
      "database": {
        "status": "healthy",
        "message": "Database connection OK",
        "latencyMs": 5
      },
      "redis": {
        "status": "healthy",
        "message": "Redis URL configured"
      },
      "memory": {
        "status": "healthy",
        "message": "Memory usage normal",
        "details": {
          "heapUsedMB": 128,
          "heapTotalMB": 256,
          "rssMB": 320,
          "heapUsagePercent": 50
        }
      }
    }
  }
}
```

### Metrics Endpoint

**Endpoint:** `GET /api/metrics`

Mengembalikan metrics dalam format Prometheus.

```bash
# Jika METRICS_TOKEN diset
curl -H "Authorization: Bearer $METRICS_TOKEN" https://peoplehub.kreatifindo.com/api/metrics

# Tanpa authentication (jika METRICS_TOKEN tidak diset)
curl https://peoplehub.kreatifindo.com/api/metrics
```

**Response (Prometheus format):**
```
# HELP http_requests_total Counter metric
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/health",status="200"} 1234

# HELP http_request_duration_ms Histogram metric
# TYPE http_request_duration_ms histogram
http_request_duration_ms_bucket{method="GET",path="/api/health",le="5"} 100
http_request_duration_ms_bucket{method="GET",path="/api/health",le="10"} 200

# HELP nodejs_memory_heap_used_bytes Gauge metric
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes 134217728

# HELP nodejs_uptime_seconds Gauge metric
# TYPE nodejs_uptime_seconds gauge
nodejs_uptime_seconds 86400
```

---

## Logging

### Structured Logging

PeopleHub menggunakan structured JSON logging untuk production dan pretty-print untuk development.

**Log Levels:**

| Level | Numeric | Usage |
|-------|---------|-------|
| debug | 10 | Detailed debugging info |
| info | 20 | General operational info |
| warn | 30 | Warning conditions |
| error | 40 | Error conditions |

**Environment Variable:**
```env
LOG_LEVEL=info  # debug, info, warn, error
```

### Log Format

**Production (JSON):**
```json
{
  "level": "info",
  "time": "2026-01-23T03:50:00.000Z",
  "msg": "Request completed",
  "requestId": "abc-123",
  "method": "GET",
  "path": "/api/health",
  "statusCode": 200,
  "durationMs": 5
}
```

**Development (Pretty):**
```
[03:50:00] INFO: Request completed | reqId=abc-123 method="GET" path="/api/health" statusCode=200
```

### Request ID Tracking

Setiap request memiliki unique `requestId` untuk correlation dalam distributed tracing:

1. Client mengirim header `X-Request-ID` (optional)
2. Jika tidak ada, server generate UUID
3. Request ID diinclude di semua log entries
4. Response header `X-Request-ID` dikembalikan

---

## Metrics

### Available Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `http_requests_total` | Counter | method, path, status | Total HTTP requests |
| `http_request_duration_ms` | Histogram | method, path | Request latency distribution |
| `http_errors_total` | Counter | method, path, status | HTTP errors (4xx, 5xx) |
| `db_queries_total` | Counter | operation, table | Database queries |
| `db_query_duration_ms` | Histogram | operation, table | Query latency |
| `db_connections_active` | Gauge | - | Active DB connections |
| `nodejs_memory_heap_used_bytes` | Gauge | - | Heap memory usage |
| `nodejs_memory_rss_bytes` | Gauge | - | RSS memory |
| `nodejs_uptime_seconds` | Gauge | - | Process uptime |

### Recording Metrics

```typescript
import { recordApiRequest, recordDbQuery } from "@/lib/monitoring";

// Record API request
recordApiRequest("GET", "/api/users", 200, 45);

// Record DB query
recordDbQuery("SELECT", "users", 12);
```

---

## Alert Thresholds

### System Metrics

| Metric | Warning | Critical | Escalation |
|--------|---------|----------|------------|
| CPU Usage | > 70% | > 90% | P1 → P0 |
| Memory Usage | > 75% | > 90% | P1 → P0 |
| Disk Usage | > 80% | > 95% | P2 → P1 |

### Application Metrics

| Metric | Warning | Critical | Escalation |
|--------|---------|----------|------------|
| Response Time (P95) | > 2s | > 5s | P2 → P1 |
| Error Rate | > 1% | > 5% | P1 → P0 |
| 5xx Errors/min | > 5 | > 20 | P1 → P0 |

### Database Metrics

| Metric | Warning | Critical | Escalation |
|--------|---------|----------|------------|
| Connections | > 80 | > 95 | P2 → P1 |
| Query Latency (P95) | > 500ms | > 2s | P2 → P1 |
| Slow Queries/min | > 10 | > 50 | P2 → P1 |

---

## Monitoring Tools

### External Uptime Monitoring

Gunakan layanan external untuk health check:

1. **UptimeRobot** (Free tier available)
   - Monitor: `https://peoplehub.kreatifindo.com/api/health`
   - Interval: 5 minutes
   - Alert: Email, Slack

2. **Better Uptime** 
   - Primary dan backup monitors
   - Status page integration

3. **Custom Script**
   - Lihat `scripts/health-check.sh`

### Prometheus + Grafana (Optional)

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'peoplehub'
    metrics_path: '/api/metrics'
    bearer_token: '${METRICS_TOKEN}'
    static_configs:
      - targets: ['peoplehub.kreatifindo.com']
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process info
pm2 show peoplehub

# Metrics
pm2 show peoplehub --json | jq '.pm2_env.axm_monitor'
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P0 | System down | 15 min | DB down, app unreachable |
| P1 | Major impact | 1 hour | Login broken, data loss |
| P2 | Minor impact | 4 hours | Feature broken, slow perf |
| P3 | Low impact | Next day | Cosmetic, minor bugs |

### Response Checklist

#### Health Check Failed

1. Check application logs: `pm2 logs peoplehub --lines 100`
2. Check database: `docker-compose logs db --tail 50`
3. Check system resources: `htop`, `df -h`
4. Restart if needed: `pm2 reload peoplehub`

#### High Error Rate

1. Check error logs: `grep ERROR /var/log/peoplehub/*.log | tail -100`
2. Identify error pattern
3. Check recent deployments
4. Rollback if necessary

#### Performance Degradation

1. Check slow queries: lihat [runbook.md](runbook.md#performance-issues)
2. Check memory: `/api/health/detailed`
3. Check cache status
4. Scale if needed

---

## Configuration

### Environment Variables

```env
# Logging
LOG_LEVEL=info                    # debug, info, warn, error

# Metrics
METRICS_TOKEN=your-secret-token   # Optional: protect /api/metrics

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

---

## Dokumen Terkait

| Dokumen | Link |
|---------|------|
| Deployment Guide | [deployment.md](deployment.md) |
| Runbook | [runbook.md](runbook.md) |
| Security Policy | [security.md](security.md) |
| Backup & DR | [backup-dr.md](backup-dr.md) |
