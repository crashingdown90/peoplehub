# Epic dan User Story PeopleHub (dengan Acceptance Criteria)

## EP01 - Registrasi & Aktivasi Akun

### US01.1 - Registrasi Karyawan
**Sebagai** Karyawan baru, **saya dapat** mendaftar dengan email/telepon, password, dan data dasar **agar** akun tercatat dengan status pending.

**Acceptance Criteria:**
- [ ] Form registrasi menampilkan field: nama lengkap, email, nomor ponsel, password, konfirmasi password
- [ ] Email harus valid dan unique per tenant
- [ ] Nomor ponsel harus format Indonesia (+62/08)
- [ ] Password minimal 8 karakter, mengandung: 1 huruf besar, 1 angka, 1 karakter khusus
- [ ] Checkbox persetujuan kebijakan privasi wajib dicentang
- [ ] Setelah submit, status akun menjadi `pending`
- [ ] Sistem menampilkan pesan konfirmasi "Registrasi berhasil, tunggu persetujuan HRD"
- [ ] Tidak dapat login sebelum status `approved`

### US01.2 - Approval Registrasi oleh HRD
**Sebagai** HRD, **saya dapat** meninjau dan menyetujui/menolak registrasi **agar** hanya akun valid yang aktif.

**Acceptance Criteria:**
- [ ] HRD dapat melihat daftar registrasi pending
- [ ] HRD dapat melihat detail data registrasi
- [ ] HRD wajib melengkapi: cabang, departemen, jabatan, atasan langsung, nomor karyawan
- [ ] HRD dapat memilih employment_type (tetap/kontrak/freelance)
- [ ] HRD dapat memilih work_mode (WFO/WFH/hybrid)
- [ ] Tombol "Approve" mengaktifkan akun dan membuat record Employee
- [ ] Tombol "Reject" mengubah status menjadi `rejected` dengan alasan wajib diisi
- [ ] Aksi dicatat di audit log

### US01.3 - Notifikasi Status Registrasi
**Sebagai** Karyawan, **saya dapat** menerima notifikasi approval/penolakan **agar** tahu status akun.

**Acceptance Criteria:**
- [ ] Email dikirim saat status berubah ke `approved` atau `rejected`
- [ ] Email approval berisi: link login, nama lengkap, cabang/departemen/jabatan
- [ ] Email rejection berisi: alasan penolakan
- [ ] Notifikasi in-app juga tersimpan

---

## EP02 - Absensi, Shift, dan Koreksi

### US02.1 - Clock In dengan Selfie
**Sebagai** Karyawan, **saya dapat** clock in dengan foto selfie dan pilihan WFO/WFH **agar** kehadiran tercatat.

**Acceptance Criteria:**
- [ ] Tombol "Clock In" hanya muncul jika belum clock in hari ini
- [ ] Wajib memilih mode: WFO atau WFH
- [ ] Kamera device wajib diaktifkan (bukan upload dari galeri)
- [ ] Foto selfie wajib diambil sebelum submit
- [ ] Sistem mencatat: timestamp server (bukan client), device info, lokasi GPS (jika enabled)
- [ ] Jika terlambat, sistem menghitung menit keterlambatan dan denda (jika berlaku)
- [ ] Jika geofence aktif dan lokasi di luar radius, tampilkan peringatan/blokir
- [ ] Setelah sukses, tampilkan konfirmasi dengan waktu clock in
- [ ] Notifikasi dikirim ke atasan jika terlambat (configurable)

### US02.2 - Clock Out dengan Selfie
**Sebagai** Karyawan, **saya dapat** clock out dengan foto selfie **agar** waktu pulang tercatat.

**Acceptance Criteria:**
- [ ] Tombol "Clock Out" hanya muncul jika sudah clock in dan belum clock out
- [ ] Foto selfie wajib diambil
- [ ] Sistem mencatat: timestamp server, device info, lokasi GPS
- [ ] Sistem menghitung: total jam kerja, lembur (jika melebihi jam kerja)
- [ ] Setelah sukses, tampilkan ringkasan: jam masuk, jam keluar, total jam kerja

### US02.3 - Koreksi Absensi
**Sebagai** Karyawan, **saya dapat** mengajukan koreksi absensi dengan bukti **agar** data kehadiran akurat.

**Acceptance Criteria:**
- [ ] Dapat mengajukan koreksi untuk tanggal tertentu (max 7 hari ke belakang)
- [ ] Form berisi: tanggal, jam masuk yang benar, jam keluar yang benar, alasan
- [ ] Upload bukti (opsional tapi recommended): foto/PDF
- [ ] Setelah submit, status menjadi `pending`
- [ ] Tidak dapat mengajukan koreksi baru jika ada yang masih pending untuk tanggal sama
- [ ] Karyawan dapat melihat status dan riwayat koreksi

### US02.4 - Approval Koreksi Absensi
**Sebagai** Atasan/HRD, **saya dapat** menyetujui/menolak koreksi absensi **agar** kepatuhan terjaga.

**Acceptance Criteria:**
- [ ] Atasan menerima notifikasi ada koreksi pending dari bawahan
- [ ] Atasan dapat melihat detail: data absensi asli vs data koreksi, alasan, bukti
- [ ] Atasan dapat approve atau reject dengan komentar
- [ ] Setelah atasan approve, lanjut ke HRD (jika multi-level enabled)
- [ ] Setelah final approve, record Attendance di-update
- [ ] Karyawan menerima notifikasi hasil
- [ ] Semua aksi dicatat di audit log

### US02.5 - Tukar/Cover Shift
**Sebagai** Karyawan, **saya dapat** mengajukan tukar shift dengan rekan **agar** jadwal fleksibel.

**Acceptance Criteria:**
- [ ] Dapat memilih rekan kerja dari daftar (cabang/departemen sama)
- [ ] Dapat memilih tanggal shift yang ingin ditukar
- [ ] Alasan wajib diisi
- [ ] Setelah submit, partner menerima notifikasi untuk setuju/tolak
- [ ] Setelah partner setuju, lanjut ke approval atasan
- [ ] Setelah approve, jadwal kedua karyawan di-update
- [ ] Jika salah satu pihak menolak, request dibatalkan

