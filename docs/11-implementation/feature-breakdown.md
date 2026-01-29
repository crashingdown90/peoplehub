# Feature Breakdown - PeopleHub

> **Versi:** 1.1 | **Tanggal:** 22 Januari 2026 | **Status:** Active

---

## Summary

Dokumen ini berisi breakdown detail setiap fitur PeopleHub, termasuk:
- Acceptance criteria per fitur
- Kompleksitas dan estimasi effort
- Dependencies
- Technical notes

---

## Legend

| Complexity | Effort Range | Description |
|------------|--------------|-------------|
| 🟢 **Low** | 4-8 jam | CRUD sederhana, UI straightforward |
| 🟡 **Medium** | 8-16 jam | Logic bisnis kompleks, validasi multi-step |
| 🔴 **High** | 16-32 jam | Integrasi, workflow kompleks, third-party |
| ⚫ **Critical** | 32+ jam | Core feature, high-risk, multi-component |

---

## Phase 1: MVP Features

### 1.1 Authentication & Authorization

#### 1.1.1 User Registration
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🟡 Medium |
| **Effort** | 16h (BE: 10h, FE: 6h) |
| **Priority** | P0 (MUST HAVE) |
| **Dependencies** | None |

**Acceptance Criteria:**
- [x] User dapat register dengan email, password, nama, nomor telepon
- [x] Email harus unique per tenant
- [x] Password minimal 8 karakter dengan kombinasi huruf dan angka
- [x] Status default: PENDING approval
- [x] Notifikasi email ke HRD untuk approval
- [x] Validasi input client-side dan server-side

**Technical Notes:**
- Password di-hash dengan bcrypt (salt rounds: 12)
- Email validation dengan regex + DNS check
- Audit log untuk setiap registrasi

---

#### 1.1.2 User Login
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🟢 Low |
| **Effort** | 8h (BE: 4h, FE: 4h) |
| **Priority** | P0 (MUST HAVE) |
| **Dependencies** | Registration |

**Acceptance Criteria:**
- [x] User login dengan email + password
- [x] Return JWT token dengan expiry 24 jam
- [x] Refresh token dengan expiry 7 hari
- [x] Redirect berdasarkan role (HRD → dashboard HRD, Employee → dashboard Employee)
- [x] Lock account setelah 5 failed attempts (30 menit)
- [x] Audit log untuk setiap login attempt

---

#### 1.1.3 Password Reset
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🟢 Low |
| **Effort** | 8h (BE: 4h, FE: 4h) |
| **Priority** | P1 (SHOULD HAVE) |
| **Dependencies** | Login |

**Acceptance Criteria:**
- [x] User dapat request reset via email
- [x] Token reset valid 1 jam
- [x] User dapat set password baru
- [x] Invalidate semua session existing setelah reset

---

#### 1.1.4 Multi-Tenant Isolation
| Aspect | Detail |
|--------|--------|
| **Complexity** | ⚫ Critical |
| **Effort** | 24h (BE: 20h, FE: 4h) |
| **Priority** | P0 (MUST HAVE) |
| **Dependencies** | Login |

**Acceptance Criteria:**
- [x] Setiap query WAJIB filter by companyId
- [x] User dari PT. A tidak bisa akses data PT. B
- [x] Middleware automatic inject companyId
- [x] API endpoint validate tenant ownership
- [x] Audit log jika ada attempt cross-tenant

**Technical Notes:**
- Implement tenant context middleware
- Prisma query wrapper dengan mandatory tenant filter
- E2E test wajib untuk setiap endpoint

---

### 1.2 Employee Management

#### 1.2.1 Employee CRUD
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🟡 Medium |
| **Effort** | 20h (BE: 12h, FE: 8h) |
| **Priority** | P0 (MUST HAVE) |
| **Dependencies** | Auth, Org Structure |

**Acceptance Criteria:**
- [x] HRD dapat create/read/update/delete employee
- [x] Validasi NIK unique per tenant
- [x] Validasi email unique per tenant
- [x] Support status: Active, Inactive, Probation, Resigned
- [x] Link ke User account (1:1)
- [x] Link ke Branch, Department, Position
- [x] Audit log untuk setiap perubahan

