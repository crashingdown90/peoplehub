// @ai:ag - Registration page with multi-step wizard
// @ai:cl - Updated for Phase 1A - New step order with tenant selection

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegistrationWizard } from "@/components/auth/RegistrationWizard";
import { TenantSelectionStep } from "@/components/auth/steps/TenantSelectionStep";
import { PersonalDataStep } from "@/components/auth/steps/PersonalDataStep";
import { BankDataStep } from "@/components/auth/steps/BankDataStep";
import { DocumentUploadStep } from "@/components/auth/steps/DocumentUploadStep";
import { AgreementStep } from "@/components/auth/steps/AgreementStep";

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
                headers: { "Content-Type": "application/json" },
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
        <>
            {error && (
                <div className="fixed top-4 right-4 z-50 max-w-md">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-red-600"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-red-800">Registrasi Gagal</h3>
                                <p className="text-sm text-red-600 mt-1">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="flex-shrink-0 text-red-600 hover:text-red-800"
                            >
                                <span className="sr-only">Tutup</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <RegistrationWizard onComplete={handleComplete} isSubmitting={isSubmitting}>
                {/* Step 1: Pilih Perusahaan - props injected by wizard */}
                <TenantSelectionStep />
                {/* Step 2: Data Pribadi - props injected by wizard */}
                <PersonalDataStep />
                {/* Step 3: Data Bank - props injected by wizard */}
                <BankDataStep />
                {/* Step 4: Foto & Dokumen - props injected by wizard */}
                <DocumentUploadStep />
                {/* Step 5: Persetujuan - props injected by wizard */}
                <AgreementStep />
            </RegistrationWizard>
        </>
    );
}
