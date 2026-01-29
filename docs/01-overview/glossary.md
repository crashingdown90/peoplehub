# Glossary - Daftar Istilah PeopleHub

> **Versi:** 2.0 | **Tanggal Update:** 22 Januari 2026 | **Status:** Final

## Tujuan
Dokumen ini berisi daftar istilah dan definisi yang digunakan dalam sistem PeopleHub untuk memastikan pemahaman yang konsisten di seluruh tim.

---

## A

### Approval Flow
Alur persetujuan bertingkat untuk pengajuan tertentu. Contoh: Karyawan → Atasan → HRD → Finance.

### Attendance
Catatan kehadiran karyawan yang mencakup waktu masuk (clock in), waktu keluar (clock out), mode kerja (WFO/WFH), dan status (hadir/terlambat/tidak hadir).

### Attendance Correction
Pengajuan koreksi data absensi oleh karyawan dengan bukti pendukung, memerlukan persetujuan atasan dan HRD.

### Audit Log
Catatan sistematis dari semua aktivitas sensitif dalam sistem untuk keperluan keamanan dan kepatuhan.

### Audit Trail
Jejak lengkap perubahan data yang mencatat siapa, kapan, dan apa yang diubah.

---

## B

### BFF (Backend for Frontend)
Pola arsitektur di mana Next.js API Routes bertindak sebagai perantara antara frontend dan layanan backend.

### Branch
Cabang atau lokasi fisik perusahaan dalam struktur organisasi.

### Bulk Action
Tindakan massal yang dilakukan sekaligus untuk banyak data, seperti approve massal atau publish slip gaji batch.

---

## C

### Cash Advance
Uang muka yang diberikan kepada karyawan sebelum perjalanan dinas, akan di-settle setelah perjalanan selesai.

### Clock In / Clock Out
Proses pencatatan waktu masuk dan keluar kerja oleh karyawan.

### COA (Chart of Accounts)
Kode akun untuk mapping biaya ke sistem akuntansi/payroll.

### Correction Request
Lihat: Attendance Correction

---

## D

### Dashboard
Halaman utama yang menampilkan ringkasan data dan metrik sesuai role pengguna.

### Delegation
Pelimpahan wewenang approval kepada orang lain untuk periode tertentu (misalnya saat cuti).

### Department
Unit organisasi dalam struktur perusahaan, berada di bawah Branch.

### Deduction
Potongan gaji yang dapat berupa potongan tetap (BPJS, pajak) atau variabel (denda keterlambatan).

---

## E

### Employee
Entitas karyawan yang sudah disetujui HRD dan memiliki data lengkap (cabang, departemen, jabatan, atasan).

### Employment Type
Tipe kepegawaian: `permanent` (tetap), `contract` (kontrak), `freelance` (lepas).

### Expense
Pengeluaran yang diajukan karyawan untuk reimbursement, biasanya terkait perjalanan dinas.

### Expense Category
Kategori pengeluaran seperti tiket, hotel, transport, makan, dengan plafon masing-masing.

---

## F

### Final Approver
Pihak yang memberikan persetujuan terakhir dalam alur approval.

### Freelance
Tipe karyawan lepas/paruh waktu dengan kontrak berbasis proyek.

---

## G

### Geofence
Batas geografis virtual yang menentukan area yang diizinkan untuk melakukan absensi WFO.

### Geofence Radius
Jarak dalam meter dari titik koordinat kantor yang masih dianggap valid untuk absensi.

### Grace Period
Toleransi waktu (dalam menit) sebelum karyawan dianggap terlambat.

---

## H

### HRD (Human Resources Department)
Role yang mengelola data karyawan, kebijakan, persetujuan, dan administrasi HR.

### Holiday
Hari libur yang ditetapkan per tenant/cabang (libur nasional atau libur perusahaan).

### Hybrid
Mode kerja kombinasi WFO dan WFH sesuai jadwal atau kesepakatan.

---

## I

### In-App Notification
Notifikasi yang ditampilkan di dalam aplikasi PeopleHub.

---

## J

### JWT (JSON Web Token)
Token terenkripsi untuk autentikasi pengguna, disimpan dalam HTTP-only cookie.

---

## K

### KPI (Key Performance Indicator)
Indikator kinerja numerik yang ditetapkan untuk karyawan dalam periode tertentu.

### KPI Cycle
Periode penilaian KPI dengan tanggal mulai dan selesai.

---

## L

### Late Deduction
Potongan gaji akibat keterlambatan, dihitung berdasarkan aturan per cabang/tipe karyawan.

### Late Minutes
Jumlah menit keterlambatan dari jadwal clock in.

### Leave Balance
Saldo cuti yang tersedia untuk karyawan per jenis cuti.

### Leave Request
Pengajuan cuti/izin oleh karyawan dengan jenis, tanggal, dan alasan.

### Leave Type
Jenis cuti seperti: Cuti Tahunan, Sakit, Khusus (melahirkan, menikah, dll).

### Letter Request
Pengajuan surat resmi oleh karyawan (SKK, surat tugas, dll).

---

## M

### Manager
Atasan langsung yang bertanggung jawab atas approval dan monitoring tim.

### Multi-Level Approval
Alur persetujuan yang melewati lebih dari satu approver secara berurutan.

### Multi-Tenant
Arsitektur yang mendukung banyak perusahaan/tenant dalam satu sistem dengan isolasi data.

---

## N

### NIK (Nomor Induk Kependudukan)
Nomor identitas pada KTP Indonesia (16 digit).

### NPWP
Nomor Pokok Wajib Pajak untuk keperluan perpajakan.

### Net Salary
Gaji bersih setelah dikurangi semua potongan.

---

## O

