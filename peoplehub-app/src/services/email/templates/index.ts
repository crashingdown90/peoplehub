// @ai:cl - Email templates for PeopleHub
import type { EmailTemplate } from "../email.service";

// ==========================================
// BASE TEMPLATE
// ==========================================

const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #2563eb; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 32px 24px; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .button:hover { background: #1d4ed8; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
    .info-box { background: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; }
    .success-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 16px 0; }
    .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; }
    .error-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PeopleHub</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Email ini dikirim secara otomatis oleh PeopleHub HRIS.</p>
      <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
      <p>&copy; ${new Date().getFullYear()} PeopleHub. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// ==========================================
// LEAVE TEMPLATES
// ==========================================

export function leaveApproved(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Pengajuan Cuti Disetujui</h2>
    <p>Halo <strong>{{employeeName}}</strong>,</p>
    <p>Pengajuan cuti Anda telah <strong style="color: #22c55e;">DISETUJUI</strong>.</p>

    <div class="success-box">
      <table>
        <tr><th>Jenis Cuti</th><td>{{leaveType}}</td></tr>
        <tr><th>Tanggal Mulai</th><td>{{startDate}}</td></tr>
        <tr><th>Tanggal Selesai</th><td>{{endDate}}</td></tr>
        <tr><th>Total Hari</th><td>{{totalDays}} hari</td></tr>
        <tr><th>Disetujui Oleh</th><td>{{approvedBy}}</td></tr>
      </table>
    </div>

    <p>Selamat menikmati cuti Anda!</p>

    <p style="margin-top: 24px;">
      <a href="{{dashboardUrl}}" class="button">Lihat Detail</a>
    </p>
  `;

  return {
    name: "leaveApproved",
    subject: "Pengajuan Cuti Disetujui - {{leaveType}}",
    html: baseTemplate(content, "Cuti Disetujui"),
    text: `Pengajuan cuti Anda ({{leaveType}}) dari {{startDate}} sampai {{endDate}} telah DISETUJUI oleh {{approvedBy}}.`,
  };
}

export function leaveRejected(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Pengajuan Cuti Ditolak</h2>
    <p>Halo <strong>{{employeeName}}</strong>,</p>
    <p>Mohon maaf, pengajuan cuti Anda telah <strong style="color: #ef4444;">DITOLAK</strong>.</p>

    <div class="error-box">
      <table>
        <tr><th>Jenis Cuti</th><td>{{leaveType}}</td></tr>
        <tr><th>Tanggal Mulai</th><td>{{startDate}}</td></tr>
        <tr><th>Tanggal Selesai</th><td>{{endDate}}</td></tr>
        <tr><th>Ditolak Oleh</th><td>{{rejectedBy}}</td></tr>
        <tr><th>Alasan</th><td>{{reason}}</td></tr>
      </table>
    </div>

    <p>Silakan hubungi atasan atau HRD untuk informasi lebih lanjut.</p>

    <p style="margin-top: 24px;">
      <a href="{{dashboardUrl}}" class="button">Ajukan Ulang</a>
    </p>
  `;

  return {
    name: "leaveRejected",
    subject: "Pengajuan Cuti Ditolak - {{leaveType}}",
    html: baseTemplate(content, "Cuti Ditolak"),
    text: `Pengajuan cuti Anda ({{leaveType}}) dari {{startDate}} sampai {{endDate}} telah DITOLAK. Alasan: {{reason}}`,
  };
}

