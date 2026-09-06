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
      className="bg-[#111317]/85 backdrop-blur-xl rounded-[24px] border border-white/10 hover:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col transition-all duration-300 group"
    >
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={topper.image}
          alt={topper.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Top Left Badge */}
        <div className="absolute top-4 left-4 bg-white/95 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-md uppercase tracking-wider">
          Rank {topper.rank}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-sans text-xl font-bold text-white mb-1">
          {topper.name}
        </h3>
        <p className="font-sans text-sm text-[#94A3B8] mb-5">
          {topper.branch}
        </p>

        {/* Stats Box */}
        <div className="flex bg-[#15181E]/90 rounded-xl border border-white/10 mb-5 p-3.5">
          <div className="flex-1 flex flex-col items-center justify-center border-r border-white/10">
            <span className="text-gray-400 text-[11px] uppercase tracking-wider mb-1">
              CGPA
            </span>
            <span className="text-white font-bold text-lg">
              {topper.cgpa}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-gray-400 text-[11px] uppercase tracking-wider mb-1">
              Rank
            </span>
            <span className="text-white font-bold text-lg">
              {topper.rank}
            </span>
          </div>
        </div>

        {/* Bottom Badge */}
        <div className="mt-auto flex items-center justify-center gap-2 text-yellow-400/90 font-medium text-xs">
          <Star className="w-3.5 h-3.5 fill-current" />
          {topper.achievement}
        </div>
      </div>
    </div>
  );
}

export function SemesterToppers() {
  const [activeSemester, setActiveSemester] = useState(semesters[0]);

  return (
    <section className="py-24 px-6 md:px-12 lg:px-24 bg-transparent relative overflow-hidden">
      <div className="container mx-auto">
        {/* Top Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="font-label text-blue-400 uppercase tracking-widest text-xs mb-3 font-semibold">
            TOPPERS GALLERY
          </div>
          <h2 className="font-sans text-3xl md:text-5xl font-medium text-white mb-4">
            Semester Toppers
          </h2>
          <p className="font-cambria text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Celebrating the academic excellence of our brightest minds
          </p>
        </motion.div>

        {/* Semester Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2.5 mb-16 max-w-4xl mx-auto"
        >
          {semesters.map((semester) => (
            <button
              key={semester}
              onClick={() => setActiveSemester(semester)}
              className={cn(
                "px-5 py-2.5 rounded-full font-sans text-xs font-semibold tracking-wide transition-all duration-300 border",
                activeSemester === semester
                  ? "bg-white text-black border-white shadow-[0_4px_20px_rgba(255,255,255,0.12)]"
                  : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
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
            className="bg-[#111317]/60 backdrop-blur-xl rounded-[28px] border border-white/10 p-6 lg:p-10 shadow-2xl"
          >
            {/* Top Left: Graduation cap icon & Title */}
            <div className="flex flex-col items-start mb-10 border-b border-white/10 pb-6">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="w-8 h-8 text-white" />
                <h3 className="font-sans text-2xl md:text-3xl font-bold text-white">
                  {activeSemester} Toppers
                </h3>
              </div>
              <p className="font-sans text-[#94A3B8] ml-11 text-sm">
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
            <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="bg-white/10 p-3 rounded-full flex-shrink-0">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <p className="font-sans text-[#CBD5E1] text-sm md:text-base leading-relaxed">
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
