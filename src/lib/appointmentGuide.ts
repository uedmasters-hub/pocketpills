/**
 * Patient-facing visit guidance. Educational only — no invented diagnoses,
 * protocols, or clinic-specific medical facts.
 */

import {
  kindLabel,
  listProviders,
  type Appointment,
  type CareProvider,
  type SpecialtyId,
  type VisitType,
} from "@/lib/appointments";
import {
  articleBySlug,
  articlesForSpecialties,
  conditionsForSpecialty,
  doctorConditions,
  type HealthArticle,
} from "@/lib/doctorProfileContent";
import { addCalendarDays, minutesUntilSlot, monthDayShort, todayIso, weekdayShort } from "@/lib/timeSlots";

export type VisitPhase =
  | "pending"
  | "upcoming"
  | "today"
  | "starting-soon"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "missed";

export type GuideStep = {
  title: string;
  detail: string;
};

export type GuideTip = {
  title: string;
  body: string;
};

export type GuideArticle = HealthArticle & {
  paragraphs: string[];
};

const DISCLAIMER =
  "This is general education for this type of visit — not a diagnosis, and not a substitute for your clinician’s advice.";

const EMERGENCY =
  "Chest pain, trouble breathing, severe bleeding, a seizure, or sudden confusion needs emergency care. Do not wait for this appointment.";

export function visitDisclaimer(): string {
  return DISCLAIMER;
}

export function visitEmergencyNote(): string {
  return EMERGENCY;
}

export function visitPhase(a: Appointment, at = new Date()): VisitPhase {
  if (a.status === "cancelled") return "cancelled";
  if (a.status === "completed") return "completed";

  const until = minutesUntilSlot(a.date, a.time, at);
  if (until == null) {
    return a.status === "pending" ? "pending" : "upcoming";
  }

  if (a.status === "pending") {
    if (until < 0) return "missed";
    return "pending";
  }

  if (until < -45) return "missed";
  if (until < 0) return "in-progress";
  if (until <= 30) return "starting-soon";
  if (a.date === todayIso()) return "today";
  return "upcoming";
}

export function phaseLabel(phase: VisitPhase): string {
  switch (phase) {
    case "pending":
      return "Awaiting doctor";
    case "upcoming":
      return "Upcoming";
    case "today":
      return "Today";
    case "starting-soon":
      return "Starting soon";
    case "in-progress":
      return "Visit window";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "missed":
      return "Time passed";
  }
}

export function phaseLede(a: Appointment, phase: VisitPhase): string {
  const when = formatVisitWhen(a.date, a.time);
  const name = a.clinicianName || a.providerName;
  switch (phase) {
    case "pending":
      return `Your request is with ${name}. Use this time to gather notes and reports — do not travel or join until they accept.`;
    case "upcoming":
      return `You’re booked for ${when}. Work through the checklist below so the consult is used well.`;
    case "today":
      return `This visit is today at ${a.time}. Confirm how you’ll get there (or join), and keep your questions list handy.`;
    case "starting-soon":
      return a.visitType === "virtual"
        ? "Your virtual visit is about to start. Open Messages, sit somewhere quiet, and join a few minutes early."
        : "Your in-clinic visit is about to start. Head to the address below and check in with reception.";
    case "in-progress":
      return a.visitType === "virtual"
        ? "The booked time has started. Join from Messages if you have not already."
        : "The booked time has started. If you are running late, message the care team from this page.";
    case "completed":
      return "This visit is complete. Use the follow-up notes below if you need a refill, a message, or another booking.";
    case "cancelled":
      return "This visit was cancelled. You can rebook the same clinician or browse related care below.";
    case "missed":
      return "This time is no longer available. Rebook a new slot — your notes and reports are still on file for the next request.";
  }
}

export function formatVisitWhen(date: string, time: string): string {
  const year = date.slice(0, 4);
  return `${weekdayShort(date)}, ${monthDayShort(date)} ${year} · ${time}`;
}

