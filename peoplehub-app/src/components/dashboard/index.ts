// @ai:cx - Dashboard component exports

// Basic components
export { StatsCard } from "./stats-card";
export { StatsGrid } from "./stats-grid";
export { ChartCard } from "./chart-card";
export { ActivityFeed } from "./activity-feed";
export { QuickActions } from "./quick-actions";

// Widget components
export { QuickStatsCard } from "./QuickStatsCard";
export { RecentActivityFeed } from "./RecentActivityFeed";
export { UpcomingEventsCard } from "./UpcomingEventsCard";
export { QuickActionsMenu } from "./QuickActionsMenu";
export { LeaveBalanceCard } from "./LeaveBalanceCard";
export { PayrollSummaryCard } from "./PayrollSummaryCard";
export { PerformanceChart } from "./PerformanceChart";
export { CompanyStatsWidget } from "./CompanyStatsWidget";
export { TeamPerformanceWidget } from "./TeamPerformanceWidget";

// New dashboard widgets
export { DashboardSkeleton, TableSkeleton, CardSkeleton } from "./dashboard-skeleton";
export { LeaveBalanceWidget } from "./leave-balance-widget";
export { ShiftScheduleWidget, generateWeekShifts } from "./shift-schedule-widget";
export { ApprovalQueue } from "./approval-queue";
export { AttendanceCalendarWidget } from "./attendance-calendar-widget";
export type { AttendanceDay, AttendanceCalendarWidgetProps } from "./attendance-calendar-widget";
export { RecentActivityWidget } from "./recent-activity-widget";
export type { ActivityItem, RecentActivityWidgetProps } from "./recent-activity-widget";

// Enhanced dashboard widgets
export { DashboardHero } from "./dashboard-hero";
export { EnhancedMetricCard } from "./enhanced-metric-card";
export type { MetricCardProps } from "./enhanced-metric-card";
export { AttendanceHeatmap } from "./attendance-heatmap";
export { DepartmentBreakdown } from "./department-breakdown";
