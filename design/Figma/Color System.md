# 🎨 Color System

> **Version:** 1.0  
> **Phase:** Design Foundations  
> **Document:** Design System  
> **Status:** Draft

---

# Overview

The Color System establishes the visual language of the PocketPills redesign.

Rather than functioning as decorative elements, colors serve as semantic communication tools that guide users through healthcare journeys, reinforce trust, improve accessibility, and create a scalable design language for future products.

The system is designed around semantic tokens rather than individual hexadecimal values, allowing themes, accessibility improvements, and future branding changes to be implemented without modifying component implementations.

---

# Design Objectives

The color system should:

- Build trust immediately
- Reduce cognitive load
- Create clear visual hierarchy
- Support healthcare-specific interactions
- Improve accessibility
- Scale across future products
- Support light and dark themes
- Encourage consistent implementation

---

# Design Philosophy

Healthcare products should never overwhelm users with excessive color.

Instead, the interface should communicate calmness, confidence, and clarity.

The redesign follows four guiding principles.

## 1. Trust

Users must feel safe sharing personal medical information.

Colors should communicate professionalism without appearing cold or overly clinical.

---

## 2. Clarity

Color should support information hierarchy rather than compete with it.

Primary actions should be immediately recognizable while secondary content fades into the background.

---

## 3. Simplicity

Neutral surfaces should dominate the interface.

Accent colors should be used intentionally and sparingly.

Whitespace should remain the primary visual separator.

---

## 4. Accessibility

Every color combination must satisfy WCAG AA accessibility standards.

Status indicators must never rely on color alone.

---

# Brand Color Strategy

Most healthcare platforms rely heavily on saturated blues.

While blue communicates trust, overuse has resulted in visual sameness across the healthcare industry.

The PocketPills redesign introduces a more modern and human-centered palette.

## Primary

Deep Emerald

Represents

- Wellness
- Health
- Growth
- Confidence
- Sustainability

Used for

- Primary buttons
- Primary navigation
- Important actions
- Active states

---

## Secondary

Soft Teal

Represents

- Calmness
- Digital healthcare
- Care
- Guidance

Used for

- Secondary actions
- Informational surfaces
- Supporting illustrations

---

## Accent

Warm Coral

Represents

- Human interaction
- Positive attention
- Guidance

Used sparingly for

- Highlights
- Recommendations
- Empty states
- Educational content

Never use as an error color.

---

# Primitive Color Palette

Primitive colors represent raw color values.

Components should never reference these directly.

---

## Emerald

| Token | Hex |
|--------|------|
| Emerald 50 | #ECFDF5 |
| Emerald 100 | #D1FAE5 |
| Emerald 200 | #A7F3D0 |
| Emerald 300 | #6EE7B7 |
| Emerald 400 | #34D399 |
| Emerald 500 | #10B981 |
| Emerald 600 | #059669 |
| Emerald 700 | #047857 |
| Emerald 800 | #065F46 |
| Emerald 900 | #064E3B |

---

## Teal

| Token | Hex |
|--------|------|
| Teal 50 | #F0FDFA |
| Teal 100 | #CCFBF1 |
| Teal 200 | #99F6E4 |
| Teal 300 | #5EEAD4 |
| Teal 400 | #2DD4BF |
| Teal 500 | #14B8A6 |
| Teal 600 | #0D9488 |
| Teal 700 | #0F766E |
| Teal 800 | #115E59 |
| Teal 900 | #134E4A |

---

## Coral

| Token | Hex |
|--------|------|
| Coral 50 | #FFF7ED |
| Coral 100 | #FFEDD5 |
| Coral 200 | #FED7AA |
| Coral 300 | #FDBA74 |
| Coral 400 | #FB923C |
| Coral 500 | #F97316 |
| Coral 600 | #EA580C |
| Coral 700 | #C2410C |

---

## Neutral

Warm neutral tones provide the primary visual foundation.

Approximately 70% of the interface should use neutral colors.

