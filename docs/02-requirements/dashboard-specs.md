# Dashboard per Role (Detail)

> **Versi:** 2.0 | **Tanggal Update:** 22 Januari 2026 | **Status:** Final

---

## Ringkasan

Dokumen ini mendefinisikan spesifikasi dashboard untuk setiap role dalam sistem PeopleHub, mencakup metrik utama, visualisasi, tabel data, alert, dan aksi cepat.

---

## HRD Dashboard

### Metrik Utama (KPI Cards)

| Metrik | Data Source | Refresh | Format |
|--------|-------------|---------|--------|
| Hadir Hari Ini | `attendance.status = 'present'` | Real-time | `120/150` (count/total) |
| Terlambat Hari Ini | `attendance.late_minutes > 0` | Real-time | `15` (count) + `↑5%` (vs yesterday) |
| Absen Hari Ini | `attendance.status = 'absent'` | Real-time | `10` (count) |
| Lembur Hari Ini | `attendance.overtime_minutes > 0` | Real-time | `8 karyawan` |
| Pengajuan Pending | Count per jenis | Real-time | Badge per kategori |
| Kontrak Akan Habis | `employee.end_date < NOW() + 30d` | Daily | `5` (count) |

### Visualisasi

```
┌─────────────────────────────────────────────────────────────┐
│  Heatmap Kehadiran per Cabang (7/30 hari)                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Jakarta  ▓▓▓▓▓▓▓░░░  92%                               ││
│  │ Bandung  ▓▓▓▓▓▓░░░░  85%                               ││
│  │ Surabaya ▓▓▓▓▓▓▓▓░░  95%                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Tren Keterlambatan (7 hari)        Penggunaan Cuti (Bulan) │
│  ┌───────────────────┐              ┌───────────────────┐   │
│  │       ./\.        │              │  ████ Tahunan     │   │
│  │      /    \       │              │  ██   Sakit       │   │
│  │     /      \.     │              │  █    Khusus      │   │
│  └───────────────────┘              └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

| Chart | Tipe | Data | Filter |
|-------|------|------|--------|
| Heatmap Kehadiran | Heatmap | Attendance per branch | 7/30 hari, Cabang |
| Tren Keterlambatan | Line Chart | Late count per day | 7/30 hari |
| Penggunaan Cuti | Stacked Bar | Leave by type | Bulan ini |
| Top 5 Cabang Terlambat | Horizontal Bar | Late % per branch | Hari ini |

### Tabel Data

| Tabel | Kolom | Sort Default | Pagination |
|-------|-------|--------------|------------|
| Antrean Approval | Jenis, Nama, Tanggal, Status | Tanggal ASC | 10/page |
| Koreksi Absensi | Nama, Tanggal, Jam, Alasan | Created DESC | 10/page |
| Travel/Reimburse | Nama, Tujuan, Jumlah, Status | Created DESC | 10/page |

### Alerts

| Alert | Kondisi | Severity | Aksi |
|-------|---------|----------|------|
| Lonjakan Keterlambatan | Late today > 2x avg | Warning | Lihat Detail |
| SLA Terlewati | Pending > 24 jam | Error | Proses Sekarang |
| Saldo Cuti Hampir Nol | Balance < 2 hari | Info | Lihat Karyawan |
| Slip Belum Publish | Draft payslip exists | Warning | Publish |

### Aksi Cepat

| Tombol | Route | Icon |
|--------|-------|------|
| Approve Batch | `/admin/approvals` | CheckCircle |
| Publish Pengumuman | `/admin/announcement/create` | Megaphone |
| Set Delegasi | `/admin/policy/delegation` | UserSwitch |
| Konfigurasi Jadwal | `/admin/policy/attendance` | Settings |

---

## Atasan/Manager Dashboard

### Metrik Utama (KPI Cards)

| Metrik | Data Source | Scope | Format |
|--------|-------------|-------|--------|
| Hadir Tim Hari Ini | Attendance where manager_id = current | Team | `8/10` |
| Terlambat Tim | Late count in team | Team | `2` |
| Saldo Cuti Tim | Total remaining balance | Team | `45 hari` |
| Pending Approval | Requests awaiting manager | Team | Badge count |

### Visualisasi

| Chart | Tipe | Data | Filter |
|-------|------|------|--------|
| Tren Kehadiran Tim | Line Chart | Team attendance 7/30d | Periode |
| Progres KPI Tim | Progress Bars | KPI goals per member | Cycle aktif |
| Kalender Cuti Tim | Calendar | Leave requests | Bulan |

### Tabel Data

| Tabel | Kolom | Filter |
|-------|-------|--------|
| Antrean Approval Tim | Nama, Jenis, Tanggal, Status | Status |
| Pengumuman Tim | Judul, Tanggal, Read % | Status baca |

### Aksi Cepat

| Tombol | Route | Icon |
|--------|-------|------|
| Approve/Reject | Modal inline | CheckCircle/X |
| Kirim Pengumuman | `/admin/announcement/create` | Megaphone |
| Detail Anggota | `/admin/employee/:id` | User |

---

## Karyawan Dashboard

### Metrik Utama (KPI Cards)

| Metrik | Data Source | Format |
|--------|-------------|--------|
| Saldo Cuti | LeaveBalance | `9 hari` (per type) |
| Status Absen | Attendance today | `Hadir 08:00 WFO` |
| KPI Aktif | KPIGoal.achievement_percentage | `75%` |
| Pengajuan Terbaru | Latest request status | Badge |

### Visualisasi

| Widget | Tipe | Data |
|--------|------|------|
| Jadwal Shift | Calendar mini | Schedule 7 hari |
| Progres KPI | Progress bar | Current vs Target |

### Kartu/Tabel

| Elemen | Konten |
|--------|--------|
| Slip Gaji Terbaru | Period, Net salary, Download link |
| Riwayat Pengajuan | Last 5 requests with status |
| Pengumuman | Unread count, latest 3 |

### Aksi Cepat

| Tombol | Route | Icon | Mobile Priority |
|--------|-------|------|-----------------|
| Clock In/Out | `/attendance/clock` | Camera | ★★★ |
| Ajukan Cuti | `/leave/request` | Calendar | ★★★ |
| Ajukan Reimburse | `/reimburse/request` | Receipt | ★★ |
| Lihat Slip Gaji | `/payslip` | Document | ★★ |

---

## Finance/Payroll Dashboard

### Metrik Utama (KPI Cards)

| Metrik | Data Source | Format |
|--------|-------------|--------|
| Periode Payroll | PayrollRun aktif | `Januari 2026` |
| Slip Siap Publish | Payslip.status = 'draft' | `45` |
| Reimburse Pending | Expense.status = 'pending' | `Rp 15.5 jt` |
| Pinjaman Outstanding | CashAdvance.status = 'disbursed' | `Rp 25 jt` |

### Visualisasi

| Chart | Tipe | Data |
|-------|------|------|
| Biaya per Kategori | Pie Chart | Expense by category |
| Tren Pinjaman | Area Chart | Outstanding by month |
| Status Ekspor | Status card | Last export status |

### Tabel Data

| Tabel | Kolom |
|-------|-------|
| Reimburse Pending | Nama, Kategori, Jumlah, Tanggal |
| Slip Belum Publish | Periode, Cabang, Jumlah |
| COA Alert | Item tanpa mapping |

### Aksi Cepat

| Tombol | Route |
|--------|-------|
| Approve Pembayaran | `/admin/reimburse/payment` |
| Publish Slip Batch | `/admin/payroll/publish` |
| Ekspor Payroll | `/admin/payroll/export` |

---

## IT/Ops Dashboard

### Metrik Utama (KPI Cards)

| Metrik | Data Source | Format |
|--------|-------------|--------|
| Status SSO/2FA | Config aktif | `Active` / `Inactive` |
| Login Gagal | LoginAttempt.success = false | `23 hari ini` |
| Geofence Hits | Out-of-bound attempts | `5` |
| Error Rate API | Monitoring | `0.02%` |

### Visualisasi

| Chart | Tipe | Data |
|-------|------|------|
| Latensi API | Line Chart | P95 per hour |
| Login Fail Trend | Bar Chart | Failed attempts 7d |
| Health Checks | Status Grid | Service status |

### Tabel Data

| Tabel | Kolom |
|-------|-------|
| Audit Log | Actor, Action, Object, Timestamp |
| API Keys Aktif | Name, Created, Last Used |
| Webhook Status | Endpoint, Status, Last Triggered |

### Aksi Cepat

| Tombol | Route |
|--------|-------|
| Revoke Akses | `/admin/security/users` |
| Rotasi Token | `/admin/security/api-keys` |
| Update Geofence | `/admin/security/geofence` |

---

## Super Admin/Tenant Admin Dashboard

### Metrik Utama (KPI Cards)

| Metrik | Data Source | Format |
|--------|-------------|--------|
| Jumlah Tenant | Tenant.count | `4` |
| Total Karyawan | Employee.count (all) | `600` |
| Cabang per Tenant | Branch.count grouped | Chart mini |
| Status Isolasi | Test result | `OK` / `Alert` |

### Visualisasi

| Chart | Tipe | Data |
|-------|------|------|
| Aktivitas per Tenant | Bar Chart | Logins per tenant |
| Health Tenants | Status Grid | DB/App health |

### Tabel Data

| Tabel | Kolom |
|-------|-------|
| Admin per Tenant | Tenant, Admin Name, Last Login |
| Permintaan Konfigurasi | Tenant, Request Type, Date |

### Aksi Cepat

| Tombol | Route |
|--------|-------|
| Tambah Admin | `/superadmin/tenant/:id/admins` |
| Update Branding | `/superadmin/tenant/:id/branding` |
| Set Batas Cabang | `/superadmin/tenant/:id/config` |

---

## Responsif (Desktop vs Mobile)

| Role | Desktop Layout | Mobile Layout |
|------|----------------|---------------|
| Karyawan | Grid 3 kolom | Stack vertikal, Aksi cepat sticky |
| Manager | Grid 2 kolom | Tab navigation |
| HRD | Grid 4 kolom | Collapsible sections |
| Finance | Grid 3 kolom | Tab navigation |
| IT/Ops | Grid 3 kolom | Collapsible sections |
| Super Admin | Full width tables | Scrollable tables |

---

## Performa Target

| Metrik | Target | Measurement |
|--------|--------|-------------|
| Dashboard Load | < 3 detik | First contentful paint |
| Data Refresh | < 1 detik | API response time |
| Widget Load | < 500ms | Individual components |

---

## Dokumen Terkait

- [hld.md](../03-architecture/hld.md) - Arsitektur sistem
- [specification.md](../04-api/specification.md) - API untuk data dashboard
- [design-system.md](../05-frontend/design-system.md) - Komponen UI
