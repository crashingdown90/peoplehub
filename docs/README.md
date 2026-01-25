# PeopleHub Documentation

> Dokumentasi teknis lengkap untuk PeopleHub HRIS System

---

## 🚀 Quick Links

| Dokumen | Deskripsi |
|---------|-----------|
| **[Getting Started](GETTING_STARTED.md)** | Setup cepat untuk developer baru |
| **[Troubleshooting](TROUBLESHOOTING.md)** | Panduan pemecahan masalah umum |

---

## Quick Navigation

| Kategori | Deskripsi | Link |
|----------|-----------|------|
| Overview | Konsep, visi, glossary | [01-overview/](01-overview/) |
| Requirements | Roles, user stories, specs | [02-requirements/](02-requirements/) |
| Architecture | HLD, LLD, ERD, tech stack | [03-architecture/](03-architecture/) |
| API | Specification, flows | [04-api/](04-api/) |
| Frontend | Guidelines, design system | [05-frontend/](05-frontend/) |
| Database | Guidelines, config | [06-database/](06-database/) |
| Operations | Deploy, security, backup | [07-operations/](07-operations/) |
| Testing | Strategy, test plan | [08-testing/](08-testing/) |
| Templates | Email, letters, doc templates | [09-templates/](09-templates/) |
| Gap Analysis | Gap analysis reports | [10-gap-analysis/](10-gap-analysis/) |
| Implementation | Roadmap, sprint progress, issues | [11-implementation/](11-implementation/) |
| **Standards** | Naming conventions, compliance | [standard-guide.md](standard-guide.md), [compliance-checklist.md](compliance-checklist.md) |

---

## Document Map

### 01. Overview
- [concept.md](01-overview/concept.md) - Visi, misi, fitur utama, competitive analysis
- [kak.md](01-overview/kak.md) - Kerangka Acuan Kerja
- [glossary.md](01-overview/glossary.md) - Daftar istilah dan definisi

### 02. Requirements
- [roles-permissions.md](02-requirements/roles-permissions.md) - Definisi role & permission matrix
- [roles-summary.md](02-requirements/roles-summary.md) - Ringkasan role
- [user-stories.md](02-requirements/user-stories.md) - Epic, user stories, Gherkin scenarios
- [approval-matrix.md](02-requirements/approval-matrix.md) - Matriks approval per jenis request
- [mandatory-pages.md](02-requirements/mandatory-pages.md) - Halaman wajib
- [pages-list.md](02-requirements/pages-list.md) - Daftar lengkap halaman
- [notifications.md](02-requirements/notifications.md) - Spesifikasi notifikasi
- [dashboard-specs.md](02-requirements/dashboard-specs.md) - Dashboard per role

### 03. Architecture
- [hld.md](03-architecture/hld.md) - High-Level Design
- [lld.md](03-architecture/lld.md) - Low-Level Design
- [tech-stack.md](03-architecture/tech-stack.md) - Technology stack
- [erd.md](03-architecture/erd.md) - Entity Relationship Diagram

### 04. API
- [specification.md](04-api/specification.md) - REST API specification
- [flow-registration.md](04-api/flow-registration.md) - Registration flow
- [flow-attendance.md](04-api/flow-attendance.md) - Attendance/selfie flow
- [flow-leave.md](04-api/flow-leave.md) - Leave/cuti flow (sequence diagram)

### 05. Frontend
- [guidelines.md](05-frontend/guidelines.md) - Frontend guidelines
- [design-system.md](05-frontend/design-system.md) - Design tokens, components
- [wireframes.md](05-frontend/wireframes.md) - Wireframes & mockups
- [user-guide.md](05-frontend/user-guide.md) - User guide

### 06. Database
- [guidelines.md](06-database/guidelines.md) - Database guidelines
- [env-config.md](06-database/env-config.md) - Environment configuration

### 07. Operations
- [deployment.md](07-operations/deployment.md) - Deployment guide
- [security.md](07-operations/security.md) - Security policy
- [backup-dr.md](07-operations/backup-dr.md) - Backup & disaster recovery
- [github-vps.md](07-operations/github-vps.md) - GitHub & VPS setup
- [runbook.md](07-operations/runbook.md) - Troubleshooting & operations runbook
- [migration-plan.md](07-operations/migration-plan.md) - Database migration strategy
- [versioning-notes.md](07-operations/versioning-notes.md) - Versioning strategy
- [rollback-procedures.md](07-operations/rollback-procedures.md) - Rollback procedures
- [migration-cicd-integration.md](07-operations/migration-cicd-integration.md) - CI/CD integration for migrations

### 08. Testing
- [strategy.md](08-testing/strategy.md) - Testing strategy
- [test-plan.md](08-testing/test-plan.md) - Test plan

### 09. Templates
- [email.md](09-templates/email.md) - Email notification templates
- [letters.md](09-templates/letters.md) - Official letter templates
- [sop-hrd.md](09-templates/sop-hrd.md) - Standard Operating Procedure untuk HRD
- [doc-template.md](09-templates/doc-template.md) - Template dokumen teknis

### Standards
- [standard-guide.md](standard-guide.md) - Panduan standar penamaan & struktur
- [compliance-checklist.md](compliance-checklist.md) - Checklist kepatuhan standar

### 10. Gap Analysis
- [gap-analysis.md](10-gap-analysis/gap-analysis.md) - Gap analysis report
- [phase-1-spec.md](10-gap-analysis/phase-1-spec.md) - Phase 1 specification

### 11. Implementation
- [implementation-roadmap.md](11-implementation/implementation-roadmap.md) - Sprint breakdown & task list
- [feature-breakdown.md](11-implementation/feature-breakdown.md) - Feature details & acceptance criteria
- [sprint-progress.md](11-implementation/sprint-progress.md) - Sprint progress tracker
- [issues-log.md](11-implementation/issues-log.md) - Bug & issue tracking
- [retrospectives/](11-implementation/retrospectives/) - Sprint retrospectives

---

## Reading Guide by Role

### Product Manager
1. `01-overview/concept.md` - Understand vision
2. `02-requirements/user-stories.md` - Review requirements
3. `02-requirements/roles-permissions.md` - Understand permissions

### Developer
1. `01-overview/glossary.md` - Learn terminology
2. `03-architecture/` - Understand architecture
3. `04-api/specification.md` - API reference
4. `05-frontend/guidelines.md` - Frontend standards
5. `06-database/guidelines.md` - Database standards

### QA Engineer
1. `02-requirements/user-stories.md` - User stories & Gherkin
2. `08-testing/strategy.md` - Testing approach
3. `04-api/specification.md` - API to test

### DevOps/SRE
1. `07-operations/deployment.md` - Deploy procedures
2. `07-operations/security.md` - Security requirements
3. `06-database/env-config.md` - Configuration

### UI/UX Designer
1. `05-frontend/design-system.md` - Design system
2. `05-frontend/wireframes.md` - Wireframes
3. `02-requirements/dashboard-specs.md` - Dashboard specs

---

## AI-Assisted Development

Untuk pengembangan dengan AI (Gemini/Antigravity, Claude), lihat:
- [../.agent/rules/](../.agent/rules/) - AI agent rules dan persona
- [../.agent/workflows/](../.agent/workflows/) - Workflow definitions

---

## Version

**Current Version:** 2.1.0
**Last Updated:** 2026-01-22
**Maintained By:** PeopleHub Team
