import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { GlassCard } from "../components/ui/GlassCard";
import { Trophy, Code, Medal, BookOpen, Star, Award } from "lucide-react";

function Counter({ end, suffix = "+" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, end]);

  return (
    <span ref={ref} className="font-sans font-medium text-4xl md:text-5xl text-white">
      {count}{suffix}
    </span>
  );
}

const achievementCards = [
  { title: "Hackathon Winners", icon: <Code />, count: "Smart India Hackathon 2023 Finalists" },
  { title: "Coding Competitions", icon: <Trophy />, count: "Top Ranks in LeetCode & CodeChef" },
  { title: "Sports", icon: <Medal />, count: "University Level Gold Medalists" },
  { title: "Research Papers", icon: <BookOpen />, count: "Published in IEEE Journals" },
  { title: "Technical Events", icon: <Star />, count: "Organized 20+ State Level Events" },
  { title: "Certifications", icon: <Award />, count: "AWS, Azure & Google Cloud Certified" },
];

export function Achievements() {
  return (
    <section id="achievements" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="font-label text-accent uppercase tracking-widest text-sm mb-4">Milestones</div>
          <h2 className="font-sans text-3xl md:text-5xl font-medium">Achievements of Students</h2>
        </motion.div>

        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 max-w-4xl mx-auto">
          {[
            { label: "Events", value: 100 },
            { label: "Achievements", value: 50 },
            { label: "Hackathons", value: 30 },
            { label: "Students", value: 500 },
          ].map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <Counter end={stat.value} />
              <div className="font-label text-sm text-text-secondary mt-2 tracking-wide uppercase">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Achievement Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {achievementCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <GlassCard className="h-full flex items-start gap-4 p-6 transition-transform duration-300">
                <div className="p-3 bg-accent/10 text-accent rounded-xl">
                  {card.icon}
                </div>
                <div>
                  <h4 className="font-sans text-lg font-medium text-white mb-2">{card.title}</h4>
                  <p className="font-sans text-sm text-text-secondary">{card.count}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
