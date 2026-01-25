# UI Design System PeopleHub

## 1. Overview

Dokumen ini mendefinisikan sistem desain UI untuk PeopleHub, memastikan konsistensi visual dan pengalaman pengguna yang kohesif di seluruh aplikasi.

**Prinsip Utama:**
- **Konsistensi** - Tampilan dan perilaku yang sama di semua halaman
- **Profesional** - Estetika enterprise yang bersih dan modern
- **Aksesibel** - Dapat digunakan oleh semua pengguna
- **Responsif** - Optimal di desktop dan mobile

---

## 2. Design Tokens

### 2.1 Color System

#### Primary Palette
| Token | Light Mode | Dark Mode | Penggunaan |
|-------|------------|-----------|------------|
| `--color-primary` | `#2563EB` | `#3B82F6` | CTA, link, elemen interaktif utama |
| `--color-primary-hover` | `#1D4ED8` | `#2563EB` | Hover state primary |
| `--color-primary-light` | `#DBEAFE` | `#1E3A5F` | Background highlight |

#### Neutral Palette
| Token | Light Mode | Dark Mode | Penggunaan |
|-------|------------|-----------|------------|
| `--color-text` | `#0F172A` | `#F1F5F9` | Teks utama |
| `--color-text-secondary` | `#475569` | `#94A3B8` | Teks sekunder, label |
| `--color-text-muted` | `#64748B` | `#64748B` | Teks disabled, placeholder |
| `--color-border` | `#E2E8F0` | `#334155` | Border, divider |
| `--color-bg` | `#F8FAFC` | `#0F172A` | Background utama |
| `--color-surface` | `#FFFFFF` | `#1E293B` | Card, modal, dropdown |

#### Semantic Colors
| Token | Light Mode | Dark Mode | Penggunaan |
|-------|------------|-----------|------------|
| `--color-success` | `#16A34A` | `#22C55E` | Approved, sukses |
| `--color-success-bg` | `#DCFCE7` | `#14532D` | Background success |
| `--color-warning` | `#F59E0B` | `#FBBF24` | Warning, in-review |
| `--color-warning-bg` | `#FEF3C7` | `#713F12` | Background warning |
| `--color-error` | `#DC2626` | `#EF4444` | Error, rejected |
| `--color-error-bg` | `#FEE2E2` | `#7F1D1D` | Background error |
| `--color-info` | `#0EA5E9` | `#38BDF8` | Info, pending |
| `--color-info-bg` | `#E0F2FE` | `#0C4A6E` | Background info |

### 2.2 Typography

#### Font Family
```css
--font-family: "Manrope", "Inter", system-ui, -apple-system, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;
```

#### Font Scale
| Token | Size | Weight | Line Height | Penggunaan |
|-------|------|--------|-------------|------------|
| `--text-h1` | 24px | 600 | 1.3 | Page title |
| `--text-h2` | 20px | 600 | 1.4 | Section title |
| `--text-h3` | 16px | 600 | 1.4 | Card title, subsection |
| `--text-body` | 14px | 400 | 1.5 | Body text |
| `--text-body-medium` | 14px | 500 | 1.5 | Labels, emphasis |
| `--text-small` | 12px | 400 | 1.5 | Meta, caption, badge |
| `--text-tiny` | 10px | 500 | 1.4 | Micro labels |

### 2.3 Spacing

Menggunakan grid 4px dengan skala:

| Token | Value | Penggunaan |
|-------|-------|------------|
| `--space-0` | 0 | - |
| `--space-1` | 4px | Padding dalam badge, gap minimal |
| `--space-2` | 8px | Padding button kecil, gap komponen |
| `--space-3` | 12px | Padding card internal |
| `--space-4` | 16px | Padding card, margin section |
| `--space-5` | 20px | Padding container |
| `--space-6` | 24px | Gap section |
| `--space-8` | 32px | Margin besar |
| `--space-10` | 40px | Padding page |
| `--space-12` | 48px | Gap section besar |

