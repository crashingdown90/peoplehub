Hai Rey,

Minta tolong untuk bantu menyelesaikan perbaikan security & code quality di proyek PeopleHub.

Repo: git@github.com:crashingdown90/peoplehub.git

Sudah dilakukan audit kode dan ada beberapa issues yang perlu diperbaiki:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CRITICAL (Harus Dikerjakan Dulu)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. npm audit fix
   - Ada vulnerability HIGH di hono & @prisma/dev
   - Jalankan: npm audit fix atau update manual

2. Password Validation Registration
   - File: src/validations/auth.schema.ts
   - Sekarang cuma min(8), tambahkan:
     • Huruf besar (regex /[A-Z]/)
     • Huruf kecil (regex /[a-z]/)
     • Angka (regex /[0-9]/)
     • Karakter spesial (regex /[!@#$%^&*]/)

3. CSRF Validation
   - Infrastructure sudah ada di src/lib/security/csrf.ts
   - Tapi belum diterapkan di endpoints
   - Apply ke: /api/auth/login, /api/auth/register, semua POST

4. Prisma Migrations
   - Folder prisma/migrations/ belum ada
   - Jalankan: npx prisma migrate dev --name initial_schema
   - Commit hasilnya

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 HIGH PRIORITY (Setelah Critical)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. Standardize Response Format
   - Ada 2 format berbeda di API responses
   - Harusnya: {success, data, error: {code, message}}

6. Ganti console.error → Logger
   - Ada 30+ console.error langsung
   - Ganti pakai Logger dari src/lib/monitoring/

7. Add Database Indexes
   - Di prisma/schema.prisma tambahkan:
     @@index([tenantId, approvedByManagerId, status])
     untuk LeaveRequest, TravelRequest, ReimburseRequest

8. Add CSP Header
   - Di next.config.ts tambahkan Content-Security-Policy

9. Redis Rate Limiting
   - Sekarang in-memory, ganti ke Redis store

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Kalau ada pertanyaan atau butuh context lebih lanjut, kabari ya.

Thanks Rey! 🙏
