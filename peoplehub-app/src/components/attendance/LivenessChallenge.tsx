// @ai:ag - Created by Antigravity
// Liveness Challenge component for blink detection
'use client';

import React, { useEffect } from 'react';
import type { LivenessState } from '@/types/face-detection.types';

export interface LivenessChallengeProps {
    /**
     * Current liveness state
     */
    state: LivenessState;

    /**
     * Time remaining in seconds
     */
    timeRemaining: number;

    /**
     * Total challenge time in seconds
     */
    totalTime?: number;

    /**
     * Whether currently checking
     */
    isChecking: boolean;

    /**
     * Status message to display
     */
    statusMessage: string;

    /**
     * Liveness score (0-1)
     */
    livenessScore: number;

    /**
     * Whether liveness was successful
     */
    isLive: boolean;

    /**
     * Callback to start challenge
     */
    onStart: () => void;

    /**
     * Callback to retry challenge
     */
    onRetry: () => void;

    /**
     * Callback when challenge completes successfully
     */
    onComplete?: () => void;

    /**
     * Show compact version
     */
    compact?: boolean;
}

/**
 * Get state color
 */
function getStateColor(state: LivenessState): string {
    switch (state) {
        case 'SUCCESS':
            return '#16A34A'; // Green
        case 'FAILED':
        case 'TIMEOUT':
            return '#DC2626'; // Red
        case 'BLINK_STARTED':
        case 'BLINK_COMPLETED':
            return '#F59E0B'; // Yellow
        case 'WAITING_FOR_BLINK':
            return '#0EA5E9'; // Blue
        default:
            return '#64748B'; // Gray
    }
}

/**
 * Eye animation component
 */
function EyeAnimation({ isBlinking, state }: { isBlinking: boolean; state: LivenessState }) {
    const eyeColor = getStateColor(state);

    return (
        <div className="flex items-center gap-6">
            {/* Left Eye */}
            <div
                className="relative w-16 h-12 rounded-full border-4 overflow-hidden transition-all duration-100"
                style={{
                    borderColor: eyeColor,
                    height: isBlinking ? '4px' : '48px',
                }}
            >
                {!isBlinking && (
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                        style={{ backgroundColor: eyeColor }}
                    />
                )}
            </div>

            {/* Right Eye */}
            <div
                className="relative w-16 h-12 rounded-full border-4 overflow-hidden transition-all duration-100"
                style={{
                    borderColor: eyeColor,
                    height: isBlinking ? '4px' : '48px',
                }}
            >
                {!isBlinking && (
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                        style={{ backgroundColor: eyeColor }}
                    />
                )}
            </div>
        </div>
    );
}

/**
 * Countdown timer circle
 */
function CountdownCircle({
    timeRemaining,
    totalTime,
    state,
}: {
    timeRemaining: number;
    totalTime: number;
    state: LivenessState;
}) {
    const progress = timeRemaining / totalTime;
    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDashoffset = circumference * (1 - progress);
    const color = getStateColor(state);

    return (
        <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="6"
                />
                {/* Progress circle */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-100"
                />
            </svg>
            {/* Time text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span
                    className="text-2xl font-bold"
                    style={{ color }}
                >
                    {Math.ceil(timeRemaining)}s
                </span>
            </div>
        </div>
    );
}

/**
 * Liveness Challenge Component
 * 
 * Guides user through the blink detection process with:
 * - Eye animation showing what to do
 * - Countdown timer
 * - Status messages
 * - Success/failure feedback
 */
export function LivenessChallenge({
    state,
    timeRemaining,
    totalTime = 5,
    isChecking,
    statusMessage,
    livenessScore,
    isLive,
    onStart,
    onRetry,
    onComplete,
    compact = false,
}: LivenessChallengeProps) {
    const stateColor = getStateColor(state);
    const isBlinking = state === 'BLINK_STARTED';

    // Call onComplete when successfully verified
    useEffect(() => {
        if (state === 'SUCCESS' && isLive && onComplete) {
            onComplete();
        }
    }, [state, isLive, onComplete]);

    if (compact) {
        return (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
                {isChecking ? (
                    <>
                        <CountdownCircle
                            timeRemaining={timeRemaining}
                            totalTime={totalTime}
                            state={state}
                        />
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">{statusMessage}</p>
                            <p className="text-sm text-gray-500">Kedipkan mata Anda</p>
                        </div>
                    </>
                ) : state === 'SUCCESS' ? (
                    <>
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-green-600">Terverifikasi!</p>
                            <p className="text-sm text-gray-500">Score: {Math.round(livenessScore * 100)}%</p>
                        </div>
                    </>
                ) : state === 'FAILED' || state === 'TIMEOUT' ? (
                    <>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-red-600">{statusMessage}</p>
                            <button
                                onClick={onRetry}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Coba lagi
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <button
                            onClick={onStart}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Mulai Verifikasi
                        </button>
                        <p className="text-sm text-gray-500">
                            Anda perlu kedipkan mata untuk verifikasi
                        </p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 p-6 rounded-xl bg-white shadow-lg">
            {/* Header */}
            <h3 className="text-lg font-semibold text-gray-900">
                Verifikasi Kehadiran
            </h3>

            {/* Eye Animation */}
            <EyeAnimation isBlinking={isBlinking} state={state} />

            {/* Timer (when checking) */}
            {isChecking && (
                <CountdownCircle
                    timeRemaining={timeRemaining}
                    totalTime={totalTime}
                    state={state}
                />
            )}

            {/* Success indicator */}
            {state === 'SUCCESS' && (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-medium text-green-600">Terverifikasi!</p>
                        <p className="text-sm text-gray-500">
                            Liveness Score: {Math.round(livenessScore * 100)}%
                        </p>
                    </div>
                </div>
            )}

            {/* Failure indicator */}
            {(state === 'FAILED' || state === 'TIMEOUT') && (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Status message */}
            <p
                className="text-center font-medium"
                style={{ color: stateColor }}
            >
                {statusMessage}
            </p>

            {/* Instructions */}
            {state === 'IDLE' && (
                <div className="text-center text-sm text-gray-500 space-y-1">
                    <p>Pastikan wajah Anda terlihat jelas di kamera</p>
                    <p>Anda akan diminta untuk <strong>kedipkan mata</strong></p>
                </div>
            )}

            {isChecking && state === 'WAITING_FOR_BLINK' && (
                <div className="text-center text-sm text-gray-500">
                    <p>Kedipkan mata Anda secara natural</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                {state === 'IDLE' && (
                    <button
                        onClick={onStart}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Mulai Verifikasi
                    </button>
                )}

                {(state === 'FAILED' || state === 'TIMEOUT') && (
                    <button
                        onClick={onRetry}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Coba Lagi
                    </button>
                )}
            </div>
        </div>
    );
}

export default LivenessChallenge;
