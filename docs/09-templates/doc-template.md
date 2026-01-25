# Template Dokumen PeopleHub

> **Versi:** 1.0 | **Tanggal:** 23 Januari 2026 | **Status:** Final

## Tujuan

Koleksi template standar untuk membuat dokumen baru di proyek PeopleHub. Gunakan template yang sesuai untuk menjaga konsistensi format dokumentasi.

---

## 1. Template Dokumen Teknis

### Penggunaan
- Spesifikasi fitur
- Architecture decision
- Technical design

```markdown
# [Judul Dokumen]

> **Versi:** 1.0 | **Tanggal Update:** [DD Month YYYY] | **Status:** Draft/Final

## Tujuan

[Jelaskan tujuan dan konteks dokumen ini dalam 2-3 kalimat]

---

## Background

[Jelaskan latar belakang masalah atau kebutuhan yang mendorong pembuatan dokumen ini]

## Scope

### In Scope
- [Item yang termasuk dalam scope]

### Out of Scope
- [Item yang TIDAK termasuk dalam scope]

---

## [Section Utama 1]

[Konten section]

## [Section Utama 2]

[Konten section]

---

## Risiko & Mitigasi

| Risiko | Dampak | Kemungkinan | Mitigasi |
|--------|--------|-------------|----------|
| [Risiko 1] | High/Medium/Low | High/Medium/Low | [Langkah mitigasi] |

---

## Dokumen Terkait

- [dokumen1.md](path/to/dokumen1.md) - [Deskripsi singkat]
- [dokumen2.md](path/to/dokumen2.md) - [Deskripsi singkat]

---

## Revision History

| Versi | Tanggal | Author | Perubahan |
|-------|---------|--------|-----------|
| 1.0 | [DD-MM-YYYY] | [Nama] | Initial version |
```

---

## 2. Template API Endpoint

### Penggunaan
- Menambahkan endpoint baru ke API specification

```markdown
### [METHOD] /path/to/endpoint

[Deskripsi singkat apa yang dilakukan endpoint ini]

**Authorization:** Required/Not Required  
**Roles:** employee, manager, hrd

**Request Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |
| X-Tenant-ID | Yes | Tenant UUID |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | uuid | Resource ID |

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 20 | Items per page |

**Request Body:**
```json
{
  "field_name": "value",
  "required_field": "required value"
}
```

**Validation Rules:**
- `field_name`: required, min 3 chars
- `required_field`: required, valid email

**Response (200/201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "field": "value"
  },
  "message": "Success message"
}
```

**Error Responses:**
| Code | Error Code | Description |
|------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Invalid token |
| 404 | NOT_FOUND | Resource not found |
```

---

## 3. Template User Story

### Penggunaan
- Mendefinisikan requirement dalam format Agile

```markdown
## [ID] [Epic Name]

### User Story

**Sebagai** [role],  
**Saya ingin** [aksi/kemampuan],  
**Sehingga** [benefit/nilai].

### Acceptance Criteria

```gherkin
Scenario: [Nama skenario]
  Given [kondisi awal]
  When [aksi yang dilakukan]
  Then [hasil yang diharapkan]
  And [hasil tambahan]
```

### Priority
- [ ] Must Have (MVP)
- [ ] Should Have
- [ ] Could Have
- [ ] Won't Have

### Dependencies
- [Dependency 1]
- [Dependency 2]

### Notes
- [Catatan tambahan]
```

---

## 4. Template Sprint Retrospective

### Penggunaan
- Dokumentasi retrospective setiap akhir sprint

```markdown
# Sprint [X] Retrospective

**Period:** [Tanggal Mulai] - [Tanggal Selesai]  
**Team:** PeopleHub Development Team  
**Date:** [Tanggal Retrospective]

---

## Sprint Summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Story Points Committed | X | X | ✅/⚠️/❌ |
| Story Points Completed | X | X | ✅/⚠️/❌ |
| Bugs Found | - | X | - |
| Bugs Fixed | X | X | ✅/⚠️/❌ |

---

## What Went Well ✅

1. [Item positif 1]
2. [Item positif 2]
3. [Item positif 3]

