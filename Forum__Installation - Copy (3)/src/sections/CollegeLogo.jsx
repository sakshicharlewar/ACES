import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";

export function CollegeLogo() {
  const containerRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.2, 1.5]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <>
      <section id="collegelogo" ref={containerRef} className="h-[150vh] relative flex flex-col items-center justify-center">
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
          <motion.div style={{ scale, opacity }} className="relative z-10 flex flex-col items-center">
            {/* ── SCET Logo Badge ── */}
            <div 
              className="relative group mb-12 cursor-pointer" 
              style={{ width: "256px", height: "256px" }}
              onClick={() => setIsModalOpen(true)}
            >
              {/* Layer 4 — Main circle container */}
              <div
                style={{
                  width: "256px",
                  height: "256px",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 2,
                  transition: "transform 300ms ease",
                  padding: "8px", /* This acts as the outer white circular background */
                  aspectRatio: "1 / 1",
                }}
                className="group-hover:scale-[1.03]"
              >
                {/* Inner Black Frame */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: "6px solid #000000",
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
                      transform: "scale(1.25)", /* Enlarge logo by 25% */
                    }}
                  />
                </div>
              </div>
            </div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="font-sans text-2xl md:text-4xl lg:text-5xl font-medium tracking-wide text-center px-4"
            >
              Suryodaya College of
              <br/>
              <span className="font-serif italic text-text-secondary">Engineering & Technology</span>
            </motion.h2>
          </motion.div>
          
          {/* Ambient background glow */}
          <motion.div 
            style={{ opacity }}
            className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_50%)]"
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
