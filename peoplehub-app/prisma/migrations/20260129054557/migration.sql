/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,userId]` on the table `notification_preferences` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,employeeId,period]` on the table `payslips` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdById` to the `announcements` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'PERSONAL';
ALTER TYPE "DocumentType" ADD VALUE 'TRAINING';
ALTER TYPE "DocumentType" ADD VALUE 'PERFORMANCE';
ALTER TYPE "DocumentType" ADD VALUE 'MEDICAL';

-- DropForeignKey
ALTER TABLE "announcement_reads" DROP CONSTRAINT "announcement_reads_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "attendance_corrections" DROP CONSTRAINT "attendance_corrections_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "bank_change_requests" DROP CONSTRAINT "bank_change_requests_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "cash_advances" DROP CONSTRAINT "cash_advances_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_userId_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "kpi_targets" DROP CONSTRAINT "kpi_targets_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "leave_balances" DROP CONSTRAINT "leave_balances_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "leave_balances" DROP CONSTRAINT "leave_balances_leaveTypeId_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "overtime_requests" DROP CONSTRAINT "overtime_requests_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "payslips" DROP CONSTRAINT "payslips_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "reimburse_items" DROP CONSTRAINT "reimburse_items_reimburseId_fkey";

-- DropForeignKey
ALTER TABLE "reimburse_requests" DROP CONSTRAINT "reimburse_requests_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "ticket_comments" DROP CONSTRAINT "ticket_comments_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "travel_requests" DROP CONSTRAINT "travel_requests_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "webhook_logs" DROP CONSTRAINT "webhook_logs_webhookId_fkey";

-- DropIndex
DROP INDEX "notification_preferences_userId_key";

-- DropIndex
DROP INDEX "payslips_employeeId_period_key";

-- DropIndex
DROP INDEX "payslips_tenantId_employeeId_idx";

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "defaultShiftId" TEXT,
ADD COLUMN     "shiftId" TEXT;

-- AlterTable
ALTER TABLE "reimburse_items" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "unitPrice" DECIMAL(65,30);

-- CreateIndex
CREATE INDEX "announcements_tenantId_isPinned_publishedAt_idx" ON "announcements"("tenantId", "isPinned", "publishedAt");

-- CreateIndex
CREATE INDEX "notification_preferences_tenantId_idx" ON "notification_preferences"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_tenantId_userId_key" ON "notification_preferences"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_tenantId_employeeId_period_key" ON "payslips"("tenantId", "employeeId", "period");

-- CreateIndex
CREATE INDEX "reimburse_items_reimburseId_idx" ON "reimburse_items"("reimburseId");

-- CreateIndex
CREATE INDEX "schedules_tenantId_scheduleDate_idx" ON "schedules"("tenantId", "scheduleDate");

-- CreateIndex
CREATE INDEX "schedules_tenantId_employeeId_idx" ON "schedules"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "shifts_tenantId_idx" ON "shifts"("tenantId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_defaultShiftId_fkey" FOREIGN KEY ("defaultShiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimburse_requests" ADD CONSTRAINT "reimburse_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimburse_items" ADD CONSTRAINT "reimburse_items_reimburseId_fkey" FOREIGN KEY ("reimburseId") REFERENCES "reimburse_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_targets" ADD CONSTRAINT "kpi_targets_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_advances" ADD CONSTRAINT "cash_advances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_change_requests" ADD CONSTRAINT "bank_change_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_delegatorId_fkey" FOREIGN KEY ("delegatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
