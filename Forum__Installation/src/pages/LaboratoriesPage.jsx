import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "https://aces-backkend.onrender.com";

const pageVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.5, ease: "easeIn" } },
};

function EquipmentItem({ text }) {
  return (
    <li className="flex items-start gap-2 text-[#555] text-sm leading-relaxed hover:text-[#0D47A1] transition-colors duration-200 cursor-default">
      {/* Yellow triangle bullet */}
      <span
        className="mt-[5px] flex-shrink-0"
        style={{
          width: 0,
          height: 0,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderLeft: "8px solid #FFC107",
        }}
      />
      {text}
    </li>
  );
}

function LabCard({ lab }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row">
        {/* ── Left: Image (40%) ── */}
        <div className="lg:w-[40%] overflow-hidden group">
          <img
            src={lab.image}
            alt={lab.title}
            className="w-full h-64 lg:h-full object-cover rounded-t-2xl lg:rounded-tr-none lg:rounded-l-2xl transition-transform duration-500 group-hover:scale-105"
            style={{ minHeight: "280px" }}
          />
        </div>

        {/* ── Right: Content (60%) ── */}
        <div className="lg:w-[60%] p-10">
          {/* Lab Title */}
          <h2 className="text-3xl font-bold text-[#0D47A1] mb-3">{lab.title}</h2>

          {/* Location & In-charge */}
          <p className="text-[#555] text-base mb-8 leading-relaxed">
            <span className="font-semibold text-gray-700">Lab location:</span>{" "}
            {lab.location}.{" "}
            <span className="font-semibold text-gray-700">Lab in-charge:</span>{" "}
            {lab.in_charge}.
          </p>

          {/* Major Equipment Heading */}
          <div className="mb-5">
            <h3
              className="text-sm font-bold tracking-[0.18em] text-[#0D47A1] uppercase pb-2"
              style={{ borderBottom: "2px solid #0D47A1", display: "inline-block" }}
            >
              Major Equipment
            </h3>
          </div>

          {/* Two-column equipment list */}
          {(() => {
            let eq = lab.equipment;
            if (typeof eq === "string") {
              try { eq = JSON.parse(eq); } catch (e) {}
            }
            const leftList = Array.isArray(eq?.left) ? eq.left : (Array.isArray(eq) ? eq : []);
            const rightList = Array.isArray(eq?.right) ? eq.right : [];

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                <ul className="space-y-3">
                  {leftList.map((item, i) => (
                    <EquipmentItem key={i} text={typeof item === "string" ? item : item?.title || JSON.stringify(item)} />
                  ))}
                </ul>
                <ul className="space-y-3">
                  {rightList.map((item, i) => (
                    <EquipmentItem key={i} text={typeof item === "string" ? item : item?.title || JSON.stringify(item)} />
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}

const fallbackLabs = [
  { id: 1, title: "Computer Lab 1", location: "First Floor, SCET", in_charge: "Prof. Veena Katankar", display_order: 1, equipment: { left: ["High Performance i7 Workstations", "Gigabit Ethernet Switch", "High-Speed Wi-Fi Routers"], right: ["Oracle DB & MySQL Server", "Visual Studio Code & PyCharm", "Linux Ubuntu OS"] } },
  { id: 2, title: "Computer Lab 2", location: "First Floor, SCET", in_charge: "Prof. Jayshree Gorakh", display_order: 2, equipment: { left: ["Core i5 Systems", "Network Analyzer Kits", "Cisco Routers & Switches"], right: ["Packet Tracer & Wireshark", "Python & Anaconda Suite", "Java Development Kit"] } },
  { id: 3, title: "Computer Lab 3", location: "Second Floor, SCET", in_charge: "Prof. Utkarsha Gode", display_order: 3, equipment: { left: ["High End Graphic Workstations", "Smart Projector Screen", "Uninterrupted UPS Power"], right: ["TensorFlow & PyTorch AI Tools", "Android Studio IDE", "Docker & Cloud Tools"] } },
  { id: 4, title: "Computer Lab 4", location: "Second Floor, SCET", in_charge: "Prof. Mrunali Gajbhiye", display_order: 4, equipment: { left: ["Dual Monitor i7 Systems", "High Speed Fiber LAN", "Digital Logic Trainer Kits"], right: ["Proteus & Matlab Software", "Web Dev Node.js Environment", "Git & GitHub Enterprise"] } }
];

export function LaboratoriesPage() {
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${BASE_URL}/api/laboratories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLabs(data);
        } else {
          setLabs(fallbackLabs);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch labs:", err);
        setLabs(fallbackLabs);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ background: "#0B0B0B", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        background: "#0B0B0B",
        minHeight: "100vh",
        paddingTop: "80px",
        position: "relative",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          height: "800px",
          background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Back Button */}
      <motion.button
        onClick={() => navigate("/department")}
        whileHover={{ boxShadow: "0 0 16px rgba(59,130,246,0.2)" }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          top: "24px",
          left: "24px",
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
        Back to Department
      </motion.button>

      {/* Page Content */}
      <section
        style={{
          padding: "0 24px 100px",
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="font-label text-[#3B82F6] uppercase tracking-widest text-sm mb-3 font-semibold">
            Computer Engineering Department
          </div>
          <h1 className="font-sans text-3xl md:text-5xl font-medium text-white mb-4">
            Laboratories
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            State-of-the-art labs equipped for modern computing and software development.
          </p>
        </motion.div>

        {/* Lab Cards */}
        <div className="flex flex-col gap-8">
          {labs.map((lab) => (
            <LabCard key={lab.id} lab={lab} />
          ))}
        </div>
      </section>
    </motion.div>
  );
}
