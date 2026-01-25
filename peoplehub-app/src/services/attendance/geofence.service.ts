// @ai:cl - Geofence Service for Location Validation

import { prisma } from "@/lib/db";
import { ServiceResponse, success, error, ErrorCodes } from "../types";

// ==========================================
// TYPES
// ==========================================

export interface GeofenceCheckResult {
  isWithin: boolean;
  distance: number;
  maxRadius: number;
  branchName: string;
  branchLocation: {
    latitude: number;
    longitude: number;
  };
  userLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// ==========================================
// GEOFENCE SERVICE
// ==========================================

export class GeofenceService {
  /**
   * Check if user location is within branch geofence
   */
  static async checkGeofence(
    employeeId: string,
    userLocation: Coordinates
  ): Promise<ServiceResponse<GeofenceCheckResult>> {
    try {
      // Get employee with branch
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { branch: true },
      });

      if (!employee) {
        return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
      }

      if (!employee.branch) {
        return error(ErrorCodes.VALIDATION_ERROR, "Karyawan tidak memiliki cabang yang ditentukan");
      }

      const branch = employee.branch;

      if (!branch.latitude || !branch.longitude) {
        // Branch has no location set, allow check in
        return success({
          isWithin: true,
          distance: 0,
          maxRadius: branch.geofenceRadiusMeters || 500,
          branchName: branch.name,
          branchLocation: { latitude: 0, longitude: 0 },
          userLocation,
        });
      }

      const branchLat = Number(branch.latitude);
      const branchLng = Number(branch.longitude);
      const maxRadius = branch.geofenceRadiusMeters || 500;

      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        branchLat,
        branchLng
      );

      const isWithin = distance <= maxRadius;

      return success({
        isWithin,
        distance: Math.round(distance),
        maxRadius,
        branchName: branch.name,
        branchLocation: {
          latitude: branchLat,
          longitude: branchLng,
        },
        userLocation,
      });
    } catch (err) {
      console.error("Geofence check error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal memeriksa lokasi");
    }
  }

  /**
   * Check if coordinates are within radius of a point
   */
  static isWithinRadius(
    userLat: number,
    userLng: number,
    targetLat: number,
    targetLng: number,
    radiusMeters: number
  ): boolean {
    const distance = this.calculateDistance(userLat, userLng, targetLat, targetLng);
    return distance <= radiusMeters;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private static toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Get nearest branch for a location
   */
  static async getNearestBranch(
    tenantId: string,
    userLocation: Coordinates
  ): Promise<ServiceResponse<{ branchId: string; branchName: string; distance: number } | null>> {
    try {
      const branches = await prisma.branch.findMany({
        where: {
          tenantId,
          isActive: true,
          latitude: { not: null },
          longitude: { not: null },
        },
      });

      if (branches.length === 0) {
        return success(null);
      }

      let nearest: { branchId: string; branchName: string; distance: number } | null = null;

      for (const branch of branches) {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          Number(branch.latitude),
          Number(branch.longitude)
        );

        if (!nearest || distance < nearest.distance) {
          nearest = {
            branchId: branch.id,
            branchName: branch.name,
            distance: Math.round(distance),
          };
        }
      }

      return success(nearest);
    } catch (err) {
      console.error("Get nearest branch error:", err);
      return error(ErrorCodes.INTERNAL_ERROR, "Gagal mencari cabang terdekat");
    }
  }
}

export const geofenceService = new GeofenceService();
