// @ai:ag - Refactored by Antigravity
// Notification utilities

import { prisma } from "@/lib/db";
import { NotificationType } from "@/types";

/**
 * Params for creating a notification
 */
interface CreateNotificationParams {
    tenantId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    objectType?: string;
    objectId?: string;
}

/**
 * Create a notification for a user
 * Respects user notification preferences
 */
export async function createNotification(params: CreateNotificationParams) {
    try {
        // Check user preferences
        const prefs = await prisma.notificationPreference.findUnique({
            where: { userId: params.userId },
        });

        // If preference exists and in-app is disabled, skip
        if (prefs && !prefs.inAppEnabled) {
            return null;
        }

        // Check type-specific preferences
        if (prefs) {
            const typeDisabled: Record<NotificationType, boolean> = {
                [NotificationType.ATTENDANCE]: !prefs.attendanceAlerts,
                [NotificationType.LEAVE]: !prefs.leaveAlerts,
                [NotificationType.APPROVAL]: !prefs.approvalAlerts,
                [NotificationType.ANNOUNCEMENT]: !prefs.announcementAlerts,
                [NotificationType.SYSTEM]: false, // System notifications always sent
            };

            if (typeDisabled[params.type]) {
                return null;
            }
        }

        const notification = await prisma.notification.create({
            data: params,
        });

        // TODO: Send email if emailEnabled and type matches
        // if (prefs?.emailEnabled && prefs.emailDigest === "REALTIME") {
        //   await sendNotificationEmail(params.userId, notification);
        // }

        return notification;
    } catch (error) {
        console.error("Create notification error:", error);
        return null;
    }
}

/**
 * Notify approver about new leave request
 */
export async function notifyLeaveRequest(
    tenantId: string,
    requesterId: string,
    requesterName: string,
    leaveRequestId: string,
    targetUserId: string,
    leaveTypeName: string,
    totalDays: number,
    startDate: Date,
) {
    return createNotification({
        tenantId,
        userId: targetUserId,
        type: NotificationType.LEAVE,
        title: "Pengajuan Cuti Baru",
        message: `${requesterName} mengajukan ${leaveTypeName} selama ${totalDays} hari mulai ${startDate.toLocaleDateString("id-ID")}`,
        link: `/approvals/leave/${leaveRequestId}`,
        objectType: "LeaveRequest",
        objectId: leaveRequestId,
    });
}

/**
 * Notify employee about approved leave
 */
export async function notifyLeaveApproved(
    tenantId: string,
    userId: string,
    leaveTypeName: string,
    totalDays: number,
) {
    return createNotification({
        tenantId,
        userId,
        type: NotificationType.APPROVAL,
        title: "Cuti Disetujui",
        message: `Pengajuan ${leaveTypeName} selama ${totalDays} hari telah disetujui`,
        link: `/leave`,
        objectType: "LeaveRequest",
    });
}

/**
 * Notify employee about rejected leave
 */
export async function notifyLeaveRejected(
    tenantId: string,
    userId: string,
    leaveTypeName: string,
    reason: string,
) {
    return createNotification({
        tenantId,
        userId,
        type: NotificationType.APPROVAL,
        title: "Cuti Ditolak",
        message: `Pengajuan ${leaveTypeName} ditolak. Alasan: ${reason}`,
        link: `/leave`,
        objectType: "LeaveRequest",
    });
}

/**
 * Notify employee about late attendance
 */
export async function notifyLateAttendance(
    tenantId: string,
    userId: string,
    lateMinutes: number,
) {
    return createNotification({
        tenantId,
        userId,
        type: NotificationType.ATTENDANCE,
        title: "Anda Terlambat",
        message: `Anda terlambat ${lateMinutes} menit hari ini`,
        link: `/attendance`,
        objectType: "Attendance",
    });
}

/**
 * Notify user about registration approval
 */
export async function notifyRegistrationApproved(
    tenantId: string,
    userId: string,
    fullName: string,
) {
    return createNotification({
        tenantId,
        userId,
        type: NotificationType.SYSTEM,
        title: "Registrasi Disetujui",
        message: `Selamat datang ${fullName}! Akun Anda telah diaktifkan.`,
        link: `/dashboard`,
    });
}

/**
 * Notify HRD about pending registration
 */
export async function notifyPendingRegistration(
    tenantId: string,
    hrdUserId: string,
    requesterEmail: string,
) {
    return createNotification({
        tenantId,
        userId: hrdUserId,
        type: NotificationType.SYSTEM,
        title: "Registrasi Baru Menunggu",
        message: `${requesterEmail} mendaftar dan menunggu persetujuan`,
        link: `/admin/registrations`,
        objectType: "User",
    });
}

/**
 * Notify employee about attendance correction approval
 */
export async function notifyAttendanceCorrectionApproved(
    tenantId: string,
    userId: string,
    attendanceDate: string,
) {
    return createNotification({
        tenantId,
        userId,
        type: NotificationType.APPROVAL,
        title: "Koreksi Absensi Disetujui",
        message: `Koreksi absensi tanggal ${attendanceDate} telah disetujui`,
        link: `/attendance`,
        objectType: "AttendanceCorrection",
    });
}

/**
 * Notify employee about attendance correction rejection
 */
export async function notifyAttendanceCorrectionRejected(
    tenantId: string,
    userId: string,
    attendanceDate: string,
    reason: string,
) {
    return createNotification({
        tenantId,
        userId,
        type: NotificationType.APPROVAL,
        title: "Koreksi Absensi Ditolak",
        message: `Koreksi absensi tanggal ${attendanceDate} ditolak. Alasan: ${reason}`,
        link: `/attendance`,
        objectType: "AttendanceCorrection",
    });
}

/**
 * Notify user about payslip published
 */
export async function notifyPayslipPublished(
    tenantId: string,
    userId: string,
    period: string,
) {
    return createNotification({
        tenantId,
        userId,
        type: NotificationType.SYSTEM,
        title: "Slip Gaji Tersedia",
        message: `Slip gaji periode ${period} sudah tersedia`,
        link: `/payslips`,
        objectType: "Payslip",
    });
}

/**
 * Notify about new announcement
 */
export async function notifyAnnouncement(
    tenantId: string,
    userId: string,
    announcementTitle: string,
    announcementId: string,
) {
    return createNotification({
        tenantId,
        userId,
        type: NotificationType.ANNOUNCEMENT,
        title: "Pengumuman Baru",
        message: announcementTitle,
        link: `/announcements/${announcementId}`,
        objectType: "Announcement",
        objectId: announcementId,
    });
}