export function visitCountdown(a: Appointment, phase: VisitPhase): string | null {
  if (phase === "cancelled" || phase === "completed" || phase === "missed") return null;
  const until = minutesUntilSlot(a.date, a.time);
  if (until == null) return null;
  if (until <= 0) return phase === "in-progress" ? "Started" : null;
  if (until < 60) return `In ${until} min`;
  if (a.date === todayIso()) return `Today at ${a.time}`;
  const days = Math.round(until / (24 * 60));
  if (days <= 1) return `Tomorrow at ${a.time}`;
  return `In ${days} days`;
}

export function canCancelVisit(phase: VisitPhase): boolean {
  return phase === "pending" || phase === "upcoming" || phase === "today";
}

export function canJoinVirtual(a: Appointment, phase: VisitPhase): boolean {
  return a.visitType === "virtual" && (phase === "today" || phase === "starting-soon" || phase === "in-progress");
}

export function visitTypeLabel(type: VisitType): string {
  return type === "virtual" ? "Virtual visit" : "In-clinic visit";
}

export function mapsQueryForVisit(a: Appointment, provider?: CareProvider): string {
  const parts = [
    a.clinicName || provider?.name,
    a.clinicAddress || provider?.address,
    provider?.city,
  ].filter((x): x is string => Boolean(x && x.trim()));
  return parts.join(", ");
}

export function rebookHref(a: Appointment): string {
  if (!a.providerId) return "/appointments";
  const qs = new URLSearchParams();
  if (a.specialtyId) qs.set("specialty", a.specialtyId);
  const suffix = qs.toString();
  return `/appointments/provider/${a.providerId}${suffix ? `?${suffix}` : ""}`;
}

export function visitHref(id: string): string {
  return `/appointments/visit/${id}`;
}

export function receiptHref(id: string): string {
  return `/appointments/visit/${id}/receipt`;
}

export function nextSteps(a: Appointment, phase: VisitPhase): GuideStep[] {
  const virtual = a.visitType === "virtual";
  switch (phase) {
    case "pending":
      return [
        {
          title: "Wait for the doctor to accept",
          detail: "You’ll get a notification when the visit is confirmed. Nothing to travel or join yet.",
        },
        {
          title: "Prepare your history",
          detail: "List current medicines, allergies, and the timeline of this concern. Attach reports if you have them.",
        },
        {
          title: "Read the knowledge base below",
          detail: "Short, general articles for this specialisation — useful before you speak with the clinician.",
        },
        {
          title: "Message if the time no longer works",
          detail: "You can cancel from this page and request a new slot without losing your notes.",
        },
      ];
    case "upcoming":
      return virtual
        ? [
            {
              title: "Test camera, mic, and internet",
              detail: "Use the same device you’ll join from. Keep it charged and close other video apps.",
            },
            {
              title: "Set up a quiet, private room",
              detail: "Headphones help. Have a glass of water and a notebook within reach.",
            },
            {
              title: "Gather ID and reports",
              detail: "You may be asked to show photo ID. Shared reports on this visit are listed below.",
            },
            {
              title: "Write the questions you want answered",
              detail: "A short list keeps the consult focused. Starters for this specialisation are below.",
            },
          ]
        : [
            {
              title: "Confirm the clinic address and travel time",
              detail: "Use the map on this page. Plan to arrive 10–15 minutes early for check-in.",
            },
            {
              title: "Pack photo ID and your medicine list",
              detail: "Bring printed or phone copies of reports you already shared, in case staff ask.",
            },
            {
              title: "Note symptoms with dates",
              detail: "When it started, what changed, and what you’ve already tried. Keep it factual.",
            },
            {
              title: "Prepare questions",
              detail: "Use the question list below so you leave with a clear next step.",
            },
          ];
    case "today":
    case "starting-soon":
      return virtual
        ? [
            {
              title: "Join from Messages a few minutes early",
              detail: "Virtual visits on PocketPills open in your care-team chat — not a separate app.",
            },
            {
              title: "Silence notifications",
              detail: "Close extra tabs, put the phone on Do Not Disturb, and sit with your face well lit.",
            },
            {
              title: "Keep ID nearby",
              detail: "Have your reports list open on this page if the clinician asks what you shared.",
            },
          ]
        : [
            {
              title: "Leave with a buffer",
              detail: "Check-in usually starts before the slot. Bring ID and any reports.",
            },
            {
              title: "Tell reception the confirmation number",
              detail: a.confirmationNo,
            },
            {
              title: "Message if you are running late",
              detail: "The care team can advise whether to still come in or rebook.",
            },
          ];
    case "in-progress":
      return virtual
        ? [
            {
              title: "Join now from Messages",
              detail: "If you cannot connect, send a chat note immediately so the clinician knows you are trying.",
            },
          ]
        : [
            {
              title: "Go to reception or message the care team",
              detail: "If you have already arrived, check in with your confirmation number.",
            },
          ];
    case "completed":
      return [
        {
          title: "Follow the plan from the visit",
          detail: "Use medicines only as the clinician directed. Message if any instruction is unclear.",
        },
        {
          title: "Pharmacy, if a prescription was issued",
          detail: "Fill through PocketPills or your usual pharmacy. Do not start leftover medicines on your own.",
        },
        {
          title: "Book a follow-up if you were asked to",
          detail: "Use Rebook on this page to pick the next open slot with the same clinician.",
        },
      ];
    case "cancelled":
      return [
        {
          title: "Pick a new time if you still need care",
          detail: "Rebook this clinician, or browse nearby options in the same specialisation.",
        },
        {
          title: "Keep your notes",
          detail: "Symptoms and reports from this request can be attached again on the next booking.",
        },
      ];
    case "missed":
      return [
        {
          title: "Request a new slot",
          detail: "This clock time has passed. Open the clinician’s availability and choose a current time.",
        },
        {
          title: "Message the care team if you still need today’s visit",
          detail: "They can tell you whether a same-day opening exists.",
        },
      ];
  }
}

