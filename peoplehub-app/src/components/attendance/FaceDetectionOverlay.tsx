// @ai:ag - Created by Antigravity
// Face Detection Overlay component for attendance clock in
'use client';

import React from 'react';
import type { FaceBoundingBox, FaceValidationStatus } from '@/types/face-detection.types';

export interface FaceDetectionOverlayProps {
    /**
     * Whether a face is detected
     */
    faceDetected: boolean;

    /**
     * Face detection confidence (0-1)
     */
    faceConfidence: number;

    /**
     * Bounding box of detected face
     */
    faceBoundingBox: FaceBoundingBox | null;

    /**
     * Width of the video frame
     */
    frameWidth: number;

    /**
     * Height of the video frame
     */
    frameHeight: number;

    /**
     * Face occupancy percentage
     */
    faceOccupancy: number;

    /**
     * Validation status
     */
    validation: FaceValidationStatus;

    /**
     * Whether the model is loading
     */
    isLoading?: boolean;

    /**
     * Show debug info
     */
    showDebug?: boolean;
}

/**
 * Get color based on validation type
 */
function getValidationColor(type: FaceValidationStatus['type']): string {
    switch (type) {
        case 'success':
            return '#16A34A'; // Green
        case 'warning':
            return '#F59E0B'; // Yellow
        case 'error':
            return '#DC2626'; // Red
        case 'info':
        default:
            return '#0EA5E9'; // Blue
    }
}

/**
 * Get border color based on confidence
 */
function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#16A34A'; // Green - High confidence
    if (confidence >= 0.7) return '#F59E0B'; // Yellow - Medium confidence
    return '#DC2626'; // Red - Low confidence
}

/**
 * Face Detection Overlay Component
 * 
 * Displays visual feedback for face detection including:
 * - Bounding box around detected face
 * - Confidence score indicator
 * - Face position guide
 * - Validation messages
 */
export function FaceDetectionOverlay({
    faceDetected,
    faceConfidence,
    faceBoundingBox,
    frameWidth,
    frameHeight,
    faceOccupancy,
    validation,
    isLoading = false,
    showDebug = false,
}: FaceDetectionOverlayProps) {
    const validationColor = getValidationColor(validation.type);
    const confidenceColor = getConfidenceColor(faceConfidence);

    // Calculate scale for overlay (video might be scaled in container)
    const scaleX = 100 / frameWidth;
    const scaleY = 100 / frameHeight;

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Face guide circle (center reference) */}
            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white/30"
                style={{
                    width: '60%',
                    height: '75%',
                    maxWidth: '300px',
                    maxHeight: '400px',
                }}
            />

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-white text-sm font-medium">
                            Memuat deteksi wajah...
                        </span>
                    </div>
                </div>
            )}

            {/* Face bounding box */}
            {faceDetected && faceBoundingBox && !isLoading && (
                <div
                    className="absolute border-2 rounded-lg transition-all duration-100"
                    style={{
                        left: `${faceBoundingBox.x * scaleX}%`,
                        top: `${faceBoundingBox.y * scaleY}%`,
                        width: `${faceBoundingBox.width * scaleX}%`,
                        height: `${faceBoundingBox.height * scaleY}%`,
                        borderColor: confidenceColor,
                        boxShadow: `0 0 10px ${confidenceColor}40`,
                    }}
                >
                    {/* Corner indicators */}
                    <div
                        className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 rounded-tl"
                        style={{ borderColor: confidenceColor }}
                    />
                    <div
                        className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 rounded-tr"
                        style={{ borderColor: confidenceColor }}
                    />
                    <div
                        className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 rounded-bl"
                        style={{ borderColor: confidenceColor }}
                    />
                    <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 rounded-br"
                        style={{ borderColor: confidenceColor }}
                    />

                    {/* Confidence badge */}
                    <div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-semibold text-white"
                        style={{ backgroundColor: confidenceColor }}
                    >
                        {Math.round(faceConfidence * 100)}%
                    </div>
                </div>
            )}

            {/* Validation message */}
            <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-white text-sm font-medium text-center max-w-[90%]"
                style={{
                    backgroundColor: `${validationColor}E6`, // E6 = ~90% opacity
                }}
            >
                <div className="flex items-center gap-2 justify-center">
                    {/* Status icon */}
                    {validation.type === 'success' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {validation.type === 'warning' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    {validation.type === 'error' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {validation.type === 'info' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    <span>{validation.message}</span>
                </div>
            </div>

            {/* Debug info */}
            {showDebug && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded font-mono">
                    <div>Face: {faceDetected ? 'Yes' : 'No'}</div>
                    <div>Confidence: {(faceConfidence * 100).toFixed(1)}%</div>
                    <div>Occupancy: {(faceOccupancy * 100).toFixed(1)}%</div>
                    <div>Frame: {frameWidth}x{frameHeight}</div>
                    {faceBoundingBox && (
                        <>
                            <div>Box X: {faceBoundingBox.x.toFixed(0)}</div>
                            <div>Box Y: {faceBoundingBox.y.toFixed(0)}</div>
                            <div>Box W: {faceBoundingBox.width.toFixed(0)}</div>
                            <div>Box H: {faceBoundingBox.height.toFixed(0)}</div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default FaceDetectionOverlay;
