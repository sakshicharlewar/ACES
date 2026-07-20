import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

const SUBTITLE = "Department of Computer Engineering";
const TYPING_SPEED = 50; // ms per character

export function LoadingScreen({ onComplete }) {
  const [phase, setPhase] = useState("typing");   // typing | pause | curtain
  const [typedCount, setTypedCount] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [isTypingStarted, setIsTypingStarted] = useState(false);

  // Delay the start of the typing effect to wait for title and divider
  useEffect(() => {
    const t = setTimeout(() => setIsTypingStarted(true), 1800);
    return () => clearTimeout(t);
  }, []);

  /* ── Typewriter effect ── */
  useEffect(() => {
    if (phase !== "typing" || !isTypingStarted) return;
    if (typedCount >= SUBTITLE.length) {
      // Typing done → show prompt after a longer pause (waiting for PRESENTS)
      const t = setTimeout(() => {
        setShowPrompt(true);
        setPhase("pause");
      }, 2500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTypedCount(c => c + 1), TYPING_SPEED);
    return () => clearTimeout(t);
  }, [typedCount, phase, isTypingStarted]);

  /* ── Click / Enter handler → trigger curtain ── */
  const handleEnter = useCallback(() => {
    if (phase !== "pause") return;
    setPhase("curtain");
    setCurtainOpen(true);
    // Wait for curtain animation, then hand off to app
    setTimeout(onComplete, 1400);
  }, [phase, onComplete]);

  useEffect(() => {
    if (phase !== "pause") return;
    const onKey = (e) => { if (e.key === "Enter") handleEnter(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, handleEnter]);

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      onClick={handleEnter}
      style={{ cursor: phase === "pause" ? "pointer" : "default" }}
    >
      {/* ── Background ── */}
      <div className="absolute inset-0 bg-[#0B0B0B]">
        {/* Ambient blue/gold glow behind title */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: "600px",
            height: "300px",
            background: "radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* ── Left Curtain Panel ── */}
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 z-10"
        style={{ background: "#0B0B0B", originX: 0 }}
        animate={curtainOpen ? { x: "-100%" } : { x: "0%" }}
        transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }}
      />

      {/* ── Right Curtain Panel ── */}
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 z-10"
        style={{ background: "#0B0B0B", originX: 1 }}
        animate={curtainOpen ? { x: "100%" } : { x: "0%" }}
        transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }}
      />

      {/* ── Main Content (above curtains while they open) ── */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-6">

        {/* Google Font import */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Great+Vibes&display=swap');

          .cursor-blink {
            display: inline-block;
            width: 3px;
            height: 1em;
            background: #FFF3CD;
            margin-left: 4px;
            vertical-align: middle;
            animation: blink 0.75s step-end infinite;
          }

          @keyframes blink {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0; }
          }
        `}</style>

        {/* Logos */}
        <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20">
          <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            src="/ScetLogo2.png" 
            alt="Suryodaya Logo" 
            className="w-24 md:w-32 lg:w-40 object-contain" 
          />
        </div>
        <div className="absolute top-8 right-8 md:top-12 md:right-12 z-20">
          <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            src="/ScetLogo1.png" 
            alt="SCET Logo" 
            className="w-24 md:w-32 lg:w-40 object-contain" 
          />
        </div>

        {/* SURYODAYA COLLEGE OF ENGINEERING AND TECHNOLOGY */}
        <motion.h1
          initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          style={{ fontFamily: "'Cinzel', serif" }}
          className="text-3xl md:text-5xl lg:text-6xl font-bold text-[#FDF8E1] drop-shadow-[0_0_15px_rgba(253,248,225,0.4)] mb-6 max-w-5xl leading-tight text-center"
        >
          SURYODAYA COLLEGE OF ENGINEERING AND TECHNOLOGY
        </motion.h1>

        {/* Golden Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 1.2 }}
          className="w-48 md:w-64 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-8"
        />

        {/* Typewriter subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          style={{ fontFamily: "'Great Vibes', cursive" }}
          className="text-4xl md:text-6xl lg:text-7xl text-[#FFF3CD] drop-shadow-[0_0_10px_rgba(255,243,205,0.3)] mb-12 text-center"
        >
          {SUBTITLE.slice(0, typedCount)}
          {phase === "typing" && isTypingStarted && <span className="cursor-blink" />}
        </motion.div>

        {/* PRESENTS */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(8px)", y: 10 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 2, ease: "easeInOut", delay: 4.5 }}
          style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.4em" }}
          className="text-lg md:text-2xl font-semibold text-[#D4AF37] drop-shadow-[0_0_12px_rgba(212,175,55,0.5)] uppercase"
        >
          PRESENTS
        </motion.div>

        {/* "Click anywhere to Enter" prompt */}
        <AnimatePresence>
          {showPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                position: "absolute",
                bottom: "50px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(11px, 1.4vw, 13px)",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(181,181,181,0.5)",
              }}
            >
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                CLICK ANYWHERE TO CONTINUE
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
