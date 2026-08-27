/**
 * Hospital hourly appointments board.
 */
import { Navigate, useParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useShellColumn } from "@/lib/columnHover";
import { HospitalDayBoard } from "@/components/provider/HospitalDayBoard";
import { ProviderBreadcrumb } from "@/components/provider/ProviderBreadcrumb";
import { dateKey, parseDateKey } from "@/lib/hospitalOpsCharts";
import { useProvider } from "@/lib/providerAuth";
import { portalFor } from "@/lib/providerPortals";

const HOME = "/provider";

export function ProviderHospitalDayDraft() {
  const { tx } = useI18n();
  const { provider } = useProvider();
  const { date: raw } = useParams<{ date: string }>();
  const mainCol = useShellColumn("main");
  const date = parseDateKey(raw);
  const canonical = dateKey(date.year, date.month, date.day);
  const portal = provider ? portalFor(provider.vendorType, provider.ambulanceRole, provider.accountRole) : null;

  if (raw && raw !== canonical) {
    return <Navigate to={`/provider/schedule/${canonical}`} replace />;
  }

  return (
    <div
      className={"flex h-[calc(100dvh-9rem)] max-h-[calc(100dvh-9rem)] flex-col overflow-hidden " + mainCol.className}
      onMouseEnter={mainCol.onMouseEnter}
    >
      <ProviderBreadcrumb
        className="mb-4 shrink-0"
        items={[
          { label: tx(portal?.homeTitle || "Home"), to: HOME },
          { label: tx("Schedule") },
        ]}
      />

      <HospitalDayBoard date={date} />
    </div>
  );
}

export function ProviderDraftApptRedirect() {
  const { date } = useParams<{ date: string }>();
  return <Navigate to={date ? `/provider/schedule/${date}` : "/provider/schedule"} replace />;
}
