import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";

const events = [
  {
    id: 1,
    title: "REIMAGINE UI/UX Competition",
    date: "August 20, 2025",
    desc: "The Department of Computer Engineering, Suryodaya College of Engineering & Technology, organized the UI/UX Competition \"REIMAGINE\" under the ACES Forum on 20th August 2025 at MCA Seminar Hall for teams of two participants. A total of 40 teams (80participants) competed in preliminary and final rounds.",
    image: "/Reimagin.jpeg",
    gallery: []
  },
  {
    id: 2,
    title: "Debugging Competition",
    date: "July 15, 2025",
    desc: "The Department of Computer Engineering under Forum 'ACES' organized a Debugging Competition on 15th July 2025 at Room No. S-24 and S-30. The competition consisted of preliminary and final rounds for teams of three. A total of 60 teams (180 participants) participated.",
    image: "/Debugging.jpeg",
    gallery: [
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 3,
    title: "Logo Design Competition",
    date: "August 13, 2025",
    desc: "The Department of Computer Engineering, Suryodaya College of Engineering & Technology, organized a Logo Design Competition on 13th August 2025 at Lab-III. A total of 17 students participated and created logo designs for the ACES forum. The most creative and original design was selected as the official ACES logo.",
    image: "/LogoCompition.jpeg",
    gallery: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ]
  },
  {
    id: 4,
    title: "Face the Panel",
    date: "Upcoming Event",
    desc: "Face the Panel was a career-oriented mock interview event organized by the Department of Computer Engineering under the Students Forum. Participants experienced real interview scenarios, where faculty members assessed their communication, technical knowledge, confidence, and problem-solving skills. The event provided valuable feedback, helping students improve their interview performance, boost confidence, and prepare for placements and future professional opportunities.",
    image: "/FaceThePanel.jpeg",
    gallery: []
  },
  {
    id: 5,
    title: "Kite Making",
    date: "Upcoming Event",
    desc: "Kite Making and Flying Competition was a fun-filled event organized by the Department of Computer Engineering to encourage creativity, teamwork, and festive spirit. Students showcased their artistic skills by designing colorful kites and participated enthusiastically in the flying competition, making the event a memorable celebration of innovation, collaboration, and healthy competition.",
    image: "/KiteMaking.jpeg",
    gallery: []
  },
  {
    id: 6,
    title: "National Conference 2026",
    date: "February 3, 2026",
    desc: "National Conference 2026 was organized on 03 February 2026 to bring together academicians, researchers, industry experts, and students for knowledge sharing and research discussions. The event featured technical paper presentations, keynote sessions, and interactive discussions, promoting innovation, collaboration, and academic excellence across various disciplines.",
    image: "/NationalConference.jpeg",
    gallery: []
  },
  {
    id: 7,
    title: "International Conference 2026",
    date: "April 13, 2026",
    desc: "International Conference 2026 was organized on 13 April 2026 to provide a global platform for researchers, academicians, industry professionals, and students to share innovative research and emerging technologies. The conference featured keynote speeches, technical paper presentations, and interactive sessions, fostering international collaboration, knowledge exchange, and research excellence.",
    image: "/InternationalConference.jpeg",
    gallery: []
  }
];

const CARD_WIDTH = 476; // card width + gap
const VISIBLE_COUNT = 3;

