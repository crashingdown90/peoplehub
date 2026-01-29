// @ai:ag - Registration page with multi-step wizard
// @ai:cl - Updated for Phase 1A - New step order with tenant selection

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { RegistrationWizard } from "@/components/auth/RegistrationWizard";
import { TenantSelectionStep } from "@/components/auth/steps/TenantSelectionStep";
import { PersonalDataStep } from "@/components/auth/steps/PersonalDataStep";
import { BankDataStep } from "@/components/auth/steps/BankDataStep";
import { DocumentUploadStep } from "@/components/auth/steps/DocumentUploadStep";
import { AgreementStep } from "@/components/auth/steps/AgreementStep";
import { useCsrf } from "@/hooks/useCsrf";

// Registration form data structure for Phase 1A
interface RegistrationData {
    // Step 1: Tenant selection
    tenantId?: string;
    // Step 2: Personal data
    email?: string;
    phone?: string;
    password?: string;
    passwordConfirmation?: string;
    fullName?: string;
    gender?: "MALE" | "FEMALE";
    birthPlace?: string;
    birthDate?: string;
    // Step 3: Bank data
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    // Step 4: Documents
    photoUrl?: string;
    ktpPhotoUrl?: string;
    // Optional fields
    nik?: string;
    npwp?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    // Step 5: Agreement
    agreedToTerms?: boolean;
    agreedToPrivacy?: boolean;
}

export default function RegisterPage() {
    const router = useRouter();
    const { getHeaders } = useCsrf();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleComplete = async (finalData: RegistrationData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Prepare registration data for API
            const registrationData = {
                // Step 1: Tenant
                tenantId: finalData.tenantId,

                // Step 2: Personal data (required)
                email: finalData.email,
                phone: finalData.phone,
                password: finalData.password,
                passwordConfirmation: finalData.passwordConfirmation,
                fullName: finalData.fullName,
                gender: finalData.gender,
                birthPlace: finalData.birthPlace,
                birthDate: finalData.birthDate,

                // Step 3: Bank data (required)
                bankName: finalData.bankName,
                bankAccountNumber: finalData.bankAccountNumber,
                bankAccountHolder: finalData.bankAccountHolder,

                // Step 4: Documents
                photoUrl: finalData.photoUrl,
                ktpPhotoUrl: finalData.ktpPhotoUrl,

                // Optional fields
                nik: finalData.nik || undefined,
                npwp: finalData.npwp || undefined,
                address: finalData.address || undefined,
                emergencyContactName: finalData.emergencyContactName || undefined,
                emergencyContactPhone: finalData.emergencyContactPhone || undefined,

                // Step 5: Agreement
                agreedToTerms: finalData.agreedToTerms,
                agreedToPrivacy: finalData.agreedToPrivacy,
            };

            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    ...getHeaders(),
                },
                body: JSON.stringify(registrationData),
            });

            // Validate response before parsing
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server tidak merespon dengan format yang benar");
            }

            const result = await response.json();

            if (!response.ok) {
                // Clear draft on validation errors so user can start fresh
                if (response.status === 400) {
                    localStorage.removeItem("peoplehub_registration_draft");
                }
                setError(result.error?.message || "Registrasi gagal");
                setIsSubmitting(false);
                return;
            }

            // Success - redirect to success page
            router.push("/register/success");
        } catch (err) {
            console.error("Registration error:", err);
            const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi.";
            setError(errorMessage);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-(--color-bg) text-(--color-text)">
            {/* Left side: Branding & Visuals (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-blue-600">
                <Image
                    src="/auth-hero.png"
                    alt="Corporate background"
                    fill
                    className="object-cover mix-blend-overlay opacity-60"
                    priority
                />
                <div className="relative z-10 flex flex-col items-start justify-between p-12 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 text-xl font-bold">
                            P
                        </div>
                        <span className="text-2xl font-bold tracking-tight">PeopleHub</span>
                    </div>
                    
                    <div>
                        <h2 className="text-4xl font-bold leading-tight mb-4">
                            Platform HR Modern untuk Tim yang Dinamis
                        </h2>
                        <p className="text-blue-50 text-lg max-w-md">
                            Kelola administrasi karyawan, absensi, dan penggajian dalam satu dashboard yang terintegrasi dan aman.
                        </p>
                    </div>

                    <div className="text-blue-200 text-sm">
                        &copy; {new Date().getFullYear()} PeopleHub.
                    </div>
                </div>
            </div>

            {/* Right side: Form Wizard */}
            <div className="w-full lg:w-1/2 flex flex-col py-12 px-4 sm:px-12 items-center justify-start overflow-y-auto">
                <div className="w-full max-w-xl">
                    {/* Mobile Branding (Show only on small screens) */}
                    <div className="flex lg:hidden flex-col items-center mb-10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-4">
                            P
                        </div>
                        <h1 className="text-2xl font-bold">PeopleHub</h1>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0">
                                    <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-800">Gagal melanjutkan</p>
                                    <p className="text-sm text-red-600 mt-1">{error}</p>
                                </div>
                                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    <RegistrationWizard onComplete={handleComplete} isSubmitting={isSubmitting}>
                        <TenantSelectionStep />
                        <PersonalDataStep />
                        <BankDataStep />
                        <DocumentUploadStep />
                        <AgreementStep />
                    </RegistrationWizard>

                    <p className="mt-8 text-center text-sm text-(--color-text-subtle)">
                        Sudah punya akun?{" "}
                        <a href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                            Masuk di sini
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
