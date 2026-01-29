# High-Level Design (HLD) PeopleHub

> **Versi:** 2.0 | **Tanggal Update:** 22 Januari 2026 | **Status:** Final

## Tujuan & Ruang Lingkup
- Platform HR multi-tenant untuk empat perusahaan: absensi, cuti, perjalanan dinas/reimburse, slip gaji, KPI, surat, pengumuman, audit.
- Channel utama: web (desktop/mobile-friendly). Notifikasi email/in-app; SMS/SSO di roadmap.

---

## Diagram Arsitektur

### System Context Diagram

```mermaid
C4Context
    title System Context Diagram - PeopleHub

    Person(employee, "Karyawan", "Absen, cuti, slip gaji, dokumen")
    Person(manager, "Atasan/Manager", "Approval, monitoring tim")
    Person(hrd, "HRD", "Data master, kebijakan, audit")
    Person(finance, "Finance", "Payroll, reimburse")
    
    System(peoplehub, "PeopleHub", "Platform HR multi-tenant")
    
    System_Ext(email, "Email Server", "SMTP untuk notifikasi")
    System_Ext(storage, "Object Storage", "S3 untuk dokumen/foto")
    System_Ext(sso, "SSO Provider", "Google/Microsoft OAuth")
    
    Rel(employee, peoplehub, "Uses", "HTTPS")
    Rel(manager, peoplehub, "Uses", "HTTPS")
    Rel(hrd, peoplehub, "Uses", "HTTPS")
    Rel(finance, peoplehub, "Uses", "HTTPS")
    
    Rel(peoplehub, email, "Sends emails", "SMTP")
    Rel(peoplehub, storage, "Stores files", "S3 API")
    Rel(peoplehub, sso, "Authenticates", "OAuth2")
```

### Container Diagram

```mermaid
flowchart TB
    subgraph Clients["Client Layer"]
        WEB["🌐 Web App<br/>(Next.js)"]
        MOBILE["📱 Mobile Browser<br/>(PWA-ready)"]
    end
    
    subgraph LoadBalancer["Load Balancer"]
        NGINX["⚡ Nginx<br/>(SSL Termination)"]
    end
    
    subgraph Application["Application Layer"]
        NEXTJS["🚀 Next.js App<br/>(Frontend + BFF)"]
        
        subgraph APIRoutes["API Routes (BFF)"]
            AUTH["🔐 Auth Module"]
            ATTENDANCE["⏰ Attendance Module"]
            LEAVE["🏖️ Leave Module"]
            PAYROLL["💰 Payroll Module"]
            DOCUMENT["📄 Document Module"]
            NOTIF["🔔 Notification Module"]
        end
    end
    
    subgraph DataLayer["Data Layer"]
        PG[("🐘 PostgreSQL<br/>Primary Database")]
        REDIS[("⚡ Redis<br/>Cache/Session")]
        S3["☁️ S3 Storage<br/>Files/Photos"]
    end
    
    subgraph External["External Services"]
        SMTP["📧 SMTP Server"]
        SSO["🔑 SSO Provider"]
    end
    
    WEB --> NGINX
    MOBILE --> NGINX
    NGINX --> NEXTJS
    
    NEXTJS --> AUTH
    NEXTJS --> ATTENDANCE
    NEXTJS --> LEAVE
    NEXTJS --> PAYROLL
    NEXTJS --> DOCUMENT
    NEXTJS --> NOTIF
    
    AUTH --> PG
    AUTH --> REDIS
    AUTH --> SSO
    
    ATTENDANCE --> PG
    ATTENDANCE --> S3
    
    LEAVE --> PG
    
    PAYROLL --> PG
    PAYROLL --> S3
    
    DOCUMENT --> PG
    DOCUMENT --> S3
    
    NOTIF --> PG
    NOTIF --> SMTP
    NOTIF --> REDIS
```

### Component Diagram - Attendance Flow

```mermaid
sequenceDiagram
    participant E as Employee (Mobile)
    participant FE as Next.js Frontend
    participant API as API Routes
    participant DB as PostgreSQL
    participant S3 as S3 Storage
    participant N as Notification Service
    
    E->>FE: Open Clock In Page
    FE->>API: GET /attendance/today
    API->>DB: Check existing attendance
    DB-->>API: No attendance today
    API-->>FE: {has_clocked_in: false}
    FE-->>E: Show Clock In Button
    
    E->>FE: Take Selfie + Select WFO
    FE->>API: POST /attendance/clock-in (photo, mode, location)
    API->>S3: Upload selfie photo
    S3-->>API: Photo URL
    API->>DB: Calculate late minutes
    API->>DB: Insert attendance record
    API->>N: Send late notification (if applicable)
    N-->>API: Notification queued
    API-->>FE: {success, late_minutes, status}
    FE-->>E: Show confirmation
```

### Data Flow Diagram

```mermaid
flowchart LR
    subgraph Input
        REG[Registration]
        CLOCK[Clock In/Out]
        REQ[Leave Request]
        EXP[Expense Claim]
    end
    
    subgraph Processing
        VAL[Validation]
        CALC[Calculation<br/>Late/Overtime/Balance]
        APPR[Approval Engine]
        GEN[PDF Generation]
    end
    
    subgraph Storage
        DB[(PostgreSQL)]
        FILES[(S3 Files)]
    end
    
    subgraph Output
        DASH[Dashboard]
        NOTIF[Notifications]
        REPORT[Reports/Export]
        PDF[PDF Documents]
    end
    
    REG --> VAL --> DB
    CLOCK --> VAL --> CALC --> DB
    CLOCK --> FILES
    REQ --> VAL --> CALC --> APPR --> DB
    EXP --> VAL --> APPR --> DB
    EXP --> FILES
    
    DB --> DASH
    DB --> REPORT
    APPR --> NOTIF
    GEN --> PDF --> FILES
```