---

## EP03 - Cuti & Izin

### US03.1 - Pengajuan Cuti
**Sebagai** Karyawan, **saya dapat** mengajukan cuti/izin dengan saldo dan histori terlihat **agar** proses transparan.

**Acceptance Criteria:**
- [ ] Dapat melihat saldo cuti per jenis sebelum mengajukan
- [ ] Dapat memilih jenis cuti: Tahunan, Sakit, Khusus (melahirkan, menikah, dll)
- [ ] Dapat memilih tanggal mulai dan selesai
- [ ] Sistem menghitung jumlah hari (exclude weekend dan hari libur)
- [ ] Jika saldo tidak cukup, tampilkan error dan blokir submit
- [ ] Untuk cuti sakit, upload bukti (surat dokter) wajib jika > 1 hari
- [ ] Dapat memilih delegasi tugas ke rekan (opsional)
- [ ] Alasan wajib diisi
- [ ] Setelah submit, status menjadi `pending`
- [ ] Menampilkan preview: saldo sekarang → saldo setelah approve

### US03.2 - Approval Cuti oleh Atasan
**Sebagai** Atasan, **saya dapat** menyetujui/menolak pengajuan cuti bawahan **agar** ketersediaan tim terjaga.

**Acceptance Criteria:**
- [ ] Menerima notifikasi ada cuti pending dari bawahan
- [ ] Dapat melihat: jenis cuti, tanggal, alasan, saldo tersisa, bukti (jika ada)
- [ ] Dapat melihat kalender tim (siapa lagi yang cuti di tanggal tersebut)
- [ ] Dapat approve atau reject dengan komentar opsional
- [ ] Reject wajib isi alasan
- [ ] Setelah approve, lanjut ke HRD (jika multi-level)
- [ ] Karyawan menerima notifikasi hasil

### US03.3 - Final Approval dan Override oleh HRD
**Sebagai** HRD, **saya dapat** approval final/override dan mengatur kuota cuti **agar** kebijakan konsisten.

**Acceptance Criteria:**
- [ ] Dapat melihat semua pengajuan cuti yang sudah di-approve atasan
- [ ] Dapat final approve atau reject
- [ ] Dapat override (approve langsung tanpa atasan) jika diperlukan dengan alasan
- [ ] Setelah final approve, saldo cuti terpotong otomatis
- [ ] Dapat mengatur kuota cuti per jenis per karyawan/kelompok
- [ ] Dapat melakukan koreksi saldo (dengan alasan, tercatat audit)

---

## EP04 - Perjalanan Dinas, Reimburse, dan Pinjaman

### US04.1 - Pengajuan Perjalanan Dinas
**Sebagai** Karyawan, **saya dapat** mengajukan perjalanan dinas **agar** tercatat dan mendapat approval.

**Acceptance Criteria:**
- [ ] Form berisi: tujuan, tanggal berangkat-pulang, tujuan/keperluan, estimasi biaya
- [ ] Dapat melihat plafon biaya per kategori (tiket, hotel, transport, uang harian)
- [ ] Alasan/keperluan wajib diisi
- [ ] Setelah submit, status menjadi `pending`
- [ ] Approval flow: Atasan → HRD → Finance

### US04.2 - Pengajuan Reimburse
**Sebagai** Karyawan, **saya dapat** mengajukan reimburse dengan bukti **agar** biaya tercatat.

**Acceptance Criteria:**
- [ ] Dapat memilih kategori: tiket, hotel, transport, makan, uang harian, lainnya
- [ ] Tanggal pengeluaran wajib diisi
- [ ] Jumlah dan mata uang wajib diisi
- [ ] Upload bukti (struk/invoice) wajib
- [ ] Dapat di-link ke travel request jika ada
- [ ] Sistem validasi: jumlah tidak melebihi plafon kategori
- [ ] Setelah submit, approval flow: Atasan → HRD → Finance

### US04.3 - Approval dan Pembayaran
**Sebagai** Finance, **saya dapat** approval final dan menjadwalkan pembayaran **agar** pencairan tepat.

**Acceptance Criteria:**
- [ ] Dapat melihat semua reimburse yang sudah di-approve HRD
- [ ] Dapat verifikasi bukti dan jumlah
- [ ] Dapat approve atau reject
- [ ] Setelah approve, dapat set tanggal pembayaran
- [ ] Dapat menandai sebagai "sudah dibayar"
- [ ] Karyawan menerima notifikasi saat dibayar

---

## EP05 - Slip Gaji & Payroll

### US05.1 - Generate Slip Gaji
**Sebagai** Finance/HRD, **saya dapat** membuat dan menerbitkan slip gaji PDF batch **agar** payroll terdokumentasi.

**Acceptance Criteria:**
- [ ] Dapat memilih periode (bulan/tahun)
- [ ] Dapat memilih karyawan: semua, per cabang, per departemen, atau pilih manual
- [ ] Sistem menghitung komponen: gaji pokok, tunjangan, potongan, lembur, denda keterlambatan
- [ ] Preview slip sebelum publish
- [ ] Tombol "Publish" menerbitkan slip dan mengirim notifikasi ke karyawan
- [ ] Generate PDF per karyawan dan simpan ke storage
- [ ] Aksi publish dicatat di audit log

### US05.2 - Lihat dan Unduh Slip Gaji
**Sebagai** Karyawan, **saya dapat** melihat dan mengunduh slip gaji **agar** transparan.

**Acceptance Criteria:**
- [ ] Dapat melihat daftar slip gaji per periode (yang sudah published)
- [ ] Dapat melihat detail: komponen gaji, tunjangan, potongan, gaji bersih
- [ ] Dapat download PDF
- [ ] Hanya bisa akses slip milik sendiri
- [ ] URL PDF ter-protect (signed URL atau auth required)

### US05.3 - Ekspor Payroll
**Sebagai** Finance, **saya dapat** mengekspor payroll ke format yang didukung **agar** integrasi lancar.

