# Spesifikasi Teknis Phase 1: Registrasi & Absensi

**Tanggal:** 22 Januari 2026
**Versi:** 1.0
**Status:** Draft - Siap Implementasi

---

## Daftar Isi

1. [Phase 1A: Registrasi](#phase-1a-registrasi)
2. [Phase 1B: Absensi](#phase-1b-absensi)
3. [Database Schema Changes](#database-schema-changes)
4. [Seed Data](#seed-data)
5. [Checklist Implementasi](#checklist-implementasi)

---

# Phase 1A: Registrasi

## 1.1 Multi-Tenant

### Daftar Perusahaan (Tenant)

| No | Nama Perusahaan | Domain Code | Status |
|----|-----------------|-------------|--------|
| 1 | PT. KREATIFINDO ABADI SEJAHTERA | `kreatifindo` | Active |
| 2 | PT. VIOLET GLOBAL INDONESIA | `violet` | Active |
| 3 | PT. CYBER MULTI ARTHA | `cyber-artha` | Active |
| 4 | CV. CYBER MULTI MANDIRI | `cyber-mandiri` | Active |

### Rules
- Setiap perusahaan punya struktur berbeda (Branch, Department, Position)
- 1 email hanya bisa daftar di 1 perusahaan
- HRD shared untuk semua perusahaan (bisa approve semua)

---

## 1.2 Form Registrasi

### Step 1: Pilih Perusahaan

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `tenantId` | Dropdown | ✅ | Must exist in tenants |

### Step 2: Data Pribadi

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `fullName` | Text | ✅ | Min 3 chars |
| `email` | Email | ✅ | Valid email, unique per tenant |
| `phone` | Phone | ✅ | Indonesian format (08xx) |
| `password` | Password | ✅ | Min 8, uppercase, lowercase, number, special |
| `gender` | Dropdown | ✅ | MALE / FEMALE |
| `birthPlace` | Text | ✅ | Min 2 chars |
| `birthDate` | Date | ✅ | Must be past date, age >= 17 |

### Step 3: Data Bank

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `bankName` | Dropdown | ✅ | From bank list |
| `bankAccountNumber` | Text | ✅ | Numeric, 10-16 digits |
| `bankAccountHolder` | Text | ✅ | Min 3 chars |

### Step 4: Foto & Dokumen

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `photoUrl` | Image Upload | ✅ | PNG/JPG, max 2MB |
| `nik` | Text | ⚪ | 16 digits |
| `npwp` | Text | ⚪ | Valid NPWP format |
| `address` | Textarea | ⚪ | - |
| `ktpPhotoUrl` | Image Upload | ⚪ | PNG/JPG, max 2MB |
| `emergencyContactName` | Text | ⚪ | - |
| `emergencyContactPhone` | Phone | ⚪ | Indonesian format |

### Step 5: Persetujuan

| Field | Type | Required |
|-------|------|----------|
| `agreedToTerms` | Checkbox | ✅ |

---

## 1.3 Dropdown Bank

```typescript
const BANK_LIST = [
  { code: "MANDIRI", name: "Bank Mandiri" },
  { code: "BCA", name: "Bank BCA" },
  { code: "BNI", name: "Bank BNI" },
  { code: "BRI", name: "Bank BRI" },
  { code: "BTN", name: "Bank BTN" },
  { code: "CIMB", name: "Bank CIMB Niaga" },
  { code: "DANAMON", name: "Bank Danamon" },
  { code: "PANIN", name: "Bank Panin" },
  { code: "OCBC", name: "Bank OCBC NISP" },
  { code: "MAYBANK", name: "Bank Maybank Indonesia" },
  { code: "PERMATA", name: "Bank Permata" },
  { code: "MEGA", name: "Bank Mega" },
  { code: "SINARMAS", name: "Bank Sinarmas" },
  { code: "BTPN", name: "Bank BTPN" },
  { code: "BSI", name: "Bank Syariah Indonesia" },
  { code: "MUAMALAT", name: "Bank Muamalat" },
  { code: "JAGO", name: "Bank Jago" },
  { code: "BLU", name: "Blu by BCA Digital" },
  { code: "SEABANK", name: "SeaBank" },
  { code: "NEO", name: "Bank Neo Commerce" },
  { code: "ALLO", name: "Allo Bank" },
  { code: "HSBC", name: "HSBC Indonesia" },
  { code: "CITI", name: "Citibank" },
  { code: "OTHER", name: "Lainnya" },
];
```

---

## 1.4 HRD Approval

### Fields yang diisi HRD saat Approve

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `branchId` | Dropdown | ✅ | Per tenant |
| `departmentId` | Dropdown | ✅ | Per tenant |
| `positionId` | Dropdown | ✅ | Per tenant |
| `employeeNumber` | Auto | ✅ | Auto-generate |
| `startDate` | Date | ✅ | Tanggal mulai kerja |
| `employmentType` | Dropdown | ✅ | PERMANENT/CONTRACT/FREELANCE/INTERN |
| `workMode` | Dropdown | ✅ | WFO/WFH/HYBRID |

### Auto Employee Number Format

```
{COMPANY_CODE}{YEAR}{SEQUENCE}

Contoh:
- KRT202600001 (Kreatifindo, 2026, urutan 1)
- VIO202600001 (Violet, 2026, urutan 1)
- CMA202600001 (Cyber Multi Artha, 2026, urutan 1)
- CMM202600001 (Cyber Multi Mandiri, 2026, urutan 1)
```

### Company Codes

| Tenant | Code |
|--------|------|
| PT. KREATIFINDO ABADI SEJAHTERA | KRT |
| PT. VIOLET GLOBAL INDONESIA | VIO |
| PT. CYBER MULTI ARTHA | CMA |
| CV. CYBER MULTI MANDIRI | CMM |

---

## 1.5 Status Flow

```
REGISTER ──► PENDING ──► APPROVED ──► (Create Employee) ──► Bisa Login
                │
                └──► REJECTED ──► Boleh daftar ulang (email sama)
```

### Status Rules
- `PENDING`: Baru daftar, menunggu approval HRD
- `APPROVED`: Disetujui, Employee record dibuat, bisa login
- `REJECTED`: Ditolak, BOLEH daftar ulang dengan email yang sama

---

## 1.6 Notifikasi

| Event | Ke | Channel | Template |
|-------|-----|---------|----------|
| Registrasi baru | HRD | In-app | "Registrasi baru: {fullName} - {companyName}" |
| Pending > 2 hari | HRD | In-app | "Reminder: {count} registrasi menunggu approval" |
| Approved | Karyawan | In-app + Email | registrationApproved |
| Rejected | Karyawan | In-app + Email | registrationRejected |

---

## 1.7 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenants` | List active tenants for dropdown |
| GET | `/api/banks` | List banks for dropdown |
| POST | `/api/auth/register` | Submit registration |

### Admin Endpoints (HRD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/registrations` | List pending/all registrations |
| GET | `/api/admin/registrations/:id` | Get registration detail |
| POST | `/api/admin/registrations/:id/approve` | Approve registration |
| POST | `/api/admin/registrations/:id/reject` | Reject registration |
| GET | `/api/admin/branches` | List branches for tenant |
| GET | `/api/admin/departments` | List departments for tenant |
| GET | `/api/admin/positions` | List positions for tenant |

---

# Phase 1B: Absensi

## 2.1 Jam Kerja & Shift

### Konfigurasi (Custom per Tenant oleh HRD)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `defaultShiftStart` | Time | 08:00 | Jam mulai kerja default |
| `defaultShiftEnd` | Time | 17:00 | Jam selesai kerja default |
| `earliestClockIn` | Time | 06:00 | Clock in paling awal |
| `latestClockOut` | Time | 22:00 | Clock out paling lambat |
| `gracePeriodMinutes` | Int | 5 | Toleransi terlambat (menit) |
| `breakMinutes` | Int | 60 | Durasi istirahat |

### Multiple Shift Support

| Shift | Start | End | Break |
|-------|-------|-----|-------|
| Pagi | 08:00 | 17:00 | 60 min |
| Siang | 14:00 | 22:00 | 60 min |
| Malam | 22:00 | 06:00 | 60 min |
| Custom | HRD set | HRD set | HRD set |

---

## 2.2 Clock In/Out

### Flow Clock In

```
1. Karyawan buka halaman absensi
2. Pilih Work Mode (WFO/WFH)
3. Jika WFO:
   - Validasi GPS dalam radius geofence (100m)
   - Jika di luar radius → tampilkan warning, tetap bisa clock in
4. Buka kamera → Face Detection
5. Liveness Detection (kedip mata)
6. Capture foto
7. Submit → Validasi di server
8. Simpan attendance record
9. Jika telat > grace period → tandai LATE, notif ke HRD
```

### Flow Clock Out

```
1. Karyawan buka halaman absensi
2. Validasi sudah clock in hari ini
3. Jika WFO: Validasi GPS (optional warning)
4. Buka kamera → Face Detection
5. Liveness Detection
6. Capture foto
7. Submit → Validasi di server
8. Update attendance record
```

### Lupa Clock Out

```
- Status: PENDING_CLOCK_OUT
- Karyawan harus ajukan koreksi
- HRD approve/reject koreksi
- Batas pengajuan: 3 hari
```

---

## 2.3 Keterlambatan

### Perhitungan

```typescript
const lateMinutes = clockInTime - shiftStartTime - gracePeriod;

// Contoh:
// Shift start: 08:00
// Grace period: 5 menit
// Clock in: 08:10
// Late minutes: 08:10 - 08:00 - 5 = 5 menit (LATE)

// Clock in: 08:03
// Late minutes: 08:03 - 08:00 - 5 = -2 (tidak late, karena negatif)
```

### Status Attendance

| Status | Kondisi |
|--------|---------|
| `PRESENT` | Clock in <= shift start + grace period |
| `LATE` | Clock in > shift start + grace period |
| `ABSENT` | Tidak clock in sama sekali |
| `LEAVE` | Sedang cuti |
| `HOLIDAY` | Hari libur |

### Potongan Telat (Optional, configurable by HRD)

| Setting | Type | Default |
|---------|------|---------|
| `lateDeductionEnabled` | Boolean | false |
| `lateDeductionType` | Enum | PER_MINUTE / FIXED / PERCENTAGE |
| `lateDeductionAmount` | Decimal | 0 |

---

## 2.4 Work Mode & Lokasi

### Work Mode

| Mode | GPS Required | Geofence Check |
|------|--------------|----------------|
| WFO | ✅ Yes | ✅ Yes (warning if outside) |
| WFH | ✅ Yes (record only) | ❌ No |

### Geofence

| Setting | Value |
|---------|-------|
| Default Radius | 100 meter |
| Lokasi per Tenant | 1 lokasi (sementara) |
| Outside Geofence | Warning only, still allowed |

---

## 2.5 Selfie & Validasi

### Photo Requirements

| Requirement | Value |
|-------------|-------|
| Format | PNG / JPEG |
| Max Size (before compress) | 2 MB |
| Max Size (after compress) | 500 KB |
| Resolution | 640 x 480 px |
| Compression Quality | 0.7 - 0.8 |

### Face Detection (WAJIB)

```typescript
interface FaceDetectionResult {
  faceDetected: boolean;
  faceCount: number;
  faceConfidence: number; // 0-1
  faceBoundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Rules:
// - faceDetected must be true
// - faceCount must be exactly 1
// - faceConfidence must be >= 0.7 (70%)
// - Face must occupy >= 20% of frame
```

### Liveness Detection (WAJIB - Gratis)

Menggunakan TensorFlow.js + MediaPipe Face Mesh

```typescript
interface LivenessResult {
  isLive: boolean;
  livenessScore: number; // 0-1
  challenge: "BLINK" | "NOD" | "SMILE";
  challengePassed: boolean;
}

// Implementation: Blink Detection
// - Detect eye aspect ratio (EAR)
// - If EAR drops below threshold for > 100ms = blink detected
// - Require 1 blink within 5 seconds
```

---

## 2.6 Koreksi Absensi

### Rules

| Rule | Value |
|------|-------|
| Approver | HRD saja |
| Batas Pengajuan | 3 hari setelah tanggal absen |
| Alasan | Wajib diisi |

### Flow

```
1. Karyawan ajukan koreksi
2. Pilih tanggal & waktu yang benar
3. Isi alasan
4. Submit → Notif ke HRD
5. HRD review & approve/reject
6. Jika approved → Update attendance record
```

---

## 2.7 Notifikasi

| Event | Ke | Channel |
|-------|-----|---------|
| Telat clock in | HRD | In-app |
| Lupa clock out (EOD) | Karyawan | In-app |
| Koreksi submitted | HRD | In-app |
| Koreksi approved/rejected | Karyawan | In-app |

---

## 2.8 HRD Settings Page

### Attendance Settings

```typescript
interface AttendanceSettings {
  tenantId: string;

  // Shift
  defaultShiftStart: string; // "08:00"
  defaultShiftEnd: string;   // "17:00"
  breakMinutes: number;      // 60

  // Clock boundaries
  earliestClockIn: string;   // "06:00"
  latestClockOut: string;    // "22:00"

  // Late rules
  gracePeriodMinutes: number;      // 5
  lateDeductionEnabled: boolean;   // false
  lateDeductionType: "PER_MINUTE" | "FIXED" | "PERCENTAGE";
  lateDeductionAmount: number;     // 0

  // Geofence
  geofenceRadius: number;          // 100
  geofenceEnabled: boolean;        // true

  // Validation
  requireFaceDetection: boolean;   // true
  requireLiveness: boolean;        // true

  // Work days
  workDays: number[];              // [1,2,3,4,5] (Mon-Fri)
}
```

---

# Database Schema Changes

## New Enums

```prisma
enum Gender {
  MALE
  FEMALE
}
```

## User Model Updates

```prisma
model User {
  // ... existing fields ...

  // NEW: Registration data
  gender              Gender?
  birthPlace          String?
  birthDate           DateTime?
  photoUrl            String?

  // NEW: Bank data (stored during registration, copied to Employee on approval)
  bankName            String?
  bankAccountNumber   String?
  bankAccountHolder   String?

  // NEW: Optional data
  nik                 String?
  npwp                String?
  address             String?
  ktpPhotoUrl         String?
  emergencyContactName  String?
  emergencyContactPhone String?
}
```

## Tenant Model Updates

```prisma
model Tenant {
  // ... existing fields ...

  // NEW: Company code for employee number generation
  code          String?   @unique  // KRT, VIO, CMA, CMM

  // Relations
  attendanceSettings AttendanceSettings?
}
```

## New Model: AttendanceSettings

```prisma
model AttendanceSettings {
  id                    String   @id @default(cuid())
  tenantId              String   @unique

  // Shift defaults
  defaultShiftStart     String   @default("08:00")
  defaultShiftEnd       String   @default("17:00")
  breakMinutes          Int      @default(60)

  // Clock boundaries
  earliestClockIn       String   @default("06:00")
  latestClockOut        String   @default("22:00")

  // Late rules
  gracePeriodMinutes    Int      @default(5)
  lateDeductionEnabled  Boolean  @default(false)
  lateDeductionType     String   @default("PER_MINUTE")
  lateDeductionAmount   Decimal  @default(0)

  // Geofence
  geofenceRadius        Int      @default(100)
  geofenceEnabled       Boolean  @default(true)

  // Validation
  requireFaceDetection  Boolean  @default(true)
  requireLiveness       Boolean  @default(true)

  // Work days (JSON array: [1,2,3,4,5])
  workDays              Json     @default("[1,2,3,4,5]")

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@map("attendance_settings")
}
```

## Attendance Model Updates

```prisma
model Attendance {
  // ... existing fields ...

  // NEW: Face detection results
  faceDetected      Boolean?
  faceConfidence    Decimal?

  // NEW: Liveness detection
  livenessScore     Decimal?
  livenessChallenge String?   // "BLINK", "NOD", etc.

  // NEW: GPS accuracy
  clockInGpsAccuracy  Decimal?
  clockOutGpsAccuracy Decimal?
}
```

## Branch Model Updates

```prisma
model Branch {
  // ... existing fields ...

  // UPDATE: Change default geofence radius
  geofenceRadiusMeters Int?    @default(100)  // Changed from 500
}
```

---

# Seed Data

## Tenants

```typescript
const tenants = [
  {
    name: "PT. KREATIFINDO ABADI SEJAHTERA",
    domain: "kreatifindo",
    code: "KRT",
    isActive: true,
  },
  {
    name: "PT. VIOLET GLOBAL INDONESIA",
    domain: "violet",
    code: "VIO",
    isActive: true,
  },
  {
    name: "PT. CYBER MULTI ARTHA",
    domain: "cyber-artha",
    code: "CMA",
    isActive: true,
  },
  {
    name: "CV. CYBER MULTI MANDIRI",
    domain: "cyber-mandiri",
    code: "CMM",
    isActive: true,
  },
];
```

## Default AttendanceSettings per Tenant

```typescript
// Create for each tenant with default values
const defaultSettings = {
  defaultShiftStart: "08:00",
  defaultShiftEnd: "17:00",
  breakMinutes: 60,
  earliestClockIn: "06:00",
  latestClockOut: "22:00",
  gracePeriodMinutes: 5,
  lateDeductionEnabled: false,
  lateDeductionType: "PER_MINUTE",
  lateDeductionAmount: 0,
  geofenceRadius: 100,
  geofenceEnabled: true,
  requireFaceDetection: true,
  requireLiveness: true,
  workDays: [1, 2, 3, 4, 5],
};
```

## Sample Branches (per Tenant)

```typescript
// Kreatifindo
const kreatifindoBranches = [
  { code: "JKT", name: "Jakarta Pusat", latitude: -6.2088, longitude: 106.8456 },
];

// Violet
const violetBranches = [
  { code: "JKT", name: "Jakarta", latitude: -6.2088, longitude: 106.8456 },
];

// Similar for other tenants...
```

## Sample Departments (per Tenant)

```typescript
const defaultDepartments = [
  { code: "IT", name: "Information Technology" },
  { code: "HR", name: "Human Resources" },
  { code: "FIN", name: "Finance" },
  { code: "OPS", name: "Operations" },
  { code: "MKT", name: "Marketing" },
];
```

## Sample Positions (per Tenant)

```typescript
const defaultPositions = [
  { code: "DIR", name: "Director", level: 1 },
  { code: "MGR", name: "Manager", level: 2 },
  { code: "SPV", name: "Supervisor", level: 3 },
  { code: "SR", name: "Senior Staff", level: 4 },
  { code: "STF", name: "Staff", level: 5 },
  { code: "INT", name: "Intern", level: 6 },
];
```

## Default Shifts (per Tenant)

```typescript
const defaultShifts = [
  { name: "Regular", startTime: "08:00", endTime: "17:00", breakMinutes: 60 },
  { name: "Pagi", startTime: "06:00", endTime: "14:00", breakMinutes: 60 },
  { name: "Siang", startTime: "14:00", endTime: "22:00", breakMinutes: 60 },
];
```

---

# Checklist Implementasi

## Phase 1A: Registrasi

### Database & Schema
- [ ] Tambah enum `Gender` di schema.prisma
- [ ] Update model `User` dengan field baru
- [ ] Update model `Tenant` dengan field `code`
- [ ] Run migration: `npx prisma migrate dev --name add_registration_fields`
- [ ] Seed 4 tenants
- [ ] Seed branches, departments, positions per tenant

### Backend - API
- [ ] GET `/api/tenants` - list active tenants
- [ ] GET `/api/banks` - list banks
- [ ] UPDATE `/api/auth/register` - handle all new fields
- [ ] UPDATE `/api/auth/register` - allow re-register after reject
- [ ] GET `/api/admin/registrations/:id` - get detail (jika belum ada)
- [ ] UPDATE `/api/admin/registrations/:id/approve` - auto employee number
- [ ] GET `/api/admin/branches?tenantId=xxx`
- [ ] GET `/api/admin/departments?tenantId=xxx`
- [ ] GET `/api/admin/positions?tenantId=xxx`

### Backend - Services
- [ ] Update `registerSchema` validation
- [ ] Create `EmployeeNumberService` - auto generate
- [ ] Update notification service - notif ke HRD

### Frontend - Pages
- [ ] Update `/register` - Step 1: Tenant selection
- [ ] Update `/register` - Step 2: Add gender, birthPlace, birthDate
- [ ] Update `/register` - Step 3: Bank dropdown
- [ ] Update `/register` - Step 4: Photo upload
- [ ] Create `/admin/registrations/:id` - Detail view
- [ ] Add approval modal/form di registrations page

### Frontend - Components
- [ ] Create `TenantSelector` component
- [ ] Create `BankSelector` component
- [ ] Create `PhotoUpload` component
- [ ] Create `ApprovalForm` modal

---

## Phase 1B: Absensi

### Database & Schema
- [ ] Create model `AttendanceSettings`
- [ ] Update model `Attendance` dengan face/liveness fields
- [ ] Update model `Branch` - default geofence 100m
- [ ] Run migration
- [ ] Seed default AttendanceSettings per tenant
- [ ] Seed default Shifts per tenant

### Backend - API
- [ ] GET `/api/admin/attendance-settings`
- [ ] PUT `/api/admin/attendance-settings`
- [ ] UPDATE `/api/attendance/clock-in` - validate face detection
- [ ] UPDATE `/api/attendance/clock-in` - validate liveness
- [ ] UPDATE `/api/attendance/clock-in` - apply grace period
- [ ] UPDATE `/api/attendance/clock-out` - validate face & liveness

### Backend - Services
- [ ] Create `AttendanceSettingsService`
- [ ] Update `AttendanceService` - use settings
- [ ] Update `AttendanceService` - grace period logic
- [ ] Update notification - late notification to HRD
- [ ] Update notification - forgot clock out reminder

### Frontend - Libraries
- [ ] Install TensorFlow.js: `npm install @tensorflow/tfjs`
- [ ] Install Face Detection: `npm install @tensorflow-models/face-detection`
- [ ] Install Face Mesh: `npm install @tensorflow-models/face-landmarks-detection`

### Frontend - Components
- [ ] Update `SelfieCapture` - add face detection
- [ ] Update `SelfieCapture` - add liveness (blink detection)
- [ ] Update `SelfieCapture` - add photo size validation
- [ ] Create `FaceDetectionOverlay` component
- [ ] Create `LivenessChallenge` component

### Frontend - Pages
- [ ] Create `/admin/settings/attendance` - HRD settings page
- [ ] Update attendance page - show validation status

---

## Testing

### Phase 1A Tests
- [ ] Test registrasi dengan semua field
- [ ] Test tenant selection
- [ ] Test email unique per tenant
- [ ] Test re-register after reject
- [ ] Test auto employee number generation
- [ ] Test approval flow
- [ ] Test notification ke HRD

### Phase 1B Tests
- [ ] Test clock in dengan face detection
- [ ] Test liveness detection (blink)
- [ ] Test geofence validation
- [ ] Test grace period
- [ ] Test late notification
- [ ] Test forgot clock out reminder
- [ ] Test attendance correction

---

*Dokumen ini menjadi acuan implementasi Phase 1 PeopleHub.*
