/**
 * Data Validation Script
 * 
 * This script performs comprehensive data validation checks.
 * Use this for routine data integrity checks or before major operations.
 * 
 * Usage: npx ts-node scripts/migrations/validate-data.ts
 */

import prisma from '../../src/lib/db/prisma';

interface ValidationCheck {
    category: string;
    check: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    count?: number;
    details?: string[];
}

/**
 * Validate tenant data
 */
async function validateTenants(): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];

    // Check for tenants without code
    const tenantsWithoutCode = await prisma.tenant.count({
        where: { code: null }
    });
    checks.push({
        category: 'Tenant',
        check: 'Tenants have code',
        status: tenantsWithoutCode === 0 ? 'pass' : 'warn',
        message: tenantsWithoutCode === 0
            ? 'All tenants have code'
            : `${tenantsWithoutCode} tenants without code`,
        count: tenantsWithoutCode
    });

    // Check for inactive tenants with active users
    const inactiveTenantsWithUsers = await prisma.$queryRaw<Array<{ tenant_name: string; user_count: bigint }>>`
    SELECT t.name as tenant_name, COUNT(u.id) as user_count
    FROM tenants t
    JOIN users u ON t.id = u.tenant_id
    WHERE t.is_active = false AND u.status != 'SUSPENDED'
    GROUP BY t.id, t.name
  `;
    checks.push({
        category: 'Tenant',
        check: 'Inactive tenants have no active users',
        status: inactiveTenantsWithUsers.length === 0 ? 'pass' : 'warn',
        message: inactiveTenantsWithUsers.length === 0
            ? 'No active users in inactive tenants'
            : `${inactiveTenantsWithUsers.length} inactive tenant(s) with active users`,
        details: inactiveTenantsWithUsers.map(t => `${t.tenant_name}: ${t.user_count} users`)
    });

    return checks;
}

/**
 * Validate user data
 */
async function validateUsers(): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];

    // Check for users without tenant
    const usersWithoutTenant = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM users WHERE tenant_id IS NULL
  `;
    const count = Number(usersWithoutTenant[0]?.count || 0);
    checks.push({
        category: 'User',
        check: 'All users have tenant',
        status: count === 0 ? 'pass' : 'fail',
        message: count === 0 ? 'All users have tenant_id' : `${count} users without tenant`,
        count
    });

    // Check for duplicate emails within tenant
    const duplicateEmails = await prisma.$queryRaw<Array<{ tenant_id: string; email: string; count: bigint }>>`
    SELECT tenant_id, email, COUNT(*) as count
    FROM users
    GROUP BY tenant_id, email
    HAVING COUNT(*) > 1
  `;
    checks.push({
        category: 'User',
        check: 'No duplicate emails per tenant',
        status: duplicateEmails.length === 0 ? 'pass' : 'fail',
        message: duplicateEmails.length === 0
            ? 'No duplicate emails'
            : `${duplicateEmails.length} duplicate email(s) found`,
        details: duplicateEmails.map(d => `${d.email} (${d.count}x)`)
    });

    // Check for approved users without employee record
    const approvedWithoutEmployee = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM users u
    LEFT JOIN employees e ON u.id = e.user_id
    WHERE u.status IN ('APPROVED', 'ACTIVE') AND e.id IS NULL
  `;
    const approvedCount = Number(approvedWithoutEmployee[0]?.count || 0);
    checks.push({
        category: 'User',
        check: 'Approved users have employee record',
        status: approvedCount === 0 ? 'pass' : 'warn',
        message: approvedCount === 0
            ? 'All approved users have employee record'
            : `${approvedCount} approved users without employee record`,
        count: approvedCount
    });

    return checks;
}

/**
 * Validate employee data
 */
