import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { facultyData } from "../data/facultyData";

const pageVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.5, ease: "easeIn" } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

export function FacultyListPage() {
  const navigate = useNavigate();

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
      <div style={{ padding: "24px", position: "relative", zIndex: 50, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
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

      {/* ── Page Title ── */}
      <motion.div
        initial="hidden" animate="visible" variants={cardVariants} custom={1}
        style={{ textAlign: "center", padding: "20px 24px 60px", position: "relative", zIndex: 10 }}
      >
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Faculty Members
        </h1>
      </motion.div>

      {/* ── Faculty Cards List ── */}
      <div className="container mx-auto max-w-5xl px-6" style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: "32px" }}>
        {facultyData.map((faculty, index) => (
          <motion.div
            key={faculty.id}
            custom={index + 2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={cardVariants}
            whileHover={{
              y: -6,
              scale: 1.01,
              boxShadow: "0 0 36px 4px rgba(59,130,246,0.18)",
              borderColor: "rgba(59,130,246,0.35)",
              transition: { duration: 0.3 },
            }}
            onClick={() => navigate(`/faculty/${faculty.id}`)}
            style={{
              background: "#171717",
              backdropFilter: "blur(16px)",
              borderRadius: "28px",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "40px",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "40px",
              boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
              cursor: "pointer",
            }}
            className="flex-col md:flex-row text-center md:text-left"
          >
            {/* Left: Photo */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: "160px", height: "160px", borderRadius: "50%",
                padding: "4px", background: "linear-gradient(135deg, rgba(59,130,246,0.5), rgba(96,165,250,0.1))",
                boxShadow: "0 0 24px rgba(59,130,246,0.2)"
              }}>
                <img
                  src={faculty.image}
                  alt={faculty.name}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              </div>
            </div>

            {/* Middle: Details */}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
                {faculty.name}
              </h2>


              <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", justifyContent: "center" }} className="md:justify-start">
                <div>
                  <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: "4px" }}>Qualification</p>
                  <p style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 500 }}>{faculty.qualification}</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: "4px" }}>Experience</p>
                  <p style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 500 }}>{faculty.experience}</p>
                </div>
              </div>
            </div>


          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