---

## What Could Be Improved ⚠️

1. [Area improvement 1]
2. [Area improvement 2]
3. [Area improvement 3]

---

## Action Items

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Action 1] | [Nama] | [Tanggal] | ⏳ In Progress |
| [Action 2] | [Nama] | [Tanggal] | ⬜ Not Started |

---

## Learnings

- [Learning 1]
- [Learning 2]

---

## Kudos & Shoutouts 🎉

- [Nama] - [Alasan apresiasi]
```

---

## 5. Template Issue/Bug Report

### Penggunaan
- Melaporkan bug atau issue

```markdown
## [CATEGORY] [Short Description]

**ID:** ISSUE-XXX  
**Severity:** Critical/High/Medium/Low  
**Status:** Open/In Progress/Resolved/Closed  
**Reporter:** [Nama]  
**Date:** [Tanggal]

---

### Description

[Deskripsi lengkap issue/bug]

### Environment

- **Browser:** Chrome 120
- **OS:** macOS Sonoma
- **User Role:** employee/manager/hrd
- **Tenant:** [Nama tenant jika relevan]

### Steps to Reproduce

1. [Langkah 1]
2. [Langkah 2]
3. [Langkah 3]

### Expected Behavior

[Apa yang seharusnya terjadi]

### Actual Behavior

[Apa yang sebenarnya terjadi]

### Screenshots/Evidence

[Attach screenshot atau video jika ada]

### Root Cause (filled by developer)

[Analisis root cause setelah investigasi]

### Resolution

- **Fixed in:** [Branch/Commit]
- **Verified by:** [Nama]
- **Verified date:** [Tanggal]
```

---

## 6. Template Component Documentation

### Penggunaan
- Mendokumentasikan React component

```markdown
# [ComponentName]

[Deskripsi singkat komponen dan kapan digunakan]

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| variant | `'primary' \| 'secondary'` | `'primary'` | No | Button style variant |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | No | Button size |
| onClick | `() => void` | - | Yes | Click handler |
| disabled | `boolean` | `false` | No | Disable button |

## Usage

```tsx
import { Button } from '@/components/ui/Button';

// Basic usage
<Button onClick={handleClick}>Click me</Button>

// With variants
<Button variant="secondary" size="lg">
  Large Secondary
</Button>

// Disabled state
<Button disabled onClick={handleClick}>
  Disabled
</Button>
```

## Variants

| Variant | Usage |
|---------|-------|
| `primary` | Main actions (Submit, Approve) |
| `secondary` | Secondary actions (Cancel, Back) |
| `danger` | Destructive actions (Delete, Reject) |

## Accessibility

- Supports keyboard navigation (Enter/Space)
- Has visible focus state
- aria-disabled applied when disabled

## Related Components

- [ButtonGroup](./ButtonGroup.md)
- [IconButton](./IconButton.md)
```

---

## 7. Template Meeting Notes

### Penggunaan
- Dokumentasi hasil meeting

```markdown
# [Meeting Title]

**Date:** [DD Month YYYY]  
**Time:** [HH:MM] - [HH:MM]  
**Attendees:** [Daftar peserta]  
**Facilitator:** [Nama]  
**Note Taker:** [Nama]

---

## Agenda

1. [Topic 1]
2. [Topic 2]
3. [Topic 3]

---

## Discussion Points

### 1. [Topic 1]

**Summary:**  
[Ringkasan diskusi]

**Decisions:**
- [Keputusan 1]
- [Keputusan 2]

---

### 2. [Topic 2]

**Summary:**  
[Ringkasan diskusi]

**Open Questions:**
- [ ] [Pertanyaan yang belum terjawab]

---

## Action Items

| Action | Owner | Due Date |
|--------|-------|----------|
| [Action item] | [Nama] | [DD/MM] |

---

## Next Meeting

**Date:** [DD Month YYYY]  
**Agenda:** [Preview agenda]
```

---

## Dokumen Terkait

- [standard-guide.md](standard-guide.md) - Standar penamaan dan format
- [compliance-checklist.md](compliance-checklist.md) - Checklist kepatuhan
