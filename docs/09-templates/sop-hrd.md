# SOP HRD - PeopleHub

> **Versi:** 1.0 | **Tanggal:** 22 Januari 2026 | **Status:** Final

---

## Pendahuluan

Dokumen ini adalah **Standard Operating Procedure (SOP)** untuk HRD Admin dalam menggunakan sistem PeopleHub. SOP ini mencakup prosedur standar untuk tugas-tugas HR sehari-hari.

---

## Daftar Isi

1. [Login dan Navigasi](#1-login-dan-navigasi)
2. [Approval Registrasi Karyawan Baru](#2-approval-registrasi-karyawan-baru)
3. [Manajemen Data Karyawan](#3-manajemen-data-karyawan)
4. [Approval Cuti](#4-approval-cuti)
5. [Monitoring Kehadiran](#5-monitoring-kehadiran)
6. [Koreksi Absensi](#6-koreksi-absensi)
7. [Pengelolaan Slip Gaji](#7-pengelolaan-slip-gaji)
8. [Penerbitan Surat](#8-penerbitan-surat)
9. [Laporan dan Ekspor Data](#9-laporan-dan-ekspor-data)

---

## 1. Login dan Navigasi

### 1.1 Login ke Sistem

**Langkah-langkah:**
1. Buka browser, akses URL: `https://peoplehub.kreatifindo.com`
2. Masukkan email dan password
3. Klik tombol **Login**
4. Sistem akan mengarahkan ke Dashboard HRD

**Catatan:**
- Jika lupa password, klik "Lupa Password?" dan ikuti instruksi email
- Setelah 5x salah password, akun akan terkunci selama 30 menit
- Gunakan browser Chrome/Edge versi terbaru untuk performa optimal

### 1.2 Navigasi Dashboard

| Menu | Fungsi |
|------|--------|
| **Dashboard** | Overview statistik harian |
| **Karyawan** | Kelola data karyawan |
| **Kehadiran** | Monitor absensi |
| **Cuti** | Kelola pengajuan cuti |
| **Dokumen** | Kelola dokumen karyawan |
| **Laporan** | Generate laporan |
| **Pengaturan** | Konfigurasi sistem |

---

## 2. Approval Registrasi Karyawan Baru

### 2.1 Melihat Daftar Registrasi Pending

**Langkah-langkah:**
1. Klik menu **Karyawan** → **Registrasi Pending**
2. Sistem menampilkan daftar calon karyawan yang mendaftar
3. Status registrasi: `Pending`, `Approved`, `Rejected`

### 2.2 Approve Registrasi

**Langkah-langkah:**
1. Klik nama calon karyawan untuk melihat detail
2. Periksa data yang diisi:
   - Nama lengkap
   - Email
   - Nomor telepon
   - NIK (jika diisi)
3. Lengkapi data organisasi:

   | Field | Instruksi |
   |-------|-----------|
   | **Cabang** | Pilih cabang penempatan |
   | **Departemen** | Pilih departemen |
   | **Jabatan** | Pilih jabatan |
   | **Atasan Langsung** | Pilih manager dari dropdown |
   | **Nomor Karyawan** | Auto-generate atau isi manual (format: EMP-YYYY-XXXXX) |
   | **Tipe Karyawan** | Tetap / Kontrak / Freelance |
   | **Mode Kerja** | WFO / WFH / Hybrid |
   | **Tanggal Mulai** | Pilih tanggal efektif |

4. Klik tombol **Approve**
5. Sistem akan:
   - Membuat record Employee
   - Mengirim email notifikasi ke karyawan
   - Mencatat di audit log

### 2.3 Reject Registrasi

**Langkah-langkah:**
1. Klik nama calon karyawan
2. Klik tombol **Reject**
3. Isi alasan penolakan (wajib)
4. Klik **Konfirmasi Tolak**
5. Email notifikasi akan dikirim ke calon karyawan

### 2.4 Checklist Verifikasi Data

- [ ] Nama sesuai dengan KTP
- [ ] Email valid dan aktif
- [ ] Nomor telepon dapat dihubungi
- [ ] NIK valid (16 digit)
- [ ] Bukan duplikat dari karyawan existing

---

## 3. Manajemen Data Karyawan

### 3.1 Melihat Daftar Karyawan

**Langkah-langkah:**
1. Klik menu **Karyawan** → **Daftar Karyawan**
2. Gunakan filter untuk mencari:
   - Cabang
   - Departemen
   - Status (Aktif/Non-Aktif)
3. Gunakan search box untuk cari berdasarkan nama/NIK/email

### 3.2 Edit Data Karyawan

**Langkah-langkah:**
1. Klik nama karyawan dari daftar
2. Klik tombol **Edit**
3. Ubah data yang diperlukan
4. Klik **Simpan**

**Data yang Dapat Diedit:**
| Kategori | Field |
|----------|-------|
| Personal | Nama, Alamat, Kontak Darurat |
| Organisasi | Cabang, Departemen, Jabatan, Atasan |
| Kontrak | Tipe Karyawan, Tanggal Mulai/Berakhir |
| Bank | Nama Bank, Nomor Rekening |

### 3.3 Non-Aktifkan Karyawan (Resign/PHK)

**Langkah-langkah:**
1. Buka profil karyawan yang resign
2. Klik tombol **Non-Aktifkan**
3. Pilih alasan:
   - Resign
   - PHK
   - Pensiun
   - Meninggal
4. Isi tanggal efektif
5. Klik **Konfirmasi**

**Dampak:**
- Karyawan tidak dapat login
- Akses ke sistem diblokir
- Data tetap tersimpan untuk report

---

## 4. Approval Cuti

### 4.1 Melihat Cuti Pending

**Langkah-langkah:**
1. Klik menu **Cuti** → **Pending Approval**
2. Filter berdasarkan:
   - Sudah approve manager (menunggu HRD)
   - Belum approve manager

### 4.2 Approve Cuti (Final Approval)

**Langkah-langkah:**
1. Klik pengajuan cuti untuk melihat detail
2. Periksa informasi:
   - Jenis cuti
   - Tanggal mulai - selesai
   - Jumlah hari
   - Saldo tersisa
   - Approval manager
   - Lampiran (jika ada)
3. Klik **Approve**
4. Sistem akan:
   - Update status menjadi `Approved`
   - Potong saldo cuti otomatis
   - Kirim notifikasi ke karyawan

### 4.3 Reject Cuti

**Langkah-langkah:**
1. Klik pengajuan cuti
2. Klik **Reject**
3. Isi alasan penolakan (wajib)
4. Klik **Konfirmasi**

### 4.4 Override Approval (Bypass Manager)

> ⚠️ **Gunakan hanya jika manager tidak tersedia!**

**Langkah-langkah:**
1. Buka pengajuan cuti yang masih `Pending`
2. Klik **Override Approval**
3. Isi alasan override (wajib)
4. Klik **Approve Langsung**

**Catatan:** Semua override tercatat di audit log.

### 4.5 Koreksi Saldo Cuti

**Langkah-langkah:**
1. Buka profil karyawan
2. Klik tab **Saldo Cuti**
3. Klik **Koreksi Saldo**
4. Pilih jenis cuti
5. Masukkan jumlah koreksi (+/-)
6. Isi alasan (wajib)
7. Klik **Simpan**

---

## 5. Monitoring Kehadiran

### 5.1 Dashboard Kehadiran Harian

**Langkah-langkah:**
1. Klik menu **Kehadiran** → **Hari Ini**
2. Lihat statistik:
   - Total karyawan
   - Hadir
   - Terlambat
   - Tidak hadir
   - Cuti

### 5.2 Rekap Kehadiran Bulanan

**Langkah-langkah:**
1. Klik menu **Kehadiran** → **Rekap Bulanan**
2. Pilih bulan dan tahun
3. Filter per cabang/departemen
4. Lihat summary per karyawan

### 5.3 Deteksi Keterlambatan

**Langkah-langkah:**
1. Buka **Kehadiran** → **Laporan Keterlambatan**
2. Filter periode
3. Lihat daftar karyawan yang terlambat:
   - Nama
   - Tanggal
   - Jam masuk
   - Menit terlambat
   - Denda (jika ada)

---

## 6. Koreksi Absensi

### 6.1 Approve Koreksi Absensi

**Langkah-langkah:**
1. Klik menu **Kehadiran** → **Koreksi Pending**
2. Klik pengajuan koreksi
3. Periksa:
   - Data absensi asli
   - Data koreksi yang diminta
   - Alasan
   - Bukti (jika ada)
4. Klik **Approve** atau **Reject**

### 6.2 Koreksi Manual oleh HRD

> Digunakan jika karyawan tidak dapat mengajukan sendiri.

**Langkah-langkah:**
1. Buka profil karyawan
2. Klik tab **Kehadiran**
3. Cari tanggal yang ingin dikoreksi
4. Klik **Edit**
5. Ubah jam masuk/keluar
6. Isi alasan
7. Klik **Simpan**

---

## 7. Pengelolaan Slip Gaji

### 7.1 Generate Slip Gaji

**Langkah-langkah:**
1. Klik menu **Slip Gaji** → **Generate**
2. Pilih periode (bulan/tahun)
3. Pilih scope:
   - Semua karyawan
   - Per cabang
   - Per departemen
   - Pilih manual
4. Klik **Generate Preview**
5. Periksa komponen gaji:
   - Gaji pokok
   - Tunjangan
   - Lembur
   - Potongan
   - Denda keterlambatan
6. Klik **Publish**

### 7.2 Publish Slip Gaji

**Sebelum Publish, pastikan:**
- [ ] Komponen gaji sudah benar
- [ ] Potongan sudah dihitung
- [ ] Denda keterlambatan sudah dimasukkan
- [ ] Lembur sudah diverifikasi

**Langkah-langkah:**
1. Klik **Publish Batch**
2. Konfirmasi publikasi
3. Sistem akan:
   - Generate PDF per karyawan
   - Kirim email notifikasi
   - Mencatat di audit log

---

## 8. Penerbitan Surat

### 8.1 Approve Pengajuan Surat

**Langkah-langkah:**
1. Klik menu **Dokumen** → **Pengajuan Surat**
2. Klik pengajuan surat
3. Periksa jenis dan keperluan
4. Klik **Approve**
5. Sistem generate surat dengan nomor otomatis

### 8.2 Terbitkan Surat Manual

**Langkah-langkah:**
1. Klik **Dokumen** → **Buat Surat Baru**
2. Pilih jenis surat:
   - Keterangan Kerja
   - Referensi
   - SPPD
   - dll.
3. Pilih karyawan
4. Isi data tambahan (jika ada)
5. Klik **Generate**
6. Preview PDF
7. Klik **Terbitkan**

---

## 9. Laporan dan Ekspor Data

### 9.1 Ekspor Kehadiran untuk Payroll

**Langkah-langkah:**
1. Klik menu **Laporan** → **Ekspor Kehadiran**
2. Pilih periode
3. Pilih format: CSV / Excel
4. Klik **Download**

**Kolom yang Dihasilkan:**
| Kolom | Deskripsi |
|-------|-----------|
| NIK | Nomor Induk Karyawan |
| Nama | Nama lengkap |
| Hadir | Jumlah hari hadir |
| Terlambat | Jumlah hari terlambat |
| Menit Terlambat | Total menit |
| Lembur | Total jam lembur |
| Cuti | Jumlah hari cuti |
| Tidak Hadir | Jumlah hari alpha |

### 9.2 Laporan Cuti

**Langkah-langkah:**
1. Klik **Laporan** → **Rekap Cuti**
2. Pilih periode
3. Filter per jenis cuti (opsional)
4. Klik **Generate**

### 9.3 Laporan Audit

**Langkah-langkah:**
1. Klik **Laporan** → **Audit Log**
2. Filter:
   - Periode
   - Jenis aksi
   - User
3. Klik **Lihat** atau **Ekspor**

---

## Troubleshooting

### Masalah Umum

| Masalah | Solusi |
|---------|--------|
| Tidak bisa login | Cek caps lock, reset password jika lupa |
| Data tidak muncul | Refresh browser, cek filter aktif |
| PDF tidak terdownload | Cek popup blocker, coba browser lain |
| Error saat approve | Refresh halaman, coba lagi |

### Kontak Support

| Jenis | Kontak |
|-------|--------|
| Bug/Error Sistem | IT Team via Ticket |
| Pertanyaan Fitur | PM/BA Team |
| Akses/Permission | IT Admin |

---

## Dokumen Terkait

| Dokumen | Link |
|---------|------|
| Approval Matrix | [approval-matrix.md](../02-requirements/approval-matrix.md) |
| User Guide (Umum) | [user-guide.md](../05-frontend/user-guide.md) |
| Email Templates | [email.md](email.md) |
