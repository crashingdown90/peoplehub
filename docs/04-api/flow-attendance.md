# Flow Absen dengan Foto Selfie (Mobile)

## Ringkasan
Karyawan wajib mengambil foto selfie saat clock in/out melalui perangkat mobile. Foto digunakan sebagai verifikasi kehadiran dan dicatat bersama data absensi.

## Aktor
- Karyawan (mobile)
- HRD/Atasan (pemeriksa)
- Sistem (validasi, penyimpanan, notifikasi)

## Langkah Utama
1) Karyawan membuka halaman absen pada aplikasi/website mobile.
2) Karyawan memilih mode lokasi (WFO/WFH) jika diperlukan.
3) Sistem meminta izin kamera; karyawan mengambil selfie langsung (tidak boleh unggah dari galeri).
4) Karyawan menekan tombol “Clock In” atau “Clock Out”; sistem otomatis menstempel waktu dan tanggal server, mengirim data absensi berisi waktu, lokasi (opsional geotag), device info, dan foto.
5) Sistem menyimpan Attendance + bukti foto ke storage dan mencatat audit.
6) Sistem menampilkan status sukses/gagal dan memberi notifikasi jika diperlukan (mis. keterlambatan).

## Persyaratan Teknis
- Kamera harus diakses in-app (HTML5 getUserMedia / native) dan blok unggah file dari galeri.
- Foto dikirim sebagai file (JPEG/WEBP) dengan kompresi wajar; tautan disimpan di DB (storage terpisah).
- Tambahkan metadata: timestamp, device info, lokasi (jika kebijakan geofence aktif).
- Validasi ukuran file dan format; tolak jika tidak sesuai.

## Keamanan & Privasi
- Simpan foto di storage privat dengan URL bertanda tangan atau akses via gateway yang terproteksi.
- Batasi akses foto hanya untuk Karyawan (miliknya), Atasan/HRD terkait, dan log audit.
- Beri tahu pengguna bahwa foto digunakan untuk verifikasi absensi.

## Aturan Bisnis
- Tanpa foto valid, absen ditolak.
- Jika geofence aktif: lokasi harus dalam radius kantor; jika tidak, tampilkan peringatan.
- Jika keterlambatan terdeteksi, tandai dan kirim notifikasi (opsional).

## Notifikasi
- Sukses: tampilkan ringkasan waktu dan mode (WFO/WFH).
- Gagal: tampilkan alasan (kamera ditolak, foto invalid, lokasi di luar area).

## Audit
- Catat action (clock in/out), waktu, lokasi, device, link foto, dan hasil validasi.

---

## Spesifikasi Kompresi Foto

### Format dan Ukuran
| Parameter | Nilai | Keterangan |
|-----------|-------|------------|
| Format | JPEG | Kompatibilitas tertinggi |
| Fallback Format | WEBP | Browser modern, ukuran lebih kecil |
| Max File Size | 500 KB | Setelah kompresi |
| Resolusi Target | 640x480 px | Cukup untuk verifikasi wajah |
| Max Resolusi | 1280x960 px | Untuk device high-resolution |
| Quality Setting | 0.7 - 0.8 | JPEG quality (70-80%) |
| Color Space | sRGB | Standar web |

### Implementasi Kompresi Client-Side
```typescript
interface CompressionConfig {
  maxWidth: number;      // 640 atau 1280
  maxHeight: number;     // 480 atau 960
  quality: number;       // 0.7 - 0.8
  mimeType: 'image/jpeg' | 'image/webp';
  maxSizeKB: number;     // 500
}

async function compressImage(
  blob: Blob,
  config: CompressionConfig
): Promise<Blob> {
  const img = await createImageBitmap(blob);

  // Calculate dimensions maintaining aspect ratio
  let { width, height } = img;
  if (width > config.maxWidth || height > config.maxHeight) {
    const ratio = Math.min(
      config.maxWidth / width,
      config.maxHeight / height
    );
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Draw to canvas
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  // Compress with quality reduction if needed
  let quality = config.quality;
  let result: Blob;

  do {
    result = await canvas.convertToBlob({
      type: config.mimeType,
      quality: quality
    });
    quality -= 0.1;
  } while (result.size > config.maxSizeKB * 1024 && quality > 0.3);

  return result;
}
```

