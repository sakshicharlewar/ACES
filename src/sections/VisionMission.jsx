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
              boxShadow: "0 0 35px 2px rgba(251,113,133,0.18), 0 16px 48px rgba(0,0,0,0.6)",
              borderColor: "rgba(251,113,133,0.35)",
              transition: { duration: 0.3 },
            }}
            style={{
              background: "rgba(17, 19, 23, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "28px",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            }}
            className="h-full p-10 md:p-14 relative overflow-hidden group"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-8 text-rose-300">
              <Target className="w-8 h-8 text-rose-300" />
            </div>
            <h3 className="text-3xl font-semibold mb-4 text-white">
              <span>Department </span>
              <span 
                className="text-rose-200 font-normal text-4xl inline-block px-1"
                style={{ fontFamily: "'Great Vibes', cursive", letterSpacing: "1px" }}
              >
                Vision
              </span>
            </h3>
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: 48, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="h-[2px] bg-gradient-to-r from-rose-300 to-rose-500/20 mb-6 rounded-full" 
            />
            <p className="font-sans text-neutral-300 text-base md:text-lg leading-relaxed font-normal">
              To emerge as a <span className="text-rose-200 font-serif italic text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>center of excellence</span> in computer engineering by fostering <span className="text-white font-medium">academic brilliance, innovative research,</span> and <span className="text-white font-medium">entrepreneurial skills</span>, empowering graduates to address global challenges and shape the future of technology.
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
              boxShadow: "0 0 35px 2px rgba(56,189,248,0.18), 0 16px 48px rgba(0,0,0,0.6)",
              borderColor: "rgba(56,189,248,0.35)",
              transition: { duration: 0.3 },
            }}
            style={{
              background: "rgba(17, 19, 23, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "28px",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            }}
            className="h-full p-10 md:p-14 relative overflow-hidden group"
          >
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-8 text-sky-300">
              <Compass className="w-8 h-8 text-sky-300" />
            </div>
            <h3 className="text-3xl font-semibold mb-4 text-white">
              <span>Department </span>
              <span 
                className="text-sky-200 font-normal text-4xl inline-block px-1"
                style={{ fontFamily: "'Great Vibes', cursive", letterSpacing: "1px" }}
              >
                Mission
              </span>
            </h3>
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: 48, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              className="h-[2px] bg-gradient-to-r from-sky-300 to-sky-500/20 mb-6 rounded-full" 
            />
            <ul className="space-y-6">
              {missions.map((m, i) => (
                <motion.li
                  key={m.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <span className="font-mono text-sm font-bold text-sky-300 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 shrink-0 mt-0.5">
                    {m.number}
                  </span>
                  <p className="font-sans text-neutral-300 text-sm md:text-base leading-relaxed font-normal">
                    {m.text}
                  </p>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