export function leaveRequestPending(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Pengajuan Cuti Baru</h2>
    <p>Halo <strong>{{approverName}}</strong>,</p>
    <p>Ada pengajuan cuti baru yang membutuhkan persetujuan Anda.</p>

    <div class="info-box">
      <table>
        <tr><th>Nama Karyawan</th><td>{{employeeName}}</td></tr>
        <tr><th>Jenis Cuti</th><td>{{leaveType}}</td></tr>
        <tr><th>Tanggal Mulai</th><td>{{startDate}}</td></tr>
        <tr><th>Tanggal Selesai</th><td>{{endDate}}</td></tr>
        <tr><th>Total Hari</th><td>{{totalDays}} hari</td></tr>
        <tr><th>Alasan</th><td>{{reason}}</td></tr>
      </table>
    </div>

    <p style="margin-top: 24px;">
      <a href="{{approvalUrl}}" class="button">Review Pengajuan</a>
    </p>
  `;

  return {
    name: "leaveRequestPending",
    subject: "Pengajuan Cuti Baru - {{employeeName}}",
    html: baseTemplate(content, "Pengajuan Cuti Baru"),
    text: `Ada pengajuan cuti baru dari {{employeeName}} ({{leaveType}}) dari {{startDate}} sampai {{endDate}} yang membutuhkan persetujuan Anda.`,
  };
}

// ==========================================
// ATTENDANCE TEMPLATES
// ==========================================

export function attendanceLateAlert(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Notifikasi Keterlambatan</h2>
    <p>Halo <strong>{{employeeName}}</strong>,</p>
    <p>Sistem mencatat Anda <strong style="color: #f59e0b;">terlambat</strong> pada:</p>

    <div class="warning-box">
      <table>
        <tr><th>Tanggal</th><td>{{date}}</td></tr>
        <tr><th>Jam Masuk Seharusnya</th><td>{{scheduledTime}}</td></tr>
        <tr><th>Jam Masuk Aktual</th><td>{{actualTime}}</td></tr>
        <tr><th>Keterlambatan</th><td>{{lateMinutes}} menit</td></tr>
      </table>
    </div>

    <p>Jika ada kesalahan pencatatan, silakan ajukan koreksi kehadiran.</p>

    <p style="margin-top: 24px;">
      <a href="{{attendanceUrl}}" class="button">Lihat Kehadiran</a>
    </p>
  `;

  return {
    name: "attendanceLateAlert",
    subject: "Notifikasi Keterlambatan - {{date}}",
    html: baseTemplate(content, "Keterlambatan"),
    text: `Anda tercatat terlambat {{lateMinutes}} menit pada {{date}}. Jam masuk: {{actualTime}} (seharusnya {{scheduledTime}}).`,
  };
}

export function attendanceAbsentAlert(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Notifikasi Tidak Hadir</h2>
    <p>Halo <strong>{{employeeName}}</strong>,</p>
    <p>Sistem mencatat Anda <strong style="color: #ef4444;">tidak hadir</strong> pada:</p>

    <div class="error-box">
      <table>
        <tr><th>Tanggal</th><td>{{date}}</td></tr>
        <tr><th>Status</th><td>Tidak Hadir (Tanpa Keterangan)</td></tr>
      </table>
    </div>

    <p>Jika Anda mengajukan cuti atau izin, pastikan pengajuan sudah disetujui.</p>
    <p>Jika ada kesalahan, silakan hubungi HRD.</p>

    <p style="margin-top: 24px;">
      <a href="{{attendanceUrl}}" class="button">Lihat Kehadiran</a>
    </p>
  `;

  return {
    name: "attendanceAbsentAlert",
    subject: "Notifikasi Tidak Hadir - {{date}}",
    html: baseTemplate(content, "Tidak Hadir"),
    text: `Anda tercatat tidak hadir tanpa keterangan pada {{date}}. Silakan hubungi HRD jika ada kesalahan.`,
  };
}

// ==========================================
// PAYROLL TEMPLATES
// ==========================================

export function payslipPublished(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Slip Gaji Tersedia</h2>
    <p>Halo <strong>{{employeeName}}</strong>,</p>
    <p>Slip gaji Anda untuk periode <strong>{{period}}</strong> telah tersedia.</p>

    <div class="info-box">
      <table>
        <tr><th>Periode</th><td>{{period}}</td></tr>
        <tr><th>Gaji Bersih</th><td style="font-size: 18px; font-weight: bold; color: #22c55e;">{{netSalary}}</td></tr>
      </table>
    </div>

    <p>Silakan login ke PeopleHub untuk melihat detail slip gaji Anda.</p>

    <p style="margin-top: 24px;">
      <a href="{{payslipUrl}}" class="button">Lihat Slip Gaji</a>
    </p>
  `;

  return {
    name: "payslipPublished",
    subject: "Slip Gaji {{period}} Tersedia",
    html: baseTemplate(content, "Slip Gaji"),
    text: `Slip gaji Anda untuk periode {{period}} telah tersedia. Gaji bersih: {{netSalary}}. Login ke PeopleHub untuk melihat detail.`,
  };
}