### Validasi Server-Side
```typescript
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 500 * 1024; // 500 KB
const MIN_FILE_SIZE = 10 * 1024;  // 10 KB (prevent empty/corrupt files)

function validateSelfieUpload(file: File): ValidationResult {
  const errors: string[] = [];

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push('Format file tidak valid. Gunakan JPEG atau WEBP.');
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`Ukuran file terlalu besar (max ${MAX_FILE_SIZE / 1024} KB)`);
  }

  if (file.size < MIN_FILE_SIZE) {
    errors.push('File terlalu kecil atau corrupt');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Offline Handling

### Skenario Offline
Aplikasi harus dapat menangani situasi koneksi tidak stabil atau terputus saat proses absensi.

### Strategi Offline
```
┌─────────────────────────────────────────────────────────────────┐
│                     User Mencoba Clock In                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Check Network   │
                    │ Status          │
                    └─────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
      ┌───────────────┐               ┌───────────────┐
      │ Online        │               │ Offline       │
      └───────────────┘               └───────────────┘
              │                               │
              ▼                               ▼
      ┌───────────────┐               ┌───────────────┐
      │ Submit        │               │ Queue to      │
      │ Immediately   │               │ IndexedDB     │
      └───────────────┘               └───────────────┘
              │                               │
              ▼                               │
      ┌───────────────┐                       │
      │ Success/Error │                       │
      └───────────────┘                       │
                                              ▼
                                      ┌───────────────┐
                                      │ Show Pending  │
                                      │ Badge/Status  │
                                      └───────────────┘
                                              │
                                              ▼
                                      ┌───────────────┐
                                      │ Background    │
                                      │ Sync (when    │
                                      │ online)       │
                                      └───────────────┘
```

### Implementasi Offline Queue
```typescript
interface PendingAttendance {
  id: string;          // UUID untuk tracking
  type: 'clock_in' | 'clock_out';
  workMode: 'wfo' | 'wfh';
  capturedAt: string;  // ISO timestamp saat foto diambil
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  deviceInfo: {
    userAgent: string;
    platform: string;
  };
  selfieBlob: Blob;    // Foto tersimpan sebagai blob
  retryCount: number;  // Jumlah percobaan
  lastError?: string;  // Error terakhir
}

// IndexedDB Schema
const DB_NAME = 'peoplehub_offline';
const STORE_NAME = 'pending_attendance';

async function queueOfflineAttendance(data: PendingAttendance): Promise<void> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  });

  await db.put(STORE_NAME, data);

  // Register for background sync
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-attendance');
  }
}
```

### Background Sync (Service Worker)
```typescript
// service-worker.ts
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncPendingAttendance());
  }
});

async function syncPendingAttendance(): Promise<void> {
  const db = await openDB(DB_NAME, 1);
  const pending = await db.getAll(STORE_NAME);

  for (const item of pending) {
    try {
      await submitAttendance(item);
      await db.delete(STORE_NAME, item.id);
    } catch (error) {
      // Update retry count
      item.retryCount++;
      item.lastError = error.message;

      if (item.retryCount >= MAX_RETRY_COUNT) {
        // Move to failed queue or notify user
        await notifyFailedAttendance(item);
        await db.delete(STORE_NAME, item.id);
      } else {
        await db.put(STORE_NAME, item);
      }
    }
  }
}
```

### Batas Waktu Offline
| Parameter | Nilai | Keterangan |
|-----------|-------|------------|
| Max Queue Time | 4 jam | Setelah 4 jam, data expired |
| Max Retry | 5 kali | Setelah 5 kali gagal, notifikasi user |
| Sync Interval | 30 detik | Cek pending saat online |
| Timestamp Tolerance | 15 menit | Toleransi perbedaan waktu |

### UI Feedback Offline
```typescript
// Komponen status indikator
interface OfflineIndicatorProps {
  pendingCount: number;
  isOnline: boolean;
}

