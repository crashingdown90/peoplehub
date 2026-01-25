// @ai:ag - Document Upload Step for registration wizard
// @ai:cl - Updated for Phase 1A - Photo required, KTP optional

"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Upload, X, FileImage, Camera, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { WizardNavigation } from "../RegistrationWizard";

interface DocumentUploadStepProps {
    initialData?: {
        ktpPhotoUrl?: string;
        photoUrl?: string;
    };
    onNext?: (data: { ktpPhotoUrl?: string; photoUrl: string }) => void;
    onBack?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export function DocumentUploadStep({ initialData, onNext, onBack }: DocumentUploadStepProps) {
    const [ktpPhotoUrl, setKtpPhotoUrl] = useState<string | undefined>(initialData?.ktpPhotoUrl);
    const [photoUrl, setPhotoUrl] = useState<string | undefined>(initialData?.photoUrl);
    const [errors, setErrors] = useState<{ ktp?: string; photo?: string }>({});

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return "Format file harus JPG, JPEG, atau PNG";
        }
        if (file.size > MAX_FILE_SIZE) {
            return "Ukuran file maksimal 5MB";
        }
        return null;
    };

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        type: "ktp" | "photo"
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const error = validateFile(file);
        if (error) {
            setErrors((prev) => ({ ...prev, [type]: error }));
            return;
        }

        setErrors((prev) => ({ ...prev, [type]: undefined }));

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            if (type === "ktp") {
                setKtpPhotoUrl(base64);
            } else {
                setPhotoUrl(base64);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = (type: "ktp" | "photo") => {
        if (type === "ktp") {
            setKtpPhotoUrl(undefined);
        } else {
            setPhotoUrl(undefined);
        }
        setErrors((prev) => ({ ...prev, [type]: undefined }));
    };

    const handleNext = () => {
        if (!photoUrl) {
            setErrors((prev) => ({ ...prev, photo: "Foto diri wajib diupload" }));
            return;
        }
        onNext?.({ ktpPhotoUrl, photoUrl });
    };

    return (
        <div className="space-y-10 p-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                        <Upload className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">Upload Dokumen</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Pastikan dokumen terlihat jelas, tidak terpotong, dan memiliki pencahayaan yang cukup untuk mempermudah proses verifikasi.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Photo Upload - REQUIRED */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-slate-700 font-bold">Foto Diri (Profile)</Label>
                        <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Wajib</span>
                    </div>

                    {!photoUrl ? (
                        <div className={`
                            relative border-2 border-dashed rounded-3xl p-8 transition-all duration-300 group
                            ${errors.photo ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5"}
                        `}>
                            <input
                                id="photo"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, "photo")}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                                    errors.photo ? "bg-red-100 text-red-500" : "bg-white text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                                }`}>
                                    <Camera className="h-8 w-8" />
                                </div>
                                <h5 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Pilih Foto Diri</h5>
                                <p className="text-xs text-slate-400 mt-2 font-medium">PNG, JPG up to 5MB</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative group rounded-3xl overflow-hidden border-2 border-blue-100 shadow-lg shadow-blue-500/5 aspect-[3/4] max-w-[240px] mx-auto">
                            <Image src={photoUrl} alt="Photo" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                    onClick={() => handleRemove("photo")}
                                    className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="absolute bottom-3 right-3">
                                <CheckCircle2 className="text-green-500 bg-white rounded-full h-6 w-6" />
                            </div>
                        </div>
                    )}
                    {errors.photo && (
                        <div className="flex items-center gap-2 text-red-500 text-xs font-bold px-2">
                            <AlertCircle size={14} />
                            {errors.photo}
                        </div>
                    )}
                </div>

                {/* KTP Upload - OPTIONAL */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-slate-700 font-bold">Foto KTP</Label>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Opsional</span>
                    </div>

                    {!ktpPhotoUrl ? (
                        <div className={`
                            relative border-2 border-dashed rounded-3xl p-8 transition-all duration-300 group
                            ${errors.ktp ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5"}
                        `}>
                            <input
                                id="ktp"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, "ktp")}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                                    errors.ktp ? "bg-red-100 text-red-500" : "bg-white text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                                }`}>
                                    <FileImage className="h-8 w-8" />
                                </div>
                                <h5 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Pilih Foto KTP</h5>
                                <p className="text-xs text-slate-400 mt-2 font-medium">PNG, JPG up to 5MB</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative group rounded-3xl overflow-hidden border-2 border-blue-100 shadow-lg shadow-blue-500/5 aspect-[1.618/1]">
                            <Image src={ktpPhotoUrl} alt="KTP" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                    onClick={() => handleRemove("ktp")}
                                    className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="absolute bottom-3 right-3">
                                <CheckCircle2 className="text-green-500 bg-white rounded-full h-6 w-6" />
                            </div>
                        </div>
                    )}
                    {errors.ktp && (
                        <div className="flex items-center gap-2 text-red-500 text-xs font-bold px-2">
                            <AlertCircle size={14} />
                            {errors.ktp}
                        </div>
                    )}
                </div>
            </div>

            <WizardNavigation
                onBack={onBack}
                onNext={handleNext}
                canProceed={!!photoUrl}
            />
        </div>
    );
}
