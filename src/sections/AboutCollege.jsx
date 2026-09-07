import { motion } from "framer-motion";
import { GlassCard } from "../components/ui/GlassCard";

export function AboutCollege() {
  return (
    <section id="about" className="relative min-h-screen py-24 px-6 md:px-12 lg:px-24 flex items-center">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Text on the left (order-1 on desktop) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="order-2 lg:order-1"
        >

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white font-sans">About </span>
            <span 
              className="text-amber-200 font-normal inline-block text-5xl md:text-6xl lg:text-7xl"
              style={{ fontFamily: "'Great Vibes', cursive", letterSpacing: "1px" }}
            >
              SCET
            </span>
          </h2>
          <div 
            className="text-2xl md:text-3xl lg:text-4xl font-normal mb-8 text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-neutral-100 to-amber-200"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Excellence in Engineering Education
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.6 }}
            className="space-y-4"
          >
            <p className="font-sans text-neutral-300 text-base md:text-lg leading-relaxed font-normal">
              Established in <span className="text-amber-200 font-semibold font-mono">2010</span>, <span className="text-white font-semibold">Suryodaya College of Engineering &amp; Technology (SCET)</span> is a premier <span className="text-white font-semibold px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">NAAC A+ Accredited</span> institution offering UG, PG, and NBA-accredited Diploma programs in Nagpur.
            </p>
            <p className="font-sans text-neutral-300 text-base md:text-lg leading-relaxed font-normal">
              With advanced centers like <span className="text-amber-100 font-semibold">CSED</span> (partnered with <span className="text-white font-medium">Dassault Systèmes, PTC, Ansys</span>), SCET bridges academia with industry to foster <span className="text-white font-medium italic font-serif" style={{ fontFamily: "'Cormorant Garamond', serif" }}>innovation, leadership, and technical excellence</span>.
            </p>
          </motion.div>
        </motion.div>

        {/* Image on the right (order-2 on desktop) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="order-1 lg:order-2"
        >
          <GlassCard className="aspect-[4/3] flex items-center justify-center relative overflow-hidden group p-0 border-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent mix-blend-overlay z-10 pointer-events-none" />
            <img 
              src="/Scet_Image.jpeg" 
              alt="SCET Campus" 
              className="object-cover w-full h-full scale-100 group-hover:scale-105 transition-transform duration-[2s] ease-out"
            />
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
