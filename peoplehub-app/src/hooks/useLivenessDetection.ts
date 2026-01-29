// @ai:ag - Created by Antigravity
// Custom hook for liveness detection (blink detection) using MediaPipe Face Mesh
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type {
    LivenessResult,
    LivenessConfig,
    LivenessState,
    EyeAspectRatio,
} from '@/types/face-detection.types';
import { DEFAULT_LIVENESS_CONFIG } from '@/types/face-detection.types';

// Lazy load face landmarks detection model
let faceLandmarksModel: unknown = null;
let isModelLoading = false;
let modelLoadPromise: Promise<unknown> | null = null;

/**
 * Load face landmarks detection model lazily
 */
async function loadFaceLandmarksModel(): Promise<unknown> {
    if (faceLandmarksModel) {
        return faceLandmarksModel;
    }

    if (modelLoadPromise) {
        return modelLoadPromise;
    }

    isModelLoading = true;

    modelLoadPromise = (async () => {
        try {
            // Dynamically import TensorFlow.js and face landmarks detection
            const [tf, faceLandmarksDetection] = await Promise.all([
                import('@tensorflow/tfjs'),
                import('@tensorflow-models/face-landmarks-detection'),
            ]);

            // Ensure TensorFlow backend is ready
            await tf.ready();

            // Create the face landmarks detection model
            const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
            const detector = await faceLandmarksDetection.createDetector(model, {
                runtime: 'tfjs',
                refineLandmarks: true,
                maxFaces: 1,
            });

            faceLandmarksModel = detector;
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
 * Eye landmark indices for MediaPipe Face Mesh
 * These are the specific points around each eye
 */
const EYE_LANDMARKS = {
    // Left eye landmarks (from viewer's perspective)
    left: {
        p1: 33,   // Left corner
        p2: 160,  // Top-left
        p3: 158,  // Top-right
        p4: 133,  // Right corner
        p5: 153,  // Bottom-right
        p6: 144,  // Bottom-left
    },
    // Right eye landmarks
    right: {
        p1: 362,  // Left corner
        p2: 385,  // Top-left  
        p3: 387,  // Top-right
        p4: 263,  // Right corner
        p5: 373,  // Bottom-right
        p6: 380,  // Bottom-left
    },
};

/**
 * Calculate Euclidean distance between two points
 */
function distance(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate Eye Aspect Ratio (EAR)
 * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
 * 
 * When eyes are open, EAR is typically 0.25-0.35
 * When eyes are closed (blinking), EAR drops below 0.21
 */
function calculateEAR(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keypoints: any[],
    eyeIndices: typeof EYE_LANDMARKS.left
): number {
    const p1 = keypoints[eyeIndices.p1];
    const p2 = keypoints[eyeIndices.p2];
    const p3 = keypoints[eyeIndices.p3];
    const p4 = keypoints[eyeIndices.p4];
    const p5 = keypoints[eyeIndices.p5];
    const p6 = keypoints[eyeIndices.p6];

    // Vertical distances
    const verticalDist1 = distance(p2, p6);
    const verticalDist2 = distance(p3, p5);

    // Horizontal distance
    const horizontalDist = distance(p1, p4);

    // Prevent division by zero
    if (horizontalDist === 0) return 0.3;

    // EAR formula
    return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
}

/**
 * Calculate variance of an array
 */
function calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
    return squareDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate liveness score based on blink detection results
 */
function calculateLivenessScore(
    blinkDetected: boolean,
    blinkDuration: number,
    earVariance: number,
    config: LivenessConfig
): number {
    let score = 0.0;

    // Blink detected: +50%
    if (blinkDetected) {
        score += 0.50;
    }

    // Natural blink duration (150-250ms): +20%
    // Acceptable blink duration (100-400ms): +10%
    if (blinkDuration >= 150 && blinkDuration <= 250) {
        score += 0.20;
    } else if (blinkDuration >= config.minBlinkDurationMs && blinkDuration <= config.maxBlinkDurationMs) {
        score += 0.10;
    }

    // EAR variance (indicates natural movement): +15%
    // Good variance range: 0.02 - 0.08
    if (earVariance >= 0.02 && earVariance <= 0.08) {
        score += 0.15;
    } else if (earVariance > 0.01) {
        score += 0.08;
    }

    // Base score for having face detected: +15%
    score += 0.15;

    return Math.min(score, 1.0);
}

export interface UseLivenessDetectionOptions {
    /**
     * Configuration for liveness detection
     */
    config?: Partial<LivenessConfig>;

    /**
     * Callback when liveness check succeeds
     */
    onSuccess?: (result: LivenessResult) => void;

    /**
     * Callback when liveness check fails
     */
    onFailure?: (reason: string) => void;

    /**
     * Callback when challenge times out
     */
    onTimeout?: () => void;
}

export interface UseLivenessDetectionReturn extends LivenessResult {
    /**
     * Start liveness challenge
     */
    startChallenge: () => Promise<void>;

    /**
     * Stop/reset liveness challenge
     */
    stopChallenge: () => void;

    /**
     * Retry the challenge
     */
    retry: () => void;

    /**
     * Time remaining in challenge (seconds)
     */
    timeRemaining: number;

    /**
     * Whether liveness is currently checking
     */
    isChecking: boolean;

    /**
     * Model loading status
     */
    modelLoaded: boolean;

    /**
     * Get status message for UI
     */
    statusMessage: string;
}

/**
 * Custom hook for liveness detection using blink detection
 * 
 * @example
 * ```tsx
 * const videoRef = useRef<HTMLVideoElement>(null);
 * const { 
 *   isLive, 
 *   livenessScore, 
 *   timeRemaining, 
 *   statusMessage,
 *   startChallenge, 
 *   retry 
 * } = useLivenessDetection(videoRef, {
 *   onSuccess: (result) => console.log('Liveness verified!', result),
 *   onFailure: (reason) => console.log('Failed:', reason),
 * });
 * ```
 */
export function useLivenessDetection(
    videoRef: RefObject<HTMLVideoElement>,
    options: UseLivenessDetectionOptions = {}
): UseLivenessDetectionReturn {
    const {
        config: customConfig,
        onSuccess,
        onFailure,
        onTimeout,
    } = options;

    const config: LivenessConfig = {
        ...DEFAULT_LIVENESS_CONFIG,
        ...customConfig,
    };

    const [result, setResult] = useState<LivenessResult>({
        isLive: false,
        livenessScore: 0,
        blinkDetected: false,
        blinkCount: 0,
        blinkDuration: 0,
        earVariance: 0,
        state: 'IDLE',
        error: null,
    });

    const [isChecking, setIsChecking] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(config.challengeTimeoutMs / 1000);

    const detectorRef = useRef<unknown>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const earHistoryRef = useRef<number[]>([]);
    const blinkStartTimeRef = useRef<number | null>(null);
    const stateRef = useRef<LivenessState>('IDLE');

    /**
     * Get human-readable status message
     */
    const getStatusMessage = useCallback((state: LivenessState): string => {
        switch (state) {
            case 'IDLE':
                return 'Tekan mulai untuk verifikasi';
            case 'WAITING_FOR_BLINK':
                return 'Silakan kedipkan mata Anda...';
            case 'BLINK_STARTED':
                return 'Kedipan terdeteksi...';
            case 'BLINK_COMPLETED':
                return 'Memverifikasi...';
            case 'SUCCESS':
                return 'Verifikasi berhasil!';
            case 'FAILED':
                return 'Verifikasi gagal. Coba lagi.';
            case 'TIMEOUT':
                return 'Waktu habis. Coba lagi.';
            default:
                return '';
        }
    }, []);

    /**
     * Detect blink from EAR values
     */
    const detectBlink = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (keypoints: any[]) => {
            // Calculate EAR for both eyes
            const leftEAR = calculateEAR(keypoints, EYE_LANDMARKS.left);
            const rightEAR = calculateEAR(keypoints, EYE_LANDMARKS.right);
            const avgEAR = (leftEAR + rightEAR) / 2;

            // Store EAR history for variance calculation
            earHistoryRef.current.push(avgEAR);
            if (earHistoryRef.current.length > 30) {
                earHistoryRef.current.shift();
            }

            const currentState = stateRef.current;
            const currentTime = Date.now();

            // State machine for blink detection
            if (currentState === 'WAITING_FOR_BLINK') {
                // Check if eyes are closing (EAR below threshold)
                if (avgEAR < config.earBlinkThreshold) {
                    blinkStartTimeRef.current = currentTime;
                    stateRef.current = 'BLINK_STARTED';
                    setResult((prev) => ({ ...prev, state: 'BLINK_STARTED' }));
                }
            } else if (currentState === 'BLINK_STARTED') {
                // Check if eyes have reopened (EAR above threshold)
                if (avgEAR >= config.earBlinkThreshold && blinkStartTimeRef.current) {
                    const blinkDuration = currentTime - blinkStartTimeRef.current;

                    // Validate blink duration
                    if (
                        blinkDuration >= config.minBlinkDurationMs &&
                        blinkDuration <= config.maxBlinkDurationMs
                    ) {
                        // Valid blink detected!
                        const earVariance = calculateVariance(earHistoryRef.current);
                        const livenessScore = calculateLivenessScore(
                            true,
                            blinkDuration,
                            earVariance,
                            config
                        );

                        stateRef.current = 'SUCCESS';

                        const successResult: LivenessResult = {
                            isLive: livenessScore >= config.minLivenessScore,
                            livenessScore,
                            blinkDetected: true,
                            blinkCount: 1,
                            blinkDuration,
                            earVariance,
                            state: 'SUCCESS',
                            error: null,
                        };

                        setResult(successResult);
                        setIsChecking(false);

                        // Stop intervals
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                            timerRef.current = null;
                        }

                        if (successResult.isLive) {
                            onSuccess?.(successResult);
                        } else {
                            onFailure?.('Skor liveness terlalu rendah. Coba lagi.');
                        }
                    } else if (blinkDuration > config.maxBlinkDurationMs) {
                        // Eyes closed too long - not a blink
                        stateRef.current = 'WAITING_FOR_BLINK';
                        setResult((prev) => ({ ...prev, state: 'WAITING_FOR_BLINK' }));
                    }

                    blinkStartTimeRef.current = null;
                }
            }
        },
        [config, onSuccess, onFailure]
    );

    /**
     * Perform liveness detection on video frame
     */
    const performDetection = useCallback(async () => {
        const video = videoRef.current;
        const detector = detectorRef.current;

        if (!video || !detector || video.readyState !== 4) {
            return;
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const faces = await (detector as any).estimateFaces(video);

            if (faces.length > 0) {
                const face = faces[0];
                await detectBlink(face.keypoints);
            }
        } catch (error) {
            console.error('Liveness detection error:', error);
        }
    }, [videoRef, detectBlink]);

    /**
     * Start the liveness challenge
     */
    const startChallenge = useCallback(async () => {
        if (isChecking) return;

        // Reset state
        stateRef.current = 'WAITING_FOR_BLINK';
        earHistoryRef.current = [];
        blinkStartTimeRef.current = null;
        setTimeRemaining(config.challengeTimeoutMs / 1000);

        setResult({
            isLive: false,
            livenessScore: 0,
            blinkDetected: false,
            blinkCount: 0,
            blinkDuration: 0,
            earVariance: 0,
            state: 'WAITING_FOR_BLINK',
            error: null,
        });

        try {
            // Load model if not loaded
            if (!detectorRef.current) {
                const detector = await loadFaceLandmarksModel();
                detectorRef.current = detector;
                setModelLoaded(true);
            }

            setIsChecking(true);

            // Start detection interval (30 FPS)
            intervalRef.current = setInterval(performDetection, 33);

            // Start countdown timer
            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, (config.challengeTimeoutMs - elapsed) / 1000);
                setTimeRemaining(remaining);

                if (remaining <= 0) {
                    // Timeout
                    stateRef.current = 'TIMEOUT';
                    setResult((prev) => ({ ...prev, state: 'TIMEOUT' }));
                    setIsChecking(false);

                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }

                    onTimeout?.();
                    onFailure?.('Waktu habis. Kedipan tidak terdeteksi.');
                }
            }, 100);
        } catch (error) {
            console.error('Failed to start liveness detection:', error);
            setResult((prev) => ({
                ...prev,
                state: 'FAILED',
                error: 'Gagal memuat model. Periksa koneksi internet.',
            }));
            onFailure?.('Gagal memuat model deteksi.');
        }
    }, [isChecking, config, performDetection, onTimeout, onFailure]);

    /**
     * Stop/reset the challenge
     */
    const stopChallenge = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        stateRef.current = 'IDLE';
        setIsChecking(false);
        setResult({
            isLive: false,
            livenessScore: 0,
            blinkDetected: false,
            blinkCount: 0,
            blinkDuration: 0,
            earVariance: 0,
            state: 'IDLE',
            error: null,
        });
    }, []);

    /**
     * Retry the challenge
     */
    const retry = useCallback(() => {
        stopChallenge();
        // Small delay before restarting
        setTimeout(() => {
            startChallenge();
        }, 500);
    }, [stopChallenge, startChallenge]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    return {
        ...result,
        startChallenge,
        stopChallenge,
        retry,
        timeRemaining,
        isChecking,
        modelLoaded,
        statusMessage: getStatusMessage(result.state),
    };
}

export default useLivenessDetection;
