/**
 * Photo Upload Service
 * 
 * Handles photo validation and storage for attendance selfies.
 * Validates file format, size, and uploads to S3/storage.
 */

import { FileTooLargeError, InvalidFileTypeError, PhotoUploadError } from '@/lib/errors';
import { put } from '@vercel/blob';

export interface PhotoValidation {
    /** Allowed MIME types */
    allowedTypes: string[];
    /** Maximum file size in bytes */
    maxSizeBytes: number;
    /** Minimum width in pixels */
    minWidth?: number;
    /** Minimum height in pixels */
    minHeight?: number;
}

export interface PhotoUploadResult {
    /** Public URL of uploaded photo */
    url: string;
    /** File size in bytes */
    size: number;
    /** MIME type */
    mimeType: string;
    /** Storage path/key */
    path: string;
}

export class PhotoUploadService {
    private static readonly DEFAULT_VALIDATION: PhotoValidation = {
        allowedTypes: ['image/jpeg', 'image/png'],
        maxSizeBytes: 500 * 1024, // 500 KB
        minWidth: 640,
        minHeight: 480,
    };

    /**
     * Validate photo file before upload
     * 
     * @param file - File to validate
     * @param validation - Validation rules
     * @throws {FileTooLargeError} If file exceeds size limit
     * @throws {InvalidFileTypeError} If file type not allowed
     */
    static validatePhoto(
        file: File,
        validation: PhotoValidation = this.DEFAULT_VALIDATION
    ): void {
        // Check file type
        if (!validation.allowedTypes.includes(file.type)) {
            throw new InvalidFileTypeError(file.type, validation.allowedTypes);
        }

        // Check file size
        if (file.size > validation.maxSizeBytes) {
            throw new FileTooLargeError(file.size, validation.maxSizeBytes);
        }

        // Note: Resolution check would require reading image dimensions
        // This can be done in frontend before upload, or here using image library
        // For now, we trust frontend validation
    }

    /**
     * Upload attendance photo to storage
     * 
     * @param file - File to upload
     * @param metadata - Upload metadata (employee ID, type, etc.)
     * @returns Upload result with URL
     */
    static async uploadAttendancePhoto(
        file: File,
        metadata: {
            employeeId: string;
            tenantId: string;
            type: 'clock_in' | 'clock_out';
            date: Date;
        }
    ): Promise<PhotoUploadResult> {
        try {
            // Validate photo
            this.validatePhoto(file);

            // Generate storage path
            const dateStr = metadata.date.toISOString().split('T')[0];
            const timestamp = Date.now();
            const extension = file.type.split('/')[1];
            const path = `attendance/${metadata.tenantId}/${metadata.employeeId}/${dateStr}/${metadata.type}_${timestamp}.${extension}`;

            // Upload to Vercel Blob (or S3 if configured)
            const blob = await put(path, file, {
                access: 'public',
                addRandomSuffix: false,
            });

            return {
                url: blob.url,
                size: file.size,
                mimeType: file.type,
                path,
            };
        } catch (error) {
            if (
                error instanceof FileTooLargeError ||
                error instanceof InvalidFileTypeError
            ) {
                throw error;
            }

            throw new PhotoUploadError(
                'Gagal mengupload foto. Silakan coba lagi.',
                { originalError: error }
            );
        }
    }

    /**
     * Delete photo from storage
     * Used for cleanup or correction
     */
    static async deletePhoto(url: string): Promise<void> {
        // Implementation depends on storage provider
        // For Vercel Blob, use del() function
        // For S3, use deleteObject()
        // For now, we skip deletion (photos are archived)
    }

    /**
     * Get file extension from MIME type
     */
    private static getExtension(mimeType: string): string {
        const map: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        };
        return map[mimeType] || 'jpg';
    }
}
