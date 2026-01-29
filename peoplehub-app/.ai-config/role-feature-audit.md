# PeopleHub - Role Feature Audit & Testing Matrix

## Role Overview

| Role | Level | Description |
|------|-------|-------------|
| EMPLOYEE | 1 | Karyawan biasa - akses data pribadi |
| MANAGER | 2 | Manajer - akses tim + approval |
| HRD | 3 | HR Department - kelola karyawan |
| FINANCE | 3 | Finance - kelola payroll |
| IT_OPS | 3 | IT Operations - kelola sistem |
| SUPER_ADMIN | 10 | Full access |

---

## Feature Matrix per Role

### 1. EMPLOYEE Features

| Module | Feature | API Endpoint | UI Page | Status |
|--------|---------|--------------|---------|--------|
| **Profile** | View own profile | GET /api/employees/me | /dashboard/profile | ✅ API |
| **Profile** | Update own profile | PUT /api/employees/me | /dashboard/profile | ✅ API |
| **Attendance** | Clock in | POST /api/attendance/clock-in | /dashboard/attendance | ✅ API |
| **Attendance** | Clock out | POST /api/attendance/clock-out | /dashboard/attendance | ✅ API |
| **Attendance** | View own attendance | GET /api/attendance | /dashboard/attendance | ✅ API |
| **Attendance** | Request correction | POST /api/attendance/correction | /dashboard/attendance | ✅ API |
| **Leave** | View own leave | GET /api/leave/requests | /dashboard/leave | ✅ API |
| **Leave** | Request leave | POST /api/leave/requests | /dashboard/leave | ✅ API |
| **Leave** | Cancel leave | PUT /api/leave/requests/[id]/cancel | /dashboard/leave | ✅ API |
| **Leave** | View leave balance | GET /api/leave/balance | /dashboard/leave | ✅ API |
| **Payroll** | View own payslip | GET /api/payroll/my-payslips | /dashboard/payroll | ✅ API |
| **Travel** | View own travel | GET /api/travel | /dashboard/travel | ✅ API |
| **Travel** | Request travel | POST /api/travel | /dashboard/travel | ✅ API |
| **Reimburse** | View own reimburse | GET /api/reimburse | /dashboard/reimburse | ✅ API |
| **Reimburse** | Request reimburse | POST /api/reimburse | /dashboard/reimburse | ✅ API |
| **KPI** | View own KPI | GET /api/kpi/targets | /dashboard/kpi | ❌ API |
| **Notification** | View notifications | GET /api/notifications | /dashboard | ✅ API |
| **Announcement** | View announcements | GET /api/announcements | /dashboard | ❌ API |

### 2. MANAGER Features (+ EMPLOYEE)

| Module | Feature | API Endpoint | UI Page | Status |
|--------|---------|--------------|---------|--------|
| **Team** | View subordinates | GET /api/employees?managerId=me | /dashboard/team | ✅ API |
| **Attendance** | View team attendance | GET /api/attendance/team | /dashboard/team/attendance | ✅ API |
| **Attendance** | Approve correction | PUT /api/approvals/attendance | /dashboard/approvals | ✅ API |
| **Leave** | View team leave | GET /api/leave/team | /dashboard/team/leave | ✅ API |
| **Leave** | Approve leave | PUT /api/approvals/leave | /dashboard/approvals | ✅ API |
| **Travel** | Approve travel | PUT /api/approvals/travel | /dashboard/approvals | ✅ API |
| **Reimburse** | Approve reimburse | PUT /api/approvals/reimburse | /dashboard/approvals | ✅ API |
| **KPI** | View team KPI | GET /api/kpi/team | /dashboard/kpi/team | ❌ API |
| **KPI** | Set team targets | POST /api/kpi/targets | /dashboard/kpi/manage | ❌ API |
| **Reports** | View team reports | GET /api/reports/attendance | /dashboard/reports | ✅ API |

### 3. HRD Features

