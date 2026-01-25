/**
 * Geofence Service
 * 
 * Handles geolocation validation for attendance clock-in.
 * Validates if employee is within allowed office radius.
 */

import {
    haversineDistance,
    isWithinGeofence,
    isValidCoordinates,
} from '@/lib/utils/haversine';
import { GeofenceViolationError } from '@/lib/errors';

export interface GeofenceValidationInput {
    /** Employee's current latitude */
    userLatitude: number;
    /** Employee's current longitude */
    userLongitude: number;
    /** Office center latitude */
    officeLatitude: number;
    /** Office center longitude */
    officeLongitude: number;
    /** Allowed radius in meters */
    radiusMeters: number;
    /** GPS accuracy in meters */
    gpsAccuracy?: number;
}

export interface GeofenceValidationResult {
    /** Whether user is inside geofence */
    inside: boolean;
    /** Distance from office in meters */
    distance: number;
    /** Geofence status */
    status: 'INSIDE' | 'OUTSIDE' | 'WARNING';
    /** Warning message if applicable */
    warningMessage?: string;
}

export class GeofenceService {
    /**
     * Validate if user location is within allowed geofence
     * 
     * Business Rules:
     * - If inside radius: PASS
     * - If outside radius: WARNING (not blocking)
     * - If GPS accuracy > 100m: WARNING
     * - Invalid coordinates: throw error
     * 
     * @param input - Geofence validation parameters
     * @returns Validation result
     * @throws {ValidationError} If coordinates are invalid
     */
    static validateGeofence(
        input: GeofenceValidationInput
    ): GeofenceValidationResult {
        const {
            userLatitude,
            userLongitude,
            officeLatitude,
            officeLongitude,
            radiusMeters,
            gpsAccuracy,
        } = input;

        // Validate coordinates
        if (!isValidCoordinates(userLatitude, userLongitude)) {
            throw new Error('Koordinat GPS tidak valid');
        }

        if (!isValidCoordinates(officeLatitude, officeLongitude)) {
            throw new Error('Koordinat kantor tidak valid');
        }

        // Calculate distance
        const { inside, distance } = isWithinGeofence(
            { latitude: officeLatitude, longitude: officeLongitude },
            { latitude: userLatitude, longitude: userLongitude },
            radiusMeters
        );

        // Check GPS accuracy
        const hasLowAccuracy = gpsAccuracy && gpsAccuracy > 100;

        // Determine status and message
        let status: GeofenceValidationResult['status'];
        let warningMessage: string | undefined;

        if (inside) {
            status = 'INSIDE';
        } else {
            status = 'WARNING';
            warningMessage = `Lokasi Anda di luar area kantor (${distance}m dari kantor). Clock in tetap diizinkan.`;
        }

        if (hasLowAccuracy) {
            const accuracyWarning = `Akurasi GPS rendah (±${gpsAccuracy}m).`;
            warningMessage = warningMessage
                ? `${warningMessage} ${accuracyWarning}`
                : accuracyWarning;
        }

        return {
            inside,
            distance,
            status,
            warningMessage,
        };
    }

    /**
     * Calculate distance between two points
     * 
     * @param lat1 - Latitude of point 1
     * @param lon1 - Longitude of point 1
     * @param lat2 - Latitude of point 2
     * @param lon2 - Longitude of point 2
     * @returns Distance in meters
     */
    static calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        return haversineDistance(
            { latitude: lat1, longitude: lon1 },
            { latitude: lat2, longitude: lon2 }
        );
    }

    /**
     * Check if GPS coordinates are provided
     * Required for WFO work mode
     */
    static hasGPSCoordinates(
        latitude?: number | null,
        longitude?: number | null
    ): boolean {
        return (
            latitude !== undefined &&
            latitude !== null &&
            longitude !== undefined &&
            longitude !== null
        );
    }
}
