# Sprint 2 Retrospective - Employee & Organization

> **Sprint:** 2 | **Periode:** Minggu 6-7 | **Tanggal:** Februari 2026

---

## Sprint Summary

| Metric | Target | Actual |
|--------|--------|--------|
| Story Points | 40 | 38 |
| Tasks Completed | 16 | 16 (100%) |
| Bugs Found | < 3 | 1 |
| Velocity | - | 38 |

**Sprint Goal:** Implementasi data karyawan dan struktur organisasi
**Goal Achieved:** ✅ Yes

---

## What Went Well 👍

1. **CRUD operasi lancar dan konsisten**
   - Pattern yang ditetapkan di Sprint 1 berjalan baik
   - Reusable components mempercepat development

2. **Org structure tree view selesai lebih cepat**
   - Komponen tree yang dipilih (react-organizational-chart) sesuai kebutuhan
   - Integrasi dengan data real lancar

3. **Docker compose sudah diimplementasi**
   - Action item dari Sprint 1 berhasil diselesaikan
   - Environment consistency lebih baik

4. **Registration approval flow solid**
   - Multi-level approval berjalan sesuai desain
   - Email notification terintegrasi dengan baik

---

## What Could Be Improved 👎

1. **Data validation kompleksitas tinggi**
   - Validasi NIK dan employee unique constraints perlu handling lebih detail
   - Beberapa edge case tidak tercover di awal

2. **Frontend state management**
   - Form state untuk employee edit agak complex
   - Perlu refactor untuk maintainability

3. **Documentation tertinggal**
   - API docs untuk employee tidak segera diupdate
   - Perlu discipline lebih untuk documentation

---

## Action Items for Next Sprint

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Refactor employee form state management | Frontend | Sprint 3 Day 3 | ✅ Done |
| Add comprehensive validation unit tests | Backend | Sprint 3 | ✅ Done |
| Update API documentation real-time | All | Ongoing | ✅ Done |
| Implement bulk employee import prep | Backend | Sprint 3 | ⬜ Moved to Phase 3 |

---

## Team Feedback

### Developer A (Backend)
> "Approval flow pattern yang kita buat bisa direuse untuk cuti dan request lainnya. Bagus untuk consistency."

### Developer B (Frontend)
> "Org tree component bagus, tapi perlu optimization untuk company dengan banyak cabang."

### QA
> "Edge case validation perlu ditambah di test cases. Ada beberapa scenario yang miss."

---

## Kudos 🌟

- **Backend Team** - Approval flow yang reusable dan well-documented
- **Frontend Team** - UI employee management yang clean dan responsive
- **DevOps** - Docker compose setup yang mempercepat onboarding

---

## Retrospective Method

**Format:** Start-Stop-Continue

| Start | Stop | Continue |
|-------|------|----------|
| API docs per endpoint immediately | Skipping edge case testing | Docker compose usage |
| Validation unit tests | Manual environment setup | Code review turnaround |
| Component documentation | - | Approval flow pattern |

---

## Next Sprint Focus

Sprint 3 akan fokus pada:
1. Attendance system dengan selfie
2. Schedule management (normal, shift, flexible)
3. Late calculation otomatis
4. WFO/WFH mode support
