# Feature Spec: Auto Employee Number Generation

> **Versi:** 1.0 | **Tanggal:** 23 Januari 2026 | **Status:** Final
> **Author:** Senior Engineer Specification Writer

---

## 1. Ringkasan Fitur

Sistem generate nomor karyawan (Employee Number / NIK Karyawan) secara otomatis saat HRD meng-approve registrasi karyawan baru. Format nomor mengikuti pola `{COMPANY_CODE}{YEAR}{SEQUENCE}` yang unik per tenant dan tahun.

---

## 2. Definisi Presisi

| Istilah | Definisi Eksak |
|---------|----------------|
| **Employee Number** | Identifier unik karyawan dalam format `{CODE}{YEAR}{SEQ}`, tersimpan di `employee.employee_number` |
| **Company Code** | Kode 3 huruf uppercase yang merepresentasikan tenant, tersimpan di `tenant.code` |
| **Sequence** | Angka urut 5 digit dengan leading zeros, di-increment per tahun per tenant |
| **Fiscal Year** | Tahun kalender (Januari-Desember) yang digunakan untuk reset sequence |
| **Collision** | Kondisi dimana 2 proses mencoba generate nomor yang sama secara bersamaan |

---

## 3. Format Specification

### 3.1 Pattern

```
{COMPANY_CODE}{YEAR}{SEQUENCE}

┌─────────────┬──────────┬─────────────┐
│ COMPANY_CODE│   YEAR   │  SEQUENCE   │
│   3 chars   │ 4 digits │  5 digits   │
└─────────────┴──────────┴─────────────┘

Total Length: 12 characters (fixed)
```

### 3.2 Company Codes

| Tenant Name | Code | Example Employee Number |
|-------------|------|-------------------------|
| PT. KREATIFINDO ABADI SEJAHTERA | `KRT` | KRT202600001 |
| PT. VIOLET GLOBAL INDONESIA | `VIO` | VIO202600001 |
| PT. CYBER MULTI ARTHA | `CMA` | CMA202600001 |
| CV. CYBER MULTI MANDIRI | `CMM` | CMM202600001 |

### 3.3 Validation Regex

```typescript
const EMPLOYEE_NUMBER_REGEX = /^[A-Z]{3}\d{9}$/;

// Breakdown:
// ^[A-Z]{3}  - Exactly 3 uppercase letters at start
// \d{9}$     - Exactly 9 digits until end
//              (4 for year + 5 for sequence)

// Examples:
// ✅ KRT202600001
// ✅ VIO202600123
// ❌ KRT20260001   (only 4 sequence digits)
// ❌ krt202600001  (lowercase)
// ❌ KRT-2026-00001 (contains dashes)
```

---

## 4. Sequence Management

### 4.1 Sequence Table Schema

```prisma
model EmployeeNumberSequence {
  id        String   @id @default(cuid())
  tenantId  String
  year      Int
  lastSeq   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, year])
  @@map("employee_number_sequences")
}
```

### 4.2 Sequence Rules

| Rule ID | Kondisi | Aksi |
|---------|---------|------|
| SEQ-01 | Tahun baru (year change) | Sequence reset ke 1 |
| SEQ-02 | Tenant pertama kali generate | Create sequence record dengan lastSeq = 0 |
| SEQ-03 | lastSeq mencapai 99999 | ERROR: "Kapasitas nomor karyawan tahun {year} sudah penuh" |
| SEQ-04 | Concurrent generation requests | Database-level locking untuk prevent collision |

### 4.3 Sequence Capacity

| Year | Min Sequence | Max Sequence | Total Capacity |
|------|--------------|--------------|----------------|
| 2026 | 00001 | 99999 | 99,999 employees per tenant per year |

---

## 5. Generation Algorithm

### 5.1 Core Algorithm

