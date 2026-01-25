// @ai:ag - Multi-step Registration Wizard for employee registration

"use client";

import { useState, useEffect, cloneElement, isValidElement, ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Step {
    id: number;
    title: string;
    description: string;
}

interface RegistrationWizardProps {
    children: React.ReactNode[];
    onComplete: (data: any) => void;
    isSubmitting?: boolean;
}

// Phase 1A Registration Steps
const STEPS: Step[] = [
    {
        id: 1,
        title: "Pilih Perusahaan",
        description: "Pilih perusahaan tempat Anda bekerja",
    },
    {
        id: 2,
        title: "Data Pribadi",
        description: "Informasi pribadi dan akun login",
    },
    {
        id: 3,
        title: "Data Bank",
        description: "Rekening untuk transfer gaji",
    },
    {
        id: 4,
        title: "Foto & Dokumen",
        description: "Foto diri (wajib) dan KTP (opsional)",
    },
    {
        id: 5,
        title: "Persetujuan",
        description: "Kebijakan privasi dan ketentuan layanan",
    },
];

const STORAGE_KEY = "peoplehub_registration_draft";

export function RegistrationWizard({ children, onComplete, isSubmitting = false }: RegistrationWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<any>({});

    // Load draft from localStorage on mount (SSR guard)
    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.data) setFormData(parsed.data);
                if (parsed.step) setCurrentStep(parsed.step);
            }
        } catch (error) {
            console.error("Failed to load draft:", error);
        }
    }, []);

    // Save draft to localStorage whenever formData changes (SSR guard)
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (Object.keys(formData).length === 0) return;

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    data: formData,
                    step: currentStep,
                    savedAt: new Date().toISOString(),
                })
            );
        } catch (error) {
            console.error("Failed to save draft:", error);
        }
    }, [formData, currentStep]);

    const handleNext = (stepData: any) => {
        const updatedData = { ...formData, ...stepData };
        setFormData(updatedData);

        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        } else {
            // Final step - complete registration
            localStorage.removeItem(STORAGE_KEY);
            onComplete(updatedData);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const progress = (currentStep / STEPS.length) * 100;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold mb-4">
                        P
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Registrasi Karyawan</h1>
                    <p className="text-slate-600 mt-2">
                        Lengkapi data Anda untuk memulai proses registrasi
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                            Langkah {currentStep} dari {STEPS.length}
                        </span>
                        <span className="text-sm text-slate-600">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Steps Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                {/* Step Circle */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep > step.id
                                                ? "bg-green-600 text-white"
                                                : currentStep === step.id
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-slate-200 text-slate-500"
                                            }`}
                                    >
                                        {currentStep > step.id ? "✓" : step.id}
                                    </div>
                                    <div className="text-center mt-2 hidden md:block">
                                        <p
                                            className={`text-xs font-medium ${currentStep >= step.id ? "text-slate-900" : "text-slate-500"
                                                }`}
                                        >
                                            {step.title}
                                        </p>
                                    </div>
                                </div>
                                {/* Connector Line */}
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`hidden md:block flex-1 h-0.5 mx-2 ${currentStep > step.id ? "bg-green-600" : "bg-slate-200"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                        <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Render the current step's component with injected props */}
                        {isValidElement(children[currentStep - 1])
                            ? cloneElement(children[currentStep - 1] as ReactElement<{
                                onBack?: () => void;
                                onNext?: (data: any) => void;
                                initialData?: any;
                                isSubmitting?: boolean;
                                isLastStep?: boolean;
                            }>, {
                                onBack: currentStep > 1 ? handleBack : undefined,
                                onNext: handleNext,
                                initialData: formData,
                                isSubmitting: currentStep === STEPS.length ? isSubmitting : false,
                                isLastStep: currentStep === STEPS.length,
                            })
                            : children[currentStep - 1]
                        }
                    </CardContent>
                </Card>

                {/* Navigation Buttons - will be controlled by step components */}
            </div>
        </div>
    );
}

// Export navigation button components for use in step components
export function WizardNavigation({
    onBack,
    onNext,
    isFirstStep,
    isLastStep,
    isLoading = false,
    canProceed = true,
    showSkip = false,
    onSkip,
}: {
    onBack?: () => void;
    onNext: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
    isLoading?: boolean;
    canProceed?: boolean;
    showSkip?: boolean;
    onSkip?: () => void;
}) {
    return (
        <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div>
                {!isFirstStep && (
                    <Button type="button" variant="outline" onClick={onBack}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                )}
            </div>

            <div className="flex gap-2">
                {showSkip && onSkip && (
                    <Button type="button" variant="ghost" onClick={onSkip}>
                        Lewati
                    </Button>
                )}
                <Button type="button" onClick={onNext} disabled={!canProceed || isLoading}>
                    {isLoading ? (
                        <>
                            <span className="mr-2">Memproses...</span>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </>
                    ) : isLastStep ? (
                        "Daftar"
                    ) : (
                        <>
                            Lanjutkan
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
