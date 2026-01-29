# Gap Analysis Document - PeopleHub HRIS

> **Versi:** 2.0 | **Tanggal Update:** 22 Januari 2026 | **Status:** In Progress (~65-70% Complete)

---

## Ringkasan Eksekutif

Dokumen ini berisi analisis gap antara dokumentasi (ERD, Requirements) dengan implementasi aktual di codebase PeopleHub. Tujuannya adalah untuk mengidentifikasi fitur yang belum lengkap, membantu prioritisasi development, dan mengurangi type errors serta inkonsistensi.

---

## 1. Gap Database: ERD vs Prisma Schema

### 1.1 Tabel yang Ada di ERD tapi TIDAK Ada di Prisma

| No | Entitas ERD | Prioritas | Dampak | Catatan |
|----|-------------|-----------|--------|---------|
| 1 | `Session` | HIGH | Auth | Diperlukan untuk token management |
| 2 | `RefreshToken` | HIGH | Auth | Refresh token rotation |
| 3 | `LoginAttempt` | MEDIUM | Security | Rate limiting, brute force protection |
| 4 | `ShiftSwap` | MEDIUM | Attendance | Ada API tapi tidak ada model |
| 5 | `Expense` | HIGH | Finance | Tracking pengeluaran |
| 6 | `ExpenseCategory` | HIGH | Finance | Kategori pengeluaran |
| 7 | `CashAdvance` | HIGH | Finance | Kasbon karyawan |
| 8 | `PayrollComponent` | MEDIUM | Payroll | Komponen gaji dinamis |
| 9 | `LetterCategory` | LOW | Document | Kategori surat |
| 10 | `LetterRequest` | MEDIUM | Document | Request surat keterangan |
| 11 | `AssetLoan` | LOW | Asset | Peminjaman aset |
| 12 | `ViolationNotice` | MEDIUM | HR | Surat peringatan |
| 13 | `LateDeductionRule` | HIGH | Attendance | Aturan potongan terlambat |
| 14 | `ApprovalFlow` | HIGH | Core | Konfigurasi approval dinamis |
| 15 | `BankChangeRequest` | MEDIUM | Employee | Perubahan rekening |
| 16 | `Delegation` | MEDIUM | Workflow | Delegasi tugas/approval |
| 17 | `OvertimeRequest` | HIGH | Attendance | Request lembur formal |

### 1.2 Perbedaan Field

| Model | Field di ERD | Field di Prisma | Status |
|-------|--------------|-----------------|--------|
| Employee | - | `employeeCode` | Tidak ada di ERD |
| Attendance | - | `selfieIn`, `selfieOut` | Tidak ada di ERD |
| Attendance | - | `locationIn`, `locationOut` (JSON) | Tidak ada di ERD |
| Attendance | - | `notes` | Tidak ada di ERD |

### 1.3 Relasi yang Tidak Lengkap

| From | To | Issue |
|------|-----|-------|
| Attendance | AttendanceCorrection | Tidak ada foreign key di Prisma |
| LeaveRequest | Approval | Tidak ada relasi ke approval flow |
| TravelRequest | Expense | Tidak ada relasi |
| ReimburseRequest | ReimburseItem | Ada relasi, tapi Expense di ERD berbeda |

---

## 2. Gap API: Dokumentasi vs Implementasi

### 2.1 API yang Terdokumentasi tapi Belum Diimplementasi

| Endpoint | Method | Deskripsi | Prioritas |
|----------|--------|-----------|-----------|
| `/api/loans` | ALL | Loan/Cash Advance management | HIGH |
| `/api/expenses` | ALL | Expense tracking | HIGH |
| `/api/letters` | ALL | Letter requests | MEDIUM |
| `/api/assets` | ALL | Asset loan management | LOW |
| `/api/violations` | ALL | Violation notices | MEDIUM |
| `/api/bank-changes` | ALL | Bank change requests | MEDIUM |
| `/api/delegations` | ALL | Work delegation | MEDIUM |
| `/api/overtime/requests` | ALL | Overtime requests | HIGH |
| `/api/admin/approval-flows` | ALL | Approval flow config | HIGH |
| `/api/admin/late-rules` | ALL | Late deduction rules | HIGH |
| `/api/admin/holidays` | ALL | Holiday management | MEDIUM |

### 2.2 API yang Ada tapi Tidak Lengkap

| Endpoint | Issue | Yang Kurang |
|----------|-------|-------------|
| `/api/travel/requests` | Partial | Tidak ada service layer |
| `/api/reimburse/requests` | Partial | Tidak ada service layer |
| `/api/approvals/*` | Partial | Tidak ada generic approval service |
| `/api/admin/shifts/swap` | Partial | Approval flow tidak lengkap |

