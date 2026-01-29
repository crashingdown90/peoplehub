// @ai:ag - Selfie Capture component with camera access

"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, X } from "lucide-react";
import Image from "next/image";

interface SelfieCaptureProps {
    onCapture: (imageData: string) => void;
    onCancel?: () => void;
    capturedImage?: string;
}

export function SelfieCapture({ onCapture, onCancel, capturedImage }: SelfieCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(capturedImage || null);

    useEffect(() => {
        return () => {
            // Cleanup: stop camera when component unmounts
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const openCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }

            setStream(mediaStream);
            setIsCameraOpen(true);
            setError(null);
            setPreview(null);
        } catch (err) {
            console.error("Camera error:", err);
            setError(
                "Tidak dapat mengakses kamera. Pastikan Anda mengizinkan akses kamera di browser."
            );
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL("image/jpeg", 0.8);

                setPreview(imageData);
                closeCamera();
            }
        }
    };

    const closeCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    };

    const handleRetake = () => {
        setPreview(null);
        openCamera();
    };

    const handleConfirm = () => {
        if (preview) {
            onCapture(preview);
        }
    };

    const handleCancel = () => {
        closeCamera();
        setPreview(null);
        onCancel?.();
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Camera View */}
            {isCameraOpen && !preview && (
                <div className="relative">
                    <video
                        ref={videoRef}
                        className="w-full rounded-lg bg-black"
                        autoPlay
                        playsInline
                        muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Face Guide Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-4 border-white/50 rounded-full w-48 h-48" />
                    </div>

                    {/* Hint */}
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full inline-block">
                            Posisikan wajah Anda di dalam lingkaran
                        </p>
                    </div>

                    {/* Capture Button */}
                    <div className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            onClick={closeCamera}
                            className="flex-1"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Batal
                        </Button>
                        <Button
                            onClick={capturePhoto}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            <Camera className="mr-2 h-4 w-4" />
                            Ambil Foto
                        </Button>
                    </div>
                </div>
            )}

            {/* Preview */}
            {preview && (
                <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden border">
                        <Image
                            src={preview}
                            alt="Selfie Preview"
                            width={640}
                            height={480}
                            className="w-full h-auto"
                            unoptimized
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRetake}
                            className="flex-1"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Ambil Ulang
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            Konfirmasi
                        </Button>
                    </div>
                </div>
            )}

            {/* Open Camera Button */}
            {!isCameraOpen && !preview && (
                <div className="text-center py-8">
                    <div className="mb-4">
                        <Camera className="h-16 w-16 text-slate-300 mx-auto" />
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                        Ambil foto selfie untuk verifikasi kehadiran
                    </p>
                    <div className="flex gap-2">
                        {onCancel && (
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                        )}
                        <Button
                            onClick={openCamera}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            <Camera className="mr-2 h-4 w-4" />
                            Buka Kamera
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
