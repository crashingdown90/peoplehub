# Feature Spec: Clock In dengan Liveness Detection

> **Versi:** 1.0 | **Tanggal:** 23 Januari 2026 | **Status:** Final
> **Author:** Senior Engineer Specification Writer

---

## 1. Ringkasan Fitur

Karyawan melakukan clock in harian dengan verifikasi kehadiran menggunakan **selfie foto** yang divalidasi melalui **face detection** dan **liveness detection** (deteksi kedipan mata) untuk memastikan foto diambil secara langsung (bukan foto dari foto/layar).

---

## 2. Definisi Presisi

| Istilah | Definisi Eksak |
|---------|----------------|
| **Clock In** | Aksi mencatat waktu kedatangan karyawan ke dalam sistem, menghasilkan 1 record `Attendance` per `(employee_id, attendance_date)` |
| **Face Detection** | Proses identifikasi keberadaan wajah manusia dalam frame kamera menggunakan model TensorFlow.js, menghasilkan `faceDetected: boolean` dan `faceConfidence: decimal` |
| **Liveness Detection** | Proses verifikasi bahwa subjek adalah manusia hidup (bukan foto statis) melalui deteksi kedipan mata, menghasilkan `livenessScore: decimal` |
| **Eye Aspect Ratio (EAR)** | Rasio jarak vertikal/horizontal landmark mata; nilai < 0.21 selama > 100ms menandakan kedipan |
| **Grace Period** | Toleransi keterlambatan dalam menit yang tidak dihitung sebagai telat; default = 5 menit |
| **Geofence** | Area radius melingkar dari koordinat kantor; jika GPS karyawan di luar radius = warning |

---

## 3. Prasyarat (Preconditions)

| ID | Kondisi | Validasi |
|----|---------|----------|
| PRE-01 | User sudah login dengan status `approved` | `user.status === 'approved'` |
| PRE-02 | User memiliki record `Employee` aktif | `employee.status === 'active'` |
| PRE-03 | Belum clock in pada tanggal saat ini | `NOT EXISTS Attendance WHERE employee_id = X AND attendance_date = TODAY` |
| PRE-04 | Browser mendukung WebRTC/Camera API | `navigator.mediaDevices.getUserMedia !== undefined` |
| PRE-05 | Hari ini adalah hari kerja | `TODAY.dayOfWeek IN attendanceSettings.workDays` |

---

## 4. Input Specification

### 4.1 Form Data (Frontend → Backend)

| Field | Type | Required | Validation Rule | Error Message |
|-------|------|----------|-----------------|---------------|
| `photo` | File (Blob) | ✅ | Format: JPEG/PNG; Size ≤ 500KB (setelah compress); Resolution ≥ 640x480 | "Format foto harus JPEG atau PNG" / "Ukuran foto maksimal 500KB" |
| `workMode` | Enum | ✅ | Value ∈ {`WFO`, `WFH`} | "Pilih mode kerja: WFO atau WFH" |
| `latitude` | Decimal | Conditional | Required if `workMode = WFO`; Range: -90.0 to 90.0 | "Lokasi GPS diperlukan untuk WFO" |
| `longitude` | Decimal | Conditional | Required if `workMode = WFO`; Range: -180.0 to 180.0 | "Lokasi GPS diperlukan untuk WFO" |
| `gpsAccuracy` | Decimal | ⚪ | Value ≤ 100 meters (warning if > 100) | - |
| `faceDetected` | Boolean | ✅ | Value = true | "Wajah tidak terdeteksi dalam foto" |
| `faceConfidence` | Decimal | ✅ | Value ≥ 0.70 | "Confidence wajah kurang dari 70%" |
| `livenessScore` | Decimal | ✅ | Value ≥ 0.80 (jika liveness enabled) | "Liveness score kurang dari 80%" |
| `deviceInfo` | String | ⚪ | Max 500 chars | - |

### 4.2 Photo Capture Requirements

```typescript
interface PhotoCapture {
  // Sebelum kompresi
  maxSizeBeforeCompress: 2 * 1024 * 1024;  // 2 MB
  
  // Setelah kompresi
  maxSizeAfterCompress: 500 * 1024;        // 500 KB
  compressionQuality: 0.75;                 // 75%
  
  // Resolusi minimum
  minWidth: 640;
  minHeight: 480;
  
  // Format
  allowedFormats: ['image/jpeg', 'image/png'];
  outputFormat: 'image/jpeg';
}
```

---

