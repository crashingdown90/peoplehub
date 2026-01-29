# AG Integration Guide for CL/CX

> **From:** Antigravity (AG)  
> **To:** Claude AI (CL) & Codex GPT (CX)  
> **Date:** 2026-01-19

---

## Available Imports

### From `@/types`

```typescript
// Enums
import { UserRole, UserStatus, AttendanceStatus, ApprovalStatus, ... } from '@/types';

// Types
import { Employee, Attendance, LeaveRequest, Notification, ... } from '@/types';

// API Types
import { ApiResponse, PaginatedResponse, ApiError } from '@/types';

// Component Types (for CX)
import { ButtonProps, ModalProps, TableColumn, BadgeVariant, ... } from '@/types';

// Service Types (for CL)
import { DashboardStats, AdminDashboardStats, RequestContextData } from '@/types';
```

### From `@/constants`

```typescript
// Role management
import { ROLE_LABELS, ROLE_HIERARCHY, isAdminRole, canApproveLeave } from '@/constants';

// Status labels & colors
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_COLORS } from '@/constants';

// Permissions (RBAC)
import { PERMISSIONS, hasPermission, hasAnyPermission } from '@/constants';

// App config
import { APP_CONFIG, PAGINATION, TOAST_CONFIG } from '@/constants';

// Routes
import { ROUTES, API_ROUTES, ADMIN_ROUTES } from '@/constants';
```

### From `@/utils`

```typescript
// Date utilities (Indonesian locale)
import { formatDate, formatTime, formatDateTime, getRelativeTime } from '@/utils';

// Currency (Rupiah)
import { formatCurrency, formatCurrencyCompact, parseCurrency } from '@/utils';

// Validation (Indonesian formats)
import { validateEmail, validatePhone, validateNIK, validateNPWP } from '@/utils';

// Format utilities
import { getInitials, slugify, truncate, maskString } from '@/utils';

// Class names
import { cn } from '@/utils';

// Async helpers
import { sleep, debounce, throttle } from '@/utils';
```

### From `@/hooks`

```typescript
// For CX pages
import { 
  useAuth,           // Auth state & permissions
  useTenant,         // Multi-tenant context
  useEmployee,       // Employee profile
  useAttendance,     // Clock in/out
  useLeave,          // Leave balance/requests
  useNotifications,  // Notifications polling
} from '@/hooks';

// For CX components
import {
  useForm,           // Form state with Zod
  useToast,          // Toast notifications
  useModal,          // Modal state
  useTable,          // Table state management
  usePagination,     // Pagination state
  useDebounce,       // Debounce values
  useIsMobile,       // Responsive detection
} from '@/hooks';
```

### From `@/validations`

```typescript
// Auth forms
import { loginSchema, registerSchema, forgotPasswordSchema } from '@/validations';

// Employee forms
import { updateProfileSchema, createEmployeeSchema } from '@/validations';

// Leave forms
import { leaveRequestSchema, approveRejectLeaveSchema } from '@/validations';

// Attendance forms
import { clockInSchema, attendanceCorrectionSchema } from '@/validations';
```

---

## Usage Examples

### CL: Using Permissions in API

```typescript
// src/app/api/admin/users/route.ts
import { hasPermission, PERMISSIONS } from '@/constants';
import { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!hasPermission(session.role as UserRole, PERMISSIONS.ADMIN_USERS)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ... continue
}
```

### CX: Using Hooks in Page

```typescript
// src/app/(dashboard)/leave/page.tsx
import { useLeave, useToast, useModal } from '@/hooks';
import { leaveRequestSchema } from '@/validations';
import { ApprovalStatus } from '@/types';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_COLORS } from '@/constants';

export default function LeavePage() {
  const { balance, requests, submitRequest } = useLeave();
  const toast = useToast();
  const modal = useModal();
  
  // ...
}
```

### CX: Using Form Hook

```typescript
import { useForm } from '@/hooks';
import { loginSchema } from '@/validations';

function LoginForm() {
  const form = useForm({
    initialValues: { email: '', password: '' },
    schema: loginSchema,
    onSubmit: async (values) => {
      // Handle login
    },
  });
  
  return (
    <form onSubmit={form.handleSubmit}>
      <input {...form.getFieldProps('email')} />
      {form.errors.email && <span>{form.errors.email}</span>}
    </form>
  );
}
```

---

## Notes

- All date functions use **id-ID** locale
- All currency functions use **IDR (Rupiah)**
- All validation messages are in **Indonesian**
- Import from barrel exports (e.g., `@/types` not `@/types/auth.types`)

---

*@ai:ag - Integration guide by Antigravity*
