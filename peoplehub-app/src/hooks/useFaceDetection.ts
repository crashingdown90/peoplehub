// @ai:ag - Created by Antigravity
// Custom hook for face detection using TensorFlow.js
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type {
    FaceDetectionResult,
    FaceDetectionConfig,
    FaceBoundingBox,
    FaceValidationStatus,
} from '@/types/face-detection.types';
import { DEFAULT_FACE_DETECTION_CONFIG } from '@/types/face-detection.types';

// Lazy load TensorFlow.js and face detection model
let faceDetectionModel: unknown = null;
let isModelLoading = false;
let modelLoadPromise: Promise<unknown> | null = null;

/**
 * Load face detection model lazily
 */
async function loadFaceDetectionModel(): Promise<unknown> {
    if (faceDetectionModel) {
        return faceDetectionModel;
    }

    if (modelLoadPromise) {
        return modelLoadPromise;
    }

    isModelLoading = true;

    modelLoadPromise = (async () => {
        try {
            // Dynamically import TensorFlow.js and face detection
            const [tf, faceDetection] = await Promise.all([
                import('@tensorflow/tfjs'),
                import('@tensorflow-models/face-detection'),
            ]);

            // Ensure TensorFlow backend is ready
            await tf.ready();

            // Create the face detection model
            const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
            const detector = await faceDetection.createDetector(model, {
                runtime: 'tfjs',
                modelType: 'full',
            });

            faceDetectionModel = detector;
            isModelLoading = false;
            return detector;
        } catch (error) {
            isModelLoading = false;
            modelLoadPromise = null;
            throw error;
        }
    })();

    return modelLoadPromise;
}

/**
 * Calculate face occupancy (percentage of frame occupied by face)
 */
function calculateFaceOccupancy(
    faceBbox: FaceBoundingBox,
    frameWidth: number,
    frameHeight: number
): number {
    const faceArea = faceBbox.width * faceBbox.height;
    const frameArea = frameWidth * frameHeight;
    return faceArea / frameArea;
}

/**
 * Validate face detection result against config
 */
function validateFace(
    result: FaceDetectionResult,
    config: FaceDetectionConfig
): FaceValidationStatus {
    if (result.error) {
        return {
            isValid: false,
            message: result.error,
            type: 'error',
        };
    }

    if (result.isLoading) {
        return {
            isValid: false,
            message: 'Memuat model deteksi wajah...',
            type: 'info',
        };
    }

    if (!result.faceDetected) {
        return {
            isValid: false,
            message: 'Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.',
            type: 'error',
        };
    }

    if (result.faceCount > 1) {
        return {
            isValid: false,
            message: 'Terdeteksi lebih dari satu wajah. Pastikan hanya Anda yang ada di frame.',
            type: 'error',
        };
    }

    if (result.faceConfidence < config.minDetectionConfidence) {
        return {
            isValid: false,
            message: `Confidence rendah (${Math.round(result.faceConfidence * 100)}%). Pastikan pencahayaan cukup.`,
            type: 'warning',
        };
    }

    if (result.faceOccupancy < config.minFaceOccupancy) {
        return {
            isValid: false,
            message: 'Wajah terlalu jauh. Dekatkan wajah ke kamera.',
            type: 'warning',
        };
    }

    if (result.faceOccupancy > config.maxFaceOccupancy) {
        return {
            isValid: false,
            message: 'Wajah terlalu dekat. Jauhkan sedikit dari kamera.',
            type: 'warning',
        };
    }

    return {
        isValid: true,
        message: `Wajah terdeteksi (${Math.round(result.faceConfidence * 100)}%)`,
        type: 'success',
    };
}

export interface UseFaceDetectionOptions {
    /**
     * Configuration for face detection
     */
    config?: Partial<FaceDetectionConfig>;

    /**
     * Whether to start detection immediately
     */
    autoStart?: boolean;

    /**
     * Detection interval in milliseconds
     */
    detectionInterval?: number;

    /**
     * Callback when face is detected
     */
    onFaceDetected?: (result: FaceDetectionResult) => void;

    /**
     * Callback when face is lost
     */
    onFaceLost?: () => void;
}

export interface UseFaceDetectionReturn extends FaceDetectionResult {
    /**
     * Start face detection
     */
    start: () => Promise<void>;

    /**
     * Stop face detection
     */
    stop: () => void;

    /**
     * Check if detection is running
     */
    isRunning: boolean;

