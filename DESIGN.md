# PocketPills — Design Reference

Mirrored from production [`pocketpills.com`](https://www.pocketpills.com/)
design-system CSS. The **landing page (`src/pages/Landing.tsx`)** is the
canonical screen reference; tokens below are the source of truth for every
other page.

---

## 1. Font

**Satoshi only** — self-hosted in `/public/fonts/satoshi/`.

| Role | Weight | Notes |
|---|---|---|
| Body | 400 | `letter-spacing: 0.02em`, line-height 1.5 |
| Headings (h1–h6) | **500** | line-height 1.2, tracking 0 — never extrabold |
| Caps / eyebrows | **700** | `.pp-caps` — 12px, `0.04em`, uppercase |
| Buttons | 500 | |

Do not load Inter or Hanken Grotesque.

---

## 2. Colour

Production primitives live in `src/index.css` as `--primary-*`, `--neutral-*`,
`--secondary-*`, plus status scales. Semantic roles (`--color-*`, `--surface-*`,
`--text-*`, `--border-*`) map onto them.

| Token | Value | Use |
|---|---|---|
| `--primary-950` | `#4E2A84` | Headings, brand ink |
| `--primary-900` | `#220F3E` | Announcement / darkest |
| `--primary-800` | `#37325D` | Body on tinted surfaces |
| `--primary-600` | `#7B47FF` | Eyebrows, links (`.pp-caps`) |
| `--primary-500` | `#8C60FF` | Stars, focus ring |
| `--primary-300` | `#E5E3FF` | Pressed tint, lavender panels |
| `--primary-200` | `#F5F4FA` | Hover tint, subtle fills |
| `--neutral-900` | `#180730` | Body text |
| `--neutral-800` | `#362952` | **Primary CTA** fill |
| `--neutral-600` | `#67648B` | CTA hover / tertiary text |
| `--neutral-200` | `#E7E7F2` | Borders, disabled CTA bg |
| `--secondary-800` | `#0A5A68` | Wellness / success |

Theme-color meta: `#4A44A0` (production).

Legacy `--pp-*` aliases remain for landing/components; prefer semantic roles
for new work.

---

## 3. Type scale

| Class | Size | Use |
|---|---|---|
| `text-2xs` | 11px | Meta, legal |
| `text-xs` / `.pp-caps` | 12px | Eyebrows |
| `text-sm` | 14px | Captions, body-xs |
| `text-base` | 16px | Body (default) |
| `text-md` | 18px | Card titles, button label |
| `text-lg` | 20px | h6 / section titles |
| `text-xl` | 23px | h5 |
| `text-2xl` | 26px | h4 |
| `text-3xl` | ~29px | h3 / page titles |
| `text-4xl` | ~41px | h2 |
| `text-5xl` | ~46px | h1 / hero |

Nothing below **11px**.

---

## 4. Space & grid

Production space scale: `xxs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 ·
3xl 40 · 4xl 48 · 5xl 96`.

App container (unchanged):

| Token | Value |
|---|---|
| Max width | `max-w-[105rem]` — 1680px |
| Gutters | `px-5` → `md:px-8` → `xl:px-20` |

Section rhythm: `sm` `py-8` · `md` `py-12 md:py-14` · `lg` `py-14 md:py-20`.

---

## 5. Radius

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `radius-s` | 8px | `rounded-lg` | Chips |
| `radius-m` | 16px | `rounded-xl` | Inputs, icon tiles |
| `radius-l` | 24px | `rounded-2xl` | Cards, panels |
| `radius-x` | 36px | `rounded-3xl` | Large feature blocks |
| `radius-full` | pill | `rounded-full` | **All buttons** |

---

## 6. Interaction states

Duration **200ms**, ease-in-out. Colour only on light surfaces — no lift,
shadow, or scale on nav/cards.

| Surface | Hover | Pressed / Active | Disabled |
|---|---|---|---|
| Light (cards, rows, nav, chips) | `--state-hover` (`primary-200`) | `--state-pressed` (`primary-300`) | opacity / muted text |
| Primary CTA | `neutral-600` | `neutral-800` | `neutral-200` / `gray-500` |
| Secondary / light btn | `neutral-300` | invert to `neutral-600`+white | same as primary |
| Ghost | `neutral-300` | invert | same |

**Focus:** `outline: 3px solid var(--primary-500); outline-offset: 2px`
(production). Never remove without an equivalent.

**Active (current page):** weight + colour only —
`font-medium` + `--primary-950` vs `font-normal` + tertiary. No filled pill.

Put states on shared constants (`Button`, `Card interactive`, `BASE` in
`AppShell`) so new elements inherit them.

---

## 7. Components

**Button** (`src/components/ui/Button.tsx`) mirrors `.ds-btn-*`:
primary CTA is **neutral-800**, not purple. Variants: `primary` · `secondary` ·
`ghost` · `outline` · `wellness`.

**PageHeader / SectionHead:** `.pp-caps` eyebrow → Satoshi medium title →
optional 16px sub.

**Width.** One signed-in layout in `AppShell`:
`[ 15rem left ][ gap-8 ][ flex-1 content ]`. Pages never set their own
container; keep long prose left-aligned (`max-w-2xl` / `max-w-3xl`).

---

## 8. Motion

| Purpose | Duration |
|---|---|
| Hover / interaction | 200ms |
| Reveal, chrome slide | 300–380ms |
| Progress, marquee | 500ms+ |

Routed pages enter with `animate-fade-up`. `prefers-reduced-motion` disables
marquee, chrome hide/show, skeleton sheen, and hero autoplay.

---

## 9. Accessibility

Contrast targets (light theme):

| Token | On white |
|---|---|
| `--text-primary` `#180730` | AAA |
| `--text-secondary` `#534B74` | AA |
| `--text-tertiary` `#67648B` | AA |
| `--primary-600` `#7B47FF` | AA on white |
| `--primary-950` `#4E2A84` | AAA |

Skip link → `<main id="main">`; every `<nav>` has `aria-label`; icon-only
controls have `aria-label`.
