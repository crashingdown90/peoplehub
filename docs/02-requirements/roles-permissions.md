# Role dan Hak Akses PeopleHub

> **Versi:** 2.0 | **Tanggal Update:** 22 Januari 2026 | **Status:** Final

Ringkasan role utama PeopleHub beserta kewenangan awal. Role inti: **Karyawan**, **Atasan/Manager**, **HRD**, **Finance/Payroll**, **IT/Ops**, **Super Admin/Tenant Admin**.

## Ringkasan Tanggung Jawab
- **Karyawan**: self-service kehadiran, cuti/izin, koreksi absensi, akses dokumen pribadi, mengikuti review/performance cycle.
- **Atasan/Manager**: menyetujui cuti, koreksi absensi, tukar shift, perjalanan dinas; memantau absensi/KPI tim; publikasi/penerusan pengumuman ke tim.
- **HRD**: admin HR; kelola data master, jadwal/shift, kebijakan, approval final, dokumen, audit, laporan, slip gaji; konfigurasi cabang/departemen; monitoring kepatuhan.
- **Finance/Payroll**: kelola payroll, slip gaji, COA biaya, reimburse/pinjaman, ekspor payroll; bisa jadi final approver biaya/perjalanan.
- **IT/Ops**: kelola akun, SSO, role/permission teknis, integrasi, audit log, kebijakan keamanan.
- **Super Admin/Tenant Admin**: konfigurasi tenant/perusahaan, branding, domain, batas cabang, role assignment lintas perusahaan (multi-tenant).

## Registrasi & Aktivasi Karyawan
- Karyawan melakukan registrasi akun (email/nomor ponsel + data dasar).
- Status awal: pending hingga disetujui HRD.
- HRD memverifikasi data (identitas, cabang, departemen, manager) lalu mengaktifkan akun.
- Setelah approved, karyawan dapat login dan menggunakan fitur.

### Alur Registrasi Karyawan (Website)
1. Karyawan buka halaman daftar, isi form registrasi, dan submit.
2. Sistem menyimpan status akun sebagai pending.
3. HRD meninjau data, melengkapi atribut organisasi (cabang/departemen/jabatan/atasan), lalu approve atau reject.
4. Jika approve: sistem mengirim email + notifikasi in-app; akun aktif dan dapat login. Jika reject: karyawan menerima alasan penolakan.

### Form Registrasi (awalan)
- Data akun: nama lengkap, email, nomor ponsel, password, konfirmasi password.
- Data pekerjaan (opsional di awal, bisa dilengkapi HRD): cabang, departemen, jabatan, atasan langsung, tipe karyawan (tetap/kontrak/freelance), pola kerja (WFO/WFH/hybrid), tanggal mulai bekerja.
- Data identitas (opsional unggah): NIK/KTP, NPWP, BPJS (jika ada), alamat domisili, kontak darurat.
- Data bank (bisa dilengkapi/diubah dengan approval HRD): nama bank, nomor rekening, nama pemilik rekening, cabang pembuka rekening.
- Persetujuan: centang kebijakan privasi/ketentuan penggunaan.

## Fitur Utama HRD (MVP)
- Menyetujui/menolak registrasi akun karyawan.
- Mengedit profil karyawan (data master, cabang, jabatan, manager).
- Monitoring absensi harian (cek kehadiran, keterlambatan, lembur).
- Meninjau dan memproses pengajuan cuti, pinjaman, dan biaya operasional (reimburse/expense).
- Mengirim notifikasi pelanggaran ke karyawan (jenis pelanggaran, konsekuensi/sanksi), tersimpan di histori dan audit log.
- Melihat dan mengelola rincian gaji (slip gaji, komponen tunjangan/potongan) per karyawan.
- Menetapkan, memantau, dan menutup KPI/target kinerja per karyawan.
- Menyetujui perjalanan dinas dan reimburse terkait (tiket, akomodasi, transport, uang harian).
- Melihat dashboard rekap absensi harian, bulanan, dan tahunan (kehadiran, keterlambatan, lembur) per cabang/departemen.
- Mengatur tarif pemotongan keterlambatan (deduction rules) per kategori keterlambatan/tipe karyawan/cabang.
- Mengelola surat pengajuan (kategori umum, template, approval, penerbitan surat).
- Monitoring kepatuhan real time (alert keterlambatan masal, absen kosong, cuti menumpuk).
- Konfigurasi kebijakan granular (jadwal/shift per cabang, lembur, cutoff payroll, plafon perjalanan dinas, tier denda keterlambatan).
- Bulk actions (impor/mutasi massal, publish slip gaji batch, approval massal).
- Compliance & audit report (log perubahan data sensitif, log unduhan slip/dokumen, ekspor log).
- Workforce analytics (heatmap kehadiran, tren kontrak habis/turnover, KPI per tim).
- Template & automation (template surat/kontrak, auto-reminder kontrak habis, saldo cuti kadaluarsa, tiket mendekati SLA).
- Delegasi & substitusi approver (waktu aktif).
- Integrasi keuangan (ekspor payroll multi-format, mapping COA biaya operasional/perjalanan dinas).

