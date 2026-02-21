
import { PrismaClient, UserRole, Gender, UserStatus, EmploymentType, WorkMode } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
const seedDefaultPassword = process.env.SEED_DEFAULT_PASSWORD;

if (!databaseUrl) {
    console.error("❌ DATABASE_URL belum diset. Pastikan ada di .env.local atau .env");
    process.exit(1);
}

if (!seedDefaultPassword) {
    console.error("❌ SEED_DEFAULT_PASSWORD belum diset.");
    process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Menambahkan user Finance baru...\n");

    const passwordHash = await bcrypt.hash(seedDefaultPassword, 12);
    const tenantId = "tenant-kreatifindo";
    const domain = "kreatifindo";
    
    // Get mandatory IDs
    const branch = await prisma.branch.findFirst({ where: { tenantId } });
    
    // Try to find Finance department, fallback to HR if not found
    let department = await prisma.department.findFirst({ 
        where: { 
            tenantId, 
            code: { in: ["FIN", "ACC", "FINANCE"] } 
        } 
    });
    
    if (!department) {
        department = await prisma.department.findFirst({ where: { tenantId, code: "HR" } });
    }

    const position = await prisma.position.findFirst({ 
        where: { 
            tenantId, 
            code: { in: ["STAFF", "MGR"] } 
        } 
    });

    if (!branch || !department || !position) {
        console.error("❌ Pastikan seed utama sudah dijalankan. Branch, Department, atau Position tidak ditemukan.");
        process.exit(1);
    }

    const financeData = {
        email: `budi.finance@${domain}.peoplehub.id`,
        fullName: "Budi Santoso",
        phone: "081234567888",
        gender: Gender.MALE,
        employeeNumber: "FIN-BUDI-001",
    };

    const user = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId,
                email: financeData.email
            }
        },
        update: {
            role: UserRole.FINANCE,
            status: UserStatus.ACTIVE,
        },
        create: {
            tenantId,
            email: financeData.email,
            phone: financeData.phone,
            passwordHash,
            fullName: financeData.fullName,
            role: UserRole.FINANCE,
            status: UserStatus.ACTIVE,
            gender: financeData.gender,
            birthPlace: "Bandung",
            birthDate: new Date("1990-10-15"),
        },
    });

    await prisma.employee.upsert({
        where: { userId: user.id },
        update: {
            departmentId: department.id,
            positionId: position.id,
            status: "ACTIVE",
        },
        create: {
            tenantId,
            userId: user.id,
            employeeNumber: financeData.employeeNumber,
            employeeCode: financeData.employeeNumber,
            branchId: branch.id,
            departmentId: department.id,
            positionId: position.id,
            fullName: financeData.fullName,
            employmentType: EmploymentType.PERMANENT,
            workMode: WorkMode.WFO,
            startDate: new Date("2024-01-01"),
            status: "ACTIVE",
            phone: financeData.phone,
            bankName: "Bank BCA",
            bankAccountNumber: "888777666",
            bankAccountHolder: financeData.fullName,
            defaultShiftId: null, // Default behavior
            shiftId: null,
        },
    });

    console.log(`   ✓ Finance: ${financeData.fullName} (${financeData.email})`);
    console.log("\n✅ Berhasil menambahkan user Finance.");
    console.log("\nCredential Login:");
    console.log(`Email: ${financeData.email}`);
    console.log("Password: [diambil dari env SEED_DEFAULT_PASSWORD]");
}

main()
    .catch((e) => {
        console.error("❌ Gagal menambahkan Finance:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
