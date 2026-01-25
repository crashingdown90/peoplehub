# Wireframes & Mockups PeopleHub

## 1. Overview

Dokumen ini berisi wireframe detail untuk halaman-halaman utama PeopleHub, memberikan panduan visual bagi developer dalam implementasi UI.

**Notasi:**
- `[ ]` = Button
- `[___]` = Input field
- `[▼]` = Dropdown
- `○` = Radio button
- `□` = Checkbox
- `●` = Active/selected state
- `→` = Navigation/link

---

## 2. Global Layout Components

### 2.1 Header / Topbar (Desktop)

Header konsisten di semua halaman setelah login:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO] PeopleHub    [Tenant: PT. Kreatifindo ▼]    [🔍 Search...]  [🔔 3] [👤 ▼]  │
└─────────────────────────────────────────────────────────────────────────────────────┘
     │                        │                            │          │       │
     │                        │                            │          │       └─ User Menu
     │                        │                            │          │          - Profil Saya
     │                        │                            │          │          - Pengaturan
     │                        │                            │          │          - Bantuan
     │                        │                            │          │          - Logout
     │                        │                            │          │
     │                        │                            │          └─ Notification Bell
     │                        │                            │             Badge count jika ada
     │                        │                            │
     │                        │                            └─ Global Search
     │                        │                               Cari karyawan, pengajuan, dll
     │                        │
     │                        └─ Tenant Switcher (jika multi-tenant)
     │                           Hanya untuk Super Admin
     │
     └─ Logo + Brand Name
        Klik untuk ke Dashboard
```

**Komponen Header:**

| Element | Deskripsi | Visibility |
|---------|-----------|------------|
| Logo | Logo tenant atau default PeopleHub | All roles |
| Tenant Switcher | Dropdown pilih tenant | Super Admin only |
| Global Search | Pencarian cepat | All roles |
| Notification Bell | Icon dengan badge count | All roles |
| User Avatar | Foto + dropdown menu | All roles |

### 2.2 Header / Topbar (Mobile)

```
┌───────────────────────────┐
│ [≡]  PeopleHub   [🔔] [👤]│
└───────────────────────────┘
   │                  │    │
   │                  │    └─ User Avatar (tap untuk menu)
   │                  │
   │                  └─ Notification Bell
   │
   └─ Hamburger Menu (buka sidebar)
```

### 2.3 Sidebar Navigation (Desktop)

```
┌────────────────────┐
│  Dashboard         │  ← Active: background highlight + left border
│  ● Overview        │
│                    │
│  Absensi           │  ← Section header (collapsible)
│  > Rekap           │
│  > Koreksi         │
│  > Tukar Shift     │
│                    │
│  Cuti & Izin       │
│  > Pengajuan       │
│  > Saldo           │
│                    │
│  Perjalanan        │
│  > Request         │
│  > Reimburse       │
│  > Pinjaman        │
│                    │
│  Payroll           │
│  > Slip Gaji       │
│  > Generate        │  ← HRD/Finance only
│                    │
│  Kinerja           │
│  > KPI             │
│  > Review          │
│                    │
│  Dokumen           │
│  > Surat           │
│  > Dokumen Resmi   │
│                    │
│  Pengumuman        │
│                    │
│  Bantuan           │
│  > Tiket           │
│  > Aset            │
│                    │
│  ──────────────    │  ← Divider
│                    │
│  Admin             │  ← HRD/Admin only
│  > Karyawan        │
│  > Organisasi      │
│  > Kebijakan       │
│  > Pengaturan      │
│                    │
└────────────────────┘
   │
   Width: 256px (expanded)
          64px (collapsed, icons only)
```

### 2.4 Sidebar per Role

| Menu | Karyawan | Manager | HRD | Finance | IT/Ops | Super Admin |
|------|----------|---------|-----|---------|--------|-------------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Absensi Rekap | ✓ (self) | ✓ (tim) | ✓ (all) | - | ✓ | ✓ |
| Cuti Pengajuan | ✓ | ✓ | ✓ | - | - | - |
| Cuti Approval | - | ✓ | ✓ | - | - | - |
| Perjalanan | ✓ | ✓ | ✓ | ✓ | - | - |
| Slip Gaji | ✓ (self) | ✓ (self) | ✓ (all) | ✓ (all) | - | - |
| Generate Payroll | - | - | ✓ | ✓ | - | - |
| KPI | ✓ | ✓ | ✓ | - | - | - |
| Dokumen | ✓ | ✓ | ✓ | - | - | - |
| Pengumuman | ✓ (read) | ✓ (crud) | ✓ (crud) | - | - | ✓ |
| Tiket | ✓ | ✓ | ✓ | - | ✓ | - |
| Admin Karyawan | - | - | ✓ | - | - | ✓ |
| Admin Kebijakan | - | - | ✓ | ✓ | ✓ | ✓ |
| Tenant Config | - | - | - | - | - | ✓ |

### 2.5 Footer (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                     │
│  © 2024 PT. Kreatifindo Abadi Sejahtera    │    Bantuan  •  Kebijakan  •  v1.0.0   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Catatan Footer:**
- Footer opsional, dapat disembunyikan di halaman form/detail
- Tampilkan nama tenant sesuai login
- Link ke halaman bantuan dan kebijakan privasi
- Tampilkan versi aplikasi

### 2.6 Footer (Mobile)

Footer pada mobile diganti dengan **Bottom Navigation Bar**:

```
┌───────────────────────────────────────┐
│ [🏠]   [📋]   [📄]   [💰]   [👤]     │
│ Home   Absen  Cuti   Gaji   Profil   │
└───────────────────────────────────────┘
```

**Bottom Nav Items per Role:**

| Role | Item 1 | Item 2 | Item 3 | Item 4 | Item 5 |
|------|--------|--------|--------|--------|--------|
| Karyawan | Home | Absen | Cuti | Slip | Profil |
| Manager | Home | Tim | Approval | Notif | Profil |
| HRD | Home | Karyawan | Approval | Report | Profil |
| Finance | Home | Payroll | Reimburse | Report | Profil |

### 2.7 Breadcrumb

```
Dashboard > Cuti > Detail Pengajuan > #CTI-2024-0001
    │         │           │               │
    │         │           │               └─ ID/Reference (optional)
    │         │           │
    │         │           └─ Current page (non-clickable, bold)
    │         │
    │         └─ Parent page (clickable)
    │
    └─ Root (clickable)
```

**Rules:**
- Tampilkan breadcrumb di semua halaman kecuali Dashboard
- Maximum 4 levels, collapse middle jika lebih
- Item terakhir non-clickable dan bold
- Separator: `>` atau `/`

### 2.8 Page Title Area

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > Cuti > Pengajuan                                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Pengajuan Cuti                                        [Filter ▼] [+ Ajukan Cuti]  │
│  Kelola semua pengajuan cuti Anda                                                   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
     │                                                          │            │
     │                                                          │            └─ Primary Action
     │                                                          │
     │                                                          └─ Secondary Actions
     │
     └─ Page Title + Description (optional)
```

