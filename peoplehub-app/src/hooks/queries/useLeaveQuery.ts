// @ai:cx - TanStack Query hooks for Leave module

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    LeaveBalance,
    LeaveRequest,
    CreateLeaveRequest,
    LeaveSummary,
    LeaveType,
} from "@/types";

// ============================================
// Query Keys
// ============================================

export const leaveKeys = {
    all: ["leave"] as const,
    balances: () => [...leaveKeys.all, "balances"] as const,
    types: () => [...leaveKeys.all, "types"] as const,
    requests: (status?: string) => [...leaveKeys.all, "requests", { status }] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchLeaveBalances(): Promise<{ balances: LeaveBalance[]; summary: LeaveSummary[] }> {
    const response = await fetch("/api/leave/balance");
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to fetch balances");
    return {
        balances: data.data.balances || [],
        summary: data.data.summary || [],
    };
}

async function fetchLeaveTypes(): Promise<LeaveType[]> {
    const response = await fetch("/api/leave/types");
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to fetch leave types");
    return data.data || [];
}

async function fetchLeaveRequests(status?: string): Promise<LeaveRequest[]> {
    const url = status ? `/api/leave/request?status=${status}` : "/api/leave/request";
    const response = await fetch(url);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to fetch requests");
    return data.data || [];
}

async function submitLeaveRequest(requestData: CreateLeaveRequest): Promise<LeaveRequest> {
    const response = await fetch("/api/leave/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to submit request");
    return data.data;
}

async function cancelLeaveRequest(requestId: string): Promise<void> {
    const response = await fetch(`/api/leave/request/${requestId}`, {
        method: "DELETE",
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Failed to cancel request");
}

// ============================================
// Query Hooks
// ============================================

/**
 * Hook to fetch leave balances with caching
 */
export function useLeaveBalances() {
    return useQuery({
        queryKey: leaveKeys.balances(),
        queryFn: fetchLeaveBalances,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch leave types with caching
 */
export function useLeaveTypes() {
    return useQuery({
        queryKey: leaveKeys.types(),
        queryFn: fetchLeaveTypes,
        staleTime: 30 * 60 * 1000, // 30 minutes - leave types rarely change
    });
}

/**
 * Hook to fetch leave requests with optional status filter
 */
export function useLeaveRequests(status?: string) {
    return useQuery({
        queryKey: leaveKeys.requests(status),
        queryFn: () => fetchLeaveRequests(status),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Hook to submit a new leave request
 */
export function useSubmitLeaveRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: submitLeaveRequest,
        onSuccess: () => {
            // Invalidate related queries to refetch fresh data
            queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
        },
    });
}

/**
 * Hook to cancel a leave request
 */
export function useCancelLeaveRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: cancelLeaveRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
        },
    });
}

// ============================================
// Combined Hook (for backward compatibility)
// ============================================

export interface UseLeaveQueryReturn {
    balances: LeaveBalance[];
    leaveTypes: LeaveType[];
    summary: LeaveSummary[];
    requests: LeaveRequest[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
    submitRequest: ReturnType<typeof useSubmitLeaveRequest>;
    cancelRequest: ReturnType<typeof useCancelLeaveRequest>;
}

/**
 * Combined hook that provides all leave data and mutations
 * Use this for backward compatibility with the old useLeave hook
 */
export function useLeaveQuery(status?: string): UseLeaveQueryReturn {
    const balancesQuery = useLeaveBalances();
    const typesQuery = useLeaveTypes();
    const requestsQuery = useLeaveRequests(status);
    const submitMutation = useSubmitLeaveRequest();
    const cancelMutation = useCancelLeaveRequest();

    const isLoading = balancesQuery.isLoading || typesQuery.isLoading || requestsQuery.isLoading;
    const error = balancesQuery.error || typesQuery.error || requestsQuery.error;

    const refetch = () => {
        balancesQuery.refetch();
        typesQuery.refetch();
        requestsQuery.refetch();
    };

    return {
        balances: balancesQuery.data?.balances || [],
        summary: balancesQuery.data?.summary || [],
        leaveTypes: typesQuery.data || [],
        requests: requestsQuery.data || [],
        isLoading,
        error: error as Error | null,
        refetch,
        submitRequest: submitMutation,
        cancelRequest: cancelMutation,
    };
}
