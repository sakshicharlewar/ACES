import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Trophy, Loader2 } from "lucide-react";
import { getBaseUrl } from "../lib/apiConfig";

const DEFAULT_TOPPERS = [
  { id: 1, year_group: "final_year", rank: 1, name: "Tushar Nimje", branch: "Computer Engineering", cgpa: "9.85", score_label: "CGPA", achievement: "All Rounder Award", image: "/toppers/tushar.jpeg" },
  { id: 2, year_group: "final_year", rank: 2, name: "Harshit Bhandarkar", branch: "Computer Engineering", cgpa: "9.72", score_label: "CGPA", achievement: "Best Project Award", image: "/toppers/harshit.jpeg" },
  { id: 3, year_group: "final_year", rank: 3, name: "Hitanshu Deshmukh", branch: "Computer Engineering", cgpa: "9.68", score_label: "CGPA", achievement: "Excellence in Academics", image: "/toppers/hitanshu.jpeg" },
  { id: 4, year_group: "third_year", rank: 1, name: "Rajiv Ramteke", branch: "Computer Engineering", cgpa: "8.74", score_label: "CGPA", achievement: "", image: "/toppers/rajiv.jpeg" },
  { id: 5, year_group: "third_year", rank: 2, name: "Mayuri Lanjewar", branch: "Computer Engineering", cgpa: "8.64", score_label: "CGPA", achievement: "", image: "/toppers/mayuri.jpeg" },
  { id: 6, year_group: "third_year", rank: 3, name: "Parag Yeole", branch: "Computer Engineering", cgpa: "8.53", score_label: "CGPA", achievement: "", image: "/toppers/parag.jpeg" },
  { id: 7, year_group: "second_year", rank: 1, name: "Aishwarya Dhole", branch: "Computer Engineering", cgpa: "9.12", score_label: "CGPA", achievement: "", image: "/toppers/aishwarya.jpeg" },
  { id: 8, year_group: "second_year", rank: 2, name: "Vaishnavi Yelne", branch: "Computer Engineering", cgpa: "8.77", score_label: "CGPA", achievement: "", image: "/toppers/vaishnavi.jpeg" },
  { id: 9, year_group: "second_year", rank: 3, name: "Sakshi Charlewar", branch: "Computer Engineering", cgpa: "8.75", score_label: "CGPA", achievement: "", image: "/toppers/sakshi.png" },
];

function TopperCard({ topper }) {
  const isRank1 = topper.rank === 1;
  const isRank2 = topper.rank === 2;
  const isRank3 = topper.rank === 3;

  return (
    <div className={`bg-[#111317]/85 backdrop-blur-xl rounded-[24px] border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)] ${isRank1 ? 'hover:border-amber-300/50 hover:shadow-[0_0_35px_rgba(251,191,36,0.25)]' : isRank2 ? 'hover:border-slate-300/40 hover:shadow-[0_0_30px_rgba(226,232,240,0.2)]' : 'hover:border-amber-700/50 hover:shadow-[0_0_30px_rgba(180,83,9,0.2)]'} overflow-hidden flex flex-col h-full transition-all duration-300 group`}>
      <div className="relative overflow-hidden h-[340px]">
        <img
          src={topper.image}
          alt={topper.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />
        {/* Top Left Badge */}
        <div className={`absolute top-4 left-4 text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1 ${
          isRank1 ? 'bg-gradient-to-r from-amber-300 to-yellow-500 text-black font-extrabold shadow-[0_0_15px_rgba(251,191,36,0.5)]' :
          isRank2 ? 'bg-gradient-to-r from-slate-200 to-neutral-300 text-black font-bold' :
          isRank3 ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold' :
          'bg-white text-black font-bold'
        }`}>
          <span>{isRank1 ? '👑' : isRank2 ? '🥈' : '🥉'}</span>
          <span>Rank {topper.rank}</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-sans text-2xl font-bold text-white mb-1">
          {topper.name}
        </h3>
        <p className="font-sans text-sm text-slate-400 mb-6">
          {topper.branch}
        </p>

        {/* Stats Box */}
        <div className="flex bg-[#090A0C]/90 rounded-2xl border border-white/10 mt-auto p-4">
          <div className="flex-1 flex flex-col items-center justify-center border-r border-white/10">
            <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">
              {topper.score_label || "CGPA"}
            </span>
            <span className="text-amber-200 font-bold text-xl font-mono">
              {topper.cgpa}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">
              Rank
            </span>
            <span className="text-white font-bold text-xl">
              #{topper.rank}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AcademicToppers() {
  const [toppers, setToppers] = useState(DEFAULT_TOPPERS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const baseUrl = getBaseUrl();
    fetch(`${baseUrl}/api/toppers`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setToppers(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch toppers:", err);
        setLoading(false);
      });
  }, []);

  const finalYearToppers = toppers.filter(t => t.year_group === "final_year");
  const thirdYearToppers = toppers.filter(t => t.year_group === "third_year");
  const secondYearToppers = toppers.filter(t => t.year_group === "second_year");

  return (
    <section id="academic-toppers" className="py-24 px-6 md:px-12 lg:px-24 bg-transparent relative overflow-hidden">
      <div className="container mx-auto">
        {/* Top Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            <span className="text-white font-sans">Academic </span>
            <span 
              className="text-amber-200 font-normal text-4xl md:text-6xl inline-block px-1"
              style={{ fontFamily: "'Great Vibes', cursive", letterSpacing: "1px" }}
            >
              Toppers
            </span>
          </h2>
          <p 
            className="text-amber-100/80 text-lg md:text-xl font-serif italic max-w-2xl mx-auto"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Celebrating the academic excellence and brilliant minds of Computer Engineering
          </p>
        </motion.div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto">
          {/* Large dark container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-transparent rounded-[28px] border border-white/10 p-6 lg:p-10"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white mb-4" />
                <p className="text-white/50">Loading academic toppers...</p>
              </div>
            ) : (
              <>
                {finalYearToppers.length > 0 && (
                  <>
                    <div className="mb-6 border-b border-white/10 pb-4">
                      <h3 className="font-sans text-xl font-semibold text-white">Final Year</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                      {finalYearToppers.map((topper) => (
                        <TopperCard key={topper.id} topper={topper} />
                      ))}
                    </div>
                  </>
                )}

                {thirdYearToppers.length > 0 && (
                  <>
                    <div className="mb-6 border-b border-white/10 pb-4">
                      <h3 className="font-sans text-xl font-semibold text-white">3rd Year</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                      {thirdYearToppers.map((topper) => (
                        <TopperCard key={topper.id} topper={topper} />
                      ))}
                    </div>
                  </>
                )}

                {secondYearToppers.length > 0 && (
                  <>
                    <div className="mb-6 border-b border-white/10 pb-4">
                      <h3 className="font-sans text-xl font-semibold text-white">2nd Year</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                      {secondYearToppers.map((topper) => (
                        <TopperCard key={topper.id} topper={topper} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Bottom Information Box */}
            <div className="w-full bg-[#111317]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full flex-shrink-0">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <p className="font-sans text-neutral-300 text-sm md:text-base leading-relaxed">
                These toppers have shown exceptional dedication, hard work, and consistency throughout their academic journey.
                <br className="hidden sm:block" />
                They are an inspiration to all students.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
