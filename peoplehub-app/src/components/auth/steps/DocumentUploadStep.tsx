// @ai:ag - Document Upload Step for registration wizard
// @ai:cl - Updated for Phase 1A - Photo required, KTP optional

"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Upload, X, FileImage, Camera } from "lucide-react";
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

        // Clear error
        setErrors((prev) => ({ ...prev, [type]: undefined }));

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            if (type === "ktp") {
                setKtpPhotoUrl(base64);
            } else {
                setPhotoUrl(base64);
            }
        };
        reader.onerror = () => {
            setErrors((prev) => ({ ...prev, [type]: "Gagal membaca file. Silakan coba lagi." }));
            // Reset input so user can retry with the same file
            event.target.value = "";
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
        // Validate photo is required
        if (!photoUrl) {
            setErrors((prev) => ({ ...prev, photo: "Foto diri wajib diupload" }));
            return;
        }
        onNext?.({ ktpPhotoUrl, photoUrl });
    };

    const canProceed = !!photoUrl;

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                    <strong>Informasi:</strong> Foto diri wajib diupload untuk verifikasi identitas.
                    Foto KTP bersifat opsional dan dapat dilengkapi nanti.
                </p>
            </div>

            {/* Photo Upload - REQUIRED */}
            <div className="space-y-3">
                <Label htmlFor="photo">
                    Foto Diri <span className="text-red-500">*</span>
                </Label>

                {!photoUrl ? (
                    <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                        errors.photo
                            ? "border-red-300 bg-red-50 hover:border-red-500"
                            : "border-slate-300 hover:border-blue-500"
                    }`}>
                        <input
                            id="photo"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => handleFileChange(e, "photo")}
                            className="hidden"
                        />
                        <label
                            htmlFor="photo"
                            className="flex flex-col items-center cursor-pointer"
                        >
                            <Camera className={`h-12 w-12 mb-2 ${errors.photo ? "text-red-400" : "text-(--color-text-muted)"}`} />
                            <p className={`text-sm font-medium ${errors.photo ? "text-(--color-error)" : "text-(--color-text)"}`}>
                                Klik untuk upload foto diri
                            </p>
                            <p className="text-xs text-(--color-text-subtle) mt-1 font-medium">
                                JPG, JPEG, atau PNG (Maks. 5MB)
                            </p>
                        </label>
                    </div>
                ) : (
                    <div className="relative border rounded-lg overflow-hidden max-w-xs mx-auto">
                        <Image
                            src={photoUrl}
                            alt="Photo Preview"
                            width={300}
                            height={400}
                            className="w-full h-auto"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemove("photo")}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {errors.photo && (
                    <p className="text-sm text-red-600">{errors.photo}</p>
                )}

                <p className="text-xs text-slate-700 mt-1">
                    Gunakan foto formal dengan wajah terlihat jelas dan latar belakang polos
                </p>
            </div>

            {/* KTP Upload - OPTIONAL */}
            <div className="space-y-3">
                <Label htmlFor="ktp">
                    Foto KTP <span className="text-slate-700">(Opsional)</span>
                </Label>

                {!ktpPhotoUrl ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                        <input
                            id="ktp"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => handleFileChange(e, "ktp")}
                            className="hidden"
                        />
                        <label
                            htmlFor="ktp"
                            className="flex flex-col items-center cursor-pointer"
                        >
                            <FileImage className="h-12 w-12 text-(--color-text-muted) mb-2" />
                            <p className="text-sm font-medium text-(--color-text)">
                                Klik untuk upload foto KTP
                            </p>
                            <p className="text-xs text-(--color-text-subtle) mt-1 font-medium">
                                JPG, JPEG, atau PNG (Maks. 5MB)
                            </p>
                        </label>
                    </div>
                ) : (
                    <div className="relative border rounded-lg overflow-hidden">
                        <Image
                            src={ktpPhotoUrl}
                            alt="KTP Preview"
                            width={400}
                            height={250}
                            className="w-full h-auto"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemove("ktp")}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {errors.ktp && (
                    <p className="text-sm text-red-600">{errors.ktp}</p>
                )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-700">
                    <strong>Tips:</strong> Pastikan foto jelas dan dapat terbaca.
                    Untuk foto diri, gunakan latar belakang polos dengan pencahayaan yang baik.
                </p>
            </div>

            <WizardNavigation
                onBack={onBack}
                onNext={handleNext}
                canProceed={canProceed}
            />
        </div>
    );
}