**Acceptance Criteria:**
- [ ] Dapat ekspor ke CSV dan Excel
- [ ] Dapat memilih periode dan scope (cabang/departemen)
- [ ] Format sesuai template standar (kolom: NIK, nama, gaji pokok, tunjangan, potongan, nett)
- [ ] Download langsung setelah generate

---

## EP06 - Kinerja & KPI

### US06.1 - Membuat Periode KPI
**Sebagai** HRD, **saya dapat** membuat periode KPI dan menetapkan target numerik per karyawan **agar** evaluasi terstruktur.

**Acceptance Criteria:**
- [ ] Dapat membuat periode: nama, tanggal mulai-selesai
- [ ] Dapat menetapkan target per karyawan: judul, deskripsi, target (angka), unit, bobot
- [ ] Dapat assign batch (per departemen/jabatan)
- [ ] Status periode: draft → active → closed
- [ ] Hanya periode active yang bisa di-update progress

### US06.2 - Monitoring Progres KPI
**Sebagai** Atasan, **saya dapat** memantau progres KPI tim dan memberi feedback **agar** performa terarah.

**Acceptance Criteria:**
- [ ] Dapat melihat daftar KPI bawahan dengan progress bar
- [ ] Dapat melihat detail: target, current, achievement %
- [ ] Dapat memberikan feedback/komentar
- [ ] Dapat melihat history update

### US06.3 - Update Progres KPI
**Sebagai** Karyawan, **saya dapat** mengisi progres/self-check-in **agar** pencapaian tercatat.

**Acceptance Criteria:**
- [ ] Dapat melihat target KPI aktif
- [ ] Dapat update current value dengan catatan
- [ ] Sistem menghitung achievement %
- [ ] Riwayat update tersimpan
- [ ] Tidak bisa update jika periode sudah closed

---

## EP07 - Dokumen & Surat Pengajuan

### US07.1 - Pengajuan Surat
**Sebagai** Karyawan, **saya dapat** mengajukan surat berdasarkan kategori dan mengunduh surat yang disetujui **agar** administrasi rapi.

**Acceptance Criteria:**
- [ ] Dapat memilih kategori surat: Keterangan Kerja, Referensi, Tugas, Perjalanan Dinas, Pinjaman, dll
- [ ] Form dinamis sesuai kategori (field berbeda per jenis surat)
- [ ] Dapat upload lampiran jika diperlukan
- [ ] Setelah submit, status menjadi `pending`
- [ ] Setelah disetujui dan diterbitkan, dapat download PDF surat
- [ ] Nomor surat auto-generated dengan format tenant

### US07.2 - Penerbitan Surat oleh HRD
**Sebagai** HRD, **saya dapat** mengelola template surat dan menerbitkan PDF resmi **agar** konsisten.

**Acceptance Criteria:**
- [ ] Dapat melihat daftar pengajuan surat pending
- [ ] Dapat approve/reject dengan komentar
- [ ] Setelah approve, dapat generate PDF surat resmi
- [ ] PDF menggunakan template dengan data karyawan terisi otomatis
- [ ] Dapat upload PDF manual jika template tidak tersedia
- [ ] Aksi penerbitan dicatat di audit log

### US07.3 - Akses Dokumen Resmi
**Sebagai** Karyawan, **saya dapat** mengakses dokumen resmi (kontrak, NDA, BPJS/NPWP) **agar** mudah diunduh.

**Acceptance Criteria:**
- [ ] Dapat melihat daftar dokumen milik sendiri
- [ ] Dapat download dokumen: kontrak, NDA, BPJS, NPWP (sesuai yang di-upload HRD)
- [ ] Dokumen sensitive hanya bisa diakses oleh pemilik dan HRD
- [ ] URL download ter-protect

---

## EP08 - Pengumuman, Notifikasi, dan Pelanggaran

### US08.1 - Publikasi Pengumuman
**Sebagai** HRD, **saya dapat** mempublikasikan pengumuman per cabang/departemen/role **agar** informasi tersampaikan.

**Acceptance Criteria:**
- [ ] Dapat membuat pengumuman: judul, isi, lampiran (opsional)
- [ ] Dapat memilih target: semua, per cabang, per departemen, per role
- [ ] Dapat set tanggal publikasi dan expired
- [ ] Status: draft → published → archived
- [ ] Setelah publish, notifikasi dikirim ke target audience

### US08.2 - Membaca Pengumuman
**Sebagai** Karyawan, **saya dapat** membaca dan menandai pengumuman sudah dibaca **agar** kepatuhan terdokumentasi.

**Acceptance Criteria:**
- [ ] Dapat melihat daftar pengumuman (terbaru di atas)
- [ ] Badge "Baru" untuk yang belum dibaca
- [ ] Setelah membuka, otomatis ditandai sebagai dibaca
- [ ] Dapat akses riwayat pengumuman lama
- [ ] HRD dapat melihat statistik: siapa yang sudah/belum baca

### US08.3 - Notifikasi Pelanggaran
**Sebagai** HRD, **saya dapat** mengirim notifikasi pelanggaran beserta konsekuensi **agar** ada jejak audit.

**Acceptance Criteria:**
- [ ] Dapat membuat notice pelanggaran: jenis pelanggaran, deskripsi, tanggal kejadian, konsekuensi/sanksi
- [ ] Setelah kirim, karyawan menerima email + in-app notification
- [ ] Notice tersimpan di profil karyawan (riwayat pelanggaran)
- [ ] Karyawan dapat acknowledge (acknowledge time recorded)
- [ ] Aksi dicatat di audit log

---

## EP09 - Admin, Keamanan, dan Tenant

### US09.1 - Manajemen Role & Permission
**Sebagai** IT/Ops, **saya dapat** mengelola role/permission, SSO, dan kebijakan keamanan **agar** akses terkendali.

**Acceptance Criteria:**
- [ ] Dapat melihat daftar user dan role-nya
- [ ] Dapat mengubah role user (dengan approval jika diperlukan)
- [ ] Dapat mengatur kebijakan: IP whitelist, geofence radius, device policy
- [ ] Dapat mengaktifkan/menonaktifkan 2FA (jika tersedia)
- [ ] Perubahan role dicatat di audit log

