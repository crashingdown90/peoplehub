// @ai:cl - API documentation helpers for generating OpenAPI specs

// ==========================================
// TYPES
// ==========================================

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  auth: boolean;
  roles?: string[];
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: Record<string, ApiResponse>;
}

export interface ApiParameter {
  name: string;
  in: "path" | "query" | "header";
  required: boolean;
  type: string;
  description: string;
  example?: unknown;
}

export interface ApiRequestBody {
  required: boolean;
  contentType: string;
  schema: Record<string, unknown>;
  example?: unknown;
}

export interface ApiResponse {
  description: string;
  contentType?: string;
  schema?: Record<string, unknown>;
  example?: unknown;
}

// ==========================================
// COMMON RESPONSE SCHEMAS
// ==========================================

export const CommonSchemas = {
  Error: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: {
        type: "object",
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string", example: "Invalid input data" },
        },
      },
    },
  },

  Success: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
    },
  },

  Pagination: {
    type: "object",
    properties: {
      page: { type: "number", example: 1 },
      limit: { type: "number", example: 10 },
      total: { type: "number", example: 100 },
      totalPages: { type: "number", example: 10 },
    },
  },

  PaginatedResponse: (itemSchema: Record<string, unknown>) => ({
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: { type: "array", items: itemSchema },
      pagination: { $ref: "#/components/schemas/Pagination" },
    },
  }),
} as const;

// ==========================================
// COMMON RESPONSES
// ==========================================

export const CommonResponses = {
  "200": {
    description: "Successful operation",
    contentType: "application/json",
  },
  "201": {
    description: "Resource created successfully",
    contentType: "application/json",
  },
  "400": {
    description: "Bad request - validation error",
    contentType: "application/json",
    schema: CommonSchemas.Error,
    example: {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input data" },
    },
  },
  "401": {
    description: "Unauthorized - authentication required",
    contentType: "application/json",
    schema: CommonSchemas.Error,
    example: {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    },
  },
  "403": {
    description: "Forbidden - insufficient permissions",
    contentType: "application/json",
    schema: CommonSchemas.Error,
    example: {
      success: false,
      error: { code: "FORBIDDEN", message: "You do not have access" },
    },
  },
  "404": {
    description: "Resource not found",
    contentType: "application/json",
    schema: CommonSchemas.Error,
    example: {
      success: false,
      error: { code: "NOT_FOUND", message: "Resource not found" },
    },
  },
  "429": {
    description: "Rate limit exceeded",
    contentType: "application/json",
    schema: CommonSchemas.Error,
    example: {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Try again later.",
        retryAfter: 60,
      },
    },
  },
  "500": {
    description: "Internal server error",
    contentType: "application/json",
    schema: CommonSchemas.Error,
    example: {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Server error" },
    },
  },
} as const;

// ==========================================
// API DOCUMENTATION REGISTRY
// ==========================================

class ApiDocRegistry {
  private endpoints: ApiEndpoint[] = [];
  private tags: Map<string, { name: string; description: string }> = new Map();

  /**
   * Register a tag (category) for grouping endpoints
   */
  registerTag(name: string, description: string): void {
    this.tags.set(name, { name, description });
  }

  /**
   * Register an API endpoint
   */
  registerEndpoint(endpoint: ApiEndpoint): void {
    this.endpoints.push(endpoint);
    // Auto-register tags
    endpoint.tags.forEach((tag) => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, { name: tag, description: `${tag} operations` });
      }
    });
  }

  /**
   * Get all registered endpoints
   */
  getEndpoints(): ApiEndpoint[] {
    return [...this.endpoints];
  }

  /**
   * Get all registered tags
   */
  getTags(): { name: string; description: string }[] {
    return Array.from(this.tags.values());
  }

  /**
   * Generate OpenAPI 3.0 specification
   */
  generateOpenApiSpec(info: {
    title: string;
    version: string;
    description?: string;
  }): Record<string, unknown> {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const endpoint of this.endpoints) {
      const pathKey = endpoint.path.replace(/:(\w+)/g, "{$1}");

      if (!paths[pathKey]) {
        paths[pathKey] = {};
      }

      const operation: Record<string, unknown> = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        responses: {},
      };

      // Add security if auth required
      if (endpoint.auth) {
        operation.security = [{ bearerAuth: [] }];
        if (endpoint.roles && endpoint.roles.length > 0) {
          operation["x-roles"] = endpoint.roles;
        }
      }

      // Add parameters
      if (endpoint.parameters && endpoint.parameters.length > 0) {
        operation.parameters = endpoint.parameters.map((p) => ({
          name: p.name,
          in: p.in,
          required: p.required,
          description: p.description,
          schema: { type: p.type },
          example: p.example,
        }));
      }

      // Add request body
      if (endpoint.requestBody) {
        operation.requestBody = {
          required: endpoint.requestBody.required,
          content: {
            [endpoint.requestBody.contentType]: {
              schema: endpoint.requestBody.schema,
              example: endpoint.requestBody.example,
            },
          },
        };
      }

      // Add responses
      for (const [code, response] of Object.entries(endpoint.responses)) {
        const responseObj: Record<string, unknown> = {
          description: response.description,
        };
        if (response.contentType && response.schema) {
          responseObj.content = {
            [response.contentType]: {
              schema: response.schema,
              example: response.example,
            },
          };
        }
        (operation.responses as Record<string, unknown>)[code] = responseObj;
      }

      paths[pathKey][endpoint.method.toLowerCase()] = operation;
    }

    return {
      openapi: "3.0.3",
      info: {
        title: info.title,
        version: info.version,
        description: info.description,
      },
      servers: [
        { url: "/api", description: "API Server" },
      ],
      tags: this.getTags(),
      paths,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas: {
          Error: CommonSchemas.Error,
          Pagination: CommonSchemas.Pagination,
        },
      },
    };
  }

  /**
   * Clear all registered endpoints (for testing)
   */
  clear(): void {
    this.endpoints = [];
    this.tags.clear();
  }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