```typescript
interface GenerateEmployeeNumberInput {
  tenantId: string;
}

interface GenerateEmployeeNumberOutput {
  employeeNumber: string;
  sequence: number;
  year: number;
}

async function generateEmployeeNumber(
  input: GenerateEmployeeNumberInput
): Promise<GenerateEmployeeNumberOutput> {
  const { tenantId } = input;
  const currentYear = new Date().getFullYear();
  
  // 1. Get tenant code
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { code: true }
  });
  
  if (!tenant?.code) {
    throw new Error('CONFIGURATION_ERROR: Tenant code belum dikonfigurasi');
  }
  
  // 2. Get or create sequence with atomic operation
  const sequence = await prisma.$transaction(async (tx) => {
    // Lock row for update
    const existingSeq = await tx.$queryRaw<EmployeeNumberSequence[]>`
      SELECT * FROM employee_number_sequences 
      WHERE tenant_id = ${tenantId} AND year = ${currentYear}
      FOR UPDATE
    `;
    
    let nextSeq: number;
    
    if (existingSeq.length === 0) {
      // First employee of the year for this tenant
      nextSeq = 1;
      
      await tx.employeeNumberSequence.create({
        data: {
          tenantId,
          year: currentYear,
          lastSeq: nextSeq
        }
      });
    } else {
      // Increment sequence
      const current = existingSeq[0];
      
      if (current.lastSeq >= 99999) {
        throw new Error('CAPACITY_ERROR: Kapasitas nomor karyawan tahun ini sudah penuh');
      }
      
      nextSeq = current.lastSeq + 1;
      
      await tx.employeeNumberSequence.update({
        where: { id: current.id },
        data: { lastSeq: nextSeq }
      });
    }
    
    return nextSeq;
  });
  
  // 3. Format employee number
  const sequenceStr = sequence.toString().padStart(5, '0');
  const employeeNumber = `${tenant.code}${currentYear}${sequenceStr}`;
  
  return {
    employeeNumber,
    sequence,
    year: currentYear
  };
}
```

### 5.2 Atomic Locking Detail

```typescript
// PostgreSQL-specific: FOR UPDATE lock
// This prevents race conditions when multiple approval requests happen simultaneously

// Timeline tanpa lock (BUG):
// T0: Request A reads lastSeq = 5
// T1: Request B reads lastSeq = 5
// T2: Request A writes lastSeq = 6, generates KRT202600006
// T3: Request B writes lastSeq = 6, generates KRT202600006 ← DUPLICATE!

// Timeline dengan FOR UPDATE lock (CORRECT):
// T0: Request A acquires lock, reads lastSeq = 5
// T1: Request B waits for lock...
// T2: Request A writes lastSeq = 6, releases lock
// T3: Request B acquires lock, reads lastSeq = 6
// T4: Request B writes lastSeq = 7, releases lock

// Lock timeout: 30 seconds (default PostgreSQL)
```

---

## 6. Integration with Registration Approval

### 6.1 Approval Flow

```
                    ┌──────────────────────────────────────┐
                    │        HRD Approval Process          │
                    │                                      │
User Registration   │  ┌─────────────────────────────┐    │
Status: PENDING ────┼─►│  1. Validate required fields │    │
                    │  └─────────────────────────────┘    │
                    │               │                      │
                    │               ▼                      │
                    │  ┌─────────────────────────────┐    │
                    │  │  2. generateEmployeeNumber() │    │
                    │  │     (atomic transaction)     │    │
                    │  └─────────────────────────────┘    │
                    │               │                      │
                    │               ▼                      │
                    │  ┌─────────────────────────────┐    │
                    │  │  3. Create Employee record   │    │
                    │  │     with generated number    │    │
                    │  └─────────────────────────────┘    │
                    │               │                      │
                    │               ▼                      │
                    │  ┌─────────────────────────────┐    │
                    │  │  4. Update User status       │    │
                    │  │     PENDING → APPROVED       │    │
                    │  └─────────────────────────────┘    │
                    │               │                      │
                    └───────────────┼──────────────────────┘
                                    │
                                    ▼
                           Employee Created
                           Status: ACTIVE
```

### 6.2 Approval Service Implementation

