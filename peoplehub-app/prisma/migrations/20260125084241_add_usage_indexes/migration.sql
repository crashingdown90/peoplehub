-- CreateIndex
CREATE INDEX "leave_requests_tenantId_approvedByManagerId_status_idx" ON "leave_requests"("tenantId", "approvedByManagerId", "status");

-- CreateIndex
CREATE INDEX "reimburse_requests_tenantId_approvedByManagerId_status_idx" ON "reimburse_requests"("tenantId", "approvedByManagerId", "status");

-- CreateIndex
CREATE INDEX "travel_requests_tenantId_approvedByManagerId_status_idx" ON "travel_requests"("tenantId", "approvedByManagerId", "status");
