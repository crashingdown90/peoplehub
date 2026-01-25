# Daftar Halaman PeopleHub

## Overview

Dokumen ini berisi daftar lengkap semua halaman dalam aplikasi PeopleHub, terorganisir berdasarkan modul dan role akses.

---

## 1. Halaman Publik (Unauthenticated)

| No | Halaman | Path | Deskripsi |
|----|---------|------|-----------|
| 1.1 | Login | `/login` | Form login dengan email & password |
| 1.2 | Registrasi | `/register` | Form registrasi karyawan baru (pilih tenant) |
| 1.3 | Lupa Password | `/forgot-password` | Request reset password via email |
| 1.4 | Reset Password | `/reset-password/:token` | Set password baru dengan token |
| 1.5 | Verifikasi Email | `/verify-email/:token` | Konfirmasi email setelah registrasi |

---

## 2. Dashboard

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 2.1 | Dashboard Karyawan | `/dashboard` | Karyawan | Tombol absen, saldo cuti, pengajuan terbaru, slip terbaru |
| 2.2 | Dashboard Manager | `/dashboard` | Manager | Ringkasan tim, antrean approval, KPI tim |
| 2.3 | Dashboard HRD | `/dashboard` | HRD | Rekap absensi, pengajuan pending, heatmap kehadiran |
| 2.4 | Dashboard Finance | `/dashboard` | Finance | Status payroll, reimburse pending, pinjaman outstanding |
| 2.5 | Dashboard IT/Ops | `/dashboard` | IT/Ops | System health, audit log, security alerts |
| 2.6 | Dashboard Super Admin | `/dashboard` | Super Admin | Tenant overview, system health, user activity |

---

## 3. Profil & Pengaturan User

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 3.1 | Profil Saya | `/profile` | All | Lihat & edit data pribadi, foto |
| 3.2 | Keamanan Akun | `/profile/security` | All | Ganti password, SSO/2FA settings |
| 3.3 | Preferensi Notifikasi | `/profile/notifications` | All | Atur preferensi notifikasi (real-time/rekap) |
| 3.4 | Dokumen Saya | `/profile/documents` | All | Lihat dokumen pribadi (KTP, NPWP, BPJS) |

---

## 4. Absensi

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 4.1 | Absen (Clock In/Out) | `/attendance/clock` | Karyawan | Form absen dengan selfie + pilih WFO/WFH |
| 4.2 | Riwayat Absensi Saya | `/attendance/history` | Karyawan | Daftar absensi pribadi |
| 4.3 | Detail Absensi | `/attendance/history/:id` | Karyawan | Detail per hari (clock in/out, foto) |
| 4.4 | Rekap Absensi Tim | `/attendance/team` | Manager | Rekap absensi tim/bawahan |
| 4.5 | Rekap Absensi (All) | `/admin/attendance` | HRD | Rekap absensi semua karyawan + filter |
| 4.6 | Koreksi Absensi | `/attendance/correction` | Karyawan | Daftar & form pengajuan koreksi |
| 4.7 | Detail Koreksi | `/attendance/correction/:id` | All | Detail pengajuan koreksi |
| 4.8 | Approval Koreksi | `/admin/attendance/corrections` | Manager, HRD | Antrean approval koreksi absensi |

---

## 5. Shift & Jadwal

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 5.1 | Jadwal Shift Saya | `/shift/my-schedule` | Karyawan | Kalender shift pribadi |
| 5.2 | Tukar Shift | `/shift/swap` | Karyawan | Form pengajuan tukar shift |
| 5.3 | Daftar Tukar Shift | `/shift/swap/history` | Karyawan | Riwayat pengajuan tukar shift |
| 5.4 | Jadwal Shift Tim | `/shift/team` | Manager | Kalender shift tim |
| 5.5 | Kelola Jadwal Shift | `/admin/shift` | HRD | CRUD jadwal shift per cabang/dept |
| 5.6 | Approval Tukar Shift | `/admin/shift/swap` | Manager, HRD | Antrean approval tukar shift |

---

## 6. Cuti & Izin

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 6.1 | Saldo Cuti | `/leave/balance` | Karyawan | Lihat saldo cuti per jenis |
| 6.2 | Ajukan Cuti | `/leave/request` | Karyawan | Form pengajuan cuti/izin |
| 6.3 | Riwayat Cuti | `/leave/history` | Karyawan | Daftar pengajuan cuti |
| 6.4 | Detail Cuti | `/leave/:id` | All | Detail pengajuan cuti |
| 6.5 | Approval Cuti | `/admin/leave` | Manager, HRD | Antrean approval cuti |
| 6.6 | Saldo Cuti (All) | `/admin/leave/balance` | HRD | Rekap saldo cuti semua karyawan |
| 6.7 | Kelola Jenis Cuti | `/admin/leave/types` | HRD | CRUD jenis cuti & kuota |