## Fitur Utama Atasan/Manager
- Menyetujui cuti/izin, koreksi absensi, tukar/cover shift, perjalanan dinas, dan surat yang butuh persetujuan atasan.
- Memantau absensi harian tim (hadir, terlambat, tidak hadir), saldo cuti tim, dan KPI/progres tim.
- Meneruskan/publikasi pengumuman ke tim; melihat riwayat pengumuman terbaca.
- Menjadi approver pengganti (delegasi) bila diaktifkan.

## Fitur Utama Finance/Payroll
- Menjalankan payroll, menerbitkan slip gaji (batch), mengelola tunjangan/potongan dan COA biaya.
- Menyetujui reimburse/pinjaman/perjalanan dinas (sebagai final approver jika diset).
- Monitoring pinjaman outstanding dan reimburse yang belum dibayar; ekspor payroll multi-format.

## Fitur Utama IT/Ops
- Kelola akun/SSO, role/permission teknis, API key/token, integrasi.
- Kelola audit log, device/IP/geofence policy untuk absensi, dan keamanan (password/2FA jika ada).

## Fitur Utama Super Admin/Tenant Admin
- Kelola tenant/perusahaan (branding, domain, batas cabang), admin per tenant, dan pengaturan isolasi data.
- Atur role assignment lintas perusahaan; kontrol konfigurasi global.

## Fitur Utama Karyawan (MVP)
- Edit Profil (data pribadi terbatas).
- Absen Online (clock in/out).
- Pengajuan Cuti.
- Membuat surat pengajuan berdasarkan kategori umum, unggah bukti, dan pantau status.
- Pengajuan koreksi absensi dengan bukti.
- Tukar/cover shift dengan rekan (butuh persetujuan).
- Membaca pengumuman/kebijakan resmi dan menandai sudah dibaca.
- ID digital/QR personal untuk keperluan verifikasi.
- Riwayat permintaan perubahan data bank.
- Ajukan tiket bantuan (HR/IT) dan pantau status.
- Lihat aset yang dipinjam dan pengembalian.
- Self-service dokumen: unduh kontrak, NDA, BPJS/NPWP, slip terkait.

## Hak Akses per Modul (MVP + Roadmap)
- **Data Karyawan**
  - Karyawan: lihat dan perbarui profil pribadi (bidang terbatas: kontak, alamat, emergency contact) setelah akun disetujui HRD.
  - Atasan/Manager: lihat profil tim yang di-report langsung; tidak dapat mengubah data master.
  - HRD: CRUD seluruh data karyawan, struktur organisasi (cabang/departemen/jabatan), status kerja, kontrak, assign manager.
  - Finance/Payroll: akses data yang relevan untuk payroll (komponen gaji, status kerja) sesuai cabang/role.
  - IT/Ops: kelola akun, reset akses, enforce SSO/2FA jika ada.
  - Super Admin/Tenant Admin: kelola tenant, cabang, dan admin per perusahaan.
- **Absensi & Jam Kerja**
  - Karyawan: clock in/out (absen online), pilih status lokasi (onsite/WFO atau WFH); lihat jadwal/shift pribadi; ajukan koreksi absensi dengan bukti.
  - Atasan/Manager: pantau kehadiran tim, menyetujui koreksi absensi; lihat jadwal tim.
  - HRD: atur kalender kerja, shift, hari libur; kelola jatah libur bersama; pantau kehadiran real time; set aturan keterlambatan/lembur; konfigurasi tarif pemotongan keterlambatan; setujui koreksi jika diperlukan; kelola kebijakan WFO/WFH.
  - IT/Ops: kelola aturan geofence/IP/device jika diterapkan.
  - HRD: atur kebijakan lembur (syarat, perhitungan, batas jam).
