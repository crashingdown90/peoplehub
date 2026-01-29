// @ai:ag - Audit logging facade
// Re-export from db/audit-middleware for convenience
export { createManualAuditLog as logAudit, setAuditContext, getAuditContext } from './db/audit-middleware';