async function validateEmployees(): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];

    // Check for employees without user
    const employeesWithoutUser = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM employees e
    LEFT JOIN users u ON e.user_id = u.id
    WHERE u.id IS NULL
  `;
    const count = Number(employeesWithoutUser[0]?.count || 0);
    checks.push({
        category: 'Employee',
        check: 'All employees have user record',
        status: count === 0 ? 'pass' : 'fail',
        message: count === 0 ? 'All employees linked to users' : `${count} orphaned employees`,
        count
    });

    // Check for duplicate employee numbers
    const duplicateNumbers = await prisma.$queryRaw<Array<{ tenant_id: string; employee_number: string; count: bigint }>>`
    SELECT tenant_id, employee_number, COUNT(*) as count
    FROM employees
    GROUP BY tenant_id, employee_number
    HAVING COUNT(*) > 1
  `;
    checks.push({
        category: 'Employee',
        check: 'No duplicate employee numbers',
        status: duplicateNumbers.length === 0 ? 'pass' : 'fail',
        message: duplicateNumbers.length === 0
            ? 'All employee numbers unique'
            : `${duplicateNumbers.length} duplicate number(s)`,
        details: duplicateNumbers.map(d => `${d.employee_number} (${d.count}x)`)
    });

    // Check for self-referencing managers (employee is own manager)
    const selfManagersQuery = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM employees WHERE manager_id = id
  `;
    const selfMgrCount = Number(selfManagersQuery[0]?.count || 0);
    checks.push({
        category: 'Employee',
        check: 'No self-referencing managers',
        status: selfMgrCount === 0 ? 'pass' : 'fail',
        message: selfMgrCount === 0
            ? 'No employees are their own manager'
            : `${selfMgrCount} self-referencing manager(s)`,
        count: selfMgrCount
    });

    // Check for employees in wrong tenant branch
    const wrongBranch = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM employees e
    JOIN branches b ON e.branch_id = b.id
    WHERE e.tenant_id != b.tenant_id
  `;
    const wrongBranchCount = Number(wrongBranch[0]?.count || 0);
    checks.push({
        category: 'Employee',
        check: 'Employee branch matches tenant',
        status: wrongBranchCount === 0 ? 'pass' : 'fail',
        message: wrongBranchCount === 0
            ? 'All employees in correct tenant branches'
            : `${wrongBranchCount} employees in wrong tenant branch`,
        count: wrongBranchCount
    });

    return checks;
}

/**
 * Validate attendance data
 */
async function validateAttendances(): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];

    // Check for attendances without employee
    const orphanedAttendances = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM attendances a
    LEFT JOIN employees e ON a.employee_id = e.id
    WHERE e.id IS NULL
  `;
    const count = Number(orphanedAttendances[0]?.count || 0);
    checks.push({
        category: 'Attendance',
        check: 'All attendances have employee',
        status: count === 0 ? 'pass' : 'fail',
        message: count === 0 ? 'All attendances linked to employees' : `${count} orphaned attendances`,
        count
    });

    // Check for duplicate attendances (same employee, same date)
    const duplicateAttendances = await prisma.$queryRaw<Array<{ employee_id: string; attendance_date: Date; count: bigint }>>`
    SELECT employee_id, attendance_date, COUNT(*) as count
    FROM attendances
    GROUP BY employee_id, attendance_date
    HAVING COUNT(*) > 1
    LIMIT 10
  `;
    checks.push({
        category: 'Attendance',
        check: 'No duplicate attendances per day',
        status: duplicateAttendances.length === 0 ? 'pass' : 'fail',
        message: duplicateAttendances.length === 0
            ? 'No duplicate daily attendance records'
            : `${duplicateAttendances.length}+ duplicate attendance record(s)`
    });

    // Check for clock out before clock in
    const invalidClockTimes = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM attendances
    WHERE clock_in IS NOT NULL 
    AND clock_out IS NOT NULL 
    AND clock_out < clock_in
  `;
    const invalidCount = Number(invalidClockTimes[0]?.count || 0);
    checks.push({
        category: 'Attendance',
        check: 'Clock out after clock in',
        status: invalidCount === 0 ? 'pass' : 'warn',
        message: invalidCount === 0
            ? 'All clock times valid'
            : `${invalidCount} records with clock_out before clock_in`,
        count: invalidCount
    });

    // Check for future attendances
    const futureAttendances = await prisma.attendance.count({
        where: {
            attendanceDate: { gt: new Date() }
        }
    });
    checks.push({
        category: 'Attendance',
        check: 'No future attendance records',
        status: futureAttendances === 0 ? 'pass' : 'warn',
        message: futureAttendances === 0
            ? 'No future attendance records'
            : `${futureAttendances} future attendance record(s)`,
        count: futureAttendances
    });

    return checks;
}

/**
 * Validate leave data
 */
async function validateLeaveData(): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];

    // Check for negative leave balance
    const negativeBalances = await prisma.leaveBalance.count({
        where: { remainingBalance: { lt: 0 } }
    });
    checks.push({
        category: 'Leave',
        check: 'No negative leave balances',
        status: negativeBalances === 0 ? 'pass' : 'warn',
        message: negativeBalances === 0
            ? 'All leave balances non-negative'
            : `${negativeBalances} negative balance(s)`,
        count: negativeBalances
    });

    // Check for leave requests without leave type
    const requestsWithoutType = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM leave_requests lr
    LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE lt.id IS NULL
  `;
    const count = Number(requestsWithoutType[0]?.count || 0);
    checks.push({
        category: 'Leave',
        check: 'All leave requests have valid type',
        status: count === 0 ? 'pass' : 'fail',
        message: count === 0 ? 'All leave requests have valid type' : `${count} invalid type(s)`,
        count
    });

    // Check for end date before start date
    // Use raw query since Prisma can't compare fields directly
    const invalidDates = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM leave_requests
    WHERE end_date < start_date
  `;
    const invalidDateCount = Number(invalidDates[0]?.count || 0);
    checks.push({
        category: 'Leave',
        check: 'Leave end date after start date',
        status: invalidDateCount === 0 ? 'pass' : 'fail',
        message: invalidDateCount === 0
            ? 'All leave date ranges valid'
            : `${invalidDateCount} invalid date range(s)`,
        count: invalidDateCount
    });

    return checks;
}

/**
 * Validate payslip data
 */
async function validatePayslips(): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];

    // Check for negative salaries
    const negativeSalaries = await prisma.payslip.count({
        where: {
            OR: [
                { grossSalary: { lt: 0 } },
                { netSalary: { lt: 0 } }
            ]
        }
    });
    checks.push({
        category: 'Payslip',
        check: 'No negative salary values',
        status: negativeSalaries === 0 ? 'pass' : 'fail',
        message: negativeSalaries === 0
            ? 'All salary values non-negative'
            : `${negativeSalaries} negative salary value(s)`,
        count: negativeSalaries
    });

    // Check for net > gross
    const netGreaterThanGross = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM payslips
    WHERE net_salary > gross_salary
  `;
    const count = Number(netGreaterThanGross[0]?.count || 0);
    checks.push({
        category: 'Payslip',
        check: 'Net salary <= gross salary',
        status: count === 0 ? 'pass' : 'warn',
        message: count === 0
            ? 'All payslips have valid net/gross relationship'
            : `${count} payslip(s) with net > gross`,
        count
    });

    // Check for duplicate payslips (same employee, same period)
    const duplicatePayslips = await prisma.$queryRaw<Array<{ employee_id: string; period: string; count: bigint }>>`
    SELECT employee_id, period, COUNT(*) as count
    FROM payslips
    GROUP BY employee_id, period
    HAVING COUNT(*) > 1
  `;
    checks.push({
        category: 'Payslip',
        check: 'No duplicate payslips per period',
        status: duplicatePayslips.length === 0 ? 'pass' : 'fail',
        message: duplicatePayslips.length === 0
            ? 'No duplicate payslips'
            : `${duplicatePayslips.length} duplicate payslip(s)`
    });

    return checks;
}

