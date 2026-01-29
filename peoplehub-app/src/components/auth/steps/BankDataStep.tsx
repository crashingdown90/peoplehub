// @ai:ag - Bank Data Step for registration wizard
// @ai:cl - Updated for Phase 1A - all fields required

"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";
import { WizardNavigation } from "../RegistrationWizard";
import { BANK_LIST } from "@/constants/banks";

const bankDataSchema = z.object({
    bankName: z.string().min(1, "Pilih nama bank"),
    bankAccountNumber: z
        .string()
        .min(10, "Nomor rekening minimal 10 digit")
        .max(16, "Nomor rekening maksimal 16 digit")
        .regex(/^\d+$/, "Nomor rekening hanya boleh angka"),
    bankAccountHolder: z.string().min(3, "Nama pemilik rekening minimal 3 karakter"),
});

type BankDataForm = z.infer<typeof bankDataSchema>;

interface BankDataStepProps {
    initialData?: Partial<BankDataForm>;
    onNext?: (data: BankDataForm) => void;
    onBack?: () => void;
}

export function BankDataStep({ initialData, onNext, onBack }: BankDataStepProps) {
    const {
        register,
        watch,
        setValue,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<BankDataForm>({
        resolver: zodResolver(bankDataSchema),
        defaultValues: initialData,
        mode: "onBlur",
    });

    const bankName = watch("bankName");

    const onSubmit = (data: BankDataForm) => {
        onNext?.(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-4">
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900 mb-1">Informasi Rekening</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                        Data rekening diperlukan untuk keperluan administrasi dan penggajian. 
                        Pastikan nama pemilik rekening sesuai dengan yang terdaftar.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Bank Name */}
                <div className="space-y-2">
                    <Label htmlFor="bankName" className="text-slate-700 font-semibold">Nama Bank</Label>
                    <Select
                        value={bankName}
                        onValueChange={(value) => setValue("bankName", value, { shouldValidate: true })}
                    >
                        <SelectTrigger 
                            id="bankName" 
                            className={`rounded-xl h-11 border-slate-300 transition-all ${
                                errors.bankName ? "border-red-500 focus:ring-red-500/10" : "focus:ring-blue-500/10"
                            }`}
                        >
                            <SelectValue placeholder="Pilih bank Anda" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl overflow-hidden">
                            {BANK_LIST.map((bank) => (
                                <SelectItem key={bank.code} value={bank.code}>
                                    {bank.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.bankName && (
                        <p className="text-xs text-red-500 font-medium">{errors.bankName.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Account Number */}
                    <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber" className="text-slate-700 font-semibold">Nomor Rekening</Label>
                        <Input
                            id="bankAccountNumber"
                            type="text"
                            placeholder="0000 0000 0000"
                            className={`rounded-xl h-11 border-slate-300 ${
                                errors.bankAccountNumber ? "border-red-500 focus:ring-red-500/10" : ""
                            }`}
                            {...register("bankAccountNumber")}
                        />
                        {errors.bankAccountNumber && (
                            <p className="text-xs text-red-500 font-medium">{errors.bankAccountNumber.message}</p>
                        )}
                        <p className="text-[10px] text-slate-400 font-medium px-1">
                            Hanya angka, antara 10 - 16 digit.
                        </p>
                    </div>

                    {/* Account Holder Name */}
                    <div className="space-y-2">
                        <Label htmlFor="bankAccountHolder" className="text-slate-700 font-semibold">Nama Pemilik</Label>
                        <Input
                            id="bankAccountHolder"
                            type="text"
                            placeholder="Sesuai buku tabungan"
                            className={`rounded-xl h-11 border-slate-300 ${
                                errors.bankAccountHolder ? "border-red-500 focus:ring-red-500/10" : ""
                            }`}
                            {...register("bankAccountHolder")}
                        />
                        {errors.bankAccountHolder && (
                            <p className="text-xs text-red-500 font-medium">{errors.bankAccountHolder.message}</p>
                        )}
                        <p className="text-[10px] text-slate-400 font-medium px-1">
                            Harus sama persis dengan di buku tabungan.
                        </p>
                    </div>
                </div>
            </div>

            <WizardNavigation
                onBack={onBack}
                onNext={handleSubmit(onSubmit)}
                canProceed={isValid}
            />
        </form>
    );
}