| Module | Feature | API Endpoint | UI Page | Status |
|--------|---------|--------------|---------|--------|
| **Employee** | List all employees | GET /api/employees | /admin/employees | ✅ API |
| **Employee** | Create employee | POST /api/employees | /admin/employees/new | ✅ API |
| **Employee** | Update employee | PUT /api/employees/[id] | /admin/employees/[id] | ✅ API |
| **Employee** | Terminate employee | PUT /api/employees/[id]/terminate | /admin/employees/[id] | ✅ API |
| **Attendance** | View all attendance | GET /api/attendance?all=true | /admin/attendance | ✅ API |
| **Attendance** | Correct attendance | PUT /api/attendance/[id]/correct | /admin/attendance | ✅ API |
| **Leave** | View all leave | GET /api/leave/requests?all=true | /admin/leave | ✅ API |
| **Leave** | Approve HRD | PUT /api/approvals/leave | /admin/approvals | ✅ API |
| **Leave Types** | Manage leave types | GET/POST /api/leave/types | /admin/settings/leave | ✅ API |
| **Organization** | Manage branches | GET/POST /api/organization/branches | /admin/organization | ✅ API |
| **Organization** | Manage departments | GET/POST /api/organization/departments | /admin/organization | ✅ API |
| **Organization** | Manage positions | GET/POST /api/organization/positions | /admin/organization | ✅ API |
| **Organization** | Manage shifts | GET/POST /api/organization/shifts | /admin/organization | ✅ API |
| **Reports** | All reports | GET /api/reports/* | /admin/reports | ✅ API |
| **Reports** | Export CSV | GET /api/reports/*?format=csv | /admin/reports | ✅ API |
| **Admin** | Approve registrations | PUT /api/admin/registrations | /admin/registrations | ❌ API |

### 4. FINANCE Features

| Module | Feature | API Endpoint | UI Page | Status |
|--------|---------|--------------|---------|--------|
| **Employee** | View employees | GET /api/employees | /admin/employees | ✅ API |
| **Payroll** | View all payslips | GET /api/payroll | /admin/payroll | ✅ API |
| **Payroll** | Generate payslips | POST /api/payroll/generate | /admin/payroll/generate | ✅ API |
| **Payroll** | Update payslip | PUT /api/payroll/[id] | /admin/payroll/[id] | ✅ API |
| **Payroll** | Publish payroll | POST /api/payroll/publish | /admin/payroll | ✅ API |
| **Travel** | View all travel | GET /api/travel?all=true | /admin/travel | ✅ API |
| **Travel** | Approve travel | PUT /api/approvals/travel | /admin/approvals | ✅ API |
| **Reimburse** | View all reimburse | GET /api/reimburse?all=true | /admin/reimburse | ✅ API |
| **Reimburse** | Approve reimburse | PUT /api/approvals/reimburse | /admin/approvals | ✅ API |
| **Reports** | Payroll report | GET /api/reports/payroll | /admin/reports | ✅ API |

### 5. IT_OPS Features

| Module | Feature | API Endpoint | UI Page | Status |
|--------|---------|--------------|---------|--------|
| **Users** | Manage users | GET/POST /api/admin/users | /admin/users | ❌ API |
| **Settings** | Tenant settings | GET/PUT /api/settings/tenant | /admin/settings | ❌ API |
| **Settings** | Notification settings | GET/PUT /api/settings/notifications | /admin/settings | ❌ API |
| **Audit** | View audit logs | GET /api/admin/audit-logs | /admin/audit | ❌ API |

### 6. SUPER_ADMIN Features

| Module | Feature | API Endpoint | UI Page | Status |
|--------|---------|--------------|---------|--------|
| All | Full access | All endpoints | All pages | ✅ |

---

## Missing APIs (Need Implementation)

### Priority 1 - Core Features
1. ❌ `GET /api/kpi/targets` - KPI targets for employee
2. ❌ `GET /api/kpi/team` - KPI for team (manager)
3. ❌ `POST /api/kpi/targets` - Create KPI target
4. ❌ `PUT /api/kpi/targets/[id]` - Update KPI actual value
5. ❌ `GET /api/announcements` - List announcements

### Priority 2 - Admin Features
6. ❌ `GET /api/admin/users` - List users
7. ❌ `PUT /api/admin/users/[id]` - Update user
8. ❌ `PUT /api/admin/registrations/[id]` - Approve registration
9. ❌ `GET /api/settings/tenant` - Tenant settings
10. ❌ `PUT /api/settings/tenant` - Update tenant settings
11. ❌ `GET /api/admin/audit-logs` - Audit logs

---

## Missing UI Pages (Need Implementation)

### Employee Dashboard
- [ ] `/dashboard/kpi` - KPI view
- [ ] `/dashboard/announcements` - Announcements

### Manager Dashboard
- [ ] `/dashboard/team` - Team overview
- [ ] `/dashboard/kpi/team` - Team KPI
- [ ] `/dashboard/approvals` - Approval queue

### Admin Pages
- [ ] `/admin/employees` - Employee management
- [ ] `/admin/attendance` - Attendance management
- [ ] `/admin/leave` - Leave management
- [ ] `/admin/payroll` - Payroll management
- [ ] `/admin/travel` - Travel management
- [ ] `/admin/reimburse` - Reimburse management
- [ ] `/admin/kpi` - KPI management
- [ ] `/admin/organization` - Organization structure
- [ ] `/admin/settings` - System settings
- [ ] `/admin/users` - User management (IT_OPS)
- [ ] `/admin/audit` - Audit logs (IT_OPS)
- [ ] `/admin/reports` - Reports center

---

## Testing Checklist by Role

### EMPLOYEE Test Cases
```
□ Login as employee
□ View dashboard
□ Clock in with location
□ Clock out with location
□ View attendance history
□ Request attendance correction
□ View leave balance
□ Request leave
□ Cancel pending leave
□ View payslip
□ Request travel
□ Cancel travel
□ Request reimbursement
□ View notifications
□ Update profile
```

### MANAGER Test Cases
```
□ All employee tests
□ View subordinates list
□ View team attendance
□ Approve leave request
□ Reject leave request
□ Approve travel request
□ Approve reimbursement
□ View team KPI
□ Set team KPI targets
□ View team reports
```

### HRD Test Cases
```
□ List all employees
□ Create new employee
□ Edit employee
□ Terminate employee
□ View all attendance
□ Correct attendance
□ Approve leave (HRD level)
□ Manage leave types
□ Manage branches
□ Manage departments
□ Manage positions
□ Manage shifts
□ Generate reports
□ Export CSV
```

### FINANCE Test Cases
```
□ View all employees
□ View all payslips
□ Generate monthly payroll
□ Edit payslip
□ Publish payroll
□ Approve travel expenses
□ Approve reimbursements
□ View payroll reports
```

### IT_OPS Test Cases
```
□ View all employees
□ Manage users
□ View audit logs
□ Update tenant settings
□ Manage notification settings
```

---

*Generated: 2026-01-19*
