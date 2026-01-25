// @ai:cl - Document Management Service for employee documents
import { prisma } from "@/lib/db";
import { RequestContext } from "@/lib/tenant";
import { ServiceResponse, success, error, ErrorCodes, PaginationParams } from "../types";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

// ==========================================
// TYPES
// ==========================================

export type DocumentCategory =
  | "PERSONAL"
  | "CONTRACT"
  | "CERTIFICATE"
  | "TRAINING"
  | "PERFORMANCE"
  | "MEDICAL"
  | "OTHER";

export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface UploadDocumentInput {
  employeeId?: string; // If not provided, use current user's employee
  category: DocumentCategory;
  name: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  expiryDate?: Date | string;
  isRequired?: boolean;
}

export interface UpdateDocumentInput {
  name?: string;
  description?: string;
  category?: DocumentCategory;
  expiryDate?: Date | string | null;
  status?: DocumentStatus;
}

export interface DocumentFilter extends PaginationParams {
  employeeId?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  search?: string;
  expiringSoon?: boolean; // Documents expiring within 30 days
}

export interface Document {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  category: DocumentCategory;
  name: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  expiryDate?: Date;
  uploadedById: string;
  uploadedByName?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  version: number;
  previousVersionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  ): Promise<ServiceResponse<Document>> {
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
    const canUpload = this.canUploadDocument(context, employeeId);
    if (!canUpload) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak dapat mengupload dokumen untuk karyawan ini");
    }

    const documentId = this.generateDocumentId();

    const document: Document = {
      id: documentId,
      tenantId: context.tenantId,
      employeeId,
      employeeName: employee.fullName,
      category: data.category,
      name: data.name,
      description: data.description,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      status: data.isRequired ? "PENDING" : "APPROVED",
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      uploadedById: context.userId,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DOCUMENT_UPLOADED",
        objectType: "Document",
        objectId: documentId,
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
  ): Promise<ServiceResponse<Document[]>> {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        action: "DOCUMENT_UPLOADED",
      },
      orderBy: { createdAt: "desc" },
    });

    let documents: Document[] = logs.map((log) => log.afterData as unknown as Document);

    // Apply updates
    documents = await this.applyDocumentUpdates(context.tenantId, documents);

    // Filter deleted documents
    documents = documents.filter((d) => d.status !== "REJECTED" || filter.status === "REJECTED");

    // Apply role-based filtering
    if (context.role === "EMPLOYEE") {
      documents = documents.filter((d) => d.employeeId === context.employeeId);
    } else if (context.role === "MANAGER") {
      const subordinates = await prisma.employee.findMany({
        where: { managerId: context.employeeId, tenantId: context.tenantId },
        select: { id: true },
      });
      const subordinateIds = [context.employeeId!, ...subordinates.map((s) => s.id)];
      documents = documents.filter((d) => subordinateIds.includes(d.employeeId));
    }

    // Apply filters
    if (filter.employeeId) {
      documents = documents.filter((d) => d.employeeId === filter.employeeId);
    }
    if (filter.category) {
      documents = documents.filter((d) => d.category === filter.category);
    }
    if (filter.status) {
      documents = documents.filter((d) => d.status === filter.status);
    }
    if (filter.search) {
      const search = filter.search.toLowerCase();
      documents = documents.filter(
        (d) =>
          d.name.toLowerCase().includes(search) ||
          d.description?.toLowerCase().includes(search)
      );
    }
    if (filter.expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      documents = documents.filter(
        (d) => d.expiryDate && new Date(d.expiryDate) <= thirtyDaysFromNow
      );
    }

    // Pagination
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const start = (page - 1) * limit;
    const paginatedDocs = documents.slice(start, start + limit);

    return success(paginatedDocs, {
      page,
      limit,
      total: documents.length,
      totalPages: Math.ceil(documents.length / limit),
    });
  }

  /**
   * Get document by ID
   */
  static async getById(
    context: RequestContext,
    documentId: string
  ): Promise<ServiceResponse<Document>> {
    const document = await this.getDocument(context.tenantId, documentId);

    if (!document) {
      return error(ErrorCodes.NOT_FOUND, "Dokumen tidak ditemukan");
    }

    // Check access
    const canAccess = this.canAccessDocument(context, document);
    if (!canAccess) {
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
  ): Promise<ServiceResponse<Document>> {
    const document = await this.getDocument(context.tenantId, documentId);

    if (!document) {
      return error(ErrorCodes.NOT_FOUND, "Dokumen tidak ditemukan");
    }

    // Check permission
    const canUpdate = this.canModifyDocument(context, document);
    if (!canUpdate) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak dapat mengubah dokumen ini");
    }

    const updatedDocument: Document = {
      ...document,
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category && { category: data.category }),
      ...(data.expiryDate !== undefined && {
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      }),
      ...(data.status && { status: data.status }),
      updatedAt: new Date(),
    };

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DOCUMENT_UPDATED",
        objectType: "Document",
        objectId: documentId,
        beforeData: document as unknown as Prisma.InputJsonValue,
        afterData: updatedDocument as unknown as Prisma.InputJsonValue,
      },
    });

    return success(updatedDocument);
  }

  /**
   * Delete document
   */
  static async delete(
    context: RequestContext,
    documentId: string
  ): Promise<ServiceResponse<void>> {
    const document = await this.getDocument(context.tenantId, documentId);

    if (!document) {
      return error(ErrorCodes.NOT_FOUND, "Dokumen tidak ditemukan");
    }

    // Only admins or document owner can delete
    if (!["HRD", "SUPER_ADMIN"].includes(context.role) && document.uploadedById !== context.userId) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak dapat menghapus dokumen ini");
    }

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DOCUMENT_DELETED",
        objectType: "Document",
        objectId: documentId,
        beforeData: document as unknown as Prisma.InputJsonValue,
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
  ): Promise<ServiceResponse<Document>> {
    // Only admins can approve
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat menyetujui dokumen");
    }

    const document = await this.getDocument(context.tenantId, documentId);

    if (!document) {
      return error(ErrorCodes.NOT_FOUND, "Dokumen tidak ditemukan");
    }

    if (document.status !== "PENDING") {
      return error(ErrorCodes.BAD_REQUEST, "Dokumen sudah diproses");
    }

    const user = await prisma.user.findFirst({
      where: { id: context.userId },
      include: { employee: true },
    });

    const updatedDocument: Document = {
      ...document,
      status: "APPROVED",
      approvedById: context.userId,
      approvedByName: user?.employee?.fullName,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DOCUMENT_APPROVED",
        objectType: "Document",
        objectId: documentId,
        afterData: updatedDocument as unknown as Prisma.InputJsonValue,
      },
    });

    return success(updatedDocument);
  }

  /**
   * Reject document
   */
  static async reject(
    context: RequestContext,
    documentId: string,
    reason: string
  ): Promise<ServiceResponse<Document>> {
    // Only admins can reject
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat menolak dokumen");
    }

    const document = await this.getDocument(context.tenantId, documentId);

    if (!document) {
      return error(ErrorCodes.NOT_FOUND, "Dokumen tidak ditemukan");
    }

    if (document.status !== "PENDING") {
      return error(ErrorCodes.BAD_REQUEST, "Dokumen sudah diproses");
    }

    const updatedDocument: Document = {
      ...document,
      status: "REJECTED",
      rejectionReason: reason,
      updatedAt: new Date(),
    };

    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "DOCUMENT_REJECTED",
        objectType: "Document",
        objectId: documentId,
        afterData: updatedDocument as unknown as Prisma.InputJsonValue,
      },
    });

    return success(updatedDocument);
  }

  /**
   * Get document statistics
   */
  static async getStats(
    context: RequestContext,
    employeeId?: string
  ): Promise<ServiceResponse<{
    total: number;
    byCategory: Record<DocumentCategory, number>;
    byStatus: Record<DocumentStatus, number>;
    expiringSoon: number;
    expired: number;
  }>> {
    const filter: DocumentFilter = employeeId ? { employeeId } : {};
    const result = await this.getDocuments(context, { ...filter, limit: 10000 });

    if (!result.success) {
      return error(result.error!.code, result.error!.message);
    }

    const documents = result.data!;
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const stats = {
      total: documents.length,
      byCategory: {
        PERSONAL: 0,
        CONTRACT: 0,
        CERTIFICATE: 0,
        TRAINING: 0,
        PERFORMANCE: 0,
        MEDICAL: 0,
        OTHER: 0,
      } as Record<DocumentCategory, number>,
      byStatus: {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        EXPIRED: 0,
      } as Record<DocumentStatus, number>,
      expiringSoon: 0,
      expired: 0,
    };

    for (const doc of documents) {
      stats.byCategory[doc.category]++;
      stats.byStatus[doc.status]++;

      if (doc.expiryDate) {
        const expiry = new Date(doc.expiryDate);
        if (expiry < now) {
          stats.expired++;
        } else if (expiry <= thirtyDaysFromNow) {
          stats.expiringSoon++;
        }
      }
    }

    return success(stats);
  }

  /**
   * Get required documents for an employee
   */
  static async getRequiredDocuments(
    context: RequestContext,
    employeeId: string
  ): Promise<ServiceResponse<{
    required: { category: DocumentCategory; name: string; uploaded: boolean }[];
    completionRate: number;
  }>> {
    const requiredDocs: { category: DocumentCategory; name: string }[] = [
      { category: "PERSONAL", name: "KTP" },
      { category: "PERSONAL", name: "Kartu Keluarga" },
      { category: "PERSONAL", name: "NPWP" },
      { category: "CONTRACT", name: "Kontrak Kerja" },
      { category: "CERTIFICATE", name: "Ijazah" },
      { category: "MEDICAL", name: "Surat Keterangan Sehat" },
    ];

    const result = await this.getDocuments(context, { employeeId, status: "APPROVED", limit: 100 });
    const uploadedDocs = result.success ? result.data! : [];

    const required = requiredDocs.map((req) => ({
      ...req,
      uploaded: uploadedDocs.some(
        (d) => d.category === req.category && d.name.toLowerCase().includes(req.name.toLowerCase())
      ),
    }));

    const uploadedCount = required.filter((r) => r.uploaded).length;
    const completionRate = (uploadedCount / required.length) * 100;

    return success({ required, completionRate: Math.round(completionRate) });
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private static generateDocumentId(): string {
    return `doc-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  }

  private static canUploadDocument(context: RequestContext, employeeId: string): boolean {
    if (["HRD", "SUPER_ADMIN"].includes(context.role)) return true;
    if (context.employeeId === employeeId) return true;
    return false;
  }

  private static canAccessDocument(context: RequestContext, document: Document): boolean {
    if (["HRD", "SUPER_ADMIN"].includes(context.role)) return true;
    if (document.employeeId === context.employeeId) return true;
    if (document.uploadedById === context.userId) return true;
    return false;
  }

  private static canModifyDocument(context: RequestContext, document: Document): boolean {
    if (["HRD", "SUPER_ADMIN"].includes(context.role)) return true;
    if (document.uploadedById === context.userId && document.status === "PENDING") return true;
    return false;
  }

  private static async getDocument(tenantId: string, documentId: string): Promise<Document | null> {
    const uploadLog = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        objectType: "Document",
        objectId: documentId,
        action: "DOCUMENT_UPLOADED",
      },
    });

    if (!uploadLog) return null;

    let document = uploadLog.afterData as unknown as Document;

    // Check for deletion
    const deleteLog = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        objectType: "Document",
        objectId: documentId,
        action: "DOCUMENT_DELETED",
        createdAt: { gt: uploadLog.createdAt },
      },
    });

    if (deleteLog) return null;

    // Apply updates
    const updateLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        objectType: "Document",
        objectId: documentId,
        action: { in: ["DOCUMENT_UPDATED", "DOCUMENT_APPROVED", "DOCUMENT_REJECTED"] },
        createdAt: { gt: uploadLog.createdAt },
      },
      orderBy: { createdAt: "asc" },
    });

    for (const log of updateLogs) {
      document = log.afterData as unknown as Document;
    }

    return document;
  }

  private static async applyDocumentUpdates(
    tenantId: string,
    documents: Document[]
  ): Promise<Document[]> {
    const result: Document[] = [];

    for (const doc of documents) {
      const updated = await this.getDocument(tenantId, doc.id);
      if (updated) {
        result.push(updated);
      }
    }

    return result;
  }
}