### 2.4 Border Radius

| Token | Value | Penggunaan |
|-------|-------|------------|
| `--radius-sm` | 4px | Badge, tag |
| `--radius-md` | 8px | Button, input, card |
| `--radius-lg` | 12px | Modal, dropdown |
| `--radius-xl` | 16px | Large card |
| `--radius-full` | 9999px | Avatar, pill |

### 2.5 Shadow

| Token | Value | Penggunaan |
|-------|-------|------------|
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 12px rgba(15,23,42,0.08)` | Card, dropdown |
| `--shadow-lg` | `0 8px 24px rgba(15,23,42,0.12)` | Modal, popover |
| `--shadow-xl` | `0 16px 48px rgba(15,23,42,0.16)` | Dialog |

### 2.6 Z-Index

| Token | Value | Penggunaan |
|-------|-------|------------|
| `--z-dropdown` | 100 | Dropdown menu |
| `--z-sticky` | 200 | Sticky header |
| `--z-fixed` | 300 | Fixed elements |
| `--z-modal-backdrop` | 400 | Modal backdrop |
| `--z-modal` | 500 | Modal content |
| `--z-popover` | 600 | Popover, tooltip |
| `--z-toast` | 700 | Toast notification |

### 2.7 Animation

| Token | Value | Penggunaan |
|-------|-------|------------|
| `--transition-fast` | `100ms ease` | Hover feedback |
| `--transition-normal` | `180ms ease` | Button, link |
| `--transition-slow` | `300ms ease` | Modal, drawer |
| `--transition-spring` | `400ms cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy effect |

---

## 3. Component Library

### 3.1 Button

#### Variants
| Variant | Penggunaan | Contoh |
|---------|------------|--------|
| `primary` | Aksi utama | Submit, Approve, Simpan |
| `secondary` | Aksi sekunder | Batal, Tutup |
| `outline` | Aksi alternatif | Filter, Export |
| `ghost` | Aksi minimal | Icon button, link |
| `danger` | Aksi destruktif | Hapus, Reject |

#### Sizes
| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 32px | 12px 16px | 12px |
| `md` | 40px | 12px 20px | 14px |
| `lg` | 48px | 16px 24px | 16px |

#### States
- **Default**: Background sesuai variant
- **Hover**: Darken 10%
- **Active**: Darken 15%
- **Focus**: Ring 2px dengan offset
- **Disabled**: Opacity 50%, cursor not-allowed
- **Loading**: Spinner + text "Memproses..."

### 3.2 Input Field

#### Types
- Text, Email, Password, Number, Tel
- Textarea
- Select (single/multi)
- Date picker
- File upload

#### Anatomy
```
┌─────────────────────────────────────┐
│ Label *                             │  ← Label (optional required indicator)
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Placeholder text          ▼ │ │  ← Input with optional icon
│ └─────────────────────────────────┘ │
│ Helper text atau error message      │  ← Helper/Error text
└─────────────────────────────────────┘
```

#### States
| State | Border | Background | Text |
|-------|--------|------------|------|
| Default | `--color-border` | `--color-surface` | `--color-text` |
| Focus | `--color-primary` | `--color-surface` | `--color-text` |
| Error | `--color-error` | `--color-error-bg` | `--color-error` |
| Disabled | `--color-border` | `--color-bg` | `--color-text-muted` |

### 3.3 Badge / Status

#### Status Colors
| Status | Background | Text | Penggunaan |
|--------|------------|------|------------|
| `pending` | `--color-info-bg` | `--color-info` | Menunggu |
| `in_review` | `--color-warning-bg` | `--color-warning` | Dalam Proses |
| `approved` | `--color-success-bg` | `--color-success` | Disetujui |
| `rejected` | `--color-error-bg` | `--color-error` | Ditolak |
| `draft` | `--color-bg` | `--color-text-muted` | Draft |
| `cancelled` | `--color-bg` | `--color-text-muted` | Dibatalkan |