## 5. Face Detection Specification

### 5.1 Model Configuration

```typescript
interface FaceDetectionConfig {
  // TensorFlow.js Face Detection Model
  model: '@mediapipe/face_detection';
  runtime: 'mediapipe';
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection';
  
  // Detection parameters
  minDetectionConfidence: 0.70;  // 70% minimum
  modelSelection: 1;              // 0 = short-range, 1 = full-range
}
```

### 5.2 Validation Rules

| Rule ID | Kondisi | Aksi Jika Gagal |
|---------|---------|-----------------|
| FACE-01 | `faceDetected === true` | Tampilkan "Wajah tidak terdeteksi. Pastikan wajah terlihat jelas." |
| FACE-02 | `faceCount === 1` | Tampilkan "Terdeteksi lebih dari satu wajah. Pastikan hanya Anda yang ada di frame." |
| FACE-03 | `faceConfidence >= 0.70` | Tampilkan "Confidence rendah. Pastikan pencahayaan cukup dan wajah menghadap kamera." |
| FACE-04 | Face occupies ≥ 20% of frame | Tampilkan "Wajah terlalu jauh. Dekatkan wajah ke kamera." |
| FACE-05 | Face occupies ≤ 80% of frame | Tampilkan "Wajah terlalu dekat. Jauhkan sedikit dari kamera." |

### 5.3 Bounding Box Calculation

```typescript
function calculateFaceOccupancy(
  faceBBox: { x: number; y: number; width: number; height: number },
  frameWidth: number,
  frameHeight: number
): number {
  const faceArea = faceBBox.width * faceBBox.height;
  const frameArea = frameWidth * frameHeight;
  return faceArea / frameArea;  // Range: 0.0 - 1.0
}

// Acceptance criteria:
// 0.20 <= faceOccupancy <= 0.80
```

---

## 6. Liveness Detection Specification

### 6.1 Blink Detection Algorithm

```typescript
interface LivenessConfig {
  // Eye Aspect Ratio (EAR) threshold
  earBlinkThreshold: 0.21;     // EAR < 0.21 = mata tertutup
  
  // Durasi minimum kedipan (ms)
  minBlinkDuration: 100;        // 100ms
  maxBlinkDuration: 400;        // 400ms
  
  // Challenge timeout
  challengeTimeout: 5000;       // 5 detik untuk kedip
  
  // Required blinks
  requiredBlinks: 1;            // Minimal 1 kedipan
}
```

### 6.2 Eye Aspect Ratio (EAR) Calculation

```typescript
// Menggunakan 6 landmark mata dari MediaPipe Face Mesh
// P1=left, P2=top-left, P3=top-right, P4=right, P5=bottom-right, P6=bottom-left

function calculateEAR(
  p1: Point, p2: Point, p3: Point, 
  p4: Point, p5: Point, p6: Point
): number {
  // Jarak vertikal
  const verticalDist1 = distance(p2, p6);
  const verticalDist2 = distance(p3, p5);
  
  // Jarak horizontal
  const horizontalDist = distance(p1, p4);
  
  // EAR = (|P2-P6| + |P3-P5|) / (2 * |P1-P4|)
  return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
}

// EAR normal (mata terbuka): 0.25 - 0.35
// EAR kedip (mata tertutup): < 0.21
```

### 6.3 Blink Detection State Machine

```
State: WAITING_FOR_BLINK
  │
  ├─ IF EAR < 0.21 for > 100ms ──► State: BLINK_STARTED
  │                                    │
  │                                    ├─ IF EAR >= 0.21 within 400ms ──► State: BLINK_COMPLETED ──► SUCCESS
  │                                    │
  │                                    └─ IF EAR < 0.21 for > 400ms ──► State: EYES_CLOSED (invalid)
  │
  └─ IF timeout 5000ms ──► FAILURE: "Kedipan tidak terdeteksi"
```

### 6.4 Liveness Score Calculation

```typescript
function calculateLivenessScore(
  blinkDetected: boolean,
  blinkDuration: number,
  earVariance: number,      // Variasi EAR selama deteksi
  faceMeshStability: number // Stabilitas landmark wajah
): number {
  let score = 0.0;
  
  // Blink detected: +50%
  if (blinkDetected) score += 0.50;
  
  // Natural blink duration (150-250ms): +20%
  if (blinkDuration >= 150 && blinkDuration <= 250) score += 0.20;
  else if (blinkDuration >= 100 && blinkDuration <= 400) score += 0.10;
  
  // EAR variance (menunjukkan gerakan alami): +15%
  if (earVariance >= 0.02 && earVariance <= 0.08) score += 0.15;
  
  // Face mesh stability (tidak jitter): +15%
  if (faceMeshStability >= 0.80) score += 0.15;
  
  return Math.min(score, 1.0);
}

// Acceptance: livenessScore >= 0.80
```

