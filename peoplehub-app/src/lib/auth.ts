// @ai:cl - Legacy auth.ts - re-exports from new structure for backward compatibility
// New imports should use @/lib/auth/config or @/lib/auth/session

export {
  // Types
  type UserRole,
  type JWTPayload,
  // Config
  AUTH_CONFIG,
  // Functions
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  validatePassword,
} from "./auth/config";

export {
  getSession,
  setAuthCookie,
  clearAuthCookie,
  hasRole,
  isAdmin,
  isManagerOrAbove,
} from "./auth/session";
