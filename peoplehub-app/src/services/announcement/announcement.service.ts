// @ai:cl - Announcement service - business logic layer
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

export interface AnnouncementFilter extends PaginationParams {
  status?: AnnouncementStatus;
  search?: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  targetAudience?: {
    branches?: string[];
    departments?: string[];
    roles?: string[];
  };
  expiresAt?: Date;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  targetAudience?: {
    branches?: string[];
    departments?: string[];
    roles?: string[];
  } | null;
  expiresAt?: Date | null;
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class AnnouncementService {
  /**
   * Get announcements for current user (respecting audience targeting)
   */
  static async getAnnouncements(
    context: RequestContext,
    filter: AnnouncementFilter
  ): Promise<ServiceResponse<Announcement[]>> {
    const { status, search, page = 1, limit = 20 } = filter;

    // Build where clause
    const where: Record<string, unknown> = {
      tenantId: context.tenantId,
    };

    // For non-admin users, only show published announcements
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      where.status = "PUBLISHED";
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    } else if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    // Filter by audience targeting if user is not admin
    let filteredAnnouncements = announcements;
    if (!["HRD", "SUPER_ADMIN"].includes(context.role) && context.employeeId) {
      // Get employee details for audience filtering
      const employee = await prisma.employee.findFirst({
        where: { id: context.employeeId },
        select: { branchId: true, departmentId: true },
      });

      if (employee) {
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
          if (branches?.length && employee.branchId) {
            if (!branches.includes(employee.branchId)) return false;
          }

          // Check department targeting
          if (departments?.length && employee.departmentId) {
            if (!departments.includes(employee.departmentId)) return false;
          }

          // Check role targeting
          if (roles?.length) {
            if (!roles.includes(context.role)) return false;
          }

          return true;
        });
      }
    }

    return paginated(filteredAnnouncements, total, page, limit);
  }

  /**
   * Get single announcement by ID
   */
  static async getAnnouncementById(
    context: RequestContext,
    id: string
  ): Promise<ServiceResponse<Announcement>> {
    const announcement = await prisma.announcement.findFirst({
      where: withTenant(context, { id }),
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

    return success(announcement);
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
        targetAudience: data.targetAudience
          ? (data.targetAudience as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        expiresAt: data.expiresAt || null,
        status: "DRAFT",
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

    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.targetAudience !== undefined) {
      updateData.targetAudience = data.targetAudience
        ? (data.targetAudience as Prisma.InputJsonValue)
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

    await prisma.announcement.delete({
      where: { id },
    });

    return success({ deleted: true });
  }
}