---

## Arsitektur Umum

### Client Layer
- **Web Application**: Next.js dengan App Router, TypeScript, Tailwind CSS
- **Communication**: HTTPS/JSON ke API Routes
- **Authentication**: JWT token dalam HTTP-only cookies
- **Local Storage**: Hanya untuk cache ringan (preferences, tidak ada data sensitif)

### Application Layer
- **Framework**: Next.js sebagai Frontend + Backend-for-Frontend (BFF)
- **API Routes**: REST/JSON endpoints, modular per domain
- **Modules**:
  - `auth` - Login, register, password reset, session
  - `attendance` - Clock in/out, correction, shift swap
  - `leave` - Request, balance, approval
  - `payroll` - Slip generation, components, export
  - `document` - Upload, access control, versioning
  - `notification` - Email, in-app, preferences

### Data Layer
- **Database**: PostgreSQL dengan `tenant_id` di semua tabel utama
- **Cache**: Redis untuk session, rate limiting, job queue
- **File Storage**: S3-compatible untuk foto selfie, dokumen, slip PDF

### External Integrations
- **Email**: SMTP server untuk notifikasi
- **SSO**: Google/Microsoft OAuth (roadmap)
- **Webhook**: Outbound events untuk sistem eksternal

---

## Modul Logis

| Module | Responsibility |
|--------|---------------|
| **Auth & Tenant** | Login/registrasi, approval akun, role/permission, delegasi approver, isolasi tenant |
| **HR Core** | Data karyawan, struktur organisasi, kebijakan cuti/jatah libur/shift/denda/lembur |
| **Attendance** | Clock in/out (WFO/WFH), koreksi absensi, tukar/cover shift, denda keterlambatan |
| **Leave** | Cuti/izin dengan saldo, jatah libur bersama, approval berlapis |
| **Travel & Reimburse** | Perjalanan dinas, kategori/plafon biaya, bukti, approval multi-step |
| **Payroll** | Komponen gaji, slip PDF batch, ekspor payroll, COA biaya |
| **Performance** | KPI numerik, periode, progres, feedback |
| **Documents & Letters** | Manajemen dokumen, versi, akses; surat pengajuan dengan template |
| **Announcement & Violation** | Pengumuman per cabang/role, notifikasi pelanggaran |
| **Support & Assets** | Tiket bantuan HR/IT, aset pinjaman |
| **Audit & Reporting** | Audit log, dashboard HRD, ekspor log |

---

## Deployment Architecture

```mermaid
flowchart TB
    subgraph Internet
        USER[Users]
    end
    
    subgraph CDN["CDN (Optional)"]
        CF[Cloudflare/Vercel Edge]
    end
    
    subgraph VPS["VPS / Cloud Server"]
        subgraph Docker["Docker Compose"]
            NGINX2[Nginx :80/:443]
            APP[Next.js App :3000]
            REDIS2[Redis :6379]
        end
    end
    
    subgraph ManagedServices["Managed Services"]
        PGDB[(PostgreSQL)]
        S3DB[(S3 Storage)]
        SMTPDB[SMTP Service]
    end
    
    USER --> CF --> NGINX2
    NGINX2 --> APP
    APP --> REDIS2
    APP --> PGDB
    APP --> S3DB
    APP --> SMTPDB
```

---

## Data & Integritas

- `tenant_id` wajib pada entity utama; foreign key dan index `(tenant_id, fk...)`.
- Audit trail untuk publish slip, perubahan bank, ekspor data, perubahan role, penerbitan surat.
- Constraints: saldo cuti tidak negatif; satu akun aktif per email/tenant; approval order dijaga.

---

## Keamanan

| Layer | Measure |
|-------|---------|
| **Transport** | TLS 1.3 end-to-end |
| **Authentication** | JWT in HTTP-only cookies, bcrypt/argon2 password hash |
| **Authorization** | RBAC per role + tenant scope |
| **File Access** | Signed URLs dengan expiry |
| **Network** | Firewall/allowlist IP untuk admin/DB |
| **Rate Limiting** | Per endpoint, stricter untuk auth |
| **Audit** | Log semua aksi sensitif |

---

## Ketersediaan & Performa

| Metric | Target |
|--------|--------|
| **SLA** | 99.5% jam kerja |
| **Dashboard Load** | < 3 detik @ 500 active users |
| **Attendance API** | P95 < 1.5 detik |
| **Database** | Connection pool, read replicas (jika perlu) |
| **Caching** | Redis untuk session, lookup kebijakan |
| **Pagination** | Cursor-based untuk daftar besar |

---

## Observabilitas

- **Logging**: Structured JSON logs (pino/winston)
- **Metrics**: Prometheus-compatible (latency, error rate, DB connections)
- **Health Check**: `/api/health` endpoint
- **Alerting**: Error rate spike, latency threshold, disk usage
- **Audit Log**: Terpisah dari access log, retensi sesuai kebijakan
