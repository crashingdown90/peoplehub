# AI Task Assignment - PeopleHub HRIS

*Generated: 2026-01-19*

---

## Audit Summary

### Current Progress

| Domain | Owner | Status | Files |
|--------|-------|--------|-------|
| Services Layer | CL | ✅ Complete | 12 files |
| API Routes | CL | ✅ Complete | 53 routes |
| Lint Fixes | CL | ✅ Complete | 26 files fixed |
| Types | AG | ✅ Complete | 13 files |
| Constants | AG | ✅ Complete | 6 files |
| Utils | AG | ✅ Complete | 6 files |
| Hooks | AG | ✅ Complete | 16 files |
| Validations | AG | ✅ Complete | 5 files |
| UI Components | CX | 🔄 Basic | 5 files |
| Pages | CX | 🔄 Functional | 15 pages |

### Gap Analysis

**Backend (CL Domain):**
- Missing: Notification Service, Webhook Dispatcher, Rate Limiting
- Missing: Bulk operations service
- Missing: Report generation service

**Infrastructure (AG Domain):**
- Missing: KPI types, Travel types, Reimburse types, Announcement types
- Missing: useKpi, useTravel, useReimburse hooks
- Missing: Additional form validations

**Frontend (CX Domain):**
- Missing: 15+ UI components (Modal, Select, Table, Badge, Avatar, etc.)
- Pages need polish: better loading states, error handling, accessibility
- Missing: Dark mode, responsive improvements

---

## Task Assignments

### Claude AI (CL) - Backend Services

**Priority: HIGH**

| # | Task | Complexity | Files |
|---|------|------------|-------|
| 1 | Create NotificationService | Medium | 2 files |
| 2 | Create WebhookDispatcher | Medium | 2 files |
| 3 | Create ReportService (attendance, leave reports) | High | 3 files |
| 4 | Add rate limiting middleware | Medium | 2 files |
| 5 | Add missing API routes for travel/reimburse list | Low | 4 files |
| 6 | Create BulkOperationService | Medium | 2 files |

**Priority: MEDIUM**

| # | Task | Complexity | Files |
|---|------|------------|-------|
| 7 | Add API route tests (jest/vitest) | High | 10+ files |
| 8 | Add service layer tests | High | 10+ files |
| 9 | Implement caching layer (Redis-ready) | Medium | 3 files |
| 10 | Add audit log enhancement | Low | 2 files |

**Estimated Total: 40+ files**

---

### Antigravity (AG) - Types, Hooks, Utils

**Priority: HIGH**

| # | Task | Complexity | Files |
|---|------|------------|-------|
| 1 | Add KPI types (period, indicator, target, score) | Low | 1 file |
| 2 | Add Travel types (request, expense, itinerary) | Low | 1 file |
| 3 | Add Reimburse types (request, item, receipt) | Low | 1 file |
| 4 | Add Announcement types | Low | 1 file |
| 5 | Create useKpi hook | Medium | 1 file |
| 6 | Create useTravel hook | Medium | 1 file |
| 7 | Create useReimburse hook | Medium | 1 file |
| 8 | Create useAnnouncements hook | Medium | 1 file |

**Priority: MEDIUM**

| # | Task | Complexity | Files |
|---|------|------------|-------|
| 9 | Add travel.schema.ts validation | Low | 1 file |
| 10 | Add reimburse.schema.ts validation | Low | 1 file |
| 11 | Add kpi.schema.ts validation | Low | 1 file |
| 12 | Create useFileUpload hook | Medium | 1 file |
| 13 | Create useGeolocation hook | Low | 1 file |
| 14 | Create usePermission hook (RBAC check) | Medium | 1 file |
| 15 | Add more date utils (working days calc, holidays) | Low | 1 file |

**Estimated Total: 16 files**

---

### Codex GPT (CX) - UI Components & Pages

**Priority: HIGH - Components**

