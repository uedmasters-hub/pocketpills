/** Built-in PocketPills design-system seed (HIG-style IA + current tokens). */

export type SeedPage = {
  section: string;
  slug: string;
  title: string;
  sortOrder: number;
  lede: string;
  bodyMd: string;
};

/** Live CSS custom properties applied when a version is published. */
export const DEFAULT_TOKENS: Record<string, string> = {
  "--primary-950": "#4e2a84",
  "--primary-900": "#220f3e",
  "--primary-800": "#37325d",
  "--primary-700": "#6b1ce2",
  "--primary-600": "#7b47ff",
  "--primary-500": "#8c60ff",
  "--primary-400": "#aaa4ff",
  "--primary-300": "#e5e3ff",
  "--primary-200": "#f5f4fa",
  "--primary-100": "#ffffff",
  "--neutral-900": "#180730",
  "--neutral-800": "#362952",
  "--neutral-700": "#534b74",
  "--neutral-600": "#67648b",
  "--neutral-500": "#8e90b8",
  "--neutral-400": "#aaacca",
  "--neutral-300": "#c8c8dc",
  "--neutral-200": "#e7e7f2",
  "--neutral-100": "#f5f4fa",
  "--neutral-0": "#ffffff",
  "--radius-s": "0.5rem",
  "--radius-m": "1rem",
  "--radius-l": "1.5rem",
  "--space-md": "0.75rem",
  "--space-lg": "1rem",
  "--space-xl": "1.5rem",
};

export const SEED_NAV: { section: string; label: string; items: { slug: string; title: string }[] }[] = [
  {
    section: "getting-started",
    label: "Getting started",
    items: [
      { slug: "overview", title: "Overview" },
      { slug: "principles", title: "Principles" },
      { slug: "versions", title: "Versions & publishing" },
    ],
  },
  {
    section: "foundations",
    label: "Foundations",
    items: [
      { slug: "accessibility", title: "Accessibility" },
      { slug: "branding", title: "Branding" },
      { slug: "color", title: "Color" },
      { slug: "dark-mode", title: "Dark Mode" },
      { slug: "icons", title: "Icons" },
      { slug: "images", title: "Images" },
      { slug: "layout", title: "Layout" },
      { slug: "motion", title: "Motion" },
      { slug: "typography", title: "Typography" },
      { slug: "writing", title: "Writing" },
    ],
  },
  {
    section: "components",
    label: "Components",
    items: [
      { slug: "button", title: "Button" },
      { slug: "field", title: "Field" },
      { slug: "card", title: "Card" },
      { slug: "badge", title: "Badge" },
      { slug: "modal", title: "Modal" },
      { slug: "tooltip", title: "Tooltip" },
      { slug: "switch", title: "Switch" },
      { slug: "skeleton", title: "Skeleton" },
      { slug: "logo", title: "Logo" },
      { slug: "availability", title: "Availability & time chips" },
      { slug: "rating", title: "Rating" },
    ],
  },
  {
    section: "patterns",
    label: "Patterns",
    items: [
      { slug: "navigation", title: "Navigation" },
      { slug: "forms", title: "Forms" },
      { slug: "feedback", title: "Feedback" },
      { slug: "booking", title: "Booking" },
    ],
  },
];

function page(
  section: string,
  slug: string,
  title: string,
  sortOrder: number,
  lede: string,
  bodyMd: string,
): SeedPage {
  return { section, slug, title, sortOrder, lede, bodyMd };
}

