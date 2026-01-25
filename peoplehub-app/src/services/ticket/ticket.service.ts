// @ai:cl - Ticket Service with CRUD operations
import { prisma } from "@/lib/db";
import { RequestContext, withTenant } from "@/lib/tenant";
import { ServiceResponse, success, error, ErrorCodes, PaginationParams } from "../types";
import { EmailQueueService } from "@/services/email";
import { Prisma, UserRole } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface CreateTicketInput {
  category: "HR" | "IT" | "FINANCE" | "OTHER";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  subject: string;
  description: string;
}

export interface UpdateTicketInput {
  category?: "HR" | "IT" | "FINANCE" | "OTHER";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  subject?: string;
  description?: string;
}

export interface AssignTicketInput {
  assignedToId: string;
}

export interface ResolveTicketInput {
  resolution: string;
}

export interface AddCommentInput {
  content: string;
  isInternal?: boolean;
  attachments?: string[];
}

export interface TicketFilter extends PaginationParams {
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  category?: "HR" | "IT" | "FINANCE" | "OTHER";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  assignedToId?: string;
  createdById?: string;
  search?: string;
}

type TicketWithComments = Prisma.TicketGetPayload<{
  include: { comments: true };
}>;

// ==========================================
// SERVICE CLASS
// ==========================================

export class TicketService {
  /**
   * Generate ticket number
   */
  private static async generateTicketNumber(tenantId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    // Count tickets created today
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const count = await prisma.ticket.count({
      where: {
        tenantId,
        createdAt: { gte: startOfDay },
      },
    });

    const sequence = (count + 1).toString().padStart(4, "0");
    return `TKT-${dateStr}-${sequence}`;
  }

