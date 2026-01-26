// @ai:cl - Local file upload utility for storing files on filesystem with compression
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads";

// Image compression settings
const IMAGE_CONFIG = {
    profile: {
        maxWidth: 800,
        maxHeight: 800,
        quality: 80, // JPEG quality (0-100)
    },
    receipt: {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 85,
    },
    ktp: {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 85,
    },
};

interface UploadResult {
    success: boolean;
    url?: string;
    path?: string;
    error?: string;
    originalSize?: number;
    compressedSize?: number;
}

interface UploadOptions {
    folder: string;
    filename?: string;
    allowedTypes?: string[];
    maxSize?: number;
}

interface ImageProcessOptions {
    maxWidth: number;
    maxHeight: number;
    quality: number;
}

/**
 * Compress and resize image using sharp
 */
async function processImage(
    buffer: Buffer,
    options: ImageProcessOptions
): Promise<Buffer> {
    const { maxWidth, maxHeight, quality } = options;

    try {
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Only resize if image is larger than max dimensions
        const needsResize =
            (metadata.width && metadata.width > maxWidth) ||
            (metadata.height && metadata.height > maxHeight);

        let processed = image;

        if (needsResize) {
            processed = processed.resize(maxWidth, maxHeight, {
                fit: "inside", // Maintain aspect ratio
                withoutEnlargement: true,
            });
        }

        // Convert to JPEG for better compression (smaller file size)
        // PNG with transparency will be converted to JPEG with white background
        const result = await processed
            .jpeg({
                quality,
                mozjpeg: true, // Use mozjpeg for better compression
            })
            .toBuffer();

        return result;
    } catch (error) {
        console.error("Image processing error:", error);
        // Return original buffer if processing fails
        return buffer;
    }
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
 * Save profile photo from base64 or buffer with automatic compression
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

    const originalSize = buffer.length;

    // Compress and resize the image
    const compressedBuffer = await processImage(buffer, IMAGE_CONFIG.profile);

    const timestamp = Date.now();
    // Always save as JPEG after compression
    const filename = `photo_${timestamp}.jpeg`;
    const folder = `profiles/${tenantId}/${userId}`;

    const result = await saveFile(compressedBuffer, {
        folder,
        filename,
        maxSize: 5 * 1024 * 1024, // 5MB (should be much smaller after compression)
    });

    // Add compression stats to result
    if (result.success) {
        result.originalSize = originalSize;
        result.compressedSize = compressedBuffer.length;
        console.log(
            `Profile photo compressed: ${Math.round(originalSize / 1024)}KB -> ${Math.round(compressedBuffer.length / 1024)}KB (${Math.round((1 - compressedBuffer.length / originalSize) * 100)}% reduction)`
        );
    }

    return result;
}

/**
 * Save receipt/attachment file with automatic compression for images
 */
export async function saveReceipt(
    buffer: Buffer,
    tenantId: string,
    requestId: string,
    originalName: string
): Promise<UploadResult> {
    const timestamp = Date.now();
    const extension = path.extname(originalName).toLowerCase() || ".jpg";
    const folder = `receipts/${tenantId}/${requestId}`;

    // Check if it's an image file
    const isImage = [".jpg", ".jpeg", ".png", ".webp"].includes(extension);
    const originalSize = buffer.length;

    let finalBuffer = buffer;
    let filename = `receipt_${timestamp}${extension}`;

    if (isImage) {
        // Compress image
        finalBuffer = await processImage(buffer, IMAGE_CONFIG.receipt);
        filename = `receipt_${timestamp}.jpeg`; // Convert to JPEG

        console.log(
            `Receipt compressed: ${Math.round(originalSize / 1024)}KB -> ${Math.round(finalBuffer.length / 1024)}KB (${Math.round((1 - finalBuffer.length / originalSize) * 100)}% reduction)`
        );
    }

    const result = await saveFile(finalBuffer, {
        folder,
        filename,
        maxSize: 10 * 1024 * 1024, // 10MB for receipts
    });

    if (result.success && isImage) {
        result.originalSize = originalSize;
        result.compressedSize = finalBuffer.length;
    }

    return result;
}

/**
 * Save KTP photo with compression
 */
export async function saveKtpPhoto(
    buffer: Buffer,
    tenantId: string,
    userId: string
): Promise<UploadResult> {
    const originalSize = buffer.length;

    // Compress and resize the KTP image
    const compressedBuffer = await processImage(buffer, IMAGE_CONFIG.ktp);

    const timestamp = Date.now();
    const filename = `ktp_${timestamp}.jpeg`;
    const folder = `ktp/${tenantId}/${userId}`;

    const result = await saveFile(compressedBuffer, {
        folder,
        filename,
        maxSize: 5 * 1024 * 1024,
    });

    if (result.success) {
        result.originalSize = originalSize;
        result.compressedSize = compressedBuffer.length;
        console.log(
            `KTP photo compressed: ${Math.round(originalSize / 1024)}KB -> ${Math.round(compressedBuffer.length / 1024)}KB (${Math.round((1 - compressedBuffer.length / originalSize) * 100)}% reduction)`
        );
    }

    return result;
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
