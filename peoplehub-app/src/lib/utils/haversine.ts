/**
 * Haversine Distance Calculator
 * 
 * Calculates the great-circle distance between two points on Earth
 * given their latitude and longitude coordinates.
 * 
 * Used for geofence validation in attendance clock-in.
 */

interface Coordinates {
    latitude: number;
    longitude: number;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * 
 * @param point1 - First coordinate point
 * @param point2 - Second coordinate point
 * @returns Distance in meters
 * 
 * @example
 * const officeLocation = { latitude: -6.2088, longitude: 106.8456 };
 * const userLocation = { latitude: -6.2095, longitude: 106.8460 };
 * const distance = haversineDistance(officeLocation, userLocation);
 * // distance ≈ 85 meters
 */
export function haversineDistance(
    point1: Coordinates,
    point2: Coordinates
): number {
    const R = 6371000; // Earth's radius in meters

    // Convert degrees to radians
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    // Haversine formula
    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance in meters
    const distance = R * c;

    return Math.round(distance); // Round to nearest meter
}

/**
 * Check if a point is within a circular geofence
 * 
 * @param center - Center point of the geofence
 * @param point - Point to check
 * @param radiusMeters - Radius of geofence in meters
 * @returns Object with inside status and distance
 * 
 * @example
 * const result = isWithinGeofence(
 *   { latitude: -6.2088, longitude: 106.8456 },
 *   { latitude: -6.2095, longitude: 106.8460 },
 *   100
 * );
 * // { inside: true, distance: 85 }
 */
export function isWithinGeofence(
    center: Coordinates,
    point: Coordinates,
    radiusMeters: number
): { inside: boolean; distance: number } {
    const distance = haversineDistance(center, point);
    const inside = distance <= radiusMeters;

    return { inside, distance };
}

/**
 * Validate GPS coordinates
 * 
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @returns true if valid coordinates
 */
export function isValidCoordinates(
    latitude: number,
    longitude: number
): boolean {
    return (
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180 &&
        !isNaN(latitude) &&
        !isNaN(longitude)
    );
}