### US09.2 - Manajemen Tenant
**Sebagai** Super Admin/Tenant Admin, **saya dapat** mengelola tenant **agar** data antar perusahaan terisolasi.

**Acceptance Criteria:**
- [ ] Dapat membuat/edit tenant: nama, domain, branding (logo, warna)
- [ ] Dapat set batas cabang per tenant
- [ ] Dapat assign admin per tenant
- [ ] Data antar tenant 100% terisolasi (tidak bisa query lintas tenant)
- [ ] Super Admin dapat akses semua tenant, Tenant Admin hanya tenant-nya

### US09.3 - Audit Log
**Sebagai** HRD/Finance, **saya dapat** melihat log audit untuk aksi sensitif **agar** kepatuhan terjaga.

**Acceptance Criteria:**
- [ ] Dapat melihat log: publish slip gaji, perubahan data bank, ekspor data, perubahan role, penerbitan surat
- [ ] Log berisi: siapa, kapan, aksi apa, data sebelum/sesudah, IP address
- [ ] Dapat filter per tanggal, per user, per jenis aksi
- [ ] Dapat ekspor log ke CSV/Excel

---

## Gherkin Test Scenarios

### EP01 - Registrasi & Aktivasi Akun

#### Scenario: Registrasi karyawan baru berhasil
```gherkin
Feature: Registrasi Karyawan
  Sebagai karyawan baru
  Saya ingin mendaftar akun
  Agar saya dapat mengakses sistem PeopleHub

  Background:
    Given saya berada di halaman registrasi
    And email "john@example.com" belum terdaftar di tenant

  Scenario: Registrasi berhasil dengan data valid
    When saya mengisi form registrasi dengan data:
      | Field              | Value               |
      | Nama Lengkap       | John Doe            |
      | Email              | john@example.com    |
      | Nomor Ponsel       | 081234567890        |
      | Password           | SecurePass123!      |
      | Konfirmasi Password| SecurePass123!      |
    And saya mencentang checkbox persetujuan kebijakan privasi
    And saya mengklik tombol "Daftar"
    Then saya melihat pesan "Registrasi berhasil, tunggu persetujuan HRD"
    And status akun saya adalah "pending"
    And saya tidak dapat login

  Scenario: Registrasi gagal dengan email sudah terdaftar
    Given email "existing@example.com" sudah terdaftar di tenant
    When saya mengisi email "existing@example.com"
    And saya mengklik tombol "Daftar"
    Then saya melihat pesan error "Email sudah terdaftar"

  Scenario: Registrasi gagal dengan password lemah
    When saya mengisi password "password"
    Then saya melihat pesan error "Password harus minimal 8 karakter dengan 1 huruf besar, 1 angka, dan 1 karakter khusus"

  Scenario: Registrasi gagal tanpa persetujuan kebijakan privasi
    When saya mengisi semua field dengan data valid
    But saya tidak mencentang checkbox persetujuan kebijakan privasi
    And saya mengklik tombol "Daftar"
    Then saya melihat pesan error "Anda harus menyetujui kebijakan privasi"
```

#### Scenario: Approval registrasi oleh HRD
```gherkin
Feature: Approval Registrasi
  Sebagai HRD
  Saya ingin meninjau dan menyetujui registrasi
  Agar hanya akun valid yang aktif

  Background:
    Given saya login sebagai HRD
    And terdapat registrasi pending dengan email "john@example.com"

  Scenario: Approve registrasi dengan data lengkap
    When saya membuka detail registrasi "john@example.com"
    And saya melengkapi data:
      | Field           | Value                    |
      | Cabang          | Kantor Pusat             |
      | Departemen      | Engineering              |
      | Jabatan         | Software Developer       |
      | Atasan Langsung | Jane Manager             |
      | Nomor Karyawan  | EMP-001                  |
      | Employment Type | permanent                |
      | Work Mode       | hybrid                   |
    And saya mengklik tombol "Approve"
    Then status registrasi berubah menjadi "approved"
    And record Employee terbuat untuk "john@example.com"
    And email notifikasi approval terkirim
    And aksi tercatat di audit log

  Scenario: Reject registrasi dengan alasan
    When saya membuka detail registrasi "john@example.com"
    And saya mengklik tombol "Reject"
    And saya mengisi alasan "Data tidak lengkap, mohon daftar ulang dengan data yang benar"
    And saya mengkonfirmasi penolakan
    Then status registrasi berubah menjadi "rejected"
    And email notifikasi penolakan terkirim dengan alasan

  Scenario: Approve registrasi tanpa melengkapi data wajib
    When saya membuka detail registrasi "john@example.com"
    And saya tidak melengkapi cabang dan departemen
    And saya mengklik tombol "Approve"
    Then saya melihat pesan error "Cabang dan Departemen wajib diisi"
```

---

### EP02 - Absensi, Shift, dan Koreksi