const UNIVERSAL_BRING = [
  "Photo ID",
  "Current medicine list (name, dose, how often)",
  "Known allergies",
  "A short timeline of this concern",
  "Questions you want answered",
];

const VIRTUAL_BRING = [
  "Charged phone or laptop with camera",
  "Stable internet and headphones",
  "A private, well-lit room",
];

const CLINIC_BRING = [
  "Payment card used for this booking (if staff ask)",
  "Printed or phone copies of recent reports",
];

const SPECIALTY_BRING: Partial<Record<SpecialtyId, string[]>> = {
  general: ["Home blood-pressure or sugar readings, if you already take them"],
  cardiologist: ["Home blood-pressure log, if you keep one", "List of heart-related medicines"],
  endocrinologist: ["Recent sugar readings, if you already track them", "Thyroid or diabetes medicine names"],
  dermatologist: ["Clear photos of the area in daylight (for virtual visits)", "List of creams or tablets already tried"],
  gynecologist: ["First day of last period, if relevant", "Contraception currently used, if any"],
  pediatrician: ["Vaccination booklet", "Fever or feeding notes for the last few days"],
  psychiatrist: ["Sleep and mood notes from the last two weeks", "Current mental-health medicines"],
  neurologist: ["Headache or symptom diary, if you keep one"],
  orthopedist: ["Which movements make the pain better or worse"],
  ophthalmologist: ["Current glasses or contact prescription, if you have one"],
  ent: ["Notes on when congestion, pain, or hearing changes started"],
  gastroenterologist: ["What you ate around symptom flares, in brief"],
  pulmonologist: ["Inhaler names and how often you use them"],
  urologist: ["How often symptoms occur, and what you have already tried"],
  dentist: ["Last dental visit date, if you remember it"],
  nutritionist: ["A typical day’s meals, roughly"],
  physiotherapist: ["When the pain or stiffness started, and what aggravates it"],
  immunologist: ["Known allergy list and recent reactions, if any"],
  sexologist: ["Current medicines, including any already used for this concern"],
};

