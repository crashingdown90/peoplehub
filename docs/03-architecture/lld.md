# Low-Level Design (LLD) PeopleHub

## Entitas Utama (ringkas)
- Tenant(`id`, `name`, `branding`, `domain`)
- User(`id`, `tenant_id`, `email`, `phone`, `password_hash`, `status`, `role`)
- Employee(`id`, `tenant_id`, `user_id`, `name`, `branch_id`, `dept_id`, `position_id`, `manager_id`, `employment_type`, `work_mode`, `start_date`)
- Branch/Dept/Position (hirarki organisasi)
- Schedule(`id`, `tenant_id`, `employee_id`, `date`, `shift_id`, `work_mode`)
- Attendance(`id`, `tenant_id`, `employee_id`, `date`, `clock_in`, `clock_out`, `mode`, `location`, `device`, `status`, `late_minutes`, `deduction_applied`)
- AttendanceCorrection(`id`, `tenant_id`, `employee_id`, `date`, `reason`, `evidence_url`, `status`, approver refs)
- ShiftSwap(`id`, `tenant_id`, `requester_id`, `partner_id`, `shift_date`, `status`, approvals)
- LeaveBalance(`id`, `tenant_id`, `employee_id`, `type`, `balance`, `expiry`)
- LeaveRequest(`id`, `tenant_id`, `employee_id`, `type`, `start`, `end`, `days`, `status`, approvals)
- TravelRequest/Expense(`id`, `tenant_id`, `employee_id`, `trip_date`, `category`, `amount`, `currency`, `proof_url`, `status`, approvals)
- CashAdvance(`id`, `tenant_id`, `employee_id`, `amount`, `status`, `repayment_plan`)
- PayrollComponent(`id`, `tenant_id`, `name`, `type`, `coa_code`, `is_recurring`)
- Payslip(`id`, `tenant_id`, `employee_id`, `period`, `gross`, `deduction`, `net`, `pdf_url`, `status`)
- KPI/PerformanceCycle/Goal(`id`, `tenant_id`, `employee_id`, `period`, `target`, `weight`, `progress`, `status`)
- Document(`id`, `tenant_id`, `employee_id`, `type`, `url`, `version`, `access_scope`)
- LetterRequest(`id`, `tenant_id`, `employee_id`, `category`, `payload`, `status`, `letter_url`)
- Announcement(`id`, `tenant_id`, `audience`, `title`, `body`, `status`)
- ViolationNotice(`id`, `tenant_id`, `employee_id`, `type`, `consequence`, `status`, `notified_at`)
- Ticket(`id`, `tenant_id`, `employee_id`, `category`, `priority`, `status`, `assignee_id`)
- AssetLoan(`id`, `tenant_id`, `employee_id`, `asset`, `checkout_at`, `due_at`, `return_at`, `status`)
- AuditLog(`id`, `tenant_id`, `actor_id`, `action`, `object`, `object_id`, `before`, `after`, `ip`, `user_agent`, `ts`)

## Pola Akses Data
- Semua query wajib filter `tenant_id`.
- Index utama: `(tenant_id, employee_id, date)` untuk Attendance; `(tenant_id, employee_id, period)` untuk Payslip/KPI; `(tenant_id, status, created_at)` untuk pengajuan.
- Partial index untuk status aktif/pending bila diperlukan.

## Alur Inti (ringkas)
- Registrasi: User create → status pending → HRD approve → Employee dibuat/di-link → notifikasi.
- Absensi: Karyawan clock in/out (simpatikan mode WFO/WFH, lokasi/device) → hitung keterlambatan/denda → rekam Attendance → notifikasi jika terlambat masal (opsional).
- Koreksi absensi: Karyawan ajukan + bukti → Atasan approve → HRD final → update Attendance dan audit.
- Tukar shift: Requester pilih rekan/shift → Partner setuju → Atasan approve → update Schedule/Attendance plan.
- Cuti: Ajukan → validasi saldo → Atasan approve → HRD final → potong saldo → sinkron jadwal.
- Travel/Reimburse: Ajukan + bukti + kategori/plafon → Atasan approve → HRD validasi → Finance final → tandai pembayaran.
- Slip gaji: Finance/HRD generate komponen → render PDF per karyawan → simpan ke storage → catat AuditLog → notifikasi karyawan.
- KPI: HRD buat periode/target → Atasan monitor → Karyawan update progres → HRD kunci hasil.
- Surat: Karyawan pilih kategori → isi payload → Atasan (jika perlu) → HRD terbitkan PDF → simpan + audit.
- Pelanggaran: HRD kirim notice (jenis, konsekuensi) → notifikasi email + in-app → simpan ke log/histori.

## API (contoh endpoint ringkas)
- Auth/Tenant: `POST /auth/register`, `POST /auth/login`, `POST /auth/approve-user/:id`, `GET /tenants/current`
- Attendance: `POST /attendance/clock-in`, `POST /attendance/clock-out`, `POST /attendance/corrections`, `GET /attendance/recap`
- Leave: `POST /leave/requests`, `GET /leave/balance`, `POST /leave/requests/:id/approve|reject`
- Shift Swap: `POST /shifts/swap`, `POST /shifts/swap/:id/approve`
- Travel/Expense: `POST /travel/requests`, `POST /expenses`, `POST /expenses/:id/approve`
- Payroll: `POST /payslips/generate`, `GET /payslips/me`, `GET /payslips/export`
- KPI: `POST /kpi/cycles`, `POST /kpi/goals`, `POST /kpi/goals/:id/progress`
- Documents/Letters: `POST /letters`, `POST /letters/:id/approve`, `GET /documents/me`
- Announcement/Violation: `POST /announcements`, `GET /announcements`, `POST /violations`
- Ticket/Asset: `POST /tickets`, `POST /tickets/:id/respond`, `GET /assets/loans`

## Validasi & Aturan Bisnis
- Saldo cuti >= 0 sebelum approve; blok jika melewati limit.
- Denda keterlambatan: hitung per menit/blok sesuai konfigurasi cabang/tipe karyawan.
- Reimburse: validasi plafon kategori; wajib bukti; perjalanan dinas terkait jika ada.
- Perubahan bank: wajib approval HRD + Finance sebelum payroll berjalan.
- Slip gaji: hanya bisa diunduh oleh pemilik dan peran berwenang; URL bertanda tangan/akses terproteksi.

## Keamanan & Audit
- Semua endpoint cek role + scope tenant; atasan hanya akses bawahan langsung.
- AuditLog untuk aksi sensitif (bank, slip, ekspor, role change, surat terbit).
- Rate limit login/OTP; password hash; TLS; opsi 2FA/SSO.

## Deployment & Config
- Config via env; pemisahan dev/staging/prod; DB migrasi sebelum/bersamaan deploy.
- Backup DB harian; log rotation; monitoring slow query dan error rate; health check endpoint.
