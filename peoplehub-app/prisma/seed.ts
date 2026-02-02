// @ai:cx - Database seed for Phase 1 PeopleHub
// Multi-tenant: Kreatifindo, Violet, Cyber Artha, Cyber Mandiri

import { PrismaClient, UserRole, Gender } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("❌ DATABASE_URL belum diset. Pastikan ada di .env.local");
    process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ==========================================
// TENANT DATA
// ==========================================

const tenantsData = [
    {
        id: "tenant-kreatifindo",
        name: "PT. KREATIFINDO ABADI SEJAHTERA",
        domain: "kreatifindo",
        code: "KRT",
    },
    {
        id: "tenant-violet",
        name: "PT. VIOLET GLOBAL INDONESIA",
        domain: "violet",
        code: "VIO",
    },
    {
        id: "tenant-cyber-artha",
        name: "PT. CYBER MULTI ARTHA",
        domain: "cyber-artha",
        code: "CMA",
    },
    {
        id: "tenant-cyber-mandiri",
        name: "CV. CYBER MULTI MANDIRI",
        domain: "cyber-mandiri",
        code: "CMM",
    },
];

// ==========================================
// ORGANIZATION STRUCTURE (Same for all tenants)
// ==========================================

const departmentsData = [
    { code: "IT", name: "Information Technology" },
    { code: "HR", name: "Human Resources" },
    { code: "FIN", name: "Finance" },
    { code: "OPS", name: "Operations" },
    { code: "MKT", name: "Marketing" },
    { code: "SALES", name: "Sales" },
];

const positionsData = [
    { code: "DIR", name: "Director", level: 1 },
    { code: "MGR", name: "Manager", level: 2 },
    { code: "SPV", name: "Supervisor", level: 3 },
    { code: "SR", name: "Senior Staff", level: 4 },
    { code: "STF", name: "Staff", level: 5 },
    { code: "INT", name: "Intern", level: 6 },
];

const shiftsData = [
    { name: "Regular", startTime: "08:00", endTime: "17:00", breakMinutes: 60, isFlexible: false },
    { name: "Pagi", startTime: "06:00", endTime: "14:00", breakMinutes: 60, isFlexible: false },
    { name: "Siang", startTime: "14:00", endTime: "22:00", breakMinutes: 60, isFlexible: false },
    { name: "Flexible", startTime: "08:00", endTime: "17:00", breakMinutes: 60, isFlexible: true },
];

const leaveTypesData = [
    { code: "ANNUAL", name: "Cuti Tahunan", defaultBalance: 12, isPaid: true },
    { code: "SICK", name: "Cuti Sakit", defaultBalance: 14, isPaid: true, requiresAttachment: true },
    { code: "MATERNITY", name: "Cuti Melahirkan", defaultBalance: 90, isPaid: true },
    { code: "PATERNITY", name: "Cuti Ayah", defaultBalance: 3, isPaid: true },
    { code: "MARRIAGE", name: "Cuti Menikah", defaultBalance: 3, isPaid: true },
    { code: "UNPAID", name: "Cuti Tidak Dibayar", defaultBalance: 30, isPaid: false },
];

// Branch locations per tenant
const branchesData: Record<string, Array<{ code: string; name: string; address: string; city: string; latitude: number; longitude: number }>> = {
    "tenant-kreatifindo": [
        { code: "JKT", name: "Jakarta Pusat", address: "Jl. Sudirman No. 1", city: "Jakarta", latitude: -6.2088, longitude: 106.8456 },
    ],
    "tenant-violet": [
        { code: "JKT", name: "Jakarta", address: "Jl. Gatot Subroto No. 10", city: "Jakarta", latitude: -6.2297, longitude: 106.8295 },
    ],
    "tenant-cyber-artha": [
        { code: "JKT", name: "Jakarta", address: "Jl. HR Rasuna Said", city: "Jakarta", latitude: -6.2180, longitude: 106.8319 },
    ],
    "tenant-cyber-mandiri": [
        { code: "JKT", name: "Jakarta", address: "Jl. Kuningan Barat", city: "Jakarta", latitude: -6.2263, longitude: 106.8268 },
    ],
};

