# 19. Screen Specifications

## Overview

This chapter documents the purpose, user goals, functional requirements, content hierarchy, interaction patterns, and success metrics for every major screen within the PocketPills platform.

Unlike wireframes, these specifications focus on **what each screen must accomplish**, not **how it should visually appear**.

These specifications ensure every screen is intentionally designed to support the overall healthcare journey.

---

# Screen Structure

Every screen should follow the same structure.

## Header

- Page Title
- Context
- Notifications
- User Profile

---

## Primary Content

The main task users came to accomplish.

---

## Supporting Content

Helpful information that assists decision-making.

---

## Primary Action

One clear CTA.

---

## Secondary Actions

Optional actions with lower visual priority.

---

## Footer

Help

Privacy

Terms

Support

---

# Screen 01

## Landing Page

### Purpose

Introduce PocketPills while immediately directing users toward the correct healthcare journey.

### Primary User Goal

Find the appropriate healthcare service within seconds.

### Functional Requirements

- Hero
- Search
- Intent Cards
- Featured Treatments
- Trust Signals
- Testimonials
- Healthcare Categories
- FAQ
- Footer

### Primary CTA

How can we help you today?

### Success Metric

Users identify the correct healthcare path in under 30 seconds.

---

# Screen 02

## Find Care

### Purpose

Allow users to discover the appropriate healthcare pathway.

### Requirements

- Search
- AI Assistant
- Popular Symptoms
- Conditions
- Treatments
- Doctors

### Primary CTA

Continue

---

# Screen 03

## Treatment Details

### Purpose

Educate users before consultation.

### Requirements

- Overview
- Eligibility
- Treatment Timeline
- Pricing
- Side Effects
- FAQs
- Reviews

### CTA

Start Consultation

---

# Screen 04

## Medical Questionnaire

### Purpose

Collect healthcare information efficiently.

### Requirements

- Multi-step form
- Autosave
- Progress Bar
- Validation
- Conditional Questions

### CTA

Continue

---

# Screen 05

## Consultation

### Purpose

Enable virtual consultation.

### Requirements

- Doctor Profile
- Appointment Details
- Video Interface
- Chat
- Notes
- Prescription Outcome

### CTA

Continue

---

# Screen 06

## Prescription

### Purpose

Review prescribed medication.

### Requirements

- Medication
- Dosage
- Instructions
- Alternatives
- Insurance
- Pricing

### CTA

Confirm Prescription

---

# Screen 07

## Checkout

### Purpose

Complete medication order.

### Requirements

- Delivery Address
- Insurance
- Payment
- Summary
- Estimated Delivery

### CTA

Place Order

---

# Screen 08

## Delivery Tracking

### Purpose

Monitor fulfillment.

### Requirements

- Timeline
- Tracking
- Status
- ETA
- Support

---

# Screen 09

## Dashboard

### Purpose

Become the healthcare home.

### Modules

Today's Health

Upcoming Appointments

Medication

Orders

Recommendations

Messages

Health Timeline

Quick Actions

### Primary CTA

Continue Care

---

# Screen 10

## Medications

### Purpose

Manage prescriptions.

### Requirements

- Active Medication
- Schedule
- Refill
- Progress
- Instructions

---

# Screen 11

## Health Records

### Purpose

Provide secure medical history.

### Requirements

- Prescriptions
- Reports
- Vaccinations
- Diagnoses
- Documents

---

# Screen 12

## Orders

### Purpose

Manage medication purchases.

### Requirements

- Active Orders
- History
- Tracking
- Invoice
- Reorder

---

# Screen 13

## Messages

### Purpose

Centralize communication.

### Requirements

- Doctors
- Pharmacists
- Support
- AI Assistant

---

# Screen 14

## Family Care

### Purpose

Manage healthcare for multiple people.

### Requirements

- Family Dashboard
- Members
- Medications
- Appointments
- Notifications

---

# Screen 15

## Notifications

### Purpose

Keep users informed.

### Categories

Medication

Delivery

Appointments

Messages

Reminders

Health Alerts

---

# Screen 16

## Profile

### Purpose

Manage account settings.

### Requirements

- Personal Info
- Insurance
- Payment
- Preferences
- Accessibility
- Security

---

# Shared Components

Every screen should use standardized components.

- Header
- Search
- Navigation
- Cards
- Timeline
- Progress
- Forms
- Buttons
- Bottom Actions
- Notifications

---

# Screen Success Criteria

Each screen should answer:

- Where am I?
- What is this screen for?
- What should I do next?
- Can I recover from mistakes?
- Can I complete this task confidently?

---

# Screen Hierarchy

```text
Landing
      │
      ├── Find Care
      │
      ├── Treatment
      │
      ├── Consultation
      │
      ├── Prescription
      │
      ├── Checkout
      │
      ├── Tracking
      │
      ▼
Dashboard
      │
      ├── Medications
      ├── Appointments
      ├── Orders
      ├── Messages
      ├── Records
      ├── Family
      └── Profile
```

---

# Completion Criteria

A screen is complete when it:

- Solves one primary user problem.
- Has one clear primary action.
- Reduces uncertainty.
- Connects naturally to the next step.
- Supports accessibility.
- Reinforces trust.