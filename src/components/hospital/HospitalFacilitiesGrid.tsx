import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { DetailSection } from "@/components/DetailSection";
import { useI18n } from "@/lib/i18n";
import {
  hospitalLandingGroups,
  LANDING_PREVIEW_IDS,
  type LandingFacilityGroup,
} from "@/lib/hospitalLandingFacilities";
import type { HospitalView } from "@/lib/hospitalProfileContent";

export function FacilityIcon({ id }: { id: string }) {
  const common = "h-10 w-10 text-[color:var(--pp-violet)]";
  if (id === "diagnostics") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="9" cy="9" r="4.2" />
        <path d="M12.2 12.2 18 18" strokeLinecap="round" />
        <path d="M16 7h4M18 5v4" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "pharmacy") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="5" y="4" width="14" height="16" rx="2.5" />
        <path d="M9 12h6M12 9v6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "rehab") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="12" cy="6" r="2.2" />
        <path d="M8 21v-6l4-3 4 3v6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 12h12" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "specialized") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M12 4v16M8 8h8M9 20h6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "packages") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M4.5 8.5 12 4l7.5 4.5v9L12 22l-7.5-4.5v-9Z" strokeLinejoin="round" />
        <path d="M12 12v10M4.5 8.5 12 12l7.5-3.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 10h16v10H4V10Z" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function FacilityList({ group }: { group: LandingFacilityGroup }) {
  const { tx } = useI18n();
  return (
    <ul className="divide-y divide-line">
      {group.items.map((item) => (
        <li key={item} className="py-2.5 text-sm text-[color:var(--pp-primary-950)]">
          {tx(item)}
        </li>
      ))}
    </ul>
  );
}

export function HospitalFacilitiesGrid({ hospital }: { hospital: HospitalView }) {
  const { tx } = useI18n();
  const groups = useMemo(() => hospitalLandingGroups(hospital), [hospital]);
  const preview = groups.filter((g) => (LANDING_PREVIEW_IDS as readonly string[]).includes(g.id));
  const extra = Math.max(0, groups.length - preview.length);
  const [openId, setOpenId] = useState<string | null>(null);
  const openGroup = groups.find((g) => g.id === openId) ?? null;
  const viewAll = openId === "all";

  return (
    <>
      <DetailSection title={tx("Facilities")} lede={tx("Tap a card to see what this hospital lists in that area.")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setOpenId(g.id)}
              className="flex min-h-[9.5rem] flex-col items-start rounded-3xl border border-line bg-[color:var(--pp-primary-100)] p-5 text-left transition-colors hover:bg-[color:var(--state-hover)]"
            >
              <FacilityIcon id={g.id} />
              <p className="mt-4 font-semibold text-[color:var(--pp-primary-950)]">{tx(g.title)}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-tertiary">{tx(g.blurb)}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOpenId("all")}
            aria-label={tx("View all")}
            className="flex min-h-[9.5rem] flex-col items-center justify-center rounded-3xl border border-dashed border-[color:var(--pp-primary-300)] bg-white px-5 py-6 text-center transition-colors hover:bg-[color:var(--state-hover)]"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--pp-primary-200)] text-2xl font-medium leading-none text-[color:var(--pp-primary-950)]">
              +
            </span>
            <p className="mt-3 text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("View all")}</p>
            {extra > 0 ? <p className="mt-0.5 text-sm text-ink-tertiary">+{extra}</p> : null}
          </button>
        </div>
      </DetailSection>

      <Modal
        open={Boolean(openGroup)}
        title={openGroup ? tx(openGroup.title) : ""}
        onClose={() => setOpenId(null)}
      >
        {openGroup ? (
          <>
            <p className="mb-3 text-sm text-ink-tertiary">{tx(openGroup.blurb)}</p>
            <FacilityList group={openGroup} />
          </>
        ) : null}
      </Modal>

      <Modal open={viewAll} title={tx("Facilities")} onClose={() => setOpenId(null)}>
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.id}>
              <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx(g.title)}</p>
              <p className="mt-0.5 text-sm text-ink-tertiary">{tx(g.blurb)}</p>
              <div className="mt-2">
                <FacilityList group={g} />
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
