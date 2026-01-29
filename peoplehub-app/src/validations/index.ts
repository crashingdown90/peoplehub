// @ai:ag - Updated by Antigravity
// Barrel export for all validation schemas

// Auth schemas
export {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    type RegisterInput,
    type LoginInput,
    type ForgotPasswordInput,
    type ResetPasswordInput,
    type ChangePasswordInput,
} from './auth.schema';

// Employee schemas
export {
    updateProfileSchema,
    createEmployeeSchema,
    updateEmployeeSchema,
    type UpdateProfileInput,
    type CreateEmployeeInput,
    type UpdateEmployeeInput,
} from './employee.schema';

// Leave schemas
export {
    leaveRequestSchema,
    approveRejectLeaveSchema,
    leaveTypeSchema,
    type LeaveRequestInput,
    type ApproveRejectLeaveInput,
    type LeaveTypeInput,
} from './leave.schema';

// Attendance schemas
export {
    clockInSchema,
    clockOutSchema,
    attendanceCorrectionSchema,
    approveRejectCorrectionSchema,
    scheduleSchema,
    type ClockInInput,
    type ClockOutInput,
    type AttendanceCorrectionInput,
    type ApproveRejectCorrectionInput,
    type ScheduleInput,
} from './attendance.schema';

// KPI schemas
export {
    kpiTargetUpdateSchema,
    kpiPeriodSchema,
    kpiIndicatorSchema,
    kpiTargetSchema,
    type KpiTargetUpdateInput,
    type KpiPeriodInput,
    type KpiIndicatorInput,
    type KpiTargetInput,
} from './kpi.schema';

// Travel schemas
export {
    travelItinerarySchema,
    travelRequestSchema,
    travelExpenseSchema,
    approveTravelSchema,
    rejectTravelSchema,
    type TravelItineraryInput,
    type TravelRequestInput,
    type TravelExpenseInput,
    type RejectTravelInput,
} from './travel.schema';

// Reimburse schemas
export {
    reimburseItemSchema,
    reimburseRequestSchema,
    quickReimburseSchema,
    approveReimburseSchema,
    rejectReimburseSchema,
    type ReimburseItemInput,
    type ReimburseRequestInput,
    type QuickReimburseInput,
    type RejectReimburseInput,
} from './reimburse.schema';

// Temp shift assignment schemas
export {
    createTempShiftAssignmentSchema,
    updateTempShiftAssignmentSchema,
    tempShiftAssignmentFilterSchema,
    type CreateTempShiftAssignmentInput,
    type UpdateTempShiftAssignmentInput,
    type TempShiftAssignmentFilterInput,
} from './temp-shift-assignment.schema';