---

## 7. Perjalanan Dinas & Reimburse

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 7.1 | Ajukan Perjalanan | `/travel/request` | Karyawan | Form pengajuan perjalanan dinas |
| 7.2 | Daftar Perjalanan | `/travel/history` | Karyawan | Riwayat pengajuan perjalanan |
| 7.3 | Detail Perjalanan | `/travel/:id` | All | Detail pengajuan perjalanan |
| 7.4 | Ajukan Reimburse | `/reimburse/request` | Karyawan | Form pengajuan reimburse + upload bukti |
| 7.5 | Daftar Reimburse | `/reimburse/history` | Karyawan | Riwayat pengajuan reimburse |
| 7.6 | Detail Reimburse | `/reimburse/:id` | All | Detail pengajuan reimburse |
| 7.7 | Approval Perjalanan | `/admin/travel` | Manager, HRD, Finance | Antrean approval perjalanan |
| 7.8 | Approval Reimburse | `/admin/reimburse` | Manager, HRD, Finance | Antrean approval reimburse |
| 7.9 | Pembayaran Reimburse | `/admin/reimburse/payment` | Finance | Proses pembayaran reimburse |

---

## 8. Pinjaman

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 8.1 | Ajukan Pinjaman | `/loan/request` | Karyawan | Form pengajuan pinjaman |
| 8.2 | Daftar Pinjaman | `/loan/history` | Karyawan | Riwayat pinjaman & status cicilan |
| 8.3 | Detail Pinjaman | `/loan/:id` | All | Detail pinjaman & jadwal cicilan |
| 8.4 | Approval Pinjaman | `/admin/loan` | HRD, Finance | Antrean approval pinjaman |
| 8.5 | Kelola Pinjaman | `/admin/loan/manage` | Finance | Daftar pinjaman aktif & outstanding |

---

## 9. Payroll / Slip Gaji

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 9.1 | Slip Gaji Saya | `/payslip` | Karyawan | Daftar slip gaji per periode |
| 9.2 | Detail Slip Gaji | `/payslip/:id` | Karyawan | Detail slip + download PDF |
| 9.3 | Generate Slip Gaji | `/admin/payroll/generate` | HRD, Finance | Generate slip batch per periode |
| 9.4 | Publish Slip Gaji | `/admin/payroll/publish` | HRD, Finance | Publish slip ke karyawan |
| 9.5 | Riwayat Payroll | `/admin/payroll/history` | HRD, Finance | Riwayat generate/publish per periode |
| 9.6 | Komponen Gaji | `/admin/payroll/components` | Finance | CRUD komponen gaji (tunjangan, potongan) |
| 9.7 | Mapping COA | `/admin/payroll/coa` | Finance | Mapping akun untuk ekspor |
| 9.8 | Ekspor Payroll | `/admin/payroll/export` | Finance | Ekspor data payroll (CSV/Excel) |

---

## 10. KPI / Kinerja

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 10.1 | Target KPI Saya | `/kpi/my-targets` | Karyawan | Daftar target & progres KPI |
| 10.2 | Update Progres | `/kpi/my-targets/:id/update` | Karyawan | Form update progres KPI |
| 10.3 | KPI Tim | `/kpi/team` | Manager | Monitoring KPI tim/bawahan |
| 10.4 | Kelola Periode KPI | `/admin/kpi/periods` | HRD | CRUD periode penilaian KPI |
| 10.5 | Kelola Target KPI | `/admin/kpi/targets` | HRD | Assign target ke karyawan |
| 10.6 | Rekap KPI | `/admin/kpi/report` | HRD, Manager | Report pencapaian KPI |

---

## 11. Dokumen & Surat

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 11.1 | Ajukan Surat | `/document/request` | Karyawan | Form pengajuan surat (SKK, tugas, dll) |
| 11.2 | Daftar Pengajuan Surat | `/document/history` | Karyawan | Riwayat pengajuan surat |
| 11.3 | Detail Surat | `/document/:id` | All | Detail surat + download jika approved |
| 11.4 | Dokumen Resmi | `/document/official` | Karyawan | Lihat dokumen resmi (kontrak, NDA) |
| 11.5 | Approval Surat | `/admin/document` | HRD | Antrean approval surat |
| 11.6 | Terbitkan Surat | `/admin/document/:id/issue` | HRD | Generate & terbitkan surat resmi |
| 11.7 | Template Surat | `/admin/document/templates` | HRD | Kelola template surat |

