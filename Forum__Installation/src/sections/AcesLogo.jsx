import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";

export function AcesLogo() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen py-24 px-6 md:px-12 flex flex-col items-center justify-center overflow-hidden">
        {/* Ambient background glow (Matching SCET Logo but in Blue) */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_50%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)", scale: 0.7 }}
          whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative z-10 w-48 h-48 md:w-64 md:h-64 mb-16 group cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          {/* Continual floating bounce animation */}
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full relative"
          >
            {/* Soft blue glow around the circle */}
            <div className="absolute inset-0 rounded-full animate-glow opacity-60 pointer-events-none z-0 shadow-[0_0_50px_rgba(59,130,246,0.3)] transition-all duration-300 group-hover:shadow-[0_0_80px_rgba(59,130,246,0.6)]" />
            
            {/* Perfect circular frame */}
            <div className="w-full h-full rounded-full overflow-hidden bg-transparent flex items-center justify-center relative z-10 transition-all duration-300 group-hover:scale-[1.03]">
              <img 
                src="/Aces.jpeg" 
                alt="ACES Logo" 
                className="w-full h-full object-cover scale-[1.05]" 
              />
            </div>
          </motion.div>
        </motion.div>

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-sans text-3xl md:text-5xl font-medium mb-8"
          >
            About ACES
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
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
              className="p-8 md:p-12 relative overflow-hidden group"
            >
              <p className="font-cambria text-text-secondary text-lg md:text-xl font-light leading-relaxed">
                The Association of Computer Engineering Students (ACES) is the premier student 
                organization of the Computer Engineering department. We strive to bridge the gap 
                between academic learning and industry requirements. Through technical workshops, 
                hackathons, and seminars, we foster a culture of innovation, continuous learning, 
                and professional development among our members.
              </p>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Background elements */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-border to-transparent -translate-x-1/2 z-0" />
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
                src="/Aces.jpeg"
                className="max-h-[80vh] object-contain rounded-lg shadow-2xl"
                alt="ACES Logo Modal"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
