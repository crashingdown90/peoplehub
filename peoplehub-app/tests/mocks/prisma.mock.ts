// @ai:cl - Prisma mock for testing
import { PrismaClient } from "@prisma/client";

// Create a mock Prisma client
export const prismaMock = {
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  notificationPreference: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  attendance: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  leaveRequest: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  leaveType: {
    findMany: jest.fn(),
  },
  leaveBalance: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  payslip: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  employee: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  travelRequest: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  reimburseRequest: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  webhook: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  webhookLog: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
} as unknown as PrismaClient;

// Reset all mocks
export function resetPrismaMocks() {
  Object.values(prismaMock).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === "function" && "mockReset" in method) {
          (method as jest.Mock).mockReset();
        }
      });
    }
  });
}

// Mock the prisma import
jest.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));
