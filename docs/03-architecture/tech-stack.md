# Teknologi dan Arsitektur PeopleHub

## Bahasa & Runtime
- Frontend: Next.js terbaru (App Router) dengan TypeScript; CSS via Tailwind + design token.
- Backend/BFF: TypeScript/Node.js; gunakan Next.js API routes sebagai BFF awal. Jika beban/pemisahan diperlukan, siapkan service terpisah (mis. NestJS) tapi tetap TypeScript.
- Scripting/tooling: Bash/Node scripts untuk build/deploy/migrasi.

## API & Komunikasi
- REST/JSON via Next.js API routes (BFF); webhook outbound untuk event (absen, cuti approved, reimburse).
- Auth: session HTTP-only (NextAuth atau custom) dengan JWT ter-enkripsi; SSO (Google/Microsoft) di roadmap; dukung 2FA bila diperlukan.

## Database & Storage
- Database: Postgres (disarankan) dengan `tenant_id` di tabel utama; migrasi via Prisma Migrate/Flyway/Liquibase.
- Cache (opsional): Redis untuk session/rate-limit/queue.
- File storage: Object storage (S3-compatible) untuk slip gaji, dokumen, bukti foto/selfie; URL bertanda tangan.

## Frontend Build
- Bundler: Next build (App Router).
- Data fetching: React Query/Next fetch dengan caching; minimal global store (Zustand/Context) untuk state ringan.
- Testing: Playwright/Cypress (e2e), Vitest/Jest (unit).

## Backend & Layanan
- Framework: Next.js API routes untuk fase awal; opsi service terpisah (NestJS) jika perlu skala/domain khusus.
- AuthZ: middleware RBAC per role + scope `tenant_id`.
- Validation: schema validation (zod) di API routes.
- Background jobs (opsional): BullMQ/Redis queues untuk email batch, notifikasi, render slip PDF.
- Observabilitas: structured logging (pino/winston), request ID, metrics (Prometheus).

## Infrastruktur & Deploy
- Lingkungan: dev/staging/prod terpisah.
- Reverse proxy: nginx (SSL termination); certbot untuk TLS.
- Process manager: pm2/systemd (atau container: Docker + Compose).
- CI/CD: GitHub Actions untuk lint/test/build; opsi deploy ke VPS/registry.
- Backup: jadwal backup DB; uji restore; log rotation.

## Keamanan
- TLS end-to-end; hash password (bcrypt/argon2); sanitasi input.
- Rate limiting login/API; CAPTCHA untuk registrasi jika diserang.
- RBAC ketat, audit log untuk aksi sensitif (slip, bank, ekspor).
- Secrets via environment; jangan commit `.env`; gunakan `.env.example`.

## Integrasi
- Payroll: ekspor CSV/Excel multi-format; adaptor per provider (roadmap).
- Notifikasi: SMTP (email), in-app; SMS/Slack/Teams opsional.
- SSO: Google/Microsoft (roadmap).

## Pengujian & Kualitas
- Unit test untuk domain logic; integration test untuk API; e2e untuk flow utama (registrasi, absen, cuti, reimburse, slip).
- Lint/format: ESLint/Prettier untuk JS/TS; golangci-lint untuk Go (jika dipakai).

## Monitoring & Alerting
- Health check endpoint; uptime monitoring.
- Metrics: latency API, error rate, DB connection, queue depth.
- Slow query log Postgres; alert bila melebihi threshold.
