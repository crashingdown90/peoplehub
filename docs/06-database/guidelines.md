# Pengaturan Database PeopleHub

> **Versi:** 2.0 | **Tanggal Update:** 22 Januari 2026 | **Status:** Final

## Tujuan
Menjamin data PeopleHub aman, terisolasi per perusahaan, serta mudah di-maintain (migrasi, backup, dan audit).

## Lingkungan
- Lokal/dev, staging, produksi dipisah DB-nya; tidak berbagi kredensial.
- Konfigurasi via environment (`DATABASE_URL`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_HOST`, `DB_PORT`, `DB_SSL=true/false`); jangan commit `.env`.
- Minimal akses: gunakan user read/write terpisah dari user admin/migrasi.

## Skema Multi-Tenant
- Sertakan `tenant_id` (per perusahaan) pada tabel utama (Employee, Attendance, LeaveRequest, Document, Payroll, KPI, Ticket, Asset).
- Pastikan semua query memfilter `tenant_id`; tambahkan partial index `(tenant_id, ...)` untuk kolom pencarian utama.
- Hindari data lintas tenant; hanya Super Admin yang boleh query lintas tenant melalui service khusus dengan guard ketat.

## Keamanan & Data Sensitif
- Aktifkan koneksi TLS ke DB (jika DB mendukung).
- Enkripsi/hashed data sensitif (password pakai bcrypt/argon); hindari menyimpan plaintext token.
- Masking/pseudonimisasi saat ekspor atau data sandbox.
- Batasi akses IP/host (firewall/security group) hanya dari app/ops yang diizinkan.
- Audit log untuk aksi sensitif (ubah bank, publish slip gaji, ekspor data, perubahan role).

## Backup & Restore
- Backup terjadwal (harian/inkremental sesuai kebutuhan); simpan minimal 7–30 hari di lokasi terpisah.
- Uji restore berkala (mis. bulanan) ke environment non-prod untuk verifikasi.
- Dokumentasikan prosedur restore cepat untuk insiden.

## Migrasi Skema
- Semua perubahan skema lewat tooling migrasi (mis. Prisma Migrate/Flyway/Liquibase).
- Migrasi dijalankan otomatis pada deploy (dengan guard) atau manual oleh admin DB; logkan hasil.
- Sertakan rollback plan untuk migrasi berdampak besar.

## Performa & Indexing
- Index untuk kolom sering dipakai filter: `tenant_id`, `employee_id`, `date`/`period`, status, `manager_id`.
- Gunakan partitioning/periode (opsional) untuk tabel besar seperti Attendance/Logs jika beban tinggi.
- Hindari query lintas tenant tanpa filter; batasi page size, gunakan cursor/pagination.

## Observabilitas
- Logging kueri lambat (slow query log) dan error koneksi; alert jika anomali.
- Monitoring metrik: koneksi aktif, latency, QPS, penggunaan storage, deadlock/timeouts.

## Rencana Pemulihan Bencana (ringkas)
- Backup offsite, prosedur restore teruji, runbook insiden (kontak, langkah, verifikasi).
- Simulasi pemadaman DB dan uji failover jika memakai replika.

---

## Naming Conventions

### Tabel
```
snake_case, singular
Contoh: employee, leave_request, attendance_correction, kpi_goal
```

### Kolom
```
snake_case
Primary key: id (UUID)
Foreign key: {table_name}_id
Timestamp: {action}_at (created_at, updated_at, deleted_at, approved_at)
Boolean: is_{adjective} atau has_{noun} (is_active, has_verified, is_corrected)
Enum/Status: {noun} (status, type, category)
```

### Index
```
idx_{table}_{column(s)}
Contoh: idx_employee_tenant_id, idx_attendance_employee_date
```

### Constraint
```
{table}_{column(s)}_{type}
Contoh:
- employee_email_unique (UNIQUE)
- attendance_employee_date_unique (UNIQUE)
- leave_balance_remaining_check (CHECK)
- leave_request_employee_id_fkey (FOREIGN KEY)
```

### Enum Types
```
{context}_{name}
Contoh: user_status, employee_status, attendance_status, approval_status
```

---

## Soft Delete Policy

### Tabel dengan Soft Delete
Tabel berikut menggunakan soft delete (`deleted_at TIMESTAMPTZ`):

| Tabel | Alasan |
|-------|--------|
| `employee` | Histori kepegawaian perlu disimpan |
| `user` | Audit trail login history |
| `document` | Arsip dokumen |
| `leave_request` | Histori pengajuan |
| `expense` | Audit keuangan |
| `travel_request` | Audit perjalanan |
| `letter_request` | Arsip surat |
| `announcement` | Histori pengumuman |

### Tabel dengan Hard Delete
Tabel berikut menggunakan hard delete (langsung hapus):

| Tabel | Alasan |
|-------|--------|
| `notification` | Data transient, tidak perlu audit |
| `notification_preference` | Preferensi user, tidak sensitif |
| `session` | Data session, rotasi cepat |
| `refresh_token` | Security, harus dihapus permanen |

### Implementasi Soft Delete

```sql
-- Menambahkan kolom soft delete
ALTER TABLE employee ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index untuk query aktif
CREATE INDEX idx_employee_active ON employee (tenant_id, id) WHERE deleted_at IS NULL;

-- Soft delete query
UPDATE employee SET deleted_at = NOW() WHERE id = $1;

-- Query dengan filter aktif (WAJIB)
SELECT * FROM employee WHERE tenant_id = $1 AND deleted_at IS NULL;
```

### Prisma Schema
```prisma
model Employee {
  id        String    @id @default(uuid())
  // ... other fields
  deletedAt DateTime? @map("deleted_at")

  @@index([tenantId, id])
  @@map("employee")
}

// Middleware untuk auto-filter soft delete
prisma.$use(async (params, next) => {
  if (params.model === 'Employee') {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, deletedAt: null };
    }
  }
  return next(params);
});
```

---

## Data Retention Policy

| Data Type | Retention | Action After Expiry |
|-----------|-----------|---------------------|
| Active employee | Indefinite | - |
| Terminated employee | 5 tahun | Archive → Hard delete |
| Attendance records | 5 tahun | Archive → Hard delete |
| Leave requests | 5 tahun | Archive → Hard delete |
| Payslip | 10 tahun | Archive (compliance) |
| Audit logs | 7 tahun | Archive → Hard delete |
| Session data | 30 hari | Hard delete |
| Notification | 90 hari | Hard delete |
| Failed login attempts | 30 hari | Hard delete |
| Selfie photos | 2 tahun | Hard delete |

### Archive Strategy
```sql
-- Pindahkan data lama ke tabel archive
INSERT INTO attendance_archive
SELECT * FROM attendance
WHERE attendance_date < NOW() - INTERVAL '5 years';

