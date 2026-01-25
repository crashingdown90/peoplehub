// @ai:ag - Personal Data Step for registration wizard
// @ai:cl - Updated for Phase 1A (added gender, birthPlace, birthDate)

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { WizardNavigation } from "../RegistrationWizard";

const personalDataSchema = z.object({
    fullName: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Email tidak valid"),
    phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{7,10}$/, "Format nomor telepon tidak valid"),
    gender: z.enum(["MALE", "FEMALE"], { message: "Pilih jenis kelamin" }),
    birthPlace: z.string().min(2, "Tempat lahir minimal 2 karakter"),
    birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
    password: z
        .string()
        .min(8, "Password minimal 8 karakter")
        .regex(/[A-Z]/, "Password harus mengandung huruf besar")
        .regex(/[a-z]/, "Password harus mengandung huruf kecil")
        .regex(/[0-9]/, "Password harus mengandung angka")
        .regex(/[^A-Za-z0-9]/, "Password harus mengandung karakter khusus"),
    passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
    message: "Konfirmasi password tidak cocok",
    path: ["passwordConfirmation"],
}).refine((data) => {
    const birthDate = new Date(data.birthDate + "T00:00:00");
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    // Check if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 17;
}, {
    message: "Usia minimal 17 tahun",
    path: ["birthDate"],
}).refine((data) => {
    const birthDate = new Date(data.birthDate + "T00:00:00");
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age <= 65;
}, {
    message: "Usia maksimal 65 tahun",
    path: ["birthDate"],
});

type PersonalDataForm = z.infer<typeof personalDataSchema>;

interface PersonalDataStepProps {
    initialData?: Partial<PersonalDataForm>;
    onNext?: (data: PersonalDataForm) => void;
    onBack?: () => void;
}

export function PersonalDataStep({ initialData, onNext, onBack }: PersonalDataStepProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<PersonalDataForm>({
        resolver: zodResolver(personalDataSchema),
        defaultValues: initialData,
        mode: "onBlur", // Validate on blur for better UX
    });

    const onSubmit = (data: PersonalDataForm) => {
        onNext?.(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
                <Label htmlFor="fullName">
                    Nama Lengkap <span className="text-red-600">*</span>
                </Label>
                <Input
                    id="fullName"
                    placeholder="Contoh: John Doe"
                    {...register("fullName")}
                />
                {errors.fullName && (
                    <p className="text-sm text-red-600">{errors.fullName.message}</p>
                )}
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email">
                    Alamat Email <span className="text-red-600">*</span>
                </Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    {...register("email")}
                />
                {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
                <p className="text-xs text-(--color-text-subtle) font-medium">
                    Email akan digunakan untuk login ke sistem
                </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
                <Label htmlFor="phone">
                    Nomor Telepon <span className="text-red-600">*</span>
                </Label>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="08123456789"
                    {...register("phone")}
                />
                {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
                <Label>
                    Jenis Kelamin <span className="text-red-600">*</span>
                </Label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            value="MALE"
                            {...register("gender")}
                            className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-(--color-text)">Laki-laki</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            value="FEMALE"
                            {...register("gender")}
                            className="w-4 h-4 text-(--color-accent)"
                        />
                        <span className="text-(--color-text)">Perempuan</span>
                    </label>
                </div>
                {errors.gender && (
                    <p className="text-sm text-red-600">{errors.gender.message}</p>
                )}
            </div>

            {/* Birth Place & Date */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="birthPlace">
                        Tempat Lahir <span className="text-red-600">*</span>
                    </Label>
                    <Input
                        id="birthPlace"
                        placeholder="Contoh: Jakarta"
                        {...register("birthPlace")}
                    />
                    {errors.birthPlace && (
                        <p className="text-sm text-red-600">{errors.birthPlace.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="birthDate">
                        Tanggal Lahir <span className="text-red-600">*</span>
                    </Label>
                    <Input
                        id="birthDate"
                        type="date"
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 17)).toISOString().split("T")[0]}
                        {...register("birthDate")}
                    />
                    {errors.birthDate && (
                        <p className="text-sm text-red-600">{errors.birthDate.message}</p>
                    )}
                </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
                <Label htmlFor="password">
                    Kata Sandi <span className="text-red-600">*</span>
                </Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 8 karakter"
                        {...register("password")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
                <div className="text-xs text-(--color-text-subtle) space-y-1">
                    <p className="font-medium">Password harus mengandung:</p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5">
                        <li>Minimal 8 karakter</li>
                        <li>Huruf besar (A-Z)</li>
                        <li>Huruf kecil (a-z)</li>
                        <li>Angka (0-9)</li>
                        <li>Karakter khusus (!@#$%^&*)</li>
                    </ul>
                </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <Label htmlFor="passwordConfirmation">
                    Konfirmasi Kata Sandi <span className="text-red-600">*</span>
                </Label>
                <div className="relative">
                    <Input
                        id="passwordConfirmation"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Ulangi kata sandi"
                        {...register("passwordConfirmation")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
                {errors.passwordConfirmation && (
                    <p className="text-sm text-red-600">{errors.passwordConfirmation.message}</p>
                )}
            </div>

            <WizardNavigation
                onNext={handleSubmit(onSubmit)}
                onBack={onBack}
                isFirstStep={!onBack}
            />
        </form>
    );
}
