import { Navigate } from "react-router-dom";

/** Old list page — the shop Activity rail is Your medicines after add. */
export function MedicationBasketDraft() {
  return <Navigate to="/drug/draft" replace />;
}
