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

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold text-white tracking-tight leading-[1.08] mb-4 font-sans"
            >
              Welcome to<br />
              Association of Computer<br />
              Engineering Students.
            </motion.h1>

            {/* Subtitle & Autonomous Tag */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-4"
            >
              <p className="text-base sm:text-lg text-neutral-200 font-semibold font-sans">
                Suryodaya College of Engineering &amp; Technology, Nagpur
              </p>
              <p className="text-xs sm:text-sm text-neutral-400 font-medium uppercase tracking-widest mt-1">
                An Autonomous Institute
              </p>
            </motion.div>

            {/* Paragraph Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm sm:text-base text-neutral-400 leading-relaxed mb-8 max-w-xl font-sans"
            >
              Where breakthrough computational intelligence, spatial robotics, and sustainable civil infrastructure converge to forge India's next generation of engineering visionaries.
            </motion.p>

            {/* Dual CTA Buttons: Upcoming Events & Explore */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-4"
            >
              {/* Upcoming Events Button */}
              <button
                onClick={() => scrollTo("events-upcoming")}
                className="px-7 py-3.5 rounded-full bg-white text-black text-sm font-bold flex items-center gap-2.5 hover:bg-neutral-200 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.2)] active:scale-95"
              >
                <Calendar className="w-4 h-4 text-black" />
                Upcoming Events
                <ArrowUpRight className="w-4 h-4 text-black" />
              </button>

              {/* Explore Button */}
              <button
                onClick={() => scrollTo("collegelogo")}
                className="px-7 py-3.5 rounded-full bg-[#181a20] border border-white/15 text-white text-sm font-semibold flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95"
              >
                Explore
                <ChevronDown className="w-4 h-4 text-neutral-300 animate-bounce" />
              </button>
            </motion.div>
          </div>

          {/* Right Column (5 cols) - Visual 3D Telemetry Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 relative"
          >
            <div className="rounded-2xl border border-white/10 bg-[#0B0D11] overflow-hidden relative group shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
              {/* Overlaid Top-Left Status Badge */}
              <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>3D TWIN: LIVE TELEMETRY</span>
              </div>

              {/* Graphic Asset Container */}
              <div className="relative aspect-[16/11] overflow-hidden bg-black flex items-center justify-center">
                <img
                  src="/hero_tech_campus.png"
                  alt="3D Digital Twin Interactive Campus Telemetry"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Overlaid Spatial Hotspots */}
                <div className="absolute top-1/4 left-1/4 z-10 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] text-white flex items-center gap-1.5 shadow-lg pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>AI Supercompute Pod</span>
                </div>

                <div className="absolute bottom-1/3 right-1/4 z-10 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] text-white flex items-center gap-1.5 shadow-lg pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Innovation Geodesic Dome</span>
                </div>
              </div>

              {/* Overlaid Bottom Telemetry Status Bar */}
              <div className="px-4 py-3 bg-[#0e1014] border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2 text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Smart Microgrid 100% Solar Active</span>
                </div>
                <div className="text-neutral-500 hidden sm:block">
                  LAT 21.096° N, 79.162° E
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

