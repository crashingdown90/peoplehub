'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function OfflineModeHandler() {
    const [isOnline, setIsOnline] = useState(true);
    const [showOfflineBanner, setShowOfflineBanner] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOfflineBanner(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOfflineBanner(true);
        };

        setIsOnline(navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showOfflineBanner) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
            <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <WifiOff className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="font-semibold text-orange-900">You're offline</p>
                                <p className="text-sm text-orange-700">
                                    Some features may not be available
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
