# QA Report - Leave Request \u0026 Approval Flow

> **Test Date:** 23 Januari 2026 | **QA Engineer:** Integration Team | **Sprint:** 4

---

## Test Summary

| Test Suite | Tests | Status |
|------------|-------|--------|
| QA-010: Leave Request Flow | 13 | ✅ PASS |
| QA-011: Multi-level Approval | 15 | ✅ PASS |
| **TOTAL** | **28** | ✅ **ALL PASS** |

---

## QA-010: Leave Request Flow

### Coverage Matrix

| Feature | Scenario | Result |
|---------|----------|--------|
| Create Request | With sufficient balance | ✅ PASS |
| Create Request | With insufficient balance | ✅ PASS |
| Create Request | Overlapping dates | ✅ PASS |
| Create Request | No balance record | ✅ PASS |
| Cancel Request | Pending status | ✅ PASS |
| Cancel Request | Already approved | ✅ PASS |
| Cancel Request | Non-existent | ✅ PASS |
| View Balance | Own balance | ✅ PASS |
| View Balance | HRD viewing any | ✅ PASS |
| View Balance | Unauthorized access | ✅ PASS |
| List Requests | Employee's own | ✅ PASS |
| List Requests | HRD viewing all | ✅ PASS |
| List Requests | Filter by status | ✅ PASS |

### Key Validations

- ✅ Leave balance validation working correctly
- ✅ Overlapping date detection functional
- ✅ Role-based access control enforced
- ✅ Business rules respected (can't cancel approved)

---

## QA-011: Multi-level Approval Flow

### Coverage Matrix

| Level | Feature | Scenario | Result |
|-------|---------|----------|--------|
| Manager | Approve | Subordinate's request | ✅ PASS |
| Manager | Approve | Non-subordinate (denied) | ✅ PASS |
| Manager | Approve | Employee using manager endpoint (denied) | ✅ PASS |
| Manager | Approve | Already processed (denied) | ✅ PASS |
| HRD | Approve | Pending request | ✅ PASS |
| HRD | Approve | Manager-approved request | ✅ PASS |
| HRD | Approve | Balance deduction | ✅ PASS |
| HRD | Approve | Non-HRD (denied) | ✅ PASS |
| HRD | Approve | Manager using HRD endpoint (denied) | ✅ PASS |
| Manager | Reject | Subordinate's request | ✅ PASS |
| HRD | Reject | Any request | ✅ PASS |
| Employee | Reject | Own request (denied) | ✅ PASS |
| Any | Reject | Already approved (denied) | ✅ PASS |
| Full Flow | Complete chain | PENDING → MANAGER → HRD → APPROVED | ✅ PASS |
| Full Flow | HRD skip | PENDING → HRD → APPROVED | ✅ PASS |

### Key Validations

- ✅ Two-level approval workflow functional
- ✅ Manager can only approve subordinates
- ✅ HRD can approve directly (skip manager)
- ✅ Balance deducted only on HRD approval
- ✅ Rejection permitted at any level
- ✅ Complete workflow chain tested

---

## Test Defects

**None found.** All test cases passed.

---

## Recommendations

### For Dashboard Performance (QA-012)
- Create performance test suite for dashboard stats aggregation
- Test with sample data: 100, 500, 1000 employees
- Validate response time \u003c 3s per specification

### For Regression
- Add these tests to CI/CD pipeline
- Run before every deployment to staging
- Maintain minimum 80% coverage

---

## Approval

- [x] QA-010: Leave Request Flow - **PASSED**
- [x] QA-011: Multi-level Approval Flow - **PASSED**
- [ ] QA-012: Dashboard Performance - Pending

**QA Engineer Sign-off:** ✅ APPROVED  
**Date:** 23 Januari 2026
