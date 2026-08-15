import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { DirectorySidebarMap } from "@/components/MapEmbed";
import { FaqAccordion } from "@/components/FaqAccordion";
import { RecentArticlesSection } from "@/components/RecentArticles";
import { RelatedHealthcareOptions } from "@/components/RelatedHealthcareOptions";
import {
  pharmacyAboutFacts,
  pharmacyAvailabilityRows,
  pharmacyDeliveryRows,
  pharmacyFaqs,
  pharmacyMapsQuery,
  pharmacyOrderSteps,
  pharmacySafetyGuides,
  pharmacyServices,
  type PharmacyView,
} from "@/lib/pharmacyProfileContent";

const CARD = "rounded-2xl border border-line bg-white p-4";
const H2 = "font-display text-xl font-medium text-[color:var(--pp-primary-950)]";
const LEDE = "mt-1 text-sm text-ink-tertiary";

function SectionHead({ title, lede }: { title: string; lede?: string }) {
  const { tx } = useI18n();
  return (
    <>
      <h2 className={H2}>{tx(title)}</h2>
      {lede ? <p className={LEDE}>{tx(lede)}</p> : null}
    </>
  );
}

export function PharmacyAboutFacts({ pharmacy }: { pharmacy: PharmacyView }) {
  const { tx } = useI18n();
  const facts = pharmacyAboutFacts(pharmacy);
  if (!facts.length) return null;
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {facts.map((f) => (
        <div key={f.k} className={CARD}>
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">{tx(f.k)}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--pp-primary-950)]">{f.v}</p>
        </div>
      ))}
    </div>
  );
}

