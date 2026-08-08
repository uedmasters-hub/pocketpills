import type { Profile } from "@/lib/user";

export type ChecklistId = "personal" | "health" | "card" | "insurance" | "shipping" | "payment";

export interface ChecklistRow {
  id: ChecklistId;
  label: string;
  /** Complete, or not applicable (insurance is optional). */
  done: boolean;
  /** Shown on the right when complete. */
  value?: string;
  /** Counts toward the "pending actions" badge. */
  required: boolean;
}

/**
 * Single source of truth for profile completeness.
 * Both the dashboard banner and the profile page read this, so the count in the
 * banner always matches the rows the user actually sees.
 */
export function profileChecklist(user: Profile | null): ChecklistRow[] {
  return [
    {
      id: "personal",
      label: "Personal details",
      done: Boolean(user?.firstName && user?.lastName && user?.dob && user?.phone),
      value: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : undefined,
      required: true,
    },
    {
      id: "health",
      label: "Health information",
      done: Boolean(user?.allergies?.length),
      value: user?.allergies?.length ? `${user.allergies.length} noted` : undefined,
      required: true,
    },
    {
      id: "card",
      label: "Provincial Health Card",
      done: Boolean(user?.healthCard),
      value: user?.healthCard ? user.province : undefined,
      required: true,
    },
    {
      /* Optional: absence reads as a value ("None"), not a warning. */
      id: "insurance",
      label: "Insurance",
      done: true,
      value: user?.insurance?.carrier ?? "None",
      required: false,
    },
    {
      id: "shipping",
      label: "Shipping address",
      done: Boolean(user?.address),
      value: user?.address ? "Added" : undefined,
      required: true,
    },
    {
      id: "payment",
      label: "Payment details",
      done: Boolean(user?.paymentOnFile),
      value: user?.paymentOnFile ? "On file" : undefined,
      required: true,
    },
  ];
}

/** Rows that still need the user's attention. */
export function pendingRows(user: Profile | null): ChecklistRow[] {
  return profileChecklist(user).filter((r) => r.required && !r.done);
}