---

## 7. Geofence Validation Specification

### 7.1 Haversine Distance Calculation

```typescript
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
}
```

### 7.2 Geofence Rules

| Rule ID | Kondisi | Work Mode | Aksi |
|---------|---------|-----------|------|
| GEO-01 | `distance <= geofenceRadius` | WFO | ✅ PASS - Clock in allowed |
| GEO-02 | `distance > geofenceRadius` | WFO | ⚠️ WARNING - "Lokasi Anda di luar area kantor (${distance}m). Clock in tetap diizinkan." |
| GEO-03 | GPS tidak tersedia | WFO | ⚠️ WARNING - "GPS tidak tersedia. Clock in tetap diizinkan." |
| GEO-04 | `gpsAccuracy > 100m` | WFO | ⚠️ WARNING - "Akurasi GPS rendah (±${accuracy}m)." |
| GEO-05 | Any location | WFH | ✅ PASS - Location recorded, no validation |

---

## 8. Late Calculation Specification

### 8.1 Algorithm

```typescript
interface LateCalculation {
  input: {
    clockInTime: DateTime;           // Waktu clock in aktual
    shiftStartTime: Time;            // Jam mulai shift (e.g., "08:00")
    gracePeriodMinutes: number;      // Default: 5
  };
  
  output: {
    lateMinutes: number;             // 0 jika tidak telat
    status: 'PRESENT' | 'LATE';
    deductionAmount: number;         // Jika deduction enabled
  };
}

function calculateLate(input: LateCalculation['input']): LateCalculation['output'] {
  // Combine date with shift start time
  const shiftStart = combineDateAndTime(input.clockInTime.date, input.shiftStartTime);
  
  // Add grace period
  const lateThreshold = addMinutes(shiftStart, input.gracePeriodMinutes);
  
  // Calculate late minutes
  const diffMinutes = differenceInMinutes(input.clockInTime, lateThreshold);
  
  const lateMinutes = Math.max(0, diffMinutes);
  const status = lateMinutes > 0 ? 'LATE' : 'PRESENT';
  
  return { lateMinutes, status, deductionAmount: 0 };
}
```

### 8.2 Late Calculation Examples

| Shift Start | Grace | Clock In | Late Threshold | Diff | Late Minutes | Status |
|-------------|-------|----------|----------------|------|--------------|--------|
| 08:00 | 5 min | 08:03 | 08:05 | -2 min | 0 | PRESENT |
| 08:00 | 5 min | 08:05 | 08:05 | 0 min | 0 | PRESENT |
| 08:00 | 5 min | 08:06 | 08:05 | +1 min | 1 | LATE |
| 08:00 | 5 min | 08:30 | 08:05 | +25 min | 25 | LATE |
| 08:00 | 0 min | 08:01 | 08:00 | +1 min | 1 | LATE |

---

## 9. Edge Cases

### 9.1 Face Detection Edge Cases

| ID | Kondisi | Expected Behavior | Test Case |
|----|---------|-------------------|-----------|
| ED-FD-01 | Tidak ada wajah dalam frame | Block capture, tampilkan "Wajah tidak terdeteksi" | Arahkan kamera ke objek non-wajah |
| ED-FD-02 | 2+ wajah terdeteksi | Block capture, tampilkan "Hanya 1 orang dalam frame" | 2 orang dalam frame |
| ED-FD-03 | Wajah terhalang sebagian (masker) | Allow jika confidence ≥ 0.70; warning jika 0.50-0.69 | Pakai masker |
| ED-FD-04 | Pencahayaan sangat rendah | Block jika confidence < 0.50 | Ruangan gelap |
| ED-FD-05 | Backlight kuat | Block jika confidence < 0.50 | Berdiri di depan jendela |
| ED-FD-06 | Wajah miring > 45° | Block, tampilkan "Hadapkan wajah ke kamera" | Miring kepala |
| ED-FD-07 | Camera permission denied | Tampilkan "Izinkan akses kamera untuk absen" | Tolak permission browser |

### 9.2 Liveness Detection Edge Cases

