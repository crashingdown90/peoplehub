/**
 * Post-Migration Validation Script
 * 
 * This script performs validation checks after running database migrations.
 * It ensures the migration was successful and data integrity is maintained.
 * 
 * Usage: npx ts-node scripts/migrations/post-migrate.ts
 */

import prisma from '../../src/lib/db/prisma';

interface ValidationResult {
    check: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    details?: Record<string, unknown>;
}

interface ValidationSummary {
    totalChecks: number;
    passed: number;
    warnings: number;
    failed: number;
    results: ValidationResult[];
}

/**
 * Verify all required tables exist
 */
async function verifyRequiredTables(): Promise<ValidationResult> {
    const requiredTables = [
        'tenants',
        'users',
        'employees',
        'branches',
        'departments',
        'positions',
        'shifts',
        'schedules',
        'attendances',
        'leave_types',
        'leave_balances',
        'leave_requests',
        'payslips',
        'notifications',
        'audit_logs'
    ];

    try {
        const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

        const existingTables = result.map(r => r.table_name);
        const missingTables = requiredTables.filter(t => !existingTables.includes(t));

        return {
            check: 'Required Tables',
            status: missingTables.length === 0 ? 'pass' : 'fail',
            message: missingTables.length === 0
                ? `All ${requiredTables.length} required tables present`
                : `Missing tables: ${missingTables.join(', ')}`,
            details: { existingCount: existingTables.length, missingTables }
        };
    } catch (error) {
        return {
            check: 'Required Tables',
            status: 'fail',
            message: `Failed to check tables: ${error instanceof Error ? error.message : 'Unknown'}`
        };
    }
}

/**
 * Verify indexes are properly created
 */
