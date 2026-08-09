import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PublicMarketingLayout, DualBrowseLayout } from "@/components/layout/MarketingLayout";
import { JourneyProvider } from "@/lib/journey";
import { UserProvider } from "@/lib/user";
import { RightRailProvider } from "@/lib/rightRail";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTopFab } from "@/components/ScrollToTopFab";
import { SignUp, Login, RequireAuth } from "@/pages/auth/Auth";

import { Landing } from "@/pages/Landing";
import { HowItWorks } from "@/pages/HowItWorks";
import { AboutUs } from "@/pages/AboutUs";
import { Questions } from "@/pages/Questions";
import { FindCare } from "@/pages/FindCare";
import { TreatmentDetail } from "@/pages/TreatmentDetail";
import { Dashboard } from "@/pages/Dashboard";
import { Profile } from "@/pages/Profile";
import { ProfileSection } from "@/pages/profile/ProfileSection";
import {
  NotificationSettings,
  LanguagePreference,
  ManageFamily,
  PocketpillsBenefits,
  SwitchAccount,
} from "@/pages/account/AccountPages";
import { Pharmacy, Account } from "@/pages/Simple";
import { Messages } from "@/pages/Messages";

import { Eligibility, Questionnaire } from "@/pages/care/Steps1";
import { Review, DoctorReview } from "@/pages/care/Steps2";
import { MedicationReview, Checkout } from "@/pages/care/Steps3";
import { Confirmation } from "@/pages/care/Steps4";

import { FillPrescription } from "@/pages/entry/FillPrescription";
import { TransferPrescription } from "@/pages/entry/TransferPrescription";
import { DeliveryCheck } from "@/pages/entry/DeliveryCheck";
import { MedicationsIndex } from "@/pages/drug/MedicationsIndex";
import { DrugDetail } from "@/pages/drug/DrugDetail";

import { OrderHistory, OrderDetail } from "@/pages/orders/OrderHistory";
import { Receipt, Invoice } from "@/pages/orders/Documents";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

/** Production `/consult/:slug` → treatment detail. */
function ConsultRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/treatment/${slug ?? ""}`} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
      <UserProvider>
        <RightRailProvider>
        <JourneyProvider>
        <ScrollToTop />
        <ScrollToTopFab />
        <Routes>
          {/* Marketing homepage — own chrome */}
          <Route path="/" element={<Landing />} />

          {/* Always public — How it works + Support (even when signed in) */}
          <Route element={<PublicMarketingLayout />}>
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/questions" element={<Questions />} />
          </Route>

          {/* Treatment + Pharmacy — guests: marketing; signed-in: AppShell */}
          <Route element={<DualBrowseLayout />}>
            <Route path="/drug" element={<MedicationsIndex />} />
            <Route path="/drug/:slug" element={<DrugDetail />} />
            <Route path="/find-care" element={<FindCare />} />
            <Route path="/treatment/:slug" element={<TreatmentDetail />} />
            <Route path="/medications" element={<Navigate to="/drug" replace />} />
            <Route path="/consult/minor-ailments" element={<Navigate to="/find-care" replace />} />
            <Route path="/consult/:slug" element={<ConsultRedirect />} />
            <Route path="/delivery-check" element={<DeliveryCheck />} />
          </Route>

          {/* Auth */}
          <Route path="/get-started" element={<SignUp />} />
          <Route path="/login" element={<Login />} />

          {/* Print-friendly documents (outside app shell) */}
          <Route path="/orders/:id/receipt" element={<RequireAuth><Receipt /></RequireAuth>} />
          <Route path="/orders/:id/invoice" element={<RequireAuth><Invoice /></RequireAuth>} />

          {/* Personal — requires an account + AppShell */}
          <Route element={<RequireAuth><ShellLayout /></RequireAuth>}>
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pharmacy" element={<Pharmacy />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:section" element={<ProfileSection />} />
            <Route path="/account" element={<Account />} />
            <Route path="/account/notifications" element={<NotificationSettings />} />
            <Route path="/account/language" element={<LanguagePreference />} />
            <Route path="/account/family" element={<ManageFamily />} />
            <Route path="/account/benefits" element={<PocketpillsBenefits />} />
            <Route path="/account/switch" element={<SwitchAccount />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/orders/:id" element={<OrderDetail />} />

            <Route path="/fill" element={<FillPrescription />} />
            <Route path="/transfer" element={<TransferPrescription />} />

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
        </RightRailProvider>
      </UserProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