| # | Task | Complexity | Files |
|---|------|------------|-------|
| 1 | Create Modal component | Medium | 1 file |
| 2 | Create Select/Dropdown component | Medium | 1 file |
| 3 | Create Table component (with sorting, pagination) | High | 1 file |
| 4 | Create Badge component | Low | 1 file |
| 5 | Create Avatar component | Low | 1 file |
| 6 | Create Alert component | Low | 1 file |
| 7 | Create Tabs component | Medium | 1 file |
| 8 | Create DatePicker component | High | 1 file |
| 9 | Create FileUpload component | Medium | 1 file |
| 10 | Create Skeleton/Loading component | Low | 1 file |

**Priority: HIGH - Pages Enhancement**

| # | Task | Complexity | Files |
|---|------|------------|-------|
| 11 | Enhance Dashboard with charts (use recharts) | High | 1 file |
| 12 | Enhance Payslips page (PDF preview, download) | Medium | 1 file |
| 13 | Enhance KPI page (progress bars, scoring) | Medium | 1 file |
| 14 | Enhance Travel page (itinerary form) | Medium | 1 file |
| 15 | Enhance Reimburse page (receipt upload) | Medium | 1 file |
| 16 | Enhance Profile page (edit profile, change password) | Medium | 1 file |
| 17 | Enhance Settings page (notification preferences) | Low | 1 file |

**Priority: MEDIUM**

| # | Task | Complexity | Files |
|---|------|------------|-------|
| 18 | Create Tooltip component | Low | 1 file |
| 19 | Create Popover component | Medium | 1 file |
| 20 | Create Toast/Notification component | Medium | 1 file |
| 21 | Create Breadcrumb component | Low | 1 file |
| 22 | Create Pagination component | Low | 1 file |
| 23 | Add dark mode support | High | Multiple |
| 24 | Improve mobile responsiveness | Medium | Multiple |

**Estimated Total: 30+ files**

---

## Prompts for Each AI

### Prompt untuk Claude AI (CL)

```
# Context
Kamu adalah Claude AI (CL) dalam tim multi-AI untuk pengembangan PeopleHub HRIS.
Domain kamu: Backend services, API routes, security, business logic.

# Current State
- Services: attendance, leave, payroll, employee, approval (DONE)
- API routes: 53 routes (DONE, lint fixed)
- Semua routes sudah ditandai dengan @ai:cl

# Your Tasks (Priority Order)

## FASE 1 - NotificationService
Buat NotificationService di src/services/notification/:
- notification.service.ts: create, markRead, markAllRead, getUnread, getAll
- Gunakan pattern yang sama dengan services lain (ServiceResponse)
- Integrasi dengan Prisma model Notification

## FASE 2 - WebhookDispatcher
Buat webhook dispatcher di src/lib/webhook/:
- webhook-dispatcher.ts: dispatch events ke registered webhooks
- Gunakan HMAC signature untuk security
- Queue mechanism untuk reliability
- Support events: attendance.*, leave.*, payroll.*

## FASE 3 - ReportService
Buat ReportService di src/services/report/:
- report.service.ts: generateAttendanceReport, generateLeaveReport, generatePayrollReport
- Export ke CSV/Excel format
- Date range filtering, department filtering

## FASE 4 - Rate Limiting
Tambahkan rate limiting:
- src/lib/rate-limit.ts: Redis-ready rate limiter
- Integrasi ke middleware.ts
- Config di src/constants/config.ts

## FASE 5 - Missing API Routes
Tambahkan routes yang kurang:
- GET /api/travel/requests (list user's travel requests)
- GET /api/reimburse/requests (list user's reimburse requests)
- Update routes untuk menggunakan services

# Rules
- Gunakan @ai:cl comment di setiap file baru
- Ikuti ServiceResponse pattern yang sudah ada
- Tenant isolation wajib (withTenant helper)
- Jangan ubah file milik AG atau CX
- Run lint setelah setiap fase: npm run lint

# Start
Mulai dari FASE 1. Selesaikan satu fase sebelum lanjut ke fase berikutnya.
Report progress di sync-log.md setelah setiap fase selesai.
```

