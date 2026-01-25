# Claude AI Session Prompt

## Context
- **Project:** PeopleHub HR Management System
- **Tech Stack:** Next.js 15 (App Router), TypeScript, Prisma, PostgreSQL
- **Branch:** feat/cl-[feature-name]

## Domain Ownership (CL)
```
src/lib/auth/       - Authentication utilities
src/lib/tenant/     - Multi-tenant utilities
src/lib/security/   - Security utilities
src/lib/db/         - Database utilities
src/services/       - Business logic layer
src/app/api/        - API routes
prisma/             - Database schema
src/middleware.ts   - Request middleware
```

## Reference Documents
- 19-skema-database-erd.md - Database structure
- 20-api-specification.md - API endpoints
- 23-security-policy.md - Security requirements
- 31-ai-implementation-guide.md - AI coordination

## Constraints
- Stay within CL domain
- Use types from src/types/ (AG domain)
- Don't modify components (CX domain)
- Follow naming conventions from guide
- Add @ai:cl comment tag to new files

## Session Template

```markdown
# Claude AI Session - [DATE]

## Today's Tasks
1. [Task 1]
2. [Task 2]

## Files to Lock
- [file path]

## Implementation
[Your request here]
```

## Code Style
- Use TypeScript strict mode
- Follow ESLint rules
- Use Prisma for database operations
- Implement proper error handling
- Add tenant isolation to all queries