// Status yang ditampilkan:
// 1. "Online" - Hijau, semua normal
// 2. "Offline - Data tersimpan lokal" - Kuning
// 3. "Mengirim data tertunda..." - Kuning + animasi
// 4. "Gagal mengirim, coba lagi" - Merah + tombol retry
```

---

## Face Detection Requirement

### Spesifikasi Face Detection
Sistem dapat menggunakan face detection untuk memvalidasi bahwa foto selfie mengandung wajah yang valid.

### Konfigurasi
| Parameter | Nilai | Keterangan |
|-----------|-------|------------|
| Face Detection | Opsional | Dapat diaktifkan per tenant |
| Min Face Size | 20% dari frame | Wajah minimal 20% dari area foto |
| Max Face Count | 1 | Hanya boleh 1 wajah terdeteksi |
| Confidence Threshold | 0.7 (70%) | Minimum confidence score |
| Eye Open Check | Opsional | Deteksi mata terbuka |

### Implementasi Client-Side (TensorFlow.js)
```typescript
import * as faceDetection from '@tensorflow-models/face-detection';

interface FaceValidationResult {
  valid: boolean;
  faceDetected: boolean;
  faceCount: number;
  faceSize: number;     // percentage of frame
  confidence: number;
  errors: string[];
}

async function validateSelfieFrame(
  video: HTMLVideoElement
): Promise<FaceValidationResult> {
  const model = await faceDetection.createDetector(
    faceDetection.SupportedModels.MediaPipeFaceDetector,
    { runtime: 'tfjs' }
  );

  const faces = await model.estimateFaces(video);
  const errors: string[] = [];

  // Validasi jumlah wajah
  if (faces.length === 0) {
    errors.push('Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.');
    return { valid: false, faceDetected: false, faceCount: 0, faceSize: 0, confidence: 0, errors };
  }

  if (faces.length > 1) {
    errors.push('Terdeteksi lebih dari 1 wajah. Pastikan hanya Anda yang ada di frame.');
    return { valid: false, faceDetected: true, faceCount: faces.length, faceSize: 0, confidence: 0, errors };
  }

  const face = faces[0];

  // Hitung ukuran wajah relatif terhadap frame
  const frameArea = video.videoWidth * video.videoHeight;
  const faceArea = face.box.width * face.box.height;
  const faceSize = (faceArea / frameArea) * 100;

  if (faceSize < 20) {
    errors.push('Wajah terlalu kecil. Dekatkan perangkat ke wajah Anda.');
  }

  if (faceSize > 80) {
    errors.push('Wajah terlalu dekat. Jauhkan perangkat sedikit.');
  }

  return {
    valid: errors.length === 0,
    faceDetected: true,
    faceCount: 1,
    faceSize,
    confidence: face.keypoints ? 0.9 : 0.7,
    errors
  };
}
```

### Feedback Visual
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                       [Camera Preview]                           │
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │   Oval Guide    │  ← Panduan posisi wajah  │
│                    │                 │                          │
│                    │       😊        │                          │
│                    │                 │                          │
│                    └─────────────────┘                          │
│                                                                  │
│        ✓ Wajah terdeteksi                                       │
│        ✓ Posisi bagus                                           │
│        ⚠ Pencahayaan kurang                                     │
│                                                                  │
│                  [     Ambil Foto     ]                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Anti-Spoofing Measures

### Jenis Serangan yang Dicegah
1. **Photo Attack** - Menampilkan foto dari foto/layar
2. **Video Attack** - Memainkan video wajah
3. **Mask Attack** - Menggunakan topeng/mask

### Strategi Anti-Spoofing

#### 1. Liveness Detection (Rekomendasi)
```typescript
// Challenge-response liveness
interface LivenessChallenge {
  type: 'blink' | 'turn_head' | 'smile' | 'nod';
  instruction: string;
  timeoutMs: number;
}

const LIVENESS_CHALLENGES: LivenessChallenge[] = [
  { type: 'blink', instruction: 'Kedipkan mata Anda', timeoutMs: 5000 },
  { type: 'turn_head', instruction: 'Gerakkan kepala ke kiri lalu kanan', timeoutMs: 7000 },
  { type: 'smile', instruction: 'Tersenyumlah sebentar', timeoutMs: 5000 }
];

