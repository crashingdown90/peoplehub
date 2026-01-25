// @ai:ag - Created by Antigravity
// File upload hook with progress tracking

'use client';

import { useState, useCallback, useRef } from 'react';
import { FILE_UPLOAD } from '@/constants';

interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
    url?: string;
}

interface UseFileUploadOptions {
    endpoint?: string;
    maxSize?: number;
    accept?: string[];
    onSuccess?: (url: string, fileName: string) => void;
    onError?: (error: string, fileName: string) => void;
}

interface UseFileUploadReturn {
    // State
    uploads: UploadProgress[];
    isUploading: boolean;

    // Actions
    uploadFile: (file: File) => Promise<string | null>;
    uploadFiles: (files: File[]) => Promise<(string | null)[]>;
    cancelUpload: (fileName: string) => void;
    clearUploads: () => void;

    // Validation
    validateFile: (file: File) => { valid: boolean; error?: string };
}

/**
 * Hook for file uploads with progress tracking
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
    const {
        endpoint = '/api/upload',
        maxSize = FILE_UPLOAD.maxSize,
        accept = FILE_UPLOAD.allowedImageTypes,
        onSuccess,
        onError,
    } = options;

    const [uploads, setUploads] = useState<UploadProgress[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const abortControllers = useRef<Map<string, AbortController>>(new Map());

    // Validate file
    const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
        // Check file size
        if (file.size > maxSize) {
            return {
                valid: false,
                error: `Ukuran file melebihi batas maksimal (${FILE_UPLOAD.maxSizeLabel})`,
            };
        }

        // Check file type
        if (accept.length > 0 && !(accept as string[]).includes(file.type)) {
            return {
                valid: false,
                error: `Tipe file tidak diizinkan. Diizinkan: ${accept.join(', ')}`,
            };
        }

        return { valid: true };
    }, [maxSize, accept]);

    // Update upload progress
    const updateProgress = useCallback((fileName: string, updates: Partial<UploadProgress>) => {
        setUploads(prev =>
            prev.map(u => u.fileName === fileName ? { ...u, ...updates } : u)
        );
    }, []);

    // Upload single file
    const uploadFile = useCallback(async (file: File): Promise<string | null> => {
        // Validate
        const validation = validateFile(file);
        if (!validation.valid) {
            onError?.(validation.error!, file.name);
            return null;
        }

        // Create abort controller
        const controller = new AbortController();
        abortControllers.current.set(file.name, controller);

        // Add to uploads list
        setUploads(prev => [...prev, {
            fileName: file.name,
            progress: 0,
            status: 'pending',
        }]);

        setIsUploading(true);

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);

            // Update status to uploading
            updateProgress(file.name, { status: 'uploading', progress: 10 });

            // Upload
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });

            // Simulate progress updates
            updateProgress(file.name, { progress: 50 });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Upload gagal');
            }

            const data = await response.json();
            const url = data.url || data.fileUrl;

            // Update success
            updateProgress(file.name, {
                status: 'completed',
                progress: 100,
                url,
            });

            onSuccess?.(url, file.name);
            return url;

        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                updateProgress(file.name, {
                    status: 'error',
                    error: 'Upload dibatalkan',
                });
                return null;
            }

            const errorMessage = (err as Error).message || 'Terjadi kesalahan saat upload';
            updateProgress(file.name, {
                status: 'error',
                error: errorMessage,
            });

            onError?.(errorMessage, file.name);
            return null;

        } finally {
            abortControllers.current.delete(file.name);

            // Check if no more uploads in progress
            const hasActiveUploads = Array.from(abortControllers.current.keys()).length > 0;
            if (!hasActiveUploads) {
                setIsUploading(false);
            }
        }
    }, [endpoint, validateFile, updateProgress, onSuccess, onError]);

    // Upload multiple files
    const uploadFiles = useCallback(async (files: File[]): Promise<(string | null)[]> => {
        const results = await Promise.all(files.map(file => uploadFile(file)));
        return results;
    }, [uploadFile]);

    // Cancel upload
    const cancelUpload = useCallback((fileName: string) => {
        const controller = abortControllers.current.get(fileName);
        if (controller) {
            controller.abort();
        }
    }, []);

    // Clear uploads list
    const clearUploads = useCallback(() => {
        // Cancel all active uploads
        abortControllers.current.forEach(controller => controller.abort());
        abortControllers.current.clear();

        setUploads([]);
        setIsUploading(false);
    }, []);

    return {
        uploads,
        isUploading,
        uploadFile,
        uploadFiles,
        cancelUpload,
        clearUploads,
        validateFile,
    };
}

export type { UploadProgress, UseFileUploadOptions, UseFileUploadReturn };