---

## 12. Pengumuman

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 12.1 | Daftar Pengumuman | `/announcement` | All | List pengumuman + status baca |
| 12.2 | Detail Pengumuman | `/announcement/:id` | All | Detail pengumuman |
| 12.3 | Buat Pengumuman | `/admin/announcement/create` | HRD, Manager | Form buat pengumuman baru |
| 12.4 | Kelola Pengumuman | `/admin/announcement` | HRD, Manager | CRUD pengumuman |

---

## 13. Pelanggaran & Sanksi

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 13.1 | Notifikasi Pelanggaran | `/violation` | Karyawan | Daftar pelanggaran & sanksi yang diterima |
| 13.2 | Detail Pelanggaran | `/violation/:id` | Karyawan | Detail pelanggaran |
| 13.3 | Kelola Pelanggaran | `/admin/violation` | HRD | CRUD notifikasi pelanggaran |
| 13.4 | Kirim Pelanggaran | `/admin/violation/create` | HRD | Form kirim notifikasi pelanggaran |

---

## 14. Notifikasi

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 14.1 | Pusat Notifikasi | `/notifications` | All | Semua notifikasi (in-app) |
| 14.2 | Detail Notifikasi | `/notifications/:id` | All | Detail & link ke item terkait |

---

## 15. Bantuan & Tiket

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 15.1 | Buat Tiket | `/help/ticket/create` | All | Form buat tiket bantuan HR/IT |
| 15.2 | Daftar Tiket Saya | `/help/ticket` | All | Riwayat tiket yang diajukan |
| 15.3 | Detail Tiket | `/help/ticket/:id` | All | Detail tiket + timeline komentar |
| 15.4 | Kelola Tiket | `/admin/ticket` | HRD, IT/Ops | Antrean tiket + assign |
| 15.5 | FAQ | `/help/faq` | All | Daftar FAQ dengan pencarian |
| 15.6 | Kelola FAQ | `/admin/faq` | HRD, IT/Ops | CRUD FAQ |

---

## 16. Aset Karyawan

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 16.1 | Aset Dipinjam | `/asset/my-assets` | Karyawan | Daftar aset yang sedang dipinjam |
| 16.2 | Detail Aset | `/asset/:id` | Karyawan | Detail aset + status pengembalian |
| 16.3 | Ajukan Perpanjangan | `/asset/:id/extend` | Karyawan | Form perpanjangan pinjaman aset |
| 16.4 | Kelola Aset | `/admin/asset` | HRD, IT/Ops | CRUD aset perusahaan |
| 16.5 | Pinjaman Aset | `/admin/asset/loans` | HRD, IT/Ops | Daftar pinjaman aset aktif |

---

## 17. Admin: Data Master

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 17.1 | Data Karyawan | `/admin/employee` | HRD | Daftar karyawan + filter |
| 17.2 | Detail Karyawan | `/admin/employee/:id` | HRD | Detail lengkap data karyawan |
| 17.3 | Tambah Karyawan | `/admin/employee/create` | HRD | Form tambah karyawan baru |
| 17.4 | Edit Karyawan | `/admin/employee/:id/edit` | HRD | Form edit data karyawan |
| 17.5 | Import Karyawan | `/admin/employee/import` | HRD | Bulk import via CSV/Excel |
| 17.6 | Registrasi Pending | `/admin/employee/pending` | HRD | Approval registrasi karyawan baru |

---

## 18. Admin: Organisasi

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 18.1 | Struktur Organisasi | `/admin/organization` | HRD | Org chart / tree view |
| 18.2 | Cabang | `/admin/organization/branch` | HRD | CRUD cabang/lokasi |
| 18.3 | Departemen | `/admin/organization/department` | HRD | CRUD departemen |
| 18.4 | Jabatan | `/admin/organization/position` | HRD | CRUD jabatan |
| 18.5 | Level/Grade | `/admin/organization/level` | HRD | CRUD level jabatan |

---

## 19. Admin: Kebijakan

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 19.1 | Kebijakan Absensi | `/admin/policy/attendance` | HRD | Atur toleransi, denda keterlambatan |
| 19.2 | Kebijakan Cuti | `/admin/policy/leave` | HRD | Atur jenis cuti, kuota, carry forward |
| 19.3 | Kebijakan Reimburse | `/admin/policy/reimburse` | Finance | Atur plafon per kategori |
| 19.4 | Kalender Libur | `/admin/policy/holiday` | HRD | CRUD hari libur nasional/cuti bersama |
| 19.5 | Approval Flow | `/admin/policy/approval` | HRD | Atur approval chain per jenis pengajuan |
| 19.6 | Delegasi Approver | `/admin/policy/delegation` | HRD | Set delegasi jika approver tidak ada |