// Random challenge untuk mencegah pre-recorded video
function getRandomChallenge(): LivenessChallenge {
  return LIVENESS_CHALLENGES[Math.floor(Math.random() * LIVENESS_CHALLENGES.length)];
}
```

#### 2. Metadata Analysis
```typescript
interface SpoofingIndicators {
  // Deteksi tampilan layar (moire pattern)
  moirePatternDetected: boolean;

  // Deteksi refleksi tidak natural
  unnaturalReflection: boolean;

  // Deteksi border/frame foto
  frameBorderDetected: boolean;

  // Texture analysis (kulit vs kertas/layar)
  textureScore: number;  // 0-1, > 0.7 = real skin
}
```

#### 3. Environment Checks
```typescript
interface EnvironmentValidation {
  // Pastikan menggunakan kamera langsung
  isLiveCamera: boolean;

  // Deteksi screen recording/mirroring
  screenCaptureDetected: boolean;

  // Check brightness variation (foto statis tidak berubah)
  brightnessVariation: number;
}
```

### Konfigurasi Anti-Spoofing per Tenant
| Level | Fitur | Use Case |
|-------|-------|----------|
| Basic | Face detection only | Low security, UX prioritas |
| Standard | Face detection + random challenge | Default |
| High | Liveness detection + texture analysis | High security |
| Maximum | Semua fitur + device binding | Financial/Regulated |

---

## Fallback Kamera Tidak Tersedia

### Skenario Fallback
Ketika kamera tidak dapat diakses karena:
1. Izin kamera ditolak user
2. Tidak ada kamera di device
3. Kamera digunakan aplikasi lain
4. Hardware error

### Hierarki Fallback
```
┌─────────────────────────────────────────────────────────────────┐
│                    Akses Kamera                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ getUserMedia()  │
                    └─────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
      ┌───────────────┐               ┌───────────────┐
      │ Success       │               │ Error         │
      └───────────────┘               └───────────────┘
              │                               │
              ▼                               ▼
      ┌───────────────┐               ┌───────────────┐
      │ Proceed with  │               │ Check Error   │
      │ Normal Flow   │               │ Type          │
      └───────────────┘               └───────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      │                       │                       │
                      ▼                       ▼                       ▼
              ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
              │ NotAllowed    │       │ NotFound      │       │ NotReadable   │
              │ (Permission)  │       │ (No Camera)   │       │ (In Use)      │
              └───────────────┘       └───────────────┘       └───────────────┘
                      │                       │                       │
                      ▼                       ▼                       ▼
              ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
              │ Show Guide    │       │ Alternative   │       │ Retry After   │
              │ to Enable     │       │ Method        │       │ Delay         │
              └───────────────┘       └───────────────┘       └───────────────┘
```

### Fallback Options
```typescript
enum CameraFallbackOption {
  // Opsi 1: Absen tanpa foto (jika kebijakan membolehkan)
  ATTENDANCE_WITHOUT_PHOTO = 'no_photo',

  // Opsi 2: Upload foto manual (dengan validasi ketat)
  MANUAL_UPLOAD = 'manual_upload',

  // Opsi 3: Hubungi HRD untuk absen manual
  CONTACT_HRD = 'contact_hrd',

  // Opsi 4: Coba kamera lain (jika multiple camera)
  TRY_OTHER_CAMERA = 'other_camera',

  // Opsi 5: Gunakan device lain
  USE_OTHER_DEVICE = 'other_device'
}

interface FallbackConfig {
  allowedOptions: CameraFallbackOption[];
  requireApproval: boolean;  // Perlu approval HRD?
  notifyHRD: boolean;        // Notifikasi ke HRD?
  logReason: boolean;        // Catat alasan di audit?
}

