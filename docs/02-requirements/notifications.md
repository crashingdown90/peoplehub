# Notifikasi & Eskalasi PeopleHub

## Ruang Lingkup
Panduan notifikasi untuk: absensi (termasuk keterlambatan) dan semua pengajuan (cuti/izin, koreksi absensi, perjalanan dinas/reimburse/biaya, pinjaman, surat, perubahan data bank).

## Aktor Penerima
- Atasan/Manager: approval tahap awal.
- HRD: approval final dan kebijakan.
- Finance: approval/pembayaran biaya.
- Karyawan: hasil pengajuan dan riwayat.

## Kanal
- In-app: default untuk semua peran.
- Email: real time atau rekap harian.
- Opsional: Slack/Teams jika diaktifkan.

## Konten Minimum
- Absensi: nama, cabang/departemen, waktu stempel otomatis, mode (WFO/WFH), status (tepat waktu/terlambat), menit terlambat (jika ada), tautan detail/rekap.
- Pengajuan: jenis, nama, cabang/departemen, ringkasan (tanggal cuti, kategori biaya+jumlah, tanggal perjalanan, jenis surat, data bank baru), status (`pending/approved/rejected`), tautan approval/detail.

## Trigger
- Absensi: clock in/out sukses; keterlambatan melewati threshold; lonjakan keterlambatan per cabang/tim (opsional).
- Pengajuan: dibuat (`pending`), berubah status (`approved/rejected`), atau menunggu lama melewati SLA.

## Preferensi & Filter
- Real time vs rekap harian dapat dipilih per role.
- Filter per cabang/departemen/tipe karyawan; Finance hanya untuk biaya/pembayaran; Atasan hanya tim-nya.
- Threshold keterlambatan dan SLA pengingat dapat dikonfigurasi.

## Transisi & Eskalasi
- `pending` → `approved/rejected`: karyawan dapat notifikasi hasil; approver berikutnya (jika ada) menerima tugas.
- Travel/Reimburse/Pinjaman: setelah HRD/atasan approve, Finance mendapat notifikasi final untuk pembayaran.
- Perubahan bank: HRD → Finance sebelum payroll.
- Lonjakan keterlambatan: kirim alert ke HRD untuk cabang/tim terkait.

## Audit
- Log pengiriman (waktu, penerima, kanal, status).
- Simpan preferensi notifikasi per user (mode, cakupan).
- Hormati `tenant_id`: tidak ada notifikasi lintas perusahaan.
