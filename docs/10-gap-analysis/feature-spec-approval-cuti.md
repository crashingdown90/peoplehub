# Feature Spec: Multi-Level Approval Cuti

> **Versi:** 1.0 | **Tanggal:** 23 Januari 2026 | **Status:** Final
> **Author:** Senior Engineer Specification Writer

---

## 1. Ringkasan Fitur

Sistem approval cuti berlapis (multi-level) dimana pengajuan cuti dari karyawan melewati beberapa tahapan persetujuan sesuai jenis cuti dan jumlah hari, dengan dukungan delegasi approver, eskalasi otomatis, dan notifikasi real-time.

---

## 2. Definisi Presisi

| Istilah | Definisi Eksak |
|---------|----------------|
| **Approval Level** | Tahapan persetujuan dengan actor tertentu; L1=Manager, L2=HRD, L3=Finance, L4=Direktur |
| **Approval Chain** | Urutan level yang harus dilalui berdasarkan jenis cuti dan kondisi |
| **SLA** | Service Level Agreement; batas waktu respons approver dalam hari kerja |
| **Eskalasi** | Perpindahan otomatis ke approver level lebih tinggi jika SLA terlewati |
| **Delegasi** | Pemindahan sementara wewenang approval ke user lain dengan periode aktif |
| **Override** | Aksi HRD menyetujui langsung tanpa menunggu level sebelumnya (dengan audit) |
| **Total Days** | Jumlah hari cuti dihitung EXCLUDE weekend dan hari libur nasional |

---

## 3. Approval Chain Matrix

### 3.1 Berdasarkan Jenis dan Durasi Cuti

| Jenis Cuti | Durasi | Approval Chain | Total SLA |
|------------|--------|----------------|-----------|
| Tahunan (ANNUAL) | 1-3 hari | Manager → HRD | 2 hari kerja |
| Tahunan (ANNUAL) | 4-5 hari | Manager → HRD | 3 hari kerja |
| Tahunan (ANNUAL) | > 5 hari | Manager → HRD → Direktur | 5 hari kerja |
| Sakit (SICK) | 1 hari | **Auto-approve** | Immediate |
| Sakit (SICK) | > 1 hari | HRD (dengan surat dokter) | 1 hari kerja |
| Khusus - Menikah | 3 hari | Manager → HRD | 2 hari kerja |
| Khusus - Melahirkan | 90 hari | HRD → Direktur | 3 hari kerja |
| Khusus - Duka | 3 hari | Manager (auto-forward HRD jika tidak respons 4 jam) | 1 hari kerja |
| Tidak Dibayar (UNPAID) | Any | Manager → HRD → Direktur | 5 hari kerja |

### 3.2 SLA per Level

| Level | Role | SLA | Eskalasi Ke | Notifikasi Reminder |
|-------|------|-----|-------------|---------------------|
| L1 | Manager/Atasan | 1 hari kerja | HRD | 50% SLA (4 jam), 80% SLA (6.5 jam) |
| L2 | HRD | 2 hari kerja | Super Admin | 50% SLA (1 hari), 80% SLA (1.5 hari) |
| L3 | Finance | 2 hari kerja | CFO | 50% SLA (1 hari), 80% SLA (1.5 hari) |
| L4 | Direktur | 2 hari kerja | Owner/Super Admin | 50% SLA (1 hari) |

---

## 4. State Machine Diagram

```
                                    ┌─────────────────────┐
                                    │                     │
    ┌──────────┐    Submit          │    ┌───────────┐   │
    │  DRAFT   │ ──────────────────►│    │  PENDING  │   │
    └──────────┘                    │    └───────────┘   │
                                    │          │         │
                                    │          ▼         │
                                    │   ┌─────────────┐  │
                                    │   │  PENDING_   │  │
                                    │   │  MANAGER    │  │
                                    │   └─────────────┘  │
                                    │     │         │    │
                                    │  Approve    Reject │
                                    │     │         │    │
                                    │     ▼         │    │
                                    │   ┌─────────────┐  │
                                    │   │  PENDING_   │  │    ┌──────────┐
                                    │   │    HRD     │──┼───►│ REJECTED │
                                    │   └─────────────┘  │    └──────────┘
                                    │     │              │           ▲
                                    │  Approve           │           │
                                    │     │              │           │
                                    │     ▼              │           │
                                    │   ┌─────────────┐  │           │
                                    │   │  APPROVED   │  │           │
                                    │   └─────────────┘  │           │
                                    │                    │           │
                                    └────────────────────┘           │
                                                                     │
    ┌──────────────┐                                                 │
    │  CANCELLED   │◄────────────────────────────────────────────────┘
    └──────────────┘        (by employee, only if PENDING_MANAGER)
```

