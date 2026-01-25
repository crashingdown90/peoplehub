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
        mode: "onChange",
    });

    const bankName = watch("bankName");

    const onSubmit = (data: BankDataForm) => {
        onNext?.(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                    <strong>Informasi:</strong> Data rekening bank diperlukan untuk transfer gaji.
                    Pastikan data yang diisi sesuai dengan buku tabungan Anda.
                </p>
            </div>

            {/* Bank Name */}
            <div className="space-y-2">
                <Label htmlFor="bankName">
                    Nama Bank <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={bankName}
                    onValueChange={(value) => setValue("bankName", value, { shouldValidate: true })}
                >
                    <SelectTrigger id="bankName" className={errors.bankName ? "border-red-500" : ""}>
                        <SelectValue placeholder="Pilih bank" />
                    </SelectTrigger>
                    <SelectContent>
                        {BANK_LIST.map((bank) => (
                            <SelectItem key={bank.code} value={bank.code}>
                                {bank.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.bankName && (
                    <p className="text-sm text-red-600">{errors.bankName.message}</p>
                )}
            </div>

            {/* Account Number */}
            <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">
                    Nomor Rekening <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="bankAccountNumber"
                    type="text"
                    placeholder="1234567890"
                    className={errors.bankAccountNumber ? "border-red-500" : ""}
                    {...register("bankAccountNumber")}
                />
                {errors.bankAccountNumber && (
                    <p className="text-sm text-red-600">{errors.bankAccountNumber.message}</p>
                )}
                <p className="text-xs text-slate-500">
                    Masukkan nomor rekening tanpa spasi atau tanda baca (10-16 digit)
                </p>
            </div>

            {/* Account Holder Name */}
            <div className="space-y-2">
                <Label htmlFor="bankAccountHolder">
                    Nama Pemilik Rekening <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="bankAccountHolder"
                    type="text"
                    placeholder="Sesuai rekening bank"
                    className={errors.bankAccountHolder ? "border-red-500" : ""}
                    {...register("bankAccountHolder")}
                />
                {errors.bankAccountHolder && (
                    <p className="text-sm text-red-600">{errors.bankAccountHolder.message}</p>
                )}
                <p className="text-xs text-slate-500">
                    Nama pemilik rekening harus sesuai dengan yang tertera di buku tabungan
                </p>
            </div>

            <WizardNavigation
                onBack={onBack}
                onNext={handleSubmit(onSubmit)}
                canProceed={isValid}
            />
        </form>
    );
}