#### Scenario: Clock In dengan Selfie
```gherkin
Feature: Clock In
  Sebagai karyawan
  Saya ingin clock in dengan selfie
  Agar kehadiran saya tercatat

  Background:
    Given saya login sebagai karyawan
    And hari ini adalah hari kerja
    And saya belum clock in hari ini

  Scenario: Clock in WFO berhasil
    When saya mengklik tombol "Clock In"
    And saya memilih mode "WFO"
    And saya mengambil foto selfie dari kamera
    And lokasi GPS saya berada dalam radius geofence kantor
    And waktu saat ini adalah "08:45" (sebelum batas masuk 09:00)
    And saya mengklik tombol "Submit"
    Then clock in berhasil tercatat dengan:
      | Field          | Value          |
      | Waktu          | 08:45          |
      | Mode           | WFO            |
      | Status         | present        |
      | Late Minutes   | 0              |
    And saya melihat konfirmasi "Clock in berhasil pada 08:45"

  Scenario: Clock in terlambat
    When saya mengklik tombol "Clock In"
    And saya memilih mode "WFO"
    And saya mengambil foto selfie
    And waktu saat ini adalah "09:30" (30 menit setelah batas masuk)
    And saya mengklik tombol "Submit"
    Then clock in tercatat dengan status "late"
    And keterlambatan tercatat 30 menit
    And denda keterlambatan dihitung sesuai aturan
    And notifikasi dikirim ke atasan

  Scenario: Clock in WFO di luar geofence
    When saya mengklik tombol "Clock In"
    And saya memilih mode "WFO"
    And lokasi GPS saya berada di luar radius geofence kantor
    And saya mengklik tombol "Submit"
    Then saya melihat pesan error "Lokasi Anda di luar area kantor. Pilih WFH jika bekerja dari rumah."
    And clock in tidak tercatat

  Scenario: Clock in tanpa foto selfie
    When saya mengklik tombol "Clock In"
    And saya memilih mode "WFH"
    And saya tidak mengambil foto selfie
    And saya mengklik tombol "Submit"
    Then saya melihat pesan error "Foto selfie wajib diambil"

  Scenario: Clock in menggunakan foto dari galeri
    When saya mengklik tombol "Clock In"
    And saya mencoba upload foto dari galeri
    Then fitur upload dari galeri tidak tersedia
    And saya harus mengambil foto langsung dari kamera
```

#### Scenario: Clock Out dengan Selfie
```gherkin
Feature: Clock Out
  Sebagai karyawan
  Saya ingin clock out dengan selfie
  Agar waktu pulang saya tercatat

  Background:
    Given saya login sebagai karyawan
    And saya sudah clock in hari ini pada jam "08:45"
    And saya belum clock out hari ini

  Scenario: Clock out berhasil dalam jam kerja normal
    When saya mengklik tombol "Clock Out"
    And saya mengambil foto selfie
    And waktu saat ini adalah "17:30"
    And saya mengklik tombol "Submit"
    Then clock out berhasil tercatat dengan:
      | Field            | Value          |
      | Waktu Masuk      | 08:45          |
      | Waktu Keluar     | 17:30          |
      | Total Jam Kerja  | 8 jam 45 menit |
      | Lembur           | 0 menit        |
    And saya melihat ringkasan kehadiran hari ini

  Scenario: Clock out dengan jam lembur
    Given shift saya berakhir pada jam "17:00"
    When saya mengklik tombol "Clock Out"
    And waktu saat ini adalah "19:00"
    And saya mengambil foto selfie
    And saya mengklik tombol "Submit"
    Then clock out tercatat dengan lembur 2 jam
```

#### Scenario: Koreksi Absensi
```gherkin
Feature: Koreksi Absensi
  Sebagai karyawan
  Saya ingin mengajukan koreksi absensi
  Agar data kehadiran saya akurat

  Background:
    Given saya login sebagai karyawan
    And tanggal "2024-01-15" adalah 3 hari yang lalu
    And saya memiliki record absensi pada "2024-01-15" dengan jam masuk "10:00"

  Scenario: Ajukan koreksi absensi berhasil
    When saya membuka halaman koreksi absensi
    And saya memilih tanggal "2024-01-15"
    And saya mengisi:
      | Field              | Value                     |
      | Jam Masuk Benar    | 08:00                     |
      | Jam Keluar Benar   | 17:00                     |
      | Alasan             | Lupa clock in, ada meeting |
    And saya mengupload bukti screenshot kalender meeting
    And saya mengklik tombol "Submit"
    Then pengajuan koreksi berhasil dengan status "pending"
    And atasan menerima notifikasi

  Scenario: Koreksi absensi ditolak karena lebih dari 7 hari
    Given tanggal "2024-01-08" adalah 10 hari yang lalu
    When saya mencoba membuat koreksi untuk tanggal "2024-01-08"
    Then saya melihat pesan error "Koreksi hanya dapat diajukan maksimal 7 hari ke belakang"

  Scenario: Koreksi absensi duplikat
    Given saya sudah memiliki koreksi pending untuk tanggal "2024-01-15"
    When saya mencoba membuat koreksi baru untuk tanggal "2024-01-15"
    Then saya melihat pesan error "Sudah ada koreksi pending untuk tanggal ini"
```

---

### EP03 - Cuti & Izin

#### Scenario: Pengajuan Cuti
```gherkin
Feature: Pengajuan Cuti
  Sebagai karyawan
  Saya ingin mengajukan cuti
  Agar saya dapat izin tidak masuk kerja

  Background:
    Given saya login sebagai karyawan
    And saldo cuti tahunan saya adalah 12 hari
    And tidak ada pengajuan cuti pending

  Scenario: Ajukan cuti tahunan berhasil
    When saya membuka halaman pengajuan cuti
    And saya memilih jenis cuti "Tahunan"
    And saya memilih tanggal mulai "2024-02-01"
    And saya memilih tanggal selesai "2024-02-03"
    And sistem menghitung jumlah hari adalah 3 hari (exclude weekend)
    And saya mengisi alasan "Liburan keluarga"
    And saya memilih delegasi tugas ke "Rekan A"
    And saya mengklik tombol "Submit"
    Then pengajuan cuti berhasil dengan status "pending"
    And saya melihat preview: saldo 12 → saldo setelah approve 9
    And atasan menerima notifikasi

  Scenario: Ajukan cuti sakit lebih dari 1 hari tanpa surat dokter
    When saya memilih jenis cuti "Sakit"
    And saya memilih tanggal mulai "2024-02-01"
    And saya memilih tanggal selesai "2024-02-03"
    And saya tidak mengupload surat dokter
    And saya mengklik tombol "Submit"
    Then saya melihat pesan error "Surat dokter wajib diupload untuk cuti sakit lebih dari 1 hari"

  Scenario: Ajukan cuti dengan saldo tidak cukup
    Given saldo cuti tahunan saya adalah 2 hari
    When saya memilih jenis cuti "Tahunan"
    And saya memilih tanggal mulai "2024-02-01"
    And saya memilih tanggal selesai "2024-02-05"
    And sistem menghitung jumlah hari adalah 5 hari
    Then saya melihat pesan error "Saldo cuti tidak mencukupi (tersedia: 2 hari, dibutuhkan: 5 hari)"
    And tombol Submit tidak aktif
```

