import { motion } from "framer-motion";
import { ArrowUpRight, ChevronDown, Calendar, Sparkles, CheckSquare } from "lucide-react";

export function Hero() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative pt-24 md:pt-28 pb-12 px-3 sm:px-6 md:px-8 w-full max-w-7xl mx-auto">
      {/* Outer Spatial Container Frame */}
      <div className="relative bg-[#0c0e12] border border-white/10 rounded-[28px] md:rounded-[36px] p-6 sm:p-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Subtle Ambient Background Gradient */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />

        {/* ── Top Status Line / Telemetry Header ── */}
        <div className="flex items-center justify-between pb-5 mb-8 border-b border-white/10 text-xs text-neutral-400 font-mono">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-600/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-600/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-600/50" />
            </div>
            <span className="text-neutral-300 font-medium tracking-wide">
              ACES_CORE_OS // V4.8 [CONNECTED]
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-neutral-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NAGPUR AIR CAMPUS TELEMETRY</span>
          </div>
        </div>

        {/* ── Main 2-Column Hero Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Pill Tag */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-6 w-fit"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Central India Premier Tech Hub</span>
            </motion.div>

            {/* Main Headline with Mixed Aesthetic Fonts & Colors */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[48px] tracking-tight leading-[1.15] mb-5"
            >
              <span 
                className="text-3xl sm:text-4xl md:text-5xl font-normal text-amber-200 block mb-1"
                style={{ fontFamily: "'Great Vibes', cursive" }}
              >
                Welcome to
              </span>
              <span className="text-white font-sans font-extrabold tracking-tight">
                Association{" "}
              </span>
              <span 
                className="text-neutral-400 font-normal italic text-2xl sm:text-3xl md:text-4xl"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                of{" "}
              </span>
              <span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-neutral-100 to-amber-200 font-serif italic font-medium tracking-wide"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Computer Engineering
              </span>
              <br />
              <span className="text-white font-sans font-black uppercase tracking-wider text-2xl sm:text-3xl md:text-4xl">
                Students{" "}
              </span>
              <span className="text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/15 font-mono font-medium align-middle ml-2">
                (ACES)
              </span>
            </motion.h1>

            {/* Subtitle with Cursive Aesthetic Font in Engineering & Technology */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mb-8 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md"
            >
              <p className="text-base sm:text-lg text-neutral-300 font-medium font-sans">
                <span>Suryodaya College of </span>
                <span 
                  className="text-2xl sm:text-3xl text-amber-200 font-normal inline-block px-1"
                  style={{ fontFamily: "'Great Vibes', cursive", letterSpacing: "1px" }}
                >
                  Engineering &amp; Technology
                </span>
                <span className="text-neutral-400 text-xs sm:text-sm font-sans block sm:inline sm:ml-2">
                  • Nagpur
                </span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-neutral-400 font-mono tracking-widest uppercase font-semibold">
                  An Autonomous Institute
                </span>
              </div>
            </motion.div>

            {/* Explore Button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="flex items-center gap-4"
            >
              <button
                onClick={() => scrollTo("collegelogo")}
                className="px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold flex items-center gap-2.5 hover:bg-neutral-200 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.2)] active:scale-95"
              >
                Explore
                <ChevronDown className="w-4 h-4 text-black animate-bounce" />
              </button>
            </motion.div>
          </div>

          {/* Right Column (5 cols) - ACES Forum Image Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 relative"
          >
            <div className="rounded-2xl border border-white/10 bg-[#0B0D11] overflow-hidden relative group shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:border-amber-200/30 transition-all duration-300">
              {/* Overlaid Top-Left Status Badge */}
              <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACES FORUM LOADING CEREMONY</span>
              </div>

              {/* Image Container */}
              <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-black flex items-center justify-center">
                <img
                  src="/hero_aces_forum.jpg"
                  alt="ACES Forum Loading Ceremony - Computer Engineering Department"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Overlaid Tag */}
                <div className="absolute bottom-3 right-3 z-10 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] text-amber-200 flex items-center gap-1.5 shadow-lg pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>Leadership &amp; Innovation</span>
                </div>
              </div>

              {/* Overlaid Bottom Status Bar */}
              <div className="px-4 py-3 bg-[#0e1014] border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2 text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>SCET Computer Engineering Forum</span>
                </div>
                <div className="text-amber-200 font-semibold">
                  2026 – 27
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

