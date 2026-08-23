/**
 * Date of birth helpers — store ISO `YYYY-MM-DD`, display as `DD / MM / YYYY`.
 */

/** Digits only, max 8 (DDMMYYYY). */
export function dobDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

/** Format running digits into `DD / MM / YYYY` as the user types (filled prefix only). */
export function formatDobDisplay(raw: string): string {
  const d = dobDigits(raw);
  const day = d.slice(0, 2);
  const month = d.slice(2, 4);
  const year = d.slice(4, 8);
  if (d.length <= 2) return day;
  if (d.length <= 4) return `${day} / ${month}`;
  return `${day} / ${month} / ${year}`;
}

/**
 * Full mask for overlay: filled digits + remaining `D`/`M`/`Y` placeholders.
 * e.g. digits "23" → `23 / MM / YYYY`
 */
export function dobMaskSegments(raw: string): { ch: string; filled: boolean }[] {
  const d = dobDigits(raw);
  const out: { ch: string; filled: boolean }[] = [];
  const digit = (i: number, ph: string) => {
    if (i < d.length) out.push({ ch: d[i]!, filled: true });
    else out.push({ ch: ph, filled: false });
  };
  digit(0, "D");
  digit(1, "D");
  out.push({ ch: " ", filled: false }, { ch: "/", filled: false }, { ch: " ", filled: false });
  digit(2, "M");
  digit(3, "M");
  out.push({ ch: " ", filled: false }, { ch: "/", filled: false }, { ch: " ", filled: false });
  digit(4, "Y");
  digit(5, "Y");
  digit(6, "Y");
  digit(7, "Y");
  return out;
}

/** Convert ISO `YYYY-MM-DD` (or loose digits) to display `DD / MM / YYYY`. */
export function isoToDobDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (m) return `${m[3]} / ${m[2]} / ${m[1]}`;
  return formatDobDisplay(iso);
}

/**
 * Convert display / digits to ISO `YYYY-MM-DD` when complete.
 * Incomplete values return "" so callers don't persist garbage.
 */
export function dobDisplayToIso(display: string): string {
  const d = dobDigits(display);
  if (d.length !== 8) return "";
  const day = d.slice(0, 2);
  const month = d.slice(2, 4);
  const year = d.slice(4, 8);
  return `${year}-${month}-${day}`;
}

/** True when value is a real calendar date in the past (≤ 120 years). */
export function isValidDob(value: string): boolean {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.test(value.trim())
    ? value.trim()
    : dobDisplayToIso(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return false;
  const now = new Date();
  if (dt > now) return false;
  if (now.getFullYear() - year > 120) return false;
  return true;
}