### Overtime
Jam kerja melebihi jadwal normal yang dapat dihitung sebagai lembur.

### Override
Tindakan HRD untuk menyetujui/menolak pengajuan dengan melewati alur normal (dengan alasan tercatat).

---

## P

### Payroll
Proses penghitungan dan pembayaran gaji karyawan.

### Payslip
Slip gaji yang berisi rincian komponen gaji, potongan, dan gaji bersih.

### Pending
Status awal pengajuan yang menunggu persetujuan.

### Permission
Hak akses spesifik untuk melakukan aksi tertentu dalam sistem.

### Plafon
Batas maksimum biaya yang dapat di-reimburse per kategori.

### Position
Jabatan karyawan dalam struktur organisasi.

### PWA (Progressive Web App)
Aplikasi web yang dapat diinstal dan digunakan seperti aplikasi native dengan dukungan offline.

---

## R

### Rate Limiting
Pembatasan jumlah request per waktu untuk mencegah abuse.

### RBAC (Role-Based Access Control)
Sistem kontrol akses berdasarkan role pengguna.

### Reimbursement
Penggantian biaya yang sudah dikeluarkan karyawan dengan bukti pendukung.

### Role
Peran pengguna yang menentukan hak akses: `employee`, `manager`, `hrd`, `finance`, `it_ops`, `super_admin`.

---

## S

### Schedule
Jadwal kerja karyawan yang mencakup shift dan hari kerja.

### Selfie
Foto wajah yang diambil saat clock in/out untuk verifikasi kehadiran.

### Shift
Pembagian waktu kerja dengan jam mulai dan selesai tertentu.

### Shift Swap
Pertukaran jadwal shift antara dua karyawan dengan persetujuan.

### Signed URL
URL dengan tanda tangan kriptografis yang memberikan akses sementara ke file privat.

### SLA (Service Level Agreement)
Batas waktu yang disepakati untuk menyelesaikan suatu proses (misal: approval dalam 24 jam).

### Soft Delete
Penghapusan data dengan menandai `deleted_at` tanpa benar-benar menghapus dari database.

### SSO (Single Sign-On)
Autentikasi terpusat menggunakan provider eksternal (Google/Microsoft).

### Status
Kondisi terkini dari suatu entitas atau pengajuan.

### Super Admin
Role tertinggi yang dapat mengelola semua tenant dan konfigurasi sistem.

---

## T

### Tenant
Perusahaan/organisasi dalam sistem multi-tenant. PeopleHub mendukung 4 tenant:
1. PT. KREATIFINDO ABADI SEJAHTERA
2. PT. VIOLET GLOBAL INDONESIA
3. PT. CYBER MULTI ARTHA
4. PT. CYBER MULTI MANDIRI

### Tenant Admin
Administrator untuk satu tenant spesifik.

### Tenant Isolation
Pemisahan data antar tenant sehingga tidak bisa diakses lintas perusahaan.

### Ticket
Tiket bantuan yang diajukan karyawan ke HR atau IT.

### TLS (Transport Layer Security)
Protokol enkripsi untuk komunikasi aman (HTTPS).

### Travel Request
Pengajuan perjalanan dinas dengan tujuan, tanggal, dan estimasi biaya.

---

## U

### UAT (User Acceptance Testing)
Pengujian oleh pengguna akhir untuk memvalidasi sistem sesuai kebutuhan.

### User
Akun pengguna yang dapat login ke sistem, terhubung dengan entitas Employee setelah disetujui.

---

## V

### Violation Notice
Notifikasi pelanggaran yang dikirim HRD kepada karyawan dengan jenis pelanggaran dan konsekuensi.

---

## W

### Webhook
Notifikasi otomatis ke sistem eksternal saat event tertentu terjadi.

### WFH (Work From Home)
Mode kerja dari rumah/remote.

### WFO (Work From Office)
Mode kerja dari kantor/onsite.

### Work Mode
Mode kerja karyawan: `wfo`, `wfh`, atau `hybrid`.

---

## Status Enum Reference

### User Status
| Value | Deskripsi |
|-------|-----------|
| `pending` | Menunggu approval HRD |
| `approved` | Disetujui, dapat login |
| `rejected` | Ditolak |
| `suspended` | Ditangguhkan sementara |

### Employee Status
| Value | Deskripsi |
|-------|-----------|
| `active` | Aktif bekerja |
| `inactive` | Tidak aktif (cuti panjang, dll) |
| `terminated` | Sudah keluar/resign |

### Attendance Status
| Value | Deskripsi |
|-------|-----------|
| `present` | Hadir tepat waktu |
| `late` | Hadir terlambat |
| `absent` | Tidak hadir tanpa keterangan |
| `leave` | Cuti/izin |
| `holiday` | Hari libur |

### Approval Status (Generic)
| Value | Deskripsi |
|-------|-----------|
| `pending` | Menunggu persetujuan |
| `approved_manager` | Disetujui atasan, menunggu HRD |
| `approved_hrd` | Disetujui HRD, menunggu Finance (jika ada) |
| `approved` | Disetujui final |
| `rejected` | Ditolak |
| `cancelled` | Dibatalkan oleh pengaju |

### Payslip Status
| Value | Deskripsi |
|-------|-----------|
| `draft` | Dalam proses pembuatan |
| `published` | Sudah dipublikasi ke karyawan |

### KPI Cycle Status
| Value | Deskripsi |
|-------|-----------|
| `draft` | Belum dimulai |
| `active` | Sedang berjalan |
| `closed` | Sudah ditutup/selesai |

---

## Dokumen Terkait
- [concept.md](concept.md) - Konsep produk
- [roles-permissions.md](../02-requirements/roles-permissions.md) - Detail role dan permission
- [erd.md](../03-architecture/erd.md) - Struktur database
