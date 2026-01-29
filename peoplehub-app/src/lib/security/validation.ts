// @ai:cl - Security validation utilities
import { z } from "zod";

// ==========================================
// AUTH VALIDATIONS
// ==========================================

export const registerSchema = z
  .object({
    email: z.string().email("Format email tidak valid"),
    phone: z
      .string()
      .min(10, "Nomor telepon minimal 10 digit")
      .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Format nomor telepon tidak valid"),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus mengandung huruf kapital")
      .regex(/[a-z]/, "Password harus mengandung huruf kecil")
      .regex(/[0-9]/, "Password harus mengandung angka")
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password harus mengandung karakter khusus"),
    passwordConfirmation: z.string(),
    fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
    agreedToTerms: z
      .boolean()
      .refine((val) => val === true, "Anda harus menyetujui kebijakan privasi"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Konfirmasi password tidak cocok",
    path: ["passwordConfirmation"],
  });

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: z.string().min(8, "Password minimal 8 karakter"),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Konfirmasi password tidak cocok",
    path: ["passwordConfirmation"],
  });

// ==========================================
// EMPLOYEE VALIDATIONS
// ==========================================

export const updateProfileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export const updateBankInfoSchema = z.object({
  bankName: z.string().min(1, "Nama bank wajib diisi"),
  bankAccountNumber: z.string().min(10, "Nomor rekening minimal 10 digit"),
  bankAccountHolder: z.string().min(3, "Nama pemegang rekening minimal 3 karakter"),
  bankBranch: z.string().optional(),
});

// ==========================================
// ATTENDANCE VALIDATIONS
// ==========================================

export const clockInSchema = z.object({
  workMode: z.enum(["WFO", "WFH"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceInfo: z.string().optional(),
  photoBase64: z.string().optional(),
});

export const clockOutSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceInfo: z.string().optional(),
  photoBase64: z.string().optional(),
});

export const attendanceCorrectionSchema = z.object({
  attendanceDate: z.string(),
  requestedClockIn: z.string().optional(),
  requestedClockOut: z.string().optional(),
  reason: z.string().min(10, "Alasan minimal 10 karakter"),
});

// ==========================================
// LEAVE VALIDATIONS
// ==========================================

export const leaveRequestSchema = z
  .object({
    leaveTypeId: z.string().cuid("Jenis cuti wajib dipilih"),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
    endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
    reason: z.string().min(10, "Alasan minimal 10 karakter"),
    delegateToId: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "Tanggal selesai harus setelah atau sama dengan tanggal mulai",
      path: ["endDate"],
    }
  );

// ==========================================
// TRAVEL & REIMBURSE VALIDATIONS
// ==========================================

export const travelRequestSchema = z
  .object({
    destination: z.string().min(3, "Tujuan minimal 3 karakter"),
    purpose: z.string().min(10, "Tujuan perjalanan minimal 10 karakter"),
    departureDate: z.string().min(1, "Tanggal berangkat wajib diisi"),
    returnDate: z.string().min(1, "Tanggal kembali wajib diisi"),
    estimatedBudget: z.number().min(0, "Budget tidak boleh negatif"),
    transportation: z.string().optional(),
    accommodation: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const departure = new Date(data.departureDate);
      const returnDate = new Date(data.returnDate);
      return returnDate >= departure;
    },
    {
      message: "Tanggal kembali harus setelah atau sama dengan tanggal berangkat",
      path: ["returnDate"],
    }
  );

export const reimburseRequestSchema = z.object({
  category: z.enum(["Transport", "Meals", "Accommodation", "Equipment", "Other"]),
  totalAmount: z.number().min(1, "Jumlah harus lebih dari 0"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  items: z
    .array(
      z.object({
        description: z.string().min(3, "Deskripsi item minimal 3 karakter"),
        amount: z.number().min(1, "Jumlah harus lebih dari 0"),
        date: z.string(),
        receiptUrl: z.string().optional(),
      })
    )
    .min(1, "Minimal 1 item reimburse"),
});

// ==========================================
// KPI VALIDATIONS
// ==========================================

export const kpiTargetSchema = z.object({
  indicatorId: z.string().cuid("Indikator wajib dipilih"),
  periodId: z.string().cuid("Periode wajib dipilih"),
  targetValue: z.number().min(0, "Target tidak boleh negatif"),
  notes: z.string().optional(),
});

export const kpiActualSchema = z.object({
  actualValue: z.number().min(0, "Nilai aktual tidak boleh negatif"),
  notes: z.string().optional(),
});

// ==========================================
// APPROVAL VALIDATIONS
// ==========================================

export const approvalSchema = z.object({
  notes: z.string().optional(),
});

export const rejectionSchema = z.object({
  reason: z.string().min(10, "Alasan penolakan minimal 10 karakter"),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateBankInfoInput = z.infer<typeof updateBankInfoSchema>;
export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
export type AttendanceCorrectionInput = z.infer<typeof attendanceCorrectionSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type TravelRequestInput = z.infer<typeof travelRequestSchema>;
export type ReimburseRequestInput = z.infer<typeof reimburseRequestSchema>;
export type KpiTargetInput = z.infer<typeof kpiTargetSchema>;
export type KpiActualInput = z.infer<typeof kpiActualSchema>;
export type ApprovalInput = z.infer<typeof approvalSchema>;
export type RejectionInput = z.infer<typeof rejectionSchema>;
