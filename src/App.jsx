import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
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
    <main className="bg-background min-h-screen text-text-primary selection:bg-accent selection:text-white">
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
