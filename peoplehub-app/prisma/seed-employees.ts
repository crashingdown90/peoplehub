
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
    console.log("🌱 Menambahkan 2 user karyawan...\n");

    const passwordHash = await bcrypt.hash(seedDefaultPassword, 12);
    const tenantId = "tenant-kreatifindo";
    const domain = "kreatifindo";
    
    // Get mandatory IDs
    const branch = await prisma.branch.findFirst({ where: { tenantId } });
    const department = await prisma.department.findFirst({ where: { tenantId, code: "IT" } });
    const position = await prisma.position.findFirst({ where: { tenantId, code: "STF" } });

    if (!branch || !department || !position) {
        console.error("❌ Pastikan seed utama sudah dijalankan. Branch, IT Department, atau Staff Position tidak ditemukan.");
        process.exit(1);
    }

    const employeesData = [
        {
            email: `budi@${domain}.peoplehub.id`,
            fullName: "Budi Santoso",
            phone: "081234567001",
            gender: Gender.MALE,
            employeeNumber: "KRT20240001",
        },
        {
            email: `siti@${domain}.peoplehub.id`,
            fullName: "Siti Aminah",
            phone: "081234567002",
            gender: Gender.FEMALE,
            employeeNumber: "KRT20240002",
        }
    ];

    for (const data of employeesData) {
        const user = await prisma.user.upsert({
            where: {
                tenantId_email: {
                    tenantId,
                    email: data.email
                }
            },
            update: {},
            create: {
                tenantId,
                email: data.email,
                phone: data.phone,
                passwordHash,
                fullName: data.fullName,
                role: UserRole.EMPLOYEE,
                status: UserStatus.ACTIVE,
                gender: data.gender,
                birthPlace: "Jakarta",
                birthDate: new Date("1995-01-01"),
            },
        });

        await prisma.employee.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                tenantId,
                userId: user.id,
                employeeNumber: data.employeeNumber,
                employeeCode: data.employeeNumber,
                branchId: branch.id,
                departmentId: department.id,
                positionId: position.id,
                fullName: data.fullName,
                employmentType: EmploymentType.PERMANENT,
                workMode: WorkMode.WFO,
                startDate: new Date("2024-01-01"),
                status: "ACTIVE",
                phone: data.phone,
                bankName: "Bank BCA",
                bankAccountNumber: "0000" + data.employeeNumber,
                bankAccountHolder: data.fullName,
            },
        });

        console.log(`   ✓ Karyawan: ${data.fullName} (${data.email})`);
    }

    console.log("\n✅ Berhasil menambahkan 2 karyawan.");
}

main()
    .catch((e) => {
        console.error("❌ Gagal menambahkan karyawan:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