```typescript
interface ApproveRegistrationInput {
  userId: string;
  branchId: string;
  departmentId: string;
  positionId: string;
  managerId?: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  startDate: Date;
  approvedBy: string;
}

async function approveRegistration(
  input: ApproveRegistrationInput
): Promise<{ user: User; employee: Employee }> {
  return await prisma.$transaction(async (tx) => {
    // 1. Get user
    const user = await tx.user.findUnique({
      where: { id: input.userId },
      include: { tenant: true }
    });
    
    if (!user) throw new Error('NOT_FOUND: User tidak ditemukan');
    if (user.status !== 'PENDING') {
      throw new Error('INVALID_STATUS: User sudah diproses sebelumnya');
    }
    
    // 2. Generate employee number (within same transaction)
    const { employeeNumber } = await generateEmployeeNumberInTx(
      tx, 
      user.tenantId
    );
    
    // 3. Create employee record
    const employee = await tx.employee.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        branchId: input.branchId,
        departmentId: input.departmentId,
        positionId: input.positionId,
        managerId: input.managerId,
        employeeNumber,
        fullName: user.fullName,
        nik: user.nik,
        npwp: user.npwp,
        phone: user.phone,
        address: user.address,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone,
        bankName: user.bankName,
        bankAccountNumber: user.bankAccountNumber,
        bankAccountHolder: user.bankAccountHolder,
        employmentType: input.employmentType,
        workMode: input.workMode,
        startDate: input.startDate,
        status: 'ACTIVE'
      }
    });
    
    // 4. Update user status
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { status: 'APPROVED' }
    });
    
    // 5. Create audit log
    await tx.auditLog.create({
      data: {
        tenantId: user.tenantId,
        actorId: input.approvedBy,
        action: 'REGISTRATION_APPROVED',
        objectType: 'user',
        objectId: user.id,
        afterData: {
          employeeNumber,
          branchId: input.branchId,
          departmentId: input.departmentId
        }
      }
    });
    
    return { user: updatedUser, employee };
  });
}
```

---

## 7. Edge Cases

### 7.1 Configuration Edge Cases

| ID | Kondisi | Expected Behavior | Resolution |
|----|---------|-------------------|------------|
| ED-CFG-01 | Tenant tidak punya code | ERROR: "Tenant code belum dikonfigurasi" | Admin harus set tenant.code di database |
| ED-CFG-02 | Tenant code tidak 3 karakter | ERROR saat validation | DB constraint: `CHECK (LENGTH(code) = 3)` |
| ED-CFG-03 | Tenant code ada karakter non-uppercase | ERROR saat validation | DB constraint: `CHECK (code ~ '^[A-Z]{3}$')` |
| ED-CFG-04 | Tenant code duplicate | ERROR saat create tenant | DB constraint: `UNIQUE(code)` |

### 7.2 Sequence Edge Cases

| ID | Kondisi | Expected Behavior | Resolution |
|----|---------|-------------------|------------|
| ED-SEQ-01 | Pertama kali generate tahun baru | Sequence dimulai dari 00001 | Auto-create sequence record |
| ED-SEQ-02 | Sequence habis (99999) | ERROR: "Kapasitas penuh" | Alert admin; manual intervention |
| ED-SEQ-03 | Clock rollback (server time mundur) | Generate tetap pakai tahun server saat ini | Pastikan NTP sync |
| ED-SEQ-04 | Timezone berbeda antar server | Inconsistent year | Standardize ke UTC atau single timezone |

### 7.3 Concurrency Edge Cases

| ID | Kondisi | Expected Behavior | Resolution |
|----|---------|-------------------|------------|
| ED-CON-01 | 2 HRD approve bersamaan | Database lock mencegah collision | FOR UPDATE lock |
| ED-CON-02 | Transaction timeout | Transaction rollback, retry | Set reasonable timeout (30s) |
| ED-CON-03 | Database connection lost mid-transaction | Rollback, employee not created | Retry logic dengan exponential backoff |
| ED-CON-04 | Deadlock | PostgreSQL auto-resolve | Retry transaction |

