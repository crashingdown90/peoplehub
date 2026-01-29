// @ai:ag - Agreement Step for registration wizard (Terms & Privacy)

"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { WizardNavigation } from "../RegistrationWizard";
import { FileText, Shield, AlertCircle, ChevronRight } from "lucide-react";

interface AgreementStepProps {
    initialData?: {
        agreedToTerms?: boolean;
        agreedToPrivacy?: boolean;
    };
    onNext?: (data: { agreedToTerms: boolean; agreedToPrivacy: boolean }) => void;
    onBack?: () => void;
    isSubmitting?: boolean;
    isLastStep?: boolean;
}

export function AgreementStep({ initialData, onNext, onBack, isSubmitting, isLastStep = true }: AgreementStepProps) {
    const [agreedToTerms, setAgreedToTerms] = useState(initialData?.agreedToTerms || false);
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(initialData?.agreedToPrivacy || false);
    const [error, setError] = useState<string | null>(null);

    const canProceed = agreedToTerms && agreedToPrivacy;

    const handleNext = () => {
        if (!canProceed) {
            setError("Anda harus menyetujui semua ketentuan untuk melanjutkan");
            return;
        }
        setError(null);
        onNext?.({ agreedToTerms, agreedToPrivacy });
    };

    return (
        <div className="space-y-8 p-4">
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <h4 className="font-bold text-amber-900 mb-1">Persetujuan Akhir</h4>
                    <p className="text-sm text-amber-700 leading-relaxed">
                        Langkah terakhir untuk bergabung. Mohon pastikan seluruh data sudah benar dan setujui ketentuan layanan kami.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Terms of Service Section */}
                <div className={`rounded-3xl border-2 p-1 transition-all duration-300 ${agreedToTerms ? "border-blue-100 bg-blue-50/20" : "border-slate-200 bg-slate-50/50"}`}>
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                                <FileText size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">Ketentuan Layanan</h3>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 h-40 overflow-y-auto custom-scrollbar">
                           <div className="text-sm text-slate-500 space-y-3 leading-relaxed">
                                <p className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Kewajiban Pengguna:</p>
                                <ul className="space-y-2">
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        <span>Menjamin seluruh informasi yang diberikan akurat dan milik sendiri.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        <span>Menjaga keamanan kredensial akun dan tidak membagikannya.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        <span>Bertanggung jawab penuh atas aktivitas yang dilakukan oleh akun tersebut.</span>
                                    </li>
                                </ul>
                                <Link href="/terms" className="inline-flex items-center gap-1 text-blue-600 font-bold text-xs hover:gap-2 transition-all pt-2">
                                    BACA SELENGKAPNYA <ChevronRight size={14} />
                                </Link>
                           </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                             <Checkbox
                                id="terms"
                                checked={agreedToTerms}
                                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                                className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">Saya menyetujui Ketentuan Layanan</span>
                        </label>
                    </div>
                </div>

                {/* Privacy Policy Section */}
                <div className={`rounded-3xl border-2 p-1 transition-all duration-300 ${agreedToPrivacy ? "border-green-100 bg-green-50/20" : "border-slate-200 bg-slate-50/50"}`}>
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-200">
                                <Shield size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">Kebijakan Privasi</h3>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 h-40 overflow-y-auto custom-scrollbar">
                           <div className="text-sm text-slate-500 space-y-3 leading-relaxed">
                                <p className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Penggunaan Data:</p>
                                <ul className="space-y-2">
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                        <span>Data pribadi digunakan hanya untuk keperluan administrasi internal.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                        <span>Kami tidak akan membocorkan data kepada pihak ketiga tanpa izin.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                        <span>Informasi bank terenkripsi dan hanya dapat diakses oleh pihak berwenang.</span>
                                    </li>
                                </ul>
                                <Link href="/privacy" className="inline-flex items-center gap-1 text-green-600 font-bold text-xs hover:gap-2 transition-all pt-2">
                                    BACA SELENGKAPNYA <ChevronRight size={14} />
                                </Link>
                           </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                             <Checkbox
                                id="privacy"
                                checked={agreedToPrivacy}
                                onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
                                className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-green-600 transition-colors">Saya menyetujui Kebijakan Privasi</span>
                        </label>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            <WizardNavigation
                onBack={onBack}
                onNext={handleNext}
                isLastStep={isLastStep}
                isLoading={isSubmitting}
                canProceed={canProceed}
            />
        </div>
    );
}
