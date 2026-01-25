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
        watch,
        formState: { errors },
    } = useForm<PersonalDataForm>({
        resolver: zodResolver(personalDataSchema),
        defaultValues: initialData,
        mode: "onBlur",
    });

    const genderValue = watch("gender");

    const onSubmit = (data: PersonalDataForm) => {
        onNext?.(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-4">
            {/* Account Information Section */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Informasi Akun</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-slate-700 font-semibold">Nama Lengkap</Label>
                            <Input
                                id="fullName"
                                placeholder="John Doe"
                                className="rounded-xl border-slate-300 focus:ring-blue-500/10 focus:border-blue-500 h-11"
                                {...register("fullName")}
                            />
                        {errors.fullName && <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700 font-semibold">Alamat Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="nama@email.com"
                            className="rounded-xl border-slate-300 focus:ring-blue-500/10 focus:border-blue-500 h-11"
                            {...register("email")}
                        />
                        {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-700 font-semibold">Nomor Telepon</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="08123456789"
                            className="rounded-xl border-slate-300 focus:ring-blue-500/10 focus:border-blue-500 h-11"
                            {...register("phone")}
                        />
                        {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold">Jenis Kelamin</Label>
                        <div className="flex gap-4 h-11 items-center">
                            <label className={`flex-1 flex items-center justify-center gap-2 h-full rounded-xl border-2 cursor-pointer transition-all ${
                                genderValue === "MALE" ? "border-blue-600 bg-blue-50 text-blue-700 font-bold" : "border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}>
                                <input type="radio" value="MALE" {...register("gender")} className="sr-only" />
                                <span>Laki-laki</span>
                            </label>
                            <label className={`flex-1 flex items-center justify-center gap-2 h-full rounded-xl border-2 cursor-pointer transition-all ${
                                genderValue === "FEMALE" ? "border-blue-600 bg-blue-50 text-blue-700 font-bold" : "border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}>
                                <input type="radio" value="FEMALE" {...register("gender")} className="sr-only" />
                                <span>Perempuan</span>
                            </label>
                        </div>
                        {errors.gender && <p className="text-xs text-red-500 font-medium">{errors.gender.message}</p>}
                    </div>
                </div>
            </div>

            {/* Identity Information Section */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Identitas</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="birthPlace" className="text-slate-700 font-semibold">Tempat Lahir</Label>
                        <Input
                            id="birthPlace"
                            placeholder="Jakarta"
                            className="rounded-xl border-slate-300 h-11"
                            {...register("birthPlace")}
                        />
                        {errors.birthPlace && <p className="text-xs text-red-500 font-medium">{errors.birthPlace.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="birthDate" className="text-slate-700 font-semibold">Tanggal Lahir</Label>
                        <Input
                            id="birthDate"
                            type="date"
                            className="rounded-xl border-slate-300 h-11"
                            {...register("birthDate")}
                        />
                        {errors.birthDate && <p className="text-xs text-red-500 font-medium">{errors.birthDate.message}</p>}
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Keamanan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 relative">
                        <Label htmlFor="password" className="text-slate-700 font-semibold">Kata Sandi</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="rounded-xl border-slate-300 h-11 pr-10"
                                {...register("password")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2 relative">
                        <Label htmlFor="passwordConfirmation" className="text-slate-700 font-semibold">Ulangi Sandi</Label>
                        <div className="relative">
                            <Input
                                id="passwordConfirmation"
                                type={showConfirmPassword ? "text" : "password"}
                                className="rounded-xl border-slate-300 h-11 pr-10"
                                {...register("passwordConfirmation")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.passwordConfirmation && <p className="text-xs text-red-500 font-medium">{errors.passwordConfirmation.message}</p>}
                    </div>
                </div>
                
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Persyaratan Sandi</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {[
                            { label: "8+ Karakter", regex: /.{8,}/ },
                            { label: "Huruf Besar", regex: /[A-Z]/ },
                            { label: "Huruf Kecil", regex: /[a-z]/ },
                            { label: "Angka", regex: /[0-9]/ },
                            { label: "Simbol (!@#$)", regex: /[^A-Za-z0-9]/ }
                        ].map((req, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold">
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                {req.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <WizardNavigation
                onNext={handleSubmit(onSubmit)}
                onBack={onBack}
                isFirstStep={!onBack}
            />
        </form>
    );
}