- **Tukar/Cover Shift**
  - Karyawan: ajukan tukar shift atau minta cover; pilih rekan; menunggu persetujuan.
  - Atasan/Manager: setujui/menolak permintaan; aturan visibilitas per cabang/tim.
  - HRD: override/approval final jika diperlukan.
- **Cuti/Izin**
  - Karyawan: ajukan cuti/izin (minimal pengajuan cuti), cek saldo dan histori, batalkan jika belum diproses.
  - Atasan/Manager: approve/decline pengajuan bawahan langsung.
  - HRD: tetapkan jenis cuti, kuota, carry-over; susun approval flow; setujui/override permintaan; koreksi saldo; delegasi approver; tetapkan jatah libur bersama (kalender libur nasional/perusahaan).
- **Surat Pengajuan (Umum)**
  - Karyawan: pilih kategori surat, isi form, unggah bukti, kirim permintaan; pantau status; unduh surat jika disetujui/dikeluarkan.
  - Atasan/Manager: approve/decline surat yang memerlukan persetujuan atasan (mis. surat tugas).
  - HRD: kelola kategori dan template surat; review/approve/reject permintaan; generate/unggah surat resmi (PDF); catat di audit log.
  - Kategori umum awal: Administrasi HR (Surat Keterangan Kerja/Aktif, Referensi), Operasional/Tugas (Surat Tugas, Perjalanan Dinas), Keuangan (Pinjaman, Biaya Operasional/Reimburse), Perubahan Data (permintaan ubah data/rek bank), Lainnya (custom per kebutuhan).
- **Perjalanan Dinas & Reimburse**
  - Karyawan: ajukan perjalanan dinas, ajukan reimburse terkait (tiket, hotel, transport, uang harian) dengan bukti.
  - Atasan/Manager: approve tahap awal perjalanan/reimburse tim.
  - HRD: tinjau dan setujui/menolak perjalanan dinas dan reimburse; atur kategori biaya dan batas plafon; dukung approval berlapis (atasan → HRD → finance). Reimburse dibayar terpisah (tidak auto-offset payroll).
  - Finance/Payroll: final approval pembayaran, mapping COA, dan penjadwalan pembayaran.
- **Kinerja & KPI**
  - Karyawan: lihat KPI/target numerik pribadi, isi progres/self-check-in; isi self-review jika diaktifkan.
  - Atasan/Manager: tetapkan atau tinjau KPI bawahan (jika diberi hak), pantau progres, berikan feedback.
  - HRD: buat periode KPI/penilaian, tetapkan KPI numerik per karyawan (dengan bobot opsional), monitor progres, kunci hasil.
- **Rincian Gaji/Payroll**
  - Karyawan: lihat slip gaji/rincian komponen (gaji pokok, tunjangan, potongan) sesuai periode yang sudah diterbitkan HRD; akses riwayat slip dalam bentuk PDF.
  - HRD: generate dan terbitkan slip gaji PDF per periode, kelola komponen tunjangan/potongan, koreksi riwayat, kontrol akses dokumen gaji.
  - Finance/Payroll: jalankan payroll, validasi komponen, terbitkan slip batch, ekspor payroll multi-format.
- **Dokumen Karyawan**
  - Karyawan: unggah/lihat dokumen pribadi yang diizinkan (mis. NPWP, BPJS), akses kontrak/SLIP/ surat tugas sesuai izin; unduh dokumen resmi yang diterbitkan HRD.
  - HRD: unggah/kelola dokumen formal (kontrak, surat peringatan, NDA) dengan versi; kontrol akses; arsip/retensi.
  - Atasan/Manager: akses dokumen tugas yang relevan (mis. surat tugas tim) sesuai izin.
- **Onboarding/Offboarding (Roadmap)**
  - Karyawan: lihat checklist pribadi, unggah bukti penyelesaian.
  - Atasan/Manager: pantau progres onboarding tim, tandai tugas selesai bila perlu.
  - HRD: buat template checklist, assign PIC, tutup/arsip checklist, catat asset return.
  - IT/Ops: kelola akses aplikasi/aset pada offboarding.
- **Pengumuman & Kebijakan**
  - Karyawan: baca pengumuman/kebijakan; tandai sudah dibaca; akses riwayat.
  - Atasan/Manager: distribusi/penerus pengumuman ke tim; pantau keterbacaan tim.
  - HRD: publikasi pengumuman per cabang/departemen/role; lacak siapa yang sudah membaca.