#### Scenario: Approval Cuti oleh Atasan
```gherkin
Feature: Approval Cuti
  Sebagai atasan
  Saya ingin menyetujui atau menolak cuti bawahan
  Agar ketersediaan tim terjaga

  Background:
    Given saya login sebagai manager
    And bawahan saya "John Doe" mengajukan cuti tahunan untuk tanggal "2024-02-01" sampai "2024-02-03"

  Scenario: Approve cuti bawahan
    When saya membuka detail pengajuan cuti "John Doe"
    And saya melihat informasi:
      | Field        | Value        |
      | Jenis Cuti   | Tahunan      |
      | Tanggal      | 1-3 Feb 2024 |
      | Jumlah Hari  | 3 hari       |
      | Saldo Sisa   | 9 hari       |
    And saya melihat tidak ada anggota tim lain yang cuti di tanggal tersebut
    And saya mengklik tombol "Approve"
    Then status cuti berubah menjadi "approved_manager"
    And pengajuan dilanjutkan ke HRD
    And karyawan menerima notifikasi

  Scenario: Reject cuti karena ada deadline project
    When saya membuka detail pengajuan cuti "John Doe"
    And saya mengklik tombol "Reject"
    And saya mengisi alasan "Deadline project ABC pada tanggal tersebut, mohon ajukan tanggal lain"
    And saya mengkonfirmasi penolakan
    Then status cuti berubah menjadi "rejected"
    And karyawan menerima notifikasi dengan alasan penolakan
```

---

### EP04 - Perjalanan Dinas & Reimburse

#### Scenario: Pengajuan Reimburse
```gherkin
Feature: Pengajuan Reimburse
  Sebagai karyawan
  Saya ingin mengajukan reimburse
  Agar biaya yang sudah saya keluarkan dapat diganti

  Background:
    Given saya login sebagai karyawan
    And saya memiliki travel request yang disetujui ke "Surabaya"

  Scenario: Ajukan reimburse dengan bukti valid
    When saya membuka halaman pengajuan reimburse
    And saya memilih link ke travel request "Surabaya"
    And saya menambahkan item reimburse:
      | Kategori   | Tanggal    | Jumlah    | Bukti            |
      | Tiket      | 2024-01-15 | 500000    | tiket-pesawat.pdf |
      | Hotel      | 2024-01-15 | 800000    | invoice-hotel.pdf |
      | Transport  | 2024-01-16 | 150000    | struk-taxi.jpg    |
    And total reimburse adalah Rp 1.450.000
    And total tidak melebihi plafon
    And saya mengklik tombol "Submit"
    Then pengajuan reimburse berhasil dengan status "pending"
    And atasan menerima notifikasi

  Scenario: Ajukan reimburse melebihi plafon
    Given plafon hotel per malam adalah Rp 700.000
    When saya menambahkan item hotel dengan jumlah Rp 1.000.000
    Then saya melihat peringatan "Jumlah melebihi plafon kategori Hotel (max: Rp 700.000)"
```

---

### EP05 - Slip Gaji & Payroll

#### Scenario: Generate dan Publish Slip Gaji
```gherkin
Feature: Generate Slip Gaji
  Sebagai Finance
  Saya ingin membuat dan menerbitkan slip gaji
  Agar karyawan dapat melihat detail gaji mereka

  Background:
    Given saya login sebagai Finance
    And periode payroll Januari 2024 sudah selesai dihitung

  Scenario: Publish slip gaji batch per cabang
    When saya membuka halaman generate slip gaji
    And saya memilih periode "Januari 2024"
    And saya memilih cabang "Kantor Pusat"
    And saya mengklik tombol "Generate Preview"
    And sistem menampilkan preview 50 slip gaji
    And saya memverifikasi komponen gaji sudah benar
    And saya mengklik tombol "Publish"
    Then 50 slip gaji berhasil dipublish
    And 50 karyawan menerima notifikasi email
    And aksi tercatat di audit log dengan detail "Publish 50 slip gaji periode Jan 2024"
```

#### Scenario: Karyawan Melihat Slip Gaji
```gherkin
Feature: Lihat Slip Gaji
  Sebagai karyawan
  Saya ingin melihat slip gaji
  Agar saya tahu detail gaji saya

  Background:
    Given saya login sebagai karyawan
    And slip gaji periode "Januari 2024" sudah dipublish untuk saya

  Scenario: Lihat dan download slip gaji
    When saya membuka halaman slip gaji
    And saya memilih periode "Januari 2024"
    Then saya melihat detail slip gaji:
      | Komponen       | Nilai        |
      | Gaji Pokok     | 10.000.000   |
      | Tunjangan      | 2.000.000    |
      | Lembur         | 500.000      |
      | Potongan       | -1.500.000   |
      | Gaji Bersih    | 11.000.000   |
    When saya mengklik tombol "Download PDF"
    Then file PDF slip gaji terunduh

  Scenario: Akses slip gaji orang lain ditolak
    When saya mencoba mengakses slip gaji karyawan lain via URL manipulation
    Then saya melihat pesan error "Akses ditolak"
    And aksi tercatat di security log
```

---

### EP06 - Kinerja & KPI

#### Scenario: Update Progres KPI
```gherkin
Feature: Update Progres KPI
  Sebagai karyawan
  Saya ingin mengupdate progres KPI
  Agar pencapaian saya tercatat

  Background:
    Given saya login sebagai karyawan
    And terdapat KPI aktif "Closing Sales Q1" dengan target 100 unit

  Scenario: Update progres KPI berhasil
    When saya membuka detail KPI "Closing Sales Q1"
    And saya melihat progres saat ini adalah 60 unit (60%)
    And saya mengupdate current value menjadi 75 unit
    And saya mengisi catatan "Berhasil closing 15 client minggu ini"
    And saya mengklik tombol "Update"
    Then progres berubah menjadi 75 unit (75%)
    And riwayat update tersimpan
    And atasan dapat melihat update terbaru

  Scenario: Update KPI yang sudah closed
    Given periode KPI "Q4 2023" sudah closed
    When saya mencoba update progres KPI periode tersebut
    Then saya melihat pesan error "Tidak dapat update, periode KPI sudah ditutup"
```

