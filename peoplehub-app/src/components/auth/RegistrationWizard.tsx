// @ai:ag - Multi-step Registration Wizard for employee registration

"use client";

import { useState, useEffect, cloneElement, isValidElement, ReactElement, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface Step {
    id: number;
    title: string;
    description: string;
}

interface RegistrationWizardProps {
    children: React.ReactNode[];
    onComplete: (data: Record<string, unknown>) => void;
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
    const [formData, setFormData] = useState<Record<string, unknown>>({});

    // Use a secondary effect or handle state restoration more carefully if needed, 
    // but for now let's just use a ref or check if we already loaded.
    const hasLoaded = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || hasLoaded.current) return;

        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.data) {
                    setFormData(parsed.data);
                }
                if (parsed.step) {
                    setCurrentStep(parsed.step);
                }
            }
        } catch (error) {
            console.error("Failed to load draft:", error);
        } finally {
            hasLoaded.current = true;
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

    const handleNext = (stepData: Record<string, unknown>) => {
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

    return (
        <div className="w-full">
            {/* Progress & Steps Indicator */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center flex-1 last:flex-none group">
                            <div className="flex flex-col items-center relative">
                                <div
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 shadow-sm ${currentStep > step.id
                                            ? "bg-green-500 text-white shadow-green-200"
                                            : currentStep === step.id
                                                ? "bg-blue-600 text-white shadow-blue-200"
                                                : "bg-white border-2 border-slate-100 text-slate-300"
                                        }`}
                                >
                                    {currentStep > step.id ? "✓" : step.id}
                                </div>
                                <div className="absolute top-14 w-24 text-center hidden md:block">
                                    <p
                                        className={`text-[10px] uppercase tracking-wider font-bold ${currentStep >= step.id ? "text-slate-900" : "text-slate-400"
                                            }`}
                                    >
                                        {step.title}
                                    </p>
                                </div>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={`hidden md:block flex-1 h-[2px] mx-4 rounded-full transition-colors duration-500 ${currentStep > step.id ? "bg-green-500" : "bg-slate-100"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="mt-16">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">{STEPS[currentStep - 1].title}</h2>
                    <p className="text-slate-500 mt-1">{STEPS[currentStep - 1].description}</p>
                </div>
                
                <div className="bg-white rounded-3xl border border-slate-200 p-1 sm:p-2 shadow-sm">
                    {/* Render the current step's component with injected props */}
                    {isValidElement(children[currentStep - 1])
                        ? cloneElement(children[currentStep - 1] as ReactElement<{
                            onBack?: () => void;
                            onNext?: (data: Record<string, unknown>) => void;
                            initialData?: Record<string, unknown>;
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
                </div>
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
        <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-200">
            <div>
                {!isFirstStep && (
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={onBack}
                        className="text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl px-6 h-12 font-semibold"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                )}
            </div>

            <div className="flex gap-3">
                {showSkip && onSkip && (
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={onSkip}
                        className="text-slate-500 hover:text-slate-900 rounded-xl px-6 h-12 font-semibold"
                    >
                        Lewati
                    </Button>
                )}
                <Button 
                    type="button" 
                    onClick={onNext} 
                    disabled={!canProceed || isLoading}
                    className={`rounded-xl px-8 h-12 font-bold shadow-lg transition-all active:scale-95 ${
                        isLastStep 
                        ? "bg-green-500 hover:bg-green-600 text-white shadow-green-100" 
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100"
                    }`}
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <span>Memproses</span>
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    ) : isLastStep ? (
                        "Selesaikan Registrasi"
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>Lanjutkan</span>
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
}
