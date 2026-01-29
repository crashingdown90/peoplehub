// @ai:ag - Reset Password page

"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import { fetchWithCsrf } from "@/lib/api-client";

const resetPasswordSchema = z.object({
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
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);


    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    // Verify token on mount
    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            setError("Token tidak ditemukan. Silakan request link reset password baru.");
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await fetchWithCsrf("/api/auth/reset-password/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    setTokenValid(false);
                    setError(result.error?.message || "Token tidak valid atau sudah kadaluarsa");
                } else {
                    setTokenValid(true);
                }
            } catch (err) {
                console.error("Token verification error:", err);
                setTokenValid(false);
                setError("Gagal memverifikasi token. Silakan coba lagi.");
            }
        };

        verifyToken();
    }, [token]);

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) {
            setError("Token tidak ditemukan");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetchWithCsrf("/api/auth/reset-password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    password: data.password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error?.message || "Gagal mereset password");
                return;
            }

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err) {
            console.error("Reset password error:", err);
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    // Success state
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
                            <CardTitle className="text-2xl">Password Berhasil Direset!</CardTitle>
                            <CardDescription>
                                Anda sekarang dapat login dengan password baru
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-green-900">
                                    Anda akan diarahkan ke halaman login dalam 3 detik...
                                </p>
                            </div>

                            <Link href="/login" className="block">
                                <Button className="w-full" size="lg">
                                    Login Sekarang
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Invalid token state
    if (tokenValid === false) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
                <div className="max-w-md w-full">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="rounded-full bg-red-100 p-3">
                                    <AlertCircle className="h-12 w-12 text-red-600" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl">Link Tidak Valid</CardTitle>
                            <CardDescription>
                                Link reset password tidak valid atau sudah kadaluarsa
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-900">{error}</p>
                            </div>

                            <div className="text-sm text-slate-600 space-y-2">
                                <p>Kemungkinan penyebab:</p>
                                <ul className="list-disc list-inside pl-2 space-y-1">
                                    <li>Link sudah kadaluarsa (lebih dari 1 jam)</li>
                                    <li>Link sudah pernah digunakan</li>
                                    <li>Link tidak valid</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <Link href="/forgot-password" className="block">
                                    <Button className="w-full">
                                        Request Link Baru
                                    </Button>
                                </Link>
                                <Link href="/login" className="block">
                                    <Button variant="outline" className="w-full">
                                        Kembali ke Login
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Loading token verification
    if (tokenValid === null) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
                <div className="text-center">
                    <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Memverifikasi link...</p>
                </div>
            </div>
        );
    }

    // Reset password form
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                            P
                        </div>
                        <CardTitle className="text-2xl">Reset Password</CardTitle>
                        <CardDescription>
                            Buat password baru untuk akun Anda
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password Baru</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Minimal 8 karakter"
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-600">{errors.password.message}</p>
                                )}
                                <div className="text-xs text-slate-600 space-y-1">
                                    <p>Password harus mengandung:</p>
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
                                <Label htmlFor="passwordConfirmation">Konfirmasi Password</Label>
                                <Input
                                    id="passwordConfirmation"
                                    type="password"
                                    placeholder="Ulangi password baru"
                                    {...register("passwordConfirmation")}
                                />
                                {errors.passwordConfirmation && (
                                    <p className="text-sm text-red-600">{errors.passwordConfirmation.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="mr-2">Memproses...</span>
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </>
                                ) : (
                                    <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        Reset Password
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </form>
                </Card>

                <div className="mt-4 text-center text-xs text-slate-500">
                    <p>
                        Ingat password Anda?{" "}
                        <Link href="/login" className="text-blue-600 hover:underline font-medium">
                            Login sekarang
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
            <div className="text-center">
                <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600">Loading...</p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
