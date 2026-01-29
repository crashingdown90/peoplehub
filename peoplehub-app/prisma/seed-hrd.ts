
import { PrismaClient, UserRole, Gender, UserStatus, EmploymentType, WorkMode } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("❌ DATABASE_URL belum diset. Pastikan ada di .env.local atau .env");
    process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Menambahkan user HRD baru...\n");

    const passwordHash = await bcrypt.hash("Demo123!", 12);
    const tenantId = "tenant-kreatifindo";
    const domain = "kreatifindo";
    
    // Get mandatory IDs
    const branch = await prisma.branch.findFirst({ where: { tenantId } });
    const department = await prisma.department.findFirst({ where: { tenantId, code: "HR" } });
    const position = await prisma.position.findFirst({ where: { tenantId, code: "MGR" } });

    if (!branch || !department || !position) {
        console.error("❌ Pastikan seed utama sudah dijalankan. Branch, HR Department, atau Manager Position tidak ditemukan.");
        process.exit(1);
    }

    const hrdData = {
        email: `maya.hrd@${domain}.peoplehub.id`,
        fullName: "Maya Sari",
        phone: "081234567999",
        gender: Gender.FEMALE,
        employeeNumber: "HRD-MAYA-001",
    };

    const user = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId,
                email: hrdData.email
            }
        },
        update: {
            role: UserRole.HRD,
            status: UserStatus.ACTIVE,
        },
        create: {
            tenantId,
            email: hrdData.email,
            phone: hrdData.phone,
            passwordHash,
            fullName: hrdData.fullName,
            role: UserRole.HRD,
            status: UserStatus.ACTIVE,
            gender: hrdData.gender,
            birthPlace: "Jakarta",
            birthDate: new Date("1992-05-20"),
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
            employeeNumber: hrdData.employeeNumber,
            employeeCode: hrdData.employeeNumber,
            branchId: branch.id,
            departmentId: department.id,
            positionId: position.id,
            fullName: hrdData.fullName,
            employmentType: EmploymentType.PERMANENT,
            workMode: WorkMode.WFO,
            startDate: new Date("2024-01-01"),
            status: "ACTIVE",
            phone: hrdData.phone,
            bankName: "Bank BCA",
            bankAccountNumber: "999888777",
            bankAccountHolder: hrdData.fullName,
        },
    });

    console.log(`   ✓ HRD: ${hrdData.fullName} (${hrdData.email})`);
    console.log("\n✅ Berhasil menambahkan user HRD.");
    console.log("\nCredential Login:");
    console.log(`Email: ${hrdData.email}`);
    console.log(`Password: Demo123!`);
}

main()
    .catch((e) => {
        console.error("❌ Gagal menambahkan HRD:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
