/**
 * One patient-facing journey model for every booked event:
 * consult / hospital OPD, lab, pharmacy, home care, technician, ambulance.
 *
 * Stage is only pre | post | cancelled so the UI stays simple.
 */

import {
  DEMO_FINDINGS,
  DEMO_REPORTS,
  getAppointment,
  getProvider,
  nextOpenSlots,
  updateAppointmentSlot,
  updateAppointmentStatus,
  type Appointment,
} from "@/lib/appointments";
import { findPatientConsult, findPatientReport } from "@/lib/patientRecords";
import {
  canCancelVisit,
  awaitingStatusLabel,
  canJoinVirtual,
  formatVisitWhen,
  healthTips,
  mapsQueryForVisit,
  phaseLabel,
  phaseLede,
  visitAskGuide,
  lifestyleAskTopics,
  offeredSlotsFor,
  rebookHref,
  receiptHref,
  visitCountdown,
  visitDisclaimer,
  visitEmergencyNote,
  visitFaqs,
  visitHref,
  visitPhase,
  visitTypeLabel,
  type VisitPhase,
} from "@/lib/appointmentGuide";
import {
  careWorkerKindLabel,
  getCareWorker,
  getCareWorkerBooking,
  updateCareWorkerBookingStatus,
  type CareWorkerBooking,
} from "@/lib/careWorkers";
import {
  getHealthService,
  getServiceRequest,
  healthServiceCategoryLabel,
  updateServiceRequestStatus,
  type ServiceRequest,
} from "@/lib/healthServices";
import { getLab, getLabBooking, updateLabBookingStatus, type LabBooking } from "@/lib/labs";
import {
  LAB_TRACK_STEPS,
  TRANSFER_TRACK_STEPS,
  canCancelOrder,
  cancelOrder,
  getOrder,
  labStatusLabel,
  statusMeta,
  transferStatusLabel,
  transferStepIndex,
  typeMeta,
  updateOrder,
  type Order,
} from "@/lib/orders";

export type CareKind = "visit" | "lab" | "order" | "care" | "service";

export type CareLine =
  | "consult"
  | "opd"
  | "surgery"
  | "inward"
  | "lab"
  | "pharmacy"
  | "refill"
  | "transfer"
  | "homecare"
  | "nurse"
  | "technician"
  | "ambulance"
  | "urgent"
  | "oxygen"
  | "crisis"
  | "courier"
  | "nurseline";

export type JourneyStage = "pre" | "post" | "cancelled";

export type CareTab = "overview" | "notes" | "prescription" | "reports" | "follow-up";

export type PrepItem = { id: string; title: string; hint: string };
export type AftercareItem = { id: string; title: string; body: string };
export type HelpfulCard = { title: string; body: string };
export type TrackState = { steps: string[]; current: number };

export type CareEvent = {
  kind: CareKind;
  line: CareLine;
  id: string;
  href: string;
  backTo: string;
  backLabel: string;
  confirmationNo: string;
  statusLabel: string;
  headline: string;
  lede: string;
  whenLabel: string;
  providerName: string;
  providerImage?: string;
  credentials: string;
  visitTypeLabel: string;
  locationLabel: string;
  mapsQuery: string;
  patientName: string;
  fee?: number;
  stage: JourneyStage;
  canCancel: boolean;
  canJoin: boolean;
  messageHref: string;
  rebookHref?: string;
  receiptHref?: string;
  stats: { patients: string; years: string; rating: string };
  prep: PrepItem[];
  aftercare: AftercareItem[];
  helpful: HelpfulCard[];
  warningSigns: string[];
  emergencyNote: string;
  disclaimer: string;
  faqs: { q: string; a: string }[];
  prepGuide?: { title: string; items: { q: string; why: string }[] }[];
  notes?: string;
  symptoms?: string;
  reports: { id: string; title: string; detail: string }[];
  findings: { id: string; title: string; detail: string }[];
  prescription?: AftercareItem;
  followUp?: AftercareItem;
  summary?: AftercareItem;
  track?: TrackState;
  awaiting?: boolean;
  issue?: { kind: "cancelled" | "not_attempted" | "unavailable"; title: string; body: string };
  offeredSlots?: { date: string; time: string; label: string }[];
  cancelTitle: string;
  cancelBody: string;
  city?: string;
  excludeRelatedId?: string;
  relatedOnly?: "hospital" | "clinic" | "doctor";
  heroFacts: { k: string; v: string }[];
};

export function careEventHref(kind: CareKind, id: string): string {
  switch (kind) {
    case "visit":
      return `/appointments/visit/${id}`;
    case "lab":
      return `/appointments/labs/visit/${id}`;
    case "order":
      return `/orders/${id}`;
    case "care":
      return `/appointments/assistants/visit/${id}`;
    case "service":
      return `/appointments/services/request/${id}`;
  }
}

export function resolveCareEvent(kind: CareKind, id: string | undefined): CareEvent | null {
  if (!id) return null;
  if (kind === "visit") {
    const a = getAppointment(id);
    return a ? fromAppointment(a) : null;
  }
  if (kind === "lab") {
    const b = getLabBooking(id);
    return b ? fromLab(b) : null;
  }
  if (kind === "order") {
    const o = getOrder(id);
    if (!o) return null;
    if (o.type === "lab" && o.labBookingId) {
      const b = getLabBooking(o.labBookingId);
      if (b) return fromLab(b);
    }
    return fromOrder(o);
  }
  if (kind === "care") {
    const b = getCareWorkerBooking(id);
    return b ? fromCare(b) : null;
  }
  const r = getServiceRequest(id);
  return r ? fromService(r) : null;
}

export function cancelCareEvent(event: CareEvent): void {
  if (event.kind === "visit") updateAppointmentStatus(event.id, "cancelled");
  else if (event.kind === "lab") {
    updateLabBookingStatus(event.id, "cancelled");
    const b = getLabBooking(event.id);
    if (b?.orderId) cancelOrder(b.orderId);
  } else if (event.kind === "order") {
    const o = cancelOrder(event.id);
    if (o?.labBookingId) updateLabBookingStatus(o.labBookingId, "cancelled");
  } else if (event.kind === "care") updateCareWorkerBookingStatus(event.id, "cancelled");
  else updateServiceRequestStatus(event.id, "cancelled");
}

export function acceptCareSlot(event: CareEvent, date: string, time: string): void {
  if (event.kind === "visit") updateAppointmentSlot(event.id, date, time, "upcoming");
}

/** Demo-only: unlock aftercare without waiting for the calendar. */
export function completeCareEvent(event: CareEvent): void {
  if (event.kind === "visit") updateAppointmentStatus(event.id, "completed");
  else if (event.kind === "lab") {
    updateLabBookingStatus(event.id, "completed");
    const b = getLabBooking(event.id);
    if (b?.orderId) updateOrder(b.orderId, { status: "delivered" });
  } else if (event.kind === "order") updateOrder(event.id, { status: "delivered" });
  else if (event.kind === "care") updateCareWorkerBookingStatus(event.id, "completed");
  else updateServiceRequestStatus(event.id, "completed");
}

const SIGNS = ["Chest pain", "Trouble breathing", "Fainting", "Severe bleeding"];

function stageFromVisit(phase: VisitPhase): JourneyStage {
  if (phase === "cancelled" || phase === "unavailable" || phase === "missed") return "cancelled";
  if (phase === "completed") return "post";
  return "pre";
}

