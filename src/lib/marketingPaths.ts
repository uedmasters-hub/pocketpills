/** Always public marketing chrome — even when signed in (How it works, Support). */
export function isAlwaysPublicPath(pathname: string) {
  return (
    pathname === "/how-it-works" ||
    pathname === "/about-us" ||
    pathname === "/questions"
  );
}

/** Treatment + Pharmacy browse: marketing when logged out, AppShell when logged in. */
export function isDualBrowsePath(pathname: string) {
  if (
    pathname === "/drug" ||
    pathname === "/find-care" ||
    pathname === "/delivery-check" ||
    pathname === "/offers"
  ) {
    return true;
  }
  if (pathname.startsWith("/drug/")) return true;
  if (pathname.startsWith("/treatment/")) return true;
  if (pathname.startsWith("/consult/")) return true;
  return false;
}

/** Any path that can use marketing chrome for guests. */
export function isMarketingPath(pathname: string) {
  if (pathname === "/") return true;
  return isAlwaysPublicPath(pathname) || isDualBrowsePath(pathname);
}
