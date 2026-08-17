import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, Field, Switch } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { CheckoutOffers, useOfferQuote } from "@/components/offers/CheckoutOffers";
import { ChoosePaymentOption, usePaymentFields } from "@/components/checkout/ChoosePaymentOption";
import type { CheckoutContext } from "@/lib/offers";
import { drugs } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/user";
import { createMedicationOrder } from "@/lib/orders";
import { loadSelectedPharmacy, saveSelectedPharmacy, type AreaPharmacy } from "@/lib/pharmacies";
import { pharmaciesForMedication, type MedStock } from "@/lib/pharmacySearch";
import { shortRegNo } from "@/lib/pharmacyDirectory";
import {
  fileToUpload,
  isReadableImage,
  matchSelectedDrug,
  revokeUploads,
  samplePrescriptionFile,
  scanPrescriptions,
  type DrugMatchStatus,
  type RxUpload,
} from "@/lib/rxOcr";

const DISPENSING_FEE = 11.99;
const STEPS = ["source", "capture", "verify", "details"] as const;
type Step = (typeof STEPS)[number] | "send" | "done";
type Method = "upload" | "fax" | "mail" | "transfer";
type RxCheck = DrugMatchStatus | "pending" | null;

export function MedicationOrder() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { displayName } = useUser();
  const drug = drugs.find((d) => d.slug === slug);

  const doseParam = params.get("dose") ?? "";
  const qtyParam = Number(params.get("qty") || 30);
  const [strength, setStrength] = useState(
    drug && drug.dosages.includes(doseParam) ? doseParam : (drug?.dosages[0] ?? ""),
  );
  const [qty, setQty] = useState([30, 60, 90].includes(qtyParam) ? qtyParam : 30);

  const [step, setStep] = useState<Step>(drug && !drug.rx ? "details" : "source");
  const [method, setMethod] = useState<Method | null>(null);
  const [files, setFiles] = useState<RxUpload[]>([]);
  const [clinic, setClinic] = useState("");
  const [prescriber, setPrescriber] = useState("");
  const [mailAddress, setMailAddress] = useState("");
  const [transferPharmacy, setTransferPharmacy] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [rxCheck, setRxCheck] = useState<RxCheck>(null);
  const [ocrStrength, setOcrStrength] = useState("");

  const [who, setWho] = useState<"self" | "other">("self");
  const [otherName, setOtherName] = useState("");
  const [address, setAddress] = useState("221 King St W, Toronto, ON");
  const [packaging, setPackaging] = useState<"pocketpacks" | "vials">("vials");
  const [useInsurance, setUseInsurance] = useState(true);
  const pay = usePaymentFields();
  const [orderId, setOrderId] = useState("");
  const [sendStep, setSendStep] = useState(0);
  const [pharmacyId, setPharmacyId] = useState("");

  const [dragOver, setDragOver] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPct, setScanPct] = useState(0);
  const [scanLabel, setScanLabel] = useState("Reading your prescription");
  const fileRef = useRef<HTMLInputElement>(null);
  const scannedKey = useRef("");
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => {
    return () => revokeUploads(filesRef.current);
  }, []);

  useEffect(() => {
    if (step !== "send") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = window.setTimeout(() => setSendStep(1), reduce ? 200 : 900);
    const t2 = window.setTimeout(() => setSendStep(2), reduce ? 400 : 1800);
    const t3 = window.setTimeout(() => setStep("done"), reduce ? 600 : 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [step]);

  const drugCost = drug ? Math.round(drug.price * (qty / 30) * 100) / 100 : 0;
  const withFee = drugCost + (drug ? DISPENSING_FEE : 0);
  const covered = useInsurance && drug ? Math.round(withFee * (drug.coverage / 100) * 100) / 100 : 0;
  const total$ = Math.max(0, Math.round((withFee - covered) * 100) / 100);
  const offerCtx = useMemo<CheckoutContext>(
    () => ({
      kind: "fill",
      amount: total$,
      orderTotal: withFee,
      dispensingFee: DISPENSING_FEE,
      medSlugs: drug ? [drug.slug] : [],
      medNames: drug ? [drug.name, drug.generic ?? ""] : [],
    }),
    [total$, withFee, drug],
  );
  const offerQuote = useOfferQuote(offerCtx);
  const fill = useMemo(
    () => (drug ? pharmaciesForMedication(drug) : { pharmacies: [] as AreaPharmacy[], stockById: {} as Record<string, MedStock>, recommendedId: "" }),
    [drug],
  );

  useEffect(() => {
    if (!fill.pharmacies.length) return;
    if (pharmacyId && fill.pharmacies.some((p) => p.id === pharmacyId)) return;
    const saved = loadSelectedPharmacy();
    const next =
      saved && fill.pharmacies.some((p) => p.id === saved.id) ? saved.id : fill.recommendedId;
    if (next) setPharmacyId(next);
  }, [fill, pharmacyId]);

  if (!drug) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <p className="font-semibold text-[color:var(--pp-primary-950)]">{tx("Medication not found")}</p>
        <Link to="/drug" className="mt-2 inline-block text-sm font-semibold text-[color:var(--pp-violet)] hover:underline">
          {tx("Back to Medications Index")}
        </Link>
      </div>
    );
  }

  const backToDrug = `/drug/${drug.slug}`;
  const close = () => nav(backToDrug);
  const selectedPharmacy = fill.pharmacies.find((p) => p.id === pharmacyId) ?? null;
  const pickPharmacy = (p: AreaPharmacy) => {
    setPharmacyId(p.id);
    saveSelectedPharmacy(p);
  };
  const visibleSteps = drug.rx ? STEPS : (["details"] as const);
  const idx = (visibleSteps as readonly string[]).indexOf(step);
  const total = visibleSteps.length;
  const goNext = () => {
    if (idx < 0 || idx >= total - 1) {
      setStep("done");
      return;
    }
    setStep(visibleSteps[idx + 1] as Step);
  };
  const goBack = () => {
    if (step === "send" || step === "done" || idx <= 0) close();
    else setStep(visibleSteps[idx - 1] as Step);
  };

  const addUploads = (list: FileList | File[]) => {
    const next = Array.from(list).filter(isReadableImage).map(fileToUpload);
    if (!next.length) return;
    scannedKey.current = "";
    setFiles((prev) => [...prev, ...next]);
  };
  const removeUpload = (id: string) => {
    scannedKey.current = "";
    setFiles((prev) => {
      const gone = prev.find((f) => f.id === id);
      if (gone) revokeUploads([gone]);
      return prev.filter((f) => f.id !== id);
    });
  };

  const runVerify = async () => {
    if (method !== "upload") {
      setRxCheck("pending");
      setOcrText("");
      setStep("verify");
      return;
    }
    if (!files.some((f) => isReadableImage(f.file))) {
      setRxCheck("unreadable");
      setOcrText("");
      setStep("verify");
      return;
    }
    const key = files.map((f) => f.id).join(",");
    if (key && key === scannedKey.current) {
      setStep("verify");
      return;
    }
    setScanning(true);
    setScanPct(4);
    setScanLabel(tx("Checking this photo for {name}").replace("{name}", drug.name));
    try {
      const result = await scanPrescriptions(files, (label, pct) => {
        setScanLabel(label);
        setScanPct(pct);
      });
      scannedKey.current = key;
      setOcrText(result.text);
      const match = matchSelectedDrug(drug, result);
      setRxCheck(match.status);
      if (match.hit?.strength && drug.dosages.includes(match.hit.strength)) {
        setOcrStrength(match.hit.strength);
      } else {
        setOcrStrength("");
      }
      setStep("verify");
    } catch {
      setRxCheck("unreadable");
      setOcrText("");
      setStep("verify");
    } finally {
      setScanning(false);
    }
  };

  const placeOrder = () => {
    const due = offerQuote.due;
    const order = createMedicationOrder({
      name: drug.name,
      strength,
      qty,
      unitPrice: drug.price / 30,
      dispensingFee: DISPENSING_FEE,
      insuranceCovered: covered + offerQuote.credit,
      address,
      patient: who === "other" && otherName.trim() ? otherName.trim() : displayName,
      cardLast4: pay.last4,
      due,
      pharmacyName: selectedPharmacy?.name,
    });
    setOrderId(order.id);
    setSendStep(0);
    setStep("send");
  };

  const captureReady =
    method === "upload" ? files.length > 0 :
    method === "fax" ? Boolean(clinic) :
    method === "mail" ? Boolean(mailAddress) :
    Boolean(transferPharmacy);

  const headerTitle =
    step === "source" ? tx("Prescription") :
    step === "capture" ? (method === "upload" ? tx("Upload") : method === "fax" ? tx("Clinic details") : method === "mail" ? tx("Mailing kit") : tx("Transfer")) :
    step === "verify" ? tx("Check prescription") :
    step === "details" ? tx("Delivery details") :
    step === "send" ? tx("Sending request") :
    tx("Order placed");

  const ctaLabel =
    step === "details"
      ? (offerQuote.due > 0 ? tx("Pay & confirm") : tx("Place order"))
      : step === "verify"
        ? tx("Continue with {name}").replace("{name}", drug.name)
        : step === "capture" && method === "upload"
          ? tx("Check photo")
          : tx("Continue");

  const ctaDisabled =
    scanning ||
    (step === "source" && !method) ||
    (step === "capture" && !captureReady) ||
    (step === "verify" && !selectedPharmacy) ||
    (step === "details" && !selectedPharmacy) ||
    (step === "details" && who === "other" && !otherName.trim()) ||
    (step === "details" && !pay.ready(offerQuote.due));

  const onCta =
    step === "capture" ? () => void runVerify() :
    step === "details" ? placeOrder :
    goNext;

  const ctaHint =
    step === "source" && !method
      ? tx("Choose how we'll get the prescription on the left.")
      : step === "capture" && !captureReady
        ? tx("Add the details on the left to continue.")
        : (step === "verify" || step === "details") && !selectedPharmacy
          ? tx("Choose a pharmacy on the left to continue.")
          : step === "details" && who === "other" && !otherName.trim()
            ? tx("Add a patient on the left to continue.")
            : step === "details" && !pay.ready(offerQuote.due)
              ? tx("Choose a payment option on the left to continue.")
              : "";

  const methodLabel =
    method === "upload" ? tx("Photo upload") :
    method === "fax" ? tx("Clinic fax") :
    method === "mail" ? tx("Mail-in kit") :
    method === "transfer" ? tx("Pharmacy transfer") :
    tx("Not chosen yet");

  const rxLabel =
    rxCheck === "matched" ? tx("Matched on photo") :
    rxCheck === "pending" ? tx("Pharmacy will match") :
    rxCheck === "unmatched" || rxCheck === "unreadable" ? tx("Sent to pharmacy to review") :
    method ? tx("Waiting for prescription") : tx("Not chosen yet");

  const patientLabel = who === "other" && otherName.trim() ? otherName.trim() : displayName;
  const paidLabel = offerQuote.due > 0 ? `$${offerQuote.due.toFixed(2)}` : tx("covered by your plan");

  if (step === "send" || step === "done") {
    return (
      <div className="relative mx-auto w-full max-w-lg">
        <ConfettiBurst fire={step === "done"} />
        <header className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <span />
          <h1 className="text-center text-sm font-medium text-[color:var(--pp-primary-950)] sm:text-base">
            {headerTitle}
          </h1>
          <button
            type="button"
            onClick={close}
            className="grid h-8 w-8 place-items-center justify-self-end rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
            aria-label={tx("Close")}
          >
            ✕
          </button>
        </header>

        {step === "send" ? (
          <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center">
            <span
              className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[color:var(--pp-primary-100)]"
              aria-hidden
            >
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--pp-primary-950)] border-t-transparent" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
              {tx("Sending your order")}
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              {tx("Your order is being sent to {name} for review.")
                .replace("{name}", selectedPharmacy?.name || tx("the pharmacy"))}
            </p>
            <ol className="mx-auto mt-8 max-w-xs space-y-3 text-left">
              {[
                tx("Payment received"),
                tx("Sent to pharmacy"),
                tx("Pharmacist reviewing"),
              ].map((label, i) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span
                    className={
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full text-2xs font-semibold " +
                      (sendStep > i
                        ? "bg-wellness text-white"
                        : sendStep === i
                          ? "bg-[color:var(--pp-primary-950)] text-white"
                          : "border border-line text-ink-tertiary")
                    }
                  >
                    {sendStep > i ? "✓" : i + 1}
                  </span>
                  <span className={sendStep >= i ? "text-[color:var(--pp-primary-950)]" : "text-ink-tertiary"}>
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="animate-fade-up space-y-4">
            <div className="rounded-2xl border border-line bg-white p-6 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-wellness-subtle text-2xl" aria-hidden>
                ✓
              </span>
              <p className="pp-caps mt-4 text-[color:var(--pp-violet)]">{tx("Order placed")}</p>
              <h2 className="mt-2 font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
                {tx("Waiting for the pharmacy")}
              </h2>
              <p className="mt-2 text-sm text-ink-secondary">
                {tx("We'll notify you when a pharmacist starts filling {name}.")
                  .replace("{name}", drug.name)}
              </p>
              {rxCheck === "unmatched" || rxCheck === "unreadable" ? (
                <p className="mt-2 text-sm text-ink-tertiary">
                  {tx("A pharmacist will review the prescription image before this fill is dispensed.")}
                </p>
              ) : null}
              {orderId ? (
                <p className="mt-4 rounded-xl bg-[color:var(--pp-primary-100)] px-4 py-3 font-mono text-sm font-semibold text-[color:var(--pp-primary-950)]">
                  {orderId}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 rounded-2xl border border-line bg-white p-5">
              <CheckoutRow k={tx("Medication")} v={`${drug.name}${strength ? ` ${strength}` : ""}`} />
              <CheckoutRow k={tx("Quantity")} v={String(qty)} />
              {selectedPharmacy ? <CheckoutRow k={tx("Pharmacy")} v={selectedPharmacy.name} /> : null}
              <CheckoutRow k={tx("Patient")} v={patientLabel} />
              {method ? <CheckoutRow k={tx("Prescription")} v={methodLabel} /> : null}
              {method === "upload" ? <CheckoutRow k={tx("Photo")} v={rxLabel} /> : null}
              <CheckoutRow k={tx("Packaging")} v={packaging === "pocketpacks" ? tx("PocketPacks") : tx("Vials")} />
              <CheckoutRow k={tx("Paid")} v={paidLabel} />
            </div>

            <div className="space-y-2 pt-2">
              <Button
                fullWidth
                onClick={() => nav(orderId ? `/orders/${orderId}` : "/orders")}
              >
                {tx("Track order")}
              </Button>
              <Button fullWidth variant="secondary" onClick={() => nav("/messages")}>
                {tx("Message care team")}
              </Button>
              <Button fullWidth variant="ghost" onClick={() => nav("/orders")}>
                {tx("All orders")}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const left = (() => {
    if (step === "source") {
      return (
        <section>
          <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("How should we get the prescription for {name}?").replace("{name}", drug.name)}
          </h2>
          <p className="mt-1 text-sm text-ink-tertiary">
            {tx("This order is only for the medication you picked. A pharmacist still reviews before it ships.")}
          </p>
          <div className="mt-5 space-y-3" role="radiogroup">
            {(
              [
                { id: "upload" as const, icon: "📷", title: tx("Upload a photo"), desc: tx("Snap the prescription or label for this medication") },
                { id: "fax" as const, icon: "🏥", title: tx("My clinic will fax it"), desc: tx("We'll receive it at 1-855-950-7226") },
                { id: "mail" as const, icon: "📮", title: tx("Mail it in"), desc: tx("We'll send you a free prepaid mailing kit") },
                { id: "transfer" as const, icon: "📦", title: tx("Transfer from a pharmacy"), desc: tx("We'll request this medication from your current pharmacy") },
              ]
            ).map((o) => (
              <Card
                key={o.id}
                interactive
                role="radio"
                aria-checked={method === o.id}
                onClick={() => setMethod(o.id)}
                className={"flex items-center gap-4 p-4 " + (method === o.id ? "ring-2 ring-primary" : "")}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-subtle text-xl" aria-hidden>
                  {o.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{o.title}</p>
                  <p className="text-sm text-ink-tertiary">{o.desc}</p>
                </div>
                {method === o.id && <span className="ml-auto text-primary" aria-hidden>✓</span>}
              </Card>
            ))}
          </div>
        </section>
      );
    }

    if (step === "capture" && scanning) {
      return (
        <section>
          <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
            {tx("Checking your prescription")}
          </h2>
          <p className="mt-1 text-sm text-ink-tertiary">
            {tx("We're looking for {name} on the photo — not building a new medication list.").replace("{name}", drug.name)}
          </p>
          <Card className="mt-5 p-6">
            <p className="text-sm font-medium text-ink">{tx(scanLabel)}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[color:var(--pp-primary-100)]">
              <div
                className="h-full rounded-full bg-[color:var(--pp-violet)] transition-[width] duration-300"
                style={{ width: `${Math.max(6, scanPct)}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-ink-tertiary tnum">{scanPct}%</p>
          </Card>
        </section>
      );
    }

    if (step === "capture") {
      return (
        <section>
          <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
            {method === "upload" ? tx("Add a photo of this prescription") :
              method === "fax" ? tx("Clinic details") :
              method === "mail" ? tx("Where should we send the kit?") :
              tx("Your current pharmacy")}
          </h2>
          <p className="mt-1 text-sm text-ink-tertiary">
            {method === "upload"
              ? tx("We'll check the photo for {name}. If we can't read it, you can still order — the pharmacy will review.").replace("{name}", drug.name)
              : tx("Your selected medication does not change. The pharmacy will match the incoming Rx.")}
          </p>
          <div className="mt-5 space-y-4">
            {method === "upload" && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) addUploads(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Card
                  className={
                    "flex cursor-pointer flex-col items-center gap-2 border-dashed p-8 text-center " +
                    (dragOver ? "border-[color:var(--pp-violet)] bg-[color:var(--pp-primary-100)]" : "")
                  }
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files.length) addUploads(e.dataTransfer.files);
                  }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    fileRef.current?.click();
                  }}
                >
                  <span className="text-3xl" aria-hidden>📄</span>
                  <p className="font-semibold text-ink">{tx("Drag & drop or tap to upload")}</p>
                  <p className="text-sm text-ink-tertiary">{tx("Clear photos of the front (and back) of your prescription")}</p>
                  <Button variant="secondary" size="sm" className="mt-2" onClick={() => fileRef.current?.click()}>
                    {tx("Add a photo")}
                  </Button>
                  <button
                    type="button"
                    onClick={() => void samplePrescriptionFile().then((f) => addUploads([f]))}
                    className="mt-1 text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
                  >
                    {tx("Use a sample prescription")}
                  </button>
                </Card>
                {files.map((f) => (
                  <Card key={f.id} className="flex items-center gap-3 p-3">
                    {f.previewUrl ? (
                      <img src={f.previewUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-subtle">🖼️</span>
                    )}
                    <span className="flex-1 truncate text-sm font-medium text-ink">{f.name}</span>
                    <button type="button" onClick={() => removeUpload(f.id)} className="text-ink-tertiary hover:text-danger" aria-label={tx("Remove")}>✕</button>
                  </Card>
                ))}
              </>
            )}
            {method === "fax" && (
              <>
                <Card className="border-info/30 bg-info-subtle p-4">
                  <p className="text-sm text-ink-secondary">
                    {tx("Ask your clinic to fax the prescription for {name} to").replace("{name}", drug.name)}{" "}
                    <span className="font-semibold text-ink">1-855-950-7226</span>.
                  </p>
                </Card>
                <Card className="p-5"><Field label={tx("Clinic name")} placeholder={tx("e.g. Downtown Family Health")} value={clinic} onChange={(e) => setClinic(e.target.value)} /></Card>
                <Card className="p-5"><Field label={tx("Prescriber name")} placeholder={tx("e.g. Dr. Smith")} value={prescriber} onChange={(e) => setPrescriber(e.target.value)} /></Card>
              </>
            )}
            {method === "mail" && (
              <Card className="p-5">
                <Field label={tx("Mailing address")} placeholder={tx("Street, city, province, postal code")} value={mailAddress} onChange={(e) => setMailAddress(e.target.value)} />
              </Card>
            )}
            {method === "transfer" && (
              <Card className="p-5">
                <Field
                  label={tx("Current pharmacy")}
                  placeholder={tx("e.g. Shoppers Drug Mart, Queen St")}
                  value={transferPharmacy}
                  onChange={(e) => setTransferPharmacy(e.target.value)}
                />
                <p className="mt-3 text-sm text-ink-tertiary">
                  {tx("We'll only request {name} — this is not a full pharmacy transfer.").replace("{name}", drug.name)}
                </p>
              </Card>
            )}
          </div>
        </section>
      );
    }

    if (step === "verify") {
      const matched = rxCheck === "matched";
      const pending = rxCheck === "pending";
      return (
        <section>
          <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">
            {matched
              ? tx("We found {name} on your prescription").replace("{name}", drug.name)
              : pending
                ? tx("We'll confirm {name} when the prescription arrives").replace("{name}", drug.name)
                : tx("We couldn't confirm {name} on this photo").replace("{name}", drug.name)}
          </h2>
          <p className="mt-1 text-sm text-ink-tertiary">
            {matched
              ? tx("This order stays {name}. A pharmacist will still verify before it ships.").replace("{name}", drug.name)
              : pending
                ? tx("Your selected medication does not change. The pharmacy will match the incoming Rx.")
                : tx("The photo will still go to the pharmacy. You can order {name} anyway.").replace("{name}", drug.name)}
          </p>
          <Card className={"mt-5 p-5 " + (matched ? "border-[color:var(--pp-violet)]/30 bg-[color:var(--pp-primary-100)]" : "")}>
            <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">
              {matched
                ? tx("Matched to your selected medication")
                : pending
                  ? tx("Pharmacy will match this order")
                  : tx("Not confirmed by scan — still send to pharmacy")}
            </p>
            <p className="mt-2 text-sm text-ink-secondary">
              {matched
                ? tx("We used the photo only to check that this is the right drug. We did not replace it with other names from the scan.")
                : pending
                  ? tx("Fax, mail, and pharmacy transfers are reviewed by a pharmacist against this order.")
                  : tx("Handwriting and faded photos often fail automatic reading. A licensed pharmacist will review the image before anything is filled.")}
            </p>
            {matched && ocrStrength && ocrStrength !== strength ? (
              <button
                type="button"
                onClick={() => setStrength(ocrStrength)}
                className="mt-3 text-sm font-medium text-[color:var(--pp-violet)] hover:underline"
              >
                {tx("Use strength from photo: {s}").replace("{s}", ocrStrength)}
              </button>
            ) : null}
          </Card>
          {ocrText.trim() ? (
            <details className="mt-4 rounded-2xl border border-line bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-ink">{tx("Text we read from the photo")}</summary>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-5 text-ink-secondary">
                {ocrText.trim()}
              </pre>
            </details>
          ) : null}

          <PharmacyList
            drugName={drug.name}
            pharmacies={fill.pharmacies}
            stockById={fill.stockById}
            recommendedId={fill.recommendedId}
            selectedId={pharmacyId}
            onSelect={pickPharmacy}
          />
        </section>
      );
    }

    if (step === "details") {
      return (
        <>
          <section>
            <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">{tx("Who is this for?")}</h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              {tx("Who this is for, where to send it, and how to pack {name}.").replace("{name}", drug.name)}
            </p>
            <div className="mt-5 space-y-4">
              {!drug.rx ? (
                <PharmacyList
                  drugName={drug.name}
                  pharmacies={fill.pharmacies}
                  stockById={fill.stockById}
                  recommendedId={fill.recommendedId}
                  selectedId={pharmacyId}
                  onSelect={pickPharmacy}
                />
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                {(["self", "other"] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWho(w)}
                    className={"h-12 rounded-xl border text-sm font-semibold " + (who === w ? "border-primary bg-primary-subtle text-primary" : "border-line bg-white text-ink-secondary")}
                  >
                    {w === "self" ? tx("Myself") : tx("A family member")}
                  </button>
                ))}
              </div>
              {who === "other" && (
                <Card className="p-5">
                  <Field label={tx("Full name")} placeholder={tx("e.g. Jordan Chen")} value={otherName} onChange={(e) => setOtherName(e.target.value)} />
                </Card>
              )}
              <Card className="p-5">
                <Field label={tx("Delivery address")} placeholder={tx("Street, city, province, postal code")} value={address} onChange={(e) => setAddress(e.target.value)} />
              </Card>
              <Card className="space-y-4 p-5">
                <Switch
                  checked={packaging === "pocketpacks"}
                  onChange={(v) => setPackaging(v ? "pocketpacks" : "vials")}
                  label={tx("PocketPacks")}
                  desc={tx("Pouches sorted by date & time. Turn off for a standard vial.")}
                />
                <div className="border-t border-line" />
                <Switch
                  checked={useInsurance}
                  onChange={setUseInsurance}
                  label={tx("Bill typical insurance")}
                  desc={tx("Estimate only. Your pharmacist confirms coverage.")}
                />
              </Card>
            </div>
          </section>
          <ChoosePaymentOption pay={pay} due={offerQuote.due} />
        </>
      );
    }

    return null;
  })();

  return (
    <div className="w-full min-w-0">
      <header className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 justify-self-start text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]"
        >
          ← {tx("Back")}
        </button>
        <h1 className="text-center text-sm font-medium text-[color:var(--pp-primary-950)] sm:text-base">
          {headerTitle}
        </h1>
        <button
          type="button"
          onClick={close}
          className="grid h-8 w-8 place-items-center justify-self-end rounded-full text-ink-tertiary hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
          aria-label={tx("Close")}
        >
          ✕
        </button>
      </header>

      <div className="grid w-full min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:gap-x-8 xl:gap-x-10">
        <div className="min-w-0 space-y-10 lg:col-start-1">{left}</div>

        <aside className="w-full min-w-0 space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-28 lg:self-start">
          <div>
            <h2 className="font-display text-2xl font-medium text-[color:var(--pp-primary-950)]">{tx("Review & confirm")}</h2>
            <p className="mt-1 text-sm text-ink-tertiary">{tx("Confirm details before booking")}</p>
          </div>
          <div className="flex w-full max-h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-[1.5rem] border border-line bg-white shadow-[0_12px_40px_rgba(24,7,48,0.06)]">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-[color:var(--pp-primary-950)]">{drug.name}</p>
                  {drug.generic && drug.generic !== drug.name ? (
                    <p className="mt-0.5 text-sm text-ink-tertiary">{drug.generic}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="rounded-full bg-wellness-subtle px-2.5 py-1 text-2xs font-semibold text-wellness">
                    {tx("Free delivery")}
                  </span>
                  <Link to={backToDrug} className="text-sm font-medium text-[color:var(--pp-violet)] hover:opacity-70">
                    {tx("Change")}
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs text-ink-secondary">{tx("Dosage")}</span>
                  <select
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    className="h-10 w-full rounded-xl border border-line bg-white px-2.5 text-sm text-ink focus:border-primary"
                  >
                    {drug.dosages.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs text-ink-secondary">{tx("Quantity")}</span>
                  <select
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-line bg-white px-2.5 text-sm text-ink focus:border-primary"
                  >
                    {[30, 60, 90].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
                <Fact k={tx("Prescription")} v={methodLabel} />
                {method === "upload" ? <Fact k={tx("Photo")} v={rxLabel} /> : null}
                {selectedPharmacy ? <Fact k={tx("Pharmacy")} v={selectedPharmacy.name} /> : null}
                <Fact k={tx("Patient")} v={who === "other" && otherName.trim() ? otherName : displayName} />
                <Fact k={tx("Packaging")} v={packaging === "pocketpacks" ? tx("PocketPacks") : tx("Vials")} />
              </div>

              <div className="mt-5 space-y-1.5 border-t border-line pt-5 text-sm">
                <Row k={tx("Drug cost")} v={`$${drugCost.toFixed(2)}`} />
                <Row k={tx("Dispensing fee")} v={`$${DISPENSING_FEE.toFixed(2)}`} />
                <Row k={tx("Delivery")} v={tx("FREE")} tone />
                {useInsurance ? <Row k={`${tx("Insurance")} (${drug.coverage}%)`} v={`−$${covered.toFixed(2)}`} tone /> : null}
                {offerQuote.credit > 0 ? <Row k={tx("Offer")} v={`−$${offerQuote.credit.toFixed(2)}`} tone /> : null}
                <div className="flex items-end justify-between border-t border-line pt-3">
                  <span className="font-semibold text-[color:var(--pp-primary-950)]">{tx("You pay")}</span>
                  <span className="font-display text-3xl font-medium leading-none text-[color:var(--pp-primary-950)] tnum">
                    ${offerQuote.due.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 space-y-3 px-6 pb-6 pt-5">
              <Button
                fullWidth
                disabled={ctaDisabled}
                onClick={onCta}
                className="!rounded-2xl"
                title={ctaDisabled && ctaHint ? ctaHint : undefined}
              >
                {ctaLabel}
              </Button>
              <button
                type="button"
                onClick={() => nav("/messages")}
                className="w-full py-1 text-center text-sm font-medium text-[color:var(--pp-primary-950)] hover:opacity-70"
              >
                {tx("Message care team")}
              </button>
            </div>
          </div>
          <p className="px-1 text-center text-2xs leading-relaxed text-ink-tertiary">
            {tx("Licensed Canadian pharmacists review every order before it ships.")}
          </p>
          {step === "details" ? <CheckoutOffers context={offerCtx} /> : null}
        </aside>
      </div>
    </div>
  );
}

function PharmacyList({
  drugName,
  pharmacies,
  stockById,
  recommendedId,
  selectedId,
  onSelect,
}: {
  drugName: string;
  pharmacies: AreaPharmacy[];
  stockById: Record<string, MedStock>;
  recommendedId: string;
  selectedId: string;
  onSelect: (p: AreaPharmacy) => void;
}) {
  const { tx } = useI18n();
  return (
    <div className="mt-8">
      <h3 className="font-display text-xl font-medium text-[color:var(--pp-primary-950)]">
        {tx("Pharmacies that can deliver {name}").replace("{name}", drugName)}
      </h3>
      <p className="mt-1 text-sm text-ink-tertiary">
        {tx("We selected a recommended pharmacy. You can choose another before you pay.")}
      </p>
      {pharmacies.length === 0 ? (
        <p className="mt-4 text-sm text-ink-tertiary">
          {tx("No pharmacies listed for delivery yet.")}
        </p>
      ) : (
        <div className="mt-4 space-y-3" role="radiogroup" aria-label={tx("Pharmacy")}>
          {pharmacies.map((p) => {
            const on = selectedId === p.id;
            const recommended = p.id === recommendedId;
            const stock = stockById[p.id];
            const loc = p.address || p.city;
            const reg = p.id.replace(/^dda-/, "");
            return (
              <Card
                key={p.id}
                interactive
                role="radio"
                aria-checked={on}
                onClick={() => onSelect(p)}
                className={"p-4 " + (on ? "ring-2 ring-primary" : "")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[color:var(--pp-primary-950)]">{p.name}</p>
                    {loc ? <p className="mt-0.5 text-sm text-ink-tertiary">{loc}</p> : null}
                    {reg ? (
                      <p className="mt-0.5 text-2xs text-ink-tertiary">
                        DDA · #{shortRegNo(reg)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {recommended ? (
                      <span className="rounded-full bg-wellness-subtle px-2.5 py-1 text-2xs font-semibold text-wellness">
                        {tx("Recommended")}
                      </span>
                    ) : null}
                    {stock === "available" ? (
                      <span className="text-2xs font-medium text-wellness">{tx("Available")}</span>
                    ) : stock === "limited" ? (
                      <span className="text-2xs font-medium text-ink-secondary">{tx("Limited availability")}</span>
                    ) : null}
                    {on ? <span className="text-primary" aria-hidden>✓</span> : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckoutRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-ink-tertiary">{k}</span>
      <span className="text-right text-sm font-medium text-[color:var(--pp-primary-950)]">{v}</span>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-ink-tertiary">{k}</span>
      <span className="max-w-[60%] text-right font-medium text-[color:var(--pp-primary-950)]">{v}</span>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-secondary">{k}</span>
      <span className={tone ? "font-medium text-wellness tnum" : "text-ink tnum"}>{v}</span>
    </div>
  );
}