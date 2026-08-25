import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProviderShell } from "@/components/layout/ProviderShell";
import { PublicMarketingLayout, DualBrowseLayout } from "@/components/layout/MarketingLayout";
import { JourneyProvider } from "@/lib/journey";
import { UserProvider } from "@/lib/user";
import { ProviderAuthProvider } from "@/lib/providerAuth";
import { I18nProvider } from "@/lib/i18n";
import { RightRailProvider } from "@/lib/rightRail";
import { hydratePublishedListings } from "@/lib/businessProfile";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTopFab } from "@/components/ScrollToTopFab";
import { SiteAccessGate } from "@/components/SiteAccessGate";
import { DesignSystemLiveProvider } from "@/lib/designSystemLive";
import { DesignSystemShell } from "@/pages/design/DesignSystemShell";
import { DesignDocPage, DesignHomeRedirect } from "@/pages/design/DesignDocPage";
import { SignUp, Login, RequireAuth } from "@/pages/auth/Auth";
import { ProviderLogin, ProviderSignUp, RequireProvider } from "@/pages/provider/ProviderAuth";
import { ProviderDashboard } from "@/pages/provider/ProviderDashboard";
import { ProviderRequests } from "@/pages/provider/ProviderRequests";
import { ProviderCustomers } from "@/pages/provider/ProviderCustomers";
import { ProviderRevenue } from "@/pages/provider/ProviderRevenue";
import { ProviderFinance } from "@/pages/provider/ProviderFinance";
import { ProviderSupport } from "@/pages/provider/ProviderSupport";
import { ProviderChat } from "@/pages/provider/ProviderChat";
import { ProviderDelegates } from "@/pages/provider/ProviderDelegates";
import { ProviderDoctors } from "@/pages/provider/ProviderDoctors";
import { ProviderServices } from "@/pages/provider/ProviderServices";
import { ProviderMonitor } from "@/pages/provider/ProviderMonitor";
import { ProviderPrescriptions } from "@/pages/provider/ProviderPrescriptions";
import { ProviderInventory } from "@/pages/provider/ProviderInventory";
import { ProviderInventoryAdd } from "@/pages/provider/ProviderInventoryAdd";
import { ProviderFleet } from "@/pages/provider/ProviderFleet";
import { ProviderDispatch } from "@/pages/provider/ProviderDispatch";
import { ProviderShifts } from "@/pages/provider/ProviderShifts";
import { ProviderRuns } from "@/pages/provider/ProviderRuns";
import { ProviderSchedule } from "@/pages/provider/ProviderSchedule";
import { ProviderPatients } from "@/pages/provider/ProviderPatients";
import { ProviderTests } from "@/pages/provider/ProviderTests";
import { ProviderCollections } from "@/pages/provider/ProviderCollections";
import { ProviderAvailability } from "@/pages/provider/ProviderAvailability";
import { ProviderOffers } from "@/pages/provider/ProviderOffers";
import { BusinessProfile } from "@/pages/business/BusinessProfile";

import { Landing } from "@/pages/Landing";
import { HowItWorks } from "@/pages/HowItWorks";
import { AboutUs } from "@/pages/AboutUs";
import { AboutUsDraft } from "@/pages/about-draft/AboutUsDraft";
import { Questions } from "@/pages/Questions";
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
import { Account } from "@/pages/Simple";
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
import { MedicationOrder } from "@/pages/drug/MedicationOrder";
import { Offers } from "@/pages/Offers";
import { PharmaciesIndex, PharmaciesByRegion } from "@/pages/PharmaciesByRegion";

import { OrderHistory, OrderDetail } from "@/pages/orders/OrderHistory";
import { HelpSupport } from "@/pages/support/HelpSupport";
import { Notifications } from "@/pages/notifications/Notifications";
import { Receipt, Invoice } from "@/pages/orders/Documents";
import { Appointments } from "@/pages/appointments/Appointments";
import { AppointmentDetail, AppointmentReceipt } from "@/pages/appointments/AppointmentDetail";
import { BookAppointment } from "@/pages/appointments/BookAppointment";
import { ProviderDetail } from "@/pages/appointments/ProviderDetail";
import { FacilityServiceDetail, FacilityServicesPage } from "@/pages/appointments/FacilityServices";
import { LabDetail } from "@/pages/appointments/LabDetail";
import { BookLab } from "@/pages/appointments/BookLab";
import { AssistantDetail } from "@/pages/appointments/AssistantDetail";
import { BookAssistant } from "@/pages/appointments/BookAssistant";
import { ServiceDetail } from "@/pages/appointments/ServiceDetail";
import { TreatmentHubDetail } from "@/pages/appointments/TreatmentHubDetail";
import { CareJourneyPage } from "@/pages/care/CareJourneyPage";
import { DoctorDirectory } from "@/pages/doctors/DoctorDirectory";
import { ClaimDoctor } from "@/pages/doctors/ClaimDoctor";
import { DoctorPublic } from "@/pages/doctors/DoctorPublic";
import { PharmacyDirectory } from "@/pages/pharmacies/PharmacyDirectory";
import { ClaimPharmacy } from "@/pages/pharmacies/ClaimPharmacy";
import { PharmacyPublic } from "@/pages/pharmacies/PharmacyPublic";
import { FacilityDirectory } from "@/pages/facilities/FacilityDirectory";
import { ClaimFacility } from "@/pages/facilities/ClaimFacility";
import { FacilityPublic } from "@/pages/facilities/FacilityPublic";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ListingsHydrate() {
  useEffect(() => {
    void hydratePublishedListings();
  }, []);
  return null;
}

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function ProviderLayout() {
  return (
    <ProviderShell>
      <Outlet />
    </ProviderShell>
  );
}

