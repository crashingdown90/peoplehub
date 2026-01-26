// @ai:cl - Announcement service - business logic layer (Enhanced version)
import { prisma } from "@/lib/db";
import { RequestContext, withTenant } from "@/lib/tenant";
import {
  ServiceResponse,
  success,
  error,
  paginated,
  ErrorCodes,
  PaginationParams,
} from "../types";
import { Prisma } from "@prisma/client";
import type { Announcement } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type AnnouncementPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface AnnouncementFilter extends PaginationParams {
  status?: AnnouncementStatus;
  priority?: AnnouncementPriority;
  search?: string;
  unreadOnly?: boolean;
}

export interface AttachmentData {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  isPinned?: boolean;
  targetAudience?: {
    branches?: string[];
    departments?: string[];
    roles?: string[];
  };
  attachments?: AttachmentData[];
  expiresAt?: Date;
  publishNow?: boolean;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  isPinned?: boolean;
  targetAudience?: {
    branches?: string[];
    departments?: string[];
    roles?: string[];
  } | null;
  attachments?: AttachmentData[] | null;
  expiresAt?: Date | null;
}

export interface AnnouncementWithStats extends Announcement {
  createdBy?: { fullName: string; email: string };
  _count?: { reads: number };
  isRead?: boolean;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class AnnouncementService {
  /**
   * Get announcements for admin (all statuses)
   */
  static async getAdminAnnouncements(
    context: RequestContext,
    filter: AnnouncementFilter
  ): Promise<ServiceResponse<AnnouncementWithStats[]>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Akses ditolak");
    }

    const { status, priority, search, page = 1, limit = 20 } = filter;

    const where: Prisma.AnnouncementWhereInput = {
      tenantId: context.tenantId,
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          createdBy: { select: { fullName: true, email: true } },
          _count: { select: { reads: true } },
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    return paginated(announcements as AnnouncementWithStats[], total, page, limit);
  }

