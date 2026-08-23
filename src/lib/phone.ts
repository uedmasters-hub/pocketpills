/**
 * Phone helpers — country dropdown + national number.
 * Stored form: `+977 - 1234567890`.
 */

import {
  DEFAULT_PHONE_COUNTRY_ISO,
  PHONE_COUNTRIES,
  groupPhoneCountriesByRegion,
  type PhoneCountry,
} from "@/lib/phoneCountries";

export type { PhoneCountry };
export { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY_ISO, groupPhoneCountriesByRegion };

/** @deprecated Prefer DEFAULT_PHONE_COUNTRY_ISO ("NP"). */
export const DEFAULT_PHONE_COUNTRY = DEFAULT_PHONE_COUNTRY_ISO;

const byIso = new Map(PHONE_COUNTRIES.map((c) => [c.iso, c]));

/** Unique dial codes, longest first (so `977` wins over shorter prefixes). */
const UNIQUE_CODES_LONGEST_FIRST = [
  ...new Set(PHONE_COUNTRIES.map((c) => c.code)),
].sort((a, b) => b.length - a.length);

/** Prefer a major country when several share a dial code. */
const PREFERRED_ISO_FOR_CODE: Record<string, string> = {
  "1": "US",
  "7": "RU",
  "44": "GB",
  "61": "AU",
  "64": "NZ",
  "212": "MA",
  "262": "RE",
  "358": "FI",
  "590": "GP",
  "594": "GF",
  "596": "MQ",
};

/** First / preferred country for each dial code. */
const countryByCode = new Map<string, PhoneCountry>();
for (const c of PHONE_COUNTRIES) {
  if (!countryByCode.has(c.code)) countryByCode.set(c.code, c);
}
for (const [code, iso] of Object.entries(PREFERRED_ISO_FOR_CODE)) {
  const c = byIso.get(iso);
  if (c && c.code === code) countryByCode.set(code, c);
}

export function getPhoneCountry(isoOrCode: string): PhoneCountry {
  return byIso.get(isoOrCode) ?? countryByCode.get(isoOrCode) ?? PHONE_COUNTRIES[0]!;
}

export function nationalLenFor(isoOrCode: string): number {
  return getPhoneCountry(isoOrCode).nationalLen;
}

/** Digits only. */
export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Split a stored/typed value into country + national digits.
 * Prefers `preferredIso` when the dial code is shared (e.g. NANP +1).
 */
export function splitPhone(
  raw: string,
  preferredIso: string = DEFAULT_PHONE_COUNTRY_ISO,
): { iso: string; cc: string; national: string } {
  const preferred = getPhoneCountry(preferredIso);
  const d = phoneDigits(raw);
  if (!d) return { iso: preferred.iso, cc: preferred.code, national: "" };

  for (const code of UNIQUE_CODES_LONGEST_FIRST) {
    if (!d.startsWith(code)) continue;
    const match =
      preferred.code === code ? preferred : (countryByCode.get(code) ?? preferred);
    const national = d.slice(code.length).slice(0, match.nationalLen);
    return { iso: match.iso, cc: match.code, national };
  }

  return {
    iso: preferred.iso,
    cc: preferred.code,
    national: d.slice(0, preferred.nationalLen),
  };
}

/** Compose stored value: `+977 - 1234567890` (partial allowed mid-edit). */
export function composePhone(isoOrCode: string, nationalRaw: string): string {
  const country = getPhoneCountry(isoOrCode);
  const national = phoneDigits(nationalRaw).slice(0, country.nationalLen);
  if (!national) return "";
  return `+${country.code} - ${national}`;
}

/** Canonical complete value, or "" if incomplete. */
export function formatPhoneCanonical(raw: string, preferredIso?: string): string {
  const { iso, cc, national } = splitPhone(raw, preferredIso ?? DEFAULT_PHONE_COUNTRY_ISO);
  const country = getPhoneCountry(iso);
  if (national.length !== country.nationalLen) return "";
  return `+${cc} - ${national}`;
}

/** Soft display for login / mid-edit. */
export function formatPhoneSoft(raw: string, preferredIso?: string): string {
  const { cc, national } = splitPhone(raw, preferredIso ?? DEFAULT_PHONE_COUNTRY_ISO);
  if (!national && !phoneDigits(raw)) return "";
  if (!national) return `+${cc}`;
  return `+${cc} - ${national}`;
}

/** Normalize any stored phone into canonical or soft form. */
export function normalizePhoneValue(raw: string, preferredIso?: string): string {
  const canon = formatPhoneCanonical(raw, preferredIso);
  if (canon) return canon;
  return formatPhoneSoft(raw, preferredIso);
}

/** Overlay mask for the national number only. */
export function nationalMaskSegments(
  nationalRaw: string,
  isoOrCode: string = DEFAULT_PHONE_COUNTRY_ISO,
): { ch: string; filled: boolean }[] {
  const len = nationalLenFor(isoOrCode);
  const d = phoneDigits(nationalRaw).slice(0, len);
  const out: { ch: string; filled: boolean }[] = [];
  for (let i = 0; i < len; i++) {
    if (i < d.length) out.push({ ch: d[i]!, filled: true });
    else out.push({ ch: "_", filled: false });
  }
  return out;
}

export function isValidPhone(raw: string): boolean {
  return Boolean(formatPhoneCanonical(raw));
}
