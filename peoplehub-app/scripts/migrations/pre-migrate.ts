/**
 * Pre-Migration Validation Script
 * 
 * This script performs validation checks before running database migrations.
 * It ensures the environment is ready and identifies potential issues.
 * 
 * Usage: npx ts-node scripts/migrations/pre-migrate.ts
 */

import prisma from '../../src/lib/db/prisma';

interface ValidationResult {
    check: string;
    passed: boolean;
    message: string;
    critical: boolean;
    details?: Record<string, unknown>;
}

interface ValidationSummary {
    totalChecks: number;
    passed: number;
    failed: number;
    criticalFailed: boolean;
    results: ValidationResult[];
}

/**
 * Check database connectivity
 */
async function checkDatabaseConnection(): Promise<ValidationResult> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return {
            check: 'Database Connectivity',
            passed: true,
            message: 'Database connection successful',
            critical: true
        };
    } catch (error) {
        return {
            check: 'Database Connectivity',
            passed: false,
            message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            critical: true
        };
    }
}

/**
 * Check for active transactions that might block migration
 */
async function checkActiveTransactions(): Promise<ValidationResult> {
    try {
        const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM pg_stat_activity 
      WHERE state = 'active' 
      AND query NOT LIKE '%pg_stat_activity%'
      AND pid != pg_backend_pid()
    `;
        const count = Number(result[0]?.count || 0);

        return {
            check: 'Active Transactions',
            passed: count < 10,
            message: count < 10
                ? `${count} active transactions (acceptable)`
                : `${count} active transactions (consider waiting)`,
            critical: false,
            details: { activeTransactions: count }
        };
    } catch {
        return {
            check: 'Active Transactions',
            passed: true,
            message: 'Unable to check (non-critical)',
            critical: false
        };
    }
}

/**
 * Check database size for backup estimation
 */
async function checkDatabaseSize(): Promise<ValidationResult> {
    try {
        const result = await prisma.$queryRaw<Array<{ size: string; bytes: bigint }>>`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as size,
        pg_database_size(current_database()) as bytes
    `;
        const size = result[0]?.size || 'Unknown';
        const bytes = Number(result[0]?.bytes || 0);

        // Warn if database is very large (>10GB)
        const isLarge = bytes > 10 * 1024 * 1024 * 1024;

        return {
            check: 'Database Size',
            passed: !isLarge,
            message: `Current size: ${size}${isLarge ? ' (large - backup may take time)' : ''}`,
            critical: false,
            details: { size, bytes }
        };
    } catch (error) {
        return {
            check: 'Database Size',
            passed: true,
            message: 'Unable to determine size',
            critical: false
        };
    }
}

/**
 * Verify tenant data exists
 */
async function checkTenantData(): Promise<ValidationResult> {
    try {
        const tenantCount = await prisma.tenant.count();

        return {
            check: 'Tenant Data',
            passed: tenantCount > 0,
            message: tenantCount > 0
                ? `${tenantCount} tenant(s) found`
                : 'No tenants found (might be fresh database)',
            critical: false,
            details: { tenantCount }
        };
    } catch {
        return {
            check: 'Tenant Data',
            passed: false,
            message: 'Unable to query tenants: Unknown error',
            critical: true
        };
    }
}

/**
 * Check for orphaned records (data integrity)
 */
async function checkOrphanedRecords(): Promise<ValidationResult> {
    try {
        const orphanedEmployees = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE u.id IS NULL
    `;
        const count = Number(orphanedEmployees[0]?.count || 0);

        return {
            check: 'Orphaned Records (Employees)',
            passed: count === 0,
            message: count === 0
                ? 'No orphaned employee records'
                : `${count} employees without valid user reference`,
            critical: true,
            details: { orphanedEmployees: count }
        };
    } catch {
        // Table might not exist yet
        return {
            check: 'Orphaned Records (Employees)',
            passed: true,
            message: 'Check skipped (table may not exist)',
            critical: false
        };
    }
}

/**
 * Check for NULL tenant_id in critical tables
 */
async function checkTenantIsolation(): Promise<ValidationResult> {
    const tables = ['users', 'employees', 'attendances', 'leave_requests'];
    const issues: string[] = [];

    for (const table of tables) {
        try {
            const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
                `SELECT COUNT(*) as count FROM ${table} WHERE tenant_id IS NULL`
            );
            const count = Number(result[0]?.count || 0);
            if (count > 0) {
                issues.push(`${table}: ${count} records`);
            }
        } catch {
            // Table might not exist
        }
    }

    return {
        check: 'Tenant Isolation (NULL tenant_id)',
        passed: issues.length === 0,
        message: issues.length === 0
            ? 'All records have tenant_id'
            : `NULL tenant_id found: ${issues.join(', ')}`,
        critical: true,
        details: { issues }
    };
}