// Default config
const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  allowedOptions: [
    CameraFallbackOption.TRY_OTHER_CAMERA,
    CameraFallbackOption.CONTACT_HRD
  ],
  requireApproval: true,
  notifyHRD: true,
  logReason: true
};
```

### UI Error Messages
| Error Code | Message User | Action |
|------------|--------------|--------|
| NotAllowedError | "Izin kamera ditolak. Aktifkan di pengaturan browser." | Link ke settings |
| NotFoundError | "Kamera tidak ditemukan di perangkat ini." | Opsi alternatif |
| NotReadableError | "Kamera sedang digunakan aplikasi lain." | Tombol retry |
| OverconstrainedError | "Kamera tidak mendukung konfigurasi yang diminta." | Auto-fallback |
| SecurityError | "Akses kamera diblokir karena koneksi tidak aman." | Info HTTPS |

---

## Retry Mechanism

### Strategi Retry dengan Exponential Backoff
```typescript
interface RetryConfig {
  maxRetries: number;        // Maksimum percobaan
  initialDelayMs: number;    // Delay awal
  maxDelayMs: number;        // Delay maksimum
  backoffMultiplier: number; // Pengali delay
  retryableErrors: string[]; // Error yang bisa di-retry
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,      // 1 detik
  maxDelayMs: 30000,         // 30 detik
  backoffMultiplier: 2,      // 1s -> 2s -> 4s -> ...
  retryableErrors: [
    'NetworkError',
    'TimeoutError',
    'ServerError',
    '500',
    '502',
    '503',
    '504'
  ]
};

async function submitWithRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable = config.retryableErrors.some(
        e => error.name.includes(e) || error.message.includes(e)
      );

      if (!isRetryable || attempt === config.maxRetries) {
        throw error;
      }

      // Log retry attempt
      console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);

      // Wait before retry
      await sleep(delay);

      // Exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Retry Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                     Submit Attendance                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Attempt 1       │
                    │ Delay: 0ms      │
                    └─────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
      ┌───────────────┐               ┌───────────────┐
      │ Success       │               │ Retryable     │
      │ → Done ✓      │               │ Error         │
      └───────────────┘               └───────────────┘
                                              │
                                              ▼
                                      ┌───────────────┐
                                      │ Wait 1000ms   │
                                      └───────────────┘
                                              │
                                              ▼
                                      ┌───────────────┐
                                      │ Attempt 2     │
                                      │ Delay: 1000ms │
                                      └───────────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              │                               │
                              ▼                               ▼
                      ┌───────────────┐               ┌───────────────┐
                      │ Success       │               │ Retryable     │
                      │ → Done ✓      │               │ Error         │
                      └───────────────┘               └───────────────┘
                                                              │
                                                              ▼
                                                      ┌───────────────┐
                                                      │ Wait 2000ms   │
                                                      └───────────────┘
                                                              │
                                                              ▼
                                                      ┌───────────────┐
                                                      │ Attempt 3     │
                                                      │ Delay: 2000ms │
                                                      └───────────────┘
                                                              │
                                              ┌───────────────┴───────────────┐
                                              │                               │
                                              ▼                               ▼
                                      ┌───────────────┐               ┌───────────────┐
                                      │ Success       │               │ Final Error   │
                                      │ → Done ✓      │               │ → Queue       │
                                      └───────────────┘               │   Offline or  │
                                                                      │   Show Error  │
                                                                      └───────────────┘
```

### User Feedback During Retry
```typescript
interface RetryProgress {
  attempt: number;
  maxAttempts: number;
  status: 'retrying' | 'waiting' | 'success' | 'failed';
  message: string;
  nextRetryIn?: number;  // seconds
}

// Messages shown to user
const RETRY_MESSAGES = {
  retrying: (attempt: number, max: number) =>
    `Mengirim data... (percobaan ${attempt}/${max})`,
  waiting: (seconds: number) =>
    `Koneksi bermasalah. Mencoba lagi dalam ${seconds} detik...`,
  success: 'Absensi berhasil tercatat!',
  failed: 'Gagal mengirim. Data disimpan dan akan dikirim saat koneksi stabil.'
};
```

---

## Dokumen Terkait
- [02-user-flow-utama.md](02-user-flow-utama.md) - Flow utama
- [04-epic-dan-user-stories.md](04-epic-dan-user-stories.md) - User stories absensi
- [19-skema-database-erd.md](19-skema-database-erd.md) - Struktur tabel attendance
- [23-security-policy.md](23-security-policy.md) - Kebijakan keamanan
- [24-backup-disaster-recovery.md](24-backup-disaster-recovery.md) - Backup data