**Data Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| employeeId | string | Yes | Auto-generate (EMP-YYYY-XXXXX) |
| fullName | string | Yes | Min 3 chars |
| email | string | Yes | Valid email, unique |
| phone | string | Yes | Valid phone number |
| nik | string | No | 16 digits, unique |
| gender | enum | Yes | MALE, FEMALE |
| birthDate | date | Yes | Over 17 years old |
| joinDate | date | Yes | Not future date |
| employmentType | enum | Yes | PERMANENT, CONTRACT, FREELANCE |
| status | enum | Yes | ACTIVE, INACTIVE, PROBATION, RESIGNED |

---

#### 1.2.2 Organization Structure
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🟡 Medium |
| **Effort** | 18h (BE: 10h, FE: 8h) |
| **Priority** | P0 (MUST HAVE) |
| **Dependencies** | Auth |

**Sub-Features:**

**A. Branch Management**
- [x] CRUD cabang dengan nama, kode, alamat, timezone
- [x] Setting jam kerja default per cabang
- [x] Setting hari libur per cabang

**B. Department Management**
- [x] CRUD departemen dengan nama, kode
- [x] Link ke Branch (many-to-one)
- [x] Hierarki parent-child (optional)

**C. Position Management**
- [x] CRUD jabatan dengan nama, level
- [x] Setting atasan default per jabatan
- [x] Link ke Department

---

### 1.3 Attendance System

#### 1.3.1 Clock In/Out (Selfie)
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🔴 High |
| **Effort** | 32h (BE: 20h, FE: 12h) |
| **Priority** | P0 (MUST HAVE) |
| **Dependencies** | Employee, Schedule |

**Acceptance Criteria:**
- [x] Employee dapat clock in dengan upload selfie
- [x] Capture timestamp, lokasi GPS (optional), device info
- [x] Validasi: belum clock in hari ini
- [x] Support WFO dan WFH mode
- [x] Calculate late duration berdasarkan schedule
- [x] Employee dapat clock out dengan upload selfie
- [x] Calculate work duration
- [x] Performa < 1.5 detik (P95)

**Technical Notes:**
- Image compression sebelum upload (max 500KB)
- Store di S3-compatible storage
- GPS accuracy minimal 100 meter
- Offline queue dengan retry (PWA)

---

#### 1.3.2 Schedule Management
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🟡 Medium |
| **Effort** | 16h (BE: 10h, FE: 6h) |
| **Priority** | P0 (MUST HAVE) |
| **Dependencies** | Org Structure |

**Acceptance Criteria:**
- [x] Support schedule types: Normal, Shift, Flexible
- [x] Define jam masuk, jam pulang, toleransi terlambat
- [x] Assign schedule ke employee atau branch
- [x] Support multiple shift dalam sehari
- [x] Holiday calendar management

**Schedule Types:**

| Type | Description |
|------|-------------|
| Normal | Jam tetap (misal: 08:00-17:00) |
| Shift | Rotasi shift (pagi/siang/malam) |
| Flexible | Range waktu masuk (misal: 07:00-10:00) |

---

### 1.4 Leave Management

#### 1.4.1 Leave Request
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🔴 High |
| **Effort** | 28h (BE: 18h, FE: 10h) |
| **Priority** | P0 (MUST HAVE) |
| **Dependencies** | Employee, Approval Flow |

**Acceptance Criteria:**
- [x] Employee dapat request cuti dengan pilih jenis, tanggal, alasan
- [x] Validasi saldo cuti mencukupi
- [x] Validasi tidak overlap dengan cuti existing
- [x] Multi-level approval (Manager → HRD)
- [x] Notifikasi ke approver
- [x] Update saldo otomatis setelah approved
- [x] Support attachment (surat dokter, etc.)

**Leave Types:**

| Type | Default Balance | Carry Over | Notes |
|------|-----------------|------------|-------|
| Annual | 12 days/year | Yes (max 6) | Prorated for new employee |
| Sick | Unlimited | No | Require doctor's note > 2 days |
| Marriage | 3 days | No | Once per marriage |
| Maternity | 90 days | No | Female only |
| Paternity | 2 days | No | Male only |
| Bereavement | 3 days | No | Immediate family |

---

#### 1.4.2 Leave Approval
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🟡 Medium |
| **Effort** | 16h (BE: 10h, FE: 6h) |
| **Priority** | P0 (MUST HAVE) |
| **Dependencies** | Leave Request |

**Acceptance Criteria:**
- [x] Manager melihat list pending approval
- [x] Manager dapat approve/reject dengan komentar
- [x] Support bulk approval
- [x] Notifikasi ke requester setelah action
- [x] Audit trail lengkap

