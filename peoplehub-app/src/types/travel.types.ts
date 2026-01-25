// @ai:ag - Created by Antigravity
// Travel types

import { ApprovalStatus } from './enums';
import { TenantEntity, BaseEntity } from './common.types';

// ==========================================
// TRAVEL REQUEST
// ==========================================

export interface TravelRequest extends TenantEntity {
    employeeId: string;
    destination: string;
    purpose: string;
    departureDate: Date | string;
    returnDate: Date | string;
    status: ApprovalStatus;
    estimatedBudget: number;
    actualBudget?: number | null;
    notes?: string | null;
    approvedById?: string | null;
    approvedAt?: Date | string | null;
    rejectionReason?: string | null;
    itinerary?: TravelItinerary[];
    expenses?: TravelExpense[];
}

export interface CreateTravelRequestInput {
    destination: string;
    purpose: string;
    departureDate: string;
    returnDate: string;
    estimatedBudget: number;
    notes?: string;
    itinerary?: CreateTravelItineraryInput[];
}

export type UpdateTravelRequestInput = Partial<CreateTravelRequestInput>;

// ==========================================
// TRAVEL ITINERARY
// ==========================================

export interface TravelItinerary extends BaseEntity {
    travelRequestId: string;
    date: Date | string;
    time?: string | null;
    activity: string;
    location: string;
    notes?: string | null;
}

export interface CreateTravelItineraryInput {
    date: string;
    time?: string;
    activity: string;
    location: string;
    notes?: string;
}

// ==========================================
// TRAVEL EXPENSE
// ==========================================

export type TravelExpenseCategory =
    | 'TRANSPORT'
    | 'ACCOMMODATION'
    | 'MEALS'
    | 'COMMUNICATION'
    | 'OTHER';

export const TRAVEL_EXPENSE_CATEGORY_LABELS: Record<TravelExpenseCategory, string> = {
    TRANSPORT: 'Transportasi',
    ACCOMMODATION: 'Akomodasi',
    MEALS: 'Makan',
    COMMUNICATION: 'Komunikasi',
    OTHER: 'Lainnya',
};

export interface TravelExpense extends BaseEntity {
    travelRequestId: string;
    category: TravelExpenseCategory;
    description: string;
    amount: number;
    receiptUrl?: string | null;
    date: Date | string;
}

export interface CreateTravelExpenseInput {
    category: TravelExpenseCategory;
    description: string;
    amount: number;
    receiptUrl?: string;
    date: string;
}

// ==========================================
// TRAVEL SUMMARY
// ==========================================

export interface TravelSummary {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    totalBudget: number;
    totalActual: number;
    recentRequests: TravelRequest[];
}

// ==========================================
// TRAVEL APPROVAL
// ==========================================

export interface ApproveTravelInput {
    requestId: string;
}

export interface RejectTravelInput {
    requestId: string;
    reason: string;
}
