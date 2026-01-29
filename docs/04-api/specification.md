# API Specification PeopleHub (MVP)

> **Versi:** 2.1 | **Tanggal Update:** 23 Januari 2026 | **Status:** Final

## Ringkasan

Dokumen ini berisi spesifikasi API untuk fase MVP PeopleHub mencakup: Authentication, User/Employee, Attendance, Leave, dan Dashboard.

---

## Base URL & Standards

### Base URL
```
Production: https://api.peoplehub.kreatifindo.com/v1
Staging:    https://api-staging.peoplehub.kreatifindo.com/v1
```

> **⚠️ API Versioning:** Semua endpoint menggunakan prefix `/v1/`. Breaking changes di masa depan akan menggunakan versi baru (`/v2/`). Versi lama akan didukung minimal 6 bulan setelah versi baru dirilis.

### Headers
```
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-ID: <tenant_uuid>
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource |
| 422 | Unprocessable Entity - Business rule violation |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

### Error Codes

#### Authentication & Session Errors
| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid credentials |
| `SESSION_EXPIRED` | Token/session has expired, re-login required |
| `CONCURRENT_SESSION` | Session invalidated due to login from another device |

#### Authorization & Access Errors
| Code | Description |
|------|-------------|
| `FORBIDDEN` | No permission for action |
| `EMPLOYEE_INACTIVE` | Employee account is inactive/terminated |
| `DELEGATION_CONFLICT` | Conflicting or circular delegation detected |

#### Validation & Input Errors
| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Email/employee number exists |
| `INVALID_STATUS` | Invalid status transition |

#### File Upload Errors
| Code | Description |
|------|-------------|
| `FILE_TOO_LARGE` | Uploaded file exceeds maximum size limit |
| `INVALID_FILE_TYPE` | File type not allowed (only JPEG/PNG/PDF supported) |
| `CAMERA_REQUIRED` | Selfie photo must be taken from camera, not gallery |

#### Business Rule Errors
| Code | Description |
|------|-------------|
| `INSUFFICIENT_BALANCE` | Leave balance insufficient |
| `PENDING_APPROVAL` | Previous request still pending |
| `GEOFENCE_VIOLATION` | Location outside allowed area |
| `PLAFON_EXCEEDED` | Amount exceeds category limit |
| `CYCLE_CLOSED` | KPI cycle is already closed |

#### System Errors
| Code | Description |
|------|-------------|
| `RATE_LIMITED` | Too many requests, please slow down |
| `MAINTENANCE_MODE` | System under maintenance, try again later |
| `INTERNAL_ERROR` | Unexpected server error |

---

## 1. Authentication

### POST /auth/register
Register new employee account (pending approval).

**Request Body:**
```json
{
  "email": "john.doe@company.com",
  "phone": "08123456789",
  "password": "SecurePass123!",
  "password_confirmation": "SecurePass123!",
  "full_name": "John Doe",
  "nik": "3201234567890001",
  "agreed_to_terms": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john.doe@company.com",
    "status": "pending",
    "message": "Registration submitted. Please wait for HRD approval."
  }
}
```

**Validation Rules:**
- `email`: required, valid email, unique per tenant
- `phone`: required, valid Indonesian phone format
- `password`: required, min 8 chars, 1 uppercase, 1 number, 1 special char
- `full_name`: required, min 3 chars
- `agreed_to_terms`: required, must be true

---

### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "email": "john.doe@company.com",
      "role": "employee",
      "employee": {
        "id": "uuid",
        "full_name": "John Doe",
        "employee_number": "EMP001",
        "branch": { "id": "uuid", "name": "Jakarta HQ" },
        "department": { "id": "uuid", "name": "Engineering" },
        "position": { "id": "uuid", "name": "Software Engineer" }
      }
    }
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

---

### POST /auth/logout
Invalidate current session.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "new_token...",
    "expires_in": 3600
  }
}
```

---

### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "john.doe@company.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

---

### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!",
  "password_confirmation": "NewSecurePass123!"
}
```

---

## 2. User & Profile

### GET /me
Get current user profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john.doe@company.com",
    "role": "employee",
    "employee": {
      "id": "uuid",
      "employee_number": "EMP001",
      "full_name": "John Doe",
      "phone": "08123456789",
      "address": "Jl. Sudirman No. 1",
      "employment_type": "permanent",
      "work_mode": "wfo",
      "start_date": "2024-01-15",
      "branch": { "id": "uuid", "name": "Jakarta HQ" },
      "department": { "id": "uuid", "name": "Engineering" },
      "position": { "id": "uuid", "name": "Software Engineer" },
      "manager": { "id": "uuid", "full_name": "Jane Smith" }
    }
  }
}
```

---

### PATCH /me
Update current user profile (limited fields).