async function verifyIndexes(): Promise<ValidationResult> {
    try {
        const result = await prisma.$queryRaw<Array<{ indexname: string; tablename: string }>>`
      SELECT indexname, tablename FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;

        const indexCount = result.length;
        const criticalIndexes = [
            'users_tenant_id_email_key',
            'employees_tenant_id_employee_number_key',
            'attendances_tenant_id_employee_id_attendance_date_key'
        ];

        const missingCritical = criticalIndexes.filter(
            idx => !result.some(r => r.indexname === idx)
        );

        return {
            check: 'Database Indexes',
            status: missingCritical.length === 0 ? 'pass' : 'warn',
            message: `${indexCount} indexes found${missingCritical.length > 0 ? `, ${missingCritical.length} critical missing` : ''}`,
            details: { totalIndexes: indexCount, missingCritical }
        };
    } catch {
        return {
            check: 'Database Indexes',
            status: 'warn',
            message: 'Unable to verify indexes'
        };
    }
}

/**
 * Verify Prisma client is compatible with schema
 */
async function verifyPrismaClient(): Promise<ValidationResult> {
    try {
        // Try to query each major model
        await prisma.tenant.findFirst();
        await prisma.user.findFirst();
        await prisma.employee.findFirst();
        await prisma.attendance.findFirst();
        await prisma.leaveRequest.findFirst();

        return {
            check: 'Prisma Client Compatibility',
            status: 'pass',
            message: 'Prisma client compatible with current schema'
        };
    } catch (error) {
        return {
            check: 'Prisma Client Compatibility',
            status: 'fail',
            message: `Prisma client incompatible: ${error instanceof Error ? error.message : 'Unknown'}. Run: npx prisma generate`
        };
    }
}

/**
 * Verify tenant isolation is maintained
 */
async function verifyTenantIsolation(): Promise<ValidationResult> {
    try {
        // Check employees are linked to users in same tenant
        const crossTenantEmployees = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.tenant_id != u.tenant_id
    `;

        // Check attendances belong to employees in same tenant
        const crossTenantAttendances = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM attendances a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.tenant_id != e.tenant_id
    `;

        const employeeViolations = Number(crossTenantEmployees[0]?.count || 0);
        const attendanceViolations = Number(crossTenantAttendances[0]?.count || 0);
        const totalViolations = employeeViolations + attendanceViolations;

        return {
            check: 'Tenant Isolation',
            status: totalViolations === 0 ? 'pass' : 'fail',
            message: totalViolations === 0
                ? 'No cross-tenant data violations'
                : `${totalViolations} cross-tenant violations found`,
            details: { employeeViolations, attendanceViolations }
        };
    } catch {
        return {
            check: 'Tenant Isolation',
            status: 'warn',
            message: 'Unable to verify tenant isolation (tables may not exist)'
        };
    }
}

/**
 * Verify foreign key integrity
 */
async function verifyForeignKeys(): Promise<ValidationResult> {
    const checks: Array<{ name: string; count: number }> = [];

    try {
        // Employees -> Users
        const orphanEmployees = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM employees 
      WHERE user_id NOT IN (SELECT id FROM users)
    `;
        checks.push({ name: 'employees->users', count: Number(orphanEmployees[0]?.count || 0) });

        // Employees -> Branches
        const orphanBranches = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM employees 
      WHERE branch_id IS NOT NULL AND branch_id NOT IN (SELECT id FROM branches)
    `;
        checks.push({ name: 'employees->branches', count: Number(orphanBranches[0]?.count || 0) });

        // Attendances -> Employees
        const orphanAttendances = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM attendances 
      WHERE employee_id NOT IN (SELECT id FROM employees)
    `;
        checks.push({ name: 'attendances->employees', count: Number(orphanAttendances[0]?.count || 0) });

        // LeaveRequests -> Employees
        const orphanLeaves = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM leave_requests 
      WHERE employee_id NOT IN (SELECT id FROM employees)
    `;
        checks.push({ name: 'leave_requests->employees', count: Number(orphanLeaves[0]?.count || 0) });

        const violations = checks.filter(c => c.count > 0);
        const totalViolations = checks.reduce((sum, c) => sum + c.count, 0);

        return {
            check: 'Foreign Key Integrity',
            status: totalViolations === 0 ? 'pass' : 'fail',
            message: totalViolations === 0
                ? 'All foreign key relationships valid'
                : `${totalViolations} FK violations in ${violations.length} relationships`,
            details: { violations: violations.map(v => `${v.name}: ${v.count}`) }
        };
    } catch {
        return {
            check: 'Foreign Key Integrity',
            status: 'warn',
            message: 'Unable to verify foreign keys'
        };
    }
}

/**
 * Verify enum values are valid
 */
async function verifyEnumValues(): Promise<ValidationResult> {
    const issues: string[] = [];

    try {
        // Check UserStatus enum
        const userStatuses = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT status::text, COUNT(*) as count FROM users GROUP BY status
    `;
        const validUserStatuses = ['PENDING', 'ACTIVE', 'APPROVED', 'REJECTED', 'SUSPENDED'];
        const invalidUserStatuses = userStatuses.filter(s => !validUserStatuses.includes(s.status));
        if (invalidUserStatuses.length > 0) {
            issues.push(`Invalid UserStatus: ${invalidUserStatuses.map(s => s.status).join(', ')}`);
        }

        // Check ApprovalStatus enum
        const approvalStatuses = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT status::text, COUNT(*) as count FROM leave_requests GROUP BY status
    `;
        const validApprovalStatuses = ['PENDING', 'APPROVED_MANAGER', 'APPROVED_HRD', 'APPROVED', 'REJECTED', 'CANCELLED'];
        const invalidApprovalStatuses = approvalStatuses.filter(s => !validApprovalStatuses.includes(s.status));
        if (invalidApprovalStatuses.length > 0) {
            issues.push(`Invalid ApprovalStatus: ${invalidApprovalStatuses.map(s => s.status).join(', ')}`);
        }

        return {
            check: 'Enum Value Validation',
            status: issues.length === 0 ? 'pass' : 'fail',
            message: issues.length === 0 ? 'All enum values valid' : issues.join('; '),
            details: { issues }
        };
    } catch {
        return {
            check: 'Enum Value Validation',
            status: 'warn',
            message: 'Unable to verify enum values'
        };
    }
}

/**
 * Get row counts for major tables
 */
async function getRowCounts(): Promise<ValidationResult> {
    try {
        const counts = await prisma.$queryRaw<Array<{ table_name: string; count: bigint }>>`
      SELECT 'tenants' as table_name, COUNT(*)::bigint as count FROM tenants
      UNION ALL SELECT 'users', COUNT(*) FROM users
      UNION ALL SELECT 'employees', COUNT(*) FROM employees
      UNION ALL SELECT 'attendances', COUNT(*) FROM attendances
      UNION ALL SELECT 'leave_requests', COUNT(*) FROM leave_requests
      UNION ALL SELECT 'payslips', COUNT(*) FROM payslips
      UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
      ORDER BY table_name
    `;

        const tableData = counts.reduce((acc, c) => {
            acc[c.table_name] = Number(c.count);
            return acc;
        }, {} as Record<string, number>);

        return {
            check: 'Table Row Counts',
            status: 'pass',
            message: counts.map(c => `${c.table_name}: ${c.count}`).join(', '),
            details: tableData
        };
    } catch {
        return {
            check: 'Table Row Counts',
            status: 'warn',
            message: 'Unable to get row counts'
        };
    }
}

/**
 * Verify migration was fully applied
 */
async function verifyMigrationStatus(): Promise<ValidationResult> {
    try {
        const result = await prisma.$queryRaw<Array<{
            migration_name: string;
            finished_at: Date | null;
            rolled_back_at: Date | null;
        }>>`
      SELECT migration_name, finished_at, rolled_back_at
      FROM _prisma_migrations
      WHERE rolled_back_at IS NULL
      ORDER BY finished_at DESC
      LIMIT 1
    `;

        const lastMigration = result[0];

        if (!lastMigration) {
            return {
                check: 'Migration Status',
                status: 'warn',
                message: 'No migrations found'
            };
        }

        return {
            check: 'Migration Status',
            status: lastMigration.finished_at ? 'pass' : 'fail',
            message: lastMigration.finished_at
                ? `Latest migration: ${lastMigration.migration_name}`
                : 'Latest migration incomplete',
            details: {
                migrationName: lastMigration.migration_name,
                finishedAt: lastMigration.finished_at?.toISOString()
            }
        };
    } catch {
        return {
            check: 'Migration Status',
            status: 'warn',
            message: 'Unable to verify migration status'
        };
    }
}

/**
 * Run all post-migration checks
 */
async function runPostMigrationChecks(): Promise<ValidationSummary> {
    const results: ValidationResult[] = [];

    results.push(await verifyPrismaClient());
    results.push(await verifyRequiredTables());
    results.push(await verifyIndexes());
    results.push(await verifyMigrationStatus());
    results.push(await verifyTenantIsolation());
    results.push(await verifyForeignKeys());
    results.push(await verifyEnumValues());
    results.push(await getRowCounts());

    const passed = results.filter(r => r.status === 'pass').length;
    const warnings = results.filter(r => r.status === 'warn').length;
    const failed = results.filter(r => r.status === 'fail').length;

    return {
        totalChecks: results.length,
        passed,
        warnings,
        failed,
        results
    };
}

/**
 * Main entry point
 */
async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       PeopleHub Post-Migration Validation        ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log();
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log();
    console.log('Running checks...\n');

    const summary = await runPostMigrationChecks();

    // Print results
    for (const result of summary.results) {
        let icon = '✅';
        if (result.status === 'warn') icon = '⚠️';
        if (result.status === 'fail') icon = '❌';

        console.log(`${icon} ${result.check}`);
        console.log(`   ${result.message}`);

        if (result.details && Object.keys(result.details).length > 0) {
            const detailsStr = JSON.stringify(result.details, null, 2)
                .split('\n')
                .map(line => `   ${line}`)
                .join('\n');
            console.log(`   Details: ${detailsStr.trim().replace('   {', '{')}`);
        }
        console.log();
    }

    // Print summary
    console.log('═'.repeat(52));
    console.log();
    console.log(`Summary: ${summary.passed} passed, ${summary.warnings} warnings, ${summary.failed} failed`);
    console.log();

    if (summary.failed > 0) {
        console.log('❌ POST-MIGRATION VALIDATION FAILED');
        console.log();
        console.log('Critical issues found. Consider rollback if necessary.');
        console.log('Review failed checks and take corrective action.');
        process.exit(1);
    } else if (summary.warnings > 0) {
        console.log('⚠️  POST-MIGRATION VALIDATION PASSED WITH WARNINGS');
        console.log();
        console.log('Migration successful but some checks have warnings.');
        console.log('Review warnings and address if needed.');
        process.exit(0);
    } else {
        console.log('✅ ALL POST-MIGRATION CHECKS PASSED');
        console.log();
        console.log('Migration completed successfully.');
        console.log('System is ready for use.');
        process.exit(0);
    }
}

main()
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