---

### Prompt untuk Antigravity (AG)

```
# Context
Kamu adalah Antigravity AI (AG) dalam tim multi-AI untuk pengembangan PeopleHub HRIS.
Domain kamu: Types, constants, utils, hooks, validations.

# Current State
- Types: 13 files di src/types/ (DONE)
- Constants: 6 files di src/constants/ (DONE)
- Utils: 6 files di src/utils/ (DONE)
- Hooks: 16 files di src/hooks/ (DONE)
- Validations: 5 files di src/validations/ (DONE)

# Your Tasks (Priority Order)

## FASE 1 - Missing Types
Tambahkan type definitions yang kurang:

### src/types/kpi.types.ts
```typescript
export interface KpiPeriod { id, name, startDate, endDate, status }
export interface KpiIndicator { id, code, name, unit, targetType, weight }
export interface KpiTarget { id, periodId, indicatorId, employeeId, targetValue, actualValue, score }
```

### src/types/travel.types.ts
```typescript
export interface TravelRequest { id, employeeId, destination, purpose, departureDate, returnDate, status, estimatedBudget }
export interface TravelExpense { id, travelRequestId, category, amount, receipt }
```

### src/types/reimburse.types.ts
```typescript
export interface ReimburseRequest { id, employeeId, category, totalAmount, status, items }
export interface ReimburseItem { id, description, amount, receiptUrl }
```

### src/types/announcement.types.ts
```typescript
export interface Announcement { id, title, content, status, publishedAt, expiresAt }
```

Update src/types/index.ts untuk export semua.

## FASE 2 - Missing Hooks
Buat hooks baru di src/hooks/:

### useKpi.ts
- getMyTargets, updateActualValue
- Fetch dari /api/kpi/targets

### useTravel.ts
- getMyRequests, createRequest, cancelRequest
- Fetch dari /api/travel/requests

### useReimburse.ts
- getMyRequests, createRequest, cancelRequest
- Fetch dari /api/reimburse/requests

### useAnnouncements.ts
- getAnnouncements, dismissAnnouncement

Update src/hooks/index.ts untuk export semua.

## FASE 3 - Missing Validations
Tambahkan schema validations:

### src/validations/kpi.schema.ts
- kpiTargetUpdateSchema (actualValue, notes)

### src/validations/travel.schema.ts
- travelRequestSchema (destination, purpose, dates, budget)

### src/validations/reimburse.schema.ts
- reimburseRequestSchema (category, items, receipts)

Update src/validations/index.ts untuk export semua.

## FASE 4 - Additional Hooks
### useFileUpload.ts
- Upload file dengan progress tracking
- Support image compression

### useGeolocation.ts
- Get current location dengan error handling

### usePermission.ts
- Check user permission dari PERMISSIONS constant

## FASE 5 - Date Utils Enhancement
Update src/utils/date.ts:
- getWorkingDays(start, end, holidays)
- isHoliday(date, holidays)
- getNextWorkingDay(date)

# Rules
- Gunakan @ai:ag comment di setiap file
- Semua types harus export properly di index.ts
- Hooks harus return typed data
- Jangan ubah file milik CL atau CX
- Run lint setelah setiap fase

# Start
Mulai dari FASE 1. Report progress di sync-log.md.
```

---

### Prompt untuk Codex GPT (CX)

