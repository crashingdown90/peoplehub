# API Documentation (Draft)

> @ai:cx — Ringkasan dokumentasi API untuk front-end konsumsi. Detail kontrak berada di `20-api-specification.md` dan service layer milik CL.

## Konvensi
- Base URL: `/api`
- Auth: Bearer token / session cookie (NextAuth) – lihat `src/lib/auth` (CL domain)
- Response envelope (service pattern):
```json
{
  "success": true,
  "data": {},
  "error": { "code": "ERR_CODE", "message": "Readable message" }
}
```

## Endpoint Inti (ringkas)
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`
- Registrasi: `POST /api/auth/register`, `POST /api/admin/registrations/{id}/approve|reject`
- Attendance: `GET /api/attendance/today`, `POST /api/attendance/clock-in|clock-out`
- Leave: `GET /api/leave/requests`, `POST /api/leave/requests`, `PATCH /api/leave/requests/{id}`
- Notifications: `GET /api/notifications`, `POST /api/notifications/read-all`
- Payroll: `GET /api/payroll/payslips`
- Reports: `GET /api/reports/*` (lihat CL spec)

## Error Codes (contoh)
- `AUTH_UNAUTHORIZED`, `AUTH_FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `RATE_LIMITED`

## Status Mapping → UI
- Approval: `PENDING|APPROVED|REJECTED|CANCELLED`
- Attendance: `PRESENT|LATE|ABSENT|LEAVE|HOLIDAY`
- Payroll: `DRAFT|PUBLISHED|PAID`

## Catatan
- Detail lengkap tetap mengacu ke dokumen backend (CL). Frontend wajib konsumsi type dari AG (`@/types`).