### 7.4 Approval Edge Cases

| ID | Kondisi | Expected Behavior | Resolution |
|----|---------|-------------------|------------|
| ED-APR-01 | User sudah APPROVED (double approve) | ERROR: "User sudah diproses" | Check status sebelum proses |
| ED-APR-02 | User REJECTED lalu approve | ERROR: "Status tidak valid" | User harus register ulang |
| ED-APR-03 | Employee number berhasil generate tapi create employee gagal | Rollback seluruh transaksi termasuk sequence | Single atomic transaction |
| ED-APR-04 | Branch/Dept/Position ID invalid | ERROR before number generation | Validate dulu sebelum generate |

### 7.5 Data Migration Edge Cases

| ID | Kondisi | Expected Behavior | Resolution |
|----|---------|-------------------|------------|
| ED-MIG-01 | Import karyawan lama dengan nomor berbeda format | Allow manual input, bypass auto-generate | Provide override option |
| ED-MIG-02 | Existing employees tanpa employee_number | Generate dengan sequence current | Bulk migration script |
| ED-MIG-03 | Sequence conflict dengan data lama | Set lastSeq ke MAX existing | Migration script update |

---

## 8. Manual Override Specification

### 8.1 Override Use Cases

1. **Data Migration** - Import karyawan lama dengan format nomor berbeda
2. **Inter-company Transfer** - Karyawan pindah dari tenant lain, bawa nomor lama
3. **Special Numbering** - Direktur/founder dengan nomor khusus (e.g., KRT000000001)

### 8.2 Override API

```typescript
interface ApproveRegistrationWithOverrideInput extends ApproveRegistrationInput {
  overrideEmployeeNumber?: string;  // Optional manual number
}

async function approveRegistrationWithOverride(
  input: ApproveRegistrationWithOverrideInput
): Promise<{ user: User; employee: Employee }> {
  let employeeNumber: string;
  
  if (input.overrideEmployeeNumber) {
    // Validate override format
    if (!EMPLOYEE_NUMBER_REGEX.test(input.overrideEmployeeNumber)) {
      throw new Error('VALIDATION: Format nomor karyawan tidak valid');
    }
    
    // Check uniqueness
    const existing = await prisma.employee.findFirst({
      where: {
        tenantId: user.tenantId,
        employeeNumber: input.overrideEmployeeNumber
      }
    });
    
    if (existing) {
      throw new Error('DUPLICATE: Nomor karyawan sudah digunakan');
    }
    
    employeeNumber = input.overrideEmployeeNumber;
    
    // Log override action
    await createAuditLog({
      action: 'EMPLOYEE_NUMBER_OVERRIDE',
      metadata: { originalWouldBe: await peekNextNumber(user.tenantId) }
    });
    
  } else {
    // Auto-generate
    const result = await generateEmployeeNumber({ tenantId: user.tenantId });
    employeeNumber = result.employeeNumber;
  }
  
  // ... rest of approval logic
}
```

### 8.3 Override Rules

| Rule ID | Kondisi | Aksi |
|---------|---------|------|
| OVR-01 | Override harus match format regex | BLOCK jika tidak match |
| OVR-02 | Override harus unique dalam tenant | BLOCK jika duplicate |
| OVR-03 | Override tidak update sequence | Sequence tidak di-increment |
| OVR-04 | Override harus oleh role SUPER_ADMIN atau HRD dengan flag | Permission check |

---

## 9. Audit Trail

### 9.1 Logged Events

| Event | Log Data |
|-------|----------|
| Number Generated | `{ employeeNumber, sequence, year, tenantId }` |
| Number Override | `{ employeeNumber, originalWouldBe, reason, overrideBy }` |
| Sequence Created | `{ tenantId, year, initialSeq: 1 }` |
| Sequence Error | `{ tenantId, year, error, attemptedSeq }` |

### 9.2 Audit Log Entry

