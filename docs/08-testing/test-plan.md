# Rencana Uji Fungsi PeopleHub

## Tujuan
Memastikan fitur utama PeopleHub berfungsi sesuai kebutuhan (user story/epic), aman, dan sesuai RBAC per role.

## Ruang Lingkup
- Registrasi & Login
- Absensi & Koreksi & Shift
- Cuti/Izin
- Perjalanan Dinas & Reimburse & Pinjaman
- Payroll (Slip Gaji)
- KPI
- Surat & Dokumen
- Pengumuman & Pelanggaran
- Notifikasi & Preferensi
- Admin & Tenant
- FAQ/Peraturan & Help

## Peran untuk Uji
- Karyawan, Atasan/Manager, HRD, Finance, IT/Ops, Super Admin/Tenant Admin.

## Skenario Utama
### Registrasi & Login
- Karyawan daftar (tenant benar) → status pending → HRD approve → karyawan bisa login.
- Email unik per tenant; password valid; form wajib/opsional sesuai spesifikasi; tolak jika tenant salah.
- Login gagal/sukses; reset password; redirect sesuai role.

### Absensi & Koreksi
- Clock in/out (WFO/WFH) dengan selfie wajib; timestamp server tercatat; data lokasi/device tersimpan.
- Absen ditolak tanpa foto; absen diterima dengan foto valid.
- Koreksi absensi: karyawan ajukan + bukti → Atasan approve → HRD final → data attendance diperbarui.
- Rekap absensi harian/bulanan/tahunan sesuai filter tenant/cabang.

### Shift Swap
- Karyawan ajukan tukar/cover shift → partner setuju → Atasan approve → jadwal ter-update.
- Tolak jika partner tidak setuju atau bukan dalam tim/shift valid.

### Cuti/Izin
- Ajukan cuti dengan saldo cukup; approval Atasan → HRD; saldo terpotong.
- Tolak jika saldo kurang; blok tanggal jika bentrok libur bersama (jatah libur).
- Batalkan sebelum diproses; histori status tercatat.

### Perjalanan Dinas, Reimburse, Pinjaman
- Ajukan perjalanan + bukti; approval Atasan → HRD → Finance (pembayaran).
- Ajukan reimburse/biaya operasional: validasi plafon, kategori, bukti wajib; approval berlapis; tandai dibayar.
- Ajukan pinjaman: alur approval sesuai kebijakan; status outstanding termonitor.

### Payroll (Slip Gaji)
- Finance/HRD generate slip batch (periode) → karyawan bisa unduh PDF; akses dibatasi ke pemilik/role berwenang.
- Ekspor payroll multi-format berisi data sesuai periode; audit publish tercatat.

### KPI
- HRD buat periode KPI dan target numerik; Atasan pantau progres; karyawan update progres.
- Kunci hasil; setelah dikunci tidak dapat diedit oleh karyawan.

### Surat & Dokumen
- Karyawan ajukan surat kategori (SKK, tugas, perubahan data, pinjaman) → Atasan (jika perlu) → HRD terbitkan PDF.
- Dokumen resmi (kontrak, NDA, BPJS/NPWP) hanya bisa diakses oleh pemilik/role berwenang; versi tercatat.

### Pengumuman & Pelanggaran
- HRD/Atasan publikasikan pengumuman per cabang/role; karyawan bisa baca dan tandai.
- HRD kirim notifikasi pelanggaran (jenis + konsekuensi); karyawan terima email + in-app; histori tercatat.

### Notifikasi & Preferensi
- Absensi: HRD/Atasan dapat notifikasi absen/terlambat sesuai threshold.
- Pengajuan: Atasan/HRD/Finance dapat notifikasi `pending`; karyawan dapat hasil `approved/rejected`.
- Preferensi: real-time vs rekap harian; filter cabang/departemen berfungsi; audit log pengiriman.

### Admin & Tenant
- HRD kelola data master (karyawan, cabang, departemen, jadwal/shift, jatah libur, lembur).
- Finance kelola COA, komponen gaji, kalender payroll, pinjaman outstanding.
- Super Admin/Tenant Admin kelola tenant/branding/domain; isolasi data antar tenant terjaga (tidak bisa lintas query).
- IT/Ops kelola SSO/2FA, geofence/IP/device policy; audit log perubahan role/permission.

### FAQ/Peraturan/Help
- FAQ dapat dicari/filtrasi; Peraturan versi + acknowledge tercatat per karyawan.
- Halaman bantuan menautkan ke tiket; kontak/eskalasi tampil sesuai tenant.

## Negatif & Edge Case
- Registrasi tenant salah; email duplikat; password lemah; form kosong wajib.
- Absen tanpa kamera/izin lokasi; absen di luar geofence (jika aktif).
- Cuti saldo nol; overlap dengan jatah libur; tanggal invalid.
- Reimburse tanpa bukti; plafon terlewati; kategori tidak dikenal.
- Slip gaji diakses oleh user yang tidak berhak; URL tanpa tanda tangan.
- Notifikasi tidak dikirim jika preferensi off; SLA reminder tidak memicu bila sudah di-approve.

## Data & RBAC
- Semua uji memastikan filter `tenant_id`; peran hanya melihat data sesuai scope cabang/departemen/role.
- Audit log tercatat untuk aksi sensitif (publish slip, ubah bank, ekspor data, perubahan role).

## Kriteria Penerimaan Umum
- Setiap flow utama dapat diselesaikan end-to-end tanpa bypass role.
- Validasi bisnis dipenuhi (saldo cuti, jatah libur, plafon biaya, foto selfie wajib, approval berurut).
- Notifikasi terkirim sesuai preferensi; status tercatat; audit log ada.
- Waktu respon halaman utama sesuai target (dashboard <3s, absen P95 <1.5s).
