import { Navigate } from "react-router-dom";
import { useProvider } from "@/lib/providerAuth";
import { ProviderHospitalHomeDraft } from "@/pages/provider/ProviderHospitalHomeDraft";

export function ProviderDashboard() {
  const { isDelegate } = useProvider();
  if (isDelegate) return <Navigate to="/provider/requests" replace />;
  return <ProviderHospitalHomeDraft />;
}
