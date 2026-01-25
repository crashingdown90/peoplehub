// @ai:ag - Created by Antigravity
// @ai:cl - Updated for Phase 1A registration
// Authentication validation schemas

import { z } from "zod";

/**
 * Indonesian phone number regex
 * Supports: +62812xxx, 62812xxx, 0812xxx
 * Format: 10-13 digits total (excluding country code prefix)
 */
const INDONESIA_PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Registration schema - Phase 1A
 * Includes: tenant selection, personal data, bank data, photo, optional fields
 */
export const registerSchema = z
  .object({
    // Step 1: Tenant selection
    tenantId: z.string().min(1, "Pilih perusahaan"),

    // Step 2: Personal data
    email: z.string().email("Format email tidak valid"),
    phone: z
      .string()
      .min(10, "Nomor telepon minimal 10 digit")
      .max(15, "Nomor telepon maksimal 15 digit")
      .regex(
        INDONESIA_PHONE_REGEX,
        "Format nomor telepon tidak valid (contoh: 08123456789)",
      ),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus mengandung huruf besar")
      .regex(/[a-z]/, "Password harus mengandung huruf kecil")
      .regex(/[0-9]/, "Password harus mengandung angka")
      .regex(
        /[!@#$%^&*]/,
        "Password harus mengandung karakter spesial (!@#$%^&*)",
      ),
    passwordConfirmation: z.string().min(1, "Konfirmasi password wajib diisi"),
    fullName: z
      .string()
      .min(3, "Nama lengkap minimal 3 karakter")
      .max(100, "Nama lengkap maksimal 100 karakter"),
    gender: z.enum(["MALE", "FEMALE"], { message: "Pilih jenis kelamin" }),
    birthPlace: z
      .string()
      .min(2, "Tempat lahir minimal 2 karakter")
      .max(50, "Tempat lahir maksimal 50 karakter"),
    birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),

    // Step 3: Bank data
    // Note: bankName stores the bank CODE (e.g., "BCA", "MANDIRI"), not the full name
    // Use BANK_LIST from @/constants/banks to get the display name
    bankName: z.string().min(1, "Pilih nama bank"),
    bankAccountNumber: z
      .string()
      .min(10, "Nomor rekening minimal 10 digit")
      .max(16, "Nomor rekening maksimal 16 digit")
      .regex(/^\d+$/, "Nomor rekening hanya boleh angka"),
    bankAccountHolder: z
      .string()
      .min(3, "Nama pemilik rekening minimal 3 karakter")
      .max(100, "Nama maksimal 100 karakter"),

    // Step 4: Photo (required) & Documents (optional)
    photoUrl: z.string().min(1, "Foto diri wajib diupload"),

    // Optional fields
    nik: z
      .string()
      .refine(
        (val) => !val || (val.length === 16 && /^\d+$/.test(val)),
        "NIK harus 16 digit angka",
      )
      .optional()
      .or(z.literal("")),
    npwp: z
      .string()
      .refine(
        (val) => !val || /^\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}$/.test(val),
        "Format NPWP tidak valid (XX.XXX.XXX.X-XXX.XXX)",
      )
      .optional()
      .or(z.literal("")),
    address: z.string().max(500, "Alamat maksimal 500 karakter").optional(),
    ktpPhotoUrl: z.string().optional(),
    emergencyContactName: z
      .string()
      .max(100, "Nama kontak maksimal 100 karakter")
      .optional(),
    emergencyContactPhone: z
      .string()
      .refine(
        (val) => !val || INDONESIA_PHONE_REGEX.test(val),
        "Format nomor telepon darurat tidak valid",
      )
      .optional()
      .or(z.literal("")),

    // Step 5: Agreement
    agreedToTerms: z
      .boolean()
      .refine(
        (val) => val === true,
        "Anda harus menyetujui ketentuan penggunaan",
      ),
    agreedToPrivacy: z
      .boolean()
      .refine((val) => val === true, "Anda harus menyetujui kebijakan privasi"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Konfirmasi password tidak cocok",
    path: ["passwordConfirmation"],
  })
  .refine(
    (data) => {
      // Validate birthDate is a valid date and user is at least 17 years old
      const birthDate = new Date(data.birthDate);
      if (isNaN(birthDate.getTime())) return false;
      return calculateAge(birthDate) >= 17;
    },
    {
      message: "Usia minimal 17 tahun",
      path: ["birthDate"],
    },
  )
  .refine(
    (data) => {
      // Validate user is not older than 65 years (retirement age)
      const birthDate = new Date(data.birthDate);
      if (isNaN(birthDate.getTime())) return true; // Let previous refine handle invalid date
      return calculateAge(birthDate) <= 65;
    },
    {
      message: "Usia maksimal 65 tahun",
      path: ["birthDate"],
    },
  );

/**
 * Simple registration schema (for backward compatibility)
 */
export const registerSchemaSimple = z.object({
  email: z.string().email("Format email tidak valid"),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .regex(INDONESIA_PHONE_REGEX, "Format nomor telepon tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
  rememberMe: z.boolean().optional(),
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

/**
 * Reset password schema
 */
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

/**
 * Change password schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

// Inferred types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