---

### 1.5 Dashboard

#### 1.5.1 HRD Dashboard
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🔴 High |
| **Effort** | 24h (BE: 12h, FE: 12h) |
| **Priority** | P0 (MUST HAVE) |
| **Dependencies** | All MVP features |

**Widgets:**
- [x] Headcount summary (total, by status, by department)
- [x] Today's attendance (present, late, absent, on leave)
- [x] Attendance trend chart (7/30 days)
- [x] Pending approvals count
- [x] Recent leave requests
- [x] Quick actions (add employee, export report)

---

#### 1.5.2 Employee Dashboard
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🟡 Medium |
| **Effort** | 16h (BE: 6h, FE: 10h) |
| **Priority** | P0 (MUST HAVE) |
| **Dependencies** | All MVP features |

**Widgets:**
- [x] Quick clock in/out button
- [x] Today's schedule
- [x] Leave balance summary
- [x] My pending requests status
- [ ] Recent payslip (if available)
- [ ] Announcements

---

## Phase 2: Extended Features

### 2.1 Document Management
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🟡 Medium |
| **Effort** | 24h (BE: 14h, FE: 10h) |
| **Priority** | P1 (SHOULD HAVE) |

**Acceptance Criteria:**
- [ ] Karyawan dapat melihat daftar dokumen pribadi (Kontrak, NDA, BPJS)
- [ ] HRD dapat upload dokumen spesifik untuk karyawan tertentu
- [ ] HRD dapat upload dokumen template public (e.g. Employee Handbook)
- [ ] Secure URL dengan signed access (hanya pemilik dan HRD yang bisa download)
- [ ] Notification jika ada dokumen baru di-upload
- [ ] Support expiry date tracking (untuk kontrak/sertifikat)

**Technical Notes:**
- Storage: S3-compatible service (MinIO/AWS S3)
- Path structure: `tenants/:tenantId/employees/:employeeId/docs/:type/`
- DB Schema: `EmployeeDocument` table
- Security: Middleware check ownership or 'manage_documents' permission

---

### 2.2 Travel & Expense
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🔴 High |
| **Effort** | 32h (BE: 20h, FE: 12h) |
| **Priority** | P1 (SHOULD HAVE) |

**Acceptance Criteria:**
- [ ] Form pengajuan Dinas: Tujuan, Tanggal, Estimasi Biaya
- [ ] Form Reimburse: Multi-item, Upload Bukti per item, Link ke Dinas
- [ ] Validasi Plafon biaya per kategori (Hotel, Transport, Uang Makan)
- [ ] Approval Flow: Atasan → HRD → Finance
- [ ] Finance dapat set tanggal bayar dan status 'Paid'
- [ ] Export laporan expense ke CSV/Excel

**Technical Notes:**
- Relasi `TravelRequest` (1) to `ExpenseClaim` (N)
- `ExpenseCategory` config table dengan plafon per level jabatan
- State machine complex untuk approval flow finance

---

### 2.3 Overtime & Correction
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🟡 Medium |
| **Effort** | 20h (BE: 12h, FE: 8h) |
| **Priority** | P1 (SHOULD HAVE) |

**Acceptance Criteria:**
- [ ] Form Overtime: Tanggal, Jam Mulai-Selesai, Alasan
- [ ] Validasi max lembur (4 jam/hari, 14 jam/minggu) - Configurable
- [ ] Form Koreksi: Tanggal, Jam Masuk-Keluar koreksi, Bukti lampiran
- [ ] Validasi koreksi max H-7
- [ ] Approval manager mandatory untuk keduanya
- [ ] Kalkulasi ulang jam kerja setelah koreksi disetujui

**Technical Notes:**
- `Attendance` record tidak di-update langsung, buat `AttendanceCorrection` record
- Saat approved, baru update `Attendance` dan flag `is_corrected`
- Recalculate late penalty trigger on correction approval

---

## Phase 3: Performance & Payroll

### 3.1 KPI Module
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🔴 High |
| **Effort** | 32h (BE: 20h, FE: 12h) |
| **Priority** | P2 (COULD HAVE) |

**Acceptance Criteria:**
- [ ] HRD define Periode KPI (Start Date, End Date)
- [ ] Assign KPI Templates ke Employee/Department
- [ ] Indikator numerik (Target vs Actual)
- [ ] Employee update progress/actual value mandiri
- [ ] Manager review dan scoring akhir periode
- [ ] Calculation final score otomatis based on weight