export function whatToBring(a: Appointment): string[] {
  const extra = SPECIALTY_BRING[a.specialtyId] ?? [];
  const byType = a.visitType === "virtual" ? VIRTUAL_BRING : CLINIC_BRING;
  return uniqueStrings([...UNIVERSAL_BRING, ...byType, ...extra]);
}

const SPECIALTY_TIPS: Partial<Record<SpecialtyId, GuideTip[]>> = {
  general: [
    {
      title: "Describe the timeline, not just the label",
      body: "When it started, what changed, and what you already tried helps a general physician use the slot well.",
    },
    {
      title: "Bring every current medicine",
      body: "Include tablets, inhalers, drops, and supplements. Dose and timing matter more than brand nicknames.",
    },
    {
      title: "Say what you hope to leave with",
      body: "A diagnosis, a sick note, a prescription review, or a referral — naming the goal keeps the consult focused.",
    },
  ],
  dermatologist: [
    {
      title: "Daylight photos help virtual skin visits",
      body: "One wide shot and one close shot of the area, without filters. Note if it itches, hurts, or is spreading.",
    },
    {
      title: "List creams already used",
      body: "Steroid, antibiotic, or cosmetic products you tried — even if they did not help — avoid repeating a failed step.",
    },
  ],
  gynecologist: [
    {
      title: "Cycle dates are useful when relevant",
      body: "First day of the last period, and whether this visit is about bleeding, pain, pregnancy, or contraception.",
    },
    {
      title: "You can ask for a chaperone",
      body: "In-clinic exams can include a chaperone. Say so at check-in if you prefer one.",
    },
  ],
  pediatrician: [
    {
      title: "Write the last fever reading and time",
      body: "Plus feeding, wet nappies, and any rash or breathing change. Caregivers should both know the story.",
    },
    {
      title: "Bring the vaccination booklet",
      body: "The clinician can only work from what you show. A photo of the card is enough for a virtual visit.",
    },
  ],
  psychiatrist: [
    {
      title: "Sleep, appetite, and safety first",
      body: "A two-week snapshot is more useful than a single bad day. Say if you feel unsafe — that changes the plan.",
    },
    {
      title: "List every medicine and substance",
      body: "Including alcohol, caffeine, and anything bought without a prescription. Interactions are common.",
    },
  ],
  cardiologist: [
    {
      title: "Home readings beat a single clinic number",
      body: "If you already measure blood pressure, bring a few dated values. Do not start new readings just for this page.",
    },
  ],
  endocrinologist: [
    {
      title: "Bring the device log you already keep",
      body: "Glucose meter, CGM, or thyroid tablets — only what you already use. Do not change doses before the visit.",
    },
  ],
  gastroenterologist: [
    {
      title: "Note foods around flares, briefly",
      body: "A short pattern (dairy, spice, late meals) is enough. Long food diaries are rarely needed for a first consult.",
    },
  ],
  orthopedist: [
    {
      title: "Which movement hurts",
      body: "Stairs, rest, overhead reach — one or two examples help more than a pain score alone.",
    },
  ],
  ophthalmologist: [
    {
      title: "Do not start new eye drops unless already prescribed",
      body: "Bring the bottle you use. Redness with pain or sudden vision loss is urgent, not a routine slot.",
    },
  ],
};

const DEFAULT_TIPS: GuideTip[] = [
  {
    title: "Facts first, then the question",
    body: "A two-sentence history plus one clear question usually fits a standard consult better than a long story.",
  },
  {
    title: "Do not start or stop medicines on your own",
    body: "Wait for the clinician. Bring the pack or a photo of the label if you are unsure of the name.",
  },
  {
    title: "Write down the plan before you leave",
    body: "Next test, next dose, or next booking. Message the care team the same day if any line is unclear.",
  },
];

export function healthTips(specialtyId: SpecialtyId): GuideTip[] {
  const specific = SPECIALTY_TIPS[specialtyId] ?? [];
  return [...specific, ...DEFAULT_TIPS].slice(0, 4);
}