### 3.4 Card

#### Variants
| Variant | Penggunaan |
|---------|------------|
| `default` | Container standar |
| `elevated` | Dengan shadow untuk emphasis |
| `bordered` | Border only, flat |
| `interactive` | Hover effect, clickable |

#### Anatomy
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ Header (Title + Action)         │ │
│ ├─────────────────────────────────┤ │
│ │                                 │ │
│ │ Content                         │ │
│ │                                 │ │
│ ├─────────────────────────────────┤ │
│ │ Footer (optional)               │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 3.5 Table

#### Features
- Sortable columns (click header)
- Filterable (search + dropdown filters)
- Pagination (10/25/50 per page)
- Row selection (checkbox)
- Row actions (dropdown menu)
- Empty state
- Loading skeleton

#### Column Types
| Type | Alignment | Contoh |
|------|-----------|--------|
| Text | Left | Nama, Deskripsi |
| Number | Right | Jumlah, Saldo |
| Date | Left | Tanggal Pengajuan |
| Status | Center | Badge status |
| Action | Right | Button/Icon actions |

### 3.6 Modal / Dialog

#### Sizes
| Size | Width | Penggunaan |
|------|-------|------------|
| `sm` | 400px | Konfirmasi, alert |
| `md` | 560px | Form sederhana |
| `lg` | 720px | Form kompleks |
| `xl` | 960px | Data table, preview |
| `full` | 100% - 48px | Full content |

#### Anatomy
```
┌─────────────────────────────────────┐
│ Title                          [X] │  ← Header
├─────────────────────────────────────┤
│                                     │
│ Content                             │  ← Body (scrollable)
│                                     │
├─────────────────────────────────────┤
│              [Batal] [Simpan]       │  ← Footer (actions)
└─────────────────────────────────────┘
```

### 3.7 Toast / Notification

#### Types
| Type | Icon | Color | Duration |
|------|------|-------|----------|
| `success` | ✓ Check | Green | 4s |
| `error` | ✕ X | Red | 6s (persistent for critical) |
| `warning` | ⚠ Warning | Yellow | 5s |
| `info` | ℹ Info | Blue | 4s |

#### Position
- Default: Top-right
- Mobile: Bottom-center

### 3.8 Avatar

#### Sizes
| Size | Dimension | Penggunaan |
|------|-----------|------------|
| `xs` | 24px | Inline mention |
| `sm` | 32px | List item |
| `md` | 40px | Card, header |
| `lg` | 56px | Profile |
| `xl` | 80px | Profile page |

#### Fallback
1. User photo (if available)
2. Initials with generated background color
3. Default placeholder icon

### 3.9 Navigation

#### Sidebar
- Width: 256px (expanded), 64px (collapsed)
- Mobile: Drawer dari kiri
- Menu grouping dengan divider
- Active state: background highlight + left border
- Icon + label (label hidden when collapsed)

#### Topbar
- Height: 64px
- Contents: Logo, tenant switcher (if multi), search, notifications, user menu
- Sticky on scroll

#### Breadcrumb
- Separator: `/` atau `>`
- Max items: 4 (collapse middle if more)
- Last item: non-clickable, bold

---

## 4. Layout System

### 4.1 Grid

```css
/* Container */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-5);
}

/* Grid */
.grid {
  display: grid;
  gap: var(--space-4);
}

/* Responsive columns */
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
```

### 4.2 Breakpoints

| Breakpoint | Min Width | Target |
|------------|-----------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Wide screen |

### 4.3 Page Layout

