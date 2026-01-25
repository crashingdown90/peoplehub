// @ai:cl - CSRF Shared Constants
export const CSRF_TOKEN_NAME = "csrf-token";
export const CSRF_HEADER_NAME = "x-csrf-token";

export const CSRF_CONFIG = {
    tokenName: CSRF_TOKEN_NAME,
    headerName: CSRF_HEADER_NAME,
} as const;