/** Legacy `/consult/:slug` → hub treatment detail. */
function ConsultRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/appointments/treatments/${slug ?? ""}`} replace />;
}

/** Legacy `/treatment/:slug` → hub treatment detail. */
function TreatmentRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/appointments/treatments/${slug ?? ""}`} replace />;
}

/** Draft book URL now serves the live booking page. */
function BookDraftRedirect() {
  const [params] = useSearchParams();
  const qs = params.toString();
  return <Navigate to={qs ? `/appointments/book?${qs}` : "/appointments/book"} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
      <SiteAccessGate>
      <DesignSystemLiveProvider>
      <I18nProvider>
      <UserProvider>
      <ProviderAuthProvider>
        <RightRailProvider>
        <JourneyProvider>
          <ScrollToTop />
          <ListingsHydrate />
          <ScrollToTopFab />
          <Routes>
          {/* Marketing homepage — own chrome */}
          <Route path="/" element={<Landing />} />
          <Route path="/landing/draft" element={<Navigate to="/" replace />} />

          {/* Design system docs (HIG-style) — versions managed in-header */}
          <Route path="/design/versions" element={<Navigate to="/design" replace />} />
          <Route path="/design" element={<DesignSystemShell />}>
            <Route index element={<DesignHomeRedirect />} />
            <Route path=":section/:slug" element={<DesignDocPage />} />
          </Route>

          {/* Always public — How it works + Support (even when signed in) */}
          <Route element={<PublicMarketingLayout />}>
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/how-it-works/draft" element={<Navigate to="/how-it-works" replace />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/about-us/draft" element={<AboutUsDraft />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/doctors" element={<DoctorDirectory />} />
            <Route path="/doctors/claim" element={<ClaimDoctor />} />
            <Route path="/doctors/:nmcNumber" element={<DoctorPublic />} />
            <Route path="/pharmacies" element={<PharmacyDirectory />} />
            <Route path="/pharmacies/claim" element={<ClaimPharmacy />} />
            <Route path="/pharmacies/regions" element={<PharmaciesIndex />} />
            <Route path="/pharmacies/regions/:region" element={<PharmaciesByRegion />} />
            <Route path="/pharmacies/:regNo" element={<PharmacyPublic />} />
            <Route path="/facilities" element={<FacilityDirectory />} />
            <Route path="/facilities/claim" element={<ClaimFacility />} />
            <Route path="/facilities/:hfCode" element={<FacilityPublic />} />
          </Route>

          {/* Treatment + Pharmacy — guests: marketing; signed-in: AppShell */}
          <Route element={<DualBrowseLayout />}>
            <Route path="/drug" element={<MedicationsIndex />} />
            <Route path="/drug/:slug" element={<DrugDetail />} />
            <Route path="/find-care" element={<Navigate to="/appointments" replace />} />
            <Route path="/treatment/:slug" element={<TreatmentRedirect />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/medications" element={<Navigate to="/drug" replace />} />
            <Route path="/consult/minor-ailments" element={<Navigate to="/appointments" replace />} />
            <Route path="/consult/:slug" element={<ConsultRedirect />} />
            <Route path="/delivery-check" element={<DeliveryCheck />} />
          </Route>

          {/* Patient auth */}
          <Route path="/get-started" element={<SignUp />} />
          <Route path="/login" element={<Login />} />

          {/* Provider auth — separate product cycle */}
          <Route path="/provider/login" element={<ProviderLogin />} />
          <Route path="/provider/get-started" element={<ProviderSignUp />} />

          {/* Print-friendly documents (outside app shell) */}
          <Route path="/orders/:id/receipt" element={<RequireAuth><Receipt /></RequireAuth>} />
          <Route path="/orders/:id/invoice" element={<RequireAuth><Invoice /></RequireAuth>} />
          <Route path="/appointments/visit/:id/receipt" element={<RequireAuth><AppointmentReceipt /></RequireAuth>} />

          {/* Provider app */}
          <Route
            element={
              <RequireProvider>
                <ProviderLayout />
              </RequireProvider>
            }
          >
            <Route path="/provider" element={<ProviderDashboard />} />
            <Route path="/provider/requests" element={<ProviderRequests />} />
            <Route path="/provider/customers" element={<ProviderCustomers />} />
            <Route path="/provider/patients" element={<ProviderPatients />} />
            <Route path="/provider/finance" element={<ProviderFinance />} />
            <Route path="/provider/revenue" element={<ProviderRevenue />} />
            <Route path="/provider/chat" element={<ProviderChat />} />
            <Route path="/provider/delegates" element={<ProviderDelegates />} />
            <Route path="/provider/support" element={<ProviderSupport />} />
            <Route path="/provider/listing" element={<BusinessProfile />} />
            <Route path="/provider/offers" element={<ProviderOffers />} />
            <Route path="/provider/doctors" element={<ProviderDoctors />} />
            <Route path="/provider/team" element={<ProviderDoctors />} />
            <Route path="/provider/services" element={<ProviderServices />} />
            <Route path="/provider/monitor" element={<ProviderMonitor />} />
            <Route path="/provider/schedule" element={<ProviderSchedule />} />
            <Route path="/provider/tests" element={<ProviderTests />} />
            <Route path="/provider/collections" element={<ProviderCollections />} />
            <Route path="/provider/prescriptions" element={<ProviderPrescriptions />} />
            <Route path="/provider/inventory" element={<ProviderInventory />} />
            <Route path="/provider/inventory/new" element={<ProviderInventoryAdd />} />
            <Route path="/provider/fleet" element={<ProviderFleet />} />
            <Route path="/provider/dispatch" element={<ProviderDispatch />} />
            <Route path="/provider/shifts" element={<ProviderShifts />} />
            <Route path="/provider/runs" element={<ProviderRuns />} />
            <Route path="/provider/availability" element={<ProviderAvailability />} />
          </Route>

          {/* Patient app — requires an account + AppShell */}
          <Route element={<RequireAuth><ShellLayout /></RequireAuth>}>
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/draft" element={<Navigate to="/dashboard" replace />} />
            <Route path="/pharmacy" element={<Navigate to="/orders?service=pharmacy" replace />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:section" element={<ProfileSection />} />
            <Route path="/account" element={<Account />} />
            <Route path="/account/notifications" element={<NotificationSettings />} />
            <Route path="/account/language" element={<LanguagePreference />} />
            <Route path="/account/family" element={<ManageFamily />} />
            <Route path="/account/benefits" element={<PocketpillsBenefits />} />
            <Route path="/account/switch" element={<SwitchAccount />} />
            <Route path="/business" element={<Navigate to="/provider/listing" replace />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/orders/draft" element={<Navigate to="/orders" replace />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/support" element={<HelpSupport />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointments/visit/:id" element={<AppointmentDetail />} />
            <Route path="/appointments/provider/:id/services/:serviceId" element={<FacilityServiceDetail />} />
            <Route path="/appointments/provider/:id/services" element={<FacilityServicesPage />} />
            <Route path="/appointments/provider/:id" element={<ProviderDetail />} />
            <Route path="/appointments/book" element={<BookAppointment />} />
            <Route path="/appointments/book/draft" element={<BookDraftRedirect />} />
            <Route path="/appointments/treatments/:slug" element={<TreatmentHubDetail />} />
            <Route path="/appointments/labs/:id" element={<LabDetail />} />
            <Route path="/appointments/labs/:id/book" element={<BookLab />} />
            <Route path="/appointments/labs/visit/:id" element={<CareJourneyPage kind="lab" />} />
            <Route path="/appointments/assistants/:id" element={<AssistantDetail />} />
            <Route path="/appointments/assistants/:id/book" element={<BookAssistant />} />
            <Route path="/appointments/assistants/visit/:id" element={<CareJourneyPage kind="care" />} />
            <Route path="/appointments/services/request/:id" element={<CareJourneyPage kind="service" />} />
            <Route path="/appointments/services/:id" element={<ServiceDetail />} />

            <Route path="/fill" element={<FillPrescription />} />
            <Route path="/drug/:slug/order" element={<MedicationOrder />} />
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
      </ProviderAuthProvider>
      </UserProvider>
      </I18nProvider>
      </DesignSystemLiveProvider>
      </SiteAccessGate>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
