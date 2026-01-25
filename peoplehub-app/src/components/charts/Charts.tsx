"use client";

// @ai:cx - Recharts wrapper components with dark mode support

import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar,
    Area,
    AreaChart as RechartsAreaChart,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
} from "recharts";
import { useTheme } from "@/components/providers";

// Theme colors for charts
const getChartColors = (isDark: boolean) => ({
    primary: isDark ? "#3b82f6" : "#2563eb",
    secondary: isDark ? "#22c55e" : "#16a34a",
    tertiary: isDark ? "#f59e0b" : "#d97706",
    quaternary: isDark ? "#ec4899" : "#db2777",
    grid: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#94a3b8" : "#64748b",
    background: isDark ? "#1e293b" : "#ffffff",
});

// Shared tooltip styles
const getTooltipStyle = (isDark: boolean) => ({
    contentStyle: {
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        borderColor: isDark ? "#334155" : "#e2e8f0",
        borderRadius: "8px",
        color: isDark ? "#f1f5f9" : "#0f172a",
    },
    labelStyle: {
        color: isDark ? "#f1f5f9" : "#0f172a",
        fontWeight: 600,
    },
});

// ============================================
// Line Chart
// ============================================

interface LineChartProps {
    data: Record<string, unknown>[];
    lines: {
        dataKey: string;
        name: string;
        color?: string;
    }[];
    xAxisKey: string;
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
}

export function LineChart({
    data,
    lines,
    xAxisKey,
    height = 300,
    showGrid = true,
    showLegend = true,
}: LineChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const colors = getChartColors(isDark);
    const tooltipStyle = getTooltipStyle(isDark);

    const defaultColors = [colors.primary, colors.secondary, colors.tertiary, colors.quaternary];

    return (
        <ResponsiveContainer width="100%" height={height} minWidth={0}>
            <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />}
                <XAxis dataKey={xAxisKey} tick={{ fill: colors.text, fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: colors.text, fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip {...tooltipStyle} />
                {showLegend && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                {lines.map((line, index) => (
                    <Line
                        key={line.dataKey}
                        type="monotone"
                        dataKey={line.dataKey}
                        name={line.name}
                        stroke={line.color || defaultColors[index % defaultColors.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                ))}
            </RechartsLineChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Bar Chart
// ============================================

interface BarChartProps {
    data: Record<string, unknown>[];
    bars: {
        dataKey: string;
        name: string;
        color?: string;
    }[];
    xAxisKey: string;
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    stacked?: boolean;
}

export function BarChart({
    data,
    bars,
    xAxisKey,
    height = 300,
    showGrid = true,
    showLegend = true,
    stacked = false,
}: BarChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const colors = getChartColors(isDark);
    const tooltipStyle = getTooltipStyle(isDark);

    const defaultColors = [colors.primary, colors.secondary, colors.tertiary, colors.quaternary];

    return (
        <ResponsiveContainer width="100%" height={height} minWidth={0}>
            <RechartsBarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />}
                <XAxis dataKey={xAxisKey} tick={{ fill: colors.text, fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: colors.text, fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip {...tooltipStyle} />
                {showLegend && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                {bars.map((bar, index) => (
                    <Bar
                        key={bar.dataKey}
                        dataKey={bar.dataKey}
                        name={bar.name}
                        fill={bar.color || defaultColors[index % defaultColors.length]}
                        radius={[4, 4, 0, 0]}
                        stackId={stacked ? "stack" : undefined}
                    />
                ))}
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Area Chart
// ============================================

interface AreaChartProps {
    data: Record<string, unknown>[];
    areas: {
        dataKey: string;
        name: string;
        color?: string;
    }[];
    xAxisKey: string;
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
}

export function AreaChart({
    data,
    areas,
    xAxisKey,
    height = 300,
    showGrid = true,
    showLegend = true,
}: AreaChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const colors = getChartColors(isDark);
    const tooltipStyle = getTooltipStyle(isDark);

    const defaultColors = [colors.primary, colors.secondary, colors.tertiary, colors.quaternary];

    return (
        <ResponsiveContainer width="100%" height={height} minWidth={0}>
            <RechartsAreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />}
                <XAxis dataKey={xAxisKey} tick={{ fill: colors.text, fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: colors.text, fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip {...tooltipStyle} />
                {showLegend && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                {areas.map((area, index) => {
                    const color = area.color || defaultColors[index % defaultColors.length];
                    return (
                        <Area
                            key={area.dataKey}
                            type="monotone"
                            dataKey={area.dataKey}
                            name={area.name}
                            stroke={color}
                            fill={color}
                            fillOpacity={0.2}
                            strokeWidth={2}
                        />
                    );
                })}
            </RechartsAreaChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Donut/Pie Chart
// ============================================

interface DonutChartProps {
    data: {
        name: string;
        value: number;
        color?: string;
    }[];
    height?: number;
    innerRadius?: number;
    outerRadius?: number;
    showLabel?: boolean;
}

export function DonutChart({
    data,
    height = 250,
    innerRadius = 60,
    outerRadius = 100,
    showLabel = true,
}: DonutChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const colors = getChartColors(isDark);
    const tooltipStyle = getTooltipStyle(isDark);

    const defaultColors = [colors.primary, colors.secondary, colors.tertiary, colors.quaternary, "#8b5cf6", "#06b6d4"];

    return (
        <ResponsiveContainer width="100%" height={height} minWidth={0}>
            <RechartsPieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={2}
                    dataKey="value"
                    label={showLabel ? ({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%` : undefined}
                    labelLine={showLabel}
                    style={{ fontSize: '11px' }}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || defaultColors[index % defaultColors.length]} />
                    ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
            </RechartsPieChart>
        </ResponsiveContainer>
    );
}