**Request Body:**
```json
{
  "phone": "08198765432",
  "address": "Jl. Gatot Subroto No. 5",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "08111222333"
}
```

**Allowed Fields:** `phone`, `address`, `emergency_contact_name`, `emergency_contact_phone`

---

### POST /me/change-password
Change current password.

**Request Body:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!",
  "new_password_confirmation": "NewPass456!"
}
```

---

## 3. Attendance

### POST /attendance/clock-in
Clock in with selfie photo.

**Request Body (multipart/form-data):**
```
photo: <file> (required, JPEG/PNG, max 5MB)
work_mode: "wfo" | "wfh" (required)
latitude: -6.2088 (optional, required if geofence enabled)
longitude: 106.8456 (optional, required if geofence enabled)
device_info: "Chrome 120, macOS" (optional)
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "attendance_date": "2024-01-19",
    "clock_in": "2024-01-19T08:05:00+07:00",
    "work_mode": "wfo",
    "status": "late",
    "late_minutes": 5,
    "late_deduction_amount": 25000,
    "message": "Clock in recorded. You are 5 minutes late."
  }
}
```

**Error (422) - Geofence:**
```json
{
  "success": false,
  "error": {
    "code": "GEOFENCE_VIOLATION",
    "message": "Your location is outside the allowed office area",
    "details": {
      "distance_meters": 1500,
      "allowed_radius_meters": 500
    }
  }
}
```

---

### POST /attendance/clock-out
Clock out with selfie photo.

**Request Body (multipart/form-data):**
```
photo: <file> (required)
latitude: -6.2088 (optional)
longitude: 106.8456 (optional)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "clock_out": "2024-01-19T17:30:00+07:00",
    "total_work_hours": 8.42,
    "overtime_minutes": 30,
    "message": "Clock out recorded. Have a nice day!"
  }
}
```

---

### GET /attendance
Get attendance history.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| start_date | date | first day of month | Start date filter |
| end_date | date | today | End date filter |
| status | string | all | present/late/absent/leave |
| page | int | 1 | Page number |
| limit | int | 20 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "attendance_date": "2024-01-19",
      "clock_in": "2024-01-19T08:00:00+07:00",
      "clock_out": "2024-01-19T17:00:00+07:00",
      "work_mode": "wfo",
      "status": "present",
      "late_minutes": 0,
      "overtime_minutes": 0,
      "is_corrected": false
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 19,
    "total_pages": 1
  }
}
```

---

### GET /attendance/today
Get today's attendance status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "has_clocked_in": true,
    "has_clocked_out": false,
    "attendance": {
      "id": "uuid",
      "clock_in": "2024-01-19T08:00:00+07:00",
      "work_mode": "wfo",
      "status": "present"
    },
    "schedule": {
      "shift_name": "Regular",
      "start_time": "08:00",
      "end_time": "17:00"
    }
  }
}
```

---

### GET /attendance/recap
Get attendance recap summary.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| period | string | monthly | daily/monthly/yearly |
| month | int | current | Month (1-12) |
| year | int | current | Year |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "2024-01",
    "total_work_days": 22,
    "present": 18,
    "late": 2,
    "absent": 1,
    "leave": 1,
    "total_late_minutes": 35,
    "total_overtime_minutes": 180,
    "total_deductions": 75000
  }
}
```

---

### POST /attendance/corrections
Submit attendance correction request.

**Request Body (multipart/form-data):**
```
attendance_date: "2024-01-18" (required)
requested_clock_in: "08:00" (optional)
requested_clock_out: "17:00" (optional)
reason: "Lupa clock out karena meeting urgent" (required)
evidence: <file> (optional, PDF/image)
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending",
    "message": "Correction request submitted. Waiting for manager approval."
  }
}
```

---

### GET /attendance/corrections
Get my correction requests.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "attendance_date": "2024-01-18",
      "requested_clock_in": "08:00:00",
      "requested_clock_out": "17:00:00",
      "reason": "Lupa clock out",
      "status": "pending",
      "created_at": "2024-01-19T09:00:00+07:00"
    }
  ]
}
```

---

## 4. Leave

### GET /leave/types
Get available leave types.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "ANNUAL",
      "name": "Cuti Tahunan",
      "default_balance": 12,
      "is_paid": true,
      "requires_attachment": false
    },
    {
      "id": "uuid",
      "code": "SICK",
      "name": "Sakit",
      "default_balance": 14,
      "is_paid": true,
      "requires_attachment": true
    }
  ]
}
```

---