const QUESTIONS: Partial<Record<SpecialtyId, string[]>> = {
  general: [
    "What is the most likely cause of this, and what else should we rule out?",
    "What should I watch for at home, and when should I come back sooner?",
    "Do I need a test, a medicine, or only observation for now?",
  ],
  dermatologist: [
    "Is this likely infectious, inflammatory, or something else?",
    "What should I apply, and for how long before we review?",
    "Which products should I stop in the meantime?",
  ],
  gynecologist: [
    "Are these symptoms expected, or do they need investigation?",
    "What are the options, and what are the trade-offs of each?",
    "When should I follow up if nothing changes?",
  ],
  pediatrician: [
    "What can we manage at home, and what is a reason to return tonight?",
    "How should we give medicine, and what dose for this weight?",
    "When is the next review if they are not settling?",
  ],
  psychiatrist: [
    "What are we treating first, and how will we know it is helping?",
    "What are the common side effects of any medicine you suggest?",
    "Who do I contact if things worsen before the next visit?",
  ],
};

const DEFAULT_QUESTIONS = [
  "What is the next step after today — test, medicine, or watchful waiting?",
  "What should I do if this gets worse before the follow-up?",
  "Is there anything I should avoid until we speak again?",
];

export function questionsToAsk(specialtyId: SpecialtyId): string[] {
  return QUESTIONS[specialtyId] ?? DEFAULT_QUESTIONS;
}

export function visitFaqs(a: Appointment, phase: VisitPhase): { q: string; a: string }[] {
  const virtual = a.visitType === "virtual";
  const items: { q: string; a: string }[] = [];

  if (phase === "pending") {
    items.push({
      q: "How long until the doctor accepts?",
      a: "Most requests are reviewed the same day the clinic is open. You will see the status on this page change from Awaiting doctor to Upcoming.",
    });
    items.push({
      q: "Can I still cancel?",
      a: "Yes. Cancel from this page if the time no longer works, then request a new slot. Demo bookings are not charged for a real visit.",
    });
  }

  if (virtual) {
    items.push({
      q: "How do I join the virtual visit?",
      a: "Open Messages a few minutes before the slot. PocketPills virtual visits run through your care-team chat on this device — there is no separate meeting PIN on this demo.",
    });
    items.push({
      q: "What if my video fails?",
      a: "Stay on the message thread and say you cannot connect. The clinician can continue by chat or help you rebook.",
    });
  } else {
    items.push({
      q: "When should I arrive?",
      a: "Plan for 10–15 minutes before the slot so reception can check you in. Bring photo ID and this confirmation number.",
    });
    items.push({
      q: "What if I am late?",
      a: "Message the care team as soon as you know. Clinics may still see you or ask you to rebook — they will say which.",
    });
  }

  items.push({
    q: "Will I get a prescription?",
    a: "Only if the clinician decides it is appropriate after the consult. This page cannot promise a medicine in advance.",
  });
  items.push({
    q: "Can I add more reports later?",
    a: "Message the care team with the extra file, or mention it at the start of the visit. Reports already attached are listed on this page.",
  });
  items.push({
    q: "How do I reschedule?",
    a: "Cancel this visit if it is still upcoming, then use Rebook to pick a current slot on the clinician’s calendar.",
  });

  if (phase === "completed") {
    items.push({
      q: "Where is my visit summary?",
      a: "In this demo, notes you wrote before the visit stay on this page. A clinician letter would appear here once that workflow is live.",
    });
  }

  return items;
}