**Technical Notes:**
- Schema: `KPIPeriod`, `KPIItem`, `KPIAssignment`, `KPIProgress`
- History tracking untuk setiap perubahan progress
- Locked period logic (tidak bisa edit setelah closed)

---

### 3.2 Payslip Module
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🔴 High |
| **Effort** | 28h (BE: 18h, FE: 10h) |
| **Priority** | P1 (SHOULD HAVE) |

**Acceptance Criteria:**
- [ ] Finance generate Payroll Period (Monthly)
- [ ] Logic hitung otomatis: Pasic + Allowance - Deduction + Overtime - Late Penalty
- [ ] Preview slip gaji sebelum publish
- [ ] Publish → Email Notif + PDF Generator
- [ ] Employee view own payslip history
- [ ] PDF Protection (Password NIK or Auth Check)

**Technical Notes:**
- Gunakan `puppeteer` atau `pdfkit` untuk generate PDF server-side
- Store PDF di S3 private bucket
- Payroll calculation engine harus modular (strategy pattern) untuk support rules berbeda

---


## Phase 4: Advanced Features

### 4.1 Analytics & Reporting
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🔴 High |
| **Effort** | 32h (BE: 20h, FE: 12h) |
| **Priority** | P2 (COULD HAVE) |
| **Dependencies** | All Modules |

**Acceptance Criteria:**
- [ ] Dashboard eksekutif dengan grafik tren (Turnover, Attendance, Expense)
- [ ] Report generator custom (pilih kolom, filter, sort)
- [ ] Export format: PDF, Excel, CSV
- [ ] Scheduled report via email
- [ ] Data visualization: Heatmap keterlambatan, chart komposisi gaji

**Technical Notes:**
- Gunakan dedicated reporting database replica (read-only) jika traffic tinggi
- Charting library: Recharts / Chart.js
- Query optimization dengan materialized views

---

### 4.2 SSO & Integration
| Aspect | Detail |
|--------|--------|
| **Complexity** | 🔴 High |
| **Effort** | 40h (BE: 30h, FE: 10h) |
| **Priority** | P3 (NICE TO HAVE) |
| **Dependencies** | Auth |

**Acceptance Criteria:**
- [ ] Login via Google Workspace (OIDC)
- [ ] Login via Microsoft Azure AD (SAML 2.0)
- [ ] Auto-provisioning user dari IdP (SCIM)
- [ ] Webhook outbound untuk event tertentu (e.g. Employee Created, Payroll Published)
- [ ] API Token management untuk integrasi 3rd party

**Technical Notes:**
- Library: `next-auth` providers atau `passport.js`
- Webhook delivery system dengan retry policy (BullMQ)
- Security: HMAC signature untuk webhook payload

---

## Total Effort Estimation

| Phase | Features | Backend | Frontend | QA | Total |
|-------|----------|---------|----------|-----|-------|
| Phase 1 (MVP) | 11 | 120h | 80h | 40h | **240h** |
| Phase 2 | 6 | 60h | 40h | 20h | **120h** |
| Phase 3 | 6 | 60h | 40h | 20h | **120h** |
| Phase 4 | 4 | 40h | 24h | 16h | **80h** |
| **TOTAL** | **27** | **280h** | **184h** | **96h** | **560h** |

> **Note:** Estimasi belum termasuk buffer (~20%) untuk unforeseen issues, code review, dan deployment.

---

## Risk Matrix

| Feature | Risk Level | Risk Description | Mitigation |
|---------|------------|------------------|------------|
| Multi-Tenant | 🔴 High | Data leak antar tenant | Strict testing, middleware enforcement |
| Clock In Selfie | 🟡 Medium | Upload gagal | Retry mechanism, offline queue |
| Approval Flow | 🟡 Medium | Circular approval | Graph validation |
| Payslip | 🟡 Medium | Data sensitif bocor | Encryption, audit log |
| SSO | 🟢 Low | Integrasi gagal | Fallback ke email login |

---

## Dokumen Terkait

| Dokumen | Link |
|---------|------|
| Implementation Roadmap | [implementation-roadmap.md](implementation-roadmap.md) |
| User Stories | [../02-requirements/user-stories.md](../02-requirements/user-stories.md) |
| ERD | [../03-architecture/erd.md](../03-architecture/erd.md) |
| API Specification | [../04-api/specification.md](../04-api/specification.md) |