// ==========================================
// TICKET TEMPLATES
// ==========================================

export function ticketCreated(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Tiket Support Dibuat</h2>
    <p>Halo <strong>{{employeeName}}</strong>,</p>
    <p>Tiket support Anda telah berhasil dibuat.</p>

    <div class="info-box">
      <table>
        <tr><th>Nomor Tiket</th><td>#{{ticketNumber}}</td></tr>
        <tr><th>Kategori</th><td>{{category}}</td></tr>
        <tr><th>Prioritas</th><td>{{priority}}</td></tr>
        <tr><th>Subject</th><td>{{subject}}</td></tr>
      </table>
    </div>

    <p>Tim kami akan segera meninjau tiket Anda.</p>

    <p style="margin-top: 24px;">
      <a href="{{ticketUrl}}" class="button">Lihat Tiket</a>
    </p>
  `;

  return {
    name: "ticketCreated",
    subject: "Tiket #{{ticketNumber}} Dibuat - {{subject}}",
    html: baseTemplate(content, "Tiket Dibuat"),
    text: `Tiket support #{{ticketNumber}} ({{subject}}) telah dibuat. Tim kami akan segera meninjau tiket Anda.`,
  };
}

export function ticketUpdated(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Update Tiket Support</h2>
    <p>Halo <strong>{{employeeName}}</strong>,</p>
    <p>Ada update untuk tiket Anda:</p>

    <div class="info-box">
      <table>
        <tr><th>Nomor Tiket</th><td>#{{ticketNumber}}</td></tr>
        <tr><th>Subject</th><td>{{subject}}</td></tr>
        <tr><th>Status</th><td>{{status}}</td></tr>
        <tr><th>Update Terakhir</th><td>{{updatedBy}}</td></tr>
      </table>
    </div>

    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <strong>Komentar:</strong>
      <p style="margin: 8px 0 0 0;">{{comment}}</p>
    </div>

    <p style="margin-top: 24px;">
      <a href="{{ticketUrl}}" class="button">Lihat Tiket</a>
    </p>
  `;

  return {
    name: "ticketUpdated",
    subject: "Update Tiket #{{ticketNumber}} - {{subject}}",
    html: baseTemplate(content, "Update Tiket"),
    text: `Ada update untuk tiket #{{ticketNumber}} ({{subject}}). Status: {{status}}. Komentar: {{comment}}`,
  };
}

export function ticketResolved(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Tiket Diselesaikan</h2>
    <p>Halo <strong>{{employeeName}}</strong>,</p>
    <p>Tiket support Anda telah <strong style="color: #22c55e;">diselesaikan</strong>.</p>

    <div class="success-box">
      <table>
        <tr><th>Nomor Tiket</th><td>#{{ticketNumber}}</td></tr>
        <tr><th>Subject</th><td>{{subject}}</td></tr>
        <tr><th>Diselesaikan Oleh</th><td>{{resolvedBy}}</td></tr>
      </table>
    </div>

    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <strong>Resolusi:</strong>
      <p style="margin: 8px 0 0 0;">{{resolution}}</p>
    </div>

    <p>Jika masalah belum terselesaikan, Anda dapat membuka kembali tiket ini.</p>

    <p style="margin-top: 24px;">
      <a href="{{ticketUrl}}" class="button">Lihat Tiket</a>
    </p>
  `;

  return {
    name: "ticketResolved",
    subject: "Tiket #{{ticketNumber}} Diselesaikan",
    html: baseTemplate(content, "Tiket Diselesaikan"),
    text: `Tiket #{{ticketNumber}} ({{subject}}) telah diselesaikan oleh {{resolvedBy}}. Resolusi: {{resolution}}`,
  };
}

// ==========================================
// ANNOUNCEMENT TEMPLATES
// ==========================================

