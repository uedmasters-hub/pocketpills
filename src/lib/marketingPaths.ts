/** Always public marketing chrome — even when signed in (How it works, Support, doctor / pharmacy directory). */
export function isAlwaysPublicPath(pathname: string) {
  if (
    pathname === "/how-it-works" ||
    pathname.startsWith("/how-it-works/") ||
    pathname === "/about-us" ||
    pathname.startsWith("/about-us/") ||
    pathname === "/questions"
  ) {
    return true;
  }
  if (pathname === "/doctors" || pathname === "/doctors/claim") return true;
  if (pathname.startsWith("/doctors/")) return true;
  if (pathname === "/pharmacies" || pathname === "/pharmacies/claim") return true;
  if (pathname.startsWith("/pharmacies/")) return true;
  if (pathname === "/facilities" || pathname === "/facilities/claim") return true;
  if (pathname.startsWith("/facilities/")) return true;
  return false;
}

/** Fill / transfer / care — focused chrome, no marketing footer. */
export function isFocusedPatientFlow(pathname: string) {
  if (pathname.startsWith("/care/")) return true;
  return pathname === "/fill" || pathname === "/transfer" || pathname === "/delivery-check";
}

/** Pharmacy / drug / offers browse: marketing when logged out, AppShell when logged in. */
export function isDualBrowsePath(pathname: string) {
  if (
    pathname === "/drug" ||
    pathname === "/delivery-check" ||
    pathname === "/offers" ||
    pathname === "/find-care"
  ) {
    return true;
  }
  if (pathname.startsWith("/drug/")) {
    if (/^\/drug\/[^/]+\/order/.test(pathname)) return false;
    return true;
  }
  if (pathname.startsWith("/consult/")) return true;
  if (pathname.startsWith("/treatment/")) return true;
  return false;
}

/** Any path that can use marketing chrome for guests. */
export function isMarketingPath(pathname: string) {
  if (pathname === "/") return true;
  return isAlwaysPublicPath(pathname) || isDualBrowsePath(pathname);
}
