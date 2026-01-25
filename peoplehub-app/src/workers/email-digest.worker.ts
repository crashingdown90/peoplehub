// @ai:cl - Email digest worker for daily/weekly summaries
import { prisma } from "@/lib/db";
import { EmailQueueService } from "@/services/email";
import { formatCurrency } from "@/utils/currency";

// ==========================================
// TYPES
// ==========================================

interface DigestData {
  userId: string;
  email: string;
  fullName: string;
  tenantId: string;
  employeeId: string;
}

interface AttendanceSummary {
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  totalMinutesLate: number;
}

interface PendingApprovalsSummary {
  leave: number;
  travel: number;
  reimburse: number;
  total: number;
}

// ==========================================
// EMAIL DIGEST WORKER
// ==========================================

export class EmailDigestWorker {
  /**
   * Process daily digest for all users
   */
  static async processDailyDigest(): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    try {
      // Get all users who want daily digest
      const users = await prisma.notificationPreference.findMany({
        where: {
          emailEnabled: true,
          emailDigest: "DAILY",
        },
      });

      // Get user details
      const userIds = users.map((u) => u.userId);
      const userDetails = await prisma.user.findMany({
        where: { id: { in: userIds } },
        include: { employee: true },
      });

      const userMap = new Map(userDetails.map((u) => [u.id, u]));

      for (const pref of users) {
        const user = userMap.get(pref.userId);
        if (!user || !user.employee) continue;

        try {
          await this.sendDailyDigest({
            userId: user.id,
            email: user.email,
            fullName: user.employee.fullName,
            tenantId: user.tenantId,
            employeeId: user.employee.id,
          });
          processed++;
        } catch (err) {
          console.error(`Failed to send daily digest to ${user.email}:`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error("Daily digest processing error:", err);
    }

    return { processed, errors };
  }

  /**
   * Process weekly digest for all users
   */
  static async processWeeklyDigest(): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    try {
      // Get all users who want weekly digest
      const users = await prisma.notificationPreference.findMany({
        where: {
          emailEnabled: true,
          emailDigest: "WEEKLY",
        },
      });

      // Get user details
      const userIds = users.map((u) => u.userId);
      const userDetails = await prisma.user.findMany({
        where: { id: { in: userIds } },
        include: { employee: true },
      });

      const userMap = new Map(userDetails.map((u) => [u.id, u]));

      for (const pref of users) {
        const user = userMap.get(pref.userId);
        if (!user || !user.employee) continue;

        try {
          await this.sendWeeklyDigest({
            userId: user.id,
            email: user.email,
            fullName: user.employee.fullName,
            tenantId: user.tenantId,
            employeeId: user.employee.id,
          });
          processed++;
        } catch (err) {
          console.error(`Failed to send weekly digest to ${user.email}:`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error("Weekly digest processing error:", err);
    }

    return { processed, errors };
  }

  /**
   * Send daily digest to a user
   */
  private static async sendDailyDigest(data: DigestData): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's attendance
    const attendance = await prisma.attendance.findFirst({
      where: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        attendanceDate: today,
      },
    });

    // Get pending approvals (for managers)
    const pendingApprovals = await this.getPendingApprovals(data.tenantId, data.employeeId);

    // Get unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: {
        tenantId: data.tenantId,
        userId: data.userId,
        isRead: false,
      },
    });

    // Format attendance summary
    let attendanceSummary = "Tidak ada data kehadiran hari ini.";
    if (attendance) {
      if (attendance.status === "PRESENT") {
        attendanceSummary = `Hadir tepat waktu (${attendance.clockIn?.toLocaleTimeString("id-ID")})`;
      } else if (attendance.status === "LATE") {
        attendanceSummary = `Hadir terlambat ${attendance.lateMinutes} menit (${attendance.clockIn?.toLocaleTimeString("id-ID")})`;
      } else if (attendance.status === "LEAVE") {
        attendanceSummary = "Sedang cuti/izin";
      } else if (attendance.status === "ABSENT") {
        attendanceSummary = "Tidak hadir";
      }
    }

    const dateStr = today.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    await EmailQueueService.queueTemplate(
      "dailyDigest",
      { email: data.email, name: data.fullName },
      {
        employeeName: data.fullName,
        date: dateStr,
        attendanceSummary,
        pendingApprovals: pendingApprovals.total > 0 ? "true" : "",
        pendingApprovalsCount: pendingApprovals.total.toString(),
        notifications: unreadNotifications > 0 ? "true" : "",
        notificationsList: `${unreadNotifications} notifikasi belum dibaca`,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
      { priority: "LOW" }
    );
  }