function headlineForVisit(a: Appointment, phase: VisitPhase): string {
  if (phase === "completed") return "This visit is complete.";
  if (phase === "cancelled") return "This visit was cancelled.";
  if (phase === "missed") return "This visit was not attempted.";
  if (phase === "unavailable") {
    if (a.providerKind === "hospital") return "The hospital cannot make this time.";
    if (a.providerKind === "clinic") return "The clinic cannot make this time.";
    return "The doctor cannot make this time.";
  }
  if (phase === "pending") {
    if (a.providerKind === "hospital") return "Your request is with the hospital.";
    if (a.providerKind === "clinic") return "Your request is with the clinic.";
    return "Your request is with the doctor.";
  }
  if (phase === "in-progress" || phase === "starting-soon") return "Your visit is starting.";
  const count = visitCountdown(a, phase);
  if (count?.startsWith("Tomorrow")) return "Your visit is tomorrow.";
  if (phase === "today") return "Your visit is today.";
  return "Your visit is booked.";
}

function visitOfferedSlots(a: Appointment): NonNullable<CareEvent["offeredSlots"]> {
  const slotId = a.clinicianId && a.clinicianId !== a.providerId ? a.clinicianId : a.providerId;
  const live = nextOpenSlots(slotId, a.visitType, a.date, a.time, 3);
  const source = live.length
    ? live
    : offeredSlotsFor().map((s) => ({ date: s.date, time: s.time }));
  return source.map((s) => ({
    date: s.date,
    time: s.time,
    label: formatVisitWhen(s.date, s.time),
  }));
}

function visitIssue(a: Appointment, phase: VisitPhase): CareEvent["issue"] {
  if (phase === "cancelled") {
    return {
      kind: "cancelled",
      title: "This booking is cancelled",
      body: "The slot is released. Rebook if you still need care — notes, reports, and the receipt stay on this page.",
    };
  }
  if (phase === "missed") {
    return {
      kind: "not_attempted",
      title: "This visit was not attempted",
      body: "The booked time passed without a consult. Choose a new opening below, or message the care team. Nothing from this request is lost.",
    };
  }
  if (phase === "unavailable") {
    const who = a.providerKind === "hospital" ? "hospital" : a.providerKind === "clinic" ? "clinic" : "doctor";
    return {
      kind: "unavailable",
      title: `The ${who} is not available at this time`,
      body: "They asked you to pick a later slot. Confirm one of the openings below, or browse the full calendar.",
    };
  }
  return undefined;
}

function lineFromAppointment(a: Appointment): CareLine {
  const kind = a.facilityServiceKind;
  if (kind === "surgery") return "surgery";
  if (kind === "inward") return "inward";
  if (kind === "lab" || kind === "imaging" || kind === "diagnostics") return "lab";
  if (kind === "pharmacy") return "pharmacy";
  if (kind === "ambulance") return "ambulance";
  if (kind === "executive") return "consult";
  if (kind === "rehab") return "consult";
  if (kind === "emergency") return "urgent";
  if (a.providerKind === "hospital") return "opd";
  return "consult";
}

function visitTypeForLine(a: Appointment, line: CareLine): string {
  if (a.facilityServiceLabel) return a.facilityServiceLabel;
  if (line === "opd") return "OPD · In-clinic";
  if (line === "surgery") return "Day surgery";
  if (line === "inward") return "In-ward";
  if (line === "lab") return "Lab / diagnostics";
  return visitTypeLabel(a.visitType);
}

function fromAppointment(a: Appointment): CareEvent {
  const provider = getProvider(a.providerId);
  const phase = visitPhase(a);
  const stage = stageFromVisit(phase);
  const facilityVisit = a.providerKind === "hospital" || a.providerKind === "clinic";
  const consultant =
    a.clinicianName && a.clinicianName !== a.providerName ? a.clinicianName : null;
  const name = facilityVisit ? a.providerName : a.clinicianName || a.providerName;
  const line = lineFromAppointment(a);
  const query = mapsQueryForVisit(a, provider);
  const tips = healthTips(a.specialtyId).map((t) => ({ title: t.title, body: t.body }));
  const reports = (a.reportIds ?? [])
    .map((rid) => DEMO_REPORTS.find((r) => r.id === rid) ?? findPatientReport(rid))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({ id: r.id, title: r.title, detail: `${r.detail} · ${r.date}` }));
  const findings = (a.findingIds ?? [])
    .map((fid) => DEMO_FINDINGS.find((f) => f.id === fid) ?? findPatientConsult(fid))
    .filter((f): f is NonNullable<typeof f> => Boolean(f))
    .map((f) => ({ id: f.id, title: f.title, detail: f.detail }));
  const catalog = catalogFor(line);
  const rx = stage === "post" ? catalog.after.find((x) => x.id === "rx") : undefined;

  return {
    kind: "visit",
    line,
    id: a.id,
    href: visitHref(a.id),
    backTo: "/appointments",
    backLabel: "Appointments",
    confirmationNo: a.confirmationNo,
    statusLabel:
      phase === "pending"
        ? awaitingStatusLabel(a.providerKind)
        : phase === "unavailable"
          ? phaseLabel(phase, a.providerKind)
          : phase === "cancelled"
            ? "Cancelled"
            : phase === "missed"
              ? "Not attempted"
              : phase === "completed"
                ? "Completed"
                : "Confirmed session",
    headline: headlineForVisit(a, phase),
    lede: phaseLede(a, phase),
    whenLabel: formatVisitWhen(a.date, a.time),
    providerName: name,
    providerImage: provider?.imageUrl,
    credentials: [consultant, a.specialtyLabel].filter(Boolean).join(" · ") || a.specialtyLabel,
    visitTypeLabel: visitTypeForLine(a, line),
    locationLabel: a.clinicName || provider?.city || (a.visitType === "virtual" ? "Virtual" : "Clinic"),
    mapsQuery: a.visitType === "clinic" ? query : "",
    patientName: a.patientName,
    fee: a.fee,
    stage,
    canCancel: canCancelVisit(phase),
    canJoin: canJoinVirtual(a, phase),
    awaiting: phase === "pending",
    issue: visitIssue(a, phase),
    offeredSlots: phase === "unavailable" || phase === "missed" ? visitOfferedSlots(a) : undefined,
    messageHref: "/messages",
    rebookHref: stage === "pre" ? undefined : rebookHref(a),
    receiptHref: receiptHref(a.id),
    stats: {
      patients: provider?.reviewCount ? `${provider.reviewCount}+` : "500+",
      years: provider?.experienceYears ? `${provider.experienceYears}+` : "10+",
      rating: provider ? String(provider.rating) : "4.9",
    },
    prep: catalog.prep,
    aftercare: facilityVisit
      ? catalog.after.map((item) =>
          item.id === "rx"
            ? { ...item, body: `Issued under ${a.providerName}${consultant ? ` with ${consultant}` : ""}. ${item.body}` }
            : item.id === "reports"
              ? { ...item, body: `Filed under ${a.providerName}. ${item.body}` }
              : item,
        )
      : catalog.after,
    helpful: tips.length
      ? tips.slice(0, 3)
      : [
          { title: "Notice the change", body: "Write when symptoms started and what changed — dates help more than adjectives." },
          { title: "Know what you’re taking", body: "List every current medicine and supplement, including dose." },
          { title: "Know what you want answered", body: "Two or three questions keep the slot focused." },
        ],
    warningSigns: SIGNS,
    emergencyNote: visitEmergencyNote(),
    disclaimer: visitDisclaimer(),
    faqs: visitFaqs(a, phase),
    prepGuide: visitAskGuide(a.specialtyId),
    notes: a.notes,
    symptoms: a.symptoms,
    reports,
    findings,
    prescription:
      rx && facilityVisit
        ? {
            ...rx,
            body: `Issued under ${a.providerName}${consultant ? ` with ${consultant}` : ""}. ${rx.body}`,
          }
        : rx,
    followUp: stage === "post" ? catalog.after.find((x) => x.id === "follow") : undefined,
    summary: stage === "post" ? catalog.after.find((x) => x.id === "summary") : undefined,
    cancelTitle: "Cancel this visit?",
    cancelBody: facilityVisit
      ? `You can rebook at this ${a.providerKind} afterwards. Demo bookings are not a real clinic charge.`
      : "You can rebook the same clinician afterwards. Demo bookings are not a real clinic charge.",
    city: provider?.city,
    excludeRelatedId: provider?.id,
    relatedOnly: a.providerKind === "hospital" ? "hospital" : a.providerKind === "clinic" ? "clinic" : "doctor",
    heroFacts: [
      { k: "Date & time", v: formatVisitWhen(a.date, a.time) },
      { k: "Provider", v: name },
      ...(consultant ? [{ k: "Consultant", v: consultant }] : []),
      { k: "Visit type", v: visitTypeForLine(a, line) },
      { k: "Location", v: a.clinicName || provider?.city || (a.visitType === "virtual" ? "Virtual" : "Clinic") },
    ],
  };
}

