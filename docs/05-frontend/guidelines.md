# Pedoman Frontend PeopleHub

## Prinsip Desain
- Clean, profesional, enterprise: palet netral + 1 aksen; ruang lega; hierarki jelas.
- Tipografi: gunakan satu keluarga (mis. Manrope/Inter) dengan 3 tier (H1/H2, body, meta); weight 500–600 untuk heading, 400 untuk isi.
- Palet contoh: teks utama `#0F172A`, teks sekunder `#475569`, garis `#E2E8F0`, latar `#F8FAFC`, aksen `#2563EB` (atau `#0EA5E9`), status: success `#16A34A`, warning `#F59E0B`, error `#DC2626`, info `#0EA5E9`.
- Spasi: grid 8px; padding komponen 12–20px; radius 8px; shadow ringan.
- Aksesibilitas: kontras cukup, fokus/hover jelas, label+ikon, ukuran klik nyaman.

## Layout & Navigasi
- Navbar/topbar: brand (logo + nama tenant), switch tenant (jika multi), pencarian cepat, ikon notifikasi, avatar user (menu profil, logout).
- Sidebar: grup menu per domain (Dashboard, Absensi, Cuti/Izin, Perjalanan & Reimburse, Slip Gaji, KPI, Dokumen/Surat, Pengumuman, Tiket/Aset, Admin). Tampilkan hanya menu sesuai role.
- Breadcrumb di halaman detail (mis. Dashboard > Cuti > Detail Pengajuan).
- Responsif: sidebar bisa collapse menjadi drawer pada mobile; tombol absen cepat tetap terlihat.

## Dashboard
- HRD: kartu ringkas (hadir/terlambat/absen hari ini), tren absensi (7/30 hari), saldo cuti agregat, pengajuan terbaru (cuti/reimburse/perjalanan), heatmap kehadiran, alert kepatuhan.
- Karyawan: saldo cuti, tombol absen (WFO/WFH), status pengajuan terakhir, jadwal shift hari ini, KPI aktif, slip gaji terbaru.
- Gunakan chart sederhana (line/bar/heatmap); hindari visual berlebih.

## Komponen Inti
- Tabel data: pencarian + filter (cabang/departemen/status), sort, badge status, pagination jelas.
- Form: layout 1 kolom (mobile) / 2 kolom (desktop); grouping bidang (Akun, Organisasi, Identitas, Bank); aksi utama warna aksen; validasi inline.
- Kartu: gunakan untuk ringkasan metrik atau detail singkat; header jelas, aksi di pojok kanan.
- Notifikasi: panel dengan tab (Semua, Tugas, Peringatan); penanda terbaca; tautan ke detail.
- Badge status: set warna konsisten (pending=info, approved=success, rejected=error, in-review=warning, draft=muted).

## Ikonografi & Ilustrasi
- Gunakan set konsisten (Heroicons/Feather); satu gaya (outline) untuk keseragaman.
- Hindari ikon dekoratif; pastikan ada label teks untuk aksi utama.

## Mikrointeraksi
- Hover/fokus: transisi 150–200ms; outline/border jelas.
- Loading: skeleton untuk tabel/kartu; spinner hanya untuk aksi singkat.
- Feedback: toast untuk aksi sukses/gagal; modal konfirmasi untuk aksi kritikal (approve/reject, publish slip).

## Pola Khusus
- Absen: tombol besar, tampilkan status lokasi (WFO/WFH), waktu sekarang, lokasi/device (opsional), hasil respons cepat.
- Cuti/Izin: wizard singkat (pilih jenis, tanggal, alasan); tampilkan saldo sebelum/ sesudah; preview approval chain.
- Reimburse/Travel: form dengan kategori biaya, plafon info, unggah bukti; timeline status; rincian pembayaran.
- Slip Gaji: daftar periode, status, tombol unduh PDF; badge “baru” untuk slip terbaru.
- KPI: daftar target dengan progress bar; filter per periode; form update progres ringkas.
- Surat: pilih kategori, form dinamis sesuai template; status dan link unduh jika disetujui.
- Pengumuman: kartu list dengan status terbaca; filter per cabang/role; detail membuka panel.
- Tiket: list dengan prioritas/status; detail dengan timeline komentar; lampiran bukti.
- Aset: daftar aset yang dipinjam, due date, ajukan perpanjangan.

## Standar UX Lain
- Error state: pesan jelas + tindakan lanjut (coba lagi/refresh).
- Empty state: ilustrasi ringan + CTA (mis. “Buat pengajuan pertama”).
- Konsistensi tanggal/waktu: gunakan format lokal (dd/mm/yyyy), jam 24h; zona waktu per tenant/cabang bila perlu.
- Bahasa: default Indonesia; siapkan string terpisah untuk lokalisasi.

## Branding & Logo
- Logo dibuat otomatis oleh Gemini Nano Banan selama development; siapkan slot/logo placeholder di navbar/sidebar dan favicon. Pastikan aset dapat diganti mudah (konfigurasi per tenant) dan simpan versi final di storage terkelola.

## Mode Terang & Gelap
- Sediakan toggle light/dark; default mengikuti preferensi sistem jika tidak diatur pengguna.
- Definisikan token warna untuk light/dark (latari, teks, border, surface, accent) dan gunakan kelas/atribut (mis. `data-theme="dark"`).
- Pastikan kontras cukup di kedua mode; ikon/ilustrasi mendukung latar gelap.

## Akses & State Login
- Semua halaman/fitur hanya dapat diakses setelah login; gating per role sesuai RBAC. Tampilkan hanya logo + form login/registrasi sebagai tampilan awal (unauthenticated).
- Pastikan redirect setelah login sesuai role (HRD/Manager/Finance ke dashboard peran, Karyawan ke dashboard karyawan).

## CSS Tokens (contoh)
```css
:root {
  --font-family: "Manrope", system-ui, -apple-system, sans-serif;
  --font-size-body: 14px;
  --font-size-heading: 18px;
  --font-size-meta: 12px;
  --line-height: 1.5;

  --color-text: #0f172a;
  --color-text-subtle: #475569;
  --color-border: #e2e8f0;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-accent: #2563eb;
  --color-success: #16a34a;
  --color-warning: #f59e0b;
  --color-error: #dc2626;
  --color-info: #0ea5e9;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;

  --radius: 8px;
  --shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  --transition: 180ms ease;

  --z-nav: 100;
  --z-dropdown: 200;
  --z-modal: 300;
  --z-toast: 400;
}
```

## Wireframe Ringkas (teks)
- Dashboard HRD (desktop): Topbar (brand + tenant switch + search + notif + avatar) di atas; sidebar kiri dengan menu; konten utama berisi baris kartu (Hadir/Terlambat/Absen, Saldo Cuti, KPI ringkas), grafik tren/heatmap di tengah, tabel pengajuan terbaru di bawah.
- Dashboard Karyawan (mobile): Header ringkas (logo + notif + avatar), kartu saldo cuti, tombol besar Absen (pilih WFO/WFH) + waktu sekarang, jadwal shift hari ini, status pengajuan terakhir, slip gaji terbaru.
- Form pengajuan (desktop): Judul + breadcrumb, form dua kolom (kiri data utama, kanan ringkasan saldo/approval chain), aksi utama di footer sticky, validasi inline.
- Tabel daftar: Header dengan search + filter, tabel dengan kolom status (badge), aksi di ujung kanan, pagination di bawah, skeleton untuk loading.