-- Hapus dari tabel utama
DELETE FROM attendance
WHERE attendance_date < NOW() - INTERVAL '5 years';
```

---

## Index Strategy

### Primary Indexes (Wajib)

```sql
-- Tenant isolation
CREATE INDEX idx_{table}_tenant_id ON {table} (tenant_id);

-- Semua tabel dengan tenant_id + primary lookup
CREATE INDEX idx_employee_tenant_number ON employee (tenant_id, employee_number);
CREATE INDEX idx_user_tenant_email ON user (tenant_id, email);
CREATE INDEX idx_attendance_tenant_employee_date ON attendance (tenant_id, employee_id, attendance_date);
```

### Secondary Indexes (Rekomendasi)

```sql
-- Status filtering
CREATE INDEX idx_user_tenant_status ON user (tenant_id, status) WHERE status = 'pending';
CREATE INDEX idx_leave_request_tenant_status ON leave_request (tenant_id, status) WHERE status IN ('pending', 'approved_manager');

-- Date range queries
CREATE INDEX idx_attendance_tenant_date ON attendance (tenant_id, attendance_date DESC);
CREATE INDEX idx_payslip_tenant_period ON payslip (tenant_id, period_start, period_end);

-- Manager hierarchy
CREATE INDEX idx_employee_tenant_manager ON employee (tenant_id, manager_id);

-- Audit log
CREATE INDEX idx_audit_log_tenant_actor_time ON audit_log (tenant_id, actor_id, created_at DESC);
```

### Partial Indexes

```sql
-- Hanya record aktif
CREATE INDEX idx_employee_active ON employee (tenant_id, id)
WHERE deleted_at IS NULL AND status = 'active';

-- Hanya pending approvals
CREATE INDEX idx_leave_request_pending ON leave_request (tenant_id, created_at)
WHERE status = 'pending';
```

---

## Audit Columns

### Standard Audit Columns
Setiap tabel utama WAJIB memiliki:

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ,
created_by UUID REFERENCES user(id),
updated_by UUID REFERENCES user(id)
```

### Trigger untuk Auto-Update
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_employee_updated_at
BEFORE UPDATE ON employee
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Connection Pooling

### Konfigurasi PgBouncer (Rekomendasi)
```ini
[databases]
peoplehub = host=localhost port=5432 dbname=peoplehub

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
```

### Prisma Connection Pool
```
DATABASE_URL="postgresql://user:pass@localhost:5432/peoplehub?connection_limit=10&pool_timeout=10"
```

---

## Query Guidelines

### WAJIB: Tenant Filter
```typescript
// BENAR
const employees = await prisma.employee.findMany({
  where: { tenantId: ctx.tenantId, status: 'active' }
});

// SALAH - TIDAK BOLEH!
const employees = await prisma.employee.findMany({
  where: { status: 'active' }  // Missing tenant filter!
});
```

### Pagination
```typescript
// Cursor-based (rekomendasi untuk daftar besar)
const employees = await prisma.employee.findMany({
  where: { tenantId },
  take: 20,
  skip: 1,
  cursor: { id: lastId },
  orderBy: { createdAt: 'desc' }
});

// Offset-based (untuk daftar kecil)
const employees = await prisma.employee.findMany({
  where: { tenantId },
  take: 20,
  skip: (page - 1) * 20
});
```

### Batch Operations
```typescript
// Batch insert
await prisma.attendance.createMany({
  data: attendanceRecords,
  skipDuplicates: true
});

// Batch update
await prisma.leaveRequest.updateMany({
  where: { id: { in: requestIds }, tenantId },
  data: { status: 'approved' }
});
```

---

## Dokumen Terkait

| Dokumen | Deskripsi |
|---------|-----------|
| [erd.md](../03-architecture/erd.md) | ERD lengkap |
| [security.md](../07-operations/security.md) | Keamanan data |
| [backup-dr.md](../07-operations/backup-dr.md) | Backup & DR |
| [env-config.md](env-config.md) | Konfigurasi database |
