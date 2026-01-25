// @ai:ag - Created by Antigravity
// Geolocation hook for attendance and location tracking

'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

interface GeolocationPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    timestamp: number;
}

interface GeolocationError {
    code: number;
    message: string;
}

interface UseGeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    watch?: boolean;
}

interface UseGeolocationReturn {
    // Data
    position: GeolocationPosition | null;
    error: GeolocationError | null;

    // State
    isLoading: boolean;
    isSupported: boolean;
    isWatching: boolean;

    // Actions
    getCurrentPosition: () => Promise<GeolocationPosition | null>;
    startWatching: () => void;
    stopWatching: () => void;

    // Helpers
    getDistanceFrom: (lat: number, lng: number) => number | null;
}

// Haversine formula for distance calculation
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// Convert GeolocationPosition to our interface
function convertPosition(pos: globalThis.GeolocationPosition): GeolocationPosition {
    return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        altitudeAccuracy: pos.coords.altitudeAccuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
    };
}

// Convert error to our interface
function convertError(err: globalThis.GeolocationPositionError): GeolocationError {
    const messages: Record<number, string> = {
        1: 'Akses lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser.',
        2: 'Lokasi tidak tersedia. Pastikan GPS diaktifkan.',
        3: 'Waktu permintaan lokasi habis. Silakan coba lagi.',
    };

    return {
        code: err.code,
        message: messages[err.code] || 'Gagal mendapatkan lokasi',
    };
}

/**
 * Hook for geolocation (GPS) access
 */
export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
    const {
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 0,
        watch = false,
    } = options;

    const [position, setPosition] = useState<GeolocationPosition | null>(null);
    const [error, setError] = useState<GeolocationError | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isWatching, setIsWatching] = useState(false);

    const watchIdRef = useRef<number | null>(null);
    const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

    // Memoize geolocation options to avoid re-renders
    const geoOptions: PositionOptions = useMemo(() => ({
        enableHighAccuracy,
        timeout,
        maximumAge,
    }), [enableHighAccuracy, timeout, maximumAge]);

    // Get current position once
    const getCurrentPosition = useCallback(async (): Promise<GeolocationPosition | null> => {
        if (!isSupported) {
            setError({
                code: 0,
                message: 'Geolocation tidak didukung di browser ini',
            });
            return null;
        }

        setIsLoading(true);
        setError(null);

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const converted = convertPosition(pos);
                    setPosition(converted);
                    setIsLoading(false);
                    resolve(converted);
                },
                (err) => {
                    const converted = convertError(err);
                    setError(converted);
                    setIsLoading(false);
                    resolve(null);
                },
                geoOptions
            );
        });
    }, [isSupported, geoOptions]);

    // Start watching position
    const startWatching = useCallback(() => {
        if (!isSupported || watchIdRef.current !== null) {
            return;
        }

        setError(null);
        setIsWatching(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition(convertPosition(pos));
                setError(null);
            },
            (err) => {
                setError(convertError(err));
            },
            geoOptions
        );
    }, [isSupported, geoOptions]);

    // Stop watching position
    const stopWatching = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setIsWatching(false);
        }
    }, []);

    // Calculate distance from a point
    const getDistanceFrom = useCallback((lat: number, lng: number): number | null => {
        if (!position) return null;
        return calculateDistance(position.latitude, position.longitude, lat, lng);
    }, [position]);

    // Auto-start watching if option enabled
    useEffect(() => {
        // Skip if not watching mode or not supported
        if (!watch || !isSupported) {
            return;
        }

        // Skip if already watching
        if (watchIdRef.current !== null) {
            return;
        }

        // Flag to track first callback
        let isFirstCallback = true;

        // Start watching - setIsWatching is called in callback (not synchronously)
        const id = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition(convertPosition(pos));
                setError(null);
                // Set watching state only on first callback to avoid cascading renders
                if (isFirstCallback) {
                    isFirstCallback = false;
                    setIsWatching(true);
                }
            },
            (err) => {
                setError(convertError(err));
                // Also mark as watching on error (we are watching, just got an error)
                if (isFirstCallback) {
                    isFirstCallback = false;
                    setIsWatching(true);
                }
            },
            geoOptions
        );
        watchIdRef.current = id;

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
                setIsWatching(false);
            }
        };
    }, [watch, isSupported, geoOptions]);

    return {
        position,
        error,
        isLoading,
        isSupported,
        isWatching,
        getCurrentPosition,
        startWatching,
        stopWatching,
        getDistanceFrom,
    };
}

export type { GeolocationPosition, GeolocationError, UseGeolocationOptions, UseGeolocationReturn };
