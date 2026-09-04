import { useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { motion, useScroll, useSpring } from "framer-motion";
import { LoadingScreen } from "./sections/LoadingScreen";
import { MouseGlow } from "./components/ui/MouseGlow";
import { Navbar } from "./components/ui/Navbar";
import { Hero } from "./sections/Hero";
import { AboutCollege } from "./sections/AboutCollege";
import { CollegeLogo } from "./sections/CollegeLogo";
import { AcesLogo } from "./sections/AcesLogo";
import { DepartmentInfo } from "./sections/DepartmentInfo";
import { UpcomingEvents } from "./sections/UpcomingEvents";
import { CompletedEvents } from "./sections/CompletedEvents";
import { VisionMission } from "./sections/VisionMission";
import { Committee } from "./sections/Committee";
import { NSDC } from "./sections/NSDC";
import { AcademicToppers } from "./sections/AcademicToppers";
import { ComplaintForm } from "./sections/ComplaintForm";
import { ContactUs } from "./sections/ContactUs";
import { DepartmentPage } from "./pages/DepartmentPage";
import { HodPage } from "./pages/HodPage";
import { FacultyListPage } from "./pages/FacultyListPage";
import { FacultyProfilePage } from "./pages/FacultyProfilePage";
import { EventDetailsPage } from "./pages/EventDetailsPage";
import { LaboratoriesPage } from "./pages/LaboratoriesPage";
import { CommitteeProfilePage } from "./pages/CommitteeProfilePage";
import { FloatingEventsButton } from "./components/ui/FloatingEventsButton";
import EventAnnouncementModal from "./components/ui/EventAnnouncementModal";

/* ── Admin Pages ── */
import { ProtectedAdminRoute } from "./admin/ProtectedAdminRoute";
import { AdminLogin } from "./admin/AdminLogin";
import { AdminDashboard } from "./admin/AdminDashboard";
import { AdminSubmissions } from "./admin/AdminSubmissions";
import { AdminSubmissionDetail } from "./admin/AdminSubmissionDetail";
import { AdminRegistrations } from "./admin/AdminRegistrations";
import { AdminRegistrationDetail } from "./admin/AdminRegistrationDetail";
import AdminEventRegistrations from "./admin/AdminEventRegistrations";
import AdminTestRegistrations from "./admin/AdminTestRegistrations";
import { AdminEvents } from "./admin/AdminEvents";
import AdminEventDashboard from "./admin/AdminEventDashboard";
import AdminResults from "./admin/AdminResults";
import AdminGallery from "./admin/AdminGallery";
import AdminNotices from "./admin/AdminNotices";
import AdminTeam from "./admin/AdminTeam";
import { AdminDepartmentalEvents } from "./admin/AdminDepartmentalEvents";
import { AdminCommittee } from "./admin/AdminCommittee";
import { AdminToppers } from "./admin/AdminToppers";
import { AdminFaculty } from "./admin/AdminFaculty";
import { AdminHod } from "./admin/AdminHod";
import { AdminLaboratories } from "./admin/AdminLaboratories";

/* ── Scroll Progress Bar (homepage only) ── */
function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-accent transform-origin-left z-50"
      style={{ scaleX }}
    />
  );
}

/* ── Homepage ── */
function HomePage() {
  return (
    <main className="min-h-screen text-text-primary selection:bg-accent selection:text-white">
      <Navbar />
      <ScrollBar />
      <div id="hero-section">
        <Hero />
      </div>
      <div id="collegelogo">
        <CollegeLogo />
      </div>
      <div id="about-section">
        <AboutCollege />
      </div>
      <div id="department-info">
        <DepartmentInfo />
      </div>
      <VisionMission />
      <AcesLogo />
      <div id="committee-section">
        <Committee />
      </div>
      <div id="nsdc-section">
        <NSDC />
      </div>
      <div id="events-section">
        <CompletedEvents />
      </div>
      <AcademicToppers />
      <div id="events-upcoming">
        <UpcomingEvents />
      </div>
      <ComplaintForm />
      <div id="contact-section">
        <ContactUs />
      </div>
      <EventAnnouncementModal />
    </main>
  );
}

/* ── App with Router ── */
function AppRoutes() {
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/department" element={<DepartmentPage />} />
          <Route path="/hod" element={<HodPage />} />
          <Route path="/faculty" element={<FacultyListPage />} />
          <Route path="/faculty/:id" element={<FacultyProfilePage />} />
          <Route path="/committee/:id" element={<CommitteeProfilePage />} />
          <Route path="/events/reimagine" element={<EventDetailsPage />} />
          <Route path="/laboratories" element={<LaboratoriesPage />} />

          {/* ── Admin Routes ── */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/submissions" element={<ProtectedAdminRoute><AdminSubmissions /></ProtectedAdminRoute>} />
          <Route path="/admin/submissions/:id" element={<ProtectedAdminRoute><AdminSubmissionDetail /></ProtectedAdminRoute>} />
          <Route path="/admin/registrations" element={<ProtectedAdminRoute><AdminRegistrations /></ProtectedAdminRoute>} />
          <Route path="/admin/registrations/:id" element={<ProtectedAdminRoute><AdminRegistrationDetail /></ProtectedAdminRoute>} />
          <Route path="/admin/events" element={<ProtectedAdminRoute><AdminEvents /></ProtectedAdminRoute>} />
          <Route path="/admin/events/:id" element={<ProtectedAdminRoute><AdminEventDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/event-registrations" element={<ProtectedAdminRoute><AdminEventRegistrations /></ProtectedAdminRoute>} />
          <Route path="/admin/test-registrations" element={<ProtectedAdminRoute><AdminTestRegistrations /></ProtectedAdminRoute>} />
          <Route path="/admin/results" element={<ProtectedAdminRoute><AdminResults /></ProtectedAdminRoute>} />
          <Route path="/admin/gallery" element={<ProtectedAdminRoute><AdminGallery /></ProtectedAdminRoute>} />
          <Route path="/admin/notices" element={<ProtectedAdminRoute><AdminNotices /></ProtectedAdminRoute>} />
          <Route path="/admin/team" element={<ProtectedAdminRoute><AdminTeam /></ProtectedAdminRoute>} />
          <Route path="/admin/committee" element={<ProtectedAdminRoute><AdminCommittee /></ProtectedAdminRoute>} />
          <Route path="/admin/toppers" element={<ProtectedAdminRoute><AdminToppers /></ProtectedAdminRoute>} />
          <Route path="/admin/faculty" element={<ProtectedAdminRoute><AdminFaculty /></ProtectedAdminRoute>} />
          <Route path="/admin/hod" element={<ProtectedAdminRoute><AdminHod /></ProtectedAdminRoute>} />
          <Route path="/admin/laboratories" element={<ProtectedAdminRoute><AdminLaboratories /></ProtectedAdminRoute>} />
          <Route path="/admin/departmental-events" element={<ProtectedAdminRoute><AdminDepartmentalEvents /></ProtectedAdminRoute>} />
        </Routes>
      </AnimatePresence>
      <FloatingEventsButton />
    </>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <MouseGlow />
      {isLoading ? (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      ) : (
        <AppRoutes />
      )}
    </>
  );
}

export default App;
