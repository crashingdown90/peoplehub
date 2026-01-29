// @ai:cl - Offboarding Service with workflow and checklist management
import { prisma } from "@/lib/db";
import { RequestContext } from "@/lib/tenant";
import { ServiceResponse, success, error, ErrorCodes, PaginationParams } from "../types";
import { Prisma } from "@prisma/client";
import { WebhookService } from "../webhook";
import { EmailQueueService } from "../email";

// ==========================================
// TYPES
// ==========================================

export type OffboardingStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type TerminationType = "RESIGNATION" | "TERMINATION" | "END_OF_CONTRACT" | "RETIREMENT" | "LAYOFF";

export interface OffboardingTask {
  id: string;
  name: string;
  description?: string;
  category: "HANDOVER" | "IT_ASSETS" | "FINANCE" | "DOCUMENTS" | "EXIT_INTERVIEW" | "OTHER";
  assignedTo: "EMPLOYEE" | "HRD" | "IT" | "FINANCE" | "MANAGER";
  isRequired: boolean;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

export interface OffboardingChecklist {
  id: string;
  employeeId: string;
  employeeName: string;
  terminationType: TerminationType;
  lastWorkingDate: Date;
  reason: string;
  status: OffboardingStatus;
  tasks: OffboardingTask[];
  progress: number;
  exitInterviewNotes?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CreateOffboardingInput {
  employeeId: string;
  terminationType: TerminationType;
  lastWorkingDate: Date | string;
  reason: string;
  customTasks?: Omit<OffboardingTask, "id" | "completedAt" | "completedBy" | "notes">[];
}

export interface UpdateOffboardingTaskInput {
  completed?: boolean;
  notes?: string;
}

export interface CompleteExitInterviewInput {
  notes: string;
  feedback?: {
    overallSatisfaction: number; // 1-5
    wouldRecommend: boolean;
    suggestions?: string;
  };
}

export interface OffboardingFilter extends PaginationParams {
  status?: OffboardingStatus;
  terminationType?: TerminationType;
  employeeId?: string;
  branchId?: string;
  departmentId?: string;
}

// Default offboarding tasks
const DEFAULT_OFFBOARDING_TASKS: Omit<OffboardingTask, "id" | "completedAt" | "completedBy" | "notes">[] = [
  // Handover
  { name: "Serah terima pekerjaan ke pengganti", category: "HANDOVER", assignedTo: "EMPLOYEE", isRequired: true },
  { name: "Dokumentasi proses kerja", category: "HANDOVER", assignedTo: "EMPLOYEE", isRequired: true },
  { name: "Transfer akses file/folder", category: "HANDOVER", assignedTo: "EMPLOYEE", isRequired: true },

  // IT Assets
  { name: "Kembalikan laptop/komputer", category: "IT_ASSETS", assignedTo: "IT", isRequired: true },
  { name: "Kembalikan perangkat lain (mouse, keyboard, dll)", category: "IT_ASSETS", assignedTo: "IT", isRequired: false },
  { name: "Nonaktifkan akun email", category: "IT_ASSETS", assignedTo: "IT", isRequired: true },
  { name: "Cabut akses sistem internal", category: "IT_ASSETS", assignedTo: "IT", isRequired: true },
  { name: "Kembalikan kartu akses/ID card", category: "IT_ASSETS", assignedTo: "HRD", isRequired: true },

  // Finance
  { name: "Selesaikan reimburse yang pending", category: "FINANCE", assignedTo: "FINANCE", isRequired: true },
  { name: "Kalkulasi gaji terakhir", category: "FINANCE", assignedTo: "FINANCE", isRequired: true },
  { name: "Kalkulasi THR prorata (jika ada)", category: "FINANCE", assignedTo: "FINANCE", isRequired: false },
  { name: "Lunasi pinjaman perusahaan (jika ada)", category: "FINANCE", assignedTo: "FINANCE", isRequired: false },

  // Documents
  { name: "Buat surat keterangan kerja", category: "DOCUMENTS", assignedTo: "HRD", isRequired: true },
  { name: "Buat surat referensi (jika diminta)", category: "DOCUMENTS", assignedTo: "HRD", isRequired: false },
  { name: "Update data BPJS", category: "DOCUMENTS", assignedTo: "HRD", isRequired: true },
  { name: "Arsipkan dokumen karyawan", category: "DOCUMENTS", assignedTo: "HRD", isRequired: true },

  // Exit Interview
  { name: "Jadwalkan exit interview", category: "EXIT_INTERVIEW", assignedTo: "HRD", isRequired: true },
  { name: "Lakukan exit interview", category: "EXIT_INTERVIEW", assignedTo: "HRD", isRequired: true },
];

// ==========================================
// SERVICE CLASS
// ==========================================

export class OffboardingService {
  /**
   * Start offboarding process for an employee
   */
  static async create(
    context: RequestContext,
    data: CreateOffboardingInput
  ): Promise<ServiceResponse<OffboardingChecklist>> {
    // Only admins can create offboarding
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat membuat proses offboarding");
    }