---

### EP07 - Dokumen & Surat

#### Scenario: Pengajuan Surat Keterangan Kerja
```gherkin
Feature: Pengajuan Surat
  Sebagai karyawan
  Saya ingin mengajukan surat keterangan kerja
  Agar saya memiliki dokumen resmi

  Background:
    Given saya login sebagai karyawan
    And status employee saya adalah "active"

  Scenario: Ajukan SKK berhasil
    When saya membuka halaman pengajuan surat
    And saya memilih kategori "Surat Keterangan Kerja"
    And saya mengisi keperluan "Pengajuan KPR Bank ABC"
    And saya mengklik tombol "Submit"
    Then pengajuan surat berhasil dengan status "pending"
    And HRD menerima notifikasi

  Scenario: HRD menerbitkan SKK
    Given saya login sebagai HRD
    And terdapat pengajuan SKK pending dari "John Doe"
    When saya membuka detail pengajuan
    And saya mengklik tombol "Approve & Generate"
    Then sistem generate PDF SKK dengan:
      | Field          | Value                          |
      | Nomor Surat    | SKK/KAS/HRD/I/2024/001        |
      | Nama Karyawan  | John Doe                       |
      | NIK            | 1234567890123456               |
      | Jabatan        | Software Developer             |
      | Tanggal Masuk  | 01 Januari 2020                |
    And karyawan dapat download PDF
    And aksi tercatat di audit log
```

---

### EP08 - Pengumuman & Notifikasi

#### Scenario: Publikasi Pengumuman
```gherkin
Feature: Pengumuman
  Sebagai HRD
  Saya ingin mempublikasikan pengumuman
  Agar informasi tersampaikan ke karyawan

  Background:
    Given saya login sebagai HRD

  Scenario: Publish pengumuman ke seluruh cabang
    When saya membuat pengumuman baru:
      | Field     | Value                              |
      | Judul     | Libur Tahun Baru 2024              |
      | Isi       | Kantor libur tanggal 1 Januari... |
      | Target    | Semua Cabang                       |
      | Expired   | 2024-01-02                         |
    And saya mengklik tombol "Publish"
    Then pengumuman berhasil dipublish
    And semua karyawan menerima notifikasi in-app
    And semua karyawan menerima email

  Scenario: Publish pengumuman ke cabang tertentu
    When saya membuat pengumuman baru:
      | Field     | Value                              |
      | Judul     | Rapat Cabang Jakarta               |
      | Isi       | Rapat wajib semua karyawan...     |
      | Target    | Cabang: Kantor Pusat               |
      | Expired   | 2024-02-15                         |
    And saya mengklik tombol "Publish"
    Then pengumuman berhasil dipublish
    And hanya karyawan cabang "Kantor Pusat" yang menerima notifikasi

  Scenario: Karyawan membaca pengumuman
    Given saya login sebagai karyawan
    And terdapat pengumuman baru "Libur Tahun Baru 2024"
    When saya membuka daftar pengumuman
    Then saya melihat badge "Baru" pada pengumuman tersebut
    When saya membuka detail pengumuman
    Then badge "Baru" hilang
    And status baca saya tercatat
    And HRD dapat melihat bahwa saya sudah membaca

  Scenario: HRD melihat statistik keterbacaan
    When saya membuka detail pengumuman "Libur Tahun Baru 2024"
    And saya mengklik tab "Statistik"
    Then saya melihat:
      | Metric          | Value    |
      | Total Target    | 100      |
      | Sudah Baca      | 75       |
      | Belum Baca      | 25       |
      | Persentase      | 75%      |
    And saya dapat download daftar yang belum membaca
```

#### Scenario: Notifikasi Pelanggaran
```gherkin
Feature: Notifikasi Pelanggaran
  Sebagai HRD
  Saya ingin mengirim notifikasi pelanggaran
  Agar ada jejak audit dan karyawan aware

  Background:
    Given saya login sebagai HRD

  Scenario: Kirim notifikasi pelanggaran keterlambatan
    When saya membuat notice pelanggaran untuk "John Doe":
      | Field            | Value                              |
      | Jenis Pelanggaran| Keterlambatan Berulang             |
      | Deskripsi        | Terlambat 5 kali dalam 1 bulan    |
      | Tanggal Kejadian | 2024-01-01 s/d 2024-01-31          |
      | Konsekuensi      | Surat Peringatan 1                 |
    And saya mengklik tombol "Kirim"
    Then notifikasi pelanggaran terkirim
    And karyawan "John Doe" menerima email
    And karyawan "John Doe" menerima notifikasi in-app
    And notice tersimpan di profil karyawan

  Scenario: Karyawan acknowledge pelanggaran
    Given saya login sebagai karyawan "John Doe"
    And saya memiliki notice pelanggaran baru
    When saya membuka detail notice
    And saya mengklik tombol "Saya Mengerti"
    Then acknowledge time tercatat
    And HRD dapat melihat bahwa saya sudah acknowledge

  Scenario: HRD melihat riwayat pelanggaran karyawan
    When saya membuka profil karyawan "John Doe"
    And saya mengklik tab "Riwayat Pelanggaran"
    Then saya melihat daftar pelanggaran dengan:
      | Kolom          | Contoh Nilai                    |
      | Tanggal        | 2024-01-31                      |
      | Jenis          | Keterlambatan Berulang          |
      | Konsekuensi    | Surat Peringatan 1              |
      | Status         | Acknowledged                    |
      | Acknowledge At | 2024-02-01 09:30:00             |
```

---

### EP09 - Admin & Keamanan

