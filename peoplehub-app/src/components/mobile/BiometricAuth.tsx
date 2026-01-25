'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, Smartphone, Lock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';

interface BiometricAuthProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function BiometricAuth({ onSuccess, onError }: BiometricAuthProps) {
    const { toast } = useToast();
    const [isSupported, setIsSupported] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        // Check if biometric auth is supported
        const checkSupport = async () => {
            if (window.PublicKeyCredential) {
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                setIsSupported(available);
            }
        };
        checkSupport();
    }, []);

    const handleBiometricAuth = async () => {
        setIsAuthenticating(true);

        try {
            // In a real implementation, this would use WebAuthn API
            // For demo purposes, we'll simulate the authentication
            await new Promise((resolve) => setTimeout(resolve, 1500));

            toast({
                title: 'Authentication successful',
                description: 'You have been authenticated using biometrics',
            });

            if (onSuccess) onSuccess();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';

            toast({
                title: 'Authentication failed',
                description: errorMessage,
                variant: 'destructive',
            });

            if (onError) onError(errorMessage);
        } finally {
            setIsAuthenticating(false);
        }
    };

    if (!isSupported) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Biometric Authentication
                    </CardTitle>
                    <CardDescription>Device does not support biometric authentication</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <XCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-900">Not Available</p>
                            <p className="text-sm text-yellow-700">
                                Biometric authentication is not supported on this device.
                                Please use password authentication.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5" />
                    Biometric Authentication
                </CardTitle>
                <CardDescription>Use fingerprint or face recognition to sign in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-green-900">Available</p>
                        <p className="text-sm text-green-700">
                            Your device supports biometric authentication.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-8">
                    {isAuthenticating ? (
                        <div className="text-center">
                            <div className="inline-block p-6 bg-blue-100 rounded-full mb-4">
                                <Smartphone className="h-12 w-12 text-blue-600 animate-pulse" />
                            </div>
                            <p className="font-medium">Authenticating...</p>
                            <p className="text-sm text-muted-foreground">
                                Please use your biometric sensor
                            </p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <button
                                onClick={handleBiometricAuth}
                                className="inline-block p-6 bg-blue-100 hover:bg-blue-200 rounded-full mb-4 transition-colors"
                            >
                                <Fingerprint className="h-12 w-12 text-blue-600" />
                            </button>
                            <p className="font-medium">Tap to authenticate</p>
                            <p className="text-sm text-muted-foreground">
                                Use fingerprint or face recognition
                            </p>
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleBiometricAuth}
                    disabled={isAuthenticating}
                    className="w-full"
                >
                    {isAuthenticating ? 'Authenticating...' : 'Authenticate with Biometrics'}
                </Button>
            </CardContent>
        </Card>
    );
}