function fromLab(b: LabBooking): CareEvent {
  const lab = getLab(b.labId);
  const awaiting = b.status === "pending";
  const past = !awaiting && (b.status === "completed" || b.date < new Date().toISOString().slice(0, 10));
  const stage: JourneyStage = b.status === "cancelled" ? "cancelled" : past || b.status === "completed" ? "post" : "pre";
  const when = formatVisitWhen(b.date, b.time);
  return {
    kind: "lab",
    line: "lab",
    id: b.id,
    href: careEventHref("lab", b.id),
    backTo: "/appointments",
    backLabel: "Appointments",
    confirmationNo: b.confirmationNo,
    statusLabel: awaiting ? "Awaiting lab" : stage === "cancelled" ? "Cancelled" : stage === "post" ? "Results window" : "Confirmed session",
    headline: awaiting
      ? "Your request is with the lab."
      : stage === "post"
        ? "This lab visit is complete."
        : stage === "cancelled"
          ? "This lab visit was cancelled."
          : headlineFromWhen(b.date, "lab"),
    lede: awaiting
      ? `${lab?.name ?? b.labName} still needs to accept this slot. Do not travel until it is confirmed.`
      : stage === "cancelled"
        ? "This lab visit was cancelled. Book again if you still need the draw — the receipt stays on this page."
        : stage === "pre"
          ? `${b.itemNames} at ${lab?.name ?? b.labName}. Arrive a little early and bring photo ID.`
          : "Open results and the follow-up note when they are ready on this page.",
    whenLabel: when,
    providerName: lab?.name ?? b.labName,
    credentials: lab?.subtitle ?? "Diagnostics",
    visitTypeLabel: "Lab visit",
    locationLabel: lab ? `${lab.address}` : b.labName,
    mapsQuery: lab ? `${lab.address}, ${lab.city}` : "",
    patientName: b.patientName || "You",
    fee: b.fee,
    stage,
    canCancel: stage === "pre",
    canJoin: false,
    awaiting,
    issue:
      b.status === "cancelled"
        ? {
            kind: "cancelled",
            title: "This lab visit is cancelled",
            body: "The slot is released. Book again if you still need the draw — the receipt stays on this page.",
          }
        : undefined,
    messageHref: "/messages",
    rebookHref: lab ? `/appointments/labs/${lab.id}` : "/appointments",
    receiptHref: b.orderId ? `/orders/${b.orderId}/receipt` : undefined,
    stats: {
      patients: "1,200+",
      years: "8+",
      rating: lab ? String(lab.rating) : "4.6",
    },
    prep: catalogFor("lab").prep,
    aftercare: catalogFor("lab").after,
    helpful: [
      { title: "Fasting if this panel needs it", body: "Water is usually fine. Skip food only when the test card says fasting." },
      { title: "Bring previous reports", body: "A prior CBC or imaging disc helps the technician and your doctor compare." },
      { title: "Wear a loose sleeve", body: "Blood draws are quicker when the arm is easy to reach." },
    ],
    warningSigns: SIGNS,
    emergencyNote: visitEmergencyNote(),
    disclaimer: visitDisclaimer(),
    faqs: [
      { q: "When should I arrive?", a: "Plan for 10 minutes before the slot so reception can check you in." },
      { q: "How long until results?", a: "Most blood work is 1–2 days on this demo. Imaging notes appear on the Reports tab after the visit." },
      { q: "Can I still cancel?", a: "Yes, from this page before the slot. You can book another time at the same centre." },
    ],
    prepGuide: [
      {
        title: "This lab visit",
        items: [
          { q: "Do I need to fast, and until when?", why: "Wrong fasting can delay the draw or skew the result." },
          { q: "When and how will I get results?", why: "You leave knowing whether to wait on the portal or call." },
          { q: "Should my doctor review these with me?", why: "Some panels need a consult, not only a PDF." },
        ],
      },
      ...lifestyleAskTopics(),
    ],
    reports: b.itemIds.map((id) => ({ id, title: b.itemNames, detail: "Selected for this visit" })).slice(0, 1),
    findings: [],
    summary: stage === "post" ? catalogFor("lab").after.find((x) => x.id === "summary") : undefined,
    followUp: stage === "post" ? catalogFor("lab").after.find((x) => x.id === "follow") : undefined,
    cancelTitle: "Cancel this lab visit?",
    cancelBody: "You can book another slot at the same centre. Demo visits are not billed to a real lab.",
    city: lab?.city,
    heroFacts: [
      { k: "Date & time", v: when },
      { k: "Lab", v: lab?.name ?? b.labName },
      { k: "Visit type", v: "Lab visit" },
      { k: "Location", v: lab ? lab.address : b.labName },
    ],
  };
}