| Token | Hex |
|--------|------|
| Neutral 50 | #FAFAF9 |
| Neutral 100 | #F5F5F4 |
| Neutral 200 | #E7E5E4 |
| Neutral 300 | #D6D3D1 |
| Neutral 400 | #A8A29E |
| Neutral 500 | #78716C |
| Neutral 600 | #57534E |
| Neutral 700 | #44403C |
| Neutral 800 | #292524 |
| Neutral 900 | #1C1917 |

---

## Semantic Colors

### Success

Represents successful healthcare actions.

Examples

- Prescription approved
- Medication delivered
- Consultation completed

---

### Warning

Represents actions requiring attention.

Examples

- Expiring prescription
- Missing profile information
- Insurance verification pending

---

### Error

Represents critical issues.

Examples

- Payment failed
- Invalid information
- Consultation unavailable

---

### Information

Represents educational content.

Examples

- Health tips
- Medical explanations
- Recommendations

---

# Semantic Token Architecture

Never assign hexadecimal values directly to UI components.

Instead, use semantic tokens.

```
Primitive

↓

Semantic

↓

Component
```

Example

```
Emerald 600

↓

Primary

↓

Button / Primary
```

---

# Surface System

The redesign uses layered surfaces instead of colored backgrounds.

| Surface | Usage |
|----------|--------|
| Surface 0 | Application Background |
| Surface 1 | Section Background |
| Surface 2 | Cards |
| Surface 3 | Floating Panels |
| Surface 4 | Dialogs |
| Surface 5 | Modals |

---

# Text Tokens

Text colors follow semantic naming.

| Token | Usage |
|---------|--------|
| Text Primary | Headlines |
| Text Secondary | Supporting text |
| Text Tertiary | Metadata |
| Text Disabled | Disabled states |
| Text Inverse | Dark backgrounds |
| Text Link | Hyperlinks |

---

# Border Tokens

| Token | Usage |
|---------|--------|
| Border Default | Cards |
| Border Divider | Layout separation |
| Border Strong | Tables |
| Border Focus | Keyboard navigation |
| Border Success | Success inputs |
| Border Error | Error inputs |

---

# Interactive States

Every interactive color includes five states.

- Default
- Hover
- Pressed
- Focus
- Disabled

Example

```
Primary

Primary Hover

Primary Pressed

Primary Focus

Primary Disabled
```

---

# Healthcare Status Colors

| Status | Color |
|---------|--------|
| Active Treatment | Emerald |
| Pending Consultation | Amber |
| Medication Delivered | Emerald |
| Medication Delayed | Orange |
| Payment Failed | Red |
| Information | Teal |

---

# Data Visualization

Charts should prioritize readability.

Recommended palette

- Emerald
- Teal
- Blue
- Purple
- Orange

Avoid using red except for critical medical indicators.

---

# Accessibility Guidelines

## Contrast

Normal text

Minimum

4.5 : 1

Large text

Minimum

3 : 1

---

## Focus

Every interactive component requires

- Focus outline
- Focus shadow
- Keyboard visibility

---

## Color Independence

Color must never be the only method of communication.

Combine with

- Icons
- Labels
- Helper text

---

# Dark Mode Strategy

The color system is built around semantic variables.

Dark mode should replace semantic values rather than component colors.

This enables automatic theme switching without redesigning components.

---

# Figma Variables

Organize variables into four collections.

```
Primitive

Semantic

Components

Themes
```

Example

```
Primitive
    Emerald/500

↓

Semantic
    Primary

↓

Component
    Button/Background

↓

Theme
    Light
    Dark
```

---

# Implementation Rules

## Do

- Use semantic tokens
- Use neutral surfaces
- Maintain consistent interaction states
- Validate contrast before release

---

## Don't

- Hardcode hexadecimal values
- Use primitive colors in components
- Use color for decoration
- Depend solely on color for status communication

---

# Future Considerations

The system is intentionally designed to support

- Dark mode
- High contrast mode
- Seasonal branding
- Healthcare partner themes
- White-label implementations

without requiring component redesign.

---

# Conclusion

The PocketPills Color System is designed as a semantic, accessible, and scalable foundation for a modern digital healthcare platform.

Rather than treating color as decoration, the system uses color to communicate hierarchy, intent, and healthcare status while reinforcing trust and creating a calm user experience.

Every component, illustration, screen, and future product should inherit its visual language from this foundation.