### 4.1 State Definitions

| State | Description | Allowed Actions |
|-------|-------------|-----------------|
| `DRAFT` | Sedang diisi, belum disubmit | Edit, Delete, Submit |
| `PENDING` | Baru submit, routing ke approver pertama | - |
| `PENDING_MANAGER` | Menunggu approval Manager (L1) | Approve, Reject (by Manager); Cancel (by Employee) |
| `PENDING_HRD` | Menunggu approval HRD (L2) | Approve, Reject, Override (by HRD) |
| `PENDING_DIRECTOR` | Menunggu approval Direktur (L4) | Approve, Reject (by Director) |
| `APPROVED` | Disetujui final | - (immutable) |
| `REJECTED` | Ditolak di salah satu level | - (immutable) |
| `CANCELLED` | Dibatalkan oleh employee | - (immutable) |

### 4.2 State Transition Rules

```typescript
const stateTransitions: Record<LeaveStatus, LeaveStatus[]> = {
  DRAFT: ['PENDING'],
  PENDING: ['PENDING_MANAGER', 'PENDING_HRD'],  // based on approval chain
  PENDING_MANAGER: ['PENDING_HRD', 'REJECTED', 'CANCELLED'],
  PENDING_HRD: ['PENDING_DIRECTOR', 'APPROVED', 'REJECTED'],
  PENDING_DIRECTOR: ['APPROVED', 'REJECTED'],
  APPROVED: [],      // terminal state
  REJECTED: [],      // terminal state
  CANCELLED: [],     // terminal state
};
```

---

## 5. Business Rules

### 5.1 Submission Rules

| Rule ID | Kondisi | Aksi | Error Message |
|---------|---------|------|---------------|
| SUB-01 | `remainingBalance < requestedDays` | BLOCK | "Saldo cuti tidak mencukupi (tersedia: {balance}, dibutuhkan: {days})" |
| SUB-02 | `startDate <= TODAY` | BLOCK | "Tanggal mulai cuti harus minimal H+1" |
| SUB-03 | `endDate < startDate` | BLOCK | "Tanggal selesai tidak boleh sebelum tanggal mulai" |
| SUB-04 | Overlap dengan cuti approved lain | BLOCK | "Tanggal overlap dengan cuti yang sudah disetujui ({dates})" |
| SUB-05 | Cuti sakit > 1 hari tanpa attachment | BLOCK | "Surat dokter wajib dilampirkan untuk cuti sakit lebih dari 1 hari" |
| SUB-06 | Ada pending request untuk rentang yang overlap | BLOCK | "Sudah ada pengajuan pending untuk tanggal tersebut" |
| SUB-07 | Employee tidak punya manager | Skip L1, langsung ke L2 (HRD) | - |

### 5.2 Approval Rules

| Rule ID | Kondisi | Aksi |
|---------|---------|------|
| APR-01 | Approver mencoba approve request sendiri | BLOCK - "Tidak dapat menyetujui pengajuan sendiri" |
| APR-02 | Approver bukan di level yang tepat | BLOCK - "Anda tidak memiliki wewenang untuk aksi ini" |
| APR-03 | Request sudah di-approve/reject | BLOCK - "Pengajuan sudah diproses" |
| APR-04 | Delegate approve | ALLOW dengan audit log delegatedFrom |
| APR-05 | HRD override (skip L1) | ALLOW dengan catatan wajib dan audit log |

### 5.3 Cancellation Rules