/**
 * Run all data validation checks
 */
async function runAllValidations(): Promise<ValidationCheck[]> {
    const allChecks: ValidationCheck[] = [];

    try { allChecks.push(...await validateTenants()); } catch (e) { console.error('Tenant validation error:', e); }
    try { allChecks.push(...await validateUsers()); } catch (e) { console.error('User validation error:', e); }
    try { allChecks.push(...await validateEmployees()); } catch (e) { console.error('Employee validation error:', e); }
    try { allChecks.push(...await validateAttendances()); } catch (e) { console.error('Attendance validation error:', e); }
    try { allChecks.push(...await validateLeaveData()); } catch (e) { console.error('Leave validation error:', e); }
    try { allChecks.push(...await validatePayslips()); } catch (e) { console.error('Payslip validation error:', e); }

    return allChecks;
}

/**
 * Main entry point
 */
async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       PeopleHub Data Validation Report           ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log();
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log();

    const checks = await runAllValidations();

    // Group by category
    const categories = [...new Set(checks.map(c => c.category))];

    let passedCount = 0;
    let warnCount = 0;
    let failCount = 0;

    for (const category of categories) {
        console.log(`\n━━━ ${category} ━━━`);
        console.log();

        const categoryChecks = checks.filter(c => c.category === category);

        for (const check of categoryChecks) {
            let icon = '✅';
            if (check.status === 'warn') { icon = '⚠️'; warnCount++; }
            else if (check.status === 'fail') { icon = '❌'; failCount++; }
            else { passedCount++; }

            console.log(`${icon} ${check.check}`);
            console.log(`   ${check.message}`);

            if (check.details && check.details.length > 0) {
                for (const detail of check.details.slice(0, 5)) {
                    console.log(`   • ${detail}`);
                }
                if (check.details.length > 5) {
                    console.log(`   ... and ${check.details.length - 5} more`);
                }
            }
            console.log();
        }
    }

    // Summary
    console.log('═'.repeat(52));
    console.log();
    console.log('Summary');
    console.log(`  ✅ Passed:   ${passedCount}`);
    console.log(`  ⚠️  Warnings: ${warnCount}`);
    console.log(`  ❌ Failed:   ${failCount}`);
    console.log(`  Total:      ${checks.length}`);
    console.log();

    if (failCount > 0) {
        console.log('❌ DATA VALIDATION FAILED');
        console.log('Critical issues found that require attention.');
        process.exit(1);
    } else if (warnCount > 0) {
        console.log('⚠️  DATA VALIDATION PASSED WITH WARNINGS');
        console.log('Some non-critical issues found. Review and fix if needed.');
        process.exit(0);
    } else {
        console.log('✅ ALL DATA VALIDATION CHECKS PASSED');
        console.log('Data integrity verified.');
        process.exit(0);
    }
}

main()
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
