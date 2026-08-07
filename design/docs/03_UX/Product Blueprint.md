# 17. Product Blueprint (Screen Architecture)

## Overview

The Product Blueprint defines the structural architecture of the PocketPills platform.

It serves as the foundation for wireframing by identifying every major screen, its purpose, and its relationship to the overall healthcare journey.

Rather than thinking in pages, the platform is organized into connected experiences that support users before, during, and after treatment.

---

# Product Architecture

```text
PocketPills

├── Public Experience
│   ├── Landing
│   ├── Find Care
│   ├── Treatments
│   ├── Doctors
│   ├── Pricing
│   ├── How It Works
│   ├── Resources
│   ├── FAQ
│   ├── Contact
│   └── Authentication
│
├── Care Journey
│   ├── Symptom Checker
│   ├── AI Assistant
│   ├── Treatment Details
│   ├── Medical Questionnaire
│   ├── Consultation
│   ├── Prescription Review
│   ├── Checkout
│   ├── Delivery Tracking
│   └── Medication Guidance
│
├── My Health
│   ├── Dashboard
│   ├── Medications
│   ├── Appointments
│   ├── Health Records
│   ├── Messages
│   ├── Progress
│   ├── Orders
│   └── Notifications
│
├── Family
│   ├── Family Dashboard
│   ├── Member Profiles
│   ├── Shared Medications
│   └── Family Appointments
│
└── Profile
    ├── Personal Info
    ├── Insurance
    ├── Payment
    ├── Preferences
    ├── Security
    └── Settings
```

---

# Public Experience

## Landing Page

### Purpose

Introduce the platform and immediately help users identify the right healthcare journey.

### Primary Action

**How can we help you today?**

---

## Find Care

### Purpose

Help users discover the right treatment or healthcare service.

### Primary Action

Start Care Journey

---

## Treatment Details

### Purpose

Educate users about conditions, treatments, eligibility, pricing, and expected outcomes.

### Primary Action

Start Consultation

---

## Doctor Directory

### Purpose

Browse available healthcare professionals and specialties.

### Primary Action

Book Consultation

---

## Authentication

### Purpose

Enable secure account creation and login.

### Primary Action

Continue to Dashboard

---

# Care Journey

## Symptom Checker

### Purpose

Help users understand the most appropriate care pathway.

---

## AI Healthcare Assistant

### Purpose

Provide conversational guidance and recommend the next best action.

---

## Medical Questionnaire

### Purpose

Collect relevant medical information before consultation.

---

## Consultation

### Purpose

Connect users with licensed healthcare professionals.

---

## Prescription Review

### Purpose

Present treatment recommendations and medication options.

---

## Checkout

### Purpose

Complete payment, insurance verification, and order confirmation.

---

## Delivery Tracking

### Purpose

Provide real-time visibility into medication fulfillment.

---

## Medication Guidance

### Purpose

Support safe medication usage with instructions and reminders.

---

# My Health

## Dashboard

### Purpose

Serve as the personalized home for all healthcare activities.

### Widgets

- Today's Health
- Upcoming Appointments
- Active Medications
- Health Timeline
- Recommendations
- Messages

---

## Medications

### Purpose

Manage prescriptions, refills, reminders, and medication history.

---

## Appointments

### Purpose

Schedule, manage, and review consultations.

---

## Health Records

### Purpose

Provide access to medical history, reports, prescriptions, and treatment summaries.

---

## Progress

### Purpose

Track treatment milestones and long-term health goals.

---

## Messages

### Purpose

Centralize communication with doctors, pharmacists, and support.

---

## Orders

### Purpose

Review medication purchases, invoices, and delivery history.

---

# Family Experience

## Family Dashboard

### Purpose

Provide a centralized view of family healthcare.

---

## Member Profile

### Purpose

Manage healthcare information for individual family members.

---

## Shared Medications

### Purpose

Monitor medications and reminders across the household.

---

## Family Appointments

### Purpose

Coordinate consultations and healthcare schedules.

---

# Profile & Settings

## Personal Information

Manage personal details and emergency contacts.

---

## Insurance

Store and manage insurance information.

---

## Payment Methods

Manage saved payment options and billing.

---

## Preferences

Notification settings, language, accessibility, and communication preferences.

---

## Security

Password, biometrics, multi-factor authentication, and privacy controls.

---

# Navigation Structure

## Global Navigation

- Find Care
- My Health
- Pharmacy
- Family
- Messages
- Learn
- Profile

---

## Dashboard Navigation

- Overview
- Medications
- Appointments
- Progress
- Records
- Orders

---

## Care Journey Navigation

Each step clearly indicates:

- Current stage
- Completed stages
- Next step

---

# Screen Relationships

```text
Landing
      │
      ▼
Find Care
      │
      ▼
Treatment Details
      │
      ▼
Medical Questionnaire
      │
      ▼
Consultation
      │
      ▼
Prescription
      │
      ▼
Checkout
      │
      ▼
Delivery
      │
      ▼
Medication Guidance
      │
      ▼
Dashboard
      │
      ▼
Progress
      │
      ▼
Follow-up
```

---

# Core Screen Inventory

## Public

- Landing
- Find Care
- Treatments
- Doctor Directory
- Pricing
- FAQ
- Login
- Signup

---

## Healthcare

- Symptom Checker
- AI Assistant
- Questionnaire
- Consultation
- Prescription
- Checkout
- Tracking
- Medication Guide

---

## Dashboard

- Home
- Medications
- Appointments
- Records
- Progress
- Orders
- Messages
- Notifications

---

## Family

- Dashboard
- Members
- Shared Care
- Appointments

---

## Settings

- Profile
- Insurance
- Payment
- Preferences
- Security

---

# Blueprint Summary

The Product Blueprint transforms PocketPills from a collection of disconnected pages into a structured healthcare ecosystem.

Each screen exists to support a specific stage of the user's healthcare journey while remaining connected through a unified navigation and experience model.

This blueprint establishes the foundation for the wireframing phase, ensuring every screen has a clear purpose, defined relationships, and measurable user outcomes.