export function buildSeedPages(): SeedPage[] {
  const pages: SeedPage[] = [];
  let order = 0;

  pages.push(
    page(
      "getting-started",
      "overview",
      "Overview",
      order++,
      "PocketPills design system — the shared language for product, brand, and engineering.",
      `## Start here

This documentation mirrors Apple’s Human Interface Guidelines structure: foundations first, then components and patterns. Content is **versioned** so you can iterate safely and publish when ready.

### What lives here

- **Foundations** — brand, color, type, layout, accessibility
- **Components** — reusable UI wired to the real site
- **Patterns** — multi-step flows (booking, forms, feedback)

### Wiring to the product

When a version is marked **Live**, its token set is applied site-wide after authentication (preview gate + sign-in for publish). Draft and older versions stay browsable without changing production.`,
    ),
    page(
      "getting-started",
      "principles",
      "Principles",
      order++,
      "Calm, clear, guided, human, consistent, accessible.",
      `## Design philosophy

Healthcare should feel simple, calm, trustworthy, personal, and intelligent.

| Principle | Meaning |
| --- | --- |
| **Calm** | Reduce stress; avoid noisy chrome |
| **Clear** | One primary job per screen |
| **Guided** | Recommend the next action |
| **Human** | Compassionate, approachable tone |
| **Consistent** | Predictable interactions |
| **Accessible** | A product requirement, not an add-on |`,
    ),
    page(
      "getting-started",
      "versions",
      "Versions & publishing",
      order++,
      "Draft → Version N → Live. Promote any published version instantly after auth.",
      `## Lifecycle

1. **Draft** — editable workspace (tokens + docs)
2. **Version N** — named snapshot (e.g. Version 1, Version 2)
3. **Live** — exactly one version drives the real site tokens

### Go live

Signed-in editors open **Versions**, pick a version, and choose **Make live**. The API swaps \`is_live\` in one transaction; clients refetch \`/api/design-system/live\` and apply CSS variables immediately.

### Auth

Publishing requires a valid site-access session (or \`DESIGN_SYSTEM_KEY\`). The Versions UI is behind patient login.`,
    ),
  );

  const foundationBodies: Record<string, [string, string]> = {
    accessibility: [
      "Design for everyone who needs care.",
      `## Requirements

- Contrast that meets WCAG AA for text and controls
- Focus rings on interactive elements
- Labels for icon-only buttons
- Don’t rely on color alone for state (pair with text/weight)

Time chips use **selected / active / disabled** — not color-only cues.`,
    ],
    branding: [
      "Purple-first identity with calm healthcare warmth.",
      `## Preserve

- Purple primary identity
- Friendly tone, spacious layouts
- Rounded components, clean interfaces

## Evolve

- Stronger product hierarchy
- Healthcare-specific components
- Continuous care patterns`,
    ],
    color: [
      "Production primitives and semantic aliases.",
      `## Primary

| Token | Value |
| --- | --- |
| \`--primary-950\` | #4E2A84 |
| \`--primary-600\` | #7B47FF |
| \`--primary-300\` | #E5E3FF |
| \`--primary-200\` | #F5F4FA |

## Neutrals

Use \`--neutral-*\` for ink and surfaces. Prefer semantic aliases (\`--text-primary\`, \`--pp-primary-950\`) in product UI.

Live versions can override these tokens; publishing updates the site immediately.`,
    ],
    "dark-mode": [
      "Optional dark theme tokens.",
      `## Status

Dark mode tokens exist under \`.dark\` in \`index.css\`. Prefer light lavender canvases for care flows unless a surface explicitly opts in.`,
    ],
    icons: [
      "Prefer stroke icons at 1.5–2px, 20×20 touch targets.",
      `## Guidance

- Keep icons simple; pair with text labels in nav
- Use brand purple for active states
- Avoid emoji in product chrome`,
    ],
    images: [
      "Real places, people, and care context — not abstract gradients as the main idea.",
      `## Guidance

- Full-bleed heroes on marketing surfaces
- Doctor photos use consistent crop and soft radius
- Always provide meaningful \`alt\` text`,
    ],
    layout: [
      "One composition per viewport; one job per section.",
      `## Grid

App shell + activity rail. Content uses generous padding (\`--space-*\`) and \`rounded-2xl\` cards (\`DetailSection\`).

## Rules

- Brand first on marketing pages
- Avoid card soup in heroes
- Prefer semantic spacing tokens over magic numbers`,
    ],
    motion: [
      "Presence and hierarchy — not noise.",
      `## Guidance

- Short transitions (150–250ms) on toggles and panels
- Prefer opacity/transform over layout thrash
- Respect reduced-motion preferences`,
    ],
    typography: [
      "Satoshi for UI; display for section titles.",
      `## Scale

Use Tailwind text utilities mapped to the type ramp. Section titles use \`font-display\`. Numbers in schedules use \`tnum\`.`,
    ],
    writing: [
      "Clear, warm, and specific.",
      `## Voice

- Prefer “you” and concrete next steps
- Avoid jargon and alarmist language
- Buttons: verb-led (“Book visit”, “Make live”)`,
    ],
  };

  for (const item of SEED_NAV.find((n) => n.section === "foundations")!.items) {
    const [lede, body] = foundationBodies[item.slug] || ["", `## ${item.title}\n\nComing soon.`];
    pages.push(page("foundations", item.slug, item.title, order++, lede, body));
  }

  const componentBodies: Record<string, [string, string]> = {
    button: [
      "Primary actions use brand CTA; secondary stays quiet.",
      `## Usage

Import from \`@/components/ui/Button\`. Prefer one primary button per section.`,
    ],
    field: [
      "Labeled inputs with calm borders.",
      `## Usage

\`Field\` from the UI kit. Always associate label + control.`,
    ],
    card: [
      "Use cards for interactive containers — not decorative wrappers.",
      `## Usage

\`Card\` and \`DetailSection\` for titled product panels.`,
    ],
    badge: [
      "Status and tone pills.",
      `## Usage

\`Badge\` tones: primary, wellness, accent, success, warning, danger, info, neutral.`,
    ],
    modal: [
      "Confirm high-impact actions.",
      `## Usage

\`ConfirmModal\` for month-sync and destructive confirms.`,
    ],
    tooltip: [
      "Short clarifying copy on hover/focus.",
      `## Usage

\`Tooltip\` for info icons (e.g. Select for month).`,
    ],
    switch: [
      "Accessible boolean toggles.",
      `## Usage

\`Switch\` with visible label and optional description.`,
    ],
    skeleton: [
      "Loading placeholders that match layout.",
      `## Usage

\`Skeleton\` / \`SkeletonText\` while data loads.`,
    ],
    logo: [
      "Mark + wordmark lockup.",
      `## Usage

\`Logo\`, \`LogoMark\`, \`LogoLink\` from \`@/components/Logo\`. Inherits \`currentColor\`.`,
    ],
    availability: [
      "Shared AvailabilityBoard for Hours and booking.",
      `## Time chip states

| State | Look | Meaning |
| --- | --- | --- |
| **Selected** | Purple border + dark text | Chosen for this visit type |
| **Active** | No border + medium gray-purple | Free to tap |
| **Disabled** | No border + faint text | Taken by the other visit type |`,
    ],
    rating: [
      "Public ratings from the reviews service.",
      `## Usage

\`RatingStars\` / \`ReviewCountChip\`. Providers cannot delete public reviews.`,
    ],
  };

  for (const item of SEED_NAV.find((n) => n.section === "components")!.items) {
    const [lede, body] = componentBodies[item.slug] || ["", `## ${item.title}\n\nComing soon.`];
    pages.push(page("components", item.slug, item.title, order++, lede, body));
  }

  const patternBodies: Record<string, [string, string]> = {
    navigation: [
      "Left rail + page shell for authenticated care.",
      `## Patterns

- Marketing: landing chrome
- Patient: \`AppShell\` + activity rail
- Provider: \`ProviderShell\``,
    ],
    forms: [
      "One column, clear labels, progressive disclosure.",
      `## Patterns

Group related fields. Show validation near the control. Prefer native inputs styled via tokens.`,
    ],
    feedback: [
      "Toasts for ephemeral success; inline for errors.",
      `## Patterns

Confirm before irreversible actions. Use calm copy.`,
    ],
    booking: [
      "Visit type → day → time chip → review.",
      `## Patterns

\`AvailabilityBoard\` is shared across provider Hours and patient booking. Location pill shows facility • city for in-person.`,
    ],
  };

  for (const item of SEED_NAV.find((n) => n.section === "patterns")!.items) {
    const [lede, body] = patternBodies[item.slug] || ["", `## ${item.title}\n\nComing soon.`];
    pages.push(page("patterns", item.slug, item.title, order++, lede, body));
  }

  return pages;
}
