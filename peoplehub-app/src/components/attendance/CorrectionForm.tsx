// @ai:ag - Correction Form for requesting attendance corrections

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, X } from "lucide-react";

const correctionSchema = z.object({
    date: z.string().min(1, "Tanggal wajib dipilih"),
    type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BOTH"], {
        message: "Tipe koreksi wajib dipilih",
    }),
    clockInTime: z.string().optional(),
    clockOutTime: z.string().optional(),
    reason: z.string().min(10, "Alasan minimal 10 karakter"),
});

type CorrectionForm = z.infer<typeof correctionSchema>;

interface CorrectionFormProps {
    onSubmit: (data: CorrectionForm & { proofFile?: File }) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export function CorrectionForm({ onSubmit, onCancel, isSubmitting }: CorrectionFormProps) {
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<CorrectionForm>({
        resolver: zodResolver(correctionSchema),
    });

    const correctionType = watch("type");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError("Ukuran file maksimal 5MB");
                return;
            }
            // Validate file type
            if (!["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(file.type)) {
                setError("File harus berformat JPG, PNG, atau PDF");
                return;
            }
            setError(null);
            setProofFile(file);
        }
    };

    const handleFormSubmit = (data: CorrectionForm) => {
        onSubmit({ ...data, proofFile: proofFile || undefined });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ajukan Koreksi Absensi</CardTitle>
                <CardDescription>
                    Isi formulir di bawah untuk mengajukan koreksi absensi
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="date">
                            Tanggal <span className="text-red-600">*</span>
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            {...register("date")}
                        />
                        {errors.date && (
                            <p className="text-sm text-red-600">{errors.date.message}</p>
                        )}
                    </div>

                    {/* Correction Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type">
                            Tipe Koreksi <span className="text-red-600">*</span>
                        </Label>
                        <select
                            id="type"
                            {...register("type")}
                            className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Pilih tipe koreksi</option>
                            <option value="CLOCK_IN">Clock In saja</option>
                            <option value="CLOCK_OUT">Clock Out saja</option>
                            <option value="BOTH">Clock In dan Clock Out</option>
                        </select>
                        {errors.type && (
                            <p className="text-sm text-red-600">{errors.type.message}</p>
                        )}
                    </div>

                    {/* Clock In Time */}
                    {(correctionType === "CLOCK_IN" || correctionType === "BOTH") && (
                        <div className="space-y-2">
                            <Label htmlFor="clockInTime">
                                Jam Clock In <span className="text-red-600">*</span>
                            </Label>
                            <Input
                                id="clockInTime"
                                type="time"
                                {...register("clockInTime")}
                            />
                            {errors.clockInTime && (
                                <p className="text-sm text-red-600">{errors.clockInTime.message}</p>
                            )}
                        </div>
                    )}

                    {/* Clock Out Time */}
                    {(correctionType === "CLOCK_OUT" || correctionType === "BOTH") && (
                        <div className="space-y-2">
                            <Label htmlFor="clockOutTime">
                                Jam Clock Out <span className="text-red-600">*</span>
                            </Label>
                            <Input
                                id="clockOutTime"
                                type="time"
                                {...register("clockOutTime")}
                            />
                            {errors.clockOutTime && (
                                <p className="text-sm text-red-600">{errors.clockOutTime.message}</p>
                            )}
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Alasan Koreksi <span className="text-red-600">*</span>
                        </Label>
                        <textarea
                            id="reason"
                            {...register("reason")}
                            placeholder="Jelaskan alasan mengapa Anda perlu koreksi absensi..."
                            className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                            rows={4}
                        />
                        {errors.reason && (
                            <p className="text-sm text-red-600">{errors.reason.message}</p>
                        )}
                        <p className="text-xs text-slate-500">Minimal 10 karakter</p>
                    </div>

                    {/* Proof Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="proof">
                            Bukti Pendukung <span className="text-slate-500">(Opsional)</span>
                        </Label>

                        {!proofFile ? (
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                                <input
                                    id="proof"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="proof"
                                    className="flex flex-col items-center cursor-pointer"
                                >
                                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                    <p className="text-sm font-medium text-slate-700">
                                        Klik untuk upload bukti
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        JPG, PNG, atau PDF (Maks. 5MB)
                                    </p>
                                </label>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="text-blue-600">
                                        {proofFile.type.includes("pdf") ? "📄" : "🖼️"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{proofFile.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {(proofFile.size / 1024).toFixed(0)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setProofFile(null)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                        <p className="text-xs text-slate-500">
                            Upload screenshot, surat keterangan, atau dokumen pendukung lainnya
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="mr-2">Mengirim...</span>
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </>
                            ) : (
                                "Ajukan Koreksi"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