  /**
   * Create a new ticket
   */
  static async create(
    context: RequestContext,
    data: CreateTicketInput
  ): Promise<ServiceResponse<TicketWithComments>> {
    const ticketNumber = await this.generateTicketNumber(context.tenantId);

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: context.tenantId,
        ticketNumber,
        createdById: context.userId,
        category: data.category,
        priority: data.priority || "NORMAL",
        subject: data.subject,
        description: data.description,
      },
      include: { comments: true },
    });

    // Send email notification to ticket creator
    await this.sendTicketCreatedEmail(ticket);

    // Notify admins about new ticket
    await this.notifyAdminsNewTicket(context.tenantId, ticket);

    return success(ticket);
  }

  /**
   * Get tickets with filters
   */
  static async getTickets(
    context: RequestContext,
    filter: TicketFilter
  ): Promise<ServiceResponse<TicketWithComments[]>> {
    const { page = 1, limit = 20, status, category, priority, assignedToId, createdById, search } = filter;

    const where: Prisma.TicketWhereInput = {
      tenantId: context.tenantId,
    };

    // Role-based filtering
    const isAdmin = ["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role);
    if (!isAdmin) {
      // Non-admins can only see their own tickets
      where.createdById = context.userId;
    }

    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (createdById && isAdmin) where.createdById = createdById;

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: { comments: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return success(tickets, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  /**
   * Get ticket by ID
   */
  static async getById(
    context: RequestContext,
    ticketId: string
  ): Promise<ServiceResponse<TicketWithComments>> {
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId: context.tenantId,
      },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
          where: this.getCommentFilter(context),
        },
      },
    });

    if (!ticket) {
      return error(ErrorCodes.NOT_FOUND, "Tiket tidak ditemukan");
    }

    // Check access
    const isAdmin = ["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role);
    if (!isAdmin && ticket.createdById !== context.userId) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke tiket ini");
    }

    return success(ticket);
  }

  /**
   * Update ticket
   */
  static async update(
    context: RequestContext,
    ticketId: string,
    data: UpdateTicketInput
  ): Promise<ServiceResponse<TicketWithComments>> {
    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId: context.tenantId },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Tiket tidak ditemukan");
    }

    // Only creator or admin can update
    const isAdmin = ["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role);
    if (!isAdmin && existing.createdById !== context.userId) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak dapat mengubah tiket ini");
    }

    // Can't update resolved/closed tickets
    if (["RESOLVED", "CLOSED"].includes(existing.status)) {
      return error(ErrorCodes.BAD_REQUEST, "Tidak dapat mengubah tiket yang sudah diselesaikan");
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...(data.category && { category: data.category }),
        ...(data.priority && { priority: data.priority }),
        ...(data.subject && { subject: data.subject }),
        ...(data.description && { description: data.description }),
        updatedAt: new Date(),
      },
      include: { comments: true },
    });

    return success(ticket);
  }

  /**
   * Assign ticket to admin/support
   */
  static async assign(
    context: RequestContext,
    ticketId: string,
    data: AssignTicketInput
  ): Promise<ServiceResponse<TicketWithComments>> {
    // Only admins can assign
    if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya admin yang dapat menugaskan tiket");
    }

    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId: context.tenantId },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Tiket tidak ditemukan");
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToId: data.assignedToId,
        status: "IN_PROGRESS",
        updatedAt: new Date(),
      },
      include: { comments: true },
    });

    // Notify assigned user
    await this.notifyAssignment(ticket, data.assignedToId);

    // Notify ticket creator
    await this.sendTicketUpdatedEmail(ticket, "Tiket Anda telah ditugaskan ke tim support");

    return success(ticket);
  }

  /**
   * Change ticket status
   */
  static async changeStatus(
    context: RequestContext,
    ticketId: string,
    newStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  ): Promise<ServiceResponse<TicketWithComments>> {
    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId: context.tenantId },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Tiket tidak ditemukan");
    }

    const isAdmin = ["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role);

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      OPEN: ["IN_PROGRESS", "CLOSED"],
      IN_PROGRESS: ["OPEN", "RESOLVED", "CLOSED"],
      RESOLVED: ["CLOSED", "OPEN"], // Can reopen if not satisfied
      CLOSED: [], // Can't change closed tickets
    };

    if (!validTransitions[existing.status]?.includes(newStatus)) {
      return error(
        ErrorCodes.BAD_REQUEST,
        `Tidak dapat mengubah status dari ${existing.status} ke ${newStatus}`
      );
    }

    // Only creator can reopen from RESOLVED
    if (existing.status === "RESOLVED" && newStatus === "OPEN") {
      if (existing.createdById !== context.userId && !isAdmin) {
        return error(ErrorCodes.FORBIDDEN, "Hanya pembuat tiket yang dapat membuka kembali");
      }
    } else if (!isAdmin) {
      return error(ErrorCodes.FORBIDDEN, "Hanya admin yang dapat mengubah status tiket");
    }

    const updateData: Prisma.TicketUpdateInput = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === "CLOSED") {
      updateData.closedAt = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: { comments: true },
    });

    // Notify creator of status change
    await this.sendTicketUpdatedEmail(ticket, `Status tiket diubah menjadi ${newStatus}`);

    return success(ticket);
  }

  /**
   * Resolve ticket
   */
  static async resolve(
    context: RequestContext,
    ticketId: string,
    data: ResolveTicketInput
  ): Promise<ServiceResponse<TicketWithComments>> {
    // Only admins can resolve
    if (!["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya admin yang dapat menyelesaikan tiket");
    }

    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId: context.tenantId },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Tiket tidak ditemukan");
    }

    if (existing.status === "CLOSED") {
      return error(ErrorCodes.BAD_REQUEST, "Tiket sudah ditutup");
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "RESOLVED",
        resolution: data.resolution,
        resolvedById: context.userId,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
      include: { comments: true },
    });

    // Send resolution email
    await this.sendTicketResolvedEmail(ticket);

    return success(ticket);
  }

  /**
   * Add comment to ticket
   */
  static async addComment(
    context: RequestContext,
    ticketId: string,
    data: AddCommentInput
  ): Promise<ServiceResponse<TicketWithComments>> {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId: context.tenantId },
    });

    if (!ticket) {
      return error(ErrorCodes.NOT_FOUND, "Tiket tidak ditemukan");
    }

    // Check access
    const isAdmin = ["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role);
    if (!isAdmin && ticket.createdById !== context.userId) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke tiket ini");
    }

    // Only admins can add internal comments
    if (data.isInternal && !isAdmin) {
      return error(ErrorCodes.FORBIDDEN, "Hanya admin yang dapat menambah catatan internal");
    }

    // Can't comment on closed tickets
    if (ticket.status === "CLOSED") {
      return error(ErrorCodes.BAD_REQUEST, "Tidak dapat menambah komentar pada tiket yang sudah ditutup");
    }

    await prisma.ticketComment.create({
      data: {
        ticketId,
        userId: context.userId,
        content: data.content,
        isInternal: data.isInternal || false,
        attachments: data.attachments as Prisma.InputJsonValue,
      },
    });

    // Update ticket timestamp
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
          where: this.getCommentFilter(context),
        },
      },
    });

    // Notify relevant parties
    if (!data.isInternal) {
      if (ticket.createdById !== context.userId) {
        // Admin commented, notify creator
        await this.sendTicketUpdatedEmail(updatedTicket, "Ada balasan baru pada tiket Anda");
      } else if (ticket.assignedToId) {
        // Creator commented, notify assigned admin
        await this.notifyAssignment(updatedTicket, ticket.assignedToId, "Ada balasan baru dari pemohon");
      }
    }

    return success(updatedTicket);
  }

  /**
   * Get comments for a ticket
   */
  static async getComments(
    context: RequestContext,
    ticketId: string
  ): Promise<ServiceResponse<Prisma.TicketCommentGetPayload<{}>[]>> {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId: context.tenantId },
    });

    if (!ticket) {
      return error(ErrorCodes.NOT_FOUND, "Tiket tidak ditemukan");
    }

    // Check access
    const isAdmin = ["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role);
    if (!isAdmin && ticket.createdById !== context.userId) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke tiket ini");
    }

    const comments = await prisma.ticketComment.findMany({
      where: {
        ticketId,
        ...this.getCommentFilter(context),
      },
      orderBy: { createdAt: "asc" },
    });

    return success(comments);
  }

  /**
   * Get comment filter based on user role
   */
  private static getCommentFilter(context: RequestContext): Prisma.TicketCommentWhereInput {
    const isAdmin = ["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role);
    if (isAdmin) {
      return {}; // Admins can see all comments
    }
    return { isInternal: false }; // Non-admins can't see internal comments
  }

  /**
   * Get ticket statistics for dashboard
   */
  static async getStats(
    context: RequestContext
  ): Promise<ServiceResponse<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }>> {
    const isAdmin = ["HRD", "IT_OPS", "SUPER_ADMIN"].includes(context.role);

    const where: Prisma.TicketWhereInput = {
      tenantId: context.tenantId,
    };

    if (!isAdmin) {
      where.createdById = context.userId;
    }

    const [total, open, inProgress, resolved, closed, byCategory, byPriority] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: "OPEN" } }),
      prisma.ticket.count({ where: { ...where, status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { ...where, status: "RESOLVED" } }),
      prisma.ticket.count({ where: { ...where, status: "CLOSED" } }),
      prisma.ticket.groupBy({
        by: ["category"],
        where,
        _count: { category: true },
      }),
      prisma.ticket.groupBy({
        by: ["priority"],
        where,
        _count: { priority: true },
      }),
    ]);

    return success({
      total,
      open,
      inProgress,
      resolved,
      closed,
      byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count.category])),
      byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count.priority])),
    });
  }

  // ==========================================
  // EMAIL NOTIFICATIONS
  // ==========================================

  private static async sendTicketCreatedEmail(ticket: TicketWithComments): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: ticket.createdById },
        include: { employee: true },
      });

      if (!user) return;

      await EmailQueueService.queueTemplate(
        "ticketCreated",
        { email: user.email, name: user.employee?.fullName },
        {
          employeeName: user.employee?.fullName || user.email,
          ticketNumber: ticket.ticketNumber,
          category: ticket.category,
          priority: ticket.priority,
          subject: ticket.subject,
          ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticket.id}`,
        }
      );
    } catch (err) {
      console.error("Failed to send ticket created email:", err);
    }
  }

  private static async sendTicketUpdatedEmail(
    ticket: TicketWithComments,
    comment: string
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: ticket.createdById },
        include: { employee: true },
      });

      if (!user) return;

      await EmailQueueService.queueTemplate(
        "ticketUpdated",
        { email: user.email, name: user.employee?.fullName },
        {
          employeeName: user.employee?.fullName || user.email,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          status: ticket.status,
          updatedBy: "Support Team",
          comment,
          ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticket.id}`,
        }
      );
    } catch (err) {
      console.error("Failed to send ticket updated email:", err);
    }
  }

  private static async sendTicketResolvedEmail(ticket: TicketWithComments): Promise<void> {
    try {
      const [user, resolver] = await Promise.all([
        prisma.user.findUnique({
          where: { id: ticket.createdById },
          include: { employee: true },
        }),
        ticket.resolvedById
          ? prisma.user.findUnique({
              where: { id: ticket.resolvedById },
              include: { employee: true },
            })
          : null,
      ]);

      if (!user) return;

      await EmailQueueService.queueTemplate(
        "ticketResolved",
        { email: user.email, name: user.employee?.fullName },
        {
          employeeName: user.employee?.fullName || user.email,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          resolvedBy: resolver?.employee?.fullName || "Support Team",
          resolution: ticket.resolution || "",
          ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticket.id}`,
        }
      );
    } catch (err) {
      console.error("Failed to send ticket resolved email:", err);
    }
  }

  private static async notifyAssignment(
    ticket: TicketWithComments,
    assignedToId: string,
    message?: string
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: assignedToId },
        include: { employee: true },
      });

      if (!user) return;

      await prisma.notification.create({
        data: {
          tenantId: ticket.tenantId,
          userId: assignedToId,
          type: "SYSTEM",
          title: message || "Tiket Baru Ditugaskan",
          message: `Tiket #${ticket.ticketNumber}: ${ticket.subject}`,
          link: `/admin/tickets/${ticket.id}`,
          objectType: "Ticket",
          objectId: ticket.id,
        },
      });
    } catch (err) {
      console.error("Failed to notify assignment:", err);
    }
  }

  private static async notifyAdminsNewTicket(
    tenantId: string,
    ticket: TicketWithComments
  ): Promise<void> {
    try {
      // Get admins based on ticket category
      const adminRoles: UserRole[] = ticket.category === "IT"
        ? [UserRole.IT_OPS, UserRole.SUPER_ADMIN]
        : [UserRole.HRD, UserRole.SUPER_ADMIN];

      const admins = await prisma.user.findMany({
        where: {
          tenantId,
          role: { in: adminRoles },
          status: "APPROVED",
        },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            tenantId,
            userId: admin.id,
            type: "SYSTEM",
            title: "Tiket Support Baru",
            message: `Tiket #${ticket.ticketNumber}: ${ticket.subject} (${ticket.priority})`,
            link: `/admin/tickets/${ticket.id}`,
            objectType: "Ticket",
            objectId: ticket.id,
          },
        });
      }
    } catch (err) {
      console.error("Failed to notify admins:", err);
    }
  }
}
