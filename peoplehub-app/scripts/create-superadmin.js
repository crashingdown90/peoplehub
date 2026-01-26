const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Get first tenant (Kreatifindo)
    const tenant = await prisma.tenant.findFirst({
      where: { code: 'KRT' }
    });

    if (!tenant) {
      console.error('Tenant KRT not found');
      process.exit(1);
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { email: 'superadmin@peoplehub.com' }
    });

    if (existing) {
      console.log('Super Admin already exists:', existing.email);
      await prisma.$disconnect();
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('GunungAgung13$$', 12);

    // Create super admin user
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'superadmin@peoplehub.com',
        passwordHash,
        fullName: 'Super Administrator',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }
    });

    console.log('Super Admin created successfully!');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Status:', user.status);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error creating super admin:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createSuperAdmin();
