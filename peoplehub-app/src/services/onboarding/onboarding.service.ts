// @ai:cl - Onboarding Service with workflow and checklist management
import { prisma } from "@/lib/db";
import { RequestContext } from "@/lib/tenant";
import { ServiceResponse, success, error, ErrorCodes, PaginationParams } from "../types";
import { Prisma } from "@prisma/client";
import { WebhookService } from "../webhook";
import { EmailQueueService } from "../email";

// ==========================================
// TYPES
// ==========================================

export type OnboardingStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface OnboardingTask {
  id: string;
  name: string;
  description?: string;
  category: "DOCUMENTS" | "IT_SETUP" | "TRAINING" | "INTRODUCTION" | "OTHER";
  assignedTo: "EMPLOYEE" | "HRD" | "IT" | "MANAGER";
  dueDay: number; // Days from start date
  isRequired: boolean;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

export interface OnboardingChecklist {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: Date;
  status: OnboardingStatus;
  tasks: OnboardingTask[];
  progress: number; // 0-100
  createdAt: Date;
  completedAt?: Date;
}

export interface CreateOnboardingInput {
  employeeId: string;
  startDate?: Date | string;
  customTasks?: Omit<OnboardingTask, "id" | "completedAt" | "completedBy" | "notes">[];
}

export interface UpdateTaskInput {
  completed?: boolean;
  notes?: string;
}

export interface OnboardingFilter extends PaginationParams {
  status?: OnboardingStatus;
  employeeId?: string;
  branchId?: string;
  departmentId?: string;
}

// Default onboarding tasks
const DEFAULT_ONBOARDING_TASKS: Omit<OnboardingTask, "id" | "completedAt" | "completedBy" | "notes">[] = [
  // Documents
  { name: "Kumpulkan dokumen KTP", category: "DOCUMENTS", assignedTo: "EMPLOYEE", dueDay: 1, isRequired: true },
  { name: "Kumpulkan NPWP", category: "DOCUMENTS", assignedTo: "EMPLOYEE", dueDay: 3, isRequired: false },
  { name: "Kumpulkan ijazah/sertifikat", category: "DOCUMENTS", assignedTo: "EMPLOYEE", dueDay: 3, isRequired: true },
  { name: "Tanda tangan kontrak kerja", category: "DOCUMENTS", assignedTo: "HRD", dueDay: 1, isRequired: true },
  { name: "Isi data rekening bank", category: "DOCUMENTS", assignedTo: "EMPLOYEE", dueDay: 3, isRequired: true },

  // IT Setup
  { name: "Buat akun email perusahaan", category: "IT_SETUP", assignedTo: "IT", dueDay: 1, isRequired: true },
  { name: "Setup laptop/komputer", category: "IT_SETUP", assignedTo: "IT", dueDay: 1, isRequired: true },
  { name: "Akses ke sistem internal", category: "IT_SETUP", assignedTo: "IT", dueDay: 2, isRequired: true },
  { name: "Install software yang diperlukan", category: "IT_SETUP", assignedTo: "IT", dueDay: 2, isRequired: true },

  // Training
  { name: "Orientasi perusahaan", category: "TRAINING", assignedTo: "HRD", dueDay: 1, isRequired: true },
  { name: "Training keselamatan kerja", category: "TRAINING", assignedTo: "HRD", dueDay: 5, isRequired: true },
  { name: "Training sistem HRIS", category: "TRAINING", assignedTo: "HRD", dueDay: 3, isRequired: true },
  { name: "Training role-specific", category: "TRAINING", assignedTo: "MANAGER", dueDay: 7, isRequired: true },

  // Introduction
  { name: "Perkenalan dengan tim", category: "INTRODUCTION", assignedTo: "MANAGER", dueDay: 1, isRequired: true },
  { name: "Tour kantor", category: "INTRODUCTION", assignedTo: "HRD", dueDay: 1, isRequired: true },
  { name: "Meeting dengan supervisor", category: "INTRODUCTION", assignedTo: "MANAGER", dueDay: 1, isRequired: true },
];

// ==========================================
// SERVICE CLASS
// ==========================================

export class OnboardingService {
  /**
   * Start onboarding process for an employee
   */
  static async create(
    context: RequestContext,
    data: CreateOnboardingInput
  ): Promise<ServiceResponse<OnboardingChecklist>> {
    // Only admins can create onboarding
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat membuat proses onboarding");
    }

    // Verify employee exists
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId: context.tenantId },
      include: { user: true },
    });

    if (!employee) {
      return error(ErrorCodes.NOT_FOUND, "Karyawan tidak ditemukan");
    }

    // Check if onboarding already exists
    const existing = await this.getOnboardingData(context.tenantId, data.employeeId);
    if (existing && existing.status !== "CANCELLED") {
      return error(ErrorCodes.CONFLICT, "Proses onboarding sudah berjalan untuk karyawan ini");
    }

    const startDate = data.startDate ? new Date(data.startDate) : employee.startDate;
    const tasks = data.customTasks || DEFAULT_ONBOARDING_TASKS;

    // Create tasks with IDs
    const tasksWithIds: OnboardingTask[] = tasks.map((task, index) => ({
      ...task,
      id: `task-${index + 1}`,
    }));

    // Store in employee metadata (using a JSON field or create a separate table)
    await prisma.employee.update({
      where: { id: data.employeeId },
      data: {
        // Using a workaround since we don't have a dedicated onboarding table
        // In production, consider creating OnboardingChecklist and OnboardingTask models
        updatedAt: new Date(),
      },
    });

    // Create audit log with onboarding data
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "ONBOARDING_STARTED",
        objectType: "Onboarding",
        objectId: data.employeeId,
        afterData: JSON.parse(JSON.stringify({
          employeeId: data.employeeId,
          startDate: startDate.toISOString(),
          status: "IN_PROGRESS",
          tasks: tasksWithIds,
        })),
      },
    });

    const checklist: OnboardingChecklist = {
      id: data.employeeId,
      employeeId: data.employeeId,
      employeeName: employee.fullName,
      startDate,
      status: "IN_PROGRESS",
      tasks: tasksWithIds,
      progress: 0,
      createdAt: new Date(),
    };

    // Send welcome email
    await this.sendWelcomeEmail(employee);

    // Trigger webhook
    await WebhookService.trigger(context.tenantId, "employee.created", {
      employeeId: employee.id,
      employeeName: employee.fullName,
      startDate: startDate.toISOString(),
    });

    return success(checklist);
  }

  /**
   * Get onboarding checklist for an employee
   */
  static async getByEmployeeId(
    context: RequestContext,
    employeeId: string
  ): Promise<ServiceResponse<OnboardingChecklist | null>> {
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

    const onboarding = await this.getOnboardingData(context.tenantId, employeeId);
    return success(onboarding);
  }

  /**
   * Update a task in the onboarding checklist
   */
  static async updateTask(
    context: RequestContext,
    employeeId: string,
    taskId: string,
    data: UpdateTaskInput
  ): Promise<ServiceResponse<OnboardingChecklist>> {
    const onboarding = await this.getOnboardingData(context.tenantId, employeeId);

    if (!onboarding) {
      return error(ErrorCodes.NOT_FOUND, "Proses onboarding tidak ditemukan");
    }

    if (onboarding.status === "COMPLETED" || onboarding.status === "CANCELLED") {
      return error(ErrorCodes.BAD_REQUEST, "Proses onboarding sudah selesai atau dibatalkan");
    }

    const taskIndex = onboarding.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return error(ErrorCodes.NOT_FOUND, "Task tidak ditemukan");
    }

    const task = onboarding.tasks[taskIndex];

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

    onboarding.tasks[taskIndex] = task;

    // Calculate progress
    const completedTasks = onboarding.tasks.filter((t) => t.completedAt).length;
    onboarding.progress = Math.round((completedTasks / onboarding.tasks.length) * 100);

    // Check if all required tasks are completed
    const requiredTasks = onboarding.tasks.filter((t) => t.isRequired);
    const completedRequired = requiredTasks.filter((t) => t.completedAt).length;

    if (completedRequired === requiredTasks.length) {
      onboarding.status = "COMPLETED";
      onboarding.completedAt = new Date();

      // Trigger webhook
      await WebhookService.trigger(context.tenantId, "employee.onboarded", {
        employeeId: onboarding.employeeId,
        employeeName: onboarding.employeeName,
        completedAt: onboarding.completedAt?.toISOString(),
      });
    }

    // Update audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "ONBOARDING_TASK_UPDATED",
        objectType: "Onboarding",
        objectId: employeeId,
        afterData: JSON.parse(JSON.stringify({
          taskId,
          completed: data.completed,
          progress: onboarding.progress,
          status: onboarding.status,
        })),
      },
    });

    return success(onboarding);
  }

  /**
   * Get all onboarding checklists with filters
   */
  static async getAll(
    context: RequestContext,
    filter: OnboardingFilter
  ): Promise<ServiceResponse<OnboardingChecklist[]>> {
    // Only admins can view all onboardings
    if (!["HRD", "SUPER_ADMIN", "MANAGER"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    const { page = 1, limit = 20, status, employeeId, branchId, departmentId } = filter;

    // Get employees with recent onboarding activity
    const where: Prisma.EmployeeWhereInput = {
      tenantId: context.tenantId,
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
      orderBy: { startDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const onboardings: OnboardingChecklist[] = [];

    for (const employee of employees) {
      const onboarding = await this.getOnboardingData(context.tenantId, employee.id);
      if (onboarding) {
        if (!status || onboarding.status === status) {
          onboardings.push(onboarding);
        }
      }
    }

    return success(onboardings);
  }

  /**
   * Cancel onboarding process
   */
  static async cancel(
    context: RequestContext,
    employeeId: string,
    reason: string
  ): Promise<ServiceResponse<void>> {
    // Only admins can cancel
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Hanya HRD yang dapat membatalkan proses onboarding");
    }

    const onboarding = await this.getOnboardingData(context.tenantId, employeeId);

    if (!onboarding) {
      return error(ErrorCodes.NOT_FOUND, "Proses onboarding tidak ditemukan");
    }

    if (onboarding.status === "COMPLETED") {
      return error(ErrorCodes.BAD_REQUEST, "Proses onboarding sudah selesai");
    }

    // Update status in audit log
    await prisma.auditLog.create({
      data: {
        tenantId: context.tenantId,
        actorId: context.userId,
        action: "ONBOARDING_CANCELLED",
        objectType: "Onboarding",
        objectId: employeeId,
        afterData: JSON.parse(JSON.stringify({ reason, cancelledAt: new Date().toISOString() })),
      },
    });

    return success(undefined);
  }

  /**
   * Get onboarding statistics
   */
  static async getStats(
    context: RequestContext
  ): Promise<ServiceResponse<{
    total: number;
    inProgress: number;
    completed: number;
    averageCompletionDays: number;
    taskCompletionRate: Record<string, number>;
  }>> {
    // Only admins can view stats
    if (!["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return error(ErrorCodes.FORBIDDEN, "Anda tidak memiliki akses");
    }

    // Get all onboarding audit logs
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        action: { startsWith: "ONBOARDING_" },
      },
      orderBy: { createdAt: "desc" },
    });

    // Process stats (simplified)
    const stats = {
      total: 0,
      inProgress: 0,
      completed: 0,
      averageCompletionDays: 0,
      taskCompletionRate: {} as Record<string, number>,
    };

    // Count unique employees
    const employeeIds = new Set<string>();
    logs.forEach((log) => {
      if (log.objectId) employeeIds.add(log.objectId);
    });

    stats.total = employeeIds.size;

    // Count by status
    const completedLogs = logs.filter((l) => l.action === "ONBOARDING_COMPLETED");
    stats.completed = completedLogs.length;
    stats.inProgress = stats.total - stats.completed;

    return success(stats);
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  /**
   * Get onboarding data from audit logs
   */
  private static async getOnboardingData(
    tenantId: string,
    employeeId: string
  ): Promise<OnboardingChecklist | null> {
    // Get the latest onboarding log for this employee
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        objectType: "Onboarding",
        objectId: employeeId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (logs.length === 0) return null;

    // Reconstruct onboarding state from logs
    const startLog = logs.find((l) => l.action === "ONBOARDING_STARTED");
    if (!startLog) return null;

    const startData = startLog.afterData as unknown as {
      employeeId: string;
      startDate: string;
      status: OnboardingStatus;
      tasks: OnboardingTask[];
    };

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId },
      select: { fullName: true },
    });

    // Apply task updates
    const tasks = [...startData.tasks];
    let status: OnboardingStatus = "IN_PROGRESS";
    let completedAt: Date | undefined;

    for (const log of logs.reverse()) {
      if (log.action === "ONBOARDING_TASK_UPDATED") {
        const updateData = log.afterData as unknown as { taskId: string; completed?: boolean; notes?: string };
        const taskIndex = tasks.findIndex((t) => t.id === updateData.taskId);
        if (taskIndex !== -1) {
          if (updateData.completed) {
            tasks[taskIndex].completedAt = new Date(log.createdAt);
            tasks[taskIndex].completedBy = log.actorId || undefined;
          }
        }
      } else if (log.action === "ONBOARDING_CANCELLED") {
        status = "CANCELLED";
      } else if (log.action === "ONBOARDING_COMPLETED") {
        status = "COMPLETED";
        completedAt = new Date(log.createdAt);
      }
    }

    // Calculate progress
    const completedTasks = tasks.filter((t) => t.completedAt).length;
    const progress = Math.round((completedTasks / tasks.length) * 100);

    // Check if completed
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
      startDate: new Date(startData.startDate),
      status,
      tasks,
      progress,
      createdAt: startLog.createdAt,
      completedAt,
    };
  }

  /**
   * Check if user can update a task
   */
  private static canUpdateTask(context: RequestContext, task: OnboardingTask): boolean {
    if (["HRD", "SUPER_ADMIN"].includes(context.role)) {
      return true;
    }

    if (context.role === "MANAGER" && task.assignedTo === "MANAGER") {
      return true;
    }

    if (context.role === "IT_OPS" && task.assignedTo === "IT") {
      return true;
    }

    if (context.role === "EMPLOYEE" && task.assignedTo === "EMPLOYEE") {
      return true;
    }

    return false;
  }

  /**
   * Send welcome email to new employee
   */
  private static async sendWelcomeEmail(employee: Prisma.EmployeeGetPayload<{ include: { user: true } }>): Promise<void> {
    try {
      await EmailQueueService.queue({
        to: { email: employee.user.email, name: employee.fullName },
        subject: `Selamat Datang di Perusahaan, ${employee.fullName}!`,
        html: `
          <h2>Selamat Datang!</h2>
          <p>Halo ${employee.fullName},</p>
          <p>Selamat bergabung dengan tim kami. Kami sangat senang menyambut Anda.</p>
          <p>Silakan lengkapi proses onboarding Anda melalui sistem HRIS.</p>
          <p>Jika ada pertanyaan, jangan ragu untuk menghubungi tim HR.</p>
          <br/>
          <p>Salam,<br/>Tim HR</p>
        `,
        text: `Selamat Datang ${employee.fullName}! Silakan lengkapi proses onboarding Anda melalui sistem HRIS.`,
      });
    } catch (err) {
      console.error("Failed to send welcome email:", err);
    }
  }
}