```
┌─────────────────────────────────────────────────────┐
│                      Topbar                         │
├──────────┬──────────────────────────────────────────┤
│          │  Breadcrumb                              │
│          ├──────────────────────────────────────────┤
│          │  Page Title                    [Actions] │
│ Sidebar  ├──────────────────────────────────────────┤
│          │                                          │
│          │  Main Content                            │
│          │                                          │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│                      Footer (optional)              │
└─────────────────────────────────────────────────────┘
```

---

## 5. Patterns

### 5.1 Form Patterns

#### Single Column (Mobile)
```
┌─────────────────────────────┐
│ Label                       │
│ [Input Field            ]   │
│                             │
│ Label                       │
│ [Input Field            ]   │
│                             │
│ [      Submit Button      ] │
└─────────────────────────────┘
```

#### Two Column (Desktop)
```
┌─────────────────────────────────────────────────┐
│ Label                    │ Label                │
│ [Input Field         ]   │ [Input Field     ]   │
│                          │                      │
│ Label                    │ Label                │
│ [Input Field         ]   │ [Input Field     ]   │
│                          │                      │
│                          │ [Cancel] [Submit]    │
└─────────────────────────────────────────────────┘
```

#### Form Sections
Group related fields dengan heading:
```
┌─────────────────────────────────────────────────┐
│ Informasi Akun                                  │
├─────────────────────────────────────────────────┤
│ Email, Password fields...                       │
├─────────────────────────────────────────────────┤
│ Informasi Pribadi                               │
├─────────────────────────────────────────────────┤
│ Nama, NIK, Tanggal Lahir fields...              │
└─────────────────────────────────────────────────┘
```

### 5.2 List Patterns

#### Data List
```
┌─────────────────────────────────────────────────┐
│ [Search...     ] [Filter ▼] [Export] [+ Tambah] │
├─────────────────────────────────────────────────┤
│ □ │ Nama        │ Status  │ Tanggal │ Action   │
├───┼─────────────┼─────────┼─────────┼──────────┤
│ □ │ John Doe    │ ●Active │ 01 Jan  │ [...]    │
│ □ │ Jane Smith  │ ○Draft  │ 02 Jan  │ [...]    │
├─────────────────────────────────────────────────┤
│ Showing 1-10 of 100       │ [<] [1] [2] [3] [>] │
└─────────────────────────────────────────────────┘
```

### 5.3 Detail Patterns

#### Detail Page
```
┌─────────────────────────────────────────────────┐
│ ← Back          │ Detail Pengajuan Cuti         │
├─────────────────────────────────────────────────┤
│ Status: [● Pending Approval]                    │
├──────────────────────────┬──────────────────────┤
│ Informasi Pengajuan      │ Timeline             │
│                          │                      │
│ Jenis: Cuti Tahunan      │ ○ Diajukan - 01 Jan  │
│ Tanggal: 5-7 Jan 2024    │ ● Menunggu Atasan    │
│ Alasan: Liburan keluarga │ ○ Menunggu HRD       │
│ Sisa Saldo: 10 hari      │ ○ Selesai            │
│                          │                      │
├──────────────────────────┴──────────────────────┤
│                       [Tolak] [Setujui]         │
└─────────────────────────────────────────────────┘
```

### 5.4 Dashboard Patterns

#### Metric Cards Row
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Hadir   │ │ Terlambat│ │ Absen   │ │ Cuti    │
│   145   │ │    12   │ │    8    │ │   15    │
│ ↑ 5%    │ │ ↓ 2%    │ │ ↑ 1%    │ │ ↓ 3%   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### 5.5 Empty State

```
┌─────────────────────────────────────────────────┐
│                                                 │
│               [Illustration]                    │
│                                                 │
│           Belum ada pengajuan cuti              │
│                                                 │
│    Ajukan cuti pertama Anda dengan mudah        │
│                                                 │
│              [+ Ajukan Cuti]                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 5.6 Error State

```
┌─────────────────────────────────────────────────┐
│                                                 │
│               [Error Icon]                      │
│                                                 │
│           Gagal memuat data                     │
│                                                 │
│    Terjadi kesalahan saat mengambil data.       │
│    Silakan coba lagi.                           │
│                                                 │
│              [Coba Lagi]                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 6. Accessibility Guidelines