### GET /leave/balance
Get my leave balances.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "leave_type": {
        "id": "uuid",
        "code": "ANNUAL",
        "name": "Cuti Tahunan"
      },
      "year": 2024,
      "initial_balance": 12,
      "used_balance": 3,
      "remaining_balance": 9,
      "expiry_date": "2024-12-31"
    }
  ]
}
```

---

### POST /leave/requests
Submit leave request.

**Request Body (multipart/form-data):**
```
leave_type_id: "uuid" (required)
start_date: "2024-02-01" (required)
end_date: "2024-02-03" (required)
reason: "Family vacation" (required)
delegate_to: "uuid" (optional, employee to delegate tasks)
attachment: <file> (optional, required for sick leave)
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "leave_type": "Cuti Tahunan",
    "start_date": "2024-02-01",
    "end_date": "2024-02-03",
    "total_days": 3,
    "status": "pending",
    "balance_after": 6,
    "message": "Leave request submitted. Waiting for manager approval."
  }
}
```

**Error (422) - Insufficient Balance:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Saldo cuti tidak mencukupi",
    "details": {
      "requested_days": 5,
      "remaining_balance": 3
    }
  }
}
```

---

### GET /leave/requests
Get my leave requests.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | all | pending/approved/rejected/cancelled |
| year | int | current | Year filter |
| page | int | 1 | |
| limit | int | 20 | |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "leave_type": { "id": "uuid", "name": "Cuti Tahunan" },
      "start_date": "2024-02-01",
      "end_date": "2024-02-03",
      "total_days": 3,
      "reason": "Family vacation",
      "status": "pending",
      "approved_by_manager": null,
      "approved_by_hrd": null,
      "created_at": "2024-01-19T10:00:00+07:00"
    }
  ]
}
```

---

### DELETE /leave/requests/:id
Cancel leave request (only if pending).

**Response (200):**
```json
{
  "success": true,
  "message": "Leave request cancelled"
}
```

**Error (422):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "Cannot cancel approved leave request"
  }
}
```

---

## 5. Dashboard

### GET /dashboard/employee
Get employee dashboard data.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "attendance_today": {
      "has_clocked_in": true,
      "has_clocked_out": false,
      "clock_in": "08:00",
      "work_mode": "wfo"
    },
    "leave_balance": {
      "annual": 9,
      "sick": 14
    },
    "schedule_today": {
      "shift": "Regular",
      "start_time": "08:00",
      "end_time": "17:00"
    },
    "pending_requests": [
      {
        "type": "leave",
        "id": "uuid",
        "title": "Cuti Tahunan",
        "status": "pending",
        "created_at": "2024-01-18"
      }
    ],
    "recent_payslip": {
      "id": "uuid",
      "period": "Desember 2023",
      "net_salary": 15000000,
      "published_at": "2024-01-05"
    },
    "active_kpi": [
      {
        "id": "uuid",
        "title": "Complete 10 features",
        "progress": 70,
        "target": 10,
        "current": 7
      }
    ],
    "announcements": [
      {
        "id": "uuid",
        "title": "Holiday Schedule 2024",
        "published_at": "2024-01-15",
        "is_read": false
      }
    ]
  }
}
```

---

### GET /dashboard/hrd
Get HRD dashboard data.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| branch_id | uuid | all | Filter by branch |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "attendance_today": {
      "total_employees": 150,
      "present": 120,
      "late": 15,
      "absent": 10,
      "on_leave": 5
    },
    "attendance_trend": {
      "period": "7_days",
      "data": [
        { "date": "2024-01-13", "present": 140, "late": 5, "absent": 5 },
        { "date": "2024-01-14", "present": 0, "late": 0, "absent": 0 },
        { "date": "2024-01-15", "present": 145, "late": 3, "absent": 2 }
      ]
    },
    "pending_approvals": {
      "leave_requests": 5,
      "attendance_corrections": 3,
      "travel_requests": 2,
      "letter_requests": 1
    },
    "expiring_contracts": [
      {
        "employee_id": "uuid",
        "full_name": "John Doe",
        "end_date": "2024-02-28",
        "days_remaining": 40
      }
    ],
    "compliance_alerts": [
      {
        "type": "mass_late",
        "message": "15 employees late today",
        "branch": "Jakarta HQ"
      }
    ]
  }
}
```

---

### GET /dashboard/manager
Get manager dashboard data.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "team_attendance_today": {
      "total": 10,
      "present": 8,
      "late": 1,
      "absent": 0,
      "on_leave": 1
    },
    "team_leave_balance": {
      "low_balance_count": 2,
      "employees": [
        { "id": "uuid", "name": "Jane Doe", "annual_remaining": 1 }
      ]
    },
    "pending_approvals": [
      {
        "type": "leave",
        "id": "uuid",
        "employee": "Jane Doe",
        "title": "Cuti Tahunan - 3 days",
        "submitted_at": "2024-01-18"
      }
    ],
    "team_kpi_progress": {
      "on_track": 6,
      "at_risk": 2,
      "behind": 2
    }
  }
}
```

---

## 6. Approvals (Manager/HRD)

### GET /approvals
Get pending approvals for current user.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| type | string | leave/correction/shift_swap/travel/expense/letter |
| status | string | pending/approved/rejected |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "leave",
      "employee": {
        "id": "uuid",
        "full_name": "Jane Doe",
        "department": "Engineering"
      },
      "details": {
        "leave_type": "Cuti Tahunan",
        "start_date": "2024-02-01",
        "end_date": "2024-02-03",
        "reason": "Family vacation"
      },
      "status": "pending",
      "submitted_at": "2024-01-19T10:00:00+07:00"
    }
  ]
}
```

