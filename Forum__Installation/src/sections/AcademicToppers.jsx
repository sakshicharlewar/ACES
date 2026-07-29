import { motion } from "framer-motion";
import { Star, Trophy } from "lucide-react";

const toppersData = [
  {
    id: 1,
    rank: 1,
    name: "Tushar Nimje",
    branch: "Computer Engineering",
    cgpa: "9.85",
    achievement: "All Rounder Award",
    image: "/toppers/tushar.jpeg",
  },
  {
    id: 2,
    rank: 2,
    name: "Harshit Bhandarkar",
    branch: "Computer Engineering",
    cgpa: "9.72",
    achievement: "Best Project Award",
    image: "/toppers/harshit.jpeg",
  },
  {
    id: 3,
    rank: 3,
    name: "Hitanshu Deshmukh",
    branch: "Computer Engineering",
    cgpa: "9.68",
    achievement: "Excellence in Academics",
    image: "/toppers/hitanshu.jpeg",
  },
];

const thirdYearToppersData = [
  {
    id: 4,
    rank: 1,
    name: "Rajiv Ramteke",
    branch: "Computer Engineering",
    cgpa: "8.74",
    image: "/toppers/rajiv.jpeg",
  },
  {
    id: 5,
    rank: 2,
    name: "Mayuri Lanjewar",
    branch: "Computer Engineering",
    cgpa: "8.64",
    image: "/toppers/mayuri.jpeg",
  },
  {
    id: 6,
    rank: 3,
    name: "Parag Yeole",
    branch: "Computer Engineering",
    cgpa: "8.53",
    image: "/toppers/parag.jpeg",
  },
];

const secondYearToppersData = [
  {
    id: 7,
    rank: 1,
    name: "Aishwarya Dhole",
    branch: "Computer Engineering",
    cgpa: "9.12",
    scoreLabel: "CGPA",
    image: "/toppers/aishwarya.jpeg",
  },
  {
    id: 8,
    rank: 2,
    name: "Vaishnavi Yelne",
    branch: "Computer Engineering",
    cgpa: "8.77",
    scoreLabel: "CGPA",
    image: "/toppers/vaishnavi.jpeg",
  },
  {
    id: 9,
    rank: 3,
    name: "Sakshi Charlewar",
    branch: "Computer Engineering",
    cgpa: "8.75",
    scoreLabel: "CGPA",
    image: "/toppers/sakshi.png",
  },
];

function TopperCard({ topper }) {
  return (
    <div className="bg-[#121212] rounded-[18px] border border-[rgba(255,255,255,0.08)] shadow-[0_4px_30px_rgba(37,99,235,0.05)] hover:shadow-[0_4px_30px_rgba(37,99,235,0.15)] overflow-hidden flex flex-col h-full transition-all duration-300 group">
      <div className="relative overflow-hidden h-[340px]">
        <img
          src={topper.image}
          alt={topper.name}
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
              {topper.scoreLabel || "SGPA"}
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
  return (
    <section id="academic-toppers" className="py-24 px-6 md:px-12 lg:px-24 bg-[#000000] relative overflow-hidden">
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
            className="bg-[#111111] rounded-[18px] border border-[rgba(255,255,255,0.08)] p-6 lg:p-10"
          >
            {/* Small Subheading */}
            <div className="mb-6 border-b border-[rgba(255,255,255,0.08)] pb-4">
              <h3 className="font-sans text-xl font-semibold text-white">Final Year</h3>
            </div>

            {/* Final Year Topper Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {toppersData.map((topper) => (
                <TopperCard key={topper.id} topper={topper} />
              ))}
            </div>

            {/* 3rd Year Small Subheading */}
            <div className="mb-6 border-b border-[rgba(255,255,255,0.08)] pb-4">
              <h3 className="font-sans text-xl font-semibold text-white">3rd Year</h3>
            </div>

            {/* 3rd Year Topper Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {thirdYearToppersData.map((topper) => (
                <TopperCard key={topper.id} topper={topper} />
              ))}
            </div>

            {/* 2nd Year Small Subheading */}
            <div className="mb-6 border-b border-[rgba(255,255,255,0.08)] pb-4">
              <h3 className="font-sans text-xl font-semibold text-white">2nd Year</h3>
            </div>

            {/* 2nd Year Topper Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {secondYearToppersData.map((topper) => (
                <TopperCard key={topper.id} topper={topper} />
              ))}
            </div>

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
