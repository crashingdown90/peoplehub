
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("❌ DATABASE_URL belum diset.");
    process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🔄 Resetting shifts to Pagi and Sore...\n");

    const tenants = await prisma.tenant.findMany();
    
    for (const tenant of tenants) {
        console.log(`📦 Updating shifts for tenant: ${tenant.name}`);
        
        // Delete existing shifts for this tenant
        // Note: This might fail if shifts are referenced in schedules. 
        // In a real app we might just deactivate them, but for seed/demo we can try to clean up.
        try {
            // We use upsert for the new ones, and we can keep the old ones but only use these two.
            // Or we can delete if no dependencies.
            
            const pagiShift = await prisma.shift.upsert({
                where: { id: `${tenant.id}-shift-pagi` },
                update: {
                    name: "Pagi",
                    startTime: "07:00",
                    endTime: "15:00",
                    isActive: true
                },
                create: {
                    id: `${tenant.id}-shift-pagi`,
                    tenantId: tenant.id,
                    name: "Pagi",
                    startTime: "07:00",
                    endTime: "15:00",
                    isActive: true
                }
            });

            await prisma.shift.upsert({
                where: { id: `${tenant.id}-shift-sore` },
                update: {
                    name: "Sore",
                    startTime: "15:00",
                    endTime: "23:00",
                    isActive: true
                },
                create: {
                    id: `${tenant.id}-shift-sore`,
                    tenantId: tenant.id,
                    name: "Sore",
                    startTime: "15:00",
                    endTime: "23:00",
                    isActive: true
                }
            });

            // Assign Pagi shift as default for all employees
            await prisma.employee.updateMany({
                where: { tenantId: tenant.id },
                data: { defaultShiftId: pagiShift.id }
            });

            console.log(`   ✓ Shifts updated and assigned to all employees for ${tenant.code}`);
        } catch (err) {
            console.error(`   ❌ Failed to update shifts for ${tenant.code}:`, err);
        }
    }

    console.log("\n✅ Shift reset complete.");
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
