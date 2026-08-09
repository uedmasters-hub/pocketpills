# PocketPills — Design Reference

The **landing page (`src/pages/Landing.tsx`)** is the canonical reference. Every other
page follows the rules below. When something conflicts, the landing wins.

---

## 1. Grid

One container, everywhere. Defined once in `src/components/layout/Grid.tsx`.

| Token | Value |
|---|---|
| Max width | `max-w-[105rem]` — **1680px** |
| Gutters | `px-5` → `md:px-8` → `xl:px-20` (20 / 32 / 80px) |
| Narrow measure | `max-w-3xl` — forms, flows, documents, reading |

```tsx
import { Container, Section, PageHeader } from "@/components/layout/Grid";

<Section space="md">…</Section>        // full-width content
<Section narrow>…</Section>            // forms / flows
```

Do **not** hand-roll `mx-auto max-w-…`. The landing, `AppShell`, footer and header all
resolve to the same left/right edges — that alignment is the point.

---

## 2. Vertical rhythm

Sections use one scale. No ad-hoc `py-10` / `py-14` / `pt-9`.

| Name | Class |
|---|---|
| `sm` | `py-8` |
| `md` (default) | `py-12 md:py-14` |
| `lg` | `py-14 md:py-20` |

---

## 3. Colour

Semantic tokens live in `src/index.css`. Two layers, both now pointing at the same
palette, so a single change re-skins the whole app.

**Reference (`--pp-*`)** — sampled from production:

| Token | Value | Use |
|---|---|---|
| `--pp-primary-950` | `#4E2A84` | headings, dark surfaces, primary buttons |
| `--pp-primary-900` | `#5C3496` | alternate dark card |
| `--pp-primary-800` | `#5B3A9E` | body copy on tinted surfaces |
| `--pp-primary-400` | `#AAA4FF` | review stars |
| `--pp-primary-300` | `#D3CCEF` | light card |
| `--pp-primary-200` | `#EAE6F8` | tinted panels, footer block |
| `--pp-primary-100` | `#F5F4FA` | subtle fills, hover |
| `--pp-violet` | `#6B4FD6` | eyebrows, links, accents |
| `--pp-star` | `#8C60FF` | rating stars, decorative marks |
| `--pp-navy` | `#2B1E5E` | announcement bar |
| `--pp-lavender` | `#E9E4F7` | hero backdrop |
| `--pp-green` | `#0F4C3F` | NABP band |

**App layer** (`--color-primary`, `--surface-*`, `--text-*`, `--border-*`) is mapped onto
the same palette, so existing `text-ink` / `bg-surface-2` / `border-line` classes across
the 17 in-app pages render in the reference style without per-file edits.

---

## 4. Radius

| Class | Value | Use |
|---|---|---|
| `rounded-lg` | 10px | chips, small controls |
| `rounded-xl` | 14px | inputs, icon tiles |
| `rounded-2xl` | 20px | cards, panels (`ds-radius-l`) |
| `rounded-3xl` / `rounded-[28px]` | 28px | large feature blocks (`ds-radius-xl`) |
| `rounded-full` | pill | **all buttons** |

---

## 5. Type

- **Display** — Hanken Grotesque. Headings use `font-display` + `font-extrabold` +
  `tracking-tight`, sized fluidly with `clamp()`.
- **Body** — Inter, 13–15px in-app.
- **Eyebrow** — 11px, `font-semibold`, `uppercase`, `tracking-[0.14em]`, in `--pp-violet`.

---

## 6. Motion

- Hover lift on cards: `hover:-translate-y-0.5`
- Marquees: `.pp-marquee`, paused under `prefers-reduced-motion`
- Carousels: `.pp-scroll` + `.pp-snap`
- All transitions 150–300ms

---

## 7. Imagery

Real assets come from `static.pocketpills.com`. Every `<img>` carries
`loading="lazy"` and an `onError` handler that hides the element, so a dead URL
degrades rather than leaving a broken frame. To self-host, replace the `IMG` /
`CDN` maps at the top of `Landing.tsx` and `SiteFooter.tsx`.


