"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Sparkles, Calendar } from "lucide-react";

interface DashboardHeroProps {
    userName: string;
    role: string;
    className?: string;
}

export function DashboardHero({ userName, role, className }: DashboardHeroProps) {
    const today = useMemo(() => new Date(), []);
    
    const greeting = useMemo(() => {
        const hour = today.getHours();
        if (hour < 11) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 19) return "Selamat Sore";
        return "Selamat Malam";
    }, [today]);

    const roleLabel = useMemo(() => {
        switch (role) {
            case "SUPER_ADMIN": return "Super Administrator";
            case "HRD": return "HR Manager";
            case "MANAGER": return "Manager";
            case "EMPLOYEE": return "Karyawan";
            case "FINANCE": return "Finance Specialist";
            case "IT_OPS": return "IT Support";
            default: return role;
        }
    }, [role]);

    return (
        <div className={`relative overflow-hidden rounded-3xl bg-blue-600 p-8 text-white shadow-xl shadow-blue-500/10 ${className}`}>
            {/* Background Decorations */}
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute right-24 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full border-20 border-white/5" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center justify-center p-1.5 rounded-lg bg-white/20 backdrop-blur-md">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-blue-50 uppercase tracking-wider">{roleLabel} Dashboard</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        {greeting}, <span className="text-blue-200">{userName}!</span>
                    </h2>
                    <p className="mt-2 text-blue-100/80 max-w-lg leading-relaxed">
                        Senang melihat Anda kembali. Mari kita selesaikan tugas-tugas hari ini dengan penuh semangat!
                    </p>
                </div>

                <div className="flex flex-col items-start md:items-end">
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                        <Calendar className="h-5 w-5 text-blue-200" />
                        <div className="text-left md:text-right">
                            <p className="text-xs font-semibold text-blue-200 uppercase tracking-tighter">Hari Ini</p>
                            <p className="text-sm font-bold">
                                {format(today, "EEEE, d MMMM yyyy", { locale: id })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
