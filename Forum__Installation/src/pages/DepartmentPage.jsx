import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, User, Users, Monitor, Award, Image as ImageIcon, X } from "lucide-react";
import { getBaseUrl } from "../lib/apiConfig";

/* ═══════════════════════════════════════════════════════
   Data
═══════════════════════════════════════════════════════ */
const staticCards = [
  {
    id: "faculty",
    icon: <Users className="w-7 h-7 text-blue-400" />,
    title: "Faculty Members",
    shortDesc: "Experienced educators and industry experts guiding every student.",
    detail: `Our faculty comprises highly qualified professors, researchers, and visiting industry professionals. Each faculty member holds a postgraduate or doctoral degree and brings both academic depth and real-world experience. Faculty regularly publish research papers, attend international conferences, and collaborate with industry to ensure students receive the most relevant and up-to-date education possible.`,
  },
  {
    id: "labs",
    icon: <Monitor className="w-7 h-7 text-blue-400" />,
    title: "Laboratories",
    shortDesc: "State-of-the-art labs equipped for AI, Cloud, and Software development.",
    detail: `The department operates multiple advanced labs: a Programming Lab, AI & Machine Learning Lab, Networking & Cybersecurity Lab, Cloud Computing Lab, and a Software Engineering Studio. All labs feature high-performance workstations, latest software licenses, and high-speed internet. Students can access labs beyond scheduled hours to work on projects, research, and skill development independently.`,
  },
  {
    id: "placements",
    icon: <Award className="w-7 h-7 text-blue-400" />,
    title: "Placement Highlights",
    shortDesc: "Outstanding record of placements in top IT companies worldwide.",
    detail: `The department boasts an outstanding placement record with students securing offers from companies including TCS, Infosys, Wipro, Cognizant, Capgemini, Accenture, and several innovative startups. A dedicated Training & Placement Cell conducts year-round mock interviews, aptitude training, resume workshops, and soft-skill development sessions. Many alumni have pursued higher education at reputed institutions globally.`,
  },
  {
    id: "gallery",
    icon: <ImageIcon className="w-7 h-7 text-blue-400" />,
    title: "Department Gallery",
    shortDesc: "Vibrant snapshots of campus life, events, and achievements.",
    detail: `The department gallery captures the essence of student life — annual hackathons, inter-college coding competitions, technical paper presentations, industrial visits, farewell ceremonies, and cultural events. These memories reflect a thriving community where academics meets creativity, and where lifelong friendships and professional networks are built every year.`,
  },
];

/* ═══════════════════════════════════════════════════════
   Page transition variants
═══════════════════════════════════════════════════════ */
const pageVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.5, ease: "easeIn" } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.1 + i * 0.12, ease: "easeOut" },
  }),
};

/* ═══════════════════════════════════════════════════════
   Modal
═══════════════════════════════════════════════════════ */
function Modal({ card, onClose }) {
  return (
    <AnimatePresence>
      {card && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              zIndex: 100,
            }}
          />
          {/* Modal Card */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(600px, 90vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#171717",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: "28px",
              padding: "44px 40px",
              zIndex: 101,
              boxShadow: "0 0 60px rgba(59,130,246,0.15), 0 24px 64px rgba(0,0,0,0.7)",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute", top: "20px", right: "20px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%",
                width: "36px", height: "36px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff",
              }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon badge */}
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              {card.icon}
            </div>

            {/* Title */}
            <h3 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 600, marginBottom: "12px" }}>
              {card.title}
            </h3>

            {/* Accent line */}
            <div style={{ width: "48px", height: "2.5px", background: "linear-gradient(90deg, #3B82F6, #60A5FA)", borderRadius: "2px", marginBottom: "20px" }} />
            
            {card.image && (
              <img src={card.image} alt={card.title} style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "16px", marginBottom: "20px" }} />
            )}

            {/* Detail text */}
            <p style={{ color: "#B5B5B5", lineHeight: "1.85", fontSize: "1rem", fontWeight: 300 }}>
              {card.detail}
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════
   Department Page
═══════════════════════════════════════════════════════ */
export function DepartmentPage() {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(null);
  const [hod, setHod] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${BASE_URL}/api/hod`)
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setHod(data);
        }
      })
      .catch(err => console.error("Failed to fetch HOD data:", err));
  }, []);

  const cards = [
    {
      id: "hod",
      icon: <User className="w-7 h-7 text-blue-400" />,
      title: "Head of Department",
      shortDesc: "Academic leadership driving excellence and innovation.",
      detail: hod ? (hod.professional_summary?.substring(0, 250) + "...") : "Loading HOD Profile...",
      image: hod?.image || "/HODSIR1.jpeg"
    },
    ...staticCards
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ background: "#0B0B0B", minHeight: "100vh", color: "#fff", paddingTop: "80px", position: "relative" }}
    >
      {/* Background glow */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* ── Fixed Back Button ── */}
      <motion.button
        onClick={() => navigate("/")}
        whileHover={{ x: -4, boxShadow: "0 0 16px rgba(59,130,246,0.2)" }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute", top: "24px", left: "24px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          borderRadius: "9999px",
          padding: "10px 20px",
          fontSize: "0.9rem",
          fontWeight: 500,
          cursor: "pointer",
          zIndex: 50,
          backdropFilter: "blur(10px)",
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </motion.button>

      {/* ── Cards Grid (First visible content) ── */}
      <section style={{ padding: "0 24px 100px", maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              onClick={() => {
                if (card.id === "hod") {
                  navigate("/hod");
                } else if (card.id === "faculty") {
                  navigate("/faculty");
                } else if (card.id === "labs") {
                  navigate("/laboratories");
                } else {
                  setActiveCard(card);
                }
              }}
              whileHover={{
                y: -8,
                boxShadow: "0 0 36px 4px rgba(59,130,246,0.2)",
                borderColor: "rgba(59,130,246,0.4)",
                transition: { duration: 0.3 },
              }}
              style={{
                background: "#171717",
                borderRadius: "28px",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "36px 32px",
                cursor: "pointer",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Icon badge */}
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {card.icon}
              </div>

              {/* Title */}
              <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
                {card.title}
              </h3>

              {/* Accent line */}
              <div style={{ width: "40px", height: "2px", background: "linear-gradient(90deg, #3B82F6, #60A5FA)", borderRadius: "2px" }} />

              {/* Short desc */}
              <p style={{ color: "#B5B5B5", fontSize: "0.95rem", lineHeight: "1.7", fontWeight: 300 }}>
                {card.shortDesc}
              </p>

              {/* View Details hint */}
              <div style={{ color: "#3B82F6", fontSize: "0.85rem", fontWeight: 500, marginTop: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
                View Details →
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modal */}
      <Modal card={activeCard} onClose={() => setActiveCard(null)} />
    </motion.div>
  );
}
