import { motion } from "framer-motion";
import { GlassCard } from "../components/ui/GlassCard";
import { Target, Compass } from "lucide-react";

const missions = [
  {
    number: "01",
    text: "To foster an academic and professional environment that nurtures research, innovation, and entrepreneurial skills in computer engineering.",
  },
  {
    number: "02",
    text: "To cultivate a culture of responsibility, ethics, and accountability among students to prepare them for real-world challenges.",
  },
  {
    number: "03",
    text: "To collaborate with renowned academic, research institutions, and industry partners at national and international levels to enhance students' problem-solving capabilities and technical expertise.",
  },
];

export function VisionMission() {
  return (
    <section className="py-24 px-6 md:px-12 lg:px-24">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {/* Vision Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            whileHover={{
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
            }}
            className="h-full p-10 md:p-14 relative overflow-hidden group"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-8 text-accent">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="font-sans text-3xl font-medium mb-4">Department Vision</h3>
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: 48, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="h-[2px] bg-accent mb-6 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
            />
            <p className="font-cambria text-text-secondary text-lg leading-relaxed font-light">
              To emerge as a center of excellence in computer engineering by fostering academic excellence, innovative research, and entrepreneurial skills, empowering graduates to address global challenges and contribute to the advancement of technology and society.
            </p>
          </motion.div>
        </motion.div>

        {/* Mission Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div 
            whileHover={{
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
            }}
            className="h-full p-10 md:p-14 relative overflow-hidden group"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-8 text-accent">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="font-sans text-3xl font-medium mb-4">Department Mission</h3>
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: 48, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              className="h-[2px] bg-accent mb-6 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
            />
            <ul className="space-y-6">
              {missions.map((m, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
                  className="flex gap-5 items-start"
                >
                  <span className="text-accent font-bold text-lg shrink-0 mt-0.5">{m.number}</span>
                  <p className="font-cambria text-text-secondary text-base leading-relaxed font-light">{m.text}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
