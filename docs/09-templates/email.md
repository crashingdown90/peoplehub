# Email Templates PeopleHub

## Ringkasan
Dokumen ini berisi template email untuk semua notifikasi sistem PeopleHub. Setiap template menggunakan format HTML dengan placeholder yang akan diganti dengan data dinamis.

---

## 1. Konfigurasi Email

### 1.1 Header Default

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #0F172A;
      margin: 0;
      padding: 0;
      background-color: #F1F5F9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #2563EB;
      color: #FFFFFF;
      padding: 24px;
      text-align: center;
    }
    .header img {
      max-height: 40px;
      margin-bottom: 8px;
    }
    .content {
      padding: 32px 24px;
    }
    .footer {
      background-color: #F8FAFC;
      padding: 16px 24px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
    }
    .button {
      display: inline-block;
      background-color: #2563EB;
      color: #FFFFFF !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #1D4ED8;
    }
    .info-box {
      background-color: #F1F5F9;
      border-left: 4px solid #2563EB;
      padding: 16px;
      margin: 16px 0;
      border-radius: 0 4px 4px 0;
    }
    .success-box {
      background-color: #DCFCE7;
      border-left: 4px solid #16A34A;
      padding: 16px;
      margin: 16px 0;
      border-radius: 0 4px 4px 0;
    }
    .warning-box {
      background-color: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 16px;
      margin: 16px 0;
      border-radius: 0 4px 4px 0;
    }
    .error-box {
      background-color: #FEE2E2;
      border-left: 4px solid #DC2626;
      padding: 16px;
      margin: 16px 0;
      border-radius: 0 4px 4px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #E2E8F0;
    }
    th {
      background-color: #F8FAFC;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success { background-color: #DCFCE7; color: #166534; }
    .badge-warning { background-color: #FEF3C7; color: #92400E; }
    .badge-error { background-color: #FEE2E2; color: #991B1B; }
    .badge-info { background-color: #DBEAFE; color: #1E40AF; }
  </style>
</head>
```

### 1.2 Placeholder Variables

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `{{tenant_name}}` | Nama perusahaan | PT. KREATIFINDO ABADI SEJAHTERA |
| `{{tenant_logo}}` | URL logo tenant | https://cdn.../logo.png |
| `{{employee_name}}` | Nama karyawan | John Doe |
| `{{app_url}}` | URL aplikasi | https://peoplehub.kreatifindo.com |
| `{{current_year}}` | Tahun saat ini | 2024 |
| `{{support_email}}` | Email support | support@peoplehub.kreatifindo.com |

---

## 2. Authentication Emails

### 2.1 Registration Submitted

**Subject:** Pendaftaran Akun PeopleHub - Menunggu Persetujuan

```html
<body>
  <div class="container">
    <div class="header">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub</h1>
    </div>
    <div class="content">
      <h2>Halo {{employee_name}},</h2>

      <p>Terima kasih telah mendaftar di PeopleHub.</p>

      <div class="info-box">
        <strong>Status Pendaftaran:</strong> Menunggu Persetujuan HRD
      </div>

      <p>Tim HRD akan meninjau data Anda dan memberikan keputusan dalam 1-3 hari kerja. Anda akan menerima email notifikasi setelah akun Anda disetujui atau jika ada informasi tambahan yang diperlukan.</p>

      <p><strong>Data yang Anda daftarkan:</strong></p>
      <table>
        <tr>
          <th>Nama Lengkap</th>
          <td>{{employee_name}}</td>
        </tr>
        <tr>
          <th>Email</th>
          <td>{{email}}</td>
        </tr>
        <tr>
          <th>Nomor Telepon</th>
          <td>{{phone}}</td>
        </tr>
        <tr>
          <th>Tanggal Daftar</th>
          <td>{{registration_date}}</td>
        </tr>
      </table>

      <p>Jika Anda tidak merasa mendaftar, silakan abaikan email ini atau hubungi HRD.</p>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{tenant_name}}. All rights reserved.</p>
      <p>Email ini dikirim otomatis, mohon tidak membalas email ini.</p>
    </div>
  </div>
</body>
```

### 2.2 Registration Approved

**Subject:** Selamat! Akun PeopleHub Anda Telah Aktif

```html
<body>
  <div class="container">
    <div class="header">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub</h1>
    </div>
    <div class="content">
      <h2>Selamat {{employee_name}}!</h2>

      <div class="success-box">
        <strong>Akun Anda telah disetujui dan aktif.</strong>
      </div>

      <p>Anda sekarang dapat login ke PeopleHub dan mulai menggunakan semua fitur yang tersedia.</p>

      <p><strong>Informasi Akun:</strong></p>
      <table>
        <tr>
          <th>Nomor Karyawan</th>
          <td>{{employee_number}}</td>
        </tr>
        <tr>
          <th>Cabang</th>
          <td>{{branch_name}}</td>
        </tr>
        <tr>
          <th>Departemen</th>
          <td>{{department_name}}</td>
        </tr>
        <tr>
          <th>Jabatan</th>
          <td>{{position_name}}</td>
        </tr>
        <tr>
          <th>Atasan</th>
          <td>{{manager_name}}</td>
        </tr>
        <tr>
          <th>Tipe Karyawan</th>
          <td>{{employment_type}}</td>
        </tr>
        <tr>
          <th>Tanggal Mulai</th>
          <td>{{start_date}}</td>
        </tr>
      </table>

      <div style="text-align: center;">
        <a href="{{app_url}}/login" class="button">Login Sekarang</a>
      </div>

      <p><strong>Yang dapat Anda lakukan:</strong></p>
      <ul>
        <li>Absen harian (Clock In/Out) dengan foto selfie</li>
        <li>Mengajukan cuti dan izin</li>
        <li>Melihat slip gaji</li>
        <li>Mengajukan reimburse dan perjalanan dinas</li>
        <li>Dan masih banyak lagi!</li>
      </ul>

      <p>Jika Anda memiliki pertanyaan, silakan hubungi HRD atau buat tiket bantuan di aplikasi.</p>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{tenant_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
```

### 2.3 Registration Rejected

**Subject:** Pendaftaran Akun PeopleHub Ditolak

```html
<body>
  <div class="container">
    <div class="header">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub</h1>
    </div>
    <div class="content">
      <h2>Halo {{employee_name}},</h2>

      <div class="error-box">
        <strong>Mohon maaf, pendaftaran akun Anda ditolak.</strong>
      </div>

      <p><strong>Alasan penolakan:</strong></p>
      <p style="padding: 16px; background-color: #F8FAFC; border-radius: 4px;">
        {{rejection_reason}}
      </p>

      <p>Jika Anda merasa ini adalah kesalahan atau membutuhkan klarifikasi, silakan hubungi HRD di:</p>
      <ul>
        <li>Email: {{hrd_email}}</li>
        <li>Telepon: {{hrd_phone}}</li>
      </ul>

      <p>Anda dapat mendaftar ulang setelah melengkapi persyaratan yang diperlukan.</p>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{tenant_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
```

### 2.4 Password Reset

**Subject:** Reset Password Akun PeopleHub

```html
<body>
  <div class="container">
    <div class="header">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub</h1>
    </div>
    <div class="content">
      <h2>Halo {{employee_name}},</h2>

      <p>Kami menerima permintaan untuk reset password akun PeopleHub Anda.</p>

      <div class="warning-box">
        <strong>Link ini akan kadaluarsa dalam 1 jam.</strong>
      </div>

      <div style="text-align: center;">
        <a href="{{reset_link}}" class="button">Reset Password</a>
      </div>

      <p>Atau copy link berikut ke browser Anda:</p>
      <p style="word-break: break-all; padding: 12px; background-color: #F8FAFC; border-radius: 4px; font-size: 12px;">
        {{reset_link}}
      </p>

      <p><strong>Jika Anda tidak meminta reset password:</strong></p>
      <ul>
        <li>Abaikan email ini</li>
        <li>Password Anda tetap aman</li>
        <li>Laporkan ke HRD jika mencurigakan</li>
      </ul>

      <p style="font-size: 12px; color: #64748B;">
        Permintaan dari IP: {{request_ip}}<br>
        Waktu: {{request_time}}
      </p>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{tenant_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
```

---

## 3. Attendance Emails

### 3.1 Late Notification (to Employee)

**Subject:** Notifikasi Keterlambatan - {{attendance_date}}

```html
<body>
  <div class="container">
    <div class="header">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub</h1>
    </div>
    <div class="content">
      <h2>Notifikasi Keterlambatan</h2>

      <div class="warning-box">
        Anda tercatat terlambat <strong>{{late_minutes}} menit</strong> pada tanggal {{attendance_date}}.
      </div>

      <table>
        <tr>
          <th>Tanggal</th>
          <td>{{attendance_date}}</td>
        </tr>
        <tr>
          <th>Jadwal Masuk</th>
          <td>{{scheduled_time}}</td>
        </tr>
        <tr>
          <th>Waktu Clock In</th>
          <td>{{clock_in_time}}</td>
        </tr>
        <tr>
          <th>Keterlambatan</th>
          <td>{{late_minutes}} menit</td>
        </tr>
        <tr>
          <th>Potongan</th>
          <td>Rp {{late_deduction}}</td>
        </tr>
      </table>

      <p>Jika Anda merasa ada kesalahan, silakan ajukan koreksi absensi melalui aplikasi.</p>

      <div style="text-align: center;">
        <a href="{{app_url}}/attendance/correction" class="button">Ajukan Koreksi</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{tenant_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
```

### 3.2 Late Alert (to Manager/HRD)

**Subject:** [Alert] Keterlambatan Massal - {{branch_name}} - {{date}}

```html
<body>
  <div class="container">
    <div class="header" style="background-color: #F59E0B;">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub - Alert</h1>
    </div>
    <div class="content">
      <h2>Alert: Keterlambatan Massal</h2>

      <div class="warning-box">
        <strong>{{late_count}} karyawan</strong> tercatat terlambat di {{branch_name}} pada {{date}}.
      </div>

      <p><strong>Ringkasan:</strong></p>
      <table>
        <tr>
          <th>Cabang</th>
          <td>{{branch_name}}</td>
        </tr>
        <tr>
          <th>Total Karyawan</th>
          <td>{{total_employees}}</td>
        </tr>
        <tr>
          <th>Hadir Tepat Waktu</th>
          <td>{{on_time_count}}</td>
        </tr>
        <tr>
          <th>Terlambat</th>
          <td><span class="badge badge-warning">{{late_count}}</span></td>
        </tr>
        <tr>
          <th>Persentase Terlambat</th>
          <td>{{late_percentage}}%</td>
        </tr>
      </table>

      <p><strong>Daftar Karyawan Terlambat:</strong></p>
      <table>
        <tr>
          <th>Nama</th>
          <th>Departemen</th>
          <th>Clock In</th>
          <th>Terlambat</th>
        </tr>
        {{#each late_employees}}
        <tr>
          <td>{{name}}</td>
          <td>{{department}}</td>
          <td>{{clock_in_time}}</td>
          <td>{{late_minutes}} menit</td>
        </tr>
        {{/each}}
      </table>

      <div style="text-align: center;">
        <a href="{{app_url}}/admin/attendance?date={{date}}&branch={{branch_id}}" class="button">Lihat Detail</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{tenant_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
```

---

## 4. Leave Request Emails

### 4.1 Leave Request Submitted (to Approver)

**Subject:** [Perlu Approval] Pengajuan Cuti - {{employee_name}}

```html
<body>
  <div class="container">
    <div class="header">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub</h1>
    </div>
    <div class="content">
      <h2>Pengajuan Cuti Baru</h2>

      <div class="info-box">
        <strong>{{employee_name}}</strong> mengajukan cuti dan membutuhkan persetujuan Anda.
      </div>

      <table>
        <tr>
          <th>Pengaju</th>
          <td>{{employee_name}} ({{employee_number}})</td>
        </tr>
        <tr>
          <th>Departemen</th>
          <td>{{department_name}}</td>
        </tr>
        <tr>
          <th>Jenis Cuti</th>
          <td>{{leave_type}}</td>
        </tr>
        <tr>
          <th>Tanggal</th>
          <td>{{start_date}} s/d {{end_date}}</td>
        </tr>
        <tr>
          <th>Jumlah Hari</th>
          <td>{{total_days}} hari</td>
        </tr>
        <tr>
          <th>Saldo Tersisa</th>
          <td>{{remaining_balance}} hari (setelah approve: {{balance_after}} hari)</td>
        </tr>
        <tr>
          <th>Alasan</th>
          <td>{{reason}}</td>
        </tr>
        {{#if delegate_to}}
        <tr>
          <th>Delegasi Tugas</th>
          <td>{{delegate_to}}</td>
        </tr>
        {{/if}}
        {{#if attachment_url}}
        <tr>
          <th>Lampiran</th>
          <td><a href="{{attachment_url}}">Lihat Lampiran</a></td>
        </tr>
        {{/if}}
      </table>

      <div style="text-align: center; margin: 24px 0;">
        <a href="{{app_url}}/approvals/{{request_id}}/approve" class="button" style="background-color: #16A34A;">Approve</a>
        &nbsp;&nbsp;
        <a href="{{app_url}}/approvals/{{request_id}}/reject" class="button" style="background-color: #DC2626;">Reject</a>
      </div>

      <div style="text-align: center;">
        <a href="{{app_url}}/approvals" style="color: #2563EB;">Lihat Semua Pengajuan</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{tenant_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
```

### 4.2 Leave Request Approved

**Subject:** Pengajuan Cuti Disetujui - {{start_date}} s/d {{end_date}}

```html
<body>
  <div class="container">
    <div class="header">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub</h1>
    </div>
    <div class="content">
      <h2>Cuti Anda Disetujui</h2>

      <div class="success-box">
        Pengajuan cuti Anda telah <strong>disetujui</strong>.
      </div>

      <table>
        <tr>
          <th>Jenis Cuti</th>
          <td>{{leave_type}}</td>
        </tr>
        <tr>
          <th>Tanggal</th>
          <td>{{start_date}} s/d {{end_date}}</td>
        </tr>
        <tr>
          <th>Jumlah Hari</th>
          <td>{{total_days}} hari</td>
        </tr>
        <tr>
          <th>Saldo Tersisa</th>
          <td>{{remaining_balance}} hari</td>
        </tr>
        <tr>
          <th>Disetujui Oleh</th>
          <td>{{approved_by}}</td>
        </tr>
        {{#if comment}}
        <tr>
          <th>Catatan</th>
          <td>{{comment}}</td>
        </tr>
        {{/if}}
      </table>

      <p>Selamat menikmati cuti Anda. Jangan lupa untuk memastikan tugas-tugas penting sudah di-delegasikan.</p>

      <div style="text-align: center;">
        <a href="{{app_url}}/leave/requests" class="button">Lihat Detail</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{tenant_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
```

### 4.3 Leave Request Rejected

**Subject:** Pengajuan Cuti Ditolak - {{start_date}} s/d {{end_date}}

```html
<body>
  <div class="container">
    <div class="header">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub</h1>
    </div>
    <div class="content">
      <h2>Pengajuan Cuti Ditolak</h2>

      <div class="error-box">
        Mohon maaf, pengajuan cuti Anda <strong>ditolak</strong>.
      </div>

      <table>
        <tr>
          <th>Jenis Cuti</th>
          <td>{{leave_type}}</td>
        </tr>
        <tr>
          <th>Tanggal</th>
          <td>{{start_date}} s/d {{end_date}}</td>
        </tr>
        <tr>
          <th>Ditolak Oleh</th>
          <td>{{rejected_by}}</td>
        </tr>
        <tr>
          <th>Alasan Penolakan</th>
          <td style="color: #DC2626;">{{rejection_reason}}</td>
        </tr>
      </table>

      <p>Silakan ajukan ulang dengan tanggal berbeda atau hubungi atasan Anda untuk diskusi lebih lanjut.</p>

      <div style="text-align: center;">
        <a href="{{app_url}}/leave/new" class="button">Ajukan Cuti Baru</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{tenant_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
```

---

## 5. Payslip Emails

### 5.1 Payslip Published

**Subject:** Slip Gaji {{period}} Telah Tersedia

```html
<body>
  <div class="container">
    <div class="header">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub</h1>
    </div>
    <div class="content">
      <h2>Slip Gaji Anda Tersedia</h2>

      <div class="success-box">
        Slip gaji periode <strong>{{period}}</strong> telah diterbitkan.
      </div>

      <table>
        <tr>
          <th>Periode</th>
          <td>{{period}}</td>
        </tr>
        <tr>
          <th>Gaji Kotor</th>
          <td>Rp {{gross_salary}}</td>
        </tr>
        <tr>
          <th>Total Potongan</th>
          <td>Rp {{total_deductions}}</td>
        </tr>
        <tr>
          <th style="font-size: 16px; color: #16A34A;">Gaji Bersih</th>
          <td style="font-size: 16px; color: #16A34A; font-weight: bold;">Rp {{net_salary}}</td>
        </tr>
      </table>

      <p>Untuk melihat rincian lengkap dan mengunduh slip gaji, silakan login ke aplikasi.</p>

      <div style="text-align: center;">
        <a href="{{app_url}}/payslips/{{payslip_id}}" class="button">Lihat Slip Gaji</a>
      </div>

      <p style="font-size: 12px; color: #64748B; margin-top: 24px;">
        <strong>Catatan:</strong> Slip gaji bersifat rahasia. Jangan bagikan informasi ini kepada pihak lain.
      </p>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{tenant_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
```

---

## 6. Violation Notice Emails

### 6.1 Violation Notice

**Subject:** [Penting] Notifikasi Pelanggaran - {{violation_type}}

```html
<body>
  <div class="container">
    <div class="header" style="background-color: #DC2626;">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub - Notifikasi Penting</h1>
    </div>
    <div class="content">
      <h2>Notifikasi Pelanggaran</h2>

      <div class="error-box">
        <strong>Jenis Pelanggaran:</strong> {{violation_type}}
      </div>

      <p>Kepada Yth. {{employee_name}},</p>

      <p>Dengan ini kami sampaikan bahwa Anda tercatat melakukan pelanggaran sebagai berikut:</p>

      <table>
        <tr>
          <th>Jenis Pelanggaran</th>
          <td>{{violation_type}}</td>
        </tr>
        <tr>
          <th>Tanggal Kejadian</th>
          <td>{{violation_date}}</td>
        </tr>
        <tr>
          <th>Deskripsi</th>
          <td>{{description}}</td>
        </tr>
        <tr>
          <th style="color: #DC2626;">Konsekuensi/Sanksi</th>
          <td style="color: #DC2626;">{{consequence}}</td>
        </tr>
      </table>

      <p>Mohon untuk memperbaiki perilaku dan mematuhi peraturan perusahaan yang berlaku.</p>

      <p>Jika Anda merasa notifikasi ini tidak tepat, silakan hubungi HRD untuk klarifikasi.</p>

      <div style="text-align: center;">
        <a href="{{app_url}}/violations/{{notice_id}}/acknowledge" class="button">Konfirmasi Telah Membaca</a>
      </div>

      <p style="font-size: 12px; color: #64748B; margin-top: 24px;">
        Notifikasi ini dikirim oleh: {{issued_by}}<br>
        Tanggal: {{issued_date}}
      </p>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} {{tenant_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
```

---

## 7. Daily Digest Emails

### 7.1 Manager Daily Digest

**Subject:** [Digest] Ringkasan Tim Anda - {{date}}

```html
<body>
  <div class="container">
    <div class="header">
      <img src="{{tenant_logo}}" alt="{{tenant_name}}">
      <h1 style="margin: 0; font-size: 20px;">PeopleHub - Daily Digest</h1>
    </div>
    <div class="content">
      <h2>Ringkasan Harian Tim Anda</h2>
      <p style="color: #64748B;">{{date}}</p>

      <h3>Kehadiran Hari Ini</h3>
      <table>
        <tr>
          <td style="text-align: center; padding: 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #16A34A;">{{present_count}}</div>
            <div style="font-size: 12px; color: #64748B;">Hadir</div>
          </td>
          <td style="text-align: center; padding: 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #F59E0B;">{{late_count}}</div>
            <div style="font-size: 12px; color: #64748B;">Terlambat</div>
          </td>
          <td style="text-align: center; padding: 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #DC2626;">{{absent_count}}</div>
            <div style="font-size: 12px; color: #64748B;">Tidak Hadir</div>
          </td>
          <td style="text-align: center; padding: 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #2563EB;">{{leave_count}}</div>
            <div style="font-size: 12px; color: #64748B;">Cuti</div>
          </td>
        </tr>
      </table>

      {{#if pending_approvals}}
      <h3>Menunggu Approval Anda</h3>
      <table>
        <tr>
          <th>Tipe</th>
          <th>Dari</th>
          <th>Detail</th>
          <th>Submitted</th>
        </tr>
        {{#each pending_approvals}}
        <tr>
          <td><span class="badge badge-info">{{type}}</span></td>
          <td>{{employee_name}}</td>
          <td>{{summary}}</td>
          <td>{{submitted_at}}</td>
        </tr>
        {{/each}}
      </table>
      {{/if}}

      <div style="text-align: center;">
        <a href="{{app_url}}/dashboard" class="button">Buka Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>Anda menerima email ini karena mengaktifkan digest harian.</p>
      <p><a href="{{app_url}}/settings/notifications">Ubah Preferensi</a></p>
    </div>
  </div>
</body>
```

---

## 8. Implementation Notes

### 8.1 Template Engine

```typescript
// Menggunakan Handlebars untuk templating
import Handlebars from 'handlebars';

// Register helper untuk format currency
Handlebars.registerHelper('currency', (value: number) => {
  return new Intl.NumberFormat('id-ID').format(value);
});

// Register helper untuk format date
Handlebars.registerHelper('formatDate', (date: string, format: string) => {
  return dayjs(date).format(format);
});

// Compile dan render template
const template = Handlebars.compile(templateString);
const html = template(data);
```

### 8.2 Email Service

```typescript
interface EmailConfig {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Attachment[];
}

async function sendEmail(config: EmailConfig): Promise<void> {
  const html = renderTemplate(config.template, config.data);

  await transporter.sendMail({
    from: `"${config.data.tenant_name} - PeopleHub" <noreply@peoplehub.kreatifindo.com>`,
    to: config.to,
    subject: config.subject,
    html: html,
    attachments: config.attachments,
  });

  // Log untuk audit
  await logEmailSent({
    recipient: config.to,
    template: config.template,
    subject: config.subject,
    sent_at: new Date(),
  });
}
```

---

## Dokumen Terkait
- [11-notifikasi-peoplehub.md](11-notifikasi-peoplehub.md) - Strategi notifikasi
- [26-letter-templates.md](26-letter-templates.md) - Template surat
- [21-env-configuration.md](21-env-configuration.md) - Konfigurasi SMTP
