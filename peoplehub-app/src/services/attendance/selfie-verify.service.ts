// @ai:cl - Selfie Verification Service for Attendance

import { ServiceResponse, success, error, ErrorCodes } from "../types";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

// ==========================================
// TYPES
// ==========================================

export interface SelfieVerifyResult {
  valid: boolean;
  photoUrl: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface SelfieUploadOptions {
  employeeId: string;
  type: "clockin" | "clockout" | "correction";
  minWidth?: number;
  minHeight?: number;
  maxSizeBytes?: number;
}

// ==========================================
// CONSTANTS
// ==========================================

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MIN_WIDTH = 320;
const DEFAULT_MIN_HEIGHT = 240;
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

// ==========================================
// SELFIE VERIFICATION SERVICE
// ==========================================

export class SelfieVerifyService {
  /**
   * Validate and save selfie photo
   */
  static async verifySelfie(
    photo: File,
    options: SelfieUploadOptions
  ): Promise<ServiceResponse<SelfieVerifyResult>> {
    const {
      employeeId,
      type,
      maxSizeBytes = DEFAULT_MAX_SIZE,
    } = options;

    try {
      // 1. Validate file exists
      if (!photo) {
        return error(ErrorCodes.VALIDATION_ERROR, "Foto selfie wajib diambil");
      }

      // 2. Validate file type
      if (!ALLOWED_MIME_TYPES.includes(photo.type)) {
        return error(
          ErrorCodes.VALIDATION_ERROR,
          "Format foto tidak didukung. Gunakan JPEG, PNG, atau WebP"
        );
      }

      // 3. Validate file size
      if (photo.size > maxSizeBytes) {
        const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
        return error(
          ErrorCodes.VALIDATION_ERROR,
          `Ukuran foto maksimal ${maxMB}MB`
        );
      }

      // 4. Get file buffer
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 5. Basic validation - check if it's a valid image
      if (!this.isValidImageBuffer(buffer)) {
        return error(ErrorCodes.VALIDATION_ERROR, "File bukan gambar yang valid");
      }

      // 6. Generate filename and save
      const ext = this.getExtension(photo.type);
      const timestamp = Date.now();
      const filename = `${type}_${employeeId}_${timestamp}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "attendance");

      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);

      const photoUrl = `/uploads/attendance/${filename}`;

      return success({
        valid: true,
        photoUrl,
        filename,
        size: photo.size,
        mimeType: photo.type,
      });
    } catch (err) {
      console.error("Selfie verification error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal memproses foto selfie");
    }
  }

  /**
   * Validate base64 image and save
   */
  static async verifyBase64Selfie(
    base64Data: string,
    options: SelfieUploadOptions
  ): Promise<ServiceResponse<SelfieVerifyResult>> {
    const {
      employeeId,
      type,
      maxSizeBytes = DEFAULT_MAX_SIZE,
    } = options;

    try {
      // 1. Parse base64 data
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return error(ErrorCodes.VALIDATION_ERROR, "Format base64 tidak valid");
      }

      const mimeType = matches[1];
      const data = matches[2];

      // 2. Validate mime type
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return error(
          ErrorCodes.VALIDATION_ERROR,
          "Format foto tidak didukung. Gunakan JPEG, PNG, atau WebP"
        );
      }

      // 3. Convert to buffer
      const buffer = Buffer.from(data, "base64");

      // 4. Validate size
      if (buffer.length > maxSizeBytes) {
        const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
        return error(
          ErrorCodes.VALIDATION_ERROR,
          `Ukuran foto maksimal ${maxMB}MB`
        );
      }

      // 5. Validate image
      if (!this.isValidImageBuffer(buffer)) {
        return error(ErrorCodes.VALIDATION_ERROR, "File bukan gambar yang valid");
      }

      // 6. Save file
      const ext = this.getExtension(mimeType);
      const timestamp = Date.now();
      const filename = `${type}_${employeeId}_${timestamp}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "attendance");

      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);

      const photoUrl = `/uploads/attendance/${filename}`;

      return success({
        valid: true,
        photoUrl,
        filename,
        size: buffer.length,
        mimeType,
      });
    } catch (err) {
      console.error("Base64 selfie verification error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal memproses foto selfie");
    }
  }

  /**
   * Check if buffer is a valid image by checking magic bytes
   */
  private static isValidImageBuffer(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return true;
    }

    // PNG: 89 50 4E 47
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return true;
    }

    // WebP: RIFF....WEBP
    if (
      buffer[0] === 0x52 && // R
      buffer[1] === 0x49 && // I
      buffer[2] === 0x46 && // F
      buffer[3] === 0x46 && // F
      buffer.length > 11 &&
      buffer[8] === 0x57 && // W
      buffer[9] === 0x45 && // E
      buffer[10] === 0x42 && // B
      buffer[11] === 0x50 // P
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get file extension from mime type
   */
  private static getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    return extensions[mimeType] || ".jpg";
  }
}

export const selfieVerifyService = new SelfieVerifyService();
