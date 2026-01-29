# Report Builder Documentation (Draft)

> @ai:cx — Dokumen front-end untuk integrasi modul laporan (builder). Backend detail di domain CL.

## Tujuan
- Menyediakan UI untuk memilih sumber data (attendance, leave, payroll) dan filter (tenant, departemen, tanggal).
- Output: tabel + ekspor CSV/Excel (di-serve oleh ReportService CL).

## Alur UI
1) Pilih jenis laporan (attendance/leave/payroll).
2) Pilih rentang tanggal & filter org (branch, department, position).
3) Klik "Generate" → memanggil endpoint report.
4) Tampilkan preview tabel + tombol unduh CSV/Excel.

## API (ringkas)
- `GET /api/reports/attendance?startDate=...&endDate=...`
- `GET /api/reports/leave?startDate=...&endDate=...`
- `GET /api/reports/payroll?startDate=...&endDate=...`
- Header: `Accept: text/csv` untuk unduhan.

## State & Komponen yang direkomendasikan
- Gunakan `DateRangePicker`, `Select`, `Table`, `Skeleton`.
- Status badge untuk approval/attendance sesuai `components/data/status-badge`.
- Quick actions untuk preset (mingguan/bulanan).

## Error/Empty Handling
- Empty: gunakan `EmptyState` dengan CTA retry.
- Error: gunakan `ErrorState` + tombol ulangi fetch.
- Loading: `Skeleton` atau `LoadingState`.

## Catatan
- Tenant isolation dan permission check dari backend (CL). Frontend hanya meneruskan filter dan menampilkan hasil.