export function CompletedEvents() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeGallery, setActiveGallery] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const dragStartX = useRef(0);
  const containerRef = useRef(null);
  const [maxScrollX, setMaxScrollX] = useState((events.length - 1) * CARD_WIDTH);

  // Compute the real max scroll so the last card aligns flush — no blank space
  useEffect(() => {
    const compute = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      // track = 96px left-pad + N*428px cards + (N-1)*32px gaps + 96px right-pad
      const trackWidth = 96 + events.length * 428 + (events.length - 1) * 32 + 96;
      const computed = Math.max(0, trackWidth - containerWidth);
      setMaxScrollX(computed);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const maxIndex = events.length - 1;

  const prev = () => setCurrentIndex(i => Math.max(i - 1, 0));
  const next = () => setCurrentIndex(i => Math.min(i + 1, maxIndex));

  const openGallery = (event) => {
    setActiveGallery(event);
    setCurrentImgIndex(0);
  };

  // Clamp scroll so we never show blank space past the last card
  const scrollX = Math.min(currentIndex * CARD_WIDTH, maxScrollX);
  const progressPercent = maxIndex > 0 ? (currentIndex / maxIndex) * 100 : 0;

  return (
    <>
      <section id="gallery" className="py-24 bg-background" style={{ overflowX: "hidden", overflowY: "visible" }}>
        <div className="text-center mb-16 px-6">
          <h2 className="font-sans text-3xl md:text-5xl font-medium">Departmental Events</h2>
        </div>

        {/* Timeline progress bar */}
        <div className="relative w-full h-[2px] bg-border mb-12 px-24">
          <motion.div
            className="h-full bg-accent relative"
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_#3B82F6]" />
          </motion.div>
        </div>

        {/* Carousel */}
        <div ref={containerRef} className="relative w-full" style={{ overflow: "visible", paddingTop: "40px", paddingBottom: "40px" }}>
          <motion.div
            className="flex gap-8 px-24"
            animate={{ x: -scrollX }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            drag="x"
            dragConstraints={{ left: -maxScrollX, right: 0 }}
            dragElastic={0.05}
            onDragStart={(_, info) => { dragStartX.current = info.point.x; }}
            onDragEnd={(_, info) => {
              const diff = dragStartX.current - info.point.x;
              if (diff > 60) next();
              else if (diff < -60) prev();
            }}
            style={{ cursor: "grab" }}
            whileTap={{ cursor: "grabbing" }}
          >
            {events.map((event, index) => (
              <div key={event.id} className="w-[428px] shrink-0 relative z-10">
                <GlassCard
                  className={`p-6 group flex flex-col h-[620px] ${index % 2 === 0 ? '-translate-y-8' : 'translate-y-8'} transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:border-accent/40`}
                >
                  <div className="overflow-hidden rounded-xl mb-6 relative h-[380px] w-full shrink-0 bg-black/40">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-contain object-center transition-transform duration-500 p-2"
                    />
                  </div>
                  <div className="px-2 flex flex-col flex-1">
                    <div className="font-label text-xs text-accent mb-2 uppercase tracking-wider">{event.date}</div>
                    <h4 className="font-sans text-xl font-bold text-white mb-3 group-hover:text-accent transition-colors">{event.title}</h4>
                    <p className="font-cambria text-sm text-text-secondary line-clamp-2 flex-1">{event.desc}</p>
                  </div>
                </GlassCard>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={prev}
            disabled={currentIndex === 0}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-accent/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="font-label text-sm text-text-secondary">
            {currentIndex + 1} / {events.length}
          </span>
          <button
            onClick={next}
            disabled={currentIndex === maxIndex}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-accent/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Lightbox Gallery */}
      {activeGallery && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center">
          <button
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
            onClick={() => setActiveGallery(null)}
          >
            <X className="w-8 h-8" />
          </button>

          <div className="relative w-full max-w-5xl aspect-video px-12 flex items-center justify-center">
            <button
              className="absolute left-4 p-4 text-white/50 hover:text-white transition-colors"
              onClick={() => setCurrentImgIndex(prev => prev === 0 ? activeGallery.gallery.length - 1 : prev - 1)}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <motion.img
              key={currentImgIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              src={activeGallery.gallery[currentImgIndex]}
              className="max-h-[80vh] object-contain rounded-lg shadow-2xl"
              alt="Gallery"
            />

            <button
              className="absolute right-4 p-4 text-white/50 hover:text-white transition-colors"
              onClick={() => setCurrentImgIndex(prev => prev === activeGallery.gallery.length - 1 ? 0 : prev + 1)}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
