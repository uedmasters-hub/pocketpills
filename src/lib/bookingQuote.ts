/** Shared demo totals for booking checkouts (consultation, lab, visit). */

export const CONVENIENCE_FEE = 11.99;
export const CONSULT_INSURANCE_RATE = 0.6;

export function money(n: number) {
  return Math.max(0, Math.round(n * 100) / 100);
}

export function consultQuote(fee: number) {
  const convenience = fee > 0 ? CONVENIENCE_FEE : 0;
  const insurance = fee > 0 ? money(fee * CONSULT_INSURANCE_RATE) : 0;
  const beforeOffer = money(fee + convenience - insurance);
  return {
    consultation: money(fee),
    convenience,
    insurance,
    insurancePct: Math.round(CONSULT_INSURANCE_RATE * 100),
    beforeOffer,
  };
}

export function payableDue(beforeOffer: number, offerCredit: number) {
  return money(beforeOffer - money(Math.min(offerCredit, beforeOffer)));
}

export function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}
