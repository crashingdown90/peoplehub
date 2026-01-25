// @ai:cl - Cache mock for testing

export const cacheMock = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    invalidateByTag: jest.fn().mockResolvedValue(undefined),
};

jest.mock("@/lib/cache", () => ({
    getCache: () => cacheMock,
    CacheKeys: {
        employee: (tenantId: string, employeeId: string) => `employee:${tenantId}:${employeeId}`,
        attendance: (tenantId: string, employeeId: string, date: string) => `attendance:${tenantId}:${employeeId}:${date}`,
    },
    CacheTags: {
        employee: (tenantId: string) => `employee:${tenantId}`,
        attendance: (tenantId: string) => `attendance:${tenantId}`,
    },
    CacheTTL: {
        SHORT: 60,
        MEDIUM: 300,
        LONG: 3600,
    },
}));

export const resetCacheMock = () => {
    cacheMock.get.mockReset().mockResolvedValue(null);
    cacheMock.set.mockReset().mockResolvedValue(undefined);
    cacheMock.delete.mockReset().mockResolvedValue(undefined);
    cacheMock.invalidateByTag.mockReset().mockResolvedValue(undefined);
};