---

## 3. Gap Service Layer

### 3.1 Service yang Perlu Dibuat

| Service | File | Fungsi Utama | Prioritas |
|---------|------|--------------|-----------|
| TravelService | `travel.service.ts` | CRUD travel requests, approval flow | HIGH |
| ReimburseService | `reimburse.service.ts` | CRUD reimburse, expense tracking | HIGH |
| ExpenseService | `expense.service.ts` | Expense categories, tracking | HIGH |
| LoanService | `loan.service.ts` | Cash advance, settlement | HIGH |
| OvertimeService | `overtime.service.ts` | OT requests, rate calculation | HIGH |
| ApprovalFlowService | `approval-flow.service.ts` | Dynamic approval chains | HIGH |
| LetterService | `letter.service.ts` | Letter templates, generation | MEDIUM |
| AssetService | `asset.service.ts` | Asset loan, tracking | LOW |
| ViolationService | `violation.service.ts` | Disciplinary management | MEDIUM |
| DelegationService | `delegation.service.ts` | Work delegation | MEDIUM |
| HolidayService | `holiday.service.ts` | Holiday calendar | MEDIUM |
| LateRuleService | `late-rule.service.ts` | Late deduction config | HIGH |

### 3.2 Service yang Perlu Diperbaiki

| Service | Issue | Solusi |
|---------|-------|--------|
| `payroll.service.ts` | Hardcoded allowances | Integrasi dengan PayrollComponent |
| `attendance.service.ts` | No overtime request flow | Tambah overtime request logic |
| `leave.service.ts` | No delegation support | Integrasi dengan Delegation |
| `shift.service.ts` | Shift swap tidak lengkap | Tambah approval workflow |

---

## 4. Gap Pages/UI

### 4.1 Pages yang Terdokumentasi tapi Belum Ada

| Page | Path | Prioritas | Catatan |
|------|------|-----------|---------|
| Holiday Calendar | `/admin/holidays` | MEDIUM | Kelola hari libur |
| Attendance Policy | `/admin/policies/attendance` | HIGH | Config rules |
| Leave Policy | `/admin/policies/leave` | HIGH | Leave rules |
| Reimburse Policy | `/admin/policies/reimburse` | MEDIUM | Reimburse rules |
| Loan Management | `/loans` | HIGH | Kasbon karyawan |
| Expense Tracking | `/expenses` | HIGH | Tracking pengeluaran |
| Letter Requests | `/letters` | MEDIUM | Surat keterangan |
| Asset Loan | `/assets` | LOW | Peminjaman aset |
| Violation Management | `/admin/violations` | MEDIUM | Surat peringatan |
| Bank Change | `/profile/bank-change` | MEDIUM | Ubah rekening |
| Delegation | `/delegations` | MEDIUM | Delegasi tugas |
| Overtime Requests | `/overtime` | HIGH | Request lembur |
| Approval Flow Config | `/admin/approval-flows` | HIGH | Setup approval |
| Organization Structure | `/admin/organization` | LOW | Struktur organisasi |
| Security Settings | `/admin/security` | MEDIUM | 2FA, device policy |
| Super Admin Tenants | `/superadmin/tenants` | LOW | Tenant management |

### 4.2 Pages yang Ada tapi Tidak Lengkap

| Page | Path | Issue | Yang Kurang |
|------|------|-------|-------------|
| Travel | `/travel` | Partial | Expense tracking UI |
| Reimburse | `/reimburse` | Partial | Item detail, receipt |
| Shifts | `/admin/shifts` | Partial | Shift swap approval UI |
| Reports | `/reports` | Partial | Scheduled reports |
| Settings | `/settings` | Partial | Policy configuration |

---

## 5. Gap TypeScript Types

### 5.1 Types yang Perlu Ditambahkan

```typescript
// File: src/types/loan.types.ts
export interface Loan { ... }
export interface CashAdvance { ... }

// File: src/types/expense.types.ts
export interface Expense { ... }
export interface ExpenseCategory { ... }

// File: src/types/overtime.types.ts
export interface OvertimeRequest { ... }

// File: src/types/letter.types.ts
export interface LetterCategory { ... }
export interface LetterRequest { ... }

// File: src/types/asset.types.ts
export interface AssetLoan { ... }

// File: src/types/violation.types.ts
export interface ViolationNotice { ... }

// File: src/types/delegation.types.ts
export interface Delegation { ... }

// File: src/types/approval-flow.types.ts
export interface ApprovalFlow { ... }
export interface ApprovalStep { ... }
```

### 5.2 Enum yang Perlu Ditambahkan