#### Scenario: Audit Log
```gherkin
Feature: Audit Log
  Sebagai HRD
  Saya ingin melihat audit log
  Agar kepatuhan dan keamanan terjaga

  Background:
    Given saya login sebagai HRD

  Scenario: Lihat audit log aksi sensitif
    When saya membuka halaman audit log
    And saya memfilter:
      | Filter      | Value           |
      | Tanggal     | 2024-01-01 s/d 2024-01-31 |
      | Jenis Aksi  | Publish Slip Gaji |
    Then saya melihat daftar log dengan informasi:
      | Kolom          | Contoh Nilai                    |
      | Waktu          | 2024-01-25 10:30:00             |
      | Aktor          | finance@company.com             |
      | Aksi           | Publish Slip Gaji               |
      | Detail         | 50 slip, periode Jan 2024       |
      | IP Address     | 192.168.1.100                   |

  Scenario: Ekspor audit log
    When saya memfilter periode "Januari 2024"
    And saya mengklik tombol "Ekspor CSV"
    Then file CSV audit log terunduh
    And file berisi semua log sesuai filter

  Scenario: Lihat audit log perubahan data bank
    When saya memfilter jenis aksi "Perubahan Data Bank"
    Then saya melihat log dengan:
      | Kolom          | Contoh Nilai                    |
      | Aktor          | hrd@company.com                 |
      | Aksi           | Approve Perubahan Data Bank     |
      | Karyawan       | John Doe                        |
      | Data Sebelum   | BCA - 1234567890                |
      | Data Sesudah   | Mandiri - 0987654321            |
```

#### Scenario: Role & Permission Management
```gherkin
Feature: Manajemen Role
  Sebagai IT/Ops
  Saya ingin mengelola role dan permission
  Agar akses sistem terkendali

  Background:
    Given saya login sebagai IT/Ops

  Scenario: Melihat daftar user dan role
    When saya membuka halaman manajemen user
    Then saya melihat daftar user dengan kolom:
      | Kolom          | Contoh Nilai                    |
      | Nama           | John Doe                        |
      | Email          | john@company.com                |
      | Role           | Karyawan                        |
      | Cabang         | Kantor Pusat                    |
      | Status         | Active                          |

  Scenario: Mengubah role user
    When saya membuka detail user "John Doe"
    And saya mengubah role dari "Karyawan" menjadi "Manager"
    And saya mengklik tombol "Simpan"
    Then role user berhasil diubah
    And user "John Doe" memiliki permission Manager
    And aksi tercatat di audit log

  Scenario: Mengatur kebijakan keamanan
    When saya membuka halaman kebijakan keamanan
    And saya mengaktifkan:
      | Kebijakan          | Value           |
      | IP Whitelist       | 192.168.1.0/24  |
      | Geofence Radius    | 100 meter       |
      | Device Limit       | 2 device        |
    And saya mengklik tombol "Simpan"
    Then kebijakan keamanan berhasil diperbarui
```

#### Scenario: Tenant Management
```gherkin
Feature: Manajemen Tenant
  Sebagai Super Admin
  Saya ingin mengelola tenant/perusahaan
  Agar data antar perusahaan terisolasi

  Background:
    Given saya login sebagai Super Admin

  Scenario: Membuat tenant baru
    When saya membuka halaman manajemen tenant
    And saya mengklik tombol "Tambah Tenant"
    And saya mengisi:
      | Field           | Value                          |
      | Nama Perusahaan | PT. CYBER MULTI ARTHA          |
      | Domain          | cma.peoplehub.id               |
      | Logo            | logo-cma.png                   |
      | Batas Cabang    | 10                             |
    And saya mengklik tombol "Simpan"
    Then tenant baru berhasil dibuat
    And tenant memiliki isolasi data terpisah

  Scenario: Assign admin ke tenant
    When saya membuka detail tenant "PT. CYBER MULTI ARTHA"
    And saya menambahkan admin baru:
      | Field    | Value                |
      | Email    | admin@cma.com        |
      | Role     | Tenant Admin         |
    And saya mengklik tombol "Assign"
    Then admin berhasil di-assign ke tenant
    And admin dapat mengelola tenant tersebut

  Scenario: Verifikasi isolasi data tenant
    Given terdapat 2 tenant: "PT. KAS" dan "PT. CMA"
    When user dari "PT. KAS" mencoba akses data "PT. CMA"
    Then akses ditolak dengan error "Unauthorized"
    And percobaan akses tercatat di security log
```

#### Scenario: Delegasi Approver
```gherkin
Feature: Delegasi Approver
  Sebagai Manager
  Saya ingin mendelegasikan approval ke orang lain
  Agar proses tidak terhambat saat saya cuti

  Background:
    Given saya login sebagai Manager "Jane Manager"

  Scenario: Setup delegasi sementara
    When saya membuka halaman delegasi approval
    And saya mengatur:
      | Field           | Value                          |
      | Delegasi Ke     | Bob Senior                     |
      | Tanggal Mulai   | 2024-02-01                     |
      | Tanggal Selesai | 2024-02-05                     |
      | Jenis Approval  | Semua (Cuti, Koreksi, dll)     |
    And saya mengklik tombol "Aktifkan"
    Then delegasi berhasil diaktifkan
    And Bob Senior dapat menyetujui pengajuan sebagai pengganti saya

  Scenario: Approval oleh delegate
    Given delegasi aktif dari "Jane Manager" ke "Bob Senior"
    And terdapat pengajuan cuti pending untuk bawahan Jane
    When Bob Senior login
    And Bob Senior approve pengajuan tersebut
    Then approval berhasil
    And audit log mencatat:
      | Field            | Value                          |
      | Approver         | Bob Senior                     |
      | Is Delegated     | true                           |
      | Delegated From   | Jane Manager                   |

  Scenario: Delegasi expired otomatis
    Given delegasi berakhir pada "2024-02-05"
    When tanggal saat ini adalah "2024-02-06"
    Then delegasi otomatis non-aktif
    And Bob Senior tidak dapat approve sebagai pengganti Jane lagi
```

---

## Dokumen Terkait
- [00-peoplehub-konsep.md](00-peoplehub-konsep.md) - Konsep produk
- [01-role-dan-akses.md](01-role-dan-akses.md) - Detail role dan permission
- [02-user-flow-utama.md](02-user-flow-utama.md) - Flow utama
- [19-skema-database-erd.md](19-skema-database-erd.md) - Struktur database
