import { useState, type ReactNode } from "react";
import { Logo, LogoMark } from "@/components/Logo";
import { DetailSection } from "@/components/DetailSection";
import { Button } from "@/components/ui/Button";
import { Badge, Card, Field, Switch } from "@/components/ui";
import { ConfirmModal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { RatingStars, ReviewCountChip } from "@/components/reviews/RatingChip";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { DateOfBirthField } from "@/components/DateOfBirthField";
import { PhoneField } from "@/components/PhoneField";
import { TagSuggestField } from "@/components/TagSuggestField";
import { DistrictField } from "@/components/DistrictField";

function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-[color:var(--pp-primary-200)]/40">
      {title ? (
        <p className="border-b border-line bg-white/70 px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
          {title}
        </p>
      ) : null}
      <div className="bg-white/80 p-5">{children}</div>
    </div>
  );
}

function BrandingPreview() {
  return (
    <Panel title="Logo">
      <div className="flex flex-wrap items-end gap-8">
        <div>
          <p className="mb-2 text-2xs text-ink-tertiary">Mark</p>
          <LogoMark className="h-12 w-12 text-[color:var(--pp-primary-950)]" />
        </div>
        <div>
          <p className="mb-2 text-2xs text-ink-tertiary">Lockup</p>
          <Logo animate={false} markClassName="h-10 w-10" wordClassName="text-2xl" />
        </div>
        <div className="rounded-xl bg-[color:var(--pp-primary-950)] px-4 py-3">
          <p className="mb-2 text-2xs text-white/60">On brand purple</p>
          <Logo className="text-white" animate={false} markClassName="h-8 w-8" wordClassName="text-lg" />
        </div>
      </div>
    </Panel>
  );
}

