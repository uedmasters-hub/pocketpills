import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { JourneyProvider } from "@/lib/journey";

import { Home } from "@/pages/Home";
import { FindCare } from "@/pages/FindCare";
import { TreatmentDetail } from "@/pages/TreatmentDetail";
import { Dashboard } from "@/pages/Dashboard";
import { Pharmacy, Messages, Account } from "@/pages/Simple";

import { Eligibility, Questionnaire } from "@/pages/care/Steps1";
import { Review, DoctorReview } from "@/pages/care/Steps2";
import { MedicationReview, Checkout } from "@/pages/care/Steps3";
import { Confirmation } from "@/pages/care/Steps4";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <JourneyProvider>
        <ScrollToTop />
        <AppShell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/find-care" element={<FindCare />} />
            <Route path="/treatment/:slug" element={<TreatmentDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pharmacy" element={<Pharmacy />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/account" element={<Account />} />

            {/* Flagship Care Journey flow */}
            <Route path="/care/eligibility" element={<Eligibility />} />
            <Route path="/care/questionnaire" element={<Questionnaire />} />
            <Route path="/care/review" element={<Review />} />
            <Route path="/care/doctor" element={<DoctorReview />} />
            <Route path="/care/medication" element={<MedicationReview />} />
            <Route path="/care/checkout" element={<Checkout />} />
            <Route path="/care/confirmation" element={<Confirmation />} />

            <Route path="*" element={<Home />} />
          </Routes>
        </AppShell>
      </JourneyProvider>
    </BrowserRouter>
  );
}
