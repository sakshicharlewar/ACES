import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { X } from "lucide-react";

export function CollegeLogo() {
  const containerRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.05, 1.08]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  return (
    <>
      <section id="collegelogo" ref={containerRef} className="h-[120vh] relative flex flex-col items-center justify-center">
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
          <motion.div style={{ scale, opacity }} className="relative z-10 flex flex-col items-center px-4">
            {/* ── SCET Logo Badge ── */}
            <div 
              className="relative group mb-5 cursor-pointer" 
              style={{ width: "190px", height: "190px" }}
              onClick={() => setIsModalOpen(true)}
            >
              {/* Main circle container */}
              <div
                style={{
                  width: "190px",
                  height: "190px",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 2,
                  transition: "transform 300ms ease",
                  padding: "6px",
                  aspectRatio: "1 / 1",
                }}
                className="group-hover:scale-[1.03] shadow-[0_0_35px_rgba(255,255,255,0.15)]"
              >
                {/* Inner Black Frame */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: "4px solid #000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    background: "#FFFFFF",
                  }}
                >
                  <img 
                    src="/ScetLogo1.png" 
                    alt="SCET Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                      transform: "scale(1.2)",
                    }}
                  />
                </div>
              </div>
            </div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-center px-4 max-w-2xl"
            >
              <span className="font-sans text-white text-xl sm:text-2xl md:text-3xl font-bold tracking-wide block">
                Suryodaya College of
              </span>
              <span 
                className="text-2xl sm:text-3xl md:text-4xl font-normal text-amber-200 mt-1 inline-block"
                style={{ fontFamily: "'Great Vibes', cursive", letterSpacing: "1px" }}
              >
                Engineering &amp; Technology
              </span>
              <span className="text-neutral-400 text-xs sm:text-sm font-mono block mt-1 tracking-wider uppercase font-medium">
                Nagpur • Autonomous
              </span>
            </motion.h2>
          </motion.div>
          
          {/* Ambient background glow */}
          <motion.div 
            style={{ opacity }}
            className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_50%)] pointer-events-none"
          />
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setIsModalOpen(false)}
          >
            <button
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>
            <div 
              className="relative w-full max-w-5xl aspect-video px-12 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                src="/ScetLogo1.png"
                className="max-h-[80vh] object-contain rounded-lg shadow-2xl"
                alt="SCET Logo Modal"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
