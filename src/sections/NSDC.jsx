import { motion } from "framer-motion";
import { GlassCard } from "../components/ui/GlassCard";
import { RevealText } from "../components/ui/RevealText";

export function NSDC() {
  return (
    <section id="nsdc-section" className="relative py-24 px-6 md:px-12 lg:px-24 flex items-center">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Text on the left */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="order-2 lg:order-1"
        >
          <div className="flex flex-wrap items-center gap-x-3 mb-6 justify-start">
            <RevealText 
              text="National Student" 
              className="text-4xl md:text-5xl font-serif italic text-white justify-start m-0"
            />
            <RevealText 
              text="Data Corps (NSDC)" 
              className="text-4xl md:text-5xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 justify-start m-0"
            />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.6 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-bold text-accent mb-2">What is NSDC?</h3>
              <p className="font-cambria text-text-secondary text-lg leading-relaxed font-light">
                NSDC stands for <span className="text-white font-medium">National Student Data Corps</span>. It is a student community that helps students learn <span className="text-blue-400 font-medium">data science, artificial intelligence, machine learning</span>, and related skills. The main aim of NSDC is to create a place where students can <span className="text-white font-medium">learn together, share ideas, work on projects,</span> and grow their technical skills.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-accent mb-2">Our College NSDC Chapter</h3>
              <p className="font-cambria text-text-secondary text-lg leading-relaxed font-light">
                Our college NSDC chapter was officially inaugurated on <span className="text-blue-400 font-medium">10th August</span>. This is an important step for our students because it opens a new platform for <span className="text-white font-medium">learning, teamwork, and innovation</span>. Through this chapter, we plan to organize <span className="text-blue-400 font-medium">workshops, hands-on sessions, guest talks</span>, and other activities that will help students from different branches learn new skills and work on <span className="text-white font-medium">real-world ideas</span>.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-accent mb-2">Faculty Nominee</h3>
              <p className="font-cambria text-text-secondary text-lg leading-relaxed font-light">
                <span className="text-blue-400 font-serif italic text-xl font-medium">Leena Ma’am</span> will serve as our faculty nominee and will guide and support the NSDC chapter. With her encouragement and our team's effort, we hope to build a strong and active NSDC community in our college.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Image on the right */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="order-1 lg:order-2"
        >
          <GlassCard className="flex items-center justify-center relative overflow-hidden group p-0 border-none rounded-2xl w-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent mix-blend-overlay z-10 pointer-events-none" />
            <img 
              src="/images/nsdc-chapter.jpeg" 
              alt="NSDC Inauguration" 
              className="object-cover w-full h-auto aspect-[4/3] scale-100 group-hover:scale-105 transition-transform duration-[2s] ease-out"
            />
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