---

## 3. Login & Authentication

### 3.1 Halaman Login (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                           ┌─────────────────────┐                       │
│                           │                     │                       │
│                           │    [LOGO]           │                       │
│                           │    PeopleHub        │                       │
│                           │                     │                       │
│                           ├─────────────────────┤                       │
│                           │                     │                       │
│                           │  Masuk ke Akun Anda │                       │
│                           │                     │                       │
│                           │  Email              │                       │
│                           │  [________________] │                       │
│                           │                     │                       │
│                           │  Password           │                       │
│                           │  [________________] │                       │
│                           │                     │                       │
│                           │  □ Ingat saya       │                       │
│                           │                     │                       │
│                           │  [     Masuk      ] │                       │
│                           │                     │                       │
│                           │  → Lupa password?   │                       │
│                           │                     │                       │
│                           ├─────────────────────┤                       │
│                           │  Belum punya akun?  │                       │
│                           │  → Daftar sekarang  │                       │
│                           └─────────────────────┘                       │
│                                                                         │
│                           © 2024 Kreatifindo                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Halaman Login (Mobile)

```
┌───────────────────────┐
│                       │
│       [LOGO]          │
│       PeopleHub       │
│                       │
├───────────────────────┤
│                       │
│  Masuk ke Akun Anda   │
│                       │
│  Email                │
│  [_________________]  │
│                       │
│  Password             │
│  [_________________]  │
│                       │
│  □ Ingat saya         │
│                       │
│  [      Masuk       ] │
│                       │
│  → Lupa password?     │
│                       │
├───────────────────────┤
│  Belum punya akun?    │
│  → Daftar sekarang    │
└───────────────────────┘
```

### 3.3 Halaman Registrasi

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ┌─────────────────────┐                       │
│                           │    [LOGO]           │                       │
│                           │    PeopleHub        │                       │
│                           ├─────────────────────┤                       │
│                           │                     │                       │
│                           │  Daftar Akun Baru   │                       │
│                           │                     │                       │
│                           │  Tenant/Perusahaan  │                       │
│                           │  [Select...      ▼] │                       │
│                           │                     │                       │
│                           │  Email              │                       │
│                           │  [________________] │                       │
│                           │                     │                       │
│                           │  Nama Lengkap       │                       │
│                           │  [________________] │                       │
│                           │                     │                       │
│                           │  Password           │                       │
│                           │  [________________] │                       │
│                           │  Min. 8 karakter    │                       │
│                           │                     │                       │
│                           │  Konfirmasi Password│                       │
│                           │  [________________] │                       │
│                           │                     │                       │
│                           │  [    Daftar      ] │                       │
│                           │                     │                       │
│                           │  Sudah punya akun?  │                       │
│                           │  → Masuk            │                       │
│                           └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dashboard

### 3.1 Dashboard HRD (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO] PeopleHub                    [🔍 Search...]  [🔔 3] [👤 Admin HRD ▼]        │
├────────────┬────────────────────────────────────────────────────────────────────────┤
│            │  Dashboard > Overview                                                  │
│  Dashboard │────────────────────────────────────────────────────────────────────────│
│  ● Overview│                                                                        │
│            │  Selamat datang, Admin HRD                    Senin, 15 Januari 2024   │
│  Absensi   │                                                                        │
│  > Rekap   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  > Koreksi │  │ Hadir    │  │ Terlambat│  │ Absen    │  │ Cuti     │               │
│            │  │    145   │  │    12    │  │    8     │  │   15     │               │
│  Cuti      │  │  ↑ 5%    │  │  ↓ 2%    │  │  ↑ 1%    │  │  ↓ 3%    │               │
│  > Pengajuan│ └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│  > Saldo   │                                                                        │
│            │  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│  Perjalanan│  │ Tren Kehadiran (30 Hari)        │  │ Pengajuan Pending           │  │
│  > Request │  │                                 │  │                             │  │
│  > Reimburse│ │  ▁▂▃▅▆▇█▇▆▅▃▂▁▂▃▅▆▇█▇▆▅▃▂▁     │  │ Cuti         : 8 pengajuan  │  │
│            │  │                                 │  │ Koreksi      : 3 pengajuan  │  │
│  Payroll   │  │  [Line chart: Hadir/Terlambat] │  │ Perjalanan   : 5 pengajuan  │  │
│  > Slip    │  │                                 │  │ Reimburse    : 12 pengajuan │  │
│  > Generate│  └─────────────────────────────────┘  │                             │  │
│            │                                       │ [Lihat Semua →]             │  │
│  Karyawan  │                                       └─────────────────────────────┘  │
│  > Data    │                                                                        │
│  > Struktur│  ┌─────────────────────────────────────────────────────────────────┐  │
│            │  │ Antrean Approval                                    [Filter ▼]  │  │
│  Pengaturan│  ├─────────────────────────────────────────────────────────────────┤  │
│            │  │ □ │ Nama          │ Jenis       │ Tanggal  │ Status    │ Aksi   │  │
│            │  ├───┼───────────────┼─────────────┼──────────┼───────────┼────────┤  │
│            │  │ □ │ John Doe      │ Cuti        │ 15 Jan   │ ●Pending  │ [...]  │  │
│            │  │ □ │ Jane Smith    │ Reimburse   │ 14 Jan   │ ●Pending  │ [...]  │  │
│            │  │ □ │ Bob Wilson    │ Perjalanan  │ 14 Jan   │ ●In Review│ [...]  │  │
│            │  │ □ │ Alice Brown   │ Koreksi     │ 13 Jan   │ ●Pending  │ [...]  │  │
│            │  ├─────────────────────────────────────────────────────────────────┤  │
│            │  │ [□ Select All]   [Approve Selected]   [Reject Selected]         │  │
│            │  └─────────────────────────────────────────────────────────────────┘  │
│            │                                                                        │
└────────────┴────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Dashboard Karyawan (Mobile)

