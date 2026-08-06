# 11. Information Architecture

## Overview

Information Architecture (IA) defines how users navigate and understand the platform.

Rather than organizing content around business functions or internal services, the redesigned architecture is built around user intentions and healthcare journeys.

The objective is to reduce cognitive load, improve discoverability, and ensure users always know where they are, what they can do, and what comes next.

---

# IA Principles

The new information architecture follows five guiding principles.

## 1. Intent Before Navigation

Users arrive with goals—not knowledge of the platform.

Navigation should begin with user intentions rather than healthcare services.

---

## 2. One Platform

Consultations, pharmacy, medications, records, and follow-ups should feel like one connected experience.

Users should never feel like they are moving between different products.

---

## 3. Progressive Disclosure

Only show information when users need it.

Avoid overwhelming users with too many choices at once.

---

## 4. Contextual Guidance

Every screen should clearly answer:

- Where am I?
- What can I do here?
- What happens next?

---

## 5. Long-Term Value

Navigation should support both immediate healthcare needs and ongoing health management.

---

# Current Architecture

```text
Home
│
├── Treatments
├── Online Pharmacy
├── About
├── Contact
├── FAQs
└── Get Started
```

### Challenges

- Service-first organization
- No personalization
- Generic entry points
- Weak hierarchy
- Limited support for returning users

---

# Proposed Architecture

```text
Home
│
├── Find Care
│   ├── Symptoms
│   ├── Treatments
│   ├── Doctors
│   └── AI Health Assistant
│
├── My Health
│   ├── Dashboard
│   ├── Medications
│   ├── Appointments
│   ├── Health Records
│   ├── Progress
│   └── Insurance
│
├── Pharmacy
│   ├── Prescriptions
│   ├── Refills
│   ├── Delivery
│   └── Order History
│
├── Family
│   ├── Members
│   ├── Shared Medications
│   ├── Appointments
│   └── Caregiver Access
│
├── Messages
│
├── Learn
│
└── Profile
```

---

# Navigation Strategy

## Primary Navigation

Designed around the user's mental model.

- Find Care
- My Health
- Pharmacy
- Family
- Messages
- Learn
- Profile

---

## Secondary Navigation

Contextual navigation appears based on the current task.

Examples

Within Pharmacy

- Active Orders
- Refills
- Delivery
- Payment

Within My Health

- Dashboard
- Medications
- Appointments
- Reports

---

# Homepage Architecture

The homepage becomes a decision hub rather than a marketing page.

```text
Hero

↓

How can we help you today?

↓

Intent Cards

↓

Recommended Treatments

↓

Popular Services

↓

How It Works

↓

Trust & Reviews

↓

Health Resources

↓

Footer
```

---

# Intent-Based Entry Points

Instead of asking users to browse services, offer direct paths based on common goals.

Examples

- I need a doctor
- I need medication
- Renew my prescription
- Transfer my pharmacy
- Manage my health
- Explore treatments

---

# Logged-Out Experience

Primary goals:

- Discover services
- Build trust
- Guide first-time users
- Encourage onboarding

Focus areas:

- Intent selection
- Education
- Testimonials
- FAQs
- Clear CTAs

---

# Logged-In Experience

Primary goals:

- Continue care
- Manage health
- Complete active tasks
- Stay engaged

Landing destination:

**My Health Dashboard**

---

# Dashboard Structure

```text
Today's Health

↓

Upcoming Tasks

↓

Medications

↓

Appointments

↓

Messages

↓

Health Progress

↓

Recommendations

↓

Recent Activity
```

The dashboard becomes the user's healthcare home.

---

# Search Architecture

Search should understand user intent.

Users should be able to search for:

- Symptoms
- Conditions
- Treatments
- Medications
- Doctors
- FAQs

Instead of returning only keyword matches, search should recommend appropriate care pathways.

---

# Content Hierarchy

Priority order:

1. User Goal
2. Recommended Action
3. Supporting Information
4. Educational Content
5. Related Services

This ensures users see what matters first.

---

# Navigation Patterns

### Global Navigation

Persistent across the platform.

---

### Contextual Navigation

Changes based on the current healthcare journey.

---

### Action Navigation

Appears when users need to complete a task.

Examples:

- Continue Consultation
- Upload Prescription
- Track Delivery
- Schedule Follow-up

---

# Content Strategy

Content should answer user questions in the order they naturally arise.

Instead of explaining the business, answer:

- Can you help me?
- How does it work?
- How long will it take?
- How much does it cost?
- What should I do next?

---

# Information Hierarchy Principles

Every page should prioritize:

1. User Intent
2. Primary Action
3. Current Status
4. Supporting Details
5. Related Information

---

# IA Improvements

| Current | Proposed |
|----------|----------|
| Service-first | Intent-first |
| Static navigation | Context-aware navigation |
| Generic homepage | Personalized homepage |
| Marketing-first | Task-first |
| Multiple disconnected sections | Unified healthcare ecosystem |

---

# Expected Outcomes

The redesigned information architecture aims to:

- Reduce decision fatigue
- Improve discoverability
- Shorten task completion time
- Increase conversion
- Encourage repeat engagement
- Support long-term healthcare management

---

# Information Architecture Summary

The redesigned IA shifts the platform from a collection of healthcare services to a connected healthcare ecosystem.

Instead of asking users to understand the platform, the platform is structured to understand the user.

Every navigation decision is designed to make healthcare feel simpler, more intuitive, and always within reach.