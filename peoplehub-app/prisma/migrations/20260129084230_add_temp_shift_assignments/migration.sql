-- CreateTable
CREATE TABLE "temp_shift_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temp_shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "temp_shift_assignments_tenantId_employeeId_idx" ON "temp_shift_assignments"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "temp_shift_assignments_tenantId_shiftId_idx" ON "temp_shift_assignments"("tenantId", "shiftId");

-- CreateIndex
CREATE INDEX "temp_shift_assignments_tenantId_effectiveFrom_idx" ON "temp_shift_assignments"("tenantId", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "temp_shift_assignments" ADD CONSTRAINT "temp_shift_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temp_shift_assignments" ADD CONSTRAINT "temp_shift_assignments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
