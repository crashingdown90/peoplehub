# Monitoring Configuration

Panduan setup monitoring untuk PeopleHub.

---

## 1. Uptime Monitoring (External)

### UptimeRobot (Gratis)

1. Buat akun di [UptimeRobot](https://uptimerobot.com)
2. Tambahkan monitor baru:
   - **URL**: `https://peoplehub.kreatifindo.com/api/health`
   - **Type**: HTTP(s)
   - **Interval**: 5 menit
   - **Keyword**: `"status":"healthy"`
   - **Alert Contacts**: Email/Slack

### Better Uptime (Alternatif)

1. Buat akun di [Better Uptime](https://betteruptime.com)
2. Setup monitors untuk:
   - Main app: `/api/health`
   - Database: `/api/health/db`
   - API endpoint sampling

---

## 2. Application Monitoring

### Sentry (Error Tracking)

1. Buat project di [Sentry](https://sentry.io)
2. Install:
   ```bash
   npm install @sentry/nextjs
   ```

3. Initialize di `sentry.client.config.ts`:
   ```typescript
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1,
     replaysSessionSampleRate: 0.1,
     replaysOnErrorSampleRate: 1.0,
   });
   ```

4. Add to `.env`:
   ```env
   SENTRY_DSN=https://xxx@sentry.io/xxx
   ```

---

## 3. Server Monitoring

### Netdata (Self-hosted)

Install Netdata untuk real-time monitoring:

```bash
# Install
bash <(curl -Ss https://get.netdata.cloud/kickstart.sh)

# Access dashboard
# http://server-ip:19999
```

### Prometheus + Grafana (Advanced)

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  prometheus_data:
  grafana_data:
```

---

## 4. Log Management

### Structured Logging

Menggunakan Pino untuk structured logging:

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined,
});
```

### Log Rotation

Sudah dikonfigurasi di PM2 ecosystem config. Untuk setup tambahan:

```bash
# /etc/logrotate.d/peoplehub
/var/log/peoplehub/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 5. Database Monitoring

### PostgreSQL Stats

Query untuk monitoring:

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'peoplehub';

-- Long running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
  AND state != 'idle';

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
```

### Enable slow query log

```sql
-- In postgresql.conf
log_min_duration_statement = 1000  -- Log queries > 1 second
```

---

## 6. Alert Configuration

### Slack Integration

Webhook sudah dikonfigurasi di CI/CD. Untuk custom alerts:

```typescript
// lib/alerts.ts
export async function sendAlert(message: string, severity: 'info' | 'warning' | 'critical') {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  
  const colors = {
    info: '#36a64f',
    warning: '#ff9800',
    critical: '#f44336',
  };

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color: colors[severity],
        title: `[${severity.toUpperCase()}] PeopleHub Alert`,
        text: message,
        ts: Math.floor(Date.now() / 1000),
      }]
    })
  });
}
```

---

## 7. Metrics Endpoint

Health check sudah ada di `/api/health`. Untuk Prometheus metrics:

```typescript
// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { collectDefaultMetrics, Registry } from 'prom-client';

const register = new Registry();
collectDefaultMetrics({ register });

export async function GET() {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: { 'Content-Type': register.contentType },
  });
}
```

---

## 8. Monitoring Checklist

- [ ] External uptime monitoring (UptimeRobot/Better Uptime)
- [ ] Error tracking (Sentry)
- [ ] Server metrics (Netdata/Grafana)
- [ ] Log rotation configured
- [ ] Database slow query logging
- [ ] Slack/Discord alerts
- [ ] Backup verification alerts
- [ ] SSL certificate expiry monitoring

---

## 9. Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Response Time (P95) | > 2s | > 5s |
| Error Rate | > 1% | > 5% |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 75% | > 90% |
| Disk Usage | > 80% | > 95% |
| DB Connections | > 80 | > 95 |
| Health Check Failures | 1 | 3 consecutive |