| Rule ID | Kondisi | Aksi |
|---------|---------|------|
| CAN-01 | Status = PENDING_MANAGER | ALLOW |
| CAN-02 | Status = PENDING_HRD dan belum direspons | ALLOW dengan konfirmasi |
| CAN-03 | Status = APPROVED | BLOCK - "Tidak dapat membatalkan cuti yang sudah disetujui" |
| CAN-04 | Status = REJECTED | BLOCK - "Pengajuan sudah ditolak" |

---

## 6. Algorithm: Determine Approval Chain

```typescript
interface ApprovalChainInput {
  leaveType: LeaveType;          // ANNUAL, SICK, SPECIAL, UNPAID
  totalDays: number;
  specialType?: SpecialLeaveType; // MARRIAGE, MATERNITY, BEREAVEMENT
  employee: Employee;
}

interface ApprovalChainOutput {
  chain: ApprovalLevel[];        // ['L1', 'L2'] or ['L2'] etc.
  totalSLADays: number;
  autoApprove: boolean;
}

function determineApprovalChain(input: ApprovalChainInput): ApprovalChainOutput {
  const { leaveType, totalDays, specialType, employee } = input;
  
  // Rule 1: Sakit 1 hari = auto-approve
  if (leaveType === 'SICK' && totalDays === 1) {
    return { chain: [], totalSLADays: 0, autoApprove: true };
  }
  
  // Rule 2: Sakit > 1 hari = HRD only (dengan surat dokter)
  if (leaveType === 'SICK' && totalDays > 1) {
    return { chain: ['L2'], totalSLADays: 1, autoApprove: false };
  }
  
  // Rule 3: Khusus - Melahirkan = HRD + Direktur
  if (leaveType === 'SPECIAL' && specialType === 'MATERNITY') {
    return { chain: ['L2', 'L4'], totalSLADays: 3, autoApprove: false };
  }
  
  // Rule 4: Khusus - Duka = Manager (fast-track)
  if (leaveType === 'SPECIAL' && specialType === 'BEREAVEMENT') {
    return { chain: ['L1'], totalSLADays: 1, autoApprove: false };
  }
  
  // Rule 5: Unpaid = Full chain
  if (leaveType === 'UNPAID') {
    return { chain: ['L1', 'L2', 'L4'], totalSLADays: 5, autoApprove: false };
  }
  
  // Rule 6: Tahunan berdasarkan durasi
  if (leaveType === 'ANNUAL') {
    if (totalDays <= 3) {
      return { chain: ['L1', 'L2'], totalSLADays: 2, autoApprove: false };
    } else if (totalDays <= 5) {
      return { chain: ['L1', 'L2'], totalSLADays: 3, autoApprove: false };
    } else {
      return { chain: ['L1', 'L2', 'L4'], totalSLADays: 5, autoApprove: false };
    }
  }
  
  // Default: Manager + HRD
  return { chain: ['L1', 'L2'], totalSLADays: 2, autoApprove: false };
}
```

---

## 7. Algorithm: Calculate Total Days

```typescript
interface TotalDaysInput {
  startDate: Date;
  endDate: Date;
  tenantId: string;
  branchId: string;
}

function calculateTotalDays(input: TotalDaysInput): number {
  const { startDate, endDate, tenantId, branchId } = input;
  
  // Get holidays for the date range
  const holidays: Date[] = getHolidays(tenantId, branchId, startDate, endDate);
  
  // Get weekend days based on tenant settings
  const weekendDays: number[] = getWeekendDays(tenantId); // default: [0, 6] (Sun, Sat)
  
  let totalDays = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends
    if (weekendDays.includes(dayOfWeek)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }
    
    // Skip holidays
    if (holidays.some(h => isSameDay(h, currentDate))) {
      currentDate = addDays(currentDate, 1);
      continue;
    }
    
    totalDays++;
    currentDate = addDays(currentDate, 1);
  }
  
  return totalDays;
}
```

### 7.1 Calculation Examples

