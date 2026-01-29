# Sprint 3 Retrospective - Attendance System

> **Sprint:** 3 | **Periode:** Minggu 8-9 | **Tanggal:** Maret 2026

---

## Sprint Summary

| Metric | Target | Actual |
|--------|--------|--------|
| Story Points | 45 | 45 |
| Tasks Completed | 14 | 14 (100%) |
| Bugs Found | < 5 | 4 |
| Velocity | - | 45 |

**Sprint Goal:** Implementasi sistem absensi dengan selfie dan schedule management
**Goal Achieved:** ✅ Yes

---

## What Went Well 👍

1. **Selfie capture berjalan lancar**
   - WebRTC implementation berhasil di semua browser modern
   - Image compression efektif (max 500KB per foto)

2. **Late calculation accurate**
   - Logic sesuai dengan requirement HR
   - Tolerance time configurable per schedule

3. **Velocity meningkat signifikan**
   - Dari 38 (Sprint 2) ke 45 story points
   - Team sudah familiar dengan codebase

4. **Mobile-first approach berhasil**
   - Clock in/out UI responsive dan user-friendly
   - Touch targets sesuai standard (min 44px)

5. **Performance target tercapai**
   - Absensi mobile < 1.5 detik (target met)
   - Upload selfie dengan retry mechanism

---

## What Could Be Improved 👎

1. **Bug count lebih tinggi dari sprint sebelumnya**
   - 4 bugs ditemukan (vs 1 di Sprint 2)
   - Mayoritas terkait timezone handling

2. **Safari WebRTC issues**
   - Perlu polyfill tambahan untuk Safari
   - Testing cross-browser perlu lebih awal

3. **GPS handling edge cases**
   - User dengan GPS disabled tidak ditangani dengan baik di awal
   - Fallback mechanism perlu improvement

4. **Schedule shift complexity**
   - Multiple shift dalam sehari lebih kompleks dari perkiraan
   - Perlu refactor untuk maintainability

---

## Action Items for Next Sprint

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add WebRTC polyfill untuk Safari | Frontend | Sprint 4 Day 1 | ✅ Done |
| Improve GPS fallback mechanism | Backend | Sprint 4 | ✅ Done |
| Add timezone unit tests | Backend | Sprint 4 | ✅ Done |
| Cross-browser testing checklist | QA | Ongoing | ✅ Done |
| Refactor shift schedule logic | Backend | Sprint 5 | ⬜ Pending |

---

## Team Feedback

### Developer A (Backend)
> "Attendance module paling challenging sejauh ini. Tapi pattern yang kita buat solid untuk extension ke overtime dan correction."

### Developer B (Frontend)
> "Camera capture component bisa direuse untuk face verification nanti. Good investment."

### QA
> "Bug count naik tapi semua resolved dalam sprint. Testing matrix perlu diperluas untuk edge cases."

### DevOps
> "Storage untuk selfie perlu monitoring. Current setup sudah support S3-compatible, tapi perlu alert untuk disk space."

---

## Kudos 🌟

- **Backend Team** - Attendance logic yang comprehensive dan extensible
- **Frontend Team** - Camera capture UX yang excellent
- **QA** - Menemukan timezone bugs sebelum production
- **HR Consultant** - Klarifikasi rules late calculation yang membantu

---

## Bugs Found & Resolution

| Bug ID | Description | Severity | Resolution Time |
|--------|-------------|----------|-----------------|
| ISS-008 | Timezone offset salah untuk WIB | P2 | 4 jam |
| ISS-009 | Selfie upload gagal di Safari | P1 | 8 jam |
| ISS-010 | Late calculation off by 1 minute | P2 | 2 jam |
| ISS-011 | GPS accuracy tidak dicek | P2 | 3 jam |

---

## Retrospective Method

**Format:** 4Ls (Liked, Learned, Lacked, Longed For)

| Liked | Learned | Lacked | Longed For |
|-------|---------|--------|------------|
| Mobile-first approach | WebRTC cross-browser issues | Early cross-browser testing | Automated visual regression |
| Image compression | Timezone complexity | GPS fallback planning | Better device testing lab |
| Performance focus | Shift schedule edge cases | Safari testing device | CI/CD for mobile testing |

---

## Performance Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Clock In API response | < 1.5s | 1.2s | ✅ |
| Selfie upload time | < 3s | 2.1s | ✅ |
| Attendance list load | < 2s | 1.8s | ✅ |
| GPS accuracy check | 100m | Implemented | ✅ |

---

## Next Sprint Focus

Sprint 4 akan fokus pada:
1. Leave management dengan saldo dan validasi
2. Multi-level approval workflow
3. Dashboard HRD dengan statistik real-time
4. Dashboard Employee dengan ringkasan pribadi
5. Export CSV untuk payroll
