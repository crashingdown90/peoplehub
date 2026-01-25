# Compliance Checklist PeopleHub

> **Versi:** 1.0 | **Tanggal:** 23 Januari 2026 | **Status:** Final

## Tujuan

Checklist ini digunakan untuk memverifikasi bahwa deliverables (kode, dokumentasi, konfigurasi) mematuhi standar yang telah ditetapkan untuk proyek PeopleHub.

---

## Cara Penggunaan

1. Gunakan checklist yang sesuai dengan jenis deliverable
2. Centang semua item yang applicable
3. Jika ada item yang tidak terpenuhi, catat alasannya
4. Deliverable harus memenuhi minimal **90%** item applicable untuk lolos review

---

## 1. Checklist Dokumentasi

### 1.1 Format Dokumen

- [ ] Dokumen memiliki header dengan Versi, Tanggal, dan Status
- [ ] Ada section "Tujuan" di awal dokumen
- [ ] Heading menggunakan format yang konsisten (Title Case untuk H1-H2)
- [ ] Terdapat section "Dokumen Terkait" di akhir (jika relevan)
- [ ] Semua link internal berfungsi dan mengarah ke file yang benar
- [ ] Menggunakan Bahasa Indonesia atau English secara konsisten (tidak campur)

### 1.2 Penamaan File

- [ ] Nama file menggunakan `kebab-case`
- [ ] Tidak ada spasi dalam nama file
- [ ] Extension file sesuai (`.md` untuk markdown)
- [ ] Nama file deskriptif dan mencerminkan konten

### 1.3 Konten

- [ ] Dokumen memiliki struktur yang jelas
- [ ] Tabel digunakan untuk data terstruktur
- [ ] Code blocks memiliki language identifier
- [ ] Tidak ada typo atau grammatical errors yang signifikan
- [ ] Informasi sensitif (credentials, tokens) tidak terekspos

---

## 2. Checklist Code Review

### 2.1 Naming Conventions

- [ ] Variables menggunakan `camelCase`
- [ ] Constants menggunakan `SCREAMING_SNAKE_CASE`
- [ ] Functions menggunakan `camelCase` dengan verb prefix
- [ ] React Components menggunakan `PascalCase`
- [ ] File names sesuai dengan naming convention (lihat Standard Guide)
- [ ] Boolean variables memiliki prefix `is/has/can/should`

### 2.2 Code Structure

- [ ] Imports diurutkan sesuai standar (React → Third-party → Internal → Types → Relative)
- [ ] Tidak ada unused imports
- [ ] Tidak ada commented-out code (kecuali dengan alasan dokumentasi)
- [ ] Functions tidak melebihi 50 lines
- [ ] Components tidak melebihi 200 lines

### 2.3 TypeScript

- [ ] Semua variables/parameters memiliki type definition
- [ ] Tidak menggunakan `any` type (kecuali dengan justifikasi)
- [ ] Interfaces digunakan untuk object shapes
- [ ] Type unions digunakan untuk status/variant values
- [ ] Return types eksplisit untuk functions

### 2.4 React Best Practices

- [ ] Tidak ada inline styles (gunakan Tailwind classes)
- [ ] Event handlers menggunakan naming pattern `handle{Event}`
- [ ] Props callbacks menggunakan naming pattern `on{Event}`
- [ ] useEffect memiliki dependency array yang benar
- [ ] Key prop digunakan untuk list items
- [ ] Tidak ada anonymous arrow functions di JSX callbacks

### 2.5 Error Handling

- [ ] Try-catch blocks untuk async operations
- [ ] Error states ditampilkan dengan user-friendly messages
- [ ] Console.log dihapus sebelum commit (gunakan proper logging)
- [ ] Form validation menggunakan schema-based validation (Zod)

### 2.6 Security

- [ ] Tidak ada hardcoded credentials atau API keys
- [ ] User input divalidasi sebelum diproses
- [ ] Tenant isolation diimplementasikan (tenant_id filter)
- [ ] CSRF protection aktif untuk form submissions
- [ ] XSS prevention (no dangerouslySetInnerHTML tanpa sanitization)

---

## 3. Checklist Database Changes

### 3.1 Schema

- [ ] Table name menggunakan `snake_case` singular
- [ ] Column names menggunakan `snake_case`
- [ ] Primary key menggunakan `id` (UUID)
- [ ] Foreign keys menggunakan `{table}_id` format
- [ ] `created_at` dan `updated_at` columns ada di semua main tables
- [ ] `tenant_id` ada di semua tenant-scoped tables

### 3.2 Migration

- [ ] Migration file ada untuk semua schema changes
- [ ] Migration dapat di-rollback
- [ ] Data preservation dipertimbangkan untuk breaking changes
- [ ] Index ditambahkan untuk kolom yang sering di-query

### 3.3 Query

- [ ] Semua queries memiliki tenant filter
- [ ] Pagination diimplementasikan untuk list queries
- [ ] Soft delete digunakan untuk data dengan audit requirement
- [ ] Tidak ada N+1 query problem

---

## 4. Checklist API Endpoints

### 4.1 Design