| Start Date | End Date | Holidays | Weekend Days Excluded | Total Days |
|------------|----------|----------|----------------------|------------|
| Mon 2026-02-02 | Wed 2026-02-04 | None | 0 | 3 |
| Fri 2026-02-06 | Mon 2026-02-09 | None | Sat, Sun | 2 |
| Mon 2026-02-02 | Fri 2026-02-06 | Wed (holiday) | 0 | 4 |
| Thu 2026-02-05 | Tue 2026-02-10 | None | Sat, Sun | 4 |
| Sat 2026-02-07 | Sun 2026-02-08 | None | Both days | 0 (ERROR) |

---

## 8. Algorithm: Process Approval Action

```typescript
interface ApprovalActionInput {
  leaveRequestId: string;
  action: 'APPROVE' | 'REJECT';
  actorId: string;
  comment?: string;          // Required if REJECT
  isDelegated?: boolean;
  delegatedFromId?: string;
}

async function processApprovalAction(input: ApprovalActionInput): Promise<LeaveRequest> {
  const { leaveRequestId, action, actorId, comment, isDelegated, delegatedFromId } = input;
  
  // 1. Load leave request with lock
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: { employee: true, leaveType: true }
  });
  
  // 2. Validate actor has permission for current level
  const currentLevel = getCurrentApprovalLevel(leaveRequest.status);
  const actorRole = await getUserRole(actorId, leaveRequest.tenantId);
  
  if (!canApproveAtLevel(actorRole, currentLevel, isDelegated)) {
    throw new Error('FORBIDDEN: Anda tidak memiliki wewenang untuk aksi ini');
  }
  
  // 3. Prevent self-approval
  if (actorId === leaveRequest.employeeId) {
    throw new Error('FORBIDDEN: Tidak dapat menyetujui pengajuan sendiri');
  }
  
  // 4. Process action
  if (action === 'REJECT') {
    if (!comment || comment.trim().length < 10) {
      throw new Error('VALIDATION: Alasan penolakan wajib diisi (min 10 karakter)');
    }
    
    return await prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: 'REJECTED',
        rejectionReason: comment,
        [`approvedBy${getLevelName(currentLevel)}`]: actorId,
        [`${getLevelName(currentLevel).toLowerCase()}ApprovedAt`]: new Date(),
        updatedAt: new Date()
      }
    });
  }
  
  // 5. APPROVE: Determine next state
  const approvalChain = determineApprovalChain({
    leaveType: leaveRequest.leaveType,
    totalDays: leaveRequest.totalDays,
    employee: leaveRequest.employee
  });
  
  const currentLevelIndex = approvalChain.chain.indexOf(currentLevel);
  const isLastLevel = currentLevelIndex === approvalChain.chain.length - 1;
  
  let nextStatus: LeaveStatus;
  if (isLastLevel) {
    nextStatus = 'APPROVED';
    
    // Deduct leave balance
    await deductLeaveBalance(leaveRequest.employeeId, leaveRequest.leaveTypeId, leaveRequest.totalDays);
    
  } else {
    const nextLevel = approvalChain.chain[currentLevelIndex + 1];
    nextStatus = `PENDING_${getLevelName(nextLevel)}`;
  }
  
  // 6. Create audit log
  await createAuditLog({
    tenantId: leaveRequest.tenantId,
    actorId,
    action: 'LEAVE_APPROVED',
    objectType: 'leave_request',
    objectId: leaveRequestId,
    beforeData: { status: leaveRequest.status },
    afterData: { status: nextStatus },
    metadata: { isDelegated, delegatedFromId, comment }
  });
  
  // 7. Update and return
  return await prisma.leaveRequest.update({
    where: { id: leaveRequestId },
    data: {
      status: nextStatus,
      [`approvedBy${getLevelName(currentLevel)}`]: actorId,
      [`${getLevelName(currentLevel).toLowerCase()}ApprovedAt`]: new Date(),
      updatedAt: new Date()
    }
  });
}
```

---

## 9. Delegation Specification

### 9.1 Delegation Model