```
┌───────────────────────────┐
│ [≡]  PeopleHub   [🔔] [👤]│
├───────────────────────────┤
│                           │
│  Selamat datang,          │
│  John Doe                 │
│  Senin, 15 Januari 2024   │
│                           │
├───────────────────────────┤
│  ┌───────────────────┐    │
│  │ Saldo Cuti        │    │
│  │                   │    │
│  │ Tahunan: 10 hari  │    │
│  │ Sakit: 5 hari     │    │
│  │ Penting: 2 hari   │    │
│  └───────────────────┘    │
│                           │
├───────────────────────────┤
│  Status Hari Ini          │
│  ┌───────────────────┐    │
│  │                   │    │
│  │  ⏰ 08:45 WIB     │    │
│  │  📍 Kantor Pusat  │    │
│  │                   │    │
│  │  ✓ Clock In       │    │
│  │  ○ Clock Out      │    │
│  │                   │    │
│  └───────────────────┘    │
│                           │
│  ┌───────────────────────┐│
│  │                       ││
│  │  [    📷 ABSEN     ]  ││
│  │                       ││
│  │  WFO ○    ○ WFH       ││
│  │                       ││
│  └───────────────────────┘│
│                           │
├───────────────────────────┤
│  Jadwal Shift Minggu Ini  │
│  ┌───────────────────┐    │
│  │ Sen │ Sel │ Rab │ ...│ │
│  │ 08-17│ 08-17│ 08-17│  │ │
│  │  ●  │  ○  │  ○  │     │ │
│  └───────────────────┘    │
│                           │
├───────────────────────────┤
│  Pengajuan Terakhir       │
│  ┌───────────────────┐    │
│  │ Cuti 20-22 Jan    │    │
│  │ ● Menunggu Atasan │    │
│  └───────────────────┘    │
│                           │
├───────────────────────────┤
│ [🏠] [📋] [📄] [💰] [👤]  │
│ Home  Absen Cuti  Slip Me │
└───────────────────────────┘
```

### 4.3 Dashboard Finance (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO] PeopleHub                    [🔍 Search...]  [🔔 5] [👤 Finance ▼]          │
├────────────┬────────────────────────────────────────────────────────────────────────┤
│            │  Dashboard > Finance Overview                                          │
│  Dashboard │────────────────────────────────────────────────────────────────────────│
│  ● Overview│                                                                        │
│            │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  Payroll   │  │ Periode  │  │ Slip     │  │ Reimburse│  │ Pinjaman │               │
│  > Generate│  │ Jan 2024 │  │ Ready    │  │ Pending  │  │Outstanding│              │
│  > Publish │  │  Active  │  │   180    │  │   12     │  │ Rp 45jt  │               │
│  > History │  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│            │                                                                        │
│  Reimburse │  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│  > Pending │  │ Biaya per Kategori (Bulan Ini)  │  │ Status Slip Gaji            │  │
│  > Approved│  │                                 │  │                             │  │
│  > Paid    │  │  Transport  ████████  35%       │  │ ● Belum Generate : 0        │  │
│            │  │  Makan      █████     22%       │  │ ● Siap Publish   : 180      │  │
│  Pinjaman  │  │  Akomodasi  ████      18%       │  │ ● Sudah Publish  : 0        │  │
│  > Active  │  │  Lainnya    █████     25%       │  │                             │  │
│  > History │  │                                 │  │ [Generate Batch]            │  │
│            │  └─────────────────────────────────┘  └─────────────────────────────┘  │
│  Komponen  │                                                                        │
│  > Gaji    │  ┌─────────────────────────────────────────────────────────────────┐  │
│  > COA     │  │ Reimburse Pending Pembayaran                       [Bayar Batch]│  │
│            │  ├─────────────────────────────────────────────────────────────────┤  │
│  Ekspor    │  │ □ │ Nama          │ Kategori    │ Jumlah     │ Status   │ Aksi  │  │
│            │  ├───┼───────────────┼─────────────┼────────────┼──────────┼───────┤  │
│            │  │ □ │ John Doe      │ Transport   │ Rp 500.000 │ Approved │ [Pay] │  │
│            │  │ □ │ Jane Smith    │ Makan       │ Rp 250.000 │ Approved │ [Pay] │  │
│            │  │ □ │ Bob Wilson    │ Akomodasi   │ Rp 1.200.000│ Approved│ [Pay] │  │
│            │  └─────────────────────────────────────────────────────────────────┘  │
│            │                                                                        │
└────────────┴────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Dashboard Manager/Atasan (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO] PeopleHub                    [🔍 Search...]  [🔔 4] [👤 Manager ▼]          │
├────────────┬────────────────────────────────────────────────────────────────────────┤
│            │  Dashboard > Tim Saya                                                  │
│  Dashboard │────────────────────────────────────────────────────────────────────────│
│  ● Tim Saya│                                                                        │
│            │  Selamat datang, Budi Santoso              Senin, 15 Januari 2024      │
│  Absensi   │  Manager - Engineering                                                 │
│  > Tim     │                                                                        │
│  > Rekap   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│            │  │ Tim Hadir│  │ Terlambat│  │ Absen    │  │ Cuti     │               │
│  Approval  │  │   12/15  │  │    2     │  │    1     │  │    2     │               │
│  > Cuti    │  │  80%     │  │  13%     │  │  7%      │  │          │               │
│  > Koreksi │  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│  > Travel  │                                                                        │
│            │  ┌─────────────────────────────────────────────────────────────────┐  │
│  KPI Tim   │  │ Pengajuan Menunggu Approval Anda                  [Lihat Semua] │  │
│  > Target  │  ├─────────────────────────────────────────────────────────────────┤  │
│  > Progres │  │ Nama          │ Jenis       │ Tanggal  │ Status    │ Aksi        │  │
│            │  ├───────────────┼─────────────┼──────────┼───────────┼─────────────┤  │
│  Pengumuman│  │ John Doe      │ Cuti        │ 15 Jan   │ ●Pending  │[✓][✕][→]   │  │
│            │  │ Jane Smith    │ Koreksi     │ 14 Jan   │ ●Pending  │[✓][✕][→]   │  │
│            │  │ Alice Brown   │ Perjalanan  │ 13 Jan   │ ●Pending  │[✓][✕][→]   │  │
│            │  └─────────────────────────────────────────────────────────────────┘  │
│            │                                                                        │
│            │  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│            │  │ Kehadiran Tim (Minggu Ini)      │  │ KPI Tim - Q1 2024           │  │
│            │  │                                 │  │                             │  │
│            │  │  Sen  Sel  Rab  Kam  Jum        │  │ Overall Progress: 72%       │  │
│            │  │  15   15   14   15   -          │  │ ████████████████░░░░░░░░    │  │
│            │  │  ██   ██   ██   ██   ░          │  │                             │  │
│            │  │                                 │  │ On Track  : 10 karyawan     │  │
│            │  │  [Lihat Detail]                 │  │ At Risk   : 3 karyawan      │  │
│            │  └─────────────────────────────────┘  │ Behind    : 2 karyawan      │  │
│            │                                       └─────────────────────────────┘  │
│            │                                                                        │
└────────────┴────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Dashboard IT/Ops (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO] PeopleHub                    [🔍 Search...]  [🔔 2] [👤 IT Admin ▼]         │
├────────────┬────────────────────────────────────────────────────────────────────────┤
│            │  Dashboard > System Overview                                           │
│  Dashboard │────────────────────────────────────────────────────────────────────────│
│  ● System  │                                                                        │
│            │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  Keamanan  │  │ API      │  │ Login    │  │ Login    │  │ Active   │               │
│  > SSO/2FA │  │ Uptime   │  │ Success  │  │ Failed   │  │ Sessions │               │
│  > Audit   │  │  99.9%   │  │   1,245  │  │    23    │  │   342    │               │
│            │  │  ↑ 0.1%  │  │  ↑ 5%    │  │  ↓ 12%   │  │          │               │
│  Tiket     │  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│  > Open    │                                                                        │
│  > Resolved│  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│            │  │ API Response Time (24h)         │  │ Security Alerts             │  │
│  Kebijakan │  │                                 │  │                             │  │
│  > Geofence│  │  ▁▂▃▂▁▂▃▄▃▂▁▂▃▂▁▂▃▄▅▄▃▂▁       │  │ ⚠ 3 failed login attempts   │  │
│  > Device  │  │  Avg: 245ms  P95: 890ms         │  │   from IP 192.168.1.x       │  │
│  > IP      │  │                                 │  │   15 menit lalu             │  │
│            │  │  [View Metrics]                 │  │                             │  │
│  Integrasi │  └─────────────────────────────────┘  │ ✓ SSL certificate valid     │  │
│  > Webhook │                                       │   Expires in 45 days        │  │
│  > API Key │  ┌─────────────────────────────────────────────────────────────────┐  │
│            │  │ Audit Log Terbaru                                  [View All]   │  │
│  Role      │  ├─────────────────────────────────────────────────────────────────┤  │
│  > Users   │  │ Waktu      │ User        │ Action              │ Detail         │  │
│  > Perms   │  ├────────────┼─────────────┼─────────────────────┼────────────────┤  │
│            │  │ 10:45      │ admin@hrd   │ Export payroll      │ Jan 2024       │  │
│            │  │ 10:30      │ admin@hrd   │ Publish slip gaji   │ 180 slips      │  │
│            │  │ 10:15      │ john@emp    │ Update bank account │ Changed to BCA │  │
│            │  │ 09:55      │ admin@it    │ Role change         │ User promoted  │  │
│            │  └─────────────────────────────────────────────────────────────────┘  │
│            │                                                                        │
└────────────┴────────────────────────────────────────────────────────────────────────┘
```

### 4.6 Dashboard Super Admin / Tenant Admin (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO] PeopleHub    [Tenant: All ▼]         [🔍 Search...]  [🔔 1] [👤 Super ▼]    │
├────────────┬────────────────────────────────────────────────────────────────────────┤
│            │  Dashboard > Tenant Overview                                           │
│  Dashboard │────────────────────────────────────────────────────────────────────────│
│  ● Tenant  │                                                                        │
│            │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  Tenant    │  │ Total    │  │ Active   │  │ Total    │  │ Storage  │               │
│  > List    │  │ Tenants  │  │ Users    │  │ Branches │  │ Used     │               │
│  > Config  │  │    4     │  │   720    │  │   12     │  │ 45.2 GB  │               │
│  > Branding│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│            │                                                                        │
│  Admin     │  ┌─────────────────────────────────────────────────────────────────┐  │
│  > Users   │  │ Tenant Overview                                                 │  │
│  > Roles   │  ├─────────────────────────────────────────────────────────────────┤  │
│            │  │ Tenant               │ Users │ Branches │ Status  │ Config      │  │
│  Billing   │  ├──────────────────────┼───────┼──────────┼─────────┼─────────────┤  │
│  > Usage   │  │ PT. Kreatifindo      │  250  │    4     │ ●Active │ [⚙]         │  │
│  > Invoice │  │ PT. Violet Global    │  180  │    3     │ ●Active │ [⚙]         │  │
│            │  │ PT. Cyber Multi Artha│  150  │    3     │ ●Active │ [⚙]         │  │
│  System    │  │ PT. Cyber Multi Mandiri│ 140 │    2     │ ●Active │ [⚙]         │  │
│  > Health  │  └─────────────────────────────────────────────────────────────────┘  │
│  > Backup  │                                                                        │
│  > Logs    │  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│            │  │ User Activity (7 Days)          │  │ System Health               │  │
│            │  │                                 │  │                             │  │
│            │  │  ▁▂▃▅▆▇█▇▆▅▃▂▁▂▃▅▆▇█▇▆▅▃▂▁     │  │ API        : ● Healthy      │  │
│            │  │  Daily Active Users             │  │ Database   : ● Healthy      │  │
│            │  │  Peak: 520  Avg: 380            │  │ Storage    : ● Healthy      │  │
│            │  │                                 │  │ Email      : ● Healthy      │  │
│            │  └─────────────────────────────────┘  │ Last Backup: 2h ago         │  │
│            │                                       └─────────────────────────────┘  │
│            │                                                                        │
└────────────┴────────────────────────────────────────────────────────────────────────┘
```