```
# Context
Kamu adalah Codex GPT (CX) dalam tim multi-AI untuk pengembangan PeopleHub HRIS.
Domain kamu: UI components, pages, styling, UX.

# Current State
- Components: 5 basic (Button, Card, Input, Sidebar) di src/components/ui/
- Pages: 15 pages di src/app/(dashboard)/ - functional tapi perlu polish

# Your Tasks (Priority Order)

## FASE 1 - Core UI Components
Buat komponen berikut di src/components/ui/:

### modal.tsx
- Modal dengan overlay, close button, animations
- Props: isOpen, onClose, title, children, size

### select.tsx
- Dropdown select dengan search, multi-select support
- Props: options, value, onChange, placeholder, isMulti

### table.tsx
- Table dengan sorting, pagination built-in
- Props: columns, data, onSort, pagination

### badge.tsx
- Status badge dengan variants (success, warning, error, info)
- Props: variant, children

### avatar.tsx
- Avatar dengan fallback initials
- Props: src, name, size

### alert.tsx
- Alert box dengan variants
- Props: variant, title, children

Update src/components/ui/index.ts untuk export semua.

## FASE 2 - Additional Components
### tabs.tsx
- Tab navigation component
- Props: tabs, activeTab, onChange

### date-picker.tsx
- Date picker dengan calendar popup
- Props: value, onChange, minDate, maxDate

### file-upload.tsx
- File upload dengan drag-drop, preview
- Props: accept, maxSize, onChange, multiple

### skeleton.tsx
- Loading skeleton untuk content placeholder
- Variants: text, circle, rectangle

### toast.tsx
- Toast notification system
- Functions: toast.success, toast.error, toast.info

## FASE 3 - Dashboard Enhancement
Update src/app/(dashboard)/dashboard/page.tsx:
- Tambahkan charts menggunakan recharts (install: npm i recharts)
- Widget: attendance rate, leave usage, pending approvals
- Quick actions: clock in, request leave, view payslip

## FASE 4 - Pages Polish
Update pages berikut untuk UX lebih baik:

### payslips/page.tsx
- Tambahkan PDF preview/download
- Better mobile layout

### kpi/page.tsx
- Progress bars untuk target achievement
- Scoring visualization

### travel/page.tsx
- Form dengan itinerary builder
- Expense tracking per item

### reimburse/page.tsx
- Receipt upload dengan preview
- Multiple items support

### profile/page.tsx
- Edit profile form
- Change password modal
- Profile photo upload

## FASE 5 - UX Improvements
- Semua pages: better loading states (gunakan Skeleton)
- Semua forms: proper error messages
- Mobile responsive check untuk semua pages
- Accessibility: proper labels, aria attributes

# Rules
- Gunakan @ai:cx comment di setiap file
- Styling: Tailwind CSS only, ikuti design system yang ada
- Import dari @/components/ui, @/hooks, @/lib
- Jangan ubah file milik CL atau AG
- Test di mobile viewport

# Dependencies Needed
```bash
npm install recharts lucide-react date-fns
```

# Start
Mulai dari FASE 1 - Core UI Components.
Selesaikan semua komponen di FASE 1 sebelum lanjut ke FASE 2.
Report progress di sync-log.md.
```

---

## Coordination Rules

1. **File Ownership**: Setiap AI hanya boleh edit file di domain masing-masing
2. **Sync Log**: Update .ai-config/sync-log.md setelah setiap fase selesai
3. **Lint Check**: Run `npm run lint` dan `npx tsc --noEmit` sebelum report selesai
4. **No Conflicts**: Jangan edit file dengan prefix @ai: milik AI lain
5. **Communication**: Jika butuh perubahan dari domain lain, minta via sync-log

## Priority Matrix

| Priority | CL Tasks | AG Tasks | CX Tasks |
|----------|----------|----------|----------|
| P0 (Critical) | NotificationService | Missing Types | Core Components |
| P1 (High) | WebhookDispatcher | Missing Hooks | Dashboard Charts |
| P2 (Medium) | ReportService | Validations | Pages Polish |
| P3 (Low) | Rate Limiting | Additional Hooks | Dark Mode |

---

*Document maintained by: Claude AI (CL)*
*Last updated: 2026-01-19*