```typescript
interface Delegation {
  id: string;
  tenantId: string;
  delegatorId: string;        // Yang mendelegasikan
  delegateeId: string;        // Yang menerima delegasi
  startDate: Date;
  endDate: Date;
  approvalTypes: ApprovalType[];  // ['LEAVE', 'ATTENDANCE_CORRECTION', 'TRAVEL']
  reason: string;
  isActive: boolean;
  createdAt: Date;
}

// Approval types yang bisa didelegasikan
type ApprovalType = 'LEAVE' | 'ATTENDANCE_CORRECTION' | 'TRAVEL' | 'EXPENSE' | 'LETTER';
```

### 9.2 Delegation Rules

| Rule ID | Kondisi | Aksi |
|---------|---------|------|
| DEL-01 | Delegatee bukan bawahan langsung | ALLOW (bisa delegate ke peer atau atasan) |
| DEL-02 | Delegatee sudah punya delegasi aktif dari orang lain | ALLOW (chain delegation) |
| DEL-03 | Delegasi circular (A→B→A) | BLOCK |
| DEL-04 | Periode overlap dengan delegasi lain dari delegator | BLOCK |
| DEL-05 | endDate < startDate | BLOCK |
| DEL-06 | startDate sudah lewat | ALLOW (berlaku dari sekarang) |

### 9.3 Delegation Resolution Algorithm

```typescript
async function resolveApprover(
  originalApproverId: string,
  approvalType: ApprovalType,
  date: Date = new Date()
): Promise<{ approverId: string; isDelegated: boolean; delegatedFrom?: string }> {
  
  // Find active delegation
  const delegation = await prisma.delegation.findFirst({
    where: {
      delegatorId: originalApproverId,
      approvalTypes: { has: approvalType },
      startDate: { lte: date },
      endDate: { gte: date },
      isActive: true
    }
  });
  
  if (!delegation) {
    return { approverId: originalApproverId, isDelegated: false };
  }
  
  // Prevent circular delegation (max depth: 3)
  const visited = new Set<string>([originalApproverId]);
  let currentDelegatee = delegation.delegateeId;
  let depth = 1;
  
  while (depth < 3) {
    if (visited.has(currentDelegatee)) {
      // Circular detected, use original
      return { approverId: originalApproverId, isDelegated: false };
    }
    
    visited.add(currentDelegatee);
    
    // Check if delegatee also has delegation
    const nestedDelegation = await prisma.delegation.findFirst({
      where: {
        delegatorId: currentDelegatee,
        approvalTypes: { has: approvalType },
        startDate: { lte: date },
        endDate: { gte: date },
        isActive: true
      }
    });
    
    if (!nestedDelegation) break;
    currentDelegatee = nestedDelegation.delegateeId;
    depth++;
  }
  
  return {
    approverId: currentDelegatee,
    isDelegated: true,
    delegatedFrom: originalApproverId
  };
}
```

---

## 10. Escalation Specification

### 10.1 Escalation Rules

```typescript
interface EscalationConfig {
  levels: {
    level: ApprovalLevel;
    slaDays: number;
    reminders: { percentSLA: number; action: 'EMAIL' | 'INAPP' | 'BOTH' }[];
    escalateTo: ApprovalLevel | null;
  }[];
}

const defaultEscalationConfig: EscalationConfig = {
  levels: [
    {
      level: 'L1',
      slaDays: 1,
      reminders: [
        { percentSLA: 50, action: 'INAPP' },      // 4 jam
        { percentSLA: 80, action: 'BOTH' },       // 6.5 jam
      ],
      escalateTo: 'L2'
    },
    {
      level: 'L2',
      slaDays: 2,
      reminders: [
        { percentSLA: 50, action: 'INAPP' },      // 1 hari
        { percentSLA: 80, action: 'BOTH' },       // 1.5 hari
      ],
      escalateTo: 'L4'   // Super Admin
    },
    {
      level: 'L4',
      slaDays: 2,
      reminders: [
        { percentSLA: 50, action: 'BOTH' },
      ],
      escalateTo: null   // No escalation, just alert
    }
  ]
};
```

### 10.2 Escalation Job (Cron)

