'use client';

import { useRef, useState, useCallback } from 'react';
import { Camera, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PhotoCaptureProps {
    onCapture: (photo: string) => void;
    onCancel?: () => void;
}

export function PhotoCapture({ onCapture, onCancel }: PhotoCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }, // Front camera for selfie
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);
                setIsStreaming(true);
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Cannot access camera. Please grant camera permission.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
            setIsStreaming(false);
        }
    }, [stream]);

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0);

                const photoData = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedPhoto(photoData);
                stopCamera();
            }
        }
    }, [stopCamera]);

    const confirmPhoto = useCallback(() => {
        if (capturedPhoto) {
            onCapture(capturedPhoto);
        }
    }, [capturedPhoto, onCapture]);

    const retakePhoto = useCallback(() => {
        setCapturedPhoto(null);
        startCamera();
    }, [startCamera]);

    const handleCancel = useCallback(() => {
        stopCamera();
        if (onCancel) onCancel();
    }, [stopCamera, onCancel]);

    return (
        <Card className="overflow-hidden">
            <div className="relative bg-black aspect-[3/4] max-h-[70vh]">
                {!isStreaming && !capturedPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                            onClick={startCamera}
                            size="lg"
                            className="rounded-full h-16 w-16 p-0"
                        >
                            <Camera className="h-8 w-8" />
                        </Button>
                    </div>
                )}

                {isStreaming && (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                )}

                {capturedPhoto && (
                    <img
                        src={capturedPhoto}
                        alt="Captured"
                        className="w-full h-full object-cover"
                    />
                )}

                <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="p-4 bg-white">
                {isStreaming && !capturedPhoto && (
                    <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" onClick={handleCancel}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={capturePhoto}
                            size="lg"
                            className="rounded-full h-16 w-16 p-0"
                        >
                            <Camera className="h-6 w-6" />
                        </Button>
                    </div>
                )}

                {capturedPhoto && (
                    <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" onClick={retakePhoto}>
                            <Camera className="mr-2 h-4 w-4" />
                            Retake
                        </Button>
                        <Button onClick={confirmPhoto}>
                            <Check className="mr-2 h-4 w-4" />
                            Use Photo
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
