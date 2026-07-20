import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Users, Award, X, ChevronLeft, ChevronRight } from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Page transition variants
═══════════════════════════════════════════════════════ */
const pageVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.5, ease: "easeIn" } },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

/* ═══════════════════════════════════════════════════════
   Data
═══════════════════════════════════════════════════════ */
const highlights = [
  "Team of Two Participants",
  "Total 40 Teams",
  "80 Participants",
  "Preliminary Round",
  "Final Round",
  "Attractive Prizes",
  "Participation Certificates",
  "Creative UI/UX Challenge"
];

const galleryImages = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
];

const timeline = [
  "Registration",
  "Preliminary Round",
  "Final Presentation",
  "Winner Announcement"
];

/* ═══════════════════════════════════════════════════════
   Components
═══════════════════════════════════════════════════════ */
export function EventDetailsPage() {
  const navigate = useNavigate();
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(null);

  const openGallery = (index) => setActiveGalleryIndex(index);
  const closeGallery = () => setActiveGalleryIndex(null);
  const nextImage = () => setActiveGalleryIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  const prevImage = () => setActiveGalleryIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ background: "#0B0B0B", minHeight: "100vh", color: "#fff", paddingBottom: "100px", position: "relative" }}
    >
      {/* Background glow */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* ── TOP SECTION ── */}
      <div className="container mx-auto max-w-5xl px-6 pt-12" style={{ position: "relative", zIndex: 10 }}>
        
        {/* Page Title */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#3B82F6", marginBottom: "12px", fontWeight: 500 }}>
            Completed Event
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
            REIMAGINE UI/UX Competition
          </h1>
        </div>

        {/* Banner */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUpVariants} custom={1}
          style={{
            width: "100%", height: "400px", borderRadius: "28px", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 0 60px rgba(59,130,246,0.12)",
            marginBottom: "40px"
          }}
        >
          <img src="/Reimagin.jpeg" alt="REIMAGINE Banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </motion.div>

        {/* Details Grid */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUpVariants} custom={2}
          style={{
            background: "#171717", backdropFilter: "blur(16px)",
            borderRadius: "28px", border: "1px solid rgba(255,255,255,0.08)",
            padding: "32px 40px", display: "flex", flexWrap: "wrap", gap: "40px",
            justifyContent: "space-between", marginBottom: "60px",
            boxShadow: "0 4px 32px rgba(0,0,0,0.4)"
          }}
        >
          <div>
            <p style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: "8px" }}>Event Name</p>
            <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>REIMAGINE – UI/UX Competition</p>
          </div>
          <div>
            <p style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: "8px" }}>Date</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", fontWeight: 500 }}>
              <Calendar className="w-5 h-5 text-blue-400" /> 20 August 2025
            </div>
          </div>
          <div>
            <p style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: "8px" }}>Venue</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", fontWeight: 500 }}>
              <MapPin className="w-5 h-5 text-blue-400" /> MCA Seminar Hall, SCET
            </div>
          </div>
          <div>
            <p style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: "8px" }}>Organized By</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", fontWeight: 500 }}>
              <Users className="w-5 h-5 text-blue-400" /> ACES
            </div>
          </div>
        </motion.div>

        {/* ── EVENT DESCRIPTION ── */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUpVariants} custom={1} style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "20px" }}>About the Event</h2>
          <p style={{ color: "#B5B5B5", fontSize: "1.1rem", lineHeight: "1.8", fontWeight: 300 }}>
            The Department of Computer Engineering, Suryodaya College of Engineering &amp; Technology, organized the UI/UX Competition “REIMAGINE” under the ACES Forum on 20th August 2025 at MCA Seminar Hall for teams of two participants. A total of 40 teams (80participants) competed in preliminary and final rounds.
          </p>
        </motion.div>

        {/* ── EVENT HIGHLIGHTS ── */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUpVariants} custom={2} style={{ marginBottom: "80px" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "24px" }}>Event Highlights</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {highlights.map((h, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4, boxShadow: "0 0 20px 2px rgba(59,130,246,0.15)", borderColor: "rgba(59,130,246,0.3)" }}
                style={{
                  background: "#171717", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)",
                  padding: "20px", display: "flex", alignItems: "center", gap: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                }}
              >
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3B82F6", boxShadow: "0 0 10px #3B82F6" }} />
                <span style={{ fontWeight: 500 }}>{h}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── EVENT TIMELINE ── */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUpVariants} custom={3} style={{ marginBottom: "80px" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "32px", textAlign: "center" }}>Event Timeline</h2>
          <div style={{ display: "flex", flexDirection: "column", md: "row", alignItems: "center", justifyContent: "space-between", gap: "20px", background: "#171717", padding: "40px", borderRadius: "28px", border: "1px solid rgba(255,255,255,0.08)" }} className="md:flex-row">
            {timeline.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "20px" }} className="flex-col md:flex-row">
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#3B82F6", fontWeight: "bold" }}>
                    {i + 1}
                  </div>
                  <p style={{ fontWeight: 500, fontSize: "0.95rem" }}>{step}</p>
                </div>
                {i < timeline.length - 1 && (
                  <div className="hidden md:block" style={{ width: "40px", height: "2px", background: "rgba(255,255,255,0.1)" }} />
                )}
                {i < timeline.length - 1 && (
                  <div className="block md:hidden" style={{ width: "2px", height: "24px", background: "rgba(255,255,255,0.1)" }} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── WINNERS SECTION ── */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUpVariants} custom={1} style={{ marginBottom: "80px", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "32px" }}>Winner Recommendation</h2>
          <motion.div
            style={{
              background: "#171717", backdropFilter: "blur(16px)",
              borderRadius: "28px", border: "1px solid rgba(59,130,246,0.3)",
              padding: "24px", maxWidth: "600px", margin: "0 auto 24px",
              boxShadow: "0 0 40px rgba(59,130,246,0.1)"
            }}
          >
            {/* Placeholder for winner image */}
            <div style={{ width: "100%", height: "300px", borderRadius: "16px", overflow: "hidden", marginBottom: "20px" }}>
               <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Winners" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Award className="text-blue-400" /> First Prize Winners
            </p>
          </motion.div>
          <p style={{ color: "#B5B5B5", fontSize: "1.05rem", maxWidth: "700px", margin: "0 auto", lineHeight: "1.6" }}>
            Congratulations to all winners and participants for their outstanding creativity and innovative design solutions.
          </p>
        </motion.div>

        {/* ── EVENT GALLERY ── */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUpVariants} custom={2} style={{ marginBottom: "80px" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "24px" }}>Event Gallery</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
            {galleryImages.map((img, i) => (
              <motion.div
                key={i}
                onClick={() => openGallery(i)}
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59,130,246,0.2)", borderColor: "rgba(59,130,246,0.4)" }}
                style={{
                  height: "200px", borderRadius: "20px", overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer"
                }}
              >
                <img src={img} alt={`Gallery ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }} className="hover:scale-110" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── BOTTOM SECTION ── */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
          <motion.button
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px 4px rgba(59,130,246,0.3)" }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: "transparent",
              border: "1px solid #3B82F6",
              color: "#fff",
              borderRadius: "9999px",
              padding: "14px 32px",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Completed Events
          </motion.button>
        </div>

      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {activeGalleryIndex !== null && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            
            <button onClick={closeGallery} style={{ position: "absolute", top: "32px", right: "32px", color: "rgba(255,255,255,0.5)", cursor: "pointer", background: "none", border: "none" }} className="hover:text-white transition-colors">
              <X className="w-8 h-8" />
            </button>

            <div style={{ position: "relative", width: "100%", maxWidth: "1200px", height: "80vh", padding: "0 60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button onClick={prevImage} style={{ position: "absolute", left: "20px", color: "rgba(255,255,255,0.5)", cursor: "pointer", background: "none", border: "none" }} className="hover:text-white transition-colors">
                <ChevronLeft className="w-10 h-10" />
              </button>
              
              <motion.img
                key={activeGalleryIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={galleryImages[activeGalleryIndex]}
                style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", borderRadius: "12px", boxShadow: "0 24px 64px rgba(0,0,0,0.8)" }}
                alt="Gallery View"
              />

              <button onClick={nextImage} style={{ position: "absolute", right: "20px", color: "rgba(255,255,255,0.5)", cursor: "pointer", background: "none", border: "none" }} className="hover:text-white transition-colors">
                <ChevronRight className="w-10 h-10" />
              </button>
            </div>

          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