- **ID Digital**
  - Karyawan: akses ID digital/QR untuk verifikasi/presensi/tamu.
  - HRD: kelola format ID dan validitas.
  - IT/Ops: integrasi dengan perangkat/akses fisik jika ada.
- **Perubahan Data Bank**
  - Karyawan: ajukan perubahan data bank; lihat riwayat dan status.
  - HRD: review/approve perubahan bank; minta bukti jika perlu (mis. foto buku tabungan).
  - Finance/Payroll: validasi kesesuaian untuk payroll sebelum periode berjalan.
- **Tiket Bantuan (HR/IT)**
  - Karyawan: buat tiket, lampirkan bukti, pantau status.
  - HRD/IT: triase, respon, dan tutup tiket; SLA per kategori; eskalasi ke pihak lain jika diperlukan.
- **Aset yang Dipinjam**
  - Karyawan: lihat daftar aset yang dipinjam, jadwal pengembalian, ajukan perpanjangan.
  - HRD/IT: catat peminjaman/pengembalian aset; reminder otomatis.
- **Reporting & Insight**
  - Karyawan: akses ringkasan pribadi (absensi, cuti, lembur).
  - Atasan/Manager: ringkasan tim (hadir/terlambat/absen, saldo cuti tim, progres KPI).
  - HRD: dashboard menyeluruh (kehadiran, keterlambatan, lembur, saldo cuti, kontrak kedaluwarsa, turnover); heatmap kehadiran per cabang/shift; tren kontrak habis/turnover; KPI per tim; alert kepatuhan (keterlambatan masal, absen kosong); ekspor CSV/Excel; webhook/API (roadmap).
  - Finance/Payroll: laporan payroll, pinjaman outstanding, reimburse dibayar/belum, mapping COA.
- **Admin & Konfigurasi**
  - Karyawan: ganti password, kelola metode login, set notifikasi pribadi.
  - HRD: kelola role/permission, cabang/lokasi, integrasi (payroll ekspor multi-format, SSO roadmap), template notifikasi, pengaturan audit log; kebijakan granular (jadwal/shift per cabang, lembur, cutoff payroll, plafon perjalanan dinas, tier denda keterlambatan); delegasi approver dengan durasi; mapping COA untuk biaya operasional/perjalanan dinas.
  - Finance/Payroll: konfigurasi payroll run, komponen gaji, COA, kalender payroll.
  - IT/Ops: kelola SSO, IP allowlist/geofence, perangkat, audit log, API key/token.
  - Super Admin/Tenant Admin: kelola tenant, branding, domain, batas cabang, admin per perusahaan; kontrol hak akses lintas tenant.
- **Template & Automation**
  - HRD: kelola library template surat/kontrak; auto-reminder untuk kontrak habis, saldo cuti kadaluarsa, tiket mendekati SLA.
- **Bulk Actions**
  - HRD: impor/mutasi massal data (cabang/departemen), publish slip gaji batch, approval massal (cuti/reimburse/perjalanan dinas).
- **Compliance & Audit**
  - HRD: akses log perubahan data sensitif (gaji/bank), log unduhan slip/dokumen; ekspor log untuk audit eksternal; audit trail approval.
- **Delegasi & Substitusi**
  - HRD: set pengganti approver sementara; kontrol periode aktif.

## Alur Approval Default
- Cuti/Izin: Karyawan → Atasan/Manager → HRD.
- Koreksi Absensi: Karyawan → Atasan/Manager → HRD.
- Tukar/Cover Shift: Karyawan → Rekan (persetujuan) → Atasan/Manager (opsional HRD final).
- Perjalanan Dinas & Reimburse: Karyawan → Atasan/Manager → HRD → Finance/Payroll (final pembayaran).
- Pinjaman/Biaya Operasional: Karyawan → Atasan/Manager → HRD/Finance (sesuai kebijakan).
- Perubahan Data Bank: Karyawan → HRD → Finance/Payroll (validasi sebelum payroll).
- Surat Pengajuan: Karyawan → Atasan/Manager (jika terkait tugas/operasional) → HRD (penerbitan).
- KPI: HRD set periode, Atasan/Manager set/monitor target tim, HRD kunci hasil akhir.
- Slip Gaji: Finance/Payroll menyiapkan dan publish; HRD dapat kontrol akses/validasi.