    // Verify employee exists
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId: context.tenantId },
      include: { user: true },
    });

    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }

    if (employee.status === "TERMINATED") {
      return error(ErrorCodes.BAD_REQUEST, "Karyawan sudah tidak aktif");
    }

    // Check if offboarding already exists
    const existing = await this.getOffboardingData(context.tenantId, data.employeeId);
    if (existing && existing.status !== "CANCELLED") {
      return error(ErrorCodes.CONFLICT, "Proses offboarding sudah berjalan untuk karyawan ini");
    }

    const lastWorkingDate = new Date(data.lastWorkingDate);
    const tasks = data.customTasks || DEFAULT_OFFBOARDING_TASKS;

    // Create tasks with IDs
    const tasksWithIds: OffboardingTask[] = tasks.map((task, index) => ({
      ...task,
      id: `task-${index + 1}`,
    }));

    // Update employee status
    await prisma.employee.update({
      where: { id: data.employeeId },
      data: {
        endDate: lastWorkingDate,
        updatedAt: new Date(),
      },
    });

    // Create audit log with offboarding data
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "OFFBOARDING_STARTED",
        objectType: "Offboarding",
        objectId: data.employeeId,
        afterData: JSON.parse(JSON.stringify({
          employeeId: data.employeeId,
          terminationType: data.terminationType,
          lastWorkingDate: lastWorkingDate.toISOString(),
          reason: data.reason,
          status: "IN_PROGRESS",
          tasks: tasksWithIds,
        })),
      },
    });

    const checklist: OffboardingChecklist = {
      id: data.employeeId,
      employeeId: data.employeeId,
      employeeName: employee.fullName,
      terminationType: data.terminationType,
      lastWorkingDate,
      reason: data.reason,
      status: "IN_PROGRESS",
      tasks: tasksWithIds,
      progress: 0,
      createdAt: new Date(),
    };

    // Send notification email
    await this.sendOffboardingNotification(employee, checklist);

    // Trigger webhook
    await WebhookService.trigger(context.tenantId, "employee.terminated", {
      employeeId: employee.id,
      employeeName: employee.fullName,
      terminationType: data.terminationType,
      lastWorkingDate: lastWorkingDate.toISOString(),
    });

    return success(checklist);
  }

  /**
   * Get offboarding checklist for an employee
   */
  static async getByEmployeeId(
    context: RequestContext,
    employeeId: string
  ): Promise<ServiceResponse<OffboardingChecklist | null>> {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId: context.tenantId },
    });

    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }

    // Check access
    if (context.role === "EMPLOYEE" && employeeId !== context.employeeId) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    const offboarding = await this.getOffboardingData(context.tenantId, employeeId);
    return success(offboarding);
  }

  /**
   * Update a task in the offboarding checklist
   */
  static async updateTask(
    context: RequestContext,
    employeeId: string,
    taskId: string,
    data: UpdateOffboardingTaskInput
  ): Promise<ServiceResponse<OffboardingChecklist>> {
    const offboarding = await this.getOffboardingData(context.tenantId, employeeId);

    if (!offboarding) {
      return error(ErrorCodes.NOT_FOUND, "Proses offboarding tidak ditemukan");
    }

    if (offboarding.status === "COMPLETED" || offboarding.status === "CANCELLED") {
      return error(ErrorCodes.BAD_REQUEST, "Proses offboarding sudah selesai atau dibatalkan");
    }

    const taskIndex = offboarding.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return error(ErrorCodes.NOT_FOUND, "Task tidak ditemukan");
    }

    const task = offboarding.tasks[taskIndex];

    // Check if user can update this task
    const canUpdate = this.canUpdateTask(context, task);
    if (!canUpdate) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses untuk mengubah task ini");
    }

    // Update task
    if (data.completed !== undefined) {
      if (data.completed) {
        task.completedAt = new Date();
        task.completedBy = context.userId;
      } else {
        task.completedAt = undefined;
        task.completedBy = undefined;
      }
    }

    if (data.notes !== undefined) {
      task.notes = data.notes;
    }

    offboarding.tasks[taskIndex] = task;

    // Calculate progress
    const completedTasks = offboarding.tasks.filter((t) => t.completedAt).length;
    offboarding.progress = Math.round((completedTasks / offboarding.tasks.length) * 100);

    // Check if all required tasks are completed
    const requiredTasks = offboarding.tasks.filter((t) => t.isRequired);
    const completedRequired = requiredTasks.filter((t) => t.completedAt).length;

    if (completedRequired === requiredTasks.length) {
      offboarding.status = "COMPLETED";
      offboarding.completedAt = new Date();

      // Update employee status to TERMINATED
      await prisma.employee.update({
        where: { id: employeeId },
        data: { status: "TERMINATED" },
      });

      // Deactivate user
      await prisma.user.update({
        where: { id: offboarding.employeeId },
        data: { status: "SUSPENDED" },
      });
    }

    // Update audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "OFFBOARDING_TASK_UPDATED",
        objectType: "Offboarding",
        objectId: employeeId,
        afterData: JSON.parse(JSON.stringify({
          taskId,
          completed: data.completed,
          progress: offboarding.progress,
          status: offboarding.status,
        })),
      },
    });

    return success(offboarding);
  }

  /**
   * Complete exit interview
   */
  static async completeExitInterview(
    context: RequestContext,
    employeeId: string,
    data: CompleteExitInterviewInput
  ): Promise<ServiceResponse<OffboardingChecklist>> {
    // Only HRD can complete exit interview
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat menyelesaikan exit interview");
    }

    const offboarding = await this.getOffboardingData(context.tenantId, employeeId);

    if (!offboarding) {
      return error(ErrorCodes.NOT_FOUND, "Proses offboarding tidak ditemukan");
    }

    offboarding.exitInterviewNotes = data.notes;

    // Update audit log with exit interview data
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "EXIT_INTERVIEW_COMPLETED",
        objectType: "Offboarding",
        objectId: employeeId,
        afterData: JSON.parse(JSON.stringify({
          notes: data.notes,
          feedback: data.feedback,
          completedAt: new Date().toISOString(),
        })),
      },
    });

    // Mark exit interview tasks as completed
    const exitInterviewTasks = offboarding.tasks.filter((t) => t.category === "EXIT_INTERVIEW");
    for (const task of exitInterviewTasks) {
      if (!task.completedAt) {
        await this.updateTask(context, employeeId, task.id, { completed: true });
      }
    }

    return success(offboarding);
  }

  /**
   * Get all offboarding checklists with filters
   */
  static async getAll(
    context: RequestContext,
    filter: OffboardingFilter
  ): Promise<ServiceResponse<OffboardingChecklist[]>> {
    // Only admins can view all offboardings
    if (!["HRD", "SUPER_ADMIN", "MANAGER"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    const { page = 1, limit = 20, status, terminationType, employeeId, branchId, departmentId } = filter;

    const where: Prisma.EmployeeWhereInput = {
      tenantId: context.tenantId,
      endDate: { not: null },
    };

    if (employeeId) where.id = employeeId;
    if (branchId) where.branchId = branchId;
    if (departmentId) where.departmentId = departmentId;

    // For managers, only show their team
    if (context.role === "MANAGER") {
      where.managerId = context.employeeId;
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { endDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const offboardings: OffboardingChecklist[] = [];

    for (const employee of employees) {
      const offboarding = await this.getOffboardingData(context.tenantId, employee.id);
      if (offboarding) {
        if (!status || offboarding.status === status) {
          if (!terminationType || offboarding.terminationType === terminationType) {
            offboardings.push(offboarding);
          }
        }
      }
    }

    return success(offboardings);
  }

  /**
   * Cancel offboarding process
   */
  static async cancel(
    context: RequestContext,
    employeeId: string,
    reason: string
  ): Promise<ServiceResponse<void>> {
    // Only admins can cancel
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat membatalkan proses offboarding");
    }

    const offboarding = await this.getOffboardingData(context.tenantId, employeeId);

    if (!offboarding) {
      return error(ErrorCodes.NOT_FOUND, "Proses offboarding tidak ditemukan");
    }

    if (offboarding.status === "COMPLETED") {
      return error(ErrorCodes.BAD_REQUEST, "Proses offboarding sudah selesai");
    }

    // Reset employee end date
    await prisma.employee.update({
      where: { id: employeeId },
      data: { endDate: null },
    });

    // Update audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "OFFBOARDING_CANCELLED",
        objectType: "Offboarding",
        objectId: employeeId,
        afterData: JSON.parse(JSON.stringify({ reason, cancelledAt: new Date().toISOString() })),
      },
    });

    return success(undefined);
  }

  /**
   * Get offboarding statistics
   */
  static async getStats(
    context: RequestContext,
    year?: number
  ): Promise<ServiceResponse<{
    total: number;
    byType: Record<TerminationType, number>;
    byMonth: Record<string, number>;
    averageCompletionDays: number;
  }>> {
    // Only admins can view stats
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    const targetYear = year || new Date().getFullYear();

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        action: "OFFBOARDING_STARTED",
        createdAt: {
          gte: new Date(targetYear, 0, 1),
          lt: new Date(targetYear + 1, 0, 1),
        },
      },
    });

    const stats = {
      total: logs.length,
      byType: {
        RESIGNATION: 0,
        TERMINATION: 0,
        END_OF_CONTRACT: 0,
        RETIREMENT: 0,
        LAYOFF: 0,
      } as Record<TerminationType, number>,
      byMonth: {} as Record<string, number>,
      averageCompletionDays: 0,
    };

    for (const log of logs) {
      const data = log.afterData as unknown as { terminationType: TerminationType };
      if (data.terminationType) {
        stats.byType[data.terminationType]++;
      }

      const month = log.createdAt.toISOString().slice(0, 7); // YYYY-MM
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    }

    return success(stats);
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  /**
   * Get offboarding data from audit logs
   */
  private static async getOffboardingData(
    tenantId: string,
    employeeId: string
  ): Promise<OffboardingChecklist | null> {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        objectType: "Offboarding",
        objectId: employeeId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (logs.length === 0) return null;

    const startLog = logs.find((l) => l.action === "OFFBOARDING_STARTED");
    if (!startLog) return null;

    const startData = startLog.afterData as unknown as {
      employeeId: string;
      terminationType: TerminationType;
      lastWorkingDate: string;
      reason: string;
      status: OffboardingStatus;
      tasks: OffboardingTask[];
    };

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId },
      select: { fullName: true },
    });

    const tasks = [...startData.tasks];
    let status: OffboardingStatus = "IN_PROGRESS";
    let completedAt: Date | undefined;
    let exitInterviewNotes: string | undefined;

    for (const log of logs.reverse()) {
      if (log.action === "OFFBOARDING_TASK_UPDATED") {
        const updateData = log.afterData as unknown as { taskId: string; completed?: boolean };
        const taskIndex = tasks.findIndex((t) => t.id === updateData.taskId);
        if (taskIndex !== -1 && updateData.completed) {
          tasks[taskIndex].completedAt = new Date(log.createdAt);
          tasks[taskIndex].completedBy = log.actorId || undefined;
        }
      } else if (log.action === "OFFBOARDING_CANCELLED") {
        status = "CANCELLED";
      } else if (log.action === "EXIT_INTERVIEW_COMPLETED") {
        const data = log.afterData as unknown as { notes: string };
        exitInterviewNotes = data.notes;
      }
    }

    const completedTasks = tasks.filter((t) => t.completedAt).length;
    const progress = Math.round((completedTasks / tasks.length) * 100);

    const requiredTasks = tasks.filter((t) => t.isRequired);
    const completedRequired = requiredTasks.filter((t) => t.completedAt).length;
    if (completedRequired === requiredTasks.length && status === "IN_PROGRESS") {
      status = "COMPLETED";
      completedAt = new Date();
    }

    return {
      id: employeeId,
      employeeId,
      employeeName: employee?.fullName || "Unknown",
      terminationType: startData.terminationType,
      lastWorkingDate: new Date(startData.lastWorkingDate),
      reason: startData.reason,
      status,
      tasks,
      progress,
      exitInterviewNotes,
      createdAt: startLog.createdAt,
      completedAt,
    };
  }

  /**
   * Check if user can update a task
   */
  private static canUpdateTask(context: RequestContext, task: OffboardingTask): boolean {
    if (["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return true;
    }

    if (context.role === "MANAGER" && task.assignedTo === "MANAGER") {
      return true;
    }

    if (context.role === "IT_OPS" && task.assignedTo === "IT") {
      return true;
    }

    if (context.role === "FINANCE" && task.assignedTo === "FINANCE") {
      return true;
    }

    if (context.role === "EMPLOYEE" && task.assignedTo === "EMPLOYEE") {
      return true;
    }

    return false;
  }

  /**
   * Send offboarding notification
   */
  private static async sendOffboardingNotification(
    employee: Prisma.EmployeeGetPayload<{ include: { user: true } }>,
    checklist: OffboardingChecklist
  ): Promise<void> {
    try {
      await EmailQueueService.queue({
        to: { email: employee.user.email, name: employee.fullName },
        subject: "Proses Offboarding",
        html: `
          <h2>Proses Offboarding</h2>
          <p>Halo ${employee.fullName},</p>
          <p>Proses offboarding Anda telah dimulai.</p>
          <p><strong>Tanggal Terakhir Bekerja:</strong> ${checklist.lastWorkingDate.toLocaleDateString("id-ID")}</p>
          <p>Silakan lengkapi semua task yang diperlukan sebelum tanggal tersebut.</p>
          <p>Jika ada pertanyaan, silakan hubungi tim HR.</p>
          <br/>
          <p>Salam,<br/>Tim HR</p>
        `,
        text: `Proses offboarding Anda telah dimulai. Tanggal terakhir bekerja: ${checklist.lastWorkingDate.toLocaleDateString("id-ID")}`,
      });
    } catch (err) {
      console.error("Failed to send offboarding notification:", err);
    }
  }
}