async function main() {
    console.log("🌱 Memulai seed Phase 1 PeopleHub...\n");

    const passwordHash = await bcrypt.hash("Demo123!", 12);

    // ==========================================
    // SEED TENANTS
    // ==========================================
    console.log("📦 Creating Tenants...");

    for (const tenantData of tenantsData) {
        const tenant = await prisma.tenant.upsert({
            where: { id: tenantData.id },
            update: {
                name: tenantData.name,
                domain: tenantData.domain,
                code: tenantData.code,
            },
            create: {
                id: tenantData.id,
                name: tenantData.name,
                domain: tenantData.domain,
                code: tenantData.code,
                isActive: true,
            },
        });
        console.log(`   ✓ Tenant: ${tenant.name} (${tenant.code})`);

        // ==========================================
        // SEED ATTENDANCE SETTINGS per Tenant
        // ==========================================
        await prisma.attendanceSettings.upsert({
            where: { tenantId: tenant.id },
            update: {},
            create: {
                tenantId: tenant.id,
                defaultShiftStart: "08:00",
                defaultShiftEnd: "17:00",
                breakMinutes: 60,
                earliestClockIn: "06:00",
                latestClockOut: "22:00",
                gracePeriodMinutes: 5,
                lateDeductionEnabled: false,
                lateDeductionType: "PER_MINUTE",
                lateDeductionAmount: 0,
                geofenceRadius: 10000,
                geofenceEnabled: true,
                requireFaceDetection: true,
                requireLiveness: true,
                minFaceConfidence: 0.7,
                workDays: [1, 2, 3, 4, 5], // Mon-Fri
            },
        });
        console.log(`   ✓ Attendance Settings for ${tenant.code}`);

        // ==========================================
        // SEED BRANCHES per Tenant
        // ==========================================
        const tenantBranches = branchesData[tenant.id] || [];
        const createdBranches: Record<string, string> = {};

        for (const branchData of tenantBranches) {
            const branch = await prisma.branch.upsert({
                where: {
                    tenantId_code: {
                        tenantId: tenant.id,
                        code: branchData.code
                    }
                },
                update: {},
                create: {
                    tenantId: tenant.id,
                    code: branchData.code,
                    name: branchData.name,
                    address: branchData.address,
                    city: branchData.city,
                    latitude: branchData.latitude,
                    longitude: branchData.longitude,
                    geofenceRadiusMeters: 10000,
                    isActive: true,
                },
            });
            createdBranches[branchData.code] = branch.id;
            console.log(`   ✓ Branch: ${branch.name}`);
        }

        // ==========================================
        // SEED DEPARTMENTS per Tenant
        // ==========================================
        const createdDepts: Record<string, string> = {};
        const defaultBranchId = Object.values(createdBranches)[0];

        for (const deptData of departmentsData) {
            const dept = await prisma.department.upsert({
                where: {
                    tenantId_code: {
                        tenantId: tenant.id,
                        code: deptData.code
                    }
                },
                update: {},
                create: {
                    tenantId: tenant.id,
                    branchId: defaultBranchId,
                    code: deptData.code,
                    name: deptData.name,
                    isActive: true,
                },
            });
            createdDepts[deptData.code] = dept.id;
        }
        console.log(`   ✓ Departments: ${departmentsData.length} created`);

        // ==========================================
        // SEED POSITIONS per Tenant
        // ==========================================
        const createdPositions: Record<string, string> = {};

        for (const posData of positionsData) {
            const pos = await prisma.position.upsert({
                where: {
                    tenantId_code: {
                        tenantId: tenant.id,
                        code: posData.code
                    }
                },
                update: {},
                create: {
                    tenantId: tenant.id,
                    code: posData.code,
                    name: posData.name,
                    level: posData.level,
                    isActive: true,
                },
            });
            createdPositions[posData.code] = pos.id;
        }
        console.log(`   ✓ Positions: ${positionsData.length} created`);

        // ==========================================
        // SEED SHIFTS per Tenant
        // ==========================================
        for (const shiftData of shiftsData) {
            await prisma.shift.upsert({
                where: {
                    id: `${tenant.id}-shift-${shiftData.name.toLowerCase().replace(/\s/g, '-')}`
                },
                update: {},
                create: {
                    id: `${tenant.id}-shift-${shiftData.name.toLowerCase().replace(/\s/g, '-')}`,
                    tenantId: tenant.id,
                    name: shiftData.name,
                    startTime: shiftData.startTime,
                    endTime: shiftData.endTime,
                    breakMinutes: shiftData.breakMinutes,
                    isFlexible: shiftData.isFlexible,
                    isActive: true,
                },
            });
        }
        console.log(`   ✓ Shifts: ${shiftsData.length} created`);

        // ==========================================
        // SEED LEAVE TYPES per Tenant
        // ==========================================
        for (const ltData of leaveTypesData) {
            await prisma.leaveType.upsert({
                where: {
                    tenantId_code: {
                        tenantId: tenant.id,
                        code: ltData.code
                    }
                },
                update: {},
                create: {
                    tenantId: tenant.id,
                    code: ltData.code,
                    name: ltData.name,
                    defaultBalance: ltData.defaultBalance,
                    isPaid: ltData.isPaid,
                    requiresAttachment: ltData.requiresAttachment || false,
                    isActive: true,
                },
            });
        }
        console.log(`   ✓ Leave Types: ${leaveTypesData.length} created`);

        // ==========================================
        // SEED HRD USER per Tenant
        // ==========================================
        const hrdEmail = `hrd@${tenantData.domain}.peoplehub.id`;
        const hrdUser = await prisma.user.upsert({
            where: {
                tenantId_email: {
                    tenantId: tenant.id,
                    email: hrdEmail
                }
            },
            update: {},
            create: {
                tenantId: tenant.id,
                email: hrdEmail,
                phone: `08123456789${tenantsData.indexOf(tenantData)}`,
                passwordHash,
                fullName: `Admin HRD ${tenant.code}`,
                role: "HRD",
                status: "ACTIVE",
                gender: "MALE",
                birthPlace: "Jakarta",
                birthDate: new Date("1990-01-01"),
            },
        });

        // Create Employee record for HRD
        const year = new Date().getFullYear();
        const tenantIdx = tenantsData.indexOf(tenantData);
        const employeeNumber = `${tenant.code}${year}0000${tenantIdx + 1}`;

        await prisma.employee.upsert({
            where: { userId: hrdUser.id },
            update: {},
            create: {
                tenantId: tenant.id,
                userId: hrdUser.id,
                employeeNumber,
                employeeCode: employeeNumber,
                branchId: defaultBranchId,
                departmentId: createdDepts["HR"],
                positionId: createdPositions["MGR"],
                fullName: hrdUser.fullName,
                employmentType: "PERMANENT",
                workMode: "WFO",
                startDate: new Date("2024-01-01"),
                status: "ACTIVE",
                phone: hrdUser.phone || "081234567890",
                bankName: "Bank BCA",
                bankAccountNumber: "1234567890",
                bankAccountHolder: hrdUser.fullName,
            },
        });

        console.log(`   ✓ HRD User: ${hrdUser.email}`);

        // ==========================================
        // SEED FINANCE USER per Tenant
        // ==========================================
        const financeEmail = `finance@${tenantData.domain}.peoplehub.id`;
        const financeUser = await prisma.user.upsert({
            where: {
                tenantId_email: {
                    tenantId: tenant.id,
                    email: financeEmail
                }
            },
            update: {},
            create: {
                tenantId: tenant.id,
                email: financeEmail,
                phone: `08198765432${tenantIdx}`,
                passwordHash,
                fullName: `Admin Finance ${tenant.code}`,
                role: "FINANCE",
                status: "ACTIVE",
                gender: "FEMALE",
                birthPlace: "Jakarta",
                birthDate: new Date("1992-06-15"),
            },
        });

        // Create Employee record for Finance
        const financeEmployeeNumber = `${tenant.code}${year}1000${tenantIdx + 1}`;

        await prisma.employee.upsert({
            where: { userId: financeUser.id },
            update: {},
            create: {
                tenantId: tenant.id,
                userId: financeUser.id,
                employeeNumber: financeEmployeeNumber,
                employeeCode: financeEmployeeNumber,
                branchId: defaultBranchId,
                departmentId: createdDepts["FIN"],
                positionId: createdPositions["MGR"],
                fullName: financeUser.fullName,
                employmentType: "PERMANENT",
                workMode: "WFO",
                startDate: new Date("2024-01-01"),
                status: "ACTIVE",
                phone: financeUser.phone || "081987654320",
                bankName: "Bank Mandiri",
                bankAccountNumber: "9876543210",
                bankAccountHolder: financeUser.fullName,
            },
        });

        console.log(`   ✓ Finance User: ${financeUser.email}`);

        console.log("");
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log("═══════════════════════════════════════");
    console.log("✅ Seed Phase 1 selesai!");
    console.log("═══════════════════════════════════════");
    console.log("");
    console.log("📋 Data yang dibuat:");
    console.log(`   • ${tenantsData.length} Tenants`);
    console.log(`   • ${tenantsData.length} Attendance Settings`);
    console.log(`   • ${tenantsData.length} Branches`);
    console.log(`   • ${tenantsData.length * departmentsData.length} Departments`);
    console.log(`   • ${tenantsData.length * positionsData.length} Positions`);
    console.log(`   • ${tenantsData.length * shiftsData.length} Shifts`);
    console.log(`   • ${tenantsData.length * leaveTypesData.length} Leave Types`);
    console.log(`   • ${tenantsData.length} HRD Users (1 per tenant)`);
    console.log(`   • ${tenantsData.length} Finance Users (1 per tenant)`);
    console.log("");
    console.log("🔐 Login HRD (semua password: Demo123!):");
    for (const t of tenantsData) {
        console.log(`   • ${t.name}: hrd@${t.domain}.peoplehub.id`);
    }
    console.log("");
    console.log("🔐 Login Finance (semua password: Demo123!):");
    for (const t of tenantsData) {
        console.log(`   • ${t.name}: finance@${t.domain}.peoplehub.id`);
    }
    console.log("");
}

main()
    .catch((e) => {
        console.error("❌ Seed gagal:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