export function announcementPublished(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>{{title}}</h2>
    <p>Halo <strong>{{employeeName}}</strong>,</p>
    <p>Ada pengumuman baru dari perusahaan:</p>

    <div class="info-box">
      {{content}}
    </div>

    <p style="font-size: 12px; color: #64748b;">Dipublikasikan oleh {{publishedBy}} pada {{publishedAt}}</p>

    <p style="margin-top: 24px;">
      <a href="{{announcementUrl}}" class="button">Lihat Pengumuman</a>
    </p>
  `;

  return {
    name: "announcementPublished",
    subject: "Pengumuman: {{title}}",
    html: baseTemplate(content, "Pengumuman"),
    text: `Pengumuman Baru: {{title}}. {{content}}`,
  };
}

// ==========================================
// DIGEST TEMPLATES
// ==========================================

export function dailyDigest(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Ringkasan Harian</h2>
    <p>Halo <strong>{{employeeName}}</strong>,</p>
    <p>Berikut ringkasan aktivitas Anda untuk hari ini ({{date}}):</p>

    <div class="info-box">
      <h3 style="margin-top: 0;">Kehadiran</h3>
      <p>{{attendanceSummary}}</p>
    </div>

    {{#if pendingApprovals}}
    <div class="warning-box">
      <h3 style="margin-top: 0;">Perlu Persetujuan</h3>
      <p>Anda memiliki <strong>{{pendingApprovalsCount}}</strong> pengajuan yang menunggu persetujuan.</p>
    </div>
    {{/if}}

    {{#if notifications}}
    <div style="margin: 16px 0;">
      <h3>Notifikasi</h3>
      <ul>
        {{notificationsList}}
      </ul>
    </div>
    {{/if}}

    <p style="margin-top: 24px;">
      <a href="{{dashboardUrl}}" class="button">Buka Dashboard</a>
    </p>
  `;

  return {
    name: "dailyDigest",
    subject: "Ringkasan Harian PeopleHub - {{date}}",
    html: baseTemplate(content, "Ringkasan Harian"),
    text: `Ringkasan harian untuk {{date}}. Kehadiran: {{attendanceSummary}}. Pending approvals: {{pendingApprovalsCount}}.`,
  };
}