```typescript
interface EmployeeNumberAuditLog {
  id: string;
  tenantId: string;
  timestamp: Date;
  action: 'GENERATED' | 'OVERRIDE' | 'SEQUENCE_CREATED' | 'ERROR';
  employeeNumber: string | null;
  sequence: number | null;
  year: number;
  userId: string;        // User yang di-approve
  actorId: string;       // HRD yang melakukan approve
  isOverride: boolean;
  overrideReason: string | null;
  errorMessage: string | null;
}
```

---

## 10. API Endpoints

### 10.1 POST /api/admin/registrations/:id/approve

**Request:**
```json
{
  "branchId": "branch_uuid",
  "departmentId": "dept_uuid",
  "positionId": "pos_uuid",
  "managerId": "manager_uuid",
  "employmentType": "PERMANENT",
  "workMode": "WFO",
  "startDate": "2026-02-01",
  "overrideEmployeeNumber": null
}
```

**Response (201 - Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_uuid",
      "email": "john@example.com",
      "status": "APPROVED"
    },
    "employee": {
      "id": "emp_uuid",
      "employeeNumber": "KRT202600042",
      "fullName": "John Doe",
      "branch": { "id": "...", "name": "Jakarta HQ" },
      "department": { "id": "...", "name": "Engineering" },
      "position": { "id": "...", "name": "Software Engineer" }
    }
  },
  "message": "Registrasi berhasil disetujui. Nomor karyawan: KRT202600042"
}
```

### 10.2 GET /api/admin/employee-number/preview

Preview nomor yang akan di-generate (untuk display sebelum approve).

**Response:**
```json
{
  "success": true,
  "data": {
    "nextNumber": "KRT202600043",
    "sequence": 43,
    "year": 2026,
    "note": "Nomor ini belum final sampai approval disubmit"
  }
}
```

### 10.3 GET /api/admin/employee-number/stats

Statistik penggunaan nomor karyawan.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentYear": 2026,
    "totalGenerated": 42,
    "remaining": 99957,
    "utilizationPercent": 0.04,
    "byYear": [
      { "year": 2025, "count": 156 },
      { "year": 2026, "count": 42 }
    ]
  }
}
```

---

## 11. Database Constraints

### 11.1 Tenant Table

```sql
ALTER TABLE tenant
ADD COLUMN code VARCHAR(3);

ALTER TABLE tenant
ADD CONSTRAINT tenant_code_format 
CHECK (code ~ '^[A-Z]{3}$');

ALTER TABLE tenant
ADD CONSTRAINT tenant_code_unique 
UNIQUE (code);
```

### 11.2 Employee Table

```sql
ALTER TABLE employee
ADD CONSTRAINT employee_number_format 
CHECK (employee_number ~ '^[A-Z]{3}\d{9}$');

ALTER TABLE employee
ADD CONSTRAINT employee_number_unique_per_tenant 
UNIQUE (tenant_id, employee_number);
```

### 11.3 Sequence Table

```sql
CREATE UNIQUE INDEX idx_sequence_tenant_year 
ON employee_number_sequences (tenant_id, year);

ALTER TABLE employee_number_sequences
ADD CONSTRAINT sequence_positive 
CHECK (last_seq >= 0 AND last_seq <= 99999);
```

---

## 12. Performance Considerations

### 12.1 Lock Duration

```typescript
// Target: Lock duration < 100ms
// Lock hanya pada saat:
// 1. Read lastSeq (< 5ms)
// 2. Increment dan write (< 10ms)
// Total: < 15ms typical
```

### 12.2 Concurrency Testing

```typescript
// Load test: 100 concurrent approvals
// Expected: All 100 get unique numbers
// Max duration: 5 seconds for all

async function concurrencyTest() {
  const promises = Array(100).fill(null).map(() =>
    approveRegistration({ userId: randomPendingUser() })
  );
  
  const results = await Promise.all(promises);
  const numbers = results.map(r => r.employee.employeeNumber);
  
  // Assert all unique
  const unique = new Set(numbers);
  assert(unique.size === 100, 'All numbers must be unique');
}
```

