"use client";

// @ai:cx

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Camera, Clock, MapPin, RefreshCw } from "lucide-react";

interface AttendanceStatus {
    hasAttendance: boolean;
    hasClockedIn: boolean;
    hasClockedOut: boolean;
    attendance: {
        id: string;
        clockIn: string | null;
        clockOut: string | null;
        workMode: string;
        status: string;
        lateMinutes: number;
    } | null;
    schedule: {
        shiftName: string;
        startTime: string;
        endTime: string;
    };
}

export default function AttendancePage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [status, setStatus] = useState<AttendanceStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [workMode, setWorkMode] = useState<"WFO" | "WFH">("WFO");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [action, setAction] = useState<"clock-in" | "clock-out">("clock-in");

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch today's status
    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch("/api/attendance/today");
            const data = await response.json();
            if (data.success) {
                setStatus(data.data);
                if (data.data.hasClockedIn && !data.data.hasClockedOut) {
                    setAction("clock-out");
                }
            }
        } catch (err) {
            console.error("Error fetching status:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Open camera
    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 640, height: 480 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setIsCameraOpen(true);
            setCapturedPhoto(null);
        } catch (err) {
            setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
            console.error("Camera error:", err);
        }
    };

    // Capture photo
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                setCapturedPhoto(dataUrl);

                // Stop camera
                const stream = video.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                setIsCameraOpen(false);
            }
        }
    };

    // Submit attendance
    const submitAttendance = async () => {
        if (!capturedPhoto) {
            setError("Foto selfie wajib diambil");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Convert data URL to blob
            const response = await fetch(capturedPhoto);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append("photo", blob, "selfie.jpg");
            formData.append("workMode", workMode);

            // Get location if available
            if ("geolocation" in navigator) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    formData.append("latitude", position.coords.latitude.toString());
                    formData.append("longitude", position.coords.longitude.toString());
                } catch {
                    // Location not available, continue without it
                }
            }

            const endpoint = action === "clock-in" ? "/api/attendance/clock-in" : "/api/attendance/clock-out";
            const res = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error?.message || "Gagal submit attendance");
                return;
            }

            // Refresh status
            await fetchStatus();
            setCapturedPhoto(null);

            alert(data.message);
        } catch (err) {
            setError("Terjadi kesalahan. Silakan coba lagi.");
            console.error("Submit error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Retake photo
    const retakePhoto = () => {
        setCapturedPhoto(null);
        openCamera();
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
                    <p className="text-slate-600">Memuat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8">
            <div className="mx-auto max-w-md">
                {/* Header */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Absensi</h1>
                    <p className="text-slate-600">
                        {currentTime.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>

                {/* Clock */}
                <Card className="mb-6">
                    <CardContent className="pt-6 text-center">
                        <div className="text-5xl font-bold text-slate-900 tabular-nums">
                            {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                            Shift: {status?.schedule.startTime} - {status?.schedule.endTime}
                        </p>
                    </CardContent>
                </Card>

                {/* Status */}
                {status?.attendance && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Status Hari Ini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Clock In</p>
                                    <p className="font-semibold text-slate-900">
                                        {status.attendance.clockIn
                                            ? new Date(status.attendance.clockIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                                            : "-"
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Clock Out</p>
                                    <p className="font-semibold text-slate-900">
                                        {status.attendance.clockOut
                                            ? new Date(status.attendance.clockOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                                            : "-"
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Mode</p>
                                    <p className="font-semibold text-slate-900">{status.attendance.workMode}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Status</p>
                                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${status.attendance.status === "PRESENT" ? "bg-green-100 text-green-700" :
                                            status.attendance.status === "LATE" ? "bg-amber-100 text-amber-700" :
                                                "bg-slate-100 text-slate-700"
                                        }`}>
                                        {status.attendance.status === "PRESENT" ? "Tepat Waktu" :
                                            status.attendance.status === "LATE" ? `Terlambat ${status.attendance.lateMinutes}m` :
                                                status.attendance.status}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Camera / Photo Section */}
                {!status?.hasClockedOut && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {action === "clock-in" ? "Clock In" : "Clock Out"}
                            </CardTitle>
                            <CardDescription>
                                Ambil foto selfie untuk {action === "clock-in" ? "memulai" : "mengakhiri"} hari kerja
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* Work Mode Selection (only for clock in) */}
                            {action === "clock-in" && !isCameraOpen && !capturedPhoto && (
                                <div className="mb-4">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Mode Kerja</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setWorkMode("WFO")}
                                            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${workMode === "WFO"
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            <MapPin className="mb-1 mx-auto h-5 w-5" />
                                            WFO (Kantor)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWorkMode("WFH")}
                                            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${workMode === "WFH"
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            <Clock className="mb-1 mx-auto h-5 w-5" />
                                            WFH (Rumah)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Camera View */}
                            {isCameraOpen && (
                                <div className="mb-4">
                                    <video
                                        ref={videoRef}
                                        className="w-full rounded-lg bg-black"
                                        autoPlay
                                        playsInline
                                        muted
                                    />
                                    <canvas ref={canvasRef} className="hidden" />
                                    <Button onClick={capturePhoto} className="mt-2 w-full">
                                        <Camera className="mr-2 h-4 w-4" />
                                        Ambil Foto
                                    </Button>
                                </div>
                            )}

                            {/* Captured Photo Preview */}
                            {capturedPhoto && (
                                <div className="mb-4">
                                    <Image
                                        src={capturedPhoto}
                                        alt="Captured selfie"
                                        width={640}
                                        height={480}
                                        className="h-auto w-full rounded-lg"
                                        priority
                                    />
                                    <div className="mt-2 flex gap-2">
                                        <Button variant="outline" onClick={retakePhoto} className="flex-1">
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Ulangi
                                        </Button>
                                        <Button onClick={submitAttendance} isLoading={isSubmitting} className="flex-1">
                                            {action === "clock-in" ? "Clock In" : "Clock Out"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Open Camera Button */}
                            {!isCameraOpen && !capturedPhoto && (
                                <Button onClick={openCamera} className="w-full">
                                    <Camera className="mr-2 h-4 w-4" />
                                    Buka Kamera
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Already clocked out message */}
                {status?.hasClockedOut && (
                    <Card className="mb-6">
                        <CardContent className="py-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <Clock className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Sudah Clock Out</h3>
                            <p className="text-slate-600">Selamat beristirahat! Sampai jumpa besok.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Back Button */}
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
                    Kembali ke Dashboard
                </Button>
            </div>
        </div>
    );
}
