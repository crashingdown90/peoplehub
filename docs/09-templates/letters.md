# Letter Templates - Template Surat PeopleHub

## Ringkasan
Dokumen ini berisi template surat resmi yang dapat diterbitkan melalui sistem PeopleHub. Setiap template memiliki format standar dengan placeholder untuk data dinamis.

---

## 1. Kategori Surat

| Kode | Kategori | Deskripsi | Approval |
|------|----------|-----------|----------|
| `SKK` | Surat Keterangan Kerja | Menyatakan status kepegawaian aktif | HRD |
| `SKA` | Surat Keterangan Aktif | Versi singkat SKK | HRD |
| `SRK` | Surat Referensi Kerja | Rekomendasi untuk karyawan resign | HRD |
| `STG` | Surat Tugas | Penugasan kerja/proyek | Atasan → HRD |
| `SPD` | Surat Perjalanan Dinas | Penugasan perjalanan dinas | Atasan → HRD |
| `SP1` | Surat Peringatan 1 | Peringatan pertama | HRD |
| `SP2` | Surat Peringatan 2 | Peringatan kedua | HRD |
| `SP3` | Surat Peringatan 3 | Peringatan terakhir | HRD |
| `SKT` | Surat Kontrak | Perjanjian kerja | HRD |
| `SPK` | Surat Pengangkatan | Pengangkatan karyawan tetap | HRD |
| `SPR` | Surat Promosi | Promosi jabatan | HRD |
| `SMT` | Surat Mutasi | Perpindahan cabang/departemen | HRD |
| `SRS` | Surat Resign | Penerimaan pengunduran diri | HRD |

---

## 2. Format Penomoran Surat

```
[KODE]/[TENANT_CODE]/[DIVISI]/[BULAN_ROMAWI]/[TAHUN]/[SEQUENCE]

Contoh:
- SKK/KAS/HRD/I/2024/001    → Surat Keterangan Kerja, Kreatifindo, HRD, Januari 2024, nomor 1
- SPD/VGI/OPS/III/2024/015  → Surat Perjalanan Dinas, Violet Global, Operasional, Maret 2024, nomor 15
```

### Kode Tenant

| Tenant | Kode |
|--------|------|
| PT. KREATIFINDO ABADI SEJAHTERA | KAS |
| PT. VIOLET GLOBAL INDONESIA | VGI |
| PT. CYBER MULTI ARTHA | CMA |
| PT. CYBER MULTI MANDIRI | CMM |

### Bulan Romawi

| Bulan | Romawi |
|-------|--------|
| Januari | I |
| Februari | II |
| Maret | III |
| April | IV |
| Mei | V |
| Juni | VI |
| Juli | VII |
| Agustus | VIII |
| September | IX |
| Oktober | X |
| November | XI |
| Desember | XII |

---

## 3. Template Surat