---

### POST /approvals/:id/approve
Approve a request.

**Request Body:**
```json
{
  "comment": "Approved. Have a nice vacation!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Request approved successfully"
}
```

---

### POST /approvals/:id/reject
Reject a request.

**Request Body:**
```json
{
  "reason": "Project deadline conflict. Please reschedule."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Request rejected"
}
```

---

## 7. HRD Admin (MVP)

### POST /admin/users/:id/approve
Approve pending user registration.

**Request Body:**
```json
{
  "branch_id": "uuid",
  "department_id": "uuid",
  "position_id": "uuid",
  "manager_id": "uuid",
  "employee_number": "EMP001",
  "employment_type": "permanent",
  "work_mode": "wfo",
  "start_date": "2024-01-20"
}
```

---

### POST /admin/users/:id/reject
Reject pending user registration.

**Request Body:**
```json
{
  "reason": "Duplicate registration. Please contact HR."
}
```

---

### GET /admin/employees
List all employees (with filters).

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| branch_id | uuid | Filter by branch |
| department_id | uuid | Filter by department |
| status | string | active/inactive/terminated |
| search | string | Search name/email/employee_number |
| page | int | Page |
| limit | int | Limit |

---

### GET /admin/attendance/recap
Get attendance recap for all employees.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| branch_id | uuid | Filter by branch |
| department_id | uuid | Filter by department |
| date | date | Specific date |
| month | int | Month (1-12) |
| year | int | Year |

---

## 8. Payslip

### GET /payslips
Get my payslips.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| year | int | Filter by year |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "period": "Desember 2023",
      "period_start": "2023-12-01",
      "period_end": "2023-12-31",
      "gross_salary": 18000000,
      "total_deductions": 3000000,
      "net_salary": 15000000,
      "status": "published",
      "published_at": "2024-01-05T10:00:00+07:00"
    }
  ]
}
```

---

### GET /payslips/:id
Get payslip detail.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "period": "Desember 2023",
    "components": {
      "earnings": [
        { "name": "Gaji Pokok", "amount": 15000000 },
        { "name": "Tunjangan Transport", "amount": 2000000 },
        { "name": "Tunjangan Makan", "amount": 1000000 }
      ],
      "deductions": [
        { "name": "BPJS Kesehatan", "amount": 500000 },
        { "name": "BPJS Ketenagakerjaan", "amount": 300000 },
        { "name": "PPh 21", "amount": 2200000 }
      ]
    },
    "gross_salary": 18000000,
    "total_deductions": 3000000,
    "net_salary": 15000000,
    "pdf_url": "/payslips/uuid/download"
  }
}
```

---

### GET /payslips/:id/download
Download payslip PDF.

**Response:** PDF file with `Content-Type: application/pdf`

---

## Rate Limiting

