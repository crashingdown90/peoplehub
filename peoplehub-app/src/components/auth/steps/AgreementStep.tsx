// @ai:ag - Agreement Step for registration wizard (Terms & Privacy)

"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { WizardNavigation } from "../RegistrationWizard";
import { FileText, Shield } from "lucide-react";

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
        <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                    <strong>Penting:</strong> Mohon baca dan setujui ketentuan di bawah ini sebelum melanjutkan registrasi.
                </p>
            </div>

            {/* Terms of Service */}
            <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-(--color-text) mb-2">
                            Ketentuan Penggunaan (Terms of Service)
                        </h3>
                        <div className="text-sm text-(--color-text-subtle) space-y-2 max-h-48 overflow-y-auto pr-2">
                            <p>Dengan menggunakan sistem PeopleHub HRIS, Anda setuju untuk:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Menggunakan sistem sesuai dengan kebijakan perusahaan</li>
                                <li>Menjaga kerahasiaan informasi login Anda</li>
                                <li>Tidak membagikan akses Anda kepada pihak lain</li>
                                <li>Melaporkan jika terjadi penyalahgunaan sistem</li>
                                <li>Mengisi data dengan benar dan akurat</li>
                                <li>Mematuhi seluruh aturan yang berlaku di perusahaan</li>
                            </ul>
                            <p className="mt-3">
                                <Link
                                    href="/terms"
                                    target="_blank"
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    Baca ketentuan lengkap →
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-start gap-2 pt-3 border-t">
                    <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <Label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        Saya telah membaca dan menyetujui Ketentuan Penggunaan
                    </Label>
                </div>
            </div>

            {/* Privacy Policy */}
            <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">
                            Kebijakan Privasi (Privacy Policy)
                        </h3>
                        <div className="text-sm text-(--color-text-subtle) space-y-2 max-h-48 overflow-y-auto pr-2">
                            <p>Kami menghargai privasi Anda. Data yang kami kumpulkan:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Data pribadi (nama, email, nomor telepon)</li>
                                <li>Data pekerjaan (jabatan, departemen, gaji)</li>
                                <li>Data absensi (foto selfie, lokasi GPS)</li>
                                <li>Data keuangan (rekening bank, slip gaji)</li>
                            </ul>
                            <p className="mt-2">Data ini akan digunakan untuk:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Pengelolaan SDM dan administrasi kepegawaian</li>
                                <li>Penggajian dan tunjangan</li>
                                <li>Monitoring kehadiran dan kinerja</li>
                                <li>Komunikasi internal perusahaan</li>
                            </ul>
                            <p className="mt-3 font-medium">
                                Kami berkomitmen untuk menjaga kerahasiaan data Anda dan tidak akan membagikannya kepada pihak ketiga tanpa persetujuan Anda.
                            </p>
                            <p className="mt-3">
                                <Link
                                    href="/privacy"
                                    target="_blank"
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    Baca kebijakan lengkap →
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-start gap-2 pt-3 border-t">
                    <Checkbox
                        id="privacy"
                        checked={agreedToPrivacy}
                        onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
                    />
                    <Label
                        htmlFor="privacy"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-(--color-text)"
                    >
                        Saya telah membaca dan menyetujui Kebijakan Privasi
                    </Label>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-700">
                    Dengan menyelesaikan registrasi, data Anda akan dikirim kepada HRD untuk diverifikasi. Anda akan menerima notifikasi melalui email setelah akun Anda disetujui atau ditolak.
                </p>
            </div>

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
