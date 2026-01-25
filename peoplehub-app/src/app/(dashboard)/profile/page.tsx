"use client";

// @ai:cx

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Phone, Mail, MapPin, Loader2, Save, Bell } from "lucide-react";

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

interface NotificationPrefs {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    attendanceAlerts: boolean;
    leaveAlerts: boolean;
    approvalAlerts: boolean;
    announcementAlerts: boolean;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([fetchProfile(), fetchPrefs()]).finally(() => setLoading(false));
    }, []);

    async function fetchProfile() {
        try {
            const res = await fetch("/api/auth/me");
            const data = await res.json();
            if (data.success && data.data.employee) {
                setProfile(data.data.employee);
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

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
                    <p className="text-slate-600">Informasi dan pengaturan akun Anda</p>
                </div>

                {profile && (
                    <div className="space-y-6">
                        {/* Profile Header */}
                        <Card>
                            <CardContent className="py-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-2xl font-bold text-white">
                                        {profile.fullName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{profile.fullName}</h2>
                                        <p className="text-slate-600">{profile.position?.name || "-"}</p>
                                        <p className="text-sm text-slate-500">#{profile.employeeNumber}</p>
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
                                        <span className="font-medium">{profile.department?.name || "-"}</span>
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
                                                    onClick={() => setPrefs({ ...prefs, [key]: !prefs[key as keyof NotificationPrefs] })}
                                                    className={`relative h-6 w-11 rounded-full transition-colors ${prefs[key as keyof NotificationPrefs] ? "bg-blue-600" : "bg-slate-300"}`}
                                                >
                                                    <span
                                                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${prefs[key as keyof NotificationPrefs] ? "translate-x-5" : ""}`}
                                                    />
                                                </button>
                                            </div>
                                        ))}

                                        <Button onClick={savePrefs} disabled={saving} className="mt-4 w-full">
                                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
