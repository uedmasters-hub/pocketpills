import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { JourneyProvider } from "@/lib/journey";

import { Landing } from "@/pages/Landing";
import { Home } from "@/pages/Home";
import { FindCare } from "@/pages/FindCare";
import { TreatmentDetail } from "@/pages/TreatmentDetail";
import { Dashboard } from "@/pages/Dashboard";
import { Pharmacy, Messages, Account } from "@/pages/Simple";

import { Eligibility, Questionnaire } from "@/pages/care/Steps1";
import { Review, DoctorReview } from "@/pages/care/Steps2";
import { MedicationReview, Checkout } from "@/pages/care/Steps3";
import { Confirmation } from "@/pages/care/Steps4";

import { FillPrescription } from "@/pages/entry/FillPrescription";
import { TransferPrescription } from "@/pages/entry/TransferPrescription";
import { ExploreMedications } from "@/pages/entry/ExploreMedications";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <JourneyProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/get-started" element={<Navigate to="/app" replace />} />
          <Route path="/login" element={<Navigate to="/app" replace />} />

          <Route element={<ShellLayout />}>
            <Route path="/app" element={<Home />} />
            <Route path="/find-care" element={<FindCare />} />
            <Route path="/treatment/:slug" element={<TreatmentDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pharmacy" element={<Pharmacy />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/account" element={<Account />} />

            {/* Entry-point flows */}
            <Route path="/fill" element={<FillPrescription />} />
            <Route path="/transfer" element={<TransferPrescription />} />
            <Route path="/medications" element={<ExploreMedications />} />

            <Route path="/care/eligibility" element={<Eligibility />} />
            <Route path="/care/questionnaire" element={<Questionnaire />} />
            <Route path="/care/review" element={<Review />} />
            <Route path="/care/doctor" element={<DoctorReview />} />
            <Route path="/care/medication" element={<MedicationReview />} />
            <Route path="/care/checkout" element={<Checkout />} />
            <Route path="/care/confirmation" element={<Confirmation />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </JourneyProvider>
    </BrowserRouter>
  );
}