- [ ] Endpoint path menggunakan `kebab-case`
- [ ] HTTP methods sesuai dengan aksi (GET/POST/PUT/PATCH/DELETE)
- [ ] Response format mengikuti standar (`success`, `data`, `message`, `meta`)
- [ ] Error format mengikuti standar (`success: false`, `error` object)
- [ ] HTTP status codes benar (200/201/400/401/403/404/422/500)

### 4.2 Documentation

- [ ] Endpoint terdokumentasi di API specification
- [ ] Request/response examples tersedia
- [ ] Validation rules terdokumentasi
- [ ] Error codes terdokumentasi

### 4.3 Security

- [ ] Authentication required untuk protected endpoints
- [ ] Role-based authorization diimplementasikan
- [ ] Rate limiting aktif
- [ ] Input validation diimplementasikan

### 4.4 Headers

- [ ] `X-Tenant-ID` required untuk tenant-scoped endpoints
- [ ] `Authorization: Bearer` required untuk protected endpoints
- [ ] `Content-Type: application/json` digunakan

---

## 5. Checklist UI/Frontend

### 5.1 Design System

- [ ] Menggunakan design tokens dari `design-system.md`
- [ ] Warna mengikuti color palette yang ditetapkan
- [ ] Typography menggunakan font yang ditetapkan (Manrope/Inter)
- [ ] Spacing menggunakan grid 4px/8px system
- [ ] Border radius konsisten (8px untuk components)

### 5.2 Components

- [ ] Menggunakan components dari UI library yang ada
- [ ] Tidak ada inline styles
- [ ] Tailwind classes digunakan untuk styling
- [ ] Dark mode support (jika applicable)
- [ ] Focus states visible untuk accessibility

### 5.3 Responsive

- [ ] Mobile-first approach
- [ ] Breakpoints sesuai standar (sm/md/lg/xl/2xl)
- [ ] Touch targets minimal 44x44px pada mobile
- [ ] Table dapat di-scroll horizontal pada mobile

### 5.4 Accessibility

- [ ] Alt text untuk images
- [ ] aria-label untuk icon buttons
- [ ] Form fields memiliki associated labels
- [ ] Color contrast memenuhi WCAG 2.1 (4.5:1 untuk text)
- [ ] Keyboard navigation berfungsi

### 5.5 User Experience

- [ ] Loading states ditampilkan (skeleton/spinner)
- [ ] Empty states informatif dengan CTA
- [ ] Error states jelas dengan suggested action
- [ ] Toast notifications untuk user feedback
- [ ] Confirmation dialogs untuk destructive actions

---

## 6. Checklist Git & Deployment

### 6.1 Branch

- [ ] Branch name mengikuti format `{type}/{ticket}-{description}`
- [ ] Branch dibuat dari `develop` (atau branch yang sesuai)
- [ ] Branch sudah sync dengan latest `develop`

### 6.2 Commits

- [ ] Commit message mengikuti format `{type}({scope}): {subject}`
- [ ] Setiap commit fokus pada satu perubahan
- [ ] Tidak ada commit dengan message "fix" atau "update" saja
- [ ] Tidak ada credentials atau secrets di commit history

### 6.3 Pull Request

- [ ] PR title deskriptif
- [ ] PR description menjelaskan perubahan
- [ ] Tests passing
- [ ] Linting passing
- [ ] Minimal 1 review approval
- [ ] Linked to ticket/issue (jika ada)

### 6.4 Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Feature flags configured (jika applicable)
- [ ] Rollback plan documented

---

## 7. Checklist Testing

### 7.1 Unit Tests

- [ ] Test file ada untuk modules/components baru
- [ ] Test file naming: `{filename}.test.ts(x)`
- [ ] Happy path tested
- [ ] Edge cases tested
- [ ] Mocking digunakan untuk external dependencies

### 7.2 Integration Tests

- [ ] API endpoints tested
- [ ] Database operations tested
- [ ] Authentication/authorization tested

### 7.3 E2E Tests

- [ ] Critical user journeys tested
- [ ] Form submissions tested
- [ ] Error scenarios tested

### 7.4 Coverage

- [ ] Coverage tidak menurun dari baseline
- [ ] Critical paths memiliki coverage tinggi (>80%)

---

## Quick Reference

### Severity Levels

| Level | Description |
|-------|-------------|
| 🔴 **Critical** | Harus diperbaiki sebelum merge |
| 🟠 **Major** | Harus diperbaiki, bisa di-track sebagai follow-up |
| 🟡 **Minor** | Nice to have, tidak blocking |
| ⚪ **N/A** | Not applicable untuk deliverable ini |

### Passing Criteria

| Deliverable Type | Minimum Compliance |
|------------------|-------------------|
| Documentation | 90% applicable items |
| Code (Feature) | 95% Critical + Major items |
| Code (Hotfix) | 100% Critical items |
| Database Migration | 100% all items |

---

## Dokumen Terkait

- [standard-guide.md](standard-guide.md) - Detail standar penamaan dan format
- [doc-template.md](09-templates/doc-template.md) - Template dokumen
- [design-system.md](05-frontend/design-system.md) - Design tokens dan UI standards
- [guidelines.md](06-database/guidelines.md) - Database conventions