---

## 13. Acceptance Tests

### 13.1 Unit Tests

```gherkin
Scenario: Generate employee number untuk tenant baru
  Given tenant "KRT" belum punya sequence untuk 2026
  When HRD approve registrasi
  Then employee number = "KRT202600001"
  And sequence record dibuat dengan lastSeq = 1

Scenario: Generate employee number untuk tenant existing
  Given tenant "KRT" sudah punya 41 karyawan di 2026
  When HRD approve registrasi
  Then employee number = "KRT202600042"
  And lastSeq di-update ke 42

Scenario: Generate di tahun baru
  Given tenant "VIO" punya lastSeq = 156 di 2025
  And tahun sekarang = 2026
  When HRD approve registrasi
  Then employee number = "VIO202600001"
  And sequence baru dibuat untuk 2026
```

### 13.2 Concurrency Tests

```gherkin
Scenario: Dua HRD approve bersamaan
  Given 2 registrasi pending di tenant "CMA"
  When HRD-A dan HRD-B approve secara bersamaan
  Then keduanya mendapat nomor unik
  And tidak ada duplicate employee number

Scenario: Kapasitas penuh
  Given tenant "CMM" sudah generate 99999 nomor di 2026
  When HRD mencoba approve registrasi baru
  Then error "Kapasitas nomor karyawan tahun 2026 sudah penuh"
```

### 13.3 Override Tests

```gherkin
Scenario: Override dengan nomor valid
  Given nomor "KRT000000001" belum digunakan
  When Super Admin approve dengan override "KRT000000001"
  Then employee number = "KRT000000001"
  And sequence TIDAK di-increment
  And audit log mencatat override

Scenario: Override dengan nomor duplicate
  Given nomor "KRT202600005" sudah digunakan
  When HRD approve dengan override "KRT202600005"
  Then error "Nomor karyawan sudah digunakan"
```

---

## 14. Rollback Procedure

### 14.1 Jika Employee Number Salah Tergenerate

```typescript
// DANGEROUS: Only for critical fixes
async function rollbackEmployeeNumber(
  employeeId: string,
  adminId: string,
  reason: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Get employee
    const employee = await tx.employee.findUnique({
      where: { id: employeeId }
    });
    
    // 2. Log rollback
    await tx.auditLog.create({
      data: {
        action: 'EMPLOYEE_NUMBER_ROLLBACK',
        objectId: employeeId,
        beforeData: { employeeNumber: employee.employeeNumber },
        afterData: { employeeNumber: null },
        metadata: { reason, adminId }
      }
    });
    
    // 3. Decrement sequence if it was the last one
    const yearFromNumber = parseInt(employee.employeeNumber.slice(3, 7));
    const seqFromNumber = parseInt(employee.employeeNumber.slice(7));
    
    const sequence = await tx.employeeNumberSequence.findFirst({
      where: {
        tenantId: employee.tenantId,
        year: yearFromNumber,
        lastSeq: seqFromNumber
      }
    });
    
    if (sequence) {
      await tx.employeeNumberSequence.update({
        where: { id: sequence.id },
        data: { lastSeq: seqFromNumber - 1 }
      });
    }
    
    // 4. Delete employee record (user remains PENDING)
    await tx.employee.delete({ where: { id: employeeId } });
    
    // 5. Revert user status
    await tx.user.update({
      where: { id: employee.userId },
      data: { status: 'PENDING' }
    });
  });
}
```

---

## 15. Related Documents

| Document | Link |
|----------|------|
| Phase 1 Spec | [phase-1-spec.md](phase-1-spec.md) |
| ERD - Employee | [../03-architecture/erd.md](../03-architecture/erd.md) |
| User Stories EP01 | [../02-requirements/user-stories.md](../02-requirements/user-stories.md#ep01---registrasi--aktivasi-akun) |
| API Specification | [../04-api/specification.md](../04-api/specification.md) |