### 4.7 Dashboard Karyawan (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [LOGO] PeopleHub                    [🔍 Search...]  [🔔 2] [👤 John Doe ▼]         │
├────────────┬────────────────────────────────────────────────────────────────────────┤
│            │  Dashboard > Overview                                                  │
│  Dashboard │────────────────────────────────────────────────────────────────────────│
│  ● Overview│                                                                        │
│            │  Selamat datang, John Doe                   Senin, 15 Januari 2024     │
│  Absensi   │  Software Engineer - Engineering                                       │
│  > Riwayat │                                                                        │
│  > Koreksi │  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│            │  │ Status Absen Hari Ini           │  │ Saldo Cuti                  │  │
│  Cuti      │  │                                 │  │                             │  │
│  > Ajukan  │  │  ⏰ 08:45:32 WIB               │  │ Tahunan    : 10 hari        │  │
│  > Riwayat │  │  📍 Kantor Pusat Jakarta       │  │ Sakit      : 5 hari         │  │
│            │  │                                 │  │ Penting    : 2 hari         │  │
│  Perjalanan│  │  ✓ Clock In  : 08:45           │  │                             │  │
│  > Request │  │  ○ Clock Out : -               │  │ [Ajukan Cuti]               │  │
│  > Reimburse│ │                                 │  └─────────────────────────────┘  │
│            │  │  [    📷 CLOCK OUT    ]        │                                    │
│  Slip Gaji │  └─────────────────────────────────┘  ┌─────────────────────────────┐  │
│            │                                       │ Jadwal Shift Minggu Ini     │  │
│  KPI       │  ┌─────────────────────────────────┐  │                             │  │
│  > Target  │  │ Pengajuan Terbaru               │  │ Sen Sel Rab Kam Jum Sab Min │  │
│  > Progres │  │                                 │  │ 08  08  08  08  08  -   -   │  │
│            │  │ Cuti 20-22 Jan                  │  │ 17  17  17  17  17  -   -   │  │
│  Dokumen   │  │ ● Menunggu Atasan               │  │  ●   ○   ○   ○   ○          │  │
│  > Surat   │  │                                 │  │                             │  │
│  > File    │  │ Reimburse Transport             │  └─────────────────────────────┘  │
│            │  │ ✓ Disetujui - Rp 150.000       │                                    │
│  Pengumuman│  │                                 │  ┌─────────────────────────────┐  │
│            │  │ [Lihat Semua Pengajuan]         │  │ KPI Q1 2024                 │  │
│  Bantuan   │  └─────────────────────────────────┘  │                             │  │
│            │                                       │ Progress: 68%               │  │
│            │  ┌─────────────────────────────────┐  │ █████████████░░░░░░░        │  │
│            │  │ Slip Gaji Terbaru               │  │                             │  │
│            │  │                                 │  │ 3/5 target on track         │  │
│            │  │ Januari 2024          🆕       │  │ [Lihat Detail]              │  │
│            │  │ Take Home: Rp 12.500.000        │  └─────────────────────────────┘  │
│            │  │ [📥 Download PDF]               │                                    │
│            │  └─────────────────────────────────┘                                    │
│            │                                                                        │
└────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Absensi