## Aturan Umum Akses
- RBAC: Karyawan hanya dapat melihat/mengedit data pribadi; HRD memiliki akses lintas cabang sesuai izin cabang; semua tindakan tercatat di audit log.
- Approval: alur default cuti/izin/koreksi absensi melewati atasan langsung lalu HRD; HRD dapat override jika diperlukan dengan jejak audit.
- Data sensitif: dokumen gaji/kontrak dibatasi; hanya HRD dan pemilik data yang dapat mengakses sesuai pengaturan.
- Multi-cabang: HRD dapat dibatasi per cabang; kebijakan jadwal/cuti dapat berbeda per cabang.
- Pelanggaran: notifikasi pelanggaran dikirim HRD ke karyawan terkait, memuat jenis pelanggaran dan konsekuensi; catat di audit log dan histori karyawan.
- Kanal notifikasi: email dan in-app notification; pastikan karyawan tetap dapat mengakses riwayat notifikasi; target SLA pengiriman < 5 menit untuk event kritikal (pelanggaran, approval).
- Audit log wajib untuk aksi sensitif (publish slip gaji, perubahan data bank, ekspor payroll/data massal, penerbitan surat, perubahan role/permission).
- Tenant isolation: data antar perusahaan terpisah; akses lintas tenant hanya untuk Super Admin/Tenant Admin sesuai mandat.
- Akses login: semua halaman/fitur hanya dapat diakses setelah login; tampilan awal (unauthenticated) hanya logo + form login/registrasi; redirect pasca login menyesuaikan role.

## Catatan Implementasi
- Pastikan UI memisahkan menu Karyawan vs HRD; sembunyikan aksi yang tidak relevan.
- Endpoint/API harus memvalidasi role dan scope cabang/organisasi.
- Audit trail aktif untuk perubahan data master, approval, dan dokumen.

---

## Permission Matrix

### Legenda
| Simbol | Aksi |
|--------|------|
| **C** | Create |
| **R** | Read |
| **U** | Update |
| **D** | Delete |
| **A** | Approve |
| **E** | Export |

| Scope | Deskripsi |
|-------|-----------|
| `own` | Data milik sendiri |
| `team` | Data bawahan langsung |
| `branch` | Data dalam cabang yang sama |
| `tenant` | Semua data dalam tenant |
| `all` | Lintas tenant (Super Admin) |

### Data Karyawan & Profil

| Resource | Karyawan | Manager | HRD | Finance | IT/Ops | Super Admin |
|----------|:--------:|:-------:|:---:|:-------:|:------:|:-----------:|
| Profile - Read | own | team | tenant | tenant* | tenant | all |
| Profile - Update | own* | - | tenant | - | - | all |
| Profile - Create | - | - | tenant | - | - | all |
| Bank Info - Read | own | - | tenant | tenant | - | all |
| Bank Info - Change Request | C own | - | A tenant | A tenant | - | all |
| Emergency Contact | RU own | - | RU tenant | - | - | all |

> *own* = hanya field terbatas (phone, address, emergency)
> *tenant* = Finance hanya field terkait payroll

### Absensi & Jadwal

| Resource | Karyawan | Manager | HRD | Finance | IT/Ops | Super Admin |
|----------|:--------:|:-------:|:---:|:-------:|:------:|:-----------:|
| Clock In/Out | C own | - | - | - | - | - |
| Attendance - Read | R own | R team | R tenant | R tenant | R tenant | R all |
| Attendance - Export | - | - | E tenant | E tenant | - | E all |
| Correction - Request | C own | - | - | - | - | - |
| Correction - Approve | - | A team | A tenant | - | - | A all |
| Shift Swap - Request | C own | - | - | - | - | - |
| Shift Swap - Approve | - | A team | A tenant | - | - | A all |
| Schedule - Configure | - | - | CRU tenant | - | - | CRUD all |
| Geofence - Configure | - | - | - | - | CRU tenant | CRUD all |

### Cuti & Izin

| Resource | Karyawan | Manager | HRD | Finance | IT/Ops | Super Admin |
|----------|:--------:|:-------:|:---:|:-------:|:------:|:-----------:|
| Leave - Request | C own | - | - | - | - | - |
| Leave - Cancel | D own* | - | D tenant | - | - | D all |
| Leave - Approve L1 | - | A team | - | - | - | - |
| Leave - Approve Final | - | - | A tenant | - | - | A all |
| Leave Balance - Read | R own | R team | R tenant | R tenant | - | R all |
| Leave Balance - Adjust | - | - | U tenant | - | - | U all |
| Leave Type - Config | - | - | CRUD tenant | - | - | CRUD all |