function fromOrder(o: Order): CareEvent {
  const delivered = o.status === "delivered";
  const cancelled = o.status === "cancelled";
  const stage: JourneyStage = cancelled ? "cancelled" : delivered ? "post" : "pre";
  const isTransfer = o.type === "transfer";
  const line: CareLine = o.type === "refill" ? "refill" : o.type === "transfer" ? "transfer" : "pharmacy";
  const title = o.items[0]?.name ?? typeMeta[o.type].label;
  const steps = isTransfer ? [...TRANSFER_TRACK_STEPS] : o.type === "lab" ? [...LAB_TRACK_STEPS] : ["Order placed", "Processing", "Out for delivery", "Delivered"];
  const current = cancelled
    ? 0
    : isTransfer
      ? transferStepIndex(o.status)
      : o.status === "delivered"
        ? 3
        : o.status === "out_for_delivery"
          ? 2
          : o.status === "processing"
            ? 1
            : 0;
  const statusLabel = isTransfer
    ? transferStatusLabel(o.status)
    : o.type === "lab"
      ? labStatusLabel(o.status)
      : statusMeta[o.status].label;

  return {
    kind: "order",
    line,
    id: o.id,
    href: careEventHref("order", o.id),
    backTo: "/orders",
    backLabel: "Order history",
    confirmationNo: o.invoiceNo || o.id,
    statusLabel,
    headline: cancelled
      ? "This order was cancelled."
      : delivered
        ? "Your order has arrived."
        : o.status === "out_for_delivery"
          ? "Your order is on the way."
          : "Your pharmacy is preparing this.",
    lede: cancelled
      ? "This order was cancelled. You can start a new fill if you still need the medicine. The receipt stays on this page."
      : isTransfer
        ? "We’ll contact the source pharmacy, then PocketPills can fill when the file arrives."
        : "Insurance is estimated first. Message the pharmacist if the label looks wrong.",
    whenLabel: o.visitSlot || o.date,
    providerName: o.pharmacyName || o.fromPharmacy || "PocketPills pharmacy",
    credentials: typeMeta[o.type].label,
    visitTypeLabel: typeMeta[o.type].label,
    locationLabel: o.address || "Delivery",
    mapsQuery: o.address || "",
    patientName: o.patient,
    fee: undefined,
    stage,
    canCancel: canCancelOrder(o),
    canJoin: false,
    issue: cancelled
      ? {
          kind: "cancelled",
          title: "This order is cancelled",
          body: "You can start a new fill if you still need the medicine. The receipt stays on this page.",
        }
      : undefined,
    messageHref: `/messages?with=care&order=${encodeURIComponent(o.id)}`,
    rebookHref: isTransfer ? "/transfer" : "/fill",
    receiptHref: `/orders/${o.id}/receipt`,
    stats: { patients: "800k+", years: "10+", rating: "4.8" },
    prep: catalogFor(line).prep,
    aftercare: catalogFor(line).after,
    helpful: [
      { title: "Keep the current bottle", body: "The pharmacist may ask what you already take, including strength." },
      { title: "Check the delivery address", body: "Edits after dispatch are hard. Confirm it before the order leaves." },
      { title: "One offer per payment", body: "Insurance still bills first. Apply a code on the related-offers card at checkout." },
    ],
    warningSigns: ["Severe allergic reaction", "Trouble breathing", "Swelling of the face"],
    emergencyNote: "A severe drug reaction needs emergency care. Do not wait for this delivery.",
    disclaimer: visitDisclaimer(),
    faqs: [
      { q: "When will this arrive?", a: "Status on this page moves from verifying to out for delivery, then delivered. Demo orders are not a real shipment." },
      { q: "Can I still cancel?", a: "Yes until it leaves the pharmacy. Cancel from this page." },
      { q: "Who do I message?", a: "Use Message care team — the pharmacist thread stays on this order." },
    ],
    reports: o.items.map((item, i) => ({
      id: `${o.id}-${i}`,
      title: item.name,
      detail: `${item.strength} · qty ${item.qty}`,
    })),
    findings: [],
    prescription: {
      id: "rx",
      title,
      body: o.items.map((i) => `${i.name} ${i.strength} × ${i.qty}`).join("\n"),
    },
    followUp: stage === "post" ? catalogFor(line).after.find((x) => x.id === "follow") : undefined,
    summary: stage === "post" ? catalogFor(line).after.find((x) => x.id === "summary") : undefined,
    track: { steps, current },
    cancelTitle: isTransfer ? "Stop this transfer?" : "Cancel this order?",
    cancelBody: isTransfer
      ? "We’ll stop contacting your pharmacy. You can start a new transfer anytime."
      : "We’ll stop processing this fill. You won’t be charged if payment hasn’t settled.",
    heroFacts: [
      { k: "Placed", v: o.visitSlot || o.date },
      { k: "Pharmacy", v: o.pharmacyName || o.fromPharmacy || "PocketPills pharmacy" },
      { k: "Order type", v: typeMeta[o.type].label },
      { k: "Address", v: o.address || "Delivery" },
    ],
  };
}

function fromCare(b: CareWorkerBooking): CareEvent {
  const worker = getCareWorker(b.workerId);
  const awaiting = b.status === "pending";
  const past = !awaiting && (b.status === "completed" || b.date < new Date().toISOString().slice(0, 10));
  const stage: JourneyStage = b.status === "cancelled" ? "cancelled" : past || b.status === "completed" ? "post" : "pre";
  const line: CareLine =
    b.kind === "home-care" ? "homecare" : b.kind === "nurse" ? "nurse" : "technician";
  const visit =
    b.visitType === "home" ? "Home visit" : b.visitType === "virtual" ? "Virtual visit" : "Clinic visit";
  return {
    kind: "care",
    line,
    id: b.id,
    href: careEventHref("care", b.id),
    backTo: "/appointments",
    backLabel: "Appointments",
    confirmationNo: b.confirmationNo,
    statusLabel: awaiting ? "Awaiting confirmation" : stage === "cancelled" ? "Cancelled" : stage === "post" ? "Completed" : "Confirmed session",
    headline: awaiting
      ? `Your request is with ${b.workerName}.`
      : stage === "post"
        ? "This visit is complete."
        : stage === "cancelled"
          ? "This visit was cancelled."
          : headlineFromWhen(b.date, "visit"),
    lede: awaiting
      ? "They still need to accept this visit. Do not travel or join until it is confirmed."
      : stage === "cancelled"
        ? "This visit was cancelled. You can book the same person again."
        : `${b.service} with ${b.workerName}. ${visit}.`,
    whenLabel: formatVisitWhen(b.date, b.time),
    providerName: b.workerName,
    providerImage: worker?.imageUrl,
    credentials: careWorkerKindLabel(b.kind),
    visitTypeLabel: visit,
    locationLabel: worker?.city || visit,
    mapsQuery: b.visitType === "home" || b.visitType === "clinic" ? worker?.city || "" : "",
    patientName: b.patientName || "You",
    fee: b.fee,
    stage,
    canCancel: stage === "pre",
    canJoin: b.visitType === "virtual" && stage === "pre" && !awaiting,
    awaiting,
    issue:
      b.status === "cancelled"
        ? {
            kind: "cancelled",
            title: "This visit is cancelled",
            body: "You can book the same person again. Notes from this request stay on this page.",
          }
        : undefined,
    messageHref: "/messages",
    rebookHref: `/appointments/assistants/${b.workerId}`,
    stats: {
      patients: "400+",
      years: worker ? `${worker.experienceYears}+` : "6+",
      rating: worker ? String(worker.rating) : "4.8",
    },
    prep: catalogFor(line).prep,
    aftercare: catalogFor(line).after,
    helpful: [
      { title: "Clear a workspace", body: "Wound care and vitals go faster with a table, good light, and a chair." },
      { title: "Pets and access", body: "Note buzzers, parking, or a dog — the visitor can plan the arrival." },
      { title: "Have supplies in view", body: "Dressings you already use, or the injection the clinician ordered." },
    ],
    warningSigns: SIGNS,
    emergencyNote: visitEmergencyNote(),
    disclaimer: visitDisclaimer(),
    faqs: [
      { q: "Can I still cancel?", a: "Yes from this page before the slot. You can book the same person again." },
      { q: "What if I am late?", a: "Message the care team. Home visits have a short wait window on this demo." },
      { q: "Will I get a prescription?", a: "Only a licensed clinician can prescribe. Assistants and home-care staff follow the plan already on file." },
    ],
    prepGuide: [
      {
        title: "This visit",
        items: [
          { q: "What will you do today, and how long will it take?", why: "You can clear the room and plan the rest of the day." },
          { q: "What should I have ready when you arrive?", why: "Supplies and access notes save a second trip." },
          { q: "When should I message if something looks worse after?", why: "Home visits still need a clear ‘call back if’ line." },
        ],
      },
      ...lifestyleAskTopics(),
    ],
    reports: [],
    findings: [],
    summary: stage === "post" ? catalogFor(line).after.find((x) => x.id === "summary") : undefined,
    followUp: stage === "post" ? catalogFor(line).after.find((x) => x.id === "follow") : undefined,
    cancelTitle: "Cancel this visit?",
    cancelBody: "You can book the same person afterwards. Demo visits are not a real home-care charge.",
    city: worker?.city,
    heroFacts: [
      { k: "Date & time", v: formatVisitWhen(b.date, b.time) },
      { k: "Provider", v: b.workerName },
      { k: "Visit type", v: visit },
      { k: "Location", v: worker?.city || visit },
    ],
  };
}