### 4.1 Halaman Absen Selfie (Mobile)

```
┌───────────────────────────┐
│ [←]  Absen          [?]   │
├───────────────────────────┤
│                           │
│  Senin, 15 Januari 2024   │
│         08:45:32          │
│                           │
├───────────────────────────┤
│  ┌───────────────────┐    │
│  │                   │    │
│  │                   │    │
│  │   [Camera View]   │    │
│  │                   │    │
│  │     👤            │    │
│  │   Face Guide      │    │
│  │                   │    │
│  │                   │    │
│  └───────────────────┘    │
│                           │
│  Posisikan wajah dalam    │
│  area yang ditentukan     │
│                           │
├───────────────────────────┤
│  Mode Kerja               │
│  ┌─────────┐ ┌─────────┐  │
│  │   WFO   │ │   WFH   │  │
│  │    ●    │ │    ○    │  │
│  └─────────┘ └─────────┘  │
│                           │
│  📍 Kantor Pusat Jakarta  │
│     -6.2088, 106.8456     │
│                           │
├───────────────────────────┤
│                           │
│  ┌───────────────────────┐│
│  │                       ││
│  │   [  📷 CLOCK IN  ]   ││
│  │                       ││
│  └───────────────────────┘│
│                           │
└───────────────────────────┘
```

### 4.2 Hasil Absen Berhasil

```
┌───────────────────────────┐
│ [←]  Absen                │
├───────────────────────────┤
│                           │
│         ✓                 │
│                           │
│  Absen Berhasil!          │
│                           │
│  ┌───────────────────┐    │
│  │ Clock In          │    │
│  │ 08:45:32 WIB      │    │
│  │                   │    │
│  │ Mode: WFO         │    │
│  │ Lokasi: Kantor    │    │
│  │         Pusat     │    │
│  │                   │    │
│  │ Status: On Time   │    │
│  └───────────────────┘    │
│                           │
│  ┌───────────────────┐    │
│  │   [Foto Selfie]   │    │
│  │                   │    │
│  │      👤           │    │
│  │                   │    │
│  └───────────────────┘    │
│                           │
│  [   Kembali ke Home   ]  │
│                           │
└───────────────────────────┘
```

### 4.3 Rekap Absensi (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > Absensi > Rekap                                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Rekap Absensi                                              [Ekspor ▼] [🖨️ Print]  │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Filter                                                                      │   │
│  │                                                                             │   │
│  │ Periode: [Januari 2024 ▼]  Cabang: [Semua     ▼]  Dept: [Semua        ▼]   │   │
│  │                                                                             │   │
│  │ [🔍 Cari nama/NIK...                                        ] [Terapkan]   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Nama         │ NIK      │ Cabang  │ Hadir │ Terlambat │ Absen │ Cuti │ Aksi │   │
│  ├──────────────┼──────────┼─────────┼───────┼───────────┼───────┼──────┼──────┤   │
│  │ John Doe     │ EMP001   │ Jakarta │  18   │     2     │   1   │  1   │ [→]  │   │
│  │ Jane Smith   │ EMP002   │ Jakarta │  20   │     0     │   0   │  2   │ [→]  │   │
│  │ Bob Wilson   │ EMP003   │ Bandung │  17   │     3     │   2   │  0   │ [→]  │   │
│  │ Alice Brown  │ EMP004   │ Surabaya│  19   │     1     │   1   │  1   │ [→]  │   │
│  │ Charlie Lee  │ EMP005   │ Jakarta │  15   │     5     │   2   │  0   │ [→]  │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │ Showing 1-5 of 180                             [<] [1] [2] [3] ... [36] [>] │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────┐                                        │
│  │ Ringkasan Januari 2024                  │                                        │
│  │                                         │                                        │
│  │ Total Karyawan  : 180                   │                                        │
│  │ Rata-rata Hadir : 92%                   │                                        │
│  │ Terlambat       : 8%                    │                                        │
│  │ Tingkat Absen   : 3%                    │                                        │
│  └─────────────────────────────────────────┘                                        │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Cuti & Izin

### 5.1 Form Pengajuan Cuti (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > Cuti > Ajukan Cuti                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Ajukan Cuti                                                                        │
│                                                                                     │
│  ┌─────────────────────────────────────────┬───────────────────────────────────┐   │
│  │ Informasi Cuti                          │ Saldo Cuti Anda                   │   │
│  │                                         │                                   │   │
│  │ Jenis Cuti *                            │ ┌───────────────────────────────┐ │   │
│  │ [Cuti Tahunan                      ▼]   │ │ Tahunan    : 10 hari          │ │   │
│  │                                         │ │ Sakit      : 5 hari           │ │   │
│  │ Tanggal Mulai *        Tanggal Selesai *│ │ Penting    : 2 hari           │ │   │
│  │ [📅 20/01/2024   ]     [📅 22/01/2024 ] │ │ Melahirkan : 90 hari          │ │   │
│  │                                         │ └───────────────────────────────┘ │   │
│  │ Durasi: 3 hari kerja                    │                                   │   │
│  │                                         │ Setelah pengajuan ini:            │   │
│  │ Alasan *                                │ Tahunan: 10 → 7 hari              │   │
│  │ ┌─────────────────────────────────────┐ │                                   │   │
│  │ │ Liburan keluarga ke Bali           │ │ ┌───────────────────────────────┐ │   │
│  │ │                                     │ │ │ Alur Approval                 │ │   │
│  │ │                                     │ │ │                               │ │   │
│  │ └─────────────────────────────────────┘ │ │ 1. ○ Manager (Budi S.)        │ │   │
│  │                                         │ │ 2. ○ HRD (Admin HRD)          │ │   │
│  │ Lampiran (opsional)                     │ │                               │ │   │
│  │ [📎 Pilih file atau drag & drop     ]   │ └───────────────────────────────┘ │   │
│  │                                         │                                   │   │
│  │ Delegasi Tugas                          │                                   │   │
│  │ [Pilih karyawan...                  ▼]  │                                   │   │
│  │                                         │                                   │   │
│  └─────────────────────────────────────────┴───────────────────────────────────┘   │
│                                                                                     │
│                                              [Batal]  [Ajukan Cuti]                 │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Daftar Pengajuan Cuti (Mobile)

