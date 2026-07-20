import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const pageVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.5, ease: "easeIn" } },
};

const labs = [
  {
    id: "lab-1",
    title: "Object Oriented Programming (OOP) Lab",
    image: "/Lab1.jpeg",
    location: "1st Floor, F-33-A",
    inCharge: "Prof. Mrunali Gajbhiye",
    equipment: {
      left: [
        "Dell Vostro Desktop 3268 (20)",
        "Intel Core i5 Processor",
        "Windows 11",
        "Java JDK 21",
      ],
      right: [
        "Eclipse IDE",
        "IntelliJ IDEA",
        "NetBeans IDE",
        "LAN & Internet Connectivity",
      ],
    },
  },
  {
    id: "lab-2",
    title: "Operating Systems Lab",
    image: "/Lab2.jpeg",
    location: "1st Floor, F-33-B",
    inCharge: "Prof. Utkarsha Gode",
    equipment: {
      left: [
        "Dell Vostro Desktop 3268 (21)",
        "Intel Core i5 Processor",
        "Ubuntu Linux",
        "Windows Dual Boot",
      ],
      right: [
        "VMware Workstation",
        "VirtualBox",
        "GCC Compiler",
        "LAN & Internet Connectivity",
      ],
    },
  },
  {
    id: "lab-3",
    title: "Python Programming & AI Lab",
    image: "/Lab3.jpeg",
    location: "1st Floor, F-33-C",
    inCharge: "Prof. Jayshree Gorakh",
    equipment: {
      left: [
        "Dell Vostro Desktop 3268 (20)",
        "Windows 11",
        "Python 3.x",
        "Jupyter Notebook",
        "VS Code",
      ],
      right: [
        "Anaconda",
        "NumPy & Pandas",
        "TensorFlow",
        "High-Speed Internet",
      ],
    },
  },
  {
    id: "lab-4",
    title: "Web Development & Database Lab",
    image: "/Lab4.jpeg",
    location: "1st Floor, F-33-D",
    inCharge: "Prof. (Faculty Name)",
    equipment: {
      left: [
        "Dell Vostro Desktop 3268 (20)",
        "Windows 11",
        "VS Code",
        "Node.js",
      ],
      right: [
        "React.js",
        "MongoDB",
        "MySQL Server",
        "Git & GitHub",
        "LAN & Internet Connectivity",
      ],
    },
  },
];

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
            {lab.inCharge}.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <ul className="space-y-3">
              {lab.equipment.left.map((item, i) => (
                <EquipmentItem key={i} text={item} />
              ))}
            </ul>
            <ul className="space-y-3">
              {lab.equipment.right.map((item, i) => (
                <EquipmentItem key={i} text={item} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LaboratoriesPage() {
  const navigate = useNavigate();

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
