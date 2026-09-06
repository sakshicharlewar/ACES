import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function DepartmentInfo() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6 md:px-12 lg:px-24">
      <div className="container mx-auto max-w-5xl">

        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight">
            <span className="text-white font-sans">About </span>
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-neutral-100 to-amber-100 font-serif italic text-4xl md:text-6xl px-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Computer Engineering
            </span>
            <span className="text-white font-sans"> Department</span>
          </h2>
        </motion.div>

        {/* Premium Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          whileHover={{
            y: -6,
            boxShadow: "0 0 35px 2px rgba(251,191,36,0.12), 0 16px 48px rgba(0,0,0,0.6)",
            borderColor: "rgba(251,191,36,0.25)",
            transition: { duration: 0.3 },
          }}
          style={{
            background: "rgba(17, 19, 23, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "28px",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            padding: "48px 52px",
          }}
        >
          {/* Card Heading */}
          <h3 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: 600, color: "#ffffff", marginBottom: "16px", letterSpacing: "-0.01em" }}>
            <span>Department of </span>
            <span 
              className="text-amber-200 font-normal text-2xl md:text-3xl"
              style={{ fontFamily: "'Great Vibes', cursive", letterSpacing: "1px" }}
            >
              Computer Engineering
            </span>
          </h3>

          {/* Golden/White Accent Line */}
          <div style={{ width: "56px", height: "2px", background: "linear-gradient(90deg, #FDE68A, rgba(255,255,255,0.2))", borderRadius: "2px", marginBottom: "28px" }} />

          {/* Body Text */}
          <p className="font-sans text-neutral-300 text-base md:text-lg leading-relaxed font-normal mb-8">
            The Department of Computer Engineering at Suryodaya College of Engineering &amp;
            Technology (SCET) is dedicated to nurturing skilled, innovative, and industry-ready
            professionals. The department provides a strong foundation in <span className="text-white font-medium">programming, software development,</span>{" "}
            <span className="text-amber-200 font-semibold font-serif italic text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>artificial intelligence, data science, cybersecurity,</span>{" "}
            and <span className="text-cyan-200 font-medium">cloud computing</span>. With experienced faculty members, well-equipped
            laboratories, and modern learning resources, students gain both theoretical knowledge
            and practical exposure. Regular <span className="text-white font-semibold">workshops, hackathons, and coding competitions</span> help students enhance their technical and
            professional skills, preparing them to excel in <span className="text-amber-100 font-serif italic text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>higher education, entrepreneurship, and global careers</span>.
          </p>

          {/* Explore Button — bottom-right */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <motion.button
              onClick={() => navigate("/department")}
              whileHover={{ 
                scale: 1.04, 
                backgroundColor: "rgba(251, 191, 36, 0.15)",
                borderColor: "rgba(251, 191, 36, 0.4)",
                boxShadow: "0 0 25px rgba(251, 191, 36, 0.35)"
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.3 }}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                color: "#ffffff",
                borderRadius: "9999px",
                padding: "12px 28px",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backdropFilter: "blur(12px)",
              }}
            >
              Explore Department
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.3 }}
                style={{ display: "inline-block" }}
              >
                →
              </motion.span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
