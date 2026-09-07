import { motion } from "framer-motion";
import { GlassCard } from "../components/ui/GlassCard";
import { Sparkles, Calendar, UserCheck, Database, Cpu } from "lucide-react";

export function NSDC() {
  return (
    <section id="nsdc-section" className="relative py-20 md:py-24 px-6 md:px-12 lg:px-24 flex items-center">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column: Proper & Short Info with Aesthetic Mixed Fonts (7 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="lg:col-span-7 order-2 lg:order-1"
        >
          {/* Top Pill Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-medium mb-4">
            <Database size={13} className="text-cyan-400" />
            <span>GLOBAL STUDENT DATA NETWORK</span>
          </div>

          {/* Heading with Aesthetic Mixed Fonts */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2">
            <span className="text-white font-sans">National Student </span>
            <span 
              className="text-amber-200 font-normal inline-block text-4xl sm:text-5xl md:text-6xl px-1"
              style={{ fontFamily: "'Great Vibes', cursive", letterSpacing: "1px" }}
            >
              Data Corps
            </span>
            <span className="text-neutral-400 font-mono text-xl sm:text-2xl ml-2 font-normal">
              (NSDC)
            </span>
          </h2>

          {/* Subtitle with Cormorant Garamond Serif Italic */}
          <div 
            className="text-xl sm:text-2xl font-normal mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-neutral-200 to-amber-200"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            "Empowering Future Data Scientists &amp; AI Innovators"
          </div>

          {/* Short & Structured Info Blocks */}
          <div className="space-y-4 text-neutral-300">
            {/* Core Purpose */}
            <p className="font-sans text-sm sm:text-base md:text-[17px] leading-relaxed font-normal">
              <strong className="text-white font-semibold">NSDC</strong> is a premier student-led initiative fostering practical skills in{" "}
              <span className="text-cyan-200 font-medium">Data Science</span>,{" "}
              <span 
                className="text-amber-200 font-serif italic text-lg"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Artificial Intelligence &amp; Machine Learning
              </span>
              . It offers students an active ecosystem to collaborate, build real-world applications, and gain industry-relevant insights.
            </p>

            {/* Quick Highlight Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {/* Card 1: Inauguration */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-xs text-neutral-400 font-mono uppercase tracking-wider font-semibold">
                    SCET Chapter Launch
                  </h4>
                  <p className="text-sm text-white font-medium font-sans mt-0.5">
                    Inaugurated on <span className="text-amber-200 font-bold">10th August</span> — hosting workshops, hands-on bootcamps &amp; hackathons.
                  </p>
                </div>
              </div>

              {/* Card 2: Faculty Nominee */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs text-neutral-400 font-mono uppercase tracking-wider font-semibold">
                    Faculty Nominee &amp; Mentor
                  </h4>
                  <p className="text-sm text-white font-medium font-sans mt-0.5">
                    <span className="text-emerald-300 font-bold">Prof. Leena Ma'am</span> — guiding students in research projects &amp; career pathways.
                  </p>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-sans font-medium flex items-center gap-1.5">
                <Cpu size={13} className="text-cyan-400" />
                Hands-on AI &amp; ML
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-sans font-medium flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-300" />
                Interdisciplinary Collaboration
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Image with Glass Frame (5 cols) */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="lg:col-span-5 order-1 lg:order-2"
        >
          <GlassCard className="flex items-center justify-center relative overflow-hidden group p-0 border border-white/15 rounded-3xl w-full shadow-[0_15px_45px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent mix-blend-overlay z-10 pointer-events-none" />
            <img 
              src="/images/nsdc-chapter.jpeg" 
              alt="NSDC Chapter Inauguration" 
              className="object-cover w-full h-auto aspect-[4/3] scale-100 group-hover:scale-105 transition-transform duration-[1.8s] ease-out"
            />
            {/* Tag on Image */}
            <div className="absolute bottom-3 left-3 right-3 z-20 px-3.5 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-xs text-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-sans font-semibold text-white">NSDC Chapter SCET</span>
              </div>
              <span className="text-amber-200 font-mono text-[11px] font-semibold">ESTD. 2026</span>
            </div>
          </GlassCard>
        </motion.div>

      </div>
    </section>
  );
}
