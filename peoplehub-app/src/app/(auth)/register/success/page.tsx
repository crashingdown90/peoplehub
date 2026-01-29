// @ai:ag - Registration success page

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";

export default function RegisterSuccessPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full">
                <Card>
                    <CardHeader className="text-center pb-2">
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-green-100 p-3">
                                <CheckCircle className="h-16 w-16 text-green-600" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Registrasi Berhasil!
                        </h1>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-slate-600">
                                Terima kasih telah mendaftar di PeopleHub HRIS
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-blue-900 text-left">
                                        <p className="font-semibold mb-1">Akun Anda Sedang Diverifikasi</p>
                                        <p>
                                            Data registrasi Anda telah dikirim ke tim HRD untuk diverifikasi.
                                            Anda akan menerima email notifikasi setelah akun Anda disetujui.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm">
                                Apa yang terjadi selanjutnya?
                            </h3>
                            <ol className="space-y-3 text-sm text-slate-600">
                                <li className="flex gap-2">
                                    <span className="flex-shrink-0 font-semibold text-blue-600">1.</span>
                                    <span>Tim HRD akan meninjau data registrasi Anda</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex-shrink-0 font-semibold text-blue-600">2.</span>
                                    <span>Anda akan menerima email pemberitahuan (biasanya 1-2 hari kerja)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex-shrink-0 font-semibold text-blue-600">3.</span>
                                    <span>Jika disetujui, Anda bisa langsung login menggunakan email dan password yang telah didaftarkan</span>
                                </li>
                            </ol>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-xs text-yellow-900">
                                <strong>Catatan:</strong> Pastikan untuk memeriksa folder spam atau junk email Anda jika tidak menerima email dalam waktu 2 hari kerja.
                            </p>
                        </div>

                        <div className="space-y-2 pt-4">
                            <Link href="/login" className="block">
                                <Button className="w-full" size="lg">
                                    Kembali ke Halaman Login
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/" className="block">
                                <Button variant="outline" className="w-full" size="lg">
                                    Ke Halaman Utama
                                </Button>
                            </Link>
                        </div>

                        <div className="text-center pt-4 border-t">
                            <p className="text-xs text-slate-500">
                                Butuh bantuan? Hubungi tim HRD perusahaan Anda melalui email atau telepon.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
