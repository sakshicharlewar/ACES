import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { RevealText } from "../components/ui/RevealText";
import { MagneticButton } from "../components/ui/MagneticButton";

export function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]);
  const scale = useTransform(scrollY, [0, 1000], [1, 1.1]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden w-full">
      {/* Background with Parallax */}
      <motion.div
        style={{ y, scale }}
        className="absolute inset-0 z-0 bg-transparent"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      </motion.div>

      {/* Content — same container as original */}
      <div className="relative z-10 container mx-auto px-6 text-center flex flex-col items-center">

        {/* WELCOME TO — Space Grotesk Medium, same size & tracking as original */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-3xl md:text-5xl lg:text-5xl uppercase text-text-secondary mb-6"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 500,
            letterSpacing: "0.3em",
          }}
        >
          Welcome To
        </motion.div>

        {/* Association of Computer Engineering Students — Sora ExtraBold */}
        <RevealText
          text="Association of Computer Engineering Students"
          delay={0.8}
          className="text-5xl md:text-7xl lg:text-[5.5rem] font-normal leading-tight max-w-[90%] mx-auto mb-4"
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 800,
          }}
        />

        {/* (ACES) — Cormorant Garamond Italic, same gradient & size as original */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white mb-8 drop-shadow-lg"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 500,
          }}
        >
          (ACES)
        </motion.div>

        {/* College name + autonomous — Manrope Medium, same layout as original */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="flex flex-col items-center mb-12 max-w-4xl mx-auto"
        >
          <span
            className="text-text-secondary text-xl md:text-2xl lg:text-3xl"
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 500,
            }}
          >
            Suryodaya College of Engineering &amp; Technology
          </span>
          <span
            className="text-text-secondary/60 text-sm md:text-base lg:text-lg tracking-widest uppercase mt-2"
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 400,
            }}
          >
            An Autonomous Institute
          </span>
        </motion.div>

        {/* Explore button — MagneticButton, identical to original */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2 }}
        >
          <MagneticButton
            className="px-10 py-4 text-base"
            onClick={() => {
              const el = document.getElementById("collegelogo");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Explore <ChevronDown className="w-4 h-4 ml-2" />
          </MagneticButton>
        </motion.div>
      </div>

      {/* Scroll Indicator — identical to original */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-[1px] h-12 bg-gradient-to-b from-text-secondary to-transparent"
        />
      </motion.div>
    </section>
  );
}
