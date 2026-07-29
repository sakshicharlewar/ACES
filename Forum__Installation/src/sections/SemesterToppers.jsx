import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy, GraduationCap } from "lucide-react";
import { cn } from "../lib/utils";

const semesters = [
  "Final Year",
  "2nd Year",
  "7th Semester",
  "6th Semester",
  "5th Semester",
  "4th Semester",
  "3rd Semester",
  "2nd Semester",
  "1st Semester",
];

const semesterToppersData = {
  "Final Year": [
    {
      id: 1,
      rank: 1,
      name: "Rohan Desai",
      branch: "Computer Engineering",
      cgpa: "9.85",
      achievement: "All Rounder Award",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan",
    },
    {
      id: 2,
      rank: 2,
      name: "Sneha Patil",
      branch: "Computer Engineering",
      cgpa: "9.72",
      achievement: "Best Project Award",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha",
    },
    {
      id: 3,
      rank: 3,
      name: "Karan Mehta",
      branch: "Computer Engineering",
      cgpa: "9.65",
      achievement: "Excellence in Academics",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karan",
    },
  ],
  "7th Semester": [
    {
      id: 4,
      rank: 1,
      name: "Anjali Gupta",
      branch: "Computer Engineering",
      cgpa: "9.90",
      achievement: "Highest SCGPA",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali",
    },
    {
      id: 5,
      rank: 2,
      name: "Varun Iyer",
      branch: "Computer Engineering",
      cgpa: "9.75",
      achievement: "Consistent Performer",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Varun",
    },
    {
      id: 6,
      rank: 3,
      name: "Pooja Reddy",
      branch: "Computer Engineering",
      cgpa: "9.68",
      achievement: "Academic Star",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja",
    },
  ],
  "2nd Year": [
    {
      id: "2y-1",
      rank: 1,
      name: "Aishwarya Dhole",
      branch: "Computer Engineering",
      cgpa: "9.12",
      achievement: "Highest CGPA",
      image: "/Aishwarya_Dhole.jpeg",
    },
    {
      id: "2y-2",
      rank: 2,
      name: "Vaishnavi Yelne",
      branch: "Computer Engineering",
      cgpa: "8.77",
      achievement: "Outstanding Performance",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vaishnavi",
    },
    {
      id: "2y-3",
      rank: 3,
      name: "Sakshi Charlewar",
      branch: "Computer Engineering",
      cgpa: "8.75",
      achievement: "Excellence in Academics",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sakshi",
    },
  ],
  // We'll populate some dummy data for the rest or they can be empty for now.
};

semesters.slice(2).forEach((sem) => {
  if (!semesterToppersData[sem]) {
    semesterToppersData[sem] = [
      {
        id: sem + "-1",
        rank: 1,
        name: "Student A",
        branch: "Computer Engineering",
        cgpa: "9.78",
        achievement: "All Rounder Award",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=StdA" + sem,
      },
      {
        id: sem + "-2",
        rank: 2,
        name: "Student B",
        branch: "Computer Engineering",
        cgpa: "9.64",
        achievement: "Best Project Award",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=StdB" + sem,
      },
      {
        id: sem + "-3",
        rank: 3,
        name: "Student C",
        branch: "Computer Engineering",
        cgpa: "9.52",
        achievement: "Excellence in Academics",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=StdC" + sem,
      },
    ];
  }
});

function TopperCard({ topper }) {
  return (
    <div
      className="bg-[#171717] rounded-[18px] border border-[rgba(255,255,255,0.08)] shadow-[0_4px_30px_rgba(37,99,235,0.05)] hover:shadow-[0_4px_30px_rgba(37,99,235,0.15)] overflow-hidden flex flex-col transition-all duration-300 group"
    >
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={topper.image}
          alt={topper.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
        <div className="flex bg-[#0f172a] rounded-lg border border-[rgba(37,99,235,0.2)] mb-6 p-4">
          <div className="flex-1 flex flex-col items-center justify-center border-r border-[rgba(255,255,255,0.1)]">
            <span className="text-text-secondary text-xs uppercase tracking-wider mb-1">
              CGPA
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

        {/* Bottom Badge */}
        <div className="mt-auto flex items-center justify-center gap-2 text-yellow-500 font-medium text-sm">
          <Star className="w-4 h-4 fill-current" />
          {topper.achievement}
        </div>
      </div>
    </div>
  );
}

export function SemesterToppers() {
  const [activeSemester, setActiveSemester] = useState(semesters[0]);

  return (
    <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#000000] relative overflow-hidden">
      <div className="container mx-auto">
        {/* Top Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="font-label text-[#2563EB] uppercase tracking-widest text-sm mb-4 font-semibold">
            TOPPERS GALLERY
          </div>
          <h2 className="font-sans text-3xl md:text-5xl font-medium text-white mb-4">
            Semester Toppers
          </h2>
          <p className="font-cambria text-text-secondary text-lg max-w-2xl mx-auto">
            Celebrating the academic excellence of our brightest minds
          </p>
        </motion.div>

        {/* Semester Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-16 max-w-4xl mx-auto"
        >
          {semesters.map((semester) => (
            <button
              key={semester}
              onClick={() => setActiveSemester(semester)}
              className={cn(
                "px-5 py-2.5 rounded-full font-sans text-sm font-medium transition-all duration-300 border",
                activeSemester === semester
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "bg-[#181818] text-gray-400 border-transparent hover:border-[#2563EB] hover:text-white"
              )}
            >
              {semester}
            </button>
          ))}
        </motion.div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto">
          {/* Semester Card Large Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-[#111111] rounded-[18px] border border-[rgba(255,255,255,0.08)] p-6 lg:p-10"
          >
            {/* Top Left: Graduation cap icon & Title */}
            <div className="flex flex-col items-start mb-10 border-b border-[rgba(255,255,255,0.08)] pb-6">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="w-8 h-8 text-[#2563EB]" />
                <h3 className="font-sans text-3xl font-bold text-white">
                  {activeSemester} Toppers
                </h3>
              </div>
              <p className="font-sans text-text-secondary ml-11">
                Academic Year 2024–25
              </p>
            </div>

            {/* Topper Cards Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSemester}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
              >
                {(semesterToppersData[activeSemester] || []).map((topper) => (
                  <TopperCard key={topper.id} topper={topper} />
                ))}
              </motion.div>
            </AnimatePresence>

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
