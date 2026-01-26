// @ai:cl - Local file upload utility for storing files on filesystem
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads";

interface UploadResult {
    success: boolean;
    url?: string;
    path?: string;
    error?: string;
}

interface UploadOptions {
    folder: string;
    filename?: string;
    allowedTypes?: string[];
    maxSize?: number;
}

/**
 * Save file buffer to local filesystem
 */
export async function saveFile(
    buffer: Buffer,
    options: UploadOptions
): Promise<UploadResult> {
    try {
        const { folder, filename, allowedTypes, maxSize } = options;

        // Validate file size
        if (maxSize && buffer.length > maxSize) {
            return {
                success: false,
                error: `File size exceeds maximum of ${Math.round(maxSize / 1024 / 1024)}MB`,
            };
        }

        // Create upload directory if not exists
        const uploadPath = path.join(UPLOAD_DIR, folder);
        if (!existsSync(uploadPath)) {
            await mkdir(uploadPath, { recursive: true });
        }

        // Generate filename if not provided
        const finalFilename = filename || `file_${Date.now()}`;
        const filePath = path.join(uploadPath, finalFilename);

        // Write file
        await writeFile(filePath, buffer);

        // Return public URL (relative to public folder)
        const publicUrl = `/uploads/${folder}/${finalFilename}`;

        return {
            success: true,
            url: publicUrl,
            path: filePath,
        };
    } catch (error) {
        console.error("File upload error:", error);
        return {
            success: false,
            error: "Failed to save file",
        };
    }
}

/**
 * Save profile photo from base64 or buffer
 */
export async function saveProfilePhoto(
    data: Buffer | string,
    tenantId: string,
    userId: string,
    extension: string
): Promise<UploadResult> {
    let buffer: Buffer;

    if (typeof data === "string") {
        // Handle base64 data
        const matches = data.match(/^data:image\/(jpeg|jpg|png);base64,(.+)$/);
        if (matches) {
            buffer = Buffer.from(matches[2], "base64");
            extension = matches[1];
        } else {
            // Assume raw base64 without data URI prefix
            buffer = Buffer.from(data, "base64");
        }
    } else {
        buffer = data;
    }

    const timestamp = Date.now();
    const filename = `photo_${timestamp}.${extension === "jpg" ? "jpeg" : extension}`;
    const folder = `profiles/${tenantId}/${userId}`;

    return saveFile(buffer, {
        folder,
        filename,
        maxSize: 5 * 1024 * 1024, // 5MB
    });
}

/**
 * Save receipt/attachment file
 */
export async function saveReceipt(
    buffer: Buffer,
    tenantId: string,
    requestId: string,
    originalName: string
): Promise<UploadResult> {
    const timestamp = Date.now();
    const extension = path.extname(originalName) || ".jpg";
    const filename = `receipt_${timestamp}${extension}`;
    const folder = `receipts/${tenantId}/${requestId}`;

    return saveFile(buffer, {
        folder,
        filename,
        maxSize: 10 * 1024 * 1024, // 10MB for receipts
    });
}

/**
 * Delete file from filesystem
 */
export async function deleteFile(filePath: string): Promise<boolean> {
    try {
        // Convert public URL to file path
        const actualPath = filePath.startsWith("/uploads/")
            ? path.join(UPLOAD_DIR, filePath.replace("/uploads/", ""))
            : filePath;

        if (existsSync(actualPath)) {
            await unlink(actualPath);
            return true;
        }
        return false;
    } catch (error) {
        console.error("File delete error:", error);
        return false;
    }
}

/**
 * Validate image file type from buffer
 */
export function getImageTypeFromBuffer(buffer: Buffer): string | null {
    // Check magic bytes
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return "jpeg";
    }
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
    ) {
        return "png";
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        return "gif";
    }
    if (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46
    ) {
        return "webp";
    }
    return null;
}
