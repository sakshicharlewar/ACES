import { motion } from "framer-motion";
import { GlassCard } from "../components/ui/GlassCard";
import { RevealText } from "../components/ui/RevealText";

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

          <h2 className="font-sans text-5xl md:text-6xl lg:text-7xl font-medium mb-4">
            About SCET
          </h2>
          <RevealText 
            text="Excellence in Engineering Education"
            className="text-4xl md:text-5xl lg:text-6xl font-serif italic font-medium mb-8 justify-start text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400"
            delay={0.6}
          />
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 1.0 }}
            className="space-y-5"
          >
            <p className="font-cambria text-text-secondary text-lg leading-relaxed font-light">
              Suryodaya College of Engineering & Technology, established in <span className="text-white font-medium">2010</span>, is a premier{" "}
              <span className="text-blue-400 font-medium">NAAC A+ accredited</span> institution offering UG, PG, and Diploma programs in Engineering & Management. Our Diploma programs in Civil and Mechanical Engineering are further accredited by the <span className="text-white font-medium">NBA</span>.
            </p>
            <p className="font-cambria text-text-secondary text-lg leading-relaxed font-light">
              With its lush green campus and academically enriching environment, the institute provides students with an ideal atmosphere to learn, innovate, and grow. Our forward-thinking approach toward employability and entrepreneurship has earned recognition across the region.
            </p>
            <p className="font-cambria text-text-secondary text-lg leading-relaxed font-light">
              A major milestone is our <span className="text-blue-400 font-medium">Centre for Skill & Entrepreneurship Development (CSED)</span> — envisioned as <span className="text-white font-medium italic">"Industry Inside an Institute"</span>. Global technology partners include{" "}
              <span className="text-white font-medium">Dassault Systèmes, PTC, Ansys, Festo,</span> and <span className="text-white font-medium">Mastercam</span>, bridging academia with Industry 4.0.
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
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent mix-blend-overlay z-10" />
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
