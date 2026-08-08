import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { JourneyProvider } from "@/lib/journey";
import { UserProvider } from "@/lib/user";
import { SignUp, Login, RequireAuth } from "@/pages/auth/Auth";

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
import { MedicationsIndex } from "@/pages/drug/MedicationsIndex";
import { DrugDetail } from "@/pages/drug/DrugDetail";

import { OrderHistory, OrderDetail } from "@/pages/orders/OrderHistory";
import { Receipt, Invoice } from "@/pages/orders/Documents";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

/* Wraps every in-app route in the AppShell (nav + footer). */
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
      <UserProvider>
        <JourneyProvider>
        <ScrollToTop />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />

          {/* Auth */}
          <Route path="/get-started" element={<SignUp />} />
          <Route path="/login" element={<Login />} />

          {/* Print-friendly documents (outside app shell) */}
          <Route path="/orders/:id/receipt" element={<RequireAuth><Receipt /></RequireAuth>} />
          <Route path="/orders/:id/invoice" element={<RequireAuth><Invoice /></RequireAuth>} />

          {/* Public browsing (in shell, no sign-in required) */}
          <Route element={<ShellLayout />}>
            <Route path="/drug" element={<MedicationsIndex />} />
            <Route path="/drug/:slug" element={<DrugDetail />} />
            <Route path="/find-care" element={<FindCare />} />
            <Route path="/treatment/:slug" element={<TreatmentDetail />} />
            <Route path="/medications" element={<Navigate to="/drug" replace />} />
          </Route>

          {/* Personal — requires an account */}
          <Route element={<RequireAuth><ShellLayout /></RequireAuth>}>
            <Route path="/app" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pharmacy" element={<Pharmacy />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/account" element={<Account />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/orders/:id" element={<OrderDetail />} />

            {/* Entry-point flows */}
            <Route path="/fill" element={<FillPrescription />} />
            <Route path="/transfer" element={<TransferPrescription />} />

            {/* Flagship Care Journey flow */}
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
      </UserProvider>
    </BrowserRouter>
  );
}
