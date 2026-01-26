"use client";

// @ai:cx - Profile page with photo upload

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    User,
    Briefcase,
    Phone,
    Mail,
    MapPin,
    Loader2,
    Save,
    Bell,
    Camera,
    X,
    CheckCircle2,
} from "lucide-react";
import Image from "next/image";

interface Profile {
    id: string;
    employeeNumber: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    nik: string;
    npwp: string;
    employmentType: string;
    workMode: string;
    startDate: string;
    branch?: { name: string };
    department?: { name: string };
    position?: { name: string };
}

interface UserData {
    photoUrl?: string | null;
    employee?: Profile;
}

interface NotificationPrefs {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    attendanceAlerts: boolean;
    leaveAlerts: boolean;
    approvalAlerts: boolean;
    announcementAlerts: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function ProfilePage() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [photoSuccess, setPhotoSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        Promise.all([fetchProfile(), fetchPrefs()]).finally(() => setLoading(false));
    }, []);

    async function fetchProfile() {
        try {
            const res = await fetch("/api/auth/me");
            const data = await res.json();
            if (data.success) {
                setUserData(data.data);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function fetchPrefs() {
        try {
            const res = await fetch("/api/notifications/preferences");
            const data = await res.json();
            if (data.success) {
                setPrefs(data.data);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function savePrefs() {
        if (!prefs) return;
        setSaving(true);
        try {
            await fetch("/api/notifications/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(prefs),
            });
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setPhotoError(null);
        setPhotoSuccess(false);

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            setPhotoError("Format file harus JPG atau PNG");
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setPhotoError("Ukuran file maksimal 5MB");
            return;
        }

        setUploadingPhoto(true);

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;

                // Upload to server
                const res = await fetch("/api/employees/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ photoBase64: base64 }),
                });

                const data = await res.json();

                if (data.success) {
                    setUserData((prev) =>
                        prev ? { ...prev, photoUrl: data.data.photoUrl } : prev
                    );
                    setPhotoSuccess(true);
                    setTimeout(() => setPhotoSuccess(false), 3000);
                } else {
                    setPhotoError(data.error?.message || "Gagal mengupload foto");
                }

                setUploadingPhoto(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
            setPhotoError("Gagal mengupload foto");
            setUploadingPhoto(false);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const profile = userData?.employee;
    const photoUrl = userData?.photoUrl;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
                    <p className="text-slate-600">Informasi dan pengaturan akun Anda</p>
                </div>

                {profile && (
                    <div className="space-y-6">
                        {/* Profile Header with Photo */}
                        <Card>
                            <CardContent className="py-6">
                                <div className="flex flex-col items-center gap-4 sm:flex-row">
                                    {/* Photo Upload Area */}
                                    <div className="relative">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                        />
                                        <div
                                            onClick={handlePhotoClick}
                                            className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-4 border-white shadow-lg transition-all hover:shadow-xl"
                                        >
                                            {photoUrl ? (
                                                <Image
                                                    src={photoUrl}
                                                    alt={profile.fullName}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-2xl font-bold text-white">
                                                    {profile.fullName.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            {/* Overlay on hover */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                                {uploadingPhoto ? (
                                                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                                                ) : (
                                                    <Camera className="h-6 w-6 text-white" />
                                                )}
                                            </div>
                                        </div>
                                        {/* Success indicator */}
                                        {photoSuccess && (
                                            <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 p-1">
                                                <CheckCircle2 className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center sm:text-left">
                                        <h2 className="text-xl font-bold text-slate-900">
                                            {profile.fullName}
                                        </h2>
                                        <p className="text-slate-600">{profile.position?.name || "-"}</p>
                                        <p className="text-sm text-slate-500">#{profile.employeeNumber}</p>
                                        {/* Photo upload hint */}
                                        <p className="mt-2 text-xs text-blue-600">
                                            Klik foto untuk mengganti
                                        </p>
                                        {/* Error message */}
                                        {photoError && (
                                            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                                <X className="h-3 w-3" />
                                                {photoError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Info Cards */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Briefcase className="h-4 w-4" /> Informasi Pekerjaan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Cabang</span>
                                        <span className="font-medium">{profile.branch?.name || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Departemen</span>
                                        <span className="font-medium">
                                            {profile.department?.name || "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tipe</span>
                                        <span className="font-medium">{profile.employmentType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Mode Kerja</span>
                                        <span className="font-medium">{profile.workMode || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Bergabung</span>
                                        <span className="font-medium">{formatDate(profile.startDate)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <User className="h-4 w-4" /> Kontak
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span>{profile.email || "-"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <span>{profile.phone || "-"}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        <span>{profile.address || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">NIK</span>
                                        <span className="font-medium">{profile.nik || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">NPWP</span>
                                        <span className="font-medium">{profile.npwp || "-"}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Notification Preferences */}
                        {prefs && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Bell className="h-4 w-4" /> Pengaturan Notifikasi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[
                                            { key: "inAppEnabled", label: "Notifikasi In-App" },
                                            { key: "emailEnabled", label: "Notifikasi Email" },
                                            { key: "attendanceAlerts", label: "Alert Kehadiran" },
                                            { key: "leaveAlerts", label: "Alert Cuti" },
                                            { key: "approvalAlerts", label: "Alert Approval" },
                                        ].map(({ key, label }) => (
                                            <div key={key} className="flex items-center justify-between">
                                                <span className="text-sm text-slate-700">{label}</span>
                                                <button
                                                    onClick={() =>
                                                        setPrefs({
                                                            ...prefs,
                                                            [key]: !prefs[key as keyof NotificationPrefs],
                                                        })
                                                    }
                                                    className={`relative h-6 w-11 rounded-full transition-colors ${prefs[key as keyof NotificationPrefs] ? "bg-blue-600" : "bg-slate-300"}`}
                                                >
                                                    <span
                                                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${prefs[key as keyof NotificationPrefs] ? "translate-x-5" : ""}`}
                                                    />
                                                </button>
                                            </div>
                                        ))}

                                        <Button onClick={savePrefs} disabled={saving} className="mt-4 w-full">
                                            {saving ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="mr-2 h-4 w-4" />
                                            )}
                                            Simpan Pengaturan
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