```typescript
// Run every hour during business hours (08:00 - 18:00)
async function processEscalations(): Promise<void> {
  const now = new Date();
  
  // Get all pending leave requests
  const pendingRequests = await prisma.leaveRequest.findMany({
    where: {
      status: { in: ['PENDING_MANAGER', 'PENDING_HRD', 'PENDING_DIRECTOR'] }
    },
    include: { employee: true }
  });
  
  for (const request of pendingRequests) {
    const currentLevel = getCurrentApprovalLevel(request.status);
    const levelConfig = getEscalationConfig(currentLevel);
    
    const waitingHours = differenceInHours(now, request.updatedAt);
    const slaHours = levelConfig.slaDays * 8; // 8 business hours per day
    const percentElapsed = (waitingHours / slaHours) * 100;
    
    // Check reminders
    for (const reminder of levelConfig.reminders) {
      if (percentElapsed >= reminder.percentSLA) {
        const reminderKey = `${request.id}-${currentLevel}-${reminder.percentSLA}`;
        
        if (!await isReminderSent(reminderKey)) {
          await sendReminderNotification(request, currentLevel, reminder.action);
          await markReminderSent(reminderKey);
        }
      }
    }
    
    // Check escalation
    if (percentElapsed >= 100 && levelConfig.escalateTo) {
      await escalateRequest(request, currentLevel, levelConfig.escalateTo);
    }
  }
}
```

---

## 11. Edge Cases

### 11.1 Submission Edge Cases

| ID | Kondisi | Expected Behavior |
|----|---------|-------------------|
| ED-SUB-01 | Cuti di hari Sabtu-Minggu saja | ERROR: "Tanggal cuti harus mencakup hari kerja" (totalDays = 0) |
| ED-SUB-02 | Cuti di hari libur nasional | Hari libur tidak dihitung, totalDays dikurangi |
| ED-SUB-03 | Start date = today | ERROR: "Minimal pengajuan H+1" |
| ED-SUB-04 | Saldo cuti tepat = jumlah request | ALLOW, balance jadi 0 setelah approve |
| ED-SUB-05 | Request 0.5 hari (half day) | ALLOW jika feature enabled; dihitung 0.5 dari saldo |
| ED-SUB-06 | Karyawan kontrak setelah end_date | ERROR: "Tanggal cuti melewati masa kontrak Anda" |

### 11.2 Approval Edge Cases

| ID | Kondisi | Expected Behavior |
|----|---------|-------------------|
| ED-APR-01 | Approver resign sebelum approve | Eskalasi otomatis ke level berikutnya |
| ED-APR-02 | Manager adalah employee itu sendiri | Skip L1, langsung ke L2 |
| ED-APR-03 | 2 approver approve bersamaan (race condition) | DB lock, yang kedua dapat error "Sudah diproses" |
| ED-APR-04 | HRD override saat masih PENDING_MANAGER | ALLOW dengan audit log "override" |
| ED-APR-05 | Approve/reject setelah employee cancel | ERROR: "Pengajuan sudah dibatalkan" |
| ED-APR-06 | Approve request karyawan beda tenant | ERROR: Tenant isolation violation |

### 11.3 Balance Edge Cases

| ID | Kondisi | Expected Behavior |
|----|---------|-------------------|
| ED-BAL-01 | Balance di-adjust HRD saat pending request | Request tetap valid jika balance baru masih cukup |
| ED-BAL-02 | Approved lalu balance jadi negatif (bug) | Alert ke HRD, balance bisa negatif (harus dikoreksi) |
| ED-BAL-03 | 2 request approved bersamaan, saldo cukup untuk 1 | Transaction lock pada balance, request kedua pending sampai balance cukup |
| ED-BAL-04 | Cuti expired belum dipakai | Saldo hangus (warning 30/7/1 hari sebelum) |

### 11.4 Calendar Edge Cases

| ID | Kondisi | Expected Behavior |
|----|---------|-------------------|
| ED-CAL-01 | Tim conflict (5+ orang cuti bersamaan) | WARNING ke approver "5 anggota tim lain sudah cuti di tanggal ini" |
| ED-CAL-02 | Cuti mendekati deadline project | No system validation (manager discretion) |
| ED-CAL-03 | Tanggal libur diubah setelah request submitted | Recalculate totalDays saat approval (not on submit) |