| Endpoint Pattern | Limit |
|-----------------|-------|
| POST /auth/login | 5 per minute per IP |
| POST /auth/register | 3 per minute per IP |
| POST /attendance/* | 10 per minute per user |
| GET /* | 60 per minute per user |
| POST /* | 30 per minute per user |

---

## Pagination

All list endpoints support pagination:

```
?page=1&limit=20
```

Response includes `meta`:
```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 9. Travel Request

### POST /travel-requests
Submit travel request.

**Request Body:**
```json
{
  "destination": "Surabaya",
  "start_date": "2024-02-15",
  "end_date": "2024-02-17",
  "purpose": "Client meeting for Project ABC",
  "estimated_budget": 5000000,
  "currency": "IDR"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "destination": "Surabaya",
    "start_date": "2024-02-15",
    "end_date": "2024-02-17",
    "status": "pending",
    "message": "Travel request submitted. Waiting for manager approval."
  }
}
```

---

### GET /travel-requests
Get my travel requests.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | pending/approved/rejected/cancelled |
| year | int | Filter by year |

---

### GET /travel-requests/:id
Get travel request detail.

---

### DELETE /travel-requests/:id
Cancel travel request (only if pending).

---

## 10. Expense & Reimbursement

### GET /expense-categories
Get available expense categories.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "TICKET",
      "name": "Tiket Pesawat/Kereta",
      "max_amount": 2000000,
      "requires_receipt": true
    },
    {
      "id": "uuid",
      "code": "HOTEL",
      "name": "Hotel",
      "max_amount": 700000,
      "requires_receipt": true
    },
    {
      "id": "uuid",
      "code": "TRANSPORT",
      "name": "Transportasi Lokal",
      "max_amount": 300000,
      "requires_receipt": true
    }
  ]
}
```

---

### POST /expenses
Submit expense/reimbursement request.

**Request Body (multipart/form-data):**
```
travel_request_id: "uuid" (optional, link to travel)
category_id: "uuid" (required)
description: "Tiket pesawat Jakarta-Surabaya PP" (required)
amount: 1500000 (required)
currency: "IDR" (default IDR)
expense_date: "2024-02-15" (required)
receipt: <file> (required if category requires_receipt)
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "category": "Tiket Pesawat/Kereta",
    "amount": 1500000,
    "status": "pending",
    "message": "Expense submitted. Waiting for manager approval."
  }
}
```

**Error (422) - Over Plafon:**
```json
{
  "success": false,
  "error": {
    "code": "PLAFON_EXCEEDED",
    "message": "Jumlah melebihi plafon kategori",
    "details": {
      "amount": 2500000,
      "max_amount": 2000000
    }
  }
}
```

---

### GET /expenses
Get my expense requests.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | pending/approved/rejected/paid |
| travel_request_id | uuid | Filter by travel |
| year | int | Filter by year |

---

### GET /expenses/:id
Get expense detail.

---

## 11. Overtime Request

### POST /overtime-requests
Submit overtime request.

**Request Body:**
```json
{
  "overtime_date": "2024-01-20",
  "planned_start_time": "18:00",
  "planned_end_time": "21:00",
  "reason": "Project deadline for Client XYZ",
  "task_description": "Complete API integration and testing"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "overtime_date": "2024-01-20",
    "planned_hours": 3,
    "overtime_type": "regular",
    "overtime_rate": 1.5,
    "status": "pending",
    "message": "Overtime request submitted. Waiting for manager approval."
  }
}
```

---

### GET /overtime-requests
Get my overtime requests.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | pending/approved/rejected/completed |
| month | int | Filter by month |
| year | int | Filter by year |

---

### GET /overtime-requests/:id
Get overtime request detail.

---

### PATCH /overtime-requests/:id/complete
Update overtime with actual hours (after clock out).

**Request Body:**
```json
{
  "task_description": "Completed API integration, fixed 3 bugs, deployed to staging"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "actual_start_time": "18:05",
    "actual_end_time": "21:30",
    "actual_hours": 3.42,
    "status": "completed"
  }
}
```

---

## 12. KPI (Key Performance Indicator)

### GET /kpi/cycles
Get available KPI cycles.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Q1 2024",
      "start_date": "2024-01-01",
      "end_date": "2024-03-31",
      "status": "active"
    }
  ]
}
```

---

### GET /kpi/goals
Get my KPI goals.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| cycle_id | uuid | Filter by cycle |
| status | string | active/completed/cancelled |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Complete 10 Features",
      "description": "Deliver 10 new features for Project ABC",
      "target_value": 10,
      "unit": "features",
      "weight": 30,
      "current_value": 7,
      "achievement_percentage": 70,
      "status": "active",
      "cycle": {
        "id": "uuid",
        "name": "Q1 2024"
      }
    }
  ]
}
```

---

### PATCH /kpi/goals/:id
Update KPI progress (self check-in).

**Request Body:**
```json
{
  "current_value": 8,
  "note": "Completed feature #8: User Authentication module"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "current_value": 8,
    "achievement_percentage": 80,
    "message": "Progress updated successfully"
  }
}
```

**Error (422) - Cycle Closed:**
```json
{
  "success": false,
  "error": {
    "code": "CYCLE_CLOSED",
    "message": "Cannot update KPI, cycle is already closed"
  }
}
```

---

### GET /kpi/goals/:id/history
Get KPI update history.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "previous_value": 7,
      "new_value": 8,
      "note": "Completed feature #8",
      "updated_by": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "updated_at": "2024-01-19T15:00:00+07:00"
    }
  ]
}
```

---

## 13. Document & Letter Request

### GET /documents
Get my documents.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| type | string | contract/nda/bpjs/npwp/ktp/other |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "contract",
      "name": "Employment Contract 2024",
      "version": 1,
      "valid_from": "2024-01-01",
      "valid_until": "2024-12-31",
      "download_url": "/documents/uuid/download"
    }
  ]
}
```

---

### GET /documents/:id/download
Download document (signed URL).

**Response:** Redirects to signed URL or returns file.

---

### GET /letter-categories
Get available letter categories.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "SKK",
      "name": "Surat Keterangan Kerja",
      "requires_manager_approval": false,
      "template_fields": ["purpose"]
    },
    {
      "id": "uuid",
      "code": "SPD",
      "name": "Surat Perjalanan Dinas",
      "requires_manager_approval": true,
      "template_fields": ["destination", "start_date", "end_date", "purpose"]
    }
  ]
}
```

---

### POST /letter-requests
Submit letter request.

**Request Body:**
```json
{
  "letter_category_id": "uuid",
  "payload": {
    "purpose": "Pengajuan KPR Bank ABC"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "category": "Surat Keterangan Kerja",
    "status": "pending",
    "message": "Letter request submitted. Waiting for HRD approval."
  }
}
```

---

### GET /letter-requests
Get my letter requests.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | pending/approved/rejected/issued |

---

### GET /letter-requests/:id
Get letter request detail.

---

### GET /letter-requests/:id/download
Download issued letter PDF.

---

## 14. Announcement

### GET /announcements
Get announcements for current user.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| is_read | boolean | Filter read/unread |
| page | int | Page |
| limit | int | Limit |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Holiday Schedule 2024",
      "content": "Berikut jadwal libur nasional tahun 2024...",
      "published_at": "2024-01-15T10:00:00+07:00",
      "expires_at": "2024-12-31T23:59:59+07:00",
      "is_read": false,
      "read_at": null
    }
  ]
}
```

---

### GET /announcements/:id
Get announcement detail.

---

### POST /announcements/:id/read
Mark announcement as read.

**Response (200):**
```json
{
  "success": true,
  "message": "Announcement marked as read"
}
```

---

## 15. Notification

### GET /notifications
Get my notifications.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| is_read | boolean | Filter read/unread |
| channel | string | in_app/email |
| page | int | Page |
| limit | int | Limit |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Leave Request Approved",
      "message": "Your leave request for Feb 1-3 has been approved by your manager.",
      "link": "/leave/requests/uuid",
      "channel": "in_app",
      "is_read": false,
      "created_at": "2024-01-19T14:00:00+07:00"
    }
  ],
  "meta": {
    "unread_count": 5
  }
}
```

---

### POST /notifications/:id/read
Mark notification as read.

---

### POST /notifications/read-all
Mark all notifications as read.

---

### GET /notification-preferences
Get my notification preferences.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "event_type": "leave_approved",
      "email_enabled": true,
      "in_app_enabled": true,
      "frequency": "realtime"
    },
    {
      "event_type": "payslip_published",
      "email_enabled": true,
      "in_app_enabled": true,
      "frequency": "realtime"
    }
  ]
}
```

---

### PATCH /notification-preferences
Update notification preferences.

**Request Body:**
```json
{
  "preferences": [
    {
      "event_type": "announcement_new",
      "email_enabled": false,
      "in_app_enabled": true
    }
  ]
}
```

---

## 16. Bank Change Request

### POST /bank-change-requests
Submit bank account change request.

**Request Body (multipart/form-data):**
```
new_bank_name: "Bank Central Asia" (required)
new_account_number: "1234567890" (required)
new_account_holder: "John Doe" (required)
new_bank_branch: "KCP Sudirman" (optional)
reason: "Ganti ke rekening payroll baru" (optional)
supporting_document: <file> (optional, foto buku tabungan)
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending",
    "message": "Bank change request submitted. Waiting for HRD approval."
  }
}
```

---

### GET /bank-change-requests
Get my bank change requests.

---

### GET /bank-change-requests/:id
Get bank change request detail.

---

## 17. Delegation

### POST /delegations
Create approval delegation.

**Request Body:**
```json
{
  "delegate_id": "uuid",
  "delegation_type": "approval",
  "request_types": ["leave", "correction"],
  "start_date": "2024-02-01",
  "end_date": "2024-02-05",
  "reason": "Cuti tahunan"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "delegate": {
      "id": "uuid",
      "full_name": "Jane Smith"
    },
    "start_date": "2024-02-01",
    "end_date": "2024-02-05",
    "is_active": true,
    "message": "Delegation created successfully"
  }
}
```

**Error (422):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DELEGATE",
    "message": "Delegate must have same or higher role level"
  }
}
```

---

### GET /delegations
Get my delegations (as delegator).

---

### GET /delegations/received
Get delegations I received (as delegate).

---

### DELETE /delegations/:id
Cancel/deactivate delegation.

---

## 18. Session Management

### GET /sessions
Get my active sessions.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ip_address": "192.168.1.100",
      "user_agent": "Chrome 120, macOS",
      "device_fingerprint": "abc123...",
      "last_activity_at": "2024-01-19T15:30:00+07:00",
      "is_current": true,
      "created_at": "2024-01-19T08:00:00+07:00"
    },
    {
      "id": "uuid",
      "ip_address": "10.0.0.50",
      "user_agent": "Safari, iOS 17",
      "last_activity_at": "2024-01-18T20:00:00+07:00",
      "is_current": false,
      "created_at": "2024-01-18T09:00:00+07:00"
    }
  ]
}
```

---

### DELETE /sessions/:id
Revoke specific session.

**Response (200):**
```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

---

### DELETE /sessions
Revoke all sessions except current.

**Response (200):**
```json
{
  "success": true,
  "message": "All other sessions revoked"
}
```

---

## 19. Admin Endpoints (HRD/Finance)

### POST /admin/leave/balance/adjust
Adjust employee leave balance (HRD only).

**Request Body:**
```json
{
  "employee_id": "uuid",
  "leave_type_id": "uuid",
  "adjustment": 2,
  "reason": "Kompensasi cuti tahun lalu yang belum diambil"
}
```

---

### POST /admin/payslips/generate
Generate payslips for period (Finance only).

**Request Body:**
```json
{
  "period_start": "2024-01-01",
  "period_end": "2024-01-31",
  "branch_id": "uuid",
  "preview": true
}
```

---

### POST /admin/payslips/publish
Publish payslips (Finance only).

**Request Body:**
```json
{
  "payslip_ids": ["uuid1", "uuid2"],
  "notify_employees": true
}
```

---

### POST /admin/letters/:id/issue
Issue letter (HRD only).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "letter_number": "SKK/KAS/HRD/I/2024/001",
    "status": "issued",
    "pdf_url": "/letter-requests/uuid/download"
  }
}
```

---

### GET /admin/audit-logs
Get audit logs (HRD/IT only).

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| action | string | Filter by action type |
| actor_id | uuid | Filter by actor |
| object_type | string | Filter by object type |
| start_date | date | Start date |
| end_date | date | End date |
| page | int | Page |
| limit | int | Limit |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "payslip.publish",
      "actor": {
        "id": "uuid",
        "email": "finance@company.com"
      },
      "object_type": "payslip",
      "object_id": "uuid",
      "before_data": { "status": "draft" },
      "after_data": { "status": "published" },
      "ip_address": "192.168.1.100",
      "created_at": "2024-01-19T10:00:00+07:00"
    }
  ]
}
```

---

### POST /admin/violations
Create violation notice (HRD only).

**Request Body:**
```json
{
  "employee_id": "uuid",
  "violation_type": "Keterlambatan berulang",
  "description": "Terlambat 5x dalam bulan Januari 2024",
  "violation_date": "2024-01-19",
  "consequence": "Surat Peringatan 1 (SP1)"
}
```

---

## 20. Additional Admin Endpoints

### GET /admin/employees/:id
Get employee detail (HRD only).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_number": "EMP001",
    "full_name": "John Doe",
    "email": "john.doe@company.com",
    "phone": "08123456789",
    "nik": "3201234567890001",
    "npwp": "12.345.678.9-012.000",
    "bpjs_kesehatan": "0001234567890",
    "bpjs_ketenagakerjaan": "12345678901",
    "employment_type": "permanent",
    "work_mode": "wfo",
    "start_date": "2024-01-15",
    "end_date": null,
    "status": "active",
    "branch": { "id": "uuid", "name": "Jakarta HQ" },
    "department": { "id": "uuid", "name": "Engineering" },
    "position": { "id": "uuid", "name": "Software Engineer" },
    "manager": { "id": "uuid", "full_name": "Jane Smith" },
    "bank_info": {
      "bank_name": "Bank Central Asia",
      "account_number": "1234567890",
      "account_holder": "John Doe",
      "bank_branch": "KCP Sudirman"
    },
    "emergency_contact": {
      "name": "Jane Doe",
      "phone": "08111222333"
    },
    "created_at": "2024-01-15T00:00:00+07:00",
    "updated_at": "2024-01-19T10:00:00+07:00"
  }
}
```

---

### PATCH /admin/employees/:id
Update employee data (HRD only).

**Request Body:**
```json
{
  "branch_id": "uuid",
  "department_id": "uuid",
  "position_id": "uuid",
  "manager_id": "uuid",
  "employment_type": "contract",
  "work_mode": "hybrid",
  "end_date": "2024-12-31",
  "status": "active"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "id": "uuid",
    "employee_number": "EMP001",
    "full_name": "John Doe"
  }
}
```

**Note:** Perubahan data sensitif (bank, NPWP, BPJS) harus melalui request khusus dengan approval.

---

### GET /admin/attendance/:id
Get attendance detail (HRD only).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee": {
      "id": "uuid",
      "employee_number": "EMP001",
      "full_name": "John Doe"
    },
    "attendance_date": "2024-01-19",
    "clock_in": "2024-01-19T08:05:00+07:00",
    "clock_out": "2024-01-19T17:30:00+07:00",
    "work_mode": "wfo",
    "status": "late",
    "late_minutes": 5,
    "overtime_minutes": 30,
    "late_deduction_amount": 25000,
    "clock_in_photo_url": "https://storage.peoplehub.com/photos/xxx.jpg",
    "clock_out_photo_url": "https://storage.peoplehub.com/photos/yyy.jpg",
    "clock_in_location": {
      "latitude": -6.2088,
      "longitude": 106.8456
    },
    "clock_out_location": {
      "latitude": -6.2088,
      "longitude": 106.8456
    },
    "device_info": "Chrome 120, macOS",
    "is_corrected": false,
    "correction_history": []
  }
}
```

---

### POST /admin/attendance/manual
Create manual attendance entry (HRD only, for special cases).

**Request Body:**
```json
{
  "employee_id": "uuid",
  "attendance_date": "2024-01-19",
  "clock_in": "08:00",
  "clock_out": "17:00",
  "work_mode": "wfo",
  "reason": "System outage - manual entry required",
  "evidence_url": "https://storage.peoplehub.com/evidence/xxx.pdf"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "uuid",
    "attendance_date": "2024-01-19",
    "status": "present",
    "is_manual_entry": true,
    "created_by": {
      "id": "uuid",
      "email": "hrd@company.com"
    },
    "message": "Manual attendance created successfully"
  }
}
```

**Note:** Manual entry akan dicatat di audit log dengan flag `is_manual_entry: true`.

---

## 21. System Endpoints

### GET /health
Health check endpoint (no authentication required).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-19T15:00:00+07:00",
    "services": {
      "database": "healthy",
      "cache": "healthy",
      "storage": "healthy",
      "email": "healthy"
    }
  }
}
```

**Response (503 - Degraded):**
```json
{
  "success": false,
  "data": {
    "status": "degraded",
    "timestamp": "2024-01-19T15:00:00+07:00",
    "services": {
      "database": "healthy",
      "cache": "unhealthy",
      "storage": "healthy",
      "email": "healthy"
    }
  }
}
```

---

### GET /version
Get API version info (no authentication required).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "api_version": "v1",
    "app_version": "2.1.0",
    "build_number": "20240119-001",
    "environment": "production",
    "supported_versions": ["v1"],
    "deprecated_versions": [],
    "documentation_url": "https://docs.peoplehub.kreatifindo.com/api/v1"
  }
}
```

---

## Webhook Events

PeopleHub dapat mengirim webhook ke sistem eksternal untuk event tertentu:

### Employee Events
| Event | Payload | Trigger |
|-------|---------|---------|
| `employee.created` | Employee data | Saat registrasi di-approve |
| `employee.updated` | Employee data + changed fields | Saat data employee diupdate |
| `employee.terminated` | Employee data + termination info | Saat employee di-terminate |

### Attendance Events
| Event | Payload | Trigger |
|-------|---------|---------|
| `attendance.clock_in` | Attendance data | Saat clock in |
| `attendance.clock_out` | Attendance data | Saat clock out |
| `attendance.correction_approved` | Correction data | Saat koreksi di-approve |

### Leave & Approval Events
| Event | Payload | Trigger |
|-------|---------|---------|
| `leave.approved` | Leave request data | Saat cuti di-approve final |
| `leave.rejected` | Leave request data | Saat cuti ditolak |

### Payroll Events
| Event | Payload | Trigger |
|-------|---------|---------|
| `payslip.published` | Payslip summary | Saat slip gaji dipublish |
| `expense.paid` | Expense data | Saat expense dibayar |

### Performance Events
| Event | Payload | Trigger |
|-------|---------|---------|
| `kpi.goal_completed` | KPI goal data | Saat target KPI tercapai 100% |

### Document Events
| Event | Payload | Trigger |
|-------|---------|---------|
| `document.expired` | Document data | Saat dokumen expired (1 hari sebelum) |
| `letter.issued` | Letter data | Saat surat diterbitkan |

**Webhook Format:**
```json
{
  "event": "leave.approved",
  "timestamp": "2024-01-19T14:00:00+07:00",
  "tenant_id": "uuid",
  "data": {
    // Event-specific data
  },
  "signature": "hmac_sha256_signature"
}
```

**Webhook Security:**
- Semua webhook di-sign menggunakan HMAC-SHA256
- Signature ada di header `X-PeopleHub-Signature`
- Webhook secret di-generate per tenant
- Retry policy: 3x dengan exponential backoff (5s, 30s, 5min)

---

## Dokumen Terkait
- [19-skema-database-erd.md](19-skema-database-erd.md) - Database schema
- [23-security-policy.md](23-security-policy.md) - Security & authentication
- [21-env-configuration.md](21-env-configuration.md) - Environment variables

