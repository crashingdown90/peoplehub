# Flow Registrasi hingga Approval Karyawan

## Ringkasan
Alur pendaftaran karyawan lewat website dengan status pending, verifikasi oleh HRD, dan aktivasi akun. Mendukung multi-tenant: data tidak boleh lintas perusahaan.

## Aktor
- Karyawan (prospektif pengguna)
- HRD (approver)
- Sistem (notifikasi email + in-app)

## Langkah Utama
1) Karyawan membuka halaman registrasi pada tenant/perusahaan yang benar.
2) Karyawan mengisi form registrasi dan mengirimkan.
3) Sistem menyimpan user dengan status `pending` dan membuat permintaan approval ke HRD.
4) HRD meninjau data, melengkapi atribut organisasi (cabang/departemen/jabatan/atasan), lalu approve atau reject.
5) Jika approve: akun diaktifkan, Employee record dikaitkan, notifikasi dikirim (email + in-app). Jika reject: status menjadi `rejected` dan alasan disimpan, notifikasi dikirim.

## Form Registrasi (minimum)
- Data akun: nama lengkap, email, nomor ponsel, password, konfirmasi password.
- Data pekerjaan (opsional/diisi HRD): cabang, departemen, jabatan, atasan langsung, tipe karyawan (tetap/kontrak/freelance), pola kerja (WFO/WFH/hybrid), tanggal mulai bekerja.
- Data identitas (opsional unggah): NIK/KTP, NPWP, BPJS, alamat domisili, kontak darurat.
- Data bank: nama bank, nomor rekening, nama pemilik, cabang pembuka rekening (perubahan butuh approval HRD/Finance).
- Persetujuan: ceklis kebijakan privasi/ketentuan penggunaan.

## Status & Transisi
- `pending` (baru daftar) → `approved` (oleh HRD) → aktif bisa login.
- `pending` → `rejected` (oleh HRD) → tidak bisa login; bisa daftar ulang jika diizinkan.

## Validasi
- Email unik per tenant; password kuat; nomor ponsel format valid.
- Cek tenant sebelum simpan; tidak boleh lintas tenant.
- Wajib persetujuan kebijakan privasi.

## Notifikasi
- Submit: (opsional) email penerimaan permintaan.
- Approval: email + in-app berisi konfirmasi aktivasi dan link login.
- Rejection: email + in-app berisi alasan penolakan.

## Audit & Keamanan
- Log semua aksi: submit registrasi, approve/reject HRD, perubahan data bank.
- Jangan simpan password plaintext; hash (bcrypt/argon).
- Batasi percobaan registrasi/spam (rate limit/CAPTCHA jika diperlukan).
- Pastikan akses hanya ke tenant yang sesuai; HRD hanya melihat permintaan di tenant-nya.