```typescript
// Di src/types/enums.ts

export enum LoanStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    DISBURSED = 'DISBURSED',
    SETTLED = 'SETTLED',
}

export enum OvertimeType {
    REGULAR = 'REGULAR',
    HOLIDAY = 'HOLIDAY',
    WEEKEND = 'WEEKEND',
}

export enum OvertimeStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum ExpenseStatus {
    PENDING = 'PENDING',
    APPROVED_MANAGER = 'APPROVED_MANAGER',
    APPROVED_HRD = 'APPROVED_HRD',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PAID = 'PAID',
}

export enum AssetLoanStatus {
    ACTIVE = 'ACTIVE',
    RETURNED = 'RETURNED',
    OVERDUE = 'OVERDUE',
    LOST = 'LOST',
}

export enum DelegationType {
    APPROVAL = 'APPROVAL',
    TASK = 'TASK',
    ALL = 'ALL',
}

export enum BankChangeStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}
```

---

## 6. Prioritas Implementasi

### Phase 1: Critical (Core Features) - 2-3 minggu

1. **Overtime Request Management**
   - Prisma: Tambah model `OvertimeRequest`
   - Service: `overtime.service.ts`
   - API: `/api/overtime/*`
   - Page: `/overtime`

2. **Late Deduction Rules**
   - Prisma: Tambah model `LateDeductionRule`
   - Service: Update `penalty.service.ts`
   - API: `/api/admin/late-rules/*`
   - Page: `/admin/policies/attendance`

3. **Approval Flow Configuration**
   - Prisma: Tambah model `ApprovalFlow`, `ApprovalStep`
   - Service: `approval-flow.service.ts`
   - API: `/api/admin/approval-flows/*`
   - Page: `/admin/approval-flows`

4. **Travel & Reimburse Service Layer**
   - Service: `travel.service.ts`, `reimburse.service.ts`
   - Update existing APIs

### Phase 2: High Priority - 2-3 minggu

5. **Expense Management**
   - Prisma: Tambah `Expense`, `ExpenseCategory`
   - Service: `expense.service.ts`
   - API: `/api/expenses/*`
   - Page: `/expenses`

6. **Loan/Cash Advance**
   - Prisma: Tambah `CashAdvance`
   - Service: `loan.service.ts`
   - API: `/api/loans/*`
   - Page: `/loans`

7. **Shift Swap Completion**
   - Prisma: Tambah `ShiftSwap`
   - Service: Update `shift.service.ts`
   - API: Update `/api/admin/shifts/swap/*`
   - Page: Update `/admin/shifts`

8. **Holiday Calendar**
   - Service: `holiday.service.ts`
   - API: `/api/admin/holidays/*`
   - Page: `/admin/holidays`

### Phase 3: Medium Priority - 2 minggu

9. **Letter Management**
   - Prisma: Tambah `LetterCategory`, `LetterRequest`
   - Service: `letter.service.ts`
   - API: `/api/letters/*`
   - Page: `/letters`

10. **Violation/Disciplinary**
    - Prisma: Tambah `ViolationNotice`
    - Service: `violation.service.ts`
    - API: `/api/admin/violations/*`
    - Page: `/admin/violations`

11. **Bank Change Requests**
    - Prisma: Tambah `BankChangeRequest`
    - Service: `bank-change.service.ts`
    - API: `/api/bank-changes/*`
    - Page: `/profile/bank-change`

12. **Work Delegation**
    - Prisma: Tambah `Delegation`
    - Service: `delegation.service.ts`
    - API: `/api/delegations/*`
    - Page: `/delegations`

### Phase 4: Low Priority - 1-2 minggu

13. **Asset Loan Management**
    - Prisma: Tambah `AssetLoan`
    - Service: `asset.service.ts`
    - API: `/api/assets/*`
    - Page: `/assets`

14. **Session Management**
    - Prisma: Tambah `Session`, `RefreshToken`, `LoginAttempt`
    - Service: Update auth services
    - Middleware: Token refresh

15. **Organization Structure**
    - Page: `/admin/organization`
    - Visualization

---

## 7. Checklist Implementasi

### Database (Prisma Schema)

- [ ] Tambah model `OvertimeRequest`
- [ ] Tambah model `LateDeductionRule`
- [ ] Tambah model `ApprovalFlow` dan `ApprovalStep`
- [ ] Tambah model `Expense` dan `ExpenseCategory`
- [ ] Tambah model `CashAdvance`
- [ ] Tambah model `ShiftSwap`
- [ ] Tambah model `LetterCategory` dan `LetterRequest`
- [ ] Tambah model `ViolationNotice`
- [ ] Tambah model `BankChangeRequest`
- [ ] Tambah model `Delegation`
- [ ] Tambah model `AssetLoan`
- [ ] Tambah model `Session`, `RefreshToken`, `LoginAttempt`
- [ ] Sinkronkan enum di Prisma dengan ERD
- [ ] Jalankan migration

