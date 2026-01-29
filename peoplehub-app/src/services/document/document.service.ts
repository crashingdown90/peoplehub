// @ai:cl - Document Management Service for employee documents
import { prisma } from "@/lib/db";
import { RequestContext } from "@/lib/tenant";
import { ServiceResponse, success, error, ErrorCodes, PaginationParams } from "../types";
export { DocumentType, DocumentStatus } from "@prisma/client";
import { Prisma, DocumentType, DocumentStatus, Document as PrismaDocument } from "@prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface UploadDocumentInput {
  employeeId?: string; // If not provided, use current user's employee
  type: DocumentType;
  name: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  validFrom?: Date | string;
  validUntil?: Date | string;
  isRequired?: boolean;
}

export interface UpdateDocumentInput {
  name?: string;
  description?: string;
  type?: DocumentType;
  validUntil?: Date | string | null;
  status?: DocumentStatus;
}

export interface DocumentFilter extends PaginationParams {
  employeeId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  search?: string;
  expiringSoon?: boolean; // Documents expiring within 30 days
}

export type DocumentWithRelations = PrismaDocument & {
  employee?: { fullName: string };
  uploadedBy?: { fullName: string };
};

// ==========================================
// SERVICE CLASS
// ==========================================

export class DocumentService {
  /**
   * Upload a document
   */
  static async upload(
    context: RequestContext,
    data: UploadDocumentInput
  ): Promise<ServiceResponse<PrismaDocument>> {
    const employeeId = data.employeeId || context.employeeId;

    if (!employeeId) {
      return error(ErrorCodes.VALIDATION_ERROR, "Employee ID diperlukan");
    }

    // Check if employee exists
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId: context.tenantId },
    });

    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }

    // Check permission
    if (!this.canUploadDocument(context, employeeId)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak dapat mengupload dokumen untuk karyawan ini");
    }

    const document = await prisma.document.create({
      data: {
        tenantId: context.tenantId,
        employeeId,
        type: data.type,
        name: data.name,
        description: data.description,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        status: data.isRequired ? "PENDING" : "APPROVED",
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        uploadedById: context.userId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DOCUMENT_UPLOADED",
        objectType: "Document",
        objectId: document.id,
        afterData: document as unknown as Prisma.InputJsonValue,
      },
    });

    return success(document);
  }

  /**
   * Get documents with filters
   */
  static async getDocuments(
    context: RequestContext,
    filter: DocumentFilter
  ): Promise<ServiceResponse<DocumentWithRelations[]>> {
    const { page = 1, limit = 20, employeeId, type, status, search, expiringSoon } = filter;

    const where: Prisma.DocumentWhereInput = {
      tenantId: context.tenantId,
      isActive: true,
      deletedAt: null,
    };

    // Role-based filtering
    if (context.role === "EMPLOYEE") {
      where.employeeId = context.employeeId;
    } else if (context.role === "MANAGER") {
      // Logic for manager seeing subordinates' documents can be complex, 
      // usually they see their own and their subordinates'
      const subordinates = await prisma.employee.findMany({
        where: { managerId: context.employeeId, tenantId: context.tenantId },
        select: { id: true },
      });
      const subordinateIds = [context.employeeId!, ...subordinates.map((s) => s.id)];
      where.employeeId = { in: subordinateIds };
    }

    if (employeeId) where.employeeId = employeeId;
    if (type) where.type = type;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.validUntil = {
        lte: thirtyDaysFromNow,
        gte: new Date(),
      };
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          employee: { select: { fullName: true } },
          uploadedBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return success(documents, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  /**
   * Get document by ID
   */
  static async getById(
    context: RequestContext,
    documentId: string
  ): Promise<ServiceResponse<DocumentWithRelations>> {
    const document = await prisma.document.findFirst({
      where: { id: documentId, tenantId: context.tenantId, deletedAt: null },
      include: {
        employee: { select: { fullName: true } },
        uploadedBy: { select: { fullName: true } },
      },
    });

    if (!document) {
      return error(ErrorCodes.NOT_FOUND, "Dokumen tidak ditemukan");
    }

    // Check access
    if (!this.canAccessDocument(context, document)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses ke dokumen ini");
    }

    return success(document);
  }

  /**
   * Update document metadata
   */
  static async update(
    context: RequestContext,
    documentId: string,
    data: UpdateDocumentInput
  ): Promise<ServiceResponse<PrismaDocument>> {
    const existing = await prisma.document.findFirst({
      where: { id: documentId, tenantId: context.tenantId, deletedAt: null },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Dokumen tidak ditemukan");
    }

    // Check permission
    if (!this.canModifyDocument(context, existing)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak dapat mengubah dokumen ini");
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.validUntil !== undefined && {
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
        }),
        ...(data.status && { status: data.status }),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DOCUMENT_UPDATED",
        objectType: "Document",
        objectId: documentId,
        beforeData: existing as unknown as Prisma.InputJsonValue,
        afterData: document as unknown as Prisma.InputJsonValue,
      },
    });

    return success(document);
  }

  /**
   * Delete document (soft delete)
   */
  static async delete(
    context: RequestContext,
    documentId: string
  ): Promise<ServiceResponse<void>> {
    const existing = await prisma.document.findFirst({
      where: { id: documentId, tenantId: context.tenantId, deletedAt: null },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Dokumen tidak ditemukan");
    }

    // Only admins or document owner can delete
    if (!["HRD", "SUPER_ADMIN"].includes(context.role) && existing.uploadedById !== context.userId) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak dapat menghapus dokumen ini");
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date(), isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DOCUMENT_DELETED",
        objectType: "Document",
        objectId: documentId,
        beforeData: existing as unknown as Prisma.InputJsonValue,
      },
    });

    return success(undefined);
  }

  /**
   * Approve document
   */
  static async approve(
    context: RequestContext,
    documentId: string
  ): Promise<ServiceResponse<PrismaDocument>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat menyetujui dokumen");
    }

    const existing = await prisma.document.findFirst({
      where: { id: documentId, tenantId: context.tenantId, deletedAt: null },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Dokumen tidak ditemukan");
    }

    if (existing.status !== "PENDING") {
      return error(ErrorCodes.BAD_REQUEST, "Dokumen sudah diproses");
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: { status: "APPROVED" },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DOCUMENT_APPROVED",
        objectType: "Document",
        objectId: documentId,
        afterData: document as unknown as Prisma.InputJsonValue,
      },
    });

    return success(document);
  }

  /**
   * Reject document
   */
  static async reject(
    context: RequestContext,
    documentId: string,
    reason: string
  ): Promise<ServiceResponse<PrismaDocument>> {
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat menolak dokumen");
    }

    const existing = await prisma.document.findFirst({
      where: { id: documentId, tenantId: context.tenantId, deletedAt: null },
    });

    if (!existing) {
      return error(ErrorCodes.NOT_FOUND, "Dokumen tidak ditemukan");
    }

    if (existing.status !== "PENDING") {
      return error(ErrorCodes.BAD_REQUEST, "Dokumen sudah diproses");
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: { status: "REJECTED", rejectionReason: reason },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DOCUMENT_REJECTED",
        objectType: "Document",
        objectId: documentId,
        afterData: document as unknown as Prisma.InputJsonValue,
      },
    });

    return success(document);
  }

  /**
   * Get document statistics
   */
  static async getStats(
    context: RequestContext,
    employeeId?: string
  ): Promise<ServiceResponse<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    expiringSoon: number;
    expired: number;
  }>> {
    const where: Prisma.DocumentWhereInput = {
      tenantId: context.tenantId,
      isActive: true,
      deletedAt: null,
    };

    if (employeeId) where.employeeId = employeeId;
    else if (context.role === "EMPLOYEE") where.employeeId = context.employeeId;

    const documents = await prisma.document.findMany({ where });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const stats = {
      total: documents.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      expiringSoon: 0,
      expired: 0,
    };

    for (const doc of documents) {
      stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
      stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;

      if (doc.validUntil) {
        const expiry = new Date(doc.validUntil);
        if (expiry < now) {
          stats.expired++;
        } else if (expiry <= thirtyDaysFromNow) {
          stats.expiringSoon++;
        }
      }
    }

    return success(stats);
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private static canUploadDocument(context: RequestContext, employeeId: string): boolean {
    if (["HRD", "SUPER_ADMIN"].includes(context.role)) return true;
    if (context.employeeId === employeeId) return true;
    return false;
  }

  private static canAccessDocument(context: RequestContext, document: PrismaDocument): boolean {
    if (["HRD", "SUPER_ADMIN", "IT_OPS"].includes(context.role)) return true;
    if (document.employeeId === context.employeeId) return true;
    if (document.uploadedById === context.userId) return true;
    
    // Managers can access subordinates' documents if scope allows
    // This is simplified; real logic would check ManagerId
    return false; 
  }

  private static canModifyDocument(context: RequestContext, document: PrismaDocument): boolean {
    if (["HRD", "SUPER_ADMIN"].includes(context.role)) return true;
    if (document.uploadedById === context.userId && document.status === "PENDING") return true;
    return false;
  }
}