const ARTICLE_BODIES: Record<string, string[]> = {
  "fever-when-to-see-a-doctor": [
    "A fever is a raised temperature, often with aches or a sore throat. Many short illnesses settle with rest and fluids, but a clinician visit is useful when symptoms last, return, or you are unsure.",
    "Before the consult, write when the fever started, the highest reading you have (if you measured), and other symptoms: cough, rash, pain, vomiting, or difficulty drinking.",
    "Urgent care is for trouble breathing, a stiff neck with severe headache, confusion, a rash that does not fade, or a baby who is unusually sleepy or not feeding. Those are not “wait for the slot” problems.",
    "Do not start leftover antibiotics. Bring the names of any fever medicine already given, with times.",
  ],
  "living-with-hypertension": [
    "High blood pressure is often quiet. A consult is a chance to review readings you already have, medicines, and lifestyle — not a place to invent a new home-monitoring routine on the day.",
    "Bring the list of current tablets. Note dizziness, chest discomfort, or swollen ankles if those are happening.",
    "If you already measure at home, a few dated numbers help more than one clinic reading. If you do not measure, say so — the clinician will advise whether you should start.",
    "Sudden crushing chest pain, one-sided weakness, or trouble speaking is emergency care, not this appointment.",
  ],
  "diabetes-follow-up": [
    "A diabetes follow-up works best when the clinician can see what you already take and, if you track them, recent sugar readings.",
    "Bring meter or app logs you already keep, plus any hypos (very low sugars) and how you treated them.",
    "Do not change insulin or tablet doses because of an article. Ask at the visit. Wear medic-alert jewellery if you already have it.",
    "Vomiting with high sugars, deep drowsiness, or rapid breathing needs urgent care.",
  ],
  "preventive-health-visit": [
    "A preventive consult is for screening, vaccination questions, and risk factors — not for an emergency symptom.",
    "Write family history that you know (heart disease, diabetes, cancer) and medicines plus supplements.",
    "Ask which checks are due for your age and which can wait. You do not need to arrive with a full lab panel unless a clinician already ordered one.",
  ],
  "common-skin-concerns": [
    "Acne, eczema, and rashes are common reasons for a dermatology slot. Photos in daylight help a virtual visit; in clinic, avoid heavy makeup on the area.",
    "List every cream, soap, and tablet tried in the last month. “It did nothing” is useful information.",
    "Rapid swelling of lips or tongue, or a spreading painful rash with fever, is urgent — not a routine skin consult.",
  ],
  "anxiety-first-visit": [
    "A first mental-health consult is mostly conversation. You do not need a diagnosis in advance.",
    "Note sleep, appetite, concentration, and whether you feel safe. If you are in crisis, contact local emergency services or a crisis line rather than waiting for the slot.",
    "Bring current medicines. Ask how follow-ups work and who to message between visits.",
  ],
  "digestive-symptoms": [
    "Reflux, bloating, and bowel-habit change are common gastroenterology topics. A short food-and-symptom pattern is enough for a first visit.",
    "Black stools, vomiting blood, yellow eyes, or severe abdominal pain that does not settle needs urgent assessment.",
    "Do not start strong painkillers or leftover antibiotics for stomach pain unless a clinician has already directed that.",
  ],
  "womens-health-visit": [
    "Bring cycle dates if the visit is about bleeding, pain, pregnancy, or contraception. Write what you want to decide today.",
    "You can ask for a chaperone in clinic. You can also ask to pause an exam.",
    "Heavy bleeding that soaks pads hourly, fainting, or pregnancy with severe pain or bleeding is urgent care.",
  ],
  "how-online-consults-work": [
    "An online consult uses your camera and the PocketPills message thread. Join a few minutes early from a private room.",
    "The clinician may ask you to show ID, a medicine pack, or the affected area. Prescriptions are issued only when clinically appropriate — never promised in advance.",
    "If video fails, stay in the chat. You can continue by message or rebook.",
  ],
  "prepare-for-appointment": [
    "Three things make almost any visit more useful: photo ID, a current medicine list, and a short timeline of the concern.",
    "Write two or three questions. Leave space to jot the plan (test, medicine, or follow-up date) before you hang up or leave the clinic.",
    "Attach reports on the booking when you have them. Extra files can go through Messages.",
  ],
};

function fallbackArticleBody(article: HealthArticle): string[] {
  return [
    article.blurb,
    "Use this as background before you speak with the clinician — not as a treatment plan.",
    "Bring your own timeline, medicine list, and questions. If symptoms are severe or suddenly worse, seek urgent care instead of waiting for the slot.",
  ];
}