---

## 8. Consistency rules

These are enforced across every page — a new screen that breaks one will look
out of place immediately.

**Width.** There is exactly **one** signed-in layout, in `AppShell`:

```
[ 15rem left column ][ gap-8 ][ content: flex-1 ]
```

The left column is always reserved. In a focused flow the nav is withheld but
the space is kept, so the content column sits at the same x-position on every
route — no shifting between Find Care, a treatment page and a checkout step.

Pages never set their own container. `AppShell` supplies the measure:
content fills the space beside the sidebar, identical on every route. Cap long prose *inside* the page (`max-w-2xl` / `max-w-3xl` / `62ch`) and keep
those caps **left-aligned** — never `mx-auto`, which would re-centre the content
and break the shared left edge. Auth is the one exception: it renders outside
`AppShell` entirely.

**Hover.** One treatment everywhere: `hover:bg-[color:var(--pp-primary-100)]`
over 150ms — no lift, no shadow, no scale, no border swap. Elements already on
`primary-100` step up to `primary-200`. Buttons keep their own
`opacity` / `primary-hover` states.

**Motion.**

| Purpose | Duration |
|---|---|
| Hover / interaction | 150ms |
| Reveal, chrome slide | 300–380ms |
| Progress, marquee | 500ms+ |

Every routed page enters with `animate-fade-up`, keyed on the pathname.

**Radius.** Use the scale, never literals: `lg` 10 · `xl` 14 · `2xl` 20 ·
`3xl` 28 · `full` for all buttons.

**Page header.** Eyebrow (11px, uppercase, `--pp-violet`) → title
(`font-display`, extrabold, `clamp`) → optional sub (15px, `max-w-xl`).


---

## 9. Type scale

Every size is a named step with its line-height baked in — never an arbitrary
`text-[13px]`. Nothing renders below **11px**.

| Class | Size | Line-height | Use |
|---|---|---|---|
| `text-2xs` | 11px | 1.45 | eyebrows, meta, legal |
| `text-xs` | 12px | 1.5 | captions |
| `text-sm` | 13px | 1.55 | secondary copy |
| `text-base` | 15px | 1.6 | body |
| `text-md` | 17px | 1.5 | card titles |
| `text-lg` | 19px | 1.4 | section titles |
| `text-xl` | 22px | 1.35 | large titles |
| `text-2xl` | 20→26px | 1.25 | fluid |
| `text-3xl` | 24→32px | 1.15 | page titles |
| `text-4xl` | 28→38px | 1.1 | fluid |
| `text-5xl` | 30→46px | 1.05 | hero |

Fluid steps use `clamp()` so headings scale with the viewport without breakpoints.

---

## 10. Accessibility

**Contrast (WCAG AA).** All text tokens are verified against their surfaces:

| Token | On white | Verdict |
|---|---|---|
| `--text-primary` #2A2148 | 13.9:1 | AAA |
| `--text-secondary` #55507A | 6.9:1 | AA |
| `--text-tertiary` #6E6992 | 5.1:1 | AA |
| `--pp-violet` #6B4FD6 | 5.7:1 | AA |
| `--pp-primary-950` #4E2A84 | 10.6:1 | AAA |

`--text-tertiary` was #8B87A8 (3.2:1 — failing) and is now #6E6992. Avoid pairing
it with `--pp-primary-200`, the one combination still under 4.5:1.

**Focus.** Every interactive element gets a two-layer ring
(surface + `--color-primary`) at ~9.7:1 — well past the 3:1 WCAG 2.2 requires for
non-text indicators. Never remove it without an equivalent replacement.

**Structure.** A skip link precedes the header; `<main id="main" tabIndex={-1}>`
receives focus; every `<nav>` carries an `aria-label`; icon-only controls carry
`aria-label`; decorative art is `aria-hidden` or `alt=""`.

**Motion.** `prefers-reduced-motion` disables the marquee, chrome hide/show,
skeleton sheen and hero autoplay.