let registryInstance: ApiDocRegistry | null = null;

export function getApiDocRegistry(): ApiDocRegistry {
  if (!registryInstance) {
    registryInstance = new ApiDocRegistry();
    initializeDefaultTags();
  }
  return registryInstance;
}

function initializeDefaultTags(): void {
  const registry = registryInstance!;

  registry.registerTag("Auth", "Authentication endpoints");
  registry.registerTag("Employees", "Employee management");
  registry.registerTag("Attendance", "Attendance tracking");
  registry.registerTag("Leave", "Leave management");
  registry.registerTag("Payroll", "Payroll and salary");
  registry.registerTag("Notifications", "User notifications");
  registry.registerTag("Reports", "Report generation");
  registry.registerTag("Admin", "Admin operations");
}

// ==========================================
// DECORATOR HELPER (for future use)
// ==========================================

/**
 * Helper to document an endpoint
 * Usage: documentEndpoint({ method: 'GET', path: '/employees', ... })
 */
export function documentEndpoint(endpoint: ApiEndpoint): void {
  getApiDocRegistry().registerEndpoint(endpoint);
}

// ==========================================
// PRE-DEFINED ENDPOINT DOCS
// ==========================================

// Document common endpoints
export function registerCoreEndpoints(): void {
  const registry = getApiDocRegistry();

  // Auth endpoints
  registry.registerEndpoint({
    method: "POST",
    path: "/auth/login",
    summary: "User login",
    description: "Authenticate user and get access token",
    tags: ["Auth"],
    auth: false,
    requestBody: {
      required: true,
      contentType: "application/json",
      schema: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
      },
      example: { email: "user@example.com", password: "password123" },
    },
    responses: {
      "200": {
        description: "Login successful",
        contentType: "application/json",
        example: {
          success: true,
          data: { token: "jwt-token-here", user: { id: "...", email: "..." } },
        },
      },
      "401": CommonResponses["401"],
    },
  });

  // Employee endpoints
  registry.registerEndpoint({
    method: "GET",
    path: "/employees",
    summary: "List employees",
    description: "Get paginated list of employees",
    tags: ["Employees"],
    auth: true,
    roles: ["HRD", "MANAGER", "SUPER_ADMIN"],
    parameters: [
      { name: "page", in: "query", required: false, type: "integer", description: "Page number", example: 1 },
      { name: "limit", in: "query", required: false, type: "integer", description: "Items per page", example: 10 },
      { name: "status", in: "query", required: false, type: "string", description: "Filter by status" },
      { name: "departmentId", in: "query", required: false, type: "string", description: "Filter by department" },
    ],
    responses: {
      "200": {
        description: "List of employees",
        contentType: "application/json",
      },
      "401": CommonResponses["401"],
      "403": CommonResponses["403"],
    },
  });

  registry.registerEndpoint({
    method: "GET",
    path: "/employees/:id",
    summary: "Get employee by ID",
    description: "Get single employee details",
    tags: ["Employees"],
    auth: true,
    parameters: [
      { name: "id", in: "path", required: true, type: "string", description: "Employee ID" },
    ],
    responses: {
      "200": { description: "Employee details", contentType: "application/json" },
      "404": CommonResponses["404"],
    },
  });

  // Attendance endpoints
  registry.registerEndpoint({
    method: "POST",
    path: "/attendance/clock-in",
    summary: "Clock in",
    description: "Record employee clock in",
    tags: ["Attendance"],
    auth: true,
    requestBody: {
      required: true,
      contentType: "application/json",
      schema: {
        type: "object",
        properties: {
          latitude: { type: "number" },
          longitude: { type: "number" },
          photoUrl: { type: "string" },
        },
      },
    },
    responses: {
      "200": { description: "Clock in recorded", contentType: "application/json" },
      "400": CommonResponses["400"],
    },
  });

  // Leave endpoints
  registry.registerEndpoint({
    method: "POST",
    path: "/leave/requests",
    summary: "Create leave request",
    description: "Submit a new leave request",
    tags: ["Leave"],
    auth: true,
    requestBody: {
      required: true,
      contentType: "application/json",
      schema: {
        type: "object",
        required: ["leaveTypeId", "startDate", "endDate", "reason"],
        properties: {
          leaveTypeId: { type: "string" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          reason: { type: "string" },
        },
      },
    },
    responses: {
      "201": { description: "Leave request created", contentType: "application/json" },
      "400": CommonResponses["400"],
    },
  });

  // Reports endpoints
  registry.registerEndpoint({
    method: "GET",
    path: "/reports/attendance",
    summary: "Attendance report",
    description: "Generate attendance report",
    tags: ["Reports"],
    auth: true,
    roles: ["HRD", "FINANCE", "SUPER_ADMIN"],
    parameters: [
      { name: "startDate", in: "query", required: false, type: "string", description: "Start date (YYYY-MM-DD)" },
      { name: "endDate", in: "query", required: false, type: "string", description: "End date (YYYY-MM-DD)" },
      { name: "format", in: "query", required: false, type: "string", description: "Output format (json/csv)" },
    ],
    responses: {
      "200": { description: "Attendance report data", contentType: "application/json" },
      "403": CommonResponses["403"],
    },
  });
}
