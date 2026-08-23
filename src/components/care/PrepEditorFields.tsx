import { LocationPicker } from "@/components/care/LocationPicker";
import {
  ChipGroup,
  ChoiceList,
  FieldLabel,
  joinChoices,
  leftovers,
  parseChoices,
  takeKnown,
} from "@/components/care/PrepChoices";
import { useI18n } from "@/lib/i18n";
import type { CareLine, PrepItem } from "@/lib/careJourney";
import { PhoneField } from "@/components/PhoneField";

const ACCESS = [
  "Elevator",
  "Stairs",
  "Ground floor",
  "Tight hallway",
  "Buzzer / intercom",
  "Door will be unlocked",
] as const;

const ACCESS_COURIER = [
  "Elevator",
  "Stairs",
  "Ground floor",
  "Tight hallway",
  "Buzzer / intercom",
  "Parking nearby",
  "Keep refrigerated",
] as const;

const ACCESS_AMBULANCE = [
  "Elevator",
  "Stairs",
  "Ground floor",
  "Tight hallway",
  "Buzzer / intercom",
  "Door will be unlocked",
  "Someone will meet you",
] as const;

const OXYGEN_DEVICE = ["Not using oxygen", "Concentrator", "Tanks", "Both"] as const;
const OXYGEN_FLOW = ["1 L", "2 L", "3 L", "4+ L", "Unsure"] as const;
const OXYGEN_WHEN = ["At rest", "At night", "With activity"] as const;

const FASTING = ["No fasting needed", "Yes, I'm fasting", "Not sure"] as const;
const FASTING_HOW = ["From midnight", "8 hours", "12 hours", "Water only"] as const;

const ID_ITEMS = ["Photo ID ready", "Insurance / OHIP card", "Medicine list on my phone"] as const;

const PHONE = ["This phone is on", "Different number"] as const;

const RIDE = ["Someone will drive me", "Taxi / rideshare", "I'll arrange it", "Need help arranging"] as const;

const SPACE = ["Table", "Chair", "Good light", "Pets put away"] as const;

const SUPPLIES = ["Dressings ready", "Injection ready", "Nothing extra needed"] as const;

const PLAN = ["Provincial plan", "Private insurance", "Paying myself", "Not sure"] as const;

const BAG = ["Clothes", "Chargers", "Toiletries", "Medicines in original bottles"] as const;

const CONTACT = ["No extra contact", "Contact on file", "Add a person"] as const;
const RELATION = ["Partner", "Parent", "Child", "Friend", "Other"] as const;

const STORY_WHEN = ["Started today", "This week", "Longer than a week"] as const;
const STORY_HOW = ["Mild", "Moderate", "Severe"] as const;

const PLACE_KIND = ["I'm at home", "I'm at work", "I'm somewhere else"] as const;

function accessOptions(line: CareLine): readonly string[] {
  if (line === "courier") return ACCESS_COURIER;
  if (line === "ambulance") return ACCESS_AMBULANCE;
  return ACCESS;
}

export { ACCESS, ACCESS_AMBULANCE, ACCESS_COURIER, STORY_WHEN, STORY_HOW };

