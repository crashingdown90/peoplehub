
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";

export default function NewShiftPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        startTime: "",
        endTime: "",
        breakMinutes: 60,
        isFlexible: false,
    });

    const getCsrfToken = async () => {
        const res = await fetch("/api/auth/csrf");
        const data = await res.json();
        return data.token;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch("/api/admin/shifts", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Berhasil",
                    description: "Template shift berhasil dibuat.",
                });
                router.push("/admin/shifts");
                router.refresh();
            } else {
                toast({
                    title: "Gagal",
                    description: data.error?.message || "Terjadi kesalahan saat menyimpan shift.",
                    variant: "destructive",
                });
            }
        } catch (err) {
            console.error(err);
            toast({
                title: "Gagal",
                description: "Terjadi kesalahan koneksi.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/admin/shifts">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold text-slate-900">Tambah Template Shift</h1>
                <p className="text-slate-500">Buat template jadwal kerja baru.</p>
            </div>

            <Card className="border-none shadow-xl">
                <CardHeader>
                    <CardTitle>Informasi Shift</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Shift</Label>
                            <Input
                                id="name"
                                placeholder="Contoh: Pagi, Sore, Night"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Waktu Mulai</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">Waktu Selesai</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="breakMinutes">Durasi Istirahat (Menit)</Label>
                            <Input
                                id="breakMinutes"
                                type="number"
                                value={formData.breakMinutes}
                                onChange={(e) => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) })}
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div className="space-y-0.5">
                                <Label htmlFor="isFlexible">Shift Fleksibel</Label>
                                <p className="text-xs text-slate-500">Abaikan keterlambatan jika jam kerja terpenuhi.</p>
                            </div>
                            <Switch
                                id="isFlexible"
                                checked={formData.isFlexible}
                                onCheckedChange={(checked) => setFormData({ ...formData, isFlexible: checked })}
                            />
                        </div>

                        <Button type="submit" className="w-full h-12" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Simpan Template
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