  /**
   * Get announcements for user inbox (published only, respecting audience)
   */
  static async getInboxAnnouncements(
    context: RequestContext,
    filter: AnnouncementFilter
  ): Promise<ServiceResponse<AnnouncementWithStats[]>> {
    const { search, unreadOnly, page = 1, limit = 20 } = filter;

    // Base where: published and not expired
    const where: Prisma.AnnouncementWhereInput = {
      tenantId: context.tenantId,
      status: "PUBLISHED",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Get employee details for audience filtering
    let employeeData: { branchId: string | null; departmentId: string | null } | null = null;
    if (context.employeeId) {
      employeeData = await prisma.employee.findFirst({
        where: { id: context.employeeId },
        select: { branchId: true, departmentId: true },
      });
    }

    // Get read announcement IDs for this user
    const readAnnouncements = context.employeeId
      ? await prisma.announcementRead.findMany({
          where: { employeeId: context.employeeId },
          select: { announcementId: true },
        })
      : [];
    const readIds = new Set(readAnnouncements.map((r) => r.announcementId));

    // If unreadOnly, exclude read announcements
    if (unreadOnly && readIds.size > 0) {
      where.id = { notIn: Array.from(readIds) };
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          createdBy: { select: { fullName: true, email: true } },
        },
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit + 20, // Fetch extra for filtering
      }),
      prisma.announcement.count({ where }),
    ]);

    // Filter by audience targeting
    let filteredAnnouncements = announcements;
    if (employeeData) {
      filteredAnnouncements = announcements.filter((ann) => {
        const audience = ann.targetAudience as {
          branches?: string[];
          departments?: string[];
          roles?: string[];
        } | null;

        // No targeting = all users can see
        if (!audience) return true;

        const { branches, departments, roles } = audience;

        // Check if no targeting criteria set
        const hasNoCriteria =
          (!branches || branches.length === 0) &&
          (!departments || departments.length === 0) &&
          (!roles || roles.length === 0);

        if (hasNoCriteria) return true;

        // Check branch targeting
        if (branches?.length && employeeData.branchId) {
          if (!branches.includes(employeeData.branchId)) return false;
        }

        // Check department targeting
        if (departments?.length && employeeData.departmentId) {
          if (!departments.includes(employeeData.departmentId)) return false;
        }

        // Check role targeting
        if (roles?.length) {
          if (!roles.includes(context.role)) return false;
        }

        return true;
      });
    }

    // Add isRead flag and slice to limit
    const result = filteredAnnouncements.slice(0, limit).map((ann) => ({
      ...ann,
      isRead: readIds.has(ann.id),
    }));

    return paginated(result as AnnouncementWithStats[], total, page, limit);
  }

  /**
   * Get unread count for badge
   */
  static async getUnreadCount(context: RequestContext): Promise<ServiceResponse<number>> {
    if (!context.employeeId) {
      return success(0);
    }

    // Get all published announcements
    const publishedAnnouncements = await prisma.announcement.findMany({
      where: {
        tenantId: context.tenantId,
        status: "PUBLISHED",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true, targetAudience: true },
    });

    // Get read announcement IDs
    const readAnnouncements = await prisma.announcementRead.findMany({
      where: { employeeId: context.employeeId },
      select: { announcementId: true },
    });
    const readIds = new Set(readAnnouncements.map((r) => r.announcementId));

    // Get employee for audience check
    const employee = await prisma.employee.findFirst({
      where: { id: context.employeeId },
      select: { branchId: true, departmentId: true },
    });

    // Filter and count
    let unreadCount = 0;
    for (const ann of publishedAnnouncements) {
      if (readIds.has(ann.id)) continue;

      // Check audience targeting
      const audience = ann.targetAudience as {
        branches?: string[];
        departments?: string[];
        roles?: string[];
      } | null;

      if (!audience) {
        unreadCount++;
        continue;
      }

      const { branches, departments, roles } = audience;
      const hasNoCriteria =
        (!branches || branches.length === 0) &&
        (!departments || departments.length === 0) &&
        (!roles || roles.length === 0);

      if (hasNoCriteria) {
        unreadCount++;
        continue;
      }

      let matches = true;
      if (branches?.length && employee?.branchId) {
        if (!branches.includes(employee.branchId)) matches = false;
      }
      if (departments?.length && employee?.departmentId) {
        if (!departments.includes(employee.departmentId)) matches = false;
      }
      if (roles?.length) {
        if (!roles.includes(context.role)) matches = false;
      }

      if (matches) unreadCount++;
    }

    return success(unreadCount);
  }

  /**
   * Get single announcement by ID
   */
  static async getAnnouncementById(
    context: RequestContext,
    id: string
  ): Promise<ServiceResponse<AnnouncementWithStats>> {
    const announcement = await prisma.announcement.findFirst({
      where: withTenant(context, { id }),
      include: {
        createdBy: { select: { fullName: true, email: true } },
        _count: { select: { reads: true } },
      },
    });

    if (!announcement) {
      return error(ErrorCodes.NOT_FOUND, "Pengumuman tidak ditemukan");
    }

    // Non-admins can only see published announcements
    if (
      !["HRD", "SUPER_ADMIN"].includes(context.role) &&
      announcement.status !== "PUBLISHED"
    ) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke pengumuman ini");
    }

    // Check read status
    let isRead = false;
    if (context.employeeId) {
      const readRecord = await prisma.announcementRead.findUnique({
        where: {
          announcementId_employeeId: {
            announcementId: id,
            employeeId: context.employeeId,
          },
        },
      });
      isRead = !!readRecord;
    }

    return success({ ...announcement, isRead } as AnnouncementWithStats);
  }

  /**
   * Get read statistics for an announcement
   */
  static async getReadStats(
    context: RequestContext,
    id: string
  ): Promise<ServiceResponse<{ total: number; readers: Array<{ employeeId: string; fullName: string; readAt: Date }> }>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Akses ditolak");
    }

    const announcement = await prisma.announcement.findFirst({
      where: withTenant(context, { id }),
    });

    if (!announcement) {
      return error(ErrorCodes.NOT_FOUND, "Pengumuman tidak ditemukan");
    }

    const reads = await prisma.announcementRead.findMany({
      where: { announcementId: id },
      include: {
        announcement: false,
      },
      orderBy: { readAt: "desc" },
    });

    // Get employee names
    const employeeIds = reads.map((r) => r.employeeId);
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, fullName: true },
    });
    const employeeMap = new Map(employees.map((e) => [e.id, e.fullName]));

    const readers = reads.map((r) => ({
      employeeId: r.employeeId,
      fullName: employeeMap.get(r.employeeId) || "Unknown",
      readAt: r.readAt,
    }));

    return success({ total: reads.length, readers });
  }

  /**
   * Mark announcement as read
   */
  static async markAsRead(
    context: RequestContext,
    id: string
  ): Promise<ServiceResponse<{ success: boolean }>> {
    if (!context.employeeId) {
      return error(ErrorCodes.FORBIDDEN, "Employee ID required");
    }

    const announcement = await prisma.announcement.findFirst({
      where: withTenant(context, { id, status: "PUBLISHED" }),
    });

    if (!announcement) {
      return error(ErrorCodes.NOT_FOUND, "Pengumuman tidak ditemukan");
    }

    await prisma.announcementRead.upsert({
      where: {
        announcementId_employeeId: {
          announcementId: id,
          employeeId: context.employeeId,
        },
      },
      create: {
        announcementId: id,
        employeeId: context.employeeId,
      },
      update: {},
    });

    return success({ success: true });
  }

  /**
   * Create announcement (HRD/SUPER_ADMIN only)
   */
  static async createAnnouncement(
    context: RequestContext,
    data: CreateAnnouncementInput
  ): Promise<ServiceResponse<Announcement>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk membuat pengumuman");
    }

    const announcement = await prisma.announcement.create({
      data: {
        tenantId: context.tenantId,
        title: data.title,
        content: data.content,
        priority: data.priority || "NORMAL",
        isPinned: data.isPinned || false,
        targetAudience: data.targetAudience
          ? (data.targetAudience as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        attachments: data.attachments
          ? (data.attachments as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        expiresAt: data.expiresAt || null,
        status: data.publishNow ? "PUBLISHED" : "DRAFT",
        publishedAt: data.publishNow ? new Date() : null,
        publishedById: data.publishNow ? context.userId : null,
        createdById: context.userId,
      },
    });

    return success(announcement);
  }

  /**
   * Update announcement (HRD/SUPER_ADMIN only)
   */
  static async updateAnnouncement(
    context: RequestContext,
    id: string,
    data: UpdateAnnouncementInput
  ): Promise<ServiceResponse<Announcement>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk mengubah pengumuman");
    }

    const existing = await prisma.announcement.findFirst({
      where: withTenant(context, { id }),
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Pengumuman tidak ditemukan");
    }

    // Build update data
    const updateData: Prisma.AnnouncementUpdateInput = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
    if (data.targetAudience !== undefined) {
      updateData.targetAudience = data.targetAudience
        ? (data.targetAudience as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }
    if (data.attachments !== undefined) {
      updateData.attachments = data.attachments
        ? (data.attachments as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt;
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    return success(announcement);
  }

  /**
   * Publish announcement (HRD/SUPER_ADMIN only)
   */
  static async publishAnnouncement(
    context: RequestContext,
    id: string
  ): Promise<ServiceResponse<Announcement>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk mempublish pengumuman");
    }

    const existing = await prisma.announcement.findFirst({
      where: withTenant(context, { id }),
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Pengumuman tidak ditemukan");
    }

    if (existing.status === "PUBLISHED") {
      return error(ErrorCodes.CONFLICT, "Pengumuman sudah dipublish");
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedById: context.userId,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return success(announcement);
  }

  /**
   * Archive announcement (HRD/SUPER_ADMIN only)
   */
  static async archiveAnnouncement(
    context: RequestContext,
    id: string
  ): Promise<ServiceResponse<Announcement>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk mengarsipkan pengumuman");
    }

    const existing = await prisma.announcement.findFirst({
      where: withTenant(context, { id }),
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Pengumuman tidak ditemukan");
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        updatedAt: new Date(),
      },
    });

    return success(announcement);
  }

  /**
   * Delete announcement (SUPER_ADMIN only)
   */
  static async deleteAnnouncement(
    context: RequestContext,
    id: string
  ): Promise<ServiceResponse<{ deleted: boolean }>> {
    if (context.role !== "SUPER_ADMIN") {
      return error(ErrorCodes.FORBIDDEN, "Hanya SUPER_ADMIN yang dapat menghapus pengumuman");
    }

    const existing = await prisma.announcement.findFirst({
      where: withTenant(context, { id }),
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Pengumuman tidak ditemukan");
    }

    // Delete reads first
    await prisma.announcementRead.deleteMany({
      where: { announcementId: id },
    });

    await prisma.announcement.delete({
      where: { id },
    });

    return success({ deleted: true });
  }
}
