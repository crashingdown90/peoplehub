// @ai:ag - Forgot Password page

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { fetchWithCsrf } from "@/lib/api-client";

const forgotPasswordSchema = z.object({
    email: z.string().email("Email tidak valid"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetchWithCsrf("/api/auth/reset-password/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error?.message || "Gagal mengirim email reset password");
                return;
            }

            setSubmittedEmail(data.email);
            setSuccess(true);
        } catch (err) {
            console.error("Forgot password error:", err);
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
                <div className="max-w-md w-full">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="rounded-full bg-green-100 p-3">
                                    <CheckCircle className="h-12 w-12 text-green-600" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl">Email Terkirim!</CardTitle>
                            <CardDescription>
                                Kami telah mengirim link reset password ke email Anda
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-blue-900">
                                        <p className="font-semibold mb-1">Cek Email Anda</p>
                                        <p>
                                            Kami telah mengirim link reset password ke{" "}
                                            <strong>{submittedEmail}</strong>
                                        </p>
                                        <p className="mt-2">
                                            Link akan kadaluarsa dalam <strong>1 jam</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-600">
                                <p className="font-semibold">Langkah selanjutnya:</p>
                                <ol className="list-decimal list-inside space-y-1 pl-2">
                                    <li>Buka email Anda</li>
                                    <li>Cari email dari PeopleHub</li>
                                    <li>Klik link reset password</li>
                                    <li>Buat password baru</li>
                                </ol>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-xs text-yellow-900">
                                    <strong>Catatan:</strong> Jika email tidak masuk dalam 5 menit, periksa folder spam/junk Anda.
                                </p>
                            </div>

                            <div className="pt-4 space-y-2">
                                <Link href="/login" className="block">
                                    <Button variant="outline" className="w-full">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Kembali ke Login
                                    </Button>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSuccess(false)}
                                    className="w-full text-sm text-blue-600 hover:underline"
                                >
                                    Kirim ulang email
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                            P
                        </div>
                        <CardTitle className="text-2xl">Lupa Password</CardTitle>
                        <CardDescription>
                            Masukkan email Anda untuk menerima link reset password
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Alamat Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email.message}</p>
                                )}
                                <p className="text-xs text-slate-500">
                                    Masukkan email yang terdaftar di sistem PeopleHub
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="mr-2">Mengirim...</span>
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Kirim Link Reset Password
                                    </>
                                )}
                            </Button>

                            <div className="text-center text-sm">
                                <Link
                                    href="/login"
                                    className="text-blue-600 hover:underline inline-flex items-center"
                                >
                                    <ArrowLeft className="mr-1 h-3 w-3" />
                                    Kembali ke Login
                                </Link>
                            </div>
                        </CardContent>
                    </form>
                </Card>

                <div className="mt-4 text-center text-xs text-slate-500">
                    <p>
                        Belum punya akun?{" "}
                        <Link href="/register" className="text-blue-600 hover:underline font-medium">
                            Daftar sekarang
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