> *own* = hanya status pending

### Perjalanan Dinas & Reimburse

| Resource | Karyawan | Manager | HRD | Finance | IT/Ops | Super Admin |
|----------|:--------:|:-------:|:---:|:-------:|:------:|:-----------:|
| Travel - Request | C own | - | - | - | - | - |
| Travel - Approve L1 | - | A team | - | - | - | - |
| Travel - Approve L2 | - | - | A tenant | - | - | A all |
| Expense - Request | C own | - | - | - | - | - |
| Expense - Approve | - | A team | A tenant | A tenant | - | A all |
| Expense - Mark Paid | - | - | - | U tenant | - | U all |
| Expense Category | - | - | CRU tenant | CRU tenant | - | CRUD all |

### Slip Gaji & Payroll

| Resource | Karyawan | Manager | HRD | Finance | IT/Ops | Super Admin |
|----------|:--------:|:-------:|:---:|:-------:|:------:|:-----------:|
| Payslip - Read | R own | - | R tenant | R tenant | - | R all |
| Payslip - Download | R own | - | R tenant | R tenant | - | R all |
| Payslip - Generate | - | - | C tenant | C tenant | - | C all |
| Payslip - Publish | - | - | U tenant | U tenant | - | U all |
| Payroll - Export | - | - | E tenant | E tenant | - | E all |
| Payroll Component | - | - | CRU tenant | CRU tenant | - | CRUD all |

### KPI & Kinerja

| Resource | Karyawan | Manager | HRD | Finance | IT/Ops | Super Admin |
|----------|:--------:|:-------:|:---:|:-------:|:------:|:-----------:|
| KPI Goal - Read | R own | R team | R tenant | - | - | R all |
| KPI Goal - Create | - | C team | C tenant | - | - | C all |
| KPI Progress - Update | U own | - | - | - | - | - |
| KPI - Comment | CRU own | CRU team | CRU tenant | - | - | CRUD all |
| KPI Cycle - Config | - | - | CRUD tenant | - | - | CRUD all |

### Dokumen & Surat

| Resource | Karyawan | Manager | HRD | Finance | IT/Ops | Super Admin |
|----------|:--------:|:-------:|:---:|:-------:|:------:|:-----------:|
| Personal Doc - Access | RU own | - | RU tenant | - | - | CRUD all |
| Official Doc - Access | R own | R team* | CRUD tenant | - | - | CRUD all |
| Letter - Request | C own | - | - | - | - | - |
| Letter - Approve | - | A team* | A tenant | - | - | A all |
| Letter - Issue | - | - | CU tenant | - | - | CU all |

> *team* = hanya surat yang memerlukan persetujuan atasan

### Admin & Konfigurasi

| Resource | Karyawan | Manager | HRD | Finance | IT/Ops | Super Admin |
|----------|:--------:|:-------:|:---:|:-------:|:------:|:-----------:|
| Branch/Dept/Position | - | - | CRUD tenant | - | - | CRUD all |
| Shift Config | - | - | CRUD tenant | - | - | CRUD all |
| Holiday Config | - | - | CRUD tenant | - | - | CRUD all |
| User - Manage | - | - | CRU tenant | - | CRU tenant | CRUD all |
| Role - Assign | - | - | U tenant | - | U tenant | U all |
| Audit Log | - | - | RE tenant | RE tenant | RE tenant | RE all |
| API Key | - | - | - | - | CRUD tenant | CRUD all |
| Tenant Config | - | - | - | - | - | CRUD all |

---

## Edge Cases

### Karyawan dengan Multiple Roles
- User mendapat gabungan (union) permission dari semua role
- Scope terluas yang berlaku

### Self-Approval Prevention
- Tidak boleh approve pengajuan sendiri
- Sistem otomatis skip ke approver berikutnya

### Delegasi Approver
- Hanya untuk approval, bukan akses data
- Waktu berlaku terbatas (start_date, end_date)
- Tercatat dalam audit log

### HRD Multi-Branch
- HRD dapat di-assign ke specific branches atau "all branches"
- Query difilter sesuai branch assignment

---

## Dokumen Terkait
- [concept.md](../01-overview/concept.md) - Konsep dan persona
- [roles-summary.md](roles-summary.md) - Ringkasan role
- [security.md](../07-operations/security.md) - Kebijakan keamanan
- [glossary.md](../01-overview/glossary.md) - Daftar istilah
