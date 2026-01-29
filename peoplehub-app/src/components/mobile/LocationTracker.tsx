'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LocationTrackerProps {
    onLocationUpdate?: (coords: GeolocationCoordinates) => void;
    officeLocation?: { lat: number; lng: number; radius: number };
}

export function LocationTracker({ onLocationUpdate, officeLocation }: LocationTrackerProps) {
    const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isWithinGeofence, setIsWithinGeofence] = useState<boolean | null>(null);

    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    const getLocation = () => {
        setIsLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setIsLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentLocation(position.coords);
                setIsLoading(false);

                if (onLocationUpdate) {
                    onLocationUpdate(position.coords);
                }

                // Check geofence if office location is provided
                if (officeLocation) {
                    const distance = calculateDistance(
                        position.coords.latitude,
                        position.coords.longitude,
                        officeLocation.lat,
                        officeLocation.lng
                    );
                    setIsWithinGeofence(distance <= officeLocation.radius);
                }
            },
            (err) => {
                setError(err.message);
                setIsLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    useEffect(() => {
        getLocation();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                )}

                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-900">Location Error</p>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {currentLocation && !isLoading && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Latitude</p>
                                <p className="font-mono text-sm">{currentLocation.latitude.toFixed(6)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Longitude</p>
                                <p className="font-mono text-sm">{currentLocation.longitude.toFixed(6)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Accuracy</p>
                                <p className="text-sm">± {currentLocation.accuracy.toFixed(0)} meters</p>
                            </div>
                            {currentLocation.altitude && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Altitude</p>
                                    <p className="text-sm">{currentLocation.altitude.toFixed(0)} m</p>
                                </div>
                            )}
                        </div>

                        {isWithinGeofence !== null && (
                            <div className="pt-3">
                                <Badge
                                    variant={isWithinGeofence ? 'default' : 'destructive'}
                                    className="text-sm"
                                >
                                    {isWithinGeofence
                                        ? '✓ Within office area'
                                        : '✗ Outside office area'}
                                </Badge>
                            </div>
                        )}

                        <Button variant="outline" onClick={getLocation} className="w-full">
                            <Navigation className="mr-2 h-4 w-4" />
                            Refresh Location
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