export function PharmacyServicesSection({ pharmacy }: { pharmacy: PharmacyView }) {
  const { tx } = useI18n();
  const items = pharmacyServices(pharmacy);
  if (!items.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead title="Pharmacy services" lede="Services listed on this profile and on PocketPills." />
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((s) => (
          <li key={s.id} className={CARD + " flex flex-col"}>
            <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx(s.label)}</p>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-secondary">{tx(s.blurb)}</p>
            {s.href && s.action ? (
              <Link to={s.href} className="mt-3 text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70">
                {tx(s.action)} →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PharmacyOrderingSection({ pharmacy }: { pharmacy: PharmacyView }) {
  const { tx } = useI18n();
  const steps = pharmacyOrderSteps(pharmacy);
  if (!steps.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Prescription & medicine ordering"
        lede="A valid prescription is required for prescription medicines. This is not a way to buy them without authorization."
      />
      <ol className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {steps.map((s, i) => (
          <li key={s.k} className={"px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {i + 1}. {tx(s.k)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--pp-primary-950)]">{tx(s.v)}</p>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/fill">
          <Button size="sm">{tx("Upload prescription")}</Button>
        </Link>
        <Link to="/fill">
          <Button size="sm" variant="secondary">
            {tx("Start order")}
          </Button>
        </Link>
      </div>
    </section>
  );
}

export function PharmacyPharmacistsSection({ pharmacy }: { pharmacy: PharmacyView }) {
  const { tx } = useI18n();
  if (!pharmacy.pharmacists.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Pharmacists & professional support"
        lede="People listed on this pharmacy’s PocketPills account — not a substitute for a clinic visit."
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {pharmacy.pharmacists.map((person) => (
          <div key={person.id} className={CARD}>
            <p className="font-semibold text-[color:var(--pp-primary-950)]">{person.name}</p>
            <p className="mt-0.5 text-xs text-ink-tertiary">{tx("Pharmacy team")}</p>
            <p className="mt-2 flex items-center gap-1.5 text-2xs text-[color:var(--pp-primary-950)]">
              <span className="text-wellness" aria-hidden>✓</span>
              {tx("Listed on this pharmacy")}
            </p>
            {pharmacy.live ? (
              <Link to="/messages" className="mt-3 inline-block text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70">
                {tx("Ask a pharmacist")} →
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function PharmacyAvailabilitySection({ pharmacy }: { pharmacy: PharmacyView }) {
  const { tx } = useI18n();
  const rows = pharmacyAvailabilityRows(pharmacy);
  const [q, setQ] = useState("");
  if (!rows.length) return null;
  const query = q.trim().toLowerCase();
  const shown = query ? rows.filter((r) => `${r.name} ${r.form}`.toLowerCase().includes(query)) : rows;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Medicine availability"
        lede="Listed stock from this pharmacy’s inventory — confirm when you order. Not a live shelf count."
      />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={tx("Search medicines")}
        className="mt-4 h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-[color:var(--pp-primary-950)] outline-none placeholder:text-ink-tertiary focus:border-[color:var(--pp-primary-950)]"
      />
      <ul className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
        {shown.map((row, i) => (
          <li key={row.id} className={"flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
            <span>
              <span className="block text-sm font-medium text-[color:var(--pp-primary-950)]">{row.name}</span>
              {row.form ? <span className="mt-0.5 block text-2xs text-ink-tertiary">{row.form}</span> : null}
            </span>
            <span className="flex items-center gap-3">
              <span className="text-2xs font-semibold text-[color:var(--pp-primary-950)]">{tx(row.status)}</span>
              <Link to="/fill" className="text-xs font-medium text-[color:var(--pp-violet)] hover:opacity-70">
                {tx(row.status === "Out of stock" ? "Request medicine" : "Check availability")}
              </Link>
            </span>
          </li>
        ))}
        {!shown.length ? (
          <li className="px-5 py-6 text-sm text-ink-tertiary">{tx("No matching medicines in listed stock.")}</li>
        ) : null}
      </ul>
    </section>
  );
}

export function PharmacyDeliverySection({ pharmacy }: { pharmacy: PharmacyView }) {
  const { tx } = useI18n();
  const rows = pharmacyDeliveryRows(pharmacy);
  if (!rows.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Delivery & pickup"
        lede="PocketPills shipping for this live listing — not a custom courier promise from this store."
      />
      <dl className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {rows.map((row, i) => (
          <div key={row.k} className={"flex justify-between gap-4 px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
            <dt className="text-sm text-ink-tertiary">{tx(row.k)}</dt>
            <dd className="max-w-[65%] text-right text-sm font-medium text-[color:var(--pp-primary-950)]">{tx(row.v)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PharmacySafetySection() {
  const { tx } = useI18n();
  const items = pharmacySafetyGuides();
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead
        title="Medicine safety & patient information"
        lede="General guidance from PocketPills — not a diagnosis. Ask a pharmacist or clinician when you are unsure."
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.k} className={CARD}>
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(item.k)}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{tx(item.v)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PharmacyNewsSection({ pharmacy }: { pharmacy: PharmacyView }) {
  const { tx } = useI18n();
  if (!pharmacy.updates?.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead title="Pharmacy news & updates" lede="Announcements from this listing — not generic health articles." />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {pharmacy.updates.map((u) => (
          <article key={u.title} className={CARD}>
            <p className="text-2xs text-ink-tertiary">{u.date}</p>
            <h3 className="mt-1.5 font-semibold text-[color:var(--pp-primary-950)]">{tx(u.title)}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{tx(u.summary)}</p>
            <p className="mt-3 text-xs font-medium text-[color:var(--pp-violet)]">{tx("Read more")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PharmacyArticlesSection({ pharmacy }: { pharmacy: PharmacyView }) {
  return (
    <RecentArticlesSection
      ownerId={pharmacy.ownerId}
      lede="News, articles, and other verified publications from this pharmacy."
    />
  );
}

export function PharmacyAwardsSection({ pharmacy }: { pharmacy: PharmacyView }) {
  const { tx } = useI18n();
  if (!pharmacy.awards?.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead title="Pharmacy achievements & certifications" lede="Verified recognitions listed on this profile." />
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {pharmacy.awards.map((a, i) => (
          <div key={a.title + a.year} className={"px-5 py-3.5 " + (i > 0 ? "border-t border-line" : "")}>
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx(a.title)}</p>
            <p className="mt-0.5 text-sm text-ink-secondary">
              {a.org}
              <span className="text-ink-tertiary"> · {a.year}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PharmacyFaqSection({ pharmacy }: { pharmacy: PharmacyView }) {
  return <FaqAccordion items={pharmacyFaqs(pharmacy)} />;
}

export function PharmacyGallerySection({ pharmacy }: { pharmacy: PharmacyView }) {
  const { tx } = useI18n();
  if (!pharmacy.gallery?.length) return null;
  return (
    <section className="min-w-0 scroll-mt-28">
      <SectionHead title="Pharmacy photos" lede="Verified images of this pharmacy." />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pharmacy.gallery.map((g) => (
          <figure key={g.src + g.label} className="overflow-hidden rounded-2xl border border-line bg-white">
            <img src={g.src} alt={g.label} className="aspect-[4/3] w-full object-cover" />
            <figcaption className="px-3 py-2 text-2xs text-ink-tertiary">{tx(g.label)}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function PharmacySidebarMap({ pharmacy }: { pharmacy: PharmacyView }) {
  return <DirectorySidebarMap query={pharmacyMapsQuery(pharmacy)} />;
}

export function PharmacyRelatedSection({ pharmacy }: { pharmacy: PharmacyView }) {
  return (
    <RelatedHealthcareOptions
      city={pharmacy.district || pharmacy.place}
      excludeId={pharmacy.id}
    />
  );
}

export function PharmacyProfileMid({ pharmacy }: { pharmacy: PharmacyView }) {
  return (
    <>
      <PharmacyServicesSection pharmacy={pharmacy} />
      <PharmacyOrderingSection pharmacy={pharmacy} />
      <PharmacyPharmacistsSection pharmacy={pharmacy} />
      <PharmacyAvailabilitySection pharmacy={pharmacy} />
      <PharmacyDeliverySection pharmacy={pharmacy} />
      <PharmacySafetySection />
      <PharmacyNewsSection pharmacy={pharmacy} />
      <PharmacyArticlesSection pharmacy={pharmacy} />
      <PharmacyAwardsSection pharmacy={pharmacy} />
    </>
  );
}

export function PharmacyProfileAfterReviews({ pharmacy }: { pharmacy: PharmacyView }) {
  return (
    <>
      <PharmacyFaqSection pharmacy={pharmacy} />
      <PharmacyGallerySection pharmacy={pharmacy} />
    </>
  );
}