### Types (TypeScript)

- [ ] Buat `src/types/overtime.types.ts`
- [ ] Buat `src/types/loan.types.ts`
- [ ] Buat `src/types/expense.types.ts`
- [ ] Buat `src/types/letter.types.ts`
- [ ] Buat `src/types/asset.types.ts`
- [ ] Buat `src/types/violation.types.ts`
- [ ] Buat `src/types/delegation.types.ts`
- [ ] Buat `src/types/approval-flow.types.ts`
- [ ] Update `src/types/enums.ts` dengan enum baru
- [ ] Update barrel export di `src/types/index.ts`

### Services

- [ ] Buat `src/services/overtime.service.ts`
- [ ] Buat `src/services/loan.service.ts`
- [ ] Buat `src/services/expense.service.ts`
- [ ] Buat `src/services/travel.service.ts`
- [ ] Buat `src/services/reimburse.service.ts`
- [ ] Buat `src/services/letter.service.ts`
- [ ] Buat `src/services/asset.service.ts`
- [ ] Buat `src/services/violation.service.ts`
- [ ] Buat `src/services/delegation.service.ts`
- [ ] Buat `src/services/approval-flow.service.ts`
- [ ] Buat `src/services/late-rule.service.ts`
- [ ] Buat `src/services/holiday.service.ts`
- [ ] Update `src/services/payroll.service.ts` untuk komponen dinamis
- [ ] Update `src/services/attendance.service.ts` untuk overtime integration

### API Routes

- [ ] Buat `/api/overtime/*` routes
- [ ] Buat `/api/loans/*` routes
- [ ] Buat `/api/expenses/*` routes
- [ ] Buat `/api/letters/*` routes
- [ ] Buat `/api/assets/*` routes
- [ ] Buat `/api/admin/violations/*` routes
- [ ] Buat `/api/bank-changes/*` routes
- [ ] Buat `/api/delegations/*` routes
- [ ] Buat `/api/admin/approval-flows/*` routes
- [ ] Buat `/api/admin/late-rules/*` routes
- [ ] Buat `/api/admin/holidays/*` routes
- [ ] Update travel & reimburse routes dengan service

### Pages

- [ ] Buat `/overtime` page
- [ ] Buat `/loans` page
- [ ] Buat `/expenses` page
- [ ] Buat `/letters` page
- [ ] Buat `/assets` page
- [ ] Buat `/delegations` page
- [ ] Buat `/profile/bank-change` page
- [ ] Buat `/admin/violations` page
- [ ] Buat `/admin/approval-flows` page
- [ ] Buat `/admin/policies/attendance` page
- [ ] Buat `/admin/policies/leave` page
- [ ] Buat `/admin/holidays` page
- [ ] Update `/admin/shifts` untuk shift swap UI
- [ ] Update `/travel` untuk expense integration
- [ ] Update `/reimburse` untuk item details

### Components

- [ ] Buat komponen untuk overtime
- [ ] Buat komponen untuk loan/cash advance
- [ ] Buat komponen untuk expense tracking
- [ ] Buat komponen untuk letter requests
- [ ] Buat komponen untuk asset loan
- [ ] Buat komponen untuk violation notices
- [ ] Buat komponen untuk delegation
- [ ] Buat komponen untuk approval flow builder
- [ ] Update shift components untuk swap UI

### Constants & Validations

- [ ] Tambah constants untuk fitur baru di `src/constants/`
- [ ] Tambah validation schemas di `src/validations/`

### Tests

- [ ] Unit tests untuk services baru
- [ ] API tests untuk routes baru
- [ ] E2E tests untuk flows kritis

---

## 8. Dokumen Terkait

- [ERD](../03-architecture/erd.md) - Entity Relationship Diagram
- [Pages List](../02-requirements/pages-list.md) - Daftar halaman
- [API Specification](../04-api/specification.md) - Spesifikasi API
- [User Stories](../02-requirements/user-stories.md) - Kebutuhan pengguna

---

## 9. Catatan Penting

1. **Sebelum implementasi**, pastikan Prisma schema disinkronkan dengan ERD
2. **Types harus dibuat terlebih dahulu** sebelum service dan API
3. **Service layer wajib ada** untuk semua business logic (jangan langsung di route)
4. **Gunakan approval flow generik** untuk semua request yang perlu approval
5. **Semua fitur baru harus tenant-isolated** (filter by `tenantId`)

---

*Dokumen ini akan diupdate seiring progress development.*
