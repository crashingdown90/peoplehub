# PeopleHub Phase 2 - Role-Based Feature Completion

## Overview
Berdasarkan audit, ada 11 API endpoints dan 12+ UI pages yang perlu dibuat untuk melengkapi fitur per role.

---

## ANTIGRAVITY (AG) Tasks

### FASE 1: Missing API Types & Hooks

**Task AG-P2-1: KPI Module Types**
```
File: src/types/kpi.types.ts (update existing)
Add:
- KPITarget interface
- KPIActualValue interface
- KPISummary interface
```

**Task AG-P2-2: Announcement Types**
```
File: src/types/announcement.types.ts (update existing)
Add:
- AnnouncementFilter interface
- AnnouncementPriority type
```

**Task AG-P2-3: Admin Types**
```
File: src/types/admin.types.ts (NEW)
Create:
- AuditLog interface
- UserManagement interface
- TenantSettings interface
- RegistrationApproval interface
```

**Task AG-P2-4: Update useKpi Hook**
```
File: src/hooks/useKpi.ts (fix existing)
Fix:
- ApiError handling (use string message)
- Add getTeamKpi function
- Add createTarget function
- Add updateActualValue function
```

**Task AG-P2-5: Admin Hooks**
```
File: src/hooks/useAdmin.ts (NEW)
Create:
- useUsers hook (list, update users)
- useAuditLogs hook (list audit logs)
- useTenantSettings hook (get, update settings)
- useRegistrations hook (list, approve registrations)
```

**Task AG-P2-6: Fix Existing Hook Errors**
```
Files to fix:
- src/hooks/useAnnouncements.ts - page/totalPages, ApiError
- src/hooks/useTravel.ts - page/totalPages, ApiError, CANCELLED status
- src/hooks/useReimburse.ts - page/totalPages, ApiError, CANCELLED status
- src/hooks/useFileUpload.ts - image type validation

Fix pattern:
- Change: setError(err.message || "...")
- To: setError(typeof err === 'string' ? err : err?.message || "...")

- Add CANCELLED to ApprovalStatus in types
```

### FASE 2: Permission & Route Constants

**Task AG-P2-7: Add Missing Permissions**
```
File: src/constants/permissions.ts
Add if missing:
- PERMISSIONS.KPI_VIEW_ALL
- PERMISSIONS.ADMIN_USERS
- PERMISSIONS.ADMIN_AUDIT_LOG
- PERMISSIONS.ADMIN_REGISTRATIONS
- PERMISSIONS.SETTINGS_TENANT
- PERMISSIONS.SETTINGS_NOTIFICATIONS
```

**Task AG-P2-8: Add Missing API Routes**
```
File: src/constants/routes.ts
Add:
- KPI routes (targets, team, summary)
- Admin routes (users, audit-logs, registrations)
- Settings routes (tenant, notifications)
```

---

## CODEX GPT (CX) Tasks

### FASE 1: Dashboard Components

**Task CX-P2-1: Approval Queue Component**
```
File: src/components/dashboard/approval-queue.tsx
Create:
- ApprovalCard component
- ApprovalList with tabs (Leave, Travel, Reimburse, Attendance)
- Status badges
- Quick approve/reject buttons
```

**Task CX-P2-2: KPI Components**
```
File: src/components/dashboard/kpi-card.tsx
Create:
- KPIProgressCard (target vs actual)
- KPIChart (progress visualization)
- KPISummary (overall score)
```

**Task CX-P2-3: Team Overview Component**
```
File: src/components/dashboard/team-overview.tsx
Create:
- TeamMemberCard
- AttendanceSummary
- QuickStats (present, late, absent)
```

### FASE 2: Admin Page Components

**Task CX-P2-4: Employee Management Components**
```
File: src/components/admin/employee-table.tsx
Create:
- EmployeeTable with columns (name, dept, position, status)
- EmployeeFilters (status, department, branch)
- EmployeeActions (edit, terminate)
```

**Task CX-P2-5: Employee Form**
```
File: src/components/admin/employee-form.tsx
Create:
- CreateEmployeeForm
- EditEmployeeForm
- TerminateEmployeeModal
```

**Task CX-P2-6: Payroll Components**
```
File: src/components/admin/payroll-table.tsx
Create:
- PayslipTable
- PayslipFilters (period, department, status)
- GeneratePayrollModal
- PublishPayrollModal
```