function lineFromService(r: ServiceRequest): CareLine {
  if (r.serviceId === "svc-home-oxygen") return "oxygen";
  if (r.serviceId === "svc-mental-crisis") return "crisis";
  if (r.serviceId === "svc-pharmacy-delivery") return "courier";
  if (r.serviceId === "svc-after-hours") return "nurseline";
  if (r.category === "ambulance") return "ambulance";
  return "urgent";
}

function fromService(r: ServiceRequest): CareEvent {
  const service = getHealthService(r.serviceId);
  const stage: JourneyStage = r.status === "cancelled" ? "cancelled" : r.status === "completed" ? "post" : "pre";
  const line = lineFromService(r);
  const typeLabel =
    line === "oxygen"
      ? "Home oxygen"
      : line === "crisis"
        ? "Crisis support"
        : line === "courier"
          ? "Medicine courier"
          : line === "nurseline"
            ? "Nurse line"
            : healthServiceCategoryLabel(r.category);
  const addressLabel = line === "ambulance" ? "Pickup" : line === "crisis" || line === "nurseline" ? "Your location" : "Delivery address";
  const copy = serviceJourneyCopy(line, r);

  return {
    kind: "service",
    line,
    id: r.id,
    href: careEventHref("service", r.id),
    backTo: "/appointments",
    backLabel: "Appointments",
    confirmationNo: r.confirmationNo,
    statusLabel: stage === "cancelled" ? "Cancelled" : stage === "post" ? "Completed" : "Request open",
    headline: copy.headline,
    lede: copy.lede,
    whenLabel: new Date(r.createdAt).toLocaleString(),
    providerName: r.serviceName,
    credentials: typeLabel,
    visitTypeLabel: typeLabel,
    locationLabel: r.address || addressLabel,
    mapsQuery: r.address || "",
    patientName: "You",
    fee: service?.feeFrom,
    stage,
    canCancel: stage === "pre",
    canJoin: false,
    issue:
      r.status === "cancelled"
        ? {
            kind: "cancelled",
            title: copy.headline.replace(/\.$/, ""),
            body: copy.cancelBody,
          }
        : undefined,
    messageHref: "/messages",
    rebookHref: `/appointments/services/${r.serviceId}`,
    stats: { patients: "24/7", years: "15+", rating: "4.7" },
    prep: catalogFor(line).prep,
    aftercare: catalogFor(line).after,
    helpful: copy.helpful,
    warningSigns: line === "crisis" ? ["Thoughts of self-harm", "Cannot stay safe right now", "Someone with you is in danger"] : SIGNS,
    emergencyNote: copy.emergencyNote,
    disclaimer: visitDisclaimer(),
    faqs: copy.faqs,
    notes: r.notes,
    reports: [],
    findings: [],
    summary: stage === "post" ? catalogFor(line).after.find((x) => x.id === "summary") : undefined,
    followUp: stage === "post" ? catalogFor(line).after.find((x) => x.id === "follow") : undefined,
    cancelTitle: copy.cancelTitle,
    cancelBody: copy.cancelBody,
    heroFacts: [
      { k: "Requested", v: new Date(r.createdAt).toLocaleString() },
      { k: "Service", v: r.serviceName },
      { k: "Type", v: typeLabel },
      { k: addressLabel, v: r.address || "—" },
    ],
  };
}

