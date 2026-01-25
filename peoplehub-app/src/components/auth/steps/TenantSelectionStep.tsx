// @ai:cl - Tenant Selection Step for registration wizard (Phase 1A)

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { WizardNavigation } from "../RegistrationWizard";
import { Building2, Loader2 } from "lucide-react";

const tenantSelectionSchema = z.object({
    tenantId: z.string().min(1, "Pilih perusahaan"),
});

type TenantSelectionForm = z.infer<typeof tenantSelectionSchema>;

interface Tenant {
    id: string;
    name: string;
    domain: string;
    code: string;
}

interface TenantSelectionStepProps {
    initialData?: Partial<TenantSelectionForm>;
    onNext?: (data: TenantSelectionForm & { tenantName: string }) => void;
}

export function TenantSelectionStep({ initialData, onNext }: TenantSelectionStepProps) {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
        watch,
        setValue,
        handleSubmit,
        formState: { errors },
    } = useForm<TenantSelectionForm>({
        resolver: zodResolver(tenantSelectionSchema),
        defaultValues: initialData,
    });

    const selectedTenantId = watch("tenantId");

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const response = await fetch("/api/tenants");
                const result = await response.json();

                if (result.success) {
                    setTenants(result.data);
                } else {
                    setError("Gagal memuat daftar perusahaan");
                }
            } catch (err) {
                console.error("Fetch tenants error:", err);
                setError("Gagal memuat daftar perusahaan");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTenants();
    }, []);

    const onSubmit = (data: TenantSelectionForm) => {
        if (!onNext) return;
        const selectedTenant = tenants.find((t) => t.id === data.tenantId);
        onNext({
            ...data,
            tenantName: selectedTenant?.name || "",
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-4 text-slate-600">Memuat daftar perusahaan...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 text-sm text-blue-600 hover:underline"
                    >
                        Coba lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="text-center mb-6">
                <Building2 className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                <h2 className="text-lg font-semibold text-slate-800">Pilih Perusahaan</h2>
                <p className="text-sm text-slate-600 mt-1">
                    Pilih perusahaan tempat Anda bekerja
                </p>
            </div>

            <div className="space-y-3">
                <Label>
                    Perusahaan <span className="text-red-600">*</span>
                </Label>

                <div className="grid gap-3">
                    {tenants.map((tenant) => (
                        <label
                            key={tenant.id}
                            className={`
                                relative flex items-center p-4 border-2 rounded-lg cursor-pointer
                                transition-all duration-200
                                ${selectedTenantId === tenant.id
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                }
                            `}
                        >
                            <input
                                type="radio"
                                name="tenantId"
                                value={tenant.id}
                                checked={selectedTenantId === tenant.id}
                                onChange={(e) => setValue("tenantId", e.target.value)}
                                className="sr-only"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-slate-800">
                                    {tenant.name}
                                </div>
                                <div className="text-sm text-slate-500 mt-0.5">
                                    Kode: {tenant.code}
                                </div>
                            </div>
                            <div
                                className={`
                                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                                    ${selectedTenantId === tenant.id
                                        ? "border-blue-600 bg-blue-600"
                                        : "border-slate-300"
                                    }
                                `}
                            >
                                {selectedTenantId === tenant.id && (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                            </div>
                        </label>
                    ))}
                </div>

                {errors.tenantId && (
                    <p className="text-sm text-red-600">{errors.tenantId.message}</p>
                )}
            </div>

            <WizardNavigation
                onNext={handleSubmit(onSubmit)}
                isFirstStep
                canProceed={!!selectedTenantId}
            />
        </form>
    );
}
