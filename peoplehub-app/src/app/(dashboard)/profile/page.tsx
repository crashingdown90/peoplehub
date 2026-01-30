"use client";

// @ai:cx - Complete Profile page with photo upload, editing, and all sections

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    AlertCircle,
    CreditCard,
    Calendar,
    Edit2,
    Shield,
    Users,
    ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { fetchWithCsrf } from "@/lib/api-client";

interface LeaveBalance {
    id: string;
    initialBalance: number;
    usedBalance: number;
    remainingBalance: number;
    leaveType: {
        id: string;
        name: string;
        code: string;
    };
}

interface Profile {
    id: string;
    employeeNumber: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    nik: string;
    npwp: string;
    bpjsKesehatan?: string;
    bpjsKetenagakerjaan?: string;
    employmentType: string;
    workMode: string;
    startDate: string;
    branch?: { name: string };
    department?: { name: string };
    position?: { name: string };
    manager?: { fullName: string };
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    bankBranch?: string;
    leaveBalances?: LeaveBalance[];
}

interface UserData {
    photoUrl?: string | null;
    email?: string;
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

interface EditFormData {
    fullName: string;
    phone: string;
    address: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
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
    const [isEditing, setIsEditing] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState(false);
    const [editForm, setEditForm] = useState<EditFormData>({
        fullName: "",
        phone: "",
        address: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        Promise.all([fetchProfile(), fetchPrefs()]).finally(() => setLoading(false));
    }, []);