### 6.1 Color Contrast
- Text normal (14px): Minimum 4.5:1
- Text besar (18px+): Minimum 3:1
- Interactive elements: Minimum 3:1

### 6.2 Focus Management
- Semua elemen interaktif harus memiliki visible focus state
- Focus ring: 2px solid primary dengan 2px offset
- Tab order harus logis (top-to-bottom, left-to-right)

### 6.3 Screen Reader
- Gunakan semantic HTML (`<button>`, `<nav>`, `<main>`, dll)
- Tambahkan `aria-label` untuk icon buttons
- Gunakan `aria-live` untuk dynamic content
- Pastikan form fields memiliki associated labels

### 6.4 Keyboard Navigation
- Semua fungsi dapat diakses via keyboard
- Escape menutup modal/dropdown
- Enter/Space mengaktifkan button
- Arrow keys untuk navigasi menu/list

### 6.5 Touch Target
- Minimum touch target: 44x44px
- Spacing antara touch targets: minimum 8px

---

## 7. Iconography

### 7.1 Icon Set
Gunakan **Heroicons** (outline style) sebagai icon library utama.

### 7.2 Icon Sizes
| Size | Dimension | Penggunaan |
|------|-----------|------------|
| `xs` | 16px | Inline, badge |
| `sm` | 20px | Button, input |
| `md` | 24px | Navigation, card |
| `lg` | 32px | Empty state |
| `xl` | 48px | Feature highlight |

### 7.3 Icon Usage
- Selalu sertakan text label untuk aksi penting
- Icon-only button harus memiliki tooltip dan `aria-label`
- Gunakan satu style konsisten (outline atau solid, tidak campur)

---

## 8. Dark Mode

### 8.1 Implementation
```css
[data-theme="dark"] {
  --color-text: #F1F5F9;
  --color-text-secondary: #94A3B8;
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-border: #334155;
  /* ... other tokens */
}
```

### 8.2 Toggle Behavior
1. Default: Ikuti system preference (`prefers-color-scheme`)
2. User dapat override via toggle di user menu
3. Preference disimpan di localStorage

### 8.3 Asset Adaptation
- Logo: Sediakan versi light dan dark
- Ilustrasi: Pastikan kontras cukup di kedua mode
- Chart: Gunakan warna yang visible di dark background

---

## 9. Responsive Design

### 9.1 Mobile First
- Design untuk mobile terlebih dahulu
- Progressive enhancement untuk desktop

### 9.2 Breakpoint Strategy
| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Sidebar | Drawer | Drawer | Fixed |
| Grid | 1 col | 2 col | 3-4 col |
| Table | Card view | Horizontal scroll | Full table |
| Modal | Full screen | Centered | Centered |

### 9.3 Touch Considerations
- Larger tap targets pada mobile
- Swipe gestures untuk drawer/carousel
- Pull-to-refresh untuk list

---

## 10. Implementation Notes

### 10.1 CSS Framework
Menggunakan **Tailwind CSS** dengan custom config untuk design tokens.

### 10.2 Component Library
Rekomendasi: Build custom components atau gunakan **Radix UI** / **shadcn/ui** sebagai base.

### 10.3 File Structure
```
src/
├── styles/
│   ├── tokens.css          # Design tokens
│   ├── globals.css         # Global styles
│   └── components/         # Component styles
├── components/
│   ├── ui/                 # Base components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── ...
│   └── patterns/           # Composed patterns
│       ├── DataTable/
│       ├── FormSection/
│       └── ...
└── lib/
    └── utils.ts            # Style utilities
```

---

## 11. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial design system |

---

## 12. Resources

- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Heroicons](https://heroicons.com)
- [Radix UI](https://radix-ui.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
