import { Navigate, useParams } from "react-router-dom";

/** Draft doctor layout is live. Keep this path so old links still resolve. */
export function DoctorPublicDraft() {
  const { nmcNumber } = useParams();
  return <Navigate to={`/doctors/${nmcNumber || ""}`} replace />;
}