---

## 20. Admin: Keamanan (IT/Ops)

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 20.1 | User Management | `/admin/security/users` | IT/Ops | Kelola user login (reset password, lock) |
| 20.2 | Role & Permission | `/admin/security/roles` | IT/Ops | CRUD roles & permissions |
| 20.3 | Audit Log | `/admin/security/audit` | IT/Ops | Log aktivitas sensitif |
| 20.4 | SSO Configuration | `/admin/security/sso` | IT/Ops | Setup SSO Google/Microsoft |
| 20.5 | 2FA Settings | `/admin/security/2fa` | IT/Ops | Enable/disable 2FA |
| 20.6 | Geofence | `/admin/security/geofence` | IT/Ops | Atur lokasi valid untuk absen |
| 20.7 | IP Whitelist | `/admin/security/ip` | IT/Ops | Atur IP yang diizinkan |
| 20.8 | Device Policy | `/admin/security/device` | IT/Ops | Atur kebijakan device |
| 20.9 | API Keys | `/admin/security/api-keys` | IT/Ops | Kelola API keys untuk integrasi |
| 20.10 | Webhook | `/admin/security/webhook` | IT/Ops | Setup webhook untuk event |

---

## 21. Admin: Tenant (Super Admin)

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 21.1 | Daftar Tenant | `/superadmin/tenant` | Super Admin | List semua tenant |
| 21.2 | Detail Tenant | `/superadmin/tenant/:id` | Super Admin | Detail & statistik tenant |
| 21.3 | Konfigurasi Tenant | `/superadmin/tenant/:id/config` | Super Admin | Edit konfigurasi tenant |
| 21.4 | Branding | `/superadmin/tenant/:id/branding` | Super Admin | Logo, warna, domain |
| 21.5 | Admin Tenant | `/superadmin/tenant/:id/admins` | Super Admin | Assign admin per tenant |
| 21.6 | Billing | `/superadmin/billing` | Super Admin | Usage & invoice (jika ada) |
| 21.7 | System Health | `/superadmin/system` | Super Admin | Monitoring sistem |
| 21.8 | Backup Management | `/superadmin/backup` | Super Admin | Status backup & restore |

---

## 22. Halaman Informasi

| No | Halaman | Path | Role | Deskripsi |
|----|---------|------|------|-----------|
| 22.1 | Peraturan Perusahaan | `/info/policy` | All | Peraturan perusahaan + acknowledge |
| 22.2 | Privacy Policy | `/info/privacy` | All | Kebijakan privasi |
| 22.3 | Terms of Use | `/info/terms` | All | Syarat & ketentuan |
| 22.4 | Kontak & Eskalasi | `/info/contact` | All | Daftar kontak HR/IT/Finance |
| 22.5 | Tentang | `/info/about` | All | Tentang aplikasi + versi |

---

## Ringkasan per Role

### Karyawan
- Dashboard Karyawan
- Absen (clock in/out, riwayat, koreksi)
- Cuti (ajukan, riwayat, saldo)
- Perjalanan & Reimburse
- Slip Gaji
- KPI
- Dokumen & Surat
- Profil & Pengaturan

### Manager / Atasan
- Semua akses Karyawan
- Dashboard Tim
- Approval (cuti, koreksi, tukar shift, travel)
- Monitoring KPI tim
- Buat pengumuman tim

### HRD
- Semua akses Manager
- Dashboard HRD
- Data master karyawan & organisasi
- Kebijakan (absensi, cuti, approval flow)
- Generate & publish slip gaji
- Kelola dokumen & surat
- Kelola FAQ & tiket

### Finance
- Dashboard Finance
- Approval reimburse & pinjaman
- Generate payroll
- Komponen gaji & COA
- Ekspor payroll

### IT/Ops
- Dashboard IT/Ops
- User management
- Role & permission
- Audit log
- Keamanan (SSO, 2FA, geofence, IP, device)
- API keys & webhook
- Kelola tiket IT

### Super Admin
- Semua akses
- Konfigurasi tenant
- Branding per tenant
- System health
- Backup management

---

## Route Naming Convention

```
/[module]                    - List/Index
/[module]/create             - Create form
/[module]/:id                - Detail view
/[module]/:id/edit           - Edit form
/[module]/:id/[action]       - Specific action

/admin/[module]              - Admin version of module
/superadmin/[module]         - Super admin only
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2024-01 | Reorganized with complete path & role mapping |
| 1.0.0 | 2024-01 | Initial page list |
