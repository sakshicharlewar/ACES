import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Award, BookOpen, GraduationCap, Briefcase, Lightbulb, Users, X, ZoomIn, Building2 } from "lucide-react";

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

const fadeLeftVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: (i = 1) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

/* ═══════════════════════════════════════════════════════
   Data
═══════════════════════════════════════════════════════ */
const qualifications = [
  {
    icon: <Award className="w-5 h-5 text-blue-400" />,
    title: "Post Doctoral",
    desc: "Lincoln University College, Malaysia – 2026",
  },
  {
    icon: <GraduationCap className="w-5 h-5 text-blue-400" />,
    title: "Ph.D.",
    desc: "Computer Science & Engineering – 2024",
  },
  {
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
    title: "M.Tech",
    desc: "Computer Science & Engineering",
  },
  {
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
    title: "B.E.",
    desc: "Information Technology",
  },
  {
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
    title: "Diploma",
    desc: "Information Technology",
  },
];

const highlights = [
  { icon: <Briefcase className="w-5 h-5 text-blue-400" />, title: "14+ Years Experience" },
  { icon: <Building2 className="w-5 h-5 text-blue-400" />, title: "Head of Department" },
  { icon: <GraduationCap className="w-5 h-5 text-blue-400" />, title: "Ph.D. Completed" },
  { icon: <Award className="w-5 h-5 text-blue-400" />, title: "Post Doctoral (2026)" },
  { icon: <Users className="w-5 h-5 text-blue-400" />, title: "Student Mentor" },
  { icon: <Lightbulb className="w-5 h-5 text-blue-400" />, title: "Research & Innovation" },
  { icon: <Briefcase className="w-5 h-5 text-blue-400" />, title: "Academic Leadership" },
  { icon: <Users className="w-5 h-5 text-blue-400" />, title: "Industry Collaboration" },
];

const achievementImages = [
  { src: "/HOD_Achievements.jpeg", label: "Achievement Certificate" },
];

/* ═══════════════════════════════════════════════════════
   Components
═══════════════════════════════════════════════════════ */
function GlassCard({ icon, title, desc, delayIndex, isSmall = false }) {
  return (
    <motion.div
      custom={delayIndex}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-20px" }}
      variants={fadeUpVariants}
      whileHover={{
        y: -4,
        boxShadow: "0 0 24px 2px rgba(59,130,246,0.15)",
        borderColor: "rgba(59,130,246,0.3)",
        transition: { duration: 0.3 },
      }}
      style={{
        background: "#171717",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: isSmall ? "16px 20px" : "24px",
        display: "flex",
        alignItems: isSmall ? "center" : "flex-start",
        gap: "16px",
      }}
    >
      <div style={{
        width: "44px", height: "44px", flexShrink: 0,
        borderRadius: "12px", background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {icon}
      </div>
      <div>
        <h4 style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 600, marginBottom: isSmall || !desc ? "0" : "4px" }}>
          {title}
        </h4>
        {desc && (
          <p style={{ color: "#B5B5B5", fontSize: "0.9rem", fontWeight: 300 }}>
            {desc}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function HodPage() {
  const navigate = useNavigate();
  const [activeImg, setActiveImg] = useState(null);

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

      {/* ── Top Nav ── */}
      <div style={{ padding: "24px", position: "relative", zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <motion.button
          onClick={() => navigate("/department")}
          whileHover={{ boxShadow: "0 0 16px rgba(59,130,246,0.2)" }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.3 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", borderRadius: "9999px", padding: "10px 20px",
            fontSize: "0.9rem", fontWeight: 500, cursor: "pointer",
            backdropFilter: "blur(10px)",
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Department
        </motion.button>
      </div>

      {/* ── Center Heading ── */}
      <motion.div
        initial="hidden" animate="visible" variants={fadeUpVariants} custom={1}
        style={{ textAlign: "center", padding: "40px 24px 60px", position: "relative", zIndex: 10 }}
      >
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Head of Department
        </h1>
      </motion.div>

      {/* ── Two Column Layout ── */}
      <div className="container mx-auto max-w-6xl px-6" style={{ position: "relative", zIndex: 10 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "48px",
        }} className="lg:grid-cols-[400px_1fr]">

          {/* LEFT SIDE: Image (Sticky on Desktop) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <motion.div
              initial="hidden" animate="visible" variants={fadeLeftVariants} custom={2}
              style={{
                position: "sticky", top: "40px",
                borderRadius: "24px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#171717",
                padding: "16px",
                boxShadow: "0 0 60px rgba(59,130,246,0.12), 0 24px 64px rgba(0,0,0,0.6)",
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ width: "100%", height: "500px", borderRadius: "16px", overflow: "hidden" }}
              >
                <img
                  src="/HOD_Sir.jpeg"
                  alt="Dr. Lowlesh Yadav"
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              </motion.div>
            </motion.div>
          </div>

          {/* RIGHT SIDE: Info Container */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUpVariants} custom={3}
            style={{
              background: "#171717",
              backdropFilter: "blur(16px)",
              borderRadius: "28px",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "40px 48px",
              boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
              display: "flex", flexDirection: "column", gap: "48px"
            }}
          >
            {/* About */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
                <h3 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#B5B5B5" }}>About</h3>
                <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>
              <p style={{ color: "#B5B5B5", fontSize: "1.05rem", lineHeight: "1.8", fontWeight: 300 }}>
                Dr. Lowlesh Yadav is the Head of the Department of Computer Engineering at Suryodaya College of Engineering &amp; Technology (SCET). He has over 14 years of experience in teaching, research, academic administration, and student mentoring. His leadership focuses on innovation, practical learning, industry collaboration, research excellence, and preparing students for successful careers in modern technology.
              </p>
            </div>

            {/* Academic Qualifications */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
                <h3 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#B5B5B5" }}>Academic Qualifications</h3>
                <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>
              <div style={{ display: "grid", gap: "16px" }}>
                {qualifications.map((q, i) => (
                  <GlassCard key={i} icon={q.icon} title={q.title} desc={q.desc} delayIndex={i + 4} />
                ))}
              </div>
            </div>

            {/* Professional Highlights */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
                <h3 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#B5B5B5" }}>Professional Highlights</h3>
                <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                {highlights.map((h, i) => (
                  <GlassCard key={i} icon={h.icon} title={h.title} delayIndex={i + 6} isSmall />
                ))}
              </div>
            </div>

            {/* Achievements — Thumbnail Gallery with Lightbox */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
                <h3 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#B5B5B5" }}>Achievements</h3>
                <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                {achievementImages.map((item, i) => (
                  <motion.div
                    key={i}
                    custom={i + 8}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUpVariants}
                    onClick={() => setActiveImg(item.src)}
                    whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(59,130,246,0.25)", borderColor: "rgba(59,130,246,0.4)" }}
                    style={{
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "#111",
                      cursor: "pointer",
                      aspectRatio: "4/3",
                      position: "relative",
                    }}
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {/* Hover overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0.45)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: 0, transition: "opacity 0.3s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveImg(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.92)",
              backdropFilter: "blur(16px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <button
              onClick={() => setActiveImg(null)}
              style={{
                position: "absolute", top: "32px", right: "32px",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%", padding: "10px", cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X className="w-6 h-6" />
            </button>
            <div
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: "90vw", maxHeight: "90vh" }}
            >
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                src={activeImg}
                alt="Achievement"
                style={{
                  maxWidth: "90vw", maxHeight: "85vh",
                  objectFit: "contain",
                  borderRadius: "16px",
                  boxShadow: "0 0 60px rgba(59,130,246,0.15), 0 24px 64px rgba(0,0,0,0.8)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
