// @ai:cl - E2E Test Database Seeding Script
// This script creates test users and data required for E2E testing
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL;
const seedE2EPassword = process.env.SEED_E2E_PASSWORD;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set. Please configure in .env');
    process.exit(1);
}

if (!seedE2EPassword) {
    console.error("❌ SEED_E2E_PASSWORD not set. Configure it before running db:seed:e2e.");
    process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Test tenant configuration
 */
const TEST_TENANT = {
    id: 'test-tenant-id',
    name: 'Test Company',
    domain: 'test.peoplehub.id',
    code: 'TEST001',
};

/**
 * Test users with different roles
 */
const TEST_USERS = {
    employee: {
        email: 'employee@test.peoplehub.id',
        password: seedE2EPassword,
        fullName: 'Test Employee',
        nik: 'EMP-001',
    },
    manager: {
        email: 'manager@test.peoplehub.id',
        password: seedE2EPassword,
        fullName: 'Test Manager',
        nik: 'MGR-001',
    },
    hrd: {
        email: 'hrd@test.peoplehub.id',
        password: seedE2EPassword,
        fullName: 'Test HRD',
        nik: 'HRD-001',
    },
};

async function main() {
    console.log('🌱 Starting E2E test database seeding...');

    // Clean up existing test data
    console.log('🧹 Cleaning up existing test data...');
    await prisma.leaveRequest.deleteMany({
        where: { tenantId: TEST_TENANT.id },
    });
    await prisma.leaveBalance.deleteMany({
        where: { tenantId: TEST_TENANT.id },
    });
    await prisma.employee.deleteMany({
        where: { tenantId: TEST_TENANT.id },
    });
    await prisma.user.deleteMany({
        where: { email: { contains: '@test.peoplehub.id' } },
    });
    await prisma.tenant.deleteMany({
        where: { id: TEST_TENANT.id },
    });

    // Create test tenant
    console.log('🏢 Creating test tenant...');
    const tenant = await prisma.tenant.create({
        data: {
            id: TEST_TENANT.id,
            name: TEST_TENANT.name,
            domain: TEST_TENANT.domain,
            code: TEST_TENANT.code,
            isActive: true,
        },
    });

    // Create department
    const department = await prisma.department.create({
        data: {
            tenantId: tenant.id,
            name: 'Engineering',
            code: 'ENG',
        },
    });

    // Create branch (required by login API employee include)
    const branch = await prisma.branch.create({
        data: {
            tenantId: tenant.id,
            code: 'HQ',
            name: 'Head Office',
            address: 'Jakarta Selatan',
            city: 'Jakarta',
            timezone: 'Asia/Jakarta',
            geofenceRadiusMeters: 100,
        },
    });

    // Create position (required by login API employee include)
    const position = await prisma.position.create({
        data: {
            tenantId: tenant.id,
            code: 'ENG-001',
            name: 'Software Engineer',
            level: 3,
        },
    });

    // Create leave types
    console.log('📋 Creating leave types...');
    const leaveTypeAnnual = await prisma.leaveType.create({
        data: {
            tenantId: tenant.id,
            name: 'Cuti Tahunan',
            code: 'ANNUAL',
            defaultBalance: 12,
            isPaid: true,
        },
    });

    const leaveTypeSick = await prisma.leaveType.create({
        data: {
            tenantId: tenant.id,
            name: 'Cuti Sakit',
            code: 'SICK',
            defaultBalance: 12,
            isPaid: true,
        },
    });

    // Hash passwords
    const hashedPassword = await bcrypt.hash(TEST_USERS.employee.password, 10);

    // Create HRD user and employee
    console.log('👤 Creating HRD user...');
    const hrdUser = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: TEST_USERS.hrd.email,
            passwordHash: hashedPassword,
            fullName: TEST_USERS.hrd.fullName,
            role: UserRole.HRD,
            status: 'ACTIVE',
        },
    });

    const hrdEmployee = await prisma.employee.create({
        data: {
            tenantId: tenant.id,
            userId: hrdUser.id,
            employeeNumber: TEST_USERS.hrd.nik,
            employeeCode: TEST_USERS.hrd.nik,
            fullName: TEST_USERS.hrd.fullName,
            phone: '081234567890',
            branchId: branch.id,
            departmentId: department.id,
            positionId: position.id,
            startDate: new Date('2024-01-01'),
            status: 'ACTIVE',
        },
    });

    // Create Manager user and employee
    console.log('👤 Creating Manager user...');
    const managerUser = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: TEST_USERS.manager.email,
            passwordHash: hashedPassword,
            fullName: TEST_USERS.manager.fullName,
            role: UserRole.MANAGER,
            status: 'ACTIVE',
        },
    });

    const managerEmployee = await prisma.employee.create({
        data: {
            tenantId: tenant.id,
            userId: managerUser.id,
            employeeNumber: TEST_USERS.manager.nik,
            employeeCode: TEST_USERS.manager.nik,
            fullName: TEST_USERS.manager.fullName,
            phone: '081234567891',
            branchId: branch.id,
            departmentId: department.id,
            positionId: position.id,
            startDate: new Date('2024-01-01'),
            status: 'ACTIVE',
        },
    });

    // Create Employee user and employee (reports to manager)
    console.log('👤 Creating Employee user...');
    const employeeUser = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: TEST_USERS.employee.email,
            passwordHash: hashedPassword,
            fullName: TEST_USERS.employee.fullName,
            role: UserRole.EMPLOYEE,
            status: 'ACTIVE',
        },
    });

    const employee = await prisma.employee.create({
        data: {
            tenantId: tenant.id,
            userId: employeeUser.id,
            employeeNumber: TEST_USERS.employee.nik,
            employeeCode: TEST_USERS.employee.nik,
            fullName: TEST_USERS.employee.fullName,
            phone: '081234567892',
            branchId: branch.id,
            departmentId: department.id,
            positionId: position.id,
            managerId: managerEmployee.id, // Reports to manager
            startDate: new Date('2024-01-01'),
            status: 'ACTIVE',
        },
    });

    // Create leave balances for employee
    console.log('📊 Creating leave balances...');
    const currentYear = new Date().getFullYear();

    await prisma.leaveBalance.create({
        data: {
            tenantId: tenant.id,
            employeeId: employee.id,
            leaveTypeId: leaveTypeAnnual.id,
            year: currentYear,
            initialBalance: 12,
            usedBalance: 2,
            remainingBalance: 10,
        },
    });

    await prisma.leaveBalance.create({
        data: {
            tenantId: tenant.id,
            employeeId: employee.id,
            leaveTypeId: leaveTypeSick.id,
            year: currentYear,
            initialBalance: 12,
            usedBalance: 0,
            remainingBalance: 12,
        },
    });

    // Create sample leave request (pending)
    console.log('📝 Creating sample leave requests...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const futureEndDate = new Date(futureDate);
    futureEndDate.setDate(futureDate.getDate() + 2);

    await prisma.leaveRequest.create({
        data: {
            tenantId: tenant.id,
            employeeId: employee.id,
            leaveTypeId: leaveTypeAnnual.id,
            startDate: futureDate,
            endDate: futureEndDate,
            totalDays: 3,
            reason: 'Test leave request - pending manager approval',
            status: 'PENDING',
        },
    });

    console.log('✅ E2E database seeding completed!');
    console.log('\n📋 Test Users Created:');
    console.log(`   Employee: ${TEST_USERS.employee.email}`);
    console.log(`   Manager:  ${TEST_USERS.manager.email}`);
    console.log(`   HRD:      ${TEST_USERS.hrd.email}`);
    console.log("   Password: [diambil dari env SEED_E2E_PASSWORD]");
    console.log('\n🏢 Tenant:', TEST_TENANT.name, `(${TEST_TENANT.id})`);
    console.log('📋 Department:', department.name);
    console.log('🍃 Leave Types:', leaveTypeAnnual.name, ',', leaveTypeSick.name);
    console.log('💰 Employee Leave Balance: 10 days annual, 12 days sick');
    console.log('📝 Sample Leave Request: 1 pending request');
    console.log('\n⚠️  Note: Used employee', employee.fullName, 'and manager', managerEmployee.fullName, 'for HRD', hrdEmployee.fullName);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
