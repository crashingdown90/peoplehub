// @ai:ag - Team Performance Widget for manager dashboard

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Award } from "lucide-react";

interface TeamMemberPerformance {
    id: string;
    name: string;
    position: string;
    photoUrl?: string;
    attendanceRate: number;
    productivityScore: number;
    rating: number;
    trend: "up" | "down" | "stable";
}

interface TeamPerformanceWidgetProps {
    teamMembers: TeamMemberPerformance[];
    teamName?: string;
}

export function TeamPerformanceWidget({
    teamMembers,
    teamName = "Tim Anda",
}: TeamPerformanceWidgetProps) {
    // Calculate team averages
    const avgAttendance =
        teamMembers.length > 0
            ? Math.round(
                teamMembers.reduce((sum, m) => sum + m.attendanceRate, 0) / teamMembers.length
            )
            : 0;

    const avgProductivity =
        teamMembers.length > 0
            ? Math.round(
                teamMembers.reduce((sum, m) => sum + m.productivityScore, 0) / teamMembers.length
            )
            : 0;

    const avgRating =
        teamMembers.length > 0
            ? (teamMembers.reduce((sum, m) => sum + m.rating, 0) / teamMembers.length).toFixed(1)
            : "0";

    const getTrendIcon = (trend: string) => {
        if (trend === "up") {
            return <TrendingUp className="h-3 w-3 text-green-600" />;
        }
        if (trend === "down") {
            return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
        }
        return <div className="h-0.5 w-3 bg-blue-600" />;
    };

    const getPerformanceBadge = (score: number) => {
        if (score >= 90) {
            return <Badge className="bg-green-100 text-green-700 border-green-200">Excellent</Badge>;
        }
        if (score >= 75) {
            return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Good</Badge>;
        }
        if (score >= 60) {
            return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Fair</Badge>;
        }
        return <Badge className="bg-red-100 text-red-700 border-red-200">Needs Improvement</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-600" />
                        Performa {teamName}
                    </CardTitle>
                    <span className="text-sm text-slate-500">{teamMembers.length} anggota</span>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Team Averages */}
                <div className="grid grid-cols-3 gap-3 pb-4 border-b">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xl font-bold text-blue-600">{avgAttendance}%</p>
                        <p className="text-xs text-blue-700 mt-1">Kehadiran</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xl font-bold text-green-600">{avgProductivity}%</p>
                        <p className="text-xs text-green-700 mt-1">Produktivitas</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-xl font-bold text-amber-600">{avgRating}/5</p>
                        <p className="text-xs text-amber-700 mt-1">Rating</p>
                    </div>
                </div>

                {/* Team Members */}
                <div className="space-y-3">
                    {teamMembers.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Belum ada anggota tim</p>
                        </div>
                    ) : (
                        teamMembers.slice(0, 5).map((member) => (
                            <div
                                key={member.id}
                                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {member.photoUrl ? (
                                        <img
                                            src={member.photoUrl}
                                            alt={member.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                            <span className="text-sm font-semibold text-slate-600">
                                                {member.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 truncate">
                                                {member.name}
                                            </h4>
                                            <p className="text-xs text-slate-500">{member.position}</p>
                                        </div>
                                        {getTrendIcon(member.trend)}
                                    </div>

                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-slate-500">Kehadiran:</span>
                                            <span className="font-medium text-slate-900">
                                                {member.attendanceRate}%
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-slate-500">Produktivitas:</span>
                                            <span className="font-medium text-slate-900">
                                                {member.productivityScore}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        {getPerformanceBadge(
                                            (member.attendanceRate + member.productivityScore) / 2
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {teamMembers.length > 5 && (
                        <div className="text-center pt-2">
                            <button className="text-sm text-blue-600 hover:underline">
                                Lihat semua {teamMembers.length} anggota →
                            </button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
