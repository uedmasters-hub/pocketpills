import { useLocation } from "react-router-dom";
import { isAlwaysPublicPath } from "@/lib/marketingPaths";

/** Where a listing is being viewed — signed-in app chrome vs public directory. */
export type ListingSurface = "app" | "public";

export function listingSurfaceFromPath(pathname: string): ListingSurface {
  if (isAlwaysPublicPath(pathname)) return "public";
  if (
    pathname.startsWith("/appointments") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/care") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/drug")
  ) {
    return "app";
  }
  return "public";
}

export function useListingSurface(): ListingSurface {
  return listingSurfaceFromPath(useLocation().pathname);
}
