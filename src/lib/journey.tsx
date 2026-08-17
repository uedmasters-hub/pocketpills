import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/* The flagship flow chains from the Book appointment hub:
   Treatment detail -> Consultation -> Prescription decision -> Pharmacy checkout -> Delivery. */
export const CARE_STEPS = [
  { key: "care", label: "Book appointment", path: "/appointments" },
  { key: "eligibility", label: "Eligibility", path: "/care/eligibility" },
  { key: "questionnaire", label: "Questionnaire", path: "/care/questionnaire" },
  { key: "review", label: "Review", path: "/care/review" },
  { key: "doctor", label: "Doctor review", path: "/care/doctor" },
  { key: "medication", label: "Medication", path: "/care/medication" },
  { key: "confirmation", label: "Confirmed", path: "/care/confirmation" },
] as const;

export type CareStepKey = (typeof CARE_STEPS)[number]["key"];

interface Answers {
  age?: string;
  pregnant?: string;
  symptomsSince?: string;
  otherMeds?: string;
  allergies?: string;
}

interface JourneyState {
  treatmentSlug: string | null;
  answers: Answers;
  useInsurance: boolean;
  setTreatment: (slug: string) => void;
  setAnswer: (k: keyof Answers, v: string) => void;
  setUseInsurance: (v: boolean) => void;
  reset: () => void;
}

const JourneyCtx = createContext<JourneyState | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [treatmentSlug, setTreatmentSlug] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [useInsurance, setUseInsurance] = useState(true);

  const value = useMemo<JourneyState>(
    () => ({
      treatmentSlug,
      answers,
      useInsurance,
      setTreatment: setTreatmentSlug,
      setAnswer: (k, v) => setAnswers((a) => ({ ...a, [k]: v })),
      setUseInsurance,
      reset: () => {
        setTreatmentSlug(null);
        setAnswers({});
        setUseInsurance(true);
      },
    }),
    [treatmentSlug, answers, useInsurance],
  );

  return <JourneyCtx.Provider value={value}>{children}</JourneyCtx.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyCtx);
  if (!ctx) throw new Error("useJourney must be used within JourneyProvider");
  return ctx;
}