function serviceJourneyCopy(line: CareLine, r: ServiceRequest): {
  headline: string;
  lede: string;
  helpful: HelpfulCard[];
  faqs: { q: string; a: string }[];
  emergencyNote: string;
  cancelTitle: string;
  cancelBody: string;
} {
  const eta = r.etaMinutes != null ? `Estimated response about ${r.etaMinutes} minutes. Keep this phone on.` : "Our team will follow up on this request.";
  if (line === "oxygen") {
    return {
      headline: r.status === "completed" ? "Oxygen support is complete." : r.status === "cancelled" ? "This oxygen request was cancelled." : "Home oxygen is being arranged.",
      lede:
        r.status === "cancelled"
          ? "This request was cancelled. Start again if you still need equipment delivered."
          : r.status === "completed"
            ? "Open Next steps for concentrator teaching and ADP paperwork on this demo."
            : "A technician delivers and sets up equipment. This is not a prescription and not a clinic visit.",
      helpful: [
        { title: "Someone should be home", body: "Tanks and concentrators are handed to a person, not left at the door." },
        { title: "Clear a path", body: "Note stairs, elevator, or a tight hallway so the technician can plan." },
        { title: "Keep using your current oxygen", body: "Do not stop prescribed oxygen while you wait for this delivery." },
      ],
      faqs: [
        { q: "Is this a prescription?", a: "No. Home oxygen support is equipment and teaching. A clinician still has to order oxygen therapy separately." },
        { q: "Will lab reports appear here?", a: "No. Blood gas or sleep-study results stay on the lab or clinic visit that ordered them." },
        { q: "Can I cancel?", a: "Yes from this page before the technician is en route." },
      ],
      emergencyNote: "Sudden trouble breathing is an emergency — call 911. Do not wait on this delivery.",
      cancelTitle: "Cancel this oxygen request?",
      cancelBody: "Cancel only if you no longer need equipment delivered. Demo requests are not a real dispatch.",
    };
  }
  if (line === "crisis") {
    return {
      headline: r.status === "completed" ? "This support request is complete." : r.status === "cancelled" ? "This support request was cancelled." : "We're connecting you to support.",
      lede:
        r.status === "cancelled"
          ? "This request was cancelled. If you are in danger now, call 911 or 988."
          : "A crisis worker will take this line. This page is not a substitute for 911 or 988.",
      helpful: [
        { title: "Stay on this phone", body: "Keep the line free so the worker can reach you." },
        { title: "You can have someone with you", body: "A friend or family member can sit in if that feels safer." },
        { title: "This is not a prescription visit", body: "Crisis support can connect you to care. It does not issue medicines or lab reports." },
      ],
      faqs: [
        { q: "Should I call 988 or 911 instead?", a: "Yes if you cannot stay safe. 988 is the suicide and crisis line. 911 is for immediate danger." },
        { q: "Will I get a prescription here?", a: "No. This request is support and routing, not a clinic consult." },
      ],
      emergencyNote: "If you cannot stay safe, call 911 or 988 now. This demo request is not a live crisis dispatch.",
      cancelTitle: "Cancel this support request?",
      cancelBody: "Only cancel if you no longer need a callback. If you are in danger, call 911 or 988.",
    };
  }
  if (line === "courier") {
    return {
      headline: r.status === "completed" ? "The courier drop-off is complete." : r.status === "cancelled" ? "This courier request was cancelled." : "A courier is being arranged.",
      lede:
        r.status === "cancelled"
          ? "This courier request was cancelled. Start a pharmacy fill if you still need the medicine."
          : "Same-day drop-off for a time-sensitive fill. The prescription itself lives on your pharmacy order — not on this page.",
      helpful: [
        { title: "Someone to receive", body: "Couriers cannot leave controlled or refrigerated meds unattended." },
        { title: "Confirm the address", body: "Message a change before the rider leaves." },
        { title: "This is not a new prescription", body: "Only a licensed clinician can prescribe. This request only moves a fill already on file." },
      ],
      faqs: [
        { q: "Where is my prescription?", a: "On the pharmacy order that this courier is tied to. This page only tracks the drop-off." },
        { q: "Can I cancel?", a: "Yes until the rider is en route." },
      ],
      emergencyNote: "A severe drug reaction needs emergency care. Do not wait for this courier.",
      cancelTitle: "Cancel this courier request?",
      cancelBody: "We’ll stop the drop-off. Your pharmacy fill is unchanged.",
    };
  }
  if (line === "nurseline") {
    return {
      headline: r.status === "completed" ? "This nurse-line request is complete." : r.status === "cancelled" ? "This nurse-line request was cancelled." : "A nurse will call you.",
      lede:
        r.status === "cancelled"
          ? "This request was cancelled. You can start another after-hours call if you still need advice."
          : eta + " This is triage advice, not a prescription visit.",
      helpful: [
        { title: "Keep this phone on", body: "The nurse calls the number you gave." },
        { title: "Have your medicine list", body: "Dose and timing help them triage safely." },
        { title: "Not a diagnosis", body: "They may send you to urgent care or 911. They do not issue prescriptions here." },
      ],
      faqs: [
        { q: "Will I get a prescription?", a: "No. After-hours nursing is advice and routing. A clinician visit is needed to prescribe." },
        { q: "Should I call 911?", a: "Yes for chest pain, trouble breathing, severe bleeding, or sudden confusion." },
      ],
      emergencyNote: "Life-threatening symptoms: call 911 first. This demo call is not a real nurse dispatch.",
      cancelTitle: "Cancel this nurse-line request?",
      cancelBody: "Cancel if you no longer need a callback. For a real emergency call 911.",
    };
  }
  if (line === "ambulance") {
    return {
      headline: r.status === "completed" ? "This request is complete." : r.status === "cancelled" ? "This request was cancelled." : "Help is on the way.",
      lede:
        r.status === "cancelled"
          ? "This request was cancelled. Book again only if you still need transport. For a real emergency call 911."
          : eta,
      helpful: [
        { title: "Stay where you said", body: "If you move, message the new address immediately." },
        { title: "Keep a light on", body: "Night pickups are faster when the entrance is visible." },
        { title: "Have ID and a medicine list", body: "Crews ask this first. A phone photo is enough." },
      ],
      faqs: [
        { q: "Should I call 911?", a: "Yes for chest pain, trouble breathing, severe bleeding, or sudden confusion. This page is not emergency dispatch." },
        { q: "Can I cancel?", a: "Yes if the situation is resolved and the crew has not arrived — on this demo, cancel from this page." },
      ],
      emergencyNote: "Life-threatening symptoms: call 911 first. This demo request is not a real ambulance dispatch.",
      cancelTitle: "Cancel this request?",
      cancelBody: "Only cancel if you no longer need transport. For a real emergency call 911.",
    };
  }
  return {
    headline: r.status === "completed" ? "This request is complete." : r.status === "cancelled" ? "This request was cancelled." : "Your request is with the desk.",
    lede:
      r.status === "cancelled"
        ? "This request was cancelled. Book again if you still need a same-day spot."
        : eta + " This holds a walk-in slot — it is not a prescription or lab visit.",
    helpful: [
      { title: "Bring photo ID", body: "The desk checks you in against this request." },
      { title: "Know what changed", body: "When symptoms started matters more than a long history." },
      { title: "Not a full consult yet", body: "Prescriptions and reports come from the clinician you see, not from this hold." },
    ],
    faqs: [
      { q: "Will I get a prescription on this page?", a: "No. This request only holds a same-day spot. Any script comes from the clinician visit." },
      { q: "Can I cancel?", a: "Yes from this page before you arrive." },
    ],
    emergencyNote: "Life-threatening symptoms: call 911 first. This demo hold is not a real clinic.",
    cancelTitle: "Cancel this request?",
    cancelBody: "Cancel if you no longer need the walk-in spot.",
  };
}

function headlineFromWhen(date: string, noun: "visit" | "lab"): string {
  const today = new Date().toISOString().slice(0, 10);
  const tmr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const word = noun === "lab" ? "lab visit" : "visit";
  if (date === tmr) return `Your ${word} is tomorrow.`;
  if (date === today) return `Your ${word} is today.`;
  return `Your ${word} is booked.`;
}

const PREP: Record<
  "consult" | "lab" | "pharmacy" | "care" | "ambulance" | "surgery" | "inward" | "oxygen" | "crisis" | "courier" | "nurseline" | "urgent",
  PrepItem[]
> = {
  consult: [
    { id: "story", title: "Your story", hint: "Ready for your doctor." },
    { id: "meds", title: "Medicines", hint: "List every current dose." },
    { id: "docs", title: "Documents", hint: "ID and reports on this visit." },
    { id: "questions", title: "Questions", hint: "Eating, hygiene, and the plan." },
  ],
  lab: [
    { id: "fast", title: "Fasting", hint: "Only if this panel requires it." },
    { id: "id", title: "Photo ID", hint: "Reception will ask." },
    { id: "docs", title: "Previous reports", hint: "Optional, helpful to compare." },
    { id: "questions", title: "Questions", hint: "For the technician or your doctor." },
  ],
  pharmacy: [
    { id: "address", title: "Delivery address", hint: "Confirm before it leaves." },
    { id: "id", title: "ID for pickup", hint: "If you collect in person." },
    { id: "meds", title: "Current medicines", hint: "Avoid a duplicate fill." },
    { id: "plan", title: "Insurance", hint: "Have the card number nearby." },
  ],
  care: [
    { id: "address", title: "Confirm address", hint: "Buzzer and parking notes help." },
    { id: "space", title: "A clear workspace", hint: "Light, chair, and a table." },
    { id: "supplies", title: "Supplies on site", hint: "Dressings or the ordered injection." },
    { id: "questions", title: "Questions", hint: "What you want checked today." },
  ],
  ambulance: [
    { id: "address", title: "Pickup address", hint: "Stay where you said, or message a change." },
    { id: "phone", title: "Phone on", hint: "Crews call from the road." },
    { id: "id", title: "ID and medicine list", hint: "A photo on your phone is enough." },
    { id: "access", title: "Entrance access", hint: "Unlock the door or send the buzzer." },
  ],
  surgery: [
    { id: "fast", title: "Fasting / NPO", hint: "Follow the pre-op card from the hospital." },
    { id: "id", title: "Photo ID and OHIP", hint: "Registration needs both." },
    { id: "meds", title: "Medicine list", hint: "Include blood thinners and supplements." },
    { id: "ride", title: "Ride home", hint: "Day surgery usually needs an escort." },
  ],
  inward: [
    { id: "bag", title: "Overnight bag", hint: "Clothes, chargers, and toiletries." },
    { id: "meds", title: "Current medicines", hint: "In original bottles if you have them." },
    { id: "id", title: "ID and insurance", hint: "Admission desk will copy them." },
    { id: "contact", title: "Emergency contact", hint: "Someone the ward can reach." },
  ],
  oxygen: [
    { id: "address", title: "Delivery address", hint: "Someone should be home to receive equipment." },
    { id: "access", title: "Entrance / stairs", hint: "Elevator, steps, or a tight hallway." },
    { id: "oxygen", title: "Current oxygen use", hint: "What you use now, if anything." },
    { id: "questions", title: "Questions", hint: "For the technician at setup." },
  ],
  crisis: [
    { id: "phone", title: "Phone on", hint: "Keep this line free for the callback." },
    { id: "place", title: "Where you are", hint: "A worker may ask if you can stay safe there." },
    { id: "contact", title: "Someone we can call", hint: "Optional — a friend or family member." },
    { id: "questions", title: "What you need", hint: "For you — nothing here is a diagnosis." },
  ],
  courier: [
    { id: "address", title: "Drop-off address", hint: "Someone should be there to receive." },
    { id: "phone", title: "Phone on", hint: "The rider may call from the lobby." },
    { id: "id", title: "ID at the door", hint: "Needed for some fills." },
    { id: "access", title: "Entrance / access", hint: "Buzzer, parking, or a fridge if the fill needs it." },
  ],
  nurseline: [
    { id: "phone", title: "Phone on", hint: "The nurse calls the number you gave." },
    { id: "story", title: "What changed", hint: "When it started, and how bad it is now." },
    { id: "meds", title: "Current medicines", hint: "Dose and timing help them triage." },
    { id: "questions", title: "Questions", hint: "What you want the nurse to cover." },
  ],
  urgent: [
    { id: "story", title: "What changed", hint: "The desk uses this to route you." },
    { id: "id", title: "Photo ID", hint: "Check-in needs it." },
    { id: "meds", title: "Current medicines", hint: "Including dose if you know it." },
    { id: "questions", title: "Questions", hint: "For the clinician you will see." },
  ],
};

