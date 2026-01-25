# Troubleshooting Guide - PeopleHub

> Panduan pemecahan masalah umum untuk developer dan pengguna.

---

## Daftar Isi

1. [Development Setup](#development-setup)
2. [Database Issues](#database-issues)
3. [Authentication](#authentication)
4. [Frontend Issues](#frontend-issues)
5. [API Errors](#api-errors)
6. [Attendance & Camera](#attendance--camera)
7. [Production Issues](#production-issues)

---

## Development Setup

### ❌ Error: `prisma generate` failed

**Gejala:**
```
Error: Could not find Prisma Schema at expected path
```

**Solusi:**
```bash
# Pastikan di direktori yang benar
cd peoplehub-app

# Jalankan ulang
npx prisma generate
```

---

### ❌ Error: `npm install` gagal dengan node-gyp

**Gejala:**
```
gyp ERR! build error
```

**Solusi:**
```bash
# Mac
xcode-select --install

# Ubuntu
sudo apt install build-essential

# Retry install
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ Port 3001 sudah digunakan

**Gejala:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solusi:**
```bash
# Cari proses yang menggunakan port
lsof -i :3001

# Kill proses
kill -9 <PID>

# Atau gunakan port lain
PORT=3002 npm run dev
```

---

## Database Issues

### ❌ Error: Connection refused / ECONNREFUSED

**Gejala:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solusi:**
```bash
# Cek PostgreSQL running
# Mac
brew services start postgresql

# Ubuntu  
sudo systemctl start postgresql

# Docker
docker start peoplehub-db
```

---

### ❌ Error: Database does not exist

**Gejala:**
```
error: database "peoplehub_dev" does not exist
```

**Solusi:**
```bash
# Buat database
createdb peoplehub_dev

# Atau via psql
psql -U postgres -c "CREATE DATABASE peoplehub_dev;"
```

---

### ❌ Error: Prisma migrate failed

**Gejala:**
```
Error: P3009 migrate found failed migrations
```

**Solusi:**
```bash
# Reset migrasi (HATI-HATI: hapus semua data!)
npx prisma migrate reset

# Atau resolve manual
npx prisma migrate resolve --rolled-back <migration_name>
```

---

### ❌ Error: Prisma Client outdated

**Gejala:**
```
The Prisma Client is outdated
```

**Solusi:**
```bash
npx prisma generate
# Restart dev server
```

---

## Authentication

### ❌ Error: Invalid token / JWT expired

**Gejala:**
- Redirect terus ke login
- API return 401 Unauthorized

**Solusi:**
1. Logout dan login ulang
2. Clear browser cookies
3. Cek `JWT_EXPIRES_IN` di `.env.local`

---

### ❌ Error: User not found setelah login

**Gejala:**
```
Error: User with email xxx not found
```

**Solusi:**
```bash
# Cek user di database
npx prisma studio
# Buka tabel User, cari email

# Jika tidak ada, re-seed
npx prisma db seed
```

---

### ❌ Login berhasil tapi redirect ke login lagi

**Kemungkinan penyebab:**
1. Cookie tidak tersimpan (browser settings)
2. `JWT_SECRET` berbeda antara dev/prod
3. Domain mismatch

**Solusi:**
- Cek browser mengizinkan cookies
- Pastikan `JWT_SECRET` konsisten
- Gunakan http://localhost:3001 (bukan IP)

---

## Frontend Issues

### ❌ Error: Hydration mismatch

**Gejala:**
```
Warning: Text content did not match
```

**Solusi:**
```tsx
// Wrap dengan client check
'use client'
import { useEffect, useState } from 'react'

const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null
```

---

### ❌ Error: Module not found

**Gejala:**
```
Module not found: Can't resolve '@/components/xxx'
```

**Solusi:**
```bash
# Cek file exists
ls src/components/xxx

# Cek tsconfig paths
cat tsconfig.json | grep paths

# Clear cache
rm -rf .next
npm run dev
```

---

### ❌ CSS/Tailwind tidak diterapkan

**Kemungkinan penyebab:**
1. Class name salah
2. CSS belum di-import
3. Cache issue

**Solusi:**
```bash
# Restart dengan clear cache
rm -rf .next
npm run dev
```

---

## API Errors

### ❌ Error 400: Bad Request

**Artinya:** Data request tidak valid

**Cek:**
1. Format JSON benar
2. Required fields terisi
3. Data type sesuai (string vs number)

**Debug:**
```bash
# Cek request di browser DevTools > Network
# Lihat Request Payload
```

---

### ❌ Error 401: Unauthorized

**Artinya:** Token tidak valid atau expired

**Solusi:**
1. Login ulang
2. Cek header `Authorization: Bearer <token>`

---

### ❌ Error 403: Forbidden

**Artinya:** User tidak punya permission

**Cek:**
1. Role user sudah benar?
2. Endpoint memerlukan role tertentu?

```bash
# Cek role di database
npx prisma studio
# Lihat tabel User > role
```

---

### ❌ Error 404: Not Found

**Artinya:** Endpoint atau resource tidak ditemukan

**Cek:**
1. URL sudah benar?
2. ID/slug valid?
3. Data exists di database?

---

### ❌ Error 500: Internal Server Error

**Artinya:** Error di server

**Debug:**
```bash
# Cek terminal/logs
# Error detail biasanya muncul di console
npm run dev
```

---

## Attendance & Camera

### ❌ Camera tidak bisa diakses

**Gejala:**
- Camera request denied
- Black screen saat clock in

**Solusi:**
1. **Browser permissions:**
   - Chrome: Settings > Privacy > Site Settings > Camera
   - Safari: Preferences > Websites > Camera
   
2. **HTTPS requirement:**
   - Development: localhost otomatis aman
   - Production: harus HTTPS

3. **Hardware check:**
   ```bash
   # Mac: System Preferences > Security & Privacy > Camera
   ```

---

### ❌ Selfie upload failed

**Kemungkinan penyebab:**
1. File terlalu besar (max 5MB)
2. Format tidak didukung
3. Storage penuh

**Solusi:**
```bash
# Cek disk space
df -h

# Cek upload folder
ls -la public/uploads/
```

---

### ❌ GPS/Location tidak akurat

**Solusi:**
1. Izinkan location access di browser
2. Coba di outdoor untuk sinyal lebih baik
3. Mode WFH tidak memerlukan GPS

---

## Production Issues

### ❌ Application tidak bisa diakses (502)

**Lihat:** [runbook.md](07-operations/runbook.md#iss-001-application-not-loading-502-bad-gateway)

```bash
# Quick check
ssh deploy@server
docker ps | grep peoplehub
docker-compose logs -f app
```

---

### ❌ Database connection exhausted

**Gejala:**
```
Error: Too many connections
```

**Solusi:**
```bash
# Cek active connections
docker exec -it peoplehub-db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Increase pool di schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Tambah ini
  relationMode = "prisma"
}

// Dan di code
// connection_limit=10
```

---

### ❌ Slow performance

**Checklist:**
1. Cek server resources: `htop`
2. Cek slow queries di PostgreSQL
3. Cek Redis cache
4. Lihat [runbook.md](07-operations/runbook.md#iss-003-slow-response-time--3-seconds)

---

## Error Codes Reference

| Code | Deskripsi | Solusi |
|------|-----------|--------|
| AUTH_001 | Token invalid | Login ulang |
| AUTH_002 | Token expired | Login ulang |
| AUTH_003 | No permission | Hubungi admin untuk role |
| USER_001 | User not found | Cek email/registrasi |
| USER_002 | Account locked | Tunggu atau hubungi HRD |
| TENANT_001 | Tenant invalid | Cek konfigurasi tenant |
| DB_001 | Connection failed | Cek database running |
| UPLOAD_001 | File too large | Kompres file < 5MB |
| UPLOAD_002 | Invalid format | Gunakan JPG/PNG |

---

## Masih Bermasalah?

1. **Cek logs lengkap:**
   ```bash
   # Development
   npm run dev 2>&1 | tee debug.log
   
   # Production
   docker-compose logs -f > debug.log
   ```

2. **Buat issue dengan informasi:**
   - Screenshot error
   - Langkah reproduksi
   - Environment (OS, browser, node version)
   - Log yang relevan

3. **Kontak:**
   - Channel: #dev-peoplehub
   - Email: tech@kreatifindo.com

---

**Version:** 1.0 | **Last Updated:** 23 Januari 2026
