# Halaman Wajib PeopleHub

## FAQ
- Konten: tanya-jawab singkat tentang login, registrasi/approval, absen (selfie/WFO/WFH), cuti/izin, reimburse, slip gaji, perubahan bank, keamanan akun.
- Fitur: pencarian cepat, kategori per topik (Absensi, Cuti, Payroll, Keamanan), status diperbarui terakhir, tautan ke form pengajuan jika butuh tindakan.
- Admin: HRD/IT dapat menambah/mengubah entri; versi/timestamp per entri.

## Peraturan Perusahaan
- Konten: peraturan umum, tata tertib, jam kerja, kebijakan absensi/cuti, denda keterlambatan, kode etik, kebijakan perangkat/WFH, kebijakan data & privasi.
- Fitur: versi dokumen, tanggal berlaku, tanda “dibaca/dipahami” oleh karyawan, notifikasi jika ada pembaruan.
- Akses: dapat difilter per tenant/cabang; hanya HRD/Super Admin yang mengubah; karyawan hanya baca + acknowledge.

## Kebijakan & Ketentuan
- Privacy Policy & Terms of Use: tampilkan sesuai tenant; wajib dibaca saat registrasi; simpan riwayat persetujuan.
- Kebijakan keamanan: panduan password, SSO/2FA (jika ada), larangan berbagi akun.

## Bantuan/Support
- Konten: cara membuat tiket HR/IT, SLA kategori, kontak darurat.
- Fitur: tombol langsung ke form tiket, status riwayat tiket, FAQ singkat.

## Pengumuman (arsip)
- Arsip pengumuman dengan filter cabang/departemen/role; status terbaca; tanggal publikasi; lampiran jika ada.

## Kontak & Escalation
- Daftar kontak HR, Finance, IT per cabang/tenant; jam layanan; alur eskalasi masalah kritikal (payroll, akses terkunci).

## Implementasi Teknis (ringkas)
- Struktur halaman: navigasi dari sidebar/topbar, breadcrumb untuk subhalaman.
- Versi dokumen: simpan metadata (versi, tanggal berlaku, pembuat, changelog ringkas).
- Acknowledge: simpan status “dibaca” per karyawan (waktu, versi dokumen).
- Pencarian: index judul + isi ringkas untuk FAQ/Peraturan/Kebijakan.
- Perizinan: RBAC – hanya peran tertentu yang mengedit (HRD/Super Admin/IT), karyawan baca + acknowledge. Data terikat `tenant_id`.
