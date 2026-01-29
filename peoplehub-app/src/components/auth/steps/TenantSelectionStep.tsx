// @ai:cl - Tenant Selection Step for registration wizard (Phase 1A)

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-4">
            <div className="space-y-4">
                <div className="grid gap-4">
                    {tenants.map((tenant) => (
                        <label
                            key={tenant.id}
                            className={`
                                relative flex items-center p-6 border-2 rounded-2xl cursor-pointer
                                transition-all duration-300 group
                                ${selectedTenantId === tenant.id
                                    ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-100/50"
                                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
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
                            <div className="flex-1 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                    selectedTenantId === tenant.id ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                                }`}>
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className={`font-bold text-lg transition-colors ${
                                        selectedTenantId === tenant.id ? "text-blue-900" : "text-slate-900"
                                    }`}>
                                        {tenant.name}
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium">
                                        Domain: {tenant.domain}
                                    </div>
                                </div>
                            </div>
                            <div
                                className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                    ${selectedTenantId === tenant.id
                                        ? "border-blue-600 bg-blue-600 ring-4 ring-blue-100"
                                        : "border-slate-200"
                                    }
                                `}
                            >
                                {selectedTenantId === tenant.id && (
                                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                )}
                            </div>
                        </label>
                    ))}
                </div>

                {errors.tenantId && (
                    <div className="flex items-center gap-2 text-red-600 text-sm font-semibold bg-red-50 p-3 rounded-xl">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{errors.tenantId.message}</span>
                    </div>
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