    async function fetchProfile() {
        try {
            const res = await fetchWithCsrf("/api/auth/me");
            const data = await res.json();
            if (data.success) {
                setUserData(data.data);
                // Initialize edit form with current data
                const emp = data.data.employee;
                if (emp) {
                    setEditForm({
                        fullName: emp.fullName || "",
                        phone: emp.phone || "",
                        address: emp.address || "",
                        emergencyContactName: emp.emergencyContactName || "",
                        emergencyContactPhone: emp.emergencyContactPhone || "",
                    });
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function fetchPrefs() {
        try {
            const res = await fetchWithCsrf("/api/notifications/preferences");
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
            await fetchWithCsrf("/api/notifications/preferences", {
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

    async function saveProfileEdits() {
        setEditSaving(true);
        setEditError(null);
        setEditSuccess(false);

        try {
            const res = await fetchWithCsrf("/api/employees/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            const data = await res.json();

            if (data.success) {
                const nextFullName = editForm.fullName.trim();
                setUserData((prev) =>
                    prev && prev.employee
                        ? { ...prev, employee: { ...prev.employee, fullName: nextFullName } }
                        : prev
                );
                setEditForm((prev) => ({ ...prev, fullName: nextFullName }));
                setEditSuccess(true);
                setIsEditing(false);
                // Refresh profile data
                await fetchProfile();
                setTimeout(() => setEditSuccess(false), 3000);
            } else {
                setEditError(data.error?.message || "Gagal menyimpan perubahan");
            }
        } catch (err) {
            console.error(err);
            setEditError("Gagal menyimpan perubahan");
        } finally {
            setEditSaving(false);
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
                const res = await fetchWithCsrf("/api/employees/profile", {
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

    const cancelEdit = () => {
        setIsEditing(false);
        setEditError(null);
        // Reset form to original values
        const emp = userData?.employee;
        if (emp) {
            setEditForm({
                fullName: emp.fullName || "",
                phone: emp.phone || "",
                address: emp.address || "",
                emergencyContactName: emp.emergencyContactName || "",
                emergencyContactPhone: emp.emergencyContactPhone || "",
            });
        }
    };

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
            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
                    <p className="text-slate-600">Informasi dan pengaturan akun Anda</p>
                </div>

                {profile && (
                    <div className="space-y-6">
                        {/* Profile Header with Photo */}
                        <Card>
                            <CardContent className="py-6">
                                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                                    {/* Photo Upload Area */}
                                    <div className="relative flex-shrink-0">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                        />
                                        <div
                                            onClick={handlePhotoClick}
                                            className="group relative h-28 w-28 cursor-pointer overflow-hidden rounded-full border-4 border-white shadow-lg transition-all hover:shadow-xl"
                                        >
                                            {photoUrl ? (
                                                <Image
                                                    src={photoUrl}
                                                    alt={profile.fullName}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-3xl font-bold text-white">
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

                                    <div className="flex-1 text-center sm:text-left">
                                        {isEditing ? (
                                            <div className="max-w-sm mx-auto sm:mx-0">
                                                <Label htmlFor="profileFullName" className="sr-only">Nama Lengkap</Label>
                                                <Input
                                                    id="profileFullName"
                                                    value={editForm.fullName}
                                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                                    placeholder="Nama lengkap"
                                                    className="text-lg font-semibold"
                                                />
                                            </div>
                                        ) : (
                                            <h2 className="text-2xl font-bold text-slate-900">
                                                {profile.fullName}
                                            </h2>
                                        )}
                                        <p className="text-lg text-slate-600">{profile.position?.name || "-"}</p>
                                        <p className="text-sm text-slate-500">#{profile.employeeNumber}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                {profile.department?.name || "No Department"}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                                {profile.branch?.name || "No Branch"}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                {profile.workMode}
                                            </span>
                                        </div>
                                        {/* Photo upload hint */}
                                        <p className="mt-3 text-xs text-blue-600">
                                            Klik foto untuk mengganti (JPG/PNG, maks 5MB)
                                        </p>
                                        {/* Error message */}
                                        {photoError && (
                                            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                                <X className="h-3 w-3" />
                                                {photoError}
                                            </p>
                                        )}
                                    </div>

                                    {/* Edit Button */}
                                    <div className="flex-shrink-0">
                                        {!isEditing ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                Edit Profil
                                            </Button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={saveProfileEdits}
                                                    disabled={editSaving}
                                                >
                                                    {editSaving ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="mr-2 h-4 w-4" />
                                                    )}
                                                    Simpan
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={cancelEdit}
                                                    disabled={editSaving}
                                                >
                                                    Batal
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Edit Success/Error Messages */}
                                {editSuccess && (
                                    <div className="mt-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Profil berhasil diperbarui
                                    </div>
                                )}
                                {editError && (
                                    <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                                        <AlertCircle className="h-4 w-4" />
                                        {editError}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Leave Balance Summary */}
                        {profile.leaveBalances && profile.leaveBalances.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Calendar className="h-4 w-4" /> Saldo Cuti {new Date().getFullYear()}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {profile.leaveBalances.map((balance) => (
                                            <div
                                                key={balance.id}
                                                className="rounded-lg border bg-slate-50 p-4"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-slate-700">
                                                        {balance.leaveType.name}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {balance.leaveType.code}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex items-end justify-between">
                                                    <div>
                                                        <span className="text-3xl font-bold text-blue-600">
                                                            {balance.remainingBalance}
                                                        </span>
                                                        <span className="ml-1 text-sm text-slate-500">hari</span>
                                                    </div>
                                                    <div className="text-right text-xs text-slate-500">
                                                        <div>Awal: {balance.initialBalance}</div>
                                                        <div>Terpakai: {balance.usedBalance}</div>
                                                    </div>
                                                </div>
                                                {/* Progress bar */}
                                                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all"
                                                        style={{
                                                            width: `${balance.initialBalance > 0 ? (balance.remainingBalance / balance.initialBalance) * 100 : 0}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Info Cards - Row 1 */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Work Information */}
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
                                        <span className="text-slate-500">Jabatan</span>
                                        <span className="font-medium">{profile.position?.name || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Atasan</span>
                                        <span className="font-medium">{profile.manager?.fullName || "-"}</span>
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

                            {/* Contact Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <User className="h-4 w-4" /> Kontak
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="fullName" className="text-xs">Nama Lengkap</Label>
                                                <Input
                                                    id="fullName"
                                                    value={editForm.fullName}
                                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                                    placeholder="Nama lengkap"
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Email</Label>
                                                <div className="mt-1 flex items-center gap-2 rounded-md bg-slate-100 p-2 text-slate-500">
                                                    <Mail className="h-4 w-4" />
                                                    {userData?.email || "-"}
                                                </div>
                                                <p className="mt-1 text-xs text-slate-400">Email tidak dapat diubah</p>
                                            </div>
                                            <div>
                                                <Label htmlFor="phone" className="text-xs">No. Telepon</Label>
                                                <Input
                                                    id="phone"
                                                    value={editForm.phone}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                    placeholder="08xxxxxxxxxx"
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="address" className="text-xs">Alamat</Label>
                                                <Input
                                                    id="address"
                                                    value={editForm.address}
                                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                    placeholder="Alamat lengkap"
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <span>{userData?.email || "-"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-slate-400" />
                                                <span>{profile.phone || "-"}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                                <span>{profile.address || "-"}</span>
                                            </div>
                                            <div className="border-t pt-3 mt-3">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">NIK</span>
                                                    <span className="font-medium">{profile.nik || "-"}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">NPWP</span>
                                                <span className="font-medium">{profile.npwp || "-"}</span>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Info Cards - Row 2 */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Emergency Contact */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Users className="h-4 w-4" /> Kontak Darurat
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="emergencyName" className="text-xs">Nama Kontak Darurat</Label>
                                                <Input
                                                    id="emergencyName"
                                                    value={editForm.emergencyContactName}
                                                    onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                                                    placeholder="Nama lengkap"
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="emergencyPhone" className="text-xs">No. Telepon Darurat</Label>
                                                <Input
                                                    id="emergencyPhone"
                                                    value={editForm.emergencyContactPhone}
                                                    onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                                                    placeholder="08xxxxxxxxxx"
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Nama</span>
                                                <span className="font-medium">{profile.emergencyContactName || "-"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Telepon</span>
                                                <span className="font-medium">{profile.emergencyContactPhone || "-"}</span>
                                            </div>
                                            {!profile.emergencyContactName && !profile.emergencyContactPhone && (
                                                <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Belum diisi. Klik &quot;Edit Profil&quot; untuk menambahkan.
                                                </p>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Bank Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <CreditCard className="h-4 w-4" /> Informasi Bank
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Bank</span>
                                        <span className="font-medium">{profile.bankName || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">No. Rekening</span>
                                        <span className="font-medium font-mono">{profile.bankAccountNumber || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Atas Nama</span>
                                        <span className="font-medium">{profile.bankAccountHolder || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Cabang</span>
                                        <span className="font-medium">{profile.bankBranch || "-"}</span>
                                    </div>
                                    <div className="border-t pt-3 mt-3">
                                        <Link
                                            href="/profile/bank-change"
                                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            Ajukan Perubahan Data Bank
                                            <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* BPJS Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Shield className="h-4 w-4" /> Informasi BPJS
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg border bg-slate-50 p-4">
                                        <div className="text-xs text-slate-500 mb-1">BPJS Kesehatan</div>
                                        <div className="font-medium font-mono">{profile.bpjsKesehatan || "-"}</div>
                                    </div>
                                    <div className="rounded-lg border bg-slate-50 p-4">
                                        <div className="text-xs text-slate-500 mb-1">BPJS Ketenagakerjaan</div>
                                        <div className="font-medium font-mono">{profile.bpjsKetenagakerjaan || "-"}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

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
                                            { key: "inAppEnabled", label: "Notifikasi In-App", desc: "Tampilkan notifikasi di aplikasi" },
                                            { key: "emailEnabled", label: "Notifikasi Email", desc: "Kirim notifikasi ke email" },
                                            { key: "attendanceAlerts", label: "Alert Kehadiran", desc: "Pengingat clock in/out" },
                                            { key: "leaveAlerts", label: "Alert Cuti", desc: "Update status pengajuan cuti" },
                                            { key: "approvalAlerts", label: "Alert Approval", desc: "Notifikasi persetujuan" },
                                        ].map(({ key, label, desc }) => (
                                            <div key={key} className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm font-medium text-slate-700">{label}</span>
                                                    <p className="text-xs text-slate-500">{desc}</p>
                                                </div>
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
                                            Simpan Pengaturan Notifikasi
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