```
┌───────────────────────────┐
│ [←]  Pengajuan Cuti       │
├───────────────────────────┤
│                           │
│  [🔍 Cari...           ]  │
│                           │
│  Filter: [Semua Status ▼] │
│                           │
├───────────────────────────┤
│  ┌───────────────────┐    │
│  │ Cuti Tahunan      │    │
│  │ 20 - 22 Jan 2024  │    │
│  │ 3 hari            │    │
│  │                   │    │
│  │ ● Menunggu Atasan │    │
│  │ Diajukan: 15 Jan  │    │
│  └───────────────────┘    │
│                           │
│  ┌───────────────────┐    │
│  │ Cuti Sakit        │    │
│  │ 10 Jan 2024       │    │
│  │ 1 hari            │    │
│  │                   │    │
│  │ ✓ Disetujui       │    │
│  │ Approved: 10 Jan  │    │
│  └───────────────────┘    │
│                           │
│  ┌───────────────────┐    │
│  │ Cuti Tahunan      │    │
│  │ 25 - 26 Dec 2023  │    │
│  │ 2 hari            │    │
│  │                   │    │
│  │ ✓ Disetujui       │    │
│  │ Approved: 20 Dec  │    │
│  └───────────────────┘    │
│                           │
├───────────────────────────┤
│                           │
│  [    + Ajukan Cuti     ] │
│                           │
└───────────────────────────┘
```

### 5.3 Detail Pengajuan (Approval View)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > Cuti > Detail Pengajuan                                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  [← Kembali]                                                                        │
│                                                                                     │
│  Detail Pengajuan Cuti                              Status: [● Menunggu Approval]   │
│                                                                                     │
│  ┌─────────────────────────────────────────┬───────────────────────────────────┐   │
│  │ Informasi Pemohon                       │ Timeline                          │   │
│  │                                         │                                   │   │
│  │ ┌─────┐ John Doe                        │ ● Diajukan                        │   │
│  │ │ 👤  │ NIK: EMP001                     │   15 Jan 2024, 10:30              │   │
│  │ └─────┘ Dept: Engineering               │   oleh John Doe                   │   │
│  │         Cabang: Jakarta                 │                                   │   │
│  │                                         │ ○ Menunggu Manager                │   │
│  │─────────────────────────────────────────│   Budi Santoso                    │   │
│  │                                         │                                   │   │
│  │ Informasi Cuti                          │ ○ Menunggu HRD                    │   │
│  │                                         │   Admin HRD                       │   │
│  │ Jenis      : Cuti Tahunan               │                                   │   │
│  │ Periode    : 20 - 22 Jan 2024           │ ○ Selesai                         │   │
│  │ Durasi     : 3 hari kerja               │                                   │   │
│  │ Alasan     : Liburan keluarga ke Bali   │                                   │   │
│  │ Delegasi   : Jane Smith                 │                                   │   │
│  │                                         │                                   │   │
│  │ Saldo Sebelum : 10 hari                 │                                   │   │
│  │ Saldo Setelah : 7 hari                  │                                   │   │
│  │                                         │                                   │   │
│  └─────────────────────────────────────────┴───────────────────────────────────┘   │
│                                                                                     │
│  Catatan Approval (opsional)                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│                                              [Tolak]  [Setujui]                     │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Perjalanan Dinas & Reimburse

### 6.1 Form Pengajuan Perjalanan Dinas

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > Perjalanan Dinas > Ajukan                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Ajukan Perjalanan Dinas                                                            │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Informasi Perjalanan                                                        │   │
│  │                                                                             │   │
│  │ Tujuan Perjalanan *                    Kota Tujuan *                        │   │
│  │ [Meeting dengan klien ABC         ]    [Surabaya                       ▼]   │   │
│  │                                                                             │   │
│  │ Tanggal Berangkat *                    Tanggal Kembali *                    │   │
│  │ [📅 25/01/2024        ]                [📅 27/01/2024        ]              │   │
│  │                                                                             │   │
│  │ Transportasi *                                                              │   │
│  │ ○ Pesawat  ○ Kereta  ○ Bus  ○ Mobil Dinas  ○ Kendaraan Pribadi             │   │
│  │                                                                             │   │
│  │ Akomodasi                                                                   │   │
│  │ □ Perlu akomodasi hotel (2 malam)                                           │   │
│  │                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Estimasi Biaya                                                              │   │
│  │                                                                             │   │
│  │ Kategori                              Estimasi           Plafon             │   │
│  │ ├─ Transportasi PP                    Rp 2.000.000       Rp 3.000.000       │   │
│  │ ├─ Akomodasi (2 malam)                Rp 1.000.000       Rp 750.000/malam   │   │
│  │ ├─ Uang Makan (3 hari)                Rp 450.000         Rp 150.000/hari    │   │
│  │ └─ Transport Lokal                    Rp 300.000         Rp 200.000/hari    │   │
│  │ ─────────────────────────────────────────────────────                       │   │
│  │ Total Estimasi                        Rp 3.750.000                          │   │
│  │                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│                                              [Batal]  [Ajukan]                      │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Form Reimburse

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > Reimburse > Ajukan                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Ajukan Reimburse                                                                   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Kategori Biaya *                                                            │   │
│  │ [Transport                                                              ▼]  │   │
│  │                                                                             │   │
│  │ Tanggal Transaksi *                    Jumlah *                             │   │
│  │ [📅 15/01/2024        ]                [Rp 150.000                      ]   │   │
│  │                                                                             │   │
│  │ Deskripsi *                                                                 │   │
│  │ ┌─────────────────────────────────────────────────────────────────────────┐ │   │
│  │ │ Grab ke kantor klien untuk meeting project XYZ                         │ │   │
│  │ │                                                                         │ │   │
│  │ └─────────────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                             │   │
│  │ Bukti Transaksi *                                                           │   │
│  │ ┌─────────────────────────────────────────────────────────────────────────┐ │   │
│  │ │                                                                         │ │   │
│  │ │    📎 Drag & drop file atau klik untuk upload                          │ │   │
│  │ │       Format: JPG, PNG, PDF (max 5MB)                                   │ │   │
│  │ │                                                                         │ │   │
│  │ └─────────────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                             │   │
│  │ ┌─────────────┐                                                             │   │
│  │ │ [preview]   │  receipt.jpg (1.2MB)  [×]                                   │   │
│  │ └─────────────┘                                                             │   │
│  │                                                                             │   │
│  │ Terkait Perjalanan Dinas?                                                   │   │
│  │ [Tidak - Biaya Operasional                                              ▼]  │   │
│  │                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Info: Plafon transport harian Anda: Rp 200.000                                     │
│                                                                                     │
│                                              [Batal]  [Ajukan Reimburse]            │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Slip Gaji

### 7.1 Daftar Slip Gaji (Mobile)