    /**
     * Validation status
     */
    validation: FaceValidationStatus;

    /**
     * Model loading progress
     */
    modelLoaded: boolean;
}

/**
 * Custom hook for face detection using TensorFlow.js
 * 
 * @example
 * ```tsx
 * const videoRef = useRef<HTMLVideoElement>(null);
 * const { faceDetected, faceConfidence, validation, start, stop } = useFaceDetection(videoRef);
 * 
 * useEffect(() => {
 *   start();
 *   return () => stop();
 * }, []);
 * ```
 */
export function useFaceDetection(
    videoRef: RefObject<HTMLVideoElement>,
    options: UseFaceDetectionOptions = {}
): UseFaceDetectionReturn {
    const {
        config: customConfig,
        autoStart = false,
        detectionInterval = 100, // 10 FPS for detection
        onFaceDetected,
        onFaceLost,
    } = options;

    const config: FaceDetectionConfig = {
        ...DEFAULT_FACE_DETECTION_CONFIG,
        ...customConfig,
    };

    const [result, setResult] = useState<FaceDetectionResult>({
        faceDetected: false,
        faceCount: 0,
        faceConfidence: 0,
        faceBoundingBox: null,
        faceOccupancy: 0,
        isLoading: false,
        error: null,
    });

    const [isRunning, setIsRunning] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);

    const detectorRef = useRef<unknown>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const wasDetectedRef = useRef(false);

    /**
     * Perform a single face detection
     */
    const detectFace = useCallback(async () => {
        const video = videoRef.current;
        const detector = detectorRef.current;

        if (!video || !detector || video.readyState !== 4) {
            return;
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const faces = await (detector as any).estimateFaces(video);

            if (faces.length === 0) {
                const newResult: FaceDetectionResult = {
                    faceDetected: false,
                    faceCount: 0,
                    faceConfidence: 0,
                    faceBoundingBox: null,
                    faceOccupancy: 0,
                    isLoading: false,
                    error: null,
                };

                setResult(newResult);

                if (wasDetectedRef.current) {
                    wasDetectedRef.current = false;
                    onFaceLost?.();
                }

                return;
            }

            // Get the first face (most prominent)
            const face = faces[0];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const box = (face as any).box;

            const faceBoundingBox: FaceBoundingBox = {
                x: box.xMin,
                y: box.yMin,
                width: box.width,
                height: box.height,
            };

            const faceOccupancy = calculateFaceOccupancy(
                faceBoundingBox,
                video.videoWidth,
                video.videoHeight
            );

            const newResult: FaceDetectionResult = {
                faceDetected: true,
                faceCount: faces.length,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                faceConfidence: (face as any).score || 0.9,
                faceBoundingBox,
                faceOccupancy,
                isLoading: false,
                error: null,
            };

            setResult(newResult);

            if (!wasDetectedRef.current) {
                wasDetectedRef.current = true;
            }

            onFaceDetected?.(newResult);
        } catch (error) {
            console.error('Face detection error:', error);
            setResult((prev) => ({
                ...prev,
                error: 'Gagal mendeteksi wajah. Coba refresh halaman.',
            }));
        }
    }, [videoRef, onFaceDetected, onFaceLost]);

    /**
     * Start face detection
     */
    const start = useCallback(async () => {
        if (isRunning) return;

        setResult((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            // Load the model
            const detector = await loadFaceDetectionModel();
            detectorRef.current = detector;
            setModelLoaded(true);

            setResult((prev) => ({ ...prev, isLoading: false }));
            setIsRunning(true);

            // Start detection interval
            intervalRef.current = setInterval(detectFace, detectionInterval);
        } catch (error) {
            console.error('Failed to load face detection model:', error);
            setResult((prev) => ({
                ...prev,
                isLoading: false,
                error: 'Gagal memuat model deteksi wajah. Periksa koneksi internet.',
            }));
        }
    }, [isRunning, detectFace, detectionInterval]);

    /**
     * Stop face detection
     */
    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsRunning(false);
    }, []);

    // Auto start if enabled
    useEffect(() => {
        if (autoStart) {
            start();
        }

        return () => {
            stop();
        };
    }, [autoStart, start, stop]);

    // Calculate validation status
    const validation = validateFace(result, config);

    return {
        ...result,
        start,
        stop,
        isRunning,
        validation,
        modelLoaded,
    };
}

export default useFaceDetection;