**Task CX-P2-7: Organization Components**
```
File: src/components/admin/organization-tree.tsx
Create:
- BranchList
- DepartmentList
- PositionList
- ShiftList
- CRUD modals for each
```

**Task CX-P2-8: Report Components**
```
File: src/components/admin/report-viewer.tsx
Create:
- ReportFilters (date range, department)
- ReportTable
- ExportButton (CSV download)
- ReportChart (optional)
```

### FASE 3: Layout Fixes

**Task CX-P2-9: Fix Layout Errors**
```
Files to fix:
- src/components/layout/header.tsx
  - AuthUser.name doesn't exist → use user.email or add name to type

- src/components/layout/sidebar.tsx
  - PERMISSIONS.APPROVALS_VIEW doesn't exist
  - PERMISSIONS.PAYROLL_VIEW doesn't exist

Solution: Check src/constants/permissions.ts and use correct permission names
```

### FASE 4: Dashboard Pages (Optional if time permits)

**Task CX-P2-10: Employee Dashboard Pages**
```
Files:
- src/app/dashboard/kpi/page.tsx
- src/app/dashboard/travel/page.tsx
- src/app/dashboard/reimburse/page.tsx
```

**Task CX-P2-11: Manager Dashboard Pages**
```
Files:
- src/app/dashboard/team/page.tsx
- src/app/dashboard/approvals/page.tsx
```

---

## CLAUDE AI (CL) Tasks

### FASE 1: Missing API Routes

**Task CL-P2-1: KPI API Routes**
```
Files to create:
- src/app/api/kpi/targets/route.ts (GET, POST)
- src/app/api/kpi/targets/[id]/route.ts (GET, PUT)
- src/app/api/kpi/team/route.ts (GET)
- src/app/api/kpi/summary/route.ts (GET)
```

**Task CL-P2-2: Announcement API Routes**
```
Files to create:
- src/app/api/announcements/route.ts (GET, POST)
- src/app/api/announcements/[id]/route.ts (GET, PUT, DELETE)
```

**Task CL-P2-3: Admin API Routes**
```
Files to create:
- src/app/api/admin/users/route.ts (GET)
- src/app/api/admin/users/[id]/route.ts (PUT)
- src/app/api/admin/registrations/route.ts (GET)
- src/app/api/admin/registrations/[id]/route.ts (PUT)
- src/app/api/admin/audit-logs/route.ts (GET)
```

**Task CL-P2-4: Settings API Routes**
```
Files to create:
- src/app/api/settings/tenant/route.ts (GET, PUT)
- src/app/api/settings/notifications/route.ts (GET, PUT)
```

### FASE 2: KPI Service

**Task CL-P2-5: KPIService**
```
File: src/services/kpi/kpi.service.ts
Create:
- getTargets(context, filter)
- getTeamTargets(context, filter)
- createTarget(context, data)
- updateActualValue(context, id, data)
- getSummary(context, periodId)
- calculateAchievement(targets)
```

### FASE 3: Admin Service

**Task CL-P2-6: AdminService**
```
File: src/services/admin/admin.service.ts
Create:
- getUsers(context, filter)
- updateUser(context, id, data)
- getRegistrations(context, filter)
- approveRegistration(context, id)
- rejectRegistration(context, id, reason)
- getAuditLogs(context, filter)
```

---

## Priority Order

### Sprint 1 (Core Features)
1. AG: Fix existing hook errors (AG-P2-6)
2. CL: KPI API routes (CL-P2-1)
3. CL: Announcement API routes (CL-P2-2)
4. CX: Fix layout errors (CX-P2-9)

### Sprint 2 (Admin Features)
5. AG: Admin types & hooks (AG-P2-3, AG-P2-5)
6. CL: Admin API routes (CL-P2-3)
7. CX: Employee management components (CX-P2-4, CX-P2-5)

### Sprint 3 (Dashboard)
8. CX: Approval queue component (CX-P2-1)
9. CX: KPI components (CX-P2-2)
10. CX: Team overview (CX-P2-3)

---

## Verification Commands

```bash
# After each task
npm run lint
npm run type-check
npm run build

# Target: 0 errors
```

---

*Generated: 2026-01-19*