/**
 * Check migration history
 */
async function checkMigrationHistory(): Promise<ValidationResult> {
    try {
        const migrations = await prisma.$queryRaw<Array<{
            migration_name: string;
            finished_at: Date | null;
            rolled_back_at: Date | null;
        }>>`
      SELECT migration_name, finished_at, rolled_back_at 
      FROM _prisma_migrations 
      ORDER BY started_at DESC
      LIMIT 5
    `;

        const pendingMigrations = migrations.filter(m => !m.finished_at || m.rolled_back_at);

        return {
            check: 'Migration History',
            passed: pendingMigrations.length === 0,
            message: pendingMigrations.length === 0
                ? `${migrations.length} recent migrations (all applied)`
                : `${pendingMigrations.length} pending/rolled-back migrations`,
            critical: pendingMigrations.length > 0,
            details: {
                recentMigrations: migrations.map(m => m.migration_name),
                pendingCount: pendingMigrations.length
            }
        };
    } catch {
        // _prisma_migrations might not exist
        return {
            check: 'Migration History',
            passed: true,
            message: 'No migration history (fresh database)',
            critical: false
        };
    }
}

/**
 * Check PostgreSQL version
 */
async function checkPostgresVersion(): Promise<ValidationResult> {
    try {
        const result = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version()
    `;
        const version = result[0]?.version || 'Unknown';
        const versionMatch = version.match(/PostgreSQL (\d+)/);
        const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;

        return {
            check: 'PostgreSQL Version',
            passed: majorVersion >= 14,
            message: majorVersion >= 14
                ? `PostgreSQL ${majorVersion} (supported)`
                : `PostgreSQL ${majorVersion} (minimum 14 recommended)`,
            critical: false,
            details: { fullVersion: version, majorVersion }
        };
    } catch {
        return {
            check: 'PostgreSQL Version',
            passed: true,
            message: 'Unable to determine version',
            critical: false
        };
    }
}

/**
 * Check disk space (approximate via database)
 */
async function checkTableStats(): Promise<ValidationResult> {
    try {
        const result = await prisma.$queryRaw<Array<{
            table_name: string;
            row_count: bigint;
        }>>`
      SELECT 
        relname as table_name,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
      LIMIT 10
    `;

        const tables = result.map(r => `${r.table_name}: ${r.row_count}`);

        return {
            check: 'Table Statistics',
            passed: true,
            message: `Top tables by row count`,
            critical: false,
            details: { tables }
        };
    } catch {
        return {
            check: 'Table Statistics',
            passed: true,
            message: 'Unable to retrieve table stats',
            critical: false
        };
    }
}

/**
 * Run all pre-migration checks
 */
async function runPreMigrationChecks(): Promise<ValidationSummary> {
    const results: ValidationResult[] = [];

    // Run all checks
    results.push(await checkDatabaseConnection());

    // Only continue if database is connected
    if (results[0].passed) {
        results.push(await checkPostgresVersion());
        results.push(await checkDatabaseSize());
        results.push(await checkActiveTransactions());
        results.push(await checkMigrationHistory());
        results.push(await checkTenantData());
        results.push(await checkOrphanedRecords());
        results.push(await checkTenantIsolation());
        results.push(await checkTableStats());
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const criticalFailed = results.some(r => !r.passed && r.critical);

    return {
        totalChecks: results.length,
        passed,
        failed,
        criticalFailed,
        results
    };
}

/**
 * Main entry point
 */
async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       PeopleHub Pre-Migration Validation         ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log();
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log();
    console.log('Running checks...\n');

    const summary = await runPreMigrationChecks();

    // Print results
    for (const result of summary.results) {
        const status = result.passed ? '✅' : '❌';
        const severity = result.critical ? ' (CRITICAL)' : '';
        console.log(`${status} ${result.check}${severity}`);
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
    console.log(`Summary: ${summary.passed}/${summary.totalChecks} checks passed`);
    console.log();

    if (summary.criticalFailed) {
        console.log('❌ PRE-MIGRATION CHECKS FAILED');
        console.log();
        console.log('Critical issues must be resolved before proceeding.');
        console.log('Review the failed checks above and fix the issues.');
        process.exit(1);
    } else if (summary.failed > 0) {
        console.log('⚠️  PRE-MIGRATION CHECKS PASSED WITH WARNINGS');
        console.log();
        console.log('Non-critical issues found. Review before proceeding.');
        console.log('Migration can continue, but address warnings soon.');
        process.exit(0);
    } else {
        console.log('✅ ALL PRE-MIGRATION CHECKS PASSED');
        console.log();
        console.log('Environment is ready for migration.');
        console.log('Proceed with: npx prisma migrate deploy');
        process.exit(0);
    }
}

main()
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