export function knowledgeArticles(specialtyId: SpecialtyId, visitType: VisitType): GuideArticle[] {
  const base = articlesForSpecialties([specialtyId]);
  const extra =
    visitType === "virtual" ? [articleBySlug("how-online-consults-work"), articleBySlug("prepare-for-appointment")] : [];
  const seen = new Set<string>();
  const out: GuideArticle[] = [];
  for (const article of [...base, ...extra]) {
    if (!article || seen.has(article.slug)) continue;
    seen.add(article.slug);
    out.push({
      ...article,
      paragraphs: ARTICLE_BODIES[article.slug] ?? fallbackArticleBody(article),
    });
    if (out.length >= 5) break;
  }
  return out;
}

export function relatedConditions(provider?: CareProvider, specialtyId?: SpecialtyId): string[] {
  if (provider) return doctorConditions(provider);
  if (!specialtyId) return [];
  return conditionsForSpecialty(specialtyId);
}

export function similarProviders(a: Appointment, limit = 3): CareProvider[] {
  return listProviders()
    .filter((p) => p.id !== a.providerId && p.specialties.includes(a.specialtyId))
    .slice(0, limit);
}

export function clinicKindLabel(a: Appointment): string {
  return kindLabel(a.providerKind);
}

export function downloadVisitIcs(a: Appointment, provider?: CareProvider): void {
  const start = icsLocal(a.date, a.time);
  const endSlot = addMinutes(a.date, a.time, 30);
  const end = icsLocal(endSlot.date, endSlot.time);
  const title = `${visitTypeLabel(a.visitType)} · ${a.clinicianName || a.providerName}`;
  const loc =
    a.visitType === "virtual"
      ? "PocketPills virtual visit (Messages)"
      : mapsQueryForVisit(a, provider) || a.clinicName || "";
  const desc = [
    `Confirmation ${a.confirmationNo}`,
    `Patient: ${a.patientName}`,
    a.specialtyLabel,
    a.visitType === "virtual" ? "Join from PocketPills Messages a few minutes early." : loc,
  ]
    .filter(Boolean)
    .join("\\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PocketPills//Visit//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${a.id}@pocketpills`,
    `DTSTAMP:${icsUtcNow()}`,
    `DTSTART;TZID=Asia/Kathmandu:${start}`,
    `DTEND;TZID=Asia/Kathmandu:${end}`,
    `SUMMARY:${escapeIcs(title)}`,
    loc ? `LOCATION:${escapeIcs(loc)}` : "",
    `DESCRIPTION:${escapeIcs(desc)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${a.confirmationNo}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function icsLocal(iso: string, timeLabel: string): string {
  const mins = Math.max(0, timeToMinutesSafe(timeLabel));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${iso.replace(/-/g, "")}T${pad(h)}${pad(m)}00`;
}

function icsUtcNow(): string {
  const d = new Date();
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function addMinutes(iso: string, timeLabel: string, add: number): { date: string; time: string } {
  let mins = timeToMinutesSafe(timeLabel) + add;
  let date = iso;
  if (mins >= 24 * 60) {
    date = addCalendarDays(iso, 1);
    mins -= 24 * 60;
  }
  if (mins < 0) {
    date = addCalendarDays(iso, -1);
    mins += 24 * 60;
  }
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { date, time: `${hour12}:${pad(m)} ${period}` };
}

function timeToMinutesSafe(label: string): number {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 9 * 60;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const period = m[3].toUpperCase();
  if (period === "AM") {
    if (h === 12) h = 0;
  } else if (h !== 12) {
    h += 12;
  }
  return h * 60 + min;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function uniqueStrings(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.trim();
    if (!key || seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    out.push(key);
  }
  return out;
}

const PREP_STORE = "pp.visitPrep.";

export function loadPrepChecked(id: string): string[] {
  try {
    const raw = localStorage.getItem(PREP_STORE + id);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function savePrepChecked(id: string, items: string[]): void {
  try {
    localStorage.setItem(PREP_STORE + id, JSON.stringify(items));
  } catch {
    /* demo */
  }
}
