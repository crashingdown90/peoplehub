"use client";

// @ai:cx

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, Award, Loader2 } from "lucide-react";

interface KpiTarget {
    id: string;
    targetValue: number;
    actualValue: number | null;
    score: number | null;
    notes: string | null;
    indicator: {
        name: string;
        unit: string;
        targetType: string;
        weight: number;
    };
    period: {
        name: string;
    };
}

interface KpiSummary {
    totalTargets: number;
    completedTargets: number;
    totalWeight: number;
    averageScore: number | null;
}

export default function KpiPage() {
    const [targets, setTargets] = useState<KpiTarget[]>([]);
    const [summary, setSummary] = useState<KpiSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchKpi();
    }, []);

    async function fetchKpi() {
        try {
            const res = await fetch("/api/kpi/targets");
            const data = await res.json();
            if (data.success) {
                setTargets(data.data.targets);
                setSummary(data.data.summary);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-slate-400";
        if (score >= 90) return "text-green-600";
        if (score >= 70) return "text-blue-600";
        if (score >= 50) return "text-yellow-600";
        return "text-red-600";
    };

    const getProgressWidth = (score: number | null) => {
        if (score === null) return "0%";
        return `${Math.min(100, score)}%`;
    };

    const getProgressColor = (score: number | null) => {
        if (score === null) return "bg-slate-200";
        if (score >= 90) return "bg-green-500";
        if (score >= 70) return "bg-blue-500";
        if (score >= 50) return "bg-yellow-500";
        return "bg-red-500";
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">KPI Saya</h1>
                    <p className="text-slate-600">Pantau pencapaian target kinerja Anda</p>
                </div>

                {summary && (
                    <div className="mb-6 grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                        <Target className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Total Target</p>
                                        <p className="text-xl font-bold text-slate-900">{summary.totalTargets}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Selesai</p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {summary.completedTargets} / {summary.totalTargets}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                                        <Award className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Skor Rata-rata</p>
                                        <p className={`text-xl font-bold ${getScoreColor(summary.averageScore)}`}>
                                            {summary.averageScore !== null ? `${summary.averageScore.toFixed(1)}%` : "-"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {targets.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Target className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-600">Belum ada target KPI yang ditetapkan</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {targets.map((target) => (
                            <Card key={target.id}>
                                <CardContent className="py-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900">{target.indicator.name}</h3>
                                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                    {target.period.name}
                                                </span>
                                            </div>

                                            <div className="mt-3 flex items-center gap-6 text-sm">
                                                <div>
                                                    <span className="text-slate-500">Target:</span>{" "}
                                                    <span className="font-medium">{target.targetValue} {target.indicator.unit}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Aktual:</span>{" "}
                                                    <span className="font-medium">
                                                        {target.actualValue !== null ? `${target.actualValue} ${target.indicator.unit}` : "-"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Bobot:</span>{" "}
                                                    <span className="font-medium">{target.indicator.weight}</span>
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-500">Pencapaian</span>
                                                    <span className={`font-bold ${getScoreColor(target.score)}`}>
                                                        {target.score !== null ? `${target.score.toFixed(1)}%` : "Belum dinilai"}
                                                    </span>
                                                </div>
                                                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-full transition-all ${getProgressColor(target.score)}`}
                                                        style={{ width: getProgressWidth(target.score) }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