export function StructuredPrepBody({
  item,
  line,
  locationLabel,
  draft,
  setDraft,
}: {
  item: PrepItem;
  line: CareLine;
  locationLabel: string;
  draft: string;
  setDraft: (next: string) => void;
}) {
  const { tx } = useI18n();
  const parts = parseChoices(draft);
  const id = item.id;

  if (id === "address") {
    return (
      <LocationPicker
        value={draft}
        onChange={setDraft}
        savedLabel={locationLabel}
        placeholder="Street, city"
      />
    );
  }

  if (id === "place") {
    const kind = takeKnown(parts, PLACE_KIND)[0];
    const loc = leftovers(parts, PLACE_KIND);
    return (
      <div className="space-y-4">
        <ChoiceList
          options={PLACE_KIND}
          selected={kind ? [kind] : []}
          onChange={(next) => {
            const k = next[0] ?? "";
            if (k === "I'm at home" && locationLabel) setDraft(joinChoices([k, locationLabel]));
            else if (k === "I'm somewhere else") setDraft(k);
            else setDraft(k);
          }}
        />
        {kind === "I'm somewhere else" || kind === "I'm at work" ? (
          <LocationPicker
            value={kind ? loc : draft}
            onChange={(next) => setDraft(joinChoices([kind || "I'm somewhere else", next]))}
            savedLabel={locationLabel}
            placeholder="Building, room, or intersection"
          />
        ) : null}
      </div>
    );
  }

  if (id === "access") {
    const opts = accessOptions(line);
    return (
      <ChoiceList
        options={opts}
        selected={takeKnown(parts, opts)}
        multiple
        onChange={(next) => setDraft(joinChoices(next))}
      />
    );
  }

  if (id === "oxygen") {
    const device = takeKnown(parts, OXYGEN_DEVICE)[0];
    const flow = takeKnown(parts, OXYGEN_FLOW)[0];
    const when = takeKnown(parts, OXYGEN_WHEN);
    const using = device && device !== "Not using oxygen";
    return (
      <div className="space-y-4">
        <ChoiceList
          options={OXYGEN_DEVICE}
          selected={device ? [device] : []}
          onChange={(next) => {
            const d = next[0] ?? "";
            setDraft(joinChoices(d === "Not using oxygen" ? [d] : [d, flow, ...when].filter(Boolean)));
          }}
        />
        {using ? (
          <>
            <div>
              <FieldLabel>Flow, if you know it</FieldLabel>
              <ChipGroup
                options={OXYGEN_FLOW}
                selected={flow ? [flow] : []}
                onChange={(next) => setDraft(joinChoices([device, next[0] ?? "", ...when].filter(Boolean)))}
              />
            </div>
            <div>
              <FieldLabel>When</FieldLabel>
              <ChipGroup
                options={OXYGEN_WHEN}
                selected={when}
                multiple
                onChange={(next) => setDraft(joinChoices([device, flow, ...next].filter(Boolean)))}
              />
            </div>
          </>
        ) : null}
      </div>
    );
  }

  if (id === "fast") {
    const choice = takeKnown(parts, FASTING)[0];
    const how = takeKnown(parts, FASTING_HOW);
    return (
      <div className="space-y-4">
        <ChoiceList
          options={FASTING}
          selected={choice ? [choice] : []}
          onChange={(next) => {
            const c = next[0] ?? "";
            setDraft(joinChoices(c === "Yes, I'm fasting" ? [c, ...how] : c ? [c] : []));
          }}
        />
        {choice === "Yes, I'm fasting" ? (
          <div>
            <FieldLabel>Until when</FieldLabel>
            <ChipGroup
              options={FASTING_HOW}
              selected={how}
              multiple
              onChange={(next) => setDraft(joinChoices([choice, ...next]))}
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (id === "id") {
    return (
      <ChoiceList
        options={ID_ITEMS}
        selected={takeKnown(parts, ID_ITEMS)}
        multiple
        onChange={(next) => setDraft(joinChoices(next))}
      />
    );
  }

  if (id === "phone") {
    const choice = takeKnown(parts, PHONE)[0];
    const number = leftovers(parts, PHONE);
    return (
      <div className="space-y-4">
        <ChoiceList
          options={PHONE}
          selected={choice ? [choice] : []}
          onChange={(next) => {
            const c = next[0] ?? "";
            setDraft(c === "Different number" ? joinChoices([c, number]) : c);
          }}
        />
        {choice === "Different number" ? (
          <PhoneField
            label={tx("Mobile number")}
            value={number}
            onChange={(v) => setDraft(joinChoices(["Different number", v]))}
          />
        ) : null}
      </div>
    );
  }

  if (id === "ride") {
    return (
      <ChoiceList
        options={RIDE}
        selected={takeKnown(parts, RIDE)}
        onChange={(next) => setDraft(joinChoices(next))}
      />
    );
  }

  if (id === "space") {
    return (
      <ChoiceList
        options={SPACE}
        selected={takeKnown(parts, SPACE)}
        multiple
        onChange={(next) => setDraft(joinChoices(next))}
      />
    );
  }

  if (id === "supplies") {
    return (
      <ChoiceList
        options={SUPPLIES}
        selected={takeKnown(parts, SUPPLIES)}
        multiple
        onChange={(next) => {
          const last = next[next.length - 1];
          if (last === "Nothing extra needed") setDraft(last);
          else setDraft(joinChoices(next.filter((s) => s !== "Nothing extra needed")));
        }}
      />
    );
  }

  if (id === "plan") {
    return (
      <ChoiceList
        options={PLAN}
        selected={takeKnown(parts, PLAN)}
        onChange={(next) => setDraft(joinChoices(next))}
      />
    );
  }

  if (id === "bag") {
    return (
      <ChoiceList
        options={BAG}
        selected={takeKnown(parts, BAG)}
        multiple
        onChange={(next) => setDraft(joinChoices(next))}
      />
    );
  }

  if (id === "contact") {
    const choice = takeKnown(parts, CONTACT)[0];
    const rel = takeKnown(parts, RELATION)[0];
    const name = leftovers(parts, [...CONTACT, ...RELATION]);
    return (
      <div className="space-y-4">
        <ChoiceList
          options={CONTACT}
          selected={choice ? [choice] : []}
          onChange={(next) => {
            const c = next[0] ?? "";
            if (c === "Add a person") setDraft(joinChoices([c, name, rel].filter(Boolean)));
            else setDraft(c);
          }}
        />
        {choice === "Add a person" ? (
          <>
            <input
              value={name}
              onChange={(e) => setDraft(joinChoices(["Add a person", e.target.value, rel].filter(Boolean)))}
              className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
              placeholder={tx("First name")}
              autoComplete="name"
            />
            <ChipGroup
              options={RELATION}
              selected={rel ? [rel] : []}
              onChange={(next) => setDraft(joinChoices(["Add a person", name, next[0] ?? ""].filter(Boolean)))}
            />
          </>
        ) : null}
      </div>
    );
  }

  if (id === "story") {
    const when = takeKnown(parts, STORY_WHEN)[0];
    const how = takeKnown(parts, STORY_HOW)[0];
    const note = leftovers(parts, [...STORY_WHEN, ...STORY_HOW]);
    return (
      <div className="space-y-4">
        <div>
          <FieldLabel>When it started</FieldLabel>
          <ChipGroup
            options={STORY_WHEN}
            selected={when ? [when] : []}
            onChange={(next) => setDraft(joinChoices([next[0] ?? "", how, note].filter(Boolean)))}
          />
        </div>
        <div>
          <FieldLabel>How it feels now</FieldLabel>
          <ChipGroup
            options={STORY_HOW}
            selected={how ? [how] : []}
            onChange={(next) => setDraft(joinChoices([when, next[0] ?? "", note].filter(Boolean)))}
          />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-tertiary">
            {tx("Anything else")} ({tx("optional")})
          </span>
          <input
            value={note}
            onChange={(e) => setDraft(joinChoices([when, how, e.target.value].filter(Boolean)))}
            className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
            placeholder={tx("One line is enough")}
          />
        </label>
      </div>
    );
  }

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-[color:var(--pp-primary-950)] outline-none focus:border-[color:var(--pp-primary-950)]"
      placeholder={tx("Add a short note…")}
    />
  );
}

export const STRUCTURED_PREP_IDS = new Set([
  "address",
  "place",
  "access",
  "oxygen",
  "fast",
  "id",
  "phone",
  "ride",
  "space",
  "supplies",
  "plan",
  "bag",
  "contact",
  "story",
]);
