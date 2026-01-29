// @ai:cl - Prisma middleware for automatic audit logging using extensions
import { PrismaClient } from "@prisma/client";

// Tables that should be audited
const AUDITABLE_TABLES = [
    "employee",
    "attendance",
    "leaveRequest",
    "payslip",
    "travelRequest",
    "reimburseRequest",
    "kpiTarget",
    "user",
    "announcement",
    "ticket",
    "document",
] as const;

type AuditableTable = (typeof AUDITABLE_TABLES)[number];

// Context for audit (set per-request via AsyncLocalStorage)
interface AuditContext {
    tenantId: string;
    actorId: string;
    ipAddress?: string;
    userAgent?: string;
}

// AsyncLocalStorage for request context
import { AsyncLocalStorage } from "async_hooks";
export const auditContextStorage = new AsyncLocalStorage<AuditContext>();

/**
 * Set audit context for the current request
 * Call this at the start of each API request
 */
export function setAuditContext(context: AuditContext): void {
    auditContextStorage.enterWith(context);
}

/**
 * Get current audit context
 */
export function getAuditContext(): AuditContext | undefined {
    return auditContextStorage.getStore();
}

/**
 * Check if a model should be audited
 */
function isAuditableModel(model: string): model is AuditableTable {
    return AUDITABLE_TABLES.includes(model.toLowerCase() as AuditableTable);
}

/**
 * Map Prisma model name to ObjectType for audit log
 */
function getObjectType(model: string): string {
    // Convert camelCase to PascalCase
    return model.charAt(0).toUpperCase() + model.slice(1);
}

/**
 * Create audit log entry (helper function)
 */
async function createAuditEntry(
    prisma: PrismaClient,
    data: {
        tenantId: string;
        actorId: string;
        action: string;
        objectType: string;
        objectId?: string | null;
        beforeData?: Record<string, unknown> | null;
        afterData?: Record<string, unknown> | null;
        ipAddress?: string;
        userAgent?: string;
    }
): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                tenantId: data.tenantId,
                actorId: data.actorId,
                action: data.action,
                objectType: data.objectType,
                objectId: data.objectId || null,
                beforeData: data.beforeData
                    ? JSON.parse(JSON.stringify(data.beforeData))
                    : undefined,
                afterData: data.afterData
                    ? JSON.parse(JSON.stringify(data.afterData))
                    : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    } catch (error) {
        console.error(`[AuditMiddleware] Failed to create audit log:`, error);
    }
}

/**
 * Helper to get before data for update/delete operations
 */
async function getBeforeData(
    prisma: PrismaClient,
    model: string,
    where: unknown
): Promise<{ data: Record<string, unknown> | null; id: string | null }> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modelDelegate = (prisma as any)[model];
        if (modelDelegate?.findFirst) {
            const existingRecord = await modelDelegate.findFirst({ where });
            if (existingRecord) {
                return { data: existingRecord, id: existingRecord.id };
            }
        }
    } catch (error) {
        console.warn(
            `[AuditMiddleware] Failed to fetch before data for ${model}:`,
            error
        );
    }
    return { data: null, id: null };
}

/**
 * Create Prisma client with audit extension
 * This wraps the client to add audit logging for CREATE, UPDATE, DELETE operations
 */
export function withAuditExtension<T extends PrismaClient>(
    prisma: T
): T {
    return prisma.$extends({
        query: {
            $allModels: {
                async create({ model, args, query }) {
                    const result = await query(args);
                    const context = getAuditContext();

                    if (context && isAuditableModel(model)) {
                        setImmediate(() => {
                            createAuditEntry(prisma, {
                                tenantId: context.tenantId,
                                actorId: context.actorId,
                                action: "CREATE",
                                objectType: getObjectType(model),
                                objectId: (result as { id?: string })?.id,
                                afterData: result as Record<string, unknown>,
                                ipAddress: context.ipAddress,
                                userAgent: context.userAgent,
                            });
                        });
                    }

                    return result;
                },

                async update({ model, args, query }) {
                    const context = getAuditContext();
                    let beforeData: Record<string, unknown> | null = null;
                    let recordId: string | null = null;

                    if (context && isAuditableModel(model) && args.where) {
                        const before = await getBeforeData(prisma, model, args.where);
                        beforeData = before.data;
                        recordId = before.id;
                    }

                    const result = await query(args);

                    if (context && isAuditableModel(model)) {
                        setImmediate(() => {
                            createAuditEntry(prisma, {
                                tenantId: context.tenantId,
                                actorId: context.actorId,
                                action: "UPDATE",
                                objectType: getObjectType(model),
                                objectId: recordId || (result as { id?: string })?.id,
                                beforeData,
                                afterData: result as Record<string, unknown>,
                                ipAddress: context.ipAddress,
                                userAgent: context.userAgent,
                            });
                        });
                    }

                    return result;
                },

                async delete({ model, args, query }) {
                    const context = getAuditContext();
                    let beforeData: Record<string, unknown> | null = null;
                    let recordId: string | null = null;

                    if (context && isAuditableModel(model) && args.where) {
                        const before = await getBeforeData(prisma, model, args.where);
                        beforeData = before.data;
                        recordId = before.id;
                    }

                    const result = await query(args);

                    if (context && isAuditableModel(model)) {
                        setImmediate(() => {
                            createAuditEntry(prisma, {
                                tenantId: context.tenantId,
                                actorId: context.actorId,
                                action: "DELETE",
                                objectType: getObjectType(model),
                                objectId: recordId,
                                beforeData,
                                ipAddress: context.ipAddress,
                                userAgent: context.userAgent,
                            });
                        });
                    }

                    return result;
                },
            },
        },
    }) as T;
}

/**
 * Manual audit log creation for bulk operations or special cases
 */
export async function createManualAuditLog(
    prisma: PrismaClient,
    data: {
        tenantId: string;
        actorId: string;
        action: "CREATE" | "UPDATE" | "DELETE";
        objectType: string;
        objectId?: string;
        beforeData?: Record<string, unknown>;
        afterData?: Record<string, unknown>;
        ipAddress?: string;
        userAgent?: string;
    }
): Promise<void> {
    await createAuditEntry(prisma, data);
}