  /**
   * Send weekly digest to a user
   */
  private static async sendWeeklyDigest(data: DigestData): Promise<void> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    // Get weekly attendance summary
    const attendanceSummary = await this.getAttendanceSummary(
      data.tenantId,
      data.employeeId,
      startOfWeek,
      endOfWeek
    );

    // Get leave balance
    const currentYear = today.getFullYear();
    const leaveBalances = await prisma.leaveBalance.aggregate({
      where: {
        employeeId: data.employeeId,
        year: currentYear,
      },
      _sum: { remainingBalance: true },
    });

    const weekRange = `${startOfWeek.toLocaleDateString("id-ID")} - ${endOfWeek.toLocaleDateString("id-ID")}`;

    await EmailQueueService.queueTemplate(
      "weeklyDigest",
      { email: data.email, name: data.fullName },
      {
        employeeName: data.fullName,
        weekRange,
        presentDays: attendanceSummary.presentDays.toString(),
        lateDays: attendanceSummary.lateDays.toString(),
        leaveDays: attendanceSummary.leaveDays.toString(),
        absentDays: attendanceSummary.absentDays.toString(),
        leaveBalance: leaveBalances._sum.remainingBalance?.toString() || "0",
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
      { priority: "LOW" }
    );
  }

  /**
   * Get attendance summary for a period
   */
  private static async getAttendanceSummary(
    tenantId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceSummary> {
    const attendances = await prisma.attendance.findMany({
      where: {
        tenantId,
        employeeId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      presentDays: attendances.filter((a) => a.status === "PRESENT").length,
      lateDays: attendances.filter((a) => a.status === "LATE").length,
      absentDays: attendances.filter((a) => a.status === "ABSENT").length,
      leaveDays: attendances.filter((a) => a.status === "LEAVE").length,
      totalMinutesLate: attendances.reduce((sum, a) => sum + a.lateMinutes, 0),
    };
  }

  /**
   * Get pending approvals for manager
   */
  private static async getPendingApprovals(
    tenantId: string,
    employeeId: string
  ): Promise<PendingApprovalsSummary> {
    // Get subordinates
    const subordinates = await prisma.employee.findMany({
      where: { tenantId, managerId: employeeId, status: "ACTIVE" },
      select: { id: true },
    });

    const subordinateIds = subordinates.map((s) => s.id);

    if (subordinateIds.length === 0) {
      return { leave: 0, travel: 0, reimburse: 0, total: 0 };
    }

    const [leave, travel, reimburse] = await Promise.all([
      prisma.leaveRequest.count({
        where: {
          tenantId,
          employeeId: { in: subordinateIds },
          status: "PENDING",
        },
      }),
      prisma.travelRequest.count({
        where: {
          tenantId,
          employeeId: { in: subordinateIds },
          status: "PENDING",
        },
      }),
      prisma.reimburseRequest.count({
        where: {
          tenantId,
          employeeId: { in: subordinateIds },
          status: "PENDING",
        },
      }),
    ]);

    return {
      leave,
      travel,
      reimburse,
      total: leave + travel + reimburse,
    };
  }
}

// ==========================================
// CRON-LIKE SCHEDULER
// ==========================================

/**
 * Schedule digest jobs
 * In production, use a proper job scheduler like Bull, Agenda, or cron
 */
export function scheduleDigestJobs(): void {
  // Check every hour if it's time to send digests
  setInterval(async () => {
    const now = new Date();
    const hour = now.getHours();

    // Send daily digest at 7 AM
    if (hour === 7) {
      console.log("Starting daily digest processing...");
      const result = await EmailDigestWorker.processDailyDigest();
      console.log(`Daily digest completed: ${result.processed} sent, ${result.errors} errors`);
    }

    // Send weekly digest on Monday at 8 AM
    if (now.getDay() === 1 && hour === 8) {
      console.log("Starting weekly digest processing...");
      const result = await EmailDigestWorker.processWeeklyDigest();
      console.log(`Weekly digest completed: ${result.processed} sent, ${result.errors} errors`);
    }
  }, 60 * 60 * 1000); // Every hour
}

// Auto-start scheduler in production
if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
  scheduleDigestJobs();
}
