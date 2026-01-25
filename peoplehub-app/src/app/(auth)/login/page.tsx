"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { useCsrf } from "@/hooks/useCsrf";

export default function LoginPage() {
    const router = useRouter();
    const { getHeaders } = useCsrf();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    ...getHeaders(),
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error?.message || "Login gagal");
                return;
            }

            // Redirect based on role
            router.push("/dashboard");
            router.refresh();
        } catch {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                        P
                    </div>
                    <CardTitle className="text-2xl">Selamat Datang</CardTitle>
                    <CardDescription>
                        Masuk ke akun PeopleHub Anda
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email"
                            type="email"
                            placeholder="nama@perusahaan.com"
                            error={errors.email?.message}
                            {...register("email")}
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register("password")}
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="remember-me"
                                    className="rounded border-slate-300"
                                    aria-describedby="remember-description"
                                />
                                <span className="text-slate-600">Ingat saya</span>
                            </label>
                            <Link href="/forgot-password" className="text-blue-600 hover:underline">
                                Lupa password?
                            </Link>
                        </div>
                    </CardContent>

                    <CardFooter className="flex-col gap-4">
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Masuk
                        </Button>

                        <p className="text-center text-sm text-slate-600">
                            Belum punya akun?{" "}
                            <Link href="/register" className="font-medium text-blue-600 hover:underline">
                                Daftar sekarang
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
