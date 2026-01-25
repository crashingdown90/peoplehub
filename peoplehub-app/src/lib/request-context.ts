// @ai:cl - Legacy request-context.ts - re-exports from new structure for backward compatibility
// New imports should use @/lib/tenant

export {
  type RequestContext,
  getRequestContext,
  requireAuth,
  requireRole,
  hasRole,
  canAccessTenant,
  canAccessEmployee,
} from "./tenant/context";

export {
  withTenant,
  withTenantData,
  tenantFilter,
  employeeFilter,
  scopeFilter,
} from "./tenant/utils";
