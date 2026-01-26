// @ai:cx - Seed Super Admin user
// Run: npx ts-node prisma/seed-superadmin.ts

import { PrismaClient } from "@prisma/client";
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

async function main() {
    console.log("🌱 Creating Super Admin user...\n");

    const passwordHash = await bcrypt.hash("SuperAdmin123!", 12);

    // Get first tenant (Kreatifindo) for the super admin
    const tenant = await prisma.tenant.findFirst({
        where: { domain: "kreatifindo" },
    });

    if (!tenant) {
        console.error("❌ Tenant Kreatifindo tidak ditemukan. Jalankan seed utama terlebih dahulu.");
        process.exit(1);
    }

    // Get default branch and department
    const branch = await prisma.branch.findFirst({
        where: { tenantId: tenant.id },
    });

    const department = await prisma.department.findFirst({
        where: { tenantId: tenant.id, code: "IT" },
    });

    const position = await prisma.position.findFirst({
        where: { tenantId: tenant.id, code: "DIR" },
    });

    // Create Super Admin user
    const superAdminEmail = "superadmin@peoplehub.id";

    const existingUser = await prisma.user.findFirst({
        where: { email: superAdminEmail },
    });

    if (existingUser) {
        // Update existing user
        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                passwordHash,
                role: "SUPER_ADMIN",
                status: "ACTIVE",
            },
        });
        console.log(`✓ Super Admin user updated: ${superAdminEmail}`);
        console.log(`  Password: SuperAdmin123!`);
    } else {
        // Create new super admin user
        const superAdmin = await prisma.user.create({
            data: {
                tenantId: tenant.id,
                email: superAdminEmail,
                phone: "081234567890",
                passwordHash,
                fullName: "Super Administrator",
                role: "SUPER_ADMIN",
                status: "ACTIVE",
                gender: "MALE",
                birthPlace: "Jakarta",
                birthDate: new Date("1985-01-01"),
            },
        });

        // Create Employee record
        const year = new Date().getFullYear();
        const employeeNumber = `SA${year}00001`;

        await prisma.employee.create({
            data: {
                tenantId: tenant.id,
                userId: superAdmin.id,
                employeeNumber,
                employeeCode: employeeNumber,
                branchId: branch?.id,
                departmentId: department?.id,
                positionId: position?.id,
                fullName: superAdmin.fullName,
                employmentType: "PERMANENT",
                workMode: "WFO",
                startDate: new Date("2024-01-01"),
                status: "ACTIVE",
                phone: superAdmin.phone || "081234567890",
            },
        });

        console.log(`✓ Super Admin user created: ${superAdminEmail}`);
    }

    console.log("");
    console.log("═══════════════════════════════════════");
    console.log("✅ Super Admin berhasil dibuat!");
    console.log("═══════════════════════════════════════");
    console.log("");
    console.log("🔐 Login Super Admin:");
    console.log(`   Email: ${superAdminEmail}`);
    console.log("   Password: SuperAdmin123!");
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