const AFTER: Record<
  "consult" | "lab" | "pharmacy" | "care" | "ambulance" | "surgery" | "inward" | "oxygen" | "crisis" | "courier" | "nurseline" | "urgent",
  AftercareItem[]
> = {
  consult: [
    { id: "summary", title: "Visit summary", body: "Demo note: the clinician reviewed your history and advised a conservative plan. This is not a real chart." },
    { id: "rx", title: "Prescription", body: "No live prescription on this demo. If a clinician prescribed, it would appear here for the pharmacy fill." },
    { id: "follow", title: "Follow-up plan", body: "Message if symptoms worsen. Book a follow-up if you were asked to return in 1–2 weeks." },
    { id: "notes", title: "Doctor’s notes", body: "Educational placeholder only — not a diagnosis." },
    { id: "reports", title: "Reports & documents", body: "Files you shared stay on the Reports tab. New clinic documents would land here after a real visit." },
  ],
  lab: [
    { id: "summary", title: "Visit summary", body: "Collection completed on this demo. Real results would post in 1–2 days." },
    { id: "reports", title: "Results", body: "Open Reports for the panels on this booking. Values are not clinical." },
    { id: "follow", title: "Follow-up plan", body: "Share results with your doctor. Book a consult if you do not already have one." },
    { id: "notes", title: "Technician notes", body: "Fasting status and sample quality would appear here after a real draw." },
  ],
  pharmacy: [
    { id: "summary", title: "Fill summary", body: "This demo fill is marked delivered. Check the label against what you expected." },
    { id: "rx", title: "Medication list", body: "Your filled items are on the Medicines tab of this order." },
    { id: "follow", title: "Refill reminder", body: "Ask the pharmacist before you run out. Do not change a dose on your own." },
    { id: "notes", title: "Pharmacist notes", body: "Counselling points would appear here on a live fill." },
  ],
  care: [
    { id: "summary", title: "Visit summary", body: "The scheduled service was marked complete on this demo." },
    { id: "follow", title: "Follow-up plan", body: "Book another visit if the clinician asked for a repeat dressing or vitals check." },
    { id: "notes", title: "Visit notes", body: "Observations from the worker would appear here after a real visit." },
  ],
  ambulance: [
    { id: "summary", title: "Trip summary", body: "This demo request is complete. A real trip would list pickup, destination, and crew." },
    { id: "follow", title: "Handoff", body: "Where you were taken, and who to ask for at the destination. Not a medical record." },
    { id: "notes", title: "Handoff notes", body: "Not a medical record. For emergencies always use 911." },
  ],
  surgery: [
    { id: "summary", title: "Procedure summary", body: "Demo: the day-surgery pathway is marked complete. This is not an operative note." },
    { id: "rx", title: "Discharge medicines", body: "Pain or antibiotic scripts would appear here after a real procedure." },
    { id: "follow", title: "Wound / follow-up plan", body: "Keep the dressing dry unless told otherwise. Book the post-op slot if one was set." },
    { id: "notes", title: "Surgeon’s notes", body: "Educational placeholder only." },
    { id: "reports", title: "Reports & documents", body: "Consent and imaging stay on Reports." },
  ],
  inward: [
    { id: "summary", title: "Admission summary", body: "Demo: this in-ward stay is marked complete. A real ward would list bed, team, and diet." },
    { id: "rx", title: "Discharge medicines", body: "Take-home doses would list here after a real admission." },
    { id: "follow", title: "Discharge plan", body: "Follow the ward’s return precautions. Book OPD if you were asked to come back." },
    { id: "notes", title: "Ward notes", body: "Not a medical record." },
  ],
  oxygen: [
    { id: "summary", title: "Delivery summary", body: "Demo: equipment drop-off is marked complete. This is not a prescription." },
    { id: "follow", title: "Next steps", body: "ADP paperwork and concentrator teaching would appear here after a real setup." },
    { id: "notes", title: "Technician notes", body: "Flow rate and safety checks belong here — not a clinic chart." },
  ],
  crisis: [
    { id: "summary", title: "Support summary", body: "Demo: this crisis request is complete. This is not a medical record." },
    { id: "follow", title: "Next steps", body: "Local resources the worker shared would list here." },
    { id: "notes", title: "Request notes", body: "What you wrote when you reached out. Nothing here is a diagnosis." },
  ],
  courier: [
    { id: "summary", title: "Drop-off summary", body: "Demo: the courier drop-off is marked complete." },
    { id: "follow", title: "If something looks wrong", body: "Message the pharmacist on the related fill. Do not change a dose on your own." },
    { id: "notes", title: "Rider notes", body: "Access or fridge notes from this drop-off." },
  ],
  nurseline: [
    { id: "summary", title: "Call summary", body: "Demo: the nurse-line request is complete. This is advice, not a diagnosis." },
    { id: "follow", title: "What they asked you to do", body: "Urgent care, 911, or watchful waiting would appear here after a real call." },
    { id: "notes", title: "Call notes", body: "Not a prescription and not a clinic chart." },
  ],
  urgent: [
    { id: "summary", title: "Visit hold summary", body: "Demo: this same-day hold is complete. Scripts still come from the clinician you saw." },
    { id: "follow", title: "Follow-up plan", body: "Book a regular consult if the walk-in asked you to return." },
    { id: "notes", title: "Desk notes", body: "What you wrote on this request. The clinician note lives on that visit, not here." },
  ],
};