### 3.1 Surat Keterangan Kerja (SKK)

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 2.5cm 2cm 2cm 2.5cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #000;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header img {
      max-height: 60px;
    }
    .header h1 {
      margin: 5px 0;
      font-size: 14pt;
    }
    .header p {
      margin: 2px 0;
      font-size: 10pt;
    }
    .title {
      text-align: center;
      margin: 30px 0;
    }
    .title h2 {
      text-decoration: underline;
      margin-bottom: 5px;
    }
    .content {
      text-align: justify;
    }
    .content p {
      margin: 10px 0;
      text-indent: 40px;
    }
    .data-table {
      margin: 20px 0 20px 40px;
    }
    .data-table td {
      padding: 3px 10px;
      vertical-align: top;
    }
    .data-table td:first-child {
      width: 150px;
    }
    .signature {
      margin-top: 40px;
      float: right;
      width: 250px;
      text-align: center;
    }
    .signature .name {
      margin-top: 80px;
      font-weight: bold;
      text-decoration: underline;
    }
    .footer {
      clear: both;
      margin-top: 120px;
      font-size: 9pt;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="{{tenant_logo}}" alt="Logo">
    <h1>{{tenant_name}}</h1>
    <p>{{tenant_address}}</p>
    <p>Telp: {{tenant_phone}} | Email: {{tenant_email}}</p>
  </div>

  <div class="title">
    <h2>SURAT KETERANGAN KERJA</h2>
    <p>Nomor: {{letter_number}}</p>
  </div>

  <div class="content">
    <p>Yang bertanda tangan di bawah ini:</p>

    <table class="data-table">
      <tr>
        <td>Nama</td>
        <td>: {{issuer_name}}</td>
      </tr>
      <tr>
        <td>Jabatan</td>
        <td>: {{issuer_position}}</td>
      </tr>
      <tr>
        <td>Perusahaan</td>
        <td>: {{tenant_name}}</td>
      </tr>
    </table>

    <p>Dengan ini menerangkan bahwa:</p>

    <table class="data-table">
      <tr>
        <td>Nama</td>
        <td>: {{employee_name}}</td>
      </tr>
      <tr>
        <td>NIK</td>
        <td>: {{employee_nik}}</td>
      </tr>
      <tr>
        <td>No. Karyawan</td>
        <td>: {{employee_number}}</td>
      </tr>
      <tr>
        <td>Jabatan</td>
        <td>: {{employee_position}}</td>
      </tr>
      <tr>
        <td>Departemen</td>
        <td>: {{employee_department}}</td>
      </tr>
      <tr>
        <td>Cabang</td>
        <td>: {{employee_branch}}</td>
      </tr>
      <tr>
        <td>Tanggal Masuk</td>
        <td>: {{employee_start_date}}</td>
      </tr>
      <tr>
        <td>Status</td>
        <td>: {{employment_type}}</td>
      </tr>
    </table>

    <p>Adalah benar karyawan {{tenant_name}} yang masih aktif bekerja hingga saat surat ini dibuat.</p>

    <p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
  </div>

  <div class="signature">
    <p>{{city}}, {{issue_date}}</p>
    <p>{{issuer_position}}</p>
    <p class="name">{{issuer_name}}</p>
  </div>

  <div class="footer">
    <p>Dokumen ini diterbitkan secara elektronik melalui sistem PeopleHub dan sah tanpa tanda tangan basah.</p>
    <p>Verifikasi: {{verification_url}}</p>
  </div>
</body>
</html>
```

---

### 3.2 Surat Perjalanan Dinas (SPD)

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    /* Same base styles as above */
    @page { size: A4; margin: 2.5cm 2cm 2cm 2.5cm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
    .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .title { text-align: center; margin: 30px 0; }
    .title h2 { text-decoration: underline; }
    .content { text-align: justify; }
    .content p { margin: 10px 0; text-indent: 40px; }
    .data-table { margin: 20px 0 20px 40px; }
    .data-table td { padding: 3px 10px; vertical-align: top; }
    .signature { margin-top: 40px; float: right; width: 250px; text-align: center; }
    .signature .name { margin-top: 80px; font-weight: bold; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <img src="{{tenant_logo}}" alt="Logo" style="max-height: 60px;">
    <h1 style="margin: 5px 0; font-size: 14pt;">{{tenant_name}}</h1>
    <p style="margin: 2px 0; font-size: 10pt;">{{tenant_address}}</p>
  </div>

  <div class="title">
    <h2>SURAT PERINTAH PERJALANAN DINAS</h2>
    <p>Nomor: {{letter_number}}</p>
  </div>

  <div class="content">
    <p>Yang bertanda tangan di bawah ini memberikan perintah kepada:</p>

    <table class="data-table">
      <tr>
        <td style="width: 150px;">Nama</td>
        <td>: {{employee_name}}</td>
      </tr>
      <tr>
        <td>No. Karyawan</td>
        <td>: {{employee_number}}</td>
      </tr>
      <tr>
        <td>Jabatan</td>
        <td>: {{employee_position}}</td>
      </tr>
      <tr>
        <td>Departemen</td>
        <td>: {{employee_department}}</td>
      </tr>
    </table>

    <p>Untuk melaksanakan perjalanan dinas dengan ketentuan sebagai berikut:</p>

    <table class="data-table">
      <tr>
        <td style="width: 150px;">Tujuan</td>
        <td>: {{destination}}</td>
      </tr>
      <tr>
        <td>Tanggal Berangkat</td>
        <td>: {{start_date}}</td>
      </tr>
      <tr>
        <td>Tanggal Kembali</td>
        <td>: {{end_date}}</td>
      </tr>
      <tr>
        <td>Durasi</td>
        <td>: {{duration}} hari</td>
      </tr>
      <tr>
        <td>Keperluan</td>
        <td>: {{purpose}}</td>
      </tr>
      <tr>
        <td>Transportasi</td>
        <td>: {{transportation}}</td>
      </tr>
      <tr>
        <td>Akomodasi</td>
        <td>: {{accommodation}}</td>
      </tr>
      <tr>
        <td>Anggaran</td>
        <td>: Rp {{budget}}</td>
      </tr>
    </table>

    <p>Demikian surat perintah perjalanan dinas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.</p>
  </div>

  <div class="signature">
    <p>{{city}}, {{issue_date}}</p>
    <p>{{issuer_position}}</p>
    <p class="name">{{issuer_name}}</p>
  </div>

  <div style="clear: both; margin-top: 100px;">
    <p><strong>Mengetahui:</strong></p>
    <div style="display: flex; justify-content: space-between;">
      <div style="text-align: center; width: 200px;">
        <p>Atasan Langsung</p>
        <p style="margin-top: 60px; text-decoration: underline;">{{manager_name}}</p>
      </div>
      <div style="text-align: center; width: 200px;">
        <p>HRD</p>
        <p style="margin-top: 60px; text-decoration: underline;">{{hrd_name}}</p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

### 3.3 Surat Peringatan (SP1/SP2/SP3)

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 2.5cm 2cm 2cm 2.5cm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
    .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .title { text-align: center; margin: 30px 0; }
    .title h2 { text-decoration: underline; color: #DC2626; }
    .content { text-align: justify; }
    .content p { margin: 10px 0; text-indent: 40px; }
    .data-table { margin: 20px 0 20px 40px; }
    .data-table td { padding: 3px 10px; vertical-align: top; }
    .warning-box { border: 2px solid #DC2626; padding: 15px; margin: 20px 0; background-color: #FEF2F2; }
    .signature { margin-top: 40px; float: right; width: 250px; text-align: center; }
    .signature .name { margin-top: 80px; font-weight: bold; text-decoration: underline; }
    .acknowledgment { clear: both; margin-top: 100px; border-top: 1px solid #ccc; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <img src="{{tenant_logo}}" alt="Logo" style="max-height: 60px;">
    <h1 style="margin: 5px 0; font-size: 14pt;">{{tenant_name}}</h1>
    <p style="margin: 2px 0; font-size: 10pt;">{{tenant_address}}</p>
  </div>

  <div class="title">
    <h2>SURAT PERINGATAN {{warning_level}}</h2>
    <p>Nomor: {{letter_number}}</p>
  </div>

  <div class="content">
    <p>Kepada Yth.,</p>
    <p style="text-indent: 0; margin-left: 40px;">
      <strong>{{employee_name}}</strong><br>
      {{employee_position}}<br>
      {{employee_department}}
    </p>

    <p>Berdasarkan evaluasi kinerja dan/atau pelanggaran yang telah terjadi, dengan ini kami sampaikan Surat Peringatan {{warning_level}} kepada Saudara/i.</p>

    <div class="warning-box">
      <p style="text-indent: 0; margin: 0;"><strong>Pelanggaran yang dilakukan:</strong></p>
      <ul style="margin: 10px 0;">
        {{#each violations}}
        <li>{{date}}: {{description}}</li>
        {{/each}}
      </ul>
    </div>

    <p><strong>Dasar:</strong></p>
    <ul>
      <li>Peraturan Perusahaan Pasal {{regulation_article}}</li>
      <li>{{regulation_description}}</li>
    </ul>

    <p><strong>Sanksi:</strong></p>
    <p style="text-indent: 0; margin-left: 40px;">{{sanction}}</p>

    <p><strong>Masa berlaku:</strong></p>
    <p style="text-indent: 0; margin-left: 40px;">{{validity_period}}</p>

    <p>Apabila Saudara/i melakukan pelanggaran serupa atau pelanggaran lain selama masa berlaku surat peringatan ini, perusahaan berhak memberikan sanksi yang lebih berat sesuai dengan peraturan yang berlaku.</p>

    <p>Demikian surat peringatan ini dibuat untuk dapat diperhatikan dan dilaksanakan.</p>
  </div>

  <div class="signature">
    <p>{{city}}, {{issue_date}}</p>
    <p>HRD Manager</p>
    <p class="name">{{issuer_name}}</p>
  </div>

  <div class="acknowledgment">
    <p><strong>Tanda Terima:</strong></p>
    <p>Saya yang bertanda tangan di bawah ini menyatakan telah menerima dan memahami isi surat peringatan ini.</p>
    <table style="width: 100%; margin-top: 30px;">
      <tr>
        <td style="width: 50%; text-align: center;">
          <p>Yang Menerima,</p>
          <p style="margin-top: 60px;">(_______________________)</p>
          <p>{{employee_name}}</p>
          <p>Tanggal: _______________</p>
        </td>
        <td style="width: 50%; text-align: center;">
          <p>Saksi,</p>
          <p style="margin-top: 60px;">(_______________________)</p>
          <p>Nama:</p>
          <p>Tanggal: _______________</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
```

---

### 3.4 Surat Referensi Kerja

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 2.5cm 2cm 2cm 2.5cm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
    .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .title { text-align: center; margin: 30px 0; }
    .title h2 { text-decoration: underline; }
    .content { text-align: justify; }
    .content p { margin: 10px 0; text-indent: 40px; }
    .signature { margin-top: 40px; float: right; width: 250px; text-align: center; }
    .signature .name { margin-top: 80px; font-weight: bold; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <img src="{{tenant_logo}}" alt="Logo" style="max-height: 60px;">
    <h1 style="margin: 5px 0; font-size: 14pt;">{{tenant_name}}</h1>
    <p style="margin: 2px 0; font-size: 10pt;">{{tenant_address}}</p>
  </div>

  <div class="title">
    <h2>SURAT REFERENSI KERJA</h2>
    <p>Nomor: {{letter_number}}</p>
  </div>

  <div class="content">
    <p>Kepada Yth.,<br>
    Pihak yang Berkepentingan<br>
    di Tempat</p>

    <p>Dengan hormat,</p>

    <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>

    <table style="margin: 20px 0 20px 40px;">
      <tr>
        <td style="width: 150px; padding: 3px 10px;">Nama</td>
        <td>: {{employee_name}}</td>
      </tr>
      <tr>
        <td style="padding: 3px 10px;">NIK</td>
        <td>: {{employee_nik}}</td>
      </tr>
      <tr>
        <td style="padding: 3px 10px;">Jabatan Terakhir</td>
        <td>: {{employee_position}}</td>
      </tr>
      <tr>
        <td style="padding: 3px 10px;">Departemen</td>
        <td>: {{employee_department}}</td>
      </tr>
      <tr>
        <td style="padding: 3px 10px;">Masa Kerja</td>
        <td>: {{start_date}} s/d {{end_date}} ({{tenure}})</td>
      </tr>
    </table>

    <p>Adalah benar mantan karyawan {{tenant_name}} yang telah mengundurkan diri dengan baik dan tidak memiliki kewajiban yang belum diselesaikan terhadap perusahaan.</p>

    <p>Selama bekerja di perusahaan kami, yang bersangkutan menunjukkan:</p>
    <ul style="margin-left: 40px;">
      <li>Dedikasi dan tanggung jawab yang baik terhadap pekerjaan</li>
      <li>Kemampuan bekerja sama dalam tim</li>
      <li>Integritas dan profesionalisme yang tinggi</li>
      {{#if additional_remarks}}
      <li>{{additional_remarks}}</li>
      {{/if}}
    </ul>

    <p>Demikian surat referensi ini kami berikan untuk dapat dipergunakan sebagaimana mestinya.</p>
  </div>

  <div class="signature">
    <p>{{city}}, {{issue_date}}</p>
    <p>{{issuer_position}}</p>
    <p class="name">{{issuer_name}}</p>
  </div>
</body>
</html>
```

---

### 3.5 Surat Pengangkatan Karyawan Tetap

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 2.5cm 2cm 2cm 2.5cm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
    .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .title { text-align: center; margin: 30px 0; }
    .title h2 { text-decoration: underline; }
    .content { text-align: justify; }
    .content p { margin: 10px 0; text-indent: 40px; }
    .signature { margin-top: 40px; }
    .signature .name { margin-top: 80px; font-weight: bold; text-decoration: underline; }
    .highlight { background-color: #DCFCE7; padding: 15px; margin: 20px 0; border-left: 4px solid #16A34A; }
  </style>
</head>
<body>
  <div class="header">
    <img src="{{tenant_logo}}" alt="Logo" style="max-height: 60px;">
    <h1 style="margin: 5px 0; font-size: 14pt;">{{tenant_name}}</h1>
    <p style="margin: 2px 0; font-size: 10pt;">{{tenant_address}}</p>
  </div>

  <div class="title">
    <h2>SURAT KEPUTUSAN PENGANGKATAN KARYAWAN TETAP</h2>
    <p>Nomor: {{letter_number}}</p>
  </div>

  <div class="content">
    <p style="text-indent: 0;"><strong>DIREKTUR {{tenant_name}}</strong></p>

    <p style="text-indent: 0;"><strong>Menimbang:</strong></p>
    <ol style="margin-left: 40px;" type="a">
      <li>Bahwa yang bersangkutan telah menyelesaikan masa percobaan dengan baik;</li>
      <li>Bahwa yang bersangkutan memenuhi kualifikasi dan kompetensi yang dibutuhkan;</li>
      <li>Bahwa perlu menetapkan status kepegawaian yang bersangkutan.</li>
    </ol>

    <p style="text-indent: 0;"><strong>Mengingat:</strong></p>
    <ol style="margin-left: 40px;" type="a">
      <li>Peraturan Perusahaan {{tenant_name}};</li>
      <li>Perjanjian Kerja Waktu Tertentu Nomor {{contract_number}}.</li>
    </ol>

    <p style="text-indent: 0;"><strong>MEMUTUSKAN:</strong></p>

    <p style="text-indent: 0;"><strong>Menetapkan:</strong></p>

    <div class="highlight">
      <table style="width: 100%;">
        <tr>
          <td style="width: 150px; padding: 5px;">Nama</td>
          <td>: {{employee_name}}</td>
        </tr>
        <tr>
          <td style="padding: 5px;">No. Karyawan</td>
          <td>: {{employee_number}}</td>
        </tr>
        <tr>
          <td style="padding: 5px;">Jabatan</td>
          <td>: {{employee_position}}</td>
        </tr>
        <tr>
          <td style="padding: 5px;">Departemen</td>
          <td>: {{employee_department}}</td>
        </tr>
        <tr>
          <td style="padding: 5px;">Cabang</td>
          <td>: {{employee_branch}}</td>
        </tr>
        <tr>
          <td style="padding: 5px;">Status</td>
          <td>: <strong>KARYAWAN TETAP</strong></td>
        </tr>
        <tr>
          <td style="padding: 5px;">Efektif Tanggal</td>
          <td>: {{effective_date}}</td>
        </tr>
      </table>
    </div>

    <p>Dengan hak dan kewajiban sesuai dengan Peraturan Perusahaan yang berlaku.</p>

    <p>Keputusan ini berlaku sejak tanggal ditetapkan, dengan ketentuan apabila di kemudian hari terdapat kekeliruan dalam penetapan ini akan diadakan perbaikan sebagaimana mestinya.</p>
  </div>

  <div class="signature" style="float: right; width: 250px; text-align: center;">
    <p>Ditetapkan di: {{city}}</p>
    <p>Pada tanggal: {{issue_date}}</p>
    <p>Direktur</p>
    <p class="name">{{director_name}}</p>
  </div>

  <div style="clear: both; margin-top: 120px;">
    <p><strong>Tembusan:</strong></p>
    <ol>
      <li>Yang bersangkutan</li>
      <li>HRD</li>
      <li>Finance</li>
      <li>Arsip</li>
    </ol>
  </div>
</body>
</html>
```

---

## 4. Field Mapping

### 4.1 Data Karyawan

| Placeholder | Sumber Data | Contoh |
|-------------|-------------|--------|
| `{{employee_name}}` | employee.full_name | John Doe |
| `{{employee_number}}` | employee.employee_number | EMP001 |
| `{{employee_nik}}` | employee.nik | 3201234567890001 |
| `{{employee_position}}` | position.name | Software Engineer |
| `{{employee_department}}` | department.name | Engineering |
| `{{employee_branch}}` | branch.name | Jakarta HQ |
| `{{employee_start_date}}` | employee.start_date (formatted) | 15 Januari 2024 |
| `{{employment_type}}` | employee.employment_type | Karyawan Tetap |

### 4.2 Data Tenant

| Placeholder | Sumber Data | Contoh |
|-------------|-------------|--------|
| `{{tenant_name}}` | tenant.name | PT. KREATIFINDO ABADI SEJAHTERA |
| `{{tenant_logo}}` | tenant.branding.logo_url | https://cdn.../logo.png |
| `{{tenant_address}}` | tenant.branding.address | Jl. Sudirman No. 1, Jakarta |
| `{{tenant_phone}}` | tenant.branding.phone | (021) 12345678 |
| `{{tenant_email}}` | tenant.branding.email | hr@kreatifindo.com |

### 4.3 Data Surat

| Placeholder | Sumber Data | Contoh |
|-------------|-------------|--------|
| `{{letter_number}}` | Generated | SKK/KAS/HRD/I/2024/001 |
| `{{issue_date}}` | letter_request.issued_at | 19 Januari 2024 |
| `{{city}}` | branch.city | Jakarta |
| `{{issuer_name}}` | issuer.full_name | Jane Smith |
| `{{issuer_position}}` | issuer_position.name | HRD Manager |
| `{{verification_url}}` | Generated | https://peoplehub.../verify/abc123 |

---

## 5. Implementation

### 5.1 PDF Generation

```typescript
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';

async function generateLetterPDF(
  templateCode: string,
  data: Record<string, any>
): Promise<Buffer> {
  // Get template
  const template = await getTemplate(templateCode);

  // Compile template
  const compiled = Handlebars.compile(template.html);
  const html = compiled(data);

  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '2.5cm',
      right: '2cm',
      bottom: '2cm',
      left: '2.5cm',
    },
  });

  await browser.close();

  return pdf;
}
```

### 5.2 Letter Number Generator

```typescript
async function generateLetterNumber(
  tenantId: string,
  categoryCode: string,
  divisionCode: string
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const romanMonth = toRoman(month);

  const tenant = await getTenant(tenantId);
  const tenantCode = tenant.code; // KAS, VGI, etc.

  // Get next sequence
  const sequence = await getNextSequence(tenantId, categoryCode, year, month);
  const paddedSequence = sequence.toString().padStart(3, '0');

  return `${categoryCode}/${tenantCode}/${divisionCode}/${romanMonth}/${year}/${paddedSequence}`;
}

function toRoman(num: number): string {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romanNumerals[num - 1];
}
```

### 5.3 Verification System

```typescript
// Generate verification code
function generateVerificationCode(letterId: string): string {
  const hash = crypto.createHash('sha256')
    .update(`${letterId}:${process.env.LETTER_SECRET}`)
    .digest('hex')
    .substring(0, 12);
  return hash;
}

// Verify letter authenticity
async function verifyLetter(code: string): Promise<LetterVerification> {
  const letter = await findLetterByVerificationCode(code);

  if (!letter) {
    return { valid: false, message: 'Surat tidak ditemukan' };
  }

  return {
    valid: true,
    letter_number: letter.letter_number,
    category: letter.category.name,
    employee_name: letter.employee.full_name,
    issued_at: letter.issued_at,
    issued_by: letter.issued_by.full_name,
  };
}
```

---

## Dokumen Terkait
- [25-email-templates.md](25-email-templates.md) - Template email
- [04-epic-dan-user-stories.md](04-epic-dan-user-stories.md) - User stories surat
- [19-skema-database-erd.md](19-skema-database-erd.md) - Tabel letter_request
