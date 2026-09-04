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
  return (
    <div className="bg-[#121212] rounded-[18px] border border-[rgba(255,255,255,0.08)] shadow-[0_4px_30px_rgba(37,99,235,0.05)] hover:shadow-[0_4px_30px_rgba(37,99,235,0.15)] overflow-hidden flex flex-col h-full transition-all duration-300 group">
      <div className="relative overflow-hidden h-[340px]">
        <img
          src={topper.image}
          alt={topper.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
        />
        {/* Top Left Badge */}
        <div className="absolute top-4 left-4 bg-[#2563EB] text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-lg">
          Rank {topper.rank}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-sans text-2xl font-bold text-white mb-1">
          {topper.name}
        </h3>
        <p className="font-sans text-sm text-text-secondary mb-6">
          {topper.branch}
        </p>

        {/* Stats Box */}
        <div className="flex bg-[#0f172a] rounded-lg border border-[rgba(37,99,235,0.2)] mt-auto p-4">
          <div className="flex-1 flex flex-col items-center justify-center border-r border-[rgba(255,255,255,0.1)]">
            <span className="text-text-secondary text-xs uppercase tracking-wider mb-1">
              {topper.score_label || "CGPA"}
            </span>
            <span className="text-[#2563EB] font-bold text-xl">
              {topper.cgpa}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-text-secondary text-xs uppercase tracking-wider mb-1">
              Rank
            </span>
            <span className="text-white font-bold text-xl">
              {topper.rank}
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
          <h2 className="font-sans text-3xl md:text-5xl font-medium text-white mb-4">
            Semester Toppers
          </h2>
          <p className="font-cambria text-text-secondary text-lg max-w-2xl mx-auto">
            Celebrating the academic excellence of our brightest minds.
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
            className="bg-transparent rounded-[18px] border border-[rgba(255,255,255,0.08)] p-6 lg:p-10"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="text-white/50">Loading academic toppers...</p>
              </div>
            ) : (
              <>
                {finalYearToppers.length > 0 && (
                  <>
                    <div className="mb-6 border-b border-[rgba(255,255,255,0.08)] pb-4">
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
                    <div className="mb-6 border-b border-[rgba(255,255,255,0.08)] pb-4">
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
                    <div className="mb-6 border-b border-[rgba(255,255,255,0.08)] pb-4">
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
            <div className="w-full bg-[rgba(37,99,235,0.05)] border border-[rgba(37,99,235,0.2)] rounded-[18px] p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="bg-[#2563EB]/20 p-3 rounded-full flex-shrink-0">
                <Trophy className="w-8 h-8 text-[#2563EB]" />
              </div>
              <p className="font-sans text-text-secondary text-sm md:text-base leading-relaxed">
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
