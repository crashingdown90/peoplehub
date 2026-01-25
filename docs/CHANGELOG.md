# Changelog - PeopleHub

> Semua perubahan penting pada proyek ini didokumentasikan di file ini.
> Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Approval Matrix document (`02-requirements/approval-matrix.md`)
- Flow Leave document with sequence diagrams (`04-api/flow-leave.md`)
- SOP HRD document (`09-templates/sop-hrd.md`)
- Operations Runbook (`07-operations/runbook.md`)
- Sprint progress tracker document (`11-implementation/sprint-progress.md`)
- Issues & bug log document (`11-implementation/issues-log.md`)
- Sprint retrospective templates (`11-implementation/retrospectives/`)
- Sprint 2 retrospective document (`11-implementation/retrospectives/sprint-02.md`)
- Sprint 3 retrospective document (`11-implementation/retrospectives/sprint-03.md`)
- Prerequisites section di Implementation Roadmap (server specs, ENV, backup)
- Rollback Strategy section di Implementation Roadmap (procedures, checklist)

### Changed
- Updated docs README with new implementation tracking documents
- Updated docs README version to 2.1.0
- Updated `implementation-roadmap.md` status to Active (v1.1)
- Updated `feature-breakdown.md` status to Active (v1.1)
- Updated `sprint-progress.md` version to 1.1 with reduced blockers
- Synced dashboard widget checkboxes in feature-breakdown.md
- Updated retrospectives README with correct completion status

### Fixed
- Resolved BLK-002 (Prisma types outdated)
- Updated BLK-001 status (PostgreSQL connection pool)

---

## [1.0.0-alpha] - 2026-01-22

### 🎉 Phase 1 MVP - Alpha Release

**Status:** Ready for Testing (95% Complete)

### Added

#### Authentication & Authorization
- User registration dengan approval workflow
- Login/logout dengan JWT token
- Password reset flow
- Multi-tenant isolation (Row-Level Security)
- RBAC (Role-Based Access Control)
- Rate limiting untuk auth routes

#### Employee Management
- Employee CRUD dengan validasi
- Branch/Department/Position management
- Organization structure tree view
- Registration approval by HRD

#### Attendance System
- Clock in/out dengan selfie capture
- WFO/WFH mode toggle
- GPS location capture (optional)
- Late calculation berdasarkan schedule
- Schedule management (Normal, Shift, Flexible)
- Attendance monitoring dashboard

#### Leave Management
- Leave request dengan approval workflow
- Leave balance calculation
- Multi-level approval (Manager → HRD)
- Leave type configuration

#### Dashboard
- HRD Dashboard (stats, attendance, pending approvals)
- Employee Dashboard (quick actions, balance, status)
- Manager Dashboard (team stats, approvals)
- Finance Dashboard (payroll, expenses)
- IT/Ops Dashboard (system status, logs)

#### Email Notifications
- Registration pending/approved/rejected
- Leave request notifications
- Attendance late alerts
- Payslip published

#### Infrastructure
- Database schema (29 Prisma models)
- Seed data untuk demo
- Middleware authentication
- API route protection

### Known Issues
- PostgreSQL connection needs to be started manually
- Prisma types need regeneration after schema changes

---

## [0.3.0] - 2026-01-19

### Sprint 3: Attendance System Complete

### Added
- Clock in/out dengan selfie upload
- Camera integration untuk mobile/desktop
- GPS location capture
- Schedule CRUD (normal, shift, flexible)
- Late calculation engine
- Attendance history & recap
- WFO/WFH mode selection

### Fixed
- Safari WebRTC compatibility for camera
- Timezone handling untuk late calculation

---

## [0.2.0] - 2026-01-12

### Sprint 2: Employee & Organization Complete

### Added
- Employee CRUD dengan validasi
- Branch management
- Department management  
- Position management
- Registration approval workflow
- Org structure tree view
- Employee profile page

### Changed
- Improved form validation patterns
- Better error handling di API

---

## [0.1.0] - 2026-01-05

### Sprint 1: Foundation & Auth Complete

### Added
- Project structure (Next.js App Router)
- Prisma setup dengan PostgreSQL
- User/Company/Role/Permission schema
- Register API dengan approval workflow
- Login API dengan JWT
- Password reset flow
- Tenant configuration CRUD
- Auth/Tenant/RBAC middleware
- Seed data untuk 2 tenants

### Added (Frontend)
- Design system (Tailwind tokens)
- UI Components (Button, Input, Card, Badge, Table, Modal)
- Login & Register pages
- Layout (Sidebar, Header, MainContent)
- TanStack Query setup

---

## Version History Summary

| Version | Date | Sprint | Status |
|---------|------|--------|--------|
| 1.0.0-alpha | 2026-01-22 | Sprint 4 | 🟡 Testing |
| 0.3.0 | 2026-01-19 | Sprint 3 | ✅ Complete |
| 0.2.0 | 2026-01-12 | Sprint 2 | ✅ Complete |
| 0.1.0 | 2026-01-05 | Sprint 1 | ✅ Complete |

---

## Release Types

- **Major (X.0.0)** - Breaking changes, new major features
- **Minor (0.X.0)** - New features, backward compatible
- **Patch (0.0.X)** - Bug fixes, minor improvements

## Version Naming

- **alpha** - Internal testing, not feature complete
- **beta** - Feature complete, external testing
- **rc** - Release candidate, final testing
- **(no suffix)** - Production ready
