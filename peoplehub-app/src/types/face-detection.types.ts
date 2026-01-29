// @ai:ag - Created by Antigravity
// Face detection and liveness types for attendance clock in

/**
 * Bounding box for detected face
 */
export interface FaceBoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Face detection result from TensorFlow.js
 */
export interface FaceDetectionResult {
    faceDetected: boolean;
    faceCount: number;
    faceConfidence: number; // 0.0 - 1.0
    faceBoundingBox: FaceBoundingBox | null;
    faceOccupancy: number; // Percentage of frame occupied by face
    isLoading: boolean;
    error: string | null;
}

/**
 * Face detection validation status
 */
export interface FaceValidationStatus {
    isValid: boolean;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
}

/**
 * Eye Aspect Ratio (EAR) data for blink detection
 */
export interface EyeAspectRatio {
    left: number;
    right: number;
    average: number;
}

/**
 * Liveness detection state machine states
 */
export type LivenessState =
    | 'IDLE'
    | 'WAITING_FOR_BLINK'
    | 'BLINK_STARTED'
    | 'BLINK_COMPLETED'
    | 'SUCCESS'
    | 'FAILED'
    | 'TIMEOUT';

/**
 * Liveness detection result
 */
export interface LivenessResult {
    isLive: boolean;
    livenessScore: number; // 0.0 - 1.0
    blinkDetected: boolean;
    blinkCount: number;
    blinkDuration: number; // milliseconds
    earVariance: number;
    state: LivenessState;
    error: string | null;
}

/**
 * Liveness challenge configuration
 */
export interface LivenessConfig {
    // Eye Aspect Ratio threshold for blink detection
    earBlinkThreshold: number; // Default: 0.21

    // Blink duration constraints
    minBlinkDurationMs: number; // Default: 100
    maxBlinkDurationMs: number; // Default: 400

    // Challenge settings
    challengeTimeoutMs: number; // Default: 5000
    requiredBlinks: number; // Default: 1

    // Scoring thresholds
    minLivenessScore: number; // Default: 0.80
}

/**
 * Default liveness configuration
 */
export const DEFAULT_LIVENESS_CONFIG: LivenessConfig = {
    earBlinkThreshold: 0.21,
    minBlinkDurationMs: 100,
    maxBlinkDurationMs: 400,
    challengeTimeoutMs: 5000,
    requiredBlinks: 1,
    minLivenessScore: 0.80,
};

/**
 * Face detection configuration
 */
export interface FaceDetectionConfig {
    // Minimum confidence for face detection
    minDetectionConfidence: number; // Default: 0.70

    // Face occupancy constraints
    minFaceOccupancy: number; // Default: 0.20 (20%)
    maxFaceOccupancy: number; // Default: 0.80 (80%)

    // Model selection (0 = short-range, 1 = full-range)
    modelSelection: 0 | 1; // Default: 1
}

/**
 * Default face detection configuration
 */
export const DEFAULT_FACE_DETECTION_CONFIG: FaceDetectionConfig = {
    minDetectionConfidence: 0.70,
    minFaceOccupancy: 0.20,
    maxFaceOccupancy: 0.80,
    modelSelection: 1,
};

/**
 * Photo capture result with all validations
 */
export interface PhotoCaptureResult {
    // Image data
    imageBlob: Blob;
    imageDataUrl: string;

    // Original dimensions
    width: number;
    height: number;

    // Compressed size
    sizeBytes: number;

    // Face detection data
    faceDetected: boolean;
    faceConfidence: number;

    // Liveness data
    livenessScore: number;

    // Geolocation (if available)
    latitude?: number;
    longitude?: number;
    gpsAccuracy?: number;

    // Metadata
    timestamp: string;
    deviceInfo: string;
}

/**
 * Combined validation for clock in submission
 */
export interface ClockInValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];

    // Individual checks
    faceValid: boolean;
    livenessValid: boolean;
    photoValid: boolean;
    geofenceValid: boolean;

    // Data ready for submission
    data?: {
        photo: Blob;
        workMode: 'WFO' | 'WFH';
        latitude?: number;
        longitude?: number;
        gpsAccuracy?: number;
        faceDetected: boolean;
        faceConfidence: number;
        livenessScore: number;
        deviceInfo: string;
    };
}
