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
            boxShadow: "0 0 35px 2px rgba(255,255,255,0.06), 0 16px 48px rgba(0,0,0,0.55)",
            borderColor: "rgba(255,255,255,0.18)",
            transition: { duration: 0.3 },
          }}
          style={{
            background: "rgba(17, 19, 23, 0.8)",
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
            Computer Engineering Department
          </h3>

          {/* Monochrome White Accent Line */}
          <div style={{ width: "56px", height: "2px", background: "linear-gradient(90deg, #FFFFFF, rgba(255,255,255,0.2))", borderRadius: "2px", marginBottom: "28px" }} />

          {/* Body Text */}
          <p className="font-sans text-neutral-300 text-base md:text-lg leading-relaxed font-normal mb-8">
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
              whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.12)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.3 }}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                borderRadius: "9999px",
                padding: "12px 28px",
                fontSize: "0.95rem",
                fontWeight: 500,
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
