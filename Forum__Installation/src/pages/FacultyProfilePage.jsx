import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, BookOpen, GraduationCap, Briefcase, 
  Link, FileText, ChevronRight, X, Loader2
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "https://aces-backkend.onrender.com";

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

function SectionHeading({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
      <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
      <h3 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#B5B5B5" }}>{title}</h3>
      <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.08)" }} />
    </div>
  );
}

export function FacultyProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeImg, setActiveImg] = useState(null);
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${BASE_URL}/api/faculty`)
      .then(res => res.json())
      .then(data => {
        const clean = str => String(str || "").toLowerCase().trim();
        const targetId = clean(id);
        const found = data.find(f => {
          const fSlug = clean(f.slug);
          const fId = clean(f.id);
          const fNameSlug = clean(f.name).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          return fSlug === targetId || fId === targetId || fNameSlug === targetId || fSlug.replace(/[^a-z0-9]/g, "") === targetId.replace(/[^a-z0-9]/g, "");
        });
        setFaculty(found || null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch faculty:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: "#0B0B0B", minHeight: "100vh", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p>Loading Profile...</p>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div style={{ background: "#0B0B0B", minHeight: "100vh", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h2>Faculty not found</h2>
        <button onClick={() => navigate("/faculty")} style={{ marginLeft: "16px", padding: "8px 16px", background: "#3B82F6", borderRadius: "8px", border: "none", color: "#fff", cursor: "pointer" }}>Go Back</button>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ background: "#0B0B0B", minHeight: "100vh", color: "#fff", paddingBottom: "100px", position: "relative" }}
    >
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ padding: "24px", position: "relative", zIndex: 50, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
        <motion.button
          onClick={() => navigate("/faculty")}
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
          Back to Faculty
        </motion.button>
      </div>

      <div className="container mx-auto max-w-5xl px-6" style={{ position: "relative", zIndex: 10, marginTop: "20px", display: "flex", flexDirection: "column", gap: "48px" }}>
        
        <motion.div
          initial="hidden" animate="visible" variants={fadeUpVariants} custom={1}
          style={{
            background: "#171717",
            backdropFilter: "blur(16px)",
            borderRadius: "32px",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "48px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "48px",
            boxShadow: "0 4px 40px rgba(0,0,0,0.5)",
          }}
          className="flex-col md:flex-row text-center md:text-left"
        >
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: "260px", height: "260px", borderRadius: "24px",
              padding: "8px", background: "linear-gradient(135deg, rgba(59,130,246,0.5), rgba(96,165,250,0.1))",
              boxShadow: "0 0 40px rgba(59,130,246,0.25)"
            }}>
              <img
                src={faculty.image}
                alt={faculty.name}
                style={{ width: "100%", height: "100%", borderRadius: "16px", objectFit: "cover" }}
              />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 700, color: "#fff", marginBottom: "8px", letterSpacing: "-0.02em" }}>
              {faculty.name}
            </h1>
            <p style={{ color: "#3B82F6", fontSize: "1.2rem", fontWeight: 500, marginBottom: "4px" }}>
              {faculty.designation}
            </p>
            <p style={{ color: "#B5B5B5", fontSize: "1.05rem", marginBottom: "32px" }}>
              {faculty.department}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
              <div>
                <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: "6px" }}>Qualification</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff", fontSize: "1.05rem", fontWeight: 500, justifyContent: "center" }} className="md:justify-start">
                  <GraduationCap className="w-4 h-4 text-blue-400" /> {faculty.qualification}
                </div>
              </div>
              <div>
                <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: "6px" }}>Experience</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff", fontSize: "1.05rem", fontWeight: 500, justifyContent: "center" }} className="md:justify-start">
                  <Briefcase className="w-4 h-4 text-blue-400" /> {faculty.experience}
                </div>
              </div>
              <div>
                <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: "6px" }}>Specialization</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff", fontSize: "1.05rem", fontWeight: 500, justifyContent: "center" }} className="md:justify-start">
                  <BookOpen className="w-4 h-4 text-blue-400" /> {faculty.specialization || "Computer Engineering"}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: "32px", display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }} className="md:justify-start">
              {faculty.linkedin && (
                <a href={faculty.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 20px", borderRadius: "12px", color: "#fff", textDecoration: "none", fontSize: "0.95rem", transition: "all 0.3s" }}
                   onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                   onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <Link className="w-4 h-4" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUpVariants} custom={2}>
          <SectionHeading title="About" />
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-[60%]" style={{ background: "#171717", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)", padding: "40px", boxShadow: "0 4px 32px rgba(0,0,0,0.3)" }}>
              <p style={{ color: "#B5B5B5", fontSize: "1.1rem", lineHeight: "1.8", fontWeight: 300 }}>
                {faculty.professional_summary}
              </p>
            </div>
            {achievementImages.length > 0 && (
              <div className="w-full lg:w-[40%]" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", alignContent: "start" }}>
                {achievementImages.map((ach, i) => {
                  const src = typeof ach === "string" ? ach : ach?.src;
                  const title = typeof ach === "object" ? ach?.title : "Achievement";
                  const year = typeof ach === "object" ? ach?.year : null;
                  return (
                    <div
                      key={i}
                      onClick={() => setActiveImg(src)}
                      style={{
                        borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
                        background: "#111", cursor: "pointer", position: "relative",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "16px", minHeight: "180px"
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget.querySelector('.overlay');
                        if (el) el.style.opacity = 1;
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget.querySelector('.overlay');
                        if (el) el.style.opacity = 0;
                      }}
                    >
                      <img src={src} alt={title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "transform 0.5s", borderRadius: "12px" }} />
                      <div className="overlay" style={{
                        position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        opacity: 0, transition: "opacity 0.3s", padding: "16px", textAlign: "center", borderRadius: "20px"
                      }}>
                        <p style={{ color: "#fff", fontWeight: 600, fontSize: "1.05rem" }}>{title}</p>
                        {year && <p style={{ color: "#B5B5B5", fontSize: "0.9rem", marginTop: "4px" }}>{year}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "40px" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUpVariants} custom={3}>
            <SectionHeading title="Academic Qualifications" />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {academicQualifications.map((qual, i) => {
                const degree = typeof qual === "string" ? qual : (qual?.degree || qual?.title || "");
                const institution = typeof qual === "object" ? (qual?.institution || qual?.desc || "") : "";
                const year = typeof qual === "object" ? qual?.year : "";
                return (
                  <div key={i} style={{ background: "#171717", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "24px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <GraduationCap className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 600, marginBottom: "4px" }}>{degree}</h4>
                      {institution && <p style={{ color: "#B5B5B5", fontSize: "0.95rem" }}>{institution} {year && `(${year})`}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUpVariants} custom={4}>
            <SectionHeading title="Research Interests" />
            <div style={{ background: "#171717", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)", padding: "32px", height: "100%" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {researchInterests.map((interest, i) => (
                  <span key={i} style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#93C5FD", padding: "8px 16px", borderRadius: "99px", fontSize: "0.95rem", fontWeight: 500 }}>
                    {typeof interest === "string" ? interest : interest?.title || JSON.stringify(interest)}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUpVariants} custom={5}>
          <SectionHeading title="Professional Information" />
          <div style={{ background: "#171717", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", padding: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h4 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 600 }}>Subjects Taught</h4>
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {subjectsTaught.map((sub, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "#B5B5B5", fontSize: "0.95rem" }}>
                  <ChevronRight className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                  <span>{typeof sub === "string" ? sub : sub?.title || JSON.stringify(sub)}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {publications.length > 0 && (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUpVariants} custom={6}>
            <SectionHeading title="Publications" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
              {publications.map((pub, i) => {
                const title = typeof pub === "string" ? pub : pub?.title;
                const journal = typeof pub === "object" ? pub?.journal : "";
                const year = typeof pub === "object" ? pub?.year : "";
                return (
                  <div key={i} style={{ background: "#171717", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", padding: "32px", display: "flex", flexDirection: "column" }}>
                    {year && (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span style={{ color: "#B5B5B5", fontSize: "0.9rem" }}>{year}</span>
                      </div>
                    )}
                    <h4 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 600, marginBottom: "12px", lineHeight: "1.4" }}>{title}</h4>
                    {journal && <p style={{ color: "#999", fontSize: "0.95rem", marginBottom: "24px", flex: 1 }}>{journal}</p>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

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
                transition: "all 0.3s"
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
                alt="Preview"
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