| ID | Kondisi | Expected Behavior | Test Case |
|----|---------|-------------------|-----------|
| ED-LV-01 | Tidak kedip dalam 5 detik | FAIL, tampilkan "Kedipan tidak terdeteksi. Silakan coba lagi." | Tahan mata terbuka |
| ED-LV-02 | Kedip terlalu cepat (< 100ms) | Tidak dihitung sebagai kedip valid | Kedip ultra cepat |
| ED-LV-03 | Mata tertutup > 400ms | Dianggap mata menutup (bukan kedip); FAIL | Tutup mata lama |
| ED-LV-04 | Foto statis dari layar | EAR variance = 0; livenessScore < 0.50; FAIL | Foto dari HP/laptop |
| ED-LV-05 | Video playback | livenessScore rendah karena unnatural movement | Video wajah bergerak |
| ED-LV-06 | Kacamata reflektif | Deteksi mungkin kurang akurat; allow jika score ≥ 0.70 | Pakai kacamata hitam |
| ED-LV-07 | Satu mata tertutup | EAR dihitung rata-rata kedua mata; allow jika normal range | Tutup 1 mata |

### 9.3 Geofence Edge Cases

| ID | Kondisi | Expected Behavior | Test Case |
|----|---------|-------------------|-----------|
| ED-GF-01 | GPS permission denied | Warning only, clock in allowed with note | Block GPS browser |
| ED-GF-02 | GPS accuracy > 100m | Warning "Akurasi GPS rendah", clock in allowed | Indoor/basement |
| ED-GF-03 | Lokasi persis di batas radius | PASS jika distance ≤ radius (inclusive) | At 100m when radius=100m |
| ED-GF-04 | Lokasi jauh (> 10km dari kantor) | Warning keras, tetap allowed | Di kota berbeda |
| ED-GF-05 | GPS timeout | Retry 2x dengan interval 2 detik; jika gagal, allow dengan warning | GPS loading lama |
| ED-GF-06 | VPN/Mock GPS detected | Log untuk audit, NOT blocked (roadmap: anti-spoof) | Mock GPS app |

### 9.4 Clock In Edge Cases

| ID | Kondisi | Expected Behavior | Test Case |
|----|---------|-------------------|-----------|
| ED-CI-01 | Sudah clock in hari ini | Block, tampilkan "Anda sudah clock in hari ini pada ${time}" | Double clock in |
| ED-CI-02 | Clock in sebelum earliestClockIn | Block, tampilkan "Clock in hanya diizinkan mulai ${time}" | Clock in jam 5:00 |
| ED-CI-03 | Clock in setelah latestClockOut | Block, tampilkan "Waktu clock in sudah berakhir" | Clock in jam 23:00 |
| ED-CI-04 | Hari libur | Allow dengan status HOLIDAY, no late calculation | Clock in hari Minggu |
| ED-CI-05 | Sedang cuti | Block, tampilkan "Anda sedang dalam masa cuti" | Clock in saat cuti |
| ED-CI-06 | Employee status inactive | Block, tampilkan "Status karyawan tidak aktif" | Karyawan non-aktif |
| ED-CI-07 | Tenant settings not configured | Use system defaults | Tenant baru |
| ED-CI-08 | Server timezone different | Use server timezone for calculation | Client timezone berbeda |

---

## 10. API Endpoint Specification

### 10.1 POST /api/attendance/clock-in

**Request:**
```http
POST /api/attendance/clock-in
Content-Type: multipart/form-data
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}

photo: (binary)
workMode: WFO
latitude: -6.2088
longitude: 106.8456
gpsAccuracy: 15.5
faceDetected: true
faceConfidence: 0.92
livenessScore: 0.87
deviceInfo: Chrome 120, macOS Sonoma
```

**Response (201 - Success):**
```json
{
  "success": true,
  "data": {
    "id": "att_uuid",
    "employeeId": "emp_uuid",
    "attendanceDate": "2026-01-23",
    "clockIn": "2026-01-23T08:05:00+07:00",
    "workMode": "WFO",
    "status": "PRESENT",
    "lateMinutes": 0,
    "lateDeductionAmount": 0,
    "geofenceStatus": "INSIDE",
    "faceDetected": true,
    "faceConfidence": 0.92,
    "livenessScore": 0.87
  },
  "message": "Clock in berhasil pada 08:05"
}
```

