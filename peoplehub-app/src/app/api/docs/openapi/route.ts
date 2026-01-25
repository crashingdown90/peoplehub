// @ai:cl - OpenAPI specification endpoint
import { NextResponse } from "next/server";
import { getApiDocRegistry, registerCoreEndpoints } from "@/lib/api-docs";

// Initialize endpoints on first request
let initialized = false;

// GET /api/docs/openapi - Get OpenAPI specification
export async function GET() {
  if (!initialized) {
    registerCoreEndpoints();
    initialized = true;
  }

  const registry = getApiDocRegistry();
  const spec = registry.generateOpenApiSpec({
    title: "PeopleHub HRIS API",
    version: "1.0.0",
    description: "Human Resource Information System API for multi-tenant organizations",
  });

  return NextResponse.json(spec, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