---

## 12. Notification Specification

### 12.1 Notification Matrix

| Event | Recipient | Channel | Template ID |
|-------|-----------|---------|-------------|
| Leave submitted | Manager (L1) | In-App + Email | `leave_pending_manager` |
| Leave approved by Manager | HRD (L2) | In-App + Email | `leave_pending_hrd` |
| Leave approved final | Employee | In-App + Email | `leave_approved` |
| Leave rejected | Employee | In-App + Email | `leave_rejected` |
| Leave cancelled | Approvers | In-App | `leave_cancelled` |
| SLA 50% reminder | Current Approver | In-App | `leave_reminder_50` |
| SLA 80% reminder | Current Approver + Atasannya | In-App + Email | `leave_reminder_80` |
| Escalated | New Approver + Original | In-App + Email | `leave_escalated` |

### 12.2 Email Template - Leave Approved

```
Subject: [PeopleHub] Cuti Anda Disetujui - {leaveType} ({startDate} - {endDate})

Halo {employeeName},

Pengajuan cuti Anda telah DISETUJUI.

Detail:
- Jenis Cuti: {leaveType}
- Tanggal: {startDate} s/d {endDate}
- Jumlah Hari: {totalDays} hari kerja
- Sisa Saldo: {remainingBalance} hari

Disetujui oleh:
- {approver1Name} ({approver1Role}) pada {approver1Date}
- {approver2Name} ({approver2Role}) pada {approver2Date}

Selamat menikmati cuti Anda!

---
PeopleHub - PT. {tenantName}
```

---

## 13. Audit Trail Specification

### 13.1 Audit Log Fields

```typescript
interface LeaveAuditLog {
  id: string;
  tenantId: string;
  leaveRequestId: string;
  actorId: string;
  action: LeaveAuditAction;
  fromStatus: LeaveStatus | null;
  toStatus: LeaveStatus;
  comment: string | null;
  isDelegated: boolean;
  delegatedFromId: string | null;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

type LeaveAuditAction = 
  | 'SUBMITTED'
  | 'APPROVED_L1'
  | 'APPROVED_L2'
  | 'APPROVED_L4'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ESCALATED'
  | 'OVERRIDDEN';
```

---

## 14. Acceptance Tests

### 14.1 Happy Path Tests

```gherkin
Scenario: Cuti tahunan 2 hari disetujui - full chain
  Given saya login sebagai karyawan dengan saldo cuti 12 hari
  And manager saya adalah "John Manager"
  When saya submit cuti tahunan dari 2026-02-02 sampai 2026-02-03
  Then totalDays dihitung 2 hari
  And status menjadi "PENDING_MANAGER"
  And John Manager menerima notifikasi

  When John Manager meng-approve
  Then status menjadi "PENDING_HRD"
  And HRD menerima notifikasi

  When HRD meng-approve
  Then status menjadi "APPROVED"
  And saldo saya menjadi 10 hari
  And saya menerima email konfirmasi
```

### 14.2 Edge Case Tests

```gherkin
Scenario: Cuti sakit 1 hari auto-approve
  When saya submit cuti sakit untuk 1 hari
  Then status langsung "APPROVED"
  And tidak ada approval chain
  And saldo sakit terpotong 1

Scenario: Reject wajib isi alasan
  Given ada request pending untuk saya approve
  When saya klik reject tanpa isi alasan
  Then error "Alasan penolakan wajib diisi"

Scenario: Cancel hanya bisa saat PENDING_MANAGER
  Given request saya sudah PENDING_HRD
  When saya coba cancel
  Then error "Tidak dapat membatalkan, sudah diproses manager"
```

---

## 15. Related Documents

| Document | Link |
|----------|------|
| User Stories EP03 | [../02-requirements/user-stories.md](../02-requirements/user-stories.md#ep03---cuti--izin) |
| Approval Matrix | [../02-requirements/approval-matrix.md](../02-requirements/approval-matrix.md) |
| API Specification | [../04-api/specification.md](../04-api/specification.md) |
| ERD - LeaveRequest | [../03-architecture/erd.md](../03-architecture/erd.md) |