**Response (201 - Late):**
```json
{
  "success": true,
  "data": {
    "id": "att_uuid",
    "status": "LATE",
    "lateMinutes": 15,
    "lateDeductionAmount": 25000
  },
  "message": "Clock in berhasil. Anda terlambat 15 menit."
}
```

**Response (422 - Validation Error):**
```json
{
  "success": false,
  "error": {
    "code": "LIVENESS_FAILED",
    "message": "Verifikasi liveness gagal. Silakan coba lagi.",
    "details": {
      "livenessScore": 0.45,
      "requiredScore": 0.80
    }
  }
}
```

---

## 11. Database Record Created

```typescript
// Attendance record yang dibuat setelah clock in sukses
const attendanceRecord: Attendance = {
  id: generateUUID(),
  tenantId: user.tenantId,
  employeeId: employee.id,
  scheduleId: todaySchedule?.id ?? null,
  attendanceDate: today,
  clockIn: serverTimestamp(),
  clockOut: null,
  workMode: input.workMode,
  clockInPhotoUrl: uploadedPhotoUrl,
  clockOutPhotoUrl: null,
  clockInLatitude: input.latitude,
  clockInLongitude: input.longitude,
  clockInGpsAccuracy: input.gpsAccuracy,
  deviceInfo: input.deviceInfo,
  lateMinutes: calculated.lateMinutes,
  earlyLeaveMinutes: 0,
  overtimeMinutes: 0,
  lateDeductionAmount: calculated.deductionAmount,
  status: calculated.status,
  isCorrected: false,
  faceDetected: input.faceDetected,
  faceConfidence: input.faceConfidence,
  livenessScore: input.livenessScore,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
```

---

## 12. Notification Triggers

| Event | Recipients | Channel | Template |
|-------|------------|---------|----------|
| Clock in LATE (> 0 minutes) | HRD | In-App | "Keterlambatan: {name} terlambat {minutes} menit" |
| Clock in LATE ≥ 30 minutes | HRD + Manager | In-App + Email | "Keterlambatan signifikan: {name} terlambat {minutes} menit" |
| Geofence violation (WFO outside radius) | HRD | In-App | "Clock in di luar area: {name} - {distance}m dari kantor" |
| Liveness score marginal (0.80-0.85) | HRD | Audit Log only | Log untuk review |

---

## 13. Acceptance Tests

### 13.1 Happy Path Tests

```gherkin
Scenario: Clock in WFO sukses dengan semua validasi
  Given saya login sebagai karyawan aktif
  And today adalah hari kerja
  And saya belum clock in hari ini
  And jam sekarang 08:03 (dalam grace period)
  When saya pilih mode "WFO"
  And saya memberikan izin GPS
  And lokasi saya dalam radius 50m dari kantor
  And saya mengambil foto selfie
  And wajah terdeteksi dengan confidence 0.92
  And saya berhasil kedip dalam 3 detik (liveness score 0.88)
  And saya submit clock in
  Then clock in berhasil dengan status "PRESENT"
  And lateMinutes = 0
  And record tersimpan dengan semua metadata

Scenario: Clock in WFH sukses
  Given saya login sebagai karyawan dengan work_mode hybrid
  When saya pilih mode "WFH"
  And saya mengambil foto dengan liveness detection
  And saya submit clock in
  Then clock in berhasil
  And geofence tidak divalidasi
  And lokasi tetap ter-record
```

### 13.2 Edge Case Tests

```gherkin
Scenario: Clock in ditolak - wajah tidak terdeteksi
  When saya arahkan kamera ke objek bukan wajah
  Then capture button disabled
  And pesan "Wajah tidak terdeteksi" muncul

Scenario: Clock in ditolak - liveness gagal
  When saya tidak kedip selama 5 detik
  Then liveness detection timeout
  And pesan "Kedipan tidak terdeteksi" muncul
  And saya bisa retry

Scenario: Clock in dengan warning geofence
  Given mode WFO dipilih
  And lokasi saya 500m dari kantor
  When saya submit clock in
  Then clock in berhasil dengan warning
  And notifikasi dikirim ke HRD
  And geofenceStatus = "OUTSIDE"
```

---

## 14. Related Documents

| Document | Link |
|----------|------|
| API Specification | [../04-api/specification.md](../04-api/specification.md) |
| ERD | [../03-architecture/erd.md](../03-architecture/erd.md) |
| User Stories | [../02-requirements/user-stories.md](../02-requirements/user-stories.md) |
| Phase 1 Spec | [phase-1-spec.md](phase-1-spec.md) |
