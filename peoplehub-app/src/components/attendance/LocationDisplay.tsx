// @ai:ag - Location Display component showing GPS coordinates and validation

"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
}

interface LocationDisplayProps {
    onLocationChange?: (location: LocationData | null) => void;
    requiredForWFO?: boolean;
    officeLocation?: {
        latitude: number;
        longitude: number;
        radius: number; // in meters
    };
}

export function LocationDisplay({
    onLocationChange,
    requiredForWFO = false,
    officeLocation,
}: LocationDisplayProps) {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);

    useEffect(() => {
        getCurrentLocation();
    }, []);

    useEffect(() => {
        if (location && officeLocation) {
            const distance = calculateDistance(
                location.latitude,
                location.longitude,
                officeLocation.latitude,
                officeLocation.longitude
            );
            const withinRadius = distance <= officeLocation.radius;
            setIsWithinRadius(withinRadius);
        }
    }, [location, officeLocation]);

    useEffect(() => {
        onLocationChange?.(location);
    }, [location, onLocationChange]);

    const getCurrentLocation = () => {
        if (!("geolocation" in navigator)) {
            setError("Geolocation tidak didukung oleh browser Anda");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const locationData: LocationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                };
                setLocation(locationData);
                setError(null);
                setLoading(false);
            },
            (err) => {
                console.error("Geolocation error:", err);
                let errorMessage = "Tidak dapat mendapatkan lokasi Anda";

                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = "Akses lokasi ditolak. Izinkan akses lokasi di browser Anda.";
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = "Informasi lokasi tidak tersedia";
                        break;
                    case err.TIMEOUT:
                        errorMessage = "Request timeout untuk mendapatkan lokasi";
                        break;
                }

                setError(errorMessage);
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    // Haversine formula to calculate distance between two points
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const formatCoordinate = (value: number, isLatitude: boolean) => {
        const direction = isLatitude
            ? value >= 0 ? "N" : "S"
            : value >= 0 ? "E" : "W";
        return `${Math.abs(value).toFixed(6)}° ${direction}`;
    };

    if (loading) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-blue-900">Mendapatkan Lokasi...</p>
                        <p className="text-xs text-blue-700 mt-1">
                            Pastikan GPS aktif dan izinkan akses lokasi
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">Gagal Mendapatkan Lokasi</p>
                        <p className="text-xs text-red-700 mt-1">{error}</p>
                        <button
                            onClick={getCurrentLocation}
                            className="text-xs text-red-600 font-medium mt-2 hover:underline"
                        >
                            Coba Lagi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!location) {
        return null;
    }

    return (
        <div
            className={`rounded-lg p-4 border ${isWithinRadius === false && requiredForWFO
                    ? "bg-red-50 border-red-200"
                    : isWithinRadius === true
                        ? "bg-green-50 border-green-200"
                        : "bg-slate-50 border-slate-200"
                }`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    {isWithinRadius === false && requiredForWFO ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : isWithinRadius === true ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                        <MapPin className="h-5 w-5 text-slate-600" />
                    )}
                </div>

                <div className="flex-1">
                    <p
                        className={`text-sm font-medium ${isWithinRadius === false && requiredForWFO
                                ? "text-red-900"
                                : isWithinRadius === true
                                    ? "text-green-900"
                                    : "text-slate-900"
                            }`}
                    >
                        Lokasi Terdeteksi
                    </p>

                    <div className="mt-2 space-y-1 text-xs">
                        <p className="text-slate-600">
                            <span className="font-medium">Latitude:</span>{" "}
                            {formatCoordinate(location.latitude, true)}
                        </p>
                        <p className="text-slate-600">
                            <span className="font-medium">Longitude:</span>{" "}
                            {formatCoordinate(location.longitude, false)}
                        </p>
                        <p className="text-slate-600">
                            <span className="font-medium">Akurasi:</span> ±{Math.round(location.accuracy)}m
                        </p>
                    </div>

                    {/* Geofence Validation */}
                    {officeLocation && isWithinRadius !== null && (
                        <div className="mt-3 pt-3 border-t border-current/20">
                            {isWithinRadius ? (
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-xs font-medium">
                                        Anda berada di dalam area kantor
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 text-red-700">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs">
                                        <p className="font-medium">Anda berada di luar area kantor</p>
                                        <p className="mt-1">
                                            Radius maksimal: {officeLocation.radius}m dari lokasi kantor
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