function ColorPreview({ tokens }: { tokens?: Record<string, string> }) {
  const source = tokens && Object.keys(tokens).length ? tokens : {};
  const keys = [
    "--primary-950",
    "--primary-600",
    "--primary-300",
    "--primary-200",
    "--neutral-900",
    "--neutral-600",
    "--neutral-300",
    "--neutral-100",
  ].filter((k) => source[k] || true);
  return (
    <Panel title="Swatches">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {keys.map((k) => {
          const value = source[k] || `var(${k})`;
          return (
            <div key={k} className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="h-16" style={{ background: value.startsWith("#") ? value : `var(${k})` }} />
              <div className="px-2 py-2">
                <p className="truncate text-2xs font-medium">{k}</p>
                <p className="truncate text-2xs text-ink-tertiary tnum">{value.startsWith("#") ? value : "token"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function TypographyPreview() {
  return (
    <Panel title="Type ramp">
      <div className="space-y-4">
        <p className="font-display text-3xl font-medium text-[color:var(--pp-primary-950)]">Display · section title</p>
        <p className="text-lg font-medium text-[color:var(--pp-primary-950)]">Title · product heading</p>
        <p className="text-base text-ink-secondary">Body · calm supporting copy for care flows.</p>
        <p className="text-sm text-ink-tertiary">Caption · metadata and hints</p>
        <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">Overline · section meta</p>
        <p className="text-sm font-semibold tnum text-[color:var(--pp-primary-950)]">12:30 PM · tabular nums</p>
      </div>
    </Panel>
  );
}

function LayoutPreview() {
  return (
    <Panel title="Shell composition">
      <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <div className="rounded-xl border border-line bg-[color:var(--pp-primary-200)] p-3 text-2xs text-ink-tertiary">
          Rail
          <div className="mt-2 space-y-1">
            <div className="h-2 rounded bg-white/80" />
            <div className="h-2 w-2/3 rounded bg-white/60" />
            <div className="h-2 w-4/5 rounded bg-white/60" />
          </div>
        </div>
        <div className="space-y-3">
          <DetailSection title="Detail section">
            <p className="text-sm text-ink-secondary">One job per card. Title inside the box, body below the divider.</p>
          </DetailSection>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <p className="text-sm font-medium">Card</p>
              <p className="mt-1 text-2xs text-ink-tertiary">Surface for interaction</p>
            </Card>
            <Card interactive className="p-4" onClick={() => undefined}>
              <p className="text-sm font-medium">Interactive card</p>
              <p className="mt-1 text-2xs text-ink-tertiary">Hover / press states</p>
            </Card>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function MotionPreview() {
  const [on, setOn] = useState(false);
  return (
    <Panel title="Motion in action">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <Logo animate markClassName="h-10 w-10" wordClassName="text-xl" />
          <p className="mt-2 text-2xs text-ink-tertiary">Logo entry (mark → word)</p>
        </div>
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium"
        >
          Toggle panel
        </button>
        <div
          className={
            "overflow-hidden rounded-xl border border-line bg-white transition-all duration-200 ease-in-out " +
            (on ? "max-h-24 opacity-100" : "max-h-0 border-transparent opacity-0")
          }
        >
          <p className="px-4 py-3 text-sm text-ink-secondary">150–250ms opacity + height</p>
        </div>
      </div>
    </Panel>
  );
}

function ImagesPreview() {
  const shots = [
    { src: "/img/how/card1-welcome.png", label: "Welcome" },
    { src: "/img/how/card2-experts.png", label: "Experts" },
    { src: "/img/how/card3-manage.png", label: "Manage" },
    { src: "/img/treatments/uti.png", label: "Treatment" },
  ];
  return (
    <Panel title="Product imagery">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {shots.map((s) => (
          <figure key={s.src} className="overflow-hidden rounded-xl border border-line bg-white">
            <img src={s.src} alt={s.label} className="aspect-[4/3] w-full object-cover" />
            <figcaption className="px-2 py-1.5 text-2xs text-ink-tertiary">{s.label}</figcaption>
          </figure>
        ))}
      </div>
    </Panel>
  );
}

function IconsPreview() {
  return (
    <Panel title="Iconography">
      <div className="flex flex-wrap gap-4 text-[color:var(--pp-primary-950)]">
        {[
          <path key="1" d="M12.5 5 7.5 10l5 5" strokeLinecap="round" strokeLinejoin="round" />,
          <path key="2" d="M7.5 5 12.5 10l-5 5" strokeLinecap="round" strokeLinejoin="round" />,
          <path key="3" d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />,
          <circle key="4" cx="10" cy="10" r="6" />,
        ].map((d, i) => (
          <span key={i} className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              {d}
            </svg>
          </span>
        ))}
        <Tooltip label="Info affordance">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-sm font-semibold">
            i
          </span>
        </Tooltip>
      </div>
    </Panel>
  );
}

function AccessibilityPreview() {
  return (
    <Panel title="Focus & contrast">
      <div className="flex flex-wrap gap-3">
        <Button>Tab to focus</Button>
        <Button variant="outline">Outline</Button>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--pp-primary-950)]" aria-hidden />
          State + label (not color alone)
        </span>
      </div>
    </Panel>
  );
}

function DarkModePreview() {
  return (
    <Panel title="Surfaces">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-sm font-medium">Light (default care)</p>
          <p className="mt-1 text-2xs text-ink-tertiary">Lavender page + white islands</p>
        </div>
        <div className="rounded-xl bg-[color:var(--primary-900)] p-4 text-[color:var(--pp-primary-300)]">
          <p className="text-sm font-medium text-[color:var(--primary-300)]">Dark tokens</p>
          <p className="mt-1 text-2xs opacity-80">Available under .dark in index.css</p>
        </div>
      </div>
    </Panel>
  );
}

function WritingPreview() {
  return (
    <Panel title="Voice">
      <div className="space-y-2 text-sm text-ink-secondary">
        <p>
          <strong className="text-[color:var(--pp-primary-950)]">Do:</strong> Book your visit — mornings open this week.
        </p>
        <p>
          <strong className="text-[color:var(--pp-primary-950)]">Don’t:</strong> Utilize the portal to facilitate appointment acquisition.
        </p>
      </div>
    </Panel>
  );
}

function ButtonPreview() {
  return (
    <Panel title="Button">
      <div className="flex flex-wrap gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="wellness">Wellness</Button>
        <Button size="sm">Small</Button>
        <Button disabled>Disabled</Button>
      </div>
    </Panel>
  );
}

function FieldPreview() {
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  return (
    <Panel title="Field">
      <div className="grid max-w-md gap-4">
        <Field label="Full name" placeholder="Alex Rivera" hint="As it appears on your health card" />
        <Field label="Email" type="email" error="Enter a valid email" defaultValue="not-an-email" />
        <PhoneField
          label="Mobile"
          value={phone}
          onChange={setPhone}
          hint="Shared PhoneField — region list, search, ISO initials (default NP)."
        />
        <DateOfBirthField
          label="Date of birth"
          value={dob}
          onChange={setDob}
          hint="Shared DateOfBirthField — DD / MM / YYYY → ISO YYYY-MM-DD."
        />
      </div>
    </Panel>
  );
}

function PhonePreview() {
  const [phone, setPhone] = useState("+977 - 9801234567");
  const [locked, setLocked] = useState("+977 - 9801234567");
  return (
    <Panel title="Phone / Mobile">
      <div className="grid max-w-md gap-5">
        <div>
          <PhoneField label="Mobile" value={phone} onChange={setPhone} />
          <p className="mt-2 text-2xs text-ink-tertiary">
            Open the dial picker for region groups + search. Value:{" "}
            <span className="tnum">{phone || "—"}</span>
          </p>
        </div>
        <div>
          <PhoneField
            label="Nepal-only (claims)"
            value={locked}
            onChange={setLocked}
            allowedIsos={["NP"]}
            hint='Pass allowedIsos={["NP"]} when the flow is Nepal mobile only.'
          />
        </div>
      </div>
    </Panel>
  );
}

function DobPreview() {
  const [dob, setDob] = useState("1990-04-12");
  return (
    <Panel title="Date of birth">
      <div className="grid max-w-md gap-4">
        <DateOfBirthField label="Date of birth" value={dob} onChange={setDob} />
        <p className="text-2xs text-ink-tertiary">
          Mask stays visible while typing. ISO value: <span className="tnum">{dob || "—"}</span>
        </p>
      </div>
    </Panel>
  );
}

const DEMO_CONDITION_SUGGESTIONS = [
  "Asthma",
  "Diabetes",
  "Hypertension",
  "Thyroid disorder",
  "Heart disease",
  "Migraine",
  "Anxiety",
] as const;

const DEMO_ALLERGY_SUGGESTIONS = [
  "Penicillin",
  "Sulfa drugs",
  "Peanuts",
  "Latex",
  "Aspirin / NSAIDs",
  "Shellfish",
  "Pollen",
] as const;

function SelectionPreview() {
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [district, setDistrict] = useState("Kathmandu");
  return (
    <Panel title="Selection">
      <div className="grid max-w-lg gap-5">
        <DistrictField label="District" value={district} onChange={setDistrict} />
        <p className="text-2xs text-ink-tertiary">
          Searchable district menu (height-capped, portaled). Value: {district}
        </p>
        <TagSuggestField
          label="Conditions"
          items={conditions}
          onChange={setConditions}
          placeholder="e.g. asthma"
          suggestions={DEMO_CONDITION_SUGGESTIONS}
        />
        <TagSuggestField
          label="Allergies"
          items={allergies}
          onChange={setAllergies}
          placeholder="e.g. penicillin"
          suggestions={DEMO_ALLERGY_SUGGESTIONS}
        />
        <p className="text-2xs text-ink-tertiary">
          Tag chips: focus → append with commas → Add splits into separate tags.
        </p>
      </div>
    </Panel>
  );
}

function CardPreview() {
  return (
    <Panel title="Card & DetailSection">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <Badge tone="primary">Primary</Badge>
          <p className="mt-3 text-sm font-medium">Static card</p>
          <p className="mt-1 text-2xs text-ink-tertiary">Border + surface-2</p>
        </Card>
        <Card interactive className="p-4" onClick={() => undefined}>
          <Badge tone="success">Success</Badge>
          <p className="mt-3 text-sm font-medium">Interactive</p>
          <p className="mt-1 text-2xs text-ink-tertiary">Hover / active fill</p>
        </Card>
      </div>
      <div className="mt-3">
        <DetailSection title="Hours" lede="Shared product panel pattern.">
          <p className="text-sm text-ink-secondary">Title lives inside the card with a hairline divider.</p>
        </DetailSection>
      </div>
    </Panel>
  );
}

function ModalPreview() {
  const [open, setOpen] = useState(false);
  return (
    <Panel title="Modal">
      <Button size="sm" onClick={() => setOpen(true)}>
        Open confirm
      </Button>
      <ConfirmModal
        open={open}
        title="Sync this month?"
        body="Apply this day’s hours to every remaining day in August?"
        confirmLabel="Sync month"
        onConfirm={() => setOpen(false)}
        onClose={() => setOpen(false)}
      />
    </Panel>
  );
}

function TooltipPreview() {
  return (
    <Panel title="Tooltip">
      <Tooltip label="Apply this day’s hours to the rest of the month.">
        <span className="inline-flex cursor-default items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-sm">
          Select for month
          <span className="grid h-4 w-4 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-[0.65rem] font-semibold">
            i
          </span>
        </span>
      </Tooltip>
    </Panel>
  );
}

function AvailabilityPreview() {
  return (
    <Panel title="Time chips">
      <div className="rounded-xl bg-[color:var(--pp-primary-200)] p-4">
        <div className="flex flex-wrap gap-2.5">
          <span className="rounded-full border border-transparent bg-white px-4 py-2 text-sm text-[color:var(--neutral-500)]">
            10:00 AM
          </span>
          <span className="rounded-full border border-transparent bg-white px-4 py-2 text-sm text-[color:var(--neutral-300)]">
            10:30 AM
          </span>
          <span className="rounded-full border border-[color:var(--pp-primary-950)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--pp-primary-950)]">
            11:00 AM
          </span>
        </div>
        <p className="mt-3 text-2xs text-ink-tertiary">Active · Disabled (other visit) · Selected</p>
      </div>
    </Panel>
  );
}

function RatingPreview() {
  return (
    <Panel title="Rating">
      <div className="flex flex-wrap items-center gap-4">
        <RatingStars value={4.5} />
        <ReviewCountChip average={4.8} count={128} />
        <Badge tone="warning">4.8 · 128 reviews</Badge>
      </div>
    </Panel>
  );
}

function SwitchPreview() {
  const [on, setOn] = useState(true);
  return (
    <Panel title="Switch">
      <Switch checked={on} onChange={setOn} label="Virtual visits" desc="Offer video appointments" />
    </Panel>
  );
}

function SkeletonPreview() {
  return (
    <Panel title="Skeleton">
      <div className="space-y-3">
        <Skeleton className="h-10 w-40 rounded-full" />
        <SkeletonText lines={3} />
      </div>
    </Panel>
  );
}

function FormsPreview() {
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  return (
    <Panel title="Form pattern">
      <div className="grid max-w-lg gap-4">
        <Field label="Reason for visit" placeholder="Sore throat" />
        <PhoneField label="Mobile" value={phone} onChange={setPhone} />
        <DateOfBirthField label="Date of birth" value={dob} onChange={setDob} />
        <Field label="Preferred pharmacy" placeholder="Search…" />
        <div className="flex gap-2">
          <Button size="sm">Continue</Button>
          <Button size="sm" variant="secondary">
            Back
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function NavigationPreview() {
  return (
    <Panel title="Nav patterns">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium shadow-sm">Overview</span>
        <span className="rounded-lg px-3 py-1.5 text-sm text-ink-secondary">Color</span>
        <span className="rounded-lg px-3 py-1.5 text-sm text-ink-secondary">Typography</span>
      </div>
      <p className="mt-3 text-2xs text-ink-tertiary">Sidebar groups · Getting started / Foundations / Components / Patterns</p>
    </Panel>
  );
}

function FeedbackPreview() {
  return (
    <Panel title="Feedback">
      <div className="flex flex-wrap gap-2">
        <Badge tone="success">Saved</Badge>
        <Badge tone="warning">Pending</Badge>
        <Badge tone="danger">Failed</Badge>
        <Badge tone="info">Info</Badge>
      </div>
    </Panel>
  );
}

function BookingPreview() {
  return (
    <Panel title="Booking steps">
      <ol className="flex flex-wrap gap-2 text-2xs font-medium">
        {["Visit type", "Day", "Time chip", "Review"].map((step, i) => (
          <li
            key={step}
            className={
              "rounded-full px-3 py-1.5 " +
              (i === 2
                ? "bg-[color:var(--pp-primary-950)] text-white"
                : "border border-line bg-white text-ink-secondary")
            }
          >
            {i + 1}. {step}
          </li>
        ))}
      </ol>
      <AvailabilityPreview />
    </Panel>
  );
}

/** Live demos wired to real product components for each docs page. */
export function DesignPagePreview({
  section,
  slug,
  tokens,
}: {
  section: string;
  slug: string;
  tokens?: Record<string, string>;
}) {
  if (section === "foundations") {
    if (slug === "branding") return <BrandingPreview />;
    if (slug === "color") return <ColorPreview tokens={tokens} />;
    if (slug === "typography") return <TypographyPreview />;
    if (slug === "layout") return <LayoutPreview />;
    if (slug === "motion") return <MotionPreview />;
    if (slug === "images") return <ImagesPreview />;
    if (slug === "icons") return <IconsPreview />;
    if (slug === "accessibility") return <AccessibilityPreview />;
    if (slug === "dark-mode") return <DarkModePreview />;
    if (slug === "writing") return <WritingPreview />;
  }
  if (section === "components") {
    if (slug === "button") return <ButtonPreview />;
    if (slug === "field") return <FieldPreview />;
    if (slug === "selection") return <SelectionPreview />;
    if (slug === "phone") return <PhonePreview />;
    if (slug === "date-of-birth") return <DobPreview />;
    if (slug === "card") return <CardPreview />;
    if (slug === "modal") return <ModalPreview />;
    if (slug === "tooltip") return <TooltipPreview />;
    if (slug === "availability") return <AvailabilityPreview />;
    if (slug === "rating") return <RatingPreview />;
    if (slug === "switch") return <SwitchPreview />;
    if (slug === "skeleton") return <SkeletonPreview />;
    if (slug === "badge") {
      return (
        <Panel title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">Primary</Badge>
            <Badge tone="wellness">Wellness</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="neutral">Neutral</Badge>
          </div>
        </Panel>
      );
    }
    if (slug === "logo") return <BrandingPreview />;
  }
  if (section === "patterns") {
    if (slug === "forms") return <FormsPreview />;
    if (slug === "navigation") return <NavigationPreview />;
    if (slug === "feedback") return <FeedbackPreview />;
    if (slug === "booking") return <BookingPreview />;
  }
  if (section === "getting-started" && slug === "overview") {
    return (
      <>
        <BrandingPreview />
        <ButtonPreview />
        <ColorPreview tokens={tokens} />
      </>
    );
  }
  return null;
}