```
┌───────────────────────────┐
│ [←]  Slip Gaji            │
├───────────────────────────┤
│                           │
│  Tahun: [2024          ▼] │
│                           │
├───────────────────────────┤
│  ┌───────────────────┐    │
│  │ Januari 2024  🆕  │    │
│  │                   │    │
│  │ Take Home Pay     │    │
│  │ Rp 12.500.000     │    │
│  │                   │    │
│  │ Status: Published │    │
│  │                   │    │
│  │ [📥 Download PDF] │    │
│  └───────────────────┘    │
│                           │
│  ┌───────────────────┐    │
│  │ Desember 2023     │    │
│  │                   │    │
│  │ Take Home Pay     │    │
│  │ Rp 12.500.000     │    │
│  │                   │    │
│  │ Status: Published │    │
│  │                   │    │
│  │ [📥 Download PDF] │    │
│  └───────────────────┘    │
│                           │
│  ┌───────────────────┐    │
│  │ November 2023     │    │
│  │                   │    │
│  │ Take Home Pay     │    │
│  │ Rp 12.300.000     │    │
│  │                   │    │
│  │ Status: Published │    │
│  │                   │    │
│  │ [📥 Download PDF] │    │
│  └───────────────────┘    │
│                           │
└───────────────────────────┘
```

### 7.2 Detail Slip Gaji

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Slip Gaji > Januari 2024                                           [📥 Download]  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           SLIP GAJI                                         │   │
│  │                                                                             │   │
│  │  PT. KREATIFINDO ABADI SEJAHTERA                                            │   │
│  │  Periode: Januari 2024                                                      │   │
│  │                                                                             │   │
│  │  ─────────────────────────────────────────────────────────────────────────  │   │
│  │                                                                             │   │
│  │  Nama       : John Doe                    NIK    : EMP001                   │   │
│  │  Jabatan    : Software Engineer           Dept   : Engineering              │   │
│  │  Cabang     : Jakarta                     Status : Tetap                    │   │
│  │                                                                             │   │
│  │  ─────────────────────────────────────────────────────────────────────────  │   │
│  │                                                                             │   │
│  │  PENDAPATAN                               POTONGAN                          │   │
│  │                                                                             │   │
│  │  Gaji Pokok      : Rp 10.000.000          BPJS Kesehatan : Rp    100.000   │   │
│  │  Tunjangan Makan : Rp  1.500.000          BPJS TK        : Rp    200.000   │   │
│  │  Tunjangan Transport: Rp 1.000.000        PPh 21         : Rp    500.000   │   │
│  │  Tunjangan Komunikasi: Rp 300.000         Potongan Lain  : Rp          0   │   │
│  │  Lembur (5 jam)  : Rp    500.000                                            │   │
│  │  ─────────────────────────                ─────────────────────────         │   │
│  │  Total Pendapatan: Rp 13.300.000          Total Potongan : Rp    800.000   │   │
│  │                                                                             │   │
│  │  ═════════════════════════════════════════════════════════════════════════  │   │
│  │                                                                             │   │
│  │  TAKE HOME PAY                            Rp 12.500.000                     │   │
│  │                                                                             │   │
│  │  ═════════════════════════════════════════════════════════════════════════  │   │
│  │                                                                             │   │
│  │  Diterbitkan: 25 Januari 2024                                               │   │
│  │                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. KPI

### 8.1 Daftar KPI Karyawan

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > KPI > Target Saya                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Target KPI Saya                                              Periode: Q1 2024      │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Pencapaian Keseluruhan                                                      │   │
│  │                                                                             │   │
│  │ ████████████████████░░░░░░░░░░  68%                                        │   │
│  │                                                                             │   │
│  │ 3 dari 5 target tercapai                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Target                          │ Bobot │ Progress        │ Status │ Aksi   │   │
│  ├─────────────────────────────────┼───────┼─────────────────┼────────┼────────┤   │
│  │ Selesaikan 10 fitur             │  30%  │ █████████░ 9/10 │   90%  │[Update]│   │
│  │ Code review 50 PR               │  20%  │ ████████░░ 42/50│   84%  │[Update]│   │
│  │ Zero critical bugs              │  20%  │ ██████████ 0 bug│  100%  │   ✓    │   │
│  │ Dokumentasi API                 │  15%  │ █████░░░░░ 50%  │   50%  │[Update]│   │
│  │ Training junior (4 sesi)        │  15%  │ ██░░░░░░░░ 1/4  │   25%  │[Update]│   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Deadline: 31 Maret 2024 (75 hari lagi)                                             │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Update Progress KPI

