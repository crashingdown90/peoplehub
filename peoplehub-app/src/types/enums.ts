// @ai:ag - Created by Antigravity
// Enum definitions matching Prisma schema

/**
 * User status
 */
export enum UserStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED',
}

/**
 * User role
 */
export enum UserRole {
    EMPLOYEE = 'EMPLOYEE',
    MANAGER = 'MANAGER',
    HRD = 'HRD',
    FINANCE = 'FINANCE',
    IT_OPS = 'IT_OPS',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

/**
 * Employment type
 */
export enum EmploymentType {
    PERMANENT = 'PERMANENT',
    CONTRACT = 'CONTRACT',
    FREELANCE = 'FREELANCE',
    INTERN = 'INTERN',
}

/**
 * Token type (for email verification, password reset)
 */
export enum TokenType {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
}

/**
 * Work mode
 */
export enum WorkMode {
    WFO = 'WFO',
    WFH = 'WFH',
    HYBRID = 'HYBRID',
}

/**
 * Employee status
 */
export enum EmployeeStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    TERMINATED = 'TERMINATED',
}

/**
 * Attendance status
 */
export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    LATE = 'LATE',
    ABSENT = 'ABSENT',
    LEAVE = 'LEAVE',
    HOLIDAY = 'HOLIDAY',
}

/**
 * Approval status
 */
export enum ApprovalStatus {
    PENDING = 'PENDING',
    APPROVED_MANAGER = 'APPROVED_MANAGER',
    APPROVED_HRD = 'APPROVED_HRD',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

/**
 * Payslip status
 */
export enum PayslipStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
}

/**
 * Ticket category
 */
export enum TicketCategory {
    HR = 'HR',
    IT = 'IT',
    FINANCE = 'FINANCE',
    OTHER = 'OTHER',
}

/**
 * Ticket priority
 */
export enum TicketPriority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

/**
 * Ticket status
 */
export enum TicketStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED',
}

/**
 * Notification type
 */
export enum NotificationType {
    ATTENDANCE = 'ATTENDANCE',
    LEAVE = 'LEAVE',
    APPROVAL = 'APPROVAL',
    ANNOUNCEMENT = 'ANNOUNCEMENT',
    SYSTEM = 'SYSTEM',
}

/**
 * Announcement status
 */
export enum AnnouncementStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

/**
 * Loan / Cash advance status
 */
export enum LoanStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    DISBURSED = 'DISBURSED',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    SETTLED = 'SETTLED',
    CANCELLED = 'CANCELLED',
}

/**
 * Expense status
 */
export enum ExpenseStatus {
    PENDING = 'PENDING',
    APPROVED_MANAGER = 'APPROVED_MANAGER',
    APPROVED_HRD = 'APPROVED_HRD',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
}

/**
 * Delegation status
 */
export enum DelegationStatus {
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

/**
 * Bank change request status
 */
export enum BankChangeStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

/**
 * Overtime request status (enum version)
 */
export enum OvertimeStatusEnum {
    PENDING = 'PENDING',
    PENDING_MANAGER = 'PENDING_MANAGER',
    PENDING_HRD = 'PENDING_HRD',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

/**
 * Leave request status with multi-level approval
 */
export enum LeaveStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    PENDING_MANAGER = 'PENDING_MANAGER',
    PENDING_HRD = 'PENDING_HRD',
    PENDING_DIRECTOR = 'PENDING_DIRECTOR',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

/**
 * Gender enum
 */
export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}