function catalogFor(line: CareLine): { prep: PrepItem[]; after: AftercareItem[] } {
  switch (line) {
    case "surgery":
      return { prep: PREP.surgery, after: AFTER.surgery };
    case "inward":
      return { prep: PREP.inward, after: AFTER.inward };
    case "lab":
      return { prep: PREP.lab, after: AFTER.lab };
    case "pharmacy":
    case "refill":
    case "transfer":
      return { prep: PREP.pharmacy, after: AFTER.pharmacy };
    case "homecare":
    case "nurse":
    case "technician":
      return { prep: PREP.care, after: AFTER.care };
    case "ambulance":
      return { prep: PREP.ambulance, after: AFTER.ambulance };
    case "oxygen":
      return { prep: PREP.oxygen, after: AFTER.oxygen };
    case "crisis":
      return { prep: PREP.crisis, after: AFTER.crisis };
    case "courier":
      return { prep: PREP.courier, after: AFTER.courier };
    case "nurseline":
      return { prep: PREP.nurseline, after: AFTER.nurseline };
    case "urgent":
      return { prep: PREP.urgent, after: AFTER.urgent };
    case "opd":
    case "consult":
    default:
      return { prep: PREP.consult, after: AFTER.consult };
  }
}

export type CareTabDef = { id: CareTab; label: string; hint: string };

export const CARE_TABS: CareTabDef[] = [
  {
    id: "overview",
    label: "Overview",
    hint: "This visit right now — prepare before you go. The other tabs hold what comes after the consult.",
  },
  {
    id: "notes",
    label: "Notes",
    hint: "What you wrote when you booked. The clinician’s note lands here after the visit — not in Visit preparation.",
  },
  {
    id: "prescription",
    label: "Prescription",
    hint: "Medicines the clinician issues from this consult. Your home list stays under Visit preparation.",
  },
  {
    id: "reports",
    label: "Reports",
    hint: "Files on this visit — what you attached, and clinic documents after the consult.",
  },
  {
    id: "follow-up",
    label: "Follow-up",
    hint: "What to do next and when to come back. Unlocks after the consult.",
  },
];

function tabIdsFor(line: CareLine): CareTab[] {
  switch (line) {
    case "lab":
      return ["overview", "notes", "reports", "follow-up"];
    case "pharmacy":
    case "refill":
    case "transfer":
      return ["overview", "notes", "prescription", "follow-up"];
    case "homecare":
    case "nurse":
    case "technician":
    case "ambulance":
    case "urgent":
    case "oxygen":
    case "crisis":
    case "courier":
    case "nurseline":
      return ["overview", "notes", "follow-up"];
    default:
      return ["overview", "notes", "prescription", "reports", "follow-up"];
  }
}

export function careTabsFor(line: CareLine): CareTabDef[] {
  return tabIdsFor(line).map((id) => careTab(id, line));
}

export function careTab(id: CareTab, line: CareLine = "consult"): CareTabDef {
  const base = CARE_TABS.find((t) => t.id === id) ?? CARE_TABS[0];
  if (id === "overview") {
    if (line === "oxygen") return { ...base, hint: "This delivery right now. Next steps unlock after setup — there is no prescription or reports tab." };
    if (line === "ambulance" || line === "urgent" || line === "crisis" || line === "nurseline" || line === "courier") {
      return { ...base, hint: "This request right now. Other tabs hold notes and what happens after — not a clinic prescription." };
    }
    if (line === "lab") return { ...base, hint: "This lab visit right now. Results land on Reports after the draw." };
    if (line === "pharmacy" || line === "refill" || line === "transfer") {
      return { ...base, hint: "This order right now. Medicines are on the Medicines tab — not a clinic consult." };
    }
    if (line === "homecare" || line === "nurse" || line === "technician") {
      return { ...base, hint: "This visit right now. Assistants follow a plan on file — they do not issue prescriptions here." };
    }
    return base;
  }
  if (id === "notes") {
    if (line === "oxygen" || line === "ambulance" || line === "urgent" || line === "crisis" || line === "courier" || line === "nurseline") {
      return {
        id,
        label: "Request notes",
        hint: "What you wrote on this request. Nothing here is a clinic chart or a prescription.",
      };
    }
    if (line === "pharmacy" || line === "refill" || line === "transfer") {
      return { id, label: "Order notes", hint: "What you wrote on this fill. Pharmacist counselling lands here after delivery." };
    }
    if (line === "lab") {
      return { id, label: "Visit notes", hint: "Booking notes now. Technician notes land here after the draw." };
    }
    if (line === "homecare" || line === "nurse" || line === "technician") {
      return { id, label: "Visit notes", hint: "What you wrote for this visit. Worker observations land here afterwards." };
    }
    return base;
  }
  if (id === "prescription") {
    if (line === "pharmacy" || line === "refill" || line === "transfer") {
      return { id, label: "Medicines", hint: "Items on this fill. This is not a new clinic prescription." };
    }
    return base;
  }
  if (id === "reports") {
    if (line === "lab") return { id, label: "Results", hint: "Panels from this booking. Values are not clinical on this demo." };
    return base;
  }
  if (id === "follow-up") {
    if (line === "oxygen") return { id, label: "Next steps", hint: "Setup teaching and ADP paperwork after delivery." };
    if (line === "ambulance") return { id, label: "Handoff", hint: "Pickup notes after the trip. Not a medical record." };
    if (line === "crisis" || line === "nurseline" || line === "courier" || line === "urgent") {
      return { id, label: "Next steps", hint: "What to do after this request. Unlocks when it is complete." };
    }
    if (line === "lab") return { ...base, hint: "Share results with your doctor. Unlocks after the draw." };
    if (line === "pharmacy" || line === "refill" || line === "transfer") {
      return { ...base, hint: "Refill timing and pharmacist advice. Unlocks after delivery." };
    }
    return base;
  }
  return base;
}

export function careTabLocked(line: CareLine, tab: CareTab, stage: JourneyStage): boolean {
  if (tab === "overview" || tab === "notes") return false;
  if ((line === "pharmacy" || line === "refill" || line === "transfer") && tab === "prescription") return false;
  return stage !== "post";
}

export function unlockAfterLabel(line: CareLine): string {
  if (line === "pharmacy" || line === "refill" || line === "transfer" || line === "courier" || line === "oxygen") {
    return "Unlocks after delivery";
  }
  if (line === "lab") return "Unlocks after results";
  if (line === "ambulance" || line === "urgent" || line === "crisis" || line === "nurseline") {
    return "Unlocks after this request";
  }
  if (line === "surgery") return "Unlocks after the procedure";
  if (line === "inward") return "Unlocks after discharge";
  if (line === "homecare" || line === "nurse" || line === "technician") return "Unlocks after the visit";
  return "Unlocks after consult";
}

export function loadJourneyPrep(eventId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`pp.journey.prep.${eventId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return Object.fromEntries(
        parsed.filter((id): id is string => typeof id === "string").map((id) => [id, "Added"]),
      );
    }
    if (parsed && typeof parsed === "object") {
      const rec = parsed as { v?: number; values?: Record<string, string> } & Record<string, unknown>;
      const src = rec.v === 2 && rec.values && typeof rec.values === "object" ? rec.values : rec;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(src)) {
        if (k === "v" || k === "values") continue;
        if (typeof v === "string") out[k] = v;
      }
      return out;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveJourneyPrep(eventId: string, values: Record<string, string>) {
  try {
    localStorage.setItem(`pp.journey.prep.${eventId}`, JSON.stringify({ v: 2, values }));
  } catch {
    /* demo */
  }
}