export function weeklyDigest(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Ringkasan Mingguan</h2>
    <p>Halo <strong>{{employeeName}}</strong>,</p>
    <p>Berikut ringkasan aktivitas Anda minggu ini ({{weekRange}}):</p>

    <div class="info-box">
      <h3 style="margin-top: 0;">Kehadiran</h3>
      <table>
        <tr><th>Hadir</th><td>{{presentDays}} hari</td></tr>
        <tr><th>Terlambat</th><td>{{lateDays}} hari</td></tr>
        <tr><th>Izin/Cuti</th><td>{{leaveDays}} hari</td></tr>
        <tr><th>Tidak Hadir</th><td>{{absentDays}} hari</td></tr>
      </table>
    </div>

    {{#if leaveBalance}}
    <div style="margin: 16px 0;">
      <h3>Sisa Cuti</h3>
      <p>Anda memiliki <strong>{{leaveBalance}}</strong> hari cuti tersisa.</p>
    </div>
    {{/if}}

    <p style="margin-top: 24px;">
      <a href="{{dashboardUrl}}" class="button">Buka Dashboard</a>
    </p>
  `;

  return {
    name: "weeklyDigest",
    subject: "Ringkasan Mingguan PeopleHub - {{weekRange}}",
    html: baseTemplate(content, "Ringkasan Mingguan"),
    text: `Ringkasan mingguan untuk {{weekRange}}. Hadir: {{presentDays}} hari, Terlambat: {{lateDays}} hari, Cuti: {{leaveDays}} hari.`,
  };
}

// ==========================================
// REGISTRATION TEMPLATES
// ==========================================

export function registrationApproved(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Selamat! Akun Anda Telah Disetujui</h2>
    <p>Halo <strong>{{fullName}}</strong>,</p>
    <p>Akun PeopleHub Anda telah <strong style="color: #22c55e;">DISETUJUI</strong> dan siap digunakan.</p>

    <div class="success-box">
      <table>
        <tr><th>Nomor Karyawan</th><td>{{employeeNumber}}</td></tr>
        <tr><th>Email</th><td>{{email}}</td></tr>
        <tr><th>Departemen</th><td>{{department}}</td></tr>
        <tr><th>Posisi</th><td>{{position}}</td></tr>
        <tr><th>Cabang</th><td>{{branch}}</td></tr>
        <tr><th>Tanggal Mulai</th><td>{{startDate}}</td></tr>
      </table>
    </div>

    <p>Sekarang Anda dapat login ke PeopleHub untuk:</p>
    <ul>
      <li>Melakukan absensi harian</li>
      <li>Mengajukan cuti dan izin</li>
      <li>Melihat slip gaji</li>
      <li>Dan fitur lainnya</li>
    </ul>

    <p style="margin-top: 24px;">
      <a href="{{loginUrl}}" class="button">Login Sekarang</a>
    </p>

    <p style="margin-top: 16px; font-size: 12px; color: #64748b;">
      Jika Anda memiliki pertanyaan, silakan hubungi tim HRD.
    </p>
  `;

  return {
    name: "registrationApproved",
    subject: "Selamat Bergabung di PeopleHub - Akun Anda Telah Aktif",
    html: baseTemplate(content, "Akun Disetujui"),
    text: `Selamat {{fullName}}! Akun PeopleHub Anda telah disetujui. Nomor karyawan: {{employeeNumber}}. Silakan login di {{loginUrl}} untuk mulai menggunakan aplikasi.`,
  };
}

export function registrationRejected(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Registrasi Tidak Disetujui</h2>
    <p>Halo <strong>{{fullName}}</strong>,</p>
    <p>Mohon maaf, registrasi akun PeopleHub Anda <strong style="color: #ef4444;">tidak dapat disetujui</strong>.</p>

    <div class="error-box">
      <table>
        <tr><th>Email</th><td>{{email}}</td></tr>
        <tr><th>Tanggal Registrasi</th><td>{{registrationDate}}</td></tr>
        <tr><th>Alasan Penolakan</th><td>{{reason}}</td></tr>
      </table>
    </div>

    <p>Jika Anda merasa ini adalah kesalahan atau membutuhkan klarifikasi, silakan hubungi tim HRD untuk informasi lebih lanjut.</p>

    <p style="margin-top: 16px; font-size: 12px; color: #64748b;">
      Email ini dikirim secara otomatis. Jangan membalas email ini.
    </p>
  `;

  return {
    name: "registrationRejected",
    subject: "Registrasi PeopleHub Tidak Disetujui",
    html: baseTemplate(content, "Registrasi Ditolak"),
    text: `Mohon maaf {{fullName}}, registrasi akun PeopleHub Anda tidak disetujui. Alasan: {{reason}}. Silakan hubungi HRD untuk informasi lebih lanjut.`,
  };
}

export function registrationPending(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Registrasi Berhasil Diterima</h2>
    <p>Halo <strong>{{fullName}}</strong>,</p>
    <p>Terima kasih telah mendaftar di PeopleHub. Registrasi Anda telah <strong>berhasil diterima</strong> dan sedang menunggu persetujuan dari tim HRD.</p>

    <div class="info-box">
      <table>
        <tr><th>Email</th><td>{{email}}</td></tr>
        <tr><th>No. Telepon</th><td>{{phone}}</td></tr>
        <tr><th>Tanggal Registrasi</th><td>{{registrationDate}}</td></tr>
        <tr><th>Status</th><td><span style="color: #f59e0b; font-weight: bold;">Menunggu Persetujuan</span></td></tr>
      </table>
    </div>

    <p>Anda akan menerima email notifikasi setelah akun Anda disetujui atau jika diperlukan informasi tambahan.</p>

    <p style="margin-top: 16px; font-size: 12px; color: #64748b;">
      Proses persetujuan biasanya membutuhkan waktu 1-3 hari kerja.
    </p>
  `;

  return {
    name: "registrationPending",
    subject: "Registrasi PeopleHub Diterima - Menunggu Persetujuan",
    html: baseTemplate(content, "Registrasi Diterima"),
    text: `Halo {{fullName}}, registrasi Anda di PeopleHub telah diterima dan sedang menunggu persetujuan HRD. Anda akan menerima notifikasi setelah akun disetujui.`,
  };
}

// ==========================================
// EMAIL VERIFICATION TEMPLATES
// ==========================================

export function emailVerification(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Verifikasi Email Anda</h2>
    <p>Halo <strong>{{fullName}}</strong>,</p>
    <p>Terima kasih telah mendaftar di PeopleHub. Untuk menyelesaikan pendaftaran, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="{{verificationUrl}}" class="button">Verifikasi Email</a>
    </div>

    <div class="info-box">
      <p style="margin: 0;"><strong>Catatan:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        <li>Link verifikasi ini akan kadaluarsa dalam <strong>{{expiryHours}} jam</strong></li>
        <li>Jika Anda tidak merasa mendaftar di PeopleHub, abaikan email ini</li>
      </ul>
    </div>

    <p style="margin-top: 24px; font-size: 12px; color: #64748b;">
      Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:<br>
      <span style="word-break: break-all;">{{verificationUrl}}</span>
    </p>
  `;

  return {
    name: "emailVerification",
    subject: "Verifikasi Email PeopleHub Anda",
    html: baseTemplate(content, "Verifikasi Email"),
    text: `Halo {{fullName}}, silakan verifikasi email Anda dengan membuka link berikut: {{verificationUrl}}. Link ini akan kadaluarsa dalam {{expiryHours}} jam.`,
  };
}

// ==========================================
// PASSWORD RESET TEMPLATES
// ==========================================

export function passwordReset(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Reset Password</h2>
    <p>Halo <strong>{{fullName}}</strong>,</p>
    <p>Kami menerima permintaan untuk mereset password akun PeopleHub Anda. Klik tombol di bawah ini untuk membuat password baru:</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="{{resetUrl}}" class="button">Reset Password</a>
    </div>

    <div class="warning-box">
      <p style="margin: 0;"><strong>Peringatan Keamanan:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        <li>Link ini akan kadaluarsa dalam <strong>{{expiryHours}} jam</strong></li>
        <li>Jangan bagikan link ini kepada siapapun</li>
        <li>Jika Anda tidak meminta reset password, abaikan email ini dan password Anda tidak akan berubah</li>
      </ul>
    </div>

    <p style="margin-top: 24px; font-size: 12px; color: #64748b;">
      Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:<br>
      <span style="word-break: break-all;">{{resetUrl}}</span>
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

    <p style="font-size: 12px; color: #64748b;">
      Jika Anda tidak merasa meminta reset password, kemungkinan ada seseorang yang mencoba mengakses akun Anda.
      Untuk keamanan, pastikan password Anda kuat dan unik.
    </p>
  `;

  return {
    name: "passwordReset",
    subject: "Reset Password PeopleHub",
    html: baseTemplate(content, "Reset Password"),
    text: `Halo {{fullName}}, Anda meminta reset password. Klik link berikut untuk membuat password baru: {{resetUrl}}. Link ini akan kadaluarsa dalam {{expiryHours}} jam. Jika Anda tidak meminta ini, abaikan email ini.`,
  };
}

export function passwordChanged(vars: Record<string, string>): EmailTemplate {
  const content = `
    <h2>Password Berhasil Diubah</h2>
    <p>Halo <strong>{{fullName}}</strong>,</p>
    <p>Password akun PeopleHub Anda telah <strong style="color: #22c55e;">berhasil diubah</strong>.</p>

    <div class="success-box">
      <table>
        <tr><th>Email</th><td>{{email}}</td></tr>
        <tr><th>Waktu</th><td>{{changedAt}}</td></tr>
      </table>
    </div>

    <div class="warning-box">
      <p style="margin: 0;"><strong>Bukan Anda yang melakukan ini?</strong></p>
      <p style="margin: 8px 0 0 0;">Jika Anda tidak merasa mengubah password, segera hubungi tim IT atau HRD untuk mengamankan akun Anda.</p>
    </div>

    <p style="margin-top: 24px;">
      <a href="{{loginUrl}}" class="button">Login ke PeopleHub</a>
    </p>
  `;

  return {
    name: "passwordChanged",
    subject: "Password PeopleHub Anda Telah Diubah",
    html: baseTemplate(content, "Password Diubah"),
    text: `Halo {{fullName}}, password akun PeopleHub Anda telah berhasil diubah pada {{changedAt}}. Jika Anda tidak melakukan ini, segera hubungi tim IT.`,
  };
}
