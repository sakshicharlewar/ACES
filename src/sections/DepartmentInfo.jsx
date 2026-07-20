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
          <h2 className="font-sans text-3xl md:text-5xl font-medium">
            About Computer Engineering Department
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
            boxShadow: "0 0 40px 4px rgba(59,130,246,0.18), 0 8px 48px rgba(0,0,0,0.5)",
            borderColor: "rgba(59,130,246,0.35)",
            transition: { duration: 0.3 },
          }}
          style={{
            background: "#171717",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: "28px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
            padding: "48px 52px",
          }}
        >
          {/* Card Heading */}
          <h3 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: 600, color: "#ffffff", marginBottom: "16px", letterSpacing: "-0.01em" }}>
            Computer Engineering Department
          </h3>

          {/* Blue Accent Line */}
          <div style={{ width: "56px", height: "2.5px", background: "linear-gradient(90deg, #3B82F6, #60A5FA)", borderRadius: "2px", marginBottom: "28px" }} />

          {/* Body Text */}
          <p className="font-cambria" style={{ color: "#B5B5B5", fontSize: "clamp(0.95rem, 1.5vw, 1.08rem)", lineHeight: "1.85", fontWeight: 300, marginBottom: "36px" }}>
            The Department of Computer Engineering at Suryodaya College of Engineering &amp;
            Technology (SCET) is dedicated to nurturing skilled, innovative, and industry-ready
            professionals. The department provides a strong foundation in programming, software
            development, artificial intelligence, data science, cybersecurity, cloud computing,
            and emerging technologies. With experienced faculty members, well-equipped
            laboratories, and modern learning resources, students gain both theoretical knowledge
            and practical exposure. Regular workshops, hackathons, technical seminars, coding
            competitions, and industry interactions help students enhance their technical and
            professional skills. The department focuses on creativity, research, teamwork, and
            problem-solving, preparing students to excel in higher education, entrepreneurship,
            and successful careers in the IT industry.
          </p>

          {/* Explore Button — bottom-right */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <motion.button
              onClick={() => navigate("/department")}
              whileHover={{ scale: 1.03, boxShadow: "0 0 20px 4px rgba(59,130,246,0.3)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.3 }}
              style={{
                background: "transparent",
                border: "1px solid #3B82F6",
                color: "#ffffff",
                borderRadius: "9999px",
                padding: "12px 28px",
                fontSize: "0.95rem",
                fontWeight: 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
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