```
┌───────────────────────────────────────────────────┐
│  Update Progress KPI                          [×] │
├───────────────────────────────────────────────────┤
│                                                   │
│  Target: Selesaikan 10 fitur                      │
│  Bobot: 30%                                       │
│                                                   │
│  Progress Saat Ini                                │
│  ████████░░ 9 dari 10 fitur (90%)                │
│                                                   │
│  ─────────────────────────────────────────────    │
│                                                   │
│  Update Progress *                                │
│  [9                                          ]    │
│                                                   │
│  Catatan Update                                   │
│  ┌───────────────────────────────────────────┐   │
│  │ Menyelesaikan fitur export report.        │   │
│  │ Tinggal 1 fitur lagi: dashboard analytics │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  Bukti (opsional)                                 │
│  [📎 Upload file...]                             │
│                                                   │
│                      [Batal]  [Simpan Progress]   │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 9. Notifikasi

### 9.1 Panel Notifikasi

```
┌───────────────────────────────────────┐
│  Notifikasi                       [×] │
├───────────────────────────────────────┤
│  [Semua] [Tugas] [Info] [Peringatan]  │
├───────────────────────────────────────┤
│  Hari Ini                             │
│  ┌─────────────────────────────────┐  │
│  │ 🔔 Pengajuan cuti disetujui     │  │
│  │    Cuti 20-22 Jan telah         │  │
│  │    disetujui oleh Manager       │  │
│  │    10 menit lalu                │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │ 📋 Ada pengajuan perlu review   │  │
│  │    3 pengajuan cuti menunggu    │  │
│  │    approval Anda                │  │
│  │    1 jam lalu                   │  │
│  └─────────────────────────────────┘  │
│                                       │
│  Kemarin                              │
│  ┌─────────────────────────────────┐  │
│  │ 💰 Slip gaji tersedia           │  │
│  │    Slip gaji Januari 2024       │  │
│  │    sudah dapat diunduh          │  │
│  │    Kemarin, 15:30               │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │ ⚠️ Reminder: Absen belum lengkap│  │
│  │    Anda belum clock out hari    │  │
│  │    Senin, 13 Januari            │  │
│  │    Kemarin, 09:00               │  │
│  └─────────────────────────────────┘  │
│                                       │
│  [    Lihat Semua Notifikasi      ]   │
└───────────────────────────────────────┘
```

---

## 10. Pengaturan Admin

### 10.1 Data Master Karyawan

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Admin > Karyawan > Data                                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Data Karyawan                                          [📥 Import] [+ Tambah]      │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ [🔍 Cari nama/NIK/email...                                               ]  │   │
│  │                                                                             │   │
│  │ Cabang: [Semua      ▼]  Dept: [Semua      ▼]  Status: [Aktif         ▼]    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ □ │ NIK     │ Nama         │ Email           │ Cabang  │ Dept    │ Status│Aksi│ │
│  ├───┼─────────┼──────────────┼─────────────────┼─────────┼─────────┼───────┼────┤ │
│  │ □ │ EMP001  │ John Doe     │ john@mail.com   │ Jakarta │ Eng     │ Aktif │[⋮] │ │
│  │ □ │ EMP002  │ Jane Smith   │ jane@mail.com   │ Jakarta │ HR      │ Aktif │[⋮] │ │
│  │ □ │ EMP003  │ Bob Wilson   │ bob@mail.com    │ Bandung │ Sales   │ Aktif │[⋮] │ │
│  │ □ │ EMP004  │ Alice Brown  │ alice@mail.com  │ Surabaya│ Finance │ Aktif │[⋮] │ │
│  │ □ │ EMP005  │ Charlie Lee  │ charlie@mail.com│ Jakarta │ Eng     │Pending│[⋮] │ │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │ Showing 1-5 of 180                              [<] [1] [2] [3] ... [36] [>]│   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Selected: 0  │  [Bulk Edit]  [Deactivate]  [Export]                                │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Form Tambah/Edit Karyawan

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Admin > Karyawan > Tambah Karyawan                                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Tambah Karyawan Baru                                                               │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Informasi Akun                                                              │   │
│  │                                                                             │   │
│  │ Email *                                NIK *                                │   │
│  │ [john.doe@company.com            ]     [EMP006                         ]    │   │
│  │                                                                             │   │
│  │ Password *                             Konfirmasi Password *                │   │
│  │ [••••••••••                      ]     [••••••••••                     ]    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Informasi Pribadi                                                           │   │
│  │                                                                             │   │
│  │ Nama Lengkap *                         No. KTP                              │   │
│  │ [John Doe                         ]    [3201234567890001             ]      │   │
│  │                                                                             │   │
│  │ Tempat Lahir                           Tanggal Lahir                        │   │
│  │ [Jakarta                          ]    [📅 15/05/1990               ]       │   │
│  │                                                                             │   │
│  │ Jenis Kelamin *                        Status Pernikahan                    │   │
│  │ ○ Laki-laki  ○ Perempuan               [Belum Menikah               ▼]      │   │
│  │                                                                             │   │
│  │ Alamat                                                                      │   │
│  │ [Jl. Sudirman No. 123, Jakarta Pusat                                   ]    │   │
│  │                                                                             │   │
│  │ No. Telepon                            No. HP *                             │   │
│  │ [021-5551234                      ]    [081234567890                  ]     │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Informasi Pekerjaan                                                         │   │
│  │                                                                             │   │
│  │ Cabang *                               Departemen *                         │   │
│  │ [Jakarta                          ▼]   [Engineering                    ▼]   │   │
│  │                                                                             │   │
│  │ Jabatan *                              Atasan Langsung                      │   │
│  │ [Software Engineer                ▼]   [Budi Santoso                   ▼]   │   │
│  │                                                                             │   │
│  │ Tanggal Bergabung *                    Status Kepegawaian *                 │   │
│  │ [📅 01/01/2024                   ]     [Kontrak                        ▼]   │   │
│  │                                                                             │   │
│  │ Shift Default                                                               │   │
│  │ [Reguler (08:00 - 17:00)          ▼]                                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Informasi Bank & Pajak                                                      │   │
│  │                                                                             │   │
│  │ Nama Bank                              No. Rekening                         │   │
│  │ [BCA                              ▼]   [1234567890                    ]     │   │
│  │                                                                             │   │
│  │ Nama Pemilik Rekening                  NPWP                                 │   │
│  │ [John Doe                         ]    [12.345.678.9-012.000         ]      │   │
│  │                                                                             │   │
│  │ No. BPJS Kesehatan                     No. BPJS Ketenagakerjaan             │   │
│  │ [0001234567890                    ]    [12345678901                   ]     │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│                                              [Batal]  [Simpan Karyawan]             │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Responsive Behavior

### 11.1 Breakpoint Adaptations

| Component | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|-----------|-----------------|---------------------|-------------------|
| Sidebar | Hidden (hamburger) | Collapsed (icons) | Expanded |
| Dashboard cards | 1 column, stacked | 2 columns | 4 columns |
| Data table | Card view | Horizontal scroll | Full table |
| Form | Single column | Single column | Two columns |
| Modal | Full screen | Centered (80%) | Centered (fixed width) |
| Navigation | Bottom tabs | Sidebar collapsed | Sidebar expanded |

### 11.2 Mobile Navigation Pattern

```
┌───────────────────────────┐
│ [≡]  Page Title   [🔔][👤]│  ← Top bar (hamburger, title, actions)
├───────────────────────────┤
│                           │
│      Main Content         │  ← Scrollable content
│                           │
├───────────────────────────┤
│ [🏠] [📋] [📄] [💰] [👤]  │  ← Bottom navigation (5 main items)
│ Home Absen Cuti  Gaji  Me │
└───────────────────────────┘
```

---

## 12. Loading & Empty States

### 12.1 Skeleton Loading

```
┌─────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░│  ← Title skeleton
│                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│ │░░░░░░░░░│ │░░░░░░░░░│ │░░░░░░░░░│     │  ← Card skeletons
│ │░░░░░░░░░│ │░░░░░░░░░│ │░░░░░░░░░│     │
│ └─────────┘ └─────────┘ └─────────┘     │
│                                         │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ← Table skeleton
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────┘
```

### 12.2 Empty State

```
┌─────────────────────────────────────────┐
│                                         │
│              [Illustration]             │
│                 📋                       │
│                                         │
│        Belum ada data pengajuan         │
│                                         │
│   Mulai dengan membuat pengajuan        │
│   pertama Anda                          │
│                                         │
│         [+ Buat Pengajuan]              │
│                                         │
└─────────────────────────────────────────┘
```

---

## 13. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial wireframes |

---

## 14. Notes for Developers

1. **Gunakan komponen dari Design System** - Semua elemen UI harus menggunakan komponen yang didefinisikan di [27-ui-design-system.md](27-ui-design-system.md)

2. **Perhatikan spacing** - Gunakan token spacing yang konsisten (4px grid system)

3. **Mobile-first** - Implementasikan mobile layout terlebih dahulu, kemudian enhance untuk desktop

4. **Accessibility** - Pastikan semua interactive elements memiliki focus states dan aria labels

5. **Loading states** - Selalu implementasikan skeleton loading untuk data fetching

6. **Error handling** - Tampilkan error states yang informatif dengan opsi retry
