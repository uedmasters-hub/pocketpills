import { Navigate } from "react-router-dom";
import { dateKey, parseDraftToday } from "@/lib/hospitalOpsCharts";

export function ProviderSchedule() {
  const today = parseDraftToday();
  return <Navigate to={`/provider/schedule/${dateKey(today.year, today.month, today.day)}`} replace />;
